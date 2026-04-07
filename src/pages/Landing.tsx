import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BRAND, GUARDIANS } from '../utils/constants'
import CauaButton from '../components/ui/CauaButton'

export default function Landing() {
  const [visible, setVisible] = useState(false)
  const navigate = useNavigate()

  useEffect(() => { setTimeout(() => setVisible(true), 100) }, [])

  return (
    <div style={{ background: '#040C06', minHeight: '100vh' }}>

      {/* ── Hero ── */}
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '80px 24px 40px', position: 'relative', overflow: 'hidden',
      }}>

        {/* Molecular SVG bg */}
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.06 }}
          viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
          {[...Array(20)].map((_, i) => (
            <circle key={i} cx={100 + (i * 37) % 700} cy={50 + (i * 53) % 500}
              r={2 + (i % 4)} fill={BRAND.pod} opacity={0.3 + (i % 5) * 0.1}>
              <animate attributeName="cy"
                values={`${50+(i*53)%500};${80+(i*53)%500};${50+(i*53)%500}`}
                dur={`${4+i%3}s`} repeatCount="indefinite" />
            </circle>
          ))}
          {[...Array(10)].map((_, i) => (
            <line key={`l${i}`}
              x1={100+(i*37)%700} y1={50+(i*53)%500}
              x2={100+((i+1)*37)%700} y2={50+((i+1)*53)%500}
              stroke={BRAND.pod} strokeWidth="0.5" opacity="0.15">
              <animate attributeName="opacity" values="0.1;0.25;0.1"
                dur={`${3+i%2}s`} repeatCount="indefinite" />
            </line>
          ))}
        </svg>

        <div style={{
          textAlign: 'center', position: 'relative', zIndex: 2,
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(40px)',
          transition: 'all 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          <p style={{
            fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic',
            color: BRAND.mazorca, fontSize: 14, marginBottom: 16, letterSpacing: '0.2em',
          }}>AgriFoodTech · Biotecnología Ancestral</p>

          <h1 style={{
            fontFamily: "'Barlow Condensed', Impact, sans-serif", fontWeight: 900,
            fontSize: 'clamp(48px, 12vw, 120px)', lineHeight: 0.9,
            letterSpacing: '-0.02em', color: BRAND.heirloom,
            textTransform: 'uppercase', margin: '0 0 16px',
          }}>
            CACAO<br />
            <span style={{ color: BRAND.pod }}>FRUTA</span><br />
            BRUTAL
          </h1>

          <p style={{
            fontFamily: 'system-ui', color: `${BRAND.heirloom}80`,
            fontSize: 16, maxWidth: 500, margin: '0 auto 32px', lineHeight: 1.7,
          }}>
            El primer sistema biotecnológico de cacao funcional.<br />
            <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic', color: BRAND.mazorca }}>
              Del genoma colombiano al mundo.
            </span>
          </p>

          {/* CTAs principales */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
            <CauaButton size="lg" onClick={() => navigate('/marketplace')}>
              EXPLORAR PRODUCTOS
            </CauaButton>
            <CauaButton size="lg" variant="secondary" onClick={() => navigate('/ritual')}>
              RITUAL DEL DÍA
            </CauaButton>
            <CauaButton size="lg" variant="accent" onClick={() => navigate('/marketplace')}>
              ↗ ABRIR APP
            </CauaButton>
          </div>

          {/* Links secundarios */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { href: '/pitch/', label: 'PITCH', icon: '🎯', color: BRAND.heroic },
              { href: '/pitch_growth.html', label: 'GROWTH', icon: '📊', color: BRAND.mazorca },
              { href: '/siembra.html', label: 'SIEMBRA', icon: '🌱', color: BRAND.pod },
            ].map(({ href, label, icon, color }) => (
              <a key={href} href={href} target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '8px 18px', borderRadius: 999,
                  border: `1px solid ${color}44`,
                  background: `${color}0d`,
                  color: `${color}cc`,
                  fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
                  fontSize: 11, letterSpacing: '0.12em', textDecoration: 'none',
                  transition: 'all 0.3s',
                }}>
                {icon} {label}
              </a>
            ))}
          </div>
        </div>

        <div style={{
          position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        }}>
          <span style={{ color: `${BRAND.heirloom}44`, fontSize: 10, letterSpacing: '0.2em' }}>SCROLL</span>
          <div style={{ width: 1, height: 32, background: `linear-gradient(${BRAND.heirloom}44, transparent)` }} />
        </div>
      </div>

      {/* ── Guardianes ── */}
      <div style={{ padding: '80px 24px', maxWidth: 1000, margin: '0 auto' }}>
        <p style={{
          fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic',
          color: BRAND.mazorca, fontSize: 12, letterSpacing: '0.2em', marginBottom: 8,
        }}>Los 5 Pétalos de la Flor del Cacao</p>
        <h2 style={{
          fontFamily: "'Barlow Condensed', Impact, sans-serif", fontWeight: 900,
          fontSize: 'clamp(32px, 6vw, 56px)', color: BRAND.heirloom,
          textTransform: 'uppercase', margin: '0 0 40px', lineHeight: 0.95,
        }}>NUESTROS GUARDIANES</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 16 }}>
          {GUARDIANS.map((g, i) => (
            <div key={i} style={{
              background: '#132B1C', border: `1px solid ${BRAND.amazon}66`,
              borderRadius: 12, padding: 20, position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: -20, right: -20, width: 80, height: 80,
                borderRadius: '50%', background: `${BRAND.pod}08`,
              }} />
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, color: BRAND.pod, fontSize: 10, letterSpacing: '0.15em', marginBottom: 4 }}>
                {g.region.toUpperCase()}
              </div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, color: BRAND.heirloom, fontSize: 18, marginBottom: 6 }}>
                {g.name}
              </div>
              <div style={{ fontFamily: 'system-ui', color: `${BRAND.heirloom}77`, fontSize: 11, lineHeight: 1.4, marginBottom: 8 }}>
                {g.power}
              </div>
              <div style={{
                display: 'inline-block', padding: '2px 8px', borderRadius: 999,
                background: `${BRAND.criollo}22`, border: `1px solid ${BRAND.criollo}33`,
                fontFamily: 'system-ui', fontSize: 9, color: BRAND.criollo,
              }}>{g.heritage}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Value Props ── */}
      <div style={{ padding: '60px 24px 100px', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
          {[
            { icon: '🧬', title: 'BIOACTIVOS CERTIFICADOS', desc: 'Epicatequina, teobromina y mucílago fermentado. Novel Food aprobado para el mercado europeo.' },
            { icon: '🌿', title: 'AGROFORESTERÍA VIVA',    desc: 'Cacao criollo en sistemas regenerativos. 100% del fruto aprovechado, cero desperdicio.' },
            { icon: '🌍', title: 'IMPACTO VERIFICADO',     desc: '+180% ingreso directo a las familias Guardianas. Trazabilidad completa de origen a taza.' },
          ].map((v, i) => (
            <div key={i} style={{
              background: `${BRAND.bgCard}88`, borderRadius: 12, padding: 24,
              border: `1px solid ${BRAND.amazon}44`,
            }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{v.icon}</div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, color: BRAND.pod, fontSize: 12, letterSpacing: '0.15em', marginBottom: 8 }}>{v.title}</div>
              <div style={{ fontFamily: 'system-ui', color: `${BRAND.heirloom}88`, fontSize: 13, lineHeight: 1.5 }}>{v.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
