import { BRAND } from '../../utils/constants'

type Variant = 'default' | 'white' | 'compact'

interface Props {
  size?: number
  variant?: Variant
  showTagline?: boolean
}

/**
 * caúa wordmark — Pod Green letterforms, Cosmic Criollo accent on ú.
 * Variants: default (dark bg), white (very dark bg), compact (nav/favicon use).
 */
export default function CauaLogo({ size = 32, variant = 'default', showTagline = false }: Props) {
  const baseColor   = variant === 'white' ? BRAND.heirloom : BRAND.pod
  const accentColor = BRAND.criollo // #8D2679 — accent on ú
  const podH        = size
  const podW        = size * 0.55

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.35 }}>

      {/* Cacao pod botanical mark */}
      <svg
        width={podW}
        height={podH}
        viewBox="0 0 22 36"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Main pod body */}
        <ellipse cx="11" cy="20" rx="9" ry="13" fill={baseColor} opacity="0.12" />
        <ellipse cx="11" cy="20" rx="9" ry="13" fill="none" stroke={baseColor} strokeWidth="1" opacity="0.9" />

        {/* Pod ribs — 3 subtle vertical lines */}
        <line x1="7"  y1="8"  x2="6"  y2="32" stroke={baseColor} strokeWidth="0.5" opacity="0.45" />
        <line x1="11" y1="7"  x2="11" y2="33" stroke={baseColor} strokeWidth="0.5" opacity="0.35" />
        <line x1="15" y1="8"  x2="16" y2="32" stroke={baseColor} strokeWidth="0.5" opacity="0.45" />

        {/* Stem */}
        <path d="M 11 7 Q 10 4 11 1" stroke={baseColor} strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.8" />

        {/* Leaf at stem — teardrop shape */}
        <path d="M 11 4 C 14 2 17 4 14 7 C 12 8 11 6 11 4 Z"
          fill={accentColor} opacity="0.85" />
      </svg>

      {/* Wordmark: ca + ú + a */}
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
        <span
          aria-label="caúa"
          style={{
            fontFamily: "'Barlow Condensed', Impact, sans-serif",
            fontWeight: 900,
            fontSize: size * 0.9,
            letterSpacing: size > 24 ? '0.04em' : '0.02em',
            lineHeight: 1,
            color: baseColor,
          }}
        >
          ca<span style={{ color: accentColor }}>ú</span>a
        </span>

        {showTagline && (
          <span style={{
            fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
            fontStyle: 'italic',
            fontSize: size * 0.28,
            color: `${baseColor}77`,
            letterSpacing: '0.08em',
            marginTop: 2,
          }}>
            with nature we walk
          </span>
        )}
      </div>
    </div>
  )
}
