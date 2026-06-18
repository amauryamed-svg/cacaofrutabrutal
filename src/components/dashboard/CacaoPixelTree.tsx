import { useEffect, useRef } from 'react'

// ── Canvas config ──────────────────────────────────────────────────────────────
// W×H logical pixels, S = CSS pixels per logical pixel (chunky retro look)
const W = 80
const H = 120
const S = 3   // 240×360 CSS canvas

// ── Color palette — hex only (CauaCore §8) ────────────────────────────────────
const C = {
  // Sky / background
  bg:   '#030C05',
  bg2:  '#071108',
  bgGl: '#0D2214',

  // Ground layers (deep → surface)
  g1: '#0E0601', g2: '#1A0C04', g3: '#2A1608',
  g4: '#3E220E', g5: '#583418', g6: '#6E4828',

  // Trunk — 5-column shading (shadow left → highlight right)
  tD:  '#2A1006',   // shadow
  tM1: '#461E0E',   // dark-mid
  tM:  '#6A381A',   // main
  tL:  '#904E28',   // light
  tH:  '#AE6A38',   // sun highlight
  tBk: '#160802',   // bark crack

  // Leaves — healthy, 5 tones
  l1: '#082208', l2: '#143C12', l3: '#245A20',
  l4: '#3A822E', l5: '#58A84A', l6: '#72C860',

  // Leaves — stressed (muted yellow-green)
  ls1: '#1E2406', ls2: '#363E0C', ls3: '#545E16', ls4: '#7A8820',

  // Leaves — wilting (yellow-brown)
  lw1: '#201A04', lw2: '#3A2E06', lw3: '#5E4A0C', lw4: '#847018',

  // Leaves — dead (desaturated)
  ld1: '#101010', ld2: '#1A1A14', ld3: '#282820',

  // Pods — unripe green
  pG1: '#103810', pG2: '#1C5A18', pG3: '#2A8020',
  pG4: '#48A83A', pGH: '#70C058',  // highlight

  // Pods — ripe orange (Caúa signature)
  pO1: '#5E1A06', pO2: '#9A3410', pO3: '#CE561A',
  pO4: '#F07C2A', pOH: '#F8A048',

  // Pods — ripe red (alternate)
  pR1: '#501008', pR2: '#862010', pR3: '#B84018',
  pR4: '#E06020', pRH: '#F08840',

  // Purple pod (stage 6 criollo — morado)
  pP1: '#3A0A40', pP2: '#621480', pP3: '#8820A8',
  pP4: '#AC40C0', pPH: '#D060D8',

  // Flowers
  fW: '#D8D0BC', fP: '#C080B0', fY: '#E8B020',

  // Dead overlay
  dead: '#10100C',
}

// ── Drawing primitives ─────────────────────────────────────────────────────────
function px(ctx: CanvasRenderingContext2D, x: number, y: number, col: string) {
  if (x < 0 || x >= W || y < 0 || y >= H) return
  ctx.fillStyle = col
  ctx.fillRect(Math.round(x) * S, Math.round(y) * S, S, S)
}

function hline(ctx: CanvasRenderingContext2D, x1: number, x2: number, y: number, col: string) {
  for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) px(ctx, x, y, col)
}

// Filled circle with edge/body/highlight tones (pixel art style)
function circle(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number,
  edge: string, body: string, hi: string,
) {
  const r2 = r * r
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const d2 = dx * dx + dy * dy
      if (d2 > r2 + r) continue
      const onEdge = d2 > (r - 1.2) * (r - 1.2)
      const isHi   = dy < -r * 0.2 && dx > -r * 0.2 && !onEdge && d2 < (r * 0.55) * (r * 0.55)
      px(ctx, cx + dx, cy + dy, onEdge ? edge : isHi ? hi : body)
    }
  }
}

