/**
 * caúa — brand wordmark component.
 *
 * Uses real SVG vector paths extracted from Recurso 2.svg (official brand files).
 * The wordmark is inline SVG with dynamic fill color so it works on any background.
 * The jaguar+pod mark uses /brand/jaguar-pod.svg (drop Recurso 1.svg there).
 *
 * Variants:
 *   primary / wordmark / secondary  — wordmark, pod green on dark bg
 *   white / compact                 — wordmark, heirloom white on dark bg
 *   logo                            — jaguar+pod mark (colored SVG asset)
 *   logo-white                      — jaguar+pod mark white tinted
 */

import { BRAND } from '../../utils/constants'
import { IconJaguarPod } from './CauaIcons'

type Variant = 'primary' | 'white' | 'compact' | 'secondary' | 'wordmark' | 'logo' | 'logo-white'
             | 'circular' | 'circular-white'  // legacy aliases

interface Props {
  size?:        number
  variant?:     Variant
  showTagline?: boolean
}

// Bean accent color from actual brand SVG (cls-2 in Recurso 2.svg)
const BEAN_COLOR = '#911f70'

export default function CauaLogo({ size = 32, variant = 'primary', showTagline = false }: Props) {

  // ── Jaguar + pod mark (inline SVG) ──────────────────────────────────────
  if (variant === 'logo' || variant === 'circular') {
    return <IconJaguarPod size={size * 3} podColor="#911f71" />
  }
  if (variant === 'logo-white' || variant === 'circular-white') {
    return (
      <span style={{ filter: 'brightness(0) invert(1)', display: 'inline-block' }}>
        <IconJaguarPod size={size * 3} podColor="#911f71" />
      </span>
    )
  }

  // ── Text color ───────────────────────────────────────────────────────────
  const isDark    = variant === 'white' || variant === 'compact'
  const fillColor = isDark ? BRAND.heirloom : BRAND.pod

  // Scale factor: viewBox is 234.67 × 78.01
  // We map `size` (height) to the SVG height
  const svgW = 234.67
  const svgH = 78.01
  const h    = size * 2.4          // display height in px
  const w    = (svgW / svgH) * h  // maintain aspect ratio

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
      {/* Wordmark SVG — exact paths from Recurso 2.svg */}
      <svg
        width={w}
        height={h}
        viewBox="0 0 234.67 78.01"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="caúa"
        role="img"
        style={{ display: 'block' }}
      >
        {/* Bean accent above ú — cls-2 (#911f70 in source) */}
        <path
          fill={BEAN_COLOR}
          d="M155.3,2.76c.72,1.43.81,3.08.42,4.63-.29,1.12-.58,2.24-1.17,3.17-2.31,3.64-5.39,6.4-10,6.63-1.46.07-3.12.04-3.87-1.52-.73-1.52.04-2.91,1.08-4.03,1.91-2.08,3.09-4.47,3.8-7.2.88-3.38,2.76-4.71,5.77-4.39,1.87.2,3.16,1.09,3.97,2.71h0Z"
        />
        {/* Letter "c" — cls-1 (white in source, dynamic here) */}
        <path
          fill={fillColor}
          d="M55.93,32.31l-6.45,3.55c-1.24.68-2.78.5-3.84-.45-1.7-1.51-3.38-2.62-5.04-3.31-2.22-.92-4.82-1.38-7.79-1.38-5.43,0-9.81,1.62-13.17,4.85-3.35,3.24-5.03,7.38-5.03,12.44s1.61,8.93,4.84,12.04,7.47,4.67,12.72,4.67,9.87-1.56,13.29-4.67c1.18-1.07,2.91-1.27,4.22-.37l5.99,4.1c1.69,1.16,1.99,3.59.56,5.06-5.97,6.11-13.87,9.16-23.71,9.16s-18.13-3.01-23.89-9.03C2.88,62.95,0,55.9,0,47.82c0-5.6,1.4-10.75,4.2-15.46s6.7-8.41,11.72-11.11c5.01-2.69,10.61-4.04,16.81-4.04,5.74,0,10.89,1.14,15.47,3.43,3.28,1.64,6.13,3.78,8.56,6.42,1.48,1.61,1.1,4.19-.82,5.24h-.01Z"
        />
        {/* First letter "a" (second position) — cls-1 */}
        <path
          fill={fillColor}
          d="M113,18.71h-8.43s-.03.02-.05.02c-2.38,0-2.47,2.47-2.47,2.47v3.89c-2.58-2.62-5.4-4.59-8.44-5.9-3.05-1.31-6.3-1.97-9.77-1.97-7.54,0-13.94,2.85-19.21,8.56-5.27,5.7-7.91,13.02-7.91,21.95s2.73,15.81,8.18,21.6c5.44,5.79,11.9,8.68,19.37,8.68,3.32,0,6.41-.59,9.26-1.78s5.69-3.13,8.52-5.82v2.91s-.16,3.14,3.14,3.14c.14,0,.16.05.27.06h7.55c1.96,0,3.55-1.59,3.55-3.55V22.26c0-1.96-1.59-3.55-3.55-3.55h-.01ZM98.18,59.97c-3,3.17-6.78,4.75-11.34,4.75s-8.13-1.61-11.15-4.84c-3.02-3.22-4.53-7.33-4.53-12.33s1.48-9.02,4.45-12.19c2.96-3.17,6.69-4.76,11.17-4.76s8.39,1.56,11.39,4.68c3,3.12,4.5,7.19,4.5,12.22s-1.5,9.29-4.5,12.46h0Z"
        />
        {/* Letter "u" (third position) — cls-1 */}
        <path
          fill={fillColor}
          d="M124.04,18.71h7.44c1.99,0,3.61,1.62,3.61,3.61v24.24c0,5.42.38,9.18,1.12,11.29s1.94,3.75,3.59,4.91c1.65,1.17,3.68,1.75,6.1,1.75s4.46-.57,6.15-1.72c1.68-1.15,2.94-2.84,3.75-5.08.61-1.66.91-5.22.91-10.68v-24.71c0-1.99,1.62-3.61,3.61-3.61h7.28c1.99,0,3.61,1.62,3.61,3.61v20.89c0,10.1-.8,17-2.39,20.72-1.95,4.53-4.82,8.01-8.61,10.44s-8.61,3.64-14.45,3.64c-6.34,0-11.47-1.42-15.38-4.25s-6.67-6.78-8.26-11.85c-1.13-3.51-1.7-9.88-1.7-19.13v-20.46c0-1.99,1.62-3.61,3.61-3.61h.01Z"
        />
        {/* Second letter "a" (fourth/last position) — cls-1 */}
        <path
          fill={fillColor}
          d="M231.11,18.71h-8.43s-.03.02-.05.02c-2.38,0-2.47,2.47-2.47,2.47v3.89c-2.58-2.62-5.4-4.59-8.44-5.9-3.05-1.31-6.3-1.97-9.77-1.97-7.54,0-13.94,2.85-19.21,8.56-5.27,5.7-7.91,13.02-7.91,21.95s2.73,15.81,8.18,21.6c5.44,5.79,11.9,8.68,19.37,8.68,3.32,0,6.41-.59,9.26-1.78s5.69-3.13,8.52-5.82v2.91s-.16,3.14,3.14,3.14c.14,0,.16.05.27.06h7.55c1.96,0,3.55-1.59,3.55-3.55V22.26c0-1.96-1.59-3.55-3.55-3.55h-.01ZM216.29,59.97c-3,3.17-6.78,4.75-11.34,4.75s-8.13-1.61-11.15-4.84c-3.02-3.22-4.53-7.33-4.53-12.33s1.48-9.02,4.45-12.19c2.96-3.17,6.69-4.76,11.17-4.76s8.39,1.56,11.39,4.68c3,3.12,4.5,7.19,4.5,12.22s-1.5,9.29-4.5,12.46h0Z"
        />
      </svg>

      {showTagline && variant !== 'compact' && (
        <span style={{
          fontFamily:    "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
          fontStyle:     'italic',
          fontWeight:    500,
          fontSize:      size * 0.3,
          color:         isDark ? `${BRAND.heirloom}77` : BRAND.mazorca,
          letterSpacing: '0.05em',
          lineHeight:    1,
          whiteSpace:    'nowrap',
        }}>
          with nature we walk
        </span>
      )}
    </div>
  )
}
