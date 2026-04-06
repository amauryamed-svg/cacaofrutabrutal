import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BRAND, TAROT_CARDS, ELEMENT_COLORS } from '../utils/constants'
import { useAuth } from '../context/AuthContext'
import TarotCardArt from '../components/ritual/TarotCardArt'
import type { TarotCard } from '../types'

type Phase = 'intro' | 'drawing' | 'reveal'

const ELEMENT_LABELS: Record<string, string> = {
  Tierra: '◈ Tierra · Arraigo',
  Fuego:  '◆ Fuego · Transformación',
  Agua:   '◉ Agua · Intuición',
  Aire:   '◇ Aire · Claridad',
}

export default function Ritual() {
  const [phase, setPhase]       = useState<Phase>('intro')
  const [selectedCard, setCard] = useState<TarotCard | null>(null)
  const { user }                = useAuth()
  const navigate                = useNavigate()
  const streak                  = user ? 7 : 0

  const drawCard = () => {
    if (!user) { navigate('/auth'); return }
    setPhase('drawing')
    setTimeout(() => {
      const idx = Math.floor(Math.random() * TAROT_CARDS.length)
      setCard(TAROT_CARDS[idx])
      setPhase('reveal')
    }, 2200)
  }

  const cardColor = selectedCard ? ELEMENT_COLORS[selectedCard.element] : BRAND.criollo

  return (
    <div style={{ background: '#040C06', minHeight: '100vh', paddingTop: 80 }}>

      {/* Hero header */}
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px 0', textAlign: 'center' }}>
        <p style={{
          fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic',
          color: BRAND.criollo, fontSize: 13, letterSpacing: '0.25em', marginBottom: 10,
        }}>
          Ritual del Cacao · 22 Arcanas
        </p>
        <h1 style={{
          fontFamily: "'Barlow Condensed', Impact, sans-serif", fontWeight: 900,
          fontSize: 'clamp(42px, 10vw, 72px)', color: BRAND.heirloom,
          textTransform: 'uppercase', margin: '0 0 12px', lineHeight: 0.9,
        }}>
          TU LECTURA<br />
          <span style={{ color: BRAND.criollo }}>DE HOY</span>
        </h1>
        <p style={{
          fontFamily: 'system-ui', color: `${BRAND.heirloom}66`,
          fontSize: 14, lineHeight: 1.65, maxWidth: 440, margin: '0 auto 24px',
        }}>
          El cacao como espejo. Una práctica diaria para mujeres que eligen vivir con intención,
          conectadas con la naturaleza y con el mundo.
        </p>

        {/* Streak — only when logged in */}
        {user && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: `${BRAND.mazorca}12`, border: `1px solid ${BRAND.mazorca}30`,
            padding: '6px 16px', borderRadius: 999, marginBottom: 32,
          }}>
            <span style={{ fontSize: 15 }}>🔥</span>
            <span style={{
              fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
              fontSize: 12, color: BRAND.mazorca, letterSpacing: '0.1em',
            }}>{streak} DÍAS DE PRÁCTICA CONTINUA</span>
          </div>
        )}
      </div>

      {/* Main ritual area */}
      <div style={{
        maxWidth: 480, margin: '0 auto', padding: '0 24px 80px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32,
      }}>

        {/* INTRO — card back, invitation to draw */}
        {phase === 'intro' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            <div
              onClick={drawCard}
              style={{
                width: 200, height: 300, cursor: 'pointer',
                transition: 'transform 0.4s',
                filter: 'drop-shadow(0 20px 48px rgba(141,38,121,0.3))',
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04) translateY(-6px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1) translateY(0)')}
            >
              <TarotCardArt card={TAROT_CARDS[0]} revealed={false} />
            </div>

            <div style={{ textAlign: 'center' }}>
              <p style={{
                fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic',
                color: `${BRAND.heirloom}70`, fontSize: 13, marginBottom: 16, lineHeight: 1.6,
              }}>
                Cierra los ojos. Respira. Piensa en tu intención para hoy.<br />
                Cuando estés lista, toca la carta.
              </p>
              <button onClick={drawCard} style={{
                background: `linear-gradient(135deg, ${BRAND.criollo}, #6B1B5A)`,
                color: BRAND.heirloom, border: 'none',
                padding: '14px 36px', borderRadius: 999,
                fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
                fontSize: 13, letterSpacing: '0.15em', cursor: 'pointer',
              }}>
                {user ? 'REVELAR MI ARCANA' : 'INICIAR RITUAL'}
              </button>
              {!user && (
                <p style={{ fontFamily: 'system-ui', fontSize: 11, color: `${BRAND.heirloom}44`, marginTop: 10 }}>
                  Crea tu cuenta gratuita para guardar tu racha diaria
                </p>
              )}
            </div>
          </div>
        )}

        {/* DRAWING — animated pulse */}
        {phase === 'drawing' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
            <div className="animate-pulse-glow" style={{
              width: 200, height: 300, borderRadius: 12,
              background: `linear-gradient(145deg, ${BRAND.criollo}44, #132B1C)`,
              border: `2px solid ${BRAND.criollo}`,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 12,
            }}>
              <div style={{ fontSize: 36, animation: 'float 2s ease-in-out infinite' }}>🫘</div>
              <div style={{
                fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic',
                color: `${BRAND.heirloom}80`, fontSize: 12,
              }}>el cacao te escucha…</div>
            </div>
          </div>
        )}

        {/* REVEAL */}
        {phase === 'reveal' && selectedCard && (
          <>
            {/* Card */}
            <div className="animate-fade-in-up" style={{
              width: 220, height: 330,
              filter: `drop-shadow(0 24px 56px ${cardColor}44)`,
            }}>
              <TarotCardArt card={selectedCard} revealed />
            </div>

            {/* Element label */}
            <div style={{
              fontFamily: 'system-ui', fontSize: 11, color: cardColor,
              letterSpacing: '0.2em', textTransform: 'uppercase',
              opacity: 0.8,
            }}>
              {ELEMENT_LABELS[selectedCard.element]}
            </div>

            {/* Meaning */}
            <div className="animate-fade-in-up" style={{
              background: '#0D1A10',
              border: `1px solid ${cardColor}33`,
              borderRadius: 14, padding: '22px 24px',
              width: '100%',
            }}>
              <p style={{
                fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic',
                color: `${BRAND.heirloom}cc`, fontSize: 14, lineHeight: 1.7,
                margin: '0 0 16px',
              }}>"{selectedCard.meaning}"</p>

              <div style={{
                borderTop: `1px solid ${BRAND.amazon}44`,
                paddingTop: 16,
              }}>
                <div style={{
                  fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
                  color: BRAND.pod, fontSize: 10, letterSpacing: '0.2em', marginBottom: 8,
                }}>INVITACIÓN DEL DÍA</div>
                <p style={{
                  fontFamily: 'system-ui', color: BRAND.heirloom,
                  fontSize: 13, lineHeight: 1.65, margin: 0,
                }}>{selectedCard.advice}</p>
              </div>
            </div>

            {/* Meditation invite */}
            <div className="animate-fade-in-up" style={{
              background: `linear-gradient(135deg, ${BRAND.criollo}12, ${BRAND.muisca}10)`,
              border: `1px solid ${BRAND.criollo}25`,
              borderRadius: 14, padding: '20px 24px', width: '100%', textAlign: 'center',
            }}>
              <div style={{
                fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
                color: BRAND.heirloom, fontSize: 13, letterSpacing: '0.1em', marginBottom: 6,
              }}>CEREMONIA DE CACAO GUIADA</div>
              <p style={{
                fontFamily: 'system-ui', color: `${BRAND.heirloom}66`,
                fontSize: 12, margin: '0 0 14px', lineHeight: 1.5,
              }}>
                15 minutos · Taza caliente · Espacio sagrado para ti
              </p>
              <button style={{
                background: 'transparent',
                border: `1px solid ${BRAND.criollo}55`,
                color: `${BRAND.heirloom}cc`, padding: '10px 22px', borderRadius: 999,
                cursor: 'pointer',
                fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
                fontSize: 11, letterSpacing: '0.12em',
              }}>
                🎵 Abrir meditación en Spotify
              </button>
            </div>

            {/* Action row */}
            <div style={{ display: 'flex', gap: 10, width: '100%' }}>
              <button onClick={() => {
                const text = `🫘 Mi arcana de hoy: ${selectedCard.name} — "${selectedCard.meaning}" · CAUA Ritual`
                if (navigator.share) navigator.share({ text })
                else navigator.clipboard.writeText(text)
              }} style={{
                flex: 1, padding: '12px', borderRadius: 10,
                background: '#132B1C', border: `1px solid ${BRAND.amazon}66`,
                color: `${BRAND.heirloom}cc`, cursor: 'pointer',
                fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
                fontSize: 11, letterSpacing: '0.1em',
              }}>Compartir ↗</button>

              <button onClick={() => { setPhase('intro'); setCard(null) }} style={{
                flex: 1, padding: '12px', borderRadius: 10,
                background: `${BRAND.pod}18`, border: `1px solid ${BRAND.pod}40`,
                color: BRAND.pod, cursor: 'pointer',
                fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
                fontSize: 11, letterSpacing: '0.1em',
              }}>Nueva tirada</button>
            </div>

            {/* Upsell — subtle */}
            <div style={{
              padding: '16px 20px', borderRadius: 12, width: '100%',
              background: '#0A1A0C', border: `1px solid ${BRAND.amazon}33`,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <span style={{ fontSize: 22 }}>🫘</span>
              <div>
                <div style={{
                  fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
                  color: BRAND.heirloom, fontSize: 12, letterSpacing: '0.08em',
                }}>Potencia tu ritual con cacao real</div>
                <button
                  onClick={() => navigate('/marketplace')}
                  style={{
                    background: 'none', border: 'none', padding: 0,
                    fontFamily: 'system-ui', fontSize: 11,
                    color: BRAND.pod, cursor: 'pointer', textDecoration: 'underline',
                  }}
                >
                  Ver Cacao Ceremonial Criollo →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
