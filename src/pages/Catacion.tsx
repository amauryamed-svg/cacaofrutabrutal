import React, { useState, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import CauaButton from '../components/ui/CauaButton'
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
    num: '01',
    title: 'Árbol al Fruto',
    desc: 'Mazorca fresca recién cosechada. Conoce el ciclo natural de la reproducción del Theobroma cacao en ecosistemas regenerativos de Arauca.',
    color: BRAND.pod,
    icon: '🌱',
  },
  {
    num: '02',
    title: 'Origen Regenerativo',
    desc: 'Cacao liofilizado desde Arauca, Tame. Sabor puro de la fuente, sin procesamiento que altere el origen. Trazabilidad total del agricultor.',
    color: BRAND.mazorca,
    icon: '🌍',
  },
  {
    num: '03',
    title: 'Valor Agregado',
    desc: 'Mucílago liofilizado y nibs tostados. Transformación artesanal que multiplica el valor del cultivo mientras preserva sabores ancestrales.',
    color: BRAND.theobroma,
    icon: '⚗️',
  },
  {
    num: '04',
    title: 'Refinación Artesanal',
    desc: 'Hobo Huila · Finca Santa María · Cacao 100% Licor · 250gr. Barra artesanal que cierra el círculo regenerativo.',
    color: BRAND.criollo,
    icon: '🫘',
  },
  {
    num: '05',
    title: 'Ancestral & Moderno',
    desc: 'Sunrise Shot cold brew. La fusión de técnicas prehispánicas con métodos contemporáneos. Cacao líquido, servido a temperatura ritual.',
    color: BRAND.mazorca,
    icon: '☕',
  },
]

const TRIPLE_IMPACTO = [
  {
    title: 'Comunidad',
    desc: 'Desarrollo económico en Arauca, Santander, Cundinamarca y Meta. Empoderamiento de agricultores y sus familias.',
    color: BRAND.amazon,
    icon: '👥',
  },
  {
    title: 'Agricultor',
    desc: 'Multiplicador de ingresos sostenibles. Acceso directo a mercados premium sin intermediarios extractivos.',
    color: BRAND.mazorca,
    icon: '🌾',
  },
  {
    title: 'Ecosistema',
    desc: 'Agroforestería regenerativa. Captura de carbono, biodiversidad y resiliencia climática integrada en cada cultivo.',
    color: BRAND.theobroma,
    icon: '🌳',
  },
]

