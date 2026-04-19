import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCocoaTrees } from '../hooks/useCocoaTrees'
import TokenReward from '../components/ritual/TokenReward'
import { BRAND, FONTS, GUARDIANS, TOKEN_RATES } from '../utils/constants'
import type { Guardian } from '../types'

type Phase = 'idle' | 'confirming' | 'adopting' | 'done'

function GuardianCard({ guardian, dim }: { guardian: Guardian; dim?: boolean }) {
  return (
    <div style={{
      width: 'min(240px, 65vw)',
      aspectRatio: '2/3',
      borderRadius: 18,
      background: `linear-gradient(160deg, ${BRAND.amazon} 0%, #091a10 60%, ${BRAND.bgDeep} 100%)`,
      border: `2px solid ${BRAND.pod}55`,
      boxShadow: `0 24px 56px rgba(0,0,0,0.6), 0 0 0 1px ${BRAND.pod}22`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '28px 16px 20px',
      opacity: dim ? 0.5 : 1,
      transition: 'opacity 0.4s',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Glow */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `radial-gradient(ellipse 120px 100px at 50% 30%, ${BRAND.pod}14, transparent)`,
      }} />

      {/* Top label */}
      <div style={{
        fontSize: 10, letterSpacing: '0.18em', color: `${BRAND.pod}cc`,
        fontFamily: FONTS.display, fontWeight: 700, textTransform: 'uppercase',
        zIndex: 1,
      }}>
        Guardián del Cacao
      </div>

      {/* Emoji */}
      <div style={{
        fontSize: 'clamp(56px, 18vw, 72px)',
        filter: `drop-shadow(0 8px 24px ${BRAND.pod}44)`,
        zIndex: 1,
      }}>
        {guardian.emoji}
      </div>

      {/* Name + region */}
      <div style={{ textAlign: 'center', zIndex: 1 }}>
        <div style={{
          fontFamily: FONTS.display, fontWeight: 900, fontSize: 22,
          color: BRAND.heirloom, lineHeight: 1, marginBottom: 6,
          textTransform: 'uppercase',
        }}>
          {guardian.name}
        </div>
        <div style={{ fontSize: 11, color: `${BRAND.heirloom}66`, marginBottom: 8 }}>
          📍 {guardian.town}
        </div>
        <span style={{
          background: `${BRAND.pod}33`, color: BRAND.pod,
          padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700,
        }}>
          🧬 {guardian.varieties[0]}
        </span>
      </div>
    </div>
  )
}

