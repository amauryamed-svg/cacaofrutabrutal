// Caua Creyentes — Lifecycle Email Templates
//
// 6 templates, one per day-offset since adoption.
// Each is the immersive digital cacao tasting (catación inmersiva digital)
// that replaces the cancelled in-person tastings.
//
// Brand canon (non-negotiable):
//   - Voice: Motivating · Inspiring · Captivating · Encouraging
//   - Lexicon: Functional Cacao · Upcycled Cacao · Activation · Bioflavonoids
//             Fermentation · Alchemize · Sacred · Regenerative · Revitalizing
//   - Never: chocolate, candy, charity, "help us"
//   - Palette: hex only (CauaCore §8 — no CSS custom properties)
//
// Spec: ~/Documents/Caua/integrations/social/04-CAMPANA-CAUA-CREYENTES.md §3

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
  alert:    '#DB5527',
} as const

const APP_BASE_URL = 'https://cacaofrutabrutal.com'

export type LifecycleDay = 1 | 3 | 7 | 14 | 21 | 28

export interface LifecycleContext {
  userName: string
  treeId: string
  variety: string
  region: string
  guardianName: string
  guardianTown: string | null
  adoptedAt: string
  health: number
  moisture: number
  sunlight: number
  stage: string
  co2Kg: number
}

