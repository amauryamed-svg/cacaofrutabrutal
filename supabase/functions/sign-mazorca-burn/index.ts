// EIP-712 server signer for Mazorca → $CACAO redemption.
//
// Flow:
//   1. JWT verify → user_id
//   2. KYC + wallet + geo gate (defense in depth — contract also checks)
//   3. Atomic decrement of user_profiles.mazorcas_balance (via decrement_mazorcas_atomic)
//   4. Insert token_events row with negative mazorcas (audit trail)
//   5. Insert mazorca_redemptions row (status='signed')
//   6. Insert mazorca_burn_nonces row (TTL = deadline)
//   7. Sign EIP-712 typed-data with ORACLE_PRIVATE_KEY (server-only)
//   8. Return { typedData, signature, deadline, nonce } to the frontend
//
// Frontend then calls MazorcaRedemption.claim(...) via wagmi writeContract.
// On expiration without claim, expire_mazorca_redemptions() flips status to 'expired';
// refund-expired-redemption Edge Function refunds idempotently.

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import {
  keccak256,
  toHex,
  encodeAbiParameters,
  type Hex,
} from 'https://esm.sh/viem@2.21.0'
import { privateKeyToAccount } from 'https://esm.sh/viem@2.21.0/accounts'

const supabaseUrl        = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const oraclePk           = (Deno.env.get('ORACLE_PRIVATE_KEY') ?? '') as Hex
const redemptionAddress  = (Deno.env.get('MAZORCA_REDEMPTION_ADDRESS') ?? '').toLowerCase() as Hex
const chainId            = Number(Deno.env.get('WEB3_CHAIN_ID') ?? '8453')
const mazorcasPerToken   = Number(Deno.env.get('MAZORCAS_PER_TOKEN') ?? '1000')
const deadlineSeconds    = Number(Deno.env.get('REDEMPTION_DEADLINE_SECONDS') ?? '604800') // 7 days

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const DOMAIN = {
  name: 'CauaMazorcaRedemption',
  version: '1',
  chainId,
  verifyingContract: redemptionAddress,
} as const

const TYPES = {
  MazorcaBurn: [
    { name: 'user',         type: 'address' },
    { name: 'mazorcaCount', type: 'uint256' },
    { name: 'nonce',        type: 'bytes32' },
    { name: 'deadline',     type: 'uint256' },
  ],
} as const

// ─── Helpers ────────────────────────────────────────────────────────────

async function verifyAuth(authHeader: string): Promise<string> {
  if (!authHeader.startsWith('Bearer ')) throw new Error('missing_bearer')
  const token = authHeader.substring(7)
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) throw new Error('invalid_jwt')
  return user.id
}

function randomNonce(): Hex {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return ('0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')) as Hex
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

