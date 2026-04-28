// Alchemy Custom Webhook receiver — listens to Transfer events on CacaoTreeNFT.
// On each event:
//   - mint (from = 0x0): set cacao_trees.nft_token_id from event tokenId, set owner_wallet to `to`
//   - transfer: just update owner_wallet
//
// Verifies HMAC-SHA256 in the X-Alchemy-Signature header against ALCHEMY_SIGNING_KEY
// (the per-webhook signing secret from Alchemy dashboard). See docs/WEB3.md.
//
// Latency target: <60s from block confirmation to row update.

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const supabaseUrl        = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const signingKey         = Deno.env.get('ALCHEMY_SIGNING_KEY') ?? ''
const contractAddress    = (Deno.env.get('CACAO_TREE_NFT_ADDRESS') ?? '').toLowerCase()

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

async function verifySig(body: string, sig: string | null): Promise<boolean> {
  if (!sig || !signingKey) return false
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(signingKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const out = await crypto.subtle.sign('HMAC', key, enc.encode(body))
  const expected = Array.from(new Uint8Array(out))
    .map(b => b.toString(16).padStart(2, '0')).join('')
  if (expected.length !== sig.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i)
  return diff === 0
}

interface Activity {
  fromAddress?: string
  toAddress?: string
  hash?: string
  category?: string
  erc721TokenId?: string  // hex
  rawContract?: { address?: string }
  blockNum?: string
  log?: { transactionHash?: string; topics?: string[]; data?: string; address?: string }
}

interface AlchemyPayload {
  webhookId?: string
  type?: string
  event?: { activity?: Activity[]; logs?: Activity['log'][] }
}

// keccak256("TreeAdopted(address,bytes32,uint8,address,uint256,bytes32,bytes32)")
const TREE_ADOPTED_TOPIC = '0x' + 'tree_adopted_topic_placeholder'.padEnd(64, '0').slice(0, 64)
const adoptionAddress = (Deno.env.get('TREE_ADOPTION_ADDRESS') ?? '').toLowerCase()

function tokenIdFromHex(hex: string | undefined): number | null {
  if (!hex) return null
  try {
    return Number(BigInt(hex))
  } catch {
    return null
  }
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405 })
  }

  const body = await req.text()
  const sig  = req.headers.get('x-alchemy-signature')
  const ok   = await verifySig(body, sig)
  if (!ok) return new Response(JSON.stringify({ error: 'invalid_signature' }), { status: 401 })

  let payload: AlchemyPayload
  try {
    payload = JSON.parse(body) as AlchemyPayload
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), { status: 400 })
  }

  const activities = payload.event?.activity ?? []
  let processedTransfers = 0
  let processedAdoptions = 0

  for (const a of activities) {
    const addr = (a.rawContract?.address ?? a.log?.address ?? '').toLowerCase()
    const tx   = (a.hash ?? a.log?.transactionHash ?? '').toLowerCase()

    // ─── ERC-721 Transfer on CacaoTreeNFT ────────────────────────────
    if (a.category === 'erc721' && addr === contractAddress) {
      const tokenId = tokenIdFromHex(a.erc721TokenId)
      if (tokenId == null) continue
      const from = (a.fromAddress ?? '').toLowerCase()
      const to   = (a.toAddress ?? '').toLowerCase()

      if (from === ZERO_ADDRESS) {
        const { error } = await supabase
          .from('cacao_trees')
          .update({ nft_token_id: tokenId, owner_wallet: to })
          .eq('nft_mint_tx', tx)
        if (!error) {
          await supabase.from('tree_mints')
            .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
            .eq('tx_hash', tx)
        }
      } else {
        await supabase
          .from('cacao_trees')
          .update({ owner_wallet: to })
          .eq('nft_token_id', tokenId)
          .eq('nft_contract', contractAddress)
      }
      processedTransfers += 1
      continue
    }

    // ─── TreeAdopted event on TreeAdoption.sol ─────────────────────
    // Phase 5: payment confirmation. The Alchemy webhook is configured to
    // emit log activities for the TreeAdoption contract's events. We rely
    // on the structured fields Alchemy provides (decoded by ABI) when
    // available; otherwise we just stamp the adoption_charges row by tx.
    if (adoptionAddress && addr === adoptionAddress) {
      // Mark any pending adoption_charges row with this tx as confirmed.
      const { data: charges, error } = await supabase
        .from('adoption_charges')
        .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
        .eq('tx_hash', tx)
        .select('id')
      if (!error && charges && charges.length > 0) processedAdoptions += charges.length
      continue
    }
  }

  return new Response(JSON.stringify({
    ok: true,
    transfers: processedTransfers,
    adoptions: processedAdoptions,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})

// Suppress unused-warning for the placeholder topic; alchemy provides decoded
// fields rather than raw topics in our config, so we don't need the hash.
void TREE_ADOPTED_TOPIC
