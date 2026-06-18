import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCocoaTrees } from '../hooks/useCocoaTrees'
import { useLineageRegenerations } from '../hooks/useLineageRegenerations'
import SwipeableTreeCard from '../components/ui/SwipeableTreeCard'
import TokenReward from '../components/ritual/TokenReward'
import { BRAND, FONTS, GUARDIANS, TOKEN_RATES, TREE_ADOPTION_PRICE_USD } from '../utils/constants'
import { isTreeDead, isDying, needsAttention, isHarvestReady, getStageByHours, hoursSinceAdoption } from '../utils/growthSystem'

type Phase = 'idle' | 'confirming' | 'adopting' | 'done'

// Golden Ticket Freemium flag — toggled via VITE_GOLDEN_TICKET_FREEMIUM env var
// (Vercel env vars). When true, adoption is the 1st of 4 hitos del Camino del
// Creyente: gratis · ancla de valor $5 USD se muestra tachada, CTA "Adopta
// gratis", payment-surface bypass. Cuando termine la campaña, flip a false en
// Vercel y redeploy — sin tocar código. Hitos: 1 adoptar · 2 cuidar · 3 cosechar
// · 4 forjar (ver MiLaboratorio.tsx:402).
const IS_GOLDEN_TICKET_FREEMIUM = import.meta.env.VITE_GOLDEN_TICKET_FREEMIUM === 'true'

const GOLDEN_TICKET_HITOS = [
  { n: 1, label: 'Adopta tu árbol',       hint: 'Conoce a uno de los 5 Guardianes y siembra tu cacao' },
  { n: 2, label: 'Cuida cada 30 min',     hint: 'Agua, sol, nutrientes — 5 horas hasta cosecha' },
  { n: 3, label: 'Cosecha la mazorca',    hint: 'Fruit-Ninja arena — corta las mazorcas maduras' },
  { n: 4, label: 'Forja tu chocolate',    hint: 'Liofilizado · refinado · conchado en el Lab' },
] as const

