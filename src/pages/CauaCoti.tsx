import { useState, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { hsTrackEvent } from '../lib/hubspotTracking'
import { BRAND, FONTS } from '../utils/constants'

// ── CSS keyframes injected once ─────────────────────────────
const CSS = `
@keyframes cacao-float { 0%,100%{transform:translateY(0) rotate(0deg)} 33%{transform:translateY(-18px) rotate(3deg)} 66%{transform:translateY(-8px) rotate(-2deg)} }
@keyframes cacao-pulse { 0%,100%{opacity:.18;transform:scale(1)} 50%{opacity:.35;transform:scale(1.08)} }
@keyframes cacao-slide-up { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
@keyframes cacao-glow { 0%,100%{box-shadow:0 0 20px rgba(241,169,30,.2)} 50%{box-shadow:0 0 44px rgba(241,169,30,.55),0 0 80px rgba(241,169,30,.2)} }
@keyframes cacao-spin-slow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
@keyframes cacao-ticker { from{transform:translateX(0)} to{transform:translateX(-50%)} }
`

function injectCSS() {
  if (document.getElementById('cacao-coti-css')) return
  const s = document.createElement('style')
  s.id = 'cacao-coti-css'
  s.textContent = CSS
  document.head.appendChild(s)
}

// ── Scroll reveal ────────────────────────────────────────────
function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}
function Reveal({ children, delay = 0, from = 'bottom' }: { children: ReactNode; delay?: number; from?: 'bottom' | 'left' | 'right' }) {
  const { ref, visible } = useReveal()
  const offsets = { bottom: 'translateY(36px)', left: 'translateX(-36px)', right: 'translateX(36px)' }
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'none' : offsets[from],
      transition: `opacity 0.7s cubic-bezier(.16,1,.3,1) ${delay}ms, transform 0.7s cubic-bezier(.16,1,.3,1) ${delay}ms`,
    }}>{children}</div>
  )
}

// ── Animated number ──────────────────────────────────────────
function AnimNum({ target, prefix = '', suffix = '' }: { target: number; prefix?: string; suffix?: string }) {
  const [val, setVal] = useState(0)
  const { ref, visible } = useReveal()
  useEffect(() => {
    if (!visible) return
    const dur = 1200, start = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - start) / dur, 1)
      const ease = 1 - Math.pow(1 - p, 4)
      setVal(Math.round(target * ease))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [visible, target])
  return <span ref={ref}>{prefix}{val.toLocaleString('es-CO')}{suffix}</span>
}

