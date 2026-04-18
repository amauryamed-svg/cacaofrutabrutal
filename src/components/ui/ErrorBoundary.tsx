import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(_error: Error, _errorInfo: ErrorInfo) {}

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
