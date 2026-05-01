import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCocoaTrees } from '../hooks/useCocoaTrees'
import SwipeableTreeCard from '../components/ui/SwipeableTreeCard'
import TokenReward from '../components/ritual/TokenReward'
import { BRAND, FONTS, GUARDIANS, TOKEN_RATES, TREE_ADOPTION_PRICE_USD } from '../utils/constants'
import { isTreeDead, isInDeathDanger, isHarvestReady, getStageByHours, hoursSinceAdoption } from '../utils/growthSystem'

type Phase = 'idle' | 'confirming' | 'adopting' | 'done'

export default function Adoptar() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { trees, loading: treesLoading, adoptTree, deleteTree } = useCocoaTrees()

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
    <div style={{ background: '#040C06', minHeight: '100vh', paddingTop: 'calc(var(--nav-h, 60px) + 12px)' }}>

      {/* Header */}
      <div style={{ maxWidth: 640, margin: '0 auto', padding: 'clamp(20px,5vw,40px) var(--space-page) 0', textAlign: 'center' }}>
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

        {/* Adopted trees — split en dos jardines:
              · Jardín       → vivos / en peligro / listos a cosechar / cosechados
              · Labranza     → muertos · biomasa que regresa al suelo (regenerativo) */}
        {!treesLoading && trees.length > 0 && (() => {
          // Annotate each tree with its current life-status (Phase 1.5 — recurrente).
          const annotated = trees.map(t => {
            const harvested = !!t.harvested_at  // sólo "ya cosechó alguna vez" (no lock)
            const dead   = isTreeDead(t)
            const danger = !dead && isInDeathDanger(t)
            const ready  = !dead && isHarvestReady(t)
            const stage  = getStageByHours(hoursSinceAdoption(t.adopted_at))
            return { t, harvested, dead, danger, ready, stage }
          })
          const aliveTrees = annotated.filter(x => !x.dead)
          const deadTrees  = annotated.filter(x =>  x.dead)

          return (
            <>
              {/* JARDÍN — chips para árboles vivos. Tile un poco más grande
                  (fontSize 12, padding 7×14) para legibilidad. */}
              {aliveTrees.length > 0 && (
                <>
                  <div style={{
                    fontFamily: FONTS.display, fontWeight: 800, fontSize: 10,
                    color: `${BRAND.heirloom}88`, letterSpacing: '0.22em',
                    textTransform: 'uppercase', marginBottom: 8,
                  }}>
                    Mi Jardín · {aliveTrees.length}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 24 }}>
                    {aliveTrees.map(({ t, harvested, danger, ready, stage }) => {
                      const accent = danger ? '#F1A91E'
                                   : harvested ? BRAND.mazorca
                                   : ready ? BRAND.mazorca
                                   : BRAND.pod
                      const icon   = danger ? '⏳'
                                   : harvested ? '🍫'
                                   : ready ? '🍫'
                                   : '🌱'
                      const label  = danger ? 'Peligro · cuidar'
                                   : harvested ? 'Cosechado'
                                   : ready ? 'Listo a cosechar'
                                   : stage.name
                      return (
                        <button key={t.id} onClick={() => navigate(`/tree/${t.id}`)} style={{
                          background: `${accent}18`,
                          border: `1px solid ${accent}${danger || ready ? 'aa' : '66'}`,
                          borderRadius: 999,
                          padding: '7px 14px',
                          cursor: 'pointer',
                          fontFamily: FONTS.display, fontWeight: 700, fontSize: 12,
                          color: accent, letterSpacing: '0.08em',
                          boxShadow: (danger || ready) ? `0 0 14px ${accent}55` : 'none',
                          animation: ready ? 'caua-chip-pulse 1.6s ease-in-out infinite' : 'none',
                          transition: 'border-color 0.2s, background 0.2s, box-shadow 0.2s',
                        }}>
                          {icon} {GUARDIANS[t.guardian_id]?.name ?? 'Árbol'} · {label}
                        </button>
                      )
                    })}
                  </div>
                </>
              )}

              {/* LABRANZA — árboles muertos. Tiles más grandes con acción
                  "Devolver a la tierra" visible. Framing regenerativo: la
                  biomasa muerta no es desperdicio, es preparación del suelo. */}
              {deadTrees.length > 0 && (
                <>
                  <div style={{
                    fontFamily: FONTS.display, fontWeight: 800, fontSize: 10,
                    color: `${BRAND.heirloom}88`, letterSpacing: '0.22em',
                    textTransform: 'uppercase', marginBottom: 4, marginTop: aliveTrees.length > 0 ? 0 : 0,
                  }}>
                    Labranza · {deadTrees.length}
                  </div>
                  <div style={{
                    fontFamily: FONTS.serif, fontStyle: 'italic',
                    color: `${BRAND.heirloom}55`, fontSize: 11,
                    marginBottom: 10, letterSpacing: '0.04em',
                  }}>
                    Biomasa que regresa al suelo · regenerar para sembrar de nuevo
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 24 }}>
                    {deadTrees.map(({ t }) => (
                      <div key={t.id} style={{
                        display: 'inline-flex', alignItems: 'stretch',
                        background: '#1a0606',
                        border: `1px solid #e74c3c66`,
                        borderRadius: 14,
                        overflow: 'hidden',
                        boxShadow: 'inset 0 0 18px #e74c3c22',
                      }}>
                        <button onClick={() => navigate(`/tree/${t.id}`)} style={{
                          background: 'transparent', border: 'none', cursor: 'pointer',
                          padding: '10px 14px',
                          fontFamily: FONTS.display, fontWeight: 700, fontSize: 13,
                          color: '#e74c3c', letterSpacing: '0.08em',
                          display: 'flex', alignItems: 'center', gap: 6,
                          opacity: 0.9,
                        }}>
                          <span style={{ fontSize: 18, filter: 'grayscale(0.4)' }}>💀</span>
                          {GUARDIANS[t.guardian_id]?.name ?? 'Árbol'}
                          <span style={{ fontSize: 10, color: `#e74c3c88`, letterSpacing: '0.16em' }}>· MUERTO</span>
                        </button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation()
                            if (!confirm(`¿Devolver el árbol de ${GUARDIANS[t.guardian_id]?.name ?? 'guardián'} a la tierra?\n\nSu biomasa nutre el suelo de la próxima siembra. Esta acción no se puede deshacer.`)) return
                            try { await deleteTree(t.id) }
                            catch (err) { alert(`No se pudo devolver: ${err instanceof Error ? err.message : 'Error desconocido'}`) }
                          }}
                          title="Devolver a la tierra · regenerar"
                          aria-label="Devolver árbol a la tierra"
                          style={{
                            background: `${BRAND.pod}1f`,
                            border: 'none', borderLeft: `1px solid ${BRAND.pod}44`,
                            cursor: 'pointer', padding: '10px 14px',
                            color: BRAND.pod,
                            fontFamily: FONTS.display, fontWeight: 700, fontSize: 11,
                            letterSpacing: '0.12em', textTransform: 'uppercase',
                            display: 'flex', alignItems: 'center', gap: 6,
                          }}
                        >
                          <span style={{ fontSize: 14 }}>🌱</span>
                          Regenerar
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <style>{`
                @keyframes caua-chip-pulse {
                  0%, 100% { box-shadow: 0 0 14px ${BRAND.mazorca}55; }
                  50%      { box-shadow: 0 0 24px ${BRAND.mazorca}aa; }
                }
              `}</style>
            </>
          )
        })()}
      </div>

      {/* Main area */}
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 var(--space-page) clamp(48px,8vw,80px)' }}>

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
            {/* Card stack — height fluid so short phones (≤568px) don't clip */}
            <div style={{ position: 'relative', height: 'clamp(420px, 62vh, 540px)', marginBottom: 20 }}>

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

              {/* Confirming overlay — sits ON TOP of the card, centered, so
                  the user sees clearly what they swiped into. Big emoji + price
                  + circular CTA. The two buttons (confirm/cancel) live INSIDE
                  the same card frame so the swipe→action thread is unbroken. */}
              {phase === 'confirming' && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: `linear-gradient(160deg, ${BRAND.amazon} 0%, #091a10 50%, ${BRAND.bgDeep} 100%)`,
                  borderRadius: 24, padding: 'clamp(20px, 4vw, 32px)',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'space-between',
                  boxShadow: `inset 0 0 60px ${BRAND.pod}22, 0 0 32px ${BRAND.pod}33`,
                  border: `1px solid ${BRAND.pod}66`,
                  animation: 'caua-confirm-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) both',
                }}>
                  {/* Top: eyebrow */}
                  <div style={{
                    fontFamily: FONTS.display, fontWeight: 700, fontSize: 10,
                    color: BRAND.pod, letterSpacing: '0.25em', textTransform: 'uppercase',
                  }}>
                    Confirma tu adopción
                  </div>

                  {/* Center: emoji + name + region + price */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontSize: 'clamp(60px, 14vw, 88px)',
                      marginBottom: 14,
                      filter: `drop-shadow(0 12px 24px ${BRAND.pod}55)`,
                    }}>{guardian.emoji}</div>
                    <div style={{
                      fontFamily: FONTS.display, fontWeight: 900,
                      fontSize: 'clamp(22px, 5vw, 30px)',
                      color: BRAND.heirloom, letterSpacing: '0.04em',
                      textTransform: 'uppercase', lineHeight: 1,
                    }}>{guardian.name}</div>
                    <div style={{
                      fontFamily: FONTS.serif, fontStyle: 'italic',
                      color: BRAND.mazorca, fontSize: 13, marginTop: 4,
                      letterSpacing: '0.06em',
                    }}>
                      {guardian.region} · {guardian.varieties[0]}
                    </div>
                    <div style={{
                      marginTop: 18,
                      fontFamily: FONTS.display, fontWeight: 900,
                      fontSize: 'clamp(36px, 9vw, 56px)',
                      color: BRAND.mazorca, letterSpacing: '-0.01em',
                      textShadow: `0 4px 24px ${BRAND.mazorca}66`,
                    }}>
                      ${TREE_ADOPTION_PRICE_USD}<span style={{ fontSize: 14, color: `${BRAND.heirloom}66`, marginLeft: 6, fontWeight: 700, letterSpacing: '0.16em' }}>USD</span>
                    </div>
                    <div style={{
                      fontFamily: FONTS.body, fontSize: 11, color: `${BRAND.heirloom}88`,
                      marginTop: 4, letterSpacing: '0.04em',
                    }}>🫘 +10 granos · 🌽 +3 mazorcas al adoptar</div>
                  </div>

                  {/* Bottom: confirm + cancel + tiny disclaimer */}
                  <div style={{ width: '100%' }}>
                    <button onClick={confirmAdoption} style={{
                      width: '100%', padding: '14px',
                      background: `linear-gradient(135deg, ${BRAND.pod}, ${BRAND.amazon})`,
                      border: 'none', borderRadius: 999, cursor: 'pointer',
                      color: BRAND.heirloom,
                      fontFamily: FONTS.display, fontWeight: 800,
                      fontSize: 13, letterSpacing: '0.16em', textTransform: 'uppercase',
                      boxShadow: `0 12px 28px ${BRAND.pod}55`,
                    }}>
                      ✓ Adoptar por ${TREE_ADOPTION_PRICE_USD}
                    </button>
                    <button onClick={cancelConfirm} style={{
                      width: '100%', padding: 10, marginTop: 8,
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      color: `${BRAND.heirloom}66`,
                      fontFamily: FONTS.display, fontWeight: 700,
                      fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase',
                    }}>
                      ← Volver
                    </button>
                    <div style={{
                      textAlign: 'center', fontSize: 9, color: `${BRAND.heirloom}55`,
                      lineHeight: 1.5, marginTop: 6,
                    }}>
                      Pago se despliega 60/30/10 vía Coinbase Onramp.
                    </div>
                  </div>
                </div>
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
              <style>{`
                @keyframes caua-confirm-in {
                  0%   { opacity: 0; transform: scale(0.92); }
                  100% { opacity: 1; transform: scale(1); }
                }
              `}</style>
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

            {/* Confirming overlay lives ON the card now (above) — no separate
                panel below to avoid the disconnected confirm button. */}
          </>
        )}
      </div>
    </div>
  )
}
