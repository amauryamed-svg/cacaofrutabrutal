import { useMemo } from 'react'

/**
 * LivingTree — parametric SVG cacao tree, indie-game-styled.
 *
 * Visual references: Monument Valley (clean shapes, single warm light source,
 * layered depth) × Sky: Children of Light (golden particle glow) × Stardew
 * (cute character touches). The tree is a CauaGotchi: it has eyes, blinks,
 * and reacts to its vitals (sad eyes when health is low, glow when healthy).
 *
 * Layers (back to front):
 *   sky gradient → distant mountains → mid mountains → fog band →
 *   sun disc + rays → ground shadow → soil mound + grass tufts →
 *   roots → trunk (2-tone painterly + bark lines) → branches →
 *   canopy aura glow → leaves (heart-shaped with vein) → flowers →
 *   pods (with halo on ripe) → floating particles → CauaGotchi face.
 *
 * Inputs are stage (0-7) plus health/moisture/sunlight (0-100). Death and
 * problem flags shift palette + drop animations + face expression.
 */

export interface LivingTreeProps {
  stage: number
  health: number
  moisture: number
  sunlight: number
  problem?: string | null
  isDead?: boolean
  width?: number | string
  height?: number | string
  /** Optional: hide the cute face (e.g. inside the AdoptaIntro seed scene). */
  hideFace?: boolean
}

const STAGES = [
  { trunkH: 0.00, leaves: 0,  flowers: false, pods: 'none' as const, bean: true  },
  { trunkH: 0.10, leaves: 0,  flowers: false, pods: 'none' as const, bean: false },
  { trunkH: 0.18, leaves: 4,  flowers: false, pods: 'none' as const, bean: false },
  { trunkH: 0.32, leaves: 8,  flowers: false, pods: 'none' as const, bean: false },
  { trunkH: 0.55, leaves: 18, flowers: false, pods: 'none' as const, bean: false },
  { trunkH: 0.78, leaves: 30, flowers: true,  pods: 'none' as const, bean: false },
  { trunkH: 0.95, leaves: 38, flowers: false, pods: 'green' as const, bean: false },
  { trunkH: 1.00, leaves: 42, flowers: false, pods: 'red' as const,   bean: false },
] as const

