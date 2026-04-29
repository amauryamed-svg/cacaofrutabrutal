import { useMemo } from 'react'

/**
 * A real cacao tree growing in real-time. Replaces the previous Gameboy
 * pixel-art sprite. Parametric SVG composed of:
 *
 *   - soil mound (color shifts dry ↔ wet by `moisture`)
 *   - bean / seed (visible only at stage 0)
 *   - trunk (slim white-grey with moss patches, height scales by stage)
 *   - branches (appear stage 3+)
 *   - canopy leaves (count scales by stage; saturation by `sunlight`; droop by `moisture` & `health`)
 *   - flowers (stage 5 only — white florets directly on trunk, cauliflory)
 *   - mazorcas (stage 6 green-yellow, stage 7 red ripe with golden halo)
 *   - sun rays (intensity by `sunlight`)
 *   - leaf litter (stage 4+)
 *
 * The visual reference is the canopy / cauliflory cacao photo: slim mossy
 * trunk, lush green leaves, mazorcas growing straight from the bark.
 *
 * The component is stateless. Stage transitions look smooth because every
 * element uses CSS `transition` for the props that change. Care actions
 * fire a transient `effect` from the parent (passed as a `cue` prop) which
 * the LivingTree responds to by playing a one-shot animation.
 */

export interface LivingTreeProps {
  /** 0..7 (integer stage from growthSystem) */
  stage: number
  /** 0..100 */
  health: number
  /** 0..100 */
  moisture: number
  /** 0..100 */
  sunlight: number
  /** Active problem id from PLANT_PROBLEMS, or null. */
  problem?: string | null
  /** True when the tree died (Maduración window expired without harvest). */
  isDead?: boolean
  /** Optional CSS width override (default: '100%'). */
  width?: number | string
  /** Optional aspect-friendly height. */
  height?: number | string
}

// Per-stage parameters. Each row defines what's visible & how big.
const STAGES = [
  // stage,  trunkH,  leafCount,  flowers, podStage, beanShown
  { trunkH: 0.00, leaves: 0,  flowers: false, pods: 'none' as const, bean: true  }, // 0 Siembra
  { trunkH: 0.10, leaves: 0,  flowers: false, pods: 'none' as const, bean: false }, // 1 Germinación
  { trunkH: 0.18, leaves: 4,  flowers: false, pods: 'none' as const, bean: false }, // 2 Plántula
  { trunkH: 0.32, leaves: 8,  flowers: false, pods: 'none' as const, bean: false }, // 3 Crecimiento
  { trunkH: 0.55, leaves: 18, flowers: false, pods: 'none' as const, bean: false }, // 4 Desarrollo
  { trunkH: 0.78, leaves: 30, flowers: true,  pods: 'none' as const, bean: false }, // 5 Floración
  { trunkH: 0.95, leaves: 38, flowers: false, pods: 'green' as const, bean: false }, // 6 Formación
  { trunkH: 1.00, leaves: 42, flowers: false, pods: 'red' as const,   bean: false }, // 7 Maduración
] as const

