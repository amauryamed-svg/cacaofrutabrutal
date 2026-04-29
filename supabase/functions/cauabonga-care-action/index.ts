/**
 * cauabonga-care-action — atomic care action (water/sun/nutrient/pruning).
 *
 * Flow:
 *   1. CORS preflight.
 *   2. Verify Supabase JWT → user_id.
 *   3. Validate body { planting_id, action }.
 *   4. Anti-degeneracy: cap 30 care actions/min/user.
 *   5. Look up cooldown_minutes from CARE_COOLDOWNS_MINUTES (cauabonga.ts).
 *   6. Compute soil_delta + growth_speedup based on action + mode (server-authoritative).
 *   7. Call apply_cauabonga_care RPC — atomic update.
 *   8. Award +0.5 beans (tree_update_read rate) with day-bucket dedup ref_id.
 *
 * Sister functions: cauabonga-plant-seed, claim-cauabonga-harvest.
 */

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { CARE_COOLDOWNS_MINUTES } from '../_shared/cauabonga.ts'

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

type CareAction = 'water' | 'sun' | 'nutrient' | 'pruning'

interface CareRequest {
  planting_id: string
  action:      CareAction
}

// Soil + speedup table per action × mode. Regen rewards skill; traditional is flat.
// Speedups expressed in seconds; soil deltas are clamped to 0..100 in the RPC.
const CARE_EFFECTS: Record<CareAction, { soilDelta: number; speedupSec: number }> = {
  water:    { soilDelta: 1, speedupSec: 120 },   // -2 min
  sun:      { soilDelta: 1, speedupSec: 120 },
  nutrient: { soilDelta: 4, speedupSec: 600 },   // -10 min, once per cycle
  pruning:  { soilDelta: 3, speedupSec: 600 },
}

function hashStr(s: string): string {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0
  return h.toString(16)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  try {
    if (req.method !== 'POST') {
      return jsonResponse({ error: 'method_not_allowed' }, 405)
    }

    const userId = await verifyAuth(req.headers.get('authorization'))
    const body: CareRequest = await req.json().catch(() => ({} as CareRequest))

    if (!body.planting_id || typeof body.planting_id !== 'string') {
      return jsonResponse({ error: 'planting_id_required' }, 400)
    }
    if (!body.action || !(body.action in CARE_EFFECTS)) {
      return jsonResponse({ error: 'invalid_action', action: body.action }, 400)
    }

    const action = body.action
    const cooldownMinutes = CARE_COOLDOWNS_MINUTES[action]
    const { soilDelta, speedupSec } = CARE_EFFECTS[action]

    // Anti-degeneracy: 30 care actions per minute is well above legitimate play.
    const lastMin = new Date(Date.now() - 60 * 1000).toISOString()
    const { count: recentBurst } = await supabase
      .from('cauabonga_action_log')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', lastMin)
    if ((recentBurst ?? 0) >= 30) {
      return jsonResponse({ error: 'rate_limited' }, 429)
    }

    const clientMeta = {
      ip_hash: hashStr(req.headers.get('x-forwarded-for') ?? ''),
      ua_hash: hashStr(req.headers.get('user-agent') ?? ''),
    }

    const { data: rpcResult, error: rpcErr } = await supabase.rpc('apply_cauabonga_care', {
      p_user_id:                userId,
      p_planting_id:            body.planting_id,
      p_action:                 action,
      p_cooldown_minutes:       cooldownMinutes,
      p_soil_delta:             soilDelta,
      p_growth_speedup_seconds: speedupSec,
      p_client_meta:            clientMeta,
    })

    if (rpcErr) {
      const msg = rpcErr.message ?? 'rpc_failed'
      if (msg.includes('cooldown_active') || msg.includes('cooldown_once_per_cycle')) {
        return jsonResponse({ error: 'cooldown_active', detail: msg }, 409)
      }
      if (msg.includes('planting_not_growing')) {
        return jsonResponse({ error: 'planting_not_growing', detail: msg }, 409)
      }
      if (msg.includes('planting_not_found_or_unauthorized')) {
        return jsonResponse({ error: 'planting_not_found_or_unauthorized' }, 404)
      }
      return jsonResponse({ error: 'rpc_failed', detail: msg }, 500)
    }

    // Beans faucet: +0.5 beans per (tile, action, day) — reuses tree_update_read rate
    // for parity with Phase A care faucet wiring. Best-effort; non-critical.
    try {
      const day = new Date().toISOString().slice(0, 10)
      const refId = `cauabonga_care:${body.planting_id}:${day}:${action}`
      const { data: existing } = await supabase
        .from('token_events')
        .select('id')
        .eq('user_id', userId)
        .eq('event_type', 'tree_update_read')
        .eq('ref_id', refId)
        .limit(1)
      if (!existing || existing.length === 0) {
        await supabase.from('token_events').insert({
          user_id: userId,
          event_type: 'tree_update_read',
          beans: 0.5,
          mazorcas: 0,
          ref_id: refId,
        })
        await supabase.rpc('increment_user_beans', { p_user_id: userId, p_delta: 0.5 }).then(
          () => {},
          async () => {
            // RPC may not exist; fall back to manual update.
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('beans_balance, beans_lifetime')
              .eq('user_id', userId)
              .single()
            if (profile) {
              await supabase.from('user_profiles').update({
                beans_balance: (profile.beans_balance || 0) + 0.5,
                beans_lifetime: (profile.beans_lifetime || 0) + 0.5,
              }).eq('user_id', userId)
            }
          },
        )
      }
    } catch { /* non-critical */ }

    return jsonResponse({ ok: true, care: rpcResult }, 200)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown_error'
    if (msg === 'missing_or_invalid_auth' || msg === 'invalid_jwt') {
      return jsonResponse({ error: msg }, 401)
    }
    return jsonResponse({ error: 'internal_error', detail: msg }, 500)
  }
})
