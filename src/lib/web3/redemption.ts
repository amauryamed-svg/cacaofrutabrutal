// Helpers for the Mazorca → $CACAO redemption flow.
// Server signs EIP-712 typed-data; this file requests the sig + invokes the
// on-chain claim() via wagmi.

import { supabase } from '../supabase'
import type { Hex } from 'viem'

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`

export interface SignedRedemption {
  ok: boolean
  redemption_id: string
  typedData: {
    domain: { name: string; version: string; chainId: number; verifyingContract: Hex }
    types: { MazorcaBurn: Array<{ name: string; type: string }> }
    primaryType: 'MazorcaBurn'
    message: {
      user: Hex
      mazorcaCount: string
      nonce: Hex
      deadline: string
    }
  }
  signature: Hex
  burn: {
    user: Hex
    mazorcaCount: string
    nonce: Hex
    deadline: string
  }
  cacao_amount_wei: string
  new_balance: number
  struct_hash: Hex
}

async function authHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession()
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session?.access_token ?? ''}`,
  }
}

/**
 * Server-side signs the EIP-712 burn payload. Decrements the user's
 * mazorcas_balance atomically before signing.
 */
export async function requestBurnSignature(mazorcaCount: number): Promise<SignedRedemption> {
  const res = await fetch(`${FUNCTIONS_URL}/sign-mazorca-burn`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ mazorca_count: mazorcaCount }),
  })
  const json = await res.json() as SignedRedemption & { error?: string; detail?: string }
  if (!res.ok) throw new Error(json.error ?? `sign-mazorca-burn ${res.status}`)
  return json
}

/** Minimal ABI for `claim` — used by wagmi `useWriteContract`. */
export const MAZORCA_REDEMPTION_ABI = [
  {
    type: 'function',
    name: 'claim',
    stateMutability: 'nonpayable',
    inputs: [
      {
        name: 'data',
        type: 'tuple',
        components: [
          { name: 'user',         type: 'address' },
          { name: 'mazorcaCount', type: 'uint256' },
          { name: 'nonce',        type: 'bytes32' },
          { name: 'deadline',     type: 'uint256' },
        ],
      },
      { name: 'signature', type: 'bytes' },
    ],
    outputs: [{ name: 'cacaoMinted', type: 'uint256' }],
  },
] as const

/** Convert the server-returned typed-data into the tuple wagmi expects. */
export function burnArgs(redemption: SignedRedemption): readonly [
  { user: Hex; mazorcaCount: bigint; nonce: Hex; deadline: bigint },
  Hex,
] {
  const m = redemption.burn
  return [
    {
      user: m.user,
      mazorcaCount: BigInt(m.mazorcaCount),
      nonce: m.nonce,
      deadline: BigInt(m.deadline),
    },
    redemption.signature,
  ]
}
