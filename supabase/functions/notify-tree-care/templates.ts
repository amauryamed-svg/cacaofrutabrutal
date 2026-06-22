// ═══════════════════════════════════════════════════════════════════
// CAUA Corporation — notify-tree-care templates
// ───────────────────────────────────────────────────────────────────
// Personal-voice nurturing emails — Amaury Amed (CTO bogotano) writes
// by name in tú-form Spanish. No voseo (no respondé, no sembrás, no
// activás), no Argentine/caleño slang.
//
// FROM: Amaury Amed · CAÚA <amaury@cauaculture.co>
// REPLY-TO: amaury@cauaculture.co
// ═══════════════════════════════════════════════════════════════════

const C = {
  heirloom: '#F7F1EE',
  amazon:   '#1C3B26',
  criollo:  '#881C79',
  mazorca:  '#EEA110',
  pod:      '#87AA27',
  santa:    '#583915',
}

const APP_BASE_URL = 'https://cacaofrutabrutal.com'

interface RenderedEmail {
  subject: string
  html: string
}

function shell(opts: {
  preheader: string
  eyebrow: string
  headline: string
  accentWord?: string
  body: string
  ctaLabel: string
  ctaHref: string
  ctaBg?: string
  ctaColor?: string
  footerNote?: string
}): string {
  const ctaBg    = opts.ctaBg    ?? C.criollo
  const ctaColor = opts.ctaColor ?? C.heirloom
  const headline = opts.accentWord
    ? opts.headline.replace(opts.accentWord, `<span style="color:${C.criollo};">${opts.accentWord}</span>`)
    : opts.headline

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${opts.eyebrow}</title>
</head>
<body style="margin:0;padding:0;background:${C.heirloom};font-family:'Helvetica Neue',Arial,sans-serif;color:${C.amazon};">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${opts.preheader}</div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${C.heirloom};padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background:${C.heirloom};">
        <tr><td align="center" style="padding:0 0 36px;">
          <img src="https://kjygovuiphbxcdxeduco.supabase.co/storage/v1/object/public/public-assets/logo-caua-primary-horizontal.png" alt="CAÚA" width="200" height="35" style="display:block;width:200px;height:auto;border:0;outline:none;text-decoration:none;" />
        </td></tr>
        <tr><td style="padding:0 28px 8px;">
          <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-weight:700;font-size:11px;color:${C.criollo};letter-spacing:0.28em;text-transform:uppercase;margin-bottom:18px;">${opts.eyebrow}</div>
          <h1 style="margin:0 0 16px;font-family:'Helvetica Neue',Arial,sans-serif;font-weight:900;font-size:34px;line-height:1.04;color:${C.amazon};letter-spacing:-0.015em;">${headline}</h1>
        </td></tr>
        <tr><td style="padding:0 28px 28px;">${opts.body}</td></tr>
        <tr><td align="center" style="padding:8px 28px 28px;">
          <a href="${opts.ctaHref}" style="display:inline-block;background:${ctaBg};color:${ctaColor};text-decoration:none;font-family:'Helvetica Neue',Arial,sans-serif;font-weight:800;font-size:13px;letter-spacing:0.18em;text-transform:uppercase;padding:18px 38px;border-radius:0;">${opts.ctaLabel}</a>
          ${opts.footerNote ? `<p style="margin:18px 0 0;font-size:11px;color:${C.amazon}99;line-height:1.6;">${opts.footerNote}</p>` : ''}
        </td></tr>
        <tr><td style="padding:8px 28px 24px;">
          <p style="margin:0 0 6px;font-family:Georgia,serif;font-size:15px;color:${C.amazon};line-height:1.5;">Cualquier cosa, responde este correo y te leo.</p>
          <p style="margin:0;font-family:Georgia,serif;font-style:italic;font-size:15px;color:${C.amazon};line-height:1.5;">— Amaury</p>
          <p style="margin:2px 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:10px;letter-spacing:0.18em;color:${C.amazon}88;text-transform:uppercase;">CTO · CAÚA</p>
        </td></tr>
        <tr><td style="padding:0 28px;"><div style="height:1px;background:${C.amazon}22;"></div></td></tr>
        <tr><td style="padding:18px 28px 8px;text-align:center;">
          <p style="margin:0 0 6px;font-size:10px;letter-spacing:0.14em;color:${C.amazon}66;font-family:'Helvetica Neue',Arial,sans-serif;text-transform:uppercase;">Con la naturaleza caminamos</p>
          <p style="margin:0;font-size:9px;color:${C.amazon}44;line-height:1.6;">CAUA COLOMBIA SAS · Bogotá D.C. · cacaofrutabrutal.com<br>Te escribo porque adoptaste un árbol en CAÚA. Si no quieres más, dímelo y te saco.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function firstName(name: string): string {
  const trimmed = (name ?? '').trim()
  if (!trimmed) return 'amigo'
  return trimmed.split(/\s+/)[0]
}

function shortId(treeId: string): string {
  return `${treeId.slice(0, 8)}…${treeId.slice(-4)}`
}

// ─── 1. harvest_ready ──────────────────────────────────────────────
export function harvestReadyHTML(name: string, treeId: string, variety: string): RenderedEmail {
  const userName = firstName(name)
  const subject = `${userName}, tu árbol está listo para cosechar`
  const ctaHref = `${APP_BASE_URL}/app/tree/${treeId}`

  const body = `
    <p style="margin:0 0 14px;font-family:Georgia,serif;font-size:16px;line-height:1.65;color:${C.amazon};">
      Hola ${userName},
    </p>
    <p style="margin:0 0 14px;font-family:Georgia,serif;font-size:16px;line-height:1.65;color:${C.amazon};">
      Pasé por el sistema y vi que tu árbol <strong>${variety}</strong> llegó a maduración. Las mazorcas ya están listas — si entras ahora, las cosechas y se suman a tu balance.
    </p>
    <p style="margin:0;font-family:Georgia,serif;font-size:16px;line-height:1.65;color:${C.amazon};">
      Cada cosecha que dejas pasar es una mazorca menos al final del camino. No te la pierdas.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:20px;background:${C.pod}1A;border-left:3px solid ${C.pod};">
      <tr><td style="padding:14px 18px;">
        <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-weight:700;font-size:10px;color:${C.amazon};letter-spacing:0.22em;text-transform:uppercase;margin-bottom:6px;">Tu árbol</div>
        <div style="font-family:Georgia,serif;font-size:14px;color:${C.amazon};">${variety} · <span style="color:${C.amazon}88;font-family:'SF Mono',Consolas,monospace;font-size:12px;">${shortId(treeId)}</span></div>
      </td></tr>
    </table>
  `

  return {
    subject,
    html: shell({
      preheader: `Tu árbol ${variety} llegó a maduración — cosecha ahora.`,
      eyebrow: 'Cosecha disponible',
      headline: 'Tu cacao está listo.',
      accentWord: 'listo',
      body,
      ctaLabel: 'Cosechar ahora',
      ctaHref,
      ctaBg: C.criollo,
      ctaColor: C.heirloom,
    }),
  }
}

// ─── 2. dying ──────────────────────────────────────────────────────
export function dyingHTML(name: string, treeId: string, variety: string, hoursLeft: number): RenderedEmail {
  const userName = firstName(name)
  const safeHours = Math.max(0, Math.round(hoursLeft))
  const subject = `${userName}, tu árbol está luchando — ${safeHours}h`
  const ctaHref = `${APP_BASE_URL}/app/tree/${treeId}`

  const body = `
    <p style="margin:0 0 14px;font-family:Georgia,serif;font-size:16px;line-height:1.65;color:${C.amazon};">
      Hola ${userName},
    </p>
    <p style="margin:0 0 14px;font-family:Georgia,serif;font-size:16px;line-height:1.65;color:${C.amazon};">
      Te escribo porque tu árbol no la está pasando bien. Tu <strong>${variety}</strong> tiene los vitales en zona crítica. Si no lo activas pronto, no va a sobrevivir esta vez.
    </p>
    <p style="margin:0;font-family:Georgia,serif;font-size:16px;line-height:1.65;color:${C.amazon};">
      Riégalo, dale sol, dale nutrientes. Todavía está a tiempo — pero el reloj corre.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:20px;background:${C.mazorca}26;border-left:3px solid ${C.mazorca};">
      <tr><td style="padding:16px 18px;">
        <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-weight:700;font-size:10px;color:${C.santa};letter-spacing:0.22em;text-transform:uppercase;margin-bottom:6px;">Tiempo restante</div>
        <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-weight:900;font-size:26px;color:${C.santa};letter-spacing:-0.01em;">${safeHours}h antes de morir</div>
        <div style="margin-top:6px;font-family:Georgia,serif;font-size:13px;color:${C.amazon}aa;">${variety} · <span style="font-family:'SF Mono',Consolas,monospace;font-size:11px;">${shortId(treeId)}</span></div>
      </td></tr>
    </table>
  `

  return {
    subject,
    html: shell({
      preheader: `Tu árbol ${variety} pide ayuda — quedan ${safeHours}h.`,
      eyebrow: 'Vitales críticos',
      headline: `Tu árbol pide ayuda.`,
      accentWord: 'ayuda',
      body,
      ctaLabel: 'Ir a salvarlo',
      ctaHref,
      ctaBg: C.criollo,
      ctaColor: C.heirloom,
    }),
  }
}

// ─── 3. dead ───────────────────────────────────────────────────────
export function deadHTML(name: string, treeId: string, variety: string): RenderedEmail {
  const userName = firstName(name)
  const subject = `${userName}, tu árbol no logró sobrevivir`
  const ctaHref = `${APP_BASE_URL}/adoptar`

  const body = `
    <p style="margin:0 0 14px;font-family:Georgia,serif;font-size:16px;line-height:1.65;color:${C.amazon};">
      Hola ${userName},
    </p>
    <p style="margin:0 0 14px;font-family:Georgia,serif;font-size:16px;line-height:1.65;color:${C.amazon};">
      Tu árbol <strong>${variety}</strong> no logró sobrevivir esta vez. Pasa, es parte del juego — la naturaleza también nos enseña a perder.
    </p>
    <p style="margin:0;font-family:Georgia,serif;font-size:16px;line-height:1.65;color:${C.amazon};">
      Cuando estés listo, siembras otro y arrancamos de nuevo. Esta vez sabes más.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:20px;background:${C.amazon}0F;border-left:3px solid ${C.amazon};">
      <tr><td style="padding:14px 18px;">
        <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-weight:700;font-size:10px;color:${C.amazon};letter-spacing:0.22em;text-transform:uppercase;margin-bottom:6px;">Árbol perdido</div>
        <div style="font-family:Georgia,serif;font-size:14px;color:${C.amazon};">${variety} · <span style="color:${C.amazon}88;font-family:'SF Mono',Consolas,monospace;font-size:12px;">${shortId(treeId)}</span></div>
      </td></tr>
    </table>
  `

  return {
    subject,
    html: shell({
      preheader: `Tu árbol ${variety} no logró sobrevivir. Cuando quieras, sembramos otro.`,
      eyebrow: 'Ciclo cerrado',
      headline: 'Lo intentamos.<br>El ciclo sigue.',
      accentWord: 'sigue',
      body,
      ctaLabel: 'Sembrar otro',
      ctaHref,
      ctaBg: C.criollo,
      ctaColor: C.heirloom,
    }),
  }
}

// ─── 4. care_reminder (first 30min after adopt — bienvenida) ───────
export function careReminderHTML(name: string, treeId: string, variety: string): RenderedEmail {
  const userName = firstName(name)
  const subject = `${userName}, bienvenido a CAÚA`
  const ctaHref = `${APP_BASE_URL}/app/tree/${treeId}`

  const body = `
    <p style="margin:0 0 14px;font-family:Georgia,serif;font-size:16px;line-height:1.65;color:${C.amazon};">
      Hola ${userName}, qué bueno tenerte aquí.
    </p>
    <p style="margin:0 0 14px;font-family:Georgia,serif;font-size:16px;line-height:1.65;color:${C.amazon};">
      Soy Amaury, CTO de CAÚA. Tu árbol <strong>${variety}</strong> ya empezó a germinar. Las primeras horas son las más importantes — todo lo que hagas ahora le marca el ritmo del resto del camino.
    </p>
    <p style="margin:0;font-family:Georgia,serif;font-size:16px;line-height:1.65;color:${C.amazon};">
      Te dejo el ritual del primer día abajo. Si en algún momento te trabas, responde este correo y te ayudo personalmente.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:20px;background:${C.pod}1F;border-left:3px solid ${C.pod};">
      <tr><td style="padding:14px 18px;">
        <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-weight:700;font-size:10px;color:${C.amazon};letter-spacing:0.22em;text-transform:uppercase;margin-bottom:8px;">Tu primer ritual</div>
        <ol style="margin:0;padding-left:18px;font-family:Georgia,serif;font-size:14px;color:${C.amazon};line-height:1.7;">
          <li>Riégalo cada 30 min para activar la germinación.</li>
          <li>Dale sol cuando lo veas pálido.</li>
          <li>Vigila plagas — la primera fase es la más vulnerable.</li>
        </ol>
      </td></tr>
    </table>
  `

  return {
    subject,
    html: shell({
      preheader: `${userName}, te escribo personalmente — tu árbol ${variety} despertó.`,
      eyebrow: 'Bienvenido',
      headline: 'Tu árbol despertó.<br>Acompáñalo.',
      accentWord: 'despertó',
      body,
      ctaLabel: 'Ir a mi árbol',
      ctaHref,
      ctaBg: C.criollo,
      ctaColor: C.heirloom,
    }),
  }
}
