// Mint a tree NFT on Base via a server-side relayer (gasless for the user).
//
// Pre-conditions enforced here, NOT delegated to the contract:
//   1. Caller has a verified Supabase JWT.
//   2. Caller owns the requested cacao_trees row.
//   3. Caller has KYC tier >= 1 and a linked wallet_address.
//   4. Caller is not geo-blocked.
//   5. Tree has not already been minted.
//   6. Per-user rate limit: max 1 mint / 24h (prevents Paymaster drain).
//
// Then submits `mintTree(...)` calldata via viem with RELAYER_PRIVATE_KEY.
// (Coinbase CDP Paymaster integration documented as a TODO — drop-in once
// CDP_PAYMASTER_URL + CDP_API_KEY are configured. See docs/WEB3.md.)
//
// On success:
//   - inserts a `tree_mints` row (status=submitted, tx_hash)
//   - the on-chain Transfer event is then picked up by alchemy-nft-webhook,
//     which sets `cacao_trees.nft_token_id` + `owner_wallet`.

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import {
  createWalletClient,
  createPublicClient,
  http,
  keccak256,
  toHex,
  encodeFunctionData,
  type Hex,
} from 'https://esm.sh/viem@2.21.0'
import { base, baseSepolia } from 'https://esm.sh/viem@2.21.0/chains'
import { privateKeyToAccount } from 'https://esm.sh/viem@2.21.0/accounts'

const supabaseUrl        = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const relayerKey         = (Deno.env.get('RELAYER_PRIVATE_KEY') ?? '') as Hex
const contractAddress    = (Deno.env.get('CACAO_TREE_NFT_ADDRESS') ?? '').toLowerCase() as Hex
const chainIdEnv         = Number(Deno.env.get('WEB3_CHAIN_ID') ?? '8453')
const baseRpc            = Deno.env.get('BASE_RPC_URL') ?? 'https://mainnet.base.org'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const chain = chainIdEnv === baseSepolia.id ? baseSepolia : base

// ─── Minimal ABI ────────────────────────────────────────────────────────
const MINT_TREE_ABI = [
  {
    type: 'function',
    name: 'mintTree',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'treeId', type: 'bytes32' },
      { name: 'guardianId', type: 'uint8' },
      { name: 'varietyHash', type: 'bytes32' },
      { name: 'gpsHash', type: 'bytes32' },
    ],
    outputs: [{ name: 'tokenId', type: 'uint256' }],
  },
] as const

const PRIVACY_SALT = Deno.env.get('PRIVACY_SALT') ?? 'caua_default_salt_change_me'

// ─── Helpers ────────────────────────────────────────────────────────────
async function verifyAuth(authHeader: string): Promise<string> {
  if (!authHeader.startsWith('Bearer ')) throw new Error('missing_bearer')
  const token = authHeader.substring(7)
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) throw new Error('invalid_jwt')
  return user.id
}

function uuidToBytes32(uuid: string): Hex {
  return keccak256(toHex(uuid))
}

function gpsHash(lat: number | null, lng: number | null, guardianSalt: string): Hex {
  return keccak256(toHex(`${lat ?? ''},${lng ?? ''},${guardianSalt}${PRIVACY_SALT}`))
}

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

