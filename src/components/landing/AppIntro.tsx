import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BRAND, FONTS } from '../../utils/constants'

/**
 * Brand intro — plays once per browser session when a user lands on `/app/`.
 *
 * Was: a wordmark splash (bean + letters animation). The user found it too
 * mute / "no dice nada". Now: the pre-rendered hero video that previously
 * lived on the public investor landing — a real cinematic moment with copy
 * overlaid (eyebrow + headline + sub).
 *
 * UX guards:
 *   - module-scope `hasPlayed` — survives router navigation in the same tab.
 *   - `prefers-reduced-motion` → no intro, skip straight to home.
 *   - click / scroll / Escape → skip to done.
 *   - video `ended` event auto-dismisses.
 *   - hard cap at 8 s as a safety net if the video stalls.
 */

// Module-scope flag — survives in-app navigation, resets on hard reload.
// `?intro=play` query param forces replay for debug / preview.
let hasPlayed = false

// Vite HMR — reset on every hot update so iteration on the intro is visible.
if (import.meta.hot) {
  import.meta.hot.accept(() => { hasPlayed = false })
}

const HARD_CAP_MS = 8000   // safety net if video never fires `ended`

export default function AppIntro() {
  const [phase, setPhase] = useState<'play' | 'skip' | 'done'>(() => {
    if (typeof window === 'undefined') return 'skip'
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
    const forcePlay = new URLSearchParams(window.location.search).get('intro') === 'play'
    if (reduceMotion) return 'skip'
    if (hasPlayed && !forcePlay) return 'skip'
    hasPlayed = true
    return 'play'
  })

  const videoRef = useRef<HTMLVideoElement>(null)

  // Hard cap — even if the video never fires `ended`, kill the intro.
  useEffect(() => {
    if (phase !== 'play') return
    const t = setTimeout(() => setPhase('done'), HARD_CAP_MS)
    return () => clearTimeout(t)
  }, [phase])

  // Skip listeners — click / scroll / Escape cut to done.
  useEffect(() => {
    if (phase !== 'play') return
    const skip = () => setPhase('done')
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') skip() }
    window.addEventListener('keydown', onKey)
    window.addEventListener('scroll', skip, { passive: true, once: true })
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', skip)
    }
  }, [phase])

  // While the intro is up, lock body scroll so the user can't fight it.
  useEffect(() => {
    if (phase !== 'play') return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [phase])

  return (
    <AnimatePresence>
      {phase === 'play' && (
        <motion.div
          key="app-intro"
          onClick={() => setPhase('done')}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          // Short exit (0.3s) so the home behind doesn't visually overlap with
          // the video during a long fade. Was 1.0s — caused two intros visible.
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: BRAND.bgDeep,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            overflow: 'hidden',
          }}
        >
          {/* Cinematic intro — pre-rendered cacao scene from /videos/. */}
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            preload="auto"
            poster="/videos/hero-intro-poster.jpg"
            onEnded={() => setPhase('done')}
            onError={() => setPhase('done')}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
            }}
          >
            <source src="/videos/hero-intro.mp4" type="video/mp4" />
          </video>

          {/* Legibility scrim — keeps copy readable over the bright video. */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg, rgba(4,12,6,0.55) 0%, rgba(4,12,6,0.18) 35%, rgba(4,12,6,0.18) 60%, rgba(4,12,6,0.78) 100%)',
            pointerEvents: 'none',
          }} />

          {/* Copy overlay — eyebrow + headline + sub. Fades in over the video
              so the brand context lands while the cacao imagery rolls. */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'relative',
              zIndex: 1,
              maxWidth: 720,
              padding: '0 clamp(20px, 5vw, 40px)',
              textAlign: 'center',
              color: BRAND.heirloom,
            }}
          >
            <div style={{
              fontFamily: FONTS.serif, fontStyle: 'italic',
              color: BRAND.mazorca,
              fontSize: 'clamp(12px, 1.8vw, 16px)',
              letterSpacing: '0.28em',
              textTransform: 'lowercase',
              marginBottom: 'clamp(14px, 2.5vw, 20px)',
            }}>
              cacao fruta brutal
            </div>
            <h1 style={{
              fontFamily: FONTS.display, fontWeight: 900,
              fontSize: 'clamp(40px, 9vw, 92px)',
              lineHeight: 0.92,
              letterSpacing: '-0.01em',
              textTransform: 'uppercase',
              margin: '0 0 clamp(14px, 2.5vw, 22px)',
              textShadow: '0 4px 32px rgba(0,0,0,0.6)',
            }}>
              Adopta un árbol.<br />
              <span style={{ color: BRAND.pod }}>Cosecha chocolate.</span>
            </h1>
            <p style={{
              fontFamily: FONTS.body,
              fontSize: 'clamp(13px, 2.2vw, 16px)',
              color: `${BRAND.heirloom}cc`,
              maxWidth: 460,
              margin: '0 auto',
              lineHeight: 1.6,
            }}>
              Del genoma colombiano al mundo. Biotecnología regenerativa, on-chain.
            </p>
            <div style={{
              marginTop: 'clamp(20px, 4vw, 32px)',
              fontFamily: FONTS.display, fontWeight: 700,
              fontSize: 10, letterSpacing: '0.25em',
              color: `${BRAND.heirloom}55`,
              textTransform: 'uppercase',
            }}>
              toca para entrar
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
