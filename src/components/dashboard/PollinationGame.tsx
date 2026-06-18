/**
 * PollinationGame — Floración mini-game.
 *
 * Mechanic:
 *   8 flowers appear sequentially (2 at a time) on the cacao tree frame.
 *   Each flower has a 5-second window. Tap/click to pollinate — a small
 *   bee animation plays and the flower turns into a baby pod.
 *   Score determines next harvest multiplier bonus.
 *
 *   ≥6/8 → EXCELENTE  → +50% mazorca bonus
 *   4-5/8 → BUENO     → +25% mazorca bonus
 *   <4/8  → REGULAR   → no bonus
 *
 * Visual: pixel-art flowers (CSS), countdown ring, bee particle on tap.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import type { CSSProperties } from 'react'
import { FONTS } from '../../utils/constants'

const TOTAL_FLOWERS  = 8
const WINDOW_MS      = 5000   // ms each flower stays alive
const PAIR_INTERVAL  = 3200   // ms between pairs appearing
const TICK_MS        = 50     // timer resolution

export interface PollinationResult {
  pollinated: number
  total:      number
  grade:      'excelente' | 'bueno' | 'regular'
  bonusMult:  number
}

interface FlowerState {
  id:        number
  x:         number   // % from left
  y:         number   // % from top
  born:      number   // Date.now() when spawned
  alive:     boolean
  hit:       boolean  // tapped
  wilted:    boolean
}

// Fixed positions that roughly map to where branches/trunk of the cacao tree are
const FLOWER_POSITIONS: Array<{ x: number; y: number }> = [
  { x: 38, y: 68 }, // low trunk left
  { x: 55, y: 60 }, // low trunk right
  { x: 25, y: 50 }, // mid-left branch
  { x: 65, y: 48 }, // mid-right branch
  { x: 32, y: 35 }, // upper-left
  { x: 60, y: 32 }, // upper-right
  { x: 45, y: 22 }, // near crown
  { x: 50, y: 75 }, // base trunk
]

interface Props {
  onComplete: (result: PollinationResult) => void
  lang?: 'es' | 'en'
}

export default function PollinationGame({ onComplete, lang = 'es' }: Props) {
  const es = lang === 'es'

  const [flowers, setFlowers]       = useState<FlowerState[]>([])
  const [score, setScore]           = useState(0)
  const [phase, setPhase]           = useState<'intro' | 'playing' | 'result'>('intro')
  const [bees, setBees]             = useState<Array<{ id: number; x: number; y: number }>>([])
  const [timeLeft, setTimeLeft]     = useState(TOTAL_FLOWERS * PAIR_INTERVAL / 1000 + 5)

  const spawnedRef = useRef(0)
  const scoreRef   = useRef(0)
  const timerRef   = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const spawnTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const beeId      = useRef(0)

  const spawnNextPair = useCallback(() => {
    const spawnIdx = spawnedRef.current
    if (spawnIdx >= TOTAL_FLOWERS) return

    const pair = [spawnIdx, spawnIdx + 1].filter(i => i < TOTAL_FLOWERS)
    setFlowers(prev => [
      ...prev,
      ...pair.map(i => ({
        id: i, x: FLOWER_POSITIONS[i].x, y: FLOWER_POSITIONS[i].y,
        born: Date.now(), alive: true, hit: false, wilted: false,
      })),
    ])
    spawnedRef.current = spawnIdx + 2

    // Wilt timer for each flower in pair
    pair.forEach(i => {
      setTimeout(() => {
        setFlowers(prev => prev.map(f =>
          f.id === i && !f.hit ? { ...f, alive: false, wilted: true } : f,
        ))
      }, WINDOW_MS)
    })

    // Schedule next pair
    if (spawnIdx + 2 < TOTAL_FLOWERS) {
      spawnTimer.current = setTimeout(spawnNextPair, PAIR_INTERVAL)
    } else {
      // All spawned — end game after last window
      spawnTimer.current = setTimeout(() => setPhase('result'), WINDOW_MS + 500)
    }
  }, [])

  // Start game
  function startGame() {
    setPhase('playing')
    setFlowers([])
    setScore(0)
    scoreRef.current = 0
    spawnedRef.current = 0

    // Countdown timer
    const start = Date.now()
    const totalTime = TOTAL_FLOWERS * PAIR_INTERVAL / 2 + WINDOW_MS + 1000
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - start
      const remaining = Math.max(0, (totalTime - elapsed) / 1000)
      setTimeLeft(remaining)
    }, TICK_MS)

    setTimeout(spawnNextPair, 400)
  }

  // Cleanup
  useEffect(() => {
    return () => {
      clearInterval(timerRef.current)
      clearTimeout(spawnTimer.current)
    }
  }, [])

  // Flower tap
  function handleTap(id: number, x: number, y: number) {
    setFlowers(prev => prev.map(f =>
      f.id === id && f.alive && !f.hit ? { ...f, hit: true, alive: false } : f,
    ))
    setScore(s => s + 1)
    scoreRef.current += 1

    // Bee animation
    const bid = beeId.current++
    setBees(prev => [...prev, { id: bid, x, y }])
    setTimeout(() => setBees(prev => prev.filter(b => b.id !== bid)), 900)
  }

  // Phase: result
  useEffect(() => {
    if (phase !== 'result') return
    clearInterval(timerRef.current)

    const pollinated = scoreRef.current
    let grade: PollinationResult['grade'] = 'regular'
    let bonusMult = 1.0
    if (pollinated >= 6) { grade = 'excelente'; bonusMult = 1.5 }
    else if (pollinated >= 4) { grade = 'bueno'; bonusMult = 1.25 }

    setTimeout(() => onComplete({ pollinated, total: TOTAL_FLOWERS, grade, bonusMult }), 2200)
  }, [phase, onComplete])

  // ── Render: intro ──
  if (phase === 'intro') {
    return (
      <div style={overlayStyle}>
        <div style={panelStyle('#D060C0')}>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: '#D060C0', letterSpacing: '0.2em', marginBottom: 10 }}>
            🌸 {es ? 'TEMPORADA · FLORACIÓN' : 'SEASON · FLOWERING'}
          </div>
          <h2 style={{ fontFamily: "'Barlow Condensed', Impact, sans-serif", fontWeight: 900, fontSize: 'clamp(28px,5vw,36px)', color: '#F7F1EE', textTransform: 'uppercase', margin: '0 0 12px', lineHeight: 1 }}>
            {es ? 'Poliniza el\nCacao' : 'Pollinate\nthe Cacao'}
          </h2>
          <p style={{ fontFamily: FONTS.body, fontSize: 12, color: '#F7F1EE88', lineHeight: 1.6, margin: '0 0 20px' }}>
            {es
              ? '8 flores brotan del tronco. Toca cada flor antes de que se marchite. ≥6 flores = +50% próxima cosecha.'
              : '8 flowers bloom from the trunk. Tap each flower before it wilts. ≥6 flowers = +50% next harvest.'}
          </p>
          <div style={{ display: 'flex', gap: 10, marginBottom: 18, justifyContent: 'center' }}>
            {(['≥6 🌸', '→', '+50%'].map((t, i) => (
              <div key={i} style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: i === 2 ? '#91A63B' : '#D060C088', letterSpacing: '0.1em' }}>{t}</div>
            )))}
          </div>
          <button onClick={startGame} style={startBtnStyle}>
            {es ? '🌸 INICIAR POLINIZACIÓN →' : '🌸 START POLLINATION →'}
          </button>
        </div>
      </div>
    )
  }

  // ── Render: result ──
  if (phase === 'result') {
    const grade = score >= 6 ? 'excelente' : score >= 4 ? 'bueno' : 'regular'
    const bonusMult = score >= 6 ? 1.5 : score >= 4 ? 1.25 : 1.0
    const gradeEmoji = grade === 'excelente' ? '🏆' : grade === 'bueno' ? '🌿' : '🌱'
    const gradeColor = grade === 'excelente' ? '#91A63B' : grade === 'bueno' ? '#D060C0' : '#F7F1EE88'

    return (
      <div style={overlayStyle}>
        <div style={panelStyle('#D060C0')}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{gradeEmoji}</div>
            <div style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 9, color: gradeColor,
              letterSpacing: '0.14em', marginBottom: 12,
              textTransform: 'uppercase',
            }}>
              {grade}
            </div>
            <div style={{ fontFamily: "'Barlow Condensed', Impact, sans-serif", fontWeight: 900, fontSize: 'clamp(32px,7vw,48px)', color: '#F7F1EE', margin: '0 0 6px' }}>
              {score}/{TOTAL_FLOWERS}
            </div>
            <div style={{ fontFamily: FONTS.body, fontSize: 11, color: '#F7F1EE66', marginBottom: 18 }}>
              {es ? 'flores polinizadas' : 'flowers pollinated'}
            </div>

            {/* Bonus chip */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: `${gradeColor}22`, border: `1px solid ${gradeColor}55`,
              borderRadius: 6, padding: '8px 16px', marginBottom: 18,
            }}>
              <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: gradeColor, letterSpacing: '0.1em' }}>
                +{Math.round((bonusMult - 1) * 100)}% {es ? 'próxima cosecha' : 'next harvest'}
              </span>
            </div>

            <div style={{ fontFamily: FONTS.body, fontSize: 11, color: '#F7F1EE44' }}>
              {es ? 'Aplicando bonus...' : 'Applying bonus...'}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Render: playing ──
  return (
    <div style={overlayStyle}>
      <div style={{ ...panelStyle('#D060C0'), padding: 0, overflow: 'hidden' }}>
        {/* Header bar */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '10px 14px',
          background: '#D060C012',
          borderBottom: '1px solid #D060C033',
        }}>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: '#D060C0', letterSpacing: '0.12em' }}>
            🌸 {es ? 'POLINIZACIÓN' : 'POLLINATION'}
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: '#91A63B' }}>
              {score}/{TOTAL_FLOWERS}
            </div>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: '#F7F1EE88' }}>
              {Math.ceil(timeLeft)}s
            </div>
          </div>
        </div>

        {/* Game arena — tree silhouette + flowers */}
        <div style={{
          position: 'relative',
          width: '100%', height: 300,
          background: 'radial-gradient(ellipse at 50% 85%, #1A3A22 0%, #040C06 65%)',
          backgroundImage: `
            radial-gradient(ellipse at 50% 85%, #1A3A22 0%, #040C06 65%),
            repeating-linear-gradient(0deg, transparent, transparent 3px, #00000011 3px, #00000011 4px),
            repeating-linear-gradient(90deg, transparent, transparent 3px, #00000011 3px, #00000011 4px)
          `,
          overflow: 'hidden',
          cursor: 'default',
        }}>
          {/* Tree silhouette hint */}
          <div style={{
            position: 'absolute', bottom: 0, left: '50%',
            transform: 'translateX(-50%)',
            width: 4, height: '60%',
            background: '#4A2010cc',
          }} />

          {/* Flowers */}
          {flowers.map(f => (
            <FlowerSprite
              key={f.id}
              flower={f}
              windowMs={WINDOW_MS}
              onTap={() => handleTap(f.id, f.x, f.y)}
            />
          ))}

          {/* Bee animations */}
          {bees.map(b => (
            <div
              key={b.id}
              style={{
                position: 'absolute',
                left: `${b.x}%`, top: `${b.y}%`,
                fontSize: 20,
                animation: 'bee-fly 0.9s ease-out forwards',
                pointerEvents: 'none',
                zIndex: 10,
              }}
            >
              🐝
            </div>
          ))}

          {/* Instruction overlay (first 2 seconds) */}
          <div style={{
            position: 'absolute', bottom: 12, left: 0, right: 0,
            textAlign: 'center',
            fontFamily: FONTS.display, fontSize: 10, fontWeight: 700,
            color: '#F7F1EE44', letterSpacing: '0.1em', textTransform: 'uppercase',
            pointerEvents: 'none',
          }}>
            {es ? 'Toca las flores' : 'Tap the flowers'}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ padding: '8px 14px' }}>
          <div style={{ height: 4, background: '#F7F1EE12', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${(score / TOTAL_FLOWERS) * 100}%`,
              background: 'linear-gradient(90deg, #D060C0, #91A63B)',
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bee-fly {
          0%   { transform: translate(0, 0) scale(1); opacity: 1; }
          60%  { transform: translate(${Math.random() > 0.5 ? 30 : -30}px, -50px) scale(1.2); }
          100% { transform: translate(0, -80px) scale(0.8); opacity: 0; }
        }
        @keyframes flower-pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50%       { transform: translate(-50%, -50%) scale(1.08); }
        }
        @keyframes flower-wilt {
          0%   { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(0.6) rotate(-30deg); opacity: 0.2; }
        }
        @keyframes flower-hit {
          0%   { transform: translate(-50%, -50%) scale(1); }
          30%  { transform: translate(-50%, -50%) scale(1.4); }
          100% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

// ─── FlowerSprite ─────────────────────────────────────────────────────────────

function FlowerSprite({
  flower, windowMs, onTap,
}: {
  flower: FlowerState
  windowMs: number
  onTap: () => void
}) {
  const elapsed = Date.now() - flower.born
  const lifeRatio = Math.max(0, 1 - elapsed / windowMs)
  const ringColor = lifeRatio > 0.5 ? '#D060C0' : lifeRatio > 0.25 ? '#E08820' : '#E74C3C'

  const animName = flower.hit ? 'flower-hit' : flower.wilted ? 'flower-wilt' : 'flower-pulse'

  return (
    <div
      onClick={!flower.hit && !flower.wilted ? onTap : undefined}
      style={{
        position: 'absolute',
        left: `${flower.x}%`,
        top:  `${flower.y}%`,
        transform: 'translate(-50%, -50%)',
        cursor: flower.alive ? 'pointer' : 'default',
        zIndex: 5,
        animation: `${animName} ${flower.hit ? '0.4s' : flower.wilted ? '0.6s' : '2s ease-in-out infinite'}`,
        animationFillMode: 'forwards',
      }}
    >
      {/* Countdown ring (SVG) */}
      {!flower.hit && !flower.wilted && (
        <svg
          width={52} height={52}
          style={{ position: 'absolute', top: -26, left: -26, pointerEvents: 'none' }}
        >
          <circle cx={26} cy={26} r={22}
            fill="none" stroke="#F7F1EE11" strokeWidth={3} />
          <circle cx={26} cy={26} r={22}
            fill="none" stroke={ringColor} strokeWidth={3}
            strokeDasharray={`${2 * Math.PI * 22}`}
            strokeDashoffset={`${2 * Math.PI * 22 * (1 - lifeRatio)}`}
            strokeLinecap="round"
            transform="rotate(-90 26 26)"
            style={{ transition: `stroke ${0.3}s` }}
          />
        </svg>
      )}

      {/* Flower pixel art (CSS emoji + box) */}
      <div style={{
        width: 36, height: 36,
        background: flower.hit
          ? '#91A63B22'
          : flower.wilted
          ? '#F7F1EE08'
          : '#D060C022',
        border: `2px solid ${flower.hit ? '#91A63B' : flower.wilted ? '#F7F1EE22' : '#D060C088'}`,
        borderRadius: 4,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20,
        boxShadow: !flower.hit && !flower.wilted ? `0 0 12px #D060C066` : 'none',
      }}>
        {flower.hit ? '🫘' : flower.wilted ? '🥀' : '🌸'}
      </div>
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 300,
  background: 'rgba(4, 12, 6, 0.92)',
  backdropFilter: 'blur(8px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 'clamp(16px, 4vw, 32px)',
}

const panelStyle = (accent: string): CSSProperties => ({
  background: `linear-gradient(160deg, #0D2214, #040C06)`,
  border: `1px solid ${accent}55`,
  borderRadius: 14,
  padding: 'clamp(20px, 4vw, 28px)',
  width: '100%',
  maxWidth: 420,
  boxShadow: `0 0 60px ${accent}22, inset 0 1px 0 ${accent}22`,
})

const startBtnStyle: CSSProperties = {
  width: '100%',
  padding: '14px 20px',
  background: 'linear-gradient(135deg, #D060C0, #8D2679)',
  border: 'none', borderRadius: 8,
  cursor: 'pointer',
  fontFamily: "'Press Start 2P', monospace",
  fontSize: 7, color: '#F7F1EE',
  letterSpacing: '0.12em',
  boxShadow: '0 0 24px #D060C066',
}
