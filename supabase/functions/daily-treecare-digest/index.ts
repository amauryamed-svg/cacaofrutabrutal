// ═══════════════════════════════════════════════════════════════════
// CAUA Corporation — daily-treecare-digest
// ───────────────────────────────────────────────────────────────────
// Daily 8am Bogotá (13:07 UTC) audit of the tree-care system. Pulls
// last 24h activity, generates a markdown summary, attaches it to a
// HTML email and sends to amaury@cauaculture.co.
//
// To save to Google Drive: open the Gmail email → click the .md
// attachment → "Save to Drive" (1 click). Or set up a Gmail filter
// that auto-saves attachments tagged with "[CAÚA tree-care]".
//
// Auth: Bearer ADMIN_BEARER_TOKEN. Mirrors notify-tree-care pattern.
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY,
//      ADMIN_BEARER_TOKEN
// ═══════════════════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

const supabaseUrl        = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const resendApiKey       = (Deno.env.get('RESEND_API_KEY') ?? '').trim()
const adminBearerToken   = Deno.env.get('ADMIN_BEARER_TOKEN') ?? ''

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { headers: { Authorization: `Bearer ${supabaseServiceKey}`, apikey: supabaseServiceKey } },
})

const TO_EMAIL    = 'amaury@cauaculture.co'
const FROM_NAME   = 'Amaury Amed · CAÚA'
const FROM_EMAIL  = 'amaury@cauaculture.co'
const LOGO_URL    = 'https://kjygovuiphbxcdxeduco.supabase.co/storage/v1/object/public/public-assets/logo-caua-primary-horizontal.png'

const C = {
  heirloom: '#F7F1EE',
  amazon:   '#1C3B26',
  criollo:  '#881C79',
  mazorca:  '#EEA110',
  pod:      '#87AA27',
  santa:    '#583915',
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } })
}

interface VisitorJourney {
  visitor_id: string
  cohort: string | null
  email: string | null
  events: number
  first_seen: string
  last_seen: string
  hitos_done: number[]
  form_submitted: boolean
  redeemed: boolean
  utm_campaign: string | null
}

interface Stats {
  sent: Array<{ notification_type: string; n: number; delivered: number }>
  new_users: number
  new_trees: number
  alive: number
  dying: number
  dead_24h: number
  goldenticket: {
    events: number
    visitors: number
    cohorts: Record<string, number>
    funnel: { page_view: number; hito_click: number; form_submit: number; share_click: number; redeem_click: number; other: number }
    hitos: Record<number, number>  // hito_n -> count
    top_visitors: VisitorJourney[]
    cohort_funnel: Record<string, { visitors: number; with_hito: number; with_form: number; redeemed: number }>
  }
}

