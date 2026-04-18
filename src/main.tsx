import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import App from './App'
import './styles/globals.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
      <SpeedInsights />
    </ErrorBoundary>
  </StrictMode>,
)
