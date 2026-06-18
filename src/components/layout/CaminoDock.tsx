/**
 * CaminoDock · sticky bottom bar showing the 4-hito journey + user's progress.
 *
 * Mounted on Phase 1 surfaces (Adoptar / TreeDetail / MiLaboratorio / Ritual).
 * Hidden on Phase 2 surfaces (Fondo / Marketplace / Web3 / Blog / Dashboard).
 *
 * Hitos del Journey Caúa (canónicos · ver MiLaboratorio.tsx:402):
 *   1 ADOPTAR  → /adoptar
 *   2 CUIDAR   → /tree/{first-tree-id} (fallback /adoptar)
 *   3 COSECHAR → /tree/{ready-tree-id} (fallback /adoptar)
 *   4 FORJAR   → /lab
 * + Output  REDIME → /marketplace (in-app $CACAO redemption)
 *
 * Estado por hito:
 *   - done   : cumplido (chip con check ✓ + verde mazorca)
 *   - active : próximo paso (chip con pulse + dorado)
 *   - locked : pendiente (chip atenuado)
 */

import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useCocoaTrees } from '../../hooks/useCocoaTrees'
import { useTokenBalance } from '../../hooks/useTokenBalance'
import { isHarvestReady } from '../../utils/growthSystem'
import { BRAND, FONTS } from '../../utils/constants'

type HitoState = 'done' | 'active' | 'locked'

interface HitoSpec {
  n: number
  emoji: string
  label: string
  to: () => string
}