function shell(opts: {
  subject: string
  eyebrow: string
  headline: string
  intro: string
  body: string
  ctaLabel: string
  ctaUrl: string
  ctaColor?: string
  postCtaNote?: string
  footerSignoff?: string
}): string {
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

      <tr><td align="center" style="padding:24px 28px 40px;">
        <a href="${opts.ctaUrl}" style="display:inline-block;background:${ctaColor};color:${C.bgDeep};text-decoration:none;font-family:'Helvetica Neue',Arial,sans-serif;font-weight:800;font-size:13px;letter-spacing:0.16em;text-transform:uppercase;padding:16px 36px;border-radius:999px;">
          ${opts.ctaLabel} →
        </a>
        ${opts.postCtaNote ? `<p style="margin:18px 0 0;font-size:12px;color:${C.heirloom}88;line-height:1.6;">${opts.postCtaNote}</p>` : ''}
      </td></tr>

      ${opts.footerSignoff ? `<tr><td style="padding:24px 28px;border-top:1px solid ${C.amazon};">
        <p style="margin:0;font-size:13px;line-height:1.7;color:${C.heirloom}aa;font-style:italic;">${opts.footerSignoff}</p>
      </td></tr>` : ''}

      <tr><td style="padding:32px 28px;border-top:1px solid ${C.amazon};text-align:center;">
        <p style="margin:0 0 8px;font-size:10px;letter-spacing:0.08em;color:${C.heirloom}55;">CAUA COLOMBIA SAS · NIT 901.213.846-7</p>
        <p style="margin:0 0 14px;font-size:10px;letter-spacing:0.08em;color:${C.heirloom}33;">Bogotá D.C. · Colombia · cacaofrutabrutal.com</p>
        <p style="margin:0;font-size:9px;color:${C.heirloom}33;line-height:1.6;">
          Recibiste este mensaje porque adoptaste un árbol en cacaofrutabrutal.com.<br>
          Para preguntas o ajustes, escribinos a hola@cacaofrutabrutal.com
        </p>
      </td></tr>

    </table></td></tr>
  </table>
</body>
</html>`
}

// ──────────────── D1 — El Primer Ritual ────────────────
function templateDay1(ctx: LifecycleContext) {
  const subject = `🌱 ${ctx.userName}, tu primer ritual con el cacao empieza hoy`
  const html = shell({
    subject,
    eyebrow: 'Catación inmersiva · Día 1',
    headline: `Bienvenido a tu<br>primera <span style="color:${C.mazorca};">Activation</span>`,
    intro: `Hola ${ctx.userName}, tu árbol <strong style="color:${C.heirloom};">${ctx.variety}</strong> ya está vivo en la finca de <strong style="color:${C.heirloom};">${ctx.guardianName}</strong>. Hoy empieza algo más grande que adoptar — empieza tu relación con el cacao como Functional Cacao, no como producto.`,
    body: `
      <div style="margin-bottom:18px;font-family:Georgia,serif;font-style:italic;color:${C.pod};font-size:12px;letter-spacing:0.18em;text-transform:uppercase;">Ritual de la mañana — 3 minutos</div>
      <p style="margin:0 0 14px;">Antes de tu primer café, hacé esto:</p>
      <ol style="margin:0 0 18px;padding-left:20px;">
        <li style="margin-bottom:10px;"><strong style="color:${C.mazorca};">Respirá hondo tres veces.</strong> El cacao se reverencia, no se apura.</li>
        <li style="margin-bottom:10px;"><strong style="color:${C.mazorca};">Visualizá tu árbol.</strong> Está en ${ctx.guardianTown ?? ctx.region}. Hoy le toca sol.</li>
        <li style="margin-bottom:10px;"><strong style="color:${C.mazorca};">Entrá a tu CauaGotchi</strong> y dale un click a "Sol". Tu acción se traduce en cuidado real.</li>
      </ol>
      <p style="margin:0 0 14px;color:${C.heirloom}aa;">El cacao fine-flavor de tu árbol contiene <strong style="color:${C.pod};">bioflavonoids</strong> que solo se activan con fermentación cuidada. Lo que empieza con un click hoy se vuelve un bean liofilizado en 6 meses. Lo vas a probar.</p>
      <p style="margin:0;color:${C.heirloom}aa;">Mañana te cuento por qué este árbol específicamente — y por qué ${ctx.guardianName} es uno de los 5 Pentámera.</p>
    `,
    ctaLabel: 'Activar mi árbol',
    ctaUrl: `${APP_BASE_URL}/app/tree/${ctx.treeId}`,
    postCtaNote: '3 horas de cooldown entre acciones de cuidado. Ritual diario, no compulsivo.',
    footerSignoff: '"Con la naturaleza caminamos." — David & Amaury, Caúa',
  })
  return { subject, html }
}

// ──────────────── D3 — Guardian Story + Vitals ────────────────
function templateDay3(ctx: LifecycleContext) {
  const subject = `${ctx.guardianName} te manda saludos desde ${ctx.guardianTown ?? ctx.region}`
  const stageEmoji = ctx.stage.toLowerCase().includes('germin') ? '🌱'
                   : ctx.stage.toLowerCase().includes('plántula') ? '🌿'
                   : '🌰'
  const html = shell({
    subject,
    eyebrow: 'Catación inmersiva · Día 3',
    headline: `Conoce a tu<br>Guardian <span style="color:${C.mazorca};">${ctx.guardianName}</span>`,
    intro: `${ctx.userName}, tu árbol no es un árbol cualquiera — es uno de los cinco árboles fundadores Pentámera. Hoy querés conocer a la persona que lo cuida en tierra.`,
    body: `
      <div style="margin-bottom:18px;padding:14px;background:${C.podSoft};border-left:3px solid ${C.pod};border-radius:4px;">
        <div style="font-family:Georgia,serif;font-style:italic;font-size:11px;color:${C.pod};letter-spacing:0.18em;text-transform:uppercase;margin-bottom:8px;">Estado actual de tu árbol</div>
        <div style="display:inline-block;margin-right:18px;"><span style="color:${C.pod};font-weight:900;font-size:20px;">${ctx.health}%</span> <span style="font-size:11px;color:${C.heirloom}88;">salud</span></div>
        <div style="display:inline-block;margin-right:18px;"><span style="color:${C.heroic};font-weight:900;font-size:20px;">${ctx.moisture}%</span> <span style="font-size:11px;color:${C.heirloom}88;">humedad</span></div>
        <div style="display:inline-block;"><span style="color:${C.mazorca};font-weight:900;font-size:20px;">${ctx.sunlight}%</span> <span style="font-size:11px;color:${C.heirloom}88;">sol</span></div>
        <div style="margin-top:8px;font-size:13px;color:${C.heirloom}cc;">${stageEmoji} Fase <strong>${ctx.stage}</strong></div>
      </div>
      <p style="margin:0 0 14px;"><strong style="color:${C.mazorca};">${ctx.guardianName}</strong> lleva más de 10 años cultivando cacao Criollo Élite en ${ctx.guardianTown ?? ctx.region}. Conoce cada árbol por su forma — el tuyo lo recuerda por la mazorca rosada que dio el primer año.</p>
      <p style="margin:0 0 14px;color:${C.heirloom}aa;">Le pedimos que te grabe un voice note. Lo recibirás el día 7.</p>
      <p style="margin:0;color:${C.heirloom}aa;font-style:italic;">"El cacao no se siembra para cosechar rápido. Se siembra para que tu nieto recuerde a quién pertenece la tierra."  — ${ctx.guardianName}</p>
    `,
    ctaLabel: 'Ver mi árbol + Guardian',
    ctaUrl: `${APP_BASE_URL}/app/tree/${ctx.treeId}`,
    footerSignoff: 'Mañana: por qué la fermentación cambia todo. Y por qué tu árbol va a ser Sacred.',
  })
  return { subject, html }
}

// ──────────────── D7 — Fase Germinación + Ritual ────────────────
function templateDay7(ctx: LifecycleContext) {
  const subject = `🌿 Tu árbol entró en Germinación — toca un ritual nuevo`
  const html = shell({
    subject,
    eyebrow: 'Catación inmersiva · Día 7',
    headline: `Tu árbol entró<br>en <span style="color:${C.pod};">Germinación</span>`,
    intro: `${ctx.userName}, han pasado 7 días. Tu árbol Criollo ${ctx.variety} ya no es semilla — está empujando hacia la luz. Hoy te toca el segundo ritual.`,
    body: `
      <div style="margin-bottom:18px;font-family:Georgia,serif;font-style:italic;color:${C.pod};font-size:12px;letter-spacing:0.18em;text-transform:uppercase;">Ritual sensorial — 5 minutos</div>
      <p style="margin:0 0 14px;">Vas a hacer una catación con cacao normal (de la tienda) — para entrenar el paladar antes del Caua Cacao Drop. Necesitás:</p>
      <ul style="margin:0 0 18px;padding-left:20px;">
        <li style="margin-bottom:8px;">1 cuadrito de cacao 70%+ (de cualquier marca — sí, por una vez)</li>
        <li style="margin-bottom:8px;">Agua tibia</li>
        <li style="margin-bottom:8px;">3 minutos sin teléfono</li>
      </ul>
      <p style="margin:0 0 14px;"><strong style="color:${C.mazorca};">1. Olé antes de comer.</strong> Identificá 3 aromas. ¿Madera? ¿Frutos rojos? ¿Tierra húmeda?</p>
      <p style="margin:0 0 14px;"><strong style="color:${C.mazorca};">2. Mordé sin masticar.</strong> Dejá que se derrita. Sentí la textura — ¿granuloso? ¿sedoso?</p>
      <p style="margin:0 0 14px;"><strong style="color:${C.mazorca};">3. Tomá agua tibia.</strong> Identificá el retrogusto. ¿Astringente? ¿dulce final?</p>
      <p style="margin:0 0 14px;color:${C.heirloom}aa;">Anotalo. En 2 semanas vas a hacer esta misma catación con tu cacao Pentámera del Caua Cacao Drop, y la diferencia te va a sorprender. Eso es Functional Cacao vs commodity.</p>
      <p style="margin:0;color:${C.heirloom}aa;font-style:italic;">Voice note de ${ctx.guardianName} disponible en tu dashboard.</p>
    `,
    ctaLabel: 'Escuchar voice note',
    ctaUrl: `${APP_BASE_URL}/app/tree/${ctx.treeId}`,
    footerSignoff: 'Tu próximo email (día 14) va a hablar de fermentación y por qué Alchemize no es metáfora.',
  })
  return { subject, html }
}

// ──────────────── D14 — Catación Sensorial Profunda ────────────────
function templateDay14(ctx: LifecycleContext) {
  const subject = `Alchemize: cómo tu árbol se vuelve bioflavonoid`
  const html = shell({
    subject,
    eyebrow: 'Catación inmersiva · Día 14',
    headline: `<span style="color:${C.criollo};">Alchemize.</span><br>No es metáfora.`,
    intro: `${ctx.userName}, dos semanas. Tu árbol absorbió ${ctx.co2Kg.toFixed(2)} kg de CO₂. Pero hoy no te quiero hablar del árbol — te quiero hablar de la fermentación.`,
    body: `
      <p style="margin:0 0 14px;">Cuando ${ctx.guardianName} cosecha la mazorca, la pulpa blanca alrededor del bean (el <strong style="color:${C.pod};">mucílago</strong>) es lo que activa toda la transformación. 6 días de fermentación controlada bajo hojas de plátano. Temperatura 45-50°C. La levadura natural convierte azúcares en ácido láctico. Los <strong style="color:${C.mazorca};">bioflavonoids</strong> se vuelven biodisponibles.</p>
      <p style="margin:0 0 14px;">El resto del mundo tira el mucílago. Nosotros lo <strong style="color:${C.heirloom};">liofilizamos</strong>: -40°C, vacío profundo, sublimación. Quedan cristales rosados que retienen el 98% de los compuestos vivos.</p>
      <p style="margin:0 0 14px;color:${C.heirloom}aa;">Eso es lo que va dentro del Caua Cacao Drop que vas a tener acceso pronto. 10 unidades de mucílago liofilizado. 10 de bean liofilizado. 20 en total para toda la cohorte fundadora.</p>
      <div style="margin:18px 0;padding:14px 16px;background:${C.criollo}22;border-left:3px solid ${C.criollo};">
        <p style="margin:0;font-style:italic;color:${C.heirloom};">"Upcycled Cacao no es marketing — es respeto al árbol entero. Tomamos lo que la industria descarta y lo convertimos en Functional Health."</p>
      </div>
      <p style="margin:0;color:${C.heirloom}aa;">El día 21 te abrimos la puerta del Drop. Antes que a nadie más.</p>
    `,
    ctaLabel: 'Ver el proceso completo',
    ctaUrl: `${APP_BASE_URL}/blog/upcycled-cacao-process`,
    footerSignoff: 'No estás comprando producto — estás cerrando un ciclo regenerative.',
  })
  return { subject, html }
}

// ──────────────── D21 — Caua Cacao Drop Reveal ────────────────
function templateDay21(ctx: LifecycleContext) {
  const subject = `🔓 Acceso temprano: Caua Cacao Drop · 20 unidades · cierra 26 mayo`
  const html = shell({
    subject,
    eyebrow: 'Caua Cacao Drop · cohorte fundadora',
    headline: `20 unidades.<br>Solo para <span style="color:${C.criollo};">Creyentes</span>.`,
    intro: `${ctx.userName}, llegó el momento. El Caua Cacao Drop está abierto — solo para los que adoptaron árbol y cuidaron durante 3 semanas. Vos sos parte de ese grupo.`,
    body: `
      <div style="margin-bottom:20px;padding:18px;background:${C.amazon};border:1px solid ${C.pod};border-radius:8px;">
        <div style="font-family:Georgia,serif;font-style:italic;font-size:11px;color:${C.pod};letter-spacing:0.22em;text-transform:uppercase;margin-bottom:12px;">El Drop incluye</div>
        <div style="margin-bottom:14px;">
          <div style="font-size:18px;font-weight:900;color:${C.heirloom};">Mucílago Liofilizado · 30g</div>
          <div style="font-size:12px;color:${C.heirloom}88;margin-top:4px;">10 unidades · $149 USD · cristales rosados Upcycled</div>
        </div>
        <div style="margin-bottom:14px;">
          <div style="font-size:18px;font-weight:900;color:${C.heirloom};">Bean Liofilizado · 50g</div>
          <div style="font-size:12px;color:${C.heirloom}88;margin-top:4px;">10 unidades · $179 USD · fermentado lote único 2025</div>
        </div>
        <div style="margin-top:14px;padding-top:14px;border-top:1px solid ${C.pod}44;">
          <div style="font-size:13px;color:${C.mazorca};font-weight:700;">Cada compra desbloquea un NFT Caua Creyente Cohorte 01 (Base, mint gratis).</div>
        </div>
      </div>
      <p style="margin:0 0 14px;"><strong style="color:${C.mazorca};">Por qué importa el límite:</strong> el lote 2025 que ${ctx.guardianName} y los otros 4 Pentámera fermentaron tiene un perfil sensorial irrepetible. El próximo lote será 2026 — distinto clima, distinta levadura, distinta historia.</p>
      <p style="margin:0 0 14px;"><strong style="color:${C.theobroma};">Cierre: 26 de mayo 2026, 23:59 COT.</strong> O cuando se agoten las 20 unidades. Lo que llegue primero.</p>
      <p style="margin:0;color:${C.heirloom}aa;">Si completás también el recorrido Golden Ticket (te explico mañana), accedés gratis al Workshop Cacao 2.0 el 15 de junio.</p>
    `,
    ctaLabel: 'Reservar mi Drop',
    ctaUrl: `${APP_BASE_URL}/drop`,
    ctaColor: C.mazorca,
    postCtaNote: 'Pago seguro Stripe + Coinbase USDC. Envío internacional incluido en precio.',
    footerSignoff: '"Lo que vas a probar es 6 meses de trabajo de 5 Guardian farmers + 6 días de fermentación + lo que la industria tira. No es chocolate. Es Functional Cacao Sacred."',
  })
  return { subject, html }
}

// ──────────────── D28 — Golden Ticket Reveal ────────────────
function templateDay28(ctx: LifecycleContext) {
  const subject = `🎟️ Tu Golden Ticket está casi listo — falta 1 paso`
  const html = shell({
    subject,
    eyebrow: 'Golden Ticket · Workshop Cacao 2.0',
    headline: `Estás a 1 paso<br>del <span style="color:${C.mazorca};">Workshop Cacao 2.0</span>`,
    intro: `${ctx.userName}, completaste 28 días. Adoptaste, cuidaste, leíste, probaste. Te falta una sola cosa para tu Golden Ticket: comprar tu Caua Cacao Drop antes del 26 de mayo.`,
    body: `
      <div style="margin-bottom:20px;">
        <div style="font-family:Georgia,serif;font-style:italic;font-size:11px;color:${C.pod};letter-spacing:0.22em;text-transform:uppercase;margin-bottom:12px;">Recorrido Caua Creyente</div>
        <div style="margin-bottom:10px;"><span style="color:${C.pod};font-weight:900;">✓</span> Adoptaste tu árbol Pentámera</div>
        <div style="margin-bottom:10px;"><span style="color:${C.pod};font-weight:900;">✓</span> 5+ care actions registradas (sol, agua, nutrientes)</div>
        <div style="margin-bottom:10px;"><span style="color:${C.pod};font-weight:900;">✓</span> Completaste la primera catación sensorial</div>
        <div style="margin-bottom:10px;"><span style="color:${C.pod};font-weight:900;">✓</span> Recibiste voice note de ${ctx.guardianName}</div>
        <div style="margin-bottom:10px;"><span style="color:${C.mazorca};font-weight:900;">○</span> <strong>Falta:</strong> Tu Caua Cacao Drop reservado</div>
      </div>
      <div style="margin:18px 0;padding:18px;background:${C.criollo}22;border:1px solid ${C.criollo};border-radius:8px;">
        <div style="font-family:Georgia,serif;font-style:italic;font-size:11px;color:${C.criollo};letter-spacing:0.22em;text-transform:uppercase;margin-bottom:10px;">Workshop Cacao 2.0 · Acceso gratis</div>
        <p style="margin:0 0 10px;color:${C.heirloom};font-size:15px;font-weight:700;">15 de junio 2026 · 90 minutos · Zoom · ES + EN</p>
        <p style="margin:0;color:${C.heirloom}cc;font-size:13px;line-height:1.6;">Co-presentado por David Montoya (CEO Caúa) y Amaury Amed (CTO). Cómo conectar territorio con consumidor fine-flavor: el caso Pentámera. Para emprendedores, foodies, y futuros Guardian builders.</p>
      </div>
      <p style="margin:0;color:${C.heirloom}aa;">El Workshop tiene cupos limitados (30 personas). Los Caua Creyentes entran primero. Después abrimos a lista pública por $149 USD.</p>
    `,
    ctaLabel: 'Reclamar mi Golden Ticket',
    ctaUrl: `${APP_BASE_URL}/drop?ref=golden`,
    ctaColor: C.mazorca,
    postCtaNote: 'Cierre del Drop: 26 mayo 23:59 COT. Workshop: 15 junio 2026.',
    footerSignoff: '"With Nature We Walk." Te esperamos del otro lado del Drop.',
  })
  return { subject, html }
}

export function renderLifecycleEmail(day: LifecycleDay, ctx: LifecycleContext): { subject: string; html: string } {
  switch (day) {
    case 1:  return templateDay1(ctx)
    case 3:  return templateDay3(ctx)
    case 7:  return templateDay7(ctx)
    case 14: return templateDay14(ctx)
    case 21: return templateDay21(ctx)
    case 28: return templateDay28(ctx)
  }
}
