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

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  })
}

// Token earning rates. Some events also yield mucilage_g + cacao_mass_g
// (Phase 1 of the harvest minigame arc — see migration 037).
type Rate = {
  beans: number
  mazorcas: number
  mucilage_g?:   number
  cacao_mass_g?: number
}
const TOKEN_RATES: Record<string, Rate> = {
  ritual_draw: { beans: 0.5, mazorcas: 0 },
  streak_7: { beans: 3.5, mazorcas: 1 },
  streak_30: { beans: 15, mazorcas: 5 },
  purchase: { beans: 2, mazorcas: 0 }, // per USD
  lot: { beans: 5, mazorcas: 2 },
  blog_share: { beans: 1, mazorcas: 0 },
  blog_read: { beans: 0.2, mazorcas: 0 },
  referral: { beans: 10, mazorcas: 3 },
  tree_adoption: { beans: 10, mazorcas: 3 },
  tree_update_read: { beans: 0.5, mazorcas: 0 },
  // tree_harvest_share defaults preserved for the legacy "instant harvest"
  // path. The minigame path passes mucilage_g/cacao_mass_g overrides via the
  // request body for per-pod-sliced amounts (60g + 50g per pod by spec).
  tree_harvest_share: { beans: 5, mazorcas: 2 },
  // Phase 2.5 — Labranza machete regenerative bonus when slicing dead biomass.
  tree_compost_regen: { beans: 10, mazorcas: 0 },
}

async function verifyAuth(authHeader: string) {
  if (!authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header')
  }

  const token = authHeader.substring(7)
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) throw new Error('Invalid JWT token')
  return user.id
}

