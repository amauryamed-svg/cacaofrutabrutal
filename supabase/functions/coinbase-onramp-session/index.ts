/**
 * coinbase-onramp-session — issues a short-lived Coinbase Onramp session
 * token for an authenticated user, per CDP security requirements:
 *   https://docs.cdp.coinbase.com/onramp/security-requirements
 *
 * Flow (per CDP CX email 2026-04-28):
 *   1. CORS preflight (strict allowlist via cors-config).
 *   2. Verify Supabase JWT → user_id (memory feedback_supabase_jwt_no_jose).
 *   3. Enforce KYC tier ≥ 1 + wallet linked (CHARTER §I.10 web3 non-negotiables).
 *   4. Generate CDP-side JWT signed with CDP API private key. Two key formats
 *      are auto-detected:
 *        a) Legacy ES256 — PEM-wrapped EC P-256 private key (PKCS8 or SEC1).
 *           kid = `organizations/<org>/apiKeys/<id>`.
 *        b) Current EdDSA — base64-encoded 64-byte (or 32-byte seed)
 *           Ed25519 secret. kid = the UUID `id` field from the CDP JSON.
 *      Native Web Crypto only — no jose dep (memory feedback_supabase_jwt_no_jose).
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
 * Env vars (set as Supabase Edge Function secrets):
 *   CDP_API_KEY_NAME   — UUID id (new Ed25519 keys) OR `organizations/...`
 *                        path (legacy ECDSA keys). Matches what the CDP
 *                        portal puts in the JSON's `id` / `name` field.
 *   CDP_API_KEY_SECRET — Either a PEM block (legacy) or base64 raw bytes
 *                        (new). Auto-detected at sign time.
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

// ─── ES256 JWT signing helpers (native Web Crypto) ──────────────────────────

/** base64url encode bytes (no padding). */
function b64url(bytes: Uint8Array): string {
  let s = ''
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i])
  return btoa(s).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function bytesToHex(bytes: Uint8Array): string {
  let h = ''
  for (let i = 0; i < bytes.length; i++) h += bytes[i].toString(16).padStart(2, '0')
  return h
}

function concatBytes(arrs: Uint8Array[]): Uint8Array {
  let total = 0
  for (const a of arrs) total += a.length
  const out = new Uint8Array(total)
  let off = 0
  for (const a of arrs) { out.set(a, off); off += a.length }
  return out
}

/** ASN.1 DER tag-length prefix (length up to 65535). */
function tlPrefix(tag: number, length: number): Uint8Array {
  if (length < 0x80) return new Uint8Array([tag, length])
  if (length < 0x100) return new Uint8Array([tag, 0x81, length])
  if (length < 0x10000) return new Uint8Array([tag, 0x82, length >> 8, length & 0xff])
  throw new Error('cdp_pkcs8_length_overflow')
}

/**
 * Wrap a SEC1 EC private key (P-256) into PKCS8 so Web Crypto can import it.
 * Coinbase CDP exports PEM in either format; Web Crypto only accepts PKCS8.
 *
 *   PrivateKeyInfo ::= SEQUENCE {
 *     version           INTEGER (0),
 *     algorithm         AlgorithmIdentifier (id-ecPublicKey + secp256r1),
 *     privateKey        OCTET STRING (containing the SEC1 ECPrivateKey)
 *   }
 */
function wrapSec1IntoPkcs8P256(sec1: Uint8Array): Uint8Array {
  const version = new Uint8Array([0x02, 0x01, 0x00])
  const algId = new Uint8Array([
    0x30, 0x13,
    0x06, 0x07, 0x2A, 0x86, 0x48, 0xCE, 0x3D, 0x02, 0x01,
    0x06, 0x08, 0x2A, 0x86, 0x48, 0xCE, 0x3D, 0x03, 0x01, 0x07,
  ])
  const octet = concatBytes([tlPrefix(0x04, sec1.length), sec1])
  const body  = concatBytes([version, algId, octet])
  return concatBytes([tlPrefix(0x30, body.length), body])
}

