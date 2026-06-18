// Edge Function: send-transactional-email
//
// Orquestador de emails transaccionales post-Drop para Caua Creyentes Cohorte 01.
// Dispatcher por `type` → renderiza template (templates.ts) → envía via Resend →
// logea a `email_log`.
//
// POST /send-transactional-email
// Body: {
//   type: 'drop-purchase-confirmation' | 'golden-ticket-minted' | 'workshop-tomorrow-reminder',
//   user_id: uuid,
//   payload: { ...campos específicos del type (ver templates.ts) }
// }
//
// Auth:
//   - x-cron-secret  (header) === CRON_SECRET env  → permitida (cron jobs)
//   - Authorization: Bearer <SERVICE_ROLE_JWT>     → permitida (otros Edge Functions / webhooks)
//   - cualquier otra cosa                          → 401
//
// Required env:
//   SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY · RESEND_API_KEY · CRON_SECRET
//   WORKSHOP_ZOOM_LINK_2_0  (solo para workshop-tomorrow-reminder; nueva)
//
// Triggers (callers):
//   - stripe-webhook                  → drop-purchase-confirmation
//   - coinbase-commerce-webhook       → drop-purchase-confirmation
//   - mint-cohort-nft (Golden Ticket) → golden-ticket-minted
//   - evaluate-golden-tickets (cron)  → golden-ticket-minted (post-mint)
//   - cron job 2026-06-14             → workshop-tomorrow-reminder
//
// Spec: integrations/social/specs/GOLDEN-TICKET.md §4

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'
import { getCorsHeaders, handleCorsPreFlight } from '../cors-config.ts'
import {
  renderTransactionalEmail,
  type TransactionalType,
  type TransactionalContext,
  type DropPurchaseContext,
  type GoldenTicketMintedContext,
  type WorkshopReminderContext,
} from './templates.ts'

const supabaseUrl        = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const resendApiKey       = (Deno.env.get('RESEND_API_KEY') ?? '').trim()
const cronSecret         = (Deno.env.get('CRON_SECRET') ?? '').trim()
const workshopZoomLink   = (Deno.env.get('WORKSHOP_ZOOM_LINK_2_0') ?? '').trim()

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: {
    headers: {
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'apikey': supabaseServiceKey,
    },
  },
})

const FROM_EMAIL = 'caua@cacaofrutabrutal.com'
const FROM_NAME  = 'Caúa'

const ALLOWED_TYPES: TransactionalType[] = [
  'drop-purchase-confirmation',
  'golden-ticket-minted',
  'workshop-tomorrow-reminder',
]

interface UserProfile {
  email: string
  full_name: string | null
}

// ────────────────────── Auth ──────────────────────

function isAuthorized(req: Request): boolean {
  const cronHeader = req.headers.get('x-cron-secret') ?? ''
  if (cronSecret && cronHeader && cronHeader === cronSecret) return true

  const auth = req.headers.get('authorization') ?? ''
  if (auth.startsWith('Bearer ')) {
    const token = auth.slice('Bearer '.length).trim()
    // Aceptamos service-role JWT directo (otras Edge Functions lo usan para llamarnos).
    if (token && token === supabaseServiceKey) return true
  }
  return false
}

// ────────────────────── Payload validation ──────────────────────

function validatePayload(
  type: TransactionalType,
  payload: unknown,
): { ok: true; ctx: TransactionalContext } | { ok: false; error: string } {
  if (!payload || typeof payload !== 'object') return { ok: false, error: 'payload_required' }
  const p = payload as Record<string, unknown>

  if (type === 'drop-purchase-confirmation') {
    const required = ['variantLabel', 'sku', 'quantity', 'amountTotal', 'currency', 'shippingAddress', 'isInternational', 'orderId']
    for (const k of required) {
      if (!(k in p)) return { ok: false, error: `missing_${k}` }
    }
    if (p.currency !== 'COP' && p.currency !== 'USD') return { ok: false, error: 'invalid_currency' }
    return { ok: true, ctx: { type, ctx: p as unknown as DropPurchaseContext } }
  }

  if (type === 'golden-ticket-minted') {
    const required = ['txHash', 'tokenId', 'workshopDateISO', 'icalUrl', 'slackInviteUrl', 'preReading']
    for (const k of required) {
      if (!(k in p)) return { ok: false, error: `missing_${k}` }
    }
    if (!Array.isArray(p.preReading) || (p.preReading as unknown[]).length !== 3) {
      return { ok: false, error: 'preReading_must_be_array_of_3' }
    }
    return { ok: true, ctx: { type, ctx: p as unknown as GoldenTicketMintedContext } }
  }

  if (type === 'workshop-tomorrow-reminder') {
    const required = ['workshopDateISO', 'guidedQuestions', 'dropReceived']
    for (const k of required) {
      if (!(k in p)) return { ok: false, error: `missing_${k}` }
    }
    if (!Array.isArray(p.guidedQuestions) || (p.guidedQuestions as unknown[]).length !== 3) {
      return { ok: false, error: 'guidedQuestions_must_be_array_of_3' }
    }
    // zoomLink puede venir en payload, pero por defecto lo tomamos de env (única fuente de verdad).
    if (!('zoomLink' in p)) {
      if (!workshopZoomLink) return { ok: false, error: 'workshop_zoom_link_not_configured' }
      p.zoomLink = workshopZoomLink
    }
    return { ok: true, ctx: { type, ctx: p as unknown as WorkshopReminderContext } }
  }

  return { ok: false, error: 'unknown_type' }
}

