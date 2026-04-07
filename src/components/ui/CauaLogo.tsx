import { BRAND } from '../../utils/constants'

/**
 * caúa — brand wordmark component.
 *
 * Variants:
 *   primary   — Pod Green text wordmark (dark bg default)
 *   white     — Heirloom White wordmark (NavBar / very dark bg)
 *   compact   — alias for white, no tagline
 *   circular  — actual logo asset from brand PDF (transparent PNG)
 *   circular-white — white-tinted logo asset (dark bg)
 *
 * Font: Fredoka weight 600 — closest Google Fonts match to Gelica Black.
 * Bean: custom SVG path in Cosmic Criollo (#8D2679).
 */

type Variant = 'primary' | 'white' | 'compact' | 'circular' | 'circular-white'

interface Props {
  size?: number        // height in px — scales everything proportionally
  variant?: Variant
  showTagline?: boolean
}

// ── Cacao bean accent (replaces ú) ─────────────────────────────────────────
// Kidney/seed shape: wider bottom, tapers to gentle point at top, slight lean right.
// Matches the actual brand mark extracted from the PDF.
function CacaoBean({ h }: { h: number }) {
  const w = h * 0.68
  return (
    <svg
      width={w} height={h}
      viewBox="0 0 17 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      {/* Bean path: pointed top-right, round bottom, slight right lean */}
      <path
        d="M10 1.5 C13.5 2.5 16 6.5 16 12 C16 18 13 23 9 23 C5 23 2 18 2 12 C2 6.5 4.5 2 8 1.5 C8.7 1.4 9.4 1.4 10 1.5Z"
        fill={BRAND.criollo}
      />
    </svg>
  )
}

// ── Main component ──────────────────────────────────────────────────────────
export default function CauaLogo({ size = 32, variant = 'primary', showTagline = false }: Props) {

  // ── Asset-based variants (use actual brand PNG from PDF) ──────────────────
  if (variant === 'circular') {
    return (
      <img
        src="/caua-logo.png"
        alt="caúa — with nature we walk"
        height={size * 3.2}
        style={{ display: 'block', objectFit: 'contain' }}
        draggable={false}
      />
    )
  }

  if (variant === 'circular-white') {
    return (
      <img
        src="/caua-logo-white.png"
        alt="caúa — with nature we walk"
        height={size * 3.2}
        style={{ display: 'block', objectFit: 'contain' }}
        draggable={false}
      />
    )
  }

  // ── Text-based variants (inline, scalable) ────────────────────────────────
  const textColor = variant === 'white' || variant === 'compact'
    ? BRAND.heirloom
    : BRAND.pod

  const tagColor = variant === 'white' || variant === 'compact'
    ? `${BRAND.heirloom}77`
    : BRAND.mazorca

  const fontSize  = size * 1.05
  const beanH     = size * 0.40
  const beanLift  = size * 0.94

  const letterStyle: React.CSSProperties = {
    fontFamily:    "'Fredoka', 'Nunito', sans-serif",
    fontWeight:    600,
    fontSize,
    color:         textColor,
    lineHeight:    1,
    letterSpacing: '0.01em',
    userSelect:    'none',
  }

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.28 }}>

        {/* Wordmark: ca + [u with bean] + a */}
        <div style={{ display: 'inline-flex', alignItems: 'flex-end' }}>

          <span style={letterStyle}>ca</span>

          {/* u — extra paddingTop reserves space for the floating bean */}
          <span style={{ position: 'relative', display: 'inline-block', paddingTop: beanH * 0.55 }}>
            <span style={letterStyle}>u</span>

            {/* Bean accent — centred above the u */}
            <span style={{
              position:      'absolute',
              bottom:        beanLift,
              left:          '55%',          // slight right offset matches brand mark
              transform:     'translateX(-50%)',
              pointerEvents: 'none',
            }}>
              <CacaoBean h={beanH} />
            </span>
          </span>

          <span style={letterStyle}>a</span>
        </div>
      </div>

      {/* Tagline */}
      {(showTagline && variant !== 'compact') && (
        <span style={{
          fontFamily:    "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
          fontStyle:     'italic',
          fontWeight:    500,
          fontSize:      size * 0.3,
          color:         tagColor,
          letterSpacing: '0.05em',
          paddingLeft:   2,
          lineHeight:    1,
          whiteSpace:    'nowrap',
        }}>
          with nature we walk
        </span>
      )}
    </div>
  )
}
