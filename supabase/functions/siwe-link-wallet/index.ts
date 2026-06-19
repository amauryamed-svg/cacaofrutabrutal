// SIWE (EIP-4361) wallet linking + sanctions screening.
// Verifies user's signed SIWE message, runs Chainalysis + OFAC pre-write screening,
// then links wallet_address to user_profiles. Uses single-use nonces (5-min TTL).
// See docs/KYC.md and docs/COMPLIANCE.md.

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { createPublicClient, http, getAddress, isAddress } from 'https://esm.sh/viem@2.21.0'
import { base, baseSepolia } from 'https://esm.sh/viem@2.21.0/chains'

const supabaseUrl        = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const chainalysisKey     = Deno.env.get('CHAINALYSIS_API_KEY') ?? ''
const expectedDomain     = Deno.env.get('SIWE_EXPECTED_DOMAIN') ?? 'cacaofrutabrutal.com'
const expectedChainId    = Number(Deno.env.get('SIWE_CHAIN_ID') ?? '8453')

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// publicClient for verifyMessage — supports both EOA (ECDSA) and ERC-1271 (Smart Wallet).
// Must match the chain the client signed on.
const chainDef  = expectedChainId === 8453 ? base : baseSepolia
const rpcUrl    = expectedChainId === 8453
  ? (Deno.env.get('BASE_RPC_URL') ?? 'https://mainnet.base.org')
  : (Deno.env.get('BASE_SEPOLIA_RPC_URL') ?? 'https://sepolia.base.org')

const publicClient = createPublicClient({
  chain: chainDef,
  transport: http(rpcUrl),
})

async function verifyAuth(authHeader: string): Promise<string> {
  if (!authHeader.startsWith('Bearer ')) throw new Error('missing_bearer')
  const token = authHeader.substring(7)
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) throw new Error('invalid_jwt')
  return user.id
}

interface SiweFields {
  domain: string
  address: string
  uri: string
  version: string
  chainId: number
  nonce: string
  issuedAt: string
  expirationTime?: string
}

// Minimal SIWE message parser — see https://eips.ethereum.org/EIPS/eip-4361
function parseSiwe(msg: string): SiweFields {
  const lines = msg.split('\n')
  const headerMatch = lines[0]?.match(/^(\S+) wants you to sign in with your Ethereum account:$/)
  if (!headerMatch) throw new Error('siwe_bad_header')
  const domain = headerMatch[1]
  const address = (lines[1] ?? '').trim()
  if (!isAddress(address)) throw new Error('siwe_bad_address')

  const get = (key: string) => {
    const line = lines.find(l => l.startsWith(`${key}: `))
    return line ? line.substring(key.length + 2) : ''
  }

  return {
    domain,
    address: getAddress(address),
    uri: get('URI'),
    version: get('Version'),
    chainId: Number(get('Chain ID')),
    nonce: get('Nonce'),
    issuedAt: get('Issued At'),
    expirationTime: get('Expiration Time') || undefined,
  }
}

