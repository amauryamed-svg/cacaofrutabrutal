// Edge Function: create-drop-coinbase-charge
//
// Rail internacional (USD via Coinbase Commerce USDC) para el Caua Cacao Drop
// Cohorte 01 · Lote 2025. Espejo conceptual de `create-drop-checkout-session`
// (Stripe COP) pero apuntando a Coinbase Commerce hosted checkout para clientes
// fuera de Colombia. Cumple Charter §I.3: Coinbase Commerce es PAGO, no custodia.
// NO firma user wallet, NO mint en este flow — el mint lo dispara
// `mint-cohort-nft` tras `charge:confirmed` recibido por `coinbase-drop-webhook`.
//
// Body shape:
//   {
//     sku: 'mucilago' | 'bean',
//     shipping_info_international: {
//       full_name, email, phone, address, city,
//       state_or_province, postal_code, country, notes?
//     }
//   }
//
// Returns: { hosted_url, charge_id, drop_purchase_id }
//
// Required env vars:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, COINBASE_COMMERCE_API_KEY
//
// Specs:
//   ~/Documents/Caua/integrations/social/specs/CAUA-CACAO-DROP.md §4
//   supabase/migrations/044_caua_creyentes_funnel.sql (drop_purchases schema)

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreFlight } from '../cors-config.ts'

// ─── Pricing canónico USD (debe coincidir con Drop.tsx SkuCard.priceUSD) ───
// Cohorte 01 Lote 2025. Si Cohorte 02 cambia precios, fork esta tabla — NO
// reescribir esta para preservar idempotencia de webhooks pasados.
const SKU_PRICING_USD: Record<'mucilago' | 'bean', { unit_usd: number; name: string; description: string }> = {
  mucilago: {
    unit_usd:    99,
    name:        'Caua Cacao Drop · Mucílago Liofilizado 30g',
    description: 'Functional Cacao Upcycled · Cohorte 01 · Lote 2025. Cristales rosados de mucílago liofilizado de los 5 Guardian Pentámera.',
  },
  bean: {
    unit_usd:    129,
    name:        'Caua Cacao Drop · Bean Liofilizado 50g',
    description: 'Functional Cacao Upcycled · Cohorte 01 · Lote 2025. Bean Criollo Élite fermentado 6 días y liofilizado al vacío.',
  },
}

// Shipping flat inicial — $30 USD. Spec dice $25-40 según país; defer cálculo
// dinámico (Stripe Shipping Rates o tabla `shipping_zones`) a v2 post-MVP.
// Documentamos el flat acá para que el frontend lo refleje sin sorpresas.
const SHIPPING_FLAT_USD = 30

const COHORT_ID = 1
const COHORT_CAP_PER_SKU = 10

interface ShippingInfoInternational {
  full_name:         string
  email:             string
  phone:             string
  address:           string
  city:              string
  state_or_province: string
  postal_code:       string
  country:           string   // ISO-2, ej 'US', 'ES', 'MX'. Validamos !== 'CO'.
  notes?:            string
}

interface RequestBody {
  sku?:                          string
  shipping_info_international?:  ShippingInfoInternational
}