export default function LivingTree({
  stage,
  health,
  moisture,
  sunlight,
  problem = null,
  isDead = false,
  width = '100%',
  height = 'auto',
}: LivingTreeProps) {
  const safeStage = Math.max(0, Math.min(7, Math.round(stage)))
  const params = STAGES[safeStage]

  // Dead trees are forced into terminal-wilt state regardless of vital values.
  // Soil dries to bone, leaves brown out, pods drop, no animations.
  const wilt = isDead ? 1   : Math.max(0, (60 - health)   / 60)
  const dry  = isDead ? 1   : Math.max(0, (50 - moisture) / 50)
  const dim  = isDead ? 0.8 : Math.max(0, (50 - sunlight) / 50)

  // Color palette — derived inputs.
  const soilColor   = mixHex('#3a2914', '#7a5a30', dry)  // moist → dry
  const leafColor   = isDead
    ? '#3a2410'
    : (problem === 'fungus'
      ? '#5a4a1c'
      : mixHex('#2f6b1a', '#86913f', dry * 0.7 + dim * 0.4 + wilt * 0.3))
  const leafShadow  = isDead ? '#1f1408' : mixHex('#173a0e', '#5b6429', dry * 0.5 + wilt * 0.3)
  const trunkColor  = isDead ? '#5a4a3a' : mixHex('#cfd1c5', '#a89c8a', wilt * 0.4)
  const trunkMoss   = isDead ? '#3a3020' : '#8aa45a'
  const podRipe     = '#a02b1d'
  const podYoung    = '#d6a035'
  const flowerColor = '#fff7e8'

  // Trunk geometry — anchored at soil line y=420, grows upward.
  const trunkBaseY  = 420
  const trunkMaxH   = 320
  const trunkH      = trunkMaxH * params.trunkH
  const trunkTopY   = trunkBaseY - trunkH
  const trunkBaseX  = 200
  const trunkBaseW  = 36 * Math.max(0.35, params.trunkH)  // wider as it grows
  const trunkTopW   = 22 * Math.max(0.35, params.trunkH)

  // Sun position
  const sunOpacity = Math.max(0.05, 1 - dim) * 0.35

  // Leaf placement — deterministic distribution around upper trunk + branches.
  const leaves = useMemo(() => {
    const out: { x: number; y: number; r: number; rot: number; tilt: number; delay: number }[] = []
    const seed = (i: number) => Math.abs(Math.sin(i * 12.9898 + 78.233) * 43758.5453) % 1
    const count = params.leaves
    if (count === 0) return out
    // Canopy region — top 60% of trunk, fanned outward.
    const topY = trunkTopY
    const canopyHeight = Math.max(60, trunkH * 0.55)
    for (let i = 0; i < count; i++) {
      const a = seed(i)
      const b = seed(i + 137)
      const c = seed(i + 421)
      // Polar-ish position: angle around trunk top + radius
      const angle = (a - 0.5) * 2.8           // -1.4 .. 1.4
      const radius = 22 + b * 80              // outward spread
      const yOff = c * canopyHeight           // vertical spread within canopy
      out.push({
        x: trunkBaseX + Math.sin(angle) * radius,
        y: topY + yOff - 10,
        r: 7 + b * 5,                          // 7..12 px leaf radius
        rot: angle * 30 + (a - 0.5) * 40,      // tilt
        tilt: wilt * 22 + dry * 12,            // droop angle (degrees)
        delay: c * 4,                           // sway delay
      })
    }
    return out
  }, [params.leaves, trunkH, trunkTopY, wilt, dry])

  // Pod placement — 3 to 5 mazorcas hung off the upper-mid trunk.
  // Dead trees drop their pods (forfeit visual cue).
  const pods = useMemo(() => {
    if (isDead) return []
    if (params.pods === 'none') return []
    const seed = (i: number) => Math.abs(Math.sin(i * 91.7 + 41.123) * 12345.6789) % 1
    const podsCount = params.pods === 'red' ? 5 : 4
    const out: { x: number; y: number; rot: number; size: number; delay: number }[] = []
    for (let i = 0; i < podsCount; i++) {
      const a = seed(i)
      const b = seed(i + 7)
      // Pods cluster on the upper-mid trunk, slightly outward
      const yFrac = 0.35 + a * 0.45            // 35-80% up the trunk
      const side  = b > 0.5 ? 1 : -1
      const xOff  = side * (10 + b * 14)
      out.push({
        x: trunkBaseX + xOff,
        y: trunkBaseY - trunkH * yFrac,
        rot: side * (15 + b * 18),
        size: 7 + b * 4,
        delay: a * 3,
      })
    }
    return out
  }, [params.pods, trunkH])

  // Flowers — small white florets on trunk. Dead trees lose them.
  const flowers = useMemo(() => {
    if (isDead) return []
    if (!params.flowers) return []
    const seed = (i: number) => Math.abs(Math.sin(i * 53.1 + 17.5) * 9999.9) % 1
    const out: { x: number; y: number; size: number }[] = []
    for (let i = 0; i < 6; i++) {
      const a = seed(i)
      const b = seed(i + 11)
      const yFrac = 0.40 + a * 0.40
      const side = b > 0.5 ? 1 : -1
      out.push({
        x: trunkBaseX + side * (8 + b * 10),
        y: trunkBaseY - trunkH * yFrac,
        size: 2.5 + b * 1.5,
      })
    }
    return out
  }, [params.flowers, trunkH])

  return (
    <svg
      viewBox="0 0 400 500"
      width={width}
      height={height}
      preserveAspectRatio="xMidYMax meet"
      role="img"
      aria-label="Cacao tree growing"
      style={{ display: 'block', overflow: 'visible' }}
    >
      <defs>
        <radialGradient id="lt-sky" cx="50%" cy="0%" r="100%">
          <stop offset="0%"   stopColor="#1f3a26" />
          <stop offset="60%"  stopColor="#0e1e15" />
          <stop offset="100%" stopColor="#040C06" />
        </radialGradient>
        <radialGradient id="lt-sun" cx="80%" cy="20%" r="60%">
          <stop offset="0%"   stopColor="#f1c84a" stopOpacity="0.8" />
          <stop offset="40%"  stopColor="#e8a132" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#040C06" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="lt-soil" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor={soilColor} />
          <stop offset="100%" stopColor="#1d1208" />
        </linearGradient>
        <radialGradient id="lt-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#f1a91e" stopOpacity="0.55" />
          <stop offset="60%"  stopColor="#a02b1d" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#a02b1d" stopOpacity="0" />
        </radialGradient>
        {/* Leaf gradient — top-light to bottom-shadow */}
        <linearGradient id="lt-leaf" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor={leafColor} />
          <stop offset="100%" stopColor={leafShadow} />
        </linearGradient>
      </defs>

      {/* Sky background */}
      <rect x="0" y="0" width="400" height="500" fill="url(#lt-sky)" />

      {/* Sun glow — top right, intensity tied to sunlight */}
      <rect x="0" y="0" width="400" height="500" fill="url(#lt-sun)" opacity={sunOpacity} />

      {/* Soil mound */}
      <ellipse cx="200" cy="430" rx="180" ry="46" fill="url(#lt-soil)" />
      <ellipse cx="200" cy="425" rx="160" ry="34" fill="#1d1208" opacity="0.4" />

      {/* Leaf litter at base — visible from stage 4+ */}
      {safeStage >= 4 && (
        <g opacity="0.7">
          {[...Array(14)].map((_, i) => {
            const seed = Math.abs(Math.sin(i * 31.7) * 1000) % 1
            const x = 80 + seed * 240
            const y = 420 + ((i % 3) * 6)
            const rot = (seed - 0.5) * 60
            return (
              <ellipse key={i}
                cx={x} cy={y} rx="9" ry="3.5"
                fill={mixHex('#5a3a1a', '#3a2914', seed)}
                transform={`rotate(${rot} ${x} ${y})`}
              />
            )
          })}
        </g>
      )}

      {/* Bean / seed — visible only stage 0, never on dead trees */}
      {params.bean && !isDead && (
        <g className="lt-bean">
          <ellipse cx="200" cy="412" rx="14" ry="9" fill="#583915" />
          <ellipse cx="200" cy="410" rx="13" ry="7.5" fill="#7a4f1f" />
          <line x1="200" y1="404" x2="200" y2="418" stroke="#3a2410" strokeWidth="1" />
        </g>
      )}

      {/* Death — fallen pods scattered around the soil + skull marker */}
      {isDead && (
        <g aria-hidden="true">
          {[...Array(6)].map((_, i) => {
            const seed = Math.abs(Math.sin(i * 17.3) * 100) % 1
            const x = 90 + seed * 220
            const y = 425 + ((i % 3) * 8)
            const rot = (seed - 0.5) * 80
            return (
              <ellipse key={`fpod-${i}`}
                cx={x} cy={y} rx="7" ry="3.5"
                fill="#5a1a14" opacity="0.55"
                transform={`rotate(${rot} ${x} ${y})`}
              />
            )
          })}
          {/* Skull centered at canopy area — soft, low-contrast */}
          <text x="200" y={trunkTopY + 30}
            textAnchor="middle" fontSize="48"
            opacity="0.7" style={{ pointerEvents: 'none' }}>
            💀
          </text>
        </g>
      )}

      {/* Roots — subtle, stages 1+ */}
      {safeStage >= 1 && (
        <g opacity="0.55" stroke={mixHex('#5a3a1a', '#7a5a2a', dry)} strokeWidth="2" fill="none" strokeLinecap="round">
          <path d={`M ${trunkBaseX - 6} 425 Q ${trunkBaseX - 26} 432, ${trunkBaseX - 38} 444`} />
          <path d={`M ${trunkBaseX + 6} 425 Q ${trunkBaseX + 22} 432, ${trunkBaseX + 36} 442`} />
          <path d={`M ${trunkBaseX} 426 L ${trunkBaseX} 446`} />
        </g>
      )}

      {/* Trunk — slim, white-grey with moss patches. Tapered. */}
      {safeStage >= 1 && (
        <g className="lt-trunk-group" style={{ transition: 'transform 1.2s cubic-bezier(0.16, 1, 0.3, 1)' }}>
          <path
            d={`M ${trunkBaseX - trunkBaseW / 2} ${trunkBaseY}
                Q ${trunkBaseX - trunkBaseW / 2 - 2} ${trunkBaseY - trunkH * 0.5},
                  ${trunkBaseX - trunkTopW / 2} ${trunkTopY}
                L ${trunkBaseX + trunkTopW / 2} ${trunkTopY}
                Q ${trunkBaseX + trunkBaseW / 2 + 2} ${trunkBaseY - trunkH * 0.5},
                  ${trunkBaseX + trunkBaseW / 2} ${trunkBaseY} Z`}
            fill={trunkColor}
            style={{ transition: 'fill 1s ease-out, d 1.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
          />
          {/* Trunk shading — left side darker */}
          <path
            d={`M ${trunkBaseX - trunkBaseW / 2} ${trunkBaseY}
                Q ${trunkBaseX - trunkBaseW / 2 - 2} ${trunkBaseY - trunkH * 0.5},
                  ${trunkBaseX - trunkTopW / 2} ${trunkTopY}
                L ${trunkBaseX - trunkTopW / 2 + 5} ${trunkTopY}
                Q ${trunkBaseX - trunkBaseW / 2 + 3} ${trunkBaseY - trunkH * 0.5},
                  ${trunkBaseX - trunkBaseW / 2 + 5} ${trunkBaseY} Z`}
            fill="#7c8071"
            opacity="0.4"
          />
          {/* Moss patches — fixed count, scale with trunk */}
          {trunkH > 60 && [
            { y: 0.78, side: -1, size: 6 },
            { y: 0.55, side:  1, size: 5 },
            { y: 0.30, side: -1, size: 4.5 },
            { y: 0.15, side:  1, size: 4 },
          ].map((m, i) => (
            <ellipse key={i}
              cx={trunkBaseX + m.side * (trunkBaseW * 0.25)}
              cy={trunkBaseY - trunkH * m.y}
              rx={m.size} ry={m.size * 0.7}
              fill={trunkMoss} opacity="0.55"
            />
          ))}
        </g>
      )}

      {/* Branches — emerge from upper trunk at stage 3+ */}
      {safeStage >= 3 && (
        <g stroke={trunkColor} strokeWidth={Math.max(1.5, trunkTopW * 0.18)} strokeLinecap="round" fill="none" opacity="0.9">
          <path d={`M ${trunkBaseX - 4} ${trunkTopY + 16} Q ${trunkBaseX - 50} ${trunkTopY + 4}, ${trunkBaseX - 90} ${trunkTopY - 24}`} />
          <path d={`M ${trunkBaseX + 4} ${trunkTopY + 16} Q ${trunkBaseX + 52} ${trunkTopY + 8}, ${trunkBaseX + 92} ${trunkTopY - 18}`} />
          {safeStage >= 4 && (
            <path d={`M ${trunkBaseX} ${trunkTopY + 4} L ${trunkBaseX + 4} ${trunkTopY - 30}`} />
          )}
        </g>
      )}

      {/* Canopy — leaves around upper trunk + branches */}
      <g className="lt-canopy">
        {leaves.map((leaf, i) => (
          <g key={i}
             className="lt-leaf"
             style={{
               transformOrigin: `${leaf.x}px ${leaf.y}px`,
               transformBox: 'fill-box',
               animationDelay: `${leaf.delay}s`,
             }}
             transform={`rotate(${leaf.rot + leaf.tilt} ${leaf.x} ${leaf.y})`}
          >
            <ellipse cx={leaf.x} cy={leaf.y} rx={leaf.r * 1.5} ry={leaf.r * 0.7} fill="url(#lt-leaf)" />
            <line x1={leaf.x - leaf.r * 1.5} y1={leaf.y} x2={leaf.x + leaf.r * 1.5} y2={leaf.y}
              stroke={leafShadow} strokeWidth="0.6" opacity="0.5" />
          </g>
        ))}
      </g>

      {/* Flowers — stage 5 only, small white florets directly on trunk (cauliflory) */}
      {flowers.map((f, i) => (
        <g key={i}>
          <circle cx={f.x} cy={f.y} r={f.size + 1} fill={flowerColor} opacity="0.9" />
          <circle cx={f.x} cy={f.y} r={f.size * 0.4} fill="#f1c84a" />
        </g>
      ))}

      {/* Mazorcas — stage 6 (young) and stage 7 (ripe) */}
      {pods.map((pod, i) => {
        const isRipe = params.pods === 'red'
        const color = isRipe ? podRipe : podYoung
        return (
          <g key={i} transform={`rotate(${pod.rot} ${pod.x} ${pod.y})`}>
            {/* Halo for ripe pods */}
            {isRipe && (
              <circle cx={pod.x} cy={pod.y} r={pod.size * 3} fill="url(#lt-halo)" />
            )}
            {/* Pod shape — elongated tear/cabosse */}
            <ellipse cx={pod.x} cy={pod.y} rx={pod.size * 0.6} ry={pod.size * 1.4} fill={color} />
            {/* Highlight stripe */}
            <ellipse cx={pod.x - pod.size * 0.18} cy={pod.y} rx={pod.size * 0.1} ry={pod.size * 1.1}
              fill={mixHex(color, '#ffffff', 0.35)} opacity="0.7" />
            {/* Stem */}
            <line x1={pod.x} y1={pod.y - pod.size * 1.4} x2={pod.x} y2={pod.y - pod.size * 1.7}
              stroke="#3a2914" strokeWidth="1" />
            {/* Ridges */}
            {isRipe && (
              <>
                <line x1={pod.x} y1={pod.y - pod.size * 1.3} x2={pod.x} y2={pod.y + pod.size * 1.3}
                  stroke="#5a1a14" strokeWidth="0.6" opacity="0.6" />
                <line x1={pod.x - pod.size * 0.3} y1={pod.y - pod.size * 1.2} x2={pod.x - pod.size * 0.3} y2={pod.y + pod.size * 1.2}
                  stroke="#5a1a14" strokeWidth="0.5" opacity="0.5" />
                <line x1={pod.x + pod.size * 0.3} y1={pod.y - pod.size * 1.2} x2={pod.x + pod.size * 0.3} y2={pod.y + pod.size * 1.2}
                  stroke="#5a1a14" strokeWidth="0.5" opacity="0.5" />
              </>
            )}
          </g>
        )
      })}

      {/* Problem overlay — emoji floating, low-opacity tint */}
      {problem && (
        <g className="lt-problem">
          <rect x="0" y="0" width="400" height="500"
            fill={problem === 'fungus' ? '#3a1a3a' : problem === 'plague' ? '#3a1a0a' : '#2a1a0a'}
            opacity="0.18"
          />
        </g>
      )}

      {/* Animations */}
      <style>{`
        .lt-leaf {
          animation: lt-sway 4.5s ease-in-out infinite;
          transform-origin: center;
        }
        @keyframes lt-sway {
          0%, 100% { transform: rotate(0deg); }
          50%      { transform: rotate(2deg); }
        }
        .lt-bean {
          animation: lt-bean-pulse 2.4s ease-in-out infinite;
          transform-origin: 200px 410px;
        }
        @keyframes lt-bean-pulse {
          0%, 100% { transform: scale(1);    filter: brightness(1); }
          50%      { transform: scale(1.06); filter: brightness(1.15); }
        }
        @media (prefers-reduced-motion: reduce) {
          .lt-leaf, .lt-bean { animation: none !important; }
        }
        ${isDead ? `
          .lt-leaf, .lt-bean { animation: none !important; }
        ` : ''}
      `}</style>
    </svg>
  )
}

// ─── Color helpers ────────────────────────────────────────────────────

function mixHex(a: string, b: string, t: number): string {
  const tc = Math.max(0, Math.min(1, t))
  const ar = parseInt(a.slice(1, 3), 16), ag = parseInt(a.slice(3, 5), 16), ab = parseInt(a.slice(5, 7), 16)
  const br = parseInt(b.slice(1, 3), 16), bg = parseInt(b.slice(3, 5), 16), bb = parseInt(b.slice(5, 7), 16)
  const r = Math.round(ar + (br - ar) * tc)
  const g = Math.round(ag + (bg - ag) * tc)
  const bch = Math.round(ab + (bb - ab) * tc)
  return '#' + [r, g, bch].map(n => n.toString(16).padStart(2, '0')).join('')
}
