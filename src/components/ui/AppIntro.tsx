// AppIntro — full-screen brand intro shown once per browser session.
// State lives in React (sessionStorage is allowed — it's not localStorage).
// Renders as a portal overlay so it works regardless of current route.
import { useEffect, useState } from 'react'
import { BRAND, FONTS } from '../../utils/constants'

const SESSION_KEY = 'caua_intro_seen'

const WORDS = ['CACAO', 'FRUTA', 'BRUTAL']
const WORD_COLORS = [BRAND.heirloom, BRAND.pod, BRAND.mazorca]

export default function AppIntro() {
  const [visible, setVisible]   = useState(false)
  const [phase,   setPhase]     = useState<'enter' | 'show' | 'exit'>('enter')
  const [wordIdx, setWordIdx]   = useState(-1)

  useEffect(() => {
    // One intro per browser session (sessionStorage resets on tab close)
    if (sessionStorage.getItem(SESSION_KEY)) return
    setVisible(true)
    setPhase('enter')

    // Stagger each word in
    const t0 = setTimeout(() => setWordIdx(0), 400)
    const t1 = setTimeout(() => setWordIdx(1), 750)
    const t2 = setTimeout(() => setWordIdx(2), 1100)

    // Fade-out after the last word settles
    const t3 = setTimeout(() => setPhase('exit'), 2200)
    const t4 = setTimeout(() => {
      setVisible(false)
      sessionStorage.setItem(SESSION_KEY, '1')
    }, 2900)

    return () => [t0, t1, t2, t3, t4].forEach(clearTimeout)
  }, [])

  if (!visible) return null

  const exiting = phase === 'exit'

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: BRAND.bgDeep,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 0,
      opacity:    exiting ? 0 : 1,
      transform:  exiting ? 'scale(1.04)' : 'scale(1)',
      transition: exiting ? 'opacity 0.6s ease, transform 0.6s ease' : 'none',
      pointerEvents: exiting ? 'none' : 'all',
    }}>
      {/* Wordmark */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        {WORDS.map((word, i) => (
          <div
            key={word}
            style={{
              fontFamily: FONTS.display,
              fontWeight: 900,
              fontSize: 'clamp(52px, 16vw, 96px)',
              lineHeight: 0.95,
              letterSpacing: '-0.02em',
              textTransform: 'uppercase',
              color: WORD_COLORS[i],
              opacity:    wordIdx >= i ? 1 : 0,
              transform:  wordIdx >= i ? 'translateY(0)' : 'translateY(18px)',
              transition: 'opacity 0.35s ease, transform 0.35s ease',
            }}
          >
            {word}
          </div>
        ))}
      </div>

      {/* Tagline */}
      <p style={{
        fontFamily: FONTS.body,
        fontSize: 11,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        color: `${BRAND.heirloom}44`,
        marginTop: 24,
        opacity:    wordIdx >= 2 ? 1 : 0,
        transform:  wordIdx >= 2 ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 0.4s ease 0.15s, transform 0.4s ease 0.15s',
      }}>
        CACAO BIOACTIVO · COLOMBIA · BASE
      </p>

      {/* Accent bar */}
      <div style={{
        marginTop: 20,
        width:     wordIdx >= 2 ? 60 : 0,
        height:    2,
        background: BRAND.pod,
        borderRadius: 1,
        transition: 'width 0.5s ease 0.2s',
      }} />
    </div>
  )
}
