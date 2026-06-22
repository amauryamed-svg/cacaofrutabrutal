import { useEffect, useRef, useState } from 'react'
import { BRAND, FONTS } from '../../utils/constants'
import LivingTree from '../dashboard/LivingTree'
import ColombiaMap from '../ui/ColombiaMap'

/**
 * Adopta intro — cinematic cold-open played the first time a user lands on
 * `/adoptar` in a browser session. Five sequential acts, CSS keyframes only
 * (no framer-motion per CauaCore §8 — divergence from AppIntro deliberate).
 *
 * Acts (4.6s nominal, 5.5s hard cap):
 *   0 — silencio       0–200ms     bgDeep + grain
 *   1 — horizon        200–900     mountain silhouette rises (radial wash)
 *   2 — seed           900–2100    LivingTree stage=0 fades in centered
 *   3 — guardian       2100–3300   ColombiaMap with first guardian pin appears
 *   4 — headline-lock  3300–4200   "ADOPTA UN ÁRBOL DE CACAO" + green sweep
 *   5 — cta            4200–4600   "Desliza para conocerlos →" pulses
 *
 * Skips: click anywhere, scroll, Escape, pointerdown.
 * Replay: ?intro=play (clears sessionStorage flag).
 * sessionStorage key: `caua.adopta.intro.v1`.
 * prefers-reduced-motion → instant skip on mount.
 *
 * Sister-mounting-point pattern: this component renders nothing if it's
 * already played in this session. Safe to mount unconditionally at the top of
 * `Adoptar.tsx`.
 */

const HARD_CAP_MS = 5500
const SS_KEY = 'caua.adopta.intro.v1'

const ACT_AT = {
  horizon: 200,
  seed:    900,
  guardian: 2100,
  lock:    3300,
  cta:     4200,
  done:    4600,
}

let hasPlayed = false
if (import.meta.hot) {
  import.meta.hot.accept(() => { hasPlayed = false })
}

