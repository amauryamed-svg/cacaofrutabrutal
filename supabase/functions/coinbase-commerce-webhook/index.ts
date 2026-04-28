// Coinbase Commerce webhook receiver.
// Long overdue: `create-coinbase-charge` has lived without a confirmation path
// since the investor flow shipped. This finishes the loop.
//
// Verifies HMAC-SHA256 in `x-cc-webhook-signature` against COINBASE_COMMERCE_WEBHOOK_SECRET.
// Handles charge:confirmed and charge:failed events.
//
// On confirmed: updates investor_charges OR adoption_charges row by charge_id,
//               sets status='confirmed' and confirmed_at.
// On failed:    sets status='failed' with error_message.

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const supabaseUrl        = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const webhookSecret      = Deno.env.get('COINBASE_COMMERCE_WEBHOOK_SECRET') ?? ''

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifySig(body: string, sigHex: string | null): Promise<boolean> {
  if (!sigHex || !webhookSecret) return false
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(webhookSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const mac = await crypto.subtle.sign('HMAC', key, enc.encode(body))
  const expected = Array.from(new Uint8Array(mac))
    .map(b => b.toString(16).padStart(2, '0')).join('')
  if (expected.length !== sigHex.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sigHex.charCodeAt(i)
  return diff === 0
}

interface CommerceEvent {
  id?: string
  type?: string
  data?: {
    id?: string
    code?: string
    metadata?: { kind?: string; tree_id?: string; user_id?: string }
    payments?: Array<{ status?: string; transaction_id?: string; network?: string; value?: { local?: { amount?: string } } }>
  }
}

interface CommerceWrapper {
  event?: CommerceEvent
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405 })
  }

  const body = await req.text()
  const sig  = req.headers.get('x-cc-webhook-signature')
  const ok   = await verifySig(body, sig)
  if (!ok) return new Response(JSON.stringify({ error: 'invalid_signature' }), { status: 401 })

  let payload: CommerceWrapper
  try {
    payload = JSON.parse(body) as CommerceWrapper
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), { status: 400 })
  }

  const event = payload.event
  if (!event?.type || !event.data) {
    return new Response(JSON.stringify({ ok: true, ignored: true }), { status: 200 })
  }

  const chargeId = event.data.id
  const code     = event.data.code
  const kind     = event.data.metadata?.kind ?? 'unknown'
  const treeId   = event.data.metadata?.tree_id
  const txHash   = event.data.payments?.[0]?.transaction_id
  const network  = event.data.payments?.[0]?.network

  // ─── Route by metadata.kind ─────────────────────────────────────────
  // kind=adoption → adoption_charges; otherwise → investor_charges.
  const targetTable = kind === 'adoption' ? 'adoption_charges' : 'investor_charges'

  if (event.type === 'charge:confirmed') {
    const { error } = await supabase.from(targetTable)
      .update({
        status: 'confirmed',
        tx_hash: txHash,
        network,
        confirmed_at: new Date().toISOString(),
        raw: event,
      })
      .or(`charge_id.eq.${chargeId},charge_code.eq.${code ?? ''}`)
    if (error && targetTable === 'adoption_charges') {
      // Adoption charges schema: only `charge_id` exists, retry without `charge_code`.
      await supabase.from(targetTable)
        .update({ status: 'confirmed', tx_hash: txHash, confirmed_at: new Date().toISOString(), raw: event })
        .eq('charge_id', chargeId)
    }
    if (treeId && kind === 'adoption') {
      await supabase.from('cacao_trees')
        .update({ owner_wallet: null /* set later by alchemy-nft-webhook on mint */ })
        .eq('id', treeId)
    }
  } else if (event.type === 'charge:failed' || event.type === 'charge:delayed') {
    await supabase.from(targetTable)
      .update({ status: 'failed', error_message: event.type, raw: event })
      .eq('charge_id', chargeId)
  } else if (event.type === 'charge:pending' || event.type === 'charge:created') {
    await supabase.from(targetTable)
      .update({ status: 'pending', raw: event })
      .eq('charge_id', chargeId)
  }

  return new Response(JSON.stringify({ ok: true, type: event.type, target: targetTable }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
