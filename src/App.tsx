import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect, lazy, Suspense } from 'react'
import { AuthProvider }  from './context/AuthContext'
import { LangProvider }  from './context/LangContext'
import NavBar            from './components/layout/NavBar'
import CaminoDock        from './components/layout/CaminoDock'
import Footer            from './components/layout/Footer'
import GrainOverlay      from './components/ui/GrainOverlay'
import CookieBanner      from './components/ui/CookieBanner'
import AppIntro          from './components/ui/AppIntro'
import AuthGate          from './components/ui/AuthGate'
import DevErrorMonitor   from './components/ui/DevErrorMonitor'
import Landing           from './pages/Landing'
import Auth              from './pages/Auth'
import Blog              from './pages/Blog'
import BlogPost          from './pages/BlogPost'
import Marketplace       from './pages/Marketplace'
import Ritual            from './pages/Ritual'
import Adoptar           from './pages/Adoptar'
import CauaBonga         from './pages/CauaBonga'
import CauaBongaFinca    from './pages/CauaBongaFinca'
import CauaBongaPlot     from './pages/CauaBongaPlot'
import TreeDetail        from './pages/TreeDetail'
import Dashboard         from './pages/Dashboard'
import MiLaboratorio     from './pages/MiLaboratorio'
import Fund              from './pages/Fund'
import Impacto           from './pages/Impacto'
import AdminCRM          from './pages/AdminCRM'
import CincoTiemposProposal from './pages/CincoTiemposProposal'
import ProposalAndreaRojas from './pages/ProposalAndreaRojas'
import CauaCoti           from './pages/CauaCoti'
import { hsTrackPage }   from './lib/hubspot'

// Web3 routes are lazy-loaded — wagmi/viem/RainbowKit (~80kb gz) only ship
// when a user navigates to /app/web3/*. See docs/WEB3.md and CLAUDE.md §10.
const Web3Onboarding  = lazy(() => import('./pages/Web3Onboarding'))
const Web3Landing     = lazy(() => import('./pages/Web3Landing'))
const Web3Dashboard   = lazy(() => import('./pages/Web3Dashboard'))
const BurnMazorcas    = lazy(() => import('./pages/BurnMazorcas'))

