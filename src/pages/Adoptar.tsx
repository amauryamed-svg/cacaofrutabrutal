import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCocoaTrees } from '../hooks/useCocoaTrees'
import { useLineageRegenerations } from '../hooks/useLineageRegenerations'
import { useTokenBalance } from '../hooks/useTokenBalance'
import TokenReward from '../components/ritual/TokenReward'
import {
  BRAND, FONTS, GUARDIANS, TOKEN_RATES,
  TREE_ADOPTION_PRICE_USD,
} from '../utils/constants'
import {
  isTreeDead, isDying, needsAttention, isHarvestReady,
  getStageByHours, hoursSinceAdoption, getCycleProgress,
} from '../utils/growthSystem'

type Phase = 'select' | 'confirm' | 'adopting' | 'done'

const IS_GOLDEN_TICKET_FREEMIUM = import.meta.env.VITE_GOLDEN_TICKET_FREEMIUM === 'true'

// ── Particle seed (CSS-only burst on adoption) ────────────────────────────────
const SEED_COUNT = 16
const SEEDS = Array.from({ length: SEED_COUNT }, (_, i) => ({
  angle: (360 / SEED_COUNT) * i,
  dist:  80 + Math.random() * 80,
  delay: Math.random() * 0.2,
  emoji: ['🌱', '🫘', '🌿', '🍃'][i % 4],
}))

