import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { BRAND, FONTS } from '../../utils/constants'
import CauaLogo from '../ui/CauaLogo'
import CauaButton from '../ui/CauaButton'
import LanguageToggle from '../ui/LanguageToggle'
import TokenBalance from '../ui/TokenBalance'
import { useAuth } from '../../context/AuthContext'
import { useLang } from '../../context/LangContext'
import { makeT } from '../../utils/i18n'
import { useBreakpoint } from '../../hooks/useBreakpoint'

// ── Hamburger icon ──────────────────────────────────────────────────────────
function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <button
      aria-label={open ? 'Close menu' : 'Open menu'}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        padding: '4px', display: 'flex', flexDirection: 'column',
        gap: 5, justifyContent: 'center', alignItems: 'center',
        width: 32, height: 32,
      }}
    >
      <span style={{
        display: 'block', width: 22, height: 1.5,
        background: BRAND.heirloom,
        transition: 'transform 0.3s, opacity 0.3s',
        transform: open ? 'translateY(6.5px) rotate(45deg)' : 'none',
      }} />
      <span style={{
        display: 'block', width: 22, height: 1.5,
        background: BRAND.heirloom,
        transition: 'opacity 0.3s',
        opacity: open ? 0 : 1,
      }} />
      <span style={{
        display: 'block', width: 22, height: 1.5,
        background: BRAND.heirloom,
        transition: 'transform 0.3s, opacity 0.3s',
        transform: open ? 'translateY(-6.5px) rotate(-45deg)' : 'none',
      }} />
    </button>
  )
}

