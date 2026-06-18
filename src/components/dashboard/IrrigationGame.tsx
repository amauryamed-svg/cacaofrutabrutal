/**
 * IrrigationGame — Traviesa (Dry Season) mini-game.
 *
 * Mechanic: tap pipe segments to rotate them 90° and connect
 * the water source (top) to the tree roots (bottom).
 * 4×4 grid of pipe tiles. 45-second timer.
 *
 * Pipe types: ─ │ ┐ ┘ └ ┌ (straight + corners)
 * Solved = water flows from source to root without breaks.
 *
 * Reward: moisture bonus duration ×2 if solved, ×1.2 if partial.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import type { CSSProperties } from 'react'
import { FONTS } from '../../utils/constants'

// Pipe connection map: which exits does each rotation state have?
// Exits: 0=north 1=east 2=south 3=west
type PipeType = 'straight_h' | 'straight_v' | 'corner_ne' | 'corner_se' | 'corner_sw' | 'corner_nw' | 'empty'

const PIPE_EXITS: Record<PipeType, number[]> = {
  straight_h: [1, 3],      // east, west
  straight_v: [0, 2],      // north, south
  corner_ne:  [0, 1],      // north, east
  corner_se:  [1, 2],      // east, south
  corner_sw:  [2, 3],      // south, west
  corner_nw:  [0, 3],      // north, west
  empty:      [],
}

// Visual glyph for each pipe type
const PIPE_GLYPH: Record<PipeType, string> = {
  straight_h: '─', straight_v: '│',
  corner_ne: '└', corner_se: '┌',
  corner_sw: '┐', corner_nw: '┘',
  empty: ' ',
}

// Rotation cycle for each pipe type
const PIPE_ROTATE: Record<PipeType, PipeType> = {
  straight_h: 'straight_v',
  straight_v: 'straight_h',
  corner_ne:  'corner_se',
  corner_se:  'corner_sw',
  corner_sw:  'corner_nw',
  corner_nw:  'corner_ne',
  empty:      'empty',
}

const GRID_SIZE = 4

// Scramble: rotate certain tiles to make it unsolved (solved path is straight_v → corner_se → corner_sw → straight_v → corner_ne → corner_nw)
const SCRAMBLED_GRID: PipeType[][] = [
  ['empty',      'corner_nw',  'empty',      'empty'],   // [0][1] wrong rotation
  ['empty',      'corner_ne',  'corner_se',  'empty'],   // [1][1] and [1][2] wrong
  ['empty',      'empty',      'straight_h', 'empty'],   // [2][2] wrong
  ['empty',      'corner_sw',  'corner_se',  'empty'],   // [3][1] and [3][2] wrong
]

const TIMER_SECONDS = 45

export interface IrrigationResult {
  solved:     boolean
  timeLeft:   number
  bonusMult:  number
}

interface Props {
  onComplete: (result: IrrigationResult) => void
  lang?: 'es' | 'en'
}

export default function IrrigationGame({ onComplete, lang = 'es' }: Props) {
  const es = lang === 'es'

  const [grid,  setGrid]   = useState<PipeType[][]>(() => SCRAMBLED_GRID.map(row => [...row]))
  const [phase, setPhase]  = useState<'intro' | 'playing' | 'result'>('intro')
  const [timer, setTimer]  = useState(TIMER_SECONDS)
  const [flow,  setFlow]   = useState<Set<string>>(new Set())

  const timerRef  = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const solvedRef = useRef(false)

  // Check if pipe grid forms a connected path from source [0][1] → root [3][2]
  const checkFlow = useCallback((g: PipeType[][]): Set<string> => {
    // BFS from source
    const visited = new Set<string>()
    const queue: Array<[number, number, number]> = [[0, 1, 2]]  // row, col, came-from-exit (south=2)

    const OPP = [2, 3, 0, 1]  // opposite of north=south, east=west, etc.

    while (queue.length > 0) {
      const [r, c, fromDir] = queue.shift()!
      const key = `${r},${c}`
      if (visited.has(key)) continue
      const pipe = g[r]?.[c]
      if (!pipe || pipe === 'empty') continue
      const exits = PIPE_EXITS[pipe]
      // Check if this pipe has the entrance from the direction we came
      if (fromDir !== -1 && !exits.includes(OPP[fromDir])) continue
      visited.add(key)

      // Explore all exits
      for (const exit of exits) {
        if (exit === OPP[fromDir]) continue  // don't go back
        const dr = [-1, 0, 1, 0][exit]
        const dc = [0, 1, 0, -1][exit]
        const nr = r + dr; const nc = c + dc
        if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
          queue.push([nr, nc, exit])
        }
      }
    }
    return visited
  }, [])

  // Rotate tile on tap
  function rotateTile(r: number, c: number) {
    if (solvedRef.current) return
    setGrid(prev => {
      const next = prev.map(row => [...row])
      next[r][c] = PIPE_ROTATE[next[r][c]]
      const f = checkFlow(next)
      setFlow(f)
      const isSolved = f.has('0,1') && f.has('3,1')
      if (isSolved) {
        solvedRef.current = true
        clearInterval(timerRef.current)
        setTimeout(() => setPhase('result'), 1000)
      }
      return next
    })
  }

  function startGame() {
    setPhase('playing')
    timerRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          setPhase('result')
          return 0
        }
        return t - 1
      })
    }, 1000)
    // Initial flow check
    setFlow(checkFlow(SCRAMBLED_GRID.map(r => [...r])))
  }

  useEffect(() => () => clearInterval(timerRef.current), [])

  // Result
  useEffect(() => {
    if (phase !== 'result') return
    const bonusMult = solvedRef.current ? 2.0 : timer > 15 ? 1.5 : 1.2
    setTimeout(() => onComplete({ solved: solvedRef.current, timeLeft: timer, bonusMult }), 1800)
  }, [phase, timer, onComplete])

  // ── Intro ──
  if (phase === 'intro') {
    return (
      <div style={overlayStyle}>
        <div style={panelStyle('#E08820')}>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: '#E08820', letterSpacing: '0.18em', marginBottom: 10 }}>
            ☀️ {es ? 'TRAVIESA · SEQUÍA' : 'DRY SEASON'}
          </div>
          <h2 style={{ fontFamily: "'Barlow Condensed', Impact, sans-serif", fontWeight: 900, fontSize: 'clamp(28px,5vw,36px)', color: '#F7F1EE', textTransform: 'uppercase', margin: '0 0 12px', lineHeight: 1 }}>
            {es ? 'Conecta el\nRiego' : 'Connect\nthe Water'}
          </h2>
          <p style={{ fontFamily: FONTS.body, fontSize: 12, color: '#F7F1EE88', lineHeight: 1.6, margin: '0 0 20px' }}>
            {es
              ? 'Gira los tubos para conectar la fuente de agua con las raíces del árbol. 45 segundos.'
              : 'Rotate the pipes to connect the water source to the tree roots. 45 seconds.'}
          </p>
          <button onClick={startGame} style={{ ...startBtnStyle, background: 'linear-gradient(135deg, #E08820, #C06010)' }}>
            {es ? '💧 INICIAR RIEGO →' : '💧 START IRRIGATION →'}
          </button>
        </div>
      </div>
    )
  }

  // ── Result ──
  if (phase === 'result') {
    const bonusMult = solvedRef.current ? 2.0 : 1.2
    return (
      <div style={overlayStyle}>
        <div style={panelStyle('#E08820')}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{solvedRef.current ? '💧' : '🌵'}</div>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: solvedRef.current ? '#91A63B' : '#E08820', letterSpacing: '0.14em', marginBottom: 14, textTransform: 'uppercase' }}>
              {solvedRef.current ? (es ? '¡Regado!' : 'Irrigated!') : (es ? 'Sin agua' : 'Dry run')}
            </div>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: '#F7F1EE88', marginBottom: 18 }}>
              {es ? `Humedad ×${bonusMult} por +2h` : `Moisture ×${bonusMult} for +2h`}
            </div>
            <div style={{ fontFamily: FONTS.body, fontSize: 11, color: '#F7F1EE44' }}>
              {es ? 'Aplicando...' : 'Applying...'}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Playing ──
  return (
    <div style={overlayStyle}>
      <div style={{ ...panelStyle('#E08820'), padding: 0, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#E0882012', borderBottom: '1px solid #E0882033' }}>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: '#E08820', letterSpacing: '0.12em' }}>
            💧 {es ? 'RIEGO' : 'IRRIGATION'}
          </div>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: timer < 10 ? '#E74C3C' : '#F7F1EE88' }}>
            {timer}s
          </div>
        </div>

        {/* Source indicator */}
        <div style={{ textAlign: 'center', padding: '8px 0 4px', fontFamily: FONTS.display, fontSize: 10, fontWeight: 700, color: '#00A3CD88', letterSpacing: '0.12em' }}>
          💧 {es ? 'FUENTE' : 'SOURCE'}
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`, gap: 2, padding: '0 14px' }}>
          {grid.map((row, r) =>
            row.map((pipe, c) => {
              const key = `${r},${c}`
              const inFlow = flow.has(key)
              return (
                <button
                  key={key}
                  onClick={() => rotateTile(r, c)}
                  disabled={pipe === 'empty'}
                  style={{
                    aspectRatio: '1/1',
                    background: inFlow ? '#00A3CD22' : pipe === 'empty' ? '#040C06' : '#132B1C',
                    border: `2px solid ${inFlow ? '#00A3CD' : pipe === 'empty' ? '#132B1C66' : '#1C3B2666'}`,
                    borderRadius: 4,
                    cursor: pipe === 'empty' ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'monospace',
                    fontSize: 'clamp(18px, 4vw, 24px)',
                    color: inFlow ? '#00A3CD' : '#91A63B88',
                    transition: 'all 0.15s',
                    boxShadow: inFlow ? `0 0 8px #00A3CD66` : 'none',
                  }}
                >
                  {PIPE_GLYPH[pipe]}
                </button>
              )
            })
          )}
        </div>

        {/* Root indicator */}
        <div style={{ textAlign: 'center', padding: '4px 0 10px', fontFamily: FONTS.display, fontSize: 10, fontWeight: 700, color: '#91A63B88', letterSpacing: '0.12em' }}>
          🌱 {es ? 'RAÍCES' : 'ROOTS'}
        </div>

        {/* Timer bar */}
        <div style={{ padding: '0 14px 12px' }}>
          <div style={{ height: 4, background: '#F7F1EE12', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${(timer / TIMER_SECONDS) * 100}%`,
              background: `linear-gradient(90deg, #E08820, #00A3CD)`,
              transition: 'width 1s linear',
            }} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const overlayStyle: CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 300,
  background: 'rgba(4, 12, 6, 0.92)', backdropFilter: 'blur(8px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: 'clamp(16px, 4vw, 32px)',
}

const panelStyle = (accent: string): CSSProperties => ({
  background: `linear-gradient(160deg, #0D2214, #040C06)`,
  border: `1px solid ${accent}55`,
  borderRadius: 14,
  padding: 'clamp(20px, 4vw, 28px)',
  width: '100%', maxWidth: 420,
  boxShadow: `0 0 60px ${accent}22, inset 0 1px 0 ${accent}22`,
})

const startBtnStyle: CSSProperties = {
  width: '100%', padding: '14px 20px',
  border: 'none', borderRadius: 8, cursor: 'pointer',
  fontFamily: "'Press Start 2P', monospace",
  fontSize: 7, color: '#F7F1EE', letterSpacing: '0.12em',
  boxShadow: '0 0 24px #E0882066',
}
