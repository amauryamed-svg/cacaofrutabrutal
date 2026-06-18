// Mint the "Caua Creyente · Cohorte 01 · Lote 2025" NFT on Base Sepolia after
// a verified Drop purchase (drop_purchases.status = 'paid').
//
// Spec: integrations/social/specs/CAUA-CACAO-DROP.md §3 (NFT asset)
//        integrations/social/specs/GOLDEN-TICKET.md   §3 (separate Golden
//        Ticket NFT — minted by `evaluate-golden-tickets`, not here)
//
// Subordinated to docs/CHARTER.md §I (audit-pending mainnet) and CauaCore §10:
//   1. Caller is either (a) cron via x-cron-secret OR (b) a founder JWT.
//   2. drop_purchases row exists and has status='paid'.
//   3. Buyer has KYC verified (kyc_verified_at IS NOT NULL) and a linked
//      wallet_address. No KYC → 403, Charter §I.6 enforcement.
//   4. Buyer has not already minted in this cohort (onchain `hasMintedCohort01`
//      view + DB-side `nft_mints` row check). Both SKUs by same buyer →
//      upgrade variant to 'both' via `upgradeBelieverVariant`.
//   5. Cohort is Base Sepolia only (chain id 84532). Mainnet is gated by
//      Charter §I; any 8453 deploy requires audit sign-off.
//
// On success:
//   - Generates metadata JSON, pins to IPFS via Pinata (or TODO stub if env
//     not configured).
//   - Calls `mintToBeliever(recipient, tokenURI, variant)` via the relayer.
//   - Inserts an `nft_mints` row (audit-first, status='submitted', tx_hash).
//   - Queues a `golden-ticket-minted` lifecycle email row (separate agent
//     consumes it).

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import {
  createWalletClient,
  createPublicClient,
  http,
  encodeFunctionData,
  type Hex,
} from 'https://esm.sh/viem@2.21.0'
import { baseSepolia } from 'https://esm.sh/viem@2.21.0/chains'
import { privateKeyToAccount } from 'https://esm.sh/viem@2.21.0/accounts'

// ─── Env ────────────────────────────────────────────────────────────────
const supabaseUrl        = Deno.env.get('SUPABASE_URL')!
const supabaseAnonKey    = Deno.env.get('SUPABASE_ANON_KEY')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const relayerKey         = (Deno.env.get('RELAYER_PRIVATE_KEY') ?? '') as Hex
const contractAddress    = (Deno.env.get('CAUA_CREYENTES_COHORT01_ADDRESS') ?? '').toLowerCase() as Hex
const baseSepoliaRpc     = Deno.env.get('BASE_SEPOLIA_RPC_URL') ?? 'https://sepolia.base.org'
const cronSecret         = (Deno.env.get('COHORT_MINT_CRON_SECRET') ?? '').trim()
const pinataJwt          = (Deno.env.get('IPFS_PINATA_KEY') ?? '').trim()

// Chain hard-pinned to Base Sepolia — Charter §I audit-pending guard.
const CHAIN = baseSepolia
const EXPECTED_CHAIN_ID = 84532

// ─── ABI ────────────────────────────────────────────────────────────────
const COHORT_ABI = [
  {
    type: 'function',
    name: 'mintToBeliever',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'uri',       type: 'string'  },
      { name: 'variant',   type: 'string'  },
    ],
    outputs: [{ name: 'tokenId', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'upgradeBelieverVariant',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'variant', type: 'string'  },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'hasMintedCohort01',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'remainingSupply',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

// ─── Clients ────────────────────────────────────────────────────────────
const admin = createClient(supabaseUrl, supabaseServiceKey)

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-cron-secret, x-client-info, apikey, content-type',
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  })
}

