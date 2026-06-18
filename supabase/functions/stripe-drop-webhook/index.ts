// supabase/functions/stripe-drop-webhook/index.ts
//
// Edge Function: stripe-drop-webhook
// Webhook DEDICADO para el Caua Cacao Drop. NO comparte endpoint con
// stripe-webhook (orders/Fund) — necesitamos un signing secret distinto
// porque cada endpoint en Stripe Dashboard tiene su propio whsec.
//
// Stripe Dashboard → Developers → Webhooks → "+ Add endpoint":
//   URL:    https://<project>.functions.supabase.co/stripe-drop-webhook
//   Events: checkout.session.completed
//   Copy signing secret → set env STRIPE_DROP_WEBHOOK_SECRET
//
// Flow:
//   1. Verify Stripe signature con STRIPE_DROP_WEBHOOK_SECRET.
//   2. Solo procesa event.type === 'checkout.session.completed'.
//   3. Match drop_purchases row por metadata.drop_purchase_id (fallback:
//      stripe_session_id si metadata viniera vacía por algún motivo).
//   4. Update status='paid', paid_at=now(), stripe_session_id=session.id.
//   5. Trigger placeholder: mint-cohort-nft + send-drop-confirmation
//      (otros agentes los están creando — si no existen, solo log).
//   6. Return 200 (idempotente — Stripe retry-safe).
//
// Spec: ~/Documents/Caua/integrations/social/specs/CAUA-CACAO-DROP.md §3-§4
// Schema: supabase/migrations/044_caua_creyentes_funnel.sql:96+
// Patrón firma: replicado de supabase/functions/stripe-webhook/index.ts
//   PERO usando stripe.webhooks.constructEventAsync (más robusto que HMAC
//   manual — soporta el formato `t=...,v1=...` de Stripe-Signature header).

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
  // Deno runtime → forzamos crypto provider que soporta async constructEvent.
  httpClient: Stripe.createFetchHttpClient(),
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

const WEBHOOK_SECRET = Deno.env.get('STRIPE_DROP_WEBHOOK_SECRET')!

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return new Response(JSON.stringify({ error: 'Missing stripe-signature' }), { status: 400 })
  }

  const rawBody = await req.text()

  // ─── 1. Verify signature ──────────────────────────────────────────────
  // constructEventAsync hace timing-safe HMAC-SHA256 + parsea el header
  // `t=<unix>,v1=<sig>` correctamente (incluye tolerance 5 min default).
  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      WEBHOOK_SECRET,
    )
  } catch (err) {
    console.error('[stripe-drop-webhook] signature verify failed:', err)
    return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400 })
  }

  // ─── 2. Filter event type ─────────────────────────────────────────────
  // Si en el futuro queremos `payment_intent.payment_failed` o `refund.created`,
  // se suman acá. Por ahora cohorte 01 solo escucha success.
  if (event.type !== 'checkout.session.completed') {
    return new Response(JSON.stringify({ received: true, ignored: event.type }), { status: 200 })
  }

  const session = event.data.object as Stripe.Checkout.Session

  // ─── 3. Match drop_purchases row ──────────────────────────────────────
  const dropPurchaseId = session.metadata?.drop_purchase_id
  const userId         = session.metadata?.user_id ?? null
  const sku            = session.metadata?.sku ?? null

  if (!dropPurchaseId) {
    // Fallback: matchear por stripe_session_id (si la session se creó pero
    // metadata se perdió — defensivo, no esperado).
    console.warn('[stripe-drop-webhook] missing drop_purchase_id metadata, falling back to session_id', session.id)
  }

  // ─── 4. Update row → paid ─────────────────────────────────────────────
  // Idempotency: si ya está paid, el UPDATE pisa con los mismos valores
  // y retornamos 200 limpio. Stripe reenvía hasta 3 días si no confirmamos.
  const updatePayload = {
    status:            'paid' as const,
    stripe_session_id: session.id,
    paid_at:           new Date().toISOString(),
  }

  let updateQuery = supabase.from('drop_purchases').update(updatePayload)
  if (dropPurchaseId) {
    updateQuery = updateQuery.eq('id', dropPurchaseId)
  } else {
    updateQuery = updateQuery.eq('stripe_session_id', session.id)
  }

  const { data: updated, error: updateErr } = await updateQuery.select('id, user_id, sku, cohort_id').single()

  if (updateErr) {
    console.error('[stripe-drop-webhook] update error:', updateErr, { dropPurchaseId, sessionId: session.id })
    return new Response(JSON.stringify({ error: updateErr.message }), { status: 500 })
  }

  console.log('[stripe-drop-webhook] paid', {
    drop_purchase_id: updated.id,
    user_id:          updated.user_id,
    sku:              updated.sku,
    cohort_id:        updated.cohort_id,
  })

  // ─── 5. Trigger downstream Edge Functions ─────────────────────────────
  // Estas las construyen otros agentes en paralelo. Si aún no existen,
  // supabase.functions.invoke devuelve error pero NO bloqueamos el webhook
  // (Stripe reintenta solo si retornamos non-2xx — y un mint fallido NO
  // debe re-cobrar al usuario). Logueamos y seguimos.

  // 5a. mint-cohort-nft → mint ERC-721 CauaCreyentesCohort01 en Base
  try {
    const { error: mintErr } = await supabase.functions.invoke('mint-cohort-nft', {
      body: {
        drop_purchase_id: updated.id,
        user_id:          updated.user_id,
        sku:              updated.sku,
        cohort_id:        updated.cohort_id,
      },
    })
    if (mintErr) {
      console.warn('[stripe-drop-webhook] TODO: mint-cohort-nft not deployed yet or failed:', mintErr.message)
    }
  } catch (e) {
    console.warn('[stripe-drop-webhook] TODO: mint-cohort-nft invoke threw:', e)
  }

  // 5b. send-drop-confirmation → email bilingual con ship date + NFT tx hash
  try {
    const { error: emailErr } = await supabase.functions.invoke('send-drop-confirmation', {
      body: {
        drop_purchase_id: updated.id,
        user_id:          updated.user_id,
        sku:              updated.sku,
        cohort_id:        updated.cohort_id,
        customer_email:   session.customer_email ?? null,
        amount_cop:       (session.amount_total ?? null),
      },
    })
    if (emailErr) {
      console.warn('[stripe-drop-webhook] TODO: send-drop-confirmation not deployed yet or failed:', emailErr.message)
    }
  } catch (e) {
    console.warn('[stripe-drop-webhook] TODO: send-drop-confirmation invoke threw:', e)
  }

  // ─── 6. ACK to Stripe ─────────────────────────────────────────────────
  return new Response(JSON.stringify({ received: true, drop_purchase_id: updated.id }), {
    status:  200,
    headers: { 'Content-Type': 'application/json' },
  })
})
