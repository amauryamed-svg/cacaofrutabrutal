// Edge Function: send-tree-status-email
//
// Disparada manualmente desde el AdminCRM por un founder. Manda un email
// brutalist luxury con el estado actual del árbol del adoptante: HP / H₂O /
// sol, stage actual, edad, estado de cosecha, CTA al CauaGotchi.
//
// Body: { tree_id: string }
// Returns: { ok: true, resend_id: string }
//
// Auth: solo founders pueden invocar (chequeo via is_founder_cached).
//
// Required env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY,
//               RESEND_API_KEY

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'
import { getCorsHeaders, handleCorsPreFlight } from '../cors-config.ts'

const supabaseUrl        = Deno.env.get('SUPABASE_URL')!
const supabaseAnonKey    = Deno.env.get('SUPABASE_ANON_KEY')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const resendApiKey       = (Deno.env.get('RESEND_API_KEY') ?? '').trim()

const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { headers: { Authorization: `Bearer ${supabaseServiceKey}`, apikey: supabaseServiceKey } },
})

const FROM_EMAIL    = 'caua@cacaofrutabrutal.com'
const FROM_NAME     = 'Caúa'
const APP_BASE_URL  = 'https://cacaofrutabrutal.com'

const C = {
  bgDeep:   '#040C06',
  amazon:   '#1C3B26',
  pod:      '#91A63B',
  mazorca:  '#F1A91E',
  heirloom: '#F7F1EE',
  alert:    '#DB5527',
  critical: '#8C201D',
}

interface CacaoTree {
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
  last_update_at: string | null
}

interface UserProfile {
  email: string
  full_name: string | null
}

interface Guardian {
  id: number
  name: string
  region: string
  town: string | null
}

const STAGES = [
  { id: 0, name: 'Siembra',      emoji: '🌰', threshold: 0   },
  { id: 1, name: 'Germinación',  emoji: '🌱', threshold: 0.6 },
  { id: 2, name: 'Plántula',     emoji: '🌿', threshold: 1.2 },
  { id: 3, name: 'Crecimiento',  emoji: '🌾', threshold: 2   },
  { id: 4, name: 'Desarrollo',   emoji: '🌳', threshold: 2.8 },
  { id: 5, name: 'Floración',    emoji: '🌸', threshold: 3.5 },
  { id: 6, name: 'Formación',    emoji: '🫘', threshold: 4   },
  { id: 7, name: 'Maduración',   emoji: '🍫', threshold: 4.6 },
]

function getStage(hoursSince: number) {
  for (let i = STAGES.length - 1; i >= 0; i--) {
    if (hoursSince >= STAGES[i].threshold) return STAGES[i]
  }
  return STAGES[0]
}

function healthStatus(h: number): { label: string; emoji: string; color: string } {
  if (h >= 80) return { label: 'Excelente', emoji: '😊', color: C.pod      }
  if (h >= 60) return { label: 'Bueno',     emoji: '🙂', color: C.mazorca  }
  if (h >= 40) return { label: 'Alerta',    emoji: '😟', color: C.alert    }
  if (h >= 20) return { label: 'Crítico',   emoji: '😰', color: C.critical }
  return        { label: 'Muriendo', emoji: '💀', color: C.critical }
}

function vitalBar(value: number, color: string, label: string, emoji: string): string {
  const pct = Math.max(0, Math.min(100, value))
  return `
    <tr><td style="padding:8px 0;">
      <div style="font-size:11px;color:${C.heirloom}99;letter-spacing:0.04em;text-transform:uppercase;margin-bottom:6px;">
        ${emoji} ${label} · <span style="color:${color};font-weight:700;">${pct}%</span>
      </div>
      <div style="background:${C.amazon}66;height:8px;border-radius:4px;overflow:hidden;">
        <div style="background:${color};width:${pct}%;height:100%;"></div>
      </div>
    </td></tr>`
}

