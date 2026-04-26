import { useNavigate } from 'react-router-dom'
import { BRAND, FONTS, GUARDIANS } from '../utils/constants'
import { useAuth } from '../context/AuthContext'
import { useCocoaTrees } from '../hooks/useCocoaTrees'
import { useTokenBalance } from '../hooks/useTokenBalance'
import HubspotLeadForm from '../components/ui/HubspotLeadForm'
import { useLang } from '../context/LangContext'
import { makeT } from '../utils/i18n'
import {
  getStageByHours, hoursSinceAdoption, getCycleProgress, isHarvestReady,
  ADOPTION_HOURS, formatTimeUntil,
} from '../utils/growthSystem'

// Unit Economics anchors — keep in sync with public/investor-landing.html §8.4 data-target values.
const UE_REVENUE_PER_TREE_YEAR_USD = 240
const UE_NETWORK_TREES_TOTAL       = 1850

export default function Dashboard() {
  const { profile } = useAuth()
  const { lang } = useLang()
  const T = makeT(lang)
  const navigate = useNavigate()
  const { trees, loading: treesLoading } = useCocoaTrees()
  const { mazorcas, beans } = useTokenBalance()

  // Per-portfolio rollups anchored to investor-landing Unit Economics
  const adoptedCount     = trees.length
  const totalCo2Kg       = trees.reduce((sum, t) => sum + (t.co2_kg ?? 0), 0)
  const totalRevenueUsd  = trees.reduce((sum, t) => sum + getCycleProgress(t.adopted_at) * UE_REVENUE_PER_TREE_YEAR_USD, 0)
  const harvestReadyCount = trees.filter(t => isHarvestReady(t.adopted_at)).length

  const METRICS = [
    { label: lang === 'es' ? 'Toneladas Desviadas'    : 'Tons Diverted',         value: '2.4', unit: 'ton',  icon: '♻️', color: BRAND.pod     },
    { label: lang === 'es' ? 'Familias Impactadas'    : 'Families Impacted',      value: '5',   unit: 'fam.', icon: '👨‍👩‍👧‍👦', color: BRAND.mazorca },
    { label: lang === 'es' ? 'Ingreso +% Agricultor'  : 'Farmer Income Increase', value: '+180',unit: '%',    icon: '📈', color: BRAND.heroic  },
    { label: lang === 'es' ? 'Biodiversidad Protegida': 'Protected Biodiversity', value: '12',  unit: 'ha',   icon: '🌳', color: BRAND.pod     },
  ]

  const TIMELINE = [
    { q: 'Q1 2026', title: lang === 'es' ? 'MVP + Validación' : 'MVP + Validation', status: 'active',   items: ['Landing + Marketplace', '100 pre-orders', 'BFFood Candidatura'] },
    { q: 'Q2 2026', title: lang === 'es' ? 'Producción'       : 'Production',        status: 'upcoming', items: ['600L Sunrise Shot', 'CAUA Labs apertura', lang === 'es' ? '5 guardianes activos' : '5 active guardians'] },
    { q: 'Q3 2026', title: lang === 'es' ? 'Escala'           : 'Scale',             status: 'upcoming', items: [lang === 'es' ? 'Whole Foods Austin' : 'Whole Foods Austin', 'CAUA Inc Registration', lang === 'es' ? 'Certificación orgánica' : 'Organic Certification'] },
    { q: 'Q4 2026', title: lang === 'es' ? 'Ronda Semilla'    : 'Seed Round',        status: 'upcoming', items: ['$750K - $1.5M raise', lang === 'es' ? 'Equipo clave 3+' : 'Core team 3+', lang === 'es' ? 'Certificaciones EU' : 'EU Certifications'] },
    { q: '2027',    title: lang === 'es' ? 'Crecimiento'      : 'Growth',            status: 'future',   items: ['$500K revenue', lang === 'es' ? '8-10 guardianes' : '8-10 guardians', lang === 'es' ? 'Distribución EU' : 'EU Distribution'] },
    { q: '2028-29', title: lang === 'es' ? 'Consolidación'    : 'Consolidation',     status: 'future',   items: ['$1M+ revenue', lang === 'es' ? 'Licencias IP' : 'IP Licenses', lang === 'es' ? '5 países' : '5 countries'] },
  ]

  const DISTRIBUTION = [
    { label: lang === 'es' ? 'Agricultor (Guardián)'   : 'Farmer (Guardian)',        pct: 35, color: BRAND.pod      },
    { label: lang === 'es' ? 'Producción + R&D'        : 'Production + R&D',         pct: 25, color: BRAND.muisca   },
    { label: lang === 'es' ? 'Operaciones + Logística' : 'Operations + Logistics',   pct: 15, color: BRAND.mazorca  },
    { label: lang === 'es' ? 'Marketing + Comunidad'   : 'Marketing + Community',    pct: 10, color: BRAND.theobroma},
    { label: lang === 'es' ? 'Reinversión + Impacto'   : 'Reinvestment + Impact',    pct: 10, color: BRAND.criollo  },
    { label: 'Equipo CAUA',                                                           pct: 5,  color: BRAND.heroic   },
  ]

  return (
    <div style={{ background: '#040C06', minHeight: '100vh', paddingTop: 80 }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: 'clamp(24px,5vw,40px) var(--space-page)' }}>

        <p style={{ fontFamily: FONTS.serif, fontStyle: 'italic', color: BRAND.mazorca, fontSize: 12, letterSpacing: '0.2em', marginBottom: 8 }}>
          {T('dash_eyebrow')}
        </p>
        <h2 style={{
          fontFamily: FONTS.display, fontWeight: 900,
          fontSize: 'clamp(36px, 8vw, 56px)', color: BRAND.heirloom,
          textTransform: 'uppercase', margin: '0 0 32px', lineHeight: 0.95,
        }}>{T('dash_title').split(' ')[0]} <span style={{ color: BRAND.pod }}>{T('dash_title').split(' ')[1]}</span></h2>

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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
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
                <button onClick={() => navigate('/marketplace')} style={{
                  padding: '10px 18px', borderRadius: 999,
                  background: `linear-gradient(135deg, ${BRAND.mazorca}, ${BRAND.brown})`,
                  color: BRAND.bgDeep, border: 'none', cursor: 'pointer',
                  fontFamily: FONTS.display, fontWeight: 700, fontSize: 11, letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                }}>
                  {lang === 'es' ? 'Canjear →' : 'Redeem →'}
                </button>
              </div>
            )}

            {/* Tree tiles */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}>
              {trees.map(t => {
                const g = GUARDIANS[t.guardian_id]
                const hours = hoursSinceAdoption(t.adopted_at)
                const stage = getStageByHours(hours)
                const cyclePct = getCycleProgress(t.adopted_at) * 100
                const ready = isHarvestReady(t.adopted_at)
                const remaining = formatTimeUntil(new Date(new Date(t.adopted_at).getTime() + ADOPTION_HOURS * 3600000))
                return (
                  <button key={t.id} onClick={() => navigate(`/tree/${t.id}`)} style={{
                    background: ready ? `${BRAND.mazorca}1a` : BRAND.bgCard,
                    border: `1px solid ${ready ? BRAND.mazorca + 'aa' : BRAND.amazon + '88'}`,
                    borderRadius: 12, padding: '12px 14px', cursor: 'pointer',
                    color: BRAND.heirloom, textAlign: 'left',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 22 }}>{stage.emoji}</span>
                      {ready && <span style={{ fontFamily: FONTS.display, fontSize: 9, fontWeight: 800, color: BRAND.mazorca, letterSpacing: '0.12em', background: `${BRAND.mazorca}33`, padding: '2px 6px', borderRadius: 4 }}>🍫 LISTO</span>}
                    </div>
                    <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 13, color: BRAND.heirloom }}>
                      {g?.name ?? 'Árbol'} · <span style={{ color: BRAND.pod }}>{stage.name}</span>
                    </div>
                    <div style={{ fontFamily: FONTS.body, fontSize: 10, color: `${BRAND.heirloom}66`, marginTop: 2 }}>
                      {ready ? (lang === 'es' ? 'Cosecha disponible' : 'Harvest available') : `${remaining} ${lang === 'es' ? 'restantes' : 'left'}`}
                    </div>
                    <div style={{ marginTop: 8, height: 4, background: `${BRAND.amazon}55`, borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: `${cyclePct}%`, height: '100%', background: `linear-gradient(90deg, ${BRAND.pod}, ${BRAND.mazorca})` }} />
                    </div>
                  </button>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 45%), 1fr))', gap: 16, marginBottom: 48 }}>
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
            <div key={i} style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
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