// ── Mobile drawer ───────────────────────────────────────────────────────────
function MobileDrawer({
  open, onClose, tabs, externalLinks, user, onLogout, onLogin, T,
}: {
  open: boolean
  onClose: () => void
  tabs: { path: string; label: string }[]
  externalLinks: { href: string; label: string; color: string }[]
  user: string | null
  onLogout: () => void
  onLogin: () => void
  T: (key: string) => string
}) {
  const location = useLocation()

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(4,12,6,0.85)',
          backdropFilter: 'blur(4px)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.3s',
        }}
      />

      {/* Drawer panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 201,
        width: 'min(320px, 85vw)',
        background: BRAND.bgDeep,
        borderLeft: `1px solid ${BRAND.amazon}44`,
        display: 'flex', flexDirection: 'column',
        padding: '72px 28px 40px',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>

        {/* Nav tabs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 32 }}>
          {tabs.map(t => {
            const active = location.pathname === t.path
            return (
              <Link
                key={t.path} to={t.path}
                onClick={onClose}
                style={{ textDecoration: 'none' }}
              >
                <div style={{
                  padding: '12px 16px', borderRadius: 10,
                  background: active ? `${BRAND.pod}18` : 'transparent',
                  border: `1px solid ${active ? BRAND.pod + '44' : 'transparent'}`,
                  fontFamily: FONTS.display, fontWeight: 700,
                  fontSize: 13, letterSpacing: '0.12em', textTransform: 'uppercase',
                  color: active ? BRAND.pod : `${BRAND.heirloom}88`,
                  transition: 'all 0.2s',
                }}>
                  {t.label}
                </div>
              </Link>
            )
          })}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: `${BRAND.amazon}33`, marginBottom: 24 }} />

        {/* External links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 32 }}>
          {externalLinks.map(({ href, label, color }) => (
            <a
              key={href} href={href}
              target="_blank" rel="noopener noreferrer"
              onClick={onClose}
              style={{
                padding: '10px 16px', borderRadius: 10,
                border: `1px solid ${color}22`,
                fontFamily: FONTS.display, fontWeight: 700,
                fontSize: 11, letterSpacing: '0.14em', textDecoration: 'none',
                color: `${color}99`,
                transition: 'all 0.2s',
              }}
            >
              {label}
            </a>
          ))}
        </div>

        {/* Language + auth */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <LanguageToggle />
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: `linear-gradient(135deg, ${BRAND.criollo}, ${BRAND.theobroma})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: BRAND.heirloom,
              }}>{user[0].toUpperCase()}</div>
              <button onClick={() => { onLogout(); onClose() }} style={{
                background: 'none', border: 'none', color: `${BRAND.heirloom}66`,
                fontSize: 12, cursor: 'pointer', fontFamily: FONTS.body,
              }}>{T('nav_exit')}</button>
            </div>
          ) : (
            <CauaButton size="sm" onClick={() => { onLogin(); onClose() }}>
              {T('nav_enter')}
            </CauaButton>
          )}
        </div>
      </div>
    </>
  )
}

// ── Main NavBar ─────────────────────────────────────────────────────────────
export default function NavBar() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const location  = useLocation()
  const navigate  = useNavigate()
  const { user, isAdmin, setUser } = useAuth()
  const { lang }  = useLang()
  const T         = makeT(lang)
  const { isMobile, isTablet } = useBreakpoint()

  const TABS = [
    { path: '/',            label: T('nav_home')   },
    { path: '/blog',        label: T('nav_blog')   },
    { path: '/marketplace', label: T('nav_market') },
    { path: '/ritual',      label: T('nav_ritual') },
    { path: '/fund',        label: T('nav_fund')   },
    { path: '/dashboard',   label: T('nav_impact') },
  ]

  const EXTERNAL = [
    { href: '/pitch/',            label: 'PITCH',   color: BRAND.heroic  },
    { href: '/pitch_growth.html', label: 'GROWTH',  color: BRAND.mazorca },
    { href: '/siembra.html',      label: 'SIEMBRA', color: BRAND.pod     },
  ]

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: `${BRAND.bgDeep}ee`, backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${BRAND.amazon}44`,
        padding: isMobile ? '12px 16px' : '12px 24px',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none' }}>
          <CauaLogo size={26} variant="white" />
        </Link>

        {/* Desktop / Tablet — inline nav */}
        {!isMobile && (
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
                    fontFamily: FONTS.display, fontWeight: 700,
                    fontSize: 11, letterSpacing: '0.12em', transition: 'all 0.3s',
                  }}>{t.label}</button>
                </Link>
              )
            })}
          </div>
        )}

        {/* Desktop right side — external links + auth */}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* External links — hidden on tablet */}
            {!isTablet && EXTERNAL.map(({ href, label, color }) => (
              <a key={href} href={href} target="_blank" rel="noopener noreferrer"
                style={{
                  padding: '4px 10px', borderRadius: 999,
                  fontFamily: FONTS.display, fontWeight: 700,
                  fontSize: 10, letterSpacing: '0.1em', textDecoration: 'none',
                  color: `${color}88`, border: `1px solid ${color}22`,
                  transition: 'all 0.3s',
                }}>
                {label}
              </a>
            ))}

            <div style={{ width: 1, height: 16, background: `${BRAND.amazon}55` }} />

            <LanguageToggle />

            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <TokenBalance />
                {isAdmin && (
                  <Link to="/admin/crm" style={{ textDecoration: 'none' }}>
                    <button style={{
                      background: `${BRAND.mazorca}22`, border: `1px solid ${BRAND.mazorca}44`,
                      color: BRAND.mazorca, padding: '4px 10px', borderRadius: 999,
                      cursor: 'pointer', fontFamily: FONTS.display, fontWeight: 700,
                      fontSize: 10, letterSpacing: '0.1em',
                    }}>CRM</button>
                  </Link>
                )}
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
        )}

        {/* Mobile — hamburger only */}
        {isMobile && (
          <div onClick={() => setDrawerOpen(o => !o)}>
            <HamburgerIcon open={drawerOpen} />
          </div>
        )}
      </nav>

      {/* Mobile drawer */}
      {isMobile && (
        <MobileDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          tabs={TABS}
          externalLinks={EXTERNAL}
          user={user}
          onLogout={() => setUser(null)}
          onLogin={() => navigate('/auth')}
          T={T as (key: string) => string}
        />
      )}
    </>
  )
}
