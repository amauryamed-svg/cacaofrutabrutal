import { motion } from 'framer-motion'
import { BRAND } from '../../utils/constants'

/**
 * The "caúa" SVG wordmark — purple cocoa-bean diacritic over the letter "u",
 * four lowercase letters drawn in heirloom-cream. Extracted from the Landing
 * hero so both `<AppIntro />` (full-screen splash) and `<Landing />` (hero
 * placement) share one source of truth.
 *
 * Variants:
 *   - `intro` — full-screen size (`clamp(280px, 75vw, 800px)`), used by AppIntro.
 *   - `hero`  — hero size (`clamp(200px, 46vw, 640px)`), used in Landing.tsx.
 *
 * `animated` controls the entrance animation. `intro` defaults to `true`
 * (bean rolls in, letters stroke-draw, fill blooms). `hero` defaults to
 * `false` (SVG appears already-drawn). The bean's idle purple pulse is
 * always on unless `prefers-reduced-motion` is set.
 *
 * Both variants are wrapped in `<motion.div layoutId="caua-wordmark">` so a
 * `<LayoutGroup>` parent can interpolate position + size when the intro
 * unmounts and the hero mounts (shared element transition).
 */
export interface CauaWordmarkProps {
  variant: 'intro' | 'hero'
  /** Run entrance animation (bean arrive + letters draw). Default by variant. */
  animated?: boolean
  /** Inline style escape hatch (e.g. for AppIntro centering). */
  style?: React.CSSProperties
}

export const WORDMARK_LAYOUT_ID = 'caua-wordmark'