// ============================================================================
// COMPONENTE PRINCIPAL: Catacion
// ============================================================================
export default function Catacion() {
  const { email } = useAuth()
  const [heroVisible, setHeroVisible] = useState(false)

  // FORM STATE
  const [formData, setFormData] = useState({ name: '', email: '' })
  const [formPhase, setFormPhase] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const [formError, setFormError] = useState('')

  // PDF STATE
  const [pdfLoading, setPdfLoading] = useState(false)

  // Hero fade-in (como en Landing.tsx)
  useEffect(() => {
    const timer = setTimeout(() => setHeroVisible(true), 50)
    return () => clearTimeout(timer)
  }, [])

  // ========================================================================
  // MANEJADOR: Envío de formulario (Magic Link + CRM)
  // ========================================================================
  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormPhase('loading')
    setFormError('')

    try {
      // 1. UPSERT en catacion_leads (sin auth requerida)
      const { error: insertError } = await supabase
        .from('catacion_leads')
        .upsert(
          {
            email: formData.email,
            full_name: formData.name,
            status: 'magic_sent',
            source: 'catacion',
          },
          { onConflict: 'email' }
        )

      if (insertError) throw new Error(`DB insert failed: ${insertError.message}`)

      // 2. MAGIC LINK OTP — usuario logueado al clickear
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: formData.email,
        options: {
          data: { full_name: formData.name },
          emailRedirectTo: `${window.location.origin}/catacion`,
        },
      })

      if (otpError) throw new Error(`OTP failed: ${otpError.message}`)

      // 3. NOTIFICACIÓN A AMAURY (via Edge Function)
      // No bloquea el flujo si falla
      try {
        await supabase.functions.invoke('notify-catacion-lead', {
          body: { full_name: formData.name, email: formData.email, status: 'magic_sent' },
        })
      } catch (notifyErr) {
        console.warn('Notification failed (non-blocking):', notifyErr)
      }

      setFormPhase('sent')
      setFormData({ name: '', email: '' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setFormError(message)
      setFormPhase('error')
      console.error('Form submission error:', err)
    }
  }

  // ========================================================================
  // MANEJADOR: Descarga de PDF (window.print)
  // ========================================================================
  function handleDownloadPDF() {
    setPdfLoading(true)
    const printWindow = window.open('/cinco-tiempos', '_blank')
    if (printWindow) {
      printWindow.addEventListener('load', () => {
        printWindow.print()
        setPdfLoading(false)
      })
    }
    // Fallback timeout
    setTimeout(() => setPdfLoading(false), 3000)
  }

  return (
    <div
      style={{
        background: BRAND.bgDeep,
        color: BRAND.heirloom,
        minHeight: '100vh',
        overflow: 'hidden',
      }}
    >
      {/* ====================================================================
          HERO SECTION
          ==================================================================== */}
      <section
        style={{
          minHeight: '100vh',
          background: BRAND.bgDeep,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          padding: 'clamp(80px,12vw,100px) max(24px, calc((100vw - 1200px) / 2))',
        }}
      >
        {/* Glow atmosférico */}
        <div
          style={{
            position: 'absolute',
            top: '30%',
            left: '50%',
            transform: 'translate(-50%,-50%)',
            width: 800,
            height: 800,
            background: `radial-gradient(ellipse, ${BRAND.mazorca}08 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />

        {/* SVG Partículas flotantes */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: 0.08,
          }}
          viewBox="0 0 1000 800"
          aria-hidden="true"
        >
          {/* 20 círculos animados */}
          {[...Array(20)].map((_, i) => (
            <circle
              key={`circle-${i}`}
              cx={100 + (i * 47) % 800}
              cy={60 + (i * 73) % 700}
              r={2 + (i % 4)}
              fill={i % 3 === 0 ? BRAND.mazorca : BRAND.pod}
              opacity={0.5}
            >
              <animate
                attributeName="cy"
                values={`${60 + (i * 73) % 700};${100 + (i * 73) % 700};${60 + (i * 73) % 700}`}
                dur={`${4 + (i % 4)}s`}
                repeatCount="indefinite"
              />
            </circle>
          ))}

          {/* 5 mazorca-shapes SVG */}
          {[
            [150, 200],
            [850, 120],
            [900, 550],
            [100, 600],
            [500, 680],
          ].map(([x, y], i) => (
            <ellipse
              key={`pod-${i}`}
              cx={x}
              cy={y}
              rx={22}
              ry={35}
              fill="none"
              stroke={BRAND.pod}
              strokeWidth="1"
              opacity={0.4}
              transform={`rotate(${-20 + i * 15} ${x} ${y})`}
            >
              <animate
                attributeName="opacity"
                values="0.3;0.6;0.3"
                dur={`${6 + i}s`}
                repeatCount="indefinite"
              />
            </ellipse>
          ))}
        </svg>

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 800 }}>
          {/* Eyebrow */}
          <p
            style={{
              color: BRAND.mazorca,
              fontFamily: FONTS.display,
              fontSize: 'clamp(11px,1.2vw,13px)',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              marginBottom: '1.5rem',
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? 'none' : 'translateY(10px)',
              transition: 'opacity 0.8s ease 0.2s, transform 0.8s ease 0.2s',
            }}
          >
            Turismo Regenerativo × Cacao de Origen
          </p>

          {/* Título principal */}
          <h1
            style={{
              fontFamily: FONTS.display,
              fontSize: 'clamp(52px,10vw,120px)',
              fontWeight: 900,
              textTransform: 'uppercase',
              color: BRAND.heirloom,
              lineHeight: 0.9,
              letterSpacing: '-0.02em',
              margin: '0 0 1.5rem',
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 0.9s ease 0.3s, transform 0.9s ease 0.3s',
            }}
          >
            CATACIÓN
            <br />
            <span style={{ color: BRAND.pod }}>CAÚA</span>
          </h1>

          {/* Subtítulo */}
          <p
            style={{
              fontFamily: FONTS.serif,
              fontSize: 'clamp(18px,2.5vw,28px)',
              color: `${BRAND.heirloom}99`,
              lineHeight: 1.5,
              margin: '0 0 2.5rem',
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? 'none' : 'translateY(10px)',
              transition: 'opacity 0.9s ease 0.5s, transform 0.9s ease 0.5s',
            }}
          >
            Una jornada sensorial a través de los cinco tiempos del cacao regenerativo.
            Del árbol ancestral a la barra artesanal.
          </p>

          {/* CTA Scroll */}
          <button
            onClick={() => {
              document
                .getElementById('journey-section')
                ?.scrollIntoView({ behavior: 'smooth' })
            }}
            style={{
              background: 'none',
              border: `2px solid ${BRAND.pod}`,
              color: BRAND.pod,
              padding: '12px 28px',
              fontFamily: FONTS.display,
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              cursor: 'pointer',
              borderRadius: 8,
              letterSpacing: '0.1em',
              transition: 'all 0.3s ease',
              opacity: heroVisible ? 1 : 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = BRAND.pod
              e.currentTarget.style.color = BRAND.bgDeep
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none'
              e.currentTarget.style.color = BRAND.pod
            }}
          >
            DESCUBRIR LA EXPERIENCIA ↓
          </button>
        </div>
      </section>

      {/* ====================================================================
          JOURNEY SECTION — Cinco Tiempos
          ==================================================================== */}
      <section
        id="journey-section"
        style={{
          padding: 'clamp(80px,12vw,120px) max(24px, calc((100vw - 1200px) / 2))',
          background: BRAND.bgDeep,
          maxWidth: 1200,
          margin: '0 auto',
        }}
      >
        <RevealSection>
          <h2
            style={{
              fontFamily: FONTS.display,
              fontSize: 'clamp(36px,7vw,72px)',
              fontWeight: 900,
              textTransform: 'uppercase',
              color: BRAND.heirloom,
              marginBottom: '3rem',
              lineHeight: 0.9,
            }}
          >
            Los Cinco
            <br />
            <span style={{ color: BRAND.pod }}>Tiempos</span>
          </h2>
        </RevealSection>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
            marginTop: '3rem',
          }}
        >
          {CINCO_TIEMPOS.map((tiempo, idx) => (
            <RevealSection key={tiempo.num} delay={idx * 100}>
              <div
                style={{
                  padding: '2rem',
                  borderLeft: `4px solid ${tiempo.color}`,
                  background: `${tiempo.color}08`,
                  borderRadius: 12,
                  transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
                  cursor: 'pointer',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)'
                  e.currentTarget.style.borderLeftColor = BRAND.heirloom
                  e.currentTarget.style.boxShadow = `0 20px 40px rgba(0,0,0,0.3)`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)'
                  e.currentTarget.style.borderLeftColor = tiempo.color
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '0.5rem',
                    marginBottom: '0.5rem',
                  }}
                >
                  <span style={{ fontSize: '2rem' }}>{tiempo.icon}</span>
                  <span
                    style={{
                      fontFamily: FONTS.display,
                      fontSize: '2.5rem',
                      fontWeight: 900,
                      color: tiempo.color,
                    }}
                  >
                    {tiempo.num}
                  </span>
                </div>
                <h3
                  style={{
                    fontFamily: FONTS.display,
                    fontSize: '1.3rem',
                    fontWeight: 700,
                    color: BRAND.heirloom,
                    margin: '0.5rem 0 1rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {tiempo.title}
                </h3>
                <p
                  style={{
                    fontSize: '0.95rem',
                    lineHeight: 1.6,
                    color: `${BRAND.heirloom}dd`,
                    margin: 0,
                  }}
                >
                  {tiempo.desc}
                </p>
              </div>
            </RevealSection>
          ))}
        </div>
      </section>

      {/* ====================================================================
          TRIPLE IMPACTO SECTION
          ==================================================================== */}
      <section
        style={{
          padding: 'clamp(80px,12vw,120px) max(24px, calc((100vw - 1200px) / 2))',
          background: `${BRAND.amazon}0a`,
          borderTop: `1px solid ${BRAND.amazon}44`,
          borderBottom: `1px solid ${BRAND.amazon}44`,
        }}
      >
        <RevealSection>
          <h2
            style={{
              fontFamily: FONTS.display,
              fontSize: 'clamp(36px,7vw,72px)',
              fontWeight: 900,
              textTransform: 'uppercase',
              color: BRAND.heirloom,
              marginBottom: '3rem',
              lineHeight: 0.9,
            }}
          >
            Triple
            <br />
            <span style={{ color: BRAND.mazorca }}>Impacto</span>
          </h2>
        </RevealSection>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '2rem',
            marginTop: '2rem',
          }}
        >
          {TRIPLE_IMPACTO.map((impacto, idx) => (
            <RevealSection key={impacto.title} delay={idx * 150}>
              <div
                style={{
                  padding: '2rem',
                  borderTop: `3px solid ${impacto.color}`,
                  background: `${impacto.color}08`,
                  borderRadius: 12,
                  textAlign: 'center',
                }}
              >
                <p style={{ fontSize: '2.5rem', margin: '0 0 1rem' }}>{impacto.icon}</p>
                <h3
                  style={{
                    fontFamily: FONTS.display,
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    color: impacto.color,
                    margin: '0 0 1rem',
                    textTransform: 'uppercase',
                  }}
                >
                  {impacto.title}
                </h3>
                <p
                  style={{
                    fontSize: '0.95rem',
                    lineHeight: 1.6,
                    color: `${BRAND.heirloom}dd`,
                    margin: 0,
                  }}
                >
                  {impacto.desc}
                </p>
              </div>
            </RevealSection>
          ))}
        </div>
      </section>

      {/* ====================================================================
          INVERSIÓN SECTION
          ==================================================================== */}
      <section
        style={{
          padding: 'clamp(80px,12vw,120px) max(24px, calc((100vw - 1200px) / 2))',
          background: BRAND.bgDeep,
        }}
      >
        <RevealSection>
          <h2
            style={{
              fontFamily: FONTS.display,
              fontSize: 'clamp(36px,7vw,72px)',
              fontWeight: 900,
              textTransform: 'uppercase',
              color: BRAND.heirloom,
              marginBottom: '3rem',
              lineHeight: 0.9,
            }}
          >
            Inversión
          </h2>
        </RevealSection>

        <PricingCards />
      </section>

      {/* ====================================================================
          FORM SECTION
          ==================================================================== */}
      <section
        style={{
          padding: 'clamp(80px,12vw,120px) max(24px, calc((100vw - 1200px) / 2))',
          background: `${BRAND.amazon}0a`,
          borderTop: `1px solid ${BRAND.amazon}44`,
        }}
      >
        <RevealSection>
          <h2
            style={{
              fontFamily: FONTS.display,
              fontSize: 'clamp(36px,7vw,72px)',
              fontWeight: 900,
              textTransform: 'uppercase',
              color: BRAND.heirloom,
              marginBottom: '3rem',
              lineHeight: 0.9,
            }}
          >
            Solicita tu
            <br />
            <span style={{ color: BRAND.pod }}>Cotización</span>
          </h2>
        </RevealSection>

        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          {formPhase === 'sent' ? (
            <div
              style={{
                textAlign: 'center',
                padding: '3rem 2rem',
                background: `${BRAND.pod}10`,
                border: `1px solid ${BRAND.pod}44`,
                borderRadius: 16,
              }}
            >
              <p style={{ fontSize: '3rem', margin: '0 0 1rem' }}>✓</p>
              <h3
                style={{
                  fontFamily: FONTS.serif,
                  fontSize: 'clamp(20px,4vw,28px)',
                  color: BRAND.pod,
                  margin: '0 0 1rem',
                }}
              >
                Revisa tu bandeja
              </h3>
              <p
                style={{
                  color: `${BRAND.heirloom}88`,
                  fontSize: '0.95rem',
                  margin: '0 0 1.5rem',
                }}
              >
                Te enviamos un link mágico a{' '}
                <strong style={{ color: BRAND.mazorca }}>{formData.email}</strong>
              </p>
              <p
                style={{
                  color: `${BRAND.heirloom}66`,
                  fontSize: '0.85rem',
                  margin: 0,
                }}
              >
                Al hacer clic en el link, tu sesión se activará automáticamente en la
                plataforma.
              </p>
            </div>
          ) : (
            <form onSubmit={handleFormSubmit}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontFamily: FONTS.body,
                    fontSize: '0.85rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: BRAND.mazorca,
                  }}
                >
                  Tu nombre
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Amaury Amed"
                  required
                  style={{
                    width: '100%',
                    background: `${BRAND.bgCard}cc`,
                    border: `1px solid ${BRAND.amazon}66`,
                    borderRadius: 8,
                    color: BRAND.heirloom,
                    fontFamily: FONTS.body,
                    fontSize: '1rem',
                    padding: '14px 16px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    WebkitAppearance: 'none',
                    appearance: 'none',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = BRAND.pod
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = `${BRAND.amazon}66`
                  }}
                />
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontFamily: FONTS.body,
                    fontSize: '0.85rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: BRAND.mazorca,
                  }}
                >
                  Tu email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="tu@email.com"
                  required
                  style={{
                    width: '100%',
                    background: `${BRAND.bgCard}cc`,
                    border: `1px solid ${BRAND.amazon}66`,
                    borderRadius: 8,
                    color: BRAND.heirloom,
                    fontFamily: FONTS.body,
                    fontSize: '1rem',
                    padding: '14px 16px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    WebkitAppearance: 'none',
                    appearance: 'none',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = BRAND.pod
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = `${BRAND.amazon}66`
                  }}
                />
              </div>

              {formError && (
                <p
                  style={{
                    color: BRAND.theobroma,
                    fontSize: '0.85rem',
                    marginBottom: '1rem',
                  }}
                >
                  ⚠️ {formError}
                </p>
              )}

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <CauaButton
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={formPhase === 'loading'}
                  style={{
                    flex: 1,
                    minWidth: 200,
                    opacity: formPhase === 'loading' ? 0.7 : 1,
                  }}
                >
                  {formPhase === 'loading' ? '⏳ ENVIANDO...' : '✓ QUIERO MI COTIZACIÓN'}
                </CauaButton>

                <CauaButton
                  type="button"
                  variant="secondary"
                  size="lg"
                  onClick={handleDownloadPDF}
                  disabled={pdfLoading}
                  style={{
                    flex: 1,
                    minWidth: 200,
                    borderColor: BRAND.mazorca,
                    color: BRAND.mazorca,
                    opacity: pdfLoading ? 0.7 : 1,
                  }}
                >
                  {pdfLoading ? '⏳ GENERANDO...' : '⬇ DESCARGAR PDF'}
                </CauaButton>
              </div>

              {email && (
                <p
                  style={{
                    marginTop: '1rem',
                    fontSize: '0.85rem',
                    color: `${BRAND.pod}dd`,
                    textAlign: 'center',
                  }}
                >
                  ✓ Ya estás autenticado como {email}
                </p>
              )}
            </form>
          )}
        </div>
      </section>

      {/* ====================================================================
          FOOTER
          ==================================================================== */}
      <footer
        style={{
          padding: 'clamp(60px,8vw,80px) max(24px, calc((100vw - 1200px) / 2))',
          background: BRAND.bgDeep,
          borderTop: `1px solid ${BRAND.amazon}44`,
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontFamily: FONTS.serif,
            fontSize: '1.2rem',
            color: BRAND.mazorca,
            margin: '0 0 0.5rem',
          }}
        >
          Del árbol a la barra
        </p>
        <p
          style={{
            color: `${BRAND.heirloom}66`,
            fontSize: '0.85rem',
            margin: 0,
          }}
        >
          © 2026 Caúa · Turismo Regenerativo × Cacao de Origen
        </p>
      </footer>
    </div>
  )
}

// ============================================================================
// COMPONENTE: PricingCards
// ============================================================================
function PricingCards() {
  const [hoveredCard, setHoveredCard] = useState<null | 'base' | 'premium'>(null)

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '2rem',
      }}
    >
      {/* Base Card */}
      <RevealSection>
        <div
          style={{
            padding: '2rem',
            border: `2px solid ${BRAND.pod}${hoveredCard === 'base' ? 'ff' : '66'}`,
            background: `${BRAND.pod}08`,
            borderRadius: 12,
            transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
            transform: hoveredCard === 'base' ? 'translateY(-8px) scale(1.02)' : 'none',
          }}
          onMouseEnter={() => setHoveredCard('base')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <h3
            style={{
              fontFamily: FONTS.display,
              fontSize: '1.1rem',
              fontWeight: 700,
              color: BRAND.heirloom,
              margin: '0 0 1rem',
              textTransform: 'uppercase',
            }}
          >
            Experiencia Base
          </h3>
          <p
            style={{
              fontFamily: FONTS.display,
              fontSize: '2.5rem',
              fontWeight: 900,
              color: BRAND.pod,
              margin: '0 0 1.5rem',
            }}
          >
            $60.000
          </p>
          <ul
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              fontSize: '0.95rem',
              lineHeight: 1.8,
              color: `${BRAND.heirloom}dd`,
            }}
          >
            <li>✓ 5 Tiempos de Cacao</li>
            <li>✓ Catas guiadas</li>
            <li>✓ Narrativa regenerativa</li>
            <li>✓ Implementos incluidos</li>
          </ul>
        </div>
      </RevealSection>

      {/* Premium Card */}
      <RevealSection delay={150}>
        <div
          style={{
            padding: '2rem',
            border: `2px solid ${BRAND.criollo}${hoveredCard === 'premium' ? 'ff' : '66'}`,
            background: `${BRAND.criollo}08`,
            borderRadius: 12,
            transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
            transform: hoveredCard === 'premium' ? 'translateY(-8px) scale(1.02)' : 'none',
          }}
          onMouseEnter={() => setHoveredCard('premium')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div
            style={{
              display: 'inline-block',
              background: BRAND.criollo,
              color: BRAND.bgDeep,
              padding: '4px 12px',
              borderRadius: 999,
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              marginBottom: '1rem',
            }}
          >
            DESTACADO
          </div>
          <h3
            style={{
              fontFamily: FONTS.display,
              fontSize: '1.1rem',
              fontWeight: 700,
              color: BRAND.heirloom,
              margin: '0 0 1rem',
              textTransform: 'uppercase',
            }}
          >
            Premium + Barra
          </h3>
          <p
            style={{
              fontFamily: FONTS.display,
              fontSize: '2.5rem',
              fontWeight: 900,
              color: BRAND.criollo,
              margin: '0 0 1.5rem',
            }}
          >
            $100.000
          </p>
          <ul
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              fontSize: '0.95rem',
              lineHeight: 1.8,
              color: `${BRAND.heirloom}dd`,
            }}
          >
            <li>✓ Todo experiencia Base</li>
            <li>
              <strong style={{ color: BRAND.criollo }}>+ Barra 250g Hobo Huila</strong>
            </li>
            <li>
              <strong style={{ color: BRAND.criollo }}>+ Cacao 100% Licor Artesanal</strong>
            </li>
            <li>✓ Para llevar y recordar</li>
          </ul>
        </div>
      </RevealSection>
    </div>
  )
}
