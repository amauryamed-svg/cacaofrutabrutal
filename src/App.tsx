import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider }  from './context/AuthContext'
import { LangProvider }  from './context/LangContext'
import NavBar            from './components/layout/NavBar'
import Footer            from './components/layout/Footer'
import GrainOverlay      from './components/ui/GrainOverlay'
import CookieBanner      from './components/ui/CookieBanner'
import Landing           from './pages/Landing'
import Auth              from './pages/Auth'
import Marketplace       from './pages/Marketplace'
import Ritual            from './pages/Ritual'
import Dashboard         from './pages/Dashboard'
import Fund              from './pages/Fund'
import { hsTrackPage }   from './lib/hubspot'

function AppShell() {
  const { pathname } = useLocation()
  const hideChrome   = pathname === '/auth'

  // Track every route change in HubSpot (only fires if analytics consented)
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
        <Route path="/"            element={<Landing />}     />
        <Route path="/auth"        element={<Auth />}        />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/ritual"      element={<Ritual />}      />
        <Route path="/dashboard"   element={<Dashboard />}   />
        <Route path="/fund"        element={<Fund />}        />
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
