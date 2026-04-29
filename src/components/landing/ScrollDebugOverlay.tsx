import { useEffect, useState } from 'react'

/**
 * Stage-1 debug overlay — reads `--p` / `--pd` from `:root` every frame and
 * displays them. Useful to validate parity with `public/investor-scroll.js`
 * by opening the SPA and the public landing side-by-side.
 *
 * Mounted only when `?scrollDebug=1` is in the URL — never visible in prod.
 */
export default function ScrollDebugOverlay() {
  const [p, setP] = useState('0.0000')
  const [pd, setPd] = useState('0.000')
  const enabled = typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('scrollDebug') === '1'

  useEffect(() => {
    if (!enabled) return
    let raf = 0
    const tick = () => {
      const cs = getComputedStyle(document.documentElement)
      setP(cs.getPropertyValue('--p').trim() || '—')
      setPd(cs.getPropertyValue('--pd').trim() || '—')
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [enabled])

  if (!enabled) return null

  return (
    <div style={{
      position: 'fixed', bottom: 16, left: 16, zIndex: 9999,
      background: '#000c', color: '#91A63B', padding: '10px 14px',
      borderRadius: 8, border: '1px solid #91A63B66',
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      fontSize: 12, lineHeight: 1.6, pointerEvents: 'none',
      backdropFilter: 'blur(8px)',
    }}>
      <div>--p&nbsp; {p}</div>
      <div>--pd {pd}</div>
    </div>
  )
}
