import { useState, useRef, useCallback, useEffect } from 'react'
import { BRAND, FONTS } from '../../utils/constants'

// ── CSS keyframes ─────────────────────────────────────────────
const CSS = `
@keyframes mz-float { 0%,100%{transform:translateY(0) rotate(0deg)} 40%{transform:translateY(-10px) rotate(4deg)} 70%{transform:translateY(-5px) rotate(-2deg)} }
@keyframes mz-wobble { 0%,100%{transform:rotate(0deg) scale(1)} 25%{transform:rotate(-8deg) scale(1.08)} 75%{transform:rotate(8deg) scale(1.08)} }
@keyframes mz-split-l { from{transform:translate(0,0) rotate(0deg);opacity:1} to{transform:translate(-40px,30px) rotate(-35deg);opacity:0} }
@keyframes mz-split-r { from{transform:translate(0,0) rotate(0deg);opacity:1} to{transform:translate(40px,30px) rotate(35deg);opacity:0} }
@keyframes mz-baba-drop { 0%{transform:translateY(0) scale(1);opacity:1} 100%{transform:translateY(48px) scale(0.4);opacity:0} }
@keyframes mz-grain-fly { 0%{transform:translate(0,0) scale(1);opacity:1} 100%{transform:translate(var(--gx),var(--gy)) scale(0);opacity:0} }
@keyframes mz-slash { 0%{opacity:1;transform:scaleX(0) rotate(var(--angle))} 40%{opacity:.8;transform:scaleX(1) rotate(var(--angle))} 100%{opacity:0;transform:scaleX(1) rotate(var(--angle))} }
@keyframes mz-fill { from{height:var(--from)} to{height:var(--to)} }
@keyframes mz-reward-pop { 0%{transform:scale(0) translateY(0);opacity:1} 70%{transform:scale(1.2) translateY(-20px);opacity:1} 100%{transform:scale(1) translateY(-28px);opacity:0} }
@keyframes mz-can-shake { 0%,100%{transform:rotate(0deg)} 20%{transform:rotate(-4deg)} 50%{transform:rotate(5deg)} 80%{transform:rotate(-3deg)} }
@keyframes mz-lata-glow { 0%,100%{box-shadow:0 0 12px rgba(145,166,59,.3)} 50%{box-shadow:0 0 30px rgba(145,166,59,.7),0 0 60px rgba(145,166,59,.2)} }
`

function injectCSS() {
  if (document.getElementById('mz-css')) return
  const s = document.createElement('style'); s.id = 'mz-css'; s.textContent = CSS
  document.head.appendChild(s)
}

// ── Types ─────────────────────────────────────────────────────
interface Mazorca {
  id: number
  x: number   // percent 0–100
  y: number
  size: number
  phase: number  // animation delay offset
  cut: boolean
}

interface Particle {
  id: number
  type: 'baba' | 'grain'
  x: number
  y: number
  gx?: number
  gy?: number
}

interface Slash {
  id: number
  x1: number; y1: number
  x2: number; y2: number
}

// ── Helpers ───────────────────────────────────────────────────
function dist(ax: number, ay: number, bx: number, by: number) {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2)
}

function segmentPointDist(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax, dy = by - ay
  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) return dist(px, py, ax, ay)
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq))
  return dist(px, py, ax + t * dx, ay + t * dy)
}

