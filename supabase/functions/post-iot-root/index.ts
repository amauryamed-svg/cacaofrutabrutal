// Computes the weekly Merkle root of verified IoT readings and posts it to
// IoTAttestation.sol on Base. Designed to be called by pg_cron weekly OR by
// Vercel/GitHub Actions cron. Idempotent on (week_index, contract).
//
// Steps:
//   1. Determine target week_index (default: prior completed week)
//   2. Skip if iot_attestation_roots already has status='confirmed' for that week+contract
//   3. SELECT payload_hash FROM iot_readings_signed WHERE week_index = ?
//   4. Compute Merkle root using OZ-compatible sorted-pair keccak256 layering
//   5. Insert iot_attestation_roots row (status='computed')
//   6. Build calldata for postRoot(weekIndex, root, leafCount), send via oracle EOA
//   7. Update row status='submitted', tx_hash
//
// Auth: requires Bearer ADMIN_BEARER_TOKEN (cron-only).

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import {
  createWalletClient,
  createPublicClient,
  http,
  keccak256,
  encodeFunctionData,
  encodePacked,
  type Hex,
} from 'https://esm.sh/viem@2.21.0'
import { base, baseSepolia } from 'https://esm.sh/viem@2.21.0/chains'
import { privateKeyToAccount } from 'https://esm.sh/viem@2.21.0/accounts'

const supabaseUrl        = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const adminBearer        = Deno.env.get('ADMIN_BEARER_TOKEN') ?? ''
const oraclePk           = (Deno.env.get('IOT_ORACLE_PRIVATE_KEY') ?? '') as Hex
const contractAddress    = (Deno.env.get('IOT_ATTESTATION_ADDRESS') ?? '').toLowerCase() as Hex
const chainIdEnv         = Number(Deno.env.get('WEB3_CHAIN_ID') ?? '8453')
const baseRpc            = Deno.env.get('BASE_RPC_URL') ?? 'https://mainnet.base.org'

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const chain = chainIdEnv === baseSepolia.id ? baseSepolia : base

// ─── ABI ────────────────────────────────────────────────────────────────
const POST_ROOT_ABI = [
  {
    type: 'function',
    name: 'postRoot',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'weekIndex', type: 'uint64' },
      { name: 'root',      type: 'bytes32' },
      { name: 'leafCount', type: 'uint32' },
    ],
    outputs: [],
  },
] as const

// ─── Helpers ────────────────────────────────────────────────────────────

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status, headers: { 'Content-Type': 'application/json' },
  })
}

function priorCompletedWeek(): number {
  return Math.floor(Date.now() / 1000 / 604800) - 1
}

function sortedPair(a: Hex, b: Hex): Hex {
  // OZ MerkleProof: keccak256(min||max). Lowercase compare on hex.
  const al = a.toLowerCase()
  const bl = b.toLowerCase()
  const [lo, hi] = al < bl ? [a, b] : [b, a]
  return keccak256(encodePacked(['bytes32', 'bytes32'], [lo as Hex, hi as Hex]))
}

function merkleRoot(leaves: Hex[]): Hex {
  if (leaves.length === 0) {
    return '0x0000000000000000000000000000000000000000000000000000000000000000' as Hex
  }
  let layer = [...leaves]
  while (layer.length > 1) {
    if (layer.length % 2 === 1) layer.push(layer[layer.length - 1])
    const next: Hex[] = []
    for (let i = 0; i < layer.length; i += 2) next.push(sortedPair(layer[i], layer[i + 1]))
    layer = next
  }
  return layer[0]
}

function bytesToHex(b: Uint8Array): Hex {
  return ('0x' + Array.from(b).map(x => x.toString(16).padStart(2, '0')).join('')) as Hex
}

// ─── Handler ────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method !== 'POST') return jsonResponse({ error: 'method_not_allowed' }, 405)

  const auth = req.headers.get('authorization') ?? ''
  if (!adminBearer || auth !== `Bearer ${adminBearer}`) {
    return jsonResponse({ error: 'unauthorized' }, 401)
  }

  if (!oraclePk || !contractAddress) {
    return jsonResponse({ error: 'oracle_not_configured' }, 503)
  }

  // Allow override via body for backfill; default to prior completed week.
  let body: { week_index?: number } = {}
  try { body = await req.json() } catch { /* empty body OK */ }
  const weekIndex = body.week_index ?? priorCompletedWeek()

  // Idempotency: skip if already confirmed for this contract+week.
  const { data: existing } = await supabase
    .from('iot_attestation_roots')
    .select('id, status, tx_hash')
    .eq('week_index', weekIndex)
    .eq('contract', contractAddress)
    .maybeSingle()

  if (existing && (existing.status === 'submitted' || existing.status === 'confirmed')) {
    return jsonResponse({ ok: true, skipped: true, week_index: weekIndex, status: existing.status })
  }

  // Pull leaves for the week.
  const { data: rows, error: rowsErr } = await supabase
    .from('iot_readings_signed')
    .select('payload_hash')
    .eq('week_index', weekIndex)
    .order('recorded_at', { ascending: true })

  if (rowsErr) return jsonResponse({ error: 'rows_query_failed', detail: rowsErr.message }, 500)
  if (!rows || rows.length === 0) {
    return jsonResponse({ ok: true, skipped: true, reason: 'no_leaves', week_index: weekIndex })
  }

  // Postgres returns bytea as escaped string by default; with json client it's a hex-prefixed string.
  // Normalise to 0x-prefixed lowercase hex.
  const leaves: Hex[] = rows.map((r: { payload_hash: string }) => {
    let h = r.payload_hash
    if (h.startsWith('\\x')) h = '0x' + h.slice(2)
    if (!h.startsWith('0x')) h = '0x' + h
    return h.toLowerCase() as Hex
  })

  const root = merkleRoot(leaves)

  // Upsert computed row first (audit before submit).
  const computedPayload = {
    week_index: weekIndex,
    root: '\\x' + root.slice(2),
    leaf_count: leaves.length,
    contract: contractAddress,
    chain_id: chain.id,
    status: 'computed',
  }
  let rowId: string | undefined = existing?.id
  if (!rowId) {
    const { data: ins, error: insErr } = await supabase
      .from('iot_attestation_roots')
      .insert(computedPayload)
      .select('id').single()
    if (insErr || !ins) return jsonResponse({ error: 'audit_insert_failed', detail: insErr?.message }, 500)
    rowId = ins.id
  }

  // Build + send tx.
  try {
    const account = privateKeyToAccount(oraclePk)
    const wallet  = createWalletClient({ account, chain, transport: http(baseRpc) })
    const data = encodeFunctionData({
      abi: POST_ROOT_ABI,
      functionName: 'postRoot',
      args: [BigInt(weekIndex), root, leaves.length],
    })
    const hash = await wallet.sendTransaction({ to: contractAddress, data })

    await supabase.from('iot_attestation_roots')
      .update({ status: 'submitted', tx_hash: hash })
      .eq('id', rowId!)

    void createPublicClient // reserved for future receipt poll

    return jsonResponse({
      ok: true,
      week_index: weekIndex,
      root,
      leaf_count: leaves.length,
      tx_hash: hash,
      explorer: chain.id === base.id
        ? `https://basescan.org/tx/${hash}`
        : `https://sepolia.basescan.org/tx/${hash}`,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'tx_failed'
    await supabase.from('iot_attestation_roots')
      .update({ status: 'failed', error_message: msg })
      .eq('id', rowId!)
    return jsonResponse({ error: 'tx_submit_failed', detail: msg }, 500)
  }
})

// Suppress unused warning for the helper kept for future receipt-polling use.
void bytesToHex
