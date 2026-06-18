import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { BRAND, FONTS, TOKEN_RATES } from '../utils/constants'
import { useAuth } from '../context/AuthContext'
import { useTokenBalance } from '../hooks/useTokenBalance'
import { useLang } from '../context/LangContext'
import { supabase } from '../lib/supabase'
import LiofilizadoStage from '../components/lab/LiofilizadoStage'
import RefinadoStage    from '../components/lab/RefinadoStage'
import ConchadoStage    from '../components/lab/ConchadoStage'
import GrageaStage      from '../components/lab/GrageaStage'

/**
 * MiLaboratorio (/lab) — chocolate-making minigame (Phase 3).
 *
 * 3 sequential stages — only the next one unlocks when the previous
 * completes. After all 3 done, the page calls forge-chocolate Edge Function
 * which atomically debits 300g mucílago + 250g masa de cacao and increments
 * chocolate_bars_made (off-chain counter; Phase 4 mints an NFT).
 *
 * Entry gate:
 *   - Must be authenticated (redirects to /auth if not)
 *   - Must have ≥ 300g mucílago AND ≥ 250g masa de cacao before "Iniciar"
 *
 * Phases:
 *   - 'idle'      → recipe + Iniciar button
 *   - 'liofilizado' → stage 1
 *   - 'refinado'    → stage 2
 *   - 'conchado'    → stage 3
 *   - 'forging'   → forge-chocolate request in flight
 *   - 'done'      → success screen with bar count
 *   - 'error'     → forge failed (e.g. resources changed mid-flow)
 */

const RECIPE = TOKEN_RATES.chocolate_made  // { mucilage_g: 300, cacao_mass_g: 250 }
const FORGE_BEANS_REWARD = 25

type Phase = 'idle' | 'liofilizado' | 'refinado' | 'conchado' | 'gragea' | 'forging' | 'done' | 'error'

interface StageStamps {
  liofilizado_at?: string
  refinado_at?:    string
  conchado_at?:    string
  gragea_at?:      string
}

interface FreshHarvestState {
  mucilage_g:   number
  cacao_mass_g: number
  beans:        number
  mazorcas:     number
  via:          'instant' | 'minigame'
  tree_id:      string
  award_ok:     boolean
  error:        string | null
}