async function pullStats(): Promise<Stats> {
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString()

  const [sentRes, usersRes, treesRes, eventsRes] = await Promise.all([
    supabase.from('tree_care_notifications')
      .select('notification_type, resend_message_id')
      .gte('sent_at', since),
    supabase.from('user_profiles').select('user_id', { count: 'exact', head: true }).gte('created_at', since),
    supabase.from('cacao_trees').select('id, adopted_at, died_at, vitals_critical_since'),
    supabase.from('goldenticket_events')
      .select('visitor_id, cohort, event_type, hito_n, email, utm, occurred_at')
      .gte('occurred_at', since)
      .order('occurred_at', { ascending: true }),
  ])

  const sentByType: Record<string, { n: number; delivered: number }> = {}
  for (const row of (sentRes.data ?? [])) {
    const t = row.notification_type as string
    if (!sentByType[t]) sentByType[t] = { n: 0, delivered: 0 }
    sentByType[t].n++
    if (row.resend_message_id) sentByType[t].delivered++
  }
  const sent = Object.entries(sentByType).map(([notification_type, v]) => ({ notification_type, ...v }))

  const allTrees = treesRes.data ?? []
  const sinceMs = new Date(since).getTime()
  let alive = 0, dying = 0, dead_24h = 0, new_trees = 0
  for (const t of allTrees) {
    const adoptedMs = new Date(t.adopted_at as string).getTime()
    if (adoptedMs >= sinceMs) new_trees++
    if (!t.died_at) {
      alive++
      if (t.vitals_critical_since) {
        const critMs = new Date(t.vitals_critical_since as string).getTime()
        if (Date.now() - critMs >= 12 * 3600 * 1000) dying++
      }
    } else {
      const diedMs = new Date(t.died_at as string).getTime()
      if (diedMs >= sinceMs) dead_24h++
    }
  }

  // ─── Goldenticket campaign analytics ──────────────────────────────
  const events = (eventsRes.data ?? []) as any[]
  const cohorts: Record<string, number> = {}
  const funnel = { page_view: 0, hito_click: 0, form_submit: 0, share_click: 0, redeem_click: 0, other: 0 }
  const hitos: Record<number, number> = {}

  // Build per-visitor journeys
  const journeyByVisitor = new Map<string, VisitorJourney>()

  for (const e of events) {
    const c = (e.cohort as string) ?? 'unknown'
    cohorts[c] = (cohorts[c] ?? 0) + 1

    const et = e.event_type as string
    if (et === 'page_view') funnel.page_view++
    else if (et === 'hito_click') funnel.hito_click++
    else if (et === 'form_submit') funnel.form_submit++
    else if (et === 'share_click') funnel.share_click++
    else if (et === 'redeem_click') funnel.redeem_click++
    else funnel.other++

    if (et === 'hito_click' && typeof e.hito_n === 'number') {
      hitos[e.hito_n] = (hitos[e.hito_n] ?? 0) + 1
    }

    const vid = e.visitor_id as string
    let j = journeyByVisitor.get(vid)
    if (!j) {
      j = {
        visitor_id: vid,
        cohort: e.cohort ?? null,
        email: e.email ?? null,
        events: 0,
        first_seen: e.occurred_at,
        last_seen: e.occurred_at,
        hitos_done: [],
        form_submitted: false,
        redeemed: false,
        utm_campaign: (e.utm && (e.utm.utm_campaign || e.utm.campaign)) ?? null,
      }
      journeyByVisitor.set(vid, j)
    }
    j.events++
    if (e.occurred_at < j.first_seen) j.first_seen = e.occurred_at
    if (e.occurred_at > j.last_seen) j.last_seen = e.occurred_at
    if (e.email && !j.email) j.email = e.email
    if (e.cohort && !j.cohort) j.cohort = e.cohort
    if (et === 'hito_click' && typeof e.hito_n === 'number' && !j.hitos_done.includes(e.hito_n)) {
      j.hitos_done.push(e.hito_n)
    }
    if (et === 'form_submit') j.form_submitted = true
    if (et === 'redeem_click') j.redeemed = true
  }

  // Top 10 most-engaged visitors
  const top_visitors = Array.from(journeyByVisitor.values())
    .sort((a, b) => b.events - a.events)
    .slice(0, 10)

  // Cohort funnel
  const cohort_funnel: Record<string, { visitors: number; with_hito: number; with_form: number; redeemed: number }> = {}
  for (const j of journeyByVisitor.values()) {
    const c = j.cohort ?? 'unknown'
    if (!cohort_funnel[c]) cohort_funnel[c] = { visitors: 0, with_hito: 0, with_form: 0, redeemed: 0 }
    cohort_funnel[c].visitors++
    if (j.hitos_done.length > 0) cohort_funnel[c].with_hito++
    if (j.form_submitted) cohort_funnel[c].with_form++
    if (j.redeemed) cohort_funnel[c].redeemed++
  }

  return {
    sent,
    new_users: usersRes.count ?? 0,
    new_trees,
    alive,
    dying,
    dead_24h,
    goldenticket: {
      events: events.length,
      visitors: journeyByVisitor.size,
      cohorts,
      funnel,
      hitos,
      top_visitors,
      cohort_funnel,
    },
  }
}