function pemToDer(pem: string): { format: 'pkcs8' | 'sec1', der: Uint8Array } {
  const isSec1 = /-----BEGIN EC PRIVATE KEY-----/.test(pem)
  const isPkcs8 = /-----BEGIN PRIVATE KEY-----/.test(pem)
  if (!isSec1 && !isPkcs8) throw new Error('cdp_key_format_unsupported')
  const stripped = pem
    .replace(/-----BEGIN [A-Z ]+-----/g, '')
    .replace(/-----END [A-Z ]+-----/g, '')
    .replace(/\s+/g, '')
  const der = Uint8Array.from(atob(stripped), c => c.charCodeAt(0))
  return { format: isPkcs8 ? 'pkcs8' : 'sec1', der }
}

/** Looks like a PEM-wrapped ECDSA P-256 key (legacy CDP format)? */
function looksLikePem(secret: string): boolean {
  return /-----BEGIN [A-Z ]+PRIVATE KEY-----/.test(secret)
}

/**
 * Decode the new CDP base64 Ed25519 secret to its 32-byte seed.
 *
 * The CDP portal (post-2025) issues keys whose `privateKey` is base64 of
 * either 32 raw seed bytes, or 64 bytes in libsodium "expanded" format
 * (32-byte seed concatenated with 32-byte public key). We slice down to
 * the 32-byte seed for Web Crypto's Ed25519 import (which then has to be
 * wrapped into PKCS8 — see `wrapEd25519SeedToPkcs8`).
 */
function decodeEd25519Seed(secret: string): Uint8Array {
  const trimmed = secret.replace(/\s+/g, '')
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(trimmed)) {
    throw new Error('cdp_key_format_unsupported')
  }
  const decoded = Uint8Array.from(atob(trimmed), c => c.charCodeAt(0))
  if (decoded.length === 32) return decoded
  if (decoded.length === 64) return decoded.slice(0, 32)
  throw new Error('cdp_key_format_unsupported')
}

/**
 * Wrap a raw 32-byte Ed25519 seed into PKCS8 format (RFC 8410).
 *
 * Web Crypto's `importKey('raw', ..., { name: 'Ed25519' })` only accepts
 * PUBLIC keys (32-byte point). For PRIVATE keys the format MUST be
 * `pkcs8`, otherwise importKey throws "Invalid key usage" because the
 * resulting key can't carry a `sign` permission.
 *
 * The PKCS8 envelope for Ed25519 is fixed-size (48 bytes) per RFC 8410 §7:
 *
 *   PrivateKeyInfo SEQUENCE (46 bytes inner):
 *     INTEGER 0                              -- version
 *     AlgorithmIdentifier SEQUENCE (5 bytes):
 *       OID 1.3.101.112                     -- id-Ed25519
 *     OCTET STRING (34 bytes):
 *       OCTET STRING (32 bytes):            -- CurvePrivateKey
 *         <seed>
 */
function wrapEd25519SeedToPkcs8(seed: Uint8Array): Uint8Array {
  if (seed.length !== 32) throw new Error('cdp_key_format_unsupported')
  const out = new Uint8Array(48)
  out.set([
    0x30, 0x2e,                              // SEQUENCE, len 46
    0x02, 0x01, 0x00,                        // INTEGER 0
    0x30, 0x05,                              // SEQUENCE, len 5 (algorithm)
    0x06, 0x03, 0x2b, 0x65, 0x70,            // OID 1.3.101.112 (Ed25519)
    0x04, 0x22,                              // OCTET STRING, len 34
    0x04, 0x20,                              // inner OCTET STRING, len 32
  ], 0)
  out.set(seed, 16)
  return out
}

