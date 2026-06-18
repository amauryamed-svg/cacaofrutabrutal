// Edge Function: send-lifecycle-email
//
// Disparada por pg_cron (migración 041) o manualmente por founder.
// Resuelve cada adopción que cumple un día-offset (1, 3, 7, 14, 21, 28) y
// envía el email lifecycle correspondiente vía Resend. Idempotente por
// (tree_id, day) — la tabla lifecycle_schedule garantiza una sola entrega.
//
// Body: { day: 1|3|7|14|21|28, tree_id?: string }
//   - sin tree_id: barrido por cron (procesa todos los árboles del día)
//   - con tree_id: envío manual single (founder)
//
// Returns: { ok: true, sent: number, skipped: number, errors: any[] }
//
// Auth:
//   - cron mode (sin Authorization): permitido solo si origin viene de
//     supabase internal (verificación service_role).
//   - manual mode: requiere JWT de founder.
//
// Required env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY,
//               RESEND_API_KEY, LIFECYCLE_CRON_SECRET

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'
import { getCorsHeaders, handleCorsPreFlight } from '../cors-config.ts'
import { renderLifecycleEmail, type LifecycleDay, type LifecycleContext } from './templates.ts'

const supabaseUrl        = Deno.env.get('SUPABASE_URL')!
const supabaseAnonKey    = Deno.env.get('SUPABASE_ANON_KEY')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const resendApiKey       = (Deno.env.get('RESEND_API_KEY') ?? '').trim()
const cronSecret         = (Deno.env.get('LIFECYCLE_CRON_SECRET') ?? '').trim()

const FROM_EMAIL = 'caua@cacaofrutabrutal.com'
const FROM_NAME  = 'Caúa'
const VALID_DAYS: ReadonlyArray<LifecycleDay> = [1, 3, 7, 14, 21, 28]

const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { headers: { Authorization: `Bearer ${supabaseServiceKey}`, apikey: supabaseServiceKey } },
})

interface TreeRow {
  id: string
  user_id: string
  guardian_id: number
  variety: string
  region: string
  stage: string
  health: number
  moisture: number
  sunlight: number
  co2_kg: number
  adopted_at: string
}

interface UserRow { email: string; full_name: string | null }
interface GuardianRow { name: string; town: string | null; region: string }

