import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BRAND, FONTS, GUARDIANS, MAZORCA_TO_CACAO_RATE } from '../utils/constants'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useCocoaTrees } from '../hooks/useCocoaTrees'
import { useTokenBalance } from '../hooks/useTokenBalance'
import HubspotLeadForm from '../components/ui/HubspotLeadForm'
import RedeemMazorcasModal from '../components/web3/RedeemMazorcasModal'
import LabranzaMachete from '../components/dashboard/LabranzaMachete'
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
  const { mazorcas, beans, mucilageG, cacaoMassG, chocolateBarsMade } = useTokenBalance()
  const canForgeChocolate = mucilageG >= 300 && cacaoMassG >= 250
  const [redeemOpen, setRedeemOpen] = useState(false)
  const [deadBannerDismissed, setDeadBannerDismissed] = useState(false)
  const [labranzaMode, setLabranzaMode] = useState<'machete' | 'list'>('machete')
  const canRedeemOnChain = mazorcas >= MAZORCA_TO_CACAO_RATE

  // Per-portfolio rollups anchored to investor-landing Unit Economics
  const adoptedCount     = trees.length
  const totalCo2Kg       = trees.reduce((sum, t) => sum + (t.co2_kg ?? 0), 0)
  const totalRevenueUsd  = trees.reduce((sum, t) => sum + getCycleProgress(t.adopted_at) * UE_REVENUE_PER_TREE_YEAR_USD, 0)
  const harvestReadyCount = trees.filter(t => isHarvestReady(t)).length
  // Phase 1.5 lifecycle: muerte por vitals (server-side decided), peligro
  // por vitals bajos. Sin componente temporal — ya no contamos "horas para
  // morir". `died_at` es la única fuente de verdad de muerte.
  const atRiskCount = trees.filter(t => !t.died_at && isInDeathDanger(t)).length
  const deadCount   = trees.filter(t => isTreeDead(t)).length

  // Unit Economics anchored al modelo de adopción USD 5 (Coinbase CDP sandbox-aligned).
  // Datos verificables — no proyecciones aspiracionales.
  const METRICS = [
    { label: lang === 'es' ? 'Precio adopción'       : 'Adoption price',         value: '$5',  unit: 'USD',     icon: '🌱', color: BRAND.pod     },
    { label: lang === 'es' ? 'Al guardián directo'   : 'To guardian direct',     value: '60',  unit: '%',       icon: '👨‍🌾', color: BRAND.mazorca },
    { label: lang === 'es' ? 'Ratio canje on-chain'  : 'On-chain redeem ratio',  value: '1000',unit: ': 1',     icon: '🍫', color: BRAND.heroic  },
    { label: lang === 'es' ? 'Cap $CACAO ERC-20'     : '$CACAO supply cap',      value: '21',  unit: 'M',       icon: '⬡', color: BRAND.criollo  },
  ]

  // HOJA DE RUTA + DISTRIBUCIÓN movidos a /fund (FONDO hub) — esta página es
  // Phase 1 user wallet only. Ver Fund.tsx para la fuente actual.

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
                  {/* Phase 3 — Lab CTA. Only visible when the user has the
                      mucilage + cacao_mass for at least one chocolate bar.
                      Routes to /lab where the 3-stage forge runs. */}
                  {canForgeChocolate && (
                    <button
                      onClick={() => navigate('/lab')}
                      title={lang === 'es' ? 'Liofiliza · refina · conchea' : 'Lyophilize · refine · conch'}
                      style={{
                        flex: '1 1 180px', padding: '10px 16px', borderRadius: 999,
                        background: `linear-gradient(135deg, ${BRAND.heroic}33, ${BRAND.mazorca}33)`,
                        color: BRAND.heirloom,
                        border: `1px solid ${BRAND.mazorca}aa`,
                        cursor: 'pointer',
                        fontFamily: FONTS.display, fontWeight: 700, fontSize: 11,
                        letterSpacing: '0.1em', textTransform: 'uppercase',
                        boxShadow: `0 0 16px ${BRAND.mazorca}33`,
                      }}>
                      {lang === 'es' ? '🍫 Forjar chocolate →' : '🍫 Forge chocolate →'}
                    </button>
                  )}
                </div>
                {chocolateBarsMade > 0 && (
                  <div style={{
                    width: '100%',
                    fontFamily: FONTS.body, fontSize: 10,
                    color: `${BRAND.mazorca}cc`, letterSpacing: '0.06em',
                    marginTop: 4, textAlign: 'right',
                  }}>
                    🍫 {chocolateBarsMade} {lang === 'es' ? 'forjada' : 'forged'}{chocolateBarsMade !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            )}

            {/* Mi Jardín · Labranza — split por estado de vida.
                Vivos (sanos/peligro/cosecha) en el grid principal.
                Muertos en sección Labranza · biomasa que regresa al suelo,
                con acción "Regenerar" visible. Tiles más grandes (minmax 220,
                minHeight 220) para que cada árbol respire. */}
            {(() => {
              const annotated = trees.map(t => {
                const g = GUARDIANS[t.guardian_id]
                const hours = hoursSinceAdoption(t.adopted_at)
                const stage = getStageByHours(hours)
                const cyclePct = getCycleProgress(t.adopted_at) * 100
                // Phase 1.5: harvested deja de ser un lock (cosecha recurrente).
                // Mantengo el flag por si la UI quiere distinguir "ya cosechó
                // alguna vez" pero no bloquea ready/danger/dead.
                const harvested = !!t.harvested_at
                const dead   = isTreeDead(t)
                const ready  = !dead && isHarvestReady(t)
                const danger = !dead && isInDeathDanger(t)
                const remaining = formatTimeUntil(new Date(new Date(t.adopted_at).getTime() + ADOPTION_HOURS * 3600000))
                return { t, g, stage, cyclePct, harvested, dead, ready, danger, remaining }
              })
              const aliveTrees = annotated.filter(x => !x.dead)
              const deadTrees  = annotated.filter(x =>  x.dead)

              const sectionLabelStyle: React.CSSProperties = {
                fontFamily: FONTS.display, fontWeight: 800, fontSize: 11,
                color: `${BRAND.heirloom}aa`, letterSpacing: '0.22em',
                textTransform: 'uppercase', marginBottom: 12,
                display: 'flex', alignItems: 'center', gap: 10,
              }

              return (
                <>
                  {/* MI JARDÍN — árboles vivos */}
                  {aliveTrees.length > 0 && (
                    <>
                      <div style={sectionLabelStyle}>
                        <span>Mi Jardín</span>
                        <span style={{ color: `${BRAND.pod}aa`, fontSize: 13 }}>· {aliveTrees.length}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 'clamp(14px, 2.5vw, 20px)', marginBottom: deadTrees.length > 0 ? 32 : 0 }}>
                        {aliveTrees.map(({ t, g, stage, cyclePct, harvested, ready, danger, remaining }) => {
                          const accent = danger ? BRAND.mazorca
                                       : ready ? BRAND.mazorca
                                       : BRAND.pod
                          const statusLabel = danger ? 'En riesgo'
                                            : ready ? 'Cosecha lista'
                                            : harvested ? 'Cosechado'
                                            : stage.name
                          const statusEmoji = danger ? '⚠️'
                                            : ready ? '🍫'
                                            : harvested ? '✓'
                                            : stage.emoji

                          return (
                            <div key={t.id} style={{
                              background: danger ? `${BRAND.mazorca}10`
                                        : ready ? `${BRAND.mazorca}1a`
                                        : `linear-gradient(160deg, ${BRAND.bgCard}, ${BRAND.bgDeep})`,
                              border: `1px solid ${accent}${danger || ready ? 'aa' : '66'}`,
                              borderRadius: 16, padding: 'clamp(18px, 3vw, 24px)',
                              color: BRAND.heirloom, textAlign: 'left',
                              boxShadow: ready ? `0 0 24px ${BRAND.mazorca}33`
                                       : danger ? `0 0 18px ${BRAND.mazorca}22`
                                       : 'none',
                              transition: 'transform 0.2s, box-shadow 0.2s',
                              display: 'flex', flexDirection: 'column', gap: 12,
                              minHeight: 220, position: 'relative',
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
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                  <span style={{ fontSize: 'clamp(48px, 7.5vw, 64px)', lineHeight: 1 }}>{statusEmoji}</span>
                                  <span style={{
                                    fontFamily: FONTS.display, fontSize: 9, fontWeight: 800,
                                    color: accent, letterSpacing: '0.12em',
                                    background: `${accent}22`, padding: '4px 10px', borderRadius: 999,
                                    textTransform: 'uppercase',
                                  }}>
                                    {statusLabel}
                                  </span>
                                </div>

                                <div>
                                  <div style={{
                                    fontFamily: FONTS.display, fontWeight: 900,
                                    fontSize: 'clamp(20px, 3vw, 24px)',
                                    color: BRAND.heirloom, lineHeight: 1, letterSpacing: '0.02em',
                                  }}>
                                    {g?.name ?? 'Árbol'}
                                  </div>
                                  <div style={{
                                    fontFamily: FONTS.serif, fontStyle: 'italic',
                                    color: accent,
                                    fontSize: 13, marginTop: 4, letterSpacing: '0.04em',
                                  }}>
                                    {stage.name} · {g?.region ?? '—'}
                                  </div>
                                </div>

                                <div style={{
                                  fontFamily: FONTS.body, fontSize: 11,
                                  color: `${BRAND.heirloom}88`, marginTop: 'auto',
                                }}>
                                  {ready ? (lang === 'es' ? '¡Cosecha disponible ahora!' : 'Harvest ready now!')
                                   : danger ? (lang === 'es' ? 'Cuídalo cuanto antes' : 'Care now')
                                   : `${remaining} ${lang === 'es' ? 'al ciclo completo' : 'to full cycle'}`}
                                </div>

                                <div style={{ height: 6, background: `${BRAND.amazon}66`, borderRadius: 999, overflow: 'hidden' }}>
                                  <div style={{
                                    width: `${cyclePct}%`, height: '100%',
                                    background: `linear-gradient(90deg, ${BRAND.pod}, ${BRAND.mazorca})`,
                                    transition: 'width 0.6s',
                                  }} />
                                </div>
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    </>
                  )}

                  {/* LABRANZA — árboles muertos. Por defecto el modo machete
                      (Fruit-Ninja-style slicing); el usuario puede cambiar a
                      list view si prefiere ver detalles antes de regenerar.
                      Mismo deleteTree backend en ambos modos.
                      `id="labranza"` así Adoptar.tsx puede deep-linkear con
                      navigate('/dashboard#labranza') y el browser auto-scrolea. */}
                  {deadTrees.length > 0 && (
                    <div id="labranza" style={{ scrollMarginTop: 80 }}>
                      <div style={{ ...sectionLabelStyle, justifyContent: 'space-between' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span>Labranza</span>
                          <span style={{ color: '#e74c3caa', fontSize: 13 }}>· {deadTrees.length}</span>
                        </span>
                        <button
                          onClick={() => setLabranzaMode(m => m === 'machete' ? 'list' : 'machete')}
                          style={{
                            background: 'transparent',
                            border: `1px solid ${BRAND.heirloom}33`,
                            color: `${BRAND.heirloom}aa`,
                            borderRadius: 999, padding: '5px 12px', cursor: 'pointer',
                            fontFamily: FONTS.display, fontWeight: 700, fontSize: 9,
                            letterSpacing: '0.18em', textTransform: 'uppercase',
                          }}
                        >
                          {labranzaMode === 'machete'
                            ? (lang === 'es' ? '▭ Ver lista' : '▭ List view')
                            : (lang === 'es' ? '⚔ Modo machete' : '⚔ Machete mode')}
                        </button>
                      </div>
                      <div style={{
                        fontFamily: FONTS.serif, fontStyle: 'italic',
                        color: `${BRAND.heirloom}66`, fontSize: 12,
                        marginTop: -6, marginBottom: 14, letterSpacing: '0.04em',
                      }}>
                        {labranzaMode === 'machete'
                          ? (lang === 'es'
                              ? 'Desliza el machete sobre cada árbol para regenerarlo · biomasa que regresa al suelo'
                              : 'Swipe the machete across each tree to regenerate · biomass returning to soil')
                          : (lang === 'es'
                              ? 'Biomasa que regresa al suelo · regenera para sembrar de nuevo'
                              : 'Biomass returning to soil · regenerate to plant again')}
                      </div>
                      {labranzaMode === 'machete' ? (
                        <LabranzaMachete
                          trees={deadTrees.map(({ t, g }) => ({ id: t.id, guardianName: g?.name ?? 'Árbol' }))}
                          onRecycle={async (id) => {
                            // Phase 2.5 — award tree_compost_regen FIRST so
                            // the Edge Function can validate `died_at` while
                            // the tree row still exists, mint a
                            // lineage_regenerations record, and credit +10
                            // beans. THEN delete the tree from the user's
                            // visible list. Errors on the regen step are
                            // tolerated — the slice anim still plays.
                            try {
                              const { data: { session } } = await supabase.auth.getSession()
                              const token = session?.access_token
                              if (token) {
                                await fetch(
                                  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/award-tokens`,
                                  {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      Authorization: `Bearer ${token}`,
                                    },
                                    body: JSON.stringify({
                                      event_type: 'tree_compost_regen',
                                      ref_id:     id,
                                    }),
                                  },
                                )
                              }
                            } catch { /* non-blocking */ }
                            await deleteTree(id)
                          }}
                          lang={lang}
                        />
                      ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))', gap: 'clamp(14px, 2.5vw, 20px)' }}>
                        {deadTrees.map(({ t, g }) => (
                          <div key={t.id} style={{
                            background: '#1a0606',
                            border: `1px solid #e74c3caa`,
                            borderRadius: 16, padding: 'clamp(18px, 3vw, 24px)',
                            color: BRAND.heirloom, textAlign: 'left',
                            boxShadow: 'inset 0 0 30px #e74c3c22',
                            display: 'flex', flexDirection: 'column', gap: 14,
                            minHeight: 220, position: 'relative',
                          }}>
                            <button onClick={() => navigate(`/tree/${t.id}`)} style={{
                              background: 'transparent', border: 'none', cursor: 'pointer',
                              color: 'inherit', padding: 0, textAlign: 'left',
                              display: 'flex', flexDirection: 'column', gap: 12,
                              width: '100%',
                            }}>
                              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                <span style={{
                                  fontSize: 'clamp(48px, 7.5vw, 64px)', lineHeight: 1,
                                  opacity: 0.55, filter: 'grayscale(0.7)',
                                }}>💀</span>
                                <span style={{
                                  fontFamily: FONTS.display, fontSize: 9, fontWeight: 800,
                                  color: '#e74c3c', letterSpacing: '0.12em',
                                  background: '#e74c3c22', padding: '4px 10px', borderRadius: 999,
                                  textTransform: 'uppercase',
                                }}>
                                  Muerto
                                </span>
                              </div>

                              <div>
                                <div style={{
                                  fontFamily: FONTS.display, fontWeight: 900,
                                  fontSize: 'clamp(20px, 3vw, 24px)',
                                  color: BRAND.heirloom, lineHeight: 1, letterSpacing: '0.02em',
                                  opacity: 0.85,
                                }}>
                                  {g?.name ?? 'Árbol'}
                                </div>
                                <div style={{
                                  fontFamily: FONTS.serif, fontStyle: 'italic',
                                  color: `${BRAND.heirloom}55`,
                                  fontSize: 13, marginTop: 4, letterSpacing: '0.04em',
                                }}>
                                  {g?.region ?? '—'} · biomasa
                                </div>
                              </div>

                              <div style={{
                                fontFamily: FONTS.body, fontSize: 11,
                                color: `${BRAND.heirloom}77`, marginTop: 'auto',
                                lineHeight: 1.5,
                              }}>
                                {lang === 'es'
                                  ? 'Tokens de gameplay quemados. Tu inversión inicial ya se desplegó al adoptar.'
                                  : 'Gameplay tokens burned. Your initial investment was already deployed at adoption.'}
                              </div>
                            </button>

                            <button
                              onClick={async (e) => {
                                e.stopPropagation()
                                if (!confirm(`¿Devolver el árbol de ${g?.name ?? 'guardián'} a la tierra?\n\nSu biomasa nutre el suelo de la próxima siembra. Esta acción no se puede deshacer.`)) return
                                try { await deleteTree(t.id) }
                                catch (err) { alert(`No se pudo devolver: ${err instanceof Error ? err.message : 'Error desconocido'}`) }
                              }}
                              title="Devolver a la tierra · regenerar"
                              aria-label="Devolver árbol a la tierra"
                              style={{
                                width: '100%',
                                padding: '12px 16px', borderRadius: 999,
                                background: `${BRAND.pod}1f`,
                                border: `1px solid ${BRAND.pod}88`,
                                color: BRAND.pod, cursor: 'pointer',
                                fontFamily: FONTS.display, fontWeight: 700,
                                fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                              }}
                            >
                              <span style={{ fontSize: 16 }}>🌱</span>
                              {lang === 'es' ? 'Regenerar · Devolver a la tierra' : 'Regenerate · Return to soil'}
                            </button>
                          </div>
                        ))}
                      </div>
                      )}
                    </div>
                  )}
                </>
              )
            })()}

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

        {/* Comunidad WhatsApp + roadmap + distribución viven en /fund (FONDO hub). */}
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