serve(async (req) => {
  // CORS preflight — the browser sends OPTIONS before any cross-origin POST.
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  try {
    if (req.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405)
    }

    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    const userId = await verifyAuth(authHeader)
    const body = await req.json() as {
      event_type?: string
      ref_id?: string
      amount?: number
      // Phase 1 — minigame harvest passes per-pod totals so the server doesn't
      // need to know how many pods the player sliced. Treated as ADDITIVE on
      // top of the rate's beans/mazorcas. Both default to 0 when absent.
      mucilage_g?:   number
      cacao_mass_g?: number
      // Optional override for beans/mazorcas — used by combo-bonus paths in
      // the harvest minigame. Server clamps to a sane max to prevent abuse.
      beans_override?:    number
      mazorcas_override?: number
    }
    const { event_type, ref_id, amount } = body

    if (!event_type || !TOKEN_RATES[event_type]) {
      return jsonResponse({ error: 'Invalid event type' }, 400)
    }

    let { beans, mazorcas } = TOKEN_RATES[event_type]

    // Scale by amount if it's a purchase
    if (event_type === 'purchase' && amount) {
      beans *= amount
    }

    // Phase 1.5 — recurring harvest with server-side cooldown enforcement.
    // Same tree can't be harvested more than once per HARVEST_INTERVAL_HOURS
    // even if the client-side guard fails (double-click, stale tab, etc.).
    const HARVEST_INTERVAL_HOURS = 5
    if (event_type === 'tree_harvest_share' && ref_id) {
      const { data: tree, error: treeErr } = await supabase
        .from('cacao_trees')
        .select('user_id, died_at, last_harvest_at, harvest_count')
        .eq('id', ref_id)
        .single<{ user_id: string; died_at: string | null; last_harvest_at: string | null; harvest_count: number | null }>()
      if (treeErr || !tree) {
        return jsonResponse({ error: 'tree_not_found' }, 404)
      }
      if (tree.user_id !== userId) {
        return jsonResponse({ error: 'tree_not_owned' }, 403)
      }
      if (tree.died_at) {
        return jsonResponse({ error: 'tree_dead' }, 422)
      }
      if (tree.last_harvest_at) {
        const lastMs = new Date(tree.last_harvest_at).getTime()
        const elapsedH = (Date.now() - lastMs) / 3600_000
        if (elapsedH < HARVEST_INTERVAL_HOURS) {
          return jsonResponse({
            error:          'harvest_cooldown',
            next_in_hours:  +(HARVEST_INTERVAL_HOURS - elapsedH).toFixed(2),
            last_harvest_at: tree.last_harvest_at,
          }, 429)
        }
      }
    }

    // Apply minigame overrides (clamped to 3× the baseline to cap abuse).
    if (event_type === 'tree_harvest_share') {
      if (typeof body.beans_override === 'number') {
        beans = Math.min(Math.max(0, body.beans_override), beans * 3)
      }
      if (typeof body.mazorcas_override === 'number') {
        mazorcas = Math.min(Math.max(0, body.mazorcas_override), mazorcas * 3)
      }
    }

    // Resource awards (mucilage + cacao_mass). Cap per call at a sane max to
    // prevent runaway insertions (e.g. server-side abuse). For the harvest
    // minigame, max ≈ 8 pods × 60g = 480g mucilage / 8 × 50g = 400g mass.
    const mucilage_g   = Math.max(0, Math.min(body.mucilage_g   ?? 0, 800))
    const cacao_mass_g = Math.max(0, Math.min(body.cacao_mass_g ?? 0, 800))

    // Insert token event (with per-event resource trace)
    const { error: eventError } = await supabase
      .from('token_events')
      .insert([{
        user_id: userId,
        event_type,
        beans,
        mazorcas,
        mucilage_g,
        cacao_mass_g,
        ref_id,
      }])

    if (eventError) throw eventError

    // Update user balance for beans + mazorcas
    const { data: profile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('beans_balance, mazorcas_balance, beans_lifetime, mucilage_g, cacao_mass_g')
      .eq('user_id', userId)
      .single()

    if (fetchError) throw fetchError

    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        beans_balance: (profile?.beans_balance || 0) + beans,
        mazorcas_balance: (profile?.mazorcas_balance || 0) + mazorcas,
        beans_lifetime: (profile?.beans_lifetime || 0) + beans,
      })
      .eq('user_id', userId)

    if (updateError) throw updateError

    // Atomically increment resources (mucilage_g + cacao_mass_g) via RPC.
    // We use the migration-defined helper so the increment is race-safe even
    // if multiple harvests fire concurrently.
    if (mucilage_g > 0 || cacao_mass_g > 0) {
      const { error: rpcErr } = await supabase.rpc('increment_resources_atomic', {
        p_user_id:    userId,
        p_mucilage:   mucilage_g,
        p_cacao_mass: cacao_mass_g,
      })
      if (rpcErr) throw rpcErr
    }

    // Phase 1.5 — on harvest success, advance the recurring-cycle markers on
    // cacao_trees. We bump harvest_count + set both last_harvest_at and (if
    // it's the first harvest) harvested_at for compat with legacy code.
    if (event_type === 'tree_harvest_share' && ref_id) {
      const nowIso = new Date().toISOString()
      const { data: cur } = await supabase
        .from('cacao_trees')
        .select('harvest_count, harvested_at')
        .eq('id', ref_id)
        .single<{ harvest_count: number | null; harvested_at: string | null }>()
      const nextCount = (cur?.harvest_count ?? 0) + 1
      await supabase
        .from('cacao_trees')
        .update({
          last_harvest_at: nowIso,
          harvest_count:   nextCount,
          // Set harvested_at only on the very first harvest (legacy compat).
          ...(cur?.harvested_at ? {} : { harvested_at: nowIso }),
        })
        .eq('id', ref_id)
        .eq('user_id', userId)
    }

    return jsonResponse({
      beans_awarded: beans,
      mazorcas_awarded: mazorcas,
      mucilage_awarded:    mucilage_g,
      cacao_mass_awarded:  cacao_mass_g,
      new_balance: {
        beans:        (profile?.beans_balance || 0) + beans,
        mazorcas:     (profile?.mazorcas_balance || 0) + mazorcas,
        mucilage_g:   (profile?.mucilage_g || 0) + mucilage_g,
        cacao_mass_g: (profile?.cacao_mass_g || 0) + cacao_mass_g,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return jsonResponse({ error: message }, 400)
  }
})
