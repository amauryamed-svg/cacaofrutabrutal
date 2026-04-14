import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { SpeedInsights } from '@vercel/speed-insights/react'
import './styles/globals.css'
import App from './App.tsx'

import { Component, type ErrorInfo, type ReactNode } from 'react'

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) { return { error } }
  componentDidCatch(_error: Error, _errorInfo: ErrorInfo) { /* error caught */ }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, background: '#111', color: 'red', fontFamily: 'monospace', minHeight: '100vh' }}>
          <h2>CRITICAL REACT CRASH</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.error.message}</pre>
          <pre style={{ whiteSpace: 'pre-wrap', marginTop: 20 }}>{this.state.error.stack}</pre>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
      <SpeedInsights />
    </ErrorBoundary>
  </StrictMode>,
)
