import { useEffect, useRef } from 'react'

// ── Canvas config ─────────────────────────────────────────────────────────────
const W = 80   // logical pixel width
const H = 110  // logical pixel height
const S = 3    // CSS pixels per logical pixel (3× = chunky retro pixel look)

// ── Color palette — hex only (CauaCore §8) ────────────────────────────────────
const C = {
  bg:    '#040C06',
  bg2:   '#071008',
  soil1: '#2C1506',
  soil2: '#3D1C02',
  soil3: '#5C2E0A',
  soil4: '#7A4220',
  root:  '#4A2810',
  trD:   '#4E2C12',
  trM:   '#6B3D1A',
  trL:   '#8B5230',
  trH:   '#A66D40',
  lfD:   '#1A4A15',
  lfM:   '#2D6E26',
  lfL:   '#3E8E35',
  lfH:   '#56B04A',
  lfY:   '#9A9018',
  lfB:   '#5E5808',
  mazG:  '#7A9B25',
  mazGH: '#A0C030',
  mazO:  '#D4901A',
  mazR:  '#C04A20',
  mazL:  '#F0B030',
  flW:   '#E8E0C8',
  flY:   '#D4A820',
  dead1: '#3E3E28',
  dead2: '#2A2A18',
  dtrM:  '#3A2A1A',
  dtrD:  '#2A1A0A',
}

// ── Stage definitions ─────────────────────────────────────────────────────────
interface Branch { y: number; len: number; dir: 1 | -1 }
interface StageData {
  trunkH: number
  trunkW: number
  branches: Branch[]
  leafR: number
  mazCount: number
  flowers: boolean
}

const STAGES: StageData[] = [
  // 0 — Semilla: tiny sprout
  { trunkH: 6, trunkW: 1, branches: [], leafR: 2, mazCount: 0, flowers: false },
  // 1 — Germinación
  { trunkH: 14, trunkW: 1,
    branches: [{ y: 12, len: 4, dir: 1 }, { y: 12, len: 4, dir: -1 }],
    leafR: 3, mazCount: 0, flowers: false },
  // 2 — Plántula
  { trunkH: 22, trunkW: 2,
    branches: [{ y: 20, len: 6, dir: 1 }, { y: 20, len: 6, dir: -1 },
               { y: 13, len: 4, dir: -1 }, { y: 13, len: 4, dir: 1 }],
    leafR: 4, mazCount: 0, flowers: false },
  // 3 — Juvenil
  { trunkH: 30, trunkW: 2,
    branches: [{ y: 28, len: 8, dir: 1 }, { y: 28, len: 8, dir: -1 },
               { y: 20, len: 6, dir: -1 }, { y: 20, len: 6, dir: 1 },
               { y: 12, len: 5, dir: 1 }, { y: 12, len: 5, dir: -1 }],
    leafR: 5, mazCount: 0, flowers: false },
  // 4 — Crecimiento
  { trunkH: 38, trunkW: 3,
    branches: [{ y: 36, len: 10, dir: 1 }, { y: 36, len: 10, dir: -1 },
               { y: 27, len: 8, dir: -1 }, { y: 27, len: 8, dir: 1 },
               { y: 18, len: 6, dir: 1 }, { y: 18, len: 6, dir: -1 },
               { y: 10, len: 5, dir: -1 }, { y: 10, len: 5, dir: 1 }],
    leafR: 6, mazCount: 0, flowers: false },
  // 5 — Floración
  { trunkH: 48, trunkW: 3,
    branches: [{ y: 46, len: 11, dir: 1 }, { y: 46, len: 11, dir: -1 },
               { y: 36, len: 9, dir: -1 }, { y: 36, len: 9, dir: 1 },
               { y: 26, len: 7, dir: 1 }, { y: 26, len: 7, dir: -1 },
               { y: 16, len: 6, dir: -1 }, { y: 16, len: 6, dir: 1 },
               { y: 8, len: 5, dir: 1 }, { y: 8, len: 5, dir: -1 }],
    leafR: 7, mazCount: 0, flowers: true },
  // 6 — Desarrollo (nibs verdes)
  { trunkH: 56, trunkW: 3,
    branches: [{ y: 54, len: 12, dir: 1 }, { y: 54, len: 12, dir: -1 },
               { y: 43, len: 10, dir: -1 }, { y: 43, len: 10, dir: 1 },
               { y: 32, len: 8, dir: 1 }, { y: 32, len: 8, dir: -1 },
               { y: 21, len: 7, dir: -1 }, { y: 21, len: 7, dir: 1 },
               { y: 11, len: 5, dir: 1 }, { y: 11, len: 5, dir: -1 }],
    leafR: 7, mazCount: 3, flowers: false },
  // 7 — Maduración (mazorcas rojas/naranjas + glow)
  { trunkH: 64, trunkW: 4,
    branches: [{ y: 62, len: 13, dir: 1 }, { y: 62, len: 13, dir: -1 },
               { y: 50, len: 11, dir: -1 }, { y: 50, len: 11, dir: 1 },
               { y: 38, len: 9, dir: 1 }, { y: 38, len: 9, dir: -1 },
               { y: 26, len: 7, dir: -1 }, { y: 26, len: 7, dir: 1 },
               { y: 15, len: 6, dir: 1 }, { y: 15, len: 6, dir: -1 },
               { y: 7, len: 5, dir: -1 }, { y: 7, len: 5, dir: 1 }],
    leafR: 8, mazCount: 6, flowers: false },
]

