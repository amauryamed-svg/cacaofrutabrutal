// ═══════════════════════════════════════════════════════════════════
// CAUA Corporation — forge-chocolate
// ───────────────────────────────────────────────────────────────────
// Consumes mucilage_g + cacao_mass_g from the user's balance, mints a
// 'chocolate_made' token_event, increments user_profiles.chocolate_bars_made,
// and inserts a row in chocolate_forges.
//
// Atomicity: uses the public.consume_resources_atomic RPC defined in mig 037.
// If the user doesn't have enough resources, the RPC returns false and we
// 422 without side effects.
//
// Auth: standard user JWT.
//
// Body: { stage_completion?: { liofilizado_at?: string; refinado_at?: string; conchado_at?: string } }
//        Optional analytics — when each lab stage finished.
// Returns: { ok, beans_awarded, chocolate_bars_made_total, forge_id }
//
// Phase 4 will extend this to mint a RitualChocolateNFT on Base.
// ═══════════════════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const supabaseUrl        = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Mirror src/utils/constants.ts TOKEN_RATES.chocolate_made.
const RECIPE_MUCILAGE_G   = 300
const RECIPE_CACAO_MASS_G = 250
// Reward for a successful forge (small bonus — gameplay flavor, not the
// real value which lives in the NFT once Phase 4 lands).
const FORGE_BEANS_REWARD = 25

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

interface StageCompletion {
  liofilizado_at?: string
  refinado_at?:    string
  conchado_at?:    string
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
    const body = await req.json().catch(() => ({})) as {
      stage_completion?: StageCompletion
    }
    const stages = body.stage_completion ?? {}

    // 1. Atomic consume — bails 422 if balance is insufficient.
    const { data: consumed, error: rpcErr } = await supabase.rpc('consume_resources_atomic', {
      p_user_id:    userId,
      p_mucilage:   RECIPE_MUCILAGE_G,
      p_cacao_mass: RECIPE_CACAO_MASS_G,
    })
    if (rpcErr) throw rpcErr
    if (!consumed) {
      return jsonResponse({
        error: 'insufficient_resources',
        required: { mucilage_g: RECIPE_MUCILAGE_G, cacao_mass_g: RECIPE_CACAO_MASS_G },
      }, 422)
    }

    // 2. Insert token_event for ledger.
    const { error: eventErr } = await supabase
      .from('token_events')
      .insert({
        user_id:      userId,
        event_type:   'chocolate_made',
        beans:        FORGE_BEANS_REWARD,
        mazorcas:     0,
        mucilage_g:   -RECIPE_MUCILAGE_G,
        cacao_mass_g: -RECIPE_CACAO_MASS_G,
      })
    if (eventErr) {
      // Refund — the consume already happened.
      await supabase.rpc('increment_resources_atomic', {
        p_user_id:    userId,
        p_mucilage:   RECIPE_MUCILAGE_G,
        p_cacao_mass: RECIPE_CACAO_MASS_G,
      })
      throw eventErr
    }

    // 3. Bump user_profiles balance + chocolate counter.
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('beans_balance, beans_lifetime, chocolate_bars_made')
      .eq('user_id', userId)
      .single<{ beans_balance: number | null; beans_lifetime: number | null; chocolate_bars_made: number | null }>()
    const nextBeans   = (profile?.beans_balance      ?? 0) + FORGE_BEANS_REWARD
    const nextLife    = (profile?.beans_lifetime     ?? 0) + FORGE_BEANS_REWARD
    const nextBarsCnt = (profile?.chocolate_bars_made ?? 0) + 1
    const { error: updErr } = await supabase
      .from('user_profiles')
      .update({
        beans_balance:        nextBeans,
        beans_lifetime:       nextLife,
        chocolate_bars_made:  nextBarsCnt,
      })
      .eq('user_id', userId)
    if (updErr) throw updErr

    // 4. Insert chocolate_forges row for analytics + future NFT mint.
    const { data: forge } = await supabase
      .from('chocolate_forges')
      .insert({
        user_id:               userId,
        mucilage_consumed_g:   RECIPE_MUCILAGE_G,
        cacao_mass_consumed_g: RECIPE_CACAO_MASS_G,
        liofilizado_at:        stages.liofilizado_at ?? null,
        refinado_at:           stages.refinado_at ?? null,
        conchado_at:           stages.conchado_at ?? null,
      })
      .select('id')
      .single<{ id: string }>()

    return jsonResponse({
      ok:                          true,
      forge_id:                    forge?.id ?? null,
      beans_awarded:               FORGE_BEANS_REWARD,
      chocolate_bars_made_total:   nextBarsCnt,
      mucilage_consumed:           RECIPE_MUCILAGE_G,
      cacao_mass_consumed:         RECIPE_CACAO_MASS_G,
      new_balance: {
        beans:        nextBeans,
        chocolate_bars_made: nextBarsCnt,
      },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown_error'
    const status = msg.includes('authorization') || msg.includes('JWT') ? 401 : 500
    return jsonResponse({ error: msg }, status)
  }
})
