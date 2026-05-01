import { useEffect, useState } from 'react'
import { BRAND, FONTS, TOKEN_RATES } from '../../utils/constants'
import HarvestMacheteArena, { type HarvestArenaResult } from './HarvestMacheteArena'

/**
 * HarvestMinigameModal — wraps the Fruit-Ninja harvest arena in a brutalist
 * full-screen modal. Two paths to grant the harvest:
 *   - completionPath: user slices all N mazorcas → arena fires onComplete
 *     with totals (mucilage_g, cacao_mass_g, optional combo bonus)
 *   - skipPath:      user clicks "Cosechar instantáneamente" → modal fires
 *     onComplete with baseline rewards only (no mucilage/cacao_mass)
 *
 * The MODAL never calls the server itself — it just emits onComplete and
 * lets the parent (CauaGotchi / TreeDetail) hit the award-tokens Edge
 * Function. Closing the modal mid-game without completing or skipping
 * leaves the tree harvest-ready (parent fires nothing).
 */

export interface HarvestMinigamePayload {
  via:               'minigame' | 'instant'
  beans:             number
  mazorcas:          number
  mucilage_g:        number
  cacao_mass_g:      number
  pods_sliced:       number
  pods_total:        number
  combo_bonus:       boolean
  /** Where the user wants to go AFTER the harvest fires server-side.
   *  Parent component handles the actual navigation. null/absent = stay
   *  on the current page. */
  next_route?:       'marketplace_redeem' | 'dashboard_impact' | null
}

interface Props {
  isOpen:        boolean
  onClose:       () => void
  /** Fires when the user has earned a harvest (either path). The wrapper
   *  is responsible for closing the modal afterward. */
  onComplete:    (payload: HarvestMinigamePayload) => void
  treeId:        string
  guardianName:  string
  variety:       string
  region:        string
  lang?:         'es' | 'en'
}

type Phase = 'arena' | 'summary'

export default function HarvestMinigameModal(props: Props) {
  // The minigame state lives in <Inner> which is only mounted while open.
  // This makes state reset naturally on each open/close cycle without
  // calling setState inside a useEffect (react-hooks/set-state-in-effect).
  if (!props.isOpen) return null
  // Re-key on treeId so opening the modal for a different tree reloads the
  // arena (different pod layout, fresh combo timer).
  return <Inner key={props.treeId} {...props} />
}