function fmtMd(s: Stats, dateStr: string): string {
  const totalSent = s.sent.reduce((a, b) => a + b.n, 0)
  const totalDelivered = s.sent.reduce((a, b) => a + b.delivered, 0)

  const lines: string[] = []
  lines.push(`# 🌱 Tree-care daily · ${dateStr}`)
  lines.push('')
  lines.push(`> Reporte automático del sistema notify-tree-care · CAÚA Phase 1.6`)
  lines.push('')
  lines.push(`## Resumen`)
  lines.push(`- **Emails enviados (24h)**: ${totalSent} (${totalDelivered} confirmados por Resend)`)
  lines.push(`- **Nuevos usuarios CFB**: ${s.new_users}`)
  lines.push(`- **Nuevos árboles adoptados**: ${s.new_trees}`)
  lines.push(`- **Árboles vivos**: ${s.alive}`)
  lines.push(`- **Árboles muriendo** (vitals críticos ≥12h): **${s.dying}**`)
  lines.push(`- **Árboles muertos hoy**: ${s.dead_24h}`)
  lines.push('')
  if (s.sent.length > 0) {
    lines.push(`## Emails por tipo`)
    lines.push('| Tipo | Enviados | Confirmados |')
    lines.push('|---|---|---|')
    for (const x of s.sent) lines.push(`| ${x.notification_type} | ${x.n} | ${x.delivered} |`)
    lines.push('')
  }
  lines.push(`## /creyente · comportamiento (24h)`)
  lines.push(`- Eventos totales: **${s.goldenticket.events}** · visitors únicos: **${s.goldenticket.visitors}**`)
  lines.push('')
  lines.push(`### Funnel`)
  lines.push(`| Etapa | Eventos |`)
  lines.push(`|---|---|`)
  lines.push(`| 📄 page_view | ${s.goldenticket.funnel.page_view} |`)
  lines.push(`| 🎯 hito_click | ${s.goldenticket.funnel.hito_click} |`)
  lines.push(`| 📤 share_click | ${s.goldenticket.funnel.share_click} |`)
  lines.push(`| 📝 form_submit | ${s.goldenticket.funnel.form_submit} |`)
  lines.push(`| 🎟️ redeem_click | ${s.goldenticket.funnel.redeem_click} |`)
  lines.push('')
  if (Object.keys(s.goldenticket.hitos).length > 0) {
    lines.push(`### Hitos completados (clicks)`)
    for (const n of [1, 2, 3, 4]) {
      const count = s.goldenticket.hitos[n] ?? 0
      lines.push(`- Hito ${n}: ${count}`)
    }
    lines.push('')
  }
  if (Object.keys(s.goldenticket.cohort_funnel).length > 0) {
    lines.push(`### Cohort funnel`)
    lines.push(`| Cohort | Visitors | con hito | con form | redeemed |`)
    lines.push(`|---|---|---|---|---|`)
    for (const [c, v] of Object.entries(s.goldenticket.cohort_funnel)) {
      lines.push(`| \`${c}\` | ${v.visitors} | ${v.with_hito} | ${v.with_form} | ${v.redeemed} |`)
    }
    lines.push('')
  }
  if (s.goldenticket.top_visitors.length > 0) {
    lines.push(`### Top 10 visitors (por engagement)`)
    lines.push(`| # | visitor_id | cohort | events | hitos | form | redeem | email |`)
    lines.push(`|---|---|---|---|---|---|---|---|`)
    s.goldenticket.top_visitors.forEach((v, i) => {
      const vid = v.visitor_id.slice(0, 8) + '…'
      const hitosStr = v.hitos_done.sort().join(',') || '—'
      const email = v.email ?? '—'
      lines.push(`| ${i + 1} | \`${vid}\` | ${v.cohort ?? '—'} | ${v.events} | ${hitosStr} | ${v.form_submitted ? '✓' : '—'} | ${v.redeemed ? '✓' : '—'} | ${email} |`)
    })
    lines.push('')
  }
  if (s.dying > 0 || s.dead_24h > 0) {
    lines.push(`## ⚠️  Acción recomendada`)
    if (s.dying > 0) lines.push(`- ${s.dying} árbol(es) en estado crítico — los emails dying ya se enviaron, monitor en \`npm run monitor:cfb\``)
    if (s.dead_24h > 0) lines.push(`- ${s.dead_24h} árbol(es) muerto(s) hoy — outreach personal sugerido`)
    lines.push('')
  } else {
    lines.push(`## ✓ Todo limpio · sin alertas`)
    lines.push('')
  }
  lines.push(`---`)
  lines.push(`Sistema: \`notify-tree-care\` (hourly :15) · \`daily-treecare-digest\` (8am Bogotá) · Supabase project \`kjygovuiphbxcdxeduco\``)
  return lines.join('\n')
}

