import { useState, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { hsTrackEvent } from '../lib/hubspotTracking'
import { BRAND, FONTS } from '../utils/constants'

// ============================================================================
// HOOK: useReveal — Scroll-reveal con IntersectionObserver
// ============================================================================
function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true)
      },
      { threshold: 0.15 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return { ref, visible }
}

// ============================================================================
// COMPONENTE: RevealSection — wrapper con fade + slide-up
// ============================================================================
function RevealSection({
  children,
  delay = 0,
}: {
  children: ReactNode
  delay?: number
}) {
  const { ref, visible } = useReveal()

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(32px)',
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

// ============================================================================
// DATOS: Cinco Tiempos de Cacao
// ============================================================================
const CINCO_TIEMPOS = [
  {
    num: '1',
    title: 'Árbol al Fruto',
    desc: 'El Cacaotier abre la mazorca fresca. Primer contacto sensorial con el Theobroma cacao vivo — aroma, textura, bioma vivo del ecosistema regenerativo de Arauca.',
    icon: '🌱',
    color: BRAND.pod,
  },
  {
    num: '2',
    title: 'Origen Regenerativo',
    desc: 'Recorrido guiado por la trazabilidad: agricultor, finca, altitud. Cata de cacao liofilizado de Arauca. El Cacaotier narra el ciclo sin intermediarios.',
    icon: '🌍',
    color: BRAND.mazorca,
  },
  {
    num: '3',
    title: 'Mucílago: Oro Molecular',
    desc: 'El Cacaotier sirve mucílago granizado. La pulpa más antioxidante del mundo, reutilizada como superalimento. Ancestral y molecular en una cucharada.',
    icon: '✨',
    color: BRAND.theobroma,
  },
  {
    num: '4',
    title: 'Refinación Artesanal',
    desc: 'Hobo · Huila · Finca Santa María · 100% Licor · 250g. El Cacaotier guía la cata de barra de origen único. Notas sensoriales de un cacao que nunca llega al supermercado.',
    icon: '🫘',
    color: BRAND.criollo,
  },
  {
    num: '5',
    title: 'Chocolate Ritual',
    desc: 'Preparación ancestral en vivo: chocolate con agua ritualizada, panela o gelatina de pata prehispánica. El Cacaotier cierra el círculo con ceremonial colectivo.',
    icon: '☕',
    color: BRAND.muisca,
  },
  {
    num: '6',
    title: 'Impacto Regenerativo',
    desc: 'Cierre narrativo del triple impacto: comunidad · agricultor · ecosistema. El grupo visualiza cómo su elección regenera el bosque colombiano.',
    icon: '🌳',
    color: BRAND.leafy,
  },
]

// ============================================================================
// COTIZADOR INTERACTIVO
// ============================================================================
const TIEMPOS_OPTIONS = [
  {
    key: '3t',
    label: 'Tres Tiempos',
    sublabel: '1 hora',
    desc: 'Árbol al Fruto · Mucílago · Chocolate Ritual',
    extra: 0,
  },
  {
    key: '5t',
    label: 'Cinco Tiempos',
    sublabel: '2 horas',
    desc: 'Cadena completa del cacao regenerativo',
    extra: 12_000,
  },
  {
    key: '6t',
    label: 'Experiencia Completa',
    sublabel: '3 horas',
    desc: 'Cinco Tiempos + Cierre de Impacto Regenerativo',
    extra: 22_000,
  },
]

function getBasePerPerson(n: number) {
  if (n <= 4) return 65_000
  if (n <= 12) return 58_000
  if (n <= 25) return 50_000
  return 45_000
}

const CEREMONIAL_EXTRA = 35_000

const fmtCOP = (n: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n)

function PriceCalculator() {
  const [participants, setParticipants] = useState(8)
  const [tiemposKey, setTiemposKey] = useState('5t')
  const [ceremonial, setCeremonial] = useState(false)
  const [nombre,   setNombre]   = useState('Andrea Rojas')
  const [optEmail, setOptEmail] = useState('')
  const [optPhase, setOptPhase] = useState<'idle' | 'saving' | 'done' | 'error'>('idle')

  const tiempos   = TIEMPOS_OPTIONS.find(t => t.key === tiemposKey)!
  const basePerP  = getBasePerPerson(participants)
  const extraPerP = tiempos.extra + (ceremonial ? CEREMONIAL_EXTRA : 0)
  const perPerson = basePerP + extraPerP
  const total     = perPerson * participants

  async function handleOptIn(e: React.SyntheticEvent) {
    e.preventDefault()
    if (!optEmail.trim() || optPhase !== 'idle') return
    setOptPhase('saving')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-cotizacion`
      await fetch(fnUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ nombre, email: optEmail.trim(), participants, tiempos: tiemposKey, ceremonial, perPerson, total }),
      })
      await supabase.from('caua_leads').insert({
        email: optEmail.trim(),
        source: 'caua-coti/andrea-rojas',
        metadata: { nombre, participants, tiempos: tiemposKey, ceremonial },
      })
      hsTrackEvent('Caua-Coti Opt-In', { email: optEmail.trim(), participants, tiempos: tiemposKey, ceremonial: ceremonial ? 1 : 0 })
      setOptPhase('done')
    } catch {
      setOptPhase('error')
    }
  }


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* ── Participantes ─────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <p style={{ fontFamily: FONTS.body, fontSize: 11, color: `${BRAND.heirloom}77`,
            letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
            Participantes
          </p>
          <span style={{ fontFamily: FONTS.display, fontSize: 28, fontWeight: 900,
            color: BRAND.heirloom }}>{participants}</span>
        </div>
        <input
          type="range" min={2} max={50} value={participants}
          onChange={e => setParticipants(Number(e.target.value))}
          style={{ width: '100%', accentColor: BRAND.mazorca, cursor: 'pointer', height: 4 }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          {[
            { n: 2, label: '2 · $65k/p' },
            { n: 5, label: '5 · $58k/p' },
            { n: 13, label: '13 · $50k/p' },
            { n: 26, label: '26+ · $45k/p' },
          ].map(tier => (
            <span key={tier.n} style={{ fontFamily: FONTS.body, fontSize: 9,
              color: participants >= tier.n ? `${BRAND.mazorca}cc` : `${BRAND.heirloom}33`,
              transition: 'color 0.2s' }}>
              {tier.label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Tiempos de experiencia ────────────────────── */}
      <div>
        <p style={{ fontFamily: FONTS.body, fontSize: 11, color: `${BRAND.heirloom}77`,
          letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10, margin: '0 0 10px' }}>
          Experiencia inmersiva
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {TIEMPOS_OPTIONS.map(opt => (
            <button key={opt.key} onClick={() => setTiemposKey(opt.key)} style={{
              textAlign: 'left', padding: '12px 16px', borderRadius: 8, cursor: 'pointer',
              border: `1.5px solid ${tiemposKey === opt.key ? BRAND.mazorca : `${BRAND.heirloom}18`}`,
              background: tiemposKey === opt.key ? `${BRAND.mazorca}10` : '#1a1a1a',
              transition: 'all 0.2s',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontFamily: FONTS.display, fontSize: 12, fontWeight: 700,
                  color: tiemposKey === opt.key ? BRAND.mazorca : BRAND.heirloom }}>
                  {opt.label}
                </span>
                <span style={{ fontFamily: FONTS.body, fontSize: 10, color: `${BRAND.heirloom}55` }}>
                  {opt.sublabel}{opt.extra > 0 ? ` · +${fmtCOP(opt.extra)}/p` : ' · incluido'}
                </span>
              </div>
              <p style={{ fontFamily: FONTS.body, fontSize: 10, color: `${BRAND.heirloom}55`,
                margin: '4px 0 0' }}>
                {opt.desc}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* ── Upgrade Ceremonial Grade ──────────────────── */}
      <div
        onClick={() => setCeremonial(c => !c)}
        style={{
          border: `1.5px solid ${ceremonial ? BRAND.criollo : `${BRAND.heirloom}18`}`,
          borderRadius: 8, padding: '14px 16px', cursor: 'pointer',
          background: ceremonial ? `${BRAND.criollo}0d` : '#1a1a1a',
          transition: 'all 0.2s',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <p style={{ fontFamily: FONTS.display, fontSize: 12, fontWeight: 700,
              color: ceremonial ? BRAND.criollo : BRAND.heirloom, margin: '0 0 4px' }}>
              ✦ Upgrade Ceremonial Grade
            </p>
            <p style={{ fontFamily: FONTS.body, fontSize: 11, color: `${BRAND.heirloom}77`, margin: 0 }}>
              Cacao 100% Ceremonial CAUA · Finca Santa María · Hobo, Huila · Origen Único
            </p>
            <p style={{ fontFamily: FONTS.body, fontSize: 10, color: `${BRAND.heirloom}44`,
              margin: '3px 0 0' }}>
              Barra artesanal 250g + preparación ceremonial ancestral · +{fmtCOP(CEREMONIAL_EXTRA)}/persona
            </p>
          </div>
          <div style={{
            width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 2,
            border: `2px solid ${ceremonial ? BRAND.criollo : `${BRAND.heirloom}33`}`,
            background: ceremonial ? BRAND.criollo : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
          }}>
            {ceremonial && <span style={{ color: BRAND.bgDeep, fontSize: 13, fontWeight: 900,
              lineHeight: 1 }}>✓</span>}
          </div>
        </div>
      </div>

      {/* ── Tu Coti ───────────────────────────────────── */}
      <div style={{
        background: `linear-gradient(135deg, ${BRAND.amazon}1a 0%, ${BRAND.pod}0d 100%)`,
        border: `1.5px solid ${BRAND.mazorca}40`,
        borderRadius: 10, padding: '20px 24px',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
          {[
            ['Participantes', `${participants} personas`],
            ['Precio por persona', fmtCOP(perPerson)],
            ['Experiencia', tiempos.label],
            ['Duración estimada', tiempos.sublabel],
          ].map(([k, v]) => (
            <div key={k}>
              <p style={{ fontFamily: FONTS.body, fontSize: 9, color: `${BRAND.heirloom}55`,
                letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 2px' }}>{k}</p>
              <p style={{ fontFamily: FONTS.body, fontSize: 12, color: BRAND.heirloom, margin: 0 }}>{v}</p>
            </div>
          ))}
        </div>
        <div style={{ borderTop: `1px solid ${BRAND.mazorca}25`, paddingTop: 14,
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <p style={{ fontFamily: FONTS.body, fontSize: 10, color: `${BRAND.heirloom}66`,
            letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>Total inversión</p>
          <p style={{ fontFamily: FONTS.display, fontSize: 36, fontWeight: 900,
            color: BRAND.mazorca, margin: 0 }}>{fmtCOP(total)}</p>
        </div>
      </div>

      {/* ── CTA principal: email ──────────────────────── */}
      {optPhase !== 'done' ? (
        <form onSubmit={handleOptIn} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            required placeholder="Nombre"
            value={nombre} onChange={e => setNombre(e.target.value)}
            style={{ padding: '12px 16px', borderRadius: 8, fontSize: 13,
              border: `1px solid ${BRAND.heirloom}25`, background: '#1a1a1a',
              color: BRAND.heirloom, fontFamily: FONTS.body, outline: 'none' }}
          />
          <input
            type="email" required placeholder="tu@email.com"
            value={optEmail} onChange={e => setOptEmail(e.target.value)}
            style={{ padding: '12px 16px', borderRadius: 8, fontSize: 13,
              border: `1px solid ${BRAND.heirloom}25`, background: '#1a1a1a',
              color: BRAND.heirloom, fontFamily: FONTS.body, outline: 'none' }}
          />
          <button type="submit" disabled={optPhase === 'saving'} style={{
            padding: '14px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: BRAND.mazorca, color: BRAND.amazon,
            fontFamily: FONTS.display, fontSize: 13, fontWeight: 700,
          }}>
            {optPhase === 'saving' ? 'Enviando…' : optPhase === 'error' ? 'Reintentar' : '📩 Recibir Tu Coti por email'}
          </button>
          {optPhase === 'error' && (
            <p style={{ fontFamily: FONTS.body, fontSize: 11, color: BRAND.theobroma,
              margin: 0, textAlign: 'center' }}>
              Error al enviar. Intenta de nuevo o escríbenos a amaury@cauacolombia.co
            </p>
          )}
        </form>
      ) : (
        <div style={{ background: `${BRAND.pod}12`, border: `1px solid ${BRAND.pod}33`,
          borderRadius: 8, padding: '16px 20px', textAlign: 'center' }}>
          <p style={{ fontFamily: FONTS.display, fontSize: 14, fontWeight: 700,
            color: BRAND.pod, margin: '0 0 4px' }}>✓ Tu Coti enviada a {optEmail}</p>
          <p style={{ fontFamily: FONTS.body, fontSize: 12, color: `${BRAND.heirloom}66`, margin: 0 }}>
            Revisa tu bandeja de entrada
          </p>
        </div>
      )}

    </div>
  )
}

// ============================================================================
// COMPONENTE PRINCIPAL: ProposalAndreaRojas
// ============================================================================
export default function ProposalAndreaRojas() {
  // Track visit on mount — no auth required
  useEffect(() => {
    ;(async () => {
      try {
        await supabase
          .from('cotizaciones_b2b')
          .update({ status: 'vista', vista_en: new Date().toISOString() })
          .eq('slug', 'andrea-rojas')
        hsTrackEvent('B2B Catación Vista', { timestamp: new Date().toISOString() })
      } catch {
        // Silently fail — non-blocking
      }
    })()
  }, [])

  return (
      <div
        style={{
          background: BRAND.bgDeep,
          color: BRAND.heirloom,
          minHeight: '100vh',
          overflow: 'visible',
          paddingTop: '60px',
        }}
      >
        {/* MEMBRETE */}
        <header
          style={{
            background: `linear-gradient(135deg, ${BRAND.amazon} 0%, #0f1e19 100%)`,
            padding: '40px',
            borderBottom: `8px solid ${BRAND.mazorca}`,
            display: 'block',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 40,
            }}
          >
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
            {/* Logo */}
            <div
              style={{
                width: 60,
                height: 60,
                background: BRAND.amazon,
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <img
                src="/caua-logo-white.png"
                alt="CAUA Logo"
                style={{ width: '90%', height: '90%', objectFit: 'contain' }}
              />
            </div>
            {/* Company Info */}
            <div style={{ fontSize: 14, lineHeight: 1.6 }}>
              <div style={{ fontFamily: FONTS.display, fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
                CAUA COLOMBIA SAS
              </div>
              <div>NIT: 901213846-7</div>
              <div style={{ opacity: 0.8 }}>Biotecnología Ancestral del Cacao</div>
            </div>
          </div>

          {/* Doc metadata */}
          <div style={{ textAlign: 'right', fontSize: 11, opacity: 0.9 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>COTIZACIÓN</div>
            <div>Catación Cinco Tiempos</div>
            <div style={{ marginTop: 8, opacity: 0.7 }}>Válida 30 días</div>
          </div>
          </div>
        </header>

        {/* CONTENIDO */}
        <main
          style={{
            maxWidth: 1000,
            margin: '0 auto',
            padding: '50px 40px',
            width: '100%',
            position: 'relative',
            zIndex: 0,
          }}
        >
          {/* Titulo */}
          <RevealSection delay={0}>
            <h1
              style={{
                fontFamily: FONTS.serif,
                fontSize: 'clamp(28px, 6vw, 48px)',
                fontWeight: 700,
                color: BRAND.heirloom,
                marginBottom: 12,
                letterSpacing: '-1px',
              }}
            >
              CATACIÓN: CINCO TIEMPOS DE CACAO
            </h1>
          </RevealSection>

          {/* Subtítulo */}
          <RevealSection delay={100}>
            <p
              style={{
                fontFamily: FONTS.serif,
                fontSize: 16,
                color: BRAND.heirloom,
                opacity: 0.8,
                marginBottom: 32,
                fontStyle: 'italic',
              }}
            >
              Experiencia Sensorial Inmersiva Regenerativa
            </p>
          </RevealSection>

          {/* Intro box */}
          <RevealSection delay={200}>
            <div
              style={{
                background: `${BRAND.pod}15`,
                borderLeft: `4px solid ${BRAND.pod}`,
                padding: 16,
                marginBottom: 40,
                fontSize: 13,
                lineHeight: 1.6,
              }}
            >
              <strong>Presentado a:</strong> Andrea Rojas · Turismo Sostenible · Universidad CESA
              <br />
              <strong>Facilitador:</strong> Amaury Amed (CTO Caúa) · 📱 3102227848
            </div>
          </RevealSection>

          {/* Description */}
          <RevealSection delay={300}>
            <p
              style={{
                fontFamily: FONTS.body,
                fontSize: 14,
                lineHeight: 1.7,
                color: BRAND.heirloom,
                opacity: 0.85,
                marginBottom: 48,
              }}
            >
              Una experiencia inmersiva de 1 a 2 horas a través de la cadena regenerativa del cacao colombiano. Desde el árbol ancestral hasta la preparación ritual, experimenta cinco momentos que desafían la industria tradicional del chocolate, empoderando agricultores y regenerando ecosistemas. Todo incluido.
            </p>
          </RevealSection>

          {/* Cinco Tiempos Grid */}
          <RevealSection delay={400}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: 20,
                marginBottom: 50,
              }}
            >
              {CINCO_TIEMPOS.map((tiempo, idx) => (
                <div
                  key={idx}
                  style={{
                    border: `1px solid ${tiempo.color}40`,
                    borderRadius: 8,
                    padding: 20,
                    background: `${tiempo.color}08`,
                    transition: 'all 0.3s ease',
                    cursor: 'default',
                  }}
                  onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                    const el = e.currentTarget
                    el.style.boxShadow = `0 8px 24px ${tiempo.color}20`
                    el.style.borderColor = tiempo.color
                    el.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                    const el = e.currentTarget
                    el.style.boxShadow = 'none'
                    el.style.borderColor = `${tiempo.color}40`
                    el.style.transform = 'translateY(0)'
                  }}
                >
                  {/* Number badge */}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: tiempo.color,
                      color: BRAND.bgDeep,
                      fontWeight: 700,
                      fontSize: 14,
                      marginBottom: 12,
                    }}
                  >
                    {tiempo.num}
                  </div>

                  {/* Title */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 12,
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{tiempo.icon}</span>
                    <h3
                      style={{
                        fontFamily: FONTS.serif,
                        fontSize: 16,
                        fontWeight: 600,
                        color: BRAND.heirloom,
                      }}
                    >
                      {tiempo.title}
                    </h3>
                  </div>

                  {/* Description */}
                  <p
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: 12,
                      lineHeight: 1.5,
                      color: BRAND.heirloom,
                      opacity: 0.8,
                    }}
                  >
                    {tiempo.desc}
                  </p>
                </div>
              ))}
            </div>
          </RevealSection>

          {/* COTIZADOR */}
          <RevealSection delay={500}>
            <h2
              style={{
                fontFamily: FONTS.serif,
                fontSize: 24,
                fontWeight: 700,
                color: BRAND.heirloom,
                marginBottom: 8,
                borderBottom: `2px solid ${BRAND.mazorca}`,
                paddingBottom: 12,
              }}
            >
              Configura tu Experiencia
            </h2>
            <p style={{ fontFamily: FONTS.body, fontSize: 13, color: `${BRAND.heirloom}77`,
              marginBottom: 28 }}>
              Guiada por Amaury Amed · Cacaotier &amp; CTO Caúa · Toda la experiencia incluida
            </p>
            <PriceCalculator />
          </RevealSection>

          {/* TÉRMINOS */}
          <RevealSection delay={600}>
            <div
              style={{
                background: `${BRAND.pod}10`,
                borderLeft: `4px solid ${BRAND.pod}`,
                padding: 20,
                marginTop: 32,
                marginBottom: 16,
                fontSize: 12,
                lineHeight: 1.7,
                color: BRAND.heirloom,
              }}
            >
              <strong style={{ display: 'block', marginBottom: 12 }}>Términos y Condiciones:</strong>
              <div style={{ opacity: 0.85 }}>
                ✓ <strong>Validez:</strong> 30 días a partir de hoy
                <br />
                ✓ <strong>Pago:</strong> Contraentrega el día del evento
                <br />
                ✓ <strong>Documento:</strong> Factura Electrónica de Servicios
                <br />
                ✓ <strong>Confirmación:</strong> 3102227848 o amaury@cauacolombia.co
              </div>
            </div>
          </RevealSection>
        </main>

        {/* FOOTER */}
        <footer
          style={{
            background: `linear-gradient(135deg, ${BRAND.amazon} 0%, #0f1e19 100%)`,
            borderTop: `1px solid ${BRAND.pod}`,
            padding: '30px 40px',
            textAlign: 'center',
            fontSize: 11,
            lineHeight: 1.6,
            color: BRAND.heirloom,
          }}
        >
          <strong style={{ display: 'block', marginBottom: 6 }}>CAUA COLOMBIA SAS · NIT 901213846-7</strong>
          <div style={{ marginBottom: 8, opacity: 0.85 }}>Biotecnología ancestral del cacao colombiano · Del genoma colombiano al mundo</div>
          <div style={{ fontSize: 10, opacity: 0.75 }}>
            📧 amaury@cauacolombia.co · 📱 +57 310 222 7848 · 🌐 www.cacaofrutabrutal.com
          </div>
        </footer>
      </div>
  )
}