// ─── Auth: cron-secret OR founder-JWT ───────────────────────────────────
async function authorize(req: Request): Promise<{ mode: 'cron' | 'founder'; userId?: string } | Response> {
  const cronHeader = req.headers.get('x-cron-secret') ?? ''
  if (cronSecret && cronHeader === cronSecret) return { mode: 'cron' }

  const auth = req.headers.get('authorization') ?? ''
  const jwt = auth.replace(/^Bearer\s+/i, '').trim()
  if (!jwt) return jsonResponse({ error: 'missing_auth' }, 401)

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  })
  const { data: userResp, error } = await userClient.auth.getUser()
  if (error || !userResp.user) return jsonResponse({ error: 'invalid_jwt' }, 401)

  const { data: founderCheck } = await admin.rpc('is_founder_cached', { user_uuid: userResp.user.id })
  if (!founderCheck) return jsonResponse({ error: 'forbidden_not_founder' }, 403)

  return { mode: 'founder', userId: userResp.user.id }
}

// ─── IPFS pinning (Pinata) ──────────────────────────────────────────────
async function pinJsonToIpfs(metadata: Record<string, unknown>, name: string): Promise<string> {
  if (!pinataJwt) {
    // TODO(infra): wire IPFS_PINATA_KEY (JWT). For now, fall back to a
    // deterministic data URI so the chain call still succeeds in dev/staging.
    const fallback = `data:application/json;base64,${btoa(JSON.stringify(metadata))}`
    console.warn('[mint-cohort-nft] IPFS_PINATA_KEY missing — using data URI fallback')
    return fallback
  }
  const resp = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${pinataJwt}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      pinataMetadata: { name },
      pinataContent:  metadata,
    }),
  })
  if (!resp.ok) {
    const txt = await resp.text()
    throw new Error(`pinata_failed_${resp.status}: ${txt.slice(0, 200)}`)
  }
  const json = await resp.json() as { IpfsHash?: string }
  if (!json.IpfsHash) throw new Error('pinata_missing_hash')
  return `ipfs://${json.IpfsHash}`
}

// ─── Metadata builder ───────────────────────────────────────────────────
function buildMetadata(opts: {
  tokenIndex: number      // 1..20 for display (#X). Best-effort; on-chain id is canonical.
  variant: 'mucilago' | 'bean' | 'both'
}): Record<string, unknown> {
  const variantDisplay =
    opts.variant === 'mucilago' ? 'Mucílago'
    : opts.variant === 'bean'   ? 'Bean'
    : 'Both'

  return {
    name: `Caua Creyente · Cohorte 01 · #${String(opts.tokenIndex).padStart(3, '0')}`,
    description: 'First believer. Lote 2025 With Nature We Walk.',
    image: `ipfs://Qm-PLACEHOLDER-COHORT01/${opts.tokenIndex}.png`, // TODO: real CID per token
    attributes: [
      { trait_type: 'Cohort',          value: '01' },
      { trait_type: 'Lote',            value: '2025' },
      { trait_type: 'Variant',         value: variantDisplay },
      { trait_type: 'Workshop Access', value: 'true' },
    ],
  }
}