// ── Pixel drawing helpers ─────────────────────────────────────────────────────
function px(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  if (x < 0 || x >= W || y < 0 || y >= H) return
  ctx.fillStyle = color
  ctx.fillRect(Math.round(x) * S, Math.round(y) * S, S, S)
}

function hline(ctx: CanvasRenderingContext2D, x1: number, x2: number, y: number, color: string) {
  for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) px(ctx, x, y, color)
}

// Pixel-art leaf cluster: filled circle with 3-tone shading
function leafCluster(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number,
  dark: string, mid: string, light: string,
) {
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const d2 = dx * dx + dy * dy
      if (d2 > r * r) continue
      const onRim = d2 > (r - 1.5) * (r - 1.5)
      const highlight = dy < -r * 0.3 && dx > 0
      px(ctx, cx + dx, cy + dy, onRim ? dark : highlight ? light : mid)
    }
  }
}

// ── Particle system ───────────────────────────────────────────────────────────
interface Particle {
  x: number; y: number; vx: number; vy: number
  color: string; life: number; maxLife: number
}

// ── Component ─────────────────────────────────────────────────────────────────
export interface CacaoPixelTreeProps {
  stage: number           // 0..7
  health: number          // 0..100
  moisture: number        // 0..100
  sunlight: number        // 0..100
  problem?: string | null
  isDead?: boolean
  careEffect?: 'water' | 'sunlight' | 'nutrients' | 'pruning' | 'molasses' | null
  width?: number | string
  height?: number | string
}

export default function CacaoPixelTree({
  stage, health, moisture, sunlight, isDead = false, careEffect = null,
}: CacaoPixelTreeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const rafRef = useRef<number | undefined>(undefined)
  const tickRef = useRef(0)
  const careRef = useRef(careEffect)

  useEffect(() => { careRef.current = careEffect }, [careEffect])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    function loop() {
      tickRef.current++
      const tick = tickRef.current
      const swayFrame = Math.floor(tick / 18) % 4  // 4-frame sway at ~3.3 cycles/s at 60fps

      // ── Particle update ──
      particlesRef.current = particlesRef.current
        .filter(p => p.life > 0)
        .map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + (careRef.current === 'water' ? 0.12 : -0.04),
          life: p.life - 1,
        }))

      // ── Particle spawn ──
      const ce = careRef.current
      if (ce === 'water' && tick % 5 === 0) {
        for (let i = 0; i < 2; i++) {
          particlesRef.current.push({
            x: W / 2 + (Math.random() - 0.5) * 18,
            y: 6, vx: (Math.random() - 0.5) * 0.35,
            vy: 0.4 + Math.random() * 0.6,
            color: '#64B4FF', life: 50, maxLife: 50,
          })
        }
      }
      if (ce === 'sunlight' && tick % 7 === 0) {
        particlesRef.current.push({
          x: W / 2 + (Math.random() - 0.5) * 28, y: 12 + Math.random() * 25,
          vx: (Math.random() - 0.5) * 0.5, vy: -(0.25 + Math.random() * 0.35),
          color: '#FFD060', life: 40, maxLife: 40,
        })
      }
      if ((ce === 'nutrients' || ce === 'molasses') && tick % 4 === 0) {
        particlesRef.current.push({
          x: W / 2 + (Math.random() - 0.5) * 12, y: 86 + Math.random() * 10,
          vx: (Math.random() - 0.5) * 0.2, vy: -(0.35 + Math.random() * 0.45),
          color: ce === 'molasses' ? '#C04A20' : '#56B04A', life: 45, maxLife: 45,
        })
      }

      // ── Draw tree ──
      drawTree(ctx, stage, swayFrame, health, moisture, sunlight, isDead)

      // ── Draw particles ──
      particlesRef.current.forEach(p => {
        const alpha = Math.floor((p.life / p.maxLife) * 220)
          .toString(16).padStart(2, '0')
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
      style={{ width: W * S, height: H * S, imageRendering: 'pixelated', display: 'block' }}
    />
  )
}

