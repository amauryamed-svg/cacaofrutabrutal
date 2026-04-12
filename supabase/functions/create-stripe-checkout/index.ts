import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreFlight } from '../cors-config.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' })

serve(async (req) => {
  const origin = req.headers.get('origin') || ''

  if (req.method === 'OPTIONS') return handleCorsPreFlight(origin)
  try {
    const { technology_id, mvp_id, lots_count = 1, success_url, cancel_url } = await req.json()
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(jwt!)
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: getCorsHeaders(origin) })

    const price = mvp_id
      ? await getMvpPrice(supabase, mvp_id)
      : await getLotPrice(supabase, technology_id)
    if (!price) return new Response(JSON.stringify({ error: 'Item not found' }), { status: 404, headers: getCorsHeaders(origin) })

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{ price_data: { currency: 'usd', unit_amount: price.cents, product_data: { name: price.name } }, quantity: lots_count }],
      metadata: { user_id: user.id, technology_id, mvp_id: mvp_id ?? '', lots_count: String(lots_count) },
      success_url: success_url ?? `${req.headers.get('origin')}/fund?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  cancel_url  ?? `${req.headers.get('origin')}/fund?status=cancelled`,
    })

    const { data: order } = await supabase.from('orders').insert({
      user_id: user.id, product_id: technology_id, amount_cents: price.cents * lots_count,
      stripe_session_id: session.id, status: 'pending',
      technology_id, mvp_id: mvp_id ?? null, lots_count, currency: 'USD', payment_provider: 'stripe',
    }).select().single()

    // Send order created email
    if (user.email) {
      await supabase.functions.invoke('send-order-email', {
        body: {
          user_id: user.id,
          email: user.email,
          type: 'order_created',
          order_id: order?.id,
          lots_count,
          amount_usd: (price.cents * lots_count) / 100,
        },
      })
    }

    const corsHeaders = getCorsHeaders(origin)
    return new Response(JSON.stringify({ url: session.url }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: getCorsHeaders(origin) })
  }
})

async function getLotPrice(sb: ReturnType<typeof createClient>, tech_id: string) {
  const { data } = await sb.from('technologies').select('name,lot_price_usd_cents').eq('id', tech_id).single()
  return data ? { name: data.name, cents: data.lot_price_usd_cents } : null
}

async function getMvpPrice(sb: ReturnType<typeof createClient>, mvp_id: string) {
  const { data } = await sb.from('mvps').select('name,price_usd_cents').eq('id', mvp_id).single()
  return data ? { name: data.name, cents: data.price_usd_cents } : null
}
