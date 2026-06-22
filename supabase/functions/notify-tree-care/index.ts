// ═══════════════════════════════════════════════════════════════════
// CAUA Corporation — notify-tree-care
// ───────────────────────────────────────────────────────────────────
// Hourly cron-driven sweep that sends nurturing emails to adopters at
// critical tree state transitions:
//
//   - dead          → tree just died in the last 25h
//   - dying         → vitals_critical_since set ≥12h ago, not yet dead
//   - harvest_ready → past first maturity AND (no harvest or last
//                     harvest ≥5h ago)
//   - care_reminder → 30min..4h after adoption, only ever sent ONCE
//                     per tree (first-day onboarding nudge)
//
// Per-tree priority (highest first): dead > dying > harvest_ready >
// care_reminder. We compute the highest-priority eligible state and
// emit at most one email per tree per sweep.
//
// Dedupe: INSERT INTO tree_care_notifications ON CONFLICT DO NOTHING
// claims a "send slot" for (tree_id, notification_type, today). If the
// insert returns 0 rows we already sent today and skip. After a
// successful Resend POST we patch the row with resend_message_id.
//
// Per-user throttle: max 3 emails per user per UTC day. Group eligible
// trees by user_id, sort by priority, truncate.
//
// Auth: Bearer token must match ADMIN_BEARER_TOKEN. Mirrors the
// pattern in evaluate-tree-vitals/index.ts.
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY,
//      ADMIN_BEARER_TOKEN
// ═══════════════════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'
import {
  harvestReadyHTML,
  dyingHTML,
  deadHTML,
  careReminderHTML,
} from './templates.ts'

const supabaseUrl        = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const resendApiKey       = (Deno.env.get('RESEND_API_KEY') ?? '').trim()
const adminBearerToken   = Deno.env.get('ADMIN_BEARER_TOKEN') ?? ''

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: {
    headers: {
      Authorization: `Bearer ${supabaseServiceKey}`,
      apikey: supabaseServiceKey,
    },
  },
})

const FROM_NAME    = 'Amaury Amed · CAÚA'
const FROM_EMAIL   = 'amaury@cauaculture.co'
const REPLY_TO     = 'amaury@cauaculture.co'

// Mirror of src/utils/growthSystem.ts — keep in sync with the client
// constants. Phase 1.5 vital-based death + recurring harvest.
const HARVEST_HOURS_THRESHOLD = 4.6   // first maturity (h since adoption)
const HARVEST_INTERVAL_HOURS  = 5     // recurring cooldown between harvests
const VITAL_GRACE_HOURS       = 24    // sustained-criticality window
const DYING_WARN_HOURS        = 12    // warn at 12h critical (50% of grace)
const CARE_REMINDER_FROM_H    = 0.5   // 30min after adopt
const CARE_REMINDER_TO_H      = 4     // up to stage-3-ish

const MS_PER_HOUR             = 3_600_000
const PER_USER_DAILY_CAP      = 3

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

type NotificationType = 'dead' | 'dying' | 'harvest_ready' | 'care_reminder'

const PRIORITY: Record<NotificationType, number> = {
  dead:          0, // highest
  dying:         1,
  harvest_ready: 2,
  care_reminder: 3,
}

interface TreeRow {
  id: string
  user_id: string
  variety: string
  adopted_at: string
  harvested_at: string | null
  last_harvest_at: string | null
  died_at: string | null
  vitals_critical_since: string | null
}

interface ProfileRow {
  user_id: string
  email: string
  full_name: string | null
}

interface Candidate {
  tree: TreeRow
  profile: ProfileRow
  type: NotificationType
  hoursLeft?: number   // only for "dying"
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  })
}

