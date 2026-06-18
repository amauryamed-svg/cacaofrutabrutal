/**
 * CryptoStatsPanel — crypto-bro style stats below the tree.
 *
 * Displays:
 *   [$CACAO balance] [MAZORCAS burned] [APY estimate] [Harvest streak]
 *
 * All numbers visible at a glance, Press Start 2P font, green glow.
 * This is the "defi dashboard" of the gotchi.
 */

import type { CSSProperties } from 'react'
import { BRAND, FONTS } from '../../utils/constants'
import { levelToMultiplier, calcLevel } from '../../utils/seasonSystem'

interface Props {
  cacaoBalance:   number    // on-chain $CACAO (or estimated)
  mazorcasBurned: number    // total mazorcas burned for $CACAO
  harvestStreak:  number    // consecutive daily harvests
  totalXP:        number
  harvestMult:    number    // current season × level multiplier
  lang?: 'es' | 'en'
}

export default function CryptoStatsPanel({
  cacaoBalance, mazorcasBurned, harvestStreak, totalXP, harvestMult, lang = 'es',
}: Props) {
  const es = lang === 'es'
  const lv = calcLevel(totalXP)
  const dailyYield = +(harvestMult * 12.5).toFixed(1)  // est. $CACAO/day per tree

  const stats = [
    {
      icon: '◈',
      label: '$CACAO',
      value: cacaoBalance.toFixed(2),
      sub: es ? 'balance' : 'balance',
      color: BRAND.heroic,
      glow: true,
    },
    {
      icon: '🌽',
      label: es ? 'QUEMADAS' : 'BURNED',
      value: mazorcasBurned.toString(),
      sub: 'mazorcas → $CACAO',
      color: BRAND.mazorca,
      glow: false,
    },
    {
      icon: '📈',
      label: es ? 'YIELD/DÍA' : 'YIELD/DAY',
      value: `~${dailyYield}`,
      sub: '$CACAO est.',
      color: BRAND.pod,
      glow: false,
    },
    {
      icon: '🔥',
      label: es ? 'RACHA' : 'STREAK',
      value: `${harvestStreak}×`,
      sub: es ? 'cosechas' : 'harvests',
      color: harvestStreak >= 3 ? BRAND.theobroma : `${BRAND.heirloom}66`,
      glow: harvestStreak >= 3,
    },
  ]

  return (
    <div style={wrapStyle}>
      {/* Header */}
      <div style={{
        fontFamily: "'Press Start 2P', monospace",
        fontSize: 6, color: `${BRAND.heirloom}44`,
        letterSpacing: '0.18em', textTransform: 'uppercase',
        textAlign: 'center', marginBottom: 10,
      }}>
        — {es ? 'TUS STATS ON-CHAIN' : 'YOUR ON-CHAIN STATS'} —
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
        {stats.map(s => (
          <StatCell key={s.label} {...s} />
        ))}
      </div>

      {/* Multiplier banner */}
      <div style={multBannerStyle(harvestMult)}>
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6, color: `${BRAND.heirloom}55`, letterSpacing: '0.14em' }}>
          HARVEST MULT
        </div>
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 14, color: BRAND.mazorca, textShadow: `0 0 12px ${BRAND.mazorca}` }}>
          {harvestMult.toFixed(1)}×
        </div>
        <div style={{ fontFamily: FONTS.display, fontSize: 10, color: `${BRAND.heirloom}66`, letterSpacing: '0.1em' }}>
          LVL {lv.level} · {levelToMultiplier(lv.level)}× base
        </div>
      </div>

      {/* Burn CTA */}
      <div style={burnCtaStyle}>
        <span style={{ fontSize: 13 }}>🌽</span>
        <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6, color: BRAND.mazorca, letterSpacing: '0.1em', flex: 1 }}>
          {es ? 'QUEMAR MAZORCAS → $CACAO' : 'BURN MAZORCAS → $CACAO'}
        </span>
        <span style={{ fontFamily: FONTS.display, fontSize: 9, color: `${BRAND.heirloom}44` }}>
          /burn →
        </span>
      </div>
    </div>
  )
}

// ─── StatCell ──────────────────────────────────────────────────────────────

function StatCell({
  icon, label, value, sub, color, glow,
}: {
  icon: string; label: string; value: string; sub: string; color: string; glow: boolean
}) {
  return (
    <div style={{
      background: `${color}10`,
      border: `1px solid ${color}33`,
      borderRadius: 8, padding: '10px 12px',
      display: 'flex', flexDirection: 'column', gap: 4,
      boxShadow: glow ? `0 0 12px ${color}22` : 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ fontSize: 14 }}>{icon}</span>
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 5, color: `${color}88`, letterSpacing: '0.1em' }}>
          {label}
        </div>
      </div>
      <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 11, color, letterSpacing: '0.04em', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontFamily: FONTS.display, fontSize: 9, color: `${color}66`, letterSpacing: '0.06em' }}>
        {sub}
      </div>
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const wrapStyle: CSSProperties = {
  background: '#132B1C88',
  border: `1px solid ${BRAND.amazon}44`,
  borderRadius: 12,
  padding: 'clamp(12px, 2.5vw, 16px)',
  marginTop: 12,
}

const multBannerStyle = (mult: number): CSSProperties => ({
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  marginTop: 10,
  padding: '10px 14px',
  background: mult >= 2 ? `${BRAND.mazorca}18` : `${BRAND.pod}10`,
  border: `1px solid ${mult >= 2 ? BRAND.mazorca : BRAND.pod}44`,
  borderRadius: 8,
  gap: 10, flexWrap: 'wrap',
})

const burnCtaStyle: CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8,
  marginTop: 10,
  padding: '8px 12px',
  background: `${BRAND.mazorca}10`,
  border: `1px solid ${BRAND.mazorca}33`,
  borderRadius: 6,
  cursor: 'pointer',
}
