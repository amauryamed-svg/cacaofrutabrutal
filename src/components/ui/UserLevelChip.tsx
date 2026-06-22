import { BRAND, FONTS } from '../../utils/constants'
import { useUserLevel } from '../../hooks/useUserLevel'

/**
 * Title + XP bar chip. Reads useUserLevel.
 *
 * Levels:
 *   L1 Aprendiz   0–99
 *   L2 Cuidador   100–499
 *   L3 Guardian   500–1999
 *   L4 Maestro    2000+
 *
 * Multipliers (server-side): L2 +5%, L3 +10%, L4 +15%.
 */
export default function UserLevelChip({ compact = false }: { compact?: boolean }) {
  const { level, nextLevelXp, progressToNext, loading } = useUserLevel()

  if (loading) {
    return (
      <div
        style={{
          display: 'inline-flex', alignItems: 'center',
          padding: '8px 14px', borderRadius: 14,
          background: `${BRAND.bgCard}99`, border: `1px solid ${BRAND.amazon}`,
          color: `${BRAND.heirloom}55`, fontFamily: FONTS.body, fontSize: 11,
          minHeight: 36,
        }}
      >· · ·</div>
    )
  }

  const tier = level.currentLevel
  const tierColor =
    tier === 4 ? BRAND.mazorca
    : tier === 3 ? BRAND.pod
    : tier === 2 ? BRAND.heroic
    : `${BRAND.heirloom}99`

  return (
    <div
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 12,
        padding: compact ? '6px 12px' : '10px 16px',
        borderRadius: 14,
        background: `${BRAND.bgCard}cc`,
        border: `1px solid ${tierColor}66`,
        color: BRAND.heirloom,
        fontFamily: FONTS.body, fontSize: compact ? 11 : 12,
        minHeight: compact ? 28 : 44,
      }}
      aria-label={`Nivel ${level.currentLevel} ${level.title}, ${level.totalXp} XP`}
    >
      <span
        style={{
          fontFamily: FONTS.display,
          fontWeight: 900,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: tierColor,
          fontSize: compact ? 10 : 11,
        }}
      >
        L{tier} · {level.title}
      </span>
      {/* XP bar */}
      <div
        style={{
          width: compact ? 60 : 88,
          height: 4,
          background: `${BRAND.amazon}`,
          borderRadius: 2,
          overflow: 'hidden',
        }}
        aria-hidden="true"
      >
        <div
          style={{
            width: `${Math.round(progressToNext * 100)}%`,
            height: '100%',
            background: tierColor,
            transition: 'width 600ms cubic-bezier(0.16,1,0.3,1)',
          }}
        />
      </div>
      <span
        style={{
          fontFamily: FONTS.body,
          fontSize: compact ? 10 : 11,
          color: `${BRAND.heirloom}99`,
        }}
      >
        {nextLevelXp === null
          ? `${level.totalXp} XP · max`
          : `${level.totalXp}/${nextLevelXp}`}
      </span>
    </div>
  )
}
