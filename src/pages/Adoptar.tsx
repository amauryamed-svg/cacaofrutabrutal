import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCocoaTrees } from '../hooks/useCocoaTrees'
import SwipeableTreeCard from '../components/ui/SwipeableTreeCard'
import TokenReward from '../components/ritual/TokenReward'
import { BRAND, FONTS, GUARDIANS, TOKEN_RATES } from '../utils/constants'

type Phase = 'idle' | 'confirming' | 'adopting' | 'done'

export default function Adoptar() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { trees, loading: treesLoading, adoptTree } = useCocoaTrees()

  // Deep-link from CauaBonga finca: /adoptar?guardian=2 lands directly on that guardian's card.
  // Resolved at mount via lazy initializer to avoid setState-in-effect cascades.
  const initialGuardian = (() => {
    const g = Number(searchParams.get('guardian'))
    return Number.isInteger(g) && g >= 0 && g < GUARDIANS.length ? g : 0
  })()

  const [phase,       setPhase]       = useState<Phase>('idle')
  const [activeIdx,   setActiveIdx]   = useState(initialGuardian)
  const [cardKey,     setCardKey]     = useState(0)
  const [tokenReward, setTokenReward] = useState<{ beans: number; mazorcas: number } | null>(null)

  const guardian = GUARDIANS[activeIdx]

  const handleSwipeLeft = () => {
    setActiveIdx(i => (i + 1) % GUARDIANS.length)
    setCardKey(k => k + 1)
  }

  const handleSwipeRight = () => {
    if (!user) { navigate('/auth'); return }
    setPhase('confirming')
  }

  const selectGuardian = (i: number) => {
    setActiveIdx(i)
    setCardKey(k => k + 1)
    setPhase('idle')
  }

  const confirmAdoption = async () => {
    setPhase('adopting')
    try {
      const displayVar = guardian.varieties[0]
      let dbEnum = 'Criollo'
      if (displayVar.includes('Trinitario')) dbEnum = 'Trinitario'
      if (displayVar.includes('Forastero'))  dbEnum = 'Forastero'
      if (displayVar.includes('Nacional'))   dbEnum = 'Nacional'
      await adoptTree(activeIdx, dbEnum, guardian.region)
      setTokenReward(TOKEN_RATES.tree_adoption)
      setPhase('done')
      setTimeout(() => { setTokenReward(null); setPhase('idle') }, 3000)
    } catch (err) {
      alert(`No se pudo adoptar: ${err instanceof Error ? err.message : 'Error desconocido'}`)
      setPhase('idle')
    }
  }

  const cancelConfirm = () => {
    setPhase('idle')
    setCardKey(k => k + 1)
  }

  return (
    <div style={{ background: '#040C06', minHeight: '100vh', paddingTop: 80 }}>

      {/* Header */}
      <div style={{ maxWidth: 640, margin: '0 auto', padding: 'clamp(24px,5vw,40px) 20px 0', textAlign: 'center' }}>
        <p style={{ fontFamily: FONTS.serif, fontStyle: 'italic', color: BRAND.pod, fontSize: 13, letterSpacing: '0.25em', marginBottom: 10 }}>
          cacao fruta brutal
        </p>
        <h1 style={{
          fontFamily: FONTS.display, fontWeight: 900,
          fontSize: 'clamp(40px,10vw,68px)', color: BRAND.heirloom,
          textTransform: 'uppercase', margin: '0 0 10px', lineHeight: 0.9,
        }}>
          Adopta un<br /><span style={{ color: BRAND.pod }}>árbol de cacao</span>
        </h1>
        <p style={{ fontFamily: FONTS.body, color: `${BRAND.heirloom}55`, fontSize: 13, lineHeight: 1.6, maxWidth: 400, margin: '0 auto 20px' }}>
          Desliza <span style={{ color: '#2ecc71' }}>→ derecha</span> para adoptar ·{' '}
          <span style={{ color: '#e74c3c' }}>← izquierda</span> para pasar
        </p>

        {/* Adopted trees chips */}
        {!treesLoading && trees.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
            {trees.map(t => (
              <button key={t.id} onClick={() => navigate(`/tree/${t.id}`)} style={{
                background: `${BRAND.pod}18`, border: `1px solid ${BRAND.pod}44`,
                borderRadius: 999, padding: '5px 14px', cursor: 'pointer',
                fontFamily: FONTS.display, fontWeight: 700, fontSize: 11,
                color: BRAND.pod, letterSpacing: '0.08em',
              }}>
                🌱 {GUARDIANS[t.guardian_id]?.name ?? 'Árbol'} · {t.stage}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main area */}
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 20px clamp(48px,8vw,80px)' }}>

        {tokenReward && <TokenReward beans={tokenReward.beans} mazorcas={tokenReward.mazorcas} />}

        {/* Done */}
        {phase === 'done' && (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>🌱</div>
            <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 28, color: BRAND.pod, letterSpacing: '0.05em' }}>
              ¡ÁRBOL ADOPTADO!
            </div>
            <p style={{ fontFamily: FONTS.body, color: `${BRAND.heirloom}66`, fontSize: 13, marginTop: 8 }}>
              Cuídalo cada 30 min durante 5 horas para cosechar 🍫
            </p>
          </div>
        )}

        {/* Card stack + controls */}
        {phase !== 'done' && (
          <>
            {/* Card stack */}
            <div style={{ position: 'relative', height: 520, marginBottom: 20 }}>

              {/* Background card (next guardian peek) */}
              <div style={{
                position: 'absolute', inset: 0,
                background: `linear-gradient(160deg, ${BRAND.amazon} 0%, #091a10 50%, ${BRAND.bgDeep} 100%)`,
                borderRadius: 24,
                transform: 'scale(0.94) translateY(14px)',
                opacity: 0.3,
                pointerEvents: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ fontSize: 80, opacity: 0.25 }}>
                  {GUARDIANS[(activeIdx + 1) % GUARDIANS.length].emoji}
                </div>
              </div>

              {/* Active swipeable card */}
              {phase !== 'adopting' && (
                <SwipeableTreeCard
                  key={cardKey}
                  guardian={guardian}
                  onSwipeRight={handleSwipeRight}
                  onSwipeLeft={handleSwipeLeft}
                  imageIndex={activeIdx}
                />
              )}

              {/* Adopting overlay */}
              {phase === 'adopting' && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: `linear-gradient(160deg, ${BRAND.amazon} 0%, #091a10 50%, ${BRAND.bgDeep} 100%)`,
                  borderRadius: 24,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 52, marginBottom: 12 }}>{guardian.emoji}</div>
                    <div style={{ fontFamily: FONTS.serif, fontStyle: 'italic', color: `${BRAND.heirloom}80`, fontSize: 14 }}>
                      Plantando tu semilla...
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Guardian dots */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
              {GUARDIANS.map((_, i) => (
                <div key={i} onClick={() => selectGuardian(i)} style={{
                  width: i === activeIdx ? 18 : 6, height: 6, borderRadius: 3,
                  background: i === activeIdx ? BRAND.pod : `${BRAND.heirloom}33`,
                  cursor: 'pointer', transition: 'width 0.3s, background 0.3s',
                }} />
              ))}
            </div>

            {/* Idle: swipe hints */}
            {phase === 'idle' && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 48, marginBottom: 14 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 28, marginBottom: 4 }}>👈</div>
                    <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 9, letterSpacing: '0.15em', color: '#e74c3c88' }}>PASAR</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 28, marginBottom: 4 }}>👉</div>
                    <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 9, letterSpacing: '0.15em', color: '#2ecc7188' }}>ADOPTAR</div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: `${BRAND.heirloom}33` }}>
                  🫘 +10 granos · 🌽 +3 mazorcas al adoptar
                </div>
              </div>
            )}

            {/* Confirming panel */}
            {phase === 'confirming' && (
              <div style={{
                background: '#0D1A10', border: `1px solid ${BRAND.pod}44`,
                borderRadius: 14, padding: '20px',
              }}>
                <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 10, color: BRAND.pod, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 12 }}>
                  Confirma tu adopción
                </div>
                <p style={{ fontFamily: FONTS.body, color: `${BRAND.heirloom}aa`, fontSize: 13, lineHeight: 1.6, margin: '0 0 4px' }}>
                  Guardián: <strong style={{ color: BRAND.heirloom }}>{guardian.name}</strong>
                </p>
                <p style={{ fontFamily: FONTS.body, color: `${BRAND.heirloom}aa`, fontSize: 13, lineHeight: 1.6, margin: '0 0 4px' }}>
                  Región: <strong style={{ color: BRAND.heirloom }}>{guardian.region}</strong>
                </p>
                <p style={{ fontFamily: FONTS.body, color: `${BRAND.heirloom}aa`, fontSize: 13, lineHeight: 1.6, margin: '0 0 16px' }}>
                  Variedad: <strong style={{ color: BRAND.pod }}>{guardian.varieties[0]}</strong>
                </p>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <button onClick={confirmAdoption} style={{
                    flex: 2, padding: 13, borderRadius: 10,
                    background: `${BRAND.pod}22`, border: `1px solid ${BRAND.pod}66`,
                    color: BRAND.pod, cursor: 'pointer',
                    fontFamily: FONTS.display, fontWeight: 700, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase',
                  }}>
                    ✓ Confirmar adopción
                  </button>
                  <button onClick={cancelConfirm} style={{
                    flex: 1, padding: 13, borderRadius: 10,
                    background: '#132B1C', border: `1px solid ${BRAND.amazon}66`,
                    color: `${BRAND.heirloom}66`, cursor: 'pointer',
                    fontFamily: FONTS.display, fontWeight: 700, fontSize: 12, letterSpacing: '0.1em',
                  }}>
                    Cancelar
                  </button>
                </div>
                <div style={{ textAlign: 'center', fontSize: 11, color: BRAND.mazorca }}>
                  🫘 +10 granos · 🌽 +3 mazorcas al adoptar
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
