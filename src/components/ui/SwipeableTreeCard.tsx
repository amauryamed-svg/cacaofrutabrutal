import { useState, useEffect } from 'react'
import { motion, useMotionValue, useTransform, AnimatePresence, type PanInfo } from 'framer-motion'
import { BRAND, FONTS } from '../../utils/constants'
import type { Guardian } from '../../types'
import { ADOPTION_HOURS, CARE_INTERVAL_MIN } from '../../utils/growthSystem'
import ColombiaMap from './ColombiaMap'

interface SwipeableTreeCardProps {
  guardian: Guardian
  onSwipeRight: () => void
  onSwipeLeft: () => void
  imageIndex: number
}

const SLIDES = ['identity', 'territory', 'journey'] as const
type Slide = typeof SLIDES[number]

export default function SwipeableTreeCard({
  guardian,
  onSwipeRight,
  onSwipeLeft,
}: SwipeableTreeCardProps) {
  const [exitX, setExitX] = useState<number | string>(0)
  const [currentSlide, setCurrentSlide] = useState<Slide>('identity')
  const [slideDir, setSlideDir] = useState(1)
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-25, 25])
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0])
  const scale = useTransform(x, [-200, 0, 200], [0.8, 1, 0.8])
  const likeOpacity = useTransform(x, [20, 100], [0, 1])
  const nopeOpacity = useTransform(x, [-20, -100], [0, 1])

  useEffect(() => {
    const idx = SLIDES.indexOf(currentSlide)
    const timer = setTimeout(() => {
      setSlideDir(1)
      setCurrentSlide(SLIDES[(idx + 1) % SLIDES.length])
    }, 3500)
    return () => clearTimeout(timer)
  }, [currentSlide])

  function handleDragEnd(_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (info.offset.x > 100) {
      setExitX(250)
      setTimeout(() => onSwipeRight(), 300)
    } else if (info.offset.x < -100) {
      setExitX(-250)
      setTimeout(() => onSwipeLeft(), 300)
    }
  }

  const treeBg = `linear-gradient(160deg, ${BRAND.amazon} 0%, #091a10 50%, ${BRAND.bgDeep} 100%)`

  return (
    <motion.div
      style={{
        x, rotate, opacity, scale,
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        margin: 'auto', width: '100%', maxWidth: 380, height: 520,
        borderRadius: 24, background: treeBg,
        boxShadow: `0 20px 40px rgba(0,0,0,0.5), inset 0 0 0 2px ${BRAND.pod}55`,
        cursor: 'grab', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      whileTap={{ cursor: 'grabbing' }}
      onDragEnd={handleDragEnd}
      animate={{ x: exitX }}
      transition={{ duration: 0.3 }}
    >
      {/* Ambient background glow */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `radial-gradient(ellipse 200px 200px at 50% 30%, ${BRAND.pod}18, transparent)`,
      }} />

      {/* Colombia map croquis — center background, department highlighted */}
      <div style={{
        position: 'absolute', top: 70, left: '50%', transform: 'translateX(-50%)',
        pointerEvents: 'none', userSelect: 'none',
        opacity: 0.85,
        filter: `drop-shadow(0 6px 20px rgba(0,0,0,0.45))`,
      }}>
        <ColombiaMap region={guardian.region} size={130} showTerrain />
      </div>

      {/* Guardian name top */}
      <div style={{
        position: 'absolute', top: 24, left: 24, right: 24,
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      }}>
        <div>
          <div style={{
            fontFamily: FONTS.display, fontSize: 26, fontWeight: 900,
            color: BRAND.heirloom, lineHeight: 1,
          }}>
            {guardian.name}
          </div>
          <div style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>
            📍 {guardian.town}, {guardian.region}
          </div>
        </div>
        <div style={{
          fontSize: 28, width: 48, height: 48,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `${BRAND.amazon}88`, borderRadius: 12,
          border: `1px solid ${BRAND.pod}44`,
        }}>
          {guardian.emoji}
        </div>
      </div>

      {/* Slide dot indicators */}
      <div style={{
        position: 'absolute', bottom: 195, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: 6,
      }}>
        {SLIDES.map(s => (
          <div key={s} style={{
            width: s === currentSlide ? 18 : 6, height: 6,
            borderRadius: 3,
            background: s === currentSlide ? BRAND.pod : `${BRAND.heirloom}44`,
            transition: 'width 0.3s, background 0.3s',
          }} />
        ))}
      </div>

      {/* Swipe Labels */}
      <motion.div style={{
        position: 'absolute', top: 40, right: 40, opacity: likeOpacity,
        color: '#2ecc71', border: '4px solid #2ecc71',
        padding: '8px 16px', borderRadius: 12,
        fontFamily: FONTS.display, fontWeight: 900, fontSize: 32,
        transform: 'rotate(15deg)', pointerEvents: 'none', zIndex: 10,
      }}>
        ADOPTAR
      </motion.div>
      <motion.div style={{
        position: 'absolute', top: 40, left: 40, opacity: nopeOpacity,
        color: '#e74c3c', border: '4px solid #e74c3c',
        padding: '8px 16px', borderRadius: 12,
        fontFamily: FONTS.display, fontWeight: 900, fontSize: 32,
        transform: 'rotate(-15deg)', pointerEvents: 'none', zIndex: 10,
      }}>
        PASAR
      </motion.div>

      {/* Animated Content Slides */}
      <div style={{
        background: 'rgba(4, 12, 6, 0.82)',
        backdropFilter: 'blur(12px)',
        borderRadius: '0 0 24px 24px',
        padding: 20, minHeight: 180,
        border: `1px solid rgba(255,255,255,0.08)`,
        overflow: 'hidden', position: 'relative',
      }}>
        <AnimatePresence mode="wait">
          {currentSlide === 'identity' && (
            <motion.div key="identity"
              initial={{ opacity: 0, x: slideDir * 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -slideDir * 30 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                <span style={{ background: `${BRAND.pod}44`, color: BRAND.pod, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                  🧬 {guardian.varieties[0]}
                </span>
                <span style={{ background: `${BRAND.mazorca}33`, color: BRAND.mazorca, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                  Fine Flavor
                </span>
              </div>
              <p style={{ fontFamily: FONTS.body, fontSize: 12, color: '#ccc', lineHeight: 1.5, margin: '0 0 8px' }}>
                {guardian.variety_benefit.split('.')[0]}.
              </p>
              <div style={{ fontSize: 11, color: BRAND.pod, fontWeight: 600 }}>
                {guardian.heritage}
              </div>
            </motion.div>
          )}

          {currentSlide === 'territory' && (
            <motion.div key="territory"
              initial={{ opacity: 0, x: slideDir * 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -slideDir * 30 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              <div style={{ fontSize: 11, color: BRAND.mazorca, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                Territorio
              </div>
              <p style={{ fontSize: 12, color: '#ccc', lineHeight: 1.5, margin: '0 0 8px' }}>
                {guardian.territory}
              </p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {guardian.companions.slice(0, 3).map(c => (
                  <span key={c} style={{ background: `${BRAND.amazon}99`, color: '#aaa', padding: '2px 8px', borderRadius: 12, fontSize: 10 }}>
                    🌿 {c}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {currentSlide === 'journey' && (
            <motion.div key="journey"
              initial={{ opacity: 0, x: slideDir * 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -slideDir * 30 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              <div style={{ fontSize: 11, color: BRAND.pod, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                Tu viaje de {ADOPTION_HOURS} horas
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, marginBottom: 8 }}>
                {['🌰', '🌱', '🌳', '🍫'].map((e, i) => (
                  <div key={i} style={{ textAlign: 'center', background: `${BRAND.amazon}66`, borderRadius: 8, padding: '6px 4px' }}>
                    <div style={{ fontSize: 18 }}>{e}</div>
                    <div style={{ fontSize: 8, color: '#888', marginTop: 2 }}>
                      {['Siembra', 'Plántula', 'Árbol', 'Cosecha'][i]}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: '#999' }}>
                ⏱ Cuida tu árbol cada {CARE_INTERVAL_MIN}min · 🍯 Items secretos · 🍫 Cosecha al final
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
