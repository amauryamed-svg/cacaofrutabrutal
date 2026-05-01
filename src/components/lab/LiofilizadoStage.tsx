import { useEffect, useRef, useState } from 'react'
import { BRAND, FONTS } from '../../utils/constants'

/**
 * LiofilizadoStage — freeze-drying chamber. Tap-and-hold to lower temperature
 * from 25°C to -50°C. Hold steady at target for HOLD_MS to complete.
 *
 * State + raf in a single unified update so we don't trip
 * react-hooks/set-state-in-effect with cascading conditional setState.
 */

const TEMP_START   = 25
const TEMP_TARGET  = -50
const TEMP_FLOOR   = -55
const COOL_RATE    = 1.0 / 50   // °C per ms while held
const WARM_RATE    = 0.7 / 50
const HOLD_MS      = 1200

interface Props {
  onComplete: () => void
  lang?: 'es' | 'en'
}

interface LabState {
  temp:   number
  holdMs: number
  done:   boolean
}

export default function LiofilizadoStage({ onComplete, lang = 'es' }: Props) {
  const [s, setS] = useState<LabState>({ temp: TEMP_START, holdMs: 0, done: false })
  const [pressed, setPressed] = useState(false)

  // Refs for raf-only reads (allowed outside render).
  const pressedRef = useRef(false)

  useEffect(() => {
    let raf = 0
    let lastT: number | null = null
    const loop = (t: number) => {
      if (lastT === null) lastT = t
      const dt = t - lastT
      lastT = t
      setS(prev => {
        if (prev.done) return prev
        const delta = pressedRef.current ? -COOL_RATE * dt : WARM_RATE * dt
        const nextTemp = Math.max(TEMP_FLOOR, Math.min(TEMP_START, prev.temp + delta))
        let nextHold: number = prev.holdMs
        let nextDone: boolean = prev.done
        if (nextTemp <= TEMP_TARGET) {
          nextHold = Math.min(HOLD_MS, nextHold + dt)
          if (nextHold >= HOLD_MS) nextDone = true
        } else {
          nextHold = 0
        }
        if (nextTemp === prev.temp && nextHold === prev.holdMs && nextDone === prev.done) {
          return prev
        }
        return { temp: nextTemp, holdMs: nextHold, done: nextDone }
      })
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  // Fire onComplete once when state.done flips true.
  useEffect(() => {
    if (s.done) onComplete()
  }, [s.done, onComplete])

  const setBoth = (v: boolean) => { pressedRef.current = v; setPressed(v) }

  const tempPct  = (s.temp - TEMP_FLOOR) / (TEMP_START - TEMP_FLOOR)
  const atTarget = s.temp <= TEMP_TARGET
  const holdPct  = Math.min(1, s.holdMs / HOLD_MS)

  return (
    <div style={{
      position: 'relative',
      background: `linear-gradient(160deg, #0A1A1F 0%, #040C0E 100%)`,
      border: `1px solid ${atTarget ? '#7DD3FC' : `${BRAND.heroic}55`}`,
      borderRadius: 16,
      padding: 'clamp(20px, 4vw, 32px)',
      minHeight: 320,
      overflow: 'hidden',
      transition: 'border-color 0.3s, box-shadow 0.3s',
      boxShadow: atTarget ? `0 0 32px #7DD3FC44, inset 0 0 24px #7DD3FC22` : `inset 0 0 16px ${BRAND.heroic}11`,
    }}>
      <div style={{
        fontFamily: FONTS.display, fontWeight: 800, fontSize: 10,
        color: BRAND.heroic, letterSpacing: '0.22em',
        textTransform: 'uppercase', marginBottom: 4, textAlign: 'center',
      }}>
        Etapa 1 · Liofilización
      </div>
      <div style={{
        fontFamily: FONTS.serif, fontStyle: 'italic',
        color: `${BRAND.heirloom}88`, fontSize: 12,
        textAlign: 'center', marginBottom: 24,
      }}>
        {lang === 'es'
          ? 'Mantén presionada la cámara hasta -50°C · 1.2s'
          : 'Hold the chamber until -50°C · 1.2s'}
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20,
        marginBottom: 24,
      }}>
        {/* Thermometer */}
        <div style={{
          width: 28, height: 200,
          background: '#0006',
          border: `1.5px solid ${BRAND.heroic}88`,
          borderRadius: 14,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: `inset 0 0 8px ${BRAND.heroic}33`,
        }}>
          <div style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            height: `${tempPct * 100}%`,
            background: s.temp > 0
              ? `linear-gradient(180deg, ${BRAND.theobroma} 0%, ${BRAND.mazorca} 100%)`
              : `linear-gradient(180deg, ${BRAND.heroic} 0%, #7DD3FC 100%)`,
            transition: 'height 0.05s linear, background 0.3s',
          }} />
          {[
            { temp: 25,  label: '25' },
            { temp: 0,   label: '0' },
            { temp: -50, label: '-50' },
          ].map(m => {
            const y = (1 - (m.temp - TEMP_FLOOR) / (TEMP_START - TEMP_FLOOR)) * 100
            return (
              <div key={m.temp} style={{
                position: 'absolute', top: `${y}%`, left: '100%', marginLeft: 8,
                transform: 'translateY(-50%)',
                fontFamily: FONTS.display, fontWeight: 700, fontSize: 9,
                color: `${BRAND.heirloom}66`, letterSpacing: '0.04em',
                whiteSpace: 'nowrap',
              }}>
                {m.label}°
              </div>
            )
          })}
          <div style={{
            position: 'absolute',
            top: `${(1 - (TEMP_TARGET - TEMP_FLOOR) / (TEMP_START - TEMP_FLOOR)) * 100}%`,
            left: -4, right: -4, height: 2,
            background: '#7DD3FC',
            boxShadow: `0 0 8px #7DD3FCaa`,
          }} />
        </div>

        {/* Chamber */}
        <button
          onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture(e.pointerId); setBoth(true) }}
          onPointerUp={()     => setBoth(false)}
          onPointerCancel={() => setBoth(false)}
          onPointerLeave={()  => setBoth(false)}
          disabled={s.done}
          style={{
            width: 180, height: 200,
            background: `radial-gradient(ellipse at 50% 30%, ${atTarget ? '#7DD3FC22' : '#0E1E15'} 0%, #040C06 80%)`,
            border: `2px solid ${atTarget ? '#7DD3FC' : BRAND.amazon}`,
            borderRadius: 14,
            position: 'relative',
            cursor: s.done ? 'default' : 'pointer',
            touchAction: 'none', userSelect: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.3s, border-color 0.3s',
            boxShadow: atTarget ? `0 0 24px #7DD3FC55, inset 0 0 32px #7DD3FC22` : `inset 0 0 16px #00000088`,
          }}
        >
          <div style={{
            fontSize: 64,
            opacity: 0.85,
            filter: atTarget ? 'drop-shadow(0 0 12px #7DD3FCcc) hue-rotate(-30deg)' : 'none',
            transition: 'filter 0.3s',
          }}>
            🍫
          </div>

          {pressed && s.temp < 0 && (
            <>
              {[0, 1, 2, 3].map(i => (
                <span key={i} style={{
                  position: 'absolute',
                  left: `${20 + i * 20}%`,
                  top: 8,
                  fontSize: 14,
                  opacity: 0.5,
                  animation: `caua-vapor-rise 1.${i + 2}s ease-out infinite`,
                  pointerEvents: 'none',
                }}>
                  ❄
                </span>
              ))}
            </>
          )}
        </button>
      </div>

      <div style={{
        width: '100%', height: 8, background: '#0006', borderRadius: 999,
        overflow: 'hidden', marginBottom: 8,
      }}>
        <div style={{
          width: `${holdPct * 100}%`, height: '100%',
          background: atTarget
            ? `linear-gradient(90deg, ${BRAND.heroic}, #7DD3FC)`
            : `${BRAND.heroic}66`,
          transition: 'width 0.05s linear',
          boxShadow: atTarget ? `0 0 12px #7DD3FCaa` : 'none',
        }} />
      </div>

      <div style={{
        textAlign: 'center',
        fontFamily: FONTS.display, fontWeight: 800,
        fontSize: 22, color: s.temp <= 0 ? '#7DD3FC' : BRAND.mazorca,
        letterSpacing: '0.04em',
        textShadow: s.temp <= 0 ? `0 0 12px #7DD3FCcc` : 'none',
        transition: 'color 0.3s, text-shadow 0.3s',
      }}>
        {s.temp.toFixed(1)}°C
      </div>

      <style>{`
        @keyframes caua-vapor-rise {
          0%   { transform: translateY(0)    scale(0.8); opacity: 0.5; }
          50%  { transform: translateY(-30px) scale(1.2); opacity: 0.3; }
          100% { transform: translateY(-60px) scale(1.4); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
