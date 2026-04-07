import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BRAND, FONTS, GUARDIANS } from '../utils/constants'
import CauaButton from '../components/ui/CauaButton'
import CauaLogo from '../components/ui/CauaLogo'
import HubspotLeadForm from '../components/ui/HubspotLeadForm'
import { useLang } from '../context/LangContext'
import { makeT } from '../utils/i18n'

// Botanical SVG icons for value props
function IconBiotech() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="18" cy="20" rx="8" ry="11" stroke={BRAND.pod} strokeWidth="1" opacity="0.9"/>
      {[-3,0,3].map((x,i) => (
        <ellipse key={i} cx={18+x} cy="20" rx="2.5" ry="9" fill="none" stroke={BRAND.pod} strokeWidth="0.4" opacity="0.4"/>
      ))}
      <path d="M18 9 Q17 6 18 3" stroke={BRAND.pod} strokeWidth="1" strokeLinecap="round" opacity="0.8"/>
      <path d="M18 5 C21 3 24 5 21 8 C19 9 18 7 18 5Z" fill={BRAND.criollo} opacity="0.9"/>
      <circle cx="11" cy="29" r="1.5" fill={BRAND.pod} opacity="0.5"/>
      <circle cx="18" cy="31" r="1.5" fill={BRAND.pod} opacity="0.5"/>
      <circle cx="25" cy="29" r="1.5" fill={BRAND.pod} opacity="0.5"/>
    </svg>
  )
}

function IconRegeneration() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 6 C12 6 7 11 7 18 C7 25 12 30 18 30 C24 30 29 25 29 18"
        stroke={BRAND.pod} strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.9"/>
      <path d="M29 18 L29 12 L23 12" stroke={BRAND.pod} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M18 13 C15 13 13 15 13 18 C13 21 15 23 18 23" stroke={BRAND.mazorca} strokeWidth="0.8" fill="none" opacity="0.7"/>
      <circle cx="18" cy="18" r="2.5" fill={BRAND.pod} opacity="0.35"/>
    </svg>
  )
}

function IconImpact() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* People / community radial */}
      {[0,1,2,3,4].map(i => {
        const a = (i/5)*Math.PI*2 - Math.PI/2
        const x = 18 + Math.cos(a)*11
        const y = 18 + Math.sin(a)*11
        return (
          <g key={i}>
            <circle cx={x} cy={y} r="3.5" fill={BRAND.pod} opacity="0.25" stroke={BRAND.pod} strokeWidth="0.6"/>
            <line x1="18" y1="18" x2={x} y2={y} stroke={BRAND.pod} strokeWidth="0.4" opacity="0.3"/>
          </g>
        )
      })}
      <circle cx="18" cy="18" r="5" fill={BRAND.pod} opacity="0.2" stroke={BRAND.pod} strokeWidth="0.8"/>
      <circle cx="18" cy="18" r="2" fill={BRAND.mazorca} opacity="0.8"/>
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
        padding: '100px 24px 60px', position: 'relative', overflow: 'hidden',
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
            fontSize: 'clamp(56px, 14vw, 136px)', lineHeight: 0.88,
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
      <div style={{ padding: '100px 24px 80px', maxWidth: 1040, margin: '0 auto' }}>
        <div style={{ marginBottom: 48 }}>
          <p style={{
            fontFamily: FONTS.serif, fontStyle: 'italic',
            color: BRAND.mazorca, fontSize: 12, letterSpacing: '0.25em', marginBottom: 10,
          }}>{T('land_petals')}</p>
          <h2 style={{
            fontFamily: FONTS.display, fontWeight: 900,
            fontSize: 'clamp(36px, 6vw, 64px)', color: BRAND.heirloom,
            textTransform: 'uppercase', margin: 0, lineHeight: 0.92,
          }}>{T('land_guardians')}</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
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

              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '3px 10px', borderRadius: 999,
                background: `${BRAND.criollo}18`,
                border: `1px solid ${BRAND.criollo}28`,
              }}>
                <span style={{
                  fontFamily: FONTS.body, fontSize: 9,
                  color: `${BRAND.criollo}cc`, letterSpacing: '0.04em',
                }}>{g.heritage}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Value Props ── */}
      <div style={{
        padding: '0 24px 100px', maxWidth: 960, margin: '0 auto',
      }}>
        {/* Section divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 48 }}>
          <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${BRAND.amazon}88)` }} />
          <span style={{ fontFamily: FONTS.serif, fontStyle: 'italic', color: `${BRAND.heirloom}33`, fontSize: 11 }}>
            {lang === 'es' ? 'por qué caúa' : 'why caúa'}
          </span>
          <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${BRAND.amazon}88, transparent)` }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
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
        padding: '60px 24px',
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
        <div style={{ marginTop: 24, display: 'inline-flex', justifyContent: 'center' }}>
          <CauaLogo size={22} showTagline />
        </div>
      </div>

      {/* ── Lead capture ── */}
      <div style={{ padding: '80px 24px 120px', maxWidth: 480, margin: '0 auto' }}>
        <p style={{
          fontFamily: FONTS.serif, fontStyle: 'italic',
          color: BRAND.mazorca, fontSize: 13, letterSpacing: '0.2em',
          marginBottom: 20, textAlign: 'center',
        }}>{T('land_join')}</p>
        <HubspotLeadForm />
      </div>
    </div>
  )
}