function fmtHTML(s: Stats, dateStr: string, mdLink: string | null): string {
  const totalSent = s.sent.reduce((a, b) => a + b.n, 0)
  const totalDelivered = s.sent.reduce((a, b) => a + b.delivered, 0)
  const hasAlerts = s.dying > 0 || s.dead_24h > 0
  const accentColor = hasAlerts ? C.mazorca : C.pod

  const sentRows = s.sent.map(x => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid ${C.amazon}22;font-family:Georgia,serif;font-size:13px;color:${C.amazon};">${x.notification_type}</td>
      <td style="padding:8px 12px;border-bottom:1px solid ${C.amazon}22;font-family:'SF Mono',Consolas,monospace;font-size:13px;color:${C.amazon};text-align:right;">${x.n}</td>
      <td style="padding:8px 12px;border-bottom:1px solid ${C.amazon}22;font-family:'SF Mono',Consolas,monospace;font-size:13px;color:${C.pod};text-align:right;">${x.delivered}</td>
    </tr>
  `).join('')

  const cohortLines = Object.entries(s.goldenticket.cohorts)
    .map(([k, v]) => `<li style="margin:0;font-family:Georgia,serif;font-size:13px;color:${C.amazon};"><code style="background:${C.heirloom};padding:2px 6px;border:1px solid ${C.amazon}22;font-family:'SF Mono',Consolas,monospace;font-size:11px;">${k}</code> · ${v}</li>`)
    .join('')

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tree-care daily · ${dateStr}</title></head>
<body style="margin:0;padding:0;background:${C.heirloom};font-family:'Helvetica Neue',Arial,sans-serif;color:${C.amazon};">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${C.heirloom};padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background:${C.heirloom};">
        <tr><td align="center" style="padding:0 0 24px;">
          <img src="${LOGO_URL}" alt="CAÚA" width="160" style="display:block;width:160px;height:auto;border:0;" />
        </td></tr>
        <tr><td style="padding:0 28px 8px;">
          <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-weight:700;font-size:11px;color:${accentColor};letter-spacing:0.28em;text-transform:uppercase;margin-bottom:14px;">Tree-care daily · ${dateStr}</div>
          <h1 style="margin:0 0 8px;font-family:'Helvetica Neue',Arial,sans-serif;font-weight:900;font-size:30px;line-height:1.04;color:${C.amazon};letter-spacing:-0.015em;">
            ${hasAlerts ? `<span style="color:${C.mazorca};">${s.dying + s.dead_24h}</span> alerta${(s.dying + s.dead_24h) === 1 ? '' : 's'}` : 'Sistema saludable.'}
          </h1>
        </td></tr>

        <!-- Resumen numérico -->
        <tr><td style="padding:24px 28px 8px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="padding:12px;background:${C.pod}1A;border-left:3px solid ${C.pod};width:33%;">
                <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-weight:900;font-size:24px;color:${C.amazon};">${totalSent}</div>
                <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:10px;letter-spacing:0.18em;color:${C.amazon}99;text-transform:uppercase;">Emails enviados</div>
                <div style="font-family:Georgia,serif;font-size:11px;color:${C.amazon}99;margin-top:4px;">${totalDelivered} confirmados</div>
              </td>
              <td style="width:8px;"></td>
              <td style="padding:12px;background:${C.criollo}14;border-left:3px solid ${C.criollo};width:33%;">
                <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-weight:900;font-size:24px;color:${C.amazon};">${s.new_users}</div>
                <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:10px;letter-spacing:0.18em;color:${C.amazon}99;text-transform:uppercase;">Nuevos users</div>
                <div style="font-family:Georgia,serif;font-size:11px;color:${C.amazon}99;margin-top:4px;">${s.new_trees} árboles</div>
              </td>
              <td style="width:8px;"></td>
              <td style="padding:12px;background:${hasAlerts ? C.mazorca + '26' : C.amazon + '0F'};border-left:3px solid ${hasAlerts ? C.mazorca : C.amazon};width:33%;">
                <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-weight:900;font-size:24px;color:${hasAlerts ? C.santa : C.amazon};">${s.dying + s.dead_24h}</div>
                <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:10px;letter-spacing:0.18em;color:${C.amazon}99;text-transform:uppercase;">Árboles en riesgo</div>
                <div style="font-family:Georgia,serif;font-size:11px;color:${C.amazon}99;margin-top:4px;">${s.dying} críticos · ${s.dead_24h} muertos</div>
              </td>
            </tr>
          </table>
        </td></tr>

        ${s.sent.length > 0 ? `
        <tr><td style="padding:24px 28px 8px;">
          <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-weight:700;font-size:11px;color:${C.criollo};letter-spacing:0.22em;text-transform:uppercase;margin-bottom:8px;">Emails por tipo</div>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid ${C.amazon}22;">
            <thead>
              <tr>
                <th style="padding:8px 12px;background:${C.amazon}0F;font-family:'Helvetica Neue',Arial,sans-serif;font-size:10px;letter-spacing:0.18em;color:${C.amazon};text-transform:uppercase;text-align:left;">Tipo</th>
                <th style="padding:8px 12px;background:${C.amazon}0F;font-family:'Helvetica Neue',Arial,sans-serif;font-size:10px;letter-spacing:0.18em;color:${C.amazon};text-transform:uppercase;text-align:right;">Enviados</th>
                <th style="padding:8px 12px;background:${C.amazon}0F;font-family:'Helvetica Neue',Arial,sans-serif;font-size:10px;letter-spacing:0.18em;color:${C.amazon};text-transform:uppercase;text-align:right;">Confirmados</th>
              </tr>
            </thead>
            <tbody>${sentRows}</tbody>
          </table>
        </td></tr>
        ` : ''}

        ${s.goldenticket.events > 0 ? `
        <tr><td style="padding:24px 28px 8px;">
          <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-weight:700;font-size:11px;color:${C.criollo};letter-spacing:0.22em;text-transform:uppercase;margin-bottom:12px;">/creyente · comportamiento 24h</div>
          <p style="margin:0 0 12px;font-family:Georgia,serif;font-size:14px;color:${C.amazon};">${s.goldenticket.events} eventos · <strong>${s.goldenticket.visitors}</strong> visitors únicos</p>

          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:14px;border:1px solid ${C.amazon}22;">
            <thead>
              <tr>
                <th style="padding:6px 10px;background:${C.amazon}0F;font-family:'Helvetica Neue',Arial,sans-serif;font-size:9px;letter-spacing:0.18em;color:${C.amazon};text-transform:uppercase;text-align:left;">Funnel</th>
                <th style="padding:6px 10px;background:${C.amazon}0F;font-family:'Helvetica Neue',Arial,sans-serif;font-size:9px;letter-spacing:0.18em;color:${C.amazon};text-transform:uppercase;text-align:right;">Eventos</th>
              </tr>
            </thead>
            <tbody>
              <tr><td style="padding:6px 10px;border-bottom:1px solid ${C.amazon}22;font-family:Georgia,serif;font-size:13px;color:${C.amazon};">📄 page_view</td><td style="padding:6px 10px;border-bottom:1px solid ${C.amazon}22;font-family:'SF Mono',Consolas,monospace;font-size:13px;text-align:right;color:${C.amazon};">${s.goldenticket.funnel.page_view}</td></tr>
              <tr><td style="padding:6px 10px;border-bottom:1px solid ${C.amazon}22;font-family:Georgia,serif;font-size:13px;color:${C.amazon};">🎯 hito_click</td><td style="padding:6px 10px;border-bottom:1px solid ${C.amazon}22;font-family:'SF Mono',Consolas,monospace;font-size:13px;text-align:right;color:${C.amazon};">${s.goldenticket.funnel.hito_click}</td></tr>
              <tr><td style="padding:6px 10px;border-bottom:1px solid ${C.amazon}22;font-family:Georgia,serif;font-size:13px;color:${C.amazon};">📤 share_click</td><td style="padding:6px 10px;border-bottom:1px solid ${C.amazon}22;font-family:'SF Mono',Consolas,monospace;font-size:13px;text-align:right;color:${C.amazon};">${s.goldenticket.funnel.share_click}</td></tr>
              <tr><td style="padding:6px 10px;border-bottom:1px solid ${C.amazon}22;font-family:Georgia,serif;font-size:13px;color:${C.amazon};">📝 form_submit</td><td style="padding:6px 10px;border-bottom:1px solid ${C.amazon}22;font-family:'SF Mono',Consolas,monospace;font-size:13px;text-align:right;color:${C.amazon};">${s.goldenticket.funnel.form_submit}</td></tr>
              <tr><td style="padding:6px 10px;font-family:Georgia,serif;font-size:13px;color:${C.amazon};">🎟️ redeem_click</td><td style="padding:6px 10px;font-family:'SF Mono',Consolas,monospace;font-size:13px;text-align:right;color:${C.criollo};font-weight:700;">${s.goldenticket.funnel.redeem_click}</td></tr>
            </tbody>
          </table>

          ${Object.keys(s.goldenticket.cohort_funnel).length > 0 ? `
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:14px;border:1px solid ${C.amazon}22;">
            <thead>
              <tr>
                <th style="padding:6px 10px;background:${C.amazon}0F;font-family:'Helvetica Neue',Arial,sans-serif;font-size:9px;letter-spacing:0.18em;color:${C.amazon};text-transform:uppercase;text-align:left;">Cohort</th>
                <th style="padding:6px 10px;background:${C.amazon}0F;font-family:'Helvetica Neue',Arial,sans-serif;font-size:9px;letter-spacing:0.18em;color:${C.amazon};text-transform:uppercase;text-align:right;">Visitors</th>
                <th style="padding:6px 10px;background:${C.amazon}0F;font-family:'Helvetica Neue',Arial,sans-serif;font-size:9px;letter-spacing:0.18em;color:${C.amazon};text-transform:uppercase;text-align:right;">Hito</th>
                <th style="padding:6px 10px;background:${C.amazon}0F;font-family:'Helvetica Neue',Arial,sans-serif;font-size:9px;letter-spacing:0.18em;color:${C.amazon};text-transform:uppercase;text-align:right;">Form</th>
                <th style="padding:6px 10px;background:${C.amazon}0F;font-family:'Helvetica Neue',Arial,sans-serif;font-size:9px;letter-spacing:0.18em;color:${C.amazon};text-transform:uppercase;text-align:right;">Redeem</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(s.goldenticket.cohort_funnel).map(([c, v]) => `
                <tr>
                  <td style="padding:6px 10px;border-bottom:1px solid ${C.amazon}22;font-family:'SF Mono',Consolas,monospace;font-size:11px;color:${C.amazon};">${c}</td>
                  <td style="padding:6px 10px;border-bottom:1px solid ${C.amazon}22;font-family:'SF Mono',Consolas,monospace;font-size:13px;text-align:right;color:${C.amazon};">${v.visitors}</td>
                  <td style="padding:6px 10px;border-bottom:1px solid ${C.amazon}22;font-family:'SF Mono',Consolas,monospace;font-size:13px;text-align:right;color:${C.amazon};">${v.with_hito}</td>
                  <td style="padding:6px 10px;border-bottom:1px solid ${C.amazon}22;font-family:'SF Mono',Consolas,monospace;font-size:13px;text-align:right;color:${C.amazon};">${v.with_form}</td>
                  <td style="padding:6px 10px;border-bottom:1px solid ${C.amazon}22;font-family:'SF Mono',Consolas,monospace;font-size:13px;text-align:right;color:${C.criollo};font-weight:700;">${v.redeemed}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          ` : ''}

          ${s.goldenticket.top_visitors.length > 0 ? `
          <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-weight:700;font-size:10px;color:${C.criollo};letter-spacing:0.18em;text-transform:uppercase;margin:8px 0 6px;">Top engaged visitors</div>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid ${C.amazon}22;">
            <thead>
              <tr>
                <th style="padding:6px 8px;background:${C.amazon}0F;font-family:'Helvetica Neue',Arial,sans-serif;font-size:9px;letter-spacing:0.14em;color:${C.amazon};text-transform:uppercase;text-align:left;">visitor</th>
                <th style="padding:6px 8px;background:${C.amazon}0F;font-family:'Helvetica Neue',Arial,sans-serif;font-size:9px;letter-spacing:0.14em;color:${C.amazon};text-transform:uppercase;text-align:right;">events</th>
                <th style="padding:6px 8px;background:${C.amazon}0F;font-family:'Helvetica Neue',Arial,sans-serif;font-size:9px;letter-spacing:0.14em;color:${C.amazon};text-transform:uppercase;text-align:left;">hitos</th>
                <th style="padding:6px 8px;background:${C.amazon}0F;font-family:'Helvetica Neue',Arial,sans-serif;font-size:9px;letter-spacing:0.14em;color:${C.amazon};text-transform:uppercase;text-align:left;">cohort</th>
                <th style="padding:6px 8px;background:${C.amazon}0F;font-family:'Helvetica Neue',Arial,sans-serif;font-size:9px;letter-spacing:0.14em;color:${C.amazon};text-transform:uppercase;text-align:left;">email</th>
              </tr>
            </thead>
            <tbody>
              ${s.goldenticket.top_visitors.map(v => `
                <tr>
                  <td style="padding:6px 8px;border-bottom:1px solid ${C.amazon}22;font-family:'SF Mono',Consolas,monospace;font-size:10px;color:${C.amazon}99;">${v.visitor_id.slice(0, 8)}…</td>
                  <td style="padding:6px 8px;border-bottom:1px solid ${C.amazon}22;font-family:'SF Mono',Consolas,monospace;font-size:12px;text-align:right;color:${C.amazon};">${v.events}</td>
                  <td style="padding:6px 8px;border-bottom:1px solid ${C.amazon}22;font-family:'SF Mono',Consolas,monospace;font-size:11px;color:${C.pod};">${v.hitos_done.length > 0 ? v.hitos_done.sort().join(',') : '—'}${v.form_submitted ? ' +F' : ''}${v.redeemed ? ' +R' : ''}</td>
                  <td style="padding:6px 8px;border-bottom:1px solid ${C.amazon}22;font-family:'SF Mono',Consolas,monospace;font-size:10px;color:${C.amazon};">${v.cohort ?? '—'}</td>
                  <td style="padding:6px 8px;border-bottom:1px solid ${C.amazon}22;font-family:Georgia,serif;font-size:11px;color:${C.amazon};">${v.email ?? '—'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          ` : ''}
        </td></tr>
        ` : ''}

        ${mdLink ? `
        <tr><td style="padding:24px 28px 8px;">
          <p style="margin:0 0 8px;font-family:Georgia,serif;font-size:13px;color:${C.amazon}99;">📎 Reporte adjunto en markdown — abre el adjunto en Gmail y dale "Save to Drive" para guardar el log diario.</p>
        </td></tr>
        ` : ''}

        <tr><td style="padding:24px 28px;"><div style="height:1px;background:${C.amazon}22;"></div></td></tr>
        <tr><td style="padding:0 28px 28px;text-align:center;">
          <p style="margin:0 0 6px;font-size:10px;letter-spacing:0.14em;color:${C.amazon}66;font-family:'Helvetica Neue',Arial,sans-serif;text-transform:uppercase;">Generado por daily-treecare-digest</p>
          <p style="margin:0;font-size:9px;color:${C.amazon}44;line-height:1.6;font-family:'SF Mono',Consolas,monospace;">supabase://kjygovuiphbxcdxeduco/functions/daily-treecare-digest</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS })
  if (req.method !== 'POST') return jsonResponse({ error: 'method_not_allowed' }, 405)

  const authHeader = req.headers.get('authorization') ?? ''
  if (!adminBearerToken) return jsonResponse({ error: 'admin_bearer_token_not_configured' }, 503)
  if (authHeader !== `Bearer ${adminBearerToken}`) return jsonResponse({ error: 'unauthorized' }, 401)
  if (!resendApiKey) return jsonResponse({ error: 'resend_not_configured' }, 503)

  try {
    const stats = await pullStats()
    const dateStr = new Date().toISOString().slice(0, 10)
    const md = fmtMd(stats, dateStr)
    const html = fmtHTML(stats, dateStr, null)

    // Upload markdown to Supabase Storage (public-assets bucket, digests/ prefix)
    const filename = `digests/tree-care-${dateStr}.md`
    const { error: upErr } = await supabase.storage
      .from('public-assets')
      .upload(filename, new Blob([md], { type: 'text/markdown' }), {
        contentType: 'text/markdown',
        upsert: true,
      })
    if (upErr) console.error('[digest] storage upload failed:', upErr.message)
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/public-assets/${filename}`

    // Send via Resend with markdown attachment
    const mdBase64 = btoa(unescape(encodeURIComponent(md)))
    const subject = `🌱 Tree-care daily · ${dateStr}${stats.dying + stats.dead_24h > 0 ? ` · ${stats.dying + stats.dead_24h} alerta` : ''}`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${resendApiKey}` },
      body: JSON.stringify({
        from:    `${FROM_NAME} <${FROM_EMAIL}>`,
        to:      TO_EMAIL,
        subject,
        html:    fmtHTML(stats, dateStr, publicUrl),
        text:    md,
        reply_to: TO_EMAIL,
        attachments: [
          {
            filename: `tree-care-${dateStr}.md`,
            content:  mdBase64,
          },
        ],
      }),
    })
    const json = await res.json().catch(() => null) as { id?: string } | null
    if (!res.ok || !json?.id) {
      throw new Error(`resend_${res.status}: ${JSON.stringify(json)}`)
    }

    console.log(JSON.stringify({ at: 'daily-treecare-digest', date: dateStr, resend_id: json.id, public_url: publicUrl, stats }))

    return jsonResponse({
      ok: true,
      date: dateStr,
      resend_id: json.id,
      public_url: publicUrl,
      stats: {
        emails_sent_24h: stats.sent.reduce((a, b) => a + b.n, 0),
        new_users_24h: stats.new_users,
        new_trees_24h: stats.new_trees,
        alive: stats.alive,
        dying: stats.dying,
        dead_24h: stats.dead_24h,
        goldenticket_events: stats.goldenticket.events,
      },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown_error'
    console.error('[daily-treecare-digest] fatal:', msg)
    return jsonResponse({ error: msg }, 500)
  }
})
