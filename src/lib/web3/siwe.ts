// SIWE (EIP-4361) helpers — request a nonce from the server, build the message,
// sign it via wagmi, then submit to siwe-link-wallet.

import { SiweMessage } from 'siwe'
import { supabase } from '../supabase'
import { SIWE_DOMAIN } from '../../utils/constants'

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`

async function authHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession()
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session?.access_token ?? ''}`,
  }
}

export async function requestNonce(): Promise<{ nonce: string; ttl_seconds: number }> {
  const res = await fetch(`${FUNCTIONS_URL}/siwe-nonce`, {
    method: 'POST',
    headers: await authHeaders(),
  })
  if (!res.ok) throw new Error(`siwe-nonce failed: ${res.status}`)
  return res.json()
}

export function buildSiweMessage(opts: {
  address: string
  chainId: number
  nonce: string
  expiresInSeconds?: number
}): string {
  const { address, chainId, nonce, expiresInSeconds = 300 } = opts
  const issuedAt = new Date()
  const expirationTime = new Date(issuedAt.getTime() + expiresInSeconds * 1000)

  const message = new SiweMessage({
    domain: SIWE_DOMAIN,
    address,
    statement: 'Sign in to CauaCorp · Caúa Web3 onboarding · No transaction will be submitted.',
    uri: `https://${SIWE_DOMAIN}`,
    version: '1',
    chainId,
    nonce,
    issuedAt: issuedAt.toISOString(),
    expirationTime: expirationTime.toISOString(),
  })

  return message.prepareMessage()
}

export interface LinkWalletResult {
  ok: boolean
  wallet_address: string
  chain_id: number
  verdict: string
}

export async function linkWallet(payload: { message: string; signature: string }): Promise<LinkWalletResult> {
  const res = await fetch(`${FUNCTIONS_URL}/siwe-link-wallet`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(payload),
  })
  const json = await res.json() as LinkWalletResult & { error?: string }
  if (!res.ok) {
    throw new Error(json.error ?? `siwe-link-wallet failed: ${res.status}`)
  }
  return json
}