export default function CaminoDock() {
  const navigate = useNavigate()
  const location = useLocation()
  const { trees, loading } = useCocoaTrees()
  const { chocolateBarsMade } = useTokenBalance()

  // Manage body bottom padding so page content isn't hidden under the dock.
  useEffect(() => {
    const prev = document.body.style.paddingBottom
    document.body.style.paddingBottom = 'calc(env(safe-area-inset-bottom, 0px) + 92px)'
    return () => { document.body.style.paddingBottom = prev }
  }, [])

  if (loading) return null

  // ── Compute hito completion ──────────────────────────────────────────
  const hasTree     = trees.length > 0
  const hasCared    = trees.some(t => !!t.last_update_at)
  const hasHarvest  = trees.some(t => !!t.harvested_at)
  const hasForged   = chocolateBarsMade > 0
  const doneCount   = [hasTree, hasCared, hasHarvest, hasForged].filter(Boolean).length
  const journeyPct  = Math.min(100, (doneCount / 4) * 100)

  const firstTree   = trees[0]
  const readyTree   = trees.find(t => isHarvestReady(t)) ?? firstTree

  const states: HitoState[] = [
    hasTree    ? 'done' : 'active',
    hasCared   ? 'done' : (hasTree    ? 'active' : 'locked'),
    hasHarvest ? 'done' : (hasCared   ? 'active' : 'locked'),
    hasForged  ? 'done' : (hasHarvest ? 'active' : 'locked'),
  ]

  const HITOS: HitoSpec[] = [
    { n: 1, emoji: '🌱', label: 'Adoptar',  to: () => '/adoptar' },
    { n: 2, emoji: '💧', label: 'Cuidar',   to: () => firstTree ? `/tree/${firstTree.id}` : '/adoptar' },
    { n: 3, emoji: '🍫', label: 'Cosechar', to: () => readyTree ? `/tree/${readyTree.id}` : '/adoptar' },
    { n: 4, emoji: '⚗️', label: 'Forjar',   to: () => '/lab' },
  ]

  const currentPath = location.pathname
  const isOnHitoSurface = (idx: number) => {
    if (idx === 0) return currentPath.startsWith('/adoptar')
    if (idx === 1 || idx === 2) return currentPath.startsWith('/tree/')
    if (idx === 3) return currentPath.startsWith('/lab')
    return false
  }

  return (
    <>
      <nav
        aria-label="Camino del Creyente"
        style={{
          position: 'fixed', left: 0, right: 0, bottom: 0,
          zIndex: 80,
          background: `${BRAND.bgDeep}f5`,
          borderTop: `1px solid ${BRAND.mazorca}55`,
          backdropFilter: 'blur(16px)',
          padding: 'clamp(8px, 1.5vw, 12px) clamp(8px, 2vw, 16px) calc(env(safe-area-inset-bottom, 0px) + clamp(8px, 1.5vw, 12px))',
          boxShadow: `0 -8px 32px rgba(0, 0, 0, 0.5)`,
        }}
      >
        {/* Videogame-style HUD progress bar — viaje del cacao a su destino */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: 2, background: `${BRAND.mazorca}22`,
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', width: `${journeyPct}%`,
            background: `linear-gradient(90deg, ${BRAND.pod}, ${BRAND.mazorca})`,
            boxShadow: `0 0 8px ${BRAND.mazorca}aa`,
            transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
          }} />
        </div>

        {/* Eyebrow micro — frame del viaje */}
        <div style={{
          textAlign: 'center', marginBottom: 4,
          fontFamily: FONTS.display, fontWeight: 700,
          fontSize: 8, letterSpacing: '0.22em',
          color: `${BRAND.mazorca}99`, textTransform: 'uppercase',
        }}>
          🎮 CAMINO DEL CACAO · {doneCount}/4 HITOS · DESTINO: $CACAO
        </div>

        <div style={{
          maxWidth: 720, margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr) auto',
          gap: 'clamp(4px, 1vw, 8px)',
          alignItems: 'stretch',
        }}>
          {HITOS.map((h, idx) => {
            const state = states[idx]
            const onSurface = isOnHitoSurface(idx)
            const stateColor =
              state === 'done'   ? BRAND.pod :
              state === 'active' ? BRAND.mazorca :
                                   `${BRAND.heirloom}33`
            const labelColor =
              state === 'locked' ? `${BRAND.heirloom}55` :
              onSurface          ? BRAND.heirloom :
                                   `${BRAND.heirloom}cc`

            return (
              <button
                key={h.n}
                onClick={() => navigate(h.to())}
                aria-current={onSurface ? 'page' : undefined}
                style={{
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: 2,
                  background: onSurface ? `${stateColor}1a` : 'transparent',
                  border: `1px solid ${onSurface ? stateColor : `${stateColor}55`}`,
                  borderRadius: 10,
                  padding: '6px 4px',
                  cursor: 'pointer',
                  minHeight: 48,
                  transition: 'background 0.2s, border-color 0.2s',
                  position: 'relative',
                  animation: state === 'active' && !onSurface ? 'caua-camino-pulse 2.4s ease-in-out infinite' : 'none',
                }}
              >
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: 'clamp(13px, 2.5vw, 16px)',
                }}>
                  <span style={{ opacity: state === 'locked' ? 0.4 : 1 }}>{h.emoji}</span>
                  {state === 'done' && (
                    <span style={{
                      fontSize: 9, color: BRAND.pod,
                      fontFamily: FONTS.display, fontWeight: 900,
                    }}>✓</span>
                  )}
                </div>
                <span style={{
                  fontFamily: FONTS.display, fontWeight: 800,
                  fontSize: 'clamp(8px, 1.6vw, 10px)',
                  color: labelColor, letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}>
                  {h.n}·{h.label}
                </span>
              </button>
            )
          })}

          {/* Output: $CACAO in-app redemption → /marketplace */}
          <button
            onClick={() => navigate('/marketplace')}
            data-cta-name="cfb-camino-dock-redime"
            data-cta-surface="camino-dock"
            aria-label="Quema $CACAO en el Mercado Caúa"
            style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 2,
              background: hasForged
                ? `linear-gradient(135deg, #8D2679, #D05527)`
                : '#8D267914',
              border: `1px solid #8D2679${hasForged ? 'ff' : '66'}`,
              borderRadius: 10,
              padding: '6px 10px',
              minHeight: 48,
              cursor: 'pointer',
              boxShadow: hasForged ? `0 0 18px #8D267988` : 'none',
            }}
          >
            <span style={{ fontSize: 'clamp(13px, 2.5vw, 16px)' }}>◈</span>
            <span style={{
              fontFamily: FONTS.display, fontWeight: 900,
              fontSize: 'clamp(8px, 1.6vw, 10px)',
              color: hasForged ? '#F7F1EE' : '#8D2679',
              letterSpacing: '0.08em', textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}>
              REDIME
            </span>
          </button>
        </div>
      </nav>
      <style>{`
        @keyframes caua-camino-pulse {
          0%, 100% { box-shadow: 0 0 12px ${BRAND.mazorca}33; }
          50%      { box-shadow: 0 0 20px ${BRAND.mazorca}77; }
        }
      `}</style>
    </>
  )
}