// ── MazorcaSVG: simple cacao-pod shape ────────────────────────
function MazorcaSVG({ size, cut, half }: { size: number; cut: boolean; half?: 'L' | 'R' }) {
  const w = size, h = size * 1.5
  const colors = { skin: '#8B3A1A', ridge: '#5C1F00', pulp: '#F5E6C8', grain: '#4A2200' }

  if (!cut) {
    return (
      <svg width={w} height={h} viewBox="0 0 60 90" style={{ display: 'block', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,.5))' }}>
        {/* Pod body */}
        <ellipse cx="30" cy="45" rx="22" ry="38" fill={colors.skin} />
        {/* Ridges */}
        {[-10, -4, 0, 4, 10].map((dx, i) => (
          <path key={i} d={`M${30+dx} 8 Q${30+dx+3} 45 ${30+dx} 82`} fill="none" stroke={colors.ridge} strokeWidth="1.5" opacity=".6" />
        ))}
        {/* Tip */}
        <ellipse cx="30" cy="10" rx="6" ry="9" fill={colors.ridge} />
        <ellipse cx="30" cy="78" rx="8" ry="10" fill={colors.ridge} />
        {/* Stem */}
        <rect x="27" y="2" width="6" height="10" rx="3" fill="#2D5A10" />
        {/* Highlight */}
        <ellipse cx="22" cy="32" rx="5" ry="12" fill="white" opacity=".08" transform="rotate(-10 22 32)" />
      </svg>
    )
  }

  // Cut halves
  const clipId = `clip-${half}`
  return (
    <svg width={w} height={h} viewBox="0 0 60 90" style={{ display: 'block', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,.6))' }}>
      <defs>
        <clipPath id={clipId}>
          {half === 'L' ? <rect x="0" y="0" width="30" height="90" /> : <rect x="30" y="0" width="30" height="90" />}
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <ellipse cx="30" cy="45" rx="22" ry="38" fill={colors.skin} />
        {[-10, -4, 0, 4, 10].map((dx, i) => (
          <path key={i} d={`M${30+dx} 8 Q${30+dx+3} 45 ${30+dx} 82`} fill="none" stroke={colors.ridge} strokeWidth="1.5" opacity=".6" />
        ))}
        <ellipse cx="30" cy="10" rx="6" ry="9" fill={colors.ridge} />
        <ellipse cx="30" cy="78" rx="8" ry="10" fill={colors.ridge} />
        {/* Inner pulp exposed */}
        <ellipse cx="30" cy="45" rx="18" ry="32" fill={colors.pulp} opacity=".95" />
        {/* Grains inside */}
        {[20, 28, 36, 24, 32].map((cx, i) => (
          <ellipse key={i} cx={cx} cy={28 + i * 10} rx="4" ry="5" fill={colors.grain} opacity=".85" />
        ))}
        {/* Mucilage sheen */}
        <ellipse cx="30" cy="45" rx="18" ry="32" fill="white" opacity=".06" />
      </g>
      {/* Cut edge */}
      <line x1="30" y1="7" x2="30" y2="83" stroke="#F5E6C8" strokeWidth="2" opacity=".7" />
    </svg>
  )
}

// ── Main component ────────────────────────────────────────────
interface Props {
  onReward: (mucilage: number, granos: number) => void
}

const LATA_CAPACITY = 5  // cuts needed to fill the can
const MAZORCA_COUNT = 3

