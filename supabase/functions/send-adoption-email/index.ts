// Edge Function: send-adoption-email
//
// Disparada después de adopción exitosa (off-chain o on-chain). Envía email
// brutalist luxury via Resend con detalles del árbol + CTA al CauaGotchi.
//
// Body: { tree_id: string }
// Returns: { ok: true, resend_id: string }
//
// Required env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'
import { getCorsHeaders, handleCorsPreFlight } from '../cors-config.ts'

const supabaseUrl        = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const resendApiKey       = (Deno.env.get('RESEND_API_KEY') ?? '').trim()

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: {
    headers: {
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'apikey': supabaseServiceKey,
    },
  },
})

const FROM_EMAIL    = 'caua@cacaofrutabrutal.com'
const FROM_NAME     = 'Caúa'
const APP_BASE_URL  = 'https://cacaofrutabrutal.com'

// Brand palette (hex only — CauaCore §8)
const C = {
  bgDeep:   '#040C06',
  amazon:   '#1C3B26',
  pod:      '#91A63B',
  mazorca:  '#F1A91E',
  heirloom: '#F7F1EE',
  criollo:  '#8D2679',
}

interface CacaoTree {
  id: string
  user_id: string
  guardian_id: number
  variety: string
  region: string
  stage: string
  adopted_at: string
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

function template(opts: {
  userName: string
  treeId: string
  guardian: Guardian
  variety: string
  region: string
  adoptedAt: string
}): { subject: string; html: string } {
  const subject = `🌱 Tu árbol de cacao ya está plantado en ${opts.guardian.town ?? opts.region}`
  const treeUrl = `${APP_BASE_URL}/app/tree/${opts.treeId}`
  const adoptedDate = new Date(opts.adoptedAt).toLocaleDateString('es-CO', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Tu árbol de cacao</title>
</head>
<body style="margin:0;padding:0;background:${C.bgDeep};font-family:'Helvetica Neue',Arial,sans-serif;color:${C.heirloom};">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${C.bgDeep};padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background:${C.bgDeep};">

          <!-- Header logo + eyebrow -->
          <tr>
            <td align="center" style="padding:0 0 32px;">
              <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-weight:900;font-size:32px;letter-spacing:0.04em;color:${C.heirloom};text-transform:uppercase;">
                CAÚA
              </div>
              <div style="margin-top:8px;font-family:Georgia,serif;font-style:italic;font-size:11px;letter-spacing:0.28em;color:${C.pod};text-transform:lowercase;">
                cacao fruta brutal
              </div>
            </td>
          </tr>

          <!-- Hero -->
          <tr>
            <td style="padding:32px 28px;background:linear-gradient(135deg, ${C.amazon} 0%, ${C.bgDeep} 100%);border-radius:14px 14px 0 0;">
              <div style="font-family:Georgia,serif;font-style:italic;font-size:11px;color:${C.pod};letter-spacing:0.22em;text-transform:uppercase;margin-bottom:14px;">
                Adopción confirmada
              </div>
              <h1 style="margin:0 0 12px;font-family:'Helvetica Neue',Arial,sans-serif;font-weight:900;font-size:30px;line-height:1.05;color:${C.heirloom};letter-spacing:-0.01em;">
                Tu árbol está<br>plantado en<br><span style="color:${C.mazorca};">${opts.guardian.town ?? opts.region}</span>
              </h1>
              <p style="margin:18px 0 0;font-size:14px;line-height:1.6;color:${C.heirloom}cc;">
                Hola ${opts.userName},
              </p>
              <p style="margin:8px 0 0;font-size:14px;line-height:1.6;color:${C.heirloom}cc;">
                Acabas de adoptar un árbol de cacao <strong style="color:${C.heirloom};">Criollo ${opts.variety}</strong> de la finca de <strong style="color:${C.heirloom};">${opts.guardian.name}</strong>. Bienvenido a la comunidad Caúa.
              </p>
            </td>
          </tr>

          <!-- Tree details card -->
          <tr>
            <td style="padding:0 0 16px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${C.amazon}40;border:1px solid ${C.amazon};border-top:0;">
                <tr>
                  <td style="padding:24px 28px;">
                    <div style="font-family:Georgia,serif;font-style:italic;font-size:10px;color:${C.pod};letter-spacing:0.22em;text-transform:uppercase;margin-bottom:16px;">
                      Detalles de tu árbol
                    </div>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="font-size:13px;">
                      <tr>
                        <td style="padding:6px 0;color:${C.heirloom}88;width:38%;font-size:11px;letter-spacing:0.04em;text-transform:uppercase;">Guardián</td>
                        <td style="padding:6px 0;color:${C.heirloom};font-weight:700;">${opts.guardian.name}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:${C.heirloom}88;width:38%;font-size:11px;letter-spacing:0.04em;text-transform:uppercase;">Variedad</td>
                        <td style="padding:6px 0;color:${C.heirloom};font-weight:700;">${opts.variety}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:${C.heirloom}88;width:38%;font-size:11px;letter-spacing:0.04em;text-transform:uppercase;">Región</td>
                        <td style="padding:6px 0;color:${C.heirloom};font-weight:700;">${opts.region}${opts.guardian.town ? ` · ${opts.guardian.town}` : ''}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:${C.heirloom}88;width:38%;font-size:11px;letter-spacing:0.04em;text-transform:uppercase;">Adoptado</td>
                        <td style="padding:6px 0;color:${C.heirloom};font-weight:700;">${adoptedDate}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:${C.heirloom}88;width:38%;font-size:11px;letter-spacing:0.04em;text-transform:uppercase;">Tree ID</td>
                        <td style="padding:6px 0;color:${C.heirloom}77;font-family:'SF Mono',Consolas,monospace;font-size:11px;">${opts.treeId.slice(0, 8)}…${opts.treeId.slice(-4)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td align="center" style="padding:24px 28px 40px;">
              <a href="${treeUrl}" style="display:inline-block;background:${C.pod};color:${C.bgDeep};text-decoration:none;font-family:'Helvetica Neue',Arial,sans-serif;font-weight:800;font-size:13px;letter-spacing:0.16em;text-transform:uppercase;padding:16px 36px;border-radius:999px;">
                Ver mi árbol →
              </a>
              <p style="margin:18px 0 0;font-size:11px;color:${C.heirloom}66;line-height:1.6;">
                Cuídalo todos los días. Riégalo, dale sol, ayúdalo a crecer.<br>
                Cuando dé mazorcas, te avisamos.
              </p>
            </td>
          </tr>

          <!-- What's next -->
          <tr>
            <td style="padding:24px 28px;border-top:1px solid ${C.amazon};">
              <div style="font-family:Georgia,serif;font-style:italic;font-size:10px;color:${C.pod};letter-spacing:0.22em;text-transform:uppercase;margin-bottom:14px;">
                Lo que sigue
              </div>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="padding:8px 0;font-size:13px;color:${C.heirloom}aa;line-height:1.6;">
                    <strong style="color:${C.mazorca};">1.</strong> Tu árbol está en <strong style="color:${C.heirloom};">fase Semilla</strong>. Va a crecer con tu cuidado.
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-size:13px;color:${C.heirloom}aa;line-height:1.6;">
                    <strong style="color:${C.mazorca};">2.</strong> En tu CauaGotchi vas a poder regarlo, exponerlo al sol, abonarlo. Cada acción suma.
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-size:13px;color:${C.heirloom}aa;line-height:1.6;">
                    <strong style="color:${C.mazorca};">3.</strong> Cuando produzca mazorcas (~5h de cuidado), las cosechas y se convierten en <strong style="color:${C.heirloom};">$CACAO on-chain</strong>.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:32px 28px;border-top:1px solid ${C.amazon};text-align:center;">
              <p style="margin:0 0 8px;font-size:10px;letter-spacing:0.08em;color:${C.heirloom}55;font-family:'Helvetica Neue',Arial,sans-serif;">
                CAUA COLOMBIA SAS · NIT 901.213.846-7
              </p>
              <p style="margin:0 0 14px;font-size:10px;letter-spacing:0.08em;color:${C.heirloom}33;font-family:'Helvetica Neue',Arial,sans-serif;">
                Bogotá D.C. · Colombia · cacaofrutabrutal.com
              </p>
              <p style="margin:0;font-size:9px;color:${C.heirloom}33;line-height:1.6;">
                Recibiste este email porque adoptaste un árbol en cacaofrutabrutal.com.<br>
                Si no fuiste tú, escribinos a hola@cacaofrutabrutal.com
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

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

  let body: { tree_id?: string }
  try { body = await req.json() } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), { status: 400, headers: corsHeaders })
  }

