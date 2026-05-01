/**
 * CacaoPod — stylized SVG cacao pod for the harvest minigame.
 *
 * 3 ripeness shades reflect real cacao biology:
 *   - 'green'   → immature (just-formed pod, weeks from harvest)
 *   - 'yellow'  → ripening (turning, ~2 weeks out)
 *   - 'orange'  → ripe (peak harvest, ready to crack open)
 *
 * Renders as an SVG so the arena can pick a deterministic color per pod
 * (seeded by tree id) and slice halves cleanly via clip-path inset.
 */

export type PodColor = 'green' | 'yellow' | 'orange'

const PALETTE: Record<PodColor, { light: string; mid: string; dark: string; ridge: string }> = {
  green:  { light: '#9BC76B', mid: '#6BA940', dark: '#3E7026', ridge: '#1D3D14' },
  yellow: { light: '#F1D469', mid: '#E8B931', dark: '#A07A1A', ridge: '#523D0C' },
  orange: { light: '#F0A78F', mid: '#E47966', dark: '#A14938', ridge: '#52211A' },
}

interface Props {
  color: PodColor
  size?: number
  /** Slight rotation so pods don't all look the same. */
  tilt?: number
}

export default function CacaoPod({ color, size = 64, tilt = 0 }: Props) {
  const p = PALETTE[color]
  // Unique IDs so multiple instances on the same page don't collide on gradient defs.
  const gid = `pod-grad-${color}-${size}-${Math.round(tilt * 100)}`
  const sid = `pod-shine-${color}-${size}-${Math.round(tilt * 100)}`

  return (
    <svg
      width={size}
      height={size * 1.35}
      viewBox="0 0 60 81"
      style={{
        display: 'block',
        transform: tilt ? `rotate(${tilt}deg)` : undefined,
        filter: `drop-shadow(0 6px 10px ${p.dark}66)`,
      }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor={p.light} />
          <stop offset="55%"  stopColor={p.mid}   />
          <stop offset="100%" stopColor={p.dark}  />
        </linearGradient>
        <radialGradient id={sid} cx="30%" cy="20%" r="50%">
          <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0"    />
        </radialGradient>
      </defs>

      {/* Stem */}
      <path d="M30 2 L29 9 L31 9 Z" fill="#5C3416" />
      <ellipse cx="30" cy="3.5" rx="2.5" ry="1.5" fill="#3D200E" />

      {/* Pod body — vertical almond with subtle taper at the bottom */}
      <path
        d="M30 8
           C 48 8, 52 28, 50 50
           C 49 65, 40 76, 30 78
           C 20 76, 11 65, 10 50
           C 8 28, 12 8, 30 8 Z"
        fill={`url(#${gid})`}
        stroke={p.dark}
        strokeWidth="0.6"
      />

      {/* 5 longitudinal ridges — characteristic cacao pod look */}
      {[
        { d: 'M14 16 Q12 44 18 73' },
        { d: 'M22 11 Q20 44 24 76' },
        { d: 'M30 9  Q30 44 30 78' },
        { d: 'M38 11 Q40 44 36 76' },
        { d: 'M46 16 Q48 44 42 73' },
      ].map((r, i) => (
        <path key={i} d={r.d} fill="none" stroke={p.ridge} strokeWidth="0.7" opacity="0.55" strokeLinecap="round" />
      ))}

      {/* Top-left shine */}
      <ellipse cx="22" cy="26" rx="7" ry="14" fill={`url(#${sid})`} />

      {/* Subtle bottom shadow for depth */}
      <ellipse cx="32" cy="68" rx="14" ry="6" fill={p.dark} opacity="0.35" />
    </svg>
  )
}
