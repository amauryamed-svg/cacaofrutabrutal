import React, { useState, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { hsTrackEvent } from '../lib/hubspotTracking'
import { BRAND, FONTS } from '../utils/constants'

const ALLOWED_EMAIL = 'andrea.rojas@cesa.edu.co'

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
    desc: 'Mazorca fresca recién cosechada. Ciclo natural del Theobroma cacao en ecosistemas regenerativos de Arauca.',
    icon: '🌱',
    color: BRAND.pod,
  },
  {
    num: '2',
    title: 'Origen Regenerativo',
    desc: 'Cacao liofilizado desde Arauca. Sabor puro sin procesamiento. Trazabilidad total del agricultor.',
    icon: '🌍',
    color: BRAND.mazorca,
  },
  {
    num: '3',
    title: 'Mucílago: Oro Molecular',
    desc: 'Cata de mucílago de cacao granizado. Beneficio antioxidante reutilizable como superalimento molecular. Ancestral & moderno en una cuchara.',
    icon: '✨',
    color: BRAND.theobroma,
  },
  {
    num: '4',
    title: 'Refinación Artesanal',
    desc: 'Hobo Huila · Finca Santa María · 100% Licor · 250gr. Barra artesanal que cierra el círculo regenerativo.',
    icon: '🫘',
    color: BRAND.criollo,
  },
  {
    num: '5',
    title: 'Chocolate Ritual',
    desc: 'Preparación ancestral: chocolate caliente con agua ritualizada, gelatina de pata estilo prehispánico o panela. Servido en ceremonial.',
    icon: '☕',
    color: BRAND.muisca,
  },
  {
    num: '6',
    title: 'Impacto Regenerativo',
    desc: 'Narrativa del triple impacto: comunidad, agricultor, ecosistema. Cierre circular de la experiencia inmersiva.',
    icon: '🌳',
    color: BRAND.leafy,
  },
]

