import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { BRAND, FONTS, TOKEN_RATES, HARVEST_COMBO_WINDOW_MS } from '../../utils/constants'
import Machete3DCursor from '../3d/Machete3DCursor'
import { type CursorRef, makeCursorRef } from '../3d/Machete3DCursor.helpers'
import CacaoPod, { type PodColor } from '../3d/CacaoPod'
import CacaoTreeBackdrop from '../3d/CacaoTreeBackdrop'

/**
 * HarvestMacheteArena — Fruit-Ninja-style harvest minigame.
 *
 * Behavior (Phase 2 — physics edition):
 *   - A cacao tree silhouette sits in the background.
 *   - N mazorcas (5–8 by tree id hash) drop from random branch positions on
 *     the tree at staggered times (0–4s after open). Each pod has random
 *     initial velocity + spin, falls under gravity. Just like Fruit Ninja —
 *     unpredictable, you have to react.
 *   - Pods come in 3 ripeness shades (green / yellow / orange). Color seeded
 *     by tree id so the same tree always drops the same harvest set.
 *   - User swipes the 3D machete; each slice splits the pod, drips mucílago
 *     into a glass bottle (lower-left), pours cacao mass into a fermentation
 *     tank (lower-right). Combo +20% if all sliced within window.
 *   - Pods that fall past the bottom = missed (still get partial reward).
 *
 * Architecture:
 *   - 2D layer (DOM)            — tree backdrop, animated pods, slice halves,
 *                                 particle streams, SVG trail, vessels.
 *   - 3D layer (R3F Canvas)     — Machete3DCursor (shared).
 *   - Hit detection             — circle test on each pointer point vs each
 *                                 flying pod's current px center.
 *   - Physics                   — raf-driven integration; gravity pulls pods
 *                                 down, rotation accumulates from angular vel.
 */

const ARENA_HEIGHT = 380           // px
const POD_SIZE     = 64            // base width of CacaoPod SVG
const HIT_RADIUS   = 56            // px circle test
const TRAIL_TTL    = 350           // ms
const SLICE_ANIM   = 750           // ms — half-tile fly-off
const VESSEL_HEIGHT = 110          // px
const VESSEL_WIDTH  = 64           // px

// Physics — px per frame at 60fps
const GRAVITY            = 0.16    // px/frame²
const VX_RANGE           = 1.8     // ± horizontal initial velocity
const VY_RANGE_UP        = 1.5     // initial upward push (max)
const ANGULAR_VEL_RANGE  = 0.05    // ± rad/frame initial spin
const SPAWN_STAGGER_MAX  = 4000    // ms — last pod can spawn up to 4s after open
const OFFSCREEN_MARGIN   = 100     // px past arena bottom to mark as "missed"

// Per-pod rewards — multiply by # of pods successfully sliced.
const PER_POD_MUCILAGE = TOKEN_RATES.tree_harvest_share.per_pod_mucilage_g
const PER_POD_CACAO    = TOKEN_RATES.tree_harvest_share.per_pod_cacao_mass_g

// Branch positions on the tree backdrop (normalized 0..1). Pods spawn from
// these — they're roughly aligned with the foliage clusters in
// CacaoTreeBackdrop so the user gets a "tree just dropped a pod" feel.
const BRANCH_POSITIONS: Array<{ x: number; y: number }> = [
  { x: 0.30, y: 0.34 }, // upper left
  { x: 0.50, y: 0.30 }, // top center
  { x: 0.70, y: 0.34 }, // upper right
  { x: 0.20, y: 0.55 }, // mid left
  { x: 0.80, y: 0.55 }, // mid right
  { x: 0.27, y: 0.78 }, // lower left
  { x: 0.73, y: 0.78 }, // lower right
  { x: 0.50, y: 0.55 }, // mid center
]

const POD_COLORS: PodColor[] = ['green', 'yellow', 'orange']

export interface HarvestArenaResult {
  pods_sliced:    number
  pods_total:     number
  pods_missed:    number
  mucilage_g:     number
  cacao_mass_g:   number
  beans_override: number
  mazorcas_override: number
  combo_bonus:    boolean
}

interface Props {
  treeId: string
  guardianName: string
  onComplete: (result: HarvestArenaResult) => void
  lang?: 'es' | 'en'
}

