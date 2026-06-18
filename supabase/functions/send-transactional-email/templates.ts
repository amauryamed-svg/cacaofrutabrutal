// Caua Creyentes — Transactional Email Templates (post-Drop flow)
//
// 3 templates, each disparado por un evento transaccional (no lifecycle):
//   1. drop-purchase-confirmation  — webhook Stripe/Coinbase status=paid
//   2. golden-ticket-minted        — evaluate-golden-tickets post-mint
//   3. workshop-tomorrow-reminder  — cron 2026-06-14 (D-1)
//
// Brand canon (no-negociable — trumpea cualquier otra fuente):
//   - Voice: Motivating · Inspiring · Captivating · Encouraging
//   - Lexicon: Functional Cacao · Upcycled Cacao · Activation · Bioflavonoids
//             Fermentation · Alchemize · Sacred · Regenerative · With Nature We Walk
//   - Prohibido: chocolate · candy · charity · "help us"
//   - Logo CAÚA con apóstrofe estilizada (nunca "Caua" mixed-case en headline visible)
//   - Palette: hex only (CauaCore §8 — no CSS custom properties)
//   - Typography: 'Helvetica Neue' + Georgia italic eyebrow
//
// Refs: send-adoption-email/index.ts · send-lifecycle-email/templates.ts ·
//       integrations/social/specs/GOLDEN-TICKET.md §2 + §4

export const C = {
  bgDeep:   '#040C06',
  amazon:   '#1C3B26',
  pod:      '#91A63B',
  podSoft:  '#91A63B33',
  mazorca:  '#F1A91E',
  heirloom: '#F7F1EE',
  criollo:  '#8D2679',
  theobroma:'#DB5527',
  heroic:   '#00A3CD',
} as const

const APP_BASE_URL = 'https://cacaofrutabrutal.com'

export type TransactionalType =
  | 'drop-purchase-confirmation'
  | 'golden-ticket-minted'
  | 'workshop-tomorrow-reminder'

// ────────────────────── Shared shell ──────────────────────

interface ShellOpts {
  subject: string
  eyebrow: string
  headline: string
  intro: string
  body: string
  ctaLabel: string
  ctaUrl: string
  ctaColor?: string
  postCtaNote?: string
  secondaryCtaLabel?: string
  secondaryCtaUrl?: string
  footerSignoff?: string
}

