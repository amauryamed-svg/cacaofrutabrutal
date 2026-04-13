import React, { useState } from 'react'
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion'
import { BRAND, FONTS } from '../../utils/constants'

interface Guardian {
  name: string
  region: string
  power: string
}

interface SwipeableTreeCardProps {
  guardian: Guardian
  onSwipeRight: () => void
  onSwipeLeft: () => void
  imageIndex: number
}

export default function SwipeableTreeCard({
  guardian,
  onSwipeRight,
  onSwipeLeft,
  imageIndex
}: SwipeableTreeCardProps) {
  const [exitX, setExitX] = useState<number | string>(0)
  const x = useMotionValue(0)
  
  // Convert position to rotation for a natural throwing card effect
  const rotate = useTransform(x, [-200, 200], [-25, 25])
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0])
  const scale = useTransform(x, [-200, 0, 200], [0.8, 1, 0.8])

  // "LIKE" / "NOPE" text opacities based on swipe direction
  const likeOpacity = useTransform(x, [20, 100], [0, 1])
  const nopeOpacity = useTransform(x, [-20, -100], [0, 1])

  function handleDragEnd(event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (info.offset.x > 100) {
      setExitX(250)
      setTimeout(() => onSwipeRight(), 300)
    } else if (info.offset.x < -100) {
      setExitX(-250)
      setTimeout(() => onSwipeLeft(), 300)
    }
  }

  // A generic tree placeholder image or gradient if not available
  const treeBg = `linear-gradient(135deg, ${BRAND.amazon} 0%, ${BRAND.bgDeep} 100%)`

  return (
    <motion.div
      style={{
        x,
        rotate,
        opacity,
        scale,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        margin: 'auto',
        width: '100%',
        maxWidth: 380,
        height: 520,
        borderRadius: 24,
        background: treeBg,
        boxShadow: `0 20px 40px rgba(0,0,0,0.5), inset 0 0 0 2px ${BRAND.pod}55`,
        cursor: 'grab',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: 24
      }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      whileTap={{ cursor: 'grabbing' }}
      onDragEnd={handleDragEnd}
      animate={{ x: exitX }}
      transition={{ duration: 0.3 }}
    >
      {/* Visual Overlay for swipe indicators */}
      <motion.div
        style={{
          position: 'absolute',
          top: 40,
          right: 40,
          opacity: likeOpacity,
          color: '#2ecc71',
          border: '4px solid #2ecc71',
          padding: '8px 16px',
          borderRadius: 12,
          fontFamily: FONTS.display,
          fontWeight: 900,
          fontSize: 32,
          transform: 'rotate(15deg)',
          pointerEvents: 'none',
          zIndex: 10
        }}
      >
        ADOPTAR
      </motion.div>
      <motion.div
        style={{
          position: 'absolute',
          top: 40,
          left: 40,
          opacity: nopeOpacity,
          color: '#e74c3c',
          border: '4px solid #e74c3c',
          padding: '8px 16px',
          borderRadius: 12,
          fontFamily: FONTS.display,
          fontWeight: 900,
          fontSize: 32,
          transform: 'rotate(-15deg)',
          pointerEvents: 'none',
          zIndex: 10
        }}
      >
        PASAR
      </motion.div>

      {/* Card Content Overlay */}
      <div
        style={{
          background: 'rgba(4, 12, 6, 0.6)',
          backdropFilter: 'blur(12px)',
          borderRadius: 16,
          padding: 20,
          color: '#fff',
          border: `1px solid rgba(255,255,255,0.1)`
        }}
      >
        <div style={{ fontFamily: FONTS.display, fontSize: 32, fontWeight: 900, color: BRAND.heirloom, lineHeight: 1.1 }}>
          {guardian.name}
        </div>
        <div style={{ fontFamily: FONTS.body, fontSize: 14, color: '#aaa', margin: '4px 0 12px 0' }}>
          📍 {guardian.region}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{
            background: `${BRAND.pod}33`, color: BRAND.pod,
            padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700
          }}>
            {guardian.power}
          </span>
          <span style={{
            background: `${BRAND.mazorca}33`, color: BRAND.mazorca,
            padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700
          }}>
           Árbol #{1000 + imageIndex}
          </span>
        </div>
      </div>
    </motion.div>
  )
}