// ── Tree renderer (pure drawing, no state) ────────────────────────────────────
function drawTree(
  ctx: CanvasRenderingContext2D,
  stageIdx: number,
  swayFrame: number,
  health: number,
  moisture: number,
  sunlight: number,
  isDead: boolean,
) {
  const baseY = H - 14
  const cx = Math.floor(W / 2)
  const st = STAGES[Math.max(0, Math.min(7, stageIdx))]

  // Derive colors from vitals
  const leafDark  = isDead ? C.dead2 : health < 20 ? C.lfB : health < 40 ? C.lfY : C.lfD
  const leafMid   = isDead ? C.dead1 : health < 20 ? C.lfB : health < 40 ? C.lfY : C.lfM
  const leafLight = isDead ? C.dead1 : health < 20 ? C.lfY : health < 40 ? C.lfH : C.lfL
  const trD       = isDead ? C.dtrD  : C.trD
  const trM       = isDead ? C.dtrM  : C.trM
  const trL       = isDead ? '#4A3020' : C.trL

  // ── Background ──
  ctx.fillStyle = C.bg
  ctx.fillRect(0, 0, W * S, H * S)

  // Radial ambient glow around mid-canopy
  if (!isDead && stageIdx >= 3) {
    const grad = ctx.createRadialGradient(
      cx * S, (baseY - st.trunkH * 0.5) * S, 0,
      cx * S, (baseY - st.trunkH * 0.5) * S, 30 * S,
    )
    grad.addColorStop(0, '#0D2210')
    grad.addColorStop(1, C.bg)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W * S, H * S)
  }

  // Low-light dim overlay
  if (sunlight < 25 && !isDead) {
    ctx.fillStyle = 'rgba(0,0,0,0.28)'
    ctx.fillRect(0, 0, W * S, H * S)
  }

  // ── Soil ──
  const soilBase = moisture < 20 ? C.soil4 : C.soil2
  const soilEdge = moisture < 20 ? C.soil3 : C.soil1

  hline(ctx, 4, W - 4, baseY, soilEdge)

  for (let y = baseY + 1; y < H; y++) {
    const spread = Math.round((y - baseY) * 2.4)
    const x0 = Math.max(0, cx - spread)
    const x1 = Math.min(W - 1, cx + spread)
    for (let x = x0; x <= x1; x++) {
      const edgeDist = Math.min(x - x0, x1 - x)
      px(ctx, x, y, edgeDist < 2 ? soilEdge : soilBase)
    }
  }

  // Roots
  if (stageIdx >= 2) {
    px(ctx, cx - 3, baseY + 1, C.root); px(ctx, cx - 4, baseY + 2, C.root)
    px(ctx, cx + 3, baseY + 1, C.root); px(ctx, cx + 4, baseY + 2, C.root)
  }
  if (stageIdx >= 5) {
    px(ctx, cx - 5, baseY + 2, C.root); px(ctx, cx - 6, baseY + 3, C.root)
    px(ctx, cx + 5, baseY + 2, C.root); px(ctx, cx + 6, baseY + 3, C.root)
  }

  // ── Stage 0: seed sprout only ──
  if (stageIdx === 0) {
    px(ctx, cx, baseY - 1, trM)
    px(ctx, cx, baseY - 2, trM)
    px(ctx, cx, baseY - 3, trL)
    px(ctx, cx - 1, baseY - 4, leafMid)
    px(ctx, cx + 1, baseY - 4, leafMid)
    px(ctx, cx, baseY - 5, leafLight)
    return
  }

  // ── Trunk ──
  const trunkTop = baseY - st.trunkH
  const half     = Math.floor(st.trunkW / 2)

  for (let y = trunkTop; y <= baseY - 1; y++) {
    const progress = (y - trunkTop) / st.trunkH
    const wide     = st.trunkW + (progress > 0.75 ? 1 : 0)
    const w2       = Math.floor(wide / 2)

    for (let dx = -w2; dx <= w2; dx++) {
      let col = dx === -w2 ? trD : dx === w2 ? trL : trM
      if (dx === 0 && y % 8 === 4) col = trD           // bark texture dot
      px(ctx, cx + dx, y, col)
    }
    if (wide >= 3 && y % 6 === 0) px(ctx, cx + w2 - 1, y, C.trH)  // highlight
  }

  // ── Branches + leaf clusters ──
  const swayOff = swayFrame === 1 ? 1 : swayFrame === 3 ? -1 : 0

  st.branches.forEach(b => {
    const branchY  = baseY - b.y
    const startX   = cx + (b.dir > 0 ? half + 1 : -(half + 1))
    const endX     = startX + b.dir * b.len
    const heightFactor = b.y / st.trunkH
    const sway     = Math.round(swayOff * heightFactor * 1.8)
    const tipX     = endX + sway
    const tipY     = branchY - Math.floor(b.len * 0.25)

    // Branch line with slight upward angle
    const steps = Math.abs(endX - startX)
    for (let i = 0; i <= steps; i++) {
      const t  = i / steps
      const bx = Math.round(startX + t * (tipX - startX))
      const by = Math.round(branchY + t * (tipY - branchY))
      px(ctx, bx, by, i < 2 ? trD : trM)
    }

    // Leaf cluster at tip
    leafCluster(ctx, tipX, tipY - 1, st.leafR - 1, leafDark, leafMid, leafLight)
  })

  // Crown top cluster
  if (stageIdx >= 1) {
    const topSway = Math.round(swayOff * 0.6)
    leafCluster(ctx, cx + topSway, trunkTop - st.leafR + 2, st.leafR, leafDark, leafMid, leafLight)
  }

  // ── Flowers (stage 5 only) ──
  if (st.flowers) {
    const fpos = [
      [cx - 1, baseY - 14], [cx + 2, baseY - 22],
      [cx - 3, baseY - 30], [cx + 3, baseY - 38],
    ]
    fpos.forEach(([fx, fy]) => {
      px(ctx, fx, fy,     C.flW); px(ctx, fx + 1, fy, C.flW)
      px(ctx, fx, fy - 1, C.flW); px(ctx, fx + 1, fy - 1, C.flY)
    })
  }

  // ── Mazorcas (cacao pods grow directly on trunk — botanically correct) ──
  if (st.mazCount > 0) {
    const ripe = stageIdx >= 7
    const pods = [
      [cx - 3, baseY - 18],
      [cx + 3, baseY - 28],
      [cx - 4, baseY - 38],
      [cx + 2, baseY - 47],
      [cx - 2, baseY - 56],
      [cx + 3, baseY - 11],
    ].slice(0, st.mazCount)

    pods.forEach(([px2, py2], i) => {
      const col1 = ripe ? (i % 2 === 0 ? C.mazR : C.mazO) : C.mazG
      const col2 = ripe ? C.mazL : C.mazGH

      // 3×6 oval pod shape (botanically elongated)
      const podPixels = [
        [0, -2], [1, -2],
        [-1, -1], [0, -1], [1, -1], [2, -1],
        [-1, 0],  [0, 0],  [1, 0],  [2, 0],
        [-1, 1],  [0, 1],  [1, 1],  [2, 1],
        [0, 2],  [1, 2],
      ]
      podPixels.forEach(([dx, dy], pi) => {
        px(ctx, px2 + dx, py2 + dy, pi % 3 === 1 ? col2 : col1)
      })

      // Animated glow halo for ripe pods
      if (ripe) {
        const alpha = Math.floor(
          (Math.sin(Date.now() / 600 + i * 1.3) * 0.4 + 0.5) * 90 + 30
        ).toString(16).padStart(2, '0')
        ctx.fillStyle = C.mazL + alpha
        ctx.fillRect((px2 - 2) * S, (py2 - 3) * S, 6 * S, 8 * S)
      }
    })
  }

  // ── Dead state overlay ──
  if (isDead) {
    ctx.fillStyle = 'rgba(0,0,0,0.38)'
    ctx.fillRect(0, 0, W * S, H * S)
    // Fallen dried leaves on soil
    ;[[cx - 8, baseY + 2], [cx + 5, baseY + 3], [cx - 2, baseY + 4], [cx + 9, baseY + 2]].forEach(
      ([lx, ly]) => {
        px(ctx, lx, ly, C.dead1)
        px(ctx, lx + 1, ly, C.dead2)
      },
    )
  }
}
