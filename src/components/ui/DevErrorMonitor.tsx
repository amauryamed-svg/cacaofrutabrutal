/**
 * DevErrorMonitor — solo activo en desarrollo (import.meta.env.DEV).
 * Intercepta console.error, window.onerror y unhandledrejection,
 * y muestra un overlay con el error en pantalla para detectarlos sin
 * tener que abrir DevTools.
 *
 * Nunca se incluye en el build de producción.
 */

import { useState, useEffect, useCallback } from 'react'
import { BRAND, FONTS } from '../../utils/constants'

interface ErrorEntry {
  id:      number
  type:    'error' | 'unhandled' | 'warn'
  message: string
  source?: string
  time:    string
}

let _id = 0

export default function DevErrorMonitor() {
  // Only render in dev
  if (!import.meta.env.DEV) return null

  return <Monitor />
}

function Monitor() {
  const [errors, setErrors]   = useState<ErrorEntry[]>([])
  const [open,   setOpen]     = useState(false)
  const [muted,  setMuted]    = useState<Set<string>>(new Set())

  const push = useCallback((entry: Omit<ErrorEntry, 'id' | 'time'>) => {
    const msg = entry.message
    if (muted.has(msg)) return
    // Filter out noise
    if (msg.includes('ResizeObserver') || msg.includes('HubSpot')) return
    setErrors(prev => [{ ...entry, id: ++_id, time: new Date().toLocaleTimeString('es-CO') }, ...prev].slice(0, 20))
    setOpen(true)
  }, [muted])

  useEffect(() => {
    // Intercept console.error
    const origError = console.error.bind(console)
    const origWarn  = console.warn.bind(console)

    console.error = (...args: unknown[]) => {
      origError(...args)
      push({ type: 'error', message: args.map(String).join(' ') })
    }
    console.warn = (...args: unknown[]) => {
      origWarn(...args)
      const msg = args.map(String).join(' ')
      if (msg.includes('Invalid API') || msg.includes('Supabase') || msg.includes('401') || msg.includes('403')) {
        push({ type: 'warn', message: msg })
      }
    }

    // Intercept unhandled promise rejections
    const onUnhandled = (e: PromiseRejectionEvent) => {
      push({ type: 'unhandled', message: String(e.reason?.message ?? e.reason ?? 'Unhandled rejection') })
    }

    // Intercept runtime errors
    const onError = (e: ErrorEvent) => {
      push({ type: 'error', message: e.message, source: `${e.filename}:${e.lineno}` })
    }

    window.addEventListener('unhandledrejection', onUnhandled)
    window.addEventListener('error', onError)

    return () => {
      console.error = origError
      console.warn  = origWarn
      window.removeEventListener('unhandledrejection', onUnhandled)
      window.removeEventListener('error', onError)
    }
  }, [push])

  const unread = errors.length

  if (!open && unread === 0) return null

  const typeColor = (t: ErrorEntry['type']) =>
    t === 'error' ? '#e05a4a' : t === 'unhandled' ? '#F1A91E' : '#91A63B'

  const typeLabel = (t: ErrorEntry['type']) =>
    t === 'error' ? 'ERROR' : t === 'unhandled' ? 'UNHANDLED' : 'WARN'

  return (
    <>
      {/* FAB badge */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{
            position: 'fixed', bottom: 16, left: 16, zIndex: 9999,
            background: '#e05a4a', color: '#fff', border: 'none',
            borderRadius: 999, padding: '8px 14px', cursor: 'pointer',
            fontFamily: FONTS.display, fontWeight: 700, fontSize: 11,
            letterSpacing: '0.1em', boxShadow: '0 4px 16px rgba(224,90,74,0.5)',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          ⚠ {unread} error{unread !== 1 ? 's' : ''}
        </button>
      )}

      {/* Panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 16, left: 16, zIndex: 9999,
          width: 'min(420px, calc(100vw - 32px))',
          maxHeight: '60vh',
          background: '#0A0F0A',
          border: '1px solid #e05a4a55',
          borderRadius: 12, overflow: 'hidden',
          boxShadow: '0 8px 40px rgba(0,0,0,0.8)',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Header */}
          <div style={{
            padding: '10px 14px',
            background: '#e05a4a18',
            borderBottom: '1px solid #e05a4a33',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 10, letterSpacing: '0.15em', color: '#e05a4a' }}>
              ⚠ DEV MONITOR · {unread} evento{unread !== 1 ? 's' : ''}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setErrors([])} style={btnStyle}>LIMPIAR</button>
              <button onClick={() => setOpen(false)} style={btnStyle}>✕</button>
            </div>
          </div>

          {/* Error list */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {errors.length === 0 && (
              <div style={{ padding: 16, fontFamily: FONTS.body, fontSize: 11, color: `${BRAND.heirloom}44`, textAlign: 'center' }}>
                Sin errores registrados
              </div>
            )}
            {errors.map(e => (
              <div key={e.id} style={{
                padding: '10px 14px',
                borderBottom: `1px solid ${typeColor(e.type)}18`,
                background: `${typeColor(e.type)}06`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{
                    fontFamily: FONTS.display, fontWeight: 700, fontSize: 7,
                    letterSpacing: '0.12em', color: typeColor(e.type),
                    background: `${typeColor(e.type)}18`, padding: '2px 6px', borderRadius: 999,
                  }}>
                    {typeLabel(e.type)}
                  </span>
                  <span style={{ fontFamily: FONTS.body, fontSize: 9, color: `${BRAND.heirloom}33` }}>{e.time}</span>
                  <button
                    onClick={() => setMuted(m => new Set([...m, e.message]))}
                    style={{ ...btnStyle, marginLeft: 'auto', fontSize: 8 }}
                    title="Silenciar este error"
                  >
                    SILENCIAR
                  </button>
                </div>
                <div style={{
                  fontFamily: 'monospace', fontSize: 11, color: `${BRAND.heirloom}cc`,
                  wordBreak: 'break-all', lineHeight: 1.5,
                }}>
                  {e.message}
                </div>
                {e.source && (
                  <div style={{ fontFamily: 'monospace', fontSize: 9, color: `${BRAND.heirloom}33`, marginTop: 3 }}>
                    {e.source}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

const btnStyle: React.CSSProperties = {
  background: 'transparent', border: '1px solid #ffffff22',
  color: '#ffffff55', borderRadius: 6, padding: '3px 8px',
  cursor: 'pointer', fontFamily: FONTS.display, fontWeight: 700,
  fontSize: 9, letterSpacing: '0.08em',
}
