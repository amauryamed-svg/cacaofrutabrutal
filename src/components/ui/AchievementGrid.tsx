import { useState } from 'react'
import { BRAND, FONTS } from '../../utils/constants'
import { useAchievements, type AchievementWithUnlock } from '../../hooks/useAchievements'

/**
 * Strip of badge dots. Locked = grayscale + lower opacity. Secret + locked
 * shows '?'. Click → drawer below the strip with full descripcion + reward.
 *
 * Mobile: horizontally scrolls if width tight.
 */
export default function AchievementGrid() {
  const { achievements, loading } = useAchievements()
  const [openId, setOpenId] = useState<string | null>(null)

  if (loading) {
    return (
      <div
        style={{
          display: 'flex', gap: 10, alignItems: 'center',
          fontFamily: FONTS.body, fontSize: 11, color: `${BRAND.heirloom}55`,
        }}
      >cargando logros …</div>
    )
  }

  const open = openId ? achievements.find((a) => a.id === openId) : null

  return (
    <div>
      <div
        role="list"
        style={{
          display: 'flex', gap: 10, flexWrap: 'wrap',
        }}
      >
        {achievements.map((a) => (
          <BadgeButton
            key={a.id}
            achievement={a}
            active={openId === a.id}
            onClick={() => setOpenId((c) => (c === a.id ? null : a.id))}
          />
        ))}
      </div>

      {open && (
        <div
          role="region"
          aria-label={`Detalle de ${open.name}`}
          style={{
            marginTop: 14,
            padding: 16,
            background: `${BRAND.bgCard}aa`,
            border: `1px solid ${BRAND.amazon}`,
            borderRadius: 14,
            color: BRAND.heirloom,
            fontFamily: FONTS.body,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <span style={{ fontSize: 24 }}>
              {open.unlocked_at || !open.secret ? open.icon : '?'}
            </span>
            <span style={{ fontFamily: FONTS.display, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', fontSize: 14 }}>
              {open.unlocked_at || !open.secret ? open.name : '???'}
            </span>
            <span style={{ fontFamily: FONTS.body, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: rarityColor(open.rarity), opacity: 0.85 }}>
              {open.rarity}
            </span>
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: `${BRAND.heirloom}cc`, margin: '0 0 8px 0' }}>
            {open.unlocked_at || !open.secret ? open.descripcion : 'Logro secreto. Cumple algo extraordinario.'}
          </p>
          <div style={{ fontFamily: FONTS.body, fontSize: 11, color: `${BRAND.mazorca}cc`, letterSpacing: '0.04em' }}>
            recompensa: +{open.reward_mz} mazorcas{open.unlocked_at ? ' · obtenido' : ''}
          </div>
        </div>
      )}
    </div>
  )
}

function BadgeButton({
  achievement,
  active,
  onClick,
}: {
  achievement: AchievementWithUnlock
  active: boolean
  onClick: () => void
}) {
  const unlocked = !!achievement.unlocked_at
  const showSecret = achievement.secret && !unlocked
  const ringColor = unlocked ? rarityColor(achievement.rarity) : `${BRAND.heirloom}33`
  return (
    <button
      type="button"
      role="listitem"
      onClick={onClick}
      aria-label={
        unlocked ? `${achievement.name} obtenido` :
        showSecret ? 'Logro secreto bloqueado' :
        `${achievement.name} bloqueado`
      }
      aria-pressed={active}
      style={{
        all: 'unset',
        cursor: 'pointer',
        width: 48, height: 48,
        minWidth: 48, minHeight: 48, // 44pt+ touch target
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 12,
        background: unlocked ? `${BRAND.bgCard}` : `${BRAND.bgCard}55`,
        border: `1.5px solid ${ringColor}${active ? 'ff' : '99'}`,
        boxShadow: active ? `0 0 0 3px ${ringColor}33` : 'none',
        filter: unlocked ? 'none' : 'grayscale(0.85) opacity(0.55)',
        fontSize: 22, lineHeight: 1,
        transition: 'all 220ms ease-out',
      }}
    >
      {showSecret ? '?' : achievement.icon}
    </button>
  )
}

function rarityColor(rarity: AchievementWithUnlock['rarity']) {
  switch (rarity) {
    case 'legendary': return BRAND.criollo
    case 'epic':      return BRAND.theobroma
    case 'rare':      return BRAND.mazorca
    default:          return BRAND.pod
  }
}
