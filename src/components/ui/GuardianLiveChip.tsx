import { useEffect, useState } from 'react'
import { BRAND, FONTS } from '../../utils/constants'
import { supabase } from '../../lib/supabase'
import { useGuardianClimate, type ClimatePayload } from '../../hooks/useGuardianClimate'

/**
 * Composite chip for the SwipeableTreeCard "stakes" slide.
 *
 * Surfaces in one card:
 *  · Live weather (temp + humidity + status_label, color-coded ideal_band)
 *  · Social proof (count of adoptions in last 30 days for this guardian)
 *  · Top-3 leaderboard preview (anonymous, by 30d care)
 *  · Redemption preview line (today / 30d / 1000mz → $CACAO)
 *
 * Failure handling: each block degrades to "—" placeholder, never throws.
 */
export default function GuardianLiveChip({ guardianId }: { guardianId: number }) {
  const { climate } = useGuardianClimate(guardianId)
  const [count, setCount] = useState<number | null>(null)
  const [leaders, setLeaders] = useState<{ rank: number; display_name: string; care_count: number; streak_days: number }[]>([])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      const { data: cdata } = await supabase.rpc('guardian_adoption_count_30d')
      const rows = (cdata ?? []) as { guardian_id: number; adoption_count_30d: number }[]
      const match = rows.find((r) => r.guardian_id === guardianId)
      if (!cancelled) setCount(match?.adoption_count_30d ?? 0)

      const { data: ldata } = await supabase.rpc('guardian_leaderboard_30d', { p_guardian_id: guardianId })
      const lrows = (ldata ?? []) as { rank: number; display_name: string; care_count: number; streak_days: number }[]
      if (!cancelled) setLeaders(lrows.slice(0, 3))
    }
    void run()
    return () => { cancelled = true }
  }, [guardianId])

  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', gap: 16,
        padding: 18,
        background: `${BRAND.bgCard}cc`,
        border: `1px solid ${BRAND.amazon}`,
        borderRadius: 14,
        fontFamily: FONTS.body,
        color: BRAND.heirloom,
      }}
    >
      <ClimateBlock climate={climate} />
      <Divider />
      <SocialProofBlock count={count} />
      <Divider />
      <LeaderboardBlock leaders={leaders} />
      <Divider />
      <RedemptionMiniPreview />
    </div>
  )
}

function Divider() {
  return <div style={{ height: 1, background: `${BRAND.amazon}88` }} aria-hidden="true" />
}

function ClimateBlock({ climate }: { climate: ClimatePayload | null }) {
  const ok = climate?.ideal_band === 'optimal'
  const dotColor =
    !climate ? `${BRAND.heirloom}55`
    : ok ? BRAND.pod
    : (climate.ideal_band === 'warm' || climate.ideal_band === 'dry') ? BRAND.theobroma
    : BRAND.heroic
  return (
    <div>
      <Eyebrow>Clima en la finca</Eyebrow>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
        <span
          style={{
            width: 10, height: 10, borderRadius: '50%',
            background: dotColor,
            boxShadow: `0 0 12px ${dotColor}99`,
          }}
          aria-hidden="true"
        />
        {climate ? (
          <>
            <span style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 18, letterSpacing: '0.04em' }}>
              {climate.temp_avg_c.toFixed(1)}°C
            </span>
            <span style={{ color: `${BRAND.heirloom}99`, fontSize: 12 }}>
              · {climate.humidity_pct ?? '—'}% húmedad
            </span>
            <span style={{ color: `${BRAND.heirloom}99`, fontSize: 12 }}>
              · UV {climate.uv_index ?? '—'}
            </span>
          </>
        ) : (
          <span style={{ color: `${BRAND.heirloom}55`, fontSize: 12 }}>— datos no disponibles</span>
        )}
      </div>
      {climate && (
        <div
          style={{
            marginTop: 6,
            fontFamily: FONTS.body, fontSize: 11,
            color: `${BRAND.heirloom}99`, letterSpacing: '0.02em',
          }}
        >
          {climate.status_label}
        </div>
      )}
    </div>
  )
}

function SocialProofBlock({ count }: { count: number | null }) {
  return (
    <div>
      <Eyebrow>Movimiento</Eyebrow>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
        <span style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 22, color: BRAND.mazorca }}>
          {count === null ? '—' : count}
        </span>
        <span style={{ fontSize: 12, color: `${BRAND.heirloom}99` }}>
          adopciones · últimos 30 días
        </span>
      </div>
    </div>
  )
}

function LeaderboardBlock({ leaders }: { leaders: { rank: number; display_name: string; care_count: number; streak_days: number }[] }) {
  if (leaders.length === 0) {
    return (
      <div>
        <Eyebrow>Top cuidadores</Eyebrow>
        <div style={{ marginTop: 6, fontSize: 12, color: `${BRAND.heirloom}55` }}>
          aún sin clasificación
        </div>
      </div>
    )
  }
  return (
    <div>
      <Eyebrow>Top cuidadores · 30d</Eyebrow>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
        {leaders.map((l) => (
          <div
            key={l.rank}
            style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}
          >
            <span style={{ fontFamily: FONTS.display, fontWeight: 900, color: BRAND.pod, width: 24 }}>
              #{l.rank}
            </span>
            <span style={{ flex: 1, color: BRAND.heirloom }}>{l.display_name}</span>
            <span style={{ color: `${BRAND.heirloom}99` }}>
              {l.care_count} cuidados
            </span>
            {l.streak_days > 0 && (
              <span style={{ color: BRAND.theobroma }}>· {l.streak_days}d 🔥</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function RedemptionMiniPreview() {
  return (
    <div>
      <Eyebrow>Redención</Eyebrow>
      <div style={{ marginTop: 6, fontSize: 12, color: `${BRAND.heirloom}cc`, lineHeight: 1.6 }}>
        🎁 hoy · gift card $10K en Cacao Ceremony<br />
        🍫 día 30 · primera mazorca cosechable<br />
        ⚗ 1000 mz → 1 $CACAO on-chain
      </div>
    </div>
  )
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: FONTS.display, fontWeight: 900,
        letterSpacing: '0.22em', textTransform: 'uppercase',
        fontSize: 10, color: `${BRAND.heirloom}77`,
      }}
    >
      {children}
    </div>
  )
}
