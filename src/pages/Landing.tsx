import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BRAND, FONTS, GUARDIANS, TREE_ADOPTION_PRICE_USD, ACTIVE_CHAIN_ID, BASE_SEPOLIA_CHAIN_ID } from '../utils/constants'
import CauaButton from '../components/ui/CauaButton'
import { useLang } from '../context/LangContext'
import { makeT } from '../utils/i18n'
import { useScrollProgress } from '../hooks/useScrollProgress'
import ScrollDebugOverlay from '../components/landing/ScrollDebugOverlay'
import CacaoGallery from '../components/landing/CacaoGallery'
import CauaWordmark from '../components/landing/CauaWordmark'
import PublicTabNav from '../components/landing/PublicTabNav'
import Web3Transparency from '../components/landing/Web3Transparency'

// Brand icons — thin stroke, ~1.5px, Pod Green — matching brand icon sheet (p.22)

// Bioflavonoids / molecule icon (science row, brand icon sheet)
function IconBiotech() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Central atom */}
      <circle cx="22" cy="22" r="3.5" stroke={BRAND.pod} strokeWidth="1.5"/>
      {/* Satellite atoms + bonds */}
      {([
        [22, 9],  [33, 15], [33, 29], [22, 35], [11, 29], [11, 15]
      ] as [number,number][]).map(([x,y], i) => (
        <g key={i}>
          <line x1="22" y1="22" x2={x} y2={y} stroke={BRAND.pod} strokeWidth="1.2" opacity="0.5"/>
          <circle cx={x} cy={y} r="2.5" stroke={BRAND.pod} strokeWidth="1.3"/>
        </g>
      ))}
    </svg>
  )
}

// Circular arrows / upcycling icon (sustainability row, brand icon sheet)
function IconRegeneration() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Arc top-right, clockwise */}
      <path d="M22 8 A14 14 0 0 1 36 22" stroke={BRAND.pod} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      {/* Arrowhead top-right */}
      <polyline points="33,16 36,22 30,23" stroke={BRAND.pod} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      {/* Arc bottom-left, clockwise */}
      <path d="M22 36 A14 14 0 0 1 8 22" stroke={BRAND.pod} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      {/* Arrowhead bottom-left */}
      <polyline points="11,28 8,22 14,21" stroke={BRAND.pod} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  )
}

// Globe / world icon (community row, brand icon sheet)
function IconImpact() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Globe circle */}
      <circle cx="22" cy="22" r="14" stroke={BRAND.pod} strokeWidth="1.5"/>
      {/* Latitude lines */}
      <ellipse cx="22" cy="22" rx="7" ry="14" stroke={BRAND.pod} strokeWidth="1.2" opacity="0.55"/>
      {/* Horizontal equator */}
      <line x1="8" y1="22" x2="36" y2="22" stroke={BRAND.pod} strokeWidth="1.2" opacity="0.55"/>
      {/* Upper lat */}
      <path d="M10 15 Q22 18 34 15" stroke={BRAND.pod} strokeWidth="1" opacity="0.4" fill="none"/>
      {/* Lower lat */}
      <path d="M10 29 Q22 26 34 29" stroke={BRAND.pod} strokeWidth="1" opacity="0.4" fill="none"/>
    </svg>
  )
}

