import { useEffect, useRef, useState } from 'react'
import { BRAND, FONTS } from '../../utils/constants'

/**
 * ConchadoStage — horizontal back-and-forth swipes to mecer the conche tank.
 *
 * Mechanic:
 *   - User swipes horizontally inside the conche. Each direction reversal
 *     (left → right or right → left) counts as 1 cycle.
 *   - Target: 8 cycles to complete.
 *   - Visual: a tank shape with rolling rolls; chocolate inside slowly
 *     turns from matte brown → glossy darker brown as cycles accumulate.
 */

const CYCLES_TARGET = 8
// Minimum horizontal sweep (in px) before a reversal counts. Prevents
// flicker noise from registering as cycles.
const MIN_SWEEP_PX = 36

interface Props {
  onComplete: () => void
  lang?: 'es' | 'en'
}

export default function ConchadoStage({ onComplete, lang = 'es' }: Props) {
  const tankRef = useRef<HTMLDivElement | null>(null)
  const [cycles, setCycles] = useState(0)
  const [done, setDone] = useState(false)

  const pressedRef    = useRef(false)
  const lastXRef      = useRef<number | null>(null)
  // -1 = moving left, +1 = moving right, 0 = unset
  const lastDirRef    = useRef(0)
  // x at the most recent direction reversal (start of current sweep)
  const sweepOriginRef = useRef<number | null>(null)
  // Tank visual position — drifts with the user's pointer (gives the rocking feel).
  const [tankOffset, setTankOffset] = useState(0)

  function onDown(e: React.PointerEvent) {
    if (done) return
    pressedRef.current = true
    lastXRef.current = e.clientX
    sweepOriginRef.current = e.clientX
    lastDirRef.current = 0
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  function onMove(e: React.PointerEvent) {
    if (!pressedRef.current || done) return
    const x = e.clientX
    if (lastXRef.current === null) {
      lastXRef.current = x
      return
    }
    const dx = x - lastXRef.current
    lastXRef.current = x

    // Track tank offset for visual rocking — clamped to ±60px.
    setTankOffset(prev => Math.max(-60, Math.min(60, prev + dx * 0.6)))

    if (Math.abs(dx) < 1) return
    const newDir = dx > 0 ? 1 : -1

    if (lastDirRef.current === 0) {
      lastDirRef.current = newDir
      sweepOriginRef.current = x
      return
    }

    if (newDir !== lastDirRef.current) {
      // Direction reversal — only count if we swept at least MIN_SWEEP_PX
      // since the last reversal.
      const sweepLen = sweepOriginRef.current !== null
        ? Math.abs(x - sweepOriginRef.current)
        : 0
      if (sweepLen >= MIN_SWEEP_PX) {
        setCycles(c => {
          const next = c + 1
          if (next >= CYCLES_TARGET && !done) {
            setDone(true)
            onComplete()
          }
          return next
        })
      }
      lastDirRef.current = newDir
      sweepOriginRef.current = x
    }
  }

  function onUp() {
    pressedRef.current = false
    lastXRef.current = null
    lastDirRef.current = 0
    sweepOriginRef.current = null
  }

  // Tank settles back to center when the user lets go.
  useEffect(() => {
    if (pressedRef.current) return
    if (tankOffset === 0) return
    const id = setInterval(() => {
      setTankOffset(prev => {
        if (Math.abs(prev) < 0.5) return 0
        return prev * 0.85
      })
    }, 16)
    return () => clearInterval(id)
  }, [tankOffset])

  const progress = Math.min(1, cycles / CYCLES_TARGET)
  // Chocolate color shifts brown → glossy darker as conched.
  const chocColor    = `rgb(${88 - 30 * progress}, ${52 - 22 * progress}, ${22 - 12 * progress})`
  const chocHighlight = `rgb(${140 - 30 * progress}, ${85 - 25 * progress}, ${40 - 18 * progress})`

  return (
    <div style={{
      position: 'relative',
      background: `linear-gradient(160deg, #150A04 0%, #050201 100%)`,
      border: `1px solid ${done ? BRAND.mazorca : `${BRAND.brown}aa`}`,
      borderRadius: 16,
      padding: 'clamp(20px, 4vw, 32px)',
      minHeight: 320,
      transition: 'border-color 0.3s, box-shadow 0.3s',
      boxShadow: done ? `0 0 32px ${BRAND.mazorca}55` : `inset 0 0 16px ${BRAND.brown}22`,
    }}>
      <div style={{
        fontFamily: FONTS.display, fontWeight: 800, fontSize: 10,
        color: BRAND.brown, letterSpacing: '0.22em',
        textTransform: 'uppercase', marginBottom: 4, textAlign: 'center',
      }}>
        Etapa 3 · Conchado
      </div>
      <div style={{
        fontFamily: FONTS.serif, fontStyle: 'italic',
        color: `${BRAND.heirloom}88`, fontSize: 12,
        textAlign: 'center', marginBottom: 24,
      }}>
        {lang === 'es'
          ? `Mécelo lado a lado · ${cycles} / ${CYCLES_TARGET} ciclos`
          : `Rock it side to side · ${cycles} / ${CYCLES_TARGET} cycles`}
      </div>

      <div
        ref={tankRef}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        style={{
          position: 'relative',
          width: '100%',
          height: 180,
          background: '#0008',
          borderRadius: 16,
          border: `1.5px solid ${BRAND.brown}66`,
          overflow: 'hidden',
          touchAction: 'none', userSelect: 'none',
          cursor: done ? 'default' : 'ew-resize',
          boxShadow: `inset 0 0 24px #00000099`,
          marginBottom: 20,
        }}
      >
        {/* Conche bowl — a horizontal capsule that rocks side to side */}
        <div style={{
          position: 'absolute',
          left: '50%', top: '50%',
          transform: `translate(calc(-50% + ${tankOffset}px), -50%) rotate(${tankOffset * 0.05}deg)`,
          width: '78%',
          height: 110,
          background: `linear-gradient(180deg, ${BRAND.brown} 0%, #2A1A0B 100%)`,
          border: `2px solid ${BRAND.brown}cc`,
          borderRadius: '60% / 30%',
          boxShadow: `inset 0 4px 12px #00000088, 0 4px 16px ${BRAND.brown}66`,
          transition: 'transform 0.06s linear',
          overflow: 'hidden',
        }}>
          {/* Chocolate liquid inside — shifts color as cycles accumulate */}
          <div style={{
            position: 'absolute',
            inset: '12px 16px',
            background: `linear-gradient(180deg, ${chocHighlight} 0%, ${chocColor} 70%, #1A0F08 100%)`,
            borderRadius: '50% / 25%',
            boxShadow: progress > 0.5 ? `inset 0 8px 16px #ffffff22, 0 0 8px ${BRAND.mazorca}33` : 'inset 0 4px 8px #00000088',
            transition: 'background 0.4s, box-shadow 0.4s',
          }}>
            {/* Surface ripple — moves with the rocking */}
            <div style={{
              position: 'absolute',
              top: 4, left: 12, right: 12, height: 4,
              background: `linear-gradient(90deg, transparent, ${chocHighlight}aa, transparent)`,
              borderRadius: 999,
              transform: `translateX(${tankOffset * 0.3}px)`,
              transition: 'transform 0.06s linear',
            }} />
          </div>

          {/* Two roller cylinders — visual rolling indicator */}
          {[35, 65].map(pct => (
            <div key={pct} style={{
              position: 'absolute',
              left: `${pct}%`, top: '50%',
              transform: `translate(-50%, -50%) rotate(${tankOffset * 4}deg)`,
              width: 24, height: 24, borderRadius: '50%',
              background: `radial-gradient(circle at 30% 30%, ${BRAND.heirloom}66 0%, ${BRAND.brown} 60%, #1A0F08 100%)`,
              border: `1px solid ${BRAND.heirloom}33`,
              boxShadow: `inset -2px -2px 4px #00000088`,
              transition: 'transform 0.08s linear',
            }} />
          ))}
        </div>

        {/* Hint when no cycles yet */}
        {cycles === 0 && !done && (
          <div style={{
            position: 'absolute', bottom: 8, left: 0, right: 0,
            textAlign: 'center', pointerEvents: 'none',
            fontFamily: FONTS.serif, fontStyle: 'italic',
            color: `${BRAND.heirloom}55`, fontSize: 11,
            letterSpacing: '0.05em',
          }}>
            ↔ {lang === 'es' ? 'Arrastra de un lado al otro' : 'Drag side to side'}
          </div>
        )}
      </div>

      {/* Viscosity / smoothness bar */}
      <div>
        <div style={{
          fontFamily: FONTS.display, fontWeight: 700, fontSize: 9,
          color: `${BRAND.heirloom}88`, letterSpacing: '0.16em',
          textTransform: 'uppercase', marginBottom: 6, textAlign: 'center',
        }}>
          {lang === 'es' ? 'Sedosidad · ' : 'Smoothness · '}{Math.round(progress * 100)}%
        </div>
        <div style={{ width: '100%', height: 8, background: '#0006', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{
            width: `${progress * 100}%`, height: '100%',
            background: `linear-gradient(90deg, ${BRAND.brown}, ${BRAND.mazorca})`,
            transition: 'width 0.2s ease-out',
            boxShadow: progress > 0.95 ? `0 0 12px ${BRAND.mazorca}cc` : 'none',
          }} />
        </div>
      </div>
    </div>
  )
}