function shell(opts: ShellOpts): string {
  const ctaColor = opts.ctaColor ?? C.pod
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${opts.subject}</title>
</head>
<body style="margin:0;padding:0;background:${C.bgDeep};font-family:'Helvetica Neue',Arial,sans-serif;color:${C.heirloom};">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${C.bgDeep};padding:40px 16px;">
    <tr><td align="center"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background:${C.bgDeep};">

      <tr><td align="center" style="padding:0 0 32px;">
        <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-weight:900;font-size:32px;letter-spacing:0.04em;color:${C.heirloom};text-transform:uppercase;">CAÚA</div>
        <div style="margin-top:8px;font-family:Georgia,serif;font-style:italic;font-size:11px;letter-spacing:0.28em;color:${C.pod};text-transform:lowercase;">with nature we walk</div>
      </td></tr>

      <tr><td style="padding:32px 28px;background:linear-gradient(135deg, ${C.amazon} 0%, ${C.bgDeep} 100%);border-radius:14px 14px 0 0;">
        <div style="font-family:Georgia,serif;font-style:italic;font-size:11px;color:${C.pod};letter-spacing:0.22em;text-transform:uppercase;margin-bottom:14px;">
          ${opts.eyebrow}
        </div>
        <h1 style="margin:0 0 12px;font-family:'Helvetica Neue',Arial,sans-serif;font-weight:900;font-size:30px;line-height:1.1;color:${C.heirloom};letter-spacing:-0.01em;">
          ${opts.headline}
        </h1>
        <p style="margin:18px 0 0;font-size:14px;line-height:1.7;color:${C.heirloom}cc;">${opts.intro}</p>
      </td></tr>

      <tr><td style="padding:0 0 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${C.amazon}40;border:1px solid ${C.amazon};border-top:0;">
          <tr><td style="padding:28px;font-size:14px;line-height:1.7;color:${C.heirloom}dd;">
            ${opts.body}
          </td></tr>
        </table>
      </td></tr>

      <tr><td align="center" style="padding:24px 28px 12px;">
        <a href="${opts.ctaUrl}" style="display:inline-block;background:${ctaColor};color:${C.bgDeep};text-decoration:none;font-family:'Helvetica Neue',Arial,sans-serif;font-weight:800;font-size:13px;letter-spacing:0.16em;text-transform:uppercase;padding:16px 36px;border-radius:999px;">
          ${opts.ctaLabel} →
        </a>
      </td></tr>

      ${opts.secondaryCtaLabel && opts.secondaryCtaUrl ? `<tr><td align="center" style="padding:0 28px 16px;">
        <a href="${opts.secondaryCtaUrl}" style="display:inline-block;color:${C.heirloom}aa;text-decoration:underline;font-family:'Helvetica Neue',Arial,sans-serif;font-weight:600;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;">
          ${opts.secondaryCtaLabel}
        </a>
      </td></tr>` : ''}

      ${opts.postCtaNote ? `<tr><td align="center" style="padding:0 28px 32px;">
        <p style="margin:0;font-size:12px;color:${C.heirloom}88;line-height:1.6;">${opts.postCtaNote}</p>
      </td></tr>` : `<tr><td style="padding:0 28px 32px;"></td></tr>`}

      ${opts.footerSignoff ? `<tr><td style="padding:24px 28px;border-top:1px solid ${C.amazon};">
        <p style="margin:0;font-size:13px;line-height:1.7;color:${C.heirloom}aa;font-style:italic;">${opts.footerSignoff}</p>
      </td></tr>` : ''}

      <tr><td style="padding:32px 28px;border-top:1px solid ${C.amazon};text-align:center;">
        <p style="margin:0 0 8px;font-size:10px;letter-spacing:0.08em;color:${C.heirloom}55;">CAUA COLOMBIA SAS · NIT 901.213.846-7</p>
        <p style="margin:0 0 14px;font-size:10px;letter-spacing:0.08em;color:${C.heirloom}33;">Bogotá D.C. · Colombia · cacaofrutabrutal.com</p>
        <p style="margin:0;font-size:9px;color:${C.heirloom}33;line-height:1.6;">
          Recibiste este mensaje porque sos parte de la cohorte fundadora Caua Creyentes.<br>
          Para preguntas o ajustes, escribinos a hola@cacaofrutabrutal.com
        </p>
      </td></tr>

    </table></td></tr>
  </table>
</body>
</html>`
}

// ────────────────────── Helpers ──────────────────────

function fmtCurrency(amount: number, ccy: 'COP' | 'USD'): string {
  if (ccy === 'COP') {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount)
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(amount)
}

function shortTx(hash: string): string {
  if (!hash) return ''
  return hash.length > 14 ? `${hash.slice(0, 8)}…${hash.slice(-6)}` : hash
}

// ────────────────────── 1. drop-purchase-confirmation ──────────────────────

export interface DropPurchaseContext {
  userName: string
  variantLabel: string          // e.g. "Mucílago Liofilizado · 30g" | "Bean Liofilizado · 50g"
  sku: string
  quantity: number
  amountTotal: number
  currency: 'COP' | 'USD'
  shippingAddress: {
    line1: string
    line2?: string
    city: string
    region?: string
    postalCode?: string
    country: string             // ISO-2
  }
  isInternational: boolean      // si true → ETA 2026-06-10, else 2026-06-03
  hasGoldenTicket: boolean      // si completó recorrido
  orderId: string
}

function templateDropPurchaseConfirmation(ctx: DropPurchaseContext) {
  const subject = `🌱 Tu Caua Cacao Drop está confirmado · ${ctx.variantLabel}`
  const eta = ctx.isInternational ? '10 de junio 2026' : '3 de junio 2026'
  const etaRegion = ctx.isInternational ? 'envío internacional' : 'envío Colombia'
  const total = fmtCurrency(ctx.amountTotal, ctx.currency)
  const addr = [
    ctx.shippingAddress.line1,
    ctx.shippingAddress.line2,
    `${ctx.shippingAddress.city}${ctx.shippingAddress.region ? ', ' + ctx.shippingAddress.region : ''}${ctx.shippingAddress.postalCode ? ' ' + ctx.shippingAddress.postalCode : ''}`,
    ctx.shippingAddress.country,
  ].filter(Boolean).join('<br>')

  const goldenLine = ctx.hasGoldenTicket
    ? `<strong style="color:${C.mazorca};">✓ Workshop Cacao 2.0</strong> desbloqueado (completaste el recorrido Golden Ticket — mint en curso).`
    : `<strong style="color:${C.heirloom};">Workshop Cacao 2.0:</strong> aún podés sumarte como Golden Ticket si completás los criterios antes del 26 de mayo. Te avisamos.`

  const html = shell({
    subject,
    eyebrow: 'Compra confirmada · Cohorte 01',
    headline: `Sos parte de los 20.<br><span style="color:${C.mazorca};">Bienvenido al Lote 2025.</span>`,
    intro: `Hola ${ctx.userName}, tu compra del Caua Cacao Drop quedó confirmada. Lo que estás por recibir es el primer lote fine-flavor Pentámera 2025 — Functional Cacao Upcycled, fermentación de 6 días bajo hojas de plátano en las cinco fincas Guardian.`,
    body: `
      <div style="margin-bottom:18px;padding:14px 16px;background:${C.podSoft};border-left:3px solid ${C.pod};border-radius:4px;">
        <div style="font-family:Georgia,serif;font-style:italic;font-size:11px;color:${C.pod};letter-spacing:0.18em;text-transform:uppercase;margin-bottom:10px;">Tu orden</div>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="font-size:13px;">
          <tr>
            <td style="padding:5px 0;color:${C.heirloom}88;width:38%;font-size:11px;letter-spacing:0.04em;text-transform:uppercase;">Producto</td>
            <td style="padding:5px 0;color:${C.heirloom};font-weight:700;">${ctx.variantLabel}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;color:${C.heirloom}88;font-size:11px;letter-spacing:0.04em;text-transform:uppercase;">SKU</td>
            <td style="padding:5px 0;color:${C.heirloom}aa;font-family:'SF Mono',Consolas,monospace;font-size:12px;">${ctx.sku}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;color:${C.heirloom}88;font-size:11px;letter-spacing:0.04em;text-transform:uppercase;">Cantidad</td>
            <td style="padding:5px 0;color:${C.heirloom};font-weight:700;">${ctx.quantity} unidad${ctx.quantity > 1 ? 'es' : ''}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;color:${C.heirloom}88;font-size:11px;letter-spacing:0.04em;text-transform:uppercase;">Total pagado</td>
            <td style="padding:5px 0;color:${C.mazorca};font-weight:900;font-size:15px;">${total}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;color:${C.heirloom}88;font-size:11px;letter-spacing:0.04em;text-transform:uppercase;">Order ID</td>
            <td style="padding:5px 0;color:${C.heirloom}77;font-family:'SF Mono',Consolas,monospace;font-size:11px;">${ctx.orderId}</td>
          </tr>
        </table>
      </div>

      <div style="margin-bottom:18px;">
        <div style="font-family:Georgia,serif;font-style:italic;font-size:11px;color:${C.pod};letter-spacing:0.18em;text-transform:uppercase;margin-bottom:10px;">Envío</div>
        <p style="margin:0 0 8px;font-size:13px;color:${C.heirloom}cc;line-height:1.6;">${addr}</p>
        <p style="margin:0;font-size:13px;color:${C.heirloom}aa;">ETA <strong style="color:${C.mazorca};">${eta}</strong> · ${etaRegion}</p>
      </div>

      <div>
        <div style="font-family:Georgia,serif;font-style:italic;font-size:11px;color:${C.pod};letter-spacing:0.18em;text-transform:uppercase;margin-bottom:12px;">Lo que sigue</div>
        <p style="margin:0 0 10px;color:${C.heirloom}cc;"><strong style="color:${C.mazorca};">1.</strong> Tu <strong style="color:${C.heirloom};">NFT Caua Creyente Cohorte 01</strong> se está minteando en Base. Te avisamos cuando esté en tu wallet.</p>
        <p style="margin:0 0 10px;color:${C.heirloom}cc;"><strong style="color:${C.mazorca};">2.</strong> ${goldenLine}</p>
        <p style="margin:0;color:${C.heirloom}cc;"><strong style="color:${C.mazorca};">3.</strong> Recibís invite al Slack privado <strong style="color:${C.heirloom};">#caua-creyentes-01</strong> en las próximas 24 horas.</p>
      </div>
    `,
    ctaLabel: 'Ver mi NFT',
    ctaUrl: `${APP_BASE_URL}/app/profile?tab=nfts`,
    ctaColor: C.pod,
    secondaryCtaLabel: 'Seguimiento del envío',
    secondaryCtaUrl: `${APP_BASE_URL}/app/orders/${ctx.orderId}`,
    postCtaNote: 'Activation. No producto. Estás cerrando un ciclo regenerative con 5 Guardian farmers.',
    footerSignoff: '"With Nature We Walk." — David & Amaury, Caúa',
  })
  return { subject, html }
}

// ────────────────────── 2. golden-ticket-minted ──────────────────────

export interface GoldenTicketMintedContext {
  userName: string
  txHash: string                // tx hash en Base Sepolia
  tokenId: string | number
  workshopDateISO: string       // '2026-06-15T18:00:00-05:00'
  icalUrl: string               // link a archivo .ics o "add to cal" handler
  slackInviteUrl: string
  preReading: Array<{ slug: string; title: string; teaser: string }>
}

function templateGoldenTicketMinted(ctx: GoldenTicketMintedContext) {
  const subject = `🎟️ Tu Golden Ticket fue minteado · Workshop 2.0 unlocked`
  const txUrl = `https://sepolia.basescan.org/tx/${ctx.txHash}`
  const workshopDate = new Date(ctx.workshopDateISO).toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const readingHtml = ctx.preReading.map((p, i) => `
    <div style="margin-bottom:14px;padding-bottom:14px;${i < ctx.preReading.length - 1 ? `border-bottom:1px solid ${C.amazon};` : ''}">
      <a href="${APP_BASE_URL}/blog/${p.slug}" style="color:${C.mazorca};text-decoration:none;font-weight:800;font-size:14px;letter-spacing:0.02em;">
        ${p.title} →
      </a>
      <p style="margin:6px 0 0;color:${C.heirloom}aa;font-size:12px;line-height:1.6;">${p.teaser}</p>
    </div>
  `).join('')

  const html = shell({
    subject,
    eyebrow: 'Acceso concedido',
    headline: `Workshop Cacao 2.0 desbloqueado.<br><span style="color:${C.mazorca};">15 de junio.</span>`,
    intro: `${ctx.userName}, completaste el recorrido Caua Creyente y tu Golden Ticket acaba de minteare en Base. Sos uno de los pocos que va a estar en vivo con David y Amaury el 15 de junio. Functional Cacao Sacred — territorio + tecnología.`,
    body: `
      <div style="margin-bottom:18px;padding:16px;background:${C.criollo}22;border:1px solid ${C.criollo};border-radius:8px;">
        <div style="font-family:Georgia,serif;font-style:italic;font-size:11px;color:${C.criollo};letter-spacing:0.22em;text-transform:uppercase;margin-bottom:10px;">Golden Ticket NFT</div>
        <p style="margin:0 0 6px;color:${C.heirloom};font-size:14px;">Token ID <strong style="color:${C.mazorca};">#${ctx.tokenId}</strong> · chain Base Sepolia</p>
        <p style="margin:0;font-size:12px;line-height:1.6;">
          <a href="${txUrl}" style="color:${C.heroic};text-decoration:none;font-family:'SF Mono',Consolas,monospace;">
            tx ${shortTx(ctx.txHash)} ↗
          </a>
        </p>
      </div>

      <div style="margin-bottom:20px;padding:16px;background:${C.amazon};border:1px solid ${C.pod};border-radius:8px;">
        <div style="font-family:Georgia,serif;font-style:italic;font-size:11px;color:${C.pod};letter-spacing:0.22em;text-transform:uppercase;margin-bottom:10px;">Datos del Workshop</div>
        <p style="margin:0 0 6px;font-size:15px;font-weight:800;color:${C.heirloom};">${workshopDate}</p>
        <p style="margin:0 0 6px;font-size:13px;color:${C.heirloom}cc;">18:00 COT · 19:00 EST · 01:00 CET +1</p>
        <p style="margin:0 0 6px;font-size:13px;color:${C.heirloom}cc;">90 min agenda + 30 min Q&amp;A abierto</p>
        <p style="margin:0;font-size:12px;color:${C.heirloom}88;">Link Zoom se entrega 24h antes (D-1). Co-presentan David Montoya (CEO) + Amaury Amed (CTO).</p>
      </div>

      <div style="margin-bottom:20px;">
        <div style="font-family:Georgia,serif;font-style:italic;font-size:11px;color:${C.pod};letter-spacing:0.22em;text-transform:uppercase;margin-bottom:12px;">Pre-workshop reading · serie Pentámera</div>
        ${readingHtml}
      </div>

      <div style="padding:14px 16px;background:${C.podSoft};border-left:3px solid ${C.pod};">
        <p style="margin:0 0 6px;font-size:13px;color:${C.heirloom};font-weight:700;">Slack privado #caua-creyentes-01</p>
        <p style="margin:0;font-size:12px;color:${C.heirloom}aa;line-height:1.6;">
          <a href="${ctx.slackInviteUrl}" style="color:${C.mazorca};text-decoration:underline;">Aceptá tu invitación al workspace</a> — acceso permanente a Guardian voice notes mensuales, early access a futuros Drops, y network directo con los otros Creyentes.
        </p>
      </div>
    `,
    ctaLabel: 'Ver mi Golden Ticket',
    ctaUrl: `${APP_BASE_URL}/workshop-2-0`,
    ctaColor: C.mazorca,
    secondaryCtaLabel: 'Add to calendar (.ics)',
    secondaryCtaUrl: ctx.icalUrl,
    postCtaNote: 'Reservá el bloque completo: 18:00–20:00 COT. Vale la pena estar en vivo.',
    footerSignoff: '"Alchemize no es metáfora. El 15 te lo mostramos."',
  })
  return { subject, html }
}