// ─── Handler ────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method !== 'POST') return jsonResponse({ error: 'method_not_allowed' }, 405)

  if (!oraclePk || !redemptionAddress) {
    return jsonResponse({ error: 'oracle_not_configured' }, 503)
  }

  const authHeader = req.headers.get('authorization')
  if (!authHeader) return jsonResponse({ error: 'unauthorized' }, 401)

  let userId: string
  try {
    userId = await verifyAuth(authHeader)
  } catch {
    return jsonResponse({ error: 'invalid_jwt' }, 401)
  }

  let body: { mazorca_count?: number }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'invalid_json' }, 400)
  }

  const mazorcaCount = Math.floor(Number(body.mazorca_count ?? 0))
  if (!mazorcaCount || mazorcaCount < mazorcasPerToken) {
    return jsonResponse({ error: 'mazorca_count_too_low', minimum: mazorcasPerToken }, 400)
  }
  if (mazorcaCount % mazorcasPerToken !== 0) {
    return jsonResponse({ error: 'must_be_multiple_of_rate', rate: mazorcasPerToken }, 400)
  }

  // KYC + wallet + geo gate
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('kyc_status, kyc_tier, wallet_address, geo_blocked, mazorcas_balance')
    .eq('user_id', userId)
    .maybeSingle()

  if (!profile)                        return jsonResponse({ error: 'profile_missing' }, 404)
  if (profile.geo_blocked)             return jsonResponse({ error: 'geo_blocked' }, 451)
  if (profile.kyc_status !== 'verified') return jsonResponse({ error: 'kyc_not_verified' }, 403)
  if ((profile.kyc_tier ?? 0) < 1)     return jsonResponse({ error: 'kyc_tier_too_low' }, 403)
  if (!profile.wallet_address)         return jsonResponse({ error: 'wallet_not_linked' }, 400)
  if ((profile.mazorcas_balance ?? 0) < mazorcaCount) {
    return jsonResponse({ error: 'insufficient_mazorcas', balance: profile.mazorcas_balance }, 400)
  }

  // Server-side 30-day cooldown (mirrors on-chain check)
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { count: recent } = await supabase
    .from('mazorca_redemptions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('signed_at', cutoff)
    .in('status', ['signed', 'submitted', 'claimed'])

  if ((recent ?? 0) >= 1) {
    return jsonResponse({ error: 'cooldown_active_30d' }, 429)
  }

  // 1. Atomic balance decrement
  const { data: newBalance, error: decErr } = await supabase
    .rpc('decrement_mazorcas_atomic', { p_user_id: userId, p_amount: mazorcaCount })

  if (decErr) return jsonResponse({ error: 'decrement_failed', detail: decErr.message }, 500)
  if (newBalance == null) return jsonResponse({ error: 'insufficient_mazorcas' }, 400)

  // 2. Audit ledger event (negative mazorcas)
  await supabase.from('token_events').insert({
    user_id: userId,
    event_type: 'mazorca_redemption_burn',
    beans: 0,
    mazorcas: -mazorcaCount,
  })

  // 3-7. Build EIP-712 payload + sign
  const nonce    = randomNonce()
  const deadline = Math.floor(Date.now() / 1000) + deadlineSeconds
  const cacaoAmountWei = (BigInt(mazorcaCount / mazorcasPerToken) * 10n ** 18n).toString()

  const message = {
    user: profile.wallet_address as Hex,
    mazorcaCount: BigInt(mazorcaCount),
    nonce,
    deadline: BigInt(deadline),
  }

  const account = privateKeyToAccount(oraclePk)
  const signature = await account.signTypedData({
    domain: DOMAIN,
    types: TYPES,
    primaryType: 'MazorcaBurn',
    message,
  })

  // 4-5. Insert redemption + nonce
  const { data: redemptionRow, error: redErr } = await supabase
    .from('mazorca_redemptions')
    .insert({
      user_id: userId,
      wallet_address: profile.wallet_address,
      mazorca_count: mazorcaCount,
      cacao_amount_wei: cacaoAmountWei,
      rate_at_sign: mazorcasPerToken,
      nonce,
      deadline: new Date(deadline * 1000).toISOString(),
      signature,
      status: 'signed',
    })
    .select('id')
    .single()

  if (redErr || !redemptionRow) {
    // Refund balance on error to avoid stranding mazorcas.
    await supabase.rpc('refund_mazorcas_atomic', { p_user_id: userId, p_amount: mazorcaCount })
    return jsonResponse({ error: 'redemption_insert_failed', detail: redErr?.message }, 500)
  }

  await supabase.from('mazorca_burn_nonces').insert({
    nonce,
    user_id: userId,
    redemption_id: redemptionRow.id,
    expires_at: new Date(deadline * 1000).toISOString(),
  })

  // Hash for sanity / debugging client-side comparison.
  const burnTypeHash = keccak256(
    toHex('MazorcaBurn(address user,uint256 mazorcaCount,bytes32 nonce,uint256 deadline)')
  )
  const structHash = keccak256(
    encodeAbiParameters(
      [
        { type: 'bytes32' }, { type: 'address' }, { type: 'uint256' },
        { type: 'bytes32' }, { type: 'uint256' },
      ],
      [burnTypeHash, message.user, message.mazorcaCount, message.nonce, message.deadline]
    )
  )

  return jsonResponse({
    ok: true,
    redemption_id: redemptionRow.id,
    typedData: {
      domain: DOMAIN,
      types: TYPES,
      primaryType: 'MazorcaBurn',
      message: {
        user: message.user,
        mazorcaCount: message.mazorcaCount.toString(),
        nonce: message.nonce,
        deadline: message.deadline.toString(),
      },
    },
    signature,
    burn: {
      user: message.user,
      mazorcaCount: message.mazorcaCount.toString(),
      nonce: message.nonce,
      deadline: message.deadline.toString(),
    },
    cacao_amount_wei: cacaoAmountWei,
    new_balance: newBalance,
    struct_hash: structHash,
  })
})
