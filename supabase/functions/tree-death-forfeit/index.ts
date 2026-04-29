// ═══════════════════════════════════════════════════════════════════
// CAUA Corporation — tree-death-forfeit Edge Function
// ───────────────────────────────────────────────────────────────────
// Marks a cacao tree as dead and burns the user's outstanding gameplay
// tokens for that tree.
//
// Triggered by the SPA when it detects death client-side (see
// src/pages/TreeDetail.tsx). Server-side validation is the source of
// truth: we re-check the death window on the backend so a tampered client
// can't burn a healthy tree.
//
// Contract:
//   POST /functions/v1/tree-death-forfeit
//   Authorization: Bearer <user JWT>
//   Body: { tree_id: string, reason?: string }
//
// Returns:
//   200 { ok: true, burned: { beans, mazorcas }, died_at }
//   200 { ok: true, already_dead: true }
//   400 { error } — bad input
//   401 { error } — auth
//   403 { error } — tree not owned by user
//   404 { error } — tree not found
//   422 { error } — tree not dead yet (server check disagrees with client)
//
// Death rules (mirror src/utils/growthSystem.ts):
//   1. > 9.6h since adoption (HARVEST_HOURS_THRESHOLD 4.6 + DEATH 5)
//   2. > 24h since last_update_at (NEGLECT_HOURS_LIMIT)
//
// Coinbase-onramp compliance: we don't custody funds. The user's adoption
// payment was deployed at adoption time (60/30/10). This function only
// touches gameplay tokens (beans + mazorcas). The burn is a negative
// token_events row — keeps the ledger auditable.
// ═══════════════════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// MUST mirror src/utils/growthSystem.ts. Keep both in sync if either
// constant is tuned later.
const HARVEST_HOURS_THRESHOLD     = 4.6
const DEATH_HOURS_AFTER_MATURITY  = 5
const NEGLECT_HOURS_LIMIT         = 24

const MS_PER_HOUR = 3600 * 1000

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  })
}

async function verifyAuth(authHeader: string | null): Promise<string> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header')
  }
  const token = authHeader.substring(7)
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) throw new Error('Invalid JWT token')
  return user.id
}

interface TreeRow {
  id: string
  user_id: string
  adopted_at: string
  last_update_at: string | null
  died_at: string | null
  harvested_at: string | null
}

function isDeadByRules(tree: TreeRow, nowMs: number): boolean {
  if (tree.harvested_at) return false
  // Rule 1: maturation window expired.
  const adoptedMs = new Date(tree.adopted_at).getTime()
  const deathDeadlineMs = adoptedMs + (HARVEST_HOURS_THRESHOLD + DEATH_HOURS_AFTER_MATURITY) * MS_PER_HOUR
  if (nowMs >= deathDeadlineMs) return true
  // Rule 2: 24h without any care.
  if (tree.last_update_at) {
    const lastCareMs = new Date(tree.last_update_at).getTime()
    if (nowMs - lastCareMs >= NEGLECT_HOURS_LIMIT * MS_PER_HOUR) return true
  }
  return false
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  try {
    if (req.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405)
    }

    const userId = await verifyAuth(req.headers.get('authorization'))
    const body = await req.json().catch(() => ({}))
    const treeId: string | undefined = body?.tree_id
    const reason: string = body?.reason ?? 'client_detected'

    if (!treeId || typeof treeId !== 'string') {
      return jsonResponse({ error: 'tree_id required' }, 400)
    }

    // Fetch tree.
    const { data: tree, error: fetchErr } = await supabase
      .from('cacao_trees')
      .select('id, user_id, adopted_at, last_update_at, died_at, harvested_at')
      .eq('id', treeId)
      .single<TreeRow>()

    if (fetchErr || !tree) {
      return jsonResponse({ error: 'Tree not found' }, 404)
    }
    if (tree.user_id !== userId) {
      return jsonResponse({ error: 'Tree not owned by user' }, 403)
    }
    if (tree.died_at) {
      return jsonResponse({ ok: true, already_dead: true, died_at: tree.died_at }, 200)
    }
    if (tree.harvested_at) {
      return jsonResponse({ error: 'Tree already harvested — cannot die' }, 422)
    }

    // Server-side death validation.
    const now = Date.now()
    if (!isDeadByRules(tree, now)) {
      return jsonResponse({
        error: 'Tree is not dead yet — server check disagrees with client',
      }, 422)
    }

    // Sum outstanding tokens for this tree.
    const { data: ledgerRow, error: ledgerErr } = await supabase
      .from('tree_token_ledger')
      .select('beans_total, mazorcas_total')
      .eq('tree_id', treeId)
      .single<{ beans_total: number; mazorcas_total: number }>()

    if (ledgerErr) {
      return jsonResponse({ error: 'Could not read tree ledger' }, 500)
    }

    const beansToBurn    = Math.max(0, Number(ledgerRow?.beans_total    ?? 0))
    const mazorcasToBurn = Math.max(0, Number(ledgerRow?.mazorcas_total ?? 0))

    // Burn = negative token_event. Idempotent via ref_id (`tree_id` itself).
    const { error: burnErr } = await supabase
      .from('token_events')
      .insert({
        user_id:    userId,
        event_type: 'tree_death_burn',
        beans:      -beansToBurn,
        mazorcas:   -mazorcasToBurn,
        ref_id:     treeId,
      })
    if (burnErr) {
      // If the insert collides on a unique-on-ref+type index (we don't have
      // one yet, but easy to add), treat as already-burned.
      return jsonResponse({ error: `Burn failed: ${burnErr.message}` }, 500)
    }

    // Mark the tree dead.
    const diedAt = new Date(now).toISOString()
    const { error: markErr } = await supabase
      .from('cacao_trees')
      .update({ died_at: diedAt })
      .eq('id', treeId)
      .eq('user_id', userId)

    if (markErr) {
      return jsonResponse({ error: `Mark dead failed: ${markErr.message}` }, 500)
    }

    return jsonResponse({
      ok: true,
      died_at: diedAt,
      burned: { beans: beansToBurn, mazorcas: mazorcasToBurn },
      reason,
    }, 200)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    const status = msg.includes('authorization') || msg.includes('JWT') ? 401 : 500
    return jsonResponse({ error: msg }, status)
  }
})