export default function CauaWordmark({ variant, animated, style }: CauaWordmarkProps) {
  const isAnimated = animated ?? (variant === 'intro')
  const width = variant === 'intro'
    ? 'clamp(280px, 75vw, 800px)'
    : 'clamp(200px, 46vw, 640px)'

  return (
    <motion.div
      layoutId={WORDMARK_LAYOUT_ID}
      className={`caua-wordmark caua-wordmark--${variant}${isAnimated ? ' is-animated' : ''}`}
      style={{
        display: 'flex',
        justifyContent: 'center',
        ...style,
      }}
    >
      <svg
        className="caua-logo"
        viewBox="0 0 234.67 78.01"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="caúa"
        role="img"
        style={{
          width,
          height: 'auto',
          display: 'block',
          filter: `drop-shadow(0 8px 28px ${BRAND.pod}22)`,
          overflow: 'visible',
        }}
      >
        {/* The bean — purple cocoa seed acting as the diacritic over "u". */}
        <path
          className="caua-bean"
          fill="#911f70"
          stroke="#911f70"
          strokeWidth="0"
          d="M155.3,2.76c.72,1.43.81,3.08.42,4.63-.29,1.12-.58,2.24-1.17,3.17-2.31,3.64-5.39,6.4-10,6.63-1.46.07-3.12.04-3.87-1.52-.73-1.52.04-2.91,1.08-4.03,1.91-2.08,3.09-4.47,3.8-7.2.88-3.38,2.76-4.71,5.77-4.39,1.87.2,3.16,1.09,3.97,2.71h0Z"
        />
        {/* Each letter strokes in around the bean's landing point, then fills. */}
        <path className="caua-letter caua-letter-1" fill={BRAND.heirloom} stroke={BRAND.heirloom} strokeWidth="0.5" d="M55.93,32.31l-6.45,3.55c-1.24.68-2.78.5-3.84-.45-1.7-1.51-3.38-2.62-5.04-3.31-2.22-.92-4.82-1.38-7.79-1.38-5.43,0-9.81,1.62-13.17,4.85-3.35,3.24-5.03,7.38-5.03,12.44s1.61,8.93,4.84,12.04,7.47,4.67,12.72,4.67,9.87-1.56,13.29-4.67c1.18-1.07,2.91-1.27,4.22-.37l5.99,4.1c1.69,1.16,1.99,3.59.56,5.06-5.97,6.11-13.87,9.16-23.71,9.16s-18.13-3.01-23.89-9.03C2.88,62.95,0,55.9,0,47.82c0-5.6,1.4-10.75,4.2-15.46s6.7-8.41,11.72-11.11c5.01-2.69,10.61-4.04,16.81-4.04,5.74,0,10.89,1.14,15.47,3.43,3.28,1.64,6.13,3.78,8.56,6.42,1.48,1.61,1.1,4.19-.82,5.24h-.01Z"/>
        <path className="caua-letter caua-letter-2" fill={BRAND.heirloom} stroke={BRAND.heirloom} strokeWidth="0.5" d="M113,18.71h-8.43s-.03.02-.05.02c-2.38,0-2.47,2.47-2.47,2.47v3.89c-2.58-2.62-5.4-4.59-8.44-5.9-3.05-1.31-6.3-1.97-9.77-1.97-7.54,0-13.94,2.85-19.21,8.56-5.27,5.7-7.91,13.02-7.91,21.95s2.73,15.81,8.18,21.6c5.44,5.79,11.9,8.68,19.37,8.68,3.32,0,6.41-.59,9.26-1.78s5.69-3.13,8.52-5.82v2.91s-.16,3.14,3.14,3.14c.14,0,.16.05.27.06h7.55c1.96,0,3.55-1.59,3.55-3.55V22.26c0-1.96-1.59-3.55-3.55-3.55h-.01ZM98.18,59.97c-3,3.17-6.78,4.75-11.34,4.75s-8.13-1.61-11.15-4.84c-3.02-3.22-4.53-7.33-4.53-12.33s1.48-9.02,4.45-12.19c2.96-3.17,6.69-4.76,11.17-4.76s8.39,1.56,11.39,4.68c3,3.12,4.5,7.19,4.5,12.22s-1.5,9.29-4.5,12.46h0Z"/>
        <path className="caua-letter caua-letter-3" fill={BRAND.heirloom} stroke={BRAND.heirloom} strokeWidth="0.5" d="M124.04,18.71h7.44c1.99,0,3.61,1.62,3.61,3.61v24.24c0,5.42.38,9.18,1.12,11.29s1.94,3.75,3.59,4.91c1.65,1.17,3.68,1.75,6.1,1.75s4.46-.57,6.15-1.72c1.68-1.15,2.94-2.84,3.75-5.08.61-1.66.91-5.22.91-10.68v-24.71c0-1.99,1.62-3.61,3.61-3.61h7.28c1.99,0,3.61,1.62,3.61,3.61v20.89c0,10.1-.8,17-2.39,20.72-1.95,4.53-4.82,8.01-8.61,10.44s-8.61,3.64-14.45,3.64c-6.34,0-11.47-1.42-15.38-4.25s-6.67-6.78-8.26-11.85c-1.13-3.51-1.7-9.88-1.7-19.13v-20.46c0-1.99,1.62-3.61,3.61-3.61h.01Z"/>
        <path className="caua-letter caua-letter-4" fill={BRAND.heirloom} stroke={BRAND.heirloom} strokeWidth="0.5" d="M231.11,18.71h-8.43s-.03.02-.05.02c-2.38,0-2.47,2.47-2.47,2.47v3.89c-2.58-2.62-5.4-4.59-8.44-5.9-3.05-1.31-6.3-1.97-9.77-1.97-7.54,0-13.94,2.85-19.21,8.56-5.27,5.7-7.91,13.02-7.91,21.95s2.73,15.81,8.18,21.6c5.44,5.79,11.9,8.68,19.37,8.68,3.32,0,6.41-.59,9.26-1.78s5.69-3.13,8.52-5.82v2.91s-.16,3.14,3.14,3.14c.14,0,.16.05.27.06h7.55c1.96,0,3.55-1.59,3.55-3.55V22.26c0-1.96-1.59-3.55-3.55-3.55h-.01ZM216.29,59.97c-3,3.17-6.78,4.75-11.34,4.75s-8.13-1.61-11.15-4.84c-3.02-3.22-4.53-7.33-4.53-12.33s1.48-9.02,4.45-12.19c2.96-3.17,6.69-4.76,11.17-4.76s8.39,1.56,11.39,4.68c3,3.12,4.5,7.19,4.5,12.22s-1.5,9.29-4.5,12.46h0Z"/>
      </svg>

      <style>{`
        /* Bean idle pulse — always on (subtle), unless reduced-motion. */
        @keyframes caua-bean-pulse {
          0%, 100% { filter: drop-shadow(0 0 0 rgba(145, 31, 112, 0)); }
          50%      { filter: drop-shadow(0 0 14px rgba(145, 31, 112, 0.5)); }
        }
        .caua-wordmark .caua-bean {
          transform-box: fill-box;
          transform-origin: center;
          animation: caua-bean-pulse 3.6s ease-in-out infinite;
        }

        /* Animated entrance — calm, no spinning, no stroke-draw.
           Bean drops in with a soft scale pop, letters fade up sequentially.
             0.40s → bean scale-pops in (0.90s)        ends 1.30s
             1.80s → letter 1 fades up (0.80s)         ends 2.60s
             2.20s → letter 2 (0.40s stagger)
             2.60s → letter 3
             3.00s → letter 4                          ends 3.80s
             3.80s ▸ bean idle pulse takes over. */
        @keyframes caua-bean-pop {
          0%   { opacity: 0; transform: translateY(-22px) scale(0.55); }
          60%  { opacity: 1; transform: translateY(2px)   scale(1.08); }
          100% { opacity: 1; transform: translateY(0)     scale(1.00); }
        }
        @keyframes caua-letter-fade-up {
          0%   { opacity: 0; transform: translateY(14px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .caua-wordmark.is-animated .caua-bean {
          animation:
            caua-bean-pop  0.90s cubic-bezier(0.34, 1.32, 0.64, 1) 0.40s both,
            caua-bean-pulse 3.6s ease-in-out 3.80s infinite;
        }
        .caua-wordmark.is-animated .caua-letter {
          /* Letter rendering already uses fill — no stroke-draw mechanics. */
          transform-box: fill-box;
          transform-origin: center;
          opacity: 0;
          animation: caua-letter-fade-up 0.80s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .caua-wordmark.is-animated .caua-letter-1 { animation-delay: 1.80s; }
        .caua-wordmark.is-animated .caua-letter-2 { animation-delay: 2.20s; }
        .caua-wordmark.is-animated .caua-letter-3 { animation-delay: 2.60s; }
        .caua-wordmark.is-animated .caua-letter-4 { animation-delay: 3.00s; }

        @media (prefers-reduced-motion: reduce) {
          .caua-wordmark .caua-bean,
          .caua-wordmark .caua-letter {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>
    </motion.div>
  )
}