// ============================================================================
// COMPONENTE PRINCIPAL: ProposalAndreaRojas
// ============================================================================
export default function ProposalAndreaRojas() {
  const navigate = useNavigate()
  const { email, loading } = useAuth()

  const [formPhase, setFormPhase] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const [formError, setFormError] = useState('')
  const [heroVisible, setHeroVisible] = useState(false)

  // Guard: solo andrea.rojas@cesa.edu.co puede ver Phase C
  useEffect(() => {
    if (!loading && email && email !== ALLOWED_EMAIL) {
      navigate('/')
    }
  }, [email, loading, navigate])

  // Auto-register visit cuando Andrea abre la página autenticada
  useEffect(() => {
    if (!loading && email === ALLOWED_EMAIL) {
      (async () => {
        try {
          await supabase
            .from('cotizaciones_b2b')
            .update({
              status: 'vista',
              vista_en: new Date().toISOString(),
            })
            .eq('slug', 'andrea-rojas')

          // Track to Hubspot: B2B Catación viewed
          hsTrackEvent('B2B Catación Vista', {
            email: ALLOWED_EMAIL,
            timestamp: new Date().toISOString(),
          })
        } catch {
          // Silently fail — non-blocking
        }
      })()
    }
  }, [email, loading])

  // Hero fade-in
  useEffect(() => {
    const timer = setTimeout(() => setHeroVisible(true), 50)
    return () => clearTimeout(timer)
  }, [])

  // ========================================================================
  // MANEJADOR: Magic Link OTP
  // ========================================================================
  async function handleOtpRequest(e: React.FormEvent) {
    e.preventDefault()
    setFormPhase('loading')
    setFormError('')

    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: ALLOWED_EMAIL,
        options: {
          data: { full_name: 'Andrea Rojas' },
          emailRedirectTo: `${window.location.origin}/cotizacion/andrea-rojas`,
        },
      })

      if (otpError) throw new Error(`OTP failed: ${otpError.message}`)

      // Track to Hubspot: B2B Catación form submission
      hsTrackEvent('B2B Catación Solicitada', {
        email: ALLOWED_EMAIL,
        timestamp: new Date().toISOString(),
      })

      setFormPhase('sent')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setFormError(message)
      setFormPhase('error')
    }
  }

  // ========================================================================
  // PHASE A: PRE-AUTH (sin sesión)
  // ========================================================================
  if (!email && !loading) {
    return (
      <div
        style={{
          background: BRAND.bgDeep,
          color: BRAND.heirloom,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          paddingTop: 'calc(60px + 40px)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Glow */}
        <div
          style={{
            position: 'absolute',
            top: '30%',
            left: '50%',
            transform: 'translate(-50%,-50%)',
            width: 600,
            height: 600,
            background: `radial-gradient(ellipse, ${BRAND.mazorca}08 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />

        {/* Content */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            maxWidth: 500,
            textAlign: 'center',
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.8s ease, transform 0.8s ease',
          }}
        >
          {/* Logo placeholder */}
          <div
            style={{
              width: 80,
              height: 80,
              background: BRAND.heirloom,
              borderRadius: 8,
              margin: '0 auto 30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 48,
            }}
          >
            🫘
          </div>

          <h1
            style={{
              fontFamily: FONTS.serif,
              fontSize: 'clamp(24px, 6vw, 42px)',
              fontWeight: 700,
              marginBottom: 16,
              color: BRAND.heirloom,
            }}
          >
            Propuesta Exclusiva
          </h1>

          <p
            style={{
              fontFamily: FONTS.body,
              fontSize: 18,
              marginBottom: 24,
              color: BRAND.heirloom,
              opacity: 0.9,
            }}
          >
            Andrea Rojas
          </p>

          <p
            style={{
              fontFamily: FONTS.body,
              fontSize: 14,
              marginBottom: 32,
              color: BRAND.heirloom,
              opacity: 0.7,
              lineHeight: 1.6,
            }}
          >
            Accede a tu propuesta exclusiva de catación "Cinco Tiempos de Cacao" — Caúa.
          </p>

          {/* Form */}
          <form
            onSubmit={handleOtpRequest}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {/* Email (readonly) */}
            <input
              type="email"
              value={ALLOWED_EMAIL}
              disabled
              style={{
                padding: '12px 16px',
                borderRadius: 8,
                border: `1px solid ${BRAND.mazorca}40`,
                background: `${BRAND.amazon}20`,
                color: BRAND.heirloom,
                fontFamily: FONTS.body,
                fontSize: 14,
                cursor: 'not-allowed',
                opacity: 0.6,
              }}
            />

            {/* CTA Button */}
            <button
              type="submit"
              disabled={formPhase === 'loading' || formPhase === 'sent'}
              style={{
                padding: '12px 24px',
                borderRadius: 8,
                border: 'none',
                background: BRAND.mazorca,
                color: BRAND.amazon,
                fontFamily: FONTS.display,
                fontSize: 16,
                fontWeight: 700,
                cursor: formPhase === 'loading' ? 'wait' : 'pointer',
                transition: 'all 0.3s ease',
                opacity: formPhase === 'loading' ? 0.8 : 1,
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                const el = e.currentTarget
                if (formPhase !== 'loading' && formPhase !== 'sent') {
                  el.style.transform = 'scale(1.02)'
                }
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                const el = e.currentTarget
                el.style.transform = 'scale(1)'
              }}
            >
              {formPhase === 'idle' && 'Acceder a mi propuesta'}
              {formPhase === 'loading' && 'Enviando enlace...'}
              {formPhase === 'sent' && '✓ Enlace enviado'}
              {formPhase === 'error' && 'Error — intenta de nuevo'}
            </button>
          </form>

          {/* Error message */}
          {formError && (
            <p
              style={{
                marginTop: 16,
                color: BRAND.theobroma,
                fontSize: 12,
                fontFamily: FONTS.body,
              }}
            >
              {formError}
            </p>
          )}

          {/* Help text */}
          <p
            style={{
              marginTop: 24,
              color: BRAND.heirloom,
              opacity: 0.5,
              fontSize: 12,
              fontFamily: FONTS.body,
            }}
          >
            Recibirás un enlace mágico por correo para acceder a tu propuesta.
          </p>
        </div>
      </div>
    )
  }

  // ========================================================================
  // PHASE B: LOADING
  // ========================================================================
  if (loading) {
    return (
      <div
        style={{
          background: BRAND.bgDeep,
          color: BRAND.heirloom,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            fontSize: 48,
            animation: 'spin 2s linear infinite',
          }}
        >
          🌱
        </div>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  // ========================================================================
  // PHASE C: AUTHENTICATED PROPOSAL (email === ALLOWED_EMAIL)
  // ========================================================================
  if (email === ALLOWED_EMAIL) {
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

          {/* PRICING */}
          <RevealSection delay={500}>
            <h2
              style={{
                fontFamily: FONTS.serif,
                fontSize: 24,
                fontWeight: 700,
                color: BRAND.heirloom,
                marginBottom: 24,
                borderBottom: `2px solid ${BRAND.mazorca}`,
                paddingBottom: 12,
              }}
            >
              Opciones de Inversión
            </h2>
          </RevealSection>

          <RevealSection delay={600}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 20,
                marginBottom: 40,
              }}
            >
              {/* Base */}
              <div
                style={{
                  border: `2px solid ${BRAND.heirloom}30`,
                  borderRadius: 8,
                  padding: 24,
                  background: BRAND.bgCard,
                }}
              >
                <h4
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: 14,
                    fontWeight: 700,
                    color: BRAND.heirloom,
                    marginBottom: 12,
                  }}
                >
                  Experiencia Base
                </h4>
                <div
                  style={{
                    fontFamily: FONTS.serif,
                    fontSize: 32,
                    fontWeight: 700,
                    color: BRAND.pod,
                    marginBottom: 12,
                  }}
                >
                  $60.000
                </div>
                <p
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: 12,
                    color: BRAND.heirloom,
                    opacity: 0.7,
                    marginBottom: 16,
                  }}
                >
                  <strong>1-2 horas</strong> · 2-4 personas
                </p>
                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    fontSize: 12,
                    lineHeight: 1.8,
                    color: BRAND.heirloom,
                  }}
                >
                  <li>✓ Cinco Tiempos de Cacao</li>
                  <li>✓ Catas guiadas</li>
                  <li>✓ Narrativa regenerativa</li>
                  <li>✓ Implementos incluidos</li>
                </ul>
              </div>

              {/* Premium */}
              <div
                style={{
                  border: `2px solid ${BRAND.criollo}`,
                  borderRadius: 8,
                  padding: 24,
                  background: `linear-gradient(135deg, ${BRAND.criollo}15 0%, ${BRAND.pod}08 100%)`,
                  boxShadow: `0 4px 16px ${BRAND.criollo}20`,
                }}
              >
                <h4
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: 14,
                    fontWeight: 700,
                    color: BRAND.heirloom,
                    marginBottom: 12,
                  }}
                >
                  Premium + Barra{' '}
                  <span
                    style={{
                      display: 'inline-block',
                      background: BRAND.mazorca,
                      color: BRAND.amazon,
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 700,
                      marginLeft: 8,
                    }}
                  >
                    ⭐ RECOMENDADO
                  </span>
                </h4>
                <div
                  style={{
                    fontFamily: FONTS.serif,
                    fontSize: 32,
                    fontWeight: 700,
                    color: BRAND.mazorca,
                    marginBottom: 12,
                  }}
                >
                  $100.000
                </div>
                <p
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: 12,
                    color: BRAND.heirloom,
                    opacity: 0.7,
                    marginBottom: 16,
                  }}
                >
                  <strong>2-3 horas</strong> · Hasta 6 personas
                </p>
                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    fontSize: 12,
                    lineHeight: 1.8,
                    color: BRAND.heirloom,
                  }}
                >
                  <li>✓ Todo experiencia Base</li>
                  <li>✓ <strong>+ Barra 250g Hobo Huila</strong></li>
                  <li>✓ <strong>+ Kit de productos</strong></li>
                  <li>✓ Para llevar y recordar</li>
                </ul>
              </div>
            </div>
          </RevealSection>

          {/* TÉRMINOS */}
          <RevealSection delay={700}>
            <div
              style={{
                background: `${BRAND.pod}10`,
                borderLeft: `4px solid ${BRAND.pod}`,
                padding: 20,
                marginBottom: 40,
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
                ✓ <strong>Confirmación:</strong> 3102227848 o amaury@cauaculture.co
              </div>
            </div>
          </RevealSection>

          {/* CTA */}
          <RevealSection delay={800}>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <a
                href={`https://wa.me/573102227848?text=Hola%20Amaury%2C%20estoy%20interesado%20en%20la%20cataci%C3%B3n%20%22Cinco%20Tiempos%20de%20Cacao%22`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '12px 24px',
                  borderRadius: 8,
                  background: BRAND.mazorca,
                  color: BRAND.amazon,
                  fontFamily: FONTS.display,
                  fontSize: 14,
                  fontWeight: 700,
                  textDecoration: 'none',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  display: 'inline-block',
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
                  const el = e.currentTarget
                  el.style.transform = 'scale(1.02)'
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
                  const el = e.currentTarget
                  el.style.transform = 'scale(1)'
                }}
              >
                📱 Confirmar por WhatsApp
              </a>
              <a
                href="mailto:amaury@cauaculture.co?subject=Propuesta%20Cinco%20Tiempos%20de%20Cacao"
                style={{
                  padding: '12px 24px',
                  borderRadius: 8,
                  background: `${BRAND.heirloom}15`,
                  color: BRAND.heirloom,
                  fontFamily: FONTS.display,
                  fontSize: 14,
                  fontWeight: 700,
                  textDecoration: 'none',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  display: 'inline-block',
                  border: `1px solid ${BRAND.heirloom}40`,
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
                  const el = e.currentTarget
                  el.style.transform = 'scale(1.02)'
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
                  const el = e.currentTarget
                  el.style.transform = 'scale(1)'
                }}
              >
                📧 Escribir correo
              </a>
              <button
                onClick={() => {
                  const link = document.createElement('a')
                  link.href = '/propuesta-andrea-rojas.html'
                  link.download = 'Propuesta-Cinco-Tiempos-de-Cacao.pdf'
                  link.click()
                }}
                style={{
                  padding: '12px 24px',
                  borderRadius: 8,
                  background: `${BRAND.pod}20`,
                  color: BRAND.pod,
                  fontFamily: FONTS.display,
                  fontSize: 14,
                  fontWeight: 700,
                  border: `1px solid ${BRAND.pod}60`,
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  display: 'inline-block',
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                  const el = e.currentTarget
                  el.style.transform = 'scale(1.02)'
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                  const el = e.currentTarget
                  el.style.transform = 'scale(1)'
                }}
              >
                📄 Descargar PDF
              </button>
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
            📧 amaury@cauaculture.co · 📱 +57 310 222 7848 · 🌐 www.cacaofrutabrutal.com
          </div>
        </footer>
      </div>
    )
  }

  // Fallback (should not reach here)
  return null
}
