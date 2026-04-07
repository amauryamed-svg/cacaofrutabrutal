import { Link, useLocation, useNavigate } from 'react-router-dom'
import { BRAND } from '../../utils/constants'
import CauaLogo from '../ui/CauaLogo'
import CauaButton from '../ui/CauaButton'
import LanguageToggle from '../ui/LanguageToggle'
import { useAuth } from '../../context/AuthContext'
import { useLang } from '../../context/LangContext'
import { makeT } from '../../utils/i18n'

export default function NavBar() {
  const location = useLocation()
  const navigate  = useNavigate()
  const { user, setUser } = useAuth()
  const { lang } = useLang()
  const T = makeT(lang)

  const TABS = [
    { path: '/',            label: T('nav_home')   },
    { path: '/marketplace', label: T('nav_market') },
    { path: '/ritual',      label: T('nav_ritual') },
    { path: '/dashboard',   label: T('nav_impact') },
  ]

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
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* External links — compact */}
        {[
          { href: '/pitch/', label: 'PITCH', color: BRAND.heroic },
          { href: '/pitch_growth.html', label: 'GROWTH', color: BRAND.mazorca },
          { href: '/siembra.html', label: 'SIEMBRA', color: BRAND.pod },
        ].map(({ href, label, color }) => (
          <a key={href} href={href} target="_blank" rel="noopener noreferrer"
            style={{
              padding: '4px 10px', borderRadius: 999,
              fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
              fontSize: 10, letterSpacing: '0.1em', textDecoration: 'none',
              color: `${color}88`, border: `1px solid ${color}22`,
              transition: 'all 0.3s',
            }}>
            {label}
          </a>
        ))}

        {/* Separator */}
        <div style={{ width: 1, height: 16, background: `${BRAND.amazon}55` }} />

        <LanguageToggle />
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
            }}>{T('nav_exit')}</button>
          </div>
        ) : (
          <CauaButton size="sm" onClick={() => navigate('/auth')}>{T('nav_enter')}</CauaButton>
        )}
      </div>
    </nav>
  )
}