// ─── Handler ────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }
  if (req.method !== 'POST') return jsonResponse({ error: 'method_not_allowed' }, 405)

  // Charter §I.3 guard — never run against an unaudited chain id.
  if (CHAIN.id !== EXPECTED_CHAIN_ID) {
    return jsonResponse({ error: 'chain_misconfigured', expected: EXPECTED_CHAIN_ID }, 503)
  }
  if (!relayerKey || !contractAddress) {
    return jsonResponse({ error: 'relayer_not_configured' }, 503)
  }

  const authResult = await authorize(req)
  if (authResult instanceof Response) return authResult

  let body: { drop_purchase_id?: string }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'invalid_json' }, 400)
  }
  const dropPurchaseId = body.drop_purchase_id
  if (!dropPurchaseId) return jsonResponse({ error: 'missing_drop_purchase_id' }, 400)

  // 1. Fetch the Drop purchase row.
  const { data: purchase, error: pErr } = await admin
    .from('drop_purchases')
    .select('id, user_id, cohort_id, sku, status, paid_at')
    .eq('id', dropPurchaseId)
    .maybeSingle()

  if (pErr) return jsonResponse({ error: 'purchase_query_failed', detail: pErr.message }, 500)
  if (!purchase) return jsonResponse({ error: 'purchase_not_found' }, 404)
  if (purchase.status !== 'paid') return jsonResponse({ error: 'purchase_not_paid', status: purchase.status }, 409)
  if (purchase.cohort_id !== 1) return jsonResponse({ error: 'wrong_cohort', cohort_id: purchase.cohort_id }, 400)

  // 2. KYC + wallet gating — Charter §I.6.
  const { data: profile, error: profErr } = await admin
    .from('user_profiles')
    .select('user_id, kyc_status, kyc_verified_at, wallet_address, geo_blocked, email')
    .eq('user_id', purchase.user_id)
    .maybeSingle()

  if (profErr) return jsonResponse({ error: 'profile_query_failed', detail: profErr.message }, 500)
  if (!profile) return jsonResponse({ error: 'profile_missing' }, 404)
  if (profile.geo_blocked) return jsonResponse({ error: 'geo_blocked' }, 451)
  if (!profile.kyc_verified_at) return jsonResponse({ error: 'kyc_not_verified' }, 403)
  if (profile.kyc_status && profile.kyc_status !== 'verified') {
    return jsonResponse({ error: 'kyc_not_verified', status: profile.kyc_status }, 403)
  }
  if (!profile.wallet_address) return jsonResponse({ error: 'wallet_not_linked' }, 400)

  const wallet = profile.wallet_address as Hex

  // 3. Idempotency: check `nft_mints` first (DB authoritative), then onchain.
  //    See SQL stub in agent report for the `nft_mints` table.
  const { data: existingMint } = await admin
    .from('nft_mints')
    .select('id, token_id, tx_hash, variant, status')
    .eq('contract', contractAddress)
    .eq('wallet_address', wallet.toLowerCase())
    .maybeSingle()

  const pub = createPublicClient({ chain: CHAIN, transport: http(baseSepoliaRpc) })

  // Cross-check on-chain.
  let alreadyMintedOnchain = false
  try {
    alreadyMintedOnchain = (await pub.readContract({
      address: contractAddress,
      abi: COHORT_ABI,
      functionName: 'hasMintedCohort01',
      args: [wallet],
    })) as boolean
  } catch (e) {
    return jsonResponse({ error: 'chain_read_failed', detail: (e as Error).message }, 502)
  }

  // 4. Determine variant. If the buyer already has a token, this purchase
  //    upgrades them to 'both' (Drop spec §3 attribute: Mucílago | Bean | Both).
  const purchasedSku = purchase.sku as 'mucilago' | 'bean'
  let variant: 'mucilago' | 'bean' | 'both' = purchasedSku
  const isUpgrade = alreadyMintedOnchain || !!existingMint
  if (isUpgrade) {
    if (existingMint?.variant && existingMint.variant !== purchasedSku) {
      variant = 'both'
    } else if (existingMint?.variant === purchasedSku) {
      // Same SKU re-mint attempt — refuse.
      return jsonResponse({
        ok: true,
        skipped: 'already_minted_same_sku',
        token_id: existingMint?.token_id,
        tx_hash: existingMint?.tx_hash,
      })
    } else {
      // Onchain says minted but no DB row → conservative: refuse and require
      // manual reconciliation.
      return jsonResponse({ error: 'onchain_db_drift_reconcile' }, 409)
    }
  }

  // 5. Build + pin metadata.
  // Token index for display: in the upgrade path use the existing token id;
  // otherwise estimate from on-chain remainingSupply.
  let tokenIndex: number
  if (isUpgrade && existingMint?.token_id) {
    tokenIndex = existingMint.token_id
  } else {
    try {
      const remaining = (await pub.readContract({
        address: contractAddress,
        abi: COHORT_ABI,
        functionName: 'remainingSupply',
      })) as bigint
      tokenIndex = 20 - Number(remaining) + 1
    } catch {
      tokenIndex = 0 // fallback; metadata can be re-pinned later via setTokenURI
    }
  }

  const metadata = buildMetadata({ tokenIndex, variant })
  let tokenUri: string
  try {
    tokenUri = await pinJsonToIpfs(metadata, `caua-cohort01-${wallet.toLowerCase()}.json`)
  } catch (e) {
    return jsonResponse({ error: 'ipfs_pin_failed', detail: (e as Error).message }, 502)
  }

  // 6. Insert audit row first (status='pending').
  const { data: mintRow, error: mintErr } = await admin
    .from('nft_mints')
    .insert({
      cohort_id:      1,
      drop_purchase_id: purchase.id,
      user_id:        purchase.user_id,
      wallet_address: wallet.toLowerCase(),
      contract:       contractAddress,
      chain_id:       CHAIN.id,
      variant:        variant,
      token_uri:      tokenUri,
      status:         'pending',
      is_upgrade:     isUpgrade,
    })
    .select('id')
    .single()

  if (mintErr || !mintRow) {
    return jsonResponse({ error: 'mint_audit_insert_failed', detail: mintErr?.message }, 500)
  }

  // 7. Submit tx via relayer.
  try {
    const account = privateKeyToAccount(relayerKey)
    const walletClient = createWalletClient({ account, chain: CHAIN, transport: http(baseSepoliaRpc) })

    const calldata = isUpgrade
      ? encodeFunctionData({
          abi: COHORT_ABI,
          functionName: 'upgradeBelieverVariant',
          args: [BigInt(existingMint!.token_id!), variant],
        })
      : encodeFunctionData({
          abi: COHORT_ABI,
          functionName: 'mintToBeliever',
          args: [wallet, tokenUri, variant],
        })

    const hash = await walletClient.sendTransaction({
      to: contractAddress,
      data: calldata,
    })

    // Wait for receipt to confirm and (best-effort) parse tokenId from logs.
    const receipt = await pub.waitForTransactionReceipt({ hash, timeout: 60_000 })

    // Token id discovery (only on fresh mints — ERC721 Transfer log topic[3]).
    let mintedTokenId: number | null = isUpgrade ? (existingMint!.token_id ?? null) : null
    if (!isUpgrade) {
      const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
      const log = receipt.logs.find(
        (l) =>
          l.address.toLowerCase() === contractAddress.toLowerCase() &&
          l.topics?.[0] === TRANSFER_TOPIC
      )
      if (log?.topics?.[3]) mintedTokenId = Number(BigInt(log.topics[3]))
    }

    await admin.from('nft_mints')
      .update({
        tx_hash:  hash,
        token_id: mintedTokenId,
        status:   receipt.status === 'success' ? 'confirmed' : 'failed',
      })
      .eq('id', mintRow.id)

    // 8. Queue the "golden-ticket-minted" email (other agent owns send).
    //    Soft-fail: if email_queue is missing we log + continue (do not roll back the mint).
    try {
      await admin.from('email_queue').insert({
        user_id:   purchase.user_id,
        email:     profile.email,
        template:  'golden-ticket-minted',
        payload: {
          token_id:   mintedTokenId,
          tx_hash:    hash,
          variant,
          explorer:   `https://sepolia.basescan.org/tx/${hash}`,
          cohort_id:  1,
          drop_purchase_id: purchase.id,
        },
        status:    'pending',
      })
    } catch (e) {
      console.warn('[mint-cohort-nft] email_queue insert failed:', (e as Error).message)
    }

    return jsonResponse({
      ok: true,
      tx_hash: hash,
      token_id: mintedTokenId,
      variant,
      is_upgrade: isUpgrade,
      contract: contractAddress,
      chain_id: CHAIN.id,
      explorer: `https://sepolia.basescan.org/tx/${hash}`,
      mint_audit_id: mintRow.id,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'tx_failed'
    await admin.from('nft_mints')
      .update({ status: 'failed', error_message: msg })
      .eq('id', mintRow.id)
    return jsonResponse({ error: 'tx_submit_failed', detail: msg }, 500)
  }
})
