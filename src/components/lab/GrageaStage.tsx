import { useState, useRef } from 'react'
import { BRAND, FONTS } from '../../utils/constants'

/**
 * GrageaStage — grageadora espacial para NIBS.
 *
 * Mecánica: toca el tambor 10 veces para completar el recubrimiento.
 * Cada toque gira el tambor y añade una capa de chocolate blanco funcional
 * sobre los granos de cacao morado liofilizado.
 *
 * Producto: NIBS CAÚA — grano bioactivo (polifenoles, interior morado)
 * recubierto en cobertura de chocolate blanco funcional.
 */

const TAPS_TARGET = 10
const NIBS_COUNT  = 18  // number of visible nibs in the drum

interface Props {
  onComplete: () => void
  lang?: 'es' | 'en'
}

// Static positions for nibs (seeded, consistent)
const NIB_POSITIONS = Array.from({ length: NIBS_COUNT }, (_, i) => {
  const angle = (i / NIBS_COUNT) * Math.PI * 2 + Math.sin(i * 7.3) * 0.4
  const radius = 28 + Math.sin(i * 13.7) * 20
  return {
    x: 50 + Math.cos(angle) * radius,
    y: 50 + Math.sin(angle) * radius,
  }
})

export default function GrageaStage({ onComplete, lang = 'es' }: Props) {
  const [taps, setTaps]             = useState(0)
  const [done, setDone]             = useState(false)
  const [rotation, setRotation]     = useState(0)
  const [spinning, setSpinning]     = useState(false)
  const spinTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const progress = taps / TAPS_TARGET

  function handleTap() {
    if (done) return

    const next = taps + 1
    setTaps(next)
    setRotation(r => r + 36 + Math.random() * 12)

    // Brief spin animation on tap
    setSpinning(true)
    clearTimeout(spinTimerRef.current)
    spinTimerRef.current = setTimeout(() => setSpinning(false), 400)

    if (next >= TAPS_TARGET) {
      setDone(true)
    }
  }

  // Nib color: interpolate from criollo purple → heirloom white as progress grows
  function nibColor(i: number): string {
    // Each nib gets coated at a different progress threshold
    const coatAt = (i + 1) / NIBS_COUNT
    return progress >= coatAt ? '#F7F1EE' : '#8D2679'
  }

  function nibStroke(i: number): string {
    const coatAt = (i + 1) / NIBS_COUNT
    return progress >= coatAt ? '#C8B8A0' : '#6B1A5A'
  }

  const blocksTotal = 10
  const blocksFilled = Math.round(progress * blocksTotal)
  const bar = '■'.repeat(blocksFilled) + '□'.repeat(blocksTotal - blocksFilled)

  return (
    <div style={{
      background: '#0D1F14',
      border: `1px solid #8D267944`,
      borderRadius: 12,
      padding: 'clamp(16px, 4vw, 24px)',
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
    }}>

      {/* Eyebrow */}
      <div style={{
        fontFamily: "'Press Start 2P', monospace", fontSize: 6,
        color: '#8D2679', letterSpacing: '0.18em', textTransform: 'uppercase',
      }}>
        {lang === 'es' ? 'FASE 4 · GRAGEADORA ESPACIAL' : 'PHASE 4 · SPACE DRAGÉE MACHINE'}
      </div>

      {/* Title */}
      <div>
        <h3 style={{
          fontFamily: "'Barlow Condensed', Impact, sans-serif", fontWeight: 900,
          fontSize: 'clamp(26px, 5vw, 34px)', color: '#F7F1EE',
          textTransform: 'uppercase', margin: '0 0 6px', lineHeight: 1,
        }}>
          {lang === 'es' ? 'Recubriendo NIBS' : 'Coating NIBS'}
        </h3>
        <p style={{
          fontFamily: FONTS.body, color: `${BRAND.heirloom}77`,
          fontSize: 12, margin: 0, lineHeight: 1.55,
        }}>
          {lang === 'es'
            ? 'Cacao morado liofilizado · bioactivo · cobertura chocolate blanco funcional'
            : 'Lyophilized purple cacao · bioactive · white functional chocolate coating'}
        </p>
      </div>

      {/* Drum — the main interactive element */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>

        {/* Chocolate "waterfall" — drip source above drum */}
        <div style={{
          width: 3, height: 16,
          background: `linear-gradient(180deg, #F7F1EE88, #F7F1EE00)`,
          borderRadius: 999,
          opacity: spinning ? 1 : 0.4,
          transition: 'opacity 0.3s',
        }} />

        {/* Drum circle */}
        <button
          onClick={handleTap}
          disabled={done}
          aria-label={lang === 'es' ? 'Girar grageadora' : 'Spin dragée machine'}
          style={{
            width: 180, height: 180, borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #1A3A22, #0A1810)',
            border: `4px solid ${done ? '#91A63B' : '#8D2679'}`,
            boxShadow: done
              ? `0 0 32px #91A63B44, inset 0 0 20px #091408`
              : `0 0 24px #8D267944, inset 0 0 20px #091408`,
            cursor: done ? 'default' : 'pointer',
            position: 'relative',
            overflow: 'hidden',
            transition: 'border-color 0.4s, box-shadow 0.4s',
            padding: 0,
          }}
          onMouseDown={e => {
            if (!done) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.96)'
          }}
          onMouseUp={e => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'
          }}
        >
          {/* SVG nibs rotating inside the drum */}
          <svg
            viewBox="0 0 100 100"
            width="100%"
            height="100%"
            style={{
              position: 'absolute', inset: 0,
              transform: `rotate(${rotation}deg)`,
              transition: spinning ? 'transform 0.35s cubic-bezier(0.2, 0.9, 0.4, 1)' : 'none',
            }}
          >
            {NIB_POSITIONS.map((pos, i) => (
              <ellipse
                key={i}
                cx={pos.x}
                cy={pos.y}
                rx={4.5}
                ry={3}
                transform={`rotate(${i * 20}, ${pos.x}, ${pos.y})`}
                fill={nibColor(i)}
                stroke={nibStroke(i)}
                strokeWidth={0.5}
                style={{ transition: 'fill 0.6s ease, stroke 0.6s ease' }}
              />
            ))}
          </svg>

          {/* White chocolate flow overlay (fades in as progress grows) */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: `radial-gradient(circle at 50% 20%, #F7F1EE${Math.round(progress * 80).toString(16).padStart(2,'0')}, transparent 65%)`,
            pointerEvents: 'none',
            transition: 'background 0.5s',
          }} />

          {/* Center label */}
          {!done && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: 4,
            }}>
              <div style={{
                fontFamily: "'Press Start 2P', monospace", fontSize: 7,
                color: `#8D2679${taps === 0 ? 'CC' : '44'}`,
                letterSpacing: '0.06em',
                transition: 'color 0.3s',
              }}>
                {taps === 0 ? (lang === 'es' ? 'GIRAR' : 'SPIN') : ''}
              </div>
            </div>
          )}

          {/* Done check */}
          {done && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{
                fontFamily: "'Press Start 2P', monospace", fontSize: 14,
                color: '#91A63B',
              }}>✓</div>
            </div>
          )}
        </button>

        {/* Tap hint */}
        {taps === 0 && (
          <p style={{
            fontFamily: FONTS.serif, fontStyle: 'italic',
            color: `${BRAND.heirloom}44`, fontSize: 11,
            letterSpacing: '0.06em', margin: 0, textAlign: 'center',
          }}>
            {lang === 'es' ? '↻ Toca el tambor para girar' : '↻ Tap the drum to spin'}
          </p>
        )}
      </div>

      {/* Cobertura progress bar */}
      <div>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 6,
        }}>
          <div style={{
            fontFamily: "'Press Start 2P', monospace", fontSize: 6,
            color: `${BRAND.heirloom}55`, letterSpacing: '0.14em',
          }}>
            {lang === 'es' ? 'COBERTURA' : 'COATING'}
          </div>
          <div style={{
            fontFamily: "'Press Start 2P', monospace", fontSize: 6,
            color: done ? '#91A63B' : '#8D2679',
          }}>
            {Math.round(progress * 100)}%
          </div>
        </div>
        <div style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 8, letterSpacing: '0.04em',
          color: done ? '#91A63B' : '#8D2679',
        }}>
          {bar}
        </div>
      </div>

      {/* Complete CTA */}
      {done && (
        <button
          onClick={onComplete}
          style={{
            width: '100%', padding: '14px 20px',
            background: 'linear-gradient(135deg, #8D2679, #DB5527)',
            border: 'none', borderRadius: 8, cursor: 'pointer',
            fontFamily: "'Press Start 2P', monospace", fontSize: 8,
            color: '#F7F1EE', letterSpacing: '0.12em',
            boxShadow: '0 0 24px #8D267966',
            animation: 'forge-glow 2s infinite',
          }}
        >
          {lang === 'es' ? '🔮 GRAGEA LISTA →' : '🔮 COATING DONE →'}
        </button>
      )}
    </div>
  )
}