// "Bush" = overlapping circles for lush canopy (matches reference image style)
function bush(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number,
  edge: string, body: string, hi: string,
) {
  const lr = Math.max(2, Math.round(r * 0.62))
  const mr = Math.max(2, Math.round(r * 0.5))
  // Side lobes first (drawn under main)
  circle(ctx, cx - Math.round(r * 0.55), cy + Math.round(r * 0.28), lr, edge, body, hi)
  circle(ctx, cx + Math.round(r * 0.55), cy + Math.round(r * 0.28), lr, edge, body, hi)
  // Main central circle
  circle(ctx, cx, cy, r, edge, body, hi)
  // Top lobe
  if (r >= 5) circle(ctx, cx, cy - Math.round(r * 0.45), mr, edge, body, hi)
  // Small accent (adds depth)
  if (r >= 6) circle(ctx, cx + Math.round(r * 0.7), cy - Math.round(r * 0.2), Math.max(2, mr - 1), edge, body, hi)
}

// ── Pod drawing — elongated cacao pod with ribs ──────────────────────────────
// Pods grow directly from trunk (cauliflory — botanically correct for cacao)
function drawPod(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  ripe: boolean,
  variant: number,  // 0=orange, 1=red, 2=purple(unripe near stage 6)
  glow: boolean,
) {
  const isUnripe = !ripe
  // Pick pod palette
  let c1: string, c2: string, c3: string, ch: string
  if (isUnripe) {
    [c1, c2, c3, ch] = [C.pG1, C.pG2, C.pG3, C.pGH]
  } else if (variant === 1) {
    [c1, c2, c3, ch] = [C.pR1, C.pR2, C.pR3, C.pRH]
  } else if (variant === 2) {
    [c1, c2, c3, ch] = [C.pP1, C.pP2, C.pP3, C.pPH]
  } else {
    [c1, c2, c3, ch] = [C.pO1, C.pO2, C.pO3, C.pOH]
  }

  // Pod shape: 4w × 9h elongated oval with ribs
  // Column shading: left=dark, center=main, right=light, leftmost=shadow
  const pixels: [number, number, string][] = [
    // Row -4 (tip)
    [0,  -4, c2], [1, -4, c3],
    // Row -3
    [-1, -3, c1], [0, -3, c2], [1, -3, c3], [2, -3, c2],
    // Row -2
    [-1, -2, c1], [0, -2, c2], [1, -2, ch], [2, -2, c3],
    // Row -1  (rib mark)
    [-1, -1, c1], [0, -1, c1], [1, -1, c2], [2, -1, c2],
    // Row 0
    [-1,  0, c1], [0,  0, c2], [1,  0, ch], [2,  0, c3],
    // Row 1
    [-1,  1, c1], [0,  1, c2], [1,  1, ch], [2,  1, c3],
    // Row 2 (rib mark)
    [-1,  2, c1], [0,  2, c1], [1,  2, c2], [2,  2, c2],
    // Row 3
    [-1,  3, c1], [0,  3, c2], [1,  3, c3], [2,  3, c2],
    // Row 4 (base)
    [0,   4, c2], [1,  4, c3],
  ]
  pixels.forEach(([dx, dy, col]) => px(ctx, x + dx, y + dy, col))

  // Glow halo for ripe pods
  if (glow) {
    const alpha = Math.floor(
      (Math.sin(Date.now() / 500 + x * 0.7) * 0.35 + 0.55) * 90,
    ).toString(16).padStart(2, '0')
    ctx.fillStyle = ch + alpha
    ctx.fillRect((x - 2) * S, (y - 5) * S, 6 * S, 11 * S)
  }
}

// ── Stage definitions ──────────────────────────────────────────────────────────
interface Branch {
  y: number     // height above baseY
  len: number   // horizontal reach
  dir: 1 | -1  // right=1, left=-1
  angle: number // how many y-pixels to rise per x-pixel (0=flat, 0.3=gentle up)
}

interface StageData {
  trunkH: number
  trunkW: number  // max trunk width at base
  branches: Branch[]
  leafR: number   // radius of main bush cluster
  mazCount: number
  flowers: boolean
  bushtop: boolean  // crown bush at very top
}

