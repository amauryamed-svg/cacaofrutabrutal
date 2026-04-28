import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BRAND, FONTS } from '../utils/constants'
import CauaLogo from '../components/ui/CauaLogo'
import { supabase } from '../lib/supabase'
import { useLang } from '../context/LangContext'
import { makeT } from '../utils/i18n'

// Whitelist of in-app paths that may receive an OAuth callback.
// Each entry MUST also be whitelisted in Supabase Dashboard → Auth → URL Configuration → Redirect URLs.
const ALLOWED_NEXT_PATHS = new Set<string>([
  '/adoptar',
  '/dashboard',
  '/marketplace',
  '/ritual',
  '/fund',
  '/impacto',
  '/web3',
  '/web3/onboarding',
])

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [searchParams]        = useSearchParams()
  const { lang } = useLang()
  const T = makeT(lang)
  const es = lang === 'es'

  // Honor ?next= query so deep-links like /app/web3/onboarding return correctly.
  // SPA basename is "/app", so the absolute URL is `${origin}/app${nextPath}`.
  const nextRaw  = searchParams.get('next') || '/adoptar'
  const nextPath = ALLOWED_NEXT_PATHS.has(nextRaw) ? nextRaw : '/adoptar'

  const handleGoogleLogin = async () => {
    setLoading(true); setError('')
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/app${nextPath}` },
    })
    if (err) { setError(err.message); setLoading(false) }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: BRAND.bgDeep,
      padding: 'var(--space-page)', position: 'relative', overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute', top: '40%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 500, height: 500,
        background: `radial-gradient(ellipse, ${BRAND.criollo}06 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      <div style={{
        background: BRAND.bgCard,
        borderRadius: 20, padding: 'clamp(24px,5vw,40px) clamp(20px,5vw,36px)',
        maxWidth: 400, width: '100%',
        border: `1px solid ${BRAND.amazon}66`,
        boxShadow: `0 40px 80px rgba(0,0,0,0.6), 0 0 80px ${BRAND.pod}08`,
        position: 'relative', zIndex: 1,
      }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <CauaLogo size={36} variant="white" />
          </div>
          <p style={{
            fontFamily: FONTS.display, fontWeight: 700,
            fontSize: 13, letterSpacing: '0.12em', textTransform: 'uppercase',
            color: `${BRAND.heirloom}66`, margin: 0,
          }}>
            {es ? 'Acceder' : 'Sign in'}
          </p>
        </div>

        {/* ── Login — Google only ───────────────────────────────────────────── */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: '100%', padding: '14px 16px', borderRadius: 10,
            border: `1px solid ${BRAND.amazon}77`, background: BRAND.bgDark,
            color: BRAND.heirloom, cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: FONTS.body, fontSize: 14, marginBottom: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            transition: 'border-color 0.2s',
            opacity: loading ? 0.7 : 1,
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = `${BRAND.pod}88`)}
          onMouseLeave={e => (e.currentTarget.style.borderColor = `${BRAND.amazon}77`)}
        >
          {/* Google G SVG */}
          <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            <path fill="none" d="M0 0h48v48H0z"/>
          </svg>
          {loading ? '…' : `${T('auth_continue')} Google`}
        </button>

        {/* Feedback */}
        {error && (
          <p style={{ fontFamily: FONTS.body, fontSize: 12, color: '#E05C5C', marginBottom: 12, textAlign: 'center', lineHeight: 1.4, marginTop: 12 }}>
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
