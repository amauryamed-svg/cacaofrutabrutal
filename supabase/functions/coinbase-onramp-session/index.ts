/**
 * coinbase-onramp-session — issues a short-lived Coinbase Onramp session
 * token for an authenticated user, per CDP security requirements:
 *   https://docs.cdp.coinbase.com/onramp/security-requirements
 *
 * Flow (per CDP CX email 2026-04-28):
 *   1. CORS preflight (strict allowlist via cors-config).
 *   2. Verify Supabase JWT → user_id (memory feedback_supabase_jwt_no_jose).
 *   3. Enforce KYC tier ≥ 1 + wallet linked (CHARTER §I.10 web3 non-negotiables).
 *   4. Generate CDP-side JWT (ES256, kid=CDP_KEY_NAME) signed with CDP API
 *      private key (PEM). [TODO once CDP_API_KEY_NAME + CDP_API_KEY_SECRET
 *      are provisioned in Supabase secrets.]
 *   5. POST https://api.developer.coinbase.com/onramp/v1/token with the
 *      user's wallet address as the destination — server-side, never in URL.
 *   6. Return { session_token, expires_at } to client; wallet address is
 *      NOT echoed in the response URL the client opens.
 *
 * On the client, OnrampButton.tsx asks this Edge Function for a token and
 * opens https://pay.coinbase.com/buy?sessionToken=<token>. Per CDP, the
 * session token carries the addresses + assets in its signed payload, so
 * we never expose wallet addresses as URL params.
 *
 * Status: skeleton. JWT signing + CDP API call are stubbed until the user's
 * Onramp App ID and CDP API key are approved (see docs/cdp-onramp-application-response.md).
 */

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { getCorsHeaders, handleCorsPreFlight } from '../cors-config.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

interface SessionRequest {
  asset?: 'USDC' | 'ETH' | 'CBBTC'
  preset_usd?: number
}

interface ProfileRow {
  kyc_status:        string | null
  kyc_tier:          number | null
  wallet_address:    string | null
  wallet_chain_id:   number | null
  geo_blocked:       boolean | null
  country:           string | null
}

async function verifyAuth(authHeader: string | null): Promise<string> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('missing_or_invalid_auth')
  }
  const token = authHeader.substring(7)
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) throw new Error('invalid_jwt')
  return user.id
}

/**
 * Generate the ES256-signed JWT that authenticates our backend to CDP's
 * Onramp token endpoint. Per https://docs.cdp.coinbase.com/api-v2/docs/cdp-api-keys#generating-a-jwt
 *
 * Required env vars (provision when CDP API key is created):
 *   CDP_API_KEY_NAME    — `organizations/<orgId>/apiKeys/<keyId>`
 *   CDP_API_KEY_SECRET  — PEM-encoded EC private key (P-256). Multi-line.
 *
 * @returns JWT string suitable for Authorization: Bearer <jwt>.
 */
async function generateCdpJwt(_method: string, _host: string, _path: string): Promise<string> {
  const keyName   = Deno.env.get('CDP_API_KEY_NAME')
  const keySecret = Deno.env.get('CDP_API_KEY_SECRET')
  if (!keyName || !keySecret) {
    throw new Error('cdp_api_key_not_configured')
  }
  // TODO(post-CDP-approval): implement ES256 JWT signing using crypto.subtle.
  // Sketch:
  //   const pem = keySecret.replace(/-----.*-----/g, '').replace(/\s+/g, '')
  //   const keyData = Uint8Array.from(atob(pem), c => c.charCodeAt(0))
  //   const key = await crypto.subtle.importKey(
  //     'pkcs8',
  //     keyData,
  //     { name: 'ECDSA', namedCurve: 'P-256' },
  //     false,
  //     ['sign'],
  //   )
  //   const header  = { alg: 'ES256', kid: keyName, typ: 'JWT', nonce: crypto.randomUUID() }
  //   const payload = {
  //     sub: keyName,
  //     iss: 'cdp',
  //     nbf: Math.floor(Date.now() / 1000),
  //     exp: Math.floor(Date.now() / 1000) + 120,
  //     uri: `${_method} ${_host}${_path}`,
  //   }
  //   const enc = new TextEncoder()
  //   const b64 = (s: string) => btoa(s).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
  //   const signingInput = `${b64(JSON.stringify(header))}.${b64(JSON.stringify(payload))}`
  //   const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc.encode(signingInput))
  //   const sigB64 = b64(String.fromCharCode(...new Uint8Array(sig)))
  //   return `${signingInput}.${sigB64}`
  throw new Error('cdp_jwt_signing_not_implemented')
}

