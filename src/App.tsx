import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider }  from './context/AuthContext'
import { LangProvider }  from './context/LangContext'
import NavBar            from './components/layout/NavBar'
import Footer            from './components/layout/Footer'
import GrainOverlay      from './components/ui/GrainOverlay'
import CookieBanner      from './components/ui/CookieBanner'
import AuthGate          from './components/ui/AuthGate'
import DevErrorMonitor   from './components/ui/DevErrorMonitor'
import Landing           from './pages/Landing'
import Auth              from './pages/Auth'
import Blog              from './pages/Blog'
import BlogPost          from './pages/BlogPost'
import Marketplace       from './pages/Marketplace'
import Ritual            from './pages/Ritual'
import Adoptar           from './pages/Adoptar'
import TreeDetail        from './pages/TreeDetail'
import Dashboard         from './pages/Dashboard'
import Fund              from './pages/Fund'
import AdminCRM          from './pages/AdminCRM'
import CincoTiemposProposal from './pages/CincoTiemposProposal'
import ProposalAndreaRojas from './pages/ProposalAndreaRojas'
import CauaCoti           from './pages/CauaCoti'
import { hsTrackPage }   from './lib/hubspot'

function AppShell() {
  const { pathname } = useLocation()
  const hideChrome   = pathname === '/auth'

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

        {/* Protected — require registration (CRM tracking fires on every pageview) */}
        <Route path="/"                      element={<AuthGate><Landing /></AuthGate>} />
        <Route path="/blog"                  element={<AuthGate><Blog /></AuthGate>} />
        <Route path="/blog/:slug"            element={<AuthGate><BlogPost /></AuthGate>} />
        <Route path="/cinco-tiempos"         element={<AuthGate><CincoTiemposProposal /></AuthGate>} />
        <Route path="/caua-coti"             element={<AuthGate><CauaCoti /></AuthGate>} />
        <Route path="/catacion"              element={<AuthGate><CauaCoti /></AuthGate>} />
        <Route path="/caua-coti/andrea-rojas" element={<AuthGate><ProposalAndreaRojas /></AuthGate>} />
        <Route path="/marketplace"           element={<AuthGate><Marketplace /></AuthGate>} />
        <Route path="/ritual"                element={<AuthGate><Ritual /></AuthGate>} />
        <Route path="/adoptar"               element={<AuthGate><Adoptar /></AuthGate>} />
        <Route path="/tree/:id"              element={<AuthGate><TreeDetail /></AuthGate>} />
        <Route path="/dashboard"             element={<AuthGate><Dashboard /></AuthGate>} />
        <Route path="/fund"                  element={<AuthGate><Fund /></AuthGate>} />

        {/* Super admin only — guarded inside AdminCRM */}
        <Route path="/admin/crm"   element={<AdminCRM />} />
      </Routes>
      {!hideChrome && <Footer />}
      <CookieBanner />
      <DevErrorMonitor />
    </>
  )
}

export default function App() {
  return (
    <LangProvider>
      <AuthProvider>
        <BrowserRouter basename="/app">
          <AppShell />
        </BrowserRouter>
      </AuthProvider>
    </LangProvider>
  )
}
