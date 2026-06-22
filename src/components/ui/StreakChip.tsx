import { BRAND, FONTS } from '../../utils/constants'
import { useUserStreak } from '../../hooks/useUserStreak'

/**
 * Compact fire-emoji + days + multiplier label chip. Reads useUserStreak
 * hook so it auto-refreshes on care actions (realtime subscription).
 *
 * Two surfaces: Adoptar header right-side, TreeDetail header next to combo
 * pill. Mobile-safe: ≥44pt tap target via padding.
 */
export default function StreakChip({ compact = false }: { compact?: boolean }) {
  const { streak, loading } = useUserStreak()
  const days = streak.currentDays
  const multPct = Math.min(30, days)

  // Tier color: 0d muted, 1-2d pod, 3-6d mazorca, 7-29d theobroma, 30d+ criollo.
  const tierColor =
    days >= 30 ? BRAND.criollo
    : days >= 7  ? BRAND.theobroma
    : days >= 3  ? BRAND.mazorca
    : days >= 1  ? BRAND.pod
    : `${BRAND.heirloom}55`

  if (loading) {
    return (
      <div
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '8px 14px', borderRadius: 14,
          background: `${BRAND.bgCard}99`,
          border: `1px solid ${BRAND.amazon}`,
          color: `${BRAND.heirloom}55`,
          fontFamily: FONTS.body, fontSize: 11,
          minHeight: 36,
        }}
        aria-label="Cargando racha"
      >
        <span>·</span>
        <span>· · ·</span>
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 10,
        padding: compact ? '6px 12px' : '10px 16px',
        borderRadius: 14,
        background: `${BRAND.bgCard}cc`,
        border: `1px solid ${tierColor}66`,
        color: BRAND.heirloom,
        fontFamily: FONTS.body, fontSize: compact ? 11 : 12,
        minHeight: compact ? 28 : 44,
        transition: 'border-color 280ms ease-out',
      }}
      aria-label={`Racha de ${days} días, multiplicador +${multPct}%`}
    >
      <span style={{ fontSize: compact ? 14 : 18, lineHeight: 1, color: tierColor }}>
        {days >= 30 ? '⚜️' : days >= 7 ? '🔥' : days >= 1 ? '🌱' : '·'}
      </span>
      <span style={{ fontWeight: 600 }}>
        {days === 0 ? 'sin racha' : `${days} día${days === 1 ? '' : 's'}`}
      </span>
      {days > 0 && (
        <span
          style={{
            fontFamily: FONTS.display,
            color: tierColor,
            letterSpacing: '0.08em',
            fontSize: compact ? 10 : 11,
            opacity: 0.85,
          }}
        >
          +{multPct}%
        </span>
      )}
    </div>
  )
}
