import { useMemo, useRef, useState } from 'react'
import { BRAND, FONTS } from '../../utils/constants'

/**
 * RefinadoStage — circular drag to grind cacao mass to fine particles.
 *
 * Mechanic:
 *   - User drags the drum in a circle (any direction). We track the angular
 *     position of the pointer relative to the drum center; each full
 *     revolution counts as 1 turn.
 *   - Target: 5 turns to complete.
 *   - Drum rotates visually with the pointer.
 *   - Particle size visualization shrinks proportionally to progress.
 */

const TURNS_TARGET = 5
const FULL_ROT     = 2 * Math.PI

interface Props {
  onComplete: () => void
  lang?: 'es' | 'en'
}

export default function RefinadoStage({ onComplete, lang = 'es' }: Props) {
  const drumRef = useRef<HTMLDivElement | null>(null)
  const [angle, setAngle]  = useState(0)         // current drum rotation (radians)
  const [turns, setTurns]  = useState(0)         // accumulated full revolutions
  const [done, setDone]    = useState(false)

  const pressedRef = useRef(false)
  const lastAngleRef = useRef<number | null>(null)
  const totalSweepRef = useRef(0)  // total radians swept (signed)

  function pointerAngle(e: React.PointerEvent | PointerEvent): number | null {
    if (!drumRef.current) return null
    const r = drumRef.current.getBoundingClientRect()
    const cx = r.left + r.width / 2
    const cy = r.top  + r.height / 2
    return Math.atan2(e.clientY - cy, e.clientX - cx)
  }

  function onDown(e: React.PointerEvent) {
    if (done) return
    pressedRef.current = true
    lastAngleRef.current = pointerAngle(e)
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  function onMove(e: React.PointerEvent) {
    if (!pressedRef.current || done) return
    const a = pointerAngle(e)
    if (a === null || lastAngleRef.current === null) {
      lastAngleRef.current = a
      return
    }
    // Shortest-arc delta — handles the ±π wrap.
    let delta = a - lastAngleRef.current
    if (delta >  Math.PI) delta -= 2 * Math.PI
    if (delta < -Math.PI) delta += 2 * Math.PI
    lastAngleRef.current = a
    totalSweepRef.current += Math.abs(delta)  // count motion in either direction
    setAngle(prev => prev + delta)
    const t = totalSweepRef.current / FULL_ROT
    setTurns(t)
    if (t >= TURNS_TARGET && !done) {
      setDone(true)
      onComplete()
    }
  }

  function onUp() {
    pressedRef.current = false
    lastAngleRef.current = null
  }

  // Particle size — start big, shrink to ~25% as user grinds.
  const progress = Math.min(1, turns / TURNS_TARGET)
  const particleScale = 1 - progress * 0.7  // 1 → 0.3

  // Pre-compute particle positions inside the drum (8 random spots) via
  // useMemo so render can read them safely (ref access during render is
  // disallowed under react-hooks/refs).
  const particles = useMemo(
    () => Array.from({ length: 8 }, (_, i) => ({
      x: 30 + (i * 23) % 70,
      y: 30 + ((i * 41) % 70),
      tilt: ((i * 17) % 60) - 30,
    })),
    [],
  )

  return (
    <div style={{
      position: 'relative',
      background: `linear-gradient(160deg, #1A0F08 0%, #050201 100%)`,
      border: `1px solid ${done ? BRAND.mazorca : `${BRAND.brown}aa`}`,
      borderRadius: 16,
      padding: 'clamp(20px, 4vw, 32px)',
      minHeight: 320,
      transition: 'border-color 0.3s, box-shadow 0.3s',
      boxShadow: done ? `0 0 32px ${BRAND.mazorca}44` : `inset 0 0 16px ${BRAND.brown}22`,
    }}>
      <div style={{
        fontFamily: FONTS.display, fontWeight: 800, fontSize: 10,
        color: BRAND.mazorca, letterSpacing: '0.22em',
        textTransform: 'uppercase', marginBottom: 4, textAlign: 'center',
      }}>
        Etapa 2 · Refinado
      </div>
      <div style={{
        fontFamily: FONTS.serif, fontStyle: 'italic',
        color: `${BRAND.heirloom}88`, fontSize: 12,
        textAlign: 'center', marginBottom: 24,
      }}>
        {lang === 'es'
          ? `Gira el tambor en círculo · ${turns.toFixed(1)} / ${TURNS_TARGET} vueltas`
          : `Drag the drum in a circle · ${turns.toFixed(1)} / ${TURNS_TARGET} turns`}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div
          ref={drumRef}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          style={{
            width: 200, height: 200,
            borderRadius: '50%',
            background: `conic-gradient(from ${angle}rad, ${BRAND.brown} 0deg, ${BRAND.mazorca}88 60deg, ${BRAND.brown} 120deg, ${BRAND.mazorca}88 180deg, ${BRAND.brown} 240deg, ${BRAND.mazorca}88 300deg, ${BRAND.brown} 360deg)`,
            border: `3px solid ${done ? BRAND.mazorca : BRAND.brown}`,
            cursor: done ? 'default' : 'grab',
            touchAction: 'none', userSelect: 'none',
            position: 'relative',
            boxShadow: `inset 0 0 20px #00000099, 0 8px 24px ${BRAND.brown}66`,
            transform: `rotate(${angle}rad)`,
            transition: 'border-color 0.3s, box-shadow 0.3s',
          }}
        >
          {/* Cacao particles inside the drum */}
          {particles.map((p, i) => (
            <div key={i} style={{
              position: 'absolute',
              left:  `${p.x}%`, top: `${p.y}%`,
              transform: `translate(-50%, -50%) rotate(${p.tilt}deg) scale(${particleScale})`,
              width: 8, height: 12,
              background: '#3D200E',
              borderRadius: '50% 50% 40% 40%',
              boxShadow: '0 1px 2px #00000088',
              transition: 'transform 0.3s',
              pointerEvents: 'none',
            }} />
          ))}

          {/* Center pivot indicator */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 16, height: 16, borderRadius: 999,
            background: BRAND.bgDeep,
            border: `2px solid ${BRAND.mazorca}88`,
            boxShadow: `0 0 8px ${BRAND.mazorca}88`,
          }} />

          {/* Hint arrow when no movement yet */}
          {turns < 0.1 && !done && (
            <div style={{
              position: 'absolute', top: 8, left: '50%',
              transform: 'translateX(-50%)',
              fontSize: 18, opacity: 0.7,
              animation: 'caua-refinado-hint 1.6s ease-in-out infinite',
              pointerEvents: 'none',
            }}>
              ↻
            </div>
          )}
        </div>
      </div>

      {/* Fineness progress bar */}
      <div style={{ marginTop: 24 }}>
        <div style={{
          fontFamily: FONTS.display, fontWeight: 700, fontSize: 9,
          color: `${BRAND.heirloom}88`, letterSpacing: '0.16em',
          textTransform: 'uppercase', marginBottom: 6, textAlign: 'center',
        }}>
          {lang === 'es' ? 'Fineza · ' : 'Fineness · '}{Math.round(progress * 100)}%
        </div>
        <div style={{ width: '100%', height: 8, background: '#0006', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{
            width: `${progress * 100}%`, height: '100%',
            background: `linear-gradient(90deg, ${BRAND.brown}, ${BRAND.mazorca})`,
            transition: 'width 0.1s linear',
            boxShadow: progress > 0.95 ? `0 0 12px ${BRAND.mazorca}aa` : 'none',
          }} />
        </div>
      </div>

      <style>{`
        @keyframes caua-refinado-hint {
          0%, 100% { transform: translateX(-50%) rotate(0deg);   opacity: 0.7; }
          50%      { transform: translateX(-50%) rotate(180deg); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