// ─── State computation (priority order, return first match) ───────
function computeState(
  tree: TreeRow,
  now: number,
  hadCareReminder: boolean,
): { type: NotificationType; hoursLeft?: number } | null {
  const adoptedMs = new Date(tree.adopted_at).getTime()
  const hoursSinceAdoption = (now - adoptedMs) / MS_PER_HOUR

  // 1. dead — died in the last 25h (the cron runs hourly, so a 25h
  //    window guarantees we never miss a freshly-killed tree even on
  //    a missed run, and the unique-per-day index still dedupes).
  if (tree.died_at) {
    const diedMs = new Date(tree.died_at).getTime()
    if (now - diedMs <= 25 * MS_PER_HOUR) {
      return { type: 'dead' }
    }
    // Older death — already notified, do nothing.
    return null
  }

  // 2. dying — vitals_critical_since set, ≥12h elapsed.
  if (tree.vitals_critical_since) {
    const criticalMs = new Date(tree.vitals_critical_since).getTime()
    const elapsed = (now - criticalMs) / MS_PER_HOUR
    if (elapsed >= DYING_WARN_HOURS) {
      const hoursLeft = Math.max(0, VITAL_GRACE_HOURS - elapsed)
      return { type: 'dying', hoursLeft }
    }
  }

  // 3. harvest_ready — past first maturity AND (no last harvest OR
  //    ≥5h since last). last_harvest_at takes precedence over the
  //    legacy harvested_at column (mirrors growthSystem.isHarvestReady).
  if (hoursSinceAdoption >= HARVEST_HOURS_THRESHOLD) {
    const lastRaw = tree.last_harvest_at ?? tree.harvested_at
    if (!lastRaw) {
      return { type: 'harvest_ready' }
    }
    const lastMs = new Date(lastRaw).getTime()
    const sinceHarvest = (now - lastMs) / MS_PER_HOUR
    if (sinceHarvest >= HARVEST_INTERVAL_HOURS) {
      return { type: 'harvest_ready' }
    }
  }

  // 4. care_reminder — 30min..4h after adopt, never sent before.
  if (
    hoursSinceAdoption >= CARE_REMINDER_FROM_H &&
    hoursSinceAdoption < CARE_REMINDER_TO_H &&
    !hadCareReminder
  ) {
    return { type: 'care_reminder' }
  }

  return null
}

