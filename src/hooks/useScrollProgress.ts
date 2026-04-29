import { useEffect, useRef } from 'react'

/**
 * Single scroll source for the SPA Landing.
 *
 * Writes two CSS custom properties to `:root`:
 *  - `--p`  (0..1) — global page scroll progress, lock-step with public/investor-scroll.js
 *  - `--pd` (0..1) — proximity to a target section (default `#join`), eased cubic-out
 *
 * Returns refs (`pRef`, `pdRef`) so R3F components can read inside `useFrame`
 * without triggering React re-renders.
 *
 * Honors `prefers-reduced-motion: reduce`: emits constant `--p=0.5` and `--pd=1`,
 * matching `public/investor-scroll.js:16,43`.
 */
export interface ScrollProgress {
  pRef: React.MutableRefObject<number>
  pdRef: React.MutableRefObject<number>
}

interface Options {
  /** ID of the section that drives `--pd`. Default: `join`. */
  proximityTargetId?: string
}

export function useScrollProgress({ proximityTargetId = 'join' }: Options = {}): ScrollProgress {
  const pRef = useRef(0)
  const pdRef = useRef(0)

  useEffect(() => {
    const root = document.documentElement
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduceMotion) {
      pRef.current = 0.5
      pdRef.current = 1
      root.style.setProperty('--p', '0.5')
      root.style.setProperty('--pd', '1')
      return
    }

    let ticking = false
    const update = () => {
      // --p: normalized document scroll (mirrors motion.scroll() behavior)
      const scrollable = root.scrollHeight - window.innerHeight
      const p = scrollable > 0 ? window.scrollY / scrollable : 0
      const pClamped = Math.max(0, Math.min(1, p))
      pRef.current = pClamped
      root.style.setProperty('--p', pClamped.toFixed(4))

      // --pd: proximity to target section center vs viewport center, cubic-out
      const target = document.getElementById(proximityTargetId)
      if (target) {
        const r = target.getBoundingClientRect()
        const vh = window.innerHeight
        const secCenter = r.top + r.height / 2
        const normDist = Math.abs(secCenter - vh / 2) / (vh * 0.9)
        const raw = Math.max(0, Math.min(1, 1 - normDist))
        const eased = 1 - Math.pow(1 - raw, 3)
        pdRef.current = eased
        root.style.setProperty('--pd', eased.toFixed(3))
      }

      ticking = false
    }

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(update)
        ticking = true
      }
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', update, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', update)
    }
  }, [proximityTargetId])

  return { pRef, pdRef }
}
