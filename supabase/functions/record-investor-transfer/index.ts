// Edge Function: record-investor-transfer
// Registra el intent de transferencia directa (ETH → Bitso/Coinbase wallet) en investor_charges
// para que el equipo CFB verifique on-chain dentro de 24h y formalice la allocación.
//
// Body: {
//   kind: 'equity_5k' | 'b2b_sponsorship',
//   destination: 'cto' | 'ceo',           // a qué wallet se envió
//   amount_usd: number,                   // monto solicitado (paquete)
//   amount_sent_usd: number,              // monto que el investor declara haber enviado
//   tx_hash: string,                      // hash on-chain reportado
//   network?: string,                     // 'ethereum' (default)
//   asset?:   string,                     // 'ETH' (default)
// }
// Returns: { id: uuid, etherscan_url?: string }
//
// Required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreFlight } from '../cors-config.ts'

const PACKAGES = {
  equity_5k:       { min: 5000, max: 5000 },
  b2b_sponsorship: { min: 100,  max: 50000 },
} as const

type Kind = keyof typeof PACKAGES

const ETH_TX_HASH_RE = /^0x[a-fA-F0-9]{64}$/

const ETHERSCAN_URL_BY_NETWORK: Record<string, string> = {
  ethereum: 'https://etherscan.io/tx/',
  polygon:  'https://polygonscan.com/tx/',
  base:     'https://basescan.org/tx/',
}

serve(async (req) => {
  const origin = req.headers.get('origin') || ''
  if (req.method === 'OPTIONS') return handleCorsPreFlight(origin)

  const corsHeaders = { ...getCorsHeaders(origin), 'Content-Type': 'application/json' }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '')
    const { data: userData } = await supabase.auth.getUser(jwt!)
    const user = userData?.user
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    const body = await req.json().catch(() => ({}))
    const kind            = body.kind as Kind | undefined
    const destination     = body.destination as 'cto' | 'ceo' | undefined
    const amount_usd      = Number(body.amount_usd)
    const amount_sent_usd = Number(body.amount_sent_usd)
    const tx_hash         = String(body.tx_hash || '').trim()
    const network         = String(body.network || 'ethereum').toLowerCase()
    const asset           = String(body.asset   || 'ETH').toUpperCase()

    if (!kind || !PACKAGES[kind]) {
      return new Response(JSON.stringify({ error: 'Invalid kind' }), { status: 400, headers: corsHeaders })
    }
    if (destination !== 'cto' && destination !== 'ceo') {
      return new Response(JSON.stringify({ error: 'destination must be cto or ceo' }), { status: 400, headers: corsHeaders })
    }
    const pkg = PACKAGES[kind]
    if (!Number.isFinite(amount_usd) || amount_usd < pkg.min || amount_usd > pkg.max) {
      return new Response(JSON.stringify({ error: `amount_usd out of range [${pkg.min}, ${pkg.max}]` }), { status: 400, headers: corsHeaders })
    }
    if (!Number.isFinite(amount_sent_usd) || amount_sent_usd <= 0) {
      return new Response(JSON.stringify({ error: 'amount_sent_usd required' }), { status: 400, headers: corsHeaders })
    }
    if (!ETH_TX_HASH_RE.test(tx_hash)) {
      return new Response(JSON.stringify({ error: 'tx_hash must be 0x + 64 hex chars' }), { status: 400, headers: corsHeaders })
    }

    // Insert intent — service_role bypasses RLS
    const { data, error } = await supabase
      .from('investor_charges')
      .insert({
        user_id:         user.id,
        kind,
        amount_usd,
        amount_sent_usd,
        payment_method:  'eth_direct',
        destination,
        tx_hash,
        network,
        asset,
        status:          'pending',
        metadata: {
          email:        user.email ?? '',
          submitted_at: new Date().toISOString(),
        },
      })
      .select('id')
      .single()

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
    }

    const etherscanBase = ETHERSCAN_URL_BY_NETWORK[network]
    return new Response(JSON.stringify({
      id: data.id,
      etherscan_url: etherscanBase ? `${etherscanBase}${tx_hash}` : undefined,
    }), { status: 200, headers: corsHeaders })
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500, headers: corsHeaders,
    })
  }
})
