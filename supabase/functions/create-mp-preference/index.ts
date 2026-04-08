import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MP_BASE = 'https://api.mercadopago.com'
const CORS    = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  try {
    const { technology_id, mvp_id, lots_count = 1 } = await req.json()
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(jwt!)
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: CORS })

    const price = mvp_id
      ? await getMvpPrice(supabase, mvp_id)
      : await getLotPrice(supabase, technology_id)
    if (!price) return new Response(JSON.stringify({ error: 'Item not found' }), { status: 404, headers: CORS })

    const origin = req.headers.get('origin') ?? 'https://cacaofrutabrutal.com'
    const preference = await createPreference({ title: price.name, unit_price: price.cop / 100, quantity: lots_count }, origin)

    await supabase.from('orders').insert({
      user_id: user.id, product_id: technology_id, amount_cents: Math.round(price.cop / 100 * 0.00025 * lots_count),
      status: 'pending', technology_id, mvp_id: mvp_id ?? null,
      lots_count, currency: 'COP', payment_provider: 'mercadopago',
      mercadopago_preference_id: preference.id,
    })

    return new Response(JSON.stringify({ url: preference.init_point }), { headers: { ...CORS, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: CORS })
  }
})

async function createPreference(item: { title: string; unit_price: number; quantity: number }, origin: string) {
  const res = await fetch(`${MP_BASE}/checkout/preferences`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${Deno.env.get('MP_ACCESS_TOKEN')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [{ title: item.title, unit_price: item.unit_price, quantity: item.quantity, currency_id: 'COP' }],
      back_urls: { success: `${origin}/fund?status=success`, failure: `${origin}/fund?status=cancelled`, pending: `${origin}/fund?status=pending` },
      auto_return: 'approved',
    }),
  })
  return res.json()
}

async function getLotPrice(sb: ReturnType<typeof createClient>, tech_id: string) {
  const { data } = await sb.from('technologies').select('name,lot_price_cop').eq('id', tech_id).single()
  return data ? { name: data.name, cop: data.lot_price_cop } : null
}

async function getMvpPrice(sb: ReturnType<typeof createClient>, mvp_id: string) {
  const { data } = await sb.from('mvps').select('name,price_cop').eq('id', mvp_id).single()
  return data && data.price_cop ? { name: data.name, cop: data.price_cop } : null
}
