/**
 * cauabonga-plant-seed — atomic plant action for CauaBonga tiles.
 *
 * Flow:
 *   1. CORS preflight (memory feedback_edge_functions_cors.md).
 *   2. Verify Supabase JWT → user_id (memory feedback_supabase_jwt_no_jose.md).
 *   3. Validate body { planting_id, crop_slug, mode }.
 *   4. Look up planting row (server-authoritative; must be state='empty').
 *   5. Validate crop_slug ∈ MVP_CROPS, seedCost present, mode = 'regen' | 'traditional'.
 *   6. Anti-degeneracy: cap 5 plants per minute per user.
 *   7. Call apply_cauabonga_plant RPC — atomic decrement mazorcas + flip
 *      planting → growing + insert token_events (negative) + action_log row.
 *   8. Return JSON with new ready_at + new balance.
 *
 * Sister functions: cauabonga-care-action, claim-cauabonga-harvest.
 * Math source of truth: supabase/functions/_shared/cauabonga.ts (CB-006).
 */

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { CROPS, MVP_CROPS, type CropSlug } from '../_shared/cauabonga.ts'

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

interface PlantRequest {
  planting_id: string
  crop_slug:   string
  mode:        'regen' | 'traditional'
}

interface PlantingRow {
  id:        string
  plot_id:   string
  user_id:   string
  tile_idx:  number
  state:     string
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
    const body: PlantRequest = await req.json().catch(() => ({} as PlantRequest))

    if (!body.planting_id || typeof body.planting_id !== 'string') {
      return jsonResponse({ error: 'planting_id_required' }, 400)
    }
    if (!body.crop_slug || !(body.crop_slug in CROPS)) {
      return jsonResponse({ error: 'unknown_crop', crop_slug: body.crop_slug }, 400)
    }
    if (body.mode !== 'regen' && body.mode !== 'traditional') {
      return jsonResponse({ error: 'invalid_mode', mode: body.mode }, 400)
    }

    const cropSlug = body.crop_slug as CropSlug
    if (!MVP_CROPS.includes(cropSlug)) {
      return jsonResponse({ error: 'crop_not_in_mvp', crop_slug: cropSlug, allowed: MVP_CROPS }, 400)
    }

    const crop = CROPS[cropSlug]
    if (crop.seedCost == null) {
      return jsonResponse({ error: 'crop_drop_only', crop_slug: cropSlug }, 400)
    }

    // Server-authoritative planting lookup.
    const { data: planting, error: lookupErr } = await supabase
      .from('cauabonga_plantings')
      .select('id, plot_id, user_id, tile_idx, state')
      .eq('id', body.planting_id)
      .eq('user_id', userId)
      .maybeSingle<PlantingRow>()

    if (lookupErr) return jsonResponse({ error: 'planting_lookup_failed', detail: lookupErr.message }, 500)
    if (!planting)  return jsonResponse({ error: 'planting_not_found_or_unauthorized' }, 404)
    if (planting.state !== 'empty') {
      return jsonResponse({ error: 'tile_not_empty', state: planting.state }, 409)
    }

    // Anti-degeneracy: cap plant bursts.
    const lastMin = new Date(Date.now() - 60 * 1000).toISOString()
    const { count: recentBurst } = await supabase
      .from('cauabonga_action_log')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('action', 'plant')
      .gte('created_at', lastMin)
    if ((recentBurst ?? 0) >= 5) {
      return jsonResponse({ error: 'rate_limited' }, 429)
    }

    const clientMeta = {
      ip_hash: hashStr(req.headers.get('x-forwarded-for') ?? ''),
      ua_hash: hashStr(req.headers.get('user-agent') ?? ''),
    }

    const { data: rpcResult, error: rpcErr } = await supabase.rpc('apply_cauabonga_plant', {
      p_user_id:      userId,
      p_planting_id:  body.planting_id,
      p_crop_slug:    cropSlug,
      p_mode:         body.mode,
      p_seed_cost:    crop.seedCost,
      p_grow_minutes: crop.growMinutes,
      p_client_meta:  clientMeta,
    })

    if (rpcErr) {
      const msg = rpcErr.message ?? 'rpc_failed'
      if (msg.includes('insufficient_mazorcas')) {
        return jsonResponse({ error: 'insufficient_mazorcas', detail: msg }, 402)
      }
      if (msg.includes('planting_not_empty')) {
        return jsonResponse({ error: 'tile_not_empty', detail: msg }, 409)
      }
      return jsonResponse({ error: 'rpc_failed', detail: msg }, 500)
    }

    return jsonResponse({ ok: true, plant: rpcResult, crop: { slug: cropSlug, label: crop.label } }, 200)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown_error'
    if (msg === 'missing_or_invalid_auth' || msg === 'invalid_jwt') {
      return jsonResponse({ error: msg }, 401)
    }
    return jsonResponse({ error: 'internal_error', detail: msg }, 500)
  }
})