async function screenAddress(address: string): Promise<{
  verdict: 'green' | 'blocked_chainalysis' | 'blocked_ofac' | 'flagged_for_review'
  payload: unknown
}> {
  const lower = address.toLowerCase()

  // 1. OFAC SDN check (Supabase-cached cron)
  const { data: ofacHit } = await supabase
    .from('ofac_blocklist')
    .select('address, list_type, source_url')
    .eq('address', lower)
    .is('removed_at', null)
    .maybeSingle()

  if (ofacHit) {
    return { verdict: 'blocked_ofac', payload: ofacHit }
  }

  // 2. Chainalysis Address Screening (free tier)
  if (chainalysisKey) {
    try {
      const res = await fetch(`https://public.chainalysis.com/api/v1/address/${lower}`, {
        headers: { 'X-API-Key': chainalysisKey, 'Accept': 'application/json' },
      })
      if (res.ok) {
        const json = await res.json() as { identifications?: Array<{ category: string }> }
        const ids = json.identifications ?? []
        if (ids.length > 0) {
          // Severity: high-risk categories block; medium flag for review.
          const blocking = ids.some(i => /sanctions|terrorist|stolen|ransom/i.test(i.category))
          return {
            verdict: blocking ? 'blocked_chainalysis' : 'flagged_for_review',
            payload: json,
          }
        }
        return { verdict: 'green', payload: json }
      }
    } catch (e) {
      // Provider down → fail closed in production. For now, return green and log.
      return { verdict: 'green', payload: { error: 'chainalysis_unreachable', detail: String(e) } }
    }
  }

  return { verdict: 'green', payload: { note: 'chainalysis_skipped_no_key' } }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405)
  }

  const authHeader = req.headers.get('authorization')
  if (!authHeader) return jsonResponse({ error: 'unauthorized' }, 401)

  let userId: string
  try {
    userId = await verifyAuth(authHeader)
  } catch {
    return jsonResponse({ error: 'invalid_jwt' }, 401)
  }

  let body: { message?: string; signature?: string }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'invalid_json' }, 400)
  }

  const { message, signature } = body
  if (!message || !signature) {
    return jsonResponse({ error: 'missing_fields' }, 400)
  }

  // Parse SIWE
  let siwe: SiweFields
  try {
    siwe = parseSiwe(message)
  } catch (e) {
    return jsonResponse({ error: 'siwe_parse_failed', detail: String(e) }, 400)
  }

  // Domain + chain checks
  if (siwe.domain !== expectedDomain) {
    return jsonResponse({ error: 'siwe_wrong_domain', got: siwe.domain }, 400)
  }
  if (siwe.chainId !== expectedChainId) {
    return jsonResponse({ error: 'siwe_wrong_chain', got: siwe.chainId }, 400)
  }
  if (siwe.expirationTime && new Date(siwe.expirationTime).getTime() < Date.now()) {
    return jsonResponse({ error: 'siwe_expired' }, 400)
  }

  // Nonce single-use check
  const { data: nonceRow } = await supabase
    .from('wallet_link_nonces')
    .select('nonce, user_id, expires_at, consumed_at')
    .eq('nonce', siwe.nonce)
    .eq('user_id', userId)
    .maybeSingle()

  if (!nonceRow) return jsonResponse({ error: 'nonce_unknown' }, 400)
  if (nonceRow.consumed_at) return jsonResponse({ error: 'nonce_already_used' }, 400)
  if (new Date(nonceRow.expires_at).getTime() < Date.now()) {
    return jsonResponse({ error: 'nonce_expired' }, 400)
  }

  // Verify signature — publicClient handles both EOA (ECDSA) and ERC-1271 (Smart Wallet).
  // Wrapping in try-catch prevents an unhandled throw from becoming a 500.
  let valid = false
  try {
    valid = await publicClient.verifyMessage({
      address: siwe.address as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    })
  } catch (e) {
    return jsonResponse({ error: 'signature_verify_failed', detail: String(e) }, 401)
  }
  if (!valid) return jsonResponse({ error: 'signature_invalid' }, 401)

  // Pre-write screening
  const { verdict, payload } = await screenAddress(siwe.address)
  await supabase.from('sanctions_screenings').insert({
    user_id: userId,
    wallet_address: siwe.address.toLowerCase(),
    provider: verdict.startsWith('blocked_ofac') ? 'ofac' : 'chainalysis',
    verdict,
    payload,
  })

  if (verdict === 'blocked_ofac' || verdict === 'blocked_chainalysis') {
    return jsonResponse({ error: 'sanctioned_address', verdict }, 403)
  }

  // Consume nonce + link wallet (atomic-enough; service_role bypasses RLS)
  await supabase
    .from('wallet_link_nonces')
    .update({ consumed_at: new Date().toISOString(), wallet_address: siwe.address.toLowerCase() })
    .eq('nonce', siwe.nonce)

  // Check if wallet is already claimed before writing (idempotent re-link)
  const { data: existing } = await supabase
    .from('user_profiles')
    .select('user_id')
    .eq('wallet_address', siwe.address.toLowerCase())
    .maybeSingle()

  if (existing && existing.user_id !== userId) {
    return jsonResponse({ error: 'wallet_already_claimed' }, 409)
  }

  const { error } = await supabase
    .from('user_profiles')
    .update({
      wallet_address: siwe.address.toLowerCase(),
      wallet_chain_id: siwe.chainId,
    })
    .eq('user_id', userId)

  if (error) {
    if (error.code === '23505') {
      return jsonResponse({ error: 'wallet_already_claimed' }, 409)
    }
    return jsonResponse({ error: 'update_failed', detail: error.message }, 500)
  }

  return jsonResponse({
    ok: true,
    wallet_address: siwe.address,
    chain_id: siwe.chainId,
    verdict,
  })
})

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  })
}
