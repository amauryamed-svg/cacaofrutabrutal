// verify-golden-ticket-ownership — server-side check of `CauaCreyentesCohort01`
// NFT ownership for a given wallet address.
//
// Use case: the `/workshop-2-0` landing already checks ownership client-side
// via `useGoldenTicketOwnership`. This endpoint exists for the anti-cache /
// mobile-wallet path — when a user reports "I have the NFT but the page
// won't unlock", the page can POST here to bypass wagmi/RainbowKit cache
// and re-verify against a fresh RPC call (or Supabase fallback).
//
// Web3 §10 compliance:
//   - Read-only. No mint, no burn, no signing. Cero claves privadas.
//   - No auth obligatoria — la wallet ES la identidad. Esto es público
//     porque `balanceOf` ya es público on-chain (cualquiera puede
//     consultarlo via etherscan / un RPC público).
//   - Response idempotente. No persiste nada. No emite eventos.
//
// Inputs (JSON POST):
//   { wallet_address: "0x..." }
//
// Outputs:
//   { hasTicket: boolean, balance: number, source: 'onchain' | 'db' | 'none' }

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import {
  createPublicClient,
  http,
  isAddress,
  type Hex,
} from 'https://esm.sh/viem@2.21.0'
import { base, baseSepolia } from 'https://esm.sh/viem@2.21.0/chains'

// ─── Env wiring ────────────────────────────────────────────────────────────
const supabaseUrl        = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const cohort01Address    = (Deno.env.get('CAUA_CREYENTES_COHORT01_ADDRESS') ?? '').toLowerCase()
const chainIdEnv         = Number(Deno.env.get('WEB3_CHAIN_ID') ?? '84532')
const baseSepoliaRpc     = Deno.env.get('BASE_SEPOLIA_RPC_URL') ?? 'https://sepolia.base.org'
const baseMainnetRpc     = Deno.env.get('BASE_RPC_URL') ?? 'https://mainnet.base.org'

const chain = chainIdEnv === base.id ? base : baseSepolia
const rpcUrl = chainIdEnv === base.id ? baseMainnetRpc : baseSepoliaRpc

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// ─── ABI minimal — solo balanceOf ──────────────────────────────────────────
const BALANCE_OF_ABI = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

// ─── CORS ──────────────────────────────────────────────────────────────────
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  })
}

// ─── On-chain check ────────────────────────────────────────────────────────
async function onchainBalance(wallet: Hex): Promise<bigint | null> {
  if (!cohort01Address || !/^0x[a-f0-9]{40}$/.test(cohort01Address)) {
    return null // env not configured — caller falls back to DB
  }
  try {
    const client = createPublicClient({ chain, transport: http(rpcUrl) })
    const balance = await client.readContract({
      address:      cohort01Address as Hex,
      abi:          BALANCE_OF_ABI,
      functionName: 'balanceOf',
      args:         [wallet],
    })
    return balance as bigint
  } catch {
    return null
  }
}

// ─── DB fallback ───────────────────────────────────────────────────────────
async function dbBalance(wallet: Hex): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('nft_mints')
      .select('id', { count: 'exact', head: true })
      .eq('wallet_address', wallet.toLowerCase())
      .eq('contract', 'cohort01')
      .eq('status', 'minted')
    if (error) return 0
    return count ?? 0
  } catch {
    return 0
  }
}

// ─── Handler ───────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }
  if (req.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405)
  }

  let body: { wallet_address?: string } | null = null
  try {
    body = await req.json()
  } catch {
    return json({ error: 'invalid_json' }, 400)
  }
  const wallet = (body?.wallet_address ?? '').trim()
  if (!wallet || !isAddress(wallet)) {
    return json({ error: 'invalid_wallet_address' }, 400)
  }

  const walletHex = wallet.toLowerCase() as Hex

  // 1. Try on-chain first.
  const onchain = await onchainBalance(walletHex)
  if (typeof onchain === 'bigint') {
    return json({
      hasTicket: onchain > 0n,
      balance:   Number(onchain),
      source:    'onchain',
    })
  }

  // 2. Fall back to Supabase nft_mints.
  const dbCount = await dbBalance(walletHex)
  if (dbCount > 0) {
    return json({
      hasTicket: true,
      balance:   dbCount,
      source:    'db',
    })
  }

  // 3. Nothing found anywhere.
  return json({
    hasTicket: false,
    balance:   0,
    source:    cohort01Address ? 'onchain' : 'none',
  })
})
