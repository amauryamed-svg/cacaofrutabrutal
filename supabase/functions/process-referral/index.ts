import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const supabaseUrl        = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase           = createClient(supabaseUrl, supabaseServiceKey)

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  })
}

async function getUserId(authHeader: string): Promise<string> {
  if (!authHeader.startsWith('Bearer ')) throw new Error('missing_auth')
  const token = authHeader.slice(7)
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) throw new Error('invalid_jwt')
  return user.id
}

async function awardInline(userId: string, eventType: string, beans: number, mazorcas: number, refId: string) {
  await supabase.from('token_events').insert([{ user_id: userId, event_type: eventType, beans, mazorcas, ref_id: refId }])
  const { data: p } = await supabase
    .from('user_profiles')
    .select('beans_balance, mazorcas_balance, beans_lifetime')
    .eq('user_id', userId)
    .single()
  await supabase.from('user_profiles').update({
    beans_balance:    (p?.beans_balance    ?? 0) + beans,
    mazorcas_balance: (p?.mazorcas_balance ?? 0) + mazorcas,
    beans_lifetime:   (p?.beans_lifetime   ?? 0) + beans,
  }).eq('user_id', userId)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS })

  try {
    if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

    const authHeader = req.headers.get('authorization')
    if (!authHeader) return json({ error: 'unauthorized' }, 401)

    const referredId = await getUserId(authHeader)
    const { referrer_code } = await req.json() as { referrer_code?: string }
    if (!referrer_code) return json({ error: 'missing_referrer_code' }, 400)

    // Find referrer
    const { data: referrer } = await supabase
      .from('user_profiles')
      .select('user_id, referral_count')
      .eq('referral_code', referrer_code)
      .single()
    if (!referrer) return json({ error: 'referrer_not_found' }, 404)
    if (referrer.user_id === referredId) return json({ error: 'self_referral' }, 422)

    // Idempotency: skip if already referred
    const { data: referred } = await supabase
      .from('user_profiles')
      .select('referred_by_code')
      .eq('user_id', referredId)
      .single()
    if (referred?.referred_by_code) return json({ ok: true, already_processed: true })

    // Lock in referred_by_code first (prevents double-award on race)
    await supabase.from('user_profiles')
      .update({ referred_by_code: referrer_code })
      .eq('user_id', referredId)

    // Award referrer: 10 beans + 3 mazorcas
    await awardInline(referrer.user_id, 'referral', 10, 3, referredId)
    await supabase.from('user_profiles')
      .update({ referral_count: (referrer.referral_count ?? 0) + 1 })
      .eq('user_id', referrer.user_id)

    // Award referred: 5 beans + 1 mazorca (welcome bonus)
    await awardInline(referredId, 'referral_welcome', 5, 1, referrer_code)

    return json({ ok: true, beans_awarded_to_you: 5, beans_awarded_to_referrer: 10 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown_error'
    return json({ error: msg }, 400)
  }
})
