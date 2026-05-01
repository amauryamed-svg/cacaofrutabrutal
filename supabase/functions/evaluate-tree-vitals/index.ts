// ═══════════════════════════════════════════════════════════════════
// CAUA Corporation — evaluate-tree-vitals
// ───────────────────────────────────────────────────────────────────
// Hourly cron-driven sweep that transitions tree state based on
// vitals (health, moisture, sunlight). Phase 1.5 of the Fruit-Ninja
// arc: replaces the legacy 5h-post-maturity timer-based death with
// vital-based death.
//
// Algorithm per tree (where died_at IS NULL):
//   - min_vital = least(health, moisture, sunlight)
//   - if min_vital >= VITAL_THRESHOLD:
//       reset vitals_critical_since = NULL (recovery)
//   - else if vitals_critical_since IS NULL:
//       vitals_critical_since = NOW()  (start of grace)
//   - else if (NOW - vitals_critical_since) >= VITAL_GRACE_HOURS:
//       died_at = NOW(); burn outstanding tokens.
//
// Auth: Bearer token must match ADMIN_BEARER_TOKEN. The cron migration
// 037c configures pg_cron to send this token on each call.
//
// CORS: not browser-callable; only the cron path. We still allow
// OPTIONS for tooling/testing.
// ═══════════════════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const supabaseUrl        = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const adminBearerToken   = Deno.env.get('ADMIN_BEARER_TOKEN') ?? ''

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

// MUST mirror src/utils/constants.ts. Tune in tandem.
const VITAL_THRESHOLD   = 30     // % below this on any single vital = critical
const VITAL_GRACE_HOURS = 24     // hours of sustained criticality before death

const MS_PER_HOUR = 3600_000

interface TreeVitalRow {
  id: string
  user_id: string
  guardian_id: number
  health: number | null
  moisture: number | null
  sunlight: number | null
  vitals_critical_since: string | null
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  })
}

function isCritical(t: TreeVitalRow): boolean {
  return (t.health   ?? 100) < VITAL_THRESHOLD
      || (t.moisture ?? 100) < VITAL_THRESHOLD
      || (t.sunlight ?? 100) < VITAL_THRESHOLD
}

async function killTree(tree: TreeVitalRow, reason: string) {
  // Sum outstanding tokens for this tree (uses the tree_token_ledger view).
  const { data: ledgerRow } = await supabase
    .from('tree_token_ledger')
    .select('beans_total, mazorcas_total')
    .eq('tree_id', tree.id)
    .single<{ beans_total: number; mazorcas_total: number }>()

  const beansToBurn    = Math.max(0, Number(ledgerRow?.beans_total    ?? 0))
  const mazorcasToBurn = Math.max(0, Number(ledgerRow?.mazorcas_total ?? 0))

  // Negative token_event — same path as tree-death-forfeit.
  if (beansToBurn > 0 || mazorcasToBurn > 0) {
    const { error: burnErr } = await supabase
      .from('token_events')
      .insert({
        user_id:    tree.user_id,
        event_type: 'tree_death_burn',
        beans:      -beansToBurn,
        mazorcas:   -mazorcasToBurn,
        ref_id:     tree.id,
      })
    if (burnErr) {
      console.error(`burn failed for tree ${tree.id}:`, burnErr)
      // Don't bail — still mark dead so the user sees the change.
    }
  }

  // Mark dead.
  const diedAt = new Date().toISOString()
  const { error: markErr } = await supabase
    .from('cacao_trees')
    .update({ died_at: diedAt })
    .eq('id', tree.id)

  if (markErr) {
    console.error(`mark dead failed for tree ${tree.id}:`, markErr)
    return null
  }

  return { tree_id: tree.id, user_id: tree.user_id, beans_burned: beansToBurn, mazorcas_burned: mazorcasToBurn, reason }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  try {
    if (req.method !== 'POST') {
      return jsonResponse({ error: 'method_not_allowed' }, 405)
    }

    // Auth: only the cron (with the admin bearer token) can call us.
    const authHeader = req.headers.get('authorization') ?? ''
    if (!adminBearerToken) {
      return jsonResponse({ error: 'admin_bearer_token_not_configured' }, 503)
    }
    if (authHeader !== `Bearer ${adminBearerToken}`) {
      return jsonResponse({ error: 'unauthorized' }, 401)
    }

    // Fetch all alive trees in one query. Should be small enough (≤10k) for
    // the Edge Function memory ceiling. If it grows, we'd batch.
    const { data: trees, error: fetchErr } = await supabase
      .from('cacao_trees')
      .select('id, user_id, guardian_id, health, moisture, sunlight, vitals_critical_since')
      .is('died_at', null)
      .returns<TreeVitalRow[]>()

    if (fetchErr) throw fetchErr

    const now    = Date.now()
    const stats  = { evaluated: 0, recovered: 0, newly_critical: 0, killed: 0 }
    const deaths: Array<{ tree_id: string; user_id: string; beans_burned: number; mazorcas_burned: number; reason: string }> = []

    for (const tree of trees ?? []) {
      stats.evaluated++
      const critical = isCritical(tree)

      if (!critical) {
        // Recovery path — clear the marker if it was set.
        if (tree.vitals_critical_since !== null) {
          await supabase
            .from('cacao_trees')
            .update({ vitals_critical_since: null })
            .eq('id', tree.id)
          stats.recovered++
        }
        continue
      }

      // Critical path.
      if (tree.vitals_critical_since === null) {
        // Mark the start of the grace window.
        await supabase
          .from('cacao_trees')
          .update({ vitals_critical_since: new Date().toISOString() })
          .eq('id', tree.id)
        stats.newly_critical++
        continue
      }

      // Already critical — check grace window.
      const sinceMs = new Date(tree.vitals_critical_since).getTime()
      const elapsedH = (now - sinceMs) / MS_PER_HOUR
      if (elapsedH >= VITAL_GRACE_HOURS) {
        const result = await killTree(tree, 'vitals_critical_grace_expired')
        if (result) {
          deaths.push(result)
          stats.killed++
        }
      }
    }

    return jsonResponse({ ok: true, stats, deaths })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown_error'
    return jsonResponse({ error: msg }, 500)
  }
})
