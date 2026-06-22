import { type ReactNode } from 'react'
import { BRAND } from '../../utils/constants'

/**
 * Mobile-first frame for any page that will become an App Store native app.
 *
 * Behavior:
 *   - Mobile (≤480px): full-bleed, no frame, content uses 100% width.
 *   - Desktop (>480px): centered phone-shaped frame with rounded corners +
 *     subtle border, max-width 420 (iPhone 15 logical width). Outer page
 *     stays bgDeep so the frame reads like a mockup on a black surface.
 *
 * Why this exists: /adoptar et al. were stacking too many sections that
 * all wanted full-bleed real estate, causing overlap. This wrapper gives
 * every page the same constrained canvas, mirroring the eventual native app
 * viewport so we design once and ship to both.
 *
 * Status-row (top): renders `topRow` if provided — a place for streak/level
 * chips that live "above" the page header in a mobile status-bar idiom.
 *
 * Tab-bar (bottom): the existing `<TabBar/>` lives outside this shell so
 * we don't duplicate. If a future native app needs a per-page bottom dock,
 * pass `bottomDock`.
 */
export default function MobileAppShell({
  children,
  topRow,
  bottomDock,
  background,
}: {
  children: ReactNode
  topRow?: ReactNode
  bottomDock?: ReactNode
  background?: string
}) {
  const bg = background ?? BRAND.bgDeep
  return (
    <div
      style={{
        minHeight: '100vh',
        background: BRAND.bgDeep,
        // Outer page sits behind the frame — visible only on desktop.
        paddingTop: 'calc(var(--nav-h, 60px) + 12px)',
        paddingBottom: 24,
      }}
    >
      <div
        className="caua-mobile-shell"
        style={{
          width: '100%',
          maxWidth: 420,
          margin: '0 auto',
          background: bg,
          minHeight: 'calc(100vh - var(--nav-h, 60px) - 36px)',
          // Frame styling — only kicks in via the media query below.
          borderRadius: 0,
          border: 'none',
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {topRow && (
          <div
            style={{
              padding: '14px 16px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 10,
              flexWrap: 'wrap',
              borderBottom: `1px solid ${BRAND.amazon}77`,
              background: `linear-gradient(180deg, ${BRAND.bgCard}66 0%, transparent 100%)`,
              position: 'sticky',
              top: 0,
              zIndex: 5,
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          >
            {topRow}
          </div>
        )}
        <div style={{ flex: 1 }}>{children}</div>
        {bottomDock && (
          <div
            style={{
              padding: '10px 16px',
              borderTop: `1px solid ${BRAND.amazon}`,
              background: `${BRAND.bgCard}cc`,
            }}
          >
            {bottomDock}
          </div>
        )}
      </div>

      {/* Desktop frame styling — applied via class so it's media-query gated. */}
      <style>{`
        @media (min-width: 481px) {
          .caua-mobile-shell {
            border-radius: 28px;
            border: 1px solid ${BRAND.amazon};
            box-shadow:
              0 0 0 6px #000,
              0 30px 80px rgba(0,0,0,0.6),
              inset 0 0 0 1px ${BRAND.heirloom}11;
            min-height: 720px;
          }
        }
      `}</style>
    </div>
  )
}
