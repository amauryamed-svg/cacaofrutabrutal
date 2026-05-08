import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BRAND, FONTS } from '../utils/constants'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import { useFundData } from '../hooks/useFundData'
import { makeT } from '../utils/i18n'
import FundHero from '../components/fund/FundHero'
import TechnologyCard from '../components/fund/TechnologyCard'
import InvestorPath from '../components/fund/InvestorPath'
import CacaoCeremonyCTA from '../components/marketplace/CacaoCeremonyCTA'
import type { CauaRole } from '../types/fund.types'

export default function Fund() {
  const { user, profile } = useAuth()
  const { lang } = useLang()
  const T = makeT(lang)
  const { technologies, totalRaisedUsd, totalGoalUsd, loading, error } = useFundData()

  // ── Phase 2 hub content (moved from Dashboard) ───────────────────────
  const TIMELINE = [
    { q: 'Q1 2026', title: lang === 'es' ? 'MVP + Validación' : 'MVP + Validation', status: 'active',   items: ['Landing + Marketplace', '100 pre-orders', 'BFFood Candidatura'] },
    { q: 'Q2 2026', title: lang === 'es' ? 'Producción'       : 'Production',        status: 'upcoming', items: ['600L Sunrise Shot', 'CAUA Labs apertura', lang === 'es' ? '5 guardianes activos' : '5 active guardians'] },
    { q: 'Q3 2026', title: lang === 'es' ? 'Escala'           : 'Scale',             status: 'upcoming', items: [lang === 'es' ? 'Whole Foods Austin' : 'Whole Foods Austin', 'CAUA Inc Registration', lang === 'es' ? 'Certificación orgánica' : 'Organic Certification'] },
    { q: 'Q4 2026', title: lang === 'es' ? 'Ronda Semilla'    : 'Seed Round',        status: 'upcoming', items: ['$750K - $1.5M raise', lang === 'es' ? 'Equipo clave 3+' : 'Core team 3+', lang === 'es' ? 'Certificaciones EU' : 'EU Certifications'] },
    { q: '2027',    title: lang === 'es' ? 'Crecimiento'      : 'Growth',            status: 'future',   items: ['$500K revenue', lang === 'es' ? '8-10 guardianes' : '8-10 guardians', lang === 'es' ? 'Distribución EU' : 'EU Distribution'] },
    { q: '2028-29', title: lang === 'es' ? 'Consolidación'    : 'Consolidation',     status: 'future',   items: ['$1M+ revenue', lang === 'es' ? 'Licencias IP' : 'IP Licenses', lang === 'es' ? '5 países' : '5 countries'] },
  ]
  const DISTRIBUTION = [
    { label: lang === 'es' ? 'Guardián (finca)'         : 'Guardian (farm)',           pct: 60, color: BRAND.pod      },
    { label: lang === 'es' ? 'R&D + Producción'         : 'R&D + Production',          pct: 30, color: BRAND.muisca   },
    { label: lang === 'es' ? 'Comunidad + Reinversión'  : 'Community + Reinvestment',  pct: 10, color: BRAND.criollo  },
  ]
  const [role, setRole] = useState<CauaRole>('creyente')
  const [investorOpen, setInvestorOpen] = useState(false)
  const [searchParams] = useSearchParams()
  const status = searchParams.get('status')

  // Init role from profile
  useEffect(() => {
    if (profile?.caua_role) setRole(profile.caua_role as CauaRole)
  }, [profile?.caua_role])

  return (
    <div style={{ background: BRAND.bgDeep, minHeight: '100vh' }}>
      {/* Payment return banner */}
      {status === 'success' && (
        <div style={{
          position: 'fixed', top: 'var(--nav-h, 60px)', left: 0, right: 0, zIndex: 90,
          background: `${BRAND.pod}22`, borderBottom: `1px solid ${BRAND.pod}44`,
          padding: '10px var(--space-page)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
        }}>
          <span>✓</span>
          <span style={{ fontFamily: FONTS.body, fontSize: 13, color: BRAND.pod }}>
            {lang === 'es' ? '¡Inversión registrada! Recibirás confirmación por correo.' : 'Investment registered! You\'ll receive a confirmation email.'}
          </span>
        </div>
      )}
      {status === 'cancelled' && (
        <div style={{
          position: 'fixed', top: 'var(--nav-h, 60px)', left: 0, right: 0, zIndex: 90,
          background: `${BRAND.radioRed}18`, borderBottom: `1px solid ${BRAND.radioRed}33`,
          padding: '10px var(--space-page)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
        }}>
          <span style={{ fontFamily: FONTS.body, fontSize: 13, color: `${BRAND.radioRed}cc` }}>
            {lang === 'es' ? 'Pago cancelado. Puedes intentarlo de nuevo.' : 'Payment cancelled. You can try again.'}
          </span>
        </div>
      )}

      {/* Hero */}
      <FundHero
        totalRaisedCents={totalRaisedUsd}
        totalGoalCents={totalGoalUsd}
        selectedRole={role}
        onRoleChange={setRole}
        lang={lang}
      />

      {/* Technologies section */}
      <div style={{ padding: '0 var(--space-page) var(--space-section)', maxWidth: 1120, margin: '0 auto' }}>

        {/* Section header */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontFamily: FONTS.serif, fontStyle: 'italic', color: BRAND.mazorca, fontSize: 12, letterSpacing: '0.25em', marginBottom: 8 }}>
            {lang === 'es' ? 'Tecnologías · MVPs · Paid Pilots' : 'Technologies · MVPs · Paid Pilots'}
          </p>
          <h2 style={{
            fontFamily: FONTS.display, fontWeight: 900,
            fontSize: 'clamp(24px,5vw,48px)', color: BRAND.heirloom,
            textTransform: 'uppercase', margin: 0, lineHeight: 0.92,
          }}>
            {lang === 'es' ? 'TECNOLOGÍAS FINANCIABLES' : 'FUNDABLE TECHNOLOGIES'}
          </h2>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div style={{ fontFamily: FONTS.body, color: `${BRAND.heirloom}44`, fontSize: 13 }}>
              {lang === 'es' ? 'Cargando tecnologías...' : 'Loading technologies...'}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            padding: '16px 20px', borderRadius: 12,
            background: `${BRAND.radioRed}14`, border: `1px solid ${BRAND.radioRed}33`,
            fontFamily: FONTS.body, fontSize: 13, color: `${BRAND.radioRed}cc`,
          }}>
            {error}
          </div>
        )}

        {/* "Soy Investor" card — opens InvestorPath modal (equity $5K vs B2B sponsorship) */}
        {user && (
          <button
            onClick={() => setInvestorOpen(true)}
            style={{
              width: '100%', textAlign: 'left',
              background: `linear-gradient(135deg, ${BRAND.mazorca}1a, ${BRAND.bgCard})`,
              border: `1px solid ${BRAND.mazorca}66`,
              borderRadius: 18, padding: '20px 22px',
              cursor: 'pointer', color: BRAND.heirloom,
              marginBottom: 24,
              display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
            }}
          >
            <div style={{ fontSize: 36 }}>💼</div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 16, color: BRAND.heirloom, marginBottom: 4, letterSpacing: '0.04em' }}>
                {lang === 'es' ? 'SOY INVESTOR' : 'I AM AN INVESTOR'}
              </div>
              <div style={{ fontFamily: FONTS.body, fontSize: 12, color: `${BRAND.heirloom}88`, lineHeight: 1.5 }}>
                {lang === 'es'
                  ? 'Pre-Seed Equity ($5K) o B2B Sponsorship — paga con USDC (Coinbase) o ETH directo.'
                  : 'Pre-Seed Equity ($5K) or B2B Sponsorship — pay with USDC (Coinbase) or direct ETH.'}
              </div>
            </div>
            <div style={{
              fontFamily: FONTS.display, fontWeight: 700, fontSize: 11, letterSpacing: '0.15em',
              color: BRAND.mazorca, textTransform: 'uppercase',
            }}>
              {lang === 'es' ? 'Empezar →' : 'Start →'}
            </div>
          </button>
        )}

        {/* Tech cards */}
        {!loading && !error && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {technologies.map(tech => (
              <TechnologyCard key={tech.id} tech={tech} user={user} profile={profile} lang={lang} />
            ))}
          </div>
        )}

        <InvestorPath open={investorOpen} onClose={() => setInvestorOpen(false)} lang={lang} />

        {/* Supply chain explainer */}
        {!loading && (
          <div style={{
            marginTop: 48,
            background: BRAND.bgCard,
            border: `1px solid ${BRAND.amazon}44`,
            borderRadius: 18, padding: '28px 24px',
          }}>
            <p style={{ fontFamily: FONTS.serif, fontStyle: 'italic', color: BRAND.mazorca, fontSize: 11, letterSpacing: '0.2em', marginBottom: 12 }}>
              {lang === 'es' ? 'Cadena de Suministro Vivo' : 'Living Supply Chain'}
            </p>
            <h3 style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 'clamp(18px,4vw,28px)', color: BRAND.heirloom, marginBottom: 20, textTransform: 'uppercase' }}>
              {lang === 'es' ? 'DEL ÁRBOL AL INGREDIENTE' : 'FROM TREE TO INGREDIENT'}
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: 16 }}>
              {[
                {
                  role: lang === 'es' ? 'Agricultores (Guardianes)' : 'Farmers (Guardians)',
                  icon: '🫘',
                  action: lang === 'es' ? 'Venden mucílago fresco → pago en COP' : 'Sell fresh mucilage → paid in COP',
                  color: BRAND.theobroma,
                },
                {
                  role: lang === 'es' ? 'Criollo Élite' : 'Elite Criollo',
                  icon: '🌿',
                  action: lang === 'es' ? 'Procesado para liofilización → MucilageExtract™' : 'Processed for lyophilization → MucilageExtract™',
                  color: BRAND.pod,
                },
                {
                  role: lang === 'es' ? 'Híbridos + Trinitarios' : 'Hybrids + Trinitarians',
                  icon: '💧',
                  action: lang === 'es' ? 'Base para hidrosoles y bebidas → HydroSol™' : 'Base for hydrosols and beverages → HydroSol™',
                  color: BRAND.heroic,
                },
                {
                  role: 'IaaS — B2B',
                  icon: '🏭',
                  action: lang === 'es' ? 'Bebidas · Syrups · Hidrosoles para industria EU' : 'Beverages · Syrups · Hydrosols for EU industry',
                  color: BRAND.mazorca,
                },
              ].map((item, i) => (
                <div key={i} style={{
                  padding: '16px', borderRadius: 12,
                  border: `1px solid ${item.color}22`,
                  background: `${item.color}08`,
                }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{item.icon}</div>
                  <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 12, color: item.color, letterSpacing: '0.06em', marginBottom: 6 }}>{item.role}</div>
                  <div style={{ fontFamily: FONTS.body, fontSize: 11, color: `${BRAND.heirloom}70`, lineHeight: 1.55 }}>{item.action}</div>
                </div>
              ))}
            </div>

            {/* Investor perk: Cacao Ceremony cross-sell */}
            <CacaoCeremonyCTA variant="fondo" />
          </div>
        )}

        {/* ── HOJA DE RUTA — moved from Dashboard, Phase 2 hub content ── */}
        <div style={{ marginTop: 'clamp(48px, 8vw, 80px)' }}>
          <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, color: BRAND.heirloom, fontSize: 'clamp(20px, 4vw, 28px)', letterSpacing: '0.1em', marginBottom: 24, textTransform: 'uppercase' }}>
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
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
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
        </div>

        {/* ── DISTRIBUCIÓN DEL VALOR — moved from Dashboard ── */}
        <div style={{ background: '#132B1C', border: `1px solid ${BRAND.amazon}66`, borderRadius: 12, padding: 24, marginBottom: 40 }}>
          <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, color: BRAND.heirloom, fontSize: 14, letterSpacing: '0.1em', marginBottom: 16, textTransform: 'uppercase' }}>
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

        {/* ── COMUNIDAD WHATSAPP — moved from Dashboard ── */}
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

        {/* ── FONDO HUB · enlaces a superficies Phase 2 ── */}
        <div style={{
          marginTop: 24,
          background: BRAND.bgCard,
          border: `1px solid ${BRAND.amazon}44`,
          borderRadius: 18, padding: '24px 22px',
        }}>
          <p style={{ fontFamily: FONTS.serif, fontStyle: 'italic', color: BRAND.mazorca, fontSize: 11, letterSpacing: '0.2em', marginBottom: 12 }}>
            {lang === 'es' ? 'Otras superficies' : 'Other surfaces'}
          </p>
          <h3 style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 'clamp(18px,4vw,24px)', color: BRAND.heirloom, marginBottom: 16, textTransform: 'uppercase' }}>
            {lang === 'es' ? 'Explora el ecosistema' : 'Explore the ecosystem'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 12 }}>
            {[
              { href: '/marketplace', emoji: '🛒', label: lang === 'es' ? 'Mercado' : 'Market',       hint: lang === 'es' ? 'Tonics · Cold Brew · Ediciones' : 'Tonics · Cold Brew · Editions' },
              { href: '/impacto',     emoji: '📊', label: lang === 'es' ? 'Impacto wallet' : 'Impact wallet', hint: lang === 'es' ? 'CO₂ on-tree · familias guardianas' : 'CO₂ on-tree · guardian families' },
              { href: '/dashboard',   emoji: '🌳', label: lang === 'es' ? 'Tu portafolio' : 'Your portfolio',  hint: lang === 'es' ? 'Métricas + redime $CACAO' : 'Metrics + redeem $CACAO' },
              { href: '/web3',        emoji: '⬡',  label: 'Web3',                                              hint: lang === 'es' ? 'KYC + wallet · NFT árbol' : 'KYC + wallet · tree NFT' },
              { href: '/blog',        emoji: '📰', label: 'Blog',                                              hint: lang === 'es' ? 'Historias de Guardianes' : 'Guardian stories' },
              { href: '/catacion',    emoji: '🍫', label: lang === 'es' ? 'Catación' : 'Tasting',              hint: lang === 'es' ? 'Reserva una experiencia' : 'Book a tasting' },
            ].map(s => (
              <a key={s.href} href={`/app${s.href}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: 'transparent', border: `1px solid ${BRAND.heirloom}22`,
                  borderRadius: 10, padding: '12px 14px',
                  textDecoration: 'none', color: BRAND.heirloom,
                  transition: 'border-color 0.2s, background 0.2s',
                }}
              >
                <span style={{ fontSize: 22 }}>{s.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 12, color: BRAND.heirloom, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    {s.label}
                  </div>
                  <div style={{ fontFamily: FONTS.body, fontSize: 10, color: `${BRAND.heirloom}66`, marginTop: 2 }}>
                    {s.hint}
                  </div>
                </div>
                <span style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 14, color: BRAND.mazorca }}>→</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