type PodRuntime = {
  id: string
  // Physics state — updated each frame while flying.
  x: number          // px from arena left
  y: number          // px from arena top
  vx: number         // px/frame
  vy: number         // px/frame
  rotation: number   // radians
  angularVelocity: number  // rad/frame
  // Spawn schedule.
  spawnAt: number    // ms timestamp
  spawnX: number     // px — branch origin
  spawnY: number     // px — branch origin
  // Visual.
  color: PodColor
  tilt: number       // degrees, fixed visual offset
  // State.
  state: 'pending' | 'flying' | 'sliced' | 'missed'
  slicedAt: number
  sliceDx: number
  sliceDy: number
}

type TrailPoint = { x: number; y: number; t: number }

// FNV-1a hash for deterministic per-tree layout.
function hash32(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  }
  return h >>> 0
}
// Map a hash to [-1, 1] uniformly.
function hashSigned(s: string): number {
  return ((hash32(s) % 2000) / 1000) - 1
}

export default function HarvestMacheteArena({ treeId, guardianName, onComplete, lang = 'es' }: Props) {
  const arenaRef = useRef<HTMLDivElement | null>(null)
  const [arenaWidth, setArenaWidth] = useState(0)

  // mountTime — captured once via useState initializer (allowed impure call).
  // Pod spawnAt becomes "ms offset from mount" so the arena's first frame
  // computes who's pending vs flying.
  const [mountTime] = useState(() => performance.now())

  // Deterministic pod plan — color, branch, spawnDelay (offset), tilt.
  const initial = useMemo<PodRuntime[]>(() => {
    const seed = hash32(treeId)
    const N = 5 + (seed % 4)  // 5..8
    return Array.from({ length: N }, (_, i) => {
      const branch = BRANCH_POSITIONS[(seed + i * 7) % BRANCH_POSITIONS.length]
      const colorIdx = hash32(`${treeId}-c-${i}`) % 3
      return {
        id: `pod-${i}`,
        x: 0, y: 0, vx: 0, vy: 0,
        rotation: 0, angularVelocity: 0,
        // ms offset from arena open. raf loop compares against (t - mountTime).
        spawnAt: hash32(`${treeId}-d-${i}`) % SPAWN_STAGGER_MAX,
        spawnX: branch.x,    // normalized — converted to px when arenaWidth known
        spawnY: branch.y * ARENA_HEIGHT,
        color: POD_COLORS[colorIdx],
        tilt: hashSigned(`${treeId}-t-${i}`) * 8,  // -8..+8 deg
        state: 'pending',
        slicedAt: 0, sliceDx: 0, sliceDy: 0,
      }
    })
  }, [treeId])

  const [runtime, setRuntime] = useState<PodRuntime[]>(initial)
  useEffect(() => { setRuntime(initial) }, [initial])

  // Track arena width for px-based positioning.
  useEffect(() => {
    if (!arenaRef.current) return
    const el = arenaRef.current
    const ro = new ResizeObserver(() => setArenaWidth(el.clientWidth))
    ro.observe(el)
    setArenaWidth(el.clientWidth)
    return () => ro.disconnect()
  }, [])

  // raf-driven physics + now state. Single loop integrates pod positions
  // (pending → flying transition with random initial velocity, gravity,
  // angular velocity) AND publishes `now` for trail decay + slice progress.
  const [now, setNow] = useState<number>(() => performance.now())
  // Ref mirror of arenaWidth so the raf loop reads the latest without
  // re-subscribing on every resize. Sync via effect (refs cannot be written
  // during render under react-hooks/refs lint).
  const arenaWidthRef = useRef(arenaWidth)
  useEffect(() => { arenaWidthRef.current = arenaWidth }, [arenaWidth])
  useEffect(() => {
    let raf = 0
    let lastT = performance.now()
    const loop = (t: number) => {
      const dt = Math.min(2.5, (t - lastT) / 16.67)  // frames; clamp huge dt (tab inactive)
      lastT = t
      setNow(t)
      const aw = arenaWidthRef.current
      if (aw > 0) {
        setRuntime(curr => {
          let mutated = false
          const elapsedMs = t - mountTime
          const next = curr.map(pod => {
            // Pending → flying spawn.
            if (pod.state === 'pending' && elapsedMs >= pod.spawnAt) {
              mutated = true
              const seed = hash32(`${pod.id}-init`)
              const r1 = ((seed % 1000) / 500) - 1                // -1..+1
              const r2 = (((seed >> 10) % 1000) / 500) - 1
              const r3 = (((seed >> 20) % 1000) / 500) - 1
              return {
                ...pod,
                state: 'flying',
                x: pod.spawnX * aw,
                y: pod.spawnY,
                vx: r1 * VX_RANGE,
                vy: -Math.abs(r2) * VY_RANGE_UP,   // always slight upward bounce
                angularVelocity: r3 * ANGULAR_VEL_RANGE,
                rotation: 0,
              } as PodRuntime
            }
            // Flying physics integration.
            if (pod.state === 'flying') {
              mutated = true
              const newY  = pod.y + pod.vy * dt
              const newX  = pod.x + pod.vx * dt
              const newVy = pod.vy + GRAVITY * dt
              const newRot = pod.rotation + pod.angularVelocity * dt
              if (newY > ARENA_HEIGHT + OFFSCREEN_MARGIN) {
                return { ...pod, state: 'missed' } as PodRuntime
              }
              return { ...pod, x: newX, y: newY, vy: newVy, rotation: newRot }
            }
            return pod
          })
          return mutated ? next : curr
        })
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [mountTime])

  // Trail state.
  const [trail, setTrail] = useState<TrailPoint[]>([])
  const draggingRef = useRef(false)
  const lastSwipeDir = useRef<{ dx: number; dy: number }>({ dx: 1, dy: 0 })
  const cursorRef = useRef<CursorRef>(makeCursorRef())

  const [firstSliceAt, setFirstSliceAt] = useState<number | null>(null)
  const [completed,    setCompleted]    = useState(false)

  function pushTrailPoint(x: number, y: number) {
    const time = performance.now()
    setTrail(curr => {
      const last = curr[curr.length - 1]
      if (last) {
        const dx = x - last.x
        const dy = y - last.y
        if (dx * dx + dy * dy > 4) {
          lastSwipeDir.current = { dx, dy }
          cursorRef.current.swipeAngle = Math.atan2(dy, dx)
        }
      }
      const cutoff = time - TRAIL_TTL
      return [...curr.filter(p => p.t >= cutoff), { x, y, t: time }]
    })
  }

  function checkHits(x: number, y: number) {
    setRuntime(curr => {
      let mutated = false
      const next = curr.map(pod => {
        if (pod.state !== 'flying') return pod
        const dx = x - pod.x
        const dy = y - pod.y
        if (dx * dx + dy * dy < HIT_RADIUS * HIT_RADIUS) {
          mutated = true
          setFirstSliceAt(prev => prev ?? performance.now())
          return {
            ...pod,
            state: 'sliced',
            slicedAt: performance.now(),
            sliceDx: lastSwipeDir.current.dx,
            sliceDy: lastSwipeDir.current.dy,
          } as PodRuntime
        }
        return pod
      })
      return mutated ? next : curr
    })
  }

  function onPointerDown(e: React.PointerEvent) {
    if (!arenaRef.current) return
    arenaRef.current.setPointerCapture(e.pointerId)
    draggingRef.current = true
    const rect = arenaRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    cursorRef.current.x = x
    cursorRef.current.y = y
    cursorRef.current.visible = true
    cursorRef.current.visibleUntil = performance.now() + 600
    pushTrailPoint(x, y)
    checkHits(x, y)
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!arenaRef.current) return
    const rect = arenaRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    cursorRef.current.x = x
    cursorRef.current.y = y
    if (draggingRef.current) {
      cursorRef.current.visible = true
      cursorRef.current.visibleUntil = performance.now() + 600
      pushTrailPoint(x, y)
      checkHits(x, y)
    } else {
      cursorRef.current.visible = true
      cursorRef.current.visibleUntil = performance.now() + 1200
    }
  }
  function onPointerUp() {
    draggingRef.current = false
  }

  // Trail decay tick.
  useEffect(() => {
    if (trail.length === 0) return
    const id = setInterval(() => {
      setTrail(curr => {
        const cutoff = performance.now() - TRAIL_TTL
        const next = curr.filter(p => p.t >= cutoff)
        return next.length === curr.length ? curr : next
      })
    }, 50)
    return () => clearInterval(id)
  }, [trail.length])

  // Counts.
  const totalPods    = runtime.length
  const slicedCount  = runtime.filter(p => p.state === 'sliced').length
  const missedCount  = runtime.filter(p => p.state === 'missed').length
  const inAirCount   = runtime.filter(p => p.state === 'pending' || p.state === 'flying').length
  const allDone      = totalPods > 0 && inAirCount === 0
  const fillRatio    = slicedCount / Math.max(1, totalPods)

  // Combo: all done, no misses, within window.
  const comboActive = allDone
    && missedCount === 0
    && firstSliceAt !== null
    && (now - firstSliceAt) <= HARVEST_COMBO_WINDOW_MS

  // Fire onComplete once, after the slice anim settles.
  useEffect(() => {
    if (!allDone || completed) return
    const settleMs = SLICE_ANIM + 250
    const timer = setTimeout(() => {
      setCompleted(true)
      const baseBeans    = TOKEN_RATES.tree_harvest_share.beans
      const baseMazorcas = TOKEN_RATES.tree_harvest_share.mazorcas
      // Reward scales with sliced fraction (so missing pods ≠ no harvest).
      const captureRatio = slicedCount / Math.max(1, totalPods)
      const bonusMul = comboActive ? 1 + TOKEN_RATES.tree_harvest_share.combo_bonus_pct / 100 : 1
      onComplete({
        pods_sliced:       slicedCount,
        pods_total:        totalPods,
        pods_missed:       missedCount,
        mucilage_g:        slicedCount * PER_POD_MUCILAGE,
        cacao_mass_g:      slicedCount * PER_POD_CACAO,
        beans_override:    +(baseBeans    * captureRatio * bonusMul).toFixed(2),
        mazorcas_override: +(baseMazorcas * captureRatio * bonusMul).toFixed(2),
        combo_bonus:       comboActive,
      })
    }, settleMs)
    return () => clearTimeout(timer)
  }, [allDone, completed, slicedCount, missedCount, totalPods, comboActive, onComplete])

  return (
    <div>
      <div
        ref={arenaRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          position: 'relative',
          width: '100%',
          height: ARENA_HEIGHT,
          background: 'radial-gradient(ellipse at 50% 25%, #1F1006 0%, #0E0703 70%, #050201 100%)',
          border: `1px solid ${BRAND.mazorca}55`,
          borderRadius: 16,
          overflow: 'hidden',
          touchAction: 'none',
          cursor: 'none',
          userSelect: 'none',
        }}
      >
        {/* Tree silhouette in the back — sets the stage */}
        <CacaoTreeBackdrop opacity={0.22} />

        {/* Subtle dot grain over tree for depth */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `radial-gradient(${BRAND.mazorca}11 1px, transparent 1px)`,
          backgroundSize: '14px 14px',
          opacity: 0.35,
          pointerEvents: 'none',
        }} />

        {/* Sun-rays diagonal — harvest morning vibe */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(135deg, transparent 40%, ${BRAND.mazorca}11 50%, transparent 60%)`,
          pointerEvents: 'none',
        }} />

        {/* Combo flash */}
        {comboActive && (
          <div style={{
            position: 'absolute', inset: 0,
            background: `radial-gradient(ellipse at 50% 50%, ${BRAND.mazorca}33 0%, transparent 70%)`,
            pointerEvents: 'none',
            animation: 'caua-harvest-combo 0.9s ease-out',
          }} />
        )}

        {/* Pods — physics-based */}
        {runtime.map(pod => {
          if (pod.state === 'pending' || pod.state === 'missed') return null

          if (pod.state === 'flying') {
            return (
              <div
                key={pod.id}
                style={{
                  position: 'absolute',
                  left: pod.x,
                  top:  pod.y,
                  transform: `translate(-50%, -50%) rotate(${pod.rotation + pod.tilt * Math.PI / 180}rad)`,
                  pointerEvents: 'none',
                  willChange: 'transform',
                }}
              >
                <CacaoPod color={pod.color} size={POD_SIZE} />
              </div>
            )
          }

          // Sliced — split halves perpendicular to the slice direction.
          const len = Math.max(1, Math.hypot(pod.sliceDx, pod.sliceDy))
          const nx = pod.sliceDx / len
          const ny = pod.sliceDy / len
          const px = -ny
          const py =  nx
          const elapsed = Math.min(now - pod.slicedAt, SLICE_ANIM)
          const progress = elapsed / SLICE_ANIM
          if (progress >= 1) return null
          const flingDist = 200 * progress
          const rot = 540 * progress
          const opacity = 1 - progress

          const halfStyle = (sign: number): CSSProperties => ({
            position: 'absolute',
            left: pod.x,
            top:  pod.y,
            transform: `translate(calc(-50% + ${sign * flingDist * px}px), calc(-50% + ${sign * flingDist * py + progress * 240}px)) rotate(${sign * rot + pod.tilt}deg)`,
            transition: 'none',
            pointerEvents: 'none',
            opacity,
          })

          // Bezier streams toward bottle (pulpa, mucílago) + tank (cacao mass).
          const streamDrops = (target: 'bottle' | 'tank', color: string) => {
            const aw = arenaWidth || 1
            const targetX = target === 'bottle' ? 0.10 * aw + 32
                                                : 0.90 * aw - 32
            const targetY = ARENA_HEIGHT - VESSEL_HEIGHT * 0.55
            const startX = pod.x
            const startY = pod.y
            const ctrlX  = (startX + targetX) / 2
            const ctrlY  = Math.min(startY, targetY) - 70
            return [0, 1, 2, 3].map(i => {
              const stagger = i * 0.08
              const tNorm = Math.max(0, Math.min(1, progress * 1.2 - stagger))
              if (tNorm <= 0) return null
              const u = 1 - tNorm
              const xPx = u * u * startX + 2 * u * tNorm * ctrlX  + tNorm * tNorm * targetX
              const yPx = u * u * startY + 2 * u * tNorm * ctrlY  + tNorm * tNorm * targetY
              const op = 1 - tNorm * 0.7
              return (
                <span key={`${target}-${i}`} style={{
                  position: 'absolute',
                  left: xPx, top: yPx,
                  transform: 'translate(-50%, -50%)',
                  width: 7, height: 7, borderRadius: 999,
                  background: color,
                  opacity: op,
                  boxShadow: `0 0 10px ${color}`,
                  pointerEvents: 'none',
                }} />
              )
            })
          }

          // Pulp color matches the pod's color so the user sees their slice
          // matter materialize as the right shade of juice. Tank stays brown.
          const pulpColor = pod.color === 'green'  ? '#9BC76B'
                          : pod.color === 'yellow' ? '#F1D469'
                          :                          '#F0A78F'

          return (
            <div key={pod.id}>
              <div style={{ ...halfStyle(+1), clipPath: 'inset(0 50% 0 0)' }}>
                <CacaoPod color={pod.color} size={POD_SIZE} />
              </div>
              <div style={{ ...halfStyle(-1), clipPath: 'inset(0 0 0 50%)' }}>
                <CacaoPod color={pod.color} size={POD_SIZE} />
              </div>
              {streamDrops('bottle', pulpColor)}
              {streamDrops('tank',   BRAND.brown)}
            </div>
          )
        })}

        {/* Slice arc — SVG polyline under the 3D machete */}
        <svg
          width="100%" height="100%"
          viewBox={`0 0 ${arenaWidth || 1} ${ARENA_HEIGHT}`}
          preserveAspectRatio="none"
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        >
          <defs>
            <linearGradient id="harvest-machete-glow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"  stopColor={BRAND.mazorca} stopOpacity="0" />
              <stop offset="50%" stopColor={BRAND.mazorca} stopOpacity="0.85" />
              <stop offset="100%" stopColor="#FFE9A8" stopOpacity="1" />
            </linearGradient>
          </defs>
          {trail.length >= 2 && trail.slice(1).map((b, i) => {
            const a = trail[i]
            const age = (now - b.t) / TRAIL_TTL
            const op = Math.max(0, 1 - age)
            return (
              <line
                key={b.t}
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke="url(#harvest-machete-glow)"
                strokeWidth={3 + 4 * op}
                strokeLinecap="round"
                opacity={op}
              />
            )
          })}
        </svg>

        {/* 3D machete cursor */}
        <Machete3DCursor
          cursorRef={cursorRef}
          arenaWidth={arenaWidth}
          arenaHeight={ARENA_HEIGHT}
        />

        {/* Vessels */}
        <Vessel
          variant="bottle"
          fillRatio={fillRatio}
          label={lang === 'es' ? 'MUCÍLAGO' : 'MUCILAGE'}
          subtotal={`${(slicedCount * PER_POD_MUCILAGE).toFixed(0)}g`}
          color={BRAND.pod}
          left={6}
        />
        <Vessel
          variant="tank"
          fillRatio={fillRatio}
          label={lang === 'es' ? 'MASA CACAO' : 'CACAO MASS'}
          subtotal={`${(slicedCount * PER_POD_CACAO).toFixed(0)}g`}
          color={BRAND.brown}
          right={6}
        />

        {/* Hint — visible while no pods have spawned + sliced yet */}
        {slicedCount === 0 && missedCount === 0 && (
          <div style={{
            position: 'absolute', top: 14, left: 0, right: 0,
            textAlign: 'center', pointerEvents: 'none',
            fontFamily: FONTS.serif, fontStyle: 'italic',
            color: `${BRAND.heirloom}88`, fontSize: 12, letterSpacing: '0.05em',
          }}>
            {lang === 'es'
              ? `⚔ El árbol suelta sus mazorcas — rebánalas al vuelo`
              : `⚔ The tree drops its pods — slice them mid-air`}
          </div>
        )}

        {/* Combo countdown */}
        {firstSliceAt !== null && !allDone && (
          <ComboBar
            startedAt={firstSliceAt}
            now={now}
            window={HARVEST_COMBO_WINDOW_MS}
          />
        )}

        {/* Done overlay */}
        {allDone && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: 10,
            background: 'linear-gradient(180deg, transparent 0%, #1a0a0099 70%)',
            pointerEvents: 'none',
            animation: 'caua-harvest-done 0.6s ease-out',
          }}>
            <div style={{ fontSize: 56 }}>🍫</div>
            <div style={{
              fontFamily: FONTS.display, fontWeight: 800, fontSize: 18,
              color: comboActive ? '#FFE9A8' : BRAND.mazorca,
              letterSpacing: '0.16em', textTransform: 'uppercase',
              textShadow: comboActive ? `0 0 24px ${BRAND.mazorca}cc` : 'none',
            }}>
              {comboActive
                ? (lang === 'es' ? '¡Cosecha perfecta!' : 'Perfect harvest!')
                : missedCount > 0
                ? (lang === 'es' ? `Cosecha · ${slicedCount}/${totalPods}` : `Harvest · ${slicedCount}/${totalPods}`)
                : (lang === 'es' ? 'Cosecha lista' : 'Harvest done')}
            </div>
            {comboActive && (
              <div style={{
                fontFamily: FONTS.display, fontWeight: 700, fontSize: 11,
                color: '#FFE9A8', letterSpacing: '0.1em',
              }}>
                +{TOKEN_RATES.tree_harvest_share.combo_bonus_pct}% bonus
              </div>
            )}
            {missedCount > 0 && !comboActive && (
              <div style={{
                fontFamily: FONTS.body, fontStyle: 'italic',
                color: `${BRAND.heirloom}77`, fontSize: 11,
              }}>
                {lang === 'es'
                  ? `${missedCount} ${missedCount === 1 ? 'mazorca cayó al suelo' : 'mazorcas cayeron al suelo'}`
                  : `${missedCount} ${missedCount === 1 ? 'pod hit the ground' : 'pods hit the ground'}`}
              </div>
            )}
          </div>
        )}

        <style>{`
          @keyframes caua-harvest-combo {
            0% { opacity: 0; }
            30% { opacity: 1; }
            100% { opacity: 0; }
          }
          @keyframes caua-harvest-done {
            from { opacity: 0; transform: scale(0.96); }
            to   { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </div>

      {/* Footer counter */}
      <div style={{
        marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontFamily: FONTS.display, fontWeight: 700, fontSize: 11,
        color: `${BRAND.heirloom}aa`, letterSpacing: '0.12em', textTransform: 'uppercase',
      }}>
        <span>
          {lang === 'es' ? 'Mazorcas' : 'Pods'} · {slicedCount} / {totalPods}
          {missedCount > 0 && (
            <span style={{ color: '#e74c3caa', marginLeft: 8 }}>
              · {missedCount} {lang === 'es' ? 'al suelo' : 'missed'}
            </span>
          )}
        </span>
        <span style={{
          fontStyle: 'italic', fontWeight: 400, textTransform: 'none',
          fontFamily: FONTS.serif, color: `${BRAND.heirloom}66`,
        }}>
          {guardianName}
        </span>
      </div>
    </div>
  )
}

// ─── VESSEL ───────────────────────────────────────────────────────────────

interface VesselProps {
  variant: 'bottle' | 'tank'
  fillRatio: number
  label: string
  subtotal: string
  color: string
  left?: number
  right?: number
}

function Vessel({ variant, fillRatio, label, subtotal, color, left, right }: VesselProps) {
  const liquidH = Math.max(0, Math.min(1, fillRatio)) * 100

  return (
    <div style={{
      position: 'absolute',
      bottom: 8,
      left:  left  != null ? `${left}%`  : undefined,
      right: right != null ? `${right}%` : undefined,
      width: VESSEL_WIDTH, height: VESSEL_HEIGHT,
      pointerEvents: 'none',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      <div style={{
        position: 'relative',
        width: '100%',
        flex: 1,
        background: '#0008',
        border: `1.5px solid ${color}aa`,
        borderRadius: variant === 'bottle' ? '24px 24px 8px 8px' : '4px 4px 16px 16px',
        overflow: 'hidden',
        boxShadow: `inset 0 0 12px ${color}33, 0 4px 12px #0008`,
      }}>
        {variant === 'bottle' && (
          <div style={{
            position: 'absolute',
            top: 8, left: '50%', width: 16, height: 6,
            transform: 'translateX(-50%)',
            background: '#0006',
            borderRadius: 4,
          }} />
        )}
        {variant === 'tank' && (
          <div style={{
            position: 'absolute',
            top: 8, right: 6,
            width: 8, height: 8, borderRadius: 999,
            background: fillRatio > 0 ? '#91A63B' : '#444',
            boxShadow: fillRatio > 0 ? '0 0 6px #91A63Baa' : 'none',
          }} />
        )}
        <div style={{
          position: 'absolute',
          left: 0, right: 0, bottom: 0,
          height: `${liquidH}%`,
          background: `linear-gradient(180deg, ${color}cc 0%, ${color} 100%)`,
          transition: 'height 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: `inset 0 4px 8px ${color}66`,
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 4,
            background: `linear-gradient(180deg, ${color}ff, transparent)`,
            opacity: 0.7,
          }} />
        </div>
      </div>
      <div style={{
        marginTop: 4,
        fontFamily: FONTS.display, fontWeight: 800, fontSize: 8,
        color, letterSpacing: '0.16em',
        whiteSpace: 'nowrap',
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: FONTS.display, fontWeight: 700, fontSize: 10,
        color: `${color}cc`,
      }}>
        {subtotal}
      </div>
    </div>
  )
}

// ─── COMBO BAR ────────────────────────────────────────────────────────────

function ComboBar({ startedAt, now, window }: { startedAt: number; now: number; window: number }) {
  const elapsed = now - startedAt
  const remaining = Math.max(0, window - elapsed)
  const pct = Math.max(0, Math.min(1, remaining / window))
  if (pct <= 0) return null

  return (
    <div style={{
      position: 'absolute', top: 14, left: '50%',
      transform: 'translateX(-50%)',
      pointerEvents: 'none',
      width: 'min(60%, 220px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    }}>
      <div style={{
        fontFamily: FONTS.display, fontWeight: 800, fontSize: 9,
        color: BRAND.mazorca, letterSpacing: '0.16em', textTransform: 'uppercase',
      }}>
        Combo · {(remaining / 1000).toFixed(1)}s
      </div>
      <div style={{
        width: '100%', height: 4, borderRadius: 999,
        background: '#0006', overflow: 'hidden',
      }}>
        <div style={{
          width: `${pct * 100}%`, height: '100%',
          background: `linear-gradient(90deg, ${BRAND.mazorca}, #FFE9A8)`,
          transition: 'width 0.1s linear',
          boxShadow: `0 0 12px ${BRAND.mazorca}cc`,
        }} />
      </div>
    </div>
  )
}
