import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import * as crypto from 'https://deno.land/std@0.208.0/crypto/mod.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifySignature(signature: string, body: string): Promise<boolean> {
  const encoder = new TextEncoder()
  const secretKey = encoder.encode(stripeWebhookSecret)
  const messageKey = encoder.encode(body)

  const key = await crypto.subtle.importKey('raw', secretKey, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const computedSignature = await crypto.subtle.sign('HMAC', key, messageKey)
  const computedHex = Array.from(new Uint8Array(computedSignature)).map(b => b.toString(16).padStart(2, '0')).join('')

  return signature === computedHex
}

serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
    }

    const signature = req.headers.get('stripe-signature')
    if (!signature) {
      return new Response(JSON.stringify({ error: 'Missing signature' }), { status: 400 })
    }

    const body = await req.text()
    const isValid = await verifySignature(signature, body)

    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400 })
    }

    const event = JSON.parse(body)

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object

      // Update order status
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'completed' })
        .eq('stripe_session_id', session.id)

      if (updateError) {
        console.error('Update error:', updateError)
        return new Response(JSON.stringify({ error: updateError.message }), { status: 400 })
      }

      // Get order details for email + token award
      const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('id, user_id, amount_cents, currency, lots_count')
        .eq('stripe_session_id', session.id)
        .single()

      if (fetchError) {
        console.error('Fetch error:', fetchError)
        return new Response(JSON.stringify({ error: fetchError.message }), { status: 400 })
      }

      // Get user email via Auth admin API (auth.users is not directly queryable as a public table).
      const { data: userResp } = await supabase.auth.admin.getUserById(order.user_id)
      const userEmail = userResp?.user?.email

      // Send confirmation email
      if (userEmail) {
        await supabase.functions.invoke('send-order-email', {
          body: {
            user_id: order.user_id,
            email: userEmail,
            type: 'payment_confirmed',
            order_id: order.id,
            amount_usd: order.amount_cents / 100,
          },
        })
      }

      // Award tokens: 5 beans + 2 mazorcas per lot, idempotent on session.id
      const { data: alreadyAwarded } = await supabase
        .from('token_events')
        .select('id')
        .eq('user_id', order.user_id)
        .eq('event_type', 'lot')
        .eq('ref_id', session.id)
        .limit(1)

      if (!alreadyAwarded || alreadyAwarded.length === 0) {
        const lotsCount = (order.lots_count ?? 1)
        const beans     = 5 * lotsCount
        const mazorcas  = 2 * lotsCount

        await supabase.from('token_events').insert([{
          user_id:    order.user_id,
          event_type: 'lot',
          beans,
          mazorcas,
          ref_id:     session.id,
        }])

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('beans_balance, mazorcas_balance, beans_lifetime')
          .eq('user_id', order.user_id)
          .single()

        await supabase
          .from('user_profiles')
          .update({
            beans_balance:    (profile?.beans_balance    ?? 0) + beans,
            mazorcas_balance: (profile?.mazorcas_balance ?? 0) + mazorcas,
            beans_lifetime:   (profile?.beans_lifetime   ?? 0) + beans,
          })
          .eq('user_id', order.user_id)
      }

      // Increment completed_orders count
      await supabase.rpc('increment_completed_orders', { user_id: order.user_id })
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (error) {
    console.error('Webhook error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), { status: 500 })
  }
})
