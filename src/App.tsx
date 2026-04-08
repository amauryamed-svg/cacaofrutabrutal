import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider }  from './context/AuthContext'
import { LangProvider }  from './context/LangContext'
import NavBar            from './components/layout/NavBar'
import Footer            from './components/layout/Footer'
import GrainOverlay      from './components/ui/GrainOverlay'
import CookieBanner      from './components/ui/CookieBanner'
import AuthGate          from './components/ui/AuthGate'
import Landing           from './pages/Landing'
import Auth              from './pages/Auth'
import Marketplace       from './pages/Marketplace'
import Ritual            from './pages/Ritual'
import Dashboard         from './pages/Dashboard'
import Fund              from './pages/Fund'
import AdminCRM          from './pages/AdminCRM'
import { hsTrackPage }   from './lib/hubspot'

function AppShell() {
  const { pathname } = useLocation()
  const hideChrome   = pathname === '/auth'

  useEffect(() => {
    const consent = localStorage.getItem('caua_cookie_consent')
    if (consent && JSON.parse(consent).analytics) {
      hsTrackPage(pathname)
    }
  }, [pathname])

  return (
    <>
      <GrainOverlay />
      {!hideChrome && <NavBar />}
      <Routes>
        {/* Public — no auth required */}
        <Route path="/"    element={<Landing />} />
        <Route path="/auth" element={<Auth />} />

        {/* Protected — require registration */}
        <Route path="/marketplace" element={<AuthGate><Marketplace /></AuthGate>} />
        <Route path="/ritual"      element={<AuthGate><Ritual /></AuthGate>} />
        <Route path="/dashboard"   element={<AuthGate><Dashboard /></AuthGate>} />
        <Route path="/fund"        element={<AuthGate><Fund /></AuthGate>} />

        {/* Super admin only — guarded inside AdminCRM */}
        <Route path="/admin/crm"   element={<AdminCRM />} />
      </Routes>
      {!hideChrome && <Footer />}
      <CookieBanner />
    </>
  )
}

export default function App() {
  return (
    <LangProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppShell />
        </BrowserRouter>
      </AuthProvider>
    </LangProvider>
  )
}
