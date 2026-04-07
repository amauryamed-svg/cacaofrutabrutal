import { Link, useLocation, useNavigate } from 'react-router-dom'
import { BRAND } from '../../utils/constants'
import CauaLogo from '../ui/CauaLogo'
import CauaButton from '../ui/CauaButton'
import { useAuth } from '../../context/AuthContext'

const TABS = [
  { path: '/',           label: 'INICIO'  },
  { path: '/marketplace',label: 'MERCADO' },
  { path: '/ritual',     label: 'RITUAL'  },
  { path: '/dashboard',  label: 'IMPACTO' },
]

export default function NavBar() {
  const location = useLocation()
  const navigate  = useNavigate()
  const { user, setUser } = useAuth()

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: `${BRAND.bgDeep}ee`, backdropFilter: 'blur(20px)',
      borderBottom: `1px solid ${BRAND.amazon}44`,
      padding: '12px 24px', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <Link to="/" style={{ textDecoration: 'none' }}>
        <CauaLogo size={28} />
      </Link>

      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        {TABS.map(t => {
          const active = location.pathname === t.path
          return (
            <Link key={t.path} to={t.path} style={{ textDecoration: 'none' }}>
              <button style={{
                background: active ? `${BRAND.pod}22` : 'transparent',
                border: active ? `1px solid ${BRAND.pod}44` : '1px solid transparent',
                color: active ? BRAND.pod : `${BRAND.heirloom}88`,
                padding: '6px 14px', borderRadius: 999, cursor: 'pointer',
                fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
                fontSize: 11, letterSpacing: '0.12em', transition: 'all 0.3s',
              }}>{t.label}</button>
            </Link>
          )
        })}

        {/* Separador */}
        <div style={{ width: 1, height: 16, background: `${BRAND.amazon}66`, margin: '0 4px' }} />

        {/* Links externos */}
        <a href="/pitch_growth.html" target="_blank" rel="noopener noreferrer"
          title="Pitch Deck"
          style={{
            padding: '6px 12px', borderRadius: 999, cursor: 'pointer',
            fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
            fontSize: 11, letterSpacing: '0.12em', textDecoration: 'none',
            color: `${BRAND.mazorca}99`,
            border: '1px solid transparent',
            transition: 'all 0.3s',
          }}>
          📊 PITCH
        </a>
        <a href="/siembra.html" target="_blank" rel="noopener noreferrer"
          title="Simulación Siembra"
          style={{
            padding: '6px 12px', borderRadius: 999, cursor: 'pointer',
            fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
            fontSize: 11, letterSpacing: '0.12em', textDecoration: 'none',
            color: `${BRAND.pod}99`,
            border: '1px solid transparent',
            transition: 'all 0.3s',
          }}>
          🌱 SIEMBRA
        </a>
      </div>

      <div>
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: `linear-gradient(135deg, ${BRAND.criollo}, ${BRAND.theobroma})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: BRAND.heirloom,
            }}>{user[0].toUpperCase()}</div>
            <button onClick={() => setUser(null)} style={{
              background: 'none', border: 'none', color: `${BRAND.heirloom}66`,
              fontSize: 10, cursor: 'pointer',
            }}>Salir</button>
          </div>
        ) : (
          <CauaButton size="sm" onClick={() => navigate('/auth')}>ENTRAR</CauaButton>
        )}
      </div>
    </nav>
  )
}