// ── Pricing logic ────────────────────────────────────────────
const TIEMPOS_OPTIONS = [
  { key: '3t', label: 'Tres Tiempos',        sublabel: '1 hora',  desc: 'Árbol al Fruto · Mucílago · Chocolate Ritual',           extra: 0      },
  { key: '5t', label: 'Cinco Tiempos',        sublabel: '2 horas', desc: 'Cadena completa del cacao regenerativo',                  extra: 12_000 },
  { key: '6t', label: 'Experiencia Completa', sublabel: '3 horas', desc: 'Cinco Tiempos + Cierre de Impacto Regenerativo',          extra: 22_000 },
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

// ── Floating orb ─────────────────────────────────────────────
function Orb({ x, y, size, color, delay }: { x: string; y: string; size: number; color: string; delay: number }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y, width: size, height: size,
      borderRadius: '50%', background: color,
      animation: `cacao-pulse 4s ease-in-out ${delay}ms infinite`,
      filter: 'blur(40px)', pointerEvents: 'none',
    }} />
  )
}

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
        email, source: 'catacion/general',
        metadata: { nombre, participants, tiempos: tiemposKey, ceremonial },
      })
      hsTrackEvent('Caua-Coti Opt-In', { email, participants, tiempos: tiemposKey, ceremonial: ceremonial ? 1 : 0 })
      setPhase('done')
    } catch {
      setPhase('error')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Participantes */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'baseline' }}>
          <span style={{ fontFamily: FONTS.body, fontSize: 10, color: `${BRAND.heirloom}66`,
            letterSpacing: '0.12em', textTransform: 'uppercase' }}>Participantes</span>
          <span style={{ fontFamily: FONTS.display, fontSize: 32, fontWeight: 900,
            color: BRAND.mazorca, lineHeight: 1 }}>{participants}</span>
        </div>
        <input type="range" min={2} max={50} value={participants}
          onChange={e => setParticipants(Number(e.target.value))}
          style={{ width: '100%', accentColor: BRAND.mazorca, cursor: 'pointer', height: 4 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          {[{ n: 2, t: '2 · $65k' }, { n: 5, t: '5 · $58k' }, { n: 13, t: '13 · $50k' }, { n: 26, t: '26+ · $45k' }]
            .map(tier => (
              <span key={tier.n} style={{ fontFamily: FONTS.body, fontSize: 9, transition: 'color 0.3s',
                color: participants >= tier.n ? `${BRAND.mazorca}cc` : `${BRAND.heirloom}28` }}>
                {tier.t}
              </span>
            ))}
        </div>
      </div>

      {/* Tiempos */}
      <div>
        <p style={{ fontFamily: FONTS.body, fontSize: 10, color: `${BRAND.heirloom}55`,
          letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 10px' }}>Experiencia inmersiva</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {TIEMPOS_OPTIONS.map(opt => (
            <button key={opt.key} onClick={() => setTiemposKey(opt.key)} style={{
              textAlign: 'left', padding: '12px 16px', borderRadius: 10, cursor: 'pointer',
              border: `1.5px solid ${tiemposKey === opt.key ? BRAND.mazorca : `${BRAND.heirloom}15`}`,
              background: tiemposKey === opt.key ? `${BRAND.mazorca}12` : 'rgba(255,255,255,.02)',
              transition: 'all 0.25s', transform: tiemposKey === opt.key ? 'scale(1.01)' : 'scale(1)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontFamily: FONTS.display, fontSize: 12, fontWeight: 700,
                  color: tiemposKey === opt.key ? BRAND.mazorca : BRAND.heirloom }}>{opt.label}</span>
                <span style={{ fontFamily: FONTS.body, fontSize: 9, color: `${BRAND.heirloom}44`, flexShrink: 0 }}>
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
        border: `1.5px solid ${ceremonial ? BRAND.criollo : `${BRAND.heirloom}15`}`,
        borderRadius: 10, padding: '14px 16px', cursor: 'pointer',
        background: ceremonial ? `${BRAND.criollo}0d` : 'rgba(255,255,255,.02)',
        transition: 'all 0.25s', transform: ceremonial ? 'scale(1.01)' : 'scale(1)',
        animation: ceremonial ? `cacao-glow 2s ease-in-out infinite` : 'none',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <p style={{ fontFamily: FONTS.display, fontSize: 12, fontWeight: 700,
              color: ceremonial ? BRAND.criollo : BRAND.heirloom, margin: '0 0 4px' }}>
              ✦ Upgrade Ceremonial Grade
            </p>
            <p style={{ fontFamily: FONTS.body, fontSize: 11, color: `${BRAND.heirloom}77`, margin: 0 }}>
              Cacao 100% Ceremonial CAUA · Finca Santa María · Hobo, Huila
            </p>
            <p style={{ fontFamily: FONTS.body, fontSize: 10, color: `${BRAND.heirloom}44`, margin: '3px 0 0' }}>
              +{fmtCOP(CEREMONIAL_EXTRA)}/persona
            </p>
          </div>
          <div style={{
            width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 2,
            border: `2px solid ${ceremonial ? BRAND.criollo : `${BRAND.heirloom}30`}`,
            background: ceremonial ? BRAND.criollo : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.25s',
          }}>
            {ceremonial && <span style={{ color: BRAND.bgDeep, fontSize: 13, fontWeight: 900, lineHeight: 1 }}>✓</span>}
          </div>
        </div>
      </div>

      {/* Tu Coti total */}
      <div style={{
        background: `linear-gradient(135deg, ${BRAND.amazon}22 0%, ${BRAND.pod}0d 100%)`,
        border: `1.5px solid ${BRAND.mazorca}44`,
        borderRadius: 12, padding: '20px 24px',
        animation: `cacao-glow 3s ease-in-out infinite`,
      }}>
        <p style={{ fontFamily: FONTS.body, fontSize: 9, color: `${BRAND.heirloom}55`,
          letterSpacing: '0.16em', textTransform: 'uppercase', margin: '0 0 14px' }}>Tu Coti</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          {[
            ['Participantes', `${participants} personas`],
            ['Por persona', fmtCOP(perPerson)],
            ['Experiencia', tiempos.label],
            ['Duración', tiempos.sublabel],
          ].map(([k, v]) => (
            <div key={k}>
              <p style={{ fontFamily: FONTS.body, fontSize: 9, color: `${BRAND.heirloom}44`,
                letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 2px' }}>{k}</p>
              <p style={{ fontFamily: FONTS.body, fontSize: 12, color: BRAND.heirloom, margin: 0, fontWeight: 600 }}>{v}</p>
            </div>
          ))}
        </div>
        <div style={{ borderTop: `1px solid ${BRAND.mazorca}22`, paddingTop: 14,
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <p style={{ fontFamily: FONTS.body, fontSize: 9, color: `${BRAND.heirloom}55`,
            letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0 }}>Total</p>
          <p style={{ fontFamily: FONTS.display, fontSize: 40, fontWeight: 900,
            color: BRAND.mazorca, margin: 0, lineHeight: 1 }}>{fmtCOP(total)}</p>
        </div>
      </div>

      {/* CTA */}
      {phase !== 'done' ? (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input required placeholder="Tu nombre" value={nombre} onChange={e => setNombre(e.target.value)}
            style={{ padding: '13px 16px', borderRadius: 10, fontSize: 13,
              border: `1px solid ${BRAND.heirloom}20`, background: 'rgba(255,255,255,.03)',
              color: BRAND.heirloom, fontFamily: FONTS.body, outline: 'none' }} />
          <input type="email" required placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)}
            style={{ padding: '13px 16px', borderRadius: 10, fontSize: 13,
              border: `1px solid ${BRAND.heirloom}20`, background: 'rgba(255,255,255,.03)',
              color: BRAND.heirloom, fontFamily: FONTS.body, outline: 'none' }} />
          <button type="submit" disabled={phase === 'sending'} style={{
            padding: '15px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: `linear-gradient(135deg, ${BRAND.mazorca} 0%, #D4940A 100%)`,
            color: BRAND.bgDeep, fontFamily: FONTS.display, fontSize: 14, fontWeight: 900,
            letterSpacing: '0.05em', transition: 'all 0.25s', transform: 'scale(1)',
          }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.02)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
            {phase === 'sending' ? '⏳ Enviando…' : phase === 'error' ? '↺ Reintentar' : '📩 Recibir Tu Coti por email'}
          </button>
          {phase === 'error' && (
            <p style={{ fontFamily: FONTS.body, fontSize: 11, color: BRAND.theobroma, margin: 0, textAlign: 'center' }}>
              Error al enviar. Escríbenos a amaury@cauacolombia.co
            </p>
          )}
        </form>
      ) : (
        <div style={{ background: `${BRAND.pod}12`, border: `1.5px solid ${BRAND.pod}44`,
          borderRadius: 12, padding: '20px', textAlign: 'center',
          animation: 'cacao-slide-up .6s ease both' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🫘</div>
          <p style={{ fontFamily: FONTS.display, fontSize: 15, fontWeight: 700,
            color: BRAND.pod, margin: '0 0 4px' }}>¡Coti enviada a {email}!</p>
          <p style={{ fontFamily: FONTS.body, fontSize: 12, color: `${BRAND.heirloom}66`, margin: 0 }}>
            Revisa tu bandeja · te respondemos en &lt;2h
          </p>
        </div>
      )}
    </div>
  )
}

// ── Página principal ─────────────────────────────────────────
export default function CauaCoti() {
  useEffect(() => {
    injectCSS()
    const setMeta = (prop: string, val: string) => {
      let el = document.querySelector(`meta[property="${prop}"]`) as HTMLMetaElement | null
      if (!el) { el = document.createElement('meta'); el.setAttribute('property', prop); document.head.appendChild(el) }
      el.setAttribute('content', val)
    }
    setMeta('og:title',       'Catación Cinco Tiempos de Cacao · CAUA')
    setMeta('og:description', 'Experiencia sensorial inmersiva guiada por Cacaotier. Desde $65.000/persona. Configura tu experiencia y recibe Tu Coti al instante.')
    setMeta('og:url',         `${window.location.origin}/catacion`)
    document.title = 'Catación Cinco Tiempos · CAUA'
    hsTrackEvent('Catación Page View', { timestamp: new Date().toISOString() })
    return () => { document.title = 'CAUA — Cacao Fruta Brutal' }
  }, [])

  return (
    <div style={{ background: BRAND.bgDeep, color: BRAND.heirloom, minHeight: '100vh' }}>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center', textAlign: 'center',
        overflow: 'hidden', padding: '120px 24px 80px' }}>

        {/* Orb background */}
        <Orb x="10%" y="15%" size={400} color={`${BRAND.pod}18`} delay={0} />
        <Orb x="65%" y="60%" size={500} color={`${BRAND.mazorca}12`} delay={800} />
        <Orb x="5%"  y="70%" size={300} color={`${BRAND.criollo}10`} delay={1600} />

        {/* Spinning ring */}
        <div style={{
          position: 'absolute', width: 560, height: 560,
          border: `1px solid ${BRAND.pod}18`, borderRadius: '50%',
          animation: 'cacao-spin-slow 40s linear infinite',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', width: 380, height: 380,
          border: `1px solid ${BRAND.mazorca}14`, borderRadius: '50%',
          animation: 'cacao-spin-slow 25s linear infinite reverse',
          pointerEvents: 'none',
        }} />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 760 }}>
          <div style={{ animation: 'cacao-slide-up .7s cubic-bezier(.16,1,.3,1) .1s both',
            fontFamily: FONTS.body, fontSize: 11, letterSpacing: '0.3em',
            color: `${BRAND.pod}bb`, textTransform: 'uppercase', marginBottom: 24 }}>
            CAUA Colombia SAS · Biotecnología Ancestral
          </div>

          <h1 style={{
            animation: 'cacao-slide-up .8s cubic-bezier(.16,1,.3,1) .2s both',
            fontFamily: `'Acumin Pro','Source Sans 3','Barlow Condensed',Impact,sans-serif`,
            fontSize: 'clamp(52px, 12vw, 110px)', fontWeight: 900, lineHeight: .88,
            letterSpacing: '-0.03em', color: BRAND.heirloom, margin: '0 0 24px',
          }}>
            CATACIÓN:<br />
            <span style={{ color: BRAND.pod }}>CINCO</span>{' '}
            <span style={{ color: BRAND.mazorca }}>TIEMPOS</span><br />
            DE CACAO
          </h1>

          <p style={{ animation: 'cacao-slide-up .8s cubic-bezier(.16,1,.3,1) .35s both',
            fontFamily: FONTS.serif, fontStyle: 'italic', fontSize: 'clamp(14px,2.5vw,20px)',
            color: `${BRAND.heirloom}88`, margin: '0 auto 40px', maxWidth: 520, lineHeight: 1.6 }}>
            Experiencia Sensorial Inmersiva · Guiada por Cacaotier
          </p>

          {/* Animated stats */}
          <div style={{ animation: 'cacao-slide-up .8s cubic-bezier(.16,1,.3,1) .5s both',
            display: 'flex', gap: 0, justifyContent: 'center', flexWrap: 'wrap',
            border: `1px solid ${BRAND.amazon}44`, overflow: 'hidden', marginBottom: 44 }}>
            {[
              { label: 'Desde', val: 65000, prefix: '$', suffix: '' },
              { label: 'Participantes', val: 50, prefix: 'hasta ', suffix: '+' },
              { label: 'Tiempos', val: 5, prefix: '', suffix: '' },
              { label: 'Horas', val: 3, prefix: 'hasta ', suffix: 'h' },
            ].map((s, i) => (
              <div key={i} style={{ padding: '18px 28px', borderRight: `1px solid ${BRAND.amazon}33`,
                textAlign: 'center', minWidth: 120 }}>
                <div style={{ fontFamily: FONTS.display, fontSize: 28, fontWeight: 700,
                  color: BRAND.mazorca, fontStyle: 'italic' }}>
                  <AnimNum target={s.val} prefix={s.prefix} suffix={s.suffix} />
                </div>
                <div style={{ fontFamily: FONTS.body, fontSize: 9, color: `${BRAND.heirloom}55`,
                  letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ animation: 'cacao-slide-up .8s cubic-bezier(.16,1,.3,1) .65s both',
            display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="#cotizador" style={{
              padding: '16px 36px', borderRadius: 999, background: BRAND.mazorca,
              color: BRAND.bgDeep, fontFamily: FONTS.display, fontSize: 14, fontWeight: 900,
              textDecoration: 'none', letterSpacing: '0.06em', transition: 'all .25s',
            }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
              Cotizar ahora ↓
            </a>
            <a href="https://wa.me/573102227848?text=Hola+Amaury+quiero+cotizar+una+Catación+Cinco+Tiempos"
              target="_blank" rel="noopener noreferrer" style={{
                padding: '16px 28px', borderRadius: 999, border: `1.5px solid #25D36688`,
                color: '#25D366', fontFamily: FONTS.display, fontSize: 13, fontWeight: 700,
                textDecoration: 'none', transition: 'all .25s', display: 'flex', alignItems: 'center', gap: 8,
              }}>
              💬 WhatsApp directo
            </a>
          </div>
        </div>

        {/* Scroll hint */}
        <div style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          animation: 'cacao-float 2s ease-in-out infinite', opacity: .4 }}>
          <div style={{ width: 1, height: 40, background: `linear-gradient(to bottom, transparent, ${BRAND.pod})` }} />
          <div style={{ fontFamily: FONTS.body, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: BRAND.pod }}>scroll</div>
        </div>
      </div>

      {/* ── TICKER ────────────────────────────────────────────── */}
      <div style={{ borderTop: `1px solid ${BRAND.amazon}33`, borderBottom: `1px solid ${BRAND.amazon}33`,
        overflow: 'hidden', padding: '10px 0', background: `${BRAND.amazon}08` }}>
        <div style={{ display: 'flex', animation: 'cacao-ticker 18s linear infinite', whiteSpace: 'nowrap' }}>
          {[...Array(2)].map((_, ri) => (
            <span key={ri} style={{ display: 'inline-flex', gap: 0 }}>
              {['🫘 MucilageExtract™', '🌱 Hobo · Huila', '✨ Epicatequina 8×', '🍫 100% Licor Criollo',
                '🌍 Origen Regenerativo', '☕ Ritual Ancestral', '🌳 Triple Impacto'].map(t => (
                <span key={t} style={{ fontFamily: FONTS.body, fontSize: 10, letterSpacing: '0.16em',
                  color: `${BRAND.pod}88`, textTransform: 'uppercase', padding: '0 32px' }}>{t}</span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ── LOS 5 TIEMPOS ─────────────────────────────────────── */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '96px 32px' }}>
        <Reveal delay={0}>
          <p style={{ fontFamily: FONTS.body, fontSize: 10, letterSpacing: '0.3em',
            color: `${BRAND.pod}99`, textTransform: 'uppercase', marginBottom: 12 }}>
            El recorrido
          </p>
          <h2 style={{ fontFamily: FONTS.display, fontSize: 'clamp(32px,6vw,56px)', fontWeight: 900,
            color: BRAND.heirloom, margin: '0 0 64px', letterSpacing: '-0.02em' }}>
            Cinco tiempos.<br />
            <span style={{ color: BRAND.pod }}>Una cadena completa.</span>
          </h2>
        </Reveal>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {CINCO_TIEMPOS.map((t, i) => (
            <Reveal key={t.num} delay={i * 80} from={i % 2 === 0 ? 'left' : 'right'}>
              <div style={{
                border: `1px solid ${t.color}22`,
                borderRadius: 16, padding: '24px', position: 'relative', overflow: 'hidden',
                background: `linear-gradient(135deg, ${t.color}08 0%, transparent 60%)`,
                transition: 'transform .25s, border-color .25s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.borderColor = `${t.color}55` }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.borderColor = `${t.color}22` }}>
                <div style={{ position: 'absolute', top: -20, right: -20, fontSize: 80, opacity: .07 }}>{t.icon}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%',
                    background: `linear-gradient(135deg, ${t.color} 0%, ${t.color}88 100%)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: FONTS.display, fontWeight: 900, fontSize: 15,
                    color: BRAND.bgDeep, flexShrink: 0 }}>{t.num}</div>
                  <p style={{ fontFamily: FONTS.display, fontSize: 13, fontWeight: 700,
                    color: t.color, margin: 0, letterSpacing: '0.02em' }}>{t.icon} {t.title}</p>
                </div>
                <p style={{ fontFamily: FONTS.body, fontSize: 12, color: `${BRAND.heirloom}77`,
                  margin: 0, lineHeight: 1.65 }}>{t.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* ── COTIZADOR ─────────────────────────────────────────── */}
      <div id="cotizador" style={{ background: `linear-gradient(180deg, transparent 0%, ${BRAND.amazon}18 100%)`,
        borderTop: `1px solid ${BRAND.amazon}33` }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '80px 32px',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 64, alignItems: 'start' }}>

          {/* Left info */}
          <Reveal delay={0} from="left">
            <div style={{ position: 'sticky', top: 100 }}>
              <p style={{ fontFamily: FONTS.body, fontSize: 10, letterSpacing: '0.3em',
                color: `${BRAND.pod}99`, textTransform: 'uppercase', marginBottom: 12 }}>Cotizador</p>
              <h2 style={{ fontFamily: FONTS.display, fontSize: 'clamp(28px,5vw,44px)', fontWeight: 900,
                color: BRAND.heirloom, margin: '0 0 20px', letterSpacing: '-0.02em' }}>
                Configura tu<br /><span style={{ color: BRAND.mazorca }}>experiencia.</span>
              </h2>
              <p style={{ fontFamily: FONTS.body, fontSize: 13, color: `${BRAND.heirloom}77`,
                lineHeight: 1.75, margin: '0 0 32px' }}>
                Amaury Amed — Cacaotier &amp; CTO CAUA — guía cada recorrido desde el árbol vivo hasta la preparación ceremonial. Disponible para corporativos, hoteles, eventos y comunidades.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { icon: '🏢', text: 'Ideal para Team Building corporativo' },
                  { icon: '🏨', text: 'HoReCa · Hoteles boutique · Restaurantes premium' },
                  { icon: '🎓', text: 'Educación sensorial · Colegios · Universidades' },
                  { icon: '🎪', text: 'Eventos culturales · Festivales · Pop-ups' },
                ].map(({ icon, text }) => (
                  <div key={text} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontSize: 18 }}>{icon}</span>
                    <p style={{ fontFamily: FONTS.body, fontSize: 12, color: `${BRAND.heirloom}88`,
                      margin: 0 }}>{text}</p>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 32, padding: '16px 20px',
                background: `${BRAND.pod}0d`, border: `1px solid ${BRAND.pod}22`, borderRadius: 12 }}>
                <p style={{ fontFamily: FONTS.body, fontSize: 10, letterSpacing: '0.12em',
                  textTransform: 'uppercase', color: `${BRAND.pod}99`, margin: '0 0 8px' }}>Contacto directo</p>
                <p style={{ fontFamily: FONTS.body, fontSize: 12, color: `${BRAND.heirloom}88`, margin: 0, lineHeight: 1.7 }}>
                  📱 +57 310 222 7848<br />
                  📧 amaury@cauacolombia.co<br />
                  <span style={{ color: `${BRAND.heirloom}44` }}>Respuesta en {'<'} 2 horas</span>
                </p>
              </div>
            </div>
          </Reveal>

          {/* Calculator */}
          <Reveal delay={100} from="right">
            <div style={{ background: `${BRAND.amazon}18`, border: `1px solid ${BRAND.amazon}44`,
              borderRadius: 20, padding: '32px 28px' }}>
              <PriceCalculator />
            </div>
          </Reveal>
        </div>
      </div>

      {/* ── FOOTER ────────────────────────────────────────────── */}
      <footer style={{ background: `linear-gradient(135deg, ${BRAND.amazon} 0%, #0a1410 100%)`,
        borderTop: `1px solid ${BRAND.pod}22`, padding: '32px 40px', textAlign: 'center',
        fontSize: 11, lineHeight: 1.7, color: `${BRAND.heirloom}88` }}>
        <strong style={{ display: 'block', marginBottom: 6, color: BRAND.heirloom, fontSize: 13, fontFamily: FONTS.display }}>
          CAUA COLOMBIA SAS · NIT 901213846-7
        </strong>
        <div>📧 amaury@cauacolombia.co · 📱 +57 310 222 7848 · 🌐 cacaofrutabrutal.com</div>
        <div style={{ marginTop: 8, opacity: 0.5 }}>Pago contraentrega · Factura Electrónica · Válida 30 días</div>
      </footer>
    </div>
  )
}
