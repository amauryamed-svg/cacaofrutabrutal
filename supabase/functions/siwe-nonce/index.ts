// Issues a single-use SIWE nonce bound to the authenticated user.
// Frontend calls this BEFORE prompting the wallet to sign — the returned nonce
// is embedded in the SIWE message and consumed by siwe-link-wallet upon verify.
// 5-minute TTL, configured at table default in migration 028.

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const supabaseUrl        = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifyAuth(authHeader: string): Promise<string> {
  if (!authHeader.startsWith('Bearer ')) throw new Error('missing_bearer')
  const token = authHeader.substring(7)
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) throw new Error('invalid_jwt')
  return user.id
}

function randomNonce(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405)
  }

  const authHeader = req.headers.get('authorization')
  if (!authHeader) {
    return jsonResponse({ error: 'unauthorized' }, 401)
  }

  let userId: string
  try {
    userId = await verifyAuth(authHeader)
  } catch {
    return jsonResponse({ error: 'invalid_jwt' }, 401)
  }

  const nonce = randomNonce()
  const { error } = await supabase.from('wallet_link_nonces').insert({
    nonce,
    user_id: userId,
  })

  if (error) {
    return jsonResponse({ error: 'insert_failed', detail: error.message }, 500)
  }

  return jsonResponse({ nonce, ttl_seconds: 300 })
})
