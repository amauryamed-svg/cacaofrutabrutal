import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const SHOPIFY_WEBHOOK_SECRET = Deno.env.get('SHOPIFY_WEBHOOK_SECRET')

// Token award rates for Cacao Ceremony purchases.
// Single source of truth — keep in sync with /docs if added.
const BEANS_PER_USD = 2
const USD_PER_MAZORCA = 5            // 1 mazorca per $5 spent
const REPEAT_BUYER_THRESHOLD = 3     // 3rd+ order triggers repeat buyer bonus
const REPEAT_BUYER_BONUS_BEANS = 50
const REPEAT_BUYER_BONUS_MAZORCAS = 10

async function verifyShopifyHmac(rawBody: string, headerHmac: string, secret: string): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody))
  const computed = btoa(String.fromCharCode(...new Uint8Array(sig)))
  // Constant-time compare
  if (computed.length !== headerHmac.length) return false
  let diff = 0
  for (let i = 0; i < computed.length; i++) diff |= computed.charCodeAt(i) ^ headerHmac.charCodeAt(i)
  return diff === 0
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }
  if (!SHOPIFY_WEBHOOK_SECRET) {
    return new Response(JSON.stringify({ error: 'SHOPIFY_WEBHOOK_SECRET not configured' }), { status: 503 })
  }

  const topic = req.headers.get('x-shopify-topic') ?? ''
  const hmac = req.headers.get('x-shopify-hmac-sha256') ?? ''
  const shopDomain = req.headers.get('x-shopify-shop-domain') ?? ''
  const rawBody = await req.text()

  if (!hmac || !await verifyShopifyHmac(rawBody, hmac, SHOPIFY_WEBHOOK_SECRET)) {
    return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401 })
  }

  // Only handle orders/paid for now. Acknowledge other topics with 200 so Shopify doesn't retry.
  if (topic !== 'orders/paid') {
    return new Response(JSON.stringify({ ok: true, ignored: topic }), { status: 200 })
  }

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  let payload: Record<string, unknown>
  try { payload = JSON.parse(rawBody) } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
  }

  const shopifyOrderId = String(payload.id ?? '')
  const orderNumber = String(payload.order_number ?? payload.name ?? '')
  const email = String(payload.email ?? (payload.customer as Record<string, unknown> | undefined)?.email ?? '').trim().toLowerCase()
  const totalPrice = parseFloat(String(payload.total_price ?? '0'))
  const currency = String(payload.currency ?? 'USD')
  const lineItems = Array.isArray(payload.line_items) ? payload.line_items : []
  const lineItemsCount = lineItems.length

  // Extract any discount code applied (Shopify returns array of {code, ...})
  const discountCodes = Array.isArray(payload.discount_codes) ? payload.discount_codes : []
  const appliedCode = (discountCodes[0] as Record<string, unknown> | undefined)?.code as string | undefined

  if (!shopifyOrderId || !email) {
    return new Response(JSON.stringify({ error: 'Missing order id or email' }), { status: 400 })
  }

  // Idempotency: if we've already recorded this order, ack and skip.
  const { data: existing } = await supabase
    .from('cacao_ceremony_orders')
    .select('id, user_id')
    .eq('shopify_order_id', shopifyOrderId)
    .maybeSingle()

  if (existing) {
    return new Response(JSON.stringify({ ok: true, idempotent: true, order_id: existing.id }), { status: 200 })
  }

  // Match Shopify customer email → CFB user_id (nullable — log unmatched orders too).
  let matchedUserId: string | null = null
  const { data: matchData } = await supabase.rpc('get_user_id_by_email', { p_email: email })
  if (matchData) matchedUserId = String(matchData)

  // Compute token award if user matched.
  let tokensAwarded: { beans: number; mazorcas: number; bonuses: string[] } | null = null

  if (matchedUserId && totalPrice > 0) {
    const beans = Math.round(totalPrice * BEANS_PER_USD * 100) / 100
    let mazorcas = Math.floor(totalPrice / USD_PER_MAZORCA)
    const bonuses: string[] = []

    // Repeat buyer bonus: 3rd+ paid order
    const { data: priorCount } = await supabase.rpc('get_user_ceremony_order_count', { p_user_id: matchedUserId })
    if (typeof priorCount === 'number' && priorCount >= REPEAT_BUYER_THRESHOLD - 1) {
      mazorcas += REPEAT_BUYER_BONUS_MAZORCAS
      bonuses.push('repeat_buyer')
    }

    tokensAwarded = { beans, mazorcas, bonuses }

    // Insert ledger entry (uses CHECK constraint dropped in migration 023).
    await supabase.from('token_events').insert({
      user_id: matchedUserId,
      event_type: 'cacao_ceremony_purchase',
      beans,
      mazorcas,
      ref_id: shopifyOrderId,
    })

    // Apply repeat buyer bonus separately for clear ledger trail.
    if (bonuses.includes('repeat_buyer')) {
      await supabase.from('token_events').insert({
        user_id: matchedUserId,
        event_type: 'cacao_ceremony_repeat_buyer',
        beans: REPEAT_BUYER_BONUS_BEANS,
        mazorcas: 0,
        ref_id: shopifyOrderId,
      })
    }

    // Update user balances. Read-then-write because we need to bump beans_lifetime too.
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('beans_balance, mazorcas_balance, beans_lifetime')
      .eq('user_id', matchedUserId)
      .single()

    const totalBeans = beans + (bonuses.includes('repeat_buyer') ? REPEAT_BUYER_BONUS_BEANS : 0)
    await supabase
      .from('user_profiles')
      .update({
        beans_balance: (profile?.beans_balance ?? 0) + totalBeans,
        mazorcas_balance: (profile?.mazorcas_balance ?? 0) + mazorcas,
        beans_lifetime: (profile?.beans_lifetime ?? 0) + totalBeans,
      })
      .eq('user_id', matchedUserId)
  }

  // Mark discount code as used (if applied + we issued it).
  if (appliedCode) {
    await supabase
      .from('cacao_ceremony_discounts')
      .update({ status: 'used', used_at: new Date().toISOString(), used_order_id: shopifyOrderId })
      .eq('shopify_code', appliedCode)
      .eq('status', 'active')
  }

  await supabase.from('cacao_ceremony_orders').insert({
    user_id: matchedUserId,
    shopify_order_id: shopifyOrderId,
    shopify_order_number: orderNumber,
    shopify_email: email,
    shopify_discount_code: appliedCode ?? null,
    amount_cents: Math.round(totalPrice * 100),
    currency,
    line_items_count: lineItemsCount,
    status: 'paid',
    tokens_awarded: tokensAwarded,
    raw_event: { topic, shop: shopDomain, order: payload },
  })

  return new Response(JSON.stringify({
    ok: true,
    order_id: shopifyOrderId,
    matched_user: !!matchedUserId,
    tokens: tokensAwarded,
    discount_marked_used: !!appliedCode,
  }), { status: 200, headers: { 'Content-Type': 'application/json' } })
})
