import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { BRAND, FONTS } from '../utils/constants'
import CauaLogo from '../components/ui/CauaLogo'
import { supabase } from '../lib/supabase'
import { useLang } from '../context/LangContext'
import { makeT } from '../utils/i18n'

type AuthMode = 'login' | 'forgot' | 'reset'

export default function Auth() {
  const [searchParams]        = useSearchParams()
  const [email, setEmail]     = useState('')
  const [pass, setPass]       = useState('')
  const [passConfirm, setPassConfirm] = useState('')
  const [mode, setMode]       = useState<AuthMode>(() => {
    const m = searchParams.get('mode')
    if (m === 'reset') return 'reset'
    return 'login'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')
  const navigate              = useNavigate()
  const { lang } = useLang()
  const T = makeT(lang)
  const es = lang === 'es'

  const handleGoogleLogin = async () => {
    setLoading(true); setError('')
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    })
    if (err) { setError(err.message); setLoading(false) }
  }

  // Supabase sends ?type=recovery in the hash after clicking reset link
  useEffect(() => {
    const hash = window.location.hash
    if (hash.includes('type=recovery')) {
      setMode('reset')
    }
  }, [])

  const inputStyle = {
    width: '100%', padding: '14px 18px', borderRadius: 10,
    border: `1px solid ${BRAND.amazon}66`,
    background: BRAND.bgDark,
    color: BRAND.heirloom,
    fontFamily: FONTS.body, fontSize: 14,
    marginBottom: 10, boxSizing: 'border-box' as const,
    outline: 'none', transition: 'border-color 0.2s',
  }

  const handleSubmit = async () => {
    setLoading(true); setError(''); setSuccess('')

    // ── Forgot password ──────────────────────────────────────────────────────
    if (mode === 'forgot') {
      if (!email.trim()) { setError(es ? 'Ingresa tu correo.' : 'Enter your email.'); setLoading(false); return }
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?mode=reset`,
      })
      if (err) { setError(err.message); setLoading(false); return }
      setSuccess(es
        ? '¡Listo! Revisa tu bandeja de entrada. El enlace expira en 1 hora.'
        : 'Done! Check your inbox. The link expires in 1 hour.')
      setLoading(false)
      return
    }

    // ── Reset password (after clicking email link) ───────────────────────────
    if (mode === 'reset') {
      if (!pass.trim() || pass.length < 6) {
        setError(es ? 'La contraseña debe tener al menos 6 caracteres.' : 'Password must be at least 6 characters.')
        setLoading(false); return
      }
      if (pass !== passConfirm) {
        setError(es ? 'Las contraseñas no coinciden.' : 'Passwords do not match.')
        setLoading(false); return
      }
      const { error: err } = await supabase.auth.updateUser({ password: pass })
      if (err) { setError(err.message); setLoading(false); return }
      setSuccess(es ? '¡Contraseña actualizada! Iniciando sesión…' : 'Password updated! Signing you in…')
      setTimeout(() => navigate('/'), 1500)
      setLoading(false)
      return
    }

    setLoading(false)
  }

  const titles: Record<AuthMode, string> = {
    login:  es ? 'Acceder' : 'Sign in',
    forgot: es ? 'Recuperar contraseña' : 'Reset password',
    reset:  es ? 'Nueva contraseña' : 'New password',
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
            {titles[mode]}
          </p>
        </div>

        {/* ── Forgot password flow ───────────────────────────────────────────── */}
        {mode === 'forgot' && (
          <>
            <p style={{ fontFamily: FONTS.body, fontSize: 13, color: `${BRAND.heirloom}66`, marginBottom: 20, lineHeight: 1.6 }}>
              {es
                ? 'Te enviaremos un enlace para restablecer tu contraseña. Revisa también spam.'
                : "We'll send you a reset link. Check your spam folder too."}
            </p>
            <input
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder={T('auth_email')} type="email" style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = `${BRAND.pod}66`)}
              onBlur={e => (e.currentTarget.style.borderColor = `${BRAND.amazon}66`)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                width: '100%', padding: '15px 16px', borderRadius: 10, border: 'none',
                background: loading ? `${BRAND.pod}55` : `linear-gradient(135deg, ${BRAND.pod}, ${BRAND.amazon})`,
                color: BRAND.heirloom, cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: FONTS.display, fontWeight: 700,
                fontSize: 13, letterSpacing: '0.14em', textTransform: 'uppercase',
                opacity: loading ? 0.7 : 1, marginBottom: 16,
              }}
            >
              {loading ? '…' : (es ? 'ENVIAR ENLACE' : 'SEND LINK')}
            </button>
          </>
        )}

        {/* ── Reset password flow ───────────────────────────────────────────── */}
        {mode === 'reset' && (
          <>
            <p style={{ fontFamily: FONTS.body, fontSize: 13, color: `${BRAND.heirloom}66`, marginBottom: 20, lineHeight: 1.6 }}>
              {es ? 'Elige una nueva contraseña segura (mín. 6 caracteres).' : 'Choose a new secure password (min. 6 characters).'}
            </p>
            <input
              value={pass} onChange={e => setPass(e.target.value)}
              placeholder={es ? 'Nueva contraseña' : 'New password'} type="password"
              style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = `${BRAND.pod}66`)}
              onBlur={e => (e.currentTarget.style.borderColor = `${BRAND.amazon}66`)}
            />
            <input
              value={passConfirm} onChange={e => setPassConfirm(e.target.value)}
              placeholder={es ? 'Confirmar contraseña' : 'Confirm password'} type="password"
              style={{ ...inputStyle, marginBottom: 20 }}
              onFocus={e => (e.currentTarget.style.borderColor = `${BRAND.pod}66`)}
              onBlur={e => (e.currentTarget.style.borderColor = `${BRAND.amazon}66`)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                width: '100%', padding: '15px 16px', borderRadius: 10, border: 'none',
                background: loading ? `${BRAND.pod}55` : `linear-gradient(135deg, ${BRAND.pod}, ${BRAND.amazon})`,
                color: BRAND.heirloom, cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: FONTS.display, fontWeight: 700,
                fontSize: 13, letterSpacing: '0.14em', textTransform: 'uppercase',
                opacity: loading ? 0.7 : 1, marginBottom: 16,
              }}
            >
              {loading ? '…' : (es ? 'GUARDAR CONTRASEÑA' : 'SAVE PASSWORD')}
            </button>
          </>
        )}

        {/* ── Login — Google only ───────────────────────────────────────────── */}
        {mode === 'login' && (
          <>
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

            {/* Forgot password link */}
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <span
                onClick={() => { setMode('forgot'); setError(''); setSuccess('') }}
                style={{ fontFamily: FONTS.body, fontSize: 11, color: `${BRAND.heirloom}44`, cursor: 'pointer' }}
              >
                {es ? '¿Olvidaste tu contraseña?' : 'Forgot your password?'}
              </span>
            </div>
          </>
        )}

        {/* Feedback */}
        {error && (
          <p style={{ fontFamily: FONTS.body, fontSize: 12, color: '#E05C5C', marginBottom: 12, textAlign: 'center', lineHeight: 1.4, marginTop: 12 }}>
            {error}
          </p>
        )}
        {success && (
          <p style={{ fontFamily: FONTS.body, fontSize: 13, color: BRAND.pod, marginBottom: 12, textAlign: 'center', lineHeight: 1.5, marginTop: 12 }}>
            {success}
          </p>
        )}

        {/* Back link for forgot/reset */}
        {(mode === 'forgot' || mode === 'reset') && (
          <div style={{ textAlign: 'center' }}>
            <span
              onClick={() => { setMode('login'); setError(''); setSuccess('') }}
              style={{ fontFamily: FONTS.body, fontSize: 12, color: `${BRAND.heirloom}44`, cursor: 'pointer' }}
            >
              ← {es ? 'Volver' : 'Back'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