export default function MazorcaNinja({ onReward }: Props) {
  useEffect(() => { injectCSS() }, [])

  const [mazorcas, setMazorcas]     = useState<Mazorca[]>(() => makeMazorcas())
  const [particles, setParticles]   = useState<Particle[]>([])
  const [slashes, setSlashes]       = useState<Slash[]>([])
  const [lataFill, setLataFill]     = useState(0)       // 0–LATA_CAPACITY
  const [rewarded, setRewarded]     = useState(false)
  const [rewardAnim, setRewardAnim] = useState(false)
  const [totalCuts, setTotalCuts]   = useState(0)

  const arenaRef  = useRef<HTMLDivElement>(null)
  const pointerRef = useRef<{ active: boolean; x: number; y: number }>({ active: false, x: 0, y: 0 })
  const slashIdRef = useRef(0)
  const partIdRef  = useRef(0)

  function makeMazorcas(): Mazorca[] {
    return Array.from({ length: MAZORCA_COUNT }, (_, i) => ({
      id: Date.now() + i,
      x: 15 + i * 30,
      y: 20 + (i % 2) * 22,
      size: 52 + (i % 2) * 10,
      phase: i * 800,
      cut: false,
    }))
  }

  function respawnMazorca(id: number) {
    setTimeout(() => {
      setMazorcas(prev => prev.map(m => m.id === id
        ? { ...m, cut: false, x: 10 + Math.random() * 75, y: 10 + Math.random() * 55, id: Date.now() }
        : m
      ))
    }, 2200)
  }

  const getArenaPos = useCallback((clientX: number, clientY: number) => {
    if (!arenaRef.current) return { px: 0, py: 0 }
    const r = arenaRef.current.getBoundingClientRect()
    return { px: clientX - r.left, py: clientY - r.top }
  }, [])

  const checkSlice = useCallback((ax: number, ay: number, bx: number, by: number) => {
    if (!arenaRef.current) return
    const r = arenaRef.current.getBoundingClientRect()

    setMazorcas(prev => {
      let changed = false
      const next = prev.map(m => {
        if (m.cut) return m
        // Convert percent coords to pixels
        const mx = (m.x / 100) * r.width
        const my = (m.y / 100) * r.height
        const hitRadius = m.size * 0.6
        const d = segmentPointDist(mx, my, ax, ay, bx, by)
        if (d < hitRadius) {
          changed = true
          // Spawn particles
          const newParts: Particle[] = []
          // Baba drops
          for (let i = 0; i < 5; i++) {
            newParts.push({ id: partIdRef.current++, type: 'baba',
              x: mx + (Math.random() - .5) * 30, y: my + (Math.random() - .5) * 20 })
          }
          // Grain scatter
          for (let i = 0; i < 4; i++) {
            newParts.push({ id: partIdRef.current++, type: 'grain',
              x: mx, y: my,
              gx: (Math.random() - .5) * 80, gy: -(Math.random() * 60 + 20) })
          }
          setParticles(p => [...p, ...newParts])
          setTimeout(() => setParticles(p => p.filter(pt => !newParts.find(n => n.id === pt.id))), 900)
          respawnMazorca(m.id)

          // Fill the lata
          setLataFill(f => {
            const nf = Math.min(f + 1, LATA_CAPACITY)
            if (nf === LATA_CAPACITY && !rewarded) {
              setRewarded(true)
              setRewardAnim(true)
              onReward(3, 5)
              setTimeout(() => { setRewardAnim(false); setLataFill(0); setRewarded(false) }, 3000)
            }
            return nf
          })
          setTotalCuts(c => c + 1)
          return { ...m, cut: true }
        }
        return m
      })
      return changed ? next : prev
    })
  }, [onReward, rewarded])

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    const { px, py } = getArenaPos(e.clientX, e.clientY)
    pointerRef.current = { active: true, x: px, y: py }
  }, [getArenaPos])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!pointerRef.current.active) return
    const { px, py } = getArenaPos(e.clientX, e.clientY)
    const prev = pointerRef.current

    // Draw slash trail
    const sid = slashIdRef.current++
    setSlashes(s => [...s.slice(-4), { id: sid, x1: prev.x, y1: prev.y, x2: px, y2: py }])
    setTimeout(() => setSlashes(s => s.filter(sl => sl.id !== sid)), 300)

    // Check hit
    const dx = px - prev.x, dy = py - prev.y
    const spd = Math.sqrt(dx * dx + dy * dy)
    if (spd > 6) checkSlice(prev.x, prev.y, px, py)

    pointerRef.current = { ...pointerRef.current, x: px, y: py }
  }, [getArenaPos, checkSlice])

  const onPointerUp = useCallback(() => {
    pointerRef.current.active = false
  }, [])

  const fillPct = (lataFill / LATA_CAPACITY) * 100

  return (
    <div style={{ marginBottom: '1rem', userSelect: 'none' }}>
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontFamily: FONTS.body, fontSize: 10, color: `${BRAND.heirloom}66`,
          letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          🔪 Corta mazorcas · Recolecta mucílago
        </div>
        <div style={{ fontFamily: FONTS.display, fontSize: 11, fontWeight: 700, color: BRAND.mazorca }}>
          {totalCuts} cortes
        </div>
      </div>

      {/* Arena */}
      <div
        ref={arenaRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{
          position: 'relative', width: '100%', height: 200,
          background: `radial-gradient(ellipse at 50% 80%, ${BRAND.amazon}33 0%, ${BRAND.bgDeep} 70%)`,
          border: `1px dashed ${BRAND.amazon}55`, borderRadius: 14,
          overflow: 'hidden', cursor: 'crosshair', touchAction: 'none',
        }}
      >
        {/* Hint text when no cuts yet */}
        {totalCuts === 0 && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontFamily: FONTS.body, fontSize: 10, color: `${BRAND.heirloom}44`,
              letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'center' }}>
              Desliza rápido sobre las mazorcas
            </div>
            <div style={{ fontSize: 22, opacity: .3 }}>🔪</div>
          </div>
        )}

        {/* Slash trails */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          {slashes.map(sl => {
            const dx = sl.x2 - sl.x1, dy = sl.y2 - sl.y1
            const angle = Math.atan2(dy, dx) * 180 / Math.PI
            const len   = Math.sqrt(dx * dx + dy * dy)
            return (
              <line key={sl.id}
                x1={sl.x1} y1={sl.y1} x2={sl.x2} y2={sl.y2}
                stroke={`rgba(255,255,255,0.7)`} strokeWidth={len > 20 ? 3 : 1.5}
                strokeLinecap="round"
                style={{ animation: 'mz-slash .3s ease forwards', ['--angle' as string]: `${angle}deg` }}
              />
            )
          })}
        </svg>

        {/* Mazorcas */}
        {mazorcas.map(m => (
          <div key={m.id} style={{
            position: 'absolute',
            left: `${m.x}%`, top: `${m.y}%`,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
          }}>
            {!m.cut ? (
              <div style={{ animation: `mz-float 2.8s ease-in-out ${m.phase}ms infinite` }}>
                <MazorcaSVG size={m.size} cut={false} />
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', right: '50%', animation: 'mz-split-l .6s ease forwards' }}>
                  <MazorcaSVG size={m.size} cut half="L" />
                </div>
                <div style={{ position: 'absolute', left: '50%', animation: 'mz-split-r .6s ease forwards' }}>
                  <MazorcaSVG size={m.size} cut half="R" />
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Particles */}
        {particles.map(p => (
          <div key={p.id} style={{
            position: 'absolute', left: p.x, top: p.y,
            pointerEvents: 'none', fontSize: p.type === 'grain' ? 12 : 9,
            animation: p.type === 'baba' ? 'mz-baba-drop .8s ease forwards' : 'mz-grain-fly .7s ease forwards',
            ['--gx' as string]: `${p.gx ?? 0}px`,
            ['--gy' as string]: `${p.gy ?? 0}px`,
          }}>
            {p.type === 'baba' ? '💧' : '🫘'}
          </div>
        ))}

        {/* Reward popup */}
        {rewardAnim && (
          <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)',
            textAlign: 'center', pointerEvents: 'none',
            animation: 'mz-reward-pop 2s ease forwards' }}>
            <div style={{ fontSize: 32 }}>🫙✨</div>
            <div style={{ fontFamily: FONTS.display, fontSize: 13, fontWeight: 900,
              color: BRAND.pod, letterSpacing: '0.06em', textShadow: `0 0 16px ${BRAND.pod}` }}>
              ¡LATA LLENA!
            </div>
            <div style={{ fontFamily: FONTS.body, fontSize: 10, color: `${BRAND.heirloom}bb` }}>
              +3 Mucílago · +5 Granos
            </div>
          </div>
        )}
      </div>

      {/* CAUA Lata + fill */}
      <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Lata icon */}
        <div style={{
          width: 44, height: 44, borderRadius: 8, flexShrink: 0,
          background: `linear-gradient(135deg, ${BRAND.amazon}44, ${BRAND.pod}22)`,
          border: `1.5px solid ${BRAND.pod}${lataFill > 0 ? '88' : '33'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, transition: 'border-color .3s',
          animation: rewardAnim ? 'mz-can-shake .5s ease, mz-lata-glow 1.5s ease infinite' : (lataFill > 0 ? 'mz-lata-glow 2.5s ease-in-out infinite' : 'none'),
        }}>
          🫙
        </div>

        {/* Fill bar */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontFamily: FONTS.body, fontSize: 9, color: `${BRAND.heirloom}55`,
              letterSpacing: '0.12em', textTransform: 'uppercase' }}>Lata CAUA — Mucílago</span>
            <span style={{ fontFamily: FONTS.display, fontSize: 11, fontWeight: 700,
              color: fillPct >= 100 ? BRAND.pod : BRAND.mazorca }}>
              {lataFill}/{LATA_CAPACITY}
            </span>
          </div>
          <div style={{ height: 8, borderRadius: 999, background: `${BRAND.amazon}33`,
            overflow: 'hidden', border: `1px solid ${BRAND.amazon}44` }}>
            <div style={{
              height: '100%', borderRadius: 999,
              width: `${fillPct}%`,
              background: `linear-gradient(90deg, ${BRAND.pod} 0%, ${BRAND.mazorca} 100%)`,
              transition: 'width .4s cubic-bezier(.16,1,.3,1)',
              boxShadow: fillPct > 0 ? `0 0 8px ${BRAND.pod}66` : 'none',
            }} />
          </div>
          <div style={{ fontFamily: FONTS.body, fontSize: 9, color: `${BRAND.heirloom}33`,
            marginTop: 4, letterSpacing: '0.08em' }}>
            {fillPct >= 100 ? '🎉 ¡Melaza Orgánica desbloqueada!' : `${LATA_CAPACITY - lataFill} cortes para llenar la lata`}
          </div>
        </div>
      </div>
    </div>
  )
}
