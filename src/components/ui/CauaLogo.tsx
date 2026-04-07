import { BRAND } from '../../utils/constants'

/**
 * caúa — official brand wordmark reconstruction.
 *
 * Font: Fredoka (Google Fonts) — closest available match to Gelica Black:
 *   round, bold, geometric lowercase letterforms.
 *
 * Accent: The ú accent is NOT a typographic character. It is a custom
 *   cacao bean SVG shape in Cosmic Criollo (#8D2679), floating above the u.
 *
 * Variants per brand guidelines:
 *   primary   — Pod Green wordmark, no icon (default)
 *   secondary — Cacao pod icon (Mazorca) + wordmark + optional tagline
 *   white     — Heirloom White wordmark (dark backgrounds)
 *   compact   — wordmark only, no tagline (NavBar)
 */

type Variant = 'primary' | 'secondary' | 'white' | 'compact'

interface Props {
  size?: number        // cap-height in px; scales everything
  variant?: Variant
  showTagline?: boolean
}

// ── Cacao bean (the ú accent mark) ─────────────────────────────────────────
// Bean-shaped oval, slightly pointed top, fuller bottom — Cosmic Criollo fill.
function CacaoBean({ pxHeight }: { pxHeight: number }) {
  return (
    <svg
      width={pxHeight * 0.55}
      height={pxHeight}
      viewBox="0 0 11 20"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      <path
        d="M5.5 1 C2.5 2.5 1 6 1 10.5 C1 15.5 3 19 5.5 19 C8 19 10 15.5 10 10.5 C10 6 8.5 2.5 5.5 1Z"
        fill={BRAND.criollo}
      />
    </svg>
  )
}

// ── Cacao pod icon (secondary logo) ────────────────────────────────────────
// Elongated oval pod, Mazorca Yellow, with green leaf at stem.
function CacaoPodIcon({ height }: { height: number }) {
  const w = height * 0.52
  return (
    <svg width={w} height={height} viewBox="0 0 26 50" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Pod body */}
      <ellipse cx="13" cy="30" rx="10" ry="16" fill={BRAND.mazorca} opacity="0.95" />
      {/* Longitudinal ribs */}
      {[-4, 0, 4].map((dx, i) => (
        <ellipse key={i} cx={13 + dx} cy="30" rx="2" ry="14"
          fill="none" stroke={BRAND.santaMaria} strokeWidth="0.6" opacity="0.25" />
      ))}
      {/* Stem */}
      <path d="M13 14 Q12.5 9 13 5" stroke={BRAND.amazon} strokeWidth="1.6" strokeLinecap="round" fill="none" />
      {/* Leaf — theobroma shape */}
      <path d="M13 7 C17 4 21 7 18 11 C16 13 13 11 13 7Z" fill={BRAND.pod} />
      <line x1="13" y1="7" x2="17" y2="11" stroke={BRAND.amazon} strokeWidth="0.5" opacity="0.4" />
    </svg>
  )
}

// ── Main component ──────────────────────────────────────────────────────────
export default function CauaLogo({ size = 32, variant = 'primary', showTagline = false }: Props) {
  const wordColor  = variant === 'white' ? BRAND.heirloom : BRAND.pod
  const tagColor   = variant === 'white' ? `${BRAND.heirloom}77` : BRAND.mazorca

  // Font size that produces the desired cap-height
  const fontSize   = size * 1.05
  // Cacao bean: sized relative to the letter cap-height
  const beanH      = size * 0.38
  // How far above the baseline to float the bean
  const beanLift   = size * 0.92

  const letterStyle: React.CSSProperties = {
    fontFamily: "'Fredoka', 'Nunito', sans-serif",
    fontWeight: 600,
    fontSize:   fontSize,
    color:      wordColor,
    lineHeight: 1,
    letterSpacing: '0.01em',
    userSelect: 'none',
  }

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: 3 }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.28 }}>

        {/* Pod icon — secondary variant only */}
        {variant === 'secondary' && (
          <CacaoPodIcon height={size * 1.4} />
        )}

        {/* Wordmark: c + a + [u with bean] + a */}
        <div style={{ display: 'inline-flex', alignItems: 'flex-end', position: 'relative' }}>

          {/* c  a */}
          <span style={letterStyle}>ca</span>

          {/* u — needs padding-top so the bean doesn't get clipped */}
          <span style={{ position: 'relative', display: 'inline-block', paddingTop: beanH * 0.6 }}>
            <span style={letterStyle}>u</span>

            {/* Cacao bean accent — centred over the u */}
            <span style={{
              position: 'absolute',
              bottom: beanLift,
              left: '50%',
              transform: 'translateX(-50%)',
              pointerEvents: 'none',
            }}>
              <CacaoBean pxHeight={beanH} />
            </span>
          </span>

          {/* a */}
          <span style={letterStyle}>a</span>
        </div>
      </div>

      {/* Tagline — "with nature we walk" in Mazorca italic */}
      {(showTagline || variant === 'secondary') && (
        <span style={{
          fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
          fontStyle:  'italic',
          fontWeight: 500,
          fontSize:   size * 0.3,
          color:      tagColor,
          letterSpacing: '0.05em',
          paddingLeft: variant === 'secondary' ? size * 0.78 : 2,
          lineHeight: 1,
        }}>
          with nature we walk
        </span>
      )}
    </div>
  )
}
