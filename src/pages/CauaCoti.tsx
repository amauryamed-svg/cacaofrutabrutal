import { useState, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { hsTrackEvent } from '../lib/hubspotTracking'
import { BRAND, FONTS } from '../utils/constants'

// ── Scroll reveal ────────────────────────────────────────────
function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.12 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return { ref, visible }
}
function RevealSection({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const { ref, visible } = useReveal()
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(28px)',
      transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
    }}>{children}</div>
  )
}

// ── Pricing logic ────────────────────────────────────────────
const TIEMPOS_OPTIONS = [
  { key: '3t', label: 'Tres Tiempos',         sublabel: '1 hora',  desc: 'Árbol al Fruto · Mucílago · Chocolate Ritual',                extra: 0      },
  { key: '5t', label: 'Cinco Tiempos',         sublabel: '2 horas', desc: 'Cadena completa del cacao regenerativo',                      extra: 12_000 },
  { key: '6t', label: 'Experiencia Completa',  sublabel: '3 horas', desc: 'Cinco Tiempos + Cierre de Impacto Regenerativo',              extra: 22_000 },
]
function getBasePerPerson(n: number) {
  if (n <= 4)  return 65_000
  if (n <= 12) return 58_000
  if (n <= 25) return 50_000
  return 45_000
}
const CEREMONIAL_EXTRA = 35_000
const fmtCOP = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

const CINCO_TIEMPOS = [
  { num: '1', title: 'Árbol al Fruto',       icon: '🌱', color: BRAND.pod,       desc: 'El Cacaotier abre la mazorca fresca. Primer contacto sensorial con el Theobroma cacao vivo.' },
  { num: '2', title: 'Origen Regenerativo',  icon: '🌍', color: BRAND.mazorca,   desc: 'Recorrido guiado por la trazabilidad: agricultor, finca, altitud. Cacao liofilizado de Arauca.' },
  { num: '3', title: 'Mucílago Molecular',   icon: '✨', color: BRAND.theobroma, desc: 'El Cacaotier sirve mucílago granizado. La pulpa más antioxidante del mundo, ancestral y molecular.' },
  { num: '4', title: 'Refinación Artesanal', icon: '🫘', color: BRAND.criollo,   desc: 'Hobo · Huila · Finca Santa María · 100% Licor · 250g. Cata de barra de origen único.' },
  { num: '5', title: 'Chocolate Ritual',     icon: '☕', color: BRAND.muisca,    desc: 'Preparación ancestral en vivo: chocolate con agua ritualizada. El Cacaotier cierra con ceremonial colectivo.' },
  { num: '6', title: 'Impacto Regenerativo', icon: '🌳', color: BRAND.leafy,     desc: 'Cierre narrativo del triple impacto: comunidad · agricultor · ecosistema.' },
]