/**
 * Build the canonical JWT body shared by both signing paths.
 *
 *   header  = { alg, kid, typ: 'JWT', nonce: <hex16> }
 *   payload = { sub: kid, iss: 'cdp', uris: ['<METHOD> <host><path>'], iat, nbf, exp }
 *
 * Mirrors `cdp-sdk/typescript/src/auth/utils/jwt.ts`. Returns the
 * signing-input string ("<b64header>.<b64payload>") so the algorithm-
 * specific code only needs to do the signature step.
 */
function buildJwtSigningInput(alg: 'ES256' | 'EdDSA', kid: string, method: string, host: string, path: string): string {
  const nonce = bytesToHex(crypto.getRandomValues(new Uint8Array(16)))
  const now   = Math.floor(Date.now() / 1000)

  const header = { alg, kid, typ: 'JWT', nonce }
  const payload = {
    sub:  kid,
    iss:  'cdp',
    uris: [`${method} ${host}${path}`],
    iat:  now,
    nbf:  now,
    exp:  now + 120,
  }
  const enc = new TextEncoder()
  return `${b64url(enc.encode(JSON.stringify(header)))}.${b64url(enc.encode(JSON.stringify(payload)))}`
}

/** Legacy ECDSA-P256 path. Used when the secret is PEM-wrapped. */
async function signEs256(keyName: string, pemSecret: string, method: string, host: string, path: string): Promise<string> {
  const { format, der } = pemToDer(pemSecret)
  const pkcs8 = format === 'pkcs8' ? der : wrapSec1IntoPkcs8P256(der)

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    pkcs8,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  )

  const signingInput = buildJwtSigningInput('ES256', keyName, method, host, path)
  // ECDSA via Web Crypto returns raw r||s (64 bytes for P-256) — exactly
  // what JWT ES256 expects, no DER unwrap needed.
  const sigBuf = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    cryptoKey,
    new TextEncoder().encode(signingInput),
  )
  return `${signingInput}.${b64url(new Uint8Array(sigBuf))}`
}

/**
 * Current Ed25519 path. Used when the secret is base64-encoded raw bytes
 * (the format the CDP portal hands out as of 2025+).
 *
 * Web Crypto Ed25519 (Deno ≥ 1.40, Supabase Edge Functions runtime) requires
 * the 32-byte seed wrapped in PKCS8 for private-key import — `'raw'` import
 * only accepts public keys and would fail with "Invalid key usage" when
 * asking for `sign` permission. See `wrapEd25519SeedToPkcs8` for the
 * RFC 8410 envelope shape.
 *
 * `kid = keyName` for new keys is the UUID `id` field of the CDP JSON;
 * the Onramp verifier resolves the org+key from that UUID.
 */
async function signEdDsa(keyName: string, base64Secret: string, method: string, host: string, path: string): Promise<string> {
  const seed  = decodeEd25519Seed(base64Secret)
  const pkcs8 = wrapEd25519SeedToPkcs8(seed)

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    pkcs8,
    { name: 'Ed25519' },
    false,
    ['sign'],
  )

  const signingInput = buildJwtSigningInput('EdDSA', keyName, method, host, path)
  const sigBuf = await crypto.subtle.sign(
    'Ed25519',
    cryptoKey,
    new TextEncoder().encode(signingInput),
  )
  return `${signingInput}.${b64url(new Uint8Array(sigBuf))}`
}

/**
 * Auto-detect key format and dispatch to the right signing routine.
 * PEM → ES256. Base64 raw bytes → EdDSA.
 */
async function generateCdpJwt(method: string, host: string, path: string): Promise<string> {
  const keyName   = Deno.env.get('CDP_API_KEY_NAME')
  const keySecret = Deno.env.get('CDP_API_KEY_SECRET')
  if (!keyName || !keySecret) throw new Error('cdp_api_key_not_configured')

  return looksLikePem(keySecret)
    ? signEs256(keyName, keySecret, method, host, path)
    : signEdDsa(keyName, keySecret, method, host, path)
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
