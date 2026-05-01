import { useEffect, useMemo, useRef, useState } from 'react'
import { BRAND, FONTS } from '../../utils/constants'
import Machete3DCursor from '../3d/Machete3DCursor'
import { type CursorRef, makeCursorRef } from '../3d/Machete3DCursor.helpers'

/**
 * LabranzaMachete — Fruit-Ninja-style recycling minigame for dead trees.
 *
 * Dead trees float (bob gently) in an arena. The user drags a swipe across
 * them; a 3D machete (puffy-emoji styled per the user's spec) follows the
 * pointer and leaves a glowing slice arc. Any tree whose center the trail
 * crosses splits in half, halves spin off the screen, regenerative particles
 * burst, and `onRecycle` fires for that tree id.
 *
 * Why: regenerative framing — slicing dead biomass back into the soil is
 * cathartic + matches the IRL labranza step. Same `deleteTree` call as the
 * list view; just a more fun gesture.
 *
 * Architecture:
 *   - 2D layer (DOM)            — soil backdrop, tree tiles, slice halves,
 *                                 particles, SVG trail, hint/done overlays.
 *   - 3D layer (R3F Canvas)     — the machete cursor with PBR materials,
 *                                 directional lights, soft shadows. Position
 *                                 driven by a ref so pointer-move updates
 *                                 don't trigger React re-renders.
 *   - Hit detection             — circle test on each pointer point vs each
 *                                 alive tree's bobbing center.
 */

export type DeadTree = {
  id: string
  guardianName: string
}

interface Props {
  trees: DeadTree[]
  /** Called once per tree when it gets sliced. Resolves when the server delete
   *  completes; rejection is tolerated (visual stays in regenerated state). */
  onRecycle: (id: string) => Promise<void>
  lang?: 'es' | 'en'
}

type TreeRuntime = {
  id: string
  guardianName: string
  xPct: number
  y:    number
  bobPhase: number
  state: 'alive' | 'sliced'
  slicedAt: number
  sliceDx: number
  sliceDy: number
}

type TrailPoint = { x: number; y: number; t: number }

const ARENA_HEIGHT = 360
const TILE_SIZE    = 96
const HIT_RADIUS   = 56
const TRAIL_TTL    = 350
const SLICE_ANIM   = 750