export default function Adoptar() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { trees, loading: treesLoading, adoptTree } = useCocoaTrees()
  const { findByGuardian: findRegen } = useLineageRegenerations()

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
  const [showGTModal, setShowGTModal] = useState(false)

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
      // Token reward toast hides at 3s; the gift card reveal in `done` state
      // requires explicit dismiss (CRM360 Camino A · the user shouldn't lose
      // their RedimeCacao10K code in a 3-second flash).
      setTimeout(() => { setTokenReward(null) }, 3000)
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

        {/* Golden Ticket Freemium · ribbon de campaña — visible siempre que el
            flag está activo. Click → abre modal con los 4 hitos del Camino del
            Creyente. Apagar campaña: VITE_GOLDEN_TICKET_FREEMIUM=false en Vercel. */}
        {IS_GOLDEN_TICKET_FREEMIUM && (
          <button
            onClick={() => setShowGTModal(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: `linear-gradient(135deg, ${BRAND.mazorca}22, ${BRAND.mazorca}11)`,
              border: `1.5px solid ${BRAND.mazorca}`,
              borderRadius: 999,
              padding: '8px 16px',
              cursor: 'pointer',
              marginBottom: 18,
              boxShadow: `0 0 18px ${BRAND.mazorca}55`,
              animation: 'caua-gt-ribbon-pulse 2.4s ease-in-out infinite',
            }}
          >
            <span style={{ fontSize: 14 }}>🎟️</span>
            <span style={{
              fontFamily: FONTS.display, fontWeight: 800, fontSize: 11,
              color: BRAND.mazorca, letterSpacing: '0.18em', textTransform: 'uppercase',
            }}>
              Adopta gratis · Golden Ticket activo
            </span>
            <span style={{
              fontFamily: FONTS.display, fontWeight: 700, fontSize: 9,
              color: `${BRAND.mazorca}99`, letterSpacing: '0.08em',
            }}>
              ¿qué es?
            </span>
          </button>
        )}

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
                      const isOnChain = t.nft_mint_tx != null
                      return (
                        <button
                          key={t.id}
                          onClick={() => navigate(`/tree/${t.id}`)}
                          data-tier={tier}
                          style={{
                            background: isOnChain
                              ? `linear-gradient(135deg, ${BRAND.heroic}18, ${s.color}18)`
                              : `${s.color}1a`,
                            border: isOnChain
                              ? `1px solid ${BRAND.heroic}88`
                              : `1px solid ${s.color}${s.pulse ? 'cc' : '66'}`,
                            borderRadius: 999,
                            padding: '7px 14px',
                            cursor: 'pointer',
                            fontFamily: FONTS.display, fontWeight: 700, fontSize: 12,
                            color: isOnChain ? BRAND.heroic : s.color,
                            letterSpacing: '0.08em',
                            boxShadow: isOnChain
                              ? `0 0 14px ${BRAND.heroic}44`
                              : s.pulse ? `0 0 18px ${s.color}66` : 'none',
                            animation: tier === 'ready' ? 'caua-chip-pulse 1.6s ease-in-out infinite'
                                     : tier === 'dying' ? 'caua-chip-dying 1s ease-in-out infinite'
                                     : 'none',
                            transition: 'border-color 0.2s, background 0.2s, box-shadow 0.2s',
                          }}
                        >
                          {isOnChain ? '⛓️' : s.icon} {GUARDIANS[t.guardian_id]?.name ?? 'Árbol'} · {isOnChain ? 'ON-CHAIN' : s.label}
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
                @keyframes caua-regen-pulse {
                  0%, 100% { box-shadow: 0 0 16px ${BRAND.pod}44; }
                  50%      { box-shadow: 0 0 28px ${BRAND.pod}88; }
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
          <div style={{ textAlign: 'center', padding: '32px 0 16px' }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>🌱</div>
            <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 28, color: BRAND.pod, letterSpacing: '0.05em' }}>
              ¡ÁRBOL ADOPTADO!
            </div>
            <p style={{ fontFamily: FONTS.body, color: `${BRAND.heirloom}66`, fontSize: 13, marginTop: 8 }}>
              Cuídalo cada 30 min durante 5 horas para cosechar 🍫
            </p>

            {/* Golden Ticket · hito 1/4 completado · solo cuando freemium activo */}
            {IS_GOLDEN_TICKET_FREEMIUM && (
              <div style={{
                marginTop: 18,
                display: 'inline-flex', alignItems: 'center', gap: 10,
                background: `${BRAND.mazorca}1a`,
                border: `1.5px solid ${BRAND.mazorca}`,
                borderRadius: 999,
                padding: '8px 18px',
                boxShadow: `0 0 18px ${BRAND.mazorca}44`,
              }}>
                <span style={{ fontSize: 15 }}>🎟️</span>
                <span style={{
                  fontFamily: FONTS.display, fontWeight: 800, fontSize: 11,
                  color: BRAND.mazorca, letterSpacing: '0.16em', textTransform: 'uppercase',
                }}>
                  Hito 1 de 4 completado · siguen 3 más
                </span>
              </div>
            )}

            {/* ─── CRM360 · Camino A · Gift Card RedimeCacao10K (Phase 0 MVP) ───
                Reward inmediato post-adopt para el "asistente sin fricción".
                Phase 1: este bloque consume el código retornado por la Edge
                Function `create-shopify-giftcard` (único per user).
                Camino B (Golden Ticket) vive en MiLaboratorio.tsx post-forge. */}
            <div style={{
              marginTop: 28,
              background: `linear-gradient(160deg, #2A0F26 0%, #150616 100%)`,
              border: `1.5px solid ${BRAND.mazorca}`,
              borderRadius: 14,
              padding: 'clamp(18px, 3.5vw, 24px)',
              maxWidth: 420,
              marginLeft: 'auto', marginRight: 'auto',
              boxShadow: `0 0 24px rgba(238, 161, 16, 0.25)`,
              textAlign: 'center',
            }}>
              <div style={{
                fontFamily: FONTS.display, fontWeight: 700, fontSize: 10,
                color: BRAND.mazorca, letterSpacing: '0.22em',
                textTransform: 'uppercase', marginBottom: 6,
              }}>
                🎁 Tu reward inmediato CAÚA
              </div>
              <div style={{
                fontFamily: 'ui-monospace, monospace', fontWeight: 800,
                fontSize: 'clamp(20px, 3.5vw, 28px)',
                color: BRAND.heirloom, letterSpacing: '0.08em',
                marginBottom: 10, wordBreak: 'break-all',
              }}>
                RedimeCacao10K
              </div>
              <div style={{
                fontFamily: FONTS.body, fontSize: 13,
                color: `${BRAND.heirloom}cc`, lineHeight: 1.5,
                marginBottom: 14,
              }}>
                $10.000 COP de Gift Card · canjeable en cauacolombia.co. Tipea el código en el campo "Gift card or discount code" al pagar.
              </div>
              <a
                href="https://cauacolombia.co/discount/RedimeCacao10K?redirect=/products/cacao-ceremonial-250gr-origen-hobo-huila"
                target="_blank"
                rel="noopener noreferrer"
                data-cta-name="cfb-camino-a-redime"
                data-cta-surface="adoptar-done"
                data-cta-destination="cauacolombia-pdp-discount"
                style={{
                  display: 'block',
                  background: BRAND.mazorca,
                  color: BRAND.bgDeep,
                  padding: '12px 18px',
                  borderRadius: 999,
                  textDecoration: 'none',
                  fontFamily: FONTS.display, fontWeight: 800, fontSize: 12,
                  letterSpacing: '0.16em', textTransform: 'uppercase',
                  textAlign: 'center',
                }}
              >
                Canjear en CAÚA Colombia →
              </a>
            </div>

            {/* Continuar — dismiss explícito (no auto-reset) */}
            <button
              onClick={() => { setTokenReward(null); setPhase('idle') }}
              style={{
                marginTop: 20,
                background: 'transparent',
                color: `${BRAND.heirloom}88`,
                border: `1px solid ${BRAND.heirloom}33`,
                borderRadius: 999,
                padding: '10px 22px',
                cursor: 'pointer',
                fontFamily: FONTS.display, fontWeight: 700, fontSize: 11,
                letterSpacing: '0.16em', textTransform: 'uppercase',
              }}
            >
              Continuar →
            </button>
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
                    color: IS_GOLDEN_TICKET_FREEMIUM ? BRAND.mazorca : BRAND.pod,
                    letterSpacing: '0.25em', textTransform: 'uppercase',
                  }}>
                    {IS_GOLDEN_TICKET_FREEMIUM ? '🎟️ Hito 1 de 4 · Camino del Creyente' : 'Confirma tu adopción'}
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

                    {/* Lineage regenerated badge — shown only when the user
                        has an active regen for this guardian (Phase 2.5).
                        Narrative-only for now; future PR will apply a
                        discount at server-side adoption time. */}
                    {(() => {
                      const regen = findRegen(activeIdx)
                      if (!regen) return null
                      // Show the expiration as an absolute date — keeps the
                      // render pure (Date.now() can't be called here under
                      // react-hooks/purity). User gets "vence Mayo 8" rather
                      // than a live countdown; close enough for a 7d window.
                      const expDate = new Date(regen.expires_at).toLocaleDateString('es-CO', {
                        day: 'numeric', month: 'short',
                      })
                      return (
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          background: `${BRAND.pod}22`,
                          border: `1px solid ${BRAND.pod}aa`,
                          borderRadius: 999,
                          padding: '5px 12px',
                          marginTop: 12,
                          boxShadow: `0 0 16px ${BRAND.pod}33`,
                          animation: 'caua-regen-pulse 2.4s ease-in-out infinite',
                        }}>
                          <span style={{ fontSize: 14 }}>🌱</span>
                          <span style={{
                            fontFamily: FONTS.display, fontWeight: 800, fontSize: 9,
                            color: BRAND.pod, letterSpacing: '0.16em', textTransform: 'uppercase',
                          }}>
                            Lineage regenerado · vence {expDate}
                          </span>
                        </div>
                      )
                    })()}

                    {IS_GOLDEN_TICKET_FREEMIUM ? (
                      <>
                        <div style={{ marginTop: 18, display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 10 }}>
                          <span style={{
                            fontFamily: FONTS.display, fontWeight: 800,
                            fontSize: 'clamp(20px, 4.5vw, 28px)',
                            color: `${BRAND.heirloom}55`,
                            textDecoration: 'line-through',
                            letterSpacing: '-0.01em',
                          }}>
                            ${TREE_ADOPTION_PRICE_USD} USD
                          </span>
                          <span style={{
                            fontFamily: FONTS.display, fontWeight: 900,
                            fontSize: 'clamp(36px, 9vw, 56px)',
                            color: BRAND.mazorca, letterSpacing: '-0.01em',
                            textShadow: `0 4px 24px ${BRAND.mazorca}66`,
                          }}>
                            GRATIS
                          </span>
                        </div>
                        <div style={{
                          fontFamily: FONTS.body, fontSize: 11, color: BRAND.mazorca,
                          marginTop: 4, letterSpacing: '0.08em', fontWeight: 700,
                        }}>🎟️ 1 de 30 cupos para Cacao Ceremony gratis</div>
                        <div style={{
                          fontFamily: FONTS.body, fontSize: 11, color: `${BRAND.heirloom}88`,
                          marginTop: 4, letterSpacing: '0.04em',
                        }}>🫘 +10 granos · 🌽 +3 mazorcas al adoptar</div>
                      </>
                    ) : (
                      <>
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
                      </>
                    )}
                  </div>

                  {/* Bottom: confirm + cancel + tiny disclaimer */}
                  <div style={{ width: '100%' }}>
                    <button onClick={confirmAdoption} style={{
                      width: '100%', padding: '14px',
                      background: IS_GOLDEN_TICKET_FREEMIUM
                        ? `linear-gradient(135deg, ${BRAND.mazorca}, ${BRAND.pod})`
                        : `linear-gradient(135deg, ${BRAND.pod}, ${BRAND.amazon})`,
                      border: 'none', borderRadius: 999, cursor: 'pointer',
                      color: IS_GOLDEN_TICKET_FREEMIUM ? BRAND.bgDeep : BRAND.heirloom,
                      fontFamily: FONTS.display, fontWeight: 800,
                      fontSize: 13, letterSpacing: '0.16em', textTransform: 'uppercase',
                      boxShadow: IS_GOLDEN_TICKET_FREEMIUM
                        ? `0 12px 28px ${BRAND.mazorca}66`
                        : `0 12px 28px ${BRAND.pod}55`,
                    }}>
                      {IS_GOLDEN_TICKET_FREEMIUM ? '✓ Adoptar gratis' : `✓ Adoptar por $${TREE_ADOPTION_PRICE_USD}`}
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
                      {IS_GOLDEN_TICKET_FREEMIUM
                        ? 'Tu adopción cuenta como hito 1 de 4 del Camino del Creyente.'
                        : 'Pago se despliega 60/30/10 vía Coinbase Onramp.'}
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

            {/* Idle: swipe hints + historia territorial */}
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
                <div style={{ fontSize: 11, color: `${BRAND.heirloom}33`, marginBottom: 16 }}>
                  🫘 +10 granos · 🌽 +3 mazorcas al adoptar
                </div>

                {/* Lee la historia · contexto territorial del Guardián. Le da al
                    usuario el "a quién le llega el impacto" antes de adoptar. */}
                {guardian.blogSlug && (
                  <button
                    onClick={() => navigate(`/blog/${guardian.blogSlug}`)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      background: 'transparent',
                      border: `1px solid ${BRAND.pod}66`,
                      borderRadius: 999,
                      padding: '9px 18px',
                      cursor: 'pointer',
                      color: BRAND.pod,
                      fontFamily: FONTS.display, fontWeight: 700, fontSize: 11,
                      letterSpacing: '0.12em', textTransform: 'uppercase',
                      transition: 'border-color 0.2s, background 0.2s',
                    }}
                  >
                    <span style={{ fontSize: 13 }}>📰</span>
                    <span>
                      La historia de {guardian.name}
                      <span style={{ color: `${BRAND.heirloom}66`, fontWeight: 400, marginLeft: 6, letterSpacing: '0.04em', textTransform: 'none' }}>
                        · {guardian.town}, {guardian.region}
                      </span>
                    </span>
                    <span style={{ fontSize: 12, color: BRAND.pod }}>→</span>
                  </button>
                )}
              </div>
            )}

            {/* Confirming overlay lives ON the card now (above) — no separate
                panel below to avoid the disconnected confirm button. */}
          </>
        )}
      </div>

      {/* Golden Ticket explainer modal — 4 hitos del Camino del Creyente */}
      {showGTModal && (
        <div
          onClick={() => setShowGTModal(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(4, 12, 6, 0.86)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 'clamp(16px, 4vw, 32px)',
            animation: 'caua-gt-modal-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 520, width: '100%',
              background: `linear-gradient(160deg, #2A0F26 0%, ${BRAND.bgDeep} 100%)`,
              border: `1.5px solid ${BRAND.mazorca}`,
              borderRadius: 18,
              padding: 'clamp(20px, 4vw, 32px)',
              boxShadow: `0 24px 64px rgba(0, 0, 0, 0.6), 0 0 32px ${BRAND.mazorca}33`,
              maxHeight: '90vh', overflowY: 'auto',
            }}
          >
            <div style={{
              fontFamily: FONTS.display, fontWeight: 700, fontSize: 10,
              color: BRAND.mazorca, letterSpacing: '0.25em', textTransform: 'uppercase',
              marginBottom: 8, textAlign: 'center',
            }}>
              🎟️ Golden Ticket
            </div>
            <h2 style={{
              fontFamily: FONTS.display, fontWeight: 900,
              fontSize: 'clamp(24px, 5vw, 32px)',
              color: BRAND.heirloom, letterSpacing: '0.02em',
              textTransform: 'uppercase', textAlign: 'center',
              margin: '0 0 6px', lineHeight: 1,
            }}>
              Camino del Creyente
            </h2>
            <p style={{
              fontFamily: FONTS.serif, fontStyle: 'italic',
              color: `${BRAND.heirloom}99`, fontSize: 13,
              textAlign: 'center', margin: '0 0 22px', lineHeight: 1.4,
            }}>
              Cumple los 4 hitos y compite por <strong style={{ color: BRAND.mazorca }}>1 de 30 cupos</strong> a la Cacao Ceremony 100% gratis.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
              {GOLDEN_TICKET_HITOS.map((h) => {
                const isFirst = h.n === 1
                return (
                  <div key={h.n} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 14,
                    background: isFirst ? `${BRAND.mazorca}14` : `${BRAND.heirloom}08`,
                    border: `1px solid ${isFirst ? BRAND.mazorca : `${BRAND.heirloom}22`}`,
                    borderRadius: 12,
                    padding: '12px 14px',
                  }}>
                    <div style={{
                      flexShrink: 0,
                      width: 32, height: 32, borderRadius: '50%',
                      background: isFirst ? BRAND.mazorca : `${BRAND.heirloom}11`,
                      color: isFirst ? BRAND.bgDeep : `${BRAND.heirloom}88`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: FONTS.display, fontWeight: 900, fontSize: 14,
                    }}>
                      {h.n}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontFamily: FONTS.display, fontWeight: 800, fontSize: 13,
                        color: isFirst ? BRAND.mazorca : BRAND.heirloom,
                        letterSpacing: '0.06em', textTransform: 'uppercase',
                        marginBottom: 2,
                      }}>
                        {h.label}
                      </div>
                      <div style={{
                        fontFamily: FONTS.body, fontSize: 12,
                        color: `${BRAND.heirloom}99`, lineHeight: 1.4,
                      }}>
                        {h.hint}
                      </div>
                    </div>
                    {isFirst && (
                      <div style={{
                        flexShrink: 0,
                        fontFamily: FONTS.display, fontWeight: 800, fontSize: 9,
                        color: BRAND.mazorca, letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        alignSelf: 'center',
                      }}>
                        Aquí ↓
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <button
              onClick={() => setShowGTModal(false)}
              style={{
                width: '100%', padding: '14px',
                background: `linear-gradient(135deg, ${BRAND.mazorca}, ${BRAND.pod})`,
                border: 'none', borderRadius: 999, cursor: 'pointer',
                color: BRAND.bgDeep,
                fontFamily: FONTS.display, fontWeight: 800,
                fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase',
                boxShadow: `0 12px 28px ${BRAND.mazorca}55`,
              }}
            >
              Continuar adopción →
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes caua-gt-ribbon-pulse {
          0%, 100% { box-shadow: 0 0 14px ${BRAND.mazorca}55; }
          50%      { box-shadow: 0 0 24px ${BRAND.mazorca}aa; }
        }
        @keyframes caua-gt-modal-in {
          0%   { opacity: 0; transform: scale(0.96); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
