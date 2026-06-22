import { Link } from 'react-router-dom'
import { BRAND, FONTS } from '../utils/constants'
import { useAuth } from '../context/AuthContext'
import { useCocoaTrees } from '../hooks/useCocoaTrees'
import { useTokenBalance } from '../hooks/useTokenBalance'
import CacaoCeremonyCTA from '../components/marketplace/CacaoCeremonyCTA'

const FAMILIES_PER_TREE = 0.05
const KG_HARVEST_PER_MAZORCA = 0.2

export default function Impacto() {
  const { user } = useAuth()
  const { trees } = useCocoaTrees()
  const { mazorcas, beans } = useTokenBalance()

  const treeCount = trees.length
  const co2Captured = trees.reduce((sum, t) => sum + (t.co2_kg ?? 0), 0)
  const familiesSupported = Math.max(0, Math.round(treeCount * FAMILIES_PER_TREE * 10) / 10)
  const cacaoHarvested = Math.round(mazorcas * KG_HARVEST_PER_MAZORCA * 10) / 10

  if (!user) {
    return (
      <div style={pageStyle}>
        <div style={containerStyle}>
          <Eyebrow>TU IMPACTO WALLET</Eyebrow>
          <Title>UN ÁRBOL ES UN ACTIVO VIVO</Title>
          <p style={leadStyle}>
            Adopta tu primer árbol y desbloquea tu wallet de impacto:
            CO₂ capturado on-tree, mazorcas mineadas en cosecha,
            yield convertible a Cacao Ceremony de Cauacolombia.co.
          </p>
          <Link to="/adoptar" style={primaryCtaStyle}>Adoptar mi primer árbol →</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <Eyebrow>TU IMPACTO WALLET</Eyebrow>
        <Title>{treeCount > 0 ? 'TU WALLET ON-TREE' : 'ACTIVA TU WALLET'}</Title>

        {treeCount === 0 ? (
          <>
            <p style={leadStyle}>
              Tu wallet aún no tiene árboles. Cada árbol que adoptas mintea
              CO₂ on-chain off-chain, sostiene una familia guardiana en Huila,
              y reduce tu precio de Cacao Ceremony en Cauacolombia.co.
            </p>
            <Link to="/adoptar" style={primaryCtaStyle}>Mintear mi primer árbol →</Link>
          </>
        ) : (
          <>
            <div style={metricsGridStyle}>
              <Metric label="Árboles en wallet"     value={String(treeCount)}                accent={BRAND.amazon} />
              <Metric label="CO₂ capturado (kg)"    value={String(Math.round(co2Captured))}  accent={BRAND.pod} />
              <Metric label="Cacao on-tree (kg)"    value={String(cacaoHarvested)}           accent={BRAND.theobroma} />
              <Metric label="Familias guardianas"   value={String(familiesSupported)}        accent={BRAND.muisca} />
              <Metric label="Mazorcas (claimable)"  value={String(Math.floor(mazorcas))}     accent={BRAND.mazorca} />
              <Metric label="Beans (lifetime)"      value={String(Math.floor(beans))}        accent={BRAND.criollo} />
            </div>

            <div style={narrativeStyle}>
              <h3 style={subTitleStyle}>De wallet a producto real</h3>
              <p style={leadStyle}>
                Cada uno de tus {treeCount} {treeCount === 1 ? 'árbol' : 'árboles'} en Huila
                rinde mucílago fresco que se procesa con nuestras tecnologías propietarias —
                MucilageExtract™ e HydroSol™ — y termina como Cacao Ceremony,
                el cacao ceremonial Criollo de Cauacolombia.co. Tu wallet, en producto sostenible.
              </p>
            </div>

            <CacaoCeremonyCTA variant="impacto" />
          </>
        )}
      </div>
    </div>
  )
}

function Metric({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div style={{
      background: '#0E1A12',
      border: `1px solid ${accent}55`,
      borderRadius: 10,
      padding: 16,
    }}>
      <div style={{
        fontFamily: FONTS.body, color: `${BRAND.heirloom}66`,
        fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase',
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: FONTS.display, fontWeight: 900, color: accent,
        fontSize: 32, marginTop: 6, lineHeight: 1,
      }}>
        {value}
      </div>
    </div>
  )
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontFamily: FONTS.serif, fontStyle: 'italic',
      color: BRAND.mazorca, fontSize: 12, letterSpacing: '0.25em',
      margin: 0, textTransform: 'uppercase',
    }}>
      {children}
    </p>
  )
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h1 style={{
      fontFamily: FONTS.display, fontWeight: 900,
      fontSize: 'clamp(32px, 6vw, 56px)', color: BRAND.heirloom,
      textTransform: 'uppercase', margin: '8px 0 20px', lineHeight: 1,
    }}>
      {children}
    </h1>
  )
}

const pageStyle: React.CSSProperties = {
  background: BRAND.bgDeep,
  minHeight: '100vh',
  color: BRAND.heirloom,
}

const containerStyle: React.CSSProperties = {
  maxWidth: 1100,
  margin: '0 auto',
  padding: 'clamp(24px, 5vw, 48px)',
}

const leadStyle: React.CSSProperties = {
  fontFamily: FONTS.body,
  color: `${BRAND.heirloom}cc`,
  fontSize: 15,
  lineHeight: 1.65,
  maxWidth: 720,
  margin: '0 0 24px',
}

const subTitleStyle: React.CSSProperties = {
  fontFamily: FONTS.display,
  fontWeight: 800,
  fontSize: 20,
  color: BRAND.pod,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  margin: '40px 0 12px',
}

const metricsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(180px, 100%), 1fr))',
  gap: 14,
  marginTop: 24,
}

const narrativeStyle: React.CSSProperties = {
  background: '#0A1810',
  border: `1px solid ${BRAND.amazon}66`,
  borderRadius: 12,
  padding: 24,
  marginTop: 32,
}

const primaryCtaStyle: React.CSSProperties = {
  display: 'inline-block',
  marginTop: 8,
  padding: '14px 24px',
  background: BRAND.mazorca,
  color: BRAND.bgDeep,
  textDecoration: 'none',
  borderRadius: 8,
  fontFamily: FONTS.display,
  fontWeight: 800,
  fontSize: 13,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
}
