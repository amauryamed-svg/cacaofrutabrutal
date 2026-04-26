// Edge Function: create-coinbase-charge
// Creates a Coinbase Commerce hosted USDC checkout for the investor flow ($5K equity OR B2B sponsorship)
// and persists the intent in investor_charges for audit / HubSpot sync.
//
// Body: { kind: 'equity_5k' | 'b2b_sponsorship', amount_usd?: number, success_url?: string, cancel_url?: string }
// Returns: { url: string, charge_id: string, charge_code: string }
//
// Required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, COINBASE_COMMERCE_API_KEY

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreFlight } from '../cors-config.ts'

const PACKAGES = {
  equity_5k:        { name: 'CFB Pre-Seed Equity',  default_amount_usd: 5000, min: 5000, max: 5000 },
  b2b_sponsorship:  { name: 'CFB B2B Sponsorship',  default_amount_usd: 1000, min: 100,  max: 50000 },
} as const

type Kind = keyof typeof PACKAGES

serve(async (req) => {
  const origin = req.headers.get('origin') || ''
  if (req.method === 'OPTIONS') return handleCorsPreFlight(origin)

  const corsHeaders = { ...getCorsHeaders(origin), 'Content-Type': 'application/json' }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Auth — investor must be logged in so we can attribute the intent in HubSpot/CRM
    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '')
    const { data: userData } = await supabase.auth.getUser(jwt!)
    const user = userData?.user
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    const body = await req.json().catch(() => ({}))
    const kind = body.kind as Kind | undefined
    if (!kind || !PACKAGES[kind]) {
      return new Response(JSON.stringify({ error: 'Invalid kind' }), { status: 400, headers: corsHeaders })
    }

    const pkg = PACKAGES[kind]
    const amount_usd = Math.round(Number(body.amount_usd ?? pkg.default_amount_usd))
    if (!Number.isFinite(amount_usd) || amount_usd < pkg.min || amount_usd > pkg.max) {
      return new Response(JSON.stringify({ error: `amount_usd out of range [${pkg.min}, ${pkg.max}]` }), {
        status: 400, headers: corsHeaders,
      })
    }

    const apiKey = Deno.env.get('COINBASE_COMMERCE_API_KEY')
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Coinbase Commerce not configured' }), {
        status: 503, headers: corsHeaders,
      })
    }

    const successUrl = body.success_url ?? `${origin}/fund?status=success&via=coinbase`
    const cancelUrl  = body.cancel_url  ?? `${origin}/fund?status=cancelled&via=coinbase`

    // Coinbase Commerce charge
    const ccRes = await fetch('https://api.commerce.coinbase.com/charges', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CC-Api-Key': apiKey,
        'X-CC-Version': '2018-03-22',
      },
      body: JSON.stringify({
        name: pkg.name,
        description: kind === 'equity_5k'
          ? 'CAUA Corporation pre-seed equity tier ($5K). Subject to subscription agreement.'
          : 'CAUA Corporation B2B sponsorship — funding tech, lots, batches, tastings.',
        pricing_type: 'fixed_price',
        local_price: { amount: amount_usd.toFixed(2), currency: 'USD' },
        metadata: {
          user_id: user.id,
          email: user.email ?? '',
          kind,
        },
        redirect_url: successUrl,
        cancel_url: cancelUrl,
      }),
    })

    if (!ccRes.ok) {
      const errBody = await ccRes.text()
      return new Response(JSON.stringify({ error: 'Coinbase charge failed', details: errBody }), {
        status: 502, headers: corsHeaders,
      })
    }

    const ccData = await ccRes.json()
    const charge = ccData?.data
    if (!charge?.hosted_url || !charge?.id) {
      return new Response(JSON.stringify({ error: 'Coinbase response missing fields' }), {
        status: 502, headers: corsHeaders,
      })
    }

    // Persist intent (best-effort — checkout still works if log fails)
    await supabase.from('investor_charges').insert({
      user_id:        user.id,
      kind,
      amount_usd,
      payment_method: 'coinbase_usdc',
      charge_id:      charge.id,
      charge_code:    charge.code,
      hosted_url:     charge.hosted_url,
      status:         'pending',
      metadata:       { coinbase_pricing: charge.pricing ?? null },
    })

    return new Response(JSON.stringify({
      url:         charge.hosted_url,
      charge_id:   charge.id,
      charge_code: charge.code,
    }), { status: 200, headers: corsHeaders })
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500, headers: corsHeaders,
    })
  }
})
