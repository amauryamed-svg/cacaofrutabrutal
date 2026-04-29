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

// ── Nav model ───────────────────────────────────────────────────────────────
// A tab is either a single link (no children) or a group with children.
// Mobile drawer collapses children under their parent; desktop shows a hover dropdown.
interface NavLeaf  { path: string; label: string; hint?: string }
interface NavGroup { label: string; children: NavLeaf[] }
type NavItem = NavLeaf | NavGroup

const isGroup = (t: NavItem): t is NavGroup => 'children' in t

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
  tabs: NavItem[]
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
        overflowY: 'auto',
      }}>

        {/* Nav tabs (with groups) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 28 }}>
          {tabs.map((t, i) => {
            if (!isGroup(t)) {
              const active = location.pathname === t.path
              return (
                <Link
                  key={t.path}
                  to={t.path}
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
            }
            return <MobileDrawerGroup key={i} group={t} onClose={onClose} />
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
              }}>{(user && user.length > 0) ? user[0].toUpperCase() : 'U'}</div>
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

// ── Mobile drawer group (collapsible) ───────────────────────────────────────
function MobileDrawerGroup({
  group, onClose,
}: { group: NavGroup; onClose: () => void }) {
  const location = useLocation()
  const childActive = group.children.some(c => c.path === location.pathname)
  // Open by default if any child is the active route
  const [open, setOpen] = useState(childActive)

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: '12px 16px', borderRadius: 10,
          background: childActive ? `${BRAND.pod}10` : 'transparent',
          border: `1px solid ${childActive ? BRAND.pod + '33' : 'transparent'}`,
          fontFamily: FONTS.display, fontWeight: 700,
          fontSize: 13, letterSpacing: '0.12em', textTransform: 'uppercase',
          color: childActive ? BRAND.pod : `${BRAND.heirloom}88`,
          cursor: 'pointer',
        }}
      >
        <span>{group.label}</span>
        <span aria-hidden style={{
          fontSize: 10, opacity: 0.7,
          transform: open ? 'rotate(180deg)' : 'none',
          transition: 'transform 0.2s',
        }}>▾</span>
      </button>

      {open && (
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 2,
          paddingLeft: 12, marginTop: 2, marginBottom: 4,
          borderLeft: `1px solid ${BRAND.amazon}44`,
        }}>
          {group.children.map(c => {
            const active = location.pathname === c.path
            return (
              <Link
                key={c.path}
                to={c.path}
                onClick={onClose}
                style={{ textDecoration: 'none' }}
              >
                <div style={{
                  padding: '10px 14px', borderRadius: 8,
                  background: active ? `${BRAND.pod}18` : 'transparent',
                  border: `1px solid ${active ? BRAND.pod + '44' : 'transparent'}`,
                  fontFamily: FONTS.display, fontWeight: 700,
                  fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
                  color: active ? BRAND.pod : `${BRAND.heirloom}77`,
                }}>
                  {c.label}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Main NavBar ─────────────────────────────────────────────────────────────
export default function NavBar() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const navigate  = useNavigate()
  const { user, isAdmin, setUser } = useAuth()
  const { lang }  = useLang()
  const T         = makeT(lang)
  const { isMobile, isTablet } = useBreakpoint()
  const es = lang === 'es'

  // Tabs with sub-tabs. Single-link entries stay flat; groups collapse on mobile,
  // open on hover/click on desktop. Order = priority for the user journey.
  const TABS: NavItem[] = [
    { path: '/', label: T('nav_home') },
    {
      label: es ? 'CONTENIDO' : 'CONTENT',
      children: [
        { path: '/blog',     label: T('nav_blog') },
        { path: '/catacion', label: 'CATACIÓN', hint: es ? 'Cotiza una experiencia' : 'Book a tasting' },
      ],
    },
    {
      label: es ? 'ÁRBOL' : 'TREE',
      children: [
        { path: '/adoptar',   label: T('nav_adoptar'), hint: es ? 'Adopta un cacao' : 'Adopt a cacao tree' },
        { path: '/dashboard', label: T('nav_impact'),  hint: es ? 'Tu portafolio + cosecha' : 'Your portfolio + harvest' },
      ],
    },
    {
      label: es ? 'MERCADO' : 'MARKET',
      children: [
        { path: '/marketplace', label: T('nav_market') },
        { path: '/ritual',      label: T('nav_ritual') },
      ],
    },
    {
      label: 'WEB3',
      children: [
        { path: '/web3',            label: es ? 'DESCUBRE' : 'DISCOVER',     hint: es ? 'On-chain cacao economy' : 'On-chain cacao economy' },
        { path: '/web3/onboarding', label: es ? 'KYC + WALLET' : 'KYC + WALLET', hint: es ? 'Verifica y conecta' : 'Verify & link wallet' },
      ],
    },
    { path: '/fund', label: T('nav_fund') },
  ]

  const EXTERNAL = [
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
        {/* Logo + link back to public investor landing */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 14, minWidth: 0 }}>
          <Link to="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <CauaLogo size={isMobile ? 22 : 26} variant="white" />
          </Link>
          {!isMobile && (
            <a
              href="/"
              aria-label="Volver al investor landing"
              style={{
                padding: '4px 10px', borderRadius: 999,
                fontFamily: FONTS.display, fontWeight: 700,
                fontSize: 10, letterSpacing: '0.14em', textDecoration: 'none',
                color: `${BRAND.mazorca}99`, border: `1px solid ${BRAND.mazorca}33`,
                transition: 'all 0.3s', whiteSpace: 'nowrap',
              }}
            >
              ← INVESTOR
            </a>
          )}
        </div>

        {/* Right cluster — desktop utilities + burger (universal). Tabs all live in the drawer. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 0 : 10 }}>
          {/* Desktop utilities: lang toggle + token balance + avatar — sit beside the burger */}
          {!isMobile && (
            <>
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
                  }}>{(user && user.length > 0) ? user[0].toUpperCase() : 'U'}</div>
                </div>
              ) : (
                <CauaButton size="sm" onClick={() => navigate('/auth')}>{T('nav_enter')}</CauaButton>
              )}

              <div style={{ width: 1, height: 22, background: `${BRAND.amazon}55`, margin: '0 4px' }} />
            </>
          )}

          {/* Burger — always visible. Opens the drawer with all grouped nav tabs. */}
          <div onClick={() => setDrawerOpen(o => !o)} role="button" tabIndex={0}
               aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
               onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setDrawerOpen(o => !o) }}>
            <HamburgerIcon open={drawerOpen} />
          </div>
        </div>
      </nav>

      {/* Drawer — universal (mobile + desktop). Carries all grouped tabs. */}
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
    </>
  )
}