export default function LabranzaMachete({ trees, onRecycle, lang = 'es' }: Props) {
  const arenaRef = useRef<HTMLDivElement | null>(null)
  const [arenaWidth, setArenaWidth] = useState(0)

  // ─── tree layout ─────────────────────────────────────────────────────────
  const initial = useMemo<TreeRuntime[]>(() => {
    return trees.map((t, i) => {
      const cols = Math.max(3, Math.ceil(Math.sqrt(trees.length * 1.6)))
      const col  = i % cols
      const row  = Math.floor(i / cols)
      const jitterX = ((i * 47) % 13) - 6
      const jitterY = ((i * 31) % 11) - 5
      return {
        id: t.id,
        guardianName: t.guardianName,
        xPct: ((col + 0.5) / cols) * 100 + jitterX * 0.2,
        y:    32 + row * 90 + jitterY,
        bobPhase: (i * 0.7) % (Math.PI * 2),
        state: 'alive',
        slicedAt: 0,
        sliceDx: 0,
        sliceDy: 0,
      }
    })
  }, [trees])
  const [runtime, setRuntime] = useState<TreeRuntime[]>(initial)
  useEffect(() => { setRuntime(initial) }, [initial])

  // ─── arena resize tracking ──────────────────────────────────────────────
  useEffect(() => {
    if (!arenaRef.current) return
    const el = arenaRef.current
    const ro = new ResizeObserver(() => setArenaWidth(el.clientWidth))
    ro.observe(el)
    setArenaWidth(el.clientWidth)
    return () => ro.disconnect()
  }, [])

  // ─── raf-driven `now` state (used for bobbing + slice progress + trail) ─
  const [now, setNow] = useState<number>(() => performance.now())
  useEffect(() => {
    let raf = 0
    const loop = () => { setNow(performance.now()); raf = requestAnimationFrame(loop) }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  // ─── trail (state, not ref — render reads it) ────────────────────────────
  const [trail, setTrail] = useState<TrailPoint[]>([])
  const draggingRef = useRef(false)
  const lastSwipeDir = useRef<{ dx: number; dy: number }>({ dx: 1, dy: 0 })
  const cursorRef = useRef<CursorRef>(makeCursorRef())

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
      const next = curr.map(tr => {
        if (tr.state !== 'alive') return tr
        const cx = (tr.xPct / 100) * arenaWidth
        const cy = tr.y + 6 * Math.sin(now * 0.0036 + tr.bobPhase)
        const dx = x - cx
        const dy = y - cy
        if (dx * dx + dy * dy < HIT_RADIUS * HIT_RADIUS) {
          mutated = true
          onRecycle(tr.id).catch(() => {/* noop — list view shows error if needed */})
          return {
            ...tr,
            state: 'sliced',
            slicedAt: performance.now(),
            sliceDx: lastSwipeDir.current.dx,
            sliceDy: lastSwipeDir.current.dy,
          } as TreeRuntime
        }
        return tr
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
    // Update cursor visual even when not actively dragging — gives the user a
    // sense of the weapon hovering over the field.
    cursorRef.current.x = x
    cursorRef.current.y = y
    if (draggingRef.current) {
      cursorRef.current.visible = true
      cursorRef.current.visibleUntil = performance.now() + 600
      pushTrailPoint(x, y)
      checkHits(x, y)
    } else {
      // Hover only — extend visibility briefly without spawning a trail.
      cursorRef.current.visible = true
      cursorRef.current.visibleUntil = performance.now() + 1200
    }
  }
  function onPointerUp() {
    draggingRef.current = false
  }

  // ─── trail decay ─────────────────────────────────────────────────────────
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

  const aliveCount = runtime.filter(t => t.state === 'alive').length
  const allSliced  = runtime.length > 0 && aliveCount === 0
  const showHint   = aliveCount === runtime.length && runtime.length > 0 && trail.length === 0

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
          background: 'radial-gradient(ellipse at 50% 30%, #2A0B0B 0%, #120505 70%, #050202 100%)',
          border: `1px solid #e74c3c44`,
          borderRadius: 16,
          overflow: 'hidden',
          touchAction: 'none',
          cursor: 'none',  // hidden — replaced by 3D machete
          userSelect: 'none',
        }}
      >
        {/* Soil grain backdrop */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `radial-gradient(${BRAND.pod}11 1px, transparent 1px)`,
          backgroundSize: '14px 14px',
          opacity: 0.4,
          pointerEvents: 'none',
        }} />

        {/* Trees */}
        {runtime.map(tr => {
          const bobY = tr.state === 'alive' ? 6 * Math.sin(now * 0.0036 + tr.bobPhase) : 0
          if (tr.state === 'alive') {
            return (
              <div key={tr.id} style={{
                position: 'absolute',
                left: `${tr.xPct}%`,
                top:  tr.y + bobY,
                transform: 'translate(-50%, -50%)',
                width: TILE_SIZE, height: TILE_SIZE,
                pointerEvents: 'none',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 2,
              }}>
                <div style={{
                  fontSize: 56, lineHeight: 1,
                  filter: 'drop-shadow(0 8px 14px #e74c3c66) grayscale(0.5)',
                  opacity: 0.85,
                }}>💀</div>
                <div style={{
                  fontFamily: FONTS.display, fontWeight: 800, fontSize: 9,
                  color: '#e74c3cdd', letterSpacing: '0.16em', textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}>{tr.guardianName}</div>
              </div>
            )
          }
          // Sliced — split in two halves perpendicular to the slice direction.
          const len = Math.max(1, Math.hypot(tr.sliceDx, tr.sliceDy))
          const nx = tr.sliceDx / len
          const ny = tr.sliceDy / len
          const px = -ny
          const py =  nx
          const elapsed = Math.min(now - tr.slicedAt, SLICE_ANIM)
          const progress = elapsed / SLICE_ANIM
          if (progress >= 1) return null
          const flingDist = 200 * progress
          const rot = 540 * progress
          const opacity = 1 - progress
          const halfStyle = (sign: number): React.CSSProperties => ({
            position: 'absolute',
            left: `${tr.xPct}%`,
            top:  tr.y,
            width: TILE_SIZE, height: TILE_SIZE,
            transform: `translate(calc(-50% + ${sign * flingDist * px}px), calc(-50% + ${sign * flingDist * py + progress * 240}px)) rotate(${sign * rot}deg)`,
            transition: 'none',
            pointerEvents: 'none',
            opacity,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 56, lineHeight: 1,
            filter: 'drop-shadow(0 8px 14px #e74c3c44)',
          })
          return (
            <div key={tr.id}>
              <div style={{ ...halfStyle(+1), clipPath: 'inset(0 50% 0 0)' }}>💀</div>
              <div style={{ ...halfStyle(-1), clipPath: 'inset(0 0 0 50%)' }}>💀</div>
              {[0, 1, 2, 3, 4].map(i => {
                const angle = (i / 5) * Math.PI * 2 + progress * Math.PI
                const r = 60 * progress
                return (
                  <span key={i} style={{
                    position: 'absolute',
                    left: `${tr.xPct}%`, top: tr.y,
                    transform: `translate(calc(-50% + ${Math.cos(angle) * r}px), calc(-50% + ${Math.sin(angle) * r}px))`,
                    width: 6, height: 6, borderRadius: 999,
                    background: BRAND.pod,
                    opacity: opacity * 0.9,
                    boxShadow: `0 0 12px ${BRAND.pod}`,
                    pointerEvents: 'none',
                  }} />
                )
              })}
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
            <linearGradient id="machete-glow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"  stopColor={BRAND.pod} stopOpacity="0" />
              <stop offset="50%" stopColor={BRAND.pod} stopOpacity="0.85" />
              <stop offset="100%" stopColor="#E8F1A8" stopOpacity="1" />
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
                stroke="url(#machete-glow)"
                strokeWidth={3 + 4 * op}
                strokeLinecap="round"
                opacity={op}
              />
            )
          })}
        </svg>

        {/* 3D machete cursor — shared overlay. No pointer events. */}
        <Machete3DCursor
          cursorRef={cursorRef}
          arenaWidth={arenaWidth}
          arenaHeight={ARENA_HEIGHT}
        />

        {/* Empty / done overlay */}
        {allSliced && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: 8,
            background: 'linear-gradient(180deg, transparent 0%, #02100B 70%)',
            pointerEvents: 'none',
          }}>
            <div style={{ fontSize: 44 }}>🌱</div>
            <div style={{
              fontFamily: FONTS.display, fontWeight: 800, fontSize: 14,
              color: BRAND.pod, letterSpacing: '0.16em', textTransform: 'uppercase',
            }}>
              {lang === 'es' ? 'Suelo regenerado' : 'Soil regenerated'}
            </div>
            <div style={{
              fontFamily: FONTS.serif, fontStyle: 'italic',
              color: `${BRAND.heirloom}88`, fontSize: 12,
            }}>
              {lang === 'es' ? 'listo para la próxima siembra' : 'ready for the next planting'}
            </div>
          </div>
        )}

        {/* Hint */}
        {showHint && (
          <div style={{
            position: 'absolute', bottom: 12, left: 0, right: 0,
            textAlign: 'center', pointerEvents: 'none',
            fontFamily: FONTS.serif, fontStyle: 'italic',
            color: `${BRAND.heirloom}55`, fontSize: 11, letterSpacing: '0.05em',
          }}>
            {lang === 'es' ? '⚔ Desliza el machete para cortar y regenerar' : '⚔ Swipe the machete to slice and regenerate'}
          </div>
        )}
      </div>
    </div>
  )
}

