import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BRAND, FONTS, GUARDIANS } from '../utils/constants'
import CauaButton from '../components/ui/CauaButton'
import { useLang } from '../context/LangContext'
import { makeT } from '../utils/i18n'

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

  useEffect(() => { setTimeout(() => setVisible(true), 80) }, [])

  return (
    <div style={{ background: BRAND.bgDeep, minHeight: '100vh' }}>

      {/* ── Hero ── */}
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 'clamp(80px,12vw,100px) var(--space-page) clamp(48px,8vw,60px)',
        position: 'relative', overflow: 'hidden',
      }}>

        {/* Atmospheric radial glow behind hero text */}
        <div style={{
          position: 'absolute', top: '30%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 600, height: 600,
          background: `radial-gradient(ellipse, ${BRAND.pod}08 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />

        {/* Molecular SVG bg */}
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.05 }}
          viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          {[...Array(18)].map((_, i) => (
            <circle key={i} cx={80 + (i * 41) % 660} cy={60 + (i * 57) % 480}
              r={1.5 + (i % 3)} fill={BRAND.pod} opacity={0.4 + (i % 4) * 0.1}>
              <animate attributeName="cy"
                values={`${60+(i*57)%480};${90+(i*57)%480};${60+(i*57)%480}`}
                dur={`${5+i%3}s`} repeatCount="indefinite" />
            </circle>
          ))}
          {[...Array(8)].map((_, i) => (
            <line key={`l${i}`}
              x1={80+(i*41)%660} y1={60+(i*57)%480}
              x2={80+((i+2)*41)%660} y2={60+((i+2)*57)%480}
              stroke={BRAND.pod} strokeWidth="0.4" opacity="0.12" />
          ))}
        </svg>

        <div style={{
          textAlign: 'center', position: 'relative', zIndex: 2,
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(48px)',
          transition: 'all 1.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          {/* Eyebrow */}
          <p style={{
            fontFamily: FONTS.serif, fontStyle: 'italic',
            color: BRAND.mazorca, fontSize: 13, marginBottom: 20,
            letterSpacing: '0.25em', textTransform: 'lowercase',
          }}>{T('land_eyebrow')}</p>

          {/* Main wordmark-scale hero */}
          <h1 style={{
            fontFamily: FONTS.display, fontWeight: 900,
            fontSize: 'clamp(36px, 10vw, 136px)', lineHeight: 0.88,
            letterSpacing: '-0.01em', color: BRAND.heirloom,
            textTransform: 'uppercase', margin: '0 0 8px',
          }}>
            CACAO<br />
            <span style={{ color: BRAND.pod }}>FRUTA</span><br />
            BRUTAL
          </h1>

          {/* Scientific descriptor */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            flexWrap: 'wrap', justifyContent: 'center',
            margin: '20px 0 28px',
            padding: '8px 20px', borderRadius: 999,
            border: `1px solid ${BRAND.pod}30`,
            background: `${BRAND.pod}08`,
          }}>
            {['Mucílago 20%', 'Epicatequina', 'Teobromina'].map((label, i) => (
              <span key={label}>
                <span style={{
                  fontFamily: FONTS.body, fontSize: 11,
                  color: `${BRAND.heirloom}88`, letterSpacing: '0.06em',
                }}>{label}</span>
                {i < 2 && <span style={{ color: `${BRAND.pod}55`, margin: '0 8px' }}>·</span>}
              </span>
            ))}
          </div>

          <p style={{
            fontFamily: FONTS.body, color: `${BRAND.heirloom}70`,
            fontSize: 16, maxWidth: 480, margin: '0 auto 36px', lineHeight: 1.75,
          }}>
            {T('land_sub')}<br />
            <span style={{ fontFamily: FONTS.serif, fontStyle: 'italic', color: BRAND.mazorca }}>
              {T('land_sub2')}
            </span>
          </p>

          {/* Primary CTAs */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
            <CauaButton size="lg" onClick={() => navigate('/marketplace')}>
              {T('land_cta1')}
            </CauaButton>
            <CauaButton size="lg" variant="secondary" onClick={() => navigate('/ritual')}>
              {T('land_cta2')}
            </CauaButton>
            <CauaButton size="lg" variant="accent" onClick={() => navigate('/marketplace')}>
              {T('land_cta3')}
            </CauaButton>
          </div>

          {/* Secondary links */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { href: '/pitch/',           label: 'PITCH',   color: BRAND.heroic  },
              { href: '/pitch_growth.html',label: 'GROWTH',  color: BRAND.mazorca },
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
      <div style={{ padding: 'var(--space-section) var(--space-page) clamp(48px,8vw,80px)', maxWidth: 1040, margin: '0 auto' }}>
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(180px, 45%), 1fr))', gap: 16 }}>
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

      {/* ── Value Props ── */}
      <div style={{
        padding: '0 var(--space-page) var(--space-section)', maxWidth: 960, margin: '0 auto',
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

      {/* ── Tagline break ── */}
      <div style={{
        padding: 'clamp(40px,6vw,60px) var(--space-page)',
        borderTop: `1px solid ${BRAND.amazon}33`,
        borderBottom: `1px solid ${BRAND.amazon}33`,
        textAlign: 'center',
        background: `${BRAND.amazon}08`,
      }}>
        <p style={{
          fontFamily: FONTS.serif, fontStyle: 'italic',
          color: `${BRAND.heirloom}55`, fontSize: 'clamp(16px, 3vw, 26px)',
          margin: 0, letterSpacing: '0.06em',
          lineHeight: 1.6,
        }}>
          {lang === 'es'
            ? '"Del genoma colombiano al mundo. Fruta. Brutal."'
            : '"From the Colombian genome to the world. Fruit. Brutal."'
          }
        </p>
      </div>

      {/* ── Únete / CTA final ── */}
      <div style={{
        padding: 'clamp(48px,8vw,80px) var(--space-page) clamp(64px,10vw,120px)',
        maxWidth: 480, margin: '0 auto', textAlign: 'center',
      }}>
        <p style={{
          fontFamily: FONTS.serif, fontStyle: 'italic',
          color: BRAND.mazorca, fontSize: 13, letterSpacing: '0.2em',
          marginBottom: 28,
        }}>{T('land_join')}</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <CauaButton size="lg" onClick={() => navigate('/adoptar')}>
            {lang === 'es' ? 'Adoptar un Árbol' : 'Adopt a Tree'}
          </CauaButton>
          <CauaButton size="lg" variant="secondary" onClick={() => navigate('/fund')}>
            {lang === 'es' ? 'Invertir' : 'Invest'}
          </CauaButton>
        </div>
      </div>
    </div>
  )
}
