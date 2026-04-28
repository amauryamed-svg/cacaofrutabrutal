/**
 * claim-cauabonga-harvest — atomic harvest claim for CauaBonga plots.
 *
 * Flow (architecture.md §3 + §2.7):
 *   1. CORS preflight handling (per memory feedback_edge_functions_cors.md).
 *   2. Verify Supabase JWT → resolve user_id (per memory feedback_supabase_jwt_no_jose.md).
 *   3. Load planting + plot rows (server-authoritative).
 *   4. Validate state == 'ready' AND now() >= ready_at (server timer).
 *   5. Compute yield via cauabonga.computeYield (single source of truth, CB-006).
 *   6. Compute soil delta via cauabonga.computeSoilDelta.
 *   7. Enforce daily harvest cap (DAILY_CAPS.harvestCapMz).
 *   8. Call apply_cauabonga_harvest RPC — atomic Postgres tx that:
 *        a. locks planting (FOR UPDATE)
 *        b. inserts cauabonga_soil_history row
 *        c. flips planting → fallow
 *        d. inserts token_events row (event_type='cauabonga_harvest')
 *        e. increments user_profiles.mazorcas_balance
 *        f. inserts cauabonga_harvests audit row
 *   9. Append cauabonga_action_log row (action='harvest') for anti-degeneracy.
 *  10. Return JSON with harvest result.
 *
 * Anti-degeneracy controls (architecture.md §6):
 *   - Server-only timer check (no client-side trust)
 *   - Daily cap enforced before RPC
 *   - Action log entry for forensics
 *   - All RLS bypassed only via service_role; user_id forwarded into RPC for ownership check
 */

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import {
  computeYield,
  computeSoilDelta,
  CROPS,
  DAILY_CAPS,
  GUARDIAN_MODIFIERS,
  type CropSlug,
} from '../_shared/cauabonga.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  })
}

async function verifyAuth(authHeader: string | null): Promise<string> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('missing_or_invalid_auth')
  }
  const token = authHeader.substring(7)
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) throw new Error('invalid_jwt')
  return user.id
}

interface ClaimRequest {
  planting_id: string
}

interface PlantingRow {
  id:                  string
  plot_id:             string
  user_id:             string
  tile_idx:            number
  state:               string
  crop_slug:           string | null
  mode:                'regen' | 'traditional' | null
  ready_at:            string | null
  soil_health:         number
}

interface PlotRow {
  id:                string
  guardian_id:       number
  regen_streak_days: number
  total_harvests:    number
}