serve(async (req) => {
  const origin = req.headers.get('origin') || ''
  if (req.method === 'OPTIONS') return handleCorsPreFlight(origin)

  const corsHeaders = { ...getCorsHeaders(origin), 'Content-Type': 'application/json' }

  try {
    // ─── 1. Auth obligatoria ──────────────────────────────────────────────
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!jwt) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    const { data: userData, error: userErr } = await supabase.auth.getUser(jwt)
    const user = userData?.user
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    // ─── 2. Validación body ───────────────────────────────────────────────
    const body = await req.json().catch(() => ({})) as RequestBody

    const sku = body.sku
    if (sku !== 'mucilago' && sku !== 'bean') {
      return new Response(JSON.stringify({ error: 'Invalid SKU' }), { status: 400, headers: corsHeaders })
    }

    const shipping = body.shipping_info_international
    if (!shipping
        || !shipping.full_name?.trim()
        || !shipping.email?.trim()
        || !shipping.address?.trim()
        || !shipping.city?.trim()
        || !shipping.postal_code?.trim()
        || !shipping.country?.trim()) {
      return new Response(JSON.stringify({
        error: 'Missing shipping_info_international fields (full_name, email, address, city, postal_code, country required)',
      }), { status: 400, headers: corsHeaders })
    }

    // Geo-coherencia: Coinbase USDC rail es INTERNACIONAL only. Colombia paga
    // por Stripe COP — forzamos rechazo si country === 'CO' para evitar arbitraje
    // de método (ej. cliente colombiano evade impuestos eligiendo USDC).
    const countryCode = shipping.country.trim().toUpperCase()
    if (countryCode === 'CO') {
      return new Response(JSON.stringify({
        error: 'Colombia residents must use Stripe COP rail, not USDC. Switch payment method.',
      }), { status: 400, headers: corsHeaders })
    }

    // ─── 3. Cap check pre-insert (idéntica regla que Stripe rail) ────────
    // El trigger SQL `enforce_drop_purchase_cap` es la fuente de verdad, pero
    // chequear acá nos da error message limpio en vez de PG exception.
    const { count: activeCount, error: countErr } = await supabase
      .from('drop_purchases')
      .select('id', { count: 'exact', head: true })
      .eq('cohort_id', COHORT_ID)
      .eq('sku', sku)
      .in('status', ['pending', 'paid'])

    if (countErr) {
      return new Response(JSON.stringify({ error: 'Could not verify availability', details: countErr.message }), {
        status: 500, headers: corsHeaders,
      })
    }

    if ((activeCount ?? 0) >= COHORT_CAP_PER_SKU) {
      return new Response(JSON.stringify({ error: 'Sold out', sku, cohort_id: COHORT_ID }), {
        status: 409, headers: corsHeaders,
      })
    }

    // ─── 4. Insert drop_purchases pending ─────────────────────────────────
    const pricing = SKU_PRICING_USD[sku]
    const amount_usd_total = pricing.unit_usd + SHIPPING_FLAT_USD   // 99+30=129 | 129+30=159

    const { data: dropRow, error: insertErr } = await supabase
      .from('drop_purchases')
      .insert({
        user_id:    user.id,
        cohort_id:  COHORT_ID,
        sku,
        status:     'pending',
        amount_usd: amount_usd_total,
      })
      .select('id')
      .single()

    if (insertErr || !dropRow) {
      // El trigger SQL puede tirar 23505 si hubo race. Surface limpio.
      const msg = insertErr?.message ?? ''
      const isCap = msg.includes('Drop cap reached')
      return new Response(JSON.stringify({
        error: isCap ? 'Sold out' : 'Could not reserve slot',
        details: msg,
      }), { status: isCap ? 409 : 500, headers: corsHeaders })
    }

    const dropPurchaseId = dropRow.id as string

    // ─── 5. Coinbase Commerce charge ──────────────────────────────────────
    const apiKey = Deno.env.get('COINBASE_COMMERCE_API_KEY')
    if (!apiKey) {
      // Rollback: la purchase pending quedaría huérfana si no la borramos. Refund
      // explícito mejor que delete: la deja auditable.
      await supabase.from('drop_purchases')
        .update({ status: 'refunded' })
        .eq('id', dropPurchaseId)
      return new Response(JSON.stringify({ error: 'Coinbase Commerce not configured' }), {
        status: 503, headers: corsHeaders,
      })
    }

    const successUrl = `${origin}/checkout/drop/success?via=coinbase&purchase_id=${dropPurchaseId}`
    const cancelUrl  = `${origin}/checkout/drop?cancelled=1&purchase_id=${dropPurchaseId}`

    const ccRes = await fetch('https://api.commerce.coinbase.com/charges', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CC-Api-Key': apiKey,
        'X-CC-Version': '2018-03-22',
      },
      body: JSON.stringify({
        name:         pricing.name,
        description:  pricing.description + ` Ship to ${shipping.city}, ${countryCode}.`,
        pricing_type: 'fixed_price',
        local_price:  { amount: amount_usd_total.toFixed(2), currency: 'USD' },
        // metadata.kind='drop' permite a coinbase-drop-webhook discriminar de
        // los charges de /fund que usan kind='equity_5k'|'b2b_sponsorship'.
        // metadata.drop_purchase_id es PK directo para UPDATE post-confirmed.
        metadata: {
          kind:              'drop',
          drop_purchase_id:  dropPurchaseId,
          sku,
          user_id:           user.id,
          cohort_id:         String(COHORT_ID),
          email:             user.email ?? shipping.email,
          ship_country:      countryCode,
          ship_city:         shipping.city,
          ship_postal_code:  shipping.postal_code,
          ship_full_name:    shipping.full_name,
          unit_usd:          String(pricing.unit_usd),
          shipping_usd:      String(SHIPPING_FLAT_USD),
        },
        redirect_url: successUrl,
        cancel_url:   cancelUrl,
      }),
    })

    if (!ccRes.ok) {
      const errBody = await ccRes.text()
      // Rollback purchase pending — sin charge, slot no debería quedar tomado.
      await supabase.from('drop_purchases')
        .update({ status: 'refunded' })
        .eq('id', dropPurchaseId)
      return new Response(JSON.stringify({ error: 'Coinbase charge failed', details: errBody }), {
        status: 502, headers: corsHeaders,
      })
    }

    const ccData = await ccRes.json()
    const charge = ccData?.data
    if (!charge?.hosted_url || !charge?.id) {
      await supabase.from('drop_purchases')
        .update({ status: 'refunded' })
        .eq('id', dropPurchaseId)
      return new Response(JSON.stringify({ error: 'Coinbase response missing fields' }), {
        status: 502, headers: corsHeaders,
      })
    }

    // Persist charge_id en la fila pending — webhook hace UPDATE por este id.
    await supabase.from('drop_purchases')
      .update({ coinbase_charge_id: charge.id })
      .eq('id', dropPurchaseId)

    return new Response(JSON.stringify({
      hosted_url:        charge.hosted_url as string,
      charge_id:         charge.id as string,
      drop_purchase_id:  dropPurchaseId,
    }), { status: 200, headers: corsHeaders })

  } catch (e) {
    return new Response(JSON.stringify({
      error: e instanceof Error ? e.message : 'Unknown error',
    }), { status: 500, headers: corsHeaders })
  }
})