const STAGES: StageData[] = [
  // 0 — Semilla / seed
  { trunkH: 5, trunkW: 1, branches: [], leafR: 2, mazCount: 0, flowers: false, bushtop: false },

  // 1 — Germinación
  {
    trunkH: 12, trunkW: 1,
    branches: [
      { y: 11, len: 5, dir:  1, angle: 0.3 },
      { y: 11, len: 5, dir: -1, angle: 0.3 },
    ],
    leafR: 3, mazCount: 0, flowers: false, bushtop: true,
  },

  // 2 — Plántula
  {
    trunkH: 22, trunkW: 2,
    branches: [
      { y: 20, len: 7, dir:  1, angle: 0.25 },
      { y: 20, len: 7, dir: -1, angle: 0.25 },
      { y: 11, len: 5, dir:  1, angle: 0.15 },
      { y: 11, len: 5, dir: -1, angle: 0.15 },
    ],
    leafR: 4, mazCount: 0, flowers: false, bushtop: true,
  },

  // 3 — Juvenil
  {
    trunkH: 34, trunkW: 3,
    branches: [
      { y: 32, len: 10, dir:  1, angle: 0.2  },
      { y: 32, len: 10, dir: -1, angle: 0.2  },
      { y: 22, len: 8,  dir: -1, angle: 0.15 },
      { y: 22, len: 8,  dir:  1, angle: 0.15 },
      { y: 12, len: 6,  dir:  1, angle: 0.1  },
      { y: 12, len: 6,  dir: -1, angle: 0.1  },
    ],
    leafR: 5, mazCount: 0, flowers: false, bushtop: true,
  },

  // 4 — Crecimiento
  {
    trunkH: 46, trunkW: 4,
    branches: [
      { y: 44, len: 13, dir:  1, angle: 0.18 },
      { y: 44, len: 13, dir: -1, angle: 0.18 },
      { y: 33, len: 11, dir: -1, angle: 0.15 },
      { y: 33, len: 11, dir:  1, angle: 0.15 },
      { y: 22, len: 8,  dir:  1, angle: 0.1  },
      { y: 22, len: 8,  dir: -1, angle: 0.1  },
      { y: 12, len: 6,  dir: -1, angle: 0.08 },
      { y: 12, len: 6,  dir:  1, angle: 0.08 },
    ],
    leafR: 6, mazCount: 0, flowers: false, bushtop: true,
  },

  // 5 — Floración
  {
    trunkH: 54, trunkW: 5,
    branches: [
      { y: 52, len: 15, dir:  1, angle: 0.15 },
      { y: 52, len: 15, dir: -1, angle: 0.15 },
      { y: 40, len: 13, dir: -1, angle: 0.13 },
      { y: 40, len: 13, dir:  1, angle: 0.13 },
      { y: 28, len: 10, dir:  1, angle: 0.1  },
      { y: 28, len: 10, dir: -1, angle: 0.1  },
      { y: 17, len: 7,  dir: -1, angle: 0.07 },
      { y: 17, len: 7,  dir:  1, angle: 0.07 },
      { y: 8,  len: 5,  dir:  1, angle: 0.05 },
      { y: 8,  len: 5,  dir: -1, angle: 0.05 },
    ],
    leafR: 7, mazCount: 0, flowers: true, bushtop: true,
  },

  // 6 — Desarrollo (nibs morados / verdes)
  {
    trunkH: 62, trunkW: 5,
    branches: [
      { y: 60, len: 16, dir:  1, angle: 0.14 },
      { y: 60, len: 16, dir: -1, angle: 0.14 },
      { y: 48, len: 14, dir: -1, angle: 0.12 },
      { y: 48, len: 14, dir:  1, angle: 0.12 },
      { y: 36, len: 11, dir:  1, angle: 0.1  },
      { y: 36, len: 11, dir: -1, angle: 0.1  },
      { y: 24, len: 8,  dir: -1, angle: 0.07 },
      { y: 24, len: 8,  dir:  1, angle: 0.07 },
      { y: 13, len: 6,  dir:  1, angle: 0.05 },
      { y: 13, len: 6,  dir: -1, angle: 0.05 },
    ],
    leafR: 8, mazCount: 4, flowers: false, bushtop: true,
  },

  // 7 — Maduración completa
  {
    trunkH: 70, trunkW: 6,
    branches: [
      { y: 68, len: 18, dir:  1, angle: 0.13 },
      { y: 68, len: 18, dir: -1, angle: 0.13 },
      { y: 55, len: 15, dir: -1, angle: 0.11 },
      { y: 55, len: 15, dir:  1, angle: 0.11 },
      { y: 42, len: 12, dir:  1, angle: 0.09 },
      { y: 42, len: 12, dir: -1, angle: 0.09 },
      { y: 30, len: 9,  dir: -1, angle: 0.07 },
      { y: 30, len: 9,  dir:  1, angle: 0.07 },
      { y: 18, len: 7,  dir:  1, angle: 0.05 },
      { y: 18, len: 7,  dir: -1, angle: 0.05 },
      { y: 8,  len: 5,  dir: -1, angle: 0.03 },
      { y: 8,  len: 5,  dir:  1, angle: 0.03 },
    ],
    leafR: 9, mazCount: 7, flowers: false, bushtop: true,
  },
]