function AppShell() {
  const { pathname } = useLocation()
  // Public surfaces: solo PublicTabNav + footer mínimo. NavBar de la SPA
  // (con dropdowns INICIO/CONTENIDO/ÁRBOL/MERCADO/WEB3/FONDO) es ruido para
  // attendees del evento AtmosphereX que aún no se logean.
  const hideChrome   = pathname === '/auth' || pathname === '/'
  // CaminoDock visible solo en superficies Phase 1 — videojuego del cacao journey.
  // Hidden en Fondo/Marketplace/Web3/Blog/Dashboard donde el dock no aporta.
  const showCaminoDock =
    pathname.startsWith('/adoptar') ||
    pathname.startsWith('/tree/')   ||
    pathname.startsWith('/lab')     ||
    pathname.startsWith('/ritual')

  useEffect(() => {
    try {
      const m = document.cookie.match(/caua_consent=([^;]+)/)
      const consent = m ? JSON.parse(decodeURIComponent(m[1])) : null
      if (consent?.analytics) hsTrackPage(pathname)
    } catch { /* malformed cookie — skip tracking */ }
  }, [pathname])

  return (
    <>
      <GrainOverlay />
      {!hideChrome && <NavBar />}
      <Routes>
        {/* Public — login form only */}
        <Route path="/auth"       element={<Auth />} />

        {/* Public — landing visible without login. Login is deferred to swipe-right
            in Adoptar.tsx so AtmosphereX event attendees can see what they're adopting
            before authenticating. Other routes below stay protected. */}
        <Route path="/"                      element={<Landing />} />
        <Route path="/blog"                  element={<AuthGate><Blog /></AuthGate>} />
        <Route path="/blog/:slug"            element={<AuthGate><BlogPost /></AuthGate>} />
        <Route path="/cinco-tiempos"         element={<AuthGate><CincoTiemposProposal /></AuthGate>} />
        <Route path="/caua-coti"             element={<AuthGate><CauaCoti /></AuthGate>} />
        <Route path="/catacion"              element={<AuthGate><CauaCoti /></AuthGate>} />
        <Route path="/caua-coti/andrea-rojas" element={<AuthGate><ProposalAndreaRojas /></AuthGate>} />
        <Route path="/marketplace"           element={<AuthGate><Marketplace /></AuthGate>} />
        <Route path="/ritual"                element={<AuthGate><Ritual /></AuthGate>} />
        {/* Adoptar — Google login obligatorio para capturar adoptantes en CRM.
            AuthGate redirige a /auth?next=/adoptar antes de mostrar las cards. */}
        <Route path="/adoptar"               element={<AuthGate><Adoptar /></AuthGate>} />
        <Route path="/caua-bonga"            element={<AuthGate><CauaBonga /></AuthGate>} />
        <Route path="/caua-bonga/finca/:id"  element={<AuthGate><CauaBongaFinca /></AuthGate>} />
        <Route path="/caua-bonga/finca/:id/plot" element={<AuthGate><CauaBongaPlot /></AuthGate>} />
        <Route path="/tree/:id"              element={<AuthGate><TreeDetail /></AuthGate>} />
        <Route path="/dashboard"             element={<AuthGate><Dashboard /></AuthGate>} />
        <Route path="/lab"                   element={<AuthGate><MiLaboratorio /></AuthGate>} />
        <Route path="/fund"                  element={<AuthGate><Fund /></AuthGate>} />
        <Route path="/impacto"               element={<AuthGate><Impacto /></AuthGate>} />

        {/* Web3 onboarding — KYC + SIWE wallet linking. AuthGate required, KYC happens inside. */}
        <Route
          path="/web3/onboarding"
          element={
            <AuthGate>
              <Suspense fallback={<div style={{ padding: 64, color: '#F7F1EE', background: '#040C06', minHeight: '100vh' }}>Loading Web3…</div>}>
                <Web3Onboarding />
              </Suspense>
            </AuthGate>
          }
        />

        {/* Web3 dashboard — digital assets, NFTs, $CACAO. AuthGate required. */}
        <Route
          path="/web3/dashboard"
          element={
            <AuthGate>
              <Suspense fallback={<div style={{ padding: 64, color: '#F7F1EE', background: '#040C06', minHeight: '100vh' }}>Loading…</div>}>
                <Web3Dashboard />
              </Suspense>
            </AuthGate>
          }
        />

        {/* Web3 marketing landing — English, public-facing. No AuthGate. */}
        <Route
          path="/web3"
          element={
            <Suspense fallback={<div style={{ padding: 64, color: '#F7F1EE', background: '#040C06', minHeight: '100vh' }}>Loading Web3…</div>}>
              <Web3Landing />
            </Suspense>
          }
        />

        {/* Burn mazorcas → claim $CACAO on Base */}
        <Route
          path="/burn"
          element={
            <AuthGate>
              <Suspense fallback={<div style={{ padding: 64, color: '#F7F1EE', background: '#040C06', minHeight: '100vh' }}>Cargando…</div>}>
                <BurnMazorcas />
              </Suspense>
            </AuthGate>
          }
        />

        {/* Super admin only — guarded inside AdminCRM */}
        <Route path="/admin/crm"   element={<AdminCRM />} />
      </Routes>
      {!hideChrome && <Footer />}
      {showCaminoDock && <CaminoDock />}
      <CookieBanner />
      <DevErrorMonitor />
    </>
  )
}

export default function App() {
  return (
    <LangProvider>
      <AuthProvider>
        <AppIntro />
        <BrowserRouter basename="/app">
          <AppShell />
        </BrowserRouter>
      </AuthProvider>
    </LangProvider>
  )
}
