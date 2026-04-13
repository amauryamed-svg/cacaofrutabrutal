import { motion } from 'framer-motion'
import { BRAND, FONTS } from '../../utils/constants'

interface CauaGotchiProps {
  health: number // 0-100
  moisture: number // 0-100
  sunlight: number // 0-100
  stageText: string
  treeName: string
}

export default function CauaGotchi({ health, moisture, sunlight, stageText, treeName }: CauaGotchiProps) {
  // Retro blocky progress bar generator
  const renderRetroBar = (value: number, color: string) => {
    const blocks = Math.floor(value / 10)
    return (
      <div style={{ display: 'flex', gap: 2 }}>
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            style={{
              width: 12,
              height: 16,
              background: i < blocks ? color : '#2A2A2A',
              border: '2px solid #000'
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      style={{
        background: '#040C06',
        border: `4px solid ${BRAND.pod}`,
        borderRadius: 16,
        padding: 24,
        marginBottom: 48,
        fontFamily: "'Courier New', Courier, monospace", // Retro font
        color: '#2ecc71',
        boxShadow: `0 0 20px ${BRAND.pod}44, inset 0 0 40px #000`,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Scanline effect for retro CRTs */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
          backgroundSize: '100% 4px, 3px 100%',
          pointerEvents: 'none',
          zIndex: 10
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', md: { flexDirection: 'row' }, gap: 32 }}>

        {/* Console Screen (Avatar side) */}
        <div
          style={{
            background: '#8da67f', // Old Gameboy green screen
            border: '8px solid #333',
            borderRadius: 8,
            padding: 16,
            height: 240,
            width: 240,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}
        >
          {/* Subtle breathing animation */}
          <motion.img
            src="/cacao_tree_8bit.png"
            alt="Cacao Retro Tree"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1.05 }}
            transition={{
              repeat: Infinity,
              repeatType: "reverse",
              duration: 1.5,
              ease: "easeInOut"
            }}
            style={{ 
              width: 160, 
              height: 160,
              imageRendering: 'pixelated'
            }}
          />

          <div style={{
            position: 'absolute',
            bottom: 8, left: 8, right: 8,
            display: 'flex', justifyContent: 'space-between',
            color: '#1e3810',
            fontWeight: 900,
            fontSize: 12
          }}>
            <span>LVL 1</span>
            <span>{treeName.toUpperCase()}</span>
          </div>
        </div>

        {/* Stats side */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16, zIndex: 2 }}>
          <h2 style={{
            fontFamily: FONTS.display,
            fontWeight: 900,
            fontSize: 32,
            margin: 0,
            color: BRAND.heirloom,
            textShadow: `2px 2px 0 ${BRAND.pod}`
          }}>
            CAUA-GOTCHI SYNC
          </h2>
          
          <div style={{ fontSize: 14, color: '#aaa', marginBottom: 8 }}>
            STATUS: <span style={{ color: BRAND.pod }}>{stageText}</span>
          </div>

          <div>
            <div style={{ marginBottom: 4, fontWeight: 'bold' }}>HP (HEALTH)</div>
            {renderRetroBar(health, '#2ecc71')}
          </div>

          <div>
            <div style={{ marginBottom: 4, fontWeight: 'bold' }}>H2O (HUMEDAD)</div>
            {renderRetroBar(moisture, '#3498db')}
          </div>

          <div>
            <div style={{ marginBottom: 4, fontWeight: 'bold' }}>SUN (LUZ)</div>
            {renderRetroBar(sunlight, '#f1c40f')}
          </div>

        </div>
      </div>
    </div>
  )
}