async function processOne(tree: TreeRow, day: LifecycleDay): Promise<{ ok: boolean; reason?: string; resend_id?: string }> {
  const { data: existing } = await adminClient
    .from('lifecycle_schedule')
    .select('tree_id')
    .eq('tree_id', tree.id)
    .eq('day_offset', day)
    .eq('status', 'sent')
    .maybeSingle()
  if (existing) return { ok: false, reason: 'already_sent' }

  const { data: profile } = await adminClient
    .from('user_profiles')
    .select('email, full_name')
    .eq('user_id', tree.user_id)
    .maybeSingle<UserRow>()
  if (!profile?.email) return { ok: false, reason: 'no_email' }

  const { data: guardian } = await adminClient
    .from('guardians')
    .select('name, town, region')
    .eq('id', tree.guardian_id)
    .maybeSingle<GuardianRow>()
  if (!guardian) return { ok: false, reason: 'no_guardian' }

  const ctx: LifecycleContext = {
    userName: profile.full_name?.split(' ')[0] ?? 'Adoptante',
    treeId: tree.id,
    variety: tree.variety,
    region: tree.region,
    guardianName: guardian.name,
    guardianTown: guardian.town,
    adoptedAt: tree.adopted_at,
    health: tree.health,
    moisture: tree.moisture,
    sunlight: tree.sunlight,
    stage: tree.stage,
    co2Kg: tree.co2_kg,
  }

  const { subject, html } = renderLifecycleEmail(day, ctx)

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendApiKey}` },
    body: JSON.stringify({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: profile.email,
      subject,
      html,
      reply_to: 'hola@cacaofrutabrutal.com',
      tags: [{ name: 'lifecycle_day', value: String(day) }],
    }),
  })
  const data = await res.json().catch(() => null)

  if (!res.ok || !data?.id) {
    await adminClient.from('lifecycle_schedule').upsert({
      tree_id: tree.id,
      day_offset: day,
      status: 'failed',
      last_error: JSON.stringify(data ?? { status: res.status }).slice(0, 500),
      attempted_at: new Date().toISOString(),
    }, { onConflict: 'tree_id,day_offset' })
    return { ok: false, reason: 'resend_failed' }
  }

  await adminClient.from('lifecycle_schedule').upsert({
    tree_id: tree.id,
    day_offset: day,
    status: 'sent',
    resend_id: data.id,
    sent_at: new Date().toISOString(),
    attempted_at: new Date().toISOString(),
  }, { onConflict: 'tree_id,day_offset' })

  await adminClient.from('email_log').insert({
    user_id: tree.user_id,
    email: profile.email,
    type: `lifecycle_d${day}`,
    subject,
    status: 'sent',
    resend_id: data.id,
  })

  return { ok: true, resend_id: data.id }
}

async function authorize(req: Request): Promise<{ mode: 'cron' | 'manual'; userId?: string } | Response> {
  const cronHeader = req.headers.get('x-cron-secret') ?? ''
  if (cronSecret && cronHeader === cronSecret) return { mode: 'cron' }

  const auth = req.headers.get('Authorization') ?? ''
  const jwt = auth.replace(/^Bearer\s+/i, '').trim()
  if (!jwt) return new Response(JSON.stringify({ error: 'missing_auth' }), { status: 401 })

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  })
  const { data: userResp, error } = await userClient.auth.getUser()
  if (error || !userResp.user) return new Response(JSON.stringify({ error: 'invalid_jwt' }), { status: 401 })

  const { data: founderCheck } = await adminClient.rpc('is_founder_cached', { user_uuid: userResp.user.id })
  if (!founderCheck) return new Response(JSON.stringify({ error: 'forbidden_not_founder' }), { status: 403 })

  return { mode: 'manual', userId: userResp.user.id }
}

serve(async (req) => {
  const origin = req.headers.get('origin') || ''
  if (req.method === 'OPTIONS') return handleCorsPreFlight(origin)
  const corsHeaders = { ...getCorsHeaders(origin), 'Content-Type': 'application/json' }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405, headers: corsHeaders })
  }
  if (!resendApiKey) {
    return new Response(JSON.stringify({ error: 'resend_not_configured' }), { status: 503, headers: corsHeaders })
  }

  const authResult = await authorize(req)
  if (authResult instanceof Response) return authResult

  let body: { day?: number; tree_id?: string }
  try { body = await req.json() } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), { status: 400, headers: corsHeaders })
  }
  const day = body.day as LifecycleDay
  if (!VALID_DAYS.includes(day)) {
    return new Response(JSON.stringify({ error: 'invalid_day', valid_days: VALID_DAYS }), { status: 400, headers: corsHeaders })
  }

  let trees: TreeRow[] = []
  if (body.tree_id) {
    const { data } = await adminClient
      .from('cacao_trees')
      .select('id, user_id, guardian_id, variety, region, stage, health, moisture, sunlight, co2_kg, adopted_at')
      .eq('id', body.tree_id)
      .maybeSingle<TreeRow>()
    if (data) trees = [data]
  } else {
    // Cron mode: pull all trees that adopted exactly `day` days ago (UTC bucket)
    const since = new Date(); since.setUTCHours(0, 0, 0, 0); since.setUTCDate(since.getUTCDate() - day)
    const until = new Date(since); until.setUTCDate(until.getUTCDate() + 1)
    const { data } = await adminClient
      .from('cacao_trees')
      .select('id, user_id, guardian_id, variety, region, stage, health, moisture, sunlight, co2_kg, adopted_at')
      .gte('adopted_at', since.toISOString())
      .lt('adopted_at', until.toISOString())
      .gt('health', 0)
    trees = data ?? []
  }

  let sent = 0, skipped = 0
  const errors: Array<{ tree_id: string; reason: string }> = []
  for (const tree of trees) {
    const result = await processOne(tree, day)
    if (result.ok) sent++
    else {
      skipped++
      if (result.reason && result.reason !== 'already_sent') errors.push({ tree_id: tree.id, reason: result.reason })
    }
  }

  return new Response(JSON.stringify({ ok: true, day, sent, skipped, errors }), { status: 200, headers: corsHeaders })
})