function Inner({
  onClose, onComplete,
  treeId, guardianName, variety, region,
  lang = 'es',
}: Omit<Props, 'isOpen'>) {
  const [phase, setPhase]     = useState<Phase>('arena')
  const [result, setResult]   = useState<HarvestArenaResult | null>(null)
  const [skipping, setSkipping] = useState(false)

  // Lock body scroll for the lifetime of the modal mount.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  const handleArenaComplete = (r: HarvestArenaResult) => {
    setResult(r)
    setPhase('summary')
  }

  const handleSkip = () => {
    if (skipping) return
    setSkipping(true)
    const baseBeans    = TOKEN_RATES.tree_harvest_share.beans
    const baseMazorcas = TOKEN_RATES.tree_harvest_share.mazorcas
    onComplete({
      via:          'instant',
      beans:        baseBeans,
      mazorcas:     baseMazorcas,
      mucilage_g:   0,
      cacao_mass_g: 0,
      pods_sliced:  0,
      pods_total:   0,
      combo_bonus:  false,
    })
    onClose()
  }

  const handleClaim = (next: HarvestMinigamePayload['next_route']) => {
    if (!result) return
    onComplete({
      via:          'minigame',
      beans:        result.beans_override,
      mazorcas:     result.mazorcas_override,
      mucilage_g:   result.mucilage_g,
      cacao_mass_g: result.cacao_mass_g,
      pods_sliced:  result.pods_sliced,
      pods_total:   result.pods_total,
      combo_bonus:  result.combo_bonus,
      next_route:   next,
    })
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={lang === 'es' ? 'Cosecha de cacao' : 'Cocoa harvest'}
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
        background: 'rgba(4, 12, 6, 0.85)',
        backdropFilter: 'blur(8px)',
        animation: 'caua-harvest-modal-in 0.25s ease-out',
      }}
    >
      <div style={{
        width: 'min(560px, 100%)',
        maxHeight: 'calc(100vh - 32px)',
        background: `linear-gradient(160deg, #0E1E15 0%, #040C06 100%)`,
        border: `1px solid ${BRAND.mazorca}66`,
        borderRadius: 16,
        boxShadow: `0 24px 60px #00000099, 0 0 80px ${BRAND.mazorca}22`,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '14px 16px',
          borderBottom: `1px solid ${BRAND.amazon}66`,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
        }}>
          <div>
            <div style={{
              fontFamily: FONTS.display, fontWeight: 700, fontSize: 9,
              color: BRAND.mazorca, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 4,
            }}>
              {lang === 'es' ? 'Cosecha · Fruit Ninja' : 'Harvest · Fruit Ninja'}
            </div>
            <div style={{
              fontFamily: FONTS.display, fontWeight: 900, fontSize: 18,
              color: BRAND.heirloom, letterSpacing: '0.04em', textTransform: 'uppercase',
              lineHeight: 1,
            }}>
              {guardianName}
            </div>
            <div style={{
              fontFamily: FONTS.serif, fontStyle: 'italic',
              color: BRAND.mazorca, fontSize: 12, marginTop: 4, letterSpacing: '0.06em',
            }}>
              {region} · {variety}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={lang === 'es' ? 'Cerrar sin cosechar' : 'Close without harvesting'}
            style={{
              background: 'transparent', border: `1px solid ${BRAND.heirloom}33`,
              color: `${BRAND.heirloom}aa`,
              borderRadius: 999, padding: '4px 10px', cursor: 'pointer',
              fontFamily: FONTS.display, fontSize: 12, fontWeight: 700,
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 16, overflowY: 'auto' }}>
          {phase === 'arena' && (
            <HarvestMacheteArena
              treeId={treeId}
              guardianName={guardianName}
              onComplete={handleArenaComplete}
              lang={lang}
            />
          )}

          {phase === 'summary' && result && (
            <HarvestSummary result={result} lang={lang} />
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 16px',
          borderTop: `1px solid ${BRAND.amazon}66`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          {phase === 'arena' ? (
            <>
              <span style={{
                fontFamily: FONTS.serif, fontStyle: 'italic',
                color: `${BRAND.heirloom}66`, fontSize: 11,
              }}>
                {lang === 'es'
                  ? 'Rebana las mazorcas para llenar la botella + el tanque.'
                  : 'Slice the pods to fill the bottle + tank.'}
              </span>
              <button
                onClick={handleSkip}
                disabled={skipping}
                style={{
                  background: 'transparent', border: 'none', cursor: skipping ? 'wait' : 'pointer',
                  color: `${BRAND.heirloom}99`,
                  fontFamily: FONTS.display, fontWeight: 700, fontSize: 10,
                  letterSpacing: '0.16em', textTransform: 'uppercase',
                  textDecoration: 'underline', textUnderlineOffset: 4,
                  opacity: skipping ? 0.6 : 1,
                  flexShrink: 0,
                }}
              >
                {lang === 'es' ? 'Cosechar instantáneo →' : 'Instant harvest →'}
              </button>
            </>
          ) : (
            // Summary footer — three CTAs that all confirm the harvest server-side
            // and then route the user to the most natural next step. The harvest
            // payload (with next_route) goes to the parent which fires award-tokens
            // and then navigate(). Stack vertically so each is full-width on mobile.
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                onClick={() => handleClaim('marketplace_redeem')}
                style={{
                  width: '100%',
                  background: `linear-gradient(135deg, ${BRAND.mazorca}, ${BRAND.brown})`,
                  color: BRAND.bgDeep,
                  border: 'none', borderRadius: 999,
                  padding: '14px 18px', cursor: 'pointer',
                  fontFamily: FONTS.display, fontWeight: 800, fontSize: 13,
                  letterSpacing: '0.16em', textTransform: 'uppercase',
                  boxShadow: `0 12px 28px ${BRAND.mazorca}55`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                <span style={{ fontSize: 18 }}>🍫</span>
                {lang === 'es' ? 'Canjear mazorcas por chocolate →' : 'Redeem mazorcas for chocolate →'}
              </button>
              <button
                onClick={() => handleClaim('dashboard_impact')}
                style={{
                  width: '100%',
                  background: 'transparent',
                  color: BRAND.pod,
                  border: `1px solid ${BRAND.pod}aa`,
                  borderRadius: 999,
                  padding: '12px 18px', cursor: 'pointer',
                  fontFamily: FONTS.display, fontWeight: 700, fontSize: 12,
                  letterSpacing: '0.14em', textTransform: 'uppercase',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                <span style={{ fontSize: 16 }}>📊</span>
                {lang === 'es' ? 'Ver mi jardín + impacto →' : 'View my garden + impact →'}
              </button>
              <button
                onClick={() => handleClaim(null)}
                style={{
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: `${BRAND.heirloom}66`,
                  fontFamily: FONTS.display, fontWeight: 700, fontSize: 10,
                  letterSpacing: '0.16em', textTransform: 'uppercase',
                  padding: '4px 8px',
                }}
              >
                {lang === 'es' ? '← Volver al árbol' : '← Back to tree'}
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes caua-harvest-modal-in {
          from { opacity: 0; transform: scale(0.97); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}

// ─── Summary screen ───────────────────────────────────────────────────────

function HarvestSummary({ result, lang }: { result: HarvestArenaResult; lang: 'es' | 'en' }) {
  const rows: Array<{ icon: string; label: string; value: string; color: string }> = [
    { icon: '🫘', label: lang === 'es' ? 'Granos'   : 'Beans',     value: `+${result.beans_override.toFixed(1)}`,       color: BRAND.pod     },
    { icon: '🌽', label: lang === 'es' ? 'Mazorcas' : 'Mazorcas',  value: `+${result.mazorcas_override.toFixed(1)}`,    color: BRAND.mazorca },
    { icon: '🟢', label: lang === 'es' ? 'Mucílago' : 'Mucilage',  value: `+${result.mucilage_g.toFixed(0)} g`,         color: BRAND.pod     },
    { icon: '🟤', label: lang === 'es' ? 'Masa cacao' : 'Cacao mass', value: `+${result.cacao_mass_g.toFixed(0)} g`,    color: BRAND.brown   },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '8px 4px' }}>
      <div style={{ textAlign: 'center', paddingTop: 8 }}>
        <div style={{ fontSize: 56 }}>🍫</div>
        <div style={{
          fontFamily: FONTS.display, fontWeight: 900, fontSize: 22,
          color: result.combo_bonus ? '#FFE9A8' : BRAND.heirloom,
          letterSpacing: '0.04em', textTransform: 'uppercase',
          textShadow: result.combo_bonus ? `0 0 24px ${BRAND.mazorca}88` : 'none',
        }}>
          {result.combo_bonus
            ? (lang === 'es' ? '¡Cosecha perfecta!' : 'Perfect harvest!')
            : (lang === 'es' ? 'Cosecha completa' : 'Harvest complete')}
        </div>
        <div style={{
          fontFamily: FONTS.serif, fontStyle: 'italic',
          color: `${BRAND.heirloom}88`, fontSize: 12, marginTop: 4,
        }}>
          {lang === 'es'
            ? `Rebanaste ${result.pods_sliced} de ${result.pods_total} mazorcas`
            : `You sliced ${result.pods_sliced} of ${result.pods_total} pods`}
          {result.combo_bonus && (
            <> · <strong style={{ color: BRAND.mazorca }}>+{TOKEN_RATES.tree_harvest_share.combo_bonus_pct}% bonus</strong></>
          )}
        </div>
      </div>

      <div style={{
        background: `${BRAND.bgCard}`,
        border: `1px solid ${BRAND.amazon}aa`,
        borderRadius: 12,
        padding: 14,
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 10,
      }}>
        {rows.map(r => (
          <div key={r.label} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 10px',
            background: `${r.color}11`,
            border: `1px solid ${r.color}44`,
            borderRadius: 10,
          }}>
            <span style={{ fontSize: 22 }}>{r.icon}</span>
            <div>
              <div style={{
                fontFamily: FONTS.display, fontWeight: 700, fontSize: 9,
                color: `${BRAND.heirloom}88`, letterSpacing: '0.16em', textTransform: 'uppercase',
              }}>
                {r.label}
              </div>
              <div style={{
                fontFamily: FONTS.display, fontWeight: 900, fontSize: 16,
                color: r.color,
              }}>
                {r.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{
        fontFamily: FONTS.serif, fontStyle: 'italic',
        color: `${BRAND.heirloom}66`, fontSize: 11, lineHeight: 1.6, textAlign: 'center',
      }}>
        {lang === 'es'
          ? 'El mucílago + masa de cacao se acumulan en tu inventario. Visítalos en /lab para fabricar chocolate.'
          : 'Mucilage + cacao mass go into your inventory. Visit /lab to make chocolate.'}
      </div>
    </div>
  )
}