serve(async (req) => {
  // CORS preflight — browser sends OPTIONS before cross-origin POST.
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  try {
    if (req.method !== 'POST') {
      return jsonResponse({ error: 'method_not_allowed' }, 405)
    }

    // ── Auth
    const userId = await verifyAuth(req.headers.get('authorization'))

    // ── Body
    const body: ClaimRequest = await req.json().catch(() => ({} as ClaimRequest))
    const plantingId = body.planting_id
    if (!plantingId || typeof plantingId !== 'string') {
      return jsonResponse({ error: 'planting_id_required' }, 400)
    }

    // ── Load planting (server-authoritative; do NOT trust client state)
    const { data: planting, error: plantingErr } = await supabase
      .from('cauabonga_plantings')
      .select('id, plot_id, user_id, tile_idx, state, crop_slug, mode, ready_at, soil_health')
      .eq('id', plantingId)
      .eq('user_id', userId)
      .maybeSingle<PlantingRow>()

    if (plantingErr) return jsonResponse({ error: 'planting_lookup_failed', detail: plantingErr.message }, 500)
    if (!planting)   return jsonResponse({ error: 'planting_not_found_or_unauthorized' }, 404)

    // ── State + timer validation
    if (planting.state !== 'ready') {
      return jsonResponse({ error: 'planting_not_ready', state: planting.state }, 409)
    }
    if (!planting.ready_at || new Date(planting.ready_at).getTime() > Date.now()) {
      return jsonResponse({ error: 'timer_not_elapsed', ready_at: planting.ready_at }, 409)
    }
    if (!planting.crop_slug || !planting.mode) {
      return jsonResponse({ error: 'planting_missing_crop_or_mode' }, 409)
    }
    const cropSlug = planting.crop_slug as CropSlug
    if (!CROPS[cropSlug]) {
      return jsonResponse({ error: 'unknown_crop', crop_slug: cropSlug }, 409)
    }

    // ── Load plot (for guardian_id + regen_streak)
    const { data: plot, error: plotErr } = await supabase
      .from('cauabonga_plots')
      .select('id, guardian_id, regen_streak_days, total_harvests')
      .eq('id', planting.plot_id)
      .eq('user_id', userId)
      .maybeSingle<PlotRow>()

    if (plotErr || !plot) return jsonResponse({ error: 'plot_lookup_failed' }, 500)

    // ── Daily harvest cap (architecture §6 + economy §6)
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: recent, error: capErr } = await supabase
      .from('cauabonga_harvests')
      .select('yield_mz, harvested_at')
      .eq('user_id', userId)
      .gte('harvested_at', since)

    if (capErr) return jsonResponse({ error: 'cap_lookup_failed' }, 500)

    const earned24h = (recent ?? []).reduce((sum, r: { yield_mz: number }) => sum + Number(r.yield_mz), 0)
    if (earned24h >= DAILY_CAPS.harvestCapMz) {
      return jsonResponse({
        error: 'daily_harvest_cap_reached',
        cap_mz: DAILY_CAPS.harvestCapMz,
        earned_24h: earned24h,
      }, 429)
    }

    // ── Anti-degeneracy: check for grossly accelerated harvests in last 60s
    const lastMin = new Date(Date.now() - 60 * 1000).toISOString()
    const { count: recentBurst } = await supabase
      .from('cauabonga_action_log')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('action', 'harvest')
      .gte('created_at', lastMin)
    if ((recentBurst ?? 0) >= 5) {
      return jsonResponse({ error: 'rate_limited' }, 429)
    }

    // ── Compute yield (single source of truth — same module client renders)
    const guardianMod = GUARDIAN_MODIFIERS[plot.guardian_id]
    const regionalApplies = guardianMod?.kind === 'altitudePremium'   // always-on for Rafael
                         || (guardianMod?.kind === 'trazabilidadVerified'
                             && plot.regen_streak_days >= (guardianMod.params.requiredCareStreakDays ?? 7))
    // shadeCanopy / biodiversityStack require neighbor inspection — not done in MVP.

    const breakdown = computeYield({
      cropSlug,
      mode:               planting.mode,
      soilHealth:         planting.soil_health,
      companionBonusPct:  0,                    // MVP: no companion calc; v1.0 reads neighbors
      guardianId:         plot.guardian_id,
      harvestsInLast24h:  recent?.length ?? 0,
      streakBonusPct:     0,
      regionalModApplies: regionalApplies,
    })

    // Cycle number — total_harvests on this plot + 1.  For per-tile cycle_n we'd need
    // a per-tile harvest count; total_harvests across all tiles is acceptable for MVP audit.
    const cycleN = plot.total_harvests + 1

    // ── Soil delta
    const soilOut = computeSoilDelta({
      mode:                 planting.mode,
      hasAdjacentCompanion: false,              // MVP — no neighbor lookup
    })

    // ── Cap-respecting yield: clamp earned + this harvest to the cap
    const remainingCap = Math.max(0, DAILY_CAPS.harvestCapMz - earned24h)
    const finalYield = Math.min(breakdown.yieldMz, remainingCap)
    const cappedBreakdown = {
      ...breakdown,
      yield_mz:   finalYield,
      cycle_n:    cycleN,
      crop_slug:  cropSlug,
      mode:       planting.mode,
      base_yield: breakdown.baseYield,
      regen_mult: breakdown.regenMult,
      soil_mult:  breakdown.soilMult,
      companion_mult:    breakdown.companionMult,
      regional_mod:      breakdown.regionalMod,
      streak_bonus:      breakdown.streakBonus,
      diminishing_mult:  breakdown.diminishingMult,
    }

    // ── Atomic RPC — single Postgres transaction
    const { data: rpcResult, error: rpcErr } = await supabase.rpc('apply_cauabonga_harvest', {
      p_user_id:         userId,
      p_planting_id:     plantingId,
      p_yield_breakdown: cappedBreakdown,
      p_soil_delta:      soilOut.delta,
      p_soil_reason:     soilOut.reason,
    })

    if (rpcErr) {
      return jsonResponse({ error: 'rpc_failed', detail: rpcErr.message }, 500)
    }

    // ── Plot aggregate update (post-RPC, async best-effort; not in tx)
    await supabase
      .from('cauabonga_plots')
      .update({ total_harvests: plot.total_harvests + 1 })
      .eq('id', plot.id)

    // ── Action log (anti-degeneracy forensics)
    await supabase.from('cauabonga_action_log').insert({
      user_id:     userId,
      plot_id:     plot.id,
      planting_id: plantingId,
      action:      'harvest',
      client_meta: {
        ip_hash: hashIp(req.headers.get('x-forwarded-for') ?? ''),
        ua_hash: hashIp(req.headers.get('user-agent') ?? ''),
      },
    })

    return jsonResponse({
      ok: true,
      harvest: rpcResult,
      breakdown,
    }, 200)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown_error'
    if (msg === 'missing_or_invalid_auth' || msg === 'invalid_jwt') {
      return jsonResponse({ error: msg }, 401)
    }
    return jsonResponse({ error: 'internal_error', detail: msg }, 500)
  }
})

// Tiny non-cryptographic hash for IP/UA logging — we never need to reverse it,
// just to detect alt-account collisions in support reviews.
function hashIp(s: string): string {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0
  return h.toString(16)
}