// ────────────────────── 3. workshop-tomorrow-reminder ──────────────────────

export interface WorkshopReminderContext {
  userName: string
  zoomLink: string
  workshopDateISO: string       // '2026-06-15T18:00:00-05:00'
  guidedQuestions: string[]     // 3 preguntas para preparación
  dropReceived: boolean         // si su Drop ya llegó (para ajustar copy)
}

function templateWorkshopTomorrowReminder(ctx: WorkshopReminderContext) {
  const subject = `Mañana: Workshop Cacao 2.0 · 18:00 COT`
  const workshopDate = new Date(ctx.workshopDateISO).toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const questionsHtml = ctx.guidedQuestions.map((q, i) => `
    <div style="margin-bottom:12px;padding:12px 14px;background:${C.amazon}66;border-left:2px solid ${C.mazorca};">
      <span style="color:${C.mazorca};font-weight:900;font-size:13px;">Q${i + 1}.</span>
      <span style="color:${C.heirloom}dd;font-size:13px;line-height:1.6;margin-left:6px;">${q}</span>
    </div>
  `).join('')

  const dropTip = ctx.dropReceived
    ? 'Tené tu Drop a mano — vamos a hacer una mini-catación guiada en vivo.'
    : 'Tu Drop puede llegar después del 15 — sin problema. Probamos juntos en la próxima sesión.'

  const html = shell({
    subject,
    eyebrow: 'Recordatorio · Workshop mañana',
    headline: `Mañana caminamos<br><span style="color:${C.pod};">con la naturaleza.</span>`,
    intro: `${ctx.userName}, mañana es el Workshop Cacao 2.0. 90 minutos + 30 de Q&amp;A. David y Amaury en vivo desde Bogotá. Vas a entender por qué Functional Cacao Pentámera es un nuevo género — no una marca de cacao más.`,
    body: `
      <div style="margin-bottom:18px;padding:16px;background:${C.amazon};border:1px solid ${C.pod};border-radius:8px;">
        <div style="font-family:Georgia,serif;font-style:italic;font-size:11px;color:${C.pod};letter-spacing:0.22em;text-transform:uppercase;margin-bottom:10px;">Datos</div>
        <p style="margin:0 0 6px;font-size:15px;font-weight:800;color:${C.heirloom};">${workshopDate}</p>
        <p style="margin:0 0 6px;font-size:13px;color:${C.heirloom}cc;"><strong style="color:${C.mazorca};">18:00 COT</strong> · 19:00 EST · 01:00 CET +1</p>
        <p style="margin:0 0 6px;font-size:13px;color:${C.heirloom}cc;">Duración: 90 min agenda + 30 min Q&amp;A abierto</p>
        <p style="margin:0;font-size:12px;color:${C.heirloom}88;font-family:'SF Mono',Consolas,monospace;word-break:break-all;">${ctx.zoomLink}</p>
      </div>

      <div style="margin-bottom:18px;">
        <div style="font-family:Georgia,serif;font-style:italic;font-size:11px;color:${C.pod};letter-spacing:0.22em;text-transform:uppercase;margin-bottom:12px;">Para venir preparado</div>
        <ul style="margin:0;padding-left:20px;color:${C.heirloom}cc;font-size:13px;line-height:1.7;">
          <li style="margin-bottom:6px;">${dropTip}</li>
          <li style="margin-bottom:6px;">Conexión estable — preferiblemente cable o Wi-Fi 5GHz.</li>
          <li style="margin-bottom:6px;">Cámara on para la introducción del bloque 0–10 min (te presentás vos también).</li>
          <li>Una libreta a mano. Vamos a hablar de bioflavonoids, fermentation, y un par de cosas que vas a querer anotar.</li>
        </ul>
      </div>

      <div>
        <div style="font-family:Georgia,serif;font-style:italic;font-size:11px;color:${C.pod};letter-spacing:0.22em;text-transform:uppercase;margin-bottom:12px;">3 preguntas que vamos a hacer en Q&amp;A guiado</div>
        <p style="margin:0 0 12px;color:${C.heirloom}aa;font-size:13px;line-height:1.6;">Pensálas con tiempo. No para "responder bien" — para entrar en el bloque con algo concreto que aportar.</p>
        ${questionsHtml}
      </div>
    `,
    ctaLabel: 'Join Zoom now',
    ctaUrl: ctx.zoomLink,
    ctaColor: C.mazorca,
    postCtaNote: 'Si Zoom falla mañana, tenemos backup en Google Meet — vas a recibir el link 5 minutos antes por email.',
    footerSignoff: '"Sacred. Activation. Regenerative. No palabras de marketing — palabras de territorio." Nos vemos mañana.',
  })
  return { subject, html }
}

// ────────────────────── Dispatcher ──────────────────────

export type TransactionalContext =
  | { type: 'drop-purchase-confirmation'; ctx: DropPurchaseContext }
  | { type: 'golden-ticket-minted'; ctx: GoldenTicketMintedContext }
  | { type: 'workshop-tomorrow-reminder'; ctx: WorkshopReminderContext }

export function renderTransactionalEmail(
  input: TransactionalContext,
): { subject: string; html: string } {
  switch (input.type) {
    case 'drop-purchase-confirmation':
      return templateDropPurchaseConfirmation(input.ctx)
    case 'golden-ticket-minted':
      return templateGoldenTicketMinted(input.ctx)
    case 'workshop-tomorrow-reminder':
      return templateWorkshopTomorrowReminder(input.ctx)
  }
}