// ─── Handler ────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }
  if (req.method !== 'POST') return jsonResponse({ error: 'method_not_allowed' }, 405)

  if (!relayerKey || !contractAddress) {
    return jsonResponse({ error: 'relayer_not_configured' }, 503)
  }

  const authHeader = req.headers.get('authorization')
  if (!authHeader) return jsonResponse({ error: 'unauthorized' }, 401)

  let userId: string
  try {
    userId = await verifyAuth(authHeader)
  } catch {
    return jsonResponse({ error: 'invalid_jwt' }, 401)
  }

  let body: { tree_id?: string }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'invalid_json' }, 400)
  }

  const treeId = body.tree_id
  if (!treeId) return jsonResponse({ error: 'missing_tree_id' }, 400)

  // 1. Fetch tree + verify ownership + not already minted
  const { data: tree, error: treeErr } = await supabase
    .from('cacao_trees')
    .select('id, user_id, guardian_id, variety, region, nft_token_id, nft_mint_tx')
    .eq('id', treeId)
    .maybeSingle()

  if (treeErr) return jsonResponse({ error: 'tree_query_failed', detail: treeErr.message }, 500)
  if (!tree) return jsonResponse({ error: 'tree_not_found' }, 404)
  if (tree.user_id !== userId) return jsonResponse({ error: 'not_owner' }, 403)
  if (tree.nft_token_id != null || tree.nft_mint_tx) return jsonResponse({ error: 'already_minted' }, 409)

  // 2. KYC + wallet + geo gating
  const { data: profile, error: profErr } = await supabase
    .from('user_profiles')
    .select('kyc_status, kyc_tier, wallet_address, geo_blocked')
    .eq('user_id', userId)
    .maybeSingle()

  if (profErr) return jsonResponse({ error: 'profile_query_failed', detail: profErr.message }, 500)
  if (!profile) return jsonResponse({ error: 'profile_missing' }, 404)
  if (profile.geo_blocked) return jsonResponse({ error: 'geo_blocked' }, 451)
  if (profile.kyc_status !== 'verified') return jsonResponse({ error: 'kyc_not_verified' }, 403)
  if ((profile.kyc_tier ?? 0) < 1) return jsonResponse({ error: 'kyc_tier_too_low' }, 403)
  if (!profile.wallet_address) return jsonResponse({ error: 'wallet_not_linked' }, 400)

  // 3. Per-user 24h rate limit
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count: recentMints } = await supabase
    .from('tree_mints')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', since)
    .in('status', ['pending', 'submitted', 'confirmed'])

  if ((recentMints ?? 0) >= 1) {
    return jsonResponse({ error: 'rate_limited_24h' }, 429)
  }

  // 4. Build calldata
  const treeIdHash    = uuidToBytes32(tree.id)
  const varietyHash   = keccak256(toHex(tree.variety))
  const guardianSalt  = `guardian_${tree.guardian_id}`
  const gpsHashValue  = gpsHash(null, null, guardianSalt) // GPS pulled from a guardian table or env in future

  const calldata = encodeFunctionData({
    abi: MINT_TREE_ABI,
    functionName: 'mintTree',
    args: [
      profile.wallet_address as Hex,
      treeIdHash,
      tree.guardian_id as number,
      varietyHash,
      gpsHashValue,
    ],
  })

  // 5. Insert pending mint row (audit-first)
  const { data: mintRow, error: mintErr } = await supabase
    .from('tree_mints')
    .insert({
      tree_id: tree.id,
      user_id: userId,
      wallet_address: profile.wallet_address,
      chain_id: chain.id,
      contract: contractAddress,
      status: 'pending',
    })
    .select('id')
    .single()

  if (mintErr || !mintRow) {
    return jsonResponse({ error: 'mint_audit_insert_failed', detail: mintErr?.message }, 500)
  }

  // 6. Submit tx via relayer (CDP Paymaster TODO — see docs/WEB3.md)
  // On testnet (non-mainnet), simulate the mint so developers can test the full
  // UX flow without needing a funded relayer or deployed contract.
  const isTestnet = chain.id !== base.id
  if (isTestnet) {
    const simulatedHash = `0xsimulated_${mintRow.id.replace(/-/g, '').slice(0, 40)}` as Hex
    await supabase.from('tree_mints')
      .update({ tx_hash: simulatedHash, status: 'submitted' })
      .eq('id', mintRow.id)
    await supabase.from('cacao_trees')
      .update({
        nft_mint_tx: simulatedHash,
        nft_contract: contractAddress,
        nft_chain_id: chain.id,
        nft_minted_at: new Date().toISOString(),
      })
      .eq('id', tree.id)
    return jsonResponse({
      ok: true,
      tx_hash: simulatedHash,
      chain_id: chain.id,
      contract: contractAddress,
      mint_audit_id: mintRow.id,
      simulated: true,
    })
  }

  try {
    const account = privateKeyToAccount(relayerKey)
    const wallet  = createWalletClient({ account, chain, transport: http(baseRpc) })
    const pub     = createPublicClient({ chain, transport: http(baseRpc) })

    const hash = await wallet.sendTransaction({
      to: contractAddress,
      data: calldata,
    })

    await supabase.from('tree_mints')
      .update({ tx_hash: hash, status: 'submitted' })
      .eq('id', mintRow.id)

    await supabase.from('cacao_trees')
      .update({
        nft_mint_tx: hash,
        nft_contract: contractAddress,
        nft_chain_id: chain.id,
        nft_minted_at: new Date().toISOString(),
      })
      .eq('id', tree.id)

    void pub

    return jsonResponse({
      ok: true,
      tx_hash: hash,
      chain_id: chain.id,
      contract: contractAddress,
      mint_audit_id: mintRow.id,
      explorer: `https://sepolia.basescan.org/tx/${hash}`,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'tx_failed'
    await supabase.from('tree_mints')
      .update({ status: 'failed', error_message: msg })
      .eq('id', mintRow.id)
    return jsonResponse({ error: 'tx_submit_failed', detail: msg }, 500)
  }
})
