// supabase/functions/create-drop-checkout-session/index.ts
//
// Edge Function: create-drop-checkout-session
// Crea una sesión Stripe Checkout en COP para el Caua Cacao Drop Cohorte 01.
//
// Flow:
//   1. JWT auth obligatoria — extrae user.id del header Authorization.
//   2. Valida sku ∈ {'mucilago','bean'} y deriva amount_cop server-side
//      (NO confía en input del cliente — pricing es canónico).
//   3. Cuenta drop_purchases activos (status in pending|paid) para
//      (cohort_id=1, sku). Si >= 10 → 409 Sold out (el trigger de migration
//      044 también enforcea, esto es defensa en profundidad).
//   4. Inserta row pending en drop_purchases vía service_role.
//   5. Crea Stripe Checkout Session: currency=COP, mode=payment,
//      metadata.drop_purchase_id para que el webhook pueda matchear.
//   6. Actualiza la row con stripe_session_id (para idempotency).
//   7. Returns { url, session_id }.
//
// Spec: ~/Documents/Caua/integrations/social/specs/CAUA-CACAO-DROP.md §4
// Schema: supabase/migrations/044_caua_creyentes_funnel.sql:96+
// Patrón: replicado de supabase/functions/create-stripe-checkout/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreFlight } from '../cors-config.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
})

// ─── Pricing canónico (server-side source of truth) ───────────────────────
// Stripe espera amount en la unidad mínima de la moneda. COP es zero-decimal
// según Stripe docs (https://stripe.com/docs/currencies#zero-decimal),
// por lo tanto unit_amount = pesos enteros directo, NO multiplicar por 100.
const SKU_PRICING: Record<'mucilago' | 'bean', {
  name:       string
  amount_cop: number     // pesos enteros
  description: string
}> = {
  mucilago: {
    name:        'Mucílago Liofilizado 30g',
    amount_cop:  130_000,
    description: 'Cristales rosados upcycled · Bioflavonoids + electrolitos · Cohorte 01 Lote 2025',
  },
  bean: {
    name:        'Bean Liofilizado 50g',
    amount_cop:  150_000,
    description: 'Bean Criollo Élite Pentámera · Liofilizado al vacío · Cohorte 01 Lote 2025',
  },
}

const COHORT_ID = 1     // Cohorte 01 — primera y única hasta 2026-05-26
const CAP_PER_SKU = 10

interface RequestBody {
  sku: 'mucilago' | 'bean'
  shipping_info: {
    full_name:  string
    email:      string
    phone:      string
    address:    string
    city:       string
    department: string
    notes?:     string
  }
}

serve(async (req) => {
  const origin = req.headers.get('origin') || ''
  const corsHeaders = getCorsHeaders(origin)

  if (req.method === 'OPTIONS') return handleCorsPreFlight(origin)
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    // ─── 1. Parse + validate body ──────────────────────────────────────
    const body = await req.json() as RequestBody
    const { sku, shipping_info } = body

    if (sku !== 'mucilago' && sku !== 'bean') {
      return new Response(JSON.stringify({ error: 'Invalid SKU' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (!shipping_info || !shipping_info.full_name || !shipping_info.email
        || !shipping_info.address || !shipping_info.city || !shipping_info.department) {
      return new Response(JSON.stringify({ error: 'Incomplete shipping info' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ─── 2. Auth — extract user from JWT ───────────────────────────────
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )
    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!jwt) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const { data: { user }, error: userErr } = await supabase.auth.getUser(jwt)
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ─── 3. Cap check — count active rows ──────────────────────────────
    // Defensa en profundidad: el trigger enforce_drop_purchase_cap también
    // bloqueará, pero queremos un 409 limpio en lugar de un 23505 opaco.
    const { count: activeCount, error: countErr } = await supabase
      .from('drop_purchases')
      .select('id', { count: 'exact', head: true })
      .eq('cohort_id', COHORT_ID)
      .eq('sku', sku)
      .in('status', ['pending', 'paid'])

    if (countErr) {
      console.error('[create-drop-checkout-session] count error:', countErr)
      return new Response(JSON.stringify({ error: 'Availability check failed' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if ((activeCount ?? 0) >= CAP_PER_SKU) {
      return new Response(JSON.stringify({ error: 'Sold out' }), {
        status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const pricing = SKU_PRICING[sku]

    // ─── 4. Insert pending row ─────────────────────────────────────────
    // Insertamos ANTES de crear la Stripe Session para tener un id que
    // pasamos como metadata. Si Stripe falla luego, una tarea de cleanup
    // (cron en otro PR, ref CLAUDE.md §10) liberará el pending row.
    const { data: dropRow, error: insertErr } = await supabase
      .from('drop_purchases')
      .insert({
        user_id:    user.id,
        cohort_id:  COHORT_ID,
        sku,
        status:     'pending',
        amount_cop: pricing.amount_cop,
        // amount_usd: NULL — solo se llena en checkout USD/USDC (otro flow)
      })
      .select('id')
      .single()

    if (insertErr || !dropRow) {
      // 23505 viene del trigger de cap si llegamos acá por race condition.
      const code = (insertErr as { code?: string })?.code
      if (code === '23505') {
        return new Response(JSON.stringify({ error: 'Sold out' }), {
          status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      console.error('[create-drop-checkout-session] insert error:', insertErr)
      return new Response(JSON.stringify({ error: 'Could not reserve slot' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ─── 5. Create Stripe Checkout Session ─────────────────────────────
    // APP_BASE_URL takes precedence; fallback al origin del request para
    // dev local. Stripe replaza {CHECKOUT_SESSION_ID} en success_url.
    const appBase = Deno.env.get('APP_BASE_URL') || origin || 'https://cacaofrutabrutal.com'

    const session = await stripe.checkout.sessions.create({
      mode:                 'payment',
      payment_method_types: ['card'],
      currency:             'cop',
      line_items: [{
        price_data: {
          currency:     'cop',
          unit_amount:  pricing.amount_cop,  // COP es zero-decimal en Stripe
          product_data: {
            name:        pricing.name,
            description: pricing.description,
          },
        },
        quantity: 1,
      }],
      customer_email: shipping_info.email,
      metadata: {
        drop_purchase_id: dropRow.id,
        user_id:          user.id,
        cohort_id:        String(COHORT_ID),
        sku,
        // Shipping cabe en metadata (Stripe permite hasta 500 chars/key,
        // 50 keys total). Sirve para soporte sin que dependamos solo del
        // row en Supabase si la DB se desfasa.
        ship_name:        shipping_info.full_name,
        ship_phone:       shipping_info.phone,
        ship_address:     shipping_info.address,
        ship_city:        shipping_info.city,
        ship_department:  shipping_info.department,
        ship_notes:       (shipping_info.notes ?? '').slice(0, 480),
      },
      success_url: `${appBase}/drop/success?id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${appBase}/drop`,
    })

    // ─── 6. Persist stripe_session_id ──────────────────────────────────
    const { error: updateErr } = await supabase
      .from('drop_purchases')
      .update({ stripe_session_id: session.id })
      .eq('id', dropRow.id)

    if (updateErr) {
      // No bloqueamos — la Session ya existe en Stripe y el webhook
      // matcheará por metadata.drop_purchase_id (fallback).
      console.warn('[create-drop-checkout-session] could not store session_id:', updateErr)
    }

    return new Response(JSON.stringify({
      url:        session.url,
      session_id: session.id,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('[create-drop-checkout-session] unhandled:', e)
    const msg = e instanceof Error ? e.message : String(e)
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
