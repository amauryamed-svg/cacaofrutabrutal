import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'

const RESEND_KEY = Deno.env.get('RESEND_API_KEY')!

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

const TIEMPOS_LABEL: Record<string, string> = {
  '3t': 'Tres Tiempos — 1 hora',
  '5t': 'Cinco Tiempos — 2 horas',
  '6t': 'Experiencia Completa — 3 horas',
}

const TIEMPOS_DESC: Record<string, string> = {
  '3t': 'Árbol al Fruto · Mucílago · Chocolate Ritual',
  '5t': 'Árbol al Fruto · Mucílago · Refinación · Chocolate Ritual · Impacto',
  '6t': 'Todos los Tiempos + Cierre de Impacto Regenerativo',
}

function fmtCOP(n: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0,
  }).format(n)
}

function buildHtml(payload: {
  nombre: string
  email: string
  participants: number
  tiempos: string
  ceremonial: boolean
  perPerson: number
  total: number
}) {
  const { nombre, email, participants, tiempos, ceremonial, perPerson, total } = payload
  const fecha = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })
  const validez = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })

  const waMsg = encodeURIComponent(
    `Hola Amaury, quiero confirmar mi cotización Caúa:\n• Nombre: ${nombre}\n• ${participants} participantes\n• ${TIEMPOS_LABEL[tiempos] ?? tiempos}` +
    (ceremonial ? `\n• + Upgrade Ceremonial Grade Hobo Huila` : '') +
    `\n• Total: ${fmtCOP(total)} COP`
  )

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Cotización Caúa — ${nombre}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #040C06; color: #F7F1EE; }
  .wrap { max-width: 640px; margin: 0 auto; background: #0A1A0C; }
  .header { background: linear-gradient(135deg, #1C3B26 0%, #0f1e19 100%);
    padding: 36px 40px; border-bottom: 6px solid #F1A91E; }
  .logo-row { display: flex; justify-content: space-between; align-items: flex-start; }
  .company { font-size: 16px; font-weight: 800; color: #F7F1EE; letter-spacing: 0.05em; }
  .company-sub { font-size: 11px; color: #91A63B; margin-top: 3px; }
  .doc-meta { text-align: right; font-size: 11px; color: #F7F1EE; opacity: 0.8; line-height: 1.7; }
  .doc-meta strong { color: #F1A91E; display: block; font-size: 13px; }
  .body { padding: 36px 40px; }
  .title { font-size: 26px; font-weight: 900; color: #F7F1EE; margin-bottom: 4px;
    letter-spacing: -0.5px; }
  .subtitle { font-size: 14px; color: #91A63B; font-style: italic; margin-bottom: 24px; }
  .intro-box { background: #132B1C; border-left: 4px solid #91A63B;
    padding: 14px 18px; margin-bottom: 32px; font-size: 13px; line-height: 1.6; }
  .intro-box strong { color: #91A63B; }
  .section-title { font-size: 11px; font-weight: 700; color: #91A63B; letter-spacing: 0.12em;
    text-transform: uppercase; margin-bottom: 12px; }
  .tiempos-grid { display: grid; grid-template-columns: 1fr 1fr 1fr;
    gap: 10px; margin-bottom: 32px; }
  .tiempo-card { background: #132B1C; border: 1px solid #335533; border-radius: 6px;
    padding: 12px; }
  .tiempo-num { width: 24px; height: 24px; border-radius: 50%; background: #91A63B;
    color: #040C06; font-weight: 900; font-size: 11px; display: flex;
    align-items: center; justify-content: center; margin-bottom: 8px; }
  .tiempo-title { font-size: 11px; font-weight: 700; color: #F7F1EE; margin-bottom: 4px; }
  .tiempo-desc { font-size: 10px; color: #91A63B; line-height: 1.5; }
  .config-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  .config-table td { padding: 10px 14px; border-bottom: 1px solid #1a2a1c; font-size: 13px; }
  .config-table .label { color: #91A63B; font-weight: 700; font-size: 11px;
    text-transform: uppercase; letter-spacing: 0.08em; width: 40%; }
  .config-table .value { color: #F7F1EE; }
  .price-box { background: linear-gradient(135deg, #1C3B2620 0%, #91A63B10 100%);
    border: 1.5px solid #F1A91E44; border-radius: 10px; padding: 22px 28px;
    margin-bottom: 28px; }
  .price-row { display: flex; justify-content: space-between; align-items: baseline;
    padding: 6px 0; border-bottom: 1px solid #335533; font-size: 13px; }
  .price-row:last-child { border-bottom: none; }
  .price-label { color: #91A63B; }
  .price-value { color: #F7F1EE; font-weight: 700; }
  .total-row { display: flex; justify-content: space-between; align-items: baseline;
    padding-top: 16px; margin-top: 8px; border-top: 2px solid #F1A91E44; }
  .total-label { font-size: 11px; font-weight: 700; color: #91A63B;
    text-transform: uppercase; letter-spacing: 0.1em; }
  .total-value { font-size: 32px; font-weight: 900; color: #F1A91E; }
  .upgrade-tag { display: inline-block; background: #8D2679; color: #F7F1EE;
    padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: 700;
    margin-top: 8px; }
  .terms { background: #132B1C; border-left: 4px solid #335533; padding: 16px 18px;
    margin-bottom: 28px; font-size: 12px; line-height: 1.8; color: #F7F1EE; opacity: 0.85; }
  .terms strong { color: #91A63B; }
  .cta { text-align: center; padding: 4px 0 32px; }
  .cta-btn { display: inline-block; padding: 14px 32px; border-radius: 8px;
    background: #F1A91E; color: #040C06; font-size: 14px; font-weight: 800;
    text-decoration: none; letter-spacing: 0.04em; }
  .footer { background: #132B1C; border-top: 1px solid #335533;
    padding: 24px 40px; text-align: center; font-size: 11px; color: #91A63B;
    line-height: 1.8; }
  @media print {
    body { background: white; color: #111; }
    .wrap { max-width: 100%; }
    .cta { display: none; }
  }
</style>
</head>
<body>
<div class="wrap">

  <!-- MEMBRETE -->
  <div class="header">
    <div class="logo-row">
      <div>
        <div class="company">CAUA COLOMBIA SAS</div>
        <div class="company-sub">NIT 901213846-7 · Biotecnología Ancestral del Cacao</div>
      </div>
      <div class="doc-meta">
        <strong>COTIZACIÓN</strong>
        ${fecha}<br>
        Válida hasta: ${validez}
      </div>
    </div>
  </div>

  <!-- CUERPO -->
  <div class="body">

    <div class="title">CATACIÓN: CINCO TIEMPOS DE CACAO</div>
    <div class="subtitle">Experiencia Sensorial Inmersiva Regenerativa · Guiada por Cacaotier</div>

    <div class="intro-box">
      <strong>Preparada para:</strong> ${nombre} &nbsp;·&nbsp; ${email}<br>
      <strong>Facilitador:</strong> Amaury Amed (Cacaotier &amp; CTO Caúa) · 📱 3102227848
    </div>

    <!-- CINCO TIEMPOS -->
    <div class="section-title">Los Tiempos de la Experiencia</div>
    <div class="tiempos-grid">
      <div class="tiempo-card">
        <div class="tiempo-num">1</div>
        <div class="tiempo-title">Árbol al Fruto</div>
        <div class="tiempo-desc">Mazorca fresca. Bioma vivo de Arauca.</div>
      </div>
      <div class="tiempo-card">
        <div class="tiempo-num">2</div>
        <div class="tiempo-title">Origen Regenerativo</div>
        <div class="tiempo-desc">Trazabilidad total. Cacao liofilizado.</div>
      </div>
      <div class="tiempo-card">
        <div class="tiempo-num">3</div>
        <div class="tiempo-title">Mucílago Molecular</div>
        <div class="tiempo-desc">Pulpa granizada. Superalimento ancestral.</div>
      </div>
      <div class="tiempo-card">
        <div class="tiempo-num">4</div>
        <div class="tiempo-title">Refinación Artesanal</div>
        <div class="tiempo-desc">Barra 250g · Hobo, Huila · 100% Licor.</div>
      </div>
      <div class="tiempo-card">
        <div class="tiempo-num">5</div>
        <div class="tiempo-title">Chocolate Ritual</div>
        <div class="tiempo-desc">Preparación ceremonial colectiva.</div>
      </div>
      ${tiempos === '6t' ? `
      <div class="tiempo-card">
        <div class="tiempo-num">6</div>
        <div class="tiempo-title">Impacto Regenerativo</div>
        <div class="tiempo-desc">Cierre de triple impacto: comunidad · agricultor · ecosistema.</div>
      </div>` : ''}
    </div>

    <!-- CONFIGURACIÓN -->
    <div class="section-title">Configuración de tu Experiencia</div>
    <table class="config-table">
      <tr>
        <td class="label">Participantes</td>
        <td class="value">${participants} personas</td>
      </tr>
      <tr>
        <td class="label">Experiencia</td>
        <td class="value">${TIEMPOS_LABEL[tiempos] ?? tiempos}</td>
      </tr>
      <tr>
        <td class="label">Recorridos</td>
        <td class="value">${TIEMPOS_DESC[tiempos] ?? ''}</td>
      </tr>
      ${ceremonial ? `<tr>
        <td class="label">Upgrade</td>
        <td class="value">
          ✦ Ceremonial Grade CAUA · Finca Santa María · Hobo, Huila · Origen Único
          <span class="upgrade-tag">CEREMONIAL GRADE</span>
        </td>
      </tr>` : ''}
    </table>

    <!-- PRECIO -->
    <div class="price-box">
      <div class="price-row">
        <span class="price-label">Precio por persona</span>
        <span class="price-value">${fmtCOP(perPerson)}</span>
      </div>
      <div class="price-row">
        <span class="price-label">Participantes</span>
        <span class="price-value">× ${participants}</span>
      </div>
      <div class="total-row">
        <span class="total-label">Total inversión</span>
        <span class="total-value">${fmtCOP(total)}</span>
      </div>
    </div>

    <!-- TÉRMINOS -->
    <div class="terms">
      <strong>Términos:</strong><br>
      ✓ <strong>Validez:</strong> 30 días desde ${fecha}<br>
      ✓ <strong>Pago:</strong> Contraentrega el día del evento<br>
      ✓ <strong>Documento:</strong> Factura Electrónica de Servicios<br>
      ✓ <strong>Mínimo:</strong> 2 participantes · <strong>Sin límite máximo</strong>
    </div>

    <!-- CTA -->
    <div class="cta">
      <a class="cta-btn" href="https://wa.me/573102227848?text=${waMsg}">
        📱 Confirmar por WhatsApp
      </a>
    </div>

  </div><!-- /body -->

  <div class="footer">
    <strong>CAUA COLOMBIA SAS · NIT 901213846-7</strong><br>
    Biotecnología ancestral del cacao colombiano · Del genoma colombiano al mundo<br>
    📧 amaury@cauacolombia.co · 📱 +57 310 222 7848 · 🌐 www.cacaofrutabrutal.com
  </div>

</div><!-- /wrap -->
</body>
</html>`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: CORS })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: CORS })

  try {
    const body = await req.json()
    const { nombre, email, participants, tiempos, ceremonial, perPerson, total } = body

    if (!nombre || !email) {
      return new Response(JSON.stringify({ error: 'nombre y email son requeridos' }),
        { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } })
    }

    const html = buildHtml({ nombre, email, participants, tiempos, ceremonial, perPerson, total })

    // 1. Enviar cotización al lead
    const leadRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_KEY}` },
      body: JSON.stringify({
        from: 'Caúa <onboarding@resend.dev>',
        to: email,
        subject: `Tu cotización Caúa — Catación Cinco Tiempos 🫘`,
        html,
      }),
    })
    const leadData = await leadRes.json()

    // 2. Notificar a Amaury
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_KEY}` },
      body: JSON.stringify({
        from: 'Caúa CRM <onboarding@resend.dev>',
        to: 'amaury@cauacolombia.co',
        subject: `🫘 Nueva cotización: ${nombre} — ${participants}p · ${fmtCOP(total)}`,
        html: `<p style="font-family:sans-serif;background:#040C06;color:#F7F1EE;padding:24px">
          <strong style="color:#F1A91E">${nombre}</strong> (${email}) solicitó una cotización.<br><br>
          <strong>Participantes:</strong> ${participants}<br>
          <strong>Experiencia:</strong> ${TIEMPOS_LABEL[tiempos] ?? tiempos}<br>
          ${ceremonial ? '<strong>Upgrade Ceremonial Grade:</strong> ✓<br>' : ''}
          <strong>Total:</strong> ${fmtCOP(total)}<br><br>
          <a href="https://wa.me/57${encodeURIComponent(email)}" style="color:#F1A91E">Responder por WhatsApp</a>
        </p>`,
      }),
    })

    return new Response(JSON.stringify({ success: !!leadData.id, id: leadData.id }),
      { status: leadData.id ? 200 : 500, headers: { ...CORS, 'Content-Type': 'application/json' } })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: msg }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } })
  }
})
