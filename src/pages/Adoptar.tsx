import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCocoaTrees } from '../hooks/useCocoaTrees'
import SwipeableTreeCard from '../components/ui/SwipeableTreeCard'
import TokenReward from '../components/ritual/TokenReward'
import { BRAND, FONTS, GUARDIANS, TOKEN_RATES, TREE_ADOPTION_PRICE_USD } from '../utils/constants'
import { isTreeDead, isDying, needsAttention, isHarvestReady, getStageByHours, hoursSinceAdoption } from '../utils/growthSystem'

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
          // Annotate each tree with its life-status. Phase 1.5 — 4 niveles
          // visuales claramente distintos: ready / healthy / attention / dying.
          // Death lo decide el server (died_at populated) — el cliente solo lo refleja.
          const annotated = trees.map(t => {
            const harvested = !!t.harvested_at
            const dead    = isTreeDead(t)
            const dying   = !dead && isDying(t)        // vitals < 30 — VA A MORIR
            const warn    = !dead && needsAttention(t) // 30 ≤ vitals < 50 — necesita atención
            const ready   = !dead && isHarvestReady(t) // ≥ 4.6h + cooldown vencido
            const stage   = getStageByHours(hoursSinceAdoption(t.adopted_at))
            return { t, harvested, dead, dying, warn, ready, stage }
          })
          const aliveTrees = annotated.filter(x => !x.dead)
          const deadTrees  = annotated.filter(x =>  x.dead)

          // Tier definition — exclusive priority: ready > dying > warn > healthy.
          // Each tier has a dedicated color, emoji, label, animation.
          type Tier = 'ready' | 'dying' | 'warn' | 'harvested' | 'healthy'
          type TierStyle = {
            color:     string
            icon:      string
            label:     string
            pulse?:    boolean
          }
          const tierStyle = (t: typeof annotated[number]): TierStyle => {
            if (t.ready)  return { color: BRAND.mazorca, icon: '🍫', label: 'Listo a cosechar', pulse: true }
            if (t.dying)  return { color: '#e74c3c',     icon: '💀', label: 'Va a morir',       pulse: true }
            if (t.warn)   return { color: '#F1A91E',     icon: '⚠️', label: 'Necesita atención' }
            if (t.harvested) return { color: BRAND.pod,  icon: '🌳', label: 'Cosechado · próx ciclo' }
            return { color: BRAND.pod, icon: '🌱', label: t.stage.name }
          }
          const tierOf = (t: typeof annotated[number]): Tier => {
            if (t.ready) return 'ready'
            if (t.dying) return 'dying'
            if (t.warn)  return 'warn'
            if (t.harvested) return 'harvested'
            return 'healthy'
          }

          return (
            <>
              {/* JARDÍN — chips para árboles vivos. 4-tier color system. */}
              {aliveTrees.length > 0 && (
                <>
                  <div style={{
                    fontFamily: FONTS.display, fontWeight: 800, fontSize: 10,
                    color: `${BRAND.heirloom}88`, letterSpacing: '0.22em',
                    textTransform: 'uppercase', marginBottom: 8,
                  }}>
                    Mi Jardín · {aliveTrees.length}
                  </div>

                  {/* Legend — visible siempre que hay árboles, ayuda a leer los chips */}
                  <div style={{
                    display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center',
                    marginBottom: 12,
                    fontFamily: FONTS.body, fontSize: 9, color: `${BRAND.heirloom}55`,
                    letterSpacing: '0.04em',
                  }}>
                    <span><span style={{ color: BRAND.mazorca }}>🍫 Listo</span></span>
                    <span><span style={{ color: '#e74c3c' }}>💀 Va a morir</span></span>
                    <span><span style={{ color: '#F1A91E' }}>⚠️ Atención</span></span>
                    <span><span style={{ color: BRAND.pod }}>🌱 Sano</span></span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 24 }}>
                    {aliveTrees.map((row) => {
                      const s = tierStyle(row)
                      const t = row.t
                      const tier = tierOf(row)
                      return (
                        <button
                          key={t.id}
                          onClick={() => navigate(`/tree/${t.id}`)}
                          data-tier={tier}
                          style={{
                            background: `${s.color}1a`,
                            border: `1px solid ${s.color}${s.pulse ? 'cc' : '66'}`,
                            borderRadius: 999,
                            padding: '7px 14px',
                            cursor: 'pointer',
                            fontFamily: FONTS.display, fontWeight: 700, fontSize: 12,
                            color: s.color, letterSpacing: '0.08em',
                            boxShadow: s.pulse ? `0 0 18px ${s.color}66` : 'none',
                            animation: tier === 'ready' ? 'caua-chip-pulse 1.6s ease-in-out infinite'
                                     : tier === 'dying' ? 'caua-chip-dying 1s ease-in-out infinite'
                                     : 'none',
                            transition: 'border-color 0.2s, background 0.2s, box-shadow 0.2s',
                          }}
                        >
                          {s.icon} {GUARDIANS[t.guardian_id]?.name ?? 'Árbol'} · {s.label}
                        </button>
                      )
                    })}
                  </div>
                </>
              )}

              {/* LABRANZA — árboles muertos. Tiles más grandes + CTA al machete
                  arena (vive en el dashboard). El click directo en "Regenerar"
                  lleva al usuario al dashboard donde está el Fruit-Ninja arena
                  con el machete 3D. Cierra el bucle muerte → regeneración. */}
              {deadTrees.length > 0 && (
                <>
                  <div style={{
                    fontFamily: FONTS.display, fontWeight: 800, fontSize: 11,
                    color: '#e74c3ccc', letterSpacing: '0.22em',
                    textTransform: 'uppercase', marginBottom: 4,
                    display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: 14 }}>💀</span>
                    <span>Labranza · {deadTrees.length}</span>
                  </div>
                  <div style={{
                    fontFamily: FONTS.serif, fontStyle: 'italic',
                    color: `${BRAND.heirloom}66`, fontSize: 11,
                    marginBottom: 10, letterSpacing: '0.04em', textAlign: 'center',
                  }}>
                    Biomasa que regresa al suelo · machete · +10 granos por cada lineage regenerado
                  </div>

                  {/* Sticky CTA — bigger, gradient, leads to the machete arena */}
                  <button
                    onClick={() => navigate('/dashboard#labranza')}
                    style={{
                      width: '100%',
                      maxWidth: 420,
                      margin: '0 auto 12px',
                      display: 'flex',
                      background: `linear-gradient(135deg, #1a0606 0%, ${BRAND.pod}33 100%)`,
                      border: `1px solid ${BRAND.pod}88`,
                      borderRadius: 14,
                      padding: '14px 18px',
                      cursor: 'pointer',
                      alignItems: 'center', gap: 14,
                      boxShadow: `0 0 24px ${BRAND.pod}33, inset 0 1px 0 ${BRAND.heirloom}11`,
                      transition: 'transform 0.2s, box-shadow 0.2s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
                  >
                    <div style={{
                      fontSize: 32,
                      filter: `drop-shadow(0 4px 8px ${BRAND.pod}aa)`,
                    }}>⚔</div>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div style={{
                        fontFamily: FONTS.display, fontWeight: 800, fontSize: 13,
                        color: BRAND.heirloom, letterSpacing: '0.12em', textTransform: 'uppercase',
                      }}>
                        Rebanar con machete →
                      </div>
                      <div style={{
                        fontFamily: FONTS.body, fontSize: 10,
                        color: `${BRAND.heirloom}99`, marginTop: 3, letterSpacing: '0.02em',
                      }}>
                        Fruit-Ninja arena · regenera · +10 granos × {deadTrees.length}
                      </div>
                    </div>
                    <div style={{
                      fontFamily: FONTS.display, fontWeight: 800, fontSize: 18,
                      color: BRAND.pod,
                    }}>▶</div>
                  </button>

                  {/* Compact list of pending regenerations — just for visibility */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 24 }}>
                    {deadTrees.map(({ t }) => (
                      <div key={t.id} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        background: '#1a0606',
                        border: `1px solid #e74c3c44`,
                        borderRadius: 999,
                        padding: '5px 10px',
                        opacity: 0.75,
                      }}>
                        <span style={{ fontSize: 12, filter: 'grayscale(0.5)' }}>💀</span>
                        <span style={{
                          fontFamily: FONTS.display, fontWeight: 700, fontSize: 10,
                          color: '#e74c3ccc', letterSpacing: '0.08em',
                        }}>
                          {GUARDIANS[t.guardian_id]?.name ?? 'Árbol'}
                        </span>
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
                @keyframes caua-chip-dying {
                  0%, 100% { box-shadow: 0 0 12px #e74c3c66; opacity: 1; }
                  50%      { box-shadow: 0 0 22px #e74c3caa; opacity: 0.85; }
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