export default function Landing() {
  const [visible, setVisible] = useState(false)
  const navigate = useNavigate()
  const { lang } = useLang()
  const T = makeT(lang)

  // Scroll contract — writes --p / --pd to :root for the gallery's Ken Burns
  // playback. Validated by ?scrollDebug=1 query (overlay reads both vars live).
  useScrollProgress()

  // The gallery is photos + opacity/transform — works the same on every
  // device, including mobile and reduced-motion. The component itself
  // honors reduced-motion by freezing transforms (no rAF needed).
  useEffect(() => { setTimeout(() => setVisible(true), 80) }, [])

  return (
    // bgDeep is the page's solid base. The gallery covers it with photos
    // (with a built-in scrim for legibility). Sections sit at z-index ≥ 1.
    <div style={{ background: BRAND.bgDeep, minHeight: '100vh', position: 'relative' }}>
        <PublicTabNav mode="adoptar" />
        <ScrollDebugOverlay />
        <CacaoGallery />

      {/* ── Hero ── */}
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 'clamp(80px,12vw,100px) var(--space-page) clamp(48px,8vw,60px)',
        position: 'relative', zIndex: 1, overflow: 'hidden',
      }}>

        <div style={{
          textAlign: 'center', position: 'relative', zIndex: 2,
          width: '100%', maxWidth: 1280,
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(48px)',
          transition: 'all 1.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          {/* Caúa wordmark — static here. The animated entrance lives in
              <AppIntro /> (full-screen splash on first visit). framer-motion
              tweens the wordmark from the intro position into this hero
              position via the shared `layoutId` declared inside CauaWordmark. */}
          <div style={{ marginBottom: 'clamp(24px, 5vw, 56px)' }}>
            <CauaWordmark variant="hero" />
          </div>

          {/* Eyebrow — bigger, more breathable */}
          <p style={{
            fontFamily: FONTS.serif, fontStyle: 'italic',
            color: BRAND.mazorca,
            fontSize: 'clamp(13px, 2vw, 18px)',
            marginBottom: 'clamp(16px, 3vw, 28px)',
            letterSpacing: '0.25em', textTransform: 'lowercase',
            lineHeight: 1.4,
          }}>{T('land_eyebrow')}</p>

          {/* Main wordmark-scale hero — bigger min, bigger max, steeper growth */}
          <h1 style={{
            fontFamily: FONTS.display, fontWeight: 900,
            fontSize: 'clamp(44px, 14vw, 184px)',
            lineHeight: 0.86,
            letterSpacing: '-0.02em', color: BRAND.heirloom,
            textTransform: 'uppercase', margin: '0 0 clamp(8px, 1.5vw, 16px)',
          }}>
            CACAO<br />
            <span style={{ color: BRAND.pod }}>FRUTA</span><br />
            BRUTAL
          </h1>

          <p style={{
            fontFamily: FONTS.body, color: `${BRAND.heirloom}70`,
            fontSize: 'clamp(14px, 2.4vw, 16px)', maxWidth: 480,
            margin: '0 auto 36px', lineHeight: 1.75,
          }}>
            {T('land_sub')}<br />
            <span style={{ fontFamily: FONTS.serif, fontStyle: 'italic', color: BRAND.mazorca }}>
              {T('land_sub2')}
            </span>
          </p>

          {/* Free-adoption pill — visible offer during AtmosphereX / onboarding window */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            margin: '0 auto 14px',
            borderRadius: 999,
            border: `1px solid ${BRAND.mazorca}66`,
            background: `${BRAND.mazorca}11`,
            fontFamily: FONTS.display,
            fontSize: 11,
            fontWeight: 800,
            color: BRAND.mazorca,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}>
            🎁 Adopción gratis · onboarding abierto
          </div>

          {/* Adoption pitch — anchored to TREE_ADOPTION_PRICE_USD so price stays in sync */}
          <p style={{
            fontFamily: FONTS.body,
            color: `${BRAND.heirloom}88`,
            fontSize: 'clamp(13px, 2.1vw, 15px)',
            lineHeight: 1.65,
            maxWidth: 540,
            margin: '0 auto 22px',
            letterSpacing: '0.01em',
          }}>
            {T('land_adopt_pitch').replace('${PRICE}', `$${TREE_ADOPTION_PRICE_USD}`)}
          </p>

          {/* Primary CTAs */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
            <CauaButton size="lg" onClick={() => navigate('/adoptar')}>
              {T('land_cta1')}
            </CauaButton>
          </div>

          {/* Secondary links */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { href: '/siembra.html',     label: 'SIEMBRA', color: BRAND.pod     },
            ].map(({ href, label, color }) => (
              <a key={href} href={href} target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '7px 16px', borderRadius: 999,
                  border: `1px solid ${color}33`,
                  background: `${color}08`,
                  color: `${color}bb`,
                  fontFamily: FONTS.display, fontWeight: 700,
                  fontSize: 10, letterSpacing: '0.14em', textDecoration: 'none',
                  transition: 'all 0.3s',
                }}>
                {label}
              </a>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{
          position: 'absolute', bottom: 36, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
          opacity: visible ? 0.6 : 0, transition: 'opacity 2s ease 1s',
        }}>
          <span style={{ fontFamily: FONTS.body, color: `${BRAND.heirloom}55`, fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase' }}>
            {T('land_scroll')}
          </span>
          <div style={{ width: 1, height: 40, background: `linear-gradient(${BRAND.pod}44, transparent)` }} />
        </div>
      </div>

      {/* ── Guardianes ── */}
      <div style={{ padding: 'var(--space-section) var(--space-page) clamp(48px,8vw,80px)', maxWidth: 1040, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ marginBottom: 48 }}>
          <p style={{
            fontFamily: FONTS.serif, fontStyle: 'italic',
            color: BRAND.mazorca, fontSize: 12, letterSpacing: '0.25em', marginBottom: 10,
          }}>{T('land_petals')}</p>
          <h2 style={{
            fontFamily: FONTS.display, fontWeight: 900,
            fontSize: 'clamp(24px, 5vw, 64px)', color: BRAND.heirloom,
            textTransform: 'uppercase', margin: 0, lineHeight: 0.92,
          }}>{T('land_guardians')}</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(150px, 100%), 1fr))', gap: 'clamp(10px, 2vw, 16px)' }}>
          {GUARDIANS.map((g, i) => (
            <div key={i} style={{
              background: BRAND.bgCard,
              border: `1px solid ${BRAND.amazon}55`,
              borderRadius: 14, padding: '22px 20px',
              position: 'relative', overflow: 'hidden',
              transition: 'border-color 0.3s, box-shadow 0.3s',
            }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLDivElement
                el.style.borderColor = `${BRAND.pod}44`
                el.style.boxShadow = `0 8px 32px ${BRAND.pod}10`
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLDivElement
                el.style.borderColor = `${BRAND.amazon}55`
                el.style.boxShadow = 'none'
              }}
            >
              {/* Accent dot top-right */}
              <div style={{
                position: 'absolute', top: 16, right: 16,
                width: 6, height: 6, borderRadius: '50%',
                background: BRAND.pod, opacity: 0.5,
              }} />

              <div style={{
                fontFamily: FONTS.display, fontWeight: 700,
                color: BRAND.pod, fontSize: 9, letterSpacing: '0.2em',
                textTransform: 'uppercase', marginBottom: 6,
              }}>{g.region}</div>

              <div style={{
                fontFamily: FONTS.display, fontWeight: 900,
                color: BRAND.heirloom, fontSize: 20, marginBottom: 8, lineHeight: 1,
              }}>{g.name}</div>

              <div style={{
                fontFamily: FONTS.body, color: `${BRAND.heirloom}70`,
                fontSize: 11, lineHeight: 1.5, marginBottom: 12,
              }}>{g.power}</div>

              {g.varieties.map(v => (
                <div key={v} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '3px 10px', borderRadius: 999,
                  background: `${BRAND.pod}10`,
                  border: `1px solid ${BRAND.pod}25`,
                  marginRight: 4,
                }}>
                  <span style={{
                    fontFamily: FONTS.body, fontSize: 9,
                    color: `${BRAND.pod}cc`, letterSpacing: '0.04em',
                  }}>{v}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── Web3 Transparency · BaseScan verifier links ── */}
      <Web3Transparency />

      {/* ── Value Props ── */}
      <div style={{
        padding: '0 var(--space-page) var(--space-section)', maxWidth: 960, margin: '0 auto',
        position: 'relative', zIndex: 1,
      }}>
        {/* Section divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 48 }}>
          <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${BRAND.amazon}88)` }} />
          <span style={{ fontFamily: FONTS.serif, fontStyle: 'italic', color: `${BRAND.heirloom}33`, fontSize: 11 }}>
            {lang === 'es' ? 'por qué caúa' : 'why caúa'}
          </span>
          <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${BRAND.amazon}88, transparent)` }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))', gap: 20 }}>
          {[
            { Icon: IconBiotech,      title: T('land_v1_title'), desc: T('land_v1_desc'), accent: BRAND.pod      },
            { Icon: IconRegeneration, title: T('land_v2_title'), desc: T('land_v2_desc'), accent: BRAND.mazorca  },
            { Icon: IconImpact,       title: T('land_v3_title'), desc: T('land_v3_desc'), accent: BRAND.theobroma },
          ].map((v, i) => (
            <div key={i} style={{
              background: `${BRAND.bgCard}aa`,
              borderRadius: 16, padding: '28px 24px',
              border: `1px solid ${BRAND.amazon}44`,
              position: 'relative', overflow: 'hidden',
            }}>
              {/* Accent corner glow */}
              <div style={{
                position: 'absolute', bottom: -30, right: -30,
                width: 100, height: 100, borderRadius: '50%',
                background: `${v.accent}08`,
                pointerEvents: 'none',
              }} />

              <div style={{ marginBottom: 16 }}>
                <v.Icon />
              </div>
              <div style={{
                fontFamily: FONTS.display, fontWeight: 700,
                color: v.accent, fontSize: 11,
                letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 10,
              }}>{v.title}</div>
              <div style={{
                fontFamily: FONTS.body, color: `${BRAND.heirloom}80`,
                fontSize: 13, lineHeight: 1.65,
              }}>{v.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Únete / CTA final ── */}
      <div id="join" style={{
        padding: 'clamp(48px,8vw,80px) var(--space-page) clamp(64px,10vw,120px)',
        maxWidth: 480, margin: '0 auto', textAlign: 'center',
        position: 'relative', zIndex: 1,
      }}>
        <p style={{
          fontFamily: FONTS.serif, fontStyle: 'italic',
          color: BRAND.mazorca, fontSize: 13, letterSpacing: '0.2em',
          marginBottom: 28,
        }}>{T('land_join')}</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <CauaButton size="lg" onClick={() => navigate('/adoptar')}>
            {lang === 'es' ? 'Seleccionar Clase Genética' : 'Choose Genetic Class'}
          </CauaButton>
        </div>
      </div>

      {/* ── Legal footer + disclaimer testnet ── */}
      <div style={{
        padding: '24px var(--space-page) 36px',
        textAlign: 'center',
        borderTop: `1px solid ${BRAND.amazon}33`,
        position: 'relative',
        zIndex: 1,
      }}>
        {ACTIVE_CHAIN_ID === BASE_SEPOLIA_CHAIN_ID && (
          <p style={{
            fontFamily: FONTS.body,
            fontSize: 9.5,
            color: `${BRAND.heirloom}44`,
            letterSpacing: '0.06em',
            margin: '0 auto 10px',
            maxWidth: 520,
            lineHeight: 1.55,
          }}>
            Hoy operamos en Base Sepolia (testnet). Mainnet (chain 8453) tras auditoría externa Q3 2026.
          </p>
        )}
        <p style={{
          fontFamily: FONTS.body,
          fontSize: 10,
          color: `${BRAND.heirloom}55`,
          letterSpacing: '0.08em',
          margin: 0,
        }}>
          CAUA COLOMBIA SAS · NIT 901.213.846-7 · Bogotá D.C. · Colombia
        </p>
      </div>
    </div>
  )
}