// ────────────────────── User resolution ──────────────────────

async function resolveUser(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('email, full_name')
    .eq('user_id', userId)
    .maybeSingle<UserProfile>()
  if (error || !data?.email) return null
  return data
}

// ────────────────────── Handler ──────────────────────

serve(async (req) => {
  const origin = req.headers.get('origin') || ''
  if (req.method === 'OPTIONS') return handleCorsPreFlight(origin)

  const corsHeaders = { ...getCorsHeaders(origin), 'Content-Type': 'application/json' }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405, headers: corsHeaders })
  }

  if (!isAuthorized(req)) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: corsHeaders })
  }

  if (!resendApiKey) {
    return new Response(JSON.stringify({ error: 'resend_not_configured' }), { status: 503, headers: corsHeaders })
  }

  let body: { type?: TransactionalType; user_id?: string; payload?: unknown }
  try { body = await req.json() } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), { status: 400, headers: corsHeaders })
  }

  const { type, user_id, payload } = body
  if (!type || !ALLOWED_TYPES.includes(type)) {
    return new Response(JSON.stringify({ error: 'invalid_type', allowed: ALLOWED_TYPES }), { status: 400, headers: corsHeaders })
  }
  if (!user_id) {
    return new Response(JSON.stringify({ error: 'missing_user_id' }), { status: 400, headers: corsHeaders })
  }

  // Resolve recipient
  const user = await resolveUser(user_id)
  if (!user) {
    return new Response(JSON.stringify({ error: 'user_not_found' }), { status: 404, headers: corsHeaders })
  }

  // Validate + enrich payload (injects userName, zoomLink default, etc.)
  const enriched = (payload && typeof payload === 'object')
    ? { ...(payload as Record<string, unknown>) }
    : {}
  if (!('userName' in enriched)) {
    enriched.userName = user.full_name?.split(' ')[0] ?? 'Creyente'
  }

  const validation = validatePayload(type, enriched)
  if (!validation.ok) {
    return new Response(JSON.stringify({ error: 'invalid_payload', detail: validation.error }), { status: 400, headers: corsHeaders })
  }

  // Render
  let rendered: { subject: string; html: string }
  try {
    rendered = renderTransactionalEmail(validation.ctx)
  } catch (e) {
    return new Response(JSON.stringify({ error: 'render_failed', detail: (e as Error).message }), { status: 500, headers: corsHeaders })
  }

  // Send via Resend
  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: user.email,
      subject: rendered.subject,
      html: rendered.html,
      reply_to: 'hola@cacaofrutabrutal.com',
      tags: [
        { name: 'category', value: 'transactional' },
        { name: 'type', value: type },
        { name: 'cohort', value: '01' },
      ],
    }),
  })

  const resendData = await resendRes.json().catch(() => null)
  const ok = resendRes.ok && resendData?.id
  const resendId = resendData?.id ?? null

  // Audit log (best-effort, no aborta la respuesta si falla)
  await supabase.from('email_log').insert({
    user_id,
    email: user.email,
    type,
    subject: rendered.subject,
    status: ok ? 'sent' : 'failed',
    resend_id: resendId,
    error: ok ? null : JSON.stringify(resendData ?? { status: resendRes.status }),
  }).then(({ error }) => { if (error) console.error('email_log insert failed', error.message) })

  if (!ok) {
    return new Response(JSON.stringify({
      error: 'resend_failed',
      status: resendRes.status,
      detail: resendData,
    }), { status: 502, headers: corsHeaders })
  }

  return new Response(JSON.stringify({ ok: true, type, resend_id: resendId }), {
    status: 200,
    headers: corsHeaders,
  })
})
