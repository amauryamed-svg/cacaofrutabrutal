// Edge Function: coinbase-drop-webhook
//
// Receiver dedicado del Caua Cacao Drop para eventos Coinbase Commerce.
// SEPARADO de `coinbase-commerce-webhook` (que sirve investor + adoption flows)
// porque:
//   1) Permite secret diferente — Coinbase Commerce solo permite UN webhook URL
//      por endpoint registrado. Si registramos 2 endpoints distintos en el
//      dashboard Commerce, cada uno tiene su propio `webhook_shared_secret`
//      independiente. Aislar Drop reduce blast radius si el secret leakea.
//   2) Aísla cambios al schema drop_purchases del flow investor (zero
//      regression risk).
//   3) Spec CAUA-CACAO-DROP.md §4 lo declara explícitamente.
//
// Verifica HMAC-SHA256 en `x-cc-webhook-signature` contra
// COINBASE_COMMERCE_DROP_WEBHOOK_SECRET.
//
// Eventos handled:
//   - charge:confirmed  → drop_purchases.status='paid' + paid_at + amount_usd
//   - charge:failed     → status='refunded' (libera slot via cap trigger)
//   - charge:delayed    → log, NO mutación (delayed != failed)
//
// Post-confirmed: trigger downstream Edge Functions (otros agentes los crean):
//   - mint-cohort-nft         (SA-NFT-Cohort)
//   - send-drop-confirmation  (SA-Email)
// Las invocamos fire-and-forget — si fallan se reintenta vía retry queue
// (out-of-scope acá; spec menciona "queue retry + manual mint admin").
//
// Charter §I.3 compliance: este webhook NO firma transacciones on-chain, NO
// custodia claves, NO ejecuta mint directo. Solo marca paid y delega.

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const supabaseUrl        = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const webhookSecret      = Deno.env.get('COINBASE_COMMERCE_DROP_WEBHOOK_SECRET') ?? ''

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// ─── HMAC verify (timing-safe compare) ────────────────────────────────────
// Espejo bit-a-bit del flow en coinbase-commerce-webhook.ts. NO refactorizar
// a _shared/ todavía: el secret es distinto y la deduplicación llegará en una
// pass de cleanup.
async function verifySig(body: string, sigHex: string | null): Promise<boolean> {
  if (!sigHex || !webhookSecret) return false
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(webhookSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const mac = await crypto.subtle.sign('HMAC', key, enc.encode(body))
  const expected = Array.from(new Uint8Array(mac))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  if (expected.length !== sigHex.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ sigHex.charCodeAt(i)
  }
  return diff === 0
}

interface CommerceCharge {
  id?:       string
  code?:     string
  metadata?: {
    kind?:              string
    drop_purchase_id?:  string
    sku?:               string
    user_id?:           string
    cohort_id?:         string
    ship_country?:      string
    email?:             string
  }
  pricing?: {
    local?:        { amount?: string; currency?: string }
    settlement?:   { amount?: string; currency?: string }
  }
  payments?: Array<{
    status?:         string
    transaction_id?: string
    network?:        string
    value?: { local?: { amount?: string }; crypto?: { amount?: string; currency?: string } }
  }>
}

interface CommerceEvent {
  id?:   string
  type?: string
  data?: CommerceCharge
}

interface CommerceWrapper {
  event?: CommerceEvent
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405 })
  }

  const body = await req.text()
  const sig  = req.headers.get('x-cc-webhook-signature')
  const ok   = await verifySig(body, sig)
  if (!ok) {
    return new Response(JSON.stringify({ error: 'invalid_signature' }), { status: 401 })
  }

  let payload: CommerceWrapper
  try {
    payload = JSON.parse(body) as CommerceWrapper
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), { status: 400 })
  }

  const event = payload.event
  if (!event?.type || !event.data) {
    return new Response(JSON.stringify({ ok: true, ignored: true }), { status: 200 })
  }

  const charge = event.data
  const metadata = charge.metadata ?? {}

  // ─── Guard: solo procesar charges marcados kind='drop' ──────────────────
  // Si Coinbase mete el mismo endpoint para dos flows por error, este filtro
  // evita corromper drop_purchases con eventos de investor_charges.
  if (metadata.kind !== 'drop') {
    return new Response(JSON.stringify({ ok: true, ignored: true, reason: 'kind!=drop' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const dropPurchaseId = metadata.drop_purchase_id
  const chargeId       = charge.id
  if (!dropPurchaseId || !chargeId) {
    return new Response(JSON.stringify({ error: 'missing_drop_purchase_id_or_charge_id' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // ─── charge:confirmed → marcar paid + disparar downstream ──────────────
  if (event.type === 'charge:confirmed') {
    // Total cobrado real (local_price.amount); Coinbase ya hizo conversión USDC.
    const amountStr = charge.pricing?.local?.amount
    const amountUsd = amountStr ? Number(amountStr) : null

    const { error: updErr } = await supabase
      .from('drop_purchases')
      .update({
        status:             'paid',
        coinbase_charge_id: chargeId,
        amount_usd:         amountUsd,
        paid_at:            new Date().toISOString(),
      })
      .eq('id', dropPurchaseId)

    if (updErr) {
      // 200 OK con flag para que Coinbase no haga retry storm; logueamos para
      // alertar — DB problem, no signature issue.
      console.error('[coinbase-drop-webhook] update failed', { dropPurchaseId, chargeId, err: updErr.message })
      return new Response(JSON.stringify({ ok: false, error: 'db_update_failed', details: updErr.message }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // ─── Downstream fire-and-forget ──────────────────────────────────────
    // mint-cohort-nft: dispara mint ERC-721 a wallet del user (KYC ya verificado
    // server-side via siwe-link-wallet). Si el user no linkeó wallet aún, la
    // función debería encolar el mint para retry (responsabilidad SA-NFT-Cohort).
    //
    // send-drop-confirmation: email "Tu Drop está confirmado · ship date 2026-06-10".
    //
    // Estos `.invoke()` no bloquean la response al webhook — Coinbase necesita
    // 2xx en <30s o re-envía el evento (lo cual sería duplicación). Usamos
    // Promise.allSettled fire-and-forget vía catch sin await en errores.
    const fanout: Array<Promise<unknown>> = [
      supabase.functions.invoke('mint-cohort-nft', {
        body: {
          drop_purchase_id: dropPurchaseId,
          user_id:          metadata.user_id,
          sku:              metadata.sku,
          cohort_id:        Number(metadata.cohort_id ?? 1),
        },
      }).catch(err => {
        console.error('[coinbase-drop-webhook] mint-cohort-nft invoke failed', err)
      }),
      supabase.functions.invoke('send-drop-confirmation', {
        body: {
          drop_purchase_id: dropPurchaseId,
          user_id:          metadata.user_id,
          email:            metadata.email,
          sku:              metadata.sku,
          via:              'coinbase_usdc',
        },
      }).catch(err => {
        console.error('[coinbase-drop-webhook] send-drop-confirmation invoke failed', err)
      }),
    ]

    // Esperamos en paralelo pero bounded: si tardan >5s respondemos igual.
    // Coinbase retry policy es exponential backoff — un downstream lento NO
    // debería causar duplicate confirmation flow.
    await Promise.race([
      Promise.allSettled(fanout),
      new Promise(resolve => setTimeout(resolve, 5000)),
    ])

    return new Response(JSON.stringify({
      ok: true,
      type: 'charge:confirmed',
      drop_purchase_id: dropPurchaseId,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }

  // ─── charge:failed → refunded (libera slot via cap trigger) ────────────
  if (event.type === 'charge:failed') {
    await supabase
      .from('drop_purchases')
      .update({ status: 'refunded' })
      .eq('id', dropPurchaseId)
      .eq('status', 'pending')   // idempotencia: NO regresar paid → refunded acá
    return new Response(JSON.stringify({ ok: true, type: 'charge:failed', drop_purchase_id: dropPurchaseId }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // ─── charge:delayed / created / pending → log, sin mutación destructiva ─
  // El slot ya está reservado en 'pending'; un delayed no es failure.
  return new Response(JSON.stringify({ ok: true, type: event.type, ignored_mutation: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
