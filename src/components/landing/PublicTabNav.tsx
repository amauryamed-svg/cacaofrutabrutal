import { BRAND, FONTS } from '../../utils/constants'

/**
 * Sticky top tab nav that splits the public surface into:
 *   • Adoptar (consumer/onboarding) — this SPA at /app/
 *   • Inversores — investor pitch at /investor-landing.html
 *
 * Active tab is determined by `mode` prop (caller decides). Cross-tab clicks
 * use `window.location.href` because investor-landing is a separate static
 * bundle outside the SPA.
 *
 * Mobile-first: 44pt min tap targets per Apple HIG / WCAG 2.5.5.
 */
type Mode = 'adoptar' | 'inversores'

const TAB_HEIGHT = 52   // pt — comfortably above the 44pt minimum
const ACTIVE_BG = BRAND.amazon
const ACTIVE_FG = BRAND.heirloom
const INACTIVE_BG = 'transparent'
const INACTIVE_FG = `${BRAND.heirloom}88`

interface Props {
  mode: Mode
}

export default function PublicTabNav({ mode }: Props) {
  const tabBase: React.CSSProperties = {
    flex: 1,
    height: TAB_HEIGHT,
    border: 'none',
    cursor: 'pointer',
    fontFamily: FONTS.display,
    fontWeight: 800,
    fontSize: 'clamp(11px, 2.4vw, 13px)',
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    transition: 'background-color 200ms ease, color 200ms ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    textDecoration: 'none',
  }

  const adoptarStyle: React.CSSProperties = {
    ...tabBase,
    background: mode === 'adoptar' ? ACTIVE_BG : INACTIVE_BG,
    color: mode === 'adoptar' ? ACTIVE_FG : INACTIVE_FG,
    borderRight: `1px solid ${BRAND.amazon}55`,
  }

  const inversoresStyle: React.CSSProperties = {
    ...tabBase,
    background: mode === 'inversores' ? ACTIVE_BG : INACTIVE_BG,
    color: mode === 'inversores' ? ACTIVE_FG : INACTIVE_FG,
  }

  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      width: '100%',
      background: '#040C06',
      borderBottom: `1px solid ${BRAND.amazon}88`,
      display: 'flex',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
    }}>
      <a
        href="/adoptar"
        style={adoptarStyle}
        aria-current={mode === 'adoptar' ? 'page' : undefined}
      >
        🌱 Adoptar
      </a>
      <a
        href="/investor-landing.html"
        style={inversoresStyle}
        aria-current={mode === 'inversores' ? 'page' : undefined}
      >
        📊 Inversores
      </a>
    </div>
  )
}
