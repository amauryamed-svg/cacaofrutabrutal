import { useState } from 'react'
import { BRAND, FONTS } from '../../utils/constants'
import { useAdoptaQuests, type AdoptaQuest } from '../../hooks/useAdoptaQuests'

/**
 * List of active adopta quests. Each row = pill with progress bar + claim
 * button when complete. Auto-refetches via realtime channel.
 *
 * Renders nothing if there are no active quests.
 */
export default function QuestPill() {
  const { active, loading, claim } = useAdoptaQuests()
  if (loading) return null
  if (active.length === 0) return null

  return (
    <div
      role="region"
      aria-label="Pactos activos"
      style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      <div
        style={{
          fontFamily: FONTS.display, fontWeight: 900,
          letterSpacing: '0.18em', textTransform: 'uppercase',
          fontSize: 11, color: `${BRAND.heirloom}99`,
        }}
      >
        Pactos activos
      </div>
      {active.map((q) => (
        <QuestRow key={q.id} quest={q} onClaim={() => claim(q.id)} />
      ))}
    </div>
  )
}

function QuestRow({
  quest,
  onClaim,
}: {
  quest: AdoptaQuest
  onClaim: () => Promise<{ ok: boolean; reward?: number; error?: string }>
}) {
  const [claiming, setClaiming] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const pct = Math.min(100, Math.round((quest.progress / Math.max(1, quest.target)) * 100))
  const ready = quest.state === 'complete'

  const onClick = async () => {
    if (claiming) return
    setClaiming(true)
    const r = await onClaim()
    if (r.ok) {
      setFeedback(r.reward ? `+${r.reward} mz` : 'reclamado')
    } else {
      setFeedback('error')
    }
    setClaiming(false)
    window.setTimeout(() => setFeedback(null), 2200)
  }

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 16px',
        background: `${BRAND.bgCard}aa`,
        border: `1px solid ${ready ? BRAND.mazorca : BRAND.amazon}`,
        borderRadius: 14,
        fontFamily: FONTS.body, color: BRAND.heirloom,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: FONTS.display, fontWeight: 900,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            fontSize: 12, marginBottom: 4,
            color: BRAND.heirloom,
          }}
        >
          {quest.title}
        </div>
        <div style={{ fontSize: 12, color: `${BRAND.heirloom}99`, marginBottom: 8, lineHeight: 1.5 }}>
          {quest.descripcion}
        </div>
        <div
          style={{
            position: 'relative',
            width: '100%', height: 4,
            background: BRAND.amazon, borderRadius: 2, overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${pct}%`, height: '100%',
              background: ready ? BRAND.mazorca : BRAND.pod,
              transition: 'width 600ms cubic-bezier(0.16,1,0.3,1)',
            }}
          />
        </div>
        <div
          style={{
            marginTop: 6,
            fontFamily: FONTS.body, fontSize: 10,
            color: `${BRAND.heirloom}77`, letterSpacing: '0.04em',
          }}
        >
          {quest.progress} / {quest.target} · recompensa +{quest.reward_mz} mz
        </div>
      </div>
      <button
        type="button"
        onClick={onClick}
        disabled={!ready || claiming}
        aria-label={ready ? `Reclamar ${quest.title}` : 'Aún no completado'}
        style={{
          all: 'unset',
          cursor: ready && !claiming ? 'pointer' : 'not-allowed',
          minWidth: 88, minHeight: 44,
          padding: '0 16px',
          textAlign: 'center',
          background: ready ? BRAND.mazorca : 'transparent',
          border: ready ? 'none' : `1px solid ${BRAND.amazon}`,
          color: ready ? BRAND.bgDeep : `${BRAND.heirloom}66`,
          fontFamily: FONTS.display, fontWeight: 900,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          fontSize: 11, borderRadius: 12,
          transition: 'opacity 220ms ease-out',
          opacity: claiming ? 0.5 : 1,
        }}
      >
        {feedback ?? (ready ? 'reclamar' : '—')}
      </button>
    </div>
  )
}
