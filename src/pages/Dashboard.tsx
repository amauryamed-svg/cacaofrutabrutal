import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BRAND, FONTS, GUARDIANS, MAZORCA_TO_CACAO_RATE } from '../utils/constants'
import { useAuth } from '../context/AuthContext'
import { useCocoaTrees } from '../hooks/useCocoaTrees'
import { useTokenBalance } from '../hooks/useTokenBalance'
import HubspotLeadForm from '../components/ui/HubspotLeadForm'
import RedeemMazorcasModal from '../components/web3/RedeemMazorcasModal'
import { useLang } from '../context/LangContext'
import { makeT } from '../utils/i18n'
import {
  getStageByHours, hoursSinceAdoption, getCycleProgress, isHarvestReady,
  ADOPTION_HOURS, formatTimeUntil,
  isTreeDead, isInDeathDanger,
} from '../utils/growthSystem'

// Unit Economics anchors — keep in sync with public/investor-landing.html §8.4 data-target values.
const UE_REVENUE_PER_TREE_YEAR_USD = 240
const UE_NETWORK_TREES_TOTAL       = 1850

export default function Dashboard() {
  const { profile } = useAuth()
  const { lang } = useLang()
  const T = makeT(lang)
  const navigate = useNavigate()
  const { trees, loading: treesLoading, deleteTree } = useCocoaTrees()
  const { mazorcas, beans } = useTokenBalance()
  const [redeemOpen, setRedeemOpen] = useState(false)
  const [deadBannerDismissed, setDeadBannerDismissed] = useState(false)
  const canRedeemOnChain = mazorcas >= MAZORCA_TO_CACAO_RATE

  // Per-portfolio rollups anchored to investor-landing Unit Economics
  const adoptedCount     = trees.length
  const totalCo2Kg       = trees.reduce((sum, t) => sum + (t.co2_kg ?? 0), 0)
  const totalRevenueUsd  = trees.reduce((sum, t) => sum + getCycleProgress(t.adopted_at) * UE_REVENUE_PER_TREE_YEAR_USD, 0)
  const harvestReadyCount = trees.filter(t => isHarvestReady(t.adopted_at)).length
  // Real-Tamagotchi state — death mechanic from growthSystem.
  // Server-side `died_at` and `harvested_at` (migration 036) are the source
  // of truth. Client-side compute is the fallback when the server hasn't
  // processed the forfeit yet.
  // "At risk" = either close to dying (death danger window) OR low vitals
  // (health < 40 or moisture < 30 or sunlight < 30) → plague-prone state.
  // Both surfaces as a YELLOW banner; only fully-dead trees go RED.
  const atRiskCount = trees.filter(t => {
    if (t.died_at || t.harvested_at) return false
    const inDanger = isInDeathDanger(t.adopted_at, t.last_update_at, !!t.harvested_at)
    const lowVitals =
      (t.health   != null && t.health   < 40) ||
      (t.moisture != null && t.moisture < 30) ||
      (t.sunlight != null && t.sunlight < 30)
    return inDanger || lowVitals
  }).length
  const deadCount   = trees.filter(t =>
    !!t.died_at || (!t.harvested_at && isTreeDead(t.adopted_at, t.last_update_at, false))
  ).length

  // Unit Economics anchored al modelo de adopción $3 USD on-chain.
  // Datos verificables — no proyecciones aspiracionales.
  const METRICS = [
    { label: lang === 'es' ? 'Precio adopción'       : 'Adoption price',         value: '$3',  unit: 'USD',     icon: '🌱', color: BRAND.pod     },
    { label: lang === 'es' ? 'Al guardián directo'   : 'To guardian direct',     value: '60',  unit: '%',       icon: '👨‍🌾', color: BRAND.mazorca },
    { label: lang === 'es' ? 'Ratio canje on-chain'  : 'On-chain redeem ratio',  value: '1000',unit: ': 1',     icon: '🍫', color: BRAND.heroic  },
    { label: lang === 'es' ? 'Cap $CACAO ERC-20'     : '$CACAO supply cap',      value: '21',  unit: 'M',       icon: '⬡', color: BRAND.criollo  },
  ]

  const TIMELINE = [
    { q: 'Q1 2026', title: lang === 'es' ? 'MVP + Validación' : 'MVP + Validation', status: 'active',   items: ['Landing + Marketplace', '100 pre-orders', 'BFFood Candidatura'] },
    { q: 'Q2 2026', title: lang === 'es' ? 'Producción'       : 'Production',        status: 'upcoming', items: ['600L Sunrise Shot', 'CAUA Labs apertura', lang === 'es' ? '5 guardianes activos' : '5 active guardians'] },
    { q: 'Q3 2026', title: lang === 'es' ? 'Escala'           : 'Scale',             status: 'upcoming', items: [lang === 'es' ? 'Whole Foods Austin' : 'Whole Foods Austin', 'CAUA Inc Registration', lang === 'es' ? 'Certificación orgánica' : 'Organic Certification'] },
    { q: 'Q4 2026', title: lang === 'es' ? 'Ronda Semilla'    : 'Seed Round',        status: 'upcoming', items: ['$750K - $1.5M raise', lang === 'es' ? 'Equipo clave 3+' : 'Core team 3+', lang === 'es' ? 'Certificaciones EU' : 'EU Certifications'] },
    { q: '2027',    title: lang === 'es' ? 'Crecimiento'      : 'Growth',            status: 'future',   items: ['$500K revenue', lang === 'es' ? '8-10 guardianes' : '8-10 guardians', lang === 'es' ? 'Distribución EU' : 'EU Distribution'] },
    { q: '2028-29', title: lang === 'es' ? 'Consolidación'    : 'Consolidation',     status: 'future',   items: ['$1M+ revenue', lang === 'es' ? 'Licencias IP' : 'IP Licenses', lang === 'es' ? '5 países' : '5 countries'] },
  ]

  // Distribución 60/30/10 — el split que enforce el contrato TreeAdoption
  // on-chain en cada $3 USDC adoptado. Igual lo que dice la app, igual lo
  // que ejecuta el escrow, igual lo que ve el usuario en /uploads.
  const DISTRIBUTION = [
    { label: lang === 'es' ? 'Guardián (finca)'         : 'Guardian (farm)',           pct: 60, color: BRAND.pod      },
    { label: lang === 'es' ? 'R&D + Producción'         : 'R&D + Production',          pct: 30, color: BRAND.muisca   },
    { label: lang === 'es' ? 'Comunidad + Reinversión'  : 'Community + Reinvestment',  pct: 10, color: BRAND.criollo  },
  ]

  return (
    <div style={{ background: '#040C06', minHeight: '100vh', paddingTop: 'calc(var(--nav-h, 60px) + 12px)' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: 'clamp(20px,5vw,40px) var(--space-page) clamp(40px,8vw,80px)' }}>

        <p style={{ fontFamily: FONTS.serif, fontStyle: 'italic', color: BRAND.mazorca, fontSize: 12, letterSpacing: '0.2em', marginBottom: 8 }}>
          {T('dash_eyebrow')}
        </p>
        <h2 style={{
          fontFamily: FONTS.display, fontWeight: 900,
          fontSize: 'clamp(36px, 8vw, 56px)', color: BRAND.heirloom,
          textTransform: 'uppercase', margin: '0 0 32px', lineHeight: 0.95,
        }}>{T('dash_title').split(' ')[0]} <span style={{ color: BRAND.pod }}>{T('dash_title').split(' ')[1]}</span></h2>

        {/* Tamagotchi reality check — yellow for at-risk (plaga + próximo a
            morir), red only for actually dead. Yellow = "te queda tiempo,
            cuídalo"; red = "ya no se puede salvar". */}
        {!treesLoading && atRiskCount > 0 && (
          <div style={{
            background: `${BRAND.mazorca}1a`, border: `1px solid ${BRAND.mazorca}88`,
            borderRadius: 12, padding: '14px 18px', marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 14,
            boxShadow: `0 0 24px ${BRAND.mazorca}33`,
          }}>
            <span style={{ fontSize: 26 }}>⚠️</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: FONTS.display, fontWeight: 800, fontSize: 13,
                color: BRAND.mazorca, letterSpacing: '0.1em', textTransform: 'uppercase',
              }}>
                {atRiskCount} árbol{atRiskCount !== 1 ? 'es' : ''} en riesgo
              </div>
              <div style={{ fontFamily: FONTS.body, fontSize: 11, color: `${BRAND.heirloom}aa`, marginTop: 2, lineHeight: 1.5 }}>
                Plaga, sed o ventana de cosecha por cerrar. Riega + expón al sol cuanto antes — si muere, los tokens de gameplay se queman.
              </div>
            </div>
          </div>
        )}
        {!treesLoading && deadCount > 0 && !deadBannerDismissed && (
          <div style={{
            background: '#1a0606', border: '1px solid #e74c3c44',
            borderRadius: 12, padding: '12px 16px', marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 12,
            position: 'relative',
          }}>
            <span style={{ fontSize: 22, opacity: 0.8 }}>💀</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: FONTS.display, fontWeight: 700, fontSize: 11,
                color: BRAND.pod, letterSpacing: '0.12em', textTransform: 'uppercase',
              }}>
                {deadCount} árbol{deadCount !== 1 ? 'es' : ''} listo{deadCount !== 1 ? 's' : ''} para compostar
              </div>
              <div style={{ fontFamily: FONTS.body, fontSize: 10, color: `${BRAND.heirloom}88`, marginTop: 2, lineHeight: 1.5 }}>
                Devuelve su biomasa a la tierra para nutrir la próxima siembra. Los tokens de gameplay no cosechados se quemaron; tu inversión inicial ya fue desplegada (60/30/10) al adoptar — no retenemos fondos en custodia (Coinbase onramp).
              </div>
            </div>
            <button
              onClick={() => setDeadBannerDismissed(true)}
              aria-label="Cerrar"
              title="Cerrar"
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: '#e74c3caa', fontSize: 18, lineHeight: 1, padding: '4px 8px',
                fontFamily: FONTS.display, fontWeight: 700,
                flexShrink: 0,
              }}
            >×</button>
          </div>
        )}

        {/* Daily-care reminder — soft nudge for users who have trees but no danger yet */}
        {!treesLoading && adoptedCount > 0 && atRiskCount === 0 && deadCount === 0 && (
          <div style={{
            background: `${BRAND.pod}11`, border: `1px solid ${BRAND.pod}33`,
            borderRadius: 10, padding: '10px 14px', marginBottom: 16,
            fontFamily: FONTS.body, fontSize: 11, color: `${BRAND.heirloom}aa`,
            display: 'flex', alignItems: 'center', gap: 10, lineHeight: 1.5,
          }}>
            <span style={{ fontSize: 16 }}>🌱</span>
            <span>
              <strong style={{ color: BRAND.pod }}>Cuida tu árbol cada día.</strong>{' '}
              Cosecha cada 5 días de floración y maduración. Si lo dejas morir, como un Caua-Gotchi real, los tokens de gameplay se queman.
            </span>
          </div>
        )}

        {/* Tus Árboles · Unit Economics — replaces the embedded CauaGotchi panel.
            Anchors each adoption to the macro Unit Economics shown in investor-landing.html §8.4
            (revenue por árbol/año, red total). Cosecha disponible → canjear mazorcas por chocolate. */}
        {treesLoading ? (
          <div style={{
            border: `2px dashed ${BRAND.amazon}`, borderRadius: 16, padding: 40,
            textAlign: 'center', marginBottom: 24, color: `${BRAND.heirloom}44`,
            fontFamily: FONTS.display, fontSize: 12, letterSpacing: '0.1em',
          }}>
            {lang === 'es' ? 'Cargando tus árboles...' : 'Loading your trees...'}
          </div>
        ) : adoptedCount === 0 ? (
          <div style={{
            border: `2px dashed ${BRAND.amazon}`, borderRadius: 16, padding: 40,
            textAlign: 'center', marginBottom: 24,
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🌰</div>
            <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 14, color: BRAND.heirloom, letterSpacing: '0.1em', marginBottom: 8 }}>
              {lang === 'es' ? 'AÚN NO TIENES UN ÁRBOL' : 'YOU HAVE NO TREES YET'}
            </div>
            <button onClick={() => navigate('/adoptar')} style={{
              background: `linear-gradient(135deg, ${BRAND.pod}, ${BRAND.amazon})`,
              color: BRAND.heirloom, borderRadius: 999, padding: '10px 24px',
              fontFamily: FONTS.display, fontWeight: 700, fontSize: 12, border: 'none',
              letterSpacing: '0.12em', cursor: 'pointer', textTransform: 'uppercase',
            }}>
              {lang === 'es' ? 'Adoptar árbol →' : 'Adopt a tree →'}
            </button>
          </div>
        ) : (
          <div style={{
            background: `linear-gradient(135deg, ${BRAND.bgCard}, ${BRAND.amazon}77)`,
            border: `1px solid ${BRAND.pod}55`,
            borderRadius: 16, padding: 24, marginBottom: 32,
          }}>
            {/* Section header */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: FONTS.serif, fontStyle: 'italic', color: BRAND.pod, fontSize: 11, letterSpacing: '0.22em', marginBottom: 6 }}>
                {lang === 'es' ? '08.4 · UNIT ECONOMICS · TU PORTAFOLIO' : '08.4 · UNIT ECONOMICS · YOUR PORTFOLIO'}
              </div>
              <h3 style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 'clamp(20px,5vw,28px)', color: BRAND.heirloom, margin: 0, textTransform: 'uppercase', lineHeight: 0.95 }}>
                {lang === 'es' ? 'Tus árboles · ' : 'Your trees · '}
                <span style={{ color: BRAND.mazorca }}>{adoptedCount}</span>
                {lang === 'es' ? ' adoptados' : ' adopted'}
              </h3>
              <div style={{ fontFamily: FONTS.body, fontSize: 12, color: `${BRAND.heirloom}77`, marginTop: 6 }}>
                {lang === 'es'
                  ? `Parte de ${UE_NETWORK_TREES_TOTAL.toLocaleString('es-CO')} árboles activos en la red CFB.`
                  : `Part of ${UE_NETWORK_TREES_TOTAL.toLocaleString('en-US')} active trees in the CFB network.`}
              </div>
            </div>

            {/* Per-portfolio rollups (anchored to UE) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(120px, 100%), 1fr))', gap: 'clamp(8px, 2vw, 12px)', marginBottom: 20 }}>
              <div style={ueTileStyle(BRAND.pod)}>
                <div style={ueLabelStyle}>{lang === 'es' ? 'Revenue contribución' : 'Revenue contribution'}</div>
                <div style={ueNumStyle(BRAND.pod)}>${Math.round(totalRevenueUsd).toLocaleString('en-US')}<span style={ueUnitStyle}>USD</span></div>
                <div style={ueHintStyle}>${UE_REVENUE_PER_TREE_YEAR_USD}/{lang === 'es' ? 'árbol·año' : 'tree·yr'}</div>
              </div>
              <div style={ueTileStyle(BRAND.heroic)}>
                <div style={ueLabelStyle}>CO₂ {lang === 'es' ? 'capturado' : 'captured'}</div>
                <div style={ueNumStyle(BRAND.heroic)}>{totalCo2Kg.toFixed(2)}<span style={ueUnitStyle}>kg</span></div>
                <div style={ueHintStyle}>{lang === 'es' ? 'verificado vía IoT' : 'verified via IoT'}</div>
              </div>
              <div style={ueTileStyle(BRAND.mazorca)}>
                <div style={ueLabelStyle}>{lang === 'es' ? 'Cosecha lista' : 'Harvest ready'}</div>
                <div style={ueNumStyle(BRAND.mazorca)}>{harvestReadyCount}<span style={ueUnitStyle}>🍫</span></div>
                <div style={ueHintStyle}>{lang === 'es' ? `de ${adoptedCount} totales` : `of ${adoptedCount} total`}</div>
              </div>
            </div>

            {/* Cosecha + canjear chocolate CTA */}
            {(harvestReadyCount > 0 || mazorcas > 0) && (
              <div style={{
                background: `${BRAND.mazorca}18`, border: `1px solid ${BRAND.mazorca}66`,
                borderRadius: 12, padding: '12px 16px', marginBottom: 20,
                display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
              }}>
                <div style={{ fontSize: 28 }}>🍫</div>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 12, color: BRAND.mazorca, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    {lang === 'es' ? 'Mazorcas para canjear' : 'Mazorcas to redeem'}
                  </div>
                  <div style={{ fontFamily: FONTS.body, fontSize: 11, color: `${BRAND.heirloom}aa`, marginTop: 2 }}>
                    {lang === 'es'
                      ? `${mazorcas} mazorcas · ${beans.toFixed(1)} granos. Cánjealas por chocolate ceremonial real en Marketplace.`
                      : `${mazorcas} mazorcas · ${beans.toFixed(1)} beans. Redeem for real ceremonial chocolate in Marketplace.`}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'row', gap: 8, flexWrap: 'wrap', width: '100%', justifyContent: 'flex-end' }}>
                  <button onClick={() => navigate('/marketplace#cacao-ceremony')} style={{
                    flex: '1 1 200px', padding: '10px 16px', borderRadius: 999,
                    background: `linear-gradient(135deg, ${BRAND.mazorca}, ${BRAND.brown})`,
                    color: BRAND.bgDeep, border: 'none', cursor: 'pointer',
                    fontFamily: FONTS.display, fontWeight: 700, fontSize: 11, letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}>
                    {lang === 'es' ? '🍫 Canjear chocolate →' : '🍫 Redeem chocolate →'}
                  </button>
                  <button
                    onClick={() => setRedeemOpen(true)}
                    disabled={!canRedeemOnChain}
                    title={canRedeemOnChain ? '' : `Need ≥ ${MAZORCA_TO_CACAO_RATE} mazorcas`}
                    style={{
                      flex: '1 1 160px', padding: '10px 16px', borderRadius: 999,
                      background: 'transparent',
                      color: canRedeemOnChain ? BRAND.pod : `${BRAND.pod}66`,
                      border: `1px solid ${canRedeemOnChain ? BRAND.pod : BRAND.pod + '44'}`,
                      cursor: canRedeemOnChain ? 'pointer' : 'not-allowed',
                      fontFamily: FONTS.display, fontWeight: 700, fontSize: 11, letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      opacity: canRedeemOnChain ? 1 : 0.6,
                    }}>
                    {lang === 'es' ? '⛓ Burn → $CACAO' : '⛓ Burn → $CACAO'}
                  </button>
                </div>
              </div>
            )}

            {/* Tree tiles — Jardín / Labranza. Tiles más grandes y visuales:
                emoji grande, status color (sano/peligro/cosecha/muerto), nombre
                + stage, tiempo restante o "muerto", barra de progreso del ciclo. */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: 'clamp(12px, 2.5vw, 18px)' }}>
              {trees.map(t => {
                const g = GUARDIANS[t.guardian_id]
                const hours = hoursSinceAdoption(t.adopted_at)
                const stage = getStageByHours(hours)
                const cyclePct = getCycleProgress(t.adopted_at) * 100
                const harvested = !!t.harvested_at
                const dead = !!t.died_at || isTreeDead(t.adopted_at, t.last_update_at, harvested)
                const ready = !dead && !harvested && isHarvestReady(t.adopted_at)
                const danger = !dead && !harvested && (
                  isInDeathDanger(t.adopted_at, t.last_update_at, harvested) ||
                  (t.health   != null && t.health   < 40) ||
                  (t.moisture != null && t.moisture < 30) ||
                  (t.sunlight != null && t.sunlight < 30)
                )
                const remaining = formatTimeUntil(new Date(new Date(t.adopted_at).getTime() + ADOPTION_HOURS * 3600000))

                const accent = dead ? '#e74c3c'
                             : danger ? BRAND.mazorca
                             : ready ? BRAND.mazorca
                             : BRAND.pod
                const statusLabel = dead ? 'Muerto'
                                  : danger ? 'En riesgo'
                                  : ready ? 'Cosecha lista'
                                  : harvested ? 'Cosechado'
                                  : stage.name
                const statusEmoji = dead ? '💀'
                                  : danger ? '⚠️'
                                  : ready ? '🍫'
                                  : harvested ? '✓'
                                  : stage.emoji

                return (
                  <div key={t.id} style={{
                    background: dead ? '#1a0606'
                              : danger ? `${BRAND.mazorca}10`
                              : ready ? `${BRAND.mazorca}1a`
                              : `linear-gradient(160deg, ${BRAND.bgCard}, ${BRAND.bgDeep})`,
                    border: `1px solid ${accent}${danger || ready || dead ? 'aa' : '66'}`,
                    borderRadius: 16, padding: 'clamp(16px, 3vw, 22px)',
                    color: BRAND.heirloom, textAlign: 'left',
                    boxShadow: ready ? `0 0 24px ${BRAND.mazorca}33`
                             : danger ? `0 0 18px ${BRAND.mazorca}22`
                             : dead ? 'inset 0 0 30px #e74c3c22'
                             : 'none',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    display: 'flex', flexDirection: 'column', gap: 12,
                    minHeight: 200, position: 'relative',
                  }}>
                  <button onClick={() => navigate(`/tree/${t.id}`)} style={{
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    color: 'inherit', padding: 0, textAlign: 'left',
                    display: 'flex', flexDirection: 'column', gap: 12,
                    width: '100%',
                  }}
                    onMouseEnter={e => { ((e.currentTarget as HTMLButtonElement).parentElement as HTMLDivElement).style.transform = 'translateY(-3px)' }}
                    onMouseLeave={e => { ((e.currentTarget as HTMLButtonElement).parentElement as HTMLDivElement).style.transform = 'translateY(0)' }}
                  >
                    {/* Top row: stage emoji XL + status badge */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <span style={{
                        fontSize: 'clamp(44px, 7vw, 60px)',
                        lineHeight: 1, opacity: dead ? 0.5 : 1,
                        filter: dead ? 'grayscale(0.7)' : 'none',
                      }}>{statusEmoji}</span>
                      <span style={{
                        fontFamily: FONTS.display, fontSize: 9, fontWeight: 800,
                        color: accent, letterSpacing: '0.12em',
                        background: `${accent}22`, padding: '4px 10px', borderRadius: 999,
                        textTransform: 'uppercase',
                      }}>
                        {statusLabel}
                      </span>
                    </div>

                    {/* Name + stage */}
                    <div>
                      <div style={{
                        fontFamily: FONTS.display, fontWeight: 900,
                        fontSize: 'clamp(18px, 3vw, 22px)',
                        color: BRAND.heirloom, lineHeight: 1, letterSpacing: '0.02em',
                      }}>
                        {g?.name ?? 'Árbol'}
                      </div>
                      <div style={{
                        fontFamily: FONTS.serif, fontStyle: 'italic',
                        color: dead ? `${BRAND.heirloom}55` : accent,
                        fontSize: 13, marginTop: 4, letterSpacing: '0.04em',
                      }}>
                        {stage.name} · {g?.region ?? '—'}
                      </div>
                    </div>

                    {/* Time / status detail */}
                    <div style={{
                      fontFamily: FONTS.body, fontSize: 11,
                      color: `${BRAND.heirloom}88`, marginTop: 'auto',
                    }}>
                      {dead ? 'Tokens quemados — pulsa para info'
                       : ready ? (lang === 'es' ? '¡Cosecha disponible ahora!' : 'Harvest ready now!')
                       : danger ? (lang === 'es' ? 'Cuídalo cuanto antes' : 'Care now')
                       : `${remaining} ${lang === 'es' ? 'al ciclo completo' : 'to full cycle'}`}
                    </div>

                    {/* Cycle progress bar */}
                    <div style={{ height: 6, background: `${BRAND.amazon}66`, borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{
                        width: `${dead ? 100 : cyclePct}%`, height: '100%',
                        background: dead ? '#e74c3c'
                                  : `linear-gradient(90deg, ${BRAND.pod}, ${BRAND.mazorca})`,
                        transition: 'width 0.6s',
                      }} />
                    </div>
                  </button>

                  {/* Devolver a la tierra — solo en árboles muertos. Lenguaje
                      regenerativo: la biomasa nutre la próxima siembra. */}
                  {dead && (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation()
                        if (!confirm(`¿Devolver el árbol de ${g?.name ?? 'guardián'} a la tierra? Su biomasa nutre el suelo de la próxima generación. Esta acción no se puede deshacer.`)) return
                        try { await deleteTree(t.id) }
                        catch (err) { alert(`No se pudo devolver: ${err instanceof Error ? err.message : 'Error desconocido'}`) }
                      }}
                      title="Devolver a la tierra · regenerar"
                      aria-label="Devolver árbol a la tierra"
                      style={{
                        width: '100%', marginTop: 4,
                        padding: '10px 14px', borderRadius: 999,
                        background: `${BRAND.pod}18`,
                        border: `1px solid ${BRAND.pod}66`,
                        color: BRAND.pod, cursor: 'pointer',
                        fontFamily: FONTS.display, fontWeight: 700,
                        fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      }}
                    >
                      <span style={{ fontSize: 14 }}>🌱</span>
                      Devolver a la tierra
                    </button>
                  )}
                  </div>
                )
              })}
            </div>

            {/* Adopt-more CTA */}
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button onClick={() => navigate('/adoptar')} style={{
                background: 'transparent', border: `1px solid ${BRAND.pod}66`, color: BRAND.pod,
                borderRadius: 999, padding: '8px 20px', cursor: 'pointer',
                fontFamily: FONTS.display, fontWeight: 700, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
              }}>
                {lang === 'es' ? '+ Adoptar otro árbol' : '+ Adopt another tree'}
              </button>
            </div>
          </div>
        )}

        {/* Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(140px, 100%), 1fr))', gap: 'clamp(10px, 2vw, 16px)', marginBottom: 'clamp(32px, 6vw, 48px)' }}>
          {METRICS.map((m, i) => (
            <div key={i} style={{ background: '#132B1C', border: `1px solid ${BRAND.amazon}66`, borderRadius: 12, padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{m.icon}</div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 36, color: m.color }}>
                {m.value}<span style={{ fontSize: 14, color: `${BRAND.heirloom}55` }}> {m.unit}</span>
              </div>
              <div style={{ fontFamily: FONTS.body, color: `${BRAND.heirloom}77`, fontSize: 11, marginTop: 4 }}>{m.label}</div>
            </div>
          ))}
        </div>

        {/* Roadmap */}
        <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, color: BRAND.heirloom, fontSize: 16, letterSpacing: '0.1em', marginBottom: 24 }}>
          {T('dash_roadmap')}
        </h3>
        <div style={{ position: 'relative', marginBottom: 48 }}>
          <div style={{ position: 'absolute', left: 16, top: 0, bottom: 0, width: 2, background: `linear-gradient(${BRAND.pod}, ${BRAND.amazon}44)` }} />
          {TIMELINE.map((t, i) => (
            <div key={i} style={{ display: 'flex', gap: 'clamp(12px, 3vw, 20px)', marginBottom: 24 }}>
              <div style={{
                width: 34, minWidth: 34, height: 34, borderRadius: '50%', zIndex: 2,
                background: t.status === 'active' ? BRAND.pod : '#132B1C',
                border: `2px solid ${t.status === 'active' ? BRAND.pod : BRAND.amazon}66`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {t.status === 'active' && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#040C06' }} />}
              </div>
              <div style={{
                background: t.status === 'active' ? `${BRAND.pod}11` : 'transparent',
                border: `1px solid ${t.status === 'active' ? BRAND.pod : BRAND.amazon}33`,
                borderRadius: 12, padding: 16, flex: 1,
              }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, color: t.status === 'active' ? BRAND.pod : BRAND.mazorca, fontSize: 11, letterSpacing: '0.12em' }}>
                    {t.q}
                  </span>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, color: BRAND.heirloom, fontSize: 16 }}>
                    {t.title}
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {t.items.map((item, j) => (
                    <span key={j} style={{
                      background: `${BRAND.amazon}44`, padding: '3px 10px', borderRadius: 999,
                      fontFamily: FONTS.body, fontSize: 10, color: `${BRAND.heirloom}88`,
                    }}>{item}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Value distribution */}
        <div style={{ background: '#132B1C', border: `1px solid ${BRAND.amazon}66`, borderRadius: 12, padding: 24, marginBottom: 40 }}>
          <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, color: BRAND.heirloom, fontSize: 14, letterSpacing: '0.1em', marginBottom: 16 }}>
            {T('dash_distrib')}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {DISTRIBUTION.map((row, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontFamily: FONTS.body, fontSize: 11, color: `${BRAND.heirloom}cc` }}>{row.label}</span>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 12, color: row.color }}>{row.pct}%</span>
                </div>
                <div style={{ height: 4, background: `${BRAND.amazon}44`, borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ width: `${row.pct}%`, height: '100%', borderRadius: 999, background: row.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Lead capture ── */}
        <div style={{ padding: '0 0 32px', maxWidth: 480, margin: '0 auto' }}>
          <HubspotLeadForm
            prefillEmail={profile?.email ?? ''}
            prefillRegion={profile?.region ?? 'OTHER'}
            prefillBehavior={{
              streak:    profile?.ritual_streak    ?? 0,
              orders:    profile?.completed_orders ?? 0,
              referrals: profile?.referral_count   ?? 0,
            }}
          />
        </div>

        {/* Web3 redemption modal — opens from "Burn → $CACAO" CTA above */}
        <RedeemMazorcasModal
          open={redeemOpen}
          onClose={() => setRedeemOpen(false)}
          mazorcasBalance={mazorcas}
        />

        {/* WhatsApp CTA */}
        <div style={{ textAlign: 'center', paddingBottom: 40 }}>
          <a href="https://chat.whatsapp.com/Kkcf4lk6Fas5VYfTI4VBhG"
            target="_blank" rel="noopener noreferrer" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#25D366', color: '#fff', padding: '12px 24px',
              borderRadius: 999, textDecoration: 'none',
              fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
              fontSize: 13, letterSpacing: '0.08em',
            }}>
            {T('dash_whatsapp')}
          </a>
        </div>
      </div>
    </div>
  )
}

// ── style helpers for the Unit Economics tiles ──
function ueTileStyle(accent: string): React.CSSProperties {
  return {
    background: `${BRAND.bgDeep}aa`,
    border: `1px solid ${accent}55`,
    borderRadius: 10, padding: '12px 14px',
  }
}
const ueLabelStyle: React.CSSProperties = {
  fontFamily: FONTS.display, fontWeight: 700, fontSize: 9, letterSpacing: '0.15em',
  color: `${BRAND.heirloom}66`, textTransform: 'uppercase', marginBottom: 4,
}
function ueNumStyle(accent: string): React.CSSProperties {
  return {
    fontFamily: FONTS.display, fontWeight: 900, fontSize: 26, color: accent,
    lineHeight: 1, display: 'flex', alignItems: 'baseline', gap: 6,
  }
}
const ueUnitStyle: React.CSSProperties = {
  fontSize: 11, color: `${BRAND.heirloom}66`, fontWeight: 700,
}
const ueHintStyle: React.CSSProperties = {
  fontFamily: FONTS.body, fontSize: 10, color: `${BRAND.heirloom}55`, marginTop: 4,
}
