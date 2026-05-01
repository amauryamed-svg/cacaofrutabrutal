/**
 * CacaoTreeBackdrop — stylized SVG tree silhouette for the harvest arena.
 *
 * Sits behind the floating pods; gives the user a sense of "harvesting from
 * an orchard" instead of seeing pods float in a void. Translucent by default
 * so it doesn't compete with the foreground.
 *
 * Geometry:
 *   - Wide forked trunk (V shape) starting from the bottom
 *   - 3 main branches per side, curving outward + upward
 *   - Multiple foliage clusters (overlapping ellipses) at branch tips +
 *     central canopy
 *   - All in muted brand greens
 */

import { BRAND } from '../../utils/constants'

interface Props {
  /** Container fill — sets aspect via `100% × 100%`. */
  width?:  string | number
  height?: string | number
  /** 0..1 — how visible the tree is. */
  opacity?: number
}

export default function CacaoTreeBackdrop({ width = '100%', height = '100%', opacity = 0.18 }: Props) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 600 380"
      preserveAspectRatio="xMidYMax slice"
      style={{
        position: 'absolute', inset: 0,
        pointerEvents: 'none',
        opacity,
      }}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="cacao-tree-canopy" cx="50%" cy="40%" r="60%">
          <stop offset="0%"   stopColor="#3E7026" stopOpacity="1"    />
          <stop offset="60%"  stopColor="#1F3E14" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#0A1A06" stopOpacity="0.6"  />
        </radialGradient>
        <linearGradient id="cacao-tree-trunk" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#2A1A0B" />
          <stop offset="50%"  stopColor="#5C3416" />
          <stop offset="100%" stopColor="#2A1A0B" />
        </linearGradient>
      </defs>

      {/* Ground line — barely visible, just grounds the trunk */}
      <line x1="0" y1="378" x2="600" y2="378" stroke={BRAND.amazon} strokeWidth="1" opacity="0.4" />

      {/* Trunk — wide at base, narrowing upward, with subtle V fork at the top */}
      <path
        d="M280 380
           L 268 280
           Q 264 220 285 180
           L 300 175
           L 315 180
           Q 336 220 332 280
           L 320 380 Z"
        fill="url(#cacao-tree-trunk)"
      />

      {/* Trunk texture — vertical ridges */}
      {[286, 295, 305, 314].map((x, i) => (
        <path
          key={i}
          d={`M${x} 378 Q${x - 1} 280 ${x + 1} 200`}
          fill="none"
          stroke="#1A0F08"
          strokeWidth="1"
          opacity="0.55"
        />
      ))}

      {/* Branches — 3 left, 3 right, curving outward */}
      {/* Left branches */}
      <path d="M285 200 Q220 180 160 150" fill="none" stroke="#5C3416" strokeWidth="6" strokeLinecap="round" />
      <path d="M290 220 Q200 230 130 235" fill="none" stroke="#5C3416" strokeWidth="5" strokeLinecap="round" />
      <path d="M295 250 Q220 280 170 305" fill="none" stroke="#5C3416" strokeWidth="4" strokeLinecap="round" />
      {/* Right branches */}
      <path d="M315 200 Q380 180 440 150" fill="none" stroke="#5C3416" strokeWidth="6" strokeLinecap="round" />
      <path d="M310 220 Q400 230 470 235" fill="none" stroke="#5C3416" strokeWidth="5" strokeLinecap="round" />
      <path d="M305 250 Q380 280 430 305" fill="none" stroke="#5C3416" strokeWidth="4" strokeLinecap="round" />

      {/* Foliage clusters — overlapping ellipses with the canopy gradient */}
      {[
        // Top canopy
        { cx: 300, cy: 130, rx: 130, ry: 70 },
        { cx: 200, cy: 150, rx: 70,  ry: 50 },
        { cx: 400, cy: 150, rx: 70,  ry: 50 },
        // Mid layer
        { cx: 140, cy: 220, rx: 55,  ry: 45 },
        { cx: 460, cy: 220, rx: 55,  ry: 45 },
        // Lower layer
        { cx: 175, cy: 295, rx: 45,  ry: 35 },
        { cx: 425, cy: 295, rx: 45,  ry: 35 },
        // Center filler
        { cx: 300, cy: 200, rx: 70,  ry: 50 },
      ].map((c, i) => (
        <ellipse
          key={i}
          cx={c.cx} cy={c.cy} rx={c.rx} ry={c.ry}
          fill="url(#cacao-tree-canopy)"
        />
      ))}

      {/* Tiny leaf hints — small green strokes for texture */}
      {[
        { x: 200, y: 130 }, { x: 400, y: 130 },
        { x: 150, y: 215 }, { x: 450, y: 215 },
        { x: 180, y: 290 }, { x: 420, y: 290 },
        { x: 270, y: 180 }, { x: 330, y: 180 },
      ].map((s, i) => (
        <path
          key={`leaf-${i}`}
          d={`M${s.x} ${s.y} q 5 -3 10 0 q -5 6 -10 0`}
          fill="#3E7026"
          opacity="0.6"
        />
      ))}
    </svg>
  )
}