serve(async (req) => {
  const origin = req.headers.get('origin') || ''
  if (req.method === 'OPTIONS') return handleCorsPreFlight(origin)
  const cors = { ...getCorsHeaders(origin), 'Content-Type': 'application/json' }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405, headers: cors })
    }

    const userId = await verifyAuth(req.headers.get('authorization'))
    const body: SessionRequest = await req.json().catch(() => ({}))
    const asset = body.asset ?? 'USDC'
    if (!['USDC', 'ETH', 'CBBTC'].includes(asset)) {
      return new Response(JSON.stringify({ error: 'invalid_asset' }), { status: 400, headers: cors })
    }

    // KYC + wallet gate (CHARTER §I.10)
    const { data: profile, error: profErr } = await supabase
      .from('user_profiles')
      .select('kyc_status, kyc_tier, wallet_address, wallet_chain_id, geo_blocked, country')
      .eq('user_id', userId)
      .maybeSingle<ProfileRow>()

    if (profErr || !profile) {
      return new Response(JSON.stringify({ error: 'profile_lookup_failed' }), { status: 500, headers: cors })
    }
    if (profile.geo_blocked) {
      return new Response(JSON.stringify({ error: 'geo_blocked', country: profile.country }), { status: 403, headers: cors })
    }
    if (profile.kyc_status !== 'verified' || (profile.kyc_tier ?? 0) < 1) {
      return new Response(JSON.stringify({ error: 'kyc_required', current_tier: profile.kyc_tier ?? 0 }), { status: 403, headers: cors })
    }
    if (!profile.wallet_address) {
      return new Response(JSON.stringify({ error: 'wallet_link_required' }), { status: 403, headers: cors })
    }

    // Mint short-lived CDP JWT + call Onramp /v1/token.
    let jwt: string
    try {
      jwt = await generateCdpJwt('POST', 'api.developer.coinbase.com', '/onramp/v1/token')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'cdp_jwt_failed'
      return new Response(JSON.stringify({
        error: msg,
        hint: 'CDP API key not yet provisioned — see docs/cdp-onramp-application-response.md and docs/MAINNET_PREP.md §D5.',
      }), { status: 503, headers: cors })
    }

    const tokenRes = await fetch('https://api.developer.coinbase.com/onramp/v1/token', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        addresses: [{ address: profile.wallet_address, blockchains: ['base'] }],
        assets:    [asset],
      }),
    })

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text()
      return new Response(JSON.stringify({
        error: 'cdp_token_request_failed',
        status: tokenRes.status,
        details: errBody,
      }), { status: 502, headers: cors })
    }

    const tokenData = await tokenRes.json() as { token?: string; channel_id?: string }
    if (!tokenData.token) {
      return new Response(JSON.stringify({ error: 'cdp_response_missing_token' }), { status: 502, headers: cors })
    }

    return new Response(JSON.stringify({
      ok: true,
      session_token: tokenData.token,
      // Suggested popup URL — frontend opens this. wallet_address NEVER in URL.
      onramp_url: `https://pay.coinbase.com/buy?sessionToken=${encodeURIComponent(tokenData.token)}${body.preset_usd ? `&presetFiatAmount=${body.preset_usd}` : ''}`,
      asset,
    }), { status: 200, headers: cors })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown_error'
    if (msg === 'missing_or_invalid_auth' || msg === 'invalid_jwt') {
      return new Response(JSON.stringify({ error: msg }), { status: 401, headers: getCorsHeaders(origin) })
    }
    return new Response(JSON.stringify({ error: 'internal_error', detail: msg }), { status: 500, headers: getCorsHeaders(origin) })
  }
})
