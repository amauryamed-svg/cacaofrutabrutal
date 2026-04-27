import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { getCorsHeaders, handleCorsPreFlight } from '../cors-config.ts'

const SHOPIFY_DOMAIN = Deno.env.get('SHOPIFY_STORE_DOMAIN') ?? 'caua-9917.myshopify.com'
const SHOPIFY_TOKEN = Deno.env.get('SHOPIFY_ADMIN_TOKEN')
const SHOPIFY_API_VERSION = '2024-10'
const PRODUCT_HANDLE = 'ceremonial-cacao'
const VARIANT_ID = 42039127572526

// Tier rules — single source of truth
const TREE_TIER_PCT: Record<number, number> = { 0: 0, 1: 5, 2: 10, 3: 15 }
const TREE_TIER_CAP_PCT = 20      // 4+ trees -> 20%
const MAZORCA_TO_PCT = 1          // 1 mazorca = 1% off
const MAZORCA_REDEEM_CAP_PCT = 10 // max 10% from mazorcas
const TOTAL_DISCOUNT_CAP = 30     // hard cap to protect margin

function calcTreeDiscount(treeCount: number): number {
  if (treeCount <= 0) return 0
  if (treeCount >= 4) return TREE_TIER_CAP_PCT
  return TREE_TIER_PCT[treeCount] ?? 0
}

function buildDiscountCode(userId: string): string {
  const short = userId.replace(/-/g, '').slice(0, 8).toUpperCase()
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `CAUA-${short}-${rand}`
}

async function shopifyCreatePriceRule(code: string, valuePct: number): Promise<{ price_rule_id: string; discount_code_id: string }> {
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString() // 30d
  const priceRuleBody = {
    price_rule: {
      title: code,
      target_type: 'line_item',
      target_selection: 'entitled',
      allocation_method: 'across',
      value_type: 'percentage',
      value: `-${valuePct}.0`,
      customer_selection: 'all',
      starts_at: new Date().toISOString(),
      ends_at: expiresAt,
      once_per_customer: true,
      usage_limit: 1,
      entitled_variant_ids: [VARIANT_ID],
    },
  }
  const prRes = await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/price_rules.json`, {
    method: 'POST',
    headers: { 'X-Shopify-Access-Token': SHOPIFY_TOKEN!, 'Content-Type': 'application/json' },
    body: JSON.stringify(priceRuleBody),
  })
  if (!prRes.ok) throw new Error(`Shopify price_rule failed: ${prRes.status} ${await prRes.text()}`)
  const { price_rule } = await prRes.json()

  const codeRes = await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/price_rules/${price_rule.id}/discount_codes.json`, {
    method: 'POST',
    headers: { 'X-Shopify-Access-Token': SHOPIFY_TOKEN!, 'Content-Type': 'application/json' },
    body: JSON.stringify({ discount_code: { code } }),
  })
  if (!codeRes.ok) throw new Error(`Shopify discount_code failed: ${codeRes.status} ${await codeRes.text()}`)
  const { discount_code } = await codeRes.json()
  return { price_rule_id: String(price_rule.id), discount_code_id: String(discount_code.id) }
}

serve(async (req) => {
  const origin = req.headers.get('origin') || ''
  if (req.method === 'OPTIONS') return handleCorsPreFlight(origin)
  const cors = { ...getCorsHeaders(origin), 'Content-Type': 'application/json' }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: cors })
    }
    if (!SHOPIFY_TOKEN) {
      return new Response(JSON.stringify({ error: 'SHOPIFY_ADMIN_TOKEN not configured' }), { status: 503, headers: cors })
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!jwt) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors })
    const { data: { user } } = await supabase.auth.getUser(jwt)
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors })

    const { mazorcas_to_redeem = 0 } = await req.json().catch(() => ({}))
    const mazorcasRequested = Math.max(0, Math.min(parseInt(String(mazorcas_to_redeem), 10) || 0, MAZORCA_REDEEM_CAP_PCT))

    const { data: trees } = await supabase.rpc('get_user_tree_count', { p_user_id: user.id })
    const treeCount = Number(trees) || 0
    const treeDiscountPct = calcTreeDiscount(treeCount)

    let mazorcaDiscountPct = 0
    if (mazorcasRequested > 0) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('mazorcas_balance')
        .eq('user_id', user.id)
        .single()
      const balance = Number(profile?.mazorcas_balance) || 0
      if (balance < mazorcasRequested) {
        return new Response(JSON.stringify({ error: `Insufficient mazorcas: have ${balance}, need ${mazorcasRequested}` }), { status: 400, headers: cors })
      }
      mazorcaDiscountPct = Math.min(mazorcasRequested * MAZORCA_TO_PCT, MAZORCA_REDEEM_CAP_PCT)
    }

    const totalPct = Math.min(treeDiscountPct + mazorcaDiscountPct, TOTAL_DISCOUNT_CAP)
    if (totalPct <= 0) {
      return new Response(JSON.stringify({
        error: 'No discount applicable',
        detail: 'Adopt at least 1 tree or redeem mazorcas to qualify',
        tree_count: treeCount,
      }), { status: 400, headers: cors })
    }

    const code = buildDiscountCode(user.id)

    let shopifyIds: { price_rule_id: string; discount_code_id: string }
    try {
      shopifyIds = await shopifyCreatePriceRule(code, totalPct)
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Shopify API failed', detail: String(err) }), { status: 502, headers: cors })
    }

    if (mazorcasRequested > 0) {
      const { error: debitError } = await supabase.rpc('debit_mazorcas', {
        p_user_id: user.id,
        p_amount: mazorcasRequested,
      })
      if (debitError) {
        // Best-effort: we already created the Shopify code. Log but proceed — code stays valid for the user.
        console.error('Mazorca debit failed after Shopify code created:', debitError)
      }
    }

    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString()

    await supabase.from('cacao_ceremony_discounts').insert({
      user_id: user.id,
      shopify_code: code,
      shopify_price_rule_id: shopifyIds.price_rule_id,
      discount_pct: totalPct,
      trees_at_issue: treeCount,
      mazorcas_spent: mazorcasRequested,
      expires_at: expiresAt,
      metadata: {
        tree_discount_pct: treeDiscountPct,
        mazorca_discount_pct: mazorcaDiscountPct,
        variant_id: VARIANT_ID,
        product_handle: PRODUCT_HANDLE,
      },
    })

    const checkoutUrl = `https://${SHOPIFY_DOMAIN}/discount/${code}?redirect=%2Fproducts%2F${PRODUCT_HANDLE}%3Fvariant%3D${VARIANT_ID}`

    return new Response(JSON.stringify({
      code,
      discount_pct: totalPct,
      tree_discount_pct: treeDiscountPct,
      mazorca_discount_pct: mazorcaDiscountPct,
      tree_count: treeCount,
      mazorcas_spent: mazorcasRequested,
      checkout_url: checkoutUrl,
      expires_at: expiresAt,
    }), { status: 200, headers: cors })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: cors })
  }
})