export default function Adoptar() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const [searchParams] = useSearchParams()
  const { trees, loading: treesLoading, adoptTree } = useCocoaTrees()
  const { findByGuardian: findRegen } = useLineageRegenerations()
  const { beans, mazorcas } = useTokenBalance()

  const initialGuardian = (() => {
    const g = Number(searchParams.get('guardian'))
    return Number.isInteger(g) && g >= 0 && g < GUARDIANS.length ? g : 0
  })()

  const [phase,       setPhase]       = useState<Phase>('select')
  const [activeIdx,   setActiveIdx]   = useState(initialGuardian)
  const [tokenReward, setTokenReward] = useState<{ beans: number; mazorcas: number } | null>(null)
  const [burst,       setBurst]       = useState(false)

  const guardian = GUARDIANS[activeIdx]

  // Annotate trees
  const annotated = trees.map(t => {
    const dead  = isTreeDead(t)
    const dying = !dead && isDying(t)
    const warn  = !dead && needsAttention(t)
    const ready = !dead && isHarvestReady(t)
    const stage = getStageByHours(hoursSinceAdoption(t.adopted_at))
    const pct   = getCycleProgress(t.adopted_at) * 100
    return { t, dead, dying, warn, ready, stage, pct }
  })
  const aliveTrees = annotated.filter(x => !x.dead)
  const deadTrees  = annotated.filter(x =>  x.dead)
  const readyCount = aliveTrees.filter(x => x.ready).length

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
      setBurst(true)
      setPhase('done')
      setTimeout(() => setTokenReward(null), 3000)
      setTimeout(() => setBurst(false),      1200)
    } catch (err) {
      alert(`No se pudo adoptar: ${err instanceof Error ? err.message : 'Error desconocido'}`)
      setPhase('select')
    }
  }

  // Inject Press Start 2P for game labels
  useEffect(() => {
    const id = 'ps2p'
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id; link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap'
    document.head.appendChild(link)
  }, [])

  return (
    <div style={{ background: BRAND.bgDeep, minHeight: '100vh', paddingTop: 'calc(var(--nav-h, 60px) + 0px)' }}>

      {/* ── Stats HUD ────────────────────────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 'var(--nav-h, 60px)', zIndex: 10,
        background: `${BRAND.bgDeep}ee`, backdropFilter: 'blur(8px)',
        borderBottom: `1px solid ${BRAND.amazon}44`,
        display: 'flex', justifyContent: 'center', gap: 0,
      }}>
        {[
          { icon: '🫘', label: 'BEANS',     val: beans.toFixed(0),              color: BRAND.pod    },
          { icon: '🌽', label: 'MAZORCAS',  val: mazorcas.toString(),            color: BRAND.mazorca },
          { icon: '🌱', label: 'ÁRBOLES',   val: aliveTrees.length.toString(),   color: BRAND.heroic  },
          { icon: '🍫', label: 'LISTOS',     val: readyCount.toString(),          color: readyCount > 0 ? BRAND.mazorca : `${BRAND.heirloom}33` },
        ].map(s => (
          <div key={s.label} style={{
            flex: 1, textAlign: 'center', padding: '8px 4px',
            borderRight: `1px solid ${BRAND.amazon}33`,
          }}>
            <div style={{ fontSize: 14, lineHeight: 1 }}>{s.icon}</div>
            <div style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 9, color: s.color, lineHeight: 1.6,
              marginTop: 2,
            }}>{s.val}</div>
            <div style={{
              fontFamily: FONTS.display, fontSize: 7,
              letterSpacing: '0.2em', color: `${BRAND.heirloom}33`,
              textTransform: 'uppercase',
            }}>{s.label}</div>
          </div>
        ))}
      </div>

      {tokenReward && <TokenReward beans={tokenReward.beans} mazorcas={tokenReward.mazorcas} />}

      {/* ── Done state ───────────────────────────────────────────────── */}
      {phase === 'done' && (
        <div style={{ position: 'relative', maxWidth: 480, margin: '0 auto', padding: '40px clamp(20px,5vw,40px)', textAlign: 'center' }}>

          {/* Particle burst */}
          {burst && (
            <div style={{ position: 'absolute', top: '20%', left: '50%', pointerEvents: 'none', zIndex: 20 }}>
              {SEEDS.map((s, i) => (
                <div key={i} style={{
                  position: 'absolute',
                  fontSize: 16,
                  animation: `seed-burst-${i} 1s cubic-bezier(0.1, 0.8, 0.3, 1) ${s.delay}s both`,
                  '--dx': `${Math.cos(s.angle * Math.PI / 180) * s.dist}px`,
                  '--dy': `${Math.sin(s.angle * Math.PI / 180) * s.dist}px`,
                } as React.CSSProperties}>
                  {s.emoji}
                </div>
              ))}
            </div>
          )}

          <div style={{ fontSize: 72, marginBottom: 8, animation: 'tree-drop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both' }}>🌱</div>

          <div style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 'clamp(12px, 3vw, 16px)',
            color: BRAND.pod,
            lineHeight: 1.6,
            marginBottom: 6,
            textShadow: `0 0 20px ${BRAND.pod}88`,
          }}>
            ÁRBOL<br />ADOPTADO!
          </div>

          <div style={{
            fontFamily: FONTS.display, fontWeight: 800,
            fontSize: 12, letterSpacing: '0.2em',
            color: BRAND.mazorca, marginBottom: 20,
            textTransform: 'uppercase',
          }}>
            +{TOKEN_RATES.tree_adoption.beans} BEANS · +{TOKEN_RATES.tree_adoption.mazorcas} MAZORCAS
          </div>

          {/* Achievement card */}
          <div style={{
            background: `linear-gradient(160deg, #2A0F26 0%, ${BRAND.bgDeep} 100%)`,
            border: `1.5px solid ${BRAND.mazorca}`,
            borderRadius: 16, padding: 'clamp(16px, 4vw, 24px)',
            marginBottom: 20,
            boxShadow: `0 0 32px ${BRAND.mazorca}33`,
            animation: 'slide-up 0.5s cubic-bezier(0.34, 1.4, 0.64, 1) 0.3s both',
          }}>
            <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 9, color: BRAND.mazorca, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 6 }}>
              🎁 Tu reward inmediato CAÚA
            </div>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 800, fontSize: 'clamp(18px,4vw,26px)', color: BRAND.heirloom, letterSpacing: '0.08em', marginBottom: 8 }}>
              RedimeCacao10K
            </div>
            <div style={{ fontFamily: FONTS.body, fontSize: 12, color: `${BRAND.heirloom}cc`, lineHeight: 1.5, marginBottom: 14 }}>
              $10.000 COP de Gift Card · canjeable en cauacolombia.co
            </div>
            <a
              href="https://cauacolombia.co/discount/RedimeCacao10K?redirect=/products/cacao-ceremonial-250gr-origen-hobo-huila"
              target="_blank" rel="noopener noreferrer"
              style={{
                display: 'block', background: BRAND.mazorca, color: BRAND.bgDeep,
                padding: '12px 18px', borderRadius: 999, textDecoration: 'none',
                fontFamily: FONTS.display, fontWeight: 800, fontSize: 11,
                letterSpacing: '0.16em', textTransform: 'uppercase', textAlign: 'center',
              }}
            >
              Canjear en CAÚA Colombia →
            </a>
          </div>

          <button
            onClick={() => { setTokenReward(null); setPhase('select') }}
            style={{
              background: 'transparent', color: `${BRAND.heirloom}55`,
              border: `1px solid ${BRAND.heirloom}22`, borderRadius: 999,
              padding: '10px 24px', cursor: 'pointer',
              fontFamily: FONTS.display, fontWeight: 700, fontSize: 10,
              letterSpacing: '0.16em', textTransform: 'uppercase',
            }}
          >
            Continuar →
          </button>
        </div>
      )}

      {/* ── Character Select + Confirm ────────────────────────────────── */}
      {(phase === 'select' || phase === 'confirm' || phase === 'adopting') && (
        <div style={{ maxWidth: 540, margin: '0 auto', padding: '0 clamp(16px,5vw,32px) clamp(40px,8vw,80px)', paddingTop: 52 }}>

          {/* Title */}
          <div style={{ textAlign: 'center', paddingTop: 28, paddingBottom: 20 }}>
            <p style={{ fontFamily: FONTS.serif, fontStyle: 'italic', color: BRAND.pod, fontSize: 12, letterSpacing: '0.25em', marginBottom: 8 }}>
              cacao fruta brutal
            </p>
            <h1 style={{
              fontFamily: FONTS.display, fontWeight: 900,
              fontSize: 'clamp(36px, 9vw, 60px)', color: BRAND.heirloom,
              textTransform: 'uppercase', margin: '0 0 6px', lineHeight: 0.92,
            }}>
              Adopta un<br /><span style={{ color: BRAND.pod }}>árbol de cacao</span>
            </h1>

            {IS_GOLDEN_TICKET_FREEMIUM && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: `${BRAND.mazorca}18`, border: `1.5px solid ${BRAND.mazorca}`,
                borderRadius: 999, padding: '6px 14px', marginTop: 10,
                animation: 'hud-pulse 2.4s ease-in-out infinite',
              }}>
                <span style={{ fontSize: 13 }}>🎟️</span>
                <span style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 10, color: BRAND.mazorca, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                  Adopta gratis · Golden Ticket activo
                </span>
              </div>
            )}
          </div>

          {/* ── CHARACTER SELECT ───────────────────────────────────────── */}
          <div style={{ marginBottom: 24 }}>
            <div style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 7, color: `${BRAND.heirloom}44`,
              letterSpacing: '0.16em', textTransform: 'uppercase',
              textAlign: 'center', marginBottom: 12,
            }}>
              — SELECT YOUR GUARDIAN —
            </div>

            {/* Guardian cards row */}
            <div style={{
              display: 'flex', gap: 10, overflowX: 'auto',
              paddingBottom: 6, scrollSnapType: 'x mandatory',
              scrollbarWidth: 'none',
            }}>
              {GUARDIANS.map((g, i) => {
                const isActive = i === activeIdx
                const ownedHere = aliveTrees.filter(x => x.t.guardian_id === i).length
                return (
                  <button
                    key={i}
                    onClick={() => { setActiveIdx(i); if (phase === 'confirm') setPhase('select') }}
                    style={{
                      flexShrink: 0, scrollSnapAlign: 'start',
                      width: isActive ? 100 : 78,
                      padding: isActive ? '14px 8px' : '10px 6px',
                      background: isActive
                        ? `linear-gradient(160deg, ${BRAND.pod}22, ${BRAND.bgCard})`
                        : BRAND.bgCard,
                      border: `2px solid ${isActive ? BRAND.pod : BRAND.amazon + '55'}`,
                      borderRadius: 14, cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                      boxShadow: isActive ? `0 0 20px ${BRAND.pod}44` : 'none',
                      transform: isActive ? 'translateY(-4px)' : 'none',
                      transition: 'all 0.22s cubic-bezier(0.34, 1.4, 0.64, 1)',
                    }}
                  >
                    <div style={{
                      fontSize: isActive ? 44 : 32,
                      filter: isActive ? `drop-shadow(0 4px 12px ${BRAND.pod}88)` : 'none',
                      transition: 'font-size 0.22s',
                    }}>
                      {g.emoji}
                    </div>
                    <div style={{
                      fontFamily: FONTS.display, fontWeight: 800,
                      fontSize: isActive ? 11 : 9,
                      color: isActive ? BRAND.heirloom : `${BRAND.heirloom}77`,
                      letterSpacing: '0.06em', textTransform: 'uppercase',
                      lineHeight: 1,
                    }}>
                      {g.name}
                    </div>
                    <div style={{
                      fontFamily: FONTS.body, fontSize: 8,
                      color: isActive ? BRAND.pod : `${BRAND.heirloom}33`,
                      letterSpacing: '0.04em',
                    }}>
                      {g.region.split(' ')[0]}
                    </div>
                    {ownedHere > 0 && (
                      <div style={{
                        fontFamily: "'Press Start 2P', monospace",
                        fontSize: 6, color: BRAND.mazorca,
                        background: `${BRAND.mazorca}18`, borderRadius: 4,
                        padding: '2px 5px',
                      }}>
                        ×{ownedHere}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── SELECTED GUARDIAN DETAIL ─────────────────────────────── */}
          {phase === 'select' && (
            <div style={{
              background: `linear-gradient(160deg, ${BRAND.amazon}33 0%, ${BRAND.bgCard} 100%)`,
              border: `1px solid ${BRAND.pod}55`,
              borderRadius: 20, padding: 'clamp(18px, 4vw, 28px)',
              marginBottom: 20,
              boxShadow: `0 0 32px ${BRAND.pod}22`,
              animation: 'slide-up 0.3s cubic-bezier(0.34, 1.4, 0.64, 1) both',
            }}>
              {/* Guardian header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <div style={{ fontSize: 56, filter: `drop-shadow(0 8px 20px ${BRAND.pod}66)`, flexShrink: 0 }}>
                  {guardian.emoji}
                </div>
                <div>
                  <div style={{
                    fontFamily: FONTS.display, fontWeight: 900,
                    fontSize: 'clamp(22px, 5vw, 28px)', color: BRAND.heirloom,
                    textTransform: 'uppercase', lineHeight: 1,
                  }}>
                    {guardian.name}
                  </div>
                  <div style={{ fontFamily: FONTS.serif, fontStyle: 'italic', color: BRAND.pod, fontSize: 13, marginTop: 4 }}>
                    {guardian.region}
                  </div>
                  <div style={{ fontFamily: FONTS.body, fontSize: 11, color: `${BRAND.heirloom}55`, marginTop: 2 }}>
                    {guardian.varieties.join(' · ')}
                  </div>
                </div>
              </div>

              {/* Stats bars */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
                {[
                  { label: 'IMPACTO',    val: 85, color: BRAND.pod     },
                  { label: 'RAREZA',     val: [92, 78, 65, 88, 72][activeIdx], color: BRAND.criollo },
                  { label: 'VARIEDAD',   val: guardian.varieties.length * 30, color: BRAND.mazorca },
                  { label: 'TERROIR',    val: [90, 75, 80, 70, 85][activeIdx], color: BRAND.heroic  },
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6, color: `${BRAND.heirloom}55`, letterSpacing: '0.1em' }}>
                        {s.label}
                      </span>
                      <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6, color: s.color }}>
                        {s.val}
                      </span>
                    </div>
                    <div style={{ height: 5, background: `${BRAND.amazon}66`, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        width: `${s.val}%`, height: '100%',
                        background: s.color,
                        borderRadius: 3,
                        boxShadow: `0 0 6px ${s.color}88`,
                        transition: 'width 0.6s cubic-bezier(0.34, 1.4, 0.64, 1)',
                      }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Lineage regen badge */}
              {(() => {
                const regen = findRegen(activeIdx)
                if (!regen) return null
                const expDate = new Date(regen.expires_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
                return (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: `${BRAND.pod}22`, border: `1px solid ${BRAND.pod}aa`,
                    borderRadius: 999, padding: '5px 12px', marginBottom: 14,
                    animation: 'hud-pulse 2.4s ease-in-out infinite',
                  }}>
                    <span style={{ fontSize: 12 }}>🌱</span>
                    <span style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 9, color: BRAND.pod, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                      Lineage regenerado · vence {expDate}
                    </span>
                  </div>
                )
              })()}

              {/* Price + adopt button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  {IS_GOLDEN_TICKET_FREEMIUM ? (
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 16, color: `${BRAND.heirloom}44`, textDecoration: 'line-through' }}>
                        ${TREE_ADOPTION_PRICE_USD}
                      </span>
                      <span style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 28, color: BRAND.mazorca, textShadow: `0 4px 16px ${BRAND.mazorca}66` }}>
                        GRATIS
                      </span>
                    </div>
                  ) : (
                    <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 28, color: BRAND.mazorca }}>
                      ${TREE_ADOPTION_PRICE_USD} <span style={{ fontSize: 12, color: `${BRAND.heirloom}55`, fontWeight: 700 }}>USD</span>
                    </div>
                  )}
                  <div style={{ fontFamily: FONTS.body, fontSize: 10, color: `${BRAND.heirloom}55`, marginTop: 2 }}>
                    +{TOKEN_RATES.tree_adoption.beans} beans · +{TOKEN_RATES.tree_adoption.mazorcas} mazorcas
                  </div>
                </div>

                <button
                  onClick={() => user ? setPhase('confirm') : navigate('/auth')}
                  style={{
                    padding: '14px 22px', borderRadius: 12,
                    background: `linear-gradient(135deg, ${BRAND.pod}, ${BRAND.amazon})`,
                    border: 'none', cursor: 'pointer',
                    color: BRAND.heirloom,
                    fontFamily: FONTS.display, fontWeight: 900, fontSize: 12,
                    letterSpacing: '0.14em', textTransform: 'uppercase',
                    boxShadow: `0 8px 24px ${BRAND.pod}55`,
                    transition: 'transform 0.15s, box-shadow 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.boxShadow = `0 12px 32px ${BRAND.pod}77` }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = `0 8px 24px ${BRAND.pod}55` }}
                >
                  {IS_GOLDEN_TICKET_FREEMIUM ? '✓ ADOPTAR GRATIS' : `✓ ADOPTAR`}
                </button>
              </div>

              {guardian.blogSlug && (
                <button
                  onClick={() => navigate(`/blog/${guardian.blogSlug}`)}
                  style={{
                    marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    color: `${BRAND.pod}88`, fontFamily: FONTS.body, fontSize: 11,
                  }}
                >
                  📰 La historia de {guardian.name} →
                </button>
              )}
            </div>
          )}

          {/* ── CONFIRM OVERLAY ────────────────────────────────────────── */}
          {phase === 'confirm' && (
            <div style={{
              background: `linear-gradient(160deg, ${BRAND.amazon} 0%, #091a10 50%, ${BRAND.bgDeep} 100%)`,
              border: `1.5px solid ${BRAND.pod}88`,
              borderRadius: 20, padding: 'clamp(20px,5vw,32px)',
              marginBottom: 20, textAlign: 'center',
              boxShadow: `0 0 40px ${BRAND.pod}33`,
              animation: 'slide-up 0.35s cubic-bezier(0.34, 1.4, 0.64, 1) both',
            }}>
              <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 9, color: BRAND.pod, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 12 }}>
                {IS_GOLDEN_TICKET_FREEMIUM ? '🎟️ Hito 1 de 4 · Camino del Creyente' : 'Confirma tu adopción'}
              </div>

              <div style={{ fontSize: 64, marginBottom: 10, filter: `drop-shadow(0 12px 24px ${BRAND.pod}55)` }}>
                {guardian.emoji}
              </div>
              <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 24, color: BRAND.heirloom, textTransform: 'uppercase' }}>
                {guardian.name}
              </div>
              <div style={{ fontFamily: FONTS.serif, fontStyle: 'italic', color: BRAND.mazorca, fontSize: 13, marginTop: 4, marginBottom: 16 }}>
                {guardian.region} · {guardian.varieties[0]}
              </div>

              {IS_GOLDEN_TICKET_FREEMIUM ? (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, justifyContent: 'center', marginBottom: 20 }}>
                  <span style={{ fontFamily: FONTS.display, fontSize: 18, color: `${BRAND.heirloom}44`, textDecoration: 'line-through' }}>${TREE_ADOPTION_PRICE_USD} USD</span>
                  <span style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 40, color: BRAND.mazorca, textShadow: `0 4px 24px ${BRAND.mazorca}66` }}>GRATIS</span>
                </div>
              ) : (
                <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 40, color: BRAND.mazorca, marginBottom: 20 }}>
                  ${TREE_ADOPTION_PRICE_USD}<span style={{ fontSize: 14, color: `${BRAND.heirloom}55`, marginLeft: 6, fontWeight: 700 }}>USD</span>
                </div>
              )}

              <button
                onClick={confirmAdoption}
                style={{
                  width: '100%', padding: '16px',
                  background: IS_GOLDEN_TICKET_FREEMIUM
                    ? `linear-gradient(135deg, ${BRAND.mazorca}, ${BRAND.pod})`
                    : `linear-gradient(135deg, ${BRAND.pod}, ${BRAND.amazon})`,
                  border: 'none', borderRadius: 999, cursor: 'pointer',
                  color: BRAND.bgDeep,
                  fontFamily: FONTS.display, fontWeight: 900,
                  fontSize: 14, letterSpacing: '0.16em', textTransform: 'uppercase',
                  boxShadow: `0 12px 28px ${BRAND.pod}55`,
                  marginBottom: 8,
                }}
              >
                {IS_GOLDEN_TICKET_FREEMIUM ? '✓ Adoptar gratis' : `✓ Adoptar por $${TREE_ADOPTION_PRICE_USD}`}
              </button>
              <button
                onClick={() => setPhase('select')}
                style={{
                  width: '100%', padding: '10px',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: `${BRAND.heirloom}55`,
                  fontFamily: FONTS.display, fontWeight: 700,
                  fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase',
                }}
              >
                ← Volver
              </button>
            </div>
          )}

          {/* ── ADOPTING SPINNER ─────────────────────────────────────── */}
          {phase === 'adopting' && (
            <div style={{
              background: BRAND.bgCard, border: `1px solid ${BRAND.pod}55`,
              borderRadius: 20, padding: '48px', textAlign: 'center', marginBottom: 20,
            }}>
              <div style={{ fontSize: 52, marginBottom: 12, animation: 'float 1.2s ease-in-out infinite' }}>
                {guardian.emoji}
              </div>
              <div style={{ fontFamily: FONTS.serif, fontStyle: 'italic', color: `${BRAND.heirloom}66`, fontSize: 14 }}>
                Plantando tu semilla...
              </div>
            </div>
          )}

          {/* ── MY GARDEN ────────────────────────────────────────────── */}
          {!treesLoading && aliveTrees.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: 7, color: `${BRAND.heirloom}44`,
                letterSpacing: '0.14em', textTransform: 'uppercase',
                textAlign: 'center', marginBottom: 14,
              }}>
                — MI JARDÍN · {aliveTrees.length} ÁRBOLES —
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(140px,100%),1fr))',
                gap: 10,
              }}>
                {aliveTrees.map(({ t, dead: _d, dying, warn, ready, stage, pct }) => {
                  const g = GUARDIANS[t.guardian_id]
                  const isOnChain = t.nft_mint_tx != null
                  const color = dying ? '#e74c3c'
                               : ready ? BRAND.mazorca
                               : warn  ? BRAND.theobroma
                               : BRAND.pod
                  const statusLabel = dying ? 'VA A MORIR'
                                    : ready ? 'COSECHAR!'
                                    : warn  ? 'ATENCIÓN'
                                    : stage.name.toUpperCase()
                  const statusIcon = dying ? '💀'
                                   : ready ? '🍫'
                                   : warn  ? '⚠️'
                                   : stage.emoji
                  const lvl = stage.id + 1
                  const blockFilled = Math.round(Math.min(pct, 100) / 100 * 8)
                  const blockBar = '■'.repeat(blockFilled) + '□'.repeat(8 - blockFilled)

                  return (
                    <div
                      key={t.id}
                      style={{
                        background: `linear-gradient(160deg, ${color}14, ${BRAND.bgCard})`,
                        border: `2px solid ${color}${ready || dying ? 'cc' : '55'}`,
                        borderRadius: 6, padding: '10px 8px',
                        display: 'flex', flexDirection: 'column', gap: 5,
                        textAlign: 'left',
                        boxShadow: ready ? `0 0 16px ${color}44`
                                 : dying ? `0 0 12px ${color}44` : 'none',
                        animation: ready ? 'ready-glow 1.4s ease-in-out infinite'
                                 : dying ? 'dying-pulse 1s ease-in-out infinite'
                                 : 'none',
                        position: 'relative',
                        outline: `1px solid ${BRAND.bgDeep}`,
                        outlineOffset: -3,
                      }}
                    >
                      {/* LV badge — top left */}
                      <div style={{
                        position: 'absolute', top: 5, left: 6,
                        fontFamily: "'Press Start 2P', monospace", fontSize: 5,
                        color: BRAND.pod, background: BRAND.bgDeep,
                        border: `1px solid ${BRAND.pod}66`,
                        padding: '1px 4px', letterSpacing: '0.06em',
                      }}>
                        LV.{lvl}
                      </div>

                      {/* on-chain badge — top right */}
                      {isOnChain && (
                        <div style={{
                          position: 'absolute', top: 5, right: 6,
                          fontFamily: "'Press Start 2P', monospace", fontSize: 5,
                          color: BRAND.heroic, background: `${BRAND.heroic}22`,
                          border: `1px solid ${BRAND.heroic}55`,
                          padding: '1px 4px', letterSpacing: '0.1em',
                        }}>
                          ⛓ON
                        </div>
                      )}

                      {/* Status icon + name */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14 }}>
                        <span style={{ fontSize: 16, lineHeight: 1 }}>{statusIcon}</span>
                        <span style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 10, color: BRAND.heirloom, letterSpacing: '0.04em' }}>
                          {g?.name ?? 'Árbol'}
                        </span>
                      </div>

                      {/* Status label */}
                      <div style={{
                        fontFamily: "'Press Start 2P', monospace", fontSize: 6,
                        color, letterSpacing: '0.08em',
                      }}>
                        {statusLabel}
                      </div>

                      {/* Block HP bar */}
                      <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color, letterSpacing: '0.02em', lineHeight: 1 }}>
                        {blockBar}
                      </div>
                      <div style={{ fontFamily: FONTS.body, fontSize: 7, color: `${BRAND.heirloom}33` }}>
                        {Math.round(pct)}% ciclo
                      </div>

                      {/* COSECHAR button for ready trees */}
                      {ready && (
                        <button
                          onClick={e => { e.stopPropagation(); navigate(`/tree/${t.id}`) }}
                          style={{
                            marginTop: 4, width: '100%', padding: '6px 4px',
                            background: BRAND.mazorca, border: 'none',
                            cursor: 'pointer',
                            fontFamily: "'Press Start 2P', monospace", fontSize: 6,
                            color: BRAND.bgDeep, letterSpacing: '0.08em',
                            boxShadow: `0 0 10px ${BRAND.mazorca}66`,
                          }}
                          onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.93)' }}
                          onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)' }}
                        >
                          COSECHAR →
                        </button>
                      )}
                      {/* Navigate to detail on the whole card */}
                      {!ready && (
                        <button
                          onClick={() => navigate(`/tree/${t.id}`)}
                          style={{
                            position: 'absolute', inset: 0, background: 'transparent',
                            border: 'none', cursor: 'pointer',
                          }}
                          aria-label={`Ver árbol de ${g?.name}`}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Dead trees */}
          {!treesLoading && deadTrees.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: 7, color: '#e74c3c88',
                letterSpacing: '0.14em', textTransform: 'uppercase',
                textAlign: 'center', marginBottom: 10,
              }}>
                — LABRANZA · {deadTrees.length} —
              </div>
              <button
                onClick={() => navigate('/dashboard#labranza')}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                  background: `linear-gradient(135deg, #1a0606 0%, ${BRAND.pod}22 100%)`,
                  border: `1px solid ${BRAND.pod}66`, borderRadius: 14,
                  padding: '14px 18px', cursor: 'pointer',
                  boxShadow: `0 0 20px ${BRAND.pod}22`,
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <div style={{ fontSize: 28, filter: `drop-shadow(0 4px 8px ${BRAND.pod}aa)` }}>⚔</div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 12, color: BRAND.heirloom, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                    Rebanar con machete →
                  </div>
                  <div style={{ fontFamily: FONTS.body, fontSize: 10, color: `${BRAND.heirloom}77`, marginTop: 3 }}>
                    Fruit-Ninja arena · +10 granos × {deadTrees.length}
                  </div>
                </div>
                <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 18, color: BRAND.pod }}>▶</div>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Global keyframes ─────────────────────────────────────────── */}
      <style>{`
        @keyframes hud-pulse {
          0%, 100% { box-shadow: 0 0 14px ${BRAND.mazorca}44; }
          50%       { box-shadow: 0 0 26px ${BRAND.mazorca}88; }
        }
        @keyframes dying-pulse {
          0%, 100% { box-shadow: 0 0 10px #e74c3c55; opacity: 1; }
          50%       { box-shadow: 0 0 20px #e74c3caa; opacity: 0.85; }
        }
        @keyframes ready-glow {
          0%, 100% { box-shadow: 0 0 8px ${BRAND.mazorca}44; }
          50%       { box-shadow: 0 0 22px ${BRAND.mazorca}aa; }
        }
        @keyframes slide-up {
          0%   { opacity: 0; transform: translateY(16px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes tree-drop {
          0%   { opacity: 0; transform: scale(0.4) translateY(-40px); }
          70%  { transform: scale(1.15) translateY(6px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-8px); }
        }
        ${SEEDS.map((s, i) => `
          @keyframes seed-burst-${i} {
            0%   { opacity: 1; transform: translate(0,0) scale(1); }
            80%  { opacity: 0.6; transform: translate(${Math.cos(s.angle * Math.PI / 180) * s.dist}px, ${Math.sin(s.angle * Math.PI / 180) * s.dist}px) scale(1.2) rotate(${s.angle}deg); }
            100% { opacity: 0; transform: translate(${Math.cos(s.angle * Math.PI / 180) * (s.dist + 20)}px, ${Math.sin(s.angle * Math.PI / 180) * (s.dist + 20)}px) scale(0.6); }
          }
        `).join('')}
        @keyframes gt-ribbon-pulse {
          0%, 100% { box-shadow: 0 0 12px ${BRAND.mazorca}44; }
          50%       { box-shadow: 0 0 22px ${BRAND.mazorca}88; }
        }
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}