// ── Price Calculator ─────────────────────────────────────────
function PriceCalculator() {
  const [participants, setParticipants] = useState(10)
  const [tiemposKey, setTiemposKey]     = useState('5t')
  const [ceremonial, setCeremonial]     = useState(false)
  const [nombre,     setNombre]         = useState('')
  const [email,      setEmail]          = useState('')
  const [phase, setPhase]               = useState<'idle' | 'sending' | 'done' | 'error'>('idle')

  const tiempos   = TIEMPOS_OPTIONS.find(t => t.key === tiemposKey)!
  const basePerP  = getBasePerPerson(participants)
  const extraPerP = tiempos.extra + (ceremonial ? CEREMONIAL_EXTRA : 0)
  const perPerson = basePerP + extraPerP
  const total     = perPerson * participants

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault()
    if (phase !== 'idle') return
    setPhase('sending')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-cotizacion`
      const res = await fetch(fnUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ nombre, email, participants, tiempos: tiemposKey, ceremonial, perPerson, total }),
      })
      if (!res.ok) throw new Error('send failed')
      await supabase.from('caua_leads').insert({
        email, source: 'caua-coti/general',
        metadata: { nombre, participants, tiempos: tiemposKey, ceremonial },
      })
      hsTrackEvent('Caua-Coti Opt-In', { email, participants, tiempos: tiemposKey, ceremonial: ceremonial ? 1 : 0 })
      setPhase('done')
    } catch {
      setPhase('error')
    }
  }



  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Participantes */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontFamily: FONTS.body, fontSize: 11, color: `${BRAND.heirloom}66`,
            letterSpacing: '0.1em', textTransform: 'uppercase' }}>Participantes</span>
          <span style={{ fontFamily: FONTS.display, fontSize: 26, fontWeight: 900,
            color: BRAND.heirloom }}>{participants}</span>
        </div>
        <input type="range" min={2} max={50} value={participants}
          onChange={e => setParticipants(Number(e.target.value))}
          style={{ width: '100%', accentColor: BRAND.mazorca, cursor: 'pointer', height: 4 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          {[{ n: 2, t: '2 · $65k/p' }, { n: 5, t: '5 · $58k/p' }, { n: 13, t: '13 · $50k/p' }, { n: 26, t: '26+ · $45k/p' }]
            .map(tier => (
              <span key={tier.n} style={{ fontFamily: FONTS.body, fontSize: 9, transition: 'color 0.2s',
                color: participants >= tier.n ? `${BRAND.mazorca}cc` : `${BRAND.heirloom}28` }}>
                {tier.t}
              </span>
            ))}
        </div>
      </div>

      {/* Tiempos */}
      <div>
        <p style={{ fontFamily: FONTS.body, fontSize: 11, color: `${BRAND.heirloom}66`,
          letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 10px' }}>Experiencia inmersiva</p>
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
              <p style={{ fontFamily: FONTS.body, fontSize: 10, color: `${BRAND.heirloom}55`, margin: '4px 0 0' }}>
                {opt.desc}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Ceremonial upgrade */}
      <div onClick={() => setCeremonial(c => !c)} style={{
        border: `1.5px solid ${ceremonial ? BRAND.criollo : `${BRAND.heirloom}18`}`,
        borderRadius: 8, padding: '14px 16px', cursor: 'pointer',
        background: ceremonial ? `${BRAND.criollo}0d` : '#1a1a1a',
        transition: 'all 0.2s',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <p style={{ fontFamily: FONTS.display, fontSize: 12, fontWeight: 700,
              color: ceremonial ? BRAND.criollo : BRAND.heirloom, margin: '0 0 4px' }}>
              ✦ Upgrade Ceremonial Grade
            </p>
            <p style={{ fontFamily: FONTS.body, fontSize: 11, color: `${BRAND.heirloom}77`, margin: 0 }}>
              Cacao 100% Ceremonial CAUA · Finca Santa María · Hobo, Huila · Origen Único
            </p>
            <p style={{ fontFamily: FONTS.body, fontSize: 10, color: `${BRAND.heirloom}44`, margin: '3px 0 0' }}>
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
            {ceremonial && <span style={{ color: BRAND.bgDeep, fontSize: 13, fontWeight: 900, lineHeight: 1 }}>✓</span>}
          </div>
        </div>
      </div>

      {/* Tu Coti */}
      <div style={{
        background: `linear-gradient(135deg, ${BRAND.amazon}1a 0%, ${BRAND.pod}0d 100%)`,
        border: `1.5px solid ${BRAND.mazorca}40`,
        borderRadius: 10, padding: '20px 24px',
      }}>
        <p style={{ fontFamily: FONTS.body, fontSize: 10, color: `${BRAND.heirloom}55`,
          letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 16px' }}>Tu Coti</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
          {[
            ['Participantes', `${participants} personas`],
            ['Precio por persona', fmtCOP(perPerson)],
            ['Experiencia', tiempos.label],
            ['Duración', tiempos.sublabel],
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
          <p style={{ fontFamily: FONTS.body, fontSize: 10, color: `${BRAND.heirloom}55`,
            letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>Total</p>
          <p style={{ fontFamily: FONTS.display, fontSize: 36, fontWeight: 900,
            color: BRAND.mazorca, margin: 0 }}>{fmtCOP(total)}</p>
        </div>
      </div>

      {/* ── CTA principal: email ───────���───────────────── */}
      {phase !== 'done' ? (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            required placeholder="Tu nombre"
            value={nombre} onChange={e => setNombre(e.target.value)}
            style={{
              padding: '12px 16px', borderRadius: 8, fontSize: 13,
              border: `1px solid ${BRAND.heirloom}25`, background: '#1a1a1a',
              color: BRAND.heirloom, fontFamily: FONTS.body, outline: 'none',
            }}
          />
          <input
            type="email" required placeholder="tu@email.com"
            value={email} onChange={e => setEmail(e.target.value)}
            style={{
              padding: '12px 16px', borderRadius: 8, fontSize: 13,
              border: `1px solid ${BRAND.heirloom}25`, background: '#1a1a1a',
              color: BRAND.heirloom, fontFamily: FONTS.body, outline: 'none',
            }}
          />
          <button type="submit" disabled={phase === 'sending'} style={{
            padding: '14px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: BRAND.mazorca, color: BRAND.amazon,
            fontFamily: FONTS.display, fontSize: 13, fontWeight: 700,
          }}>
            {phase === 'sending' ? 'Enviando…' : phase === 'error' ? 'Reintentar' : '📩 Recibir Tu Coti por email'}
          </button>
          {phase === 'error' && (
            <p style={{ fontFamily: FONTS.body, fontSize: 11, color: BRAND.theobroma, margin: 0, textAlign: 'center' }}>
              Error al enviar. Intenta de nuevo o escríbenos a amaury@cauaculture.co
            </p>
          )}
        </form>
      ) : (
        <div style={{ background: `${BRAND.pod}12`, border: `1px solid ${BRAND.pod}33`,
          borderRadius: 8, padding: '16px 20px', textAlign: 'center' }}>
          <p style={{ fontFamily: FONTS.display, fontSize: 14, fontWeight: 700,
            color: BRAND.pod, margin: '0 0 4px' }}>✓ Tu Coti enviada a {email}</p>
          <p style={{ fontFamily: FONTS.body, fontSize: 12, color: `${BRAND.heirloom}66`, margin: 0 }}>
            Revisa tu bandeja de entrada
          </p>
        </div>
      )}

    </div>
  )
}

// ── Página principal ─────────────────────────────────────────
export default function CauaCoti() {
  useEffect(() => {
    // OG meta tags para esta ruta (WhatsApp / redes leen el DOM)
    const setMeta = (prop: string, val: string) => {
      let el = document.querySelector(`meta[property="${prop}"]`) as HTMLMetaElement | null
      if (!el) { el = document.createElement('meta'); el.setAttribute('property', prop); document.head.appendChild(el) }
      el.setAttribute('content', val)
    }
    setMeta('og:title',       'Catación Cinco Tiempos de Cacao · CAUA')
    setMeta('og:description', 'Experiencia sensorial inmersiva guiada por Cacaotier. Desde $65.000/persona. Configura tu experiencia y recibe Tu Coti al instante.')
    setMeta('og:url',         `${window.location.origin}/caua-coti`)
    document.title = 'Catación Cinco Tiempos · CAUA'

    hsTrackEvent('Catación Page View', { timestamp: new Date().toISOString() })

    return () => { document.title = 'CAUA — Cacao Fruta Brutal' }
  }, [])

  return (
    <div style={{ background: BRAND.bgDeep, color: BRAND.heirloom, minHeight: '100vh', paddingTop: '60px' }}>

      {/* MEMBRETE */}
      <header style={{
        background: `linear-gradient(135deg, ${BRAND.amazon} 0%, #0f1e19 100%)`,
        padding: '40px', borderBottom: `8px solid ${BRAND.mazorca}`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 40 }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
            <div style={{ width: 60, height: 60, background: BRAND.amazon, borderRadius: 4,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <img src="/caua-logo-white.png" alt="CAUA" style={{ width: '90%', height: '90%', objectFit: 'contain' }} />
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.6 }}>
              <div style={{ fontFamily: FONTS.display, fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
                CAUA COLOMBIA SAS
              </div>
              <div>NIT: 901213846-7</div>
              <div style={{ opacity: 0.8 }}>Biotecnología Ancestral del Cacao</div>
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 11, opacity: 0.9 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>CATACIÓN</div>
            <div>Cinco Tiempos de Cacao</div>
            <div style={{ marginTop: 8, opacity: 0.7 }}>Válida 30 días</div>
          </div>
        </div>
      </header>

      {/* CONTENIDO */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '50px 40px',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'start' }}>

        {/* Columna izquierda — descripción */}
        <div>
          <RevealSection delay={0}>
            <h1 style={{ fontFamily: FONTS.serif, fontSize: 'clamp(24px, 5vw, 40px)',
              fontWeight: 700, color: BRAND.heirloom, marginBottom: 8, letterSpacing: '-0.5px' }}>
              CATACIÓN: CINCO TIEMPOS DE CACAO
            </h1>
          </RevealSection>

          <RevealSection delay={100}>
            <p style={{ fontFamily: FONTS.serif, fontSize: 14, color: BRAND.heirloom,
              opacity: 0.8, marginBottom: 20, fontStyle: 'italic' }}>
              Experiencia Sensorial Inmersiva · Guiada por Cacaotier
            </p>
          </RevealSection>

          <RevealSection delay={150}>
            <div style={{ background: `${BRAND.pod}15`, borderLeft: `4px solid ${BRAND.pod}`,
              padding: 16, marginBottom: 32, fontSize: 13, lineHeight: 1.6 }}>
              Una experiencia inmersiva de 1 a 3 horas a través de la cadena regenerativa del cacao colombiano.
              Amaury Amed — Cacaotier &amp; CTO Caúa — guía cada recorrido desde el árbol vivo hasta la preparación ceremonial.
            </div>
          </RevealSection>

          {/* Los tiempos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {CINCO_TIEMPOS.map((t, i) => (
              <RevealSection key={t.num} delay={200 + i * 60}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start',
                  padding: '12px 0', borderBottom: `1px solid ${BRAND.amazon}18` }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: t.color,
                    color: BRAND.bgDeep, fontWeight: 900, fontSize: 12, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {t.num}
                  </div>
                  <div>
                    <p style={{ fontFamily: FONTS.display, fontSize: 12, fontWeight: 700,
                      color: t.color, margin: '0 0 3px' }}>{t.icon} {t.title}</p>
                    <p style={{ fontFamily: FONTS.body, fontSize: 11, color: `${BRAND.heirloom}77`,
                      margin: 0, lineHeight: 1.5 }}>{t.desc}</p>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>

        {/* Columna derecha — cotizador */}
        <RevealSection delay={200}>
          <div style={{ position: 'sticky', top: 80 }}>
            <p style={{ fontFamily: FONTS.body, fontSize: 11, color: `${BRAND.heirloom}66`,
              letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 20px' }}>
              Configura tu experiencia
            </p>
            <PriceCalculator />
          </div>
        </RevealSection>
      </div>

      {/* TÉRMINOS */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 40px 60px' }}>
        <RevealSection delay={400}>
          <div style={{ background: `${BRAND.pod}10`, borderLeft: `4px solid ${BRAND.pod}`,
            padding: '16px 20px', fontSize: 12, lineHeight: 1.7, color: BRAND.heirloom }}>
            <strong style={{ display: 'block', marginBottom: 8 }}>Términos:</strong>
            <div style={{ opacity: 0.85 }}>
              ✓ <strong>Pago:</strong> Contraentrega el día del evento &nbsp;·&nbsp;
              ✓ <strong>Documento:</strong> Factura Electrónica &nbsp;·&nbsp;
              ✓ <strong>Contacto:</strong> 3102227848 · amaury@cauaculture.co
            </div>
          </div>
        </RevealSection>
      </div>

      {/* FOOTER */}
      <footer style={{ background: `linear-gradient(135deg, ${BRAND.amazon} 0%, #0f1e19 100%)`,
        borderTop: `1px solid ${BRAND.pod}`, padding: '28px 40px', textAlign: 'center',
        fontSize: 11, lineHeight: 1.6, color: BRAND.heirloom }}>
        <strong style={{ display: 'block', marginBottom: 4 }}>CAUA COLOMBIA SAS · NIT 901213846-7</strong>
        <div style={{ opacity: 0.75 }}>
          📧 amaury@cauaculture.co · 📱 +57 310 222 7848 · 🌐 www.cacaofrutabrutal.com
        </div>
      </footer>
    </div>
  )
}
