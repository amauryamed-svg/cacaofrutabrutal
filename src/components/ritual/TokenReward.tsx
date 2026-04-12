import { useEffect, useState } from 'react'
import { BRAND, FONTS } from '../../utils/constants'

interface TokenRewardProps {
  beans?: number
  mazorcas?: number
  duration?: number // ms to show
}

export default function TokenReward({
  beans = 0,
  mazorcas = 0,
  duration = 2000,
}: TokenRewardProps) {
  const [opacity, setOpacity] = useState(1)
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    const startTime = Date.now()
    const animationInterval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = elapsed / duration

      // Float up and fade out
      setOffset(progress * 60)
      setOpacity(Math.max(0, 1 - progress))

      if (progress >= 1) {
        clearInterval(animationInterval)
      }
    }, 16)

    return () => clearInterval(animationInterval)
  }, [duration])

  return (
    <div style={{
      position: 'fixed',
      bottom: '50%',
      left: '50%',
      transform: `translate(-50%, calc(-50% - ${offset}px))`,
      opacity,
      transition: 'opacity 0.3s',
      zIndex: 9999,
      pointerEvents: 'none',
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        padding: '12px 20px',
        background: `${BRAND.bgCard}ee`,
        border: `1px solid ${BRAND.pod}66`,
        borderRadius: 12,
        backdropFilter: 'blur(10px)',
        fontFamily: FONTS.display,
        fontWeight: 700,
        fontSize: 14,
        color: BRAND.pod,
        textAlign: 'center',
      }}>
        {beans > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 24 }}>🫘</span>
            <span>+{beans.toFixed(1)}</span>
          </div>
        )}
        {mazorcas > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 24 }}>🌽</span>
            <span>+{mazorcas.toFixed(1)}</span>
          </div>
        )}
      </div>
    </div>
  )
}