function template(opts: {
  userName: string
  tree: CacaoTree
  guardian: Guardian
}): { subject: string; html: string } {
  const { tree, guardian, userName } = opts
  const hours    = (Date.now() - new Date(tree.adopted_at).getTime()) / 3600000
  const stage    = getStage(hours)
  const harvest  = hours >= 4.6 && tree.health > 0
  const danger   = tree.health < 30 || tree.moisture < 30
  const ageStr   = hours < 1 ? `${Math.round(hours * 60)} min`
                  : hours < 24 ? `${Math.round(hours * 10) / 10} h`
                  : `${Math.round(hours / 24)} días`
  const hp       = healthStatus(tree.health)
  const treeUrl  = `${APP_BASE_URL}/app/tree/${tree.id}`

  const headline = harvest
    ? `🍫 Tu cacao está LISTO para cosechar`
    : danger
      ? `⚠️ Tu árbol necesita atención AHORA`
      : `${stage.emoji} Tu árbol está en fase ${stage.name}`

  const subject = harvest
    ? '🍫 ¡Cosecha lista! Tu cacao maduró'
    : danger
      ? '⚠️ Tu árbol de cacao necesita cuidado'
      : `${stage.emoji} Update: tu árbol en fase ${stage.name}`

  const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:${C.bgDeep};font-family:'Helvetica Neue',Arial,sans-serif;color:${C.heirloom};">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${C.bgDeep};padding:40px 16px;">
    <tr><td align="center"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background:${C.bgDeep};">

      <tr><td align="center" style="padding:0 0 32px;">
        <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-weight:900;font-size:32px;letter-spacing:0.04em;color:${C.heirloom};text-transform:uppercase;">CAÚA</div>
        <div style="margin-top:8px;font-family:Georgia,serif;font-style:italic;font-size:11px;letter-spacing:0.28em;color:${C.pod};text-transform:lowercase;">cacao fruta brutal</div>
      </td></tr>

      <tr><td style="padding:32px 28px;background:linear-gradient(135deg, ${C.amazon} 0%, ${C.bgDeep} 100%);border-radius:14px 14px 0 0;">
        <div style="font-family:Georgia,serif;font-style:italic;font-size:11px;color:${C.pod};letter-spacing:0.22em;text-transform:uppercase;margin-bottom:14px;">
          Update de tu árbol
        </div>
        <h1 style="margin:0 0 12px;font-family:'Helvetica Neue',Arial,sans-serif;font-weight:900;font-size:28px;line-height:1.1;color:${C.heirloom};letter-spacing:-0.01em;">
          ${headline}
        </h1>
        <p style="margin:18px 0 0;font-size:14px;line-height:1.6;color:${C.heirloom}cc;">Hola ${userName},</p>
        <p style="margin:8px 0 0;font-size:14px;line-height:1.6;color:${C.heirloom}cc;">
          Aquí está el estado actual de tu árbol de cacao <strong style="color:${C.heirloom};">${tree.variety}</strong> en la finca de <strong style="color:${C.heirloom};">${guardian.name}</strong> (${guardian.town ?? guardian.region}).
        </p>
      </td></tr>

      <tr><td style="padding:0 0 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${C.amazon}40;border:1px solid ${C.amazon};border-top:0;">
          <tr><td style="padding:24px 28px;">
            <div style="font-family:Georgia,serif;font-style:italic;font-size:10px;color:${C.pod};letter-spacing:0.22em;text-transform:uppercase;margin-bottom:16px;">
              Estado actual · ${ageStr} de vida
            </div>

            <div style="margin-bottom:16px;padding:12px 14px;background:${hp.color}22;border-left:3px solid ${hp.color};border-radius:4px;">
              <div style="font-size:11px;color:${C.heirloom}88;letter-spacing:0.04em;text-transform:uppercase;">Salud general</div>
              <div style="font-size:22px;font-weight:900;color:${hp.color};margin-top:4px;">${hp.emoji} ${hp.label} · ${tree.health}%</div>
            </div>

            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              ${vitalBar(tree.moisture, '#3DB6E0', 'Humedad', '💧')}
              ${vitalBar(tree.sunlight, C.mazorca, 'Sol',    '☀️')}
              <tr><td style="padding:12px 0 0;">
                <div style="font-size:11px;color:${C.heirloom}99;letter-spacing:0.04em;text-transform:uppercase;margin-bottom:6px;">
                  ${stage.emoji} Fase actual · <span style="color:${C.pod};font-weight:700;">${stage.name}</span> (${stage.id + 1}/8)
                </div>
                <div style="background:${C.amazon}66;height:8px;border-radius:4px;overflow:hidden;">
                  <div style="background:${C.pod};width:${Math.round((stage.id / 7) * 100)}%;height:100%;"></div>
                </div>
              </td></tr>
              <tr><td style="padding:12px 0 0;font-size:13px;color:${C.heirloom}aa;line-height:1.6;">
                🌍 CO₂ secuestrado: <strong style="color:${C.heirloom};">${tree.co2_kg.toFixed(2)} kg</strong>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </td></tr>

      <tr><td align="center" style="padding:24px 28px 40px;">
        <a href="${treeUrl}" style="display:inline-block;background:${harvest ? C.mazorca : C.pod};color:${C.bgDeep};text-decoration:none;font-family:'Helvetica Neue',Arial,sans-serif;font-weight:800;font-size:13px;letter-spacing:0.16em;text-transform:uppercase;padding:16px 36px;border-radius:999px;">
          ${harvest ? 'Cosechar ahora →' : danger ? 'Cuidar mi árbol →' : 'Ver mi árbol →'}
        </a>
        ${danger ? `<p style="margin:18px 0 0;font-size:12px;color:${C.alert};line-height:1.6;font-weight:700;">Salud o humedad bajo 30%. Si no actuás pronto, el árbol puede morir.</p>` : ''}
        ${harvest ? `<p style="margin:18px 0 0;font-size:12px;color:${C.mazorca};line-height:1.6;font-weight:700;">¡Tu cacao alcanzó la fase Maduración! Recolectá las mazorcas y se convierten en $CACAO on-chain.</p>` : ''}
      </td></tr>

      <tr><td style="padding:32px 28px;border-top:1px solid ${C.amazon};text-align:center;">
        <p style="margin:0 0 8px;font-size:10px;letter-spacing:0.08em;color:${C.heirloom}55;font-family:'Helvetica Neue',Arial,sans-serif;">CAUA COLOMBIA SAS · NIT 901.213.846-7</p>
        <p style="margin:0 0 14px;font-size:10px;letter-spacing:0.08em;color:${C.heirloom}33;font-family:'Helvetica Neue',Arial,sans-serif;">Bogotá D.C. · Colombia · cacaofrutabrutal.com</p>
        <p style="margin:0;font-size:9px;color:${C.heirloom}33;line-height:1.6;">
          Recibiste este update porque adoptaste un árbol en cacaofrutabrutal.com.<br>
          Para preguntas, escribinos a hola@cacaofrutabrutal.com
        </p>
      </td></tr>

    </table></td></tr>
  </table>
</body></html>`

  return { subject, html }
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

  // Auth: founders only. Use the caller's JWT against a per-request client so
  // RLS evaluates with their identity, then check is_founder_cached.
  const authHeader = req.headers.get('Authorization') ?? ''
  const jwt = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!jwt) {
    return new Response(JSON.stringify({ error: 'missing_auth' }), { status: 401, headers: corsHeaders })
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  })

  const { data: userResp, error: userResErr } = await userClient.auth.getUser()
  if (userResErr || !userResp.user) {
    return new Response(JSON.stringify({ error: 'invalid_jwt' }), { status: 401, headers: corsHeaders })
  }
  const callerId = userResp.user.id

  const { data: founderCheck, error: founderErr } = await adminClient.rpc('is_founder_cached', { user_uuid: callerId })
  if (founderErr || !founderCheck) {
    return new Response(JSON.stringify({ error: 'forbidden_not_founder' }), { status: 403, headers: corsHeaders })
  }

  let body: { tree_id?: string }
  try { body = await req.json() } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), { status: 400, headers: corsHeaders })
  }

  const treeId = body.tree_id
  if (!treeId) {
    return new Response(JSON.stringify({ error: 'missing_tree_id' }), { status: 400, headers: corsHeaders })
  }

  const { data: tree, error: treeErr } = await adminClient
    .from('cacao_trees')
    .select('id, user_id, guardian_id, variety, region, stage, health, moisture, sunlight, co2_kg, adopted_at, last_update_at')
    .eq('id', treeId)
    .maybeSingle<CacaoTree>()
  if (treeErr || !tree) {
    return new Response(JSON.stringify({ error: 'tree_not_found', detail: treeErr?.message }), { status: 404, headers: corsHeaders })
  }

  const { data: profile, error: profileErr } = await adminClient
    .from('user_profiles')
    .select('email, full_name')
    .eq('user_id', tree.user_id)
    .maybeSingle<UserProfile>()
  if (profileErr || !profile?.email) {
    return new Response(JSON.stringify({ error: 'user_not_found', detail: profileErr?.message }), { status: 404, headers: corsHeaders })
  }

  const { data: guardian } = await adminClient
    .from('guardians')
    .select('id, name, region, town')
    .eq('id', tree.guardian_id)
    .maybeSingle<Guardian>()
  if (!guardian) {
    return new Response(JSON.stringify({ error: 'guardian_not_found' }), { status: 404, headers: corsHeaders })
  }

  const { subject, html } = template({
    userName: profile.full_name?.split(' ')[0] ?? 'Adoptante',
    tree,
    guardian,
  })

  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendApiKey}` },
    body: JSON.stringify({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: profile.email,
      subject,
      html,
      reply_to: 'hola@cacaofrutabrutal.com',
    }),
  })
  const resendData = await resendRes.json().catch(() => null)
  if (!resendRes.ok || !resendData?.id) {
    return new Response(JSON.stringify({ error: 'resend_failed', status: resendRes.status, detail: resendData }), { status: 502, headers: corsHeaders })
  }

  await adminClient.from('email_log').insert({
    user_id: tree.user_id,
    email: profile.email,
    type: 'tree_status_update',
    subject,
    status: 'sent',
    resend_id: resendData.id,
  }).then(({ error }) => { if (error) console.error('email_log insert failed', error.message) })

  return new Response(JSON.stringify({ ok: true, resend_id: resendData.id }), { status: 200, headers: corsHeaders })
})
