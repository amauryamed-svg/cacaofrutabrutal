// Issues a single-use SIWE nonce bound to the authenticated user.
// Frontend calls this BEFORE prompting the wallet to sign — the returned nonce
// is embedded in the SIWE message and consumed by siwe-link-wallet upon verify.
// 5-minute TTL, configured at table default in migration 028.

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { JWT } from 'https://deno.land/x/jose@v5.4.1/mod.ts'

const supabaseUrl        = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const jwtSecret          = Deno.env.get('JWT_SECRET')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifyAuth(authHeader: string): Promise<string> {
  if (!authHeader.startsWith('Bearer ')) throw new Error('missing_bearer')
  const token = authHeader.substring(7)
  const secret = new TextEncoder().encode(jwtSecret)
  await JWT.verify(token, secret)
  const payload = JWT.decode(token)
  return payload.payload.sub as string
}

function randomNonce(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const authHeader = req.headers.get('authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let userId: string
  try {
    userId = await verifyAuth(authHeader)
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_jwt' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const nonce = randomNonce()
  const { error } = await supabase.from('wallet_link_nonces').insert({
    nonce,
    user_id: userId,
  })

  if (error) {
    return new Response(JSON.stringify({ error: 'insert_failed', detail: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ nonce, ttl_seconds: 300 }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
