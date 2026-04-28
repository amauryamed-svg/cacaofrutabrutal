// Persona KYC webhook receiver.
// HMAC-verifies the request, then writes kyc_verified_at + kyc_tier into user_profiles.
// Geo-blocks the user if country is in the comprehensive sanctions list.
// See docs/KYC.md for the full flow and tier matrix.

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const supabaseUrl        = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const personaSecret      = Deno.env.get('PERSONA_WEBHOOK_SECRET') ?? ''

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Mirrors src/utils/constants.ts:GEO_BLOCKED_COUNTRIES — keep in sync.
const GEO_BLOCKED_COUNTRIES = new Set([
  'IR', 'KP', 'CU', 'SY', 'RU', 'BY', 'MM',
  // Sub-national (Persona returns country=UA but we cross-check region client-side)
])

// Persona inquiry_template_id → KYC tier. Configure these IDs in your Persona account.
// Stored as env vars so they can rotate without redeploy.
function inferTier(templateId: string): number {
  if (templateId === Deno.env.get('PERSONA_TMPL_INVESTOR')) return 3
  if (templateId === Deno.env.get('PERSONA_TMPL_ENHANCED')) return 2
  if (templateId === Deno.env.get('PERSONA_TMPL_BASIC'))    return 1
  return 0
}

async function verifyHmac(body: string, headerSig: string | null): Promise<boolean> {
  if (!headerSig || !personaSecret) return false
  // Persona signs as: t=<timestamp>,v1=<hmac-sha256>
  const parts = Object.fromEntries(
    headerSig.split(',').map(p => p.split('=') as [string, string])
  )
  const provided = parts['v1']
  if (!provided) return false

  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(personaSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(body))
  const expected = Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0')).join('')

  // Constant-time compare
  if (expected.length !== provided.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ provided.charCodeAt(i)
  }
  return diff === 0
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const body = await req.text()
  const sig  = req.headers.get('persona-signature')

  const ok = await verifyHmac(body, sig)
  if (!ok) {
    return new Response(JSON.stringify({ error: 'invalid_signature' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let event: PersonaEvent
  try {
    event = JSON.parse(body) as PersonaEvent
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Only act on inquiry completion events.
  const eventType = event?.data?.attributes?.name
  if (eventType !== 'inquiry.completed' && eventType !== 'inquiry.approved') {
    return new Response(JSON.stringify({ ok: true, ignored: true, type: eventType }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const inquiry        = event.data.attributes.payload?.data
  const inquiryId      = inquiry?.id ?? event.data.id
  const referenceId    = inquiry?.attributes?.['reference-id']
  const inquiryStatus  = inquiry?.attributes?.status
  const templateId     = inquiry?.relationships?.['inquiry-template']?.data?.id ?? ''
  const tier           = inferTier(templateId)
  const country        = (inquiry?.attributes?.fields?.['country-code']?.value ?? '').toUpperCase()

  if (!referenceId) {
    return new Response(JSON.stringify({ error: 'missing_reference_id' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const isApproved = inquiryStatus === 'approved' || inquiryStatus === 'completed'
  const blocked    = GEO_BLOCKED_COUNTRIES.has(country)

  const update: Record<string, unknown> = {
    kyc_provider_id: inquiryId,
    country: country || null,
    geo_blocked: blocked,
  }

  if (!isApproved) {
    update.kyc_status = 'failed'
  } else if (blocked) {
    update.kyc_status = 'blocked'
  } else {
    update.kyc_status      = 'verified'
    update.kyc_tier        = tier
    update.kyc_verified_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('user_profiles')
    .update(update)
    .eq('user_id', referenceId)

  if (error) {
    return new Response(JSON.stringify({ error: 'update_failed', detail: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ ok: true, status: update.kyc_status, tier }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})

// ─── Types ─────────────────────────────────────────────────────────────────
// Minimal shape — Persona payloads have many more fields.

interface PersonaEvent {
  data: {
    id: string
    attributes: {
      name: string
      payload?: {
        data?: {
          id?: string
          attributes?: {
            'reference-id'?: string
            status?: string
            fields?: {
              'country-code'?: { value?: string }
            }
          }
          relationships?: {
            'inquiry-template'?: { data?: { id?: string } }
          }
        }
      }
    }
  }
}
