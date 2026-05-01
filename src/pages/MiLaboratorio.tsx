import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BRAND, FONTS, TOKEN_RATES } from '../utils/constants'
import { useAuth } from '../context/AuthContext'
import { useTokenBalance } from '../hooks/useTokenBalance'
import { useLang } from '../context/LangContext'
import { supabase } from '../lib/supabase'
import LiofilizadoStage from '../components/lab/LiofilizadoStage'
import RefinadoStage    from '../components/lab/RefinadoStage'
import ConchadoStage    from '../components/lab/ConchadoStage'

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

type Phase = 'idle' | 'liofilizado' | 'refinado' | 'conchado' | 'forging' | 'done' | 'error'

interface StageStamps {
  liofilizado_at?: string
  refinado_at?:    string
  conchado_at?:    string
}

export default function MiLaboratorio() {
  const { user } = useAuth()
  const { lang } = useLang()
  const navigate = useNavigate()
  const { mucilageG, cacaoMassG, chocolateBarsMade, loading } = useTokenBalance()

  const [phase, setPhase] = useState<Phase>('idle')
  const [stamps, setStamps] = useState<StageStamps>({})
  const [error, setError] = useState<string | null>(null)

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
  const onConchadoDone = async () => {
    const finalStamps = { ...stamps, conchado_at: new Date().toISOString() }
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
              ? 'Liofiliza · Refina · Conchea. Tu mucílago y masa de cacao se vuelven una barra de chocolate ritual.'
              : 'Lyophilize · Refine · Conch. Your mucilage and cacao mass become a ritual chocolate bar.'}
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
            <BalancePill icon="🍫" label={lang === 'es' ? 'Chocolate forjado' : 'Chocolate forged'} value={`${chocolateBarsMade}`} color={BRAND.mazorca} loading={loading} />
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
              color: BRAND.mazorca, letterSpacing: '0.22em',
              textTransform: 'uppercase', marginBottom: 6,
            }}>
              Receta · Chocolate Ritual
            </div>
            <div style={{
              fontFamily: FONTS.display, fontWeight: 900, fontSize: 22,
              color: BRAND.heirloom, marginBottom: 14, lineHeight: 1.1,
            }}>
              1 barra · {RECIPE.mucilage_g}g mucílago + {RECIPE.cacao_mass_g}g masa
            </div>
            <div style={{
              fontFamily: FONTS.body, fontSize: 12, color: `${BRAND.heirloom}aa`,
              lineHeight: 1.6, marginBottom: 18,
            }}>
              {lang === 'es'
                ? 'Tres etapas en orden — liofilización a -50°C, refinado por molido circular, conchado por mecimiento. Cada etapa desbloquea la siguiente.'
                : 'Three stages in order — lyophilization at -50°C, refining by circular grinding, conching by rocking. Each stage unlocks the next.'}
            </div>

            {!canForge && (
              <div style={{
                background: `${BRAND.heroic}11`,
                border: `1px solid ${BRAND.heroic}55`,
                borderRadius: 10, padding: 12, marginBottom: 14,
                fontFamily: FONTS.body, fontSize: 11, color: `${BRAND.heirloom}cc`,
                lineHeight: 1.6,
              }}>
                {lang === 'es' ? 'Te faltan: ' : 'You need: '}
                {mucilageDeficit > 0 && <strong>{mucilageDeficit.toFixed(0)}g mucílago</strong>}
                {mucilageDeficit > 0 && cacaoMassDeficit > 0 && ' · '}
                {cacaoMassDeficit > 0 && <strong>{cacaoMassDeficit.toFixed(0)}g masa de cacao</strong>}
                <div style={{ marginTop: 6, fontStyle: 'italic', color: `${BRAND.heirloom}77` }}>
                  {lang === 'es'
                    ? 'Cosecha más árboles para acumular más insumos.'
                    : 'Harvest more trees to gather more inputs.'}
                </div>
              </div>
            )}

            <button
              onClick={startForge}
              disabled={!canForge || !user}
              style={{
                width: '100%',
                padding: '14px 18px',
                background: canForge
                  ? `linear-gradient(135deg, ${BRAND.mazorca}, ${BRAND.brown})`
                  : `${BRAND.amazon}66`,
                color: canForge ? BRAND.bgDeep : `${BRAND.heirloom}66`,
                border: 'none', borderRadius: 999,
                cursor: canForge ? 'pointer' : 'not-allowed',
                fontFamily: FONTS.display, fontWeight: 800, fontSize: 13,
                letterSpacing: '0.16em', textTransform: 'uppercase',
                boxShadow: canForge ? `0 12px 28px ${BRAND.mazorca}55` : 'none',
                transition: 'all 0.2s',
              }}
            >
              {!user
                ? (lang === 'es' ? 'Iniciar sesión para fabricar' : 'Sign in to forge')
                : canForge
                  ? (lang === 'es' ? '🍫 Iniciar fabricación' : '🍫 Begin forging')
                  : (lang === 'es' ? 'Insumos insuficientes' : 'Insufficient inputs')}
            </button>
          </div>
        )}

        {/* Pipeline indicator — always visible during stages */}
        {phase !== 'idle' && phase !== 'done' && phase !== 'error' && (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8, marginBottom: 20,
          }}>
            {[
              { key: 'liofilizado' as const, label: '1 · Liofilización',  icon: '❄' },
              { key: 'refinado'    as const, label: '2 · Refinado',       icon: '🌾' },
              { key: 'conchado'    as const, label: '3 · Conchado',       icon: '🍫' },
            ].map((s, i) => {
              const active = phase === s.key
              const past = (phase === 'refinado' && i === 0)
                        || (phase === 'conchado' && i <= 1)
                        || (phase === 'forging'  && i <= 2)
              const accent = active ? BRAND.mazorca : past ? BRAND.pod : `${BRAND.heirloom}33`
              return (
                <div key={s.key} style={{
                  padding: '10px 8px',
                  background: active ? `${BRAND.mazorca}22` : 'transparent',
                  border: `1px solid ${accent}`,
                  borderRadius: 10,
                  textAlign: 'center',
                  transition: 'all 0.3s',
                }}>
                  <div style={{ fontSize: 18, marginBottom: 4 }}>{past ? '✓' : s.icon}</div>
                  <div style={{
                    fontFamily: FONTS.display, fontWeight: 700, fontSize: 9,
                    color: accent, letterSpacing: '0.12em', textTransform: 'uppercase',
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
              fontSize: 80, marginBottom: 12,
              filter: `drop-shadow(0 0 24px ${BRAND.mazorca}cc)`,
            }}>🍫</div>
            <div style={{
              fontFamily: FONTS.display, fontWeight: 900, fontSize: 28,
              color: '#FFE9A8', letterSpacing: '0.04em', textTransform: 'uppercase',
              textShadow: `0 0 24px ${BRAND.mazorca}cc`, marginBottom: 8,
            }}>
              {lang === 'es' ? 'Chocolate forjado' : 'Chocolate forged'}
            </div>
            <div style={{
              fontFamily: FONTS.serif, fontStyle: 'italic',
              color: `${BRAND.heirloom}aa`, fontSize: 14, marginBottom: 18,
            }}>
              {lang === 'es'
                ? `Barra ritual #${chocolateBarsMade} en tu colección · +${FORGE_BEANS_REWARD} granos`
                : `Ritual bar #${chocolateBarsMade} in your collection · +${FORGE_BEANS_REWARD} beans`}
            </div>
            <div style={{
              fontFamily: FONTS.body, fontSize: 11, color: `${BRAND.heirloom}66`,
              lineHeight: 1.6, marginBottom: 24, maxWidth: 360, margin: '0 auto 24px',
            }}>
              {lang === 'es'
                ? 'Phase 4 transformará cada barra en un NFT ERC-721 mintleable a tu wallet. Por ahora se acumula como contador off-chain.'
                : 'Phase 4 will turn each bar into an ERC-721 NFT mintable to your wallet. For now it accumulates off-chain.'}
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
          <div style={{
            fontFamily: FONTS.body, fontSize: 9,
            color: `${BRAND.heirloom}55`, marginTop: 2,
          }}>
            {insufficient ? `Necesitas ${need.toFixed(0)}g` : `≥ ${need.toFixed(0)}g ✓`}
          </div>
        )}
      </div>
    </div>
  )
}