export default function AdoptaIntro({ onDone }: { onDone?: () => void }) {
  const [phase, setPhase] = useState<'pre' | 'play' | 'fadeout' | 'done'>(() => {
    if (typeof window === 'undefined') return 'done'
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return 'done'
    const url = new URL(window.location.href)
    const force = url.searchParams.get('intro') === 'play'
    if (force) {
      try { sessionStorage.removeItem(SS_KEY) } catch { /* noop */ }
      hasPlayed = false
    }
    let alreadyPlayed = hasPlayed
    if (!alreadyPlayed) {
      try {
        if (sessionStorage.getItem(SS_KEY) === '1') alreadyPlayed = true
      } catch { /* noop */ }
    }
    if (alreadyPlayed) return 'done'
    hasPlayed = true
    try { sessionStorage.setItem(SS_KEY, '1') } catch { /* noop */ }
    return 'play'
  })

  const [tick, setTick] = useState(0)
  const startedAtRef = useRef<number | null>(null)

  // Drive the act state via timestamps from start.
  useEffect(() => {
    if (phase !== 'play') return
    startedAtRef.current = Date.now()
    let raf = 0
    const loop = () => {
      setTick(Date.now() - (startedAtRef.current ?? Date.now()))
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [phase])

  // Hard cap + scheduled fadeout at ACT_AT.done.
  useEffect(() => {
    if (phase !== 'play') return
    const t1 = window.setTimeout(() => setPhase('fadeout'), ACT_AT.done)
    const t2 = window.setTimeout(() => setPhase('done'), HARD_CAP_MS + 600)
    return () => { window.clearTimeout(t1); window.clearTimeout(t2) }
  }, [phase])

  // Final fade.
  useEffect(() => {
    if (phase !== 'fadeout') return
    const t = window.setTimeout(() => {
      setPhase('done')
      onDone?.()
    }, 600)
    return () => window.clearTimeout(t)
  }, [phase, onDone])

  // Skip listeners — click / scroll / Escape / pointerdown.
  useEffect(() => {
    if (phase !== 'play' && phase !== 'fadeout') return
    const skip = () => setPhase('fadeout')
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') skip()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('scroll', skip, { passive: true, once: true })
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', skip)
    }
  }, [phase])

  // Lock body scroll while playing.
  useEffect(() => {
    if (phase !== 'play') return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [phase])

  if (phase === 'done') return null

  const since = (act: keyof typeof ACT_AT) => tick >= ACT_AT[act]

  return (
    <div
      role="presentation"
      onClick={() => setPhase('fadeout')}
      onPointerDown={() => setPhase('fadeout')}
      tabIndex={0}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: BRAND.bgDeep,
        cursor: 'pointer',
        overflow: 'hidden',
        opacity: phase === 'fadeout' ? 0 : 1,
        transition: 'opacity 600ms ease-in',
      }}
      aria-hidden="true"
    >
      {/* Keyframes — scoped via id to avoid global pollution. */}
      <style>{`
        @keyframes ai-horizon-rise {
          0%   { transform: translateY(36px); opacity: 0; }
          100% { transform: translateY(0);    opacity: 1; }
        }
        @keyframes ai-fade-up {
          0%   { transform: translateY(18px); opacity: 0; }
          100% { transform: translateY(0);    opacity: 1; }
        }
        @keyframes ai-sweep {
          0%   { transform: scaleX(0); }
          100% { transform: scaleX(1); }
        }
        @keyframes ai-cta-pulse {
          0%, 100% { opacity: 0.55; transform: translateY(0); }
          50%      { opacity: 1;    transform: translateY(-2px); }
        }
        @keyframes ai-seed-glow {
          0%, 100% { filter: drop-shadow(0 0 6px ${BRAND.pod}55); }
          50%      { filter: drop-shadow(0 0 20px ${BRAND.pod}aa); }
        }
      `}</style>

      {/* Act 1 — Horizon: radial wash mountain silhouette rises from below. */}
      {since('horizon') && (
        <div
          style={{
            position: 'absolute',
            left: 0, right: 0, bottom: 0, height: '60%',
            background: `radial-gradient(ellipse at 50% 100%, ${BRAND.amazon}aa 0%, ${BRAND.bgDeep} 70%)`,
            animation: 'ai-horizon-rise 700ms cubic-bezier(0.16,1,0.3,1) both',
          }}
        />
      )}

      {/* Act 2 — Seed: LivingTree stage=0 centered. */}
      {since('seed') && (
        <div
          style={{
            position: 'absolute',
            left: 0, right: 0, top: '32%',
            display: 'flex',
            justifyContent: 'center',
            animation: 'ai-fade-up 1200ms cubic-bezier(0.16,1,0.3,1) both',
          }}
        >
          <div
            style={{
              width: 'min(220px, 36vw)',
              animation: 'ai-seed-glow 2400ms ease-in-out infinite',
            }}
          >
            <LivingTree stage={0} health={80} moisture={70} sunlight={60} />
          </div>
        </div>
      )}

      {/* Act 3 — Guardian silhouette + eyebrow line. */}
      {since('guardian') && (
        <div
          style={{
            position: 'absolute',
            left: 0, right: 0, top: '12%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 14,
            animation: 'ai-fade-up 1100ms cubic-bezier(0.16,1,0.3,1) both',
          }}
        >
          <div
            style={{
              fontFamily: FONTS.serif,
              fontStyle: 'italic',
              color: `${BRAND.heirloom}cc`,
              fontSize: 'clamp(14px, 2.4vw, 20px)',
              letterSpacing: '0.02em',
            }}
          >
            cinco guardianes te esperan
          </div>
          <div style={{ opacity: 0.55 }}>
            <ColombiaMap region="Huila" size={140} showTerrain />
          </div>
        </div>
      )}

      {/* Act 4 — Headline lock + sweep underline. */}
      {since('lock') && (
        <div
          style={{
            position: 'absolute',
            left: 0, right: 0, top: '70%',
            textAlign: 'center',
            animation: 'ai-fade-up 900ms cubic-bezier(0.16,1,0.3,1) both',
          }}
        >
          <h1
            style={{
              fontFamily: FONTS.display,
              fontWeight: 900,
              color: BRAND.heirloom,
              fontSize: 'clamp(28px, 5.4vw, 56px)',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              margin: 0,
              lineHeight: 1.1,
            }}
          >
            Adopta un árbol<br />de cacao
          </h1>
          <div
            style={{
              margin: '14px auto 0',
              width: 'min(220px, 40vw)',
              height: 2,
              background: BRAND.pod,
              transformOrigin: 'left center',
              animation: 'ai-sweep 700ms cubic-bezier(0.16,1,0.3,1) both',
            }}
          />
        </div>
      )}

      {/* Act 5 — CTA pulse. */}
      {since('cta') && (
        <div
          style={{
            position: 'absolute',
            left: 0, right: 0, bottom: '6%',
            textAlign: 'center',
            color: BRAND.heirloom,
            fontFamily: FONTS.body,
            fontSize: 12,
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
            animation: 'ai-cta-pulse 1.6s ease-in-out infinite',
          }}
        >
          Desliza para conocerlos →
        </div>
      )}
    </div>
  )
}