export default function Adoptar() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const { trees, loading: treesLoading, adoptTree } = useCocoaTrees()

  const [phase,       setPhase]       = useState<Phase>('idle')
  const [activeIdx,   setActiveIdx]   = useState(0)
  const [tokenReward, setTokenReward] = useState<{ beans: number; mazorcas: number } | null>(null)

  const guardian = GUARDIANS[activeIdx]

  const prev = () => setActiveIdx(i => (i - 1 + GUARDIANS.length) % GUARDIANS.length)
  const next = () => setActiveIdx(i => (i + 1) % GUARDIANS.length)

  const confirmAdoption = async () => {
    if (!user) { navigate('/auth'); return }
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
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      alert(`No se pudo adoptar: ${msg}`)
      setPhase('idle')
    }
  }

  return (
    <div style={{ background: '#040C06', minHeight: '100vh', paddingTop: 80 }}>

      {/* Header */}
      <div style={{ maxWidth: 640, margin: '0 auto', padding: 'clamp(24px,5vw,40px) 20px 0', textAlign: 'center' }}>
        <p style={{
          fontFamily: FONTS.serif, fontStyle: 'italic',
          color: BRAND.pod, fontSize: 13, letterSpacing: '0.25em', marginBottom: 10,
        }}>
          cacao fruta brutal
        </p>
        <h1 style={{
          fontFamily: FONTS.display, fontWeight: 900,
          fontSize: 'clamp(40px,10vw,68px)', color: BRAND.heirloom,
          textTransform: 'uppercase', margin: '0 0 12px', lineHeight: 0.9,
        }}>
          Adopta un<br />
          <span style={{ color: BRAND.pod }}>árbol de cacao</span>
        </h1>
        <p style={{
          fontFamily: FONTS.body, color: `${BRAND.heirloom}66`,
          fontSize: 14, lineHeight: 1.65, maxWidth: 400, margin: '0 auto 20px',
        }}>
          Elige tu Guardián del Cacao Criollo colombiano. Cuida tu árbol {' '}
          <span style={{ color: BRAND.mazorca }}>cada 3 horas durante 5 días</span> y
          observa su ciclo de vida completo.
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
      <div style={{
        maxWidth: 480, margin: '0 auto',
        padding: '0 20px clamp(48px,8vw,80px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
      }}>

        {/* Token reward overlay */}
        {tokenReward && <TokenReward beans={tokenReward.beans} mazorcas={tokenReward.mazorcas} />}

        {/* Guardian card */}
        <div style={{ filter: `drop-shadow(0 24px 56px ${BRAND.pod}33)` }}>
          <GuardianCard guardian={guardian} dim={phase === 'adopting'} />
        </div>

        {/* Prev / dot / next */}
        {phase !== 'adopting' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={prev} style={{
              background: `${BRAND.amazon}88`, border: `1px solid ${BRAND.pod}44`,
              borderRadius: 999, width: 36, height: 36, cursor: 'pointer',
              color: BRAND.pod, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>←</button>

            <div style={{ display: 'flex', gap: 6 }}>
              {GUARDIANS.map((_, i) => (
                <div key={i} onClick={() => setActiveIdx(i)} style={{
                  width: i === activeIdx ? 18 : 6, height: 6, borderRadius: 3,
                  background: i === activeIdx ? BRAND.pod : `${BRAND.heirloom}33`,
                  cursor: 'pointer', transition: 'width 0.3s, background 0.3s',
                }} />
              ))}
            </div>

            <button onClick={next} style={{
              background: `${BRAND.amazon}88`, border: `1px solid ${BRAND.pod}44`,
              borderRadius: 999, width: 36, height: 36, cursor: 'pointer',
              color: BRAND.pod, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>→</button>
          </div>
        )}

        {/* ── IDLE: guardian info + adopt CTA ── */}
        {phase === 'idle' && (
          <div className="animate-fade-in-up" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Variety benefit */}
            <div style={{
              background: '#0D1A10', border: `1px solid ${BRAND.pod}33`,
              borderRadius: 14, padding: '18px 20px',
            }}>
              <div style={{
                fontFamily: FONTS.display, fontWeight: 700, fontSize: 10,
                color: BRAND.pod, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8,
              }}>
                {guardian.varieties[0]} · Fine Flavor
              </div>
              <p style={{
                fontFamily: FONTS.serif, fontStyle: 'italic',
                color: `${BRAND.heirloom}cc`, fontSize: 14, lineHeight: 1.7, margin: '0 0 12px',
              }}>
                "{guardian.variety_benefit.split('.')[0]}."
              </p>
              <div style={{ fontSize: 11, color: BRAND.pod, fontWeight: 600 }}>
                {guardian.heritage}
              </div>
            </div>

            {/* Market uses */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {guardian.market_uses.map(u => (
                <span key={u} style={{
                  background: `${BRAND.amazon}66`, color: `${BRAND.heirloom}88`,
                  padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 600,
                }}>{u}</span>
              ))}
            </div>

            {/* Tokens hint */}
            <div style={{ textAlign: 'center', fontSize: 11, color: BRAND.mazorca }}>
              🫘 +10 granos · 🌽 +3 mazorcas al adoptar
            </div>

            {/* Adopt CTA */}
            <button onClick={() => user ? setPhase('confirming') : navigate('/auth')} style={{
              background: `linear-gradient(135deg, ${BRAND.pod}, ${BRAND.amazon})`,
              color: BRAND.heirloom, border: 'none',
              padding: '15px 32px', borderRadius: 999,
              fontFamily: FONTS.display, fontWeight: 700,
              fontSize: 14, letterSpacing: '0.15em', cursor: 'pointer',
              textTransform: 'uppercase',
            }}>
              🌱 Adoptar a {guardian.name.split(' ')[0]}
            </button>
          </div>
        )}

        {/* ── CONFIRMING ── */}
        {phase === 'confirming' && (
          <div className="animate-fade-in-up" style={{ width: '100%' }}>
            <div style={{
              background: '#0D1A10', border: `1px solid ${BRAND.pod}44`,
              borderRadius: 14, padding: '20px',
            }}>
              <div style={{
                fontFamily: FONTS.display, fontWeight: 700, fontSize: 10,
                color: BRAND.pod, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 12,
              }}>
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

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={confirmAdoption} style={{
                  flex: 2, padding: '13px', borderRadius: 10,
                  background: `${BRAND.pod}22`, border: `1px solid ${BRAND.pod}66`,
                  color: BRAND.pod, cursor: 'pointer',
                  fontFamily: FONTS.display, fontWeight: 700,
                  fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase',
                }}>
                  ✓ Confirmar adopción
                </button>
                <button onClick={() => setPhase('idle')} style={{
                  flex: 1, padding: '13px', borderRadius: 10,
                  background: '#132B1C', border: `1px solid ${BRAND.amazon}66`,
                  color: `${BRAND.heirloom}66`, cursor: 'pointer',
                  fontFamily: FONTS.display, fontWeight: 700,
                  fontSize: 12, letterSpacing: '0.1em',
                }}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── ADOPTING ── */}
        {phase === 'adopting' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: FONTS.serif, fontStyle: 'italic',
              color: `${BRAND.heirloom}80`, fontSize: 13,
            }}>
              Plantando tu semilla...
            </div>
          </div>
        )}

        {/* ── DONE ── */}
        {phase === 'done' && (
          <div className="animate-fade-in-up" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🌱</div>
            <div style={{
              fontFamily: FONTS.display, fontWeight: 900, fontSize: 22,
              color: BRAND.pod, letterSpacing: '0.05em',
            }}>
              ¡Árbol adoptado!
            </div>
            <p style={{ fontFamily: FONTS.body, color: `${BRAND.heirloom}66`, fontSize: 13, marginTop: 8 }}>
              Cuídalo cada 3 horas para verlo crecer.
            </p>
          </div>
        )}

      </div>
    </div>
  )
}