// ── Particle system ────────────────────────────────────────────────────────────
interface Particle {
  x: number; y: number; vx: number; vy: number
  color: string; life: number; maxLife: number
}

// ── Component props ────────────────────────────────────────────────────────────
export interface CacaoPixelTreeProps {
  stage: number
  health: number
  moisture: number
  sunlight: number
  problem?: string | null
  isDead?: boolean
  careEffect?: 'water' | 'sunlight' | 'nutrients' | 'pruning' | 'molasses' | null
  width?: number | string
  height?: number | string
}

export default function CacaoPixelTree({
  stage, health, moisture, sunlight, isDead = false, careEffect = null,
}: CacaoPixelTreeProps) {
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const rafRef      = useRef<number | undefined>(undefined)
  const tickRef     = useRef(0)
  const careRef     = useRef(careEffect)

  useEffect(() => { careRef.current = careEffect }, [careEffect])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    function loop() {
      tickRef.current++
      const tick = tickRef.current
      // Slower sway: 4-frame cycle at ~0.7 cycles/sec (each frame 21 ticks at 60fps)
      const swayFrame = Math.floor(tick / 21) % 4

      // Particle physics
      particlesRef.current = particlesRef.current
        .filter(p => p.life > 0)
        .map(p => ({
          ...p,
          x:  p.x + p.vx,
          y:  p.y + p.vy,
          vy: p.vy + (careRef.current === 'water' ? 0.1 : -0.03),
          life: p.life - 1,
        }))

      // Particle spawn
      const ce = careRef.current
      if (ce === 'water' && tick % 4 === 0) {
        for (let i = 0; i < 2; i++) {
          particlesRef.current.push({
            x: W / 2 + (Math.random() - 0.5) * 22,
            y: 4, vx: (Math.random() - 0.5) * 0.4,
            vy: 0.3 + Math.random() * 0.5,
            color: '#6CC4FF', life: 55, maxLife: 55,
          })
        }
      }
      if (ce === 'sunlight' && tick % 6 === 0) {
        particlesRef.current.push({
          x: W / 2 + (Math.random() - 0.5) * 32, y: 15 + Math.random() * 28,
          vx: (Math.random() - 0.5) * 0.6, vy: -(0.2 + Math.random() * 0.4),
          color: '#FFE060', life: 45, maxLife: 45,
        })
      }
      if ((ce === 'nutrients' || ce === 'molasses') && tick % 3 === 0) {
        particlesRef.current.push({
          x: W / 2 + (Math.random() - 0.5) * 14,
          y: 92 + Math.random() * 10,
          vx: (Math.random() - 0.5) * 0.25, vy: -(0.3 + Math.random() * 0.5),
          color: ce === 'molasses' ? '#D05820' : '#4AB04A',
          life: 50, maxLife: 50,
        })
      }

      drawTree(ctx, stage, swayFrame, health, moisture, sunlight, isDead)

      // Render particles
      particlesRef.current.forEach(p => {
        const alpha = Math.floor((p.life / p.maxLife) * 220).toString(16).padStart(2, '0')
        const gx = Math.round(p.x)
        const gy = Math.round(p.y)
        if (gx >= 0 && gx < W && gy >= 0 && gy < H) {
          ctx.fillStyle = p.color + alpha
          ctx.fillRect(gx * S, gy * S, S, S)
        }
      })

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [stage, health, moisture, sunlight, isDead])

  return (
    <canvas
      ref={canvasRef}
      width={W * S}
      height={H * S}
      style={{
        width: W * S, height: H * S,
        imageRendering: 'pixelated', display: 'block',
      }}
    />
  )
}

