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

// $CACAO flywheel redemption rates — canonical source of truth
// 10 beans = $1 USD. Adoption (50 beans) covers the $5 tree price.
const BEANS_PER_USD = 10
const RATES: Record<string, { beans: number; label: string }> = {
  adoption:         { beans: 50,  label: 'Tree adoption ($5 USD)' },
  product_5usd:     { beans: 50,  label: 'Product $5 USD discount' },
  product_1usd:     { beans: 10,  label: 'Product $1 USD discount' },
  product_custom:   { beans: 0,   label: 'Custom amount' },  // caller sets beans amount
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST')   return json({ error: 'method_not_allowed' }, 405)

  const authHeader = req.headers.get('authorization') ?? ''
  if (!authHeader.startsWith('Bearer ')) return json({ error: 'missing_auth' }, 401)

  // Verify user JWT
  const { data: { user }, error: authErr } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  )
  if (authErr || !user) return json({ error: 'unauthorized' }, 401)

  let body: { item_type: string; beans_to_spend?: number; item_ref?: string }
  try { body = await req.json() } catch { return json({ error: 'invalid_json' }, 400) }

  const { item_type, item_ref } = body
  if (!item_type) return json({ error: 'item_type_required' }, 400)

  // Determine beans cost
  let beansCost: number
  if (item_type === 'product_custom') {
    beansCost = body.beans_to_spend ?? 0
    if (beansCost < BEANS_PER_USD) return json({ error: 'min_10_beans', min: BEANS_PER_USD }, 400)
  } else {
    const rate = RATES[item_type]
    if (!rate) return json({ error: 'unknown_item_type', valid: Object.keys(RATES) }, 400)
    beansCost = rate.beans
  }

  // Atomic balance check + decrement via RPC (single DB transaction)
  const { data, error: rpcErr } = await supabase.rpc('redeem_tokens', {
    p_user_id:   user.id,
    p_beans:     beansCost,
    p_item_type: item_type,
    p_item_ref:  item_ref ?? null,
  })

  if (rpcErr) return json({ error: 'rpc_error', detail: rpcErr.message }, 500)

  const result = data as { ok: boolean; error?: string; have?: number; need?: number; beans_spent?: number; new_balance?: number }

  if (!result.ok) {
    const status = result.error === 'insufficient_balance' ? 402 : 500
    return json({ ok: false, error: result.error, have: result.have, need: result.need }, status)
  }

  return json({
    ok:           true,
    beans_spent:  result.beans_spent,
    new_balance:  result.new_balance,
    usd_value:    (result.beans_spent ?? 0) / BEANS_PER_USD,
  })
})