function renderEmail(c: Candidate): { subject: string; html: string } {
  const name = c.profile.full_name ?? ''
  switch (c.type) {
    case 'harvest_ready':
      return harvestReadyHTML(name, c.tree.id, c.tree.variety)
    case 'dying':
      return dyingHTML(name, c.tree.id, c.tree.variety, c.hoursLeft ?? 12)
    case 'dead':
      return deadHTML(name, c.tree.id, c.tree.variety)
    case 'care_reminder':
      return careReminderHTML(name, c.tree.id, c.tree.variety)
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405)
  }

  // Auth — only the cron may call us.
  const authHeader = req.headers.get('authorization') ?? ''
  if (!adminBearerToken) {
    return jsonResponse({ error: 'admin_bearer_token_not_configured' }, 503)
  }
  if (authHeader !== `Bearer ${adminBearerToken}`) {
    return jsonResponse({ error: 'unauthorized' }, 401)
  }
  if (!resendApiKey) {
    return jsonResponse({ error: 'resend_not_configured' }, 503)
  }

  try {
    const now = Date.now()
    const cutoff = new Date(now - 25 * MS_PER_HOUR).toISOString()

    // ─── Fetch trees: alive OR died-in-last-25h. ────────────────
    const { data: trees, error: fetchErr } = await supabase
      .from('cacao_trees')
      .select('id, user_id, variety, adopted_at, harvested_at, last_harvest_at, died_at, vitals_critical_since')
      .or(`died_at.is.null,died_at.gte.${cutoff}`)
      .returns<TreeRow[]>()

    if (fetchErr) throw fetchErr
    const treeRows = trees ?? []

    if (treeRows.length === 0) {
      return jsonResponse({ ok: true, processed: 0, sent: 0, skipped: 0, errors: [] })
    }

    // ─── Fetch profiles for those user_ids in one round-trip. ───
    const userIds = Array.from(new Set(treeRows.map(t => t.user_id)))
    const { data: profiles, error: profErr } = await supabase
      .from('user_profiles')
      .select('user_id, email, full_name')
      .in('user_id', userIds)
      .returns<ProfileRow[]>()
    if (profErr) throw profErr

    const profileByUser = new Map<string, ProfileRow>()
    for (const p of profiles ?? []) {
      if (p.email) profileByUser.set(p.user_id, p)
    }

    // ─── Fetch the set of tree_ids that already received a
    //     care_reminder ever (used to enforce "once-only").
    const { data: priorReminders, error: priorErr } = await supabase
      .from('tree_care_notifications')
      .select('tree_id')
      .eq('notification_type', 'care_reminder')
      .in('tree_id', treeRows.map(t => t.id))
      .returns<{ tree_id: string }[]>()
    if (priorErr) throw priorErr
    const careReminderSent = new Set((priorReminders ?? []).map(r => r.tree_id))

    // ─── Build candidate list. ───────────────────────────────────
    const candidates: Candidate[] = []
    for (const tree of treeRows) {
      const profile = profileByUser.get(tree.user_id)
      if (!profile) continue   // no email on file
      const state = computeState(tree, now, careReminderSent.has(tree.id))
      if (!state) continue
      candidates.push({ tree, profile, type: state.type, hoursLeft: state.hoursLeft })
    }

    const processed = candidates.length

    // ─── Per-user throttle: top 3 by priority. ──────────────────
    const byUser = new Map<string, Candidate[]>()
    for (const c of candidates) {
      const arr = byUser.get(c.tree.user_id) ?? []
      arr.push(c)
      byUser.set(c.tree.user_id, arr)
    }
    const final: Candidate[] = []
    for (const [, arr] of byUser) {
      arr.sort((a, b) => PRIORITY[a.type] - PRIORITY[b.type])
      final.push(...arr.slice(0, PER_USER_DAILY_CAP))
    }

    // ─── Send loop with INSERT-ON-CONFLICT dedupe. ──────────────
    let sent = 0
    let skipped = 0
    const errors: Array<{ tree_id: string; type: NotificationType; reason: string }> = []
    const outcomes: Array<{ tree_id: string; user_id: string; type: NotificationType; status: string }> = []

    const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
    let isFirstSend = true

    for (const c of final) {
      // Claim a send slot — unique-per-day index dedupes by
      // (tree_id, type, today). If a row already exists we skip.
      const { data: claim, error: claimErr } = await supabase
        .from('tree_care_notifications')
        .insert({
          tree_id: c.tree.id,
          user_id: c.tree.user_id,
          notification_type: c.type,
        })
        .select('id')
        .maybeSingle<{ id: string }>()

      if (claimErr) {
        // Postgres 23505 = unique_violation → already sent today.
        // PostgREST surfaces it as code "23505" inside the error.
        if ((claimErr as { code?: string }).code === '23505') {
          skipped++
          outcomes.push({ tree_id: c.tree.id, user_id: c.tree.user_id, type: c.type, status: 'dedup_skip' })
          continue
        }
        errors.push({ tree_id: c.tree.id, type: c.type, reason: `claim_failed: ${claimErr.message}` })
        continue
      }
      if (!claim) {
        skipped++
        outcomes.push({ tree_id: c.tree.id, user_id: c.tree.user_id, type: c.type, status: 'dedup_skip' })
        continue
      }

      // Throttle: Resend free plan = 5 req/sec. Sleep 220ms between
      // sends (≈4.5/sec, safety margin). Skip on first send.
      if (!isFirstSend) await sleep(220)
      isFirstSend = false

      // Send via Resend.
      const { subject, html } = renderEmail(c)
      let resendMessageId: string | null = null
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from:     `${FROM_NAME} <${FROM_EMAIL}>`,
            to:       c.profile.email,
            subject,
            html,
            reply_to: REPLY_TO,
          }),
        })
        const json = await res.json().catch(() => null) as { id?: string } | null
        if (!res.ok || !json?.id) {
          throw new Error(`resend_${res.status}: ${JSON.stringify(json)}`)
        }
        resendMessageId = json.id
        sent++
        outcomes.push({ tree_id: c.tree.id, user_id: c.tree.user_id, type: c.type, status: 'sent' })
      } catch (sendErr) {
        const msg = sendErr instanceof Error ? sendErr.message : 'unknown_send_error'
        errors.push({ tree_id: c.tree.id, type: c.type, reason: msg })
        // Roll back the claim so we retry on the next sweep.
        await supabase.from('tree_care_notifications').delete().eq('id', claim.id)
        outcomes.push({ tree_id: c.tree.id, user_id: c.tree.user_id, type: c.type, status: 'send_failed' })
        continue
      }

      // Patch resend_message_id (best-effort).
      if (resendMessageId) {
        const { error: patchErr } = await supabase
          .from('tree_care_notifications')
          .update({ resend_message_id: resendMessageId })
          .eq('id', claim.id)
        if (patchErr) console.error(`[notify-tree-care] patch resend_message_id failed for ${claim.id}:`, patchErr.message)
      }
    }

    // Structured logs for Supabase function logs.
    for (const o of outcomes) {
      console.log(JSON.stringify({ at: 'notify-tree-care', ...o }))
    }

    return jsonResponse({
      ok: true,
      processed,
      sent,
      skipped,
      errors,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown_error'
    console.error('[notify-tree-care] fatal:', msg)
    return jsonResponse({ error: msg }, 500)
  }
})
