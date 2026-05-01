import { useEffect, useMemo, useRef, useState } from 'react'
import { BRAND, FONTS, TOKEN_RATES, HARVEST_COMBO_WINDOW_MS } from '../../utils/constants'
import Machete3DCursor from '../3d/Machete3DCursor'
import { type CursorRef, makeCursorRef } from '../3d/Machete3DCursor.helpers'

/**
 * HarvestMacheteArena — Fruit-Ninja-style harvest minigame.
 *
 * The user's mature cocoa tree drops N mazorcas into the arena. The user
 * swipes the 3D machete across them; each slice splits the mazorca, drips
 * mucílago into a glass bottle (lower-left), and pours cacao mass into a
 * fermentation tank (lower-right). When all N are sliced within the combo
 * window, a +20% bonus fires.
 *
 * Architecture mirrors LabranzaMachete:
 *   - 2D layer (DOM)            — backdrop, mazorca tiles, slice halves,
 *                                 SVG trail, bottle/tank fill animations,
 *                                 combo flash, terminal summary.
 *   - 3D layer (R3F Canvas)     — Machete3DCursor (shared).
 *   - Hit detection             — circle test on each pointer point vs each
 *                                 alive mazorca's bobbing center.
 *
 * The arena emits a single `onComplete` event when all mazorcas are sliced
 * (or the user clicks the skip link in the modal wrapper). The wrapper
 * decides when to fire `award-tokens` with the totals.
 */

const ARENA_HEIGHT = 380           // px — taller than Labranza (360) to fit vessels
const TILE_SIZE    = 88            // px per mazorca tile
const HIT_RADIUS   = 52            // px circle test
const TRAIL_TTL    = 350           // ms
const SLICE_ANIM   = 750           // ms — half-tile fly-off
const VESSEL_HEIGHT = 110          // px — height of bottle + tank zone
const VESSEL_WIDTH  = 64           // px

// Per-mazorca rewards. Multiply by N pods sliced.
const PER_POD_MUCILAGE = TOKEN_RATES.tree_harvest_share.per_pod_mucilage_g
const PER_POD_CACAO    = TOKEN_RATES.tree_harvest_share.per_pod_cacao_mass_g

export interface HarvestArenaResult {
  pods_sliced:    number
  pods_total:     number
  mucilage_g:     number
  cacao_mass_g:   number
  beans_override: number
  mazorcas_override: number
  combo_bonus:    boolean
}

interface Props {
  /** UUID of the cocoa tree being harvested. Used to seed pod layout (deterministic). */
  treeId: string
  /** Display name of the tree's guardian (shown in the empty/done state). */
  guardianName: string
  /** Fired once when ALL mazorcas have been sliced (auto-completion). */
  onComplete: (result: HarvestArenaResult) => void
  lang?: 'es' | 'en'
}

type PodRuntime = {
  id: string
  xPct: number
  y: number
  bobPhase: number
  state: 'alive' | 'sliced'
  slicedAt: number
  sliceDx: number
  sliceDy: number
}

type TrailPoint = { x: number; y: number; t: number }

// FNV-1a-ish — cheap deterministic 32-bit hash on the tree UUID.
function hash32(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  }
  return h >>> 0
}

