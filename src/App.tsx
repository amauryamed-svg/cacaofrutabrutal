import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import NavBar       from './components/layout/NavBar'
import Footer       from './components/layout/Footer'
import GrainOverlay from './components/ui/GrainOverlay'
import Landing      from './pages/Landing'
import Auth         from './pages/Auth'
import Marketplace  from './pages/Marketplace'
import Ritual       from './pages/Ritual'
import Dashboard    from './pages/Dashboard'

function AppShell() {
  const { pathname } = useLocation()
  const hideChrome   = pathname === '/auth'

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
      </Routes>
      {!hideChrome && <Footer />}
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </AuthProvider>
  )
}