export default function MiLaboratorio() {
  const { user } = useAuth()
  const { lang } = useLang()
  const navigate = useNavigate()
  const location = useLocation()
  const { mucilageG, cacaoMassG, chocolateBarsMade, loading } = useTokenBalance()

  const [phase, setPhase] = useState<Phase>('idle')
  const [stamps, setStamps] = useState<StageStamps>({})
  const [error, setError] = useState<string | null>(null)

  // CRM360 · post-harvest feedback. Read deltas from location state passed
  // by TreeDetail.submitHarvest and show as a transient toast so the user
  // confirms what was credited (vs the polled balance below).
  const freshHarvest = (location.state as { freshHarvest?: FreshHarvestState } | null)?.freshHarvest
  const [showFreshToast, setShowFreshToast] = useState<boolean>(Boolean(freshHarvest))
  useEffect(() => {
    if (!showFreshToast) return
    const t = setTimeout(() => setShowFreshToast(false), 6000)
    return () => clearTimeout(t)
  }, [showFreshToast])

  const canForge = mucilageG >= RECIPE.mucilage_g && cacaoMassG >= RECIPE.cacao_mass_g
  const mucilageDeficit  = Math.max(0, RECIPE.mucilage_g - mucilageG)
  const cacaoMassDeficit = Math.max(0, RECIPE.cacao_mass_g - cacaoMassG)

  const startForge = () => {
    if (!user) { navigate('/auth'); return }
    if (!canForge) return
    setPhase('liofilizado')
    setStamps({})
    setError(null)
  }

  const onLiofilizadoDone = () => {
    setStamps(s => ({ ...s, liofilizado_at: new Date().toISOString() }))
    setTimeout(() => setPhase('refinado'), 600)
  }
  const onRefinadoDone = () => {
    setStamps(s => ({ ...s, refinado_at: new Date().toISOString() }))
    setTimeout(() => setPhase('conchado'), 600)
  }
  const onConchadoDone = () => {
    setStamps(s => ({ ...s, conchado_at: new Date().toISOString() }))
    setTimeout(() => setPhase('gragea'), 600)
  }

  const onGrageaDone = async () => {
    const finalStamps = { ...stamps, conchado_at: stamps.conchado_at ?? new Date().toISOString(), gragea_at: new Date().toISOString() }
    setStamps(finalStamps)
    setPhase('forging')

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token
      if (!token) {
        setError('login_required')
        setPhase('error')
        return
      }
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/forge-chocolate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ stage_completion: finalStamps }),
        },
      )
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.ok) {
        setError(typeof json?.error === 'string' ? json.error : `http_${res.status}`)
        setPhase('error')
        return
      }
      setPhase('done')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'network_error')
      setPhase('error')
    }
  }

  const reset = () => {
    setPhase('idle')
    setStamps({})
    setError(null)
  }

  return (
    <div style={{ background: BRAND.bgDeep, minHeight: '100vh', paddingTop: 'calc(var(--nav-h, 60px) + 24px)', paddingBottom: '5rem' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 var(--space-page)' }}>

        {/* CRM360 · Post-harvest feedback toast (6s · auto-dismiss) ─────
            Confirma al user qué se acaba de creditar. Si award_ok=false,
            muestra el error para diagnosticar. Si via='instant' (skip),
            informa que no hay mucílago/masa porque no rebanó pods. */}
        {showFreshToast && freshHarvest && (
          <div style={{
            marginBottom: 16,
            background: freshHarvest.error
              ? `linear-gradient(135deg, #2A0F0F, #150606)`
              : `linear-gradient(135deg, ${BRAND.amazon}aa, #0E1E15)`,
            border: `1px solid ${freshHarvest.error ? '#e74c3c' : BRAND.pod}`,
            borderRadius: 12,
            padding: '14px 18px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ fontSize: 28 }}>{freshHarvest.error ? '⚠️' : freshHarvest.via === 'instant' ? '⏭️' : '🍫'}</div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: FONTS.display, fontWeight: 800, fontSize: 11,
                color: freshHarvest.error ? '#e74c3c' : BRAND.pod,
                letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 4,
              }}>
                {freshHarvest.error
                  ? 'Crédito pendiente · revisa consola'
                  : freshHarvest.via === 'instant'
                    ? 'Skip al laboratorio'
                    : 'Cosecha acreditada'}
              </div>
              <div style={{ fontFamily: FONTS.body, fontSize: 13, color: `${BRAND.heirloom}cc`, lineHeight: 1.4 }}>
                {freshHarvest.error
                  ? freshHarvest.error
                  : freshHarvest.via === 'instant'
                    ? `+${freshHarvest.beans.toFixed(0)} granos · +${freshHarvest.mazorcas.toFixed(0)} mazorcas. Para forjar necesitas rebanar pods (no skip) y obtener mucílago + masa.`
                    : `+${freshHarvest.mucilage_g.toFixed(0)}g mucílago · +${freshHarvest.cacao_mass_g.toFixed(0)}g masa · +${freshHarvest.beans.toFixed(0)} granos · +${freshHarvest.mazorcas.toFixed(0)} mazorcas`}
              </div>
            </div>
            <button
              onClick={() => setShowFreshToast(false)}
              aria-label="Cerrar aviso"
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: `${BRAND.heirloom}66`, fontSize: 18, padding: 4,
              }}
            >✕</button>
          </div>
        )}

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <p style={{ fontFamily: FONTS.serif, fontStyle: 'italic', color: BRAND.mazorca, fontSize: 13, letterSpacing: '0.25em', marginBottom: 8 }}>
            cacao fruta brutal
          </p>
          <h1 style={{
            fontFamily: FONTS.display, fontWeight: 900,
            fontSize: 'clamp(38px, 9vw, 64px)', color: BRAND.heirloom,
            textTransform: 'uppercase', margin: '0 0 10px', lineHeight: 0.9,
          }}>
            Mi <span style={{ color: BRAND.mazorca }}>Laboratorio</span>
          </h1>
          <p style={{ fontFamily: FONTS.body, color: `${BRAND.heirloom}88`, fontSize: 13, lineHeight: 1.6, maxWidth: 480, margin: '0 auto' }}>
            {lang === 'es'
              ? 'Liofiliza · Refina · Conchea. Tu mucílago y masa de cacao se convierten en ◈ $CACAO — misma moneda, mismo contrato en Base.'
              : 'Lyophilize · Refine · Conch. Your mucilage and cacao mass convert to ◈ $CACAO — same token, same contract on Base.'}
          </p>
        </div>

        {/* Balance pills */}
        {phase === 'idle' && (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 12, marginBottom: 24,
          }}>
            <BalancePill icon="🟢" label={lang === 'es' ? 'Mucílago' : 'Mucilage'} value={`${mucilageG.toFixed(0)}g`} color={BRAND.pod} loading={loading} need={RECIPE.mucilage_g} have={mucilageG} />
            <BalancePill icon="🟤" label={lang === 'es' ? 'Masa cacao' : 'Cacao mass'} value={`${cacaoMassG.toFixed(0)}g`} color={BRAND.brown} loading={loading} need={RECIPE.cacao_mass_g} have={cacaoMassG} />
            <BalancePill icon="◈" label={lang === 'es' ? '$CACAO forjado' : '$CACAO forged'} value={`${chocolateBarsMade}`} color={BRAND.criollo} loading={loading} />
          </div>
        )}

        {/* Recipe card — visible in idle */}
        {phase === 'idle' && (
          <div style={{
            background: `linear-gradient(160deg, #0E1E15 0%, #040C06 100%)`,
            border: `1px solid ${canForge ? BRAND.mazorca : BRAND.amazon}`,
            borderRadius: 16, padding: 'clamp(20px, 4vw, 28px)',
            marginBottom: 24,
            boxShadow: canForge ? `0 0 24px ${BRAND.mazorca}33` : 'none',
            transition: 'border-color 0.3s, box-shadow 0.3s',
          }}>
            <div style={{
              fontFamily: FONTS.display, fontWeight: 700, fontSize: 10,
              color: BRAND.criollo, letterSpacing: '0.22em',
              textTransform: 'uppercase', marginBottom: 6,
            }}>
              Receta · ◈ $CACAO
            </div>
            <div style={{
              fontFamily: FONTS.display, fontWeight: 900, fontSize: 22,
              color: BRAND.heirloom, marginBottom: 6, lineHeight: 1.1,
            }}>
              {lang === 'es'
                ? <>◈ 1 $CACAO ← <span style={{ color: BRAND.mazorca }}>{RECIPE.cacao_mass_g}g masa</span></>
                : <>◈ 1 $CACAO ← <span style={{ color: BRAND.mazorca }}>{RECIPE.cacao_mass_g}g cacao mass</span></>}
            </div>
            <div style={{
              fontFamily: FONTS.body, fontSize: 12,
              color: `${BRAND.heirloom}77`, lineHeight: 1.55, marginBottom: 14,
              fontStyle: 'italic',
            }}>
              {lang === 'es'
                ? <>+ <span style={{ color: BRAND.pod }}>{RECIPE.mucilage_g}g mucílago</span> como subproducto · MucilageExtract™ rescata el desperdicio</>
                : <>+ <span style={{ color: BRAND.pod }}>{RECIPE.mucilage_g}g mucilage</span> as byproduct · MucilageExtract™ rescues the waste</>}
            </div>
            <div style={{
              fontFamily: FONTS.body, fontSize: 12, color: `${BRAND.heirloom}aa`,
              lineHeight: 1.6, marginBottom: 18,
            }}>
              {lang === 'es'
                ? 'Tres etapas en orden — liofilización a -50°C, refinado por molido circular, conchado por mecimiento. Cada etapa desbloquea la siguiente.'
                : 'Three stages in order — lyophilization at -50°C, refining by circular grinding, conching by rocking. Each stage unlocks the next.'}
            </div>

            {!canForge && (() => {
              // Cada pod cosechado en el Fruit-Ninja arena rinde 60g mucílago + 50g masa.
              // Calculamos cuántos pods adicionales necesita el usuario para cubrir el déficit.
              const podsNeededMucilage = Math.ceil(mucilageDeficit / 60)
              const podsNeededMass     = Math.ceil(cacaoMassDeficit / 50)
              const podsNeeded         = Math.max(podsNeededMucilage, podsNeededMass)

              return (
                <div style={{
                  background: `${BRAND.heroic}11`,
                  border: `1px solid ${BRAND.heroic}55`,
                  borderRadius: 10, padding: 14, marginBottom: 14,
                  fontFamily: FONTS.body, fontSize: 12, color: `${BRAND.heirloom}cc`,
                  lineHeight: 1.6,
                }}>
                  <div>
                    {lang === 'es' ? 'Te faltan: ' : 'You need: '}
                    {mucilageDeficit > 0 && <strong>{mucilageDeficit.toFixed(0)}g mucílago</strong>}
                    {mucilageDeficit > 0 && cacaoMassDeficit > 0 && ' · '}
                    {cacaoMassDeficit > 0 && <strong>{cacaoMassDeficit.toFixed(0)}g masa de cacao</strong>}
                  </div>
                  <div style={{ marginTop: 6, fontStyle: 'italic', color: `${BRAND.heirloom}88` }}>
                    {lang === 'es'
                      ? `≈ ${podsNeeded} mazorca${podsNeeded === 1 ? '' : 's'} más en el Fruit-Ninja arena (60g mucílago + 50g masa por pod).`
                      : `≈ ${podsNeeded} more pod${podsNeeded === 1 ? '' : 's'} in the Fruit-Ninja arena (60g mucilage + 50g mass per pod).`}
                  </div>
                  <button
                    onClick={() => navigate('/adoptar')}
                    style={{
                      width: '100%', marginTop: 12,
                      padding: '10px 14px',
                      background: `linear-gradient(135deg, ${BRAND.pod}, ${BRAND.amazon})`,
                      color: BRAND.heirloom,
                      border: 'none', borderRadius: 999, cursor: 'pointer',
                      fontFamily: FONTS.display, fontWeight: 800, fontSize: 11,
                      letterSpacing: '0.16em', textTransform: 'uppercase',
                      boxShadow: `0 8px 18px ${BRAND.pod}44`,
                    }}
                  >
                    {lang === 'es' ? '🌱 Ir al Jardín · cosechar más' : '🌱 Go to Garden · harvest more'}
                  </button>
                </div>
              )
            })()}

            <button
              onClick={startForge}
              disabled={!canForge || !user}
              style={{
                width: '100%',
                padding: canForge ? '20px 18px' : '14px 18px',
                height: canForge ? 64 : 'auto',
                background: canForge
                  ? `linear-gradient(135deg, ${BRAND.criollo}, ${BRAND.theobroma})`
                  : `${BRAND.amazon}66`,
                color: canForge ? BRAND.heirloom : `${BRAND.heirloom}66`,
                border: canForge ? `2px solid ${BRAND.criollo}88` : 'none',
                borderRadius: canForge ? 8 : 999,
                cursor: canForge ? 'pointer' : 'not-allowed',
                fontFamily: "'Press Start 2P', monospace",
                fontSize: canForge ? 10 : 9,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                boxShadow: canForge ? `0 0 32px ${BRAND.criollo}44, 0 12px 28px ${BRAND.criollo}33` : 'none',
                animation: canForge ? 'forge-glow 2s ease-in-out infinite' : 'none',
                transition: 'all 0.3s',
              }}
              onMouseDown={e => { if (canForge) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.97)' }}
              onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)' }}
            >
              {!user
                ? (lang === 'es' ? 'INICIAR SESIÓN' : 'SIGN IN')
                : canForge
                  ? '⚗ FORJAR ◈ $CACAO'
                  : (lang === 'es' ? 'INSUMOS INSUFICIENTES' : 'INSUFFICIENT INPUTS')}
            </button>
          </div>
        )}

        {/* Pipeline indicator — always visible during stages */}
        {phase !== 'idle' && phase !== 'done' && phase !== 'error' && (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 6, marginBottom: 20,
          }}>
            {[
              { key: 'liofilizado' as const, label: '1·LIOFILIZACIÓN', icon: '❄' },
              { key: 'refinado'    as const, label: '2·REFINADO',      icon: '🌾' },
              { key: 'conchado'    as const, label: '3·CONCHADO',      icon: '🍫' },
              { key: 'gragea'      as const, label: '4·GRAGEA',        icon: '🔮' },
            ].map((s, i) => {
              const active = phase === s.key
              const phaseOrder = ['liofilizado','refinado','conchado','gragea','forging']
              const currentIdx = phaseOrder.indexOf(phase)
              const past = currentIdx > i
              const accent = active ? BRAND.mazorca : past ? BRAND.pod : `${BRAND.heirloom}33`
              return (
                <div key={s.key} style={{
                  padding: '10px 4px',
                  background: active ? `${BRAND.mazorca}22` : past ? `${BRAND.pod}11` : 'transparent',
                  border: `2px solid ${accent}`,
                  borderRadius: 0,
                  textAlign: 'center',
                  transform: active ? 'scale(1.06)' : 'scale(1)',
                  transition: 'all 0.3s cubic-bezier(0.34, 1.4, 0.64, 1)',
                  boxShadow: active ? `0 0 14px ${BRAND.mazorca}44` : past ? `0 0 6px ${BRAND.pod}22` : 'none',
                  opacity: !active && !past ? 0.4 : 1,
                }}>
                  <div style={{ fontSize: past ? 12 : 18, marginBottom: 4 }}>
                    {past ? '✓' : s.icon}
                  </div>
                  <div style={{
                    fontFamily: "'Press Start 2P', monospace", fontSize: 5,
                    color: accent, letterSpacing: '0.05em',
                    lineHeight: 1.4,
                  }}>
                    {s.label}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Stages */}
        {phase === 'liofilizado' && <LiofilizadoStage onComplete={onLiofilizadoDone} lang={lang} />}
        {phase === 'refinado'    && <RefinadoStage    onComplete={onRefinadoDone}    lang={lang} />}
        {phase === 'conchado'    && <ConchadoStage    onComplete={onConchadoDone}    lang={lang} />}
        {phase === 'gragea'      && <GrageaStage      onComplete={onGrageaDone}      lang={lang} />}

        {/* Forging in flight */}
        {phase === 'forging' && (
          <div style={{
            background: `linear-gradient(160deg, ${BRAND.bgCard}, #040C06)`,
            border: `1px solid ${BRAND.mazorca}aa`,
            borderRadius: 16, padding: 32,
            textAlign: 'center',
            boxShadow: `0 0 32px ${BRAND.mazorca}33`,
          }}>
            <div style={{ fontSize: 56, marginBottom: 16, animation: 'caua-forge-spin 1.6s linear infinite' }}>🍫</div>
            <div style={{
              fontFamily: FONTS.display, fontWeight: 800, fontSize: 16,
              color: BRAND.mazorca, letterSpacing: '0.16em', textTransform: 'uppercase',
            }}>
              {lang === 'es' ? 'Forjando barra…' : 'Forging bar…'}
            </div>
          </div>
        )}

        {/* Done */}
        {phase === 'done' && (
          <div style={{
            background: `linear-gradient(160deg, ${BRAND.mazorca}22 0%, #040C06 100%)`,
            border: `1px solid ${BRAND.mazorca}`,
            borderRadius: 16, padding: 'clamp(28px, 5vw, 40px)',
            textAlign: 'center',
            boxShadow: `0 0 40px ${BRAND.mazorca}55`,
          }}>
            <div style={{
              fontSize: 80, marginBottom: 16,
              fontFamily: "'Press Start 2P', monospace",
              color: BRAND.criollo,
              filter: `drop-shadow(0 0 28px ${BRAND.criollo}cc)`,
              lineHeight: 1,
              animation: 'caua-forge-spin 4s linear infinite',
            }}>◈</div>
            <div style={{
              fontFamily: "'Press Start 2P', monospace", fontSize: 12,
              color: BRAND.criollo, letterSpacing: '0.04em',
              textShadow: `0 0 24px ${BRAND.criollo}cc`, marginBottom: 12,
              lineHeight: 1.5,
            }}>
              {lang === 'es' ? '$CACAO\nFORJADO' : '$CACAO\nFORGED'}
            </div>
            <div style={{
              fontFamily: FONTS.serif, fontStyle: 'italic',
              color: `${BRAND.heirloom}aa`, fontSize: 14, marginBottom: 18,
            }}>
              {lang === 'es'
                ? `◈ ${chocolateBarsMade} $CACAO en tu balance · +${FORGE_BEANS_REWARD} granos`
                : `◈ ${chocolateBarsMade} $CACAO in your balance · +${FORGE_BEANS_REWARD} beans`}
            </div>
            <div style={{
              fontFamily: FONTS.body, fontSize: 11, color: `${BRAND.heirloom}66`,
              lineHeight: 1.6, marginBottom: 24, maxWidth: 360, margin: '0 auto 24px',
            }}>
              {lang === 'es'
                ? 'Phase 5 minteará cada $CACAO como token ERC-20 en Base. Por ahora se acumula off-chain y se sincroniza al quemar mazorcas en /burn.'
                : 'Phase 5 will mint each $CACAO as an ERC-20 token on Base. For now it accumulates off-chain and syncs when burning mazorcas at /burn.'}
            </div>

            {/* Conciencia · subproducto mucílago.
                El forge tradicionalmente sólo aprovecha la masa para el chocolate.
                300g de mucílago dulce, fragante y rico en epicatequina + teobromina
                drenan como subproducto y suelen tirarse. Educamos al usuario sobre
                este desperdicio y mostramos que CAUA lo rescata como MucilageExtract™
                + HydroSol™ — la respuesta vive en /fund (Tecnologías). */}
            <div style={{
              background: `linear-gradient(160deg, ${BRAND.pod}1a 0%, #040C06 100%)`,
              border: `1.5px dashed ${BRAND.pod}aa`,
              borderRadius: 14,
              padding: 'clamp(18px, 3.5vw, 24px)',
              marginBottom: 24,
              maxWidth: 460,
              marginLeft: 'auto', marginRight: 'auto',
              textAlign: 'left',
            }}>
              <div style={{
                fontFamily: FONTS.display, fontWeight: 700, fontSize: 10,
                color: BRAND.pod, letterSpacing: '0.22em',
                textTransform: 'uppercase', marginBottom: 8,
              }}>
                {lang === 'es' ? '💧 Subproducto · mucílago drenado' : '💧 Byproduct · mucilage drained'}
              </div>
              <div style={{
                fontFamily: FONTS.body, fontSize: 13,
                color: `${BRAND.heirloom}cc`, lineHeight: 1.55,
                marginBottom: 12,
              }}>
                {lang === 'es'
                  ? <>Tu barra usó <strong style={{ color: BRAND.mazorca }}>{RECIPE.cacao_mass_g}g de masa</strong>. Otros <strong style={{ color: BRAND.pod }}>{RECIPE.mucilage_g}g de mucílago</strong> drenaron — la pulpa dulce que rodea la semilla. <em>En cacao tradicional este mucílago se tira al suelo o al río.</em></>
                  : <>Your bar used <strong style={{ color: BRAND.mazorca }}>{RECIPE.cacao_mass_g}g of mass</strong>. Another <strong style={{ color: BRAND.pod }}>{RECIPE.mucilage_g}g of mucilage</strong> drained — the sweet pulp around the seed. <em>In traditional cacao, this mucilage gets dumped on the ground or in the river.</em></>}
              </div>
              <div style={{
                fontFamily: FONTS.display, fontWeight: 800,
                fontSize: 'clamp(14px, 3vw, 18px)',
                color: BRAND.heirloom, letterSpacing: '0.02em',
                lineHeight: 1.3, marginBottom: 14, textTransform: 'uppercase',
              }}>
                {lang === 'es' ? '¿Qué hacemos con ese desperdicio?' : 'What do we do with that waste?'}
              </div>
              <button
                onClick={() => navigate('/marketplace')}
                data-cta-name="cfb-mucilage-waste-awareness"
                data-cta-surface="lab-forge-done"
                data-cta-destination="marketplace"
                style={{
                  width: '100%',
                  background: 'transparent',
                  color: BRAND.pod,
                  border: `1.5px solid ${BRAND.pod}`,
                  padding: '11px 16px',
                  borderRadius: 999, cursor: 'pointer',
                  fontFamily: FONTS.display, fontWeight: 800,
                  fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase',
                  transition: 'background 0.2s',
                }}
              >
                {lang === 'es' ? 'Conoce las tecnologías que lo rescatan →' : 'See the technologies that rescue it →'}
              </button>
            </div>

            {/* CTA → Mercado Caúa: usa tu $CACAO */}
            <div style={{
              background: `linear-gradient(160deg, ${BRAND.heroic}18 0%, ${BRAND.bgDeep} 100%)`,
              border: `1.5px solid ${BRAND.heroic}66`,
              borderRadius: 8,
              padding: 'clamp(16px, 3vw, 22px)',
              marginBottom: 24,
              maxWidth: 460,
              marginLeft: 'auto', marginRight: 'auto',
              textAlign: 'center',
              boxShadow: `0 0 20px ${BRAND.heroic}22`,
            }}>
              <div style={{
                fontFamily: "'Press Start 2P', monospace", fontSize: 8,
                color: BRAND.heroic, letterSpacing: '0.1em',
                marginBottom: 10,
              }}>
                ◈ USA TU $CACAO
              </div>
              <div style={{
                fontFamily: FONTS.body, fontSize: 12,
                color: `${BRAND.heirloom}aa`, lineHeight: 1.55, marginBottom: 14,
              }}>
                {lang === 'es'
                  ? 'Tu $CACAO forjado se puede quemar on-chain para adquirir productos reales en el Mercado Caúa.'
                  : 'Your forged $CACAO can be burned on-chain to acquire real products in the Caúa Market.'}
              </div>
              <button
                onClick={() => navigate('/marketplace')}
                style={{
                  display: 'block', width: '100%',
                  background: `linear-gradient(135deg, ${BRAND.heroic}, ${BRAND.amazon})`,
                  color: BRAND.heirloom, border: 'none',
                  padding: '12px 18px', borderRadius: 999,
                  cursor: 'pointer',
                  fontFamily: "'Press Start 2P', monospace", fontSize: 8,
                  letterSpacing: '0.1em',
                  boxShadow: `0 8px 20px ${BRAND.heroic}33`,
                }}
              >
                {lang === 'es' ? '◈ MERCADO CAÚA →' : '◈ CAÚA MARKET →'}
              </button>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={reset}
                style={{
                  background: `linear-gradient(135deg, ${BRAND.mazorca}, ${BRAND.brown})`,
                  color: BRAND.bgDeep, border: 'none', borderRadius: 999,
                  padding: '12px 22px', cursor: 'pointer',
                  fontFamily: FONTS.display, fontWeight: 800, fontSize: 12,
                  letterSpacing: '0.16em', textTransform: 'uppercase',
                  boxShadow: `0 12px 28px ${BRAND.mazorca}55`,
                }}
              >
                {lang === 'es' ? '🍫 Forjar otra' : '🍫 Forge another'}
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                style={{
                  background: 'transparent', color: BRAND.pod,
                  border: `1px solid ${BRAND.pod}aa`, borderRadius: 999,
                  padding: '12px 22px', cursor: 'pointer',
                  fontFamily: FONTS.display, fontWeight: 700, fontSize: 12,
                  letterSpacing: '0.14em', textTransform: 'uppercase',
                }}
              >
                {lang === 'es' ? 'Ver impacto' : 'View impact'}
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {phase === 'error' && (
          <div style={{
            background: '#1a0606',
            border: `1px solid #e74c3caa`,
            borderRadius: 16, padding: 24,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
            <div style={{
              fontFamily: FONTS.display, fontWeight: 800, fontSize: 14,
              color: '#e74c3c', letterSpacing: '0.16em', textTransform: 'uppercase',
              marginBottom: 8,
            }}>
              {lang === 'es' ? 'No se pudo forjar' : 'Forge failed'}
            </div>
            <div style={{
              fontFamily: FONTS.body, fontSize: 12,
              color: `${BRAND.heirloom}aa`, marginBottom: 18,
            }}>
              {error === 'insufficient_resources'
                ? (lang === 'es' ? 'Tus insumos cambiaron mid-fabricación. Verifica balance.' : 'Your inputs changed mid-forge. Check balance.')
                : error === 'login_required'
                ? (lang === 'es' ? 'Sesión expirada. Inicia sesión.' : 'Session expired. Sign in.')
                : error}
            </div>
            <button
              onClick={reset}
              style={{
                background: 'transparent', color: BRAND.heirloom,
                border: `1px solid ${BRAND.heirloom}55`, borderRadius: 999,
                padding: '10px 20px', cursor: 'pointer',
                fontFamily: FONTS.display, fontWeight: 700, fontSize: 11,
                letterSpacing: '0.14em', textTransform: 'uppercase',
              }}
            >
              {lang === 'es' ? '← Volver' : '← Back'}
            </button>
          </div>
        )}

        <style>{`
          @keyframes caua-forge-spin {
            0%   { transform: rotate(0deg)    scale(1);   }
            50%  { transform: rotate(180deg)  scale(1.1); }
            100% { transform: rotate(360deg)  scale(1);   }
          }
          @keyframes forge-glow {
            0%, 100% { box-shadow: 0 0 32px ${BRAND.criollo}44, 0 12px 28px ${BRAND.criollo}33; }
            50%       { box-shadow: 0 0 52px ${BRAND.criollo}88, 0 16px 36px ${BRAND.criollo}55; }
          }
        `}</style>
      </div>
    </div>
  )
}

// ─── Balance pill component ──────────────────────────────────────────────

function BalancePill({ icon, label, value, color, loading, need, have }: {
  icon: string
  label: string
  value: string
  color: string
  loading: boolean
  need?: number
  have?: number
}) {
  const insufficient = need !== undefined && have !== undefined && have < need
  const progressPct = need !== undefined && have !== undefined && need > 0
    ? Math.min(100, (have / need) * 100)
    : null
  return (
    <div style={{
      background: `${color}11`,
      border: `1px solid ${insufficient ? '#e74c3c66' : `${color}66`}`,
      borderRadius: 12,
      padding: '12px 14px',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{ fontSize: 22 }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: FONTS.display, fontWeight: 700, fontSize: 9,
          color: `${BRAND.heirloom}88`, letterSpacing: '0.16em', textTransform: 'uppercase',
        }}>
          {label}
        </div>
        <div style={{
          fontFamily: FONTS.display, fontWeight: 800, fontSize: 18,
          color: insufficient ? '#e74c3c' : color,
          letterSpacing: '0.02em',
        }}>
          {loading ? '…' : value}
        </div>
        {need !== undefined && (
          <>
            <div style={{
              fontFamily: FONTS.body, fontSize: 9,
              color: insufficient ? '#e74c3ccc' : `${BRAND.heirloom}55`, marginTop: 2,
              fontWeight: insufficient ? 700 : 400,
            }}>
              {insufficient
                ? `${have!.toFixed(0)} / ${need.toFixed(0)}g · faltan ${(need - have!).toFixed(0)}g`
                : `≥ ${need.toFixed(0)}g ✓`}
            </div>
            {progressPct !== null && (
              <div style={{
                marginTop: 6, height: 4,
                background: `${BRAND.heirloom}11`, borderRadius: 999, overflow: 'hidden',
              }}>
                <div style={{
                  width: `${progressPct}%`, height: '100%',
                  background: insufficient
                    ? `linear-gradient(90deg, #e74c3c, ${color})`
                    : color,
                  borderRadius: 999,
                  transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: !insufficient ? `0 0 8px ${color}88` : 'none',
                }} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
