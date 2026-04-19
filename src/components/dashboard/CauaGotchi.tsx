import { motion } from 'framer-motion'
import { BRAND, FONTS } from '../../utils/constants'
import { PLANT_PROBLEMS } from '../../utils/growthSystem'

interface CauaGotchiProps {
  health: number
  moisture: number
  sunlight: number
  stageText: string
  treeName: string
  stageEmoji?: string
  stageId?: number
  problem?: string | null
}

const STAGE_PIXELS: Record<number, string[]> = {
  0: ['        ', '   🌰   ', '  ░░░░  ', ' ░░░░░░ '],
  1: ['   🌱   ', '   ┃    ', '  ≈≈≈≈  ', ' ░░░░░░ '],
  2: [' 🍃🌿🍃 ', '   ┃    ', '  ≈≈≈≈  ', ' ░░░░░░ '],
  3: [' 🌿🌾🌿 ', ' 🌾 🌾  ', '  ┃┃    ', ' ░░░░░░ '],
  4: ['🌳🌳🌳  ', '🌳🌳🌳  ', '  ┃┃┃   ', ' ░░░░░░ '],
  5: ['🌸🌳🌸  ', '🌳🌸🌳  ', '  ┃┃┃   ', ' ░░░░░░ '],
  6: ['🌳🫘🌳  ', '🫘🌳🫘  ', '  ┃┃┃   ', ' ░░░░░░ '],
  7: ['🌟🍫🌟  ', '🫘🌳🫘  ', ' ✨ ✨   ', ' ░░░░░░ '],
}

export default function CauaGotchi({
  health, moisture, sunlight, stageText, treeName,
  stageEmoji = '🌱', stageId = 0, problem = null,
}: CauaGotchiProps) {

  const renderRetroBar = (value: number, color: string, label: string) => {
    const blocks = Math.floor(value / 10)
    const isLow = value < 30
    return (
      <div style={{ marginBottom: 10 }}>
        <div style={{ marginBottom: 3, fontWeight: 'bold', fontSize: 11, display: 'flex', justifyContent: 'space-between' }}>
          <span>{label}</span>
          <span style={{ color: isLow ? '#e74c3c' : color }}>{value}%{isLow ? ' ⚠' : ''}</span>
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          {[...Array(10)].map((_, i) => (
            <div key={i} style={{
              width: 12, height: 14,
              background: i < blocks ? color : '#1a1a1a',
              border: '1px solid #000',
              boxShadow: i < blocks ? `0 0 4px ${color}66` : 'none',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>
      </div>
    )
  }

  const pixels = STAGE_PIXELS[stageId] ?? STAGE_PIXELS[0]
  const prob = problem ? PLANT_PROBLEMS[problem] : null

  return (
    <div style={{
      background: '#040C06',
      border: `4px solid ${prob ? '#e74c3c' : BRAND.pod}`,
      borderRadius: 16, padding: 20, marginBottom: 24,
      fontFamily: "'Courier New', Courier, monospace",
      color: '#2ecc71',
      boxShadow: `0 0 20px ${prob ? '#e74c3c44' : BRAND.pod + '44'}, inset 0 0 40px #000`,
      position: 'relative', overflow: 'hidden',
      transition: 'border-color 0.5s',
    }}>
      {/* CRT Scanlines */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(rgba(18,16,16,0) 50%, rgba(0,0,0,0.25) 50%), linear-gradient(90deg, rgba(255,0,0,0.04), rgba(0,255,0,0.02), rgba(0,0,255,0.04))',
        backgroundSize: '100% 4px, 3px 100%',
        pointerEvents: 'none', zIndex: 10,
      }} />

      <div style={{ display: 'flex', flexDirection: 'row', gap: 20, flexWrap: 'wrap' }}>

        {/* Gameboy Screen */}
        <div style={{
          background: prob ? '#2a0a0a' : '#8da67f',
          border: '8px solid #333', borderRadius: 8,
          width: 200, height: 220,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          position: 'relative', flexShrink: 0,
          transition: 'background 0.5s',
        }}>
          {/* Problem overlay */}
          {prob && (
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
              style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                background: 'rgba(139,0,0,0.7)', borderRadius: 2,
                zIndex: 5,
              }}
            >
              <div style={{ fontSize: 48 }}>{prob.emoji}</div>
              <div style={{ fontSize: 11, color: '#ff6b6b', fontWeight: 'bold', textAlign: 'center', padding: '0 8px', marginTop: 4 }}>
                {prob.name.toUpperCase()}
              </div>
            </motion.div>
          )}

          {/* Pixel art sprite */}
          {!prob && (
            <motion.div
              animate={{ scale: [0.97, 1.04, 0.97] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              style={{
                fontFamily: 'monospace', fontSize: 22,
                lineHeight: 1.2, textAlign: 'center',
                imageRendering: 'pixelated',
                filter: 'drop-shadow(0 0 8px rgba(145,166,59,0.4))',
              }}
            >
              {pixels.map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </motion.div>
          )}

          {/* Screen bottom labels */}
          <div style={{
            position: 'absolute', bottom: 6, left: 6, right: 6,
            display: 'flex', justifyContent: 'space-between',
            color: prob ? '#ff4444' : '#1e3810', fontWeight: 900, fontSize: 10,
          }}>
            <span>LVL {stageId + 1}</span>
            <span>{treeName.toUpperCase().slice(0, 10)}</span>
          </div>

          {/* Stage emoji corner */}
          <div style={{
            position: 'absolute', top: 6, right: 6,
            fontSize: 14,
          }}>
            {stageEmoji}
          </div>
        </div>

        {/* Stats Panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 0, zIndex: 2, minWidth: 140 }}>
          <h2 style={{
            fontFamily: FONTS.display, fontWeight: 900, fontSize: 24,
            margin: '0 0 4px', color: BRAND.heirloom,
            textShadow: `2px 2px 0 ${BRAND.pod}`,
          }}>
            CAUA-GOTCHI
          </h2>
          <div style={{ fontSize: 11, color: '#aaa', marginBottom: 12 }}>
            STATUS: <span style={{ color: prob ? '#e74c3c' : BRAND.pod }}>
              {prob ? `⚠ ${prob.name.toUpperCase()}` : stageText.toUpperCase()}
            </span>
          </div>

          {renderRetroBar(health, '#2ecc71', 'HP')}
          {renderRetroBar(moisture, '#3498db', 'H₂O')}
          {renderRetroBar(sunlight, '#f1c40f', 'SUN')}
        </div>
      </div>
    </div>
  )
}