export default function HarvestMacheteArena({ treeId, guardianName, onComplete, lang = 'es' }: Props) {
  const arenaRef = useRef<HTMLDivElement | null>(null)
  const [arenaWidth, setArenaWidth] = useState(0)

  // Deterministic pod layout — N = 5-8 based on tree id, positions seeded by id.
  const initial = useMemo<PodRuntime[]>(() => {
    const seed = hash32(treeId)
    const N = 5 + (seed % 4)  // 5..8
    const cols = N <= 6 ? 3 : 4
    return Array.from({ length: N }, (_, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      // Per-pod jitter from the seed.
      const jX = ((hash32(`${treeId}-x-${i}`) % 19) - 9) * 0.3
      const jY = ((hash32(`${treeId}-y-${i}`) % 17) - 8) * 0.5
      return {
        id: `pod-${i}`,
        xPct: ((col + 0.5) / cols) * 100 + jX,
        y: 50 + row * 70 + jY,
        bobPhase: (i * 0.9) % (Math.PI * 2),
        state: 'alive',
        slicedAt: 0,
        sliceDx: 0,
        sliceDy: 0,
      }
    })
  }, [treeId])

  const [runtime, setRuntime] = useState<PodRuntime[]>(initial)
  useEffect(() => { setRuntime(initial) }, [initial])

  // Arena resize tracking.
  useEffect(() => {
    if (!arenaRef.current) return
    const el = arenaRef.current
    const ro = new ResizeObserver(() => setArenaWidth(el.clientWidth))
    ro.observe(el)
    setArenaWidth(el.clientWidth)
    return () => ro.disconnect()
  }, [])

  // raf-driven `now` state for bobbing + slice progress + trail fade.
  const [now, setNow] = useState<number>(() => performance.now())
  useEffect(() => {
    let raf = 0
    const loop = () => { setNow(performance.now()); raf = requestAnimationFrame(loop) }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  // Trail state (re-renders on push/decay).
  const [trail, setTrail] = useState<TrailPoint[]>([])
  const draggingRef = useRef(false)
  const lastSwipeDir = useRef<{ dx: number; dy: number }>({ dx: 1, dy: 0 })
  const cursorRef = useRef<CursorRef>(makeCursorRef())

  // Combo timing — first slice timestamp. State so render can read it
  // without violating the "refs are not readable during render" lint rule.
  const [firstSliceAt, setFirstSliceAt] = useState<number | null>(null)
  // Whether onComplete was already fired (idempotency).
  const [completed, setCompleted] = useState(false)

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
    if (!arenaWidth) return
    setRuntime(curr => {
      let mutated = false
      const next = curr.map(pod => {
        if (pod.state !== 'alive') return pod
        const cx = (pod.xPct / 100) * arenaWidth
        const cy = pod.y + 6 * Math.sin(now * 0.0036 + pod.bobPhase)
        const dx = x - cx
        const dy = y - cy
        if (dx * dx + dy * dy < HIT_RADIUS * HIT_RADIUS) {
          mutated = true
          // Lazily initialize the combo clock on the first hit. setFirstSliceAt
          // is a no-op when already set (React bails on identical values).
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

  // Trail decay — re-prune every 50ms while there are trail points.
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

  // Vessel fill — derived from sliced count.
  const slicedCount = runtime.filter(p => p.state === 'sliced').length
  const totalPods   = runtime.length
  const fillRatio   = slicedCount / Math.max(1, totalPods)
  const allSliced   = totalPods > 0 && slicedCount === totalPods

  // Combo: all sliced AND time-from-first-slice ≤ window. Use the raf-driven
  // `now` state instead of calling performance.now() during render (impure).
  const comboActive = allSliced
    && firstSliceAt !== null
    && (now - firstSliceAt) <= HARVEST_COMBO_WINDOW_MS

  // Fire onComplete once when all are sliced (after the slice anim finishes
  // so the user sees the splash).
  useEffect(() => {
    if (!allSliced || completed) return
    const settleMs = SLICE_ANIM + 250
    const timer = setTimeout(() => {
      setCompleted(true)
      const baseBeans    = TOKEN_RATES.tree_harvest_share.beans
      const baseMazorcas = TOKEN_RATES.tree_harvest_share.mazorcas
      const bonusMul = comboActive ? 1 + TOKEN_RATES.tree_harvest_share.combo_bonus_pct / 100 : 1
      onComplete({
        pods_sliced:       slicedCount,
        pods_total:        totalPods,
        mucilage_g:        slicedCount * PER_POD_MUCILAGE,
        cacao_mass_g:      slicedCount * PER_POD_CACAO,
        beans_override:    +(baseBeans * bonusMul).toFixed(2),
        mazorcas_override: +(baseMazorcas * bonusMul).toFixed(2),
        combo_bonus:       comboActive,
      })
    }, settleMs)
    return () => clearTimeout(timer)
  }, [allSliced, completed, slicedCount, totalPods, comboActive, onComplete])

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
          background: 'radial-gradient(ellipse at 50% 25%, #2A1A0B 0%, #150A04 70%, #050201 100%)',
          border: `1px solid ${BRAND.mazorca}55`,
          borderRadius: 16,
          overflow: 'hidden',
          touchAction: 'none',
          cursor: 'none',
          userSelect: 'none',
        }}
      >
        {/* Warm grain backdrop */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `radial-gradient(${BRAND.mazorca}11 1px, transparent 1px)`,
          backgroundSize: '14px 14px',
          opacity: 0.45,
          pointerEvents: 'none',
        }} />

        {/* Sun-rays diagonal — sets a "harvest morning" vibe distinct from Labranza */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(135deg, transparent 40%, ${BRAND.mazorca}11 50%, transparent 60%)`,
          pointerEvents: 'none',
        }} />

        {/* Combo flash — gold pulse on the whole arena when combo fires */}
        {comboActive && (
          <div style={{
            position: 'absolute', inset: 0,
            background: `radial-gradient(ellipse at 50% 50%, ${BRAND.mazorca}33 0%, transparent 70%)`,
            pointerEvents: 'none',
            animation: 'caua-harvest-combo 0.9s ease-out',
          }} />
        )}

        {/* Mazorca pods */}
        {runtime.map(pod => {
          const bobY = pod.state === 'alive' ? 6 * Math.sin(now * 0.0036 + pod.bobPhase) : 0
          if (pod.state === 'alive') {
            return (
              <div key={pod.id} style={{
                position: 'absolute',
                left: `${pod.xPct}%`,
                top:  pod.y + bobY,
                transform: 'translate(-50%, -50%)',
                width: TILE_SIZE, height: TILE_SIZE,
                pointerEvents: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{
                  fontSize: 60, lineHeight: 1,
                  filter: `drop-shadow(0 8px 14px ${BRAND.mazorca}88)`,
                }}>🫘</div>
              </div>
            )
          }
          // Sliced — split halves perpendicular to the slice, plus dual particle
          // streams (mucilage → bottle, cacao → tank).
          const len = Math.max(1, Math.hypot(pod.sliceDx, pod.sliceDy))
          const nx = pod.sliceDx / len
          const ny = pod.sliceDy / len
          const px = -ny
          const py =  nx
          const elapsed = Math.min(now - pod.slicedAt, SLICE_ANIM)
          const progress = elapsed / SLICE_ANIM
          if (progress >= 1) return null
          const flingDist = 180 * progress
          const rot = 540 * progress
          const opacity = 1 - progress

          const halfStyle = (sign: number): React.CSSProperties => ({
            position: 'absolute',
            left: `${pod.xPct}%`,
            top:  pod.y,
            width: TILE_SIZE, height: TILE_SIZE,
            transform: `translate(calc(-50% + ${sign * flingDist * px}px), calc(-50% + ${sign * flingDist * py + progress * 220}px)) rotate(${sign * rot}deg)`,
            transition: 'none',
            pointerEvents: 'none',
            opacity,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 60, lineHeight: 1,
            filter: `drop-shadow(0 8px 14px ${BRAND.mazorca}55)`,
          })

          // Particle streams: half toward bottle (lower-left), half toward tank
          // (lower-right). We use percentage-based targets so the math is
          // resolution-independent. Each particle is offset from the slice
          // origin along a quadratic Bezier curve.
          const streamDrops = (target: 'bottle' | 'tank', color: string) => {
            const targetX = target === 'bottle' ? 14 : 86  // % from arena left
            const targetY = ARENA_HEIGHT - VESSEL_HEIGHT * 0.55  // px from arena top
            return [0, 1, 2, 3].map(i => {
              // Each particle has its own progress phase (staggered).
              const stagger = i * 0.08
              const tNorm = Math.max(0, Math.min(1, progress * 1.2 - stagger))
              if (tNorm <= 0) return null
              // Bezier control: arc upward then sweep into vessel.
              const startX = pod.xPct
              const startY = pod.y
              const ctrlX = (startX + targetX) / 2
              const ctrlY = Math.min(startY, targetY) - 70
              const u = 1 - tNorm
              const xPct = u * u * startX + 2 * u * tNorm * ctrlX + tNorm * tNorm * targetX
              const yPx  = u * u * startY + 2 * u * tNorm * ctrlY + tNorm * tNorm * targetY
              const op = 1 - tNorm * 0.7
              return (
                <span key={`${target}-${i}`} style={{
                  position: 'absolute',
                  left: `${xPct}%`, top: yPx,
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

          return (
            <div key={pod.id}>
              <div style={{ ...halfStyle(+1), clipPath: 'inset(0 50% 0 0)' }}>🫘</div>
              <div style={{ ...halfStyle(-1), clipPath: 'inset(0 0 0 50%)' }}>🫘</div>
              {streamDrops('bottle', BRAND.pod)}
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

        {/* BOTTLE — mucílago. Lower-left, thin glass cylinder with green liquid. */}
        <Vessel
          variant="bottle"
          fillRatio={fillRatio}
          label={lang === 'es' ? 'MUCÍLAGO' : 'MUCILAGE'}
          subtotal={`${(slicedCount * PER_POD_MUCILAGE).toFixed(0)}g`}
          color={BRAND.pod}
          left={6}
        />

        {/* TANK — masa de cacao. Lower-right, fermentation tank shape. */}
        <Vessel
          variant="tank"
          fillRatio={fillRatio}
          label={lang === 'es' ? 'MASA CACAO' : 'CACAO MASS'}
          subtotal={`${(slicedCount * PER_POD_CACAO).toFixed(0)}g`}
          color={BRAND.brown}
          right={6}
        />

        {/* Hint — visible while no slices yet */}
        {slicedCount === 0 && (
          <div style={{
            position: 'absolute', top: 14, left: 0, right: 0,
            textAlign: 'center', pointerEvents: 'none',
            fontFamily: FONTS.serif, fontStyle: 'italic',
            color: `${BRAND.heirloom}88`, fontSize: 12, letterSpacing: '0.05em',
          }}>
            {lang === 'es'
              ? `⚔ Rebana las ${totalPods} mazorcas — mucílago a la botella · cacao al tanque`
              : `⚔ Slice the ${totalPods} mazorcas — mucilage to bottle · cacao to tank`}
          </div>
        )}

        {/* Combo countdown — visible while pods remain and the timer's running */}
        {firstSliceAt !== null && !allSliced && (
          <ComboBar
            startedAt={firstSliceAt}
            now={now}
            window={HARVEST_COMBO_WINDOW_MS}
          />
        )}

        {/* Done overlay — quick splash before the modal wrapper takes over */}
        {allSliced && (
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
          @keyframes caua-vessel-fill {
            from { transform: scaleY(var(--from)); }
            to   { transform: scaleY(var(--to)); }
          }
        `}</style>
      </div>

      {/* External progress (visible below the arena) — useful for the modal
          footer that wraps this component. Optional. */}
      <div style={{
        marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontFamily: FONTS.display, fontWeight: 700, fontSize: 11,
        color: `${BRAND.heirloom}aa`, letterSpacing: '0.12em', textTransform: 'uppercase',
      }}>
        <span>{lang === 'es' ? 'Mazorcas' : 'Pods'} · {slicedCount} / {totalPods}</span>
        <span style={{ fontStyle: 'italic', fontWeight: 400, textTransform: 'none', fontFamily: FONTS.serif, color: `${BRAND.heirloom}66` }}>
          {guardianName}
        </span>
      </div>
    </div>
  )
}

// ─── VESSEL — bottle / tank with rising liquid ────────────────────────────

interface VesselProps {
  variant: 'bottle' | 'tank'
  /** 0..1 — share of pods sliced so far. */
  fillRatio: number
  label: string
  subtotal: string
  color: string
  /** Position from arena edge (%). Either left or right is set. */
  left?: number
  right?: number
}

function Vessel({ variant, fillRatio, label, subtotal, color, left, right }: VesselProps) {
  const liquidH = Math.max(0, Math.min(1, fillRatio)) * 100  // %

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
        {/* Bottle: neck reveal as a thin top band; Tank: pressure gauge dot. */}
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

        {/* Liquid fill — absolute bottom, height transitions */}
        <div style={{
          position: 'absolute',
          left: 0, right: 0, bottom: 0,
          height: `${liquidH}%`,
          background: `linear-gradient(180deg, ${color}cc 0%, ${color} 100%)`,
          transition: 'height 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: `inset 0 4px 8px ${color}66`,
        }}>
          {/* Surface ripple */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 4,
            background: `linear-gradient(180deg, ${color}ff, transparent)`,
            opacity: 0.7,
          }} />
        </div>
      </div>

      {/* Label */}
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

// ─── COMBO BAR — countdown to the bonus window ────────────────────────────

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