export default function LivingTree({
  stage, health, moisture, sunlight,
  problem = null, isDead = false,
  width = '100%', height = 'auto',
  hideFace = false,
}: LivingTreeProps) {
  const safeStage = Math.max(0, Math.min(7, Math.round(stage)))
  const params = STAGES[safeStage]

  const wilt = isDead ? 1   : Math.max(0, (60 - health)   / 60)
  const dry  = isDead ? 1   : Math.max(0, (50 - moisture) / 50)
  const dim  = isDead ? 0.8 : Math.max(0, (50 - sunlight) / 50)
  const happy = isDead ? 0 : Math.max(0, (Math.min(100, health) + Math.min(100, moisture) + Math.min(100, sunlight)) / 300)

  // Palette
  const skyTop      = isDead ? '#1a1410' : mixHex('#2A1F3A', '#F4B97D', 1 - dim) // dawn → night
  const skyMid      = isDead ? '#0E0A06' : mixHex('#3A2C5A', '#E89B73', 1 - dim)
  const horizonGlow = isDead ? '#1a1106' : mixHex('#5C4A4F', '#FFD58A', 1 - dim)
  const groundDark  = '#0d1c12'
  const soilColor   = mixHex('#3a2914', '#7a5a30', dry)
  const leafBase    = isDead ? '#3a2410' : (problem === 'fungus' ? '#5a4a1c' : mixHex('#2f6b1a', '#86913f', dry * 0.7 + dim * 0.4 + wilt * 0.3))
  const leafHi      = isDead ? '#5a3a18' : mixHex('#4d8f2c', '#a3b551', dry * 0.5 + dim * 0.3)
  const leafShadow  = isDead ? '#1f1408' : mixHex('#173a0e', '#5b6429', dry * 0.5 + wilt * 0.3)
  const trunkLight  = isDead ? '#7a6a5a' : mixHex('#d8d4c5', '#b6a890', wilt * 0.4)
  const trunkDark   = isDead ? '#3a2e22' : mixHex('#7a6a52', '#5a4a35', wilt * 0.4)
  const trunkMoss   = isDead ? '#3a3020' : '#8aa45a'
  const podRipe     = '#a02b1d'
  const podYoung    = '#d6a035'
  const flowerColor = '#fff7e8'
  const sunColor    = isDead ? '#3a3030' : mixHex('#FFEDC0', '#FFD58A', dim * 0.4)

  const trunkBaseY  = 420
  const trunkMaxH   = 320
  const trunkH      = trunkMaxH * params.trunkH
  const trunkTopY   = trunkBaseY - trunkH
  const trunkBaseX  = 200
  const trunkBaseW  = 36 * Math.max(0.35, params.trunkH)
  const trunkTopW   = 22 * Math.max(0.35, params.trunkH)

  // Leaves — placed around upper trunk, heart-shaped via single path.
  const leaves = useMemo(() => {
    const out: { x: number; y: number; r: number; rot: number; tilt: number; delay: number }[] = []
    const seed = (i: number) => Math.abs(Math.sin(i * 12.9898 + 78.233) * 43758.5453) % 1
    const count = params.leaves
    if (count === 0) return out
    const topY = trunkTopY
    const canopyHeight = Math.max(60, trunkH * 0.55)
    for (let i = 0; i < count; i++) {
      const a = seed(i)
      const b = seed(i + 137)
      const c = seed(i + 421)
      const angle = (a - 0.5) * 2.8
      const radius = 22 + b * 80
      const yOff = c * canopyHeight
      out.push({
        x: trunkBaseX + Math.sin(angle) * radius,
        y: topY + yOff - 10,
        r: 8 + b * 5,
        rot: angle * 30 + (a - 0.5) * 40,
        tilt: wilt * 22 + dry * 12,
        delay: c * 4,
      })
    }
    return out
  }, [params.leaves, trunkH, trunkTopY, wilt, dry])

  const pods = useMemo(() => {
    if (isDead || params.pods === 'none') return []
    const seed = (i: number) => Math.abs(Math.sin(i * 91.7 + 41.123) * 12345.6789) % 1
    const podsCount = params.pods === 'red' ? 5 : 4
    const out: { x: number; y: number; rot: number; size: number; delay: number }[] = []
    for (let i = 0; i < podsCount; i++) {
      const a = seed(i); const b = seed(i + 7)
      const yFrac = 0.35 + a * 0.45
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
  }, [params.pods, trunkH, isDead])

  const flowers = useMemo(() => {
    if (isDead || !params.flowers) return []
    const seed = (i: number) => Math.abs(Math.sin(i * 53.1 + 17.5) * 9999.9) % 1
    const out: { x: number; y: number; size: number }[] = []
    for (let i = 0; i < 6; i++) {
      const a = seed(i); const b = seed(i + 11)
      const yFrac = 0.40 + a * 0.40
      const side = b > 0.5 ? 1 : -1
      out.push({
        x: trunkBaseX + side * (8 + b * 10),
        y: trunkBaseY - trunkH * yFrac,
        size: 2.8 + b * 1.6,
      })
    }
    return out
  }, [params.flowers, trunkH, isDead])

  // Floating particles (fireflies / pollen) — appear stage 3+ and only when not dead.
  const particles = useMemo(() => {
    if (isDead || safeStage < 3) return []
    const seed = (i: number) => Math.abs(Math.sin(i * 71.3 + 9.7) * 5555.5) % 1
    return Array.from({ length: 6 }).map((_, i) => {
      const a = seed(i); const b = seed(i + 19); const c = seed(i + 53)
      return {
        x: 80 + a * 240,
        y: trunkTopY + b * 160,
        r: 1.6 + c * 1.2,
        delay: a * 6,
        dur: 6 + b * 4,
      }
    })
  }, [safeStage, trunkTopY, isDead])

  // Face position — centered on trunk, roughly upper-mid (only when stage ≥ 2).
  const faceY = trunkBaseY - trunkH * 0.62
  const showFace = !hideFace && !isDead && safeStage >= 2

  // Eye expression based on health.
  const eyeMood: 'happy' | 'normal' | 'sad' =
    health < 35 ? 'sad'
    : health > 75 ? 'happy'
    : 'normal'

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
        {/* Dawn-to-dusk vertical sky gradient. */}
        <linearGradient id="lt-sky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"  stopColor={skyTop} />
          <stop offset="55%" stopColor={skyMid} />
          <stop offset="100%" stopColor={horizonGlow} />
        </linearGradient>
        {/* Sun corona — soft radial. */}
        <radialGradient id="lt-sun-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={sunColor} stopOpacity="0.95" />
          <stop offset="40%" stopColor={sunColor} stopOpacity="0.32" />
          <stop offset="100%" stopColor={sunColor} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="lt-soil" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={soilColor} />
          <stop offset="100%" stopColor="#1d1208" />
        </linearGradient>
        {/* Pod ripeness halo */}
        <radialGradient id="lt-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%"  stopColor="#f1a91e" stopOpacity="0.7" />
          <stop offset="60%" stopColor="#a02b1d" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#a02b1d" stopOpacity="0" />
        </radialGradient>
        {/* Healthy canopy aura */}
        <radialGradient id="lt-aura" cx="50%" cy="50%" r="50%">
          <stop offset="0%"  stopColor="#cfe88a" stopOpacity={0.45 * happy} />
          <stop offset="60%" stopColor="#86913f" stopOpacity={0.15 * happy} />
          <stop offset="100%" stopColor="#86913f" stopOpacity="0" />
        </radialGradient>
        {/* Painterly leaf — top hi → mid → shadow */}
        <linearGradient id="lt-leaf-grad" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%"  stopColor={leafHi} />
          <stop offset="55%" stopColor={leafBase} />
          <stop offset="100%" stopColor={leafShadow} />
        </linearGradient>
        {/* Trunk gradient — left light, right dark. */}
        <linearGradient id="lt-trunk-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"  stopColor={trunkLight} />
          <stop offset="55%" stopColor={mixHex(trunkLight, trunkDark, 0.5)} />
          <stop offset="100%" stopColor={trunkDark} />
        </linearGradient>
        {/* Pod painterly */}
        <radialGradient id="lt-pod-ripe" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#e36a3c" />
          <stop offset="55%" stopColor={podRipe} />
          <stop offset="100%" stopColor="#5a1410" />
        </radialGradient>
        <radialGradient id="lt-pod-young" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#f6c560" />
          <stop offset="55%" stopColor={podYoung} />
          <stop offset="100%" stopColor="#7a5a18" />
        </radialGradient>
        {/* Soft fog band */}
        <linearGradient id="lt-fog" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"  stopColor="#9CB1A8" stopOpacity="0" />
          <stop offset="50%" stopColor="#9CB1A8" stopOpacity={0.18 * (1 - dim * 0.5)} />
          <stop offset="100%" stopColor="#9CB1A8" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* ── Sky background ───────────────────────────────── */}
      <rect x="0" y="0" width="400" height="500" fill="url(#lt-sky)" />

      {/* ── Sun disk + corona ───────────────────────────── */}
      {!isDead && (
        <g className="lt-sun" style={{ transformOrigin: '320px 90px', transformBox: 'fill-box' }}>
          <circle cx="320" cy="90" r="70" fill="url(#lt-sun-glow)" />
          <circle cx="320" cy="90" r="22" fill={sunColor} opacity={0.92 * (1 - dim * 0.4)} />
        </g>
      )}

      {/* ── Distant mountains (3 silhouette layers) ─────── */}
      <g opacity="0.55">
        <polygon
          points="0,290 50,250 110,272 170,235 230,265 290,242 350,268 400,250 400,400 0,400"
          fill={mixHex(skyMid, '#1F2D3A', 0.6)}
        />
      </g>
      <g opacity="0.85">
        <polygon
          points="0,330 60,288 130,314 200,282 270,310 330,290 400,308 400,400 0,400"
          fill={mixHex(skyMid, '#142018', 0.7)}
        />
      </g>
      {/* Closest hill — fades into ground */}
      <g>
        <polygon
          points="-20,400 60,360 150,378 240,355 320,376 410,360 410,460 -20,460"
          fill={groundDark}
        />
      </g>

      {/* ── Fog band between hills and ground ───────────── */}
      <g className="lt-fog">
        <ellipse cx="200" cy="400" rx="280" ry="22" fill="url(#lt-fog)" />
      </g>

      {/* ── Ground shadow under tree ────────────────────── */}
      <ellipse cx="200" cy="448" rx="120" ry="8" fill="#000" opacity="0.45" />

      {/* ── Soil mound ──────────────────────────────────── */}
      <ellipse cx="200" cy="430" rx="180" ry="46" fill="url(#lt-soil)" />
      <ellipse cx="200" cy="425" rx="160" ry="34" fill="#1d1208" opacity="0.4" />

      {/* ── Grass tufts + pebbles around the soil ───────── */}
      {safeStage >= 1 && !isDead && (
        <g aria-hidden="true">
          {[...Array(10)].map((_, i) => {
            const seed = Math.abs(Math.sin(i * 23.4) * 100) % 1
            const x = 90 + seed * 220
            const baseY = 432 + ((i % 3) * 4)
            const tilt = (seed - 0.5) * 18
            return (
              <g key={`gtuft-${i}`} transform={`rotate(${tilt} ${x} ${baseY})`}>
                <line x1={x} y1={baseY} x2={x} y2={baseY - 8} stroke="#5a7a3a" strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
                <line x1={x - 2} y1={baseY} x2={x - 2} y2={baseY - 5} stroke="#5a7a3a" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
                <line x1={x + 2} y1={baseY} x2={x + 2} y2={baseY - 6} stroke="#5a7a3a" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
              </g>
            )
          })}
          {/* Pebbles */}
          {[...Array(5)].map((_, i) => {
            const seed = Math.abs(Math.sin(i * 41.7 + 3.3) * 100) % 1
            const x = 100 + seed * 200
            const y = 442 + ((i % 2) * 3)
            return <ellipse key={`peb-${i}`} cx={x} cy={y} rx={2 + seed * 1.5} ry={1.2} fill="#3a2914" opacity="0.7" />
          })}
        </g>
      )}

      {/* ── Leaf litter (stage 4+) ──────────────────────── */}
      {safeStage >= 4 && (
        <g opacity="0.65">
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

      {/* ── Bean / seed (stage 0) ───────────────────────── */}
      {params.bean && !isDead && (
        <g className="lt-bean">
          <ellipse cx="200" cy="412" rx="16" ry="11" fill="#3a2410" opacity="0.5" />
          <ellipse cx="200" cy="410" rx="14" ry="9" fill="#583915" />
          <ellipse cx="200" cy="408" rx="13" ry="7.5" fill="#7a4f1f" />
          <line x1="200" y1="402" x2="200" y2="418" stroke="#3a2410" strokeWidth="1.2" />
        </g>
      )}

      {/* ── Death — fallen pods + skull ─────────────────── */}
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
          <text x="200" y={trunkTopY + 30}
            textAnchor="middle" fontSize="48"
            opacity="0.7" style={{ pointerEvents: 'none' }}>
            💀
          </text>
        </g>
      )}

      {/* ── Roots ───────────────────────────────────────── */}
      {safeStage >= 1 && (
        <g opacity="0.55" stroke={mixHex('#5a3a1a', '#7a5a2a', dry)} strokeWidth="2.2" fill="none" strokeLinecap="round">
          <path d={`M ${trunkBaseX - 6} 425 Q ${trunkBaseX - 26} 432, ${trunkBaseX - 38} 444`} />
          <path d={`M ${trunkBaseX + 6} 425 Q ${trunkBaseX + 22} 432, ${trunkBaseX + 36} 442`} />
          <path d={`M ${trunkBaseX} 426 L ${trunkBaseX} 446`} />
        </g>
      )}

      {/* ── Healthy aura behind canopy (only when stage 3+ and happy) ── */}
      {safeStage >= 3 && happy > 0.4 && (
        <g className="lt-aura">
          <circle cx={trunkBaseX} cy={trunkTopY + 30} r={Math.max(60, trunkH * 0.6)} fill="url(#lt-aura)" />
        </g>
      )}

      {/* ── Trunk — 2-tone painterly ────────────────────── */}
      {safeStage >= 1 && (
        <g className="lt-trunk-group" style={{ transition: 'transform 1.2s cubic-bezier(0.16, 1, 0.3, 1)' }}>
          <path
            d={`M ${trunkBaseX - trunkBaseW / 2} ${trunkBaseY}
                Q ${trunkBaseX - trunkBaseW / 2 - 2} ${trunkBaseY - trunkH * 0.5},
                  ${trunkBaseX - trunkTopW / 2} ${trunkTopY}
                L ${trunkBaseX + trunkTopW / 2} ${trunkTopY}
                Q ${trunkBaseX + trunkBaseW / 2 + 2} ${trunkBaseY - trunkH * 0.5},
                  ${trunkBaseX + trunkBaseW / 2} ${trunkBaseY} Z`}
            fill="url(#lt-trunk-grad)"
            style={{ transition: 'fill 1s ease-out' }}
          />
          {/* Bark line texture — 3 horizontal soft strokes. */}
          {trunkH > 80 && [0.22, 0.50, 0.78].map((y, i) => (
            <path
              key={`bark-${i}`}
              d={`M ${trunkBaseX - trunkBaseW * 0.32} ${trunkBaseY - trunkH * y}
                  Q ${trunkBaseX} ${trunkBaseY - trunkH * y - 1},
                    ${trunkBaseX + trunkBaseW * 0.32} ${trunkBaseY - trunkH * y}`}
              stroke={trunkDark} strokeWidth="0.8" fill="none" opacity="0.45"
            />
          ))}
          {/* Moss patches */}
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
              fill={trunkMoss} opacity="0.6"
            />
          ))}
        </g>
      )}

      {/* ── Branches ────────────────────────────────────── */}
      {safeStage >= 3 && (
        <g stroke={mixHex(trunkLight, trunkDark, 0.5)} strokeWidth={Math.max(1.8, trunkTopW * 0.2)} strokeLinecap="round" fill="none" opacity="0.92">
          <path d={`M ${trunkBaseX - 4} ${trunkTopY + 16} Q ${trunkBaseX - 50} ${trunkTopY + 4}, ${trunkBaseX - 90} ${trunkTopY - 24}`} />
          <path d={`M ${trunkBaseX + 4} ${trunkTopY + 16} Q ${trunkBaseX + 52} ${trunkTopY + 8}, ${trunkBaseX + 92} ${trunkTopY - 18}`} />
          {safeStage >= 4 && (
            <path d={`M ${trunkBaseX} ${trunkTopY + 4} L ${trunkBaseX + 4} ${trunkTopY - 30}`} />
          )}
        </g>
      )}

      {/* ── Canopy leaves — heart-shaped with central vein ── */}
      <g className="lt-canopy">
        {leaves.map((leaf, i) => (
          <g
            key={i}
            className="lt-leaf"
            style={{
              transformOrigin: `${leaf.x}px ${leaf.y}px`,
              transformBox: 'fill-box',
              animationDelay: `${leaf.delay}s`,
            }}
            transform={`rotate(${leaf.rot + leaf.tilt} ${leaf.x} ${leaf.y})`}
          >
            <HeartLeaf cx={leaf.x} cy={leaf.y} r={leaf.r} fill="url(#lt-leaf-grad)" vein={leafShadow} />
          </g>
        ))}
      </g>

      {/* ── Flowers ─────────────────────────────────────── */}
      {flowers.map((f, i) => (
        <g key={i} className="lt-flower" style={{ animationDelay: `${i * 0.4}s` }}>
          {/* 5-petal flower */}
          {[0, 72, 144, 216, 288].map((a) => {
            const rad = (a * Math.PI) / 180
            const px = f.x + Math.cos(rad) * f.size
            const py = f.y + Math.sin(rad) * f.size
            return <circle key={a} cx={px} cy={py} r={f.size * 0.7} fill={flowerColor} opacity="0.92" />
          })}
          <circle cx={f.x} cy={f.y} r={f.size * 0.55} fill="#f1c84a" />
        </g>
      ))}

      {/* ── Mazorcas ─────────────────────────────────────── */}
      {pods.map((pod, i) => {
        const isRipe = params.pods === 'red'
        const fillId = isRipe ? 'url(#lt-pod-ripe)' : 'url(#lt-pod-young)'
        return (
          <g key={i} transform={`rotate(${pod.rot} ${pod.x} ${pod.y})`} className={isRipe ? 'lt-pod-ripe' : 'lt-pod'}>
            {isRipe && (
              <circle cx={pod.x} cy={pod.y} r={pod.size * 3.2} fill="url(#lt-halo)" />
            )}
            <ellipse cx={pod.x} cy={pod.y} rx={pod.size * 0.62} ry={pod.size * 1.45} fill={fillId} />
            <ellipse cx={pod.x - pod.size * 0.18} cy={pod.y - pod.size * 0.1} rx={pod.size * 0.14} ry={pod.size * 1.05}
              fill="#fff" opacity="0.35" />
            <line x1={pod.x} y1={pod.y - pod.size * 1.42} x2={pod.x} y2={pod.y - pod.size * 1.72}
              stroke="#3a2914" strokeWidth="1.2" strokeLinecap="round" />
            {isRipe && (
              <>
                <path d={`M ${pod.x - pod.size * 0.4} ${pod.y - pod.size * 1.2} Q ${pod.x - pod.size * 0.55} ${pod.y}, ${pod.x - pod.size * 0.4} ${pod.y + pod.size * 1.2}`}
                  stroke="#5a1a14" strokeWidth="0.8" fill="none" opacity="0.65" />
                <path d={`M ${pod.x + pod.size * 0.4} ${pod.y - pod.size * 1.2} Q ${pod.x + pod.size * 0.55} ${pod.y}, ${pod.x + pod.size * 0.4} ${pod.y + pod.size * 1.2}`}
                  stroke="#5a1a14" strokeWidth="0.8" fill="none" opacity="0.65" />
              </>
            )}
          </g>
        )
      })}

      {/* ── Floating particles (fireflies / pollen) ─────── */}
      {particles.map((p, i) => (
        <g key={`prt-${i}`} className={`lt-particle lt-particle-${i}`} style={{ animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s` }}>
          <circle cx={p.x} cy={p.y} r={p.r} fill="#f6e6a8" opacity="0.9" />
          <circle cx={p.x} cy={p.y} r={p.r * 2.2} fill="#f6e6a8" opacity="0.18" />
        </g>
      ))}

      {/* ── CauaGotchi face on the trunk ────────────────── */}
      {showFace && (
        <g
          className="lt-face"
          style={{
            transformOrigin: `${trunkBaseX}px ${faceY}px`,
            transformBox: 'fill-box',
          }}
        >
          {/* Eyes */}
          <FaceEye cx={trunkBaseX - 5} cy={faceY} mood={eyeMood} />
          <FaceEye cx={trunkBaseX + 5} cy={faceY} mood={eyeMood} delay={0.12} />
          {/* Mouth */}
          <FaceMouth cx={trunkBaseX} cy={faceY + 5} mood={eyeMood} />
          {/* Cheeks (only when happy) */}
          {eyeMood === 'happy' && (
            <>
              <ellipse cx={trunkBaseX - 8} cy={faceY + 3} rx="2.2" ry="1.4" fill="#ff9f8a" opacity="0.55" />
              <ellipse cx={trunkBaseX + 8} cy={faceY + 3} rx="2.2" ry="1.4" fill="#ff9f8a" opacity="0.55" />
            </>
          )}
        </g>
      )}

      {/* Problem overlay */}
      {problem && !isDead && (
        <g className="lt-problem" aria-hidden="true">
          <rect x="0" y="0" width="400" height="500"
            fill={problem === 'fungus' ? '#3a1a3a' : problem === 'plague' ? '#3a1a0a' : '#2a1a0a'}
            opacity="0.18"
          />
        </g>
      )}

      {/* ── Animations ───────────────────────────────────── */}
      <style>{`
        .lt-leaf {
          animation: lt-sway 4.5s ease-in-out infinite;
          transform-origin: center;
        }
        @keyframes lt-sway {
          0%, 100% { transform: rotate(0deg); }
          50%      { transform: rotate(2.4deg); }
        }
        .lt-bean {
          animation: lt-bean-pulse 2.4s ease-in-out infinite;
          transform-origin: 200px 410px;
        }
        @keyframes lt-bean-pulse {
          0%, 100% { transform: scale(1);    filter: brightness(1); }
          50%      { transform: scale(1.06); filter: brightness(1.18); }
        }
        .lt-aura {
          animation: lt-aura-breathe 5.6s ease-in-out infinite;
          transform-origin: ${trunkBaseX}px ${trunkTopY + 30}px;
          transform-box: fill-box;
        }
        @keyframes lt-aura-breathe {
          0%, 100% { transform: scale(0.96); opacity: 0.85; }
          50%      { transform: scale(1.04); opacity: 1; }
        }
        .lt-sun {
          animation: lt-sun-breathe 7s ease-in-out infinite;
        }
        @keyframes lt-sun-breathe {
          0%, 100% { opacity: 0.92; }
          50%      { opacity: 1;    }
        }
        .lt-fog {
          animation: lt-fog-drift 22s ease-in-out infinite alternate;
        }
        @keyframes lt-fog-drift {
          0%   { transform: translateX(-14px); }
          100% { transform: translateX(14px); }
        }
        .lt-particle {
          animation-name: lt-firefly;
          animation-iteration-count: infinite;
          animation-timing-function: ease-in-out;
        }
        @keyframes lt-firefly {
          0%   { transform: translate(0, 0) scale(0.8); opacity: 0; }
          15%  { opacity: 1; }
          50%  { transform: translate(-12px, -28px) scale(1.1); opacity: 0.9; }
          85%  { opacity: 0.4; }
          100% { transform: translate(8px, -56px) scale(0.7); opacity: 0; }
        }
        .lt-pod-ripe {
          animation: lt-pod-pulse 2.8s ease-in-out infinite;
          transform-box: fill-box;
        }
        @keyframes lt-pod-pulse {
          0%, 100% { filter: drop-shadow(0 0 4px rgba(241,169,30,0.0)); }
          50%      { filter: drop-shadow(0 0 12px rgba(241,169,30,0.55)); }
        }
        .lt-flower {
          animation: lt-flower-pop 3.2s ease-in-out infinite;
          transform-box: fill-box;
        }
        @keyframes lt-flower-pop {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.08); }
        }
        .lt-eye-blink {
          animation: lt-blink 5.2s ease-in-out infinite;
          transform-box: fill-box;
        }
        @keyframes lt-blink {
          0%, 92%, 100% { transform: scaleY(1); }
          95%           { transform: scaleY(0.08); }
        }
        @media (prefers-reduced-motion: reduce) {
          .lt-leaf, .lt-bean, .lt-aura, .lt-sun, .lt-fog, .lt-particle,
          .lt-pod-ripe, .lt-flower, .lt-eye-blink {
            animation: none !important;
          }
        }
        ${isDead ? `
          .lt-leaf, .lt-bean, .lt-aura, .lt-particle, .lt-pod-ripe, .lt-flower, .lt-eye-blink { animation: none !important; }
        ` : ''}
      `}</style>
    </svg>
  )
}

// ─── Sub-components ─────────────────────────────────────────────────────

function HeartLeaf({ cx, cy, r, fill, vein }: { cx: number; cy: number; r: number; fill: string; vein: string }) {
  // Heart-leaf shape via cubic bezier — symmetric, pointed bottom.
  const w = r * 1.4
  const h = r * 1.1
  const path = `
    M ${cx} ${cy + h * 0.85}
    C ${cx - w * 0.35} ${cy + h * 0.5}, ${cx - w} ${cy - h * 0.4}, ${cx} ${cy - h * 0.55}
    C ${cx + w} ${cy - h * 0.4}, ${cx + w * 0.35} ${cy + h * 0.5}, ${cx} ${cy + h * 0.85} Z
  `
  return (
    <>
      <path d={path} fill={fill} />
      {/* central vein */}
      <line x1={cx} y1={cy - h * 0.5} x2={cx} y2={cy + h * 0.7}
        stroke={vein} strokeWidth="0.7" opacity="0.6" />
    </>
  )
}

function FaceEye({ cx, cy, mood, delay = 0 }: { cx: number; cy: number; mood: 'happy' | 'normal' | 'sad'; delay?: number }) {
  if (mood === 'happy') {
    // Curved closed eye (^ shape)
    return (
      <path
        d={`M ${cx - 2.4} ${cy} Q ${cx} ${cy - 2.2}, ${cx + 2.4} ${cy}`}
        stroke="#0A0A0A" strokeWidth="1.4" strokeLinecap="round" fill="none"
      />
    )
  }
  if (mood === 'sad') {
    return (
      <g style={{ animationDelay: `${delay}s`, transformOrigin: `${cx}px ${cy}px`, transformBox: 'fill-box' }}>
        <ellipse cx={cx} cy={cy + 0.5} rx="1.4" ry="1.6" fill="#0A0A0A" />
        {/* downward tear glint */}
        <ellipse cx={cx + 0.4} cy={cy} rx="0.5" ry="0.5" fill="#F5F2ED" opacity="0.7" />
      </g>
    )
  }
  // Normal — round eye with blink
  return (
    <g
      className="lt-eye-blink"
      style={{ animationDelay: `${delay}s`, transformOrigin: `${cx}px ${cy}px`, transformBox: 'fill-box' }}
    >
      <circle cx={cx} cy={cy} r="1.6" fill="#0A0A0A" />
      <circle cx={cx + 0.4} cy={cy - 0.4} r="0.4" fill="#F5F2ED" />
    </g>
  )
}

function FaceMouth({ cx, cy, mood }: { cx: number; cy: number; mood: 'happy' | 'normal' | 'sad' }) {
  if (mood === 'happy') {
    return (
      <path
        d={`M ${cx - 3} ${cy} Q ${cx} ${cy + 2.6}, ${cx + 3} ${cy}`}
        stroke="#0A0A0A" strokeWidth="1.2" strokeLinecap="round" fill="none"
      />
    )
  }
  if (mood === 'sad') {
    return (
      <path
        d={`M ${cx - 2.5} ${cy + 1.6} Q ${cx} ${cy - 0.4}, ${cx + 2.5} ${cy + 1.6}`}
        stroke="#0A0A0A" strokeWidth="1.2" strokeLinecap="round" fill="none"
      />
    )
  }
  return (
    <line x1={cx - 1.8} y1={cy + 0.6} x2={cx + 1.8} y2={cy + 0.6}
      stroke="#0A0A0A" strokeWidth="1.2" strokeLinecap="round" />
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