  const treeId = body.tree_id
  if (!treeId) {
    return new Response(JSON.stringify({ error: 'missing_tree_id' }), { status: 400, headers: corsHeaders })
  }

  // Resolve tree + user + guardian server-side (service_role bypasses RLS)
  const { data: tree, error: treeErr } = await supabase
    .from('cacao_trees')
    .select('id, user_id, guardian_id, variety, region, stage, adopted_at')
    .eq('id', treeId)
    .maybeSingle<CacaoTree>()
  if (treeErr || !tree) {
    return new Response(JSON.stringify({ error: 'tree_not_found', detail: treeErr?.message }), { status: 404, headers: corsHeaders })
  }

  const { data: user, error: userErr } = await supabase
    .from('user_profiles')
    .select('email, full_name')
    .eq('user_id', tree.user_id)
    .maybeSingle<UserProfile>()
  if (userErr || !user?.email) {
    return new Response(JSON.stringify({ error: 'user_not_found', detail: userErr?.message }), { status: 404, headers: corsHeaders })
  }

  const { data: guardian } = await supabase
    .from('guardians')
    .select('id, name, region, town')
    .eq('id', tree.guardian_id)
    .maybeSingle<Guardian>()
  if (!guardian) {
    return new Response(JSON.stringify({ error: 'guardian_not_found' }), { status: 404, headers: corsHeaders })
  }

  const { subject, html } = template({
    userName: user.full_name?.split(' ')[0] ?? 'Adoptante',
    treeId: tree.id,
    guardian,
    variety: tree.variety,
    region: tree.region,
    adoptedAt: tree.adopted_at,
  })

  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: user.email,
      subject,
      html,
      reply_to: 'hola@cacaofrutabrutal.com',
    }),
  })

  const resendData = await resendRes.json().catch(() => null)
  if (!resendRes.ok || !resendData?.id) {
    return new Response(JSON.stringify({
      error: 'resend_failed',
      status: resendRes.status,
      detail: resendData,
    }), { status: 502, headers: corsHeaders })
  }

  // Audit log (best-effort)
  await supabase.from('email_log').insert({
    user_id: tree.user_id,
    email: user.email,
    type: 'tree_adopted',
    subject,
    status: 'sent',
    resend_id: resendData.id,
  }).then(({ error }) => { if (error) console.error('email_log insert failed', error.message) })

  return new Response(JSON.stringify({ ok: true, resend_id: resendData.id }), {
    status: 200,
    headers: corsHeaders,
  })
})