// ── Tree renderer ─────────────────────────────────────────────────────────────
function drawTree(
  ctx: CanvasRenderingContext2D,
  stageIdx: number,
  swayFrame: number,
  health: number,
  moisture: number,
  sunlight: number,
  isDead: boolean,
) {
  const baseY = H - 18  // soil surface Y
  const cx    = Math.floor(W / 2)
  const si    = Math.max(0, Math.min(7, stageIdx))
  const st    = STAGES[si]
  void moisture  // affects soil color in future enhancement

  // Derive leaf palette from vitals
  let lE: string, lB: string, lH: string
  if (isDead) {
    [lE, lB, lH] = [C.ld1, C.ld2, C.ld3]
  } else if (health < 20) {
    [lE, lB, lH] = [C.lw1, C.lw2, C.lw4]
  } else if (health < 45) {
    [lE, lB, lH] = [C.ls1, C.ls2, C.ls4]
  } else {
    [lE, lB, lH] = [C.l1, C.l3, C.l5]
  }

  // Trunk palette
  const tD  = isDead ? '#241208' : C.tD
  const tM  = isDead ? '#382010' : C.tM
  const tL  = isDead ? '#4A2E18' : C.tL
  const tH  = isDead ? '#5A3A20' : C.tH

  // ── Sky / background ──
  ctx.fillStyle = C.bg
  ctx.fillRect(0, 0, W * S, H * S)

  // Radial canopy glow (grows with stage)
  if (!isDead && si >= 2) {
    const glowY = baseY - st.trunkH * 0.55
    const glowR = (si + 2) * 4.5
    const grad  = ctx.createRadialGradient(
      cx * S, glowY * S, 0,
      cx * S, glowY * S, glowR * S,
    )
    grad.addColorStop(0,   C.bgGl)
    grad.addColorStop(0.6, C.bg2)
    grad.addColorStop(1,   C.bg)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W * S, H * S)
  }

  // Low-light dim
  if (sunlight < 25 && !isDead) {
    ctx.fillStyle = 'rgba(0,0,0,0.30)'
    ctx.fillRect(0, 0, W * S, H * S)
  }

  // ── Ground layers ──
  // Deep soil (fills from baseY to bottom)
  for (let y = baseY; y < H; y++) {
    const depth = y - baseY
    const col   = depth < 2 ? C.g6 : depth < 4 ? C.g5 : depth < 7 ? C.g4 : depth < 11 ? C.g3 : depth < 15 ? C.g2 : C.g1
    hline(ctx, 0, W - 1, y, col)
  }

  // Surface texture: dithered spots
  for (let x = 2; x < W - 2; x += 3) {
    if ((x + si) % 5 === 0) px(ctx, x, baseY, C.g5)
  }

  // ── Roots / buttresses ──
  if (si >= 2) {
    // Simple surface roots spreading from base
    px(ctx, cx - 3, baseY + 1, C.g4); px(ctx, cx - 5, baseY + 2, C.g3)
    px(ctx, cx + 3, baseY + 1, C.g4); px(ctx, cx + 5, baseY + 2, C.g3)
  }
  if (si >= 5) {
    // Buttress roots — wider, more prominent
    for (let i = 0; i <= 3; i++) {
      px(ctx, cx - 4 - i, baseY + i, C.g4)
      px(ctx, cx - 5 - i, baseY + i + 1, C.g3)
      px(ctx, cx + 4 + i, baseY + i, C.g4)
      px(ctx, cx + 5 + i, baseY + i + 1, C.g3)
    }
  }

  // ── Stage 0: seed only ──
  if (si === 0) {
    // Two cotyledon leaves
    px(ctx, cx - 1, baseY - 3, lB)
    px(ctx, cx + 1, baseY - 3, lB)
    px(ctx, cx,     baseY - 2, tM)
    px(ctx, cx,     baseY - 1, tM)
    return
  }

  // ── Trunk ──
  const trunkTop = baseY - st.trunkH
  const half     = Math.floor(st.trunkW / 2)

  for (let y = trunkTop; y < baseY; y++) {
    const progress  = (y - trunkTop) / st.trunkH
    // Trunk widens slightly at base (flare)
    const baseFlare = progress > 0.82 ? 1 : 0
    const w2        = half + baseFlare

    for (let dx = -w2; dx <= w2; dx++) {
      let col: string
      if      (dx === -w2) col = tD
      else if (dx === -w2 + 1 && st.trunkW >= 4) col = tD
      else if (dx === w2)  col = tH
      else if (dx === w2 - 1 && st.trunkW >= 4) col = tL
      else col = tM

      // Bark texture: alternating dark notches
      if (dx === -w2 + (st.trunkW >= 4 ? 1 : 0) && y % 5 === 2) col = C.tBk
      if (dx === w2 - 1 && y % 7 === 4) col = tL

      px(ctx, cx + dx, y, col)
    }
  }

  // ── Sway offset (heightFactor: higher branches sway more) ──
  const swayBase = swayFrame === 1 ? 1 : swayFrame === 3 ? -1 : 0

  // ── Branches ──
  st.branches.forEach(b => {
    const brY    = baseY - b.y
    const startX = cx + (b.dir > 0 ? half + 1 : -(half + 1))
    const heightF = b.y / st.trunkH
    const sway   = Math.round(swayBase * heightF * 2.2)
    const endX   = startX + b.dir * b.len + sway
    const endY   = brY - Math.round(b.len * b.angle)

    // Branch line
    const steps = Math.abs(endX - startX)
    for (let i = 0; i <= steps; i++) {
      const t  = i / steps
      const bx = Math.round(startX + t * (endX - startX))
      const by = Math.round(brY   + t * (endY - brY))
      // Taper: thick near trunk, thin near tip
      const thick = i < 3 ? 1 : 0
      px(ctx, bx, by,           i < 2 ? tD : tM)
      if (thick) px(ctx, bx, by + 1, i < 2 ? tD : tM)
    }

    // Leaf bush at branch tip
    const leafR = Math.max(3, st.leafR - Math.round((1 - heightF) * 3))
    bush(ctx, endX, endY - leafR + 1, leafR, lE, lB, lH)
  })

  // ── Crown top bush ──
  if (st.bushtop && si >= 1) {
    const topSway = Math.round(swayBase * 0.7)
    bush(ctx, cx + topSway, trunkTop - st.leafR + 2, st.leafR, lE, lB, lH)
  }

  // ── Flowers on trunk (stage 5) ──
  if (st.flowers) {
    const flPos = [
      [cx - 2, baseY - 16], [cx + 3, baseY - 26],
      [cx - 3, baseY - 36], [cx + 2, baseY - 44],
      [cx - 1, baseY - 50],
    ]
    flPos.forEach(([fx, fy]) => {
      px(ctx, fx,     fy,     C.fW)
      px(ctx, fx + 1, fy,     C.fP)
      px(ctx, fx,     fy - 1, C.fW)
      px(ctx, fx + 1, fy - 1, C.fY)
    })
  }

  // ── Cacao pods (cauliflory — directly on trunk & main branches) ──
  if (st.mazCount > 0) {
    const ripe = si >= 7

    // Pod attachment points along trunk
    const podPositions = [
      { x: cx - 3, y: baseY - 15, v: 0 },
      { x: cx + 4, y: baseY - 25, v: 1 },
      { x: cx - 4, y: baseY - 36, v: 0 },
      { x: cx + 3, y: baseY - 46, v: 2 },
      { x: cx - 2, y: baseY - 55, v: 1 },
      { x: cx + 4, y: baseY - 62, v: 0 },
      { x: cx - 3, y: baseY - 9,  v: 2 },
    ].slice(0, st.mazCount)

    podPositions.forEach(({ x: px2, y: py2, v }) => {
      drawPod(ctx, px2, py2, ripe, v, ripe)
      // Stem connecting pod to trunk
      px(ctx, px2 + (px2 < cx ? 1 : -1), py2, tM)
    })
  }

  // ── Dead overlay ──
  if (isDead) {
    ctx.fillStyle = 'rgba(0,0,0,0.42)'
    ctx.fillRect(0, 0, W * S, H * S)
    // Fallen dried leaves on soil
    ;[[cx - 9, baseY + 1], [cx + 6, baseY + 2], [cx - 2, baseY + 3], [cx + 10, baseY + 1]].forEach(
      ([lx, ly]) => { px(ctx, lx, ly, C.ld3); px(ctx, lx + 1, ly, C.ld2) },
    )
  }
}
