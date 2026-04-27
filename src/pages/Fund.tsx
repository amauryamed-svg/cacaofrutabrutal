import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BRAND, FONTS } from '../utils/constants'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import { useFundData } from '../hooks/useFundData'
import FundHero from '../components/fund/FundHero'
import TechnologyCard from '../components/fund/TechnologyCard'
import InvestorPath from '../components/fund/InvestorPath'
import CacaoCeremonyCTA from '../components/marketplace/CacaoCeremonyCTA'
import type { CauaRole } from '../types/fund.types'

export default function Fund() {
  const { user, profile } = useAuth()
  const { lang } = useLang()
  const { technologies, totalRaisedUsd, totalGoalUsd, loading, error } = useFundData()
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
          position: 'fixed', top: 64, left: 0, right: 0, zIndex: 90,
          background: `${BRAND.pod}22`, borderBottom: `1px solid ${BRAND.pod}44`,
          padding: '10px var(--space-page)', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span>✓</span>
          <span style={{ fontFamily: FONTS.body, fontSize: 13, color: BRAND.pod }}>
            {lang === 'es' ? '¡Inversión registrada! Recibirás confirmación por correo.' : 'Investment registered! You\'ll receive a confirmation email.'}
          </span>
        </div>
      )}
      {status === 'cancelled' && (
        <div style={{
          position: 'fixed', top: 64, left: 0, right: 0, zIndex: 90,
          background: `${BRAND.radioRed}18`, borderBottom: `1px solid ${BRAND.radioRed}33`,
          padding: '10px var(--space-page)', display: 'flex', alignItems: 'center', gap: 8,
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
      </div>
    </div>
  )
}
