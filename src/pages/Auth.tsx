import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { BRAND, FONTS } from '../utils/constants'
import CauaLogo from '../components/ui/CauaLogo'
import { supabase } from '../lib/supabase'
import { hsSubmitForm, readConsent } from '../lib/hubspotTracking'
import { useLang } from '../context/LangContext'
import { makeT } from '../utils/i18n'

type AuthMode = 'login' | 'register' | 'forgot' | 'reset'

export default function Auth() {
  const [searchParams]        = useSearchParams()
  const [email, setEmail]     = useState('')
  const [pass, setPass]       = useState('')
  const [passConfirm, setPassConfirm] = useState('')
  const [mode, setMode]       = useState<AuthMode>(() => {
    const m = searchParams.get('mode')
    if (m === 'register') return 'register'
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

    // ── Register ─────────────────────────────────────────────────────────────
    if (mode === 'register') {
      if (!email.trim() || !pass.trim()) return
      const { error: signUpError } = await supabase.auth.signUp({ email, password: pass })
      if (signUpError) { setError(signUpError.message); setLoading(false); return }
      if (readConsent().analytics) {
        hsSubmitForm({
          email,
          caua_region:           'OTHER',
          caua_streak:           '0',
          caua_orders:           '0',
          caua_referrals:        '0',
          caua_login_status:     'anonymous',
          caua_tracking_consent: 'analytics',
          caua_persona_label:    'new_registrant',
        })
      }
      setSuccess(es ? '¡Cuenta creada! Revisa tu correo para confirmar.' : 'Account created! Check your email to confirm.')
      setLoading(false)
      return
    }

    // ── Login ─────────────────────────────────────────────────────────────────
    if (!email.trim() || !pass.trim()) { setLoading(false); return }
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: pass })
    if (signInError) { setError(signInError.message); setLoading(false); return }
    navigate('/')
  }

  const titles: Record<AuthMode, string> = {
    login:  es ? 'Iniciar sesión' : 'Sign in',
    register: es ? 'Crear cuenta' : 'Create account',
    forgot: es ? 'Recuperar contraseña' : 'Reset password',
    reset:  es ? 'Nueva contraseña' : 'New password',
  }

  const ctaLabel = () => {
    if (loading) return '…'
    if (mode === 'forgot') return es ? 'ENVIAR ENLACE' : 'SEND LINK'
    if (mode === 'reset')  return es ? 'GUARDAR CONTRASEÑA' : 'SAVE PASSWORD'
    if (mode === 'register') return T('auth_register')
    return T('auth_login')
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
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <CauaLogo size={36} variant="white" showTagline />
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
          </>
        )}

        {/* ── Login / Register flow ─────────────────────────────────────────── */}
        {(mode === 'login' || mode === 'register') && (
          <>
            {/* Mode tabs */}
            <div style={{
              display: 'flex', borderRadius: 10, overflow: 'hidden',
              border: `1px solid ${BRAND.amazon}66`, marginBottom: 24,
            }}>
              {(['login', 'register'] as const).map(m => (
                <button key={m} onClick={() => { setMode(m); setError(''); setSuccess('') }} style={{
                  flex: 1, padding: '10px 16px', border: 'none', cursor: 'pointer',
                  fontFamily: FONTS.display, fontWeight: 700,
                  fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
                  transition: 'all 0.2s',
                  background: mode === m ? BRAND.pod : 'transparent',
                  color: mode === m ? BRAND.bgDeep : `${BRAND.heirloom}55`,
                }}>
                  {m === 'login' ? T('auth_login') : T('auth_register')}
                </button>
              ))}
            </div>

            {/* Social auth */}
            {(['Google', 'Apple'] as const).map(provider => (
              <button key={provider} style={{
                width: '100%', padding: '12px 16px', borderRadius: 10,
                border: `1px solid ${BRAND.amazon}77`, background: BRAND.bgDark,
                color: `${BRAND.heirloom}cc`, cursor: 'pointer',
                fontFamily: FONTS.body, fontSize: 13, marginBottom: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              }}>
                <span style={{ fontWeight: 700, color: provider === 'Google' ? BRAND.mazorca : BRAND.heirloom }}>
                  {provider === 'Google' ? 'G' : ''}
                </span>
                {T('auth_continue')} {provider}
              </button>
            ))}

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
              <div style={{ flex: 1, height: 1, background: `${BRAND.amazon}55` }} />
              <span style={{ fontFamily: FONTS.body, color: `${BRAND.heirloom}33`, fontSize: 10, letterSpacing: '0.1em' }}>
                {es ? 'o continúa con email' : 'or continue with email'}
              </span>
              <div style={{ flex: 1, height: 1, background: `${BRAND.amazon}55` }} />
            </div>

            <input
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder={T('auth_email')} type="email" style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = `${BRAND.pod}66`)}
              onBlur={e => (e.currentTarget.style.borderColor = `${BRAND.amazon}66`)}
            />
            <input
              value={pass} onChange={e => setPass(e.target.value)}
              placeholder={T('auth_pass')} type="password"
              style={{ ...inputStyle, marginBottom: 8 }}
              onFocus={e => (e.currentTarget.style.borderColor = `${BRAND.pod}66`)}
              onBlur={e => (e.currentTarget.style.borderColor = `${BRAND.amazon}66`)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />

            {/* Forgot link — only in login mode */}
            {mode === 'login' && (
              <div style={{ textAlign: 'right', marginBottom: 16 }}>
                <span
                  onClick={() => { setMode('forgot'); setError(''); setSuccess('') }}
                  style={{ fontFamily: FONTS.body, fontSize: 11, color: `${BRAND.pod}cc`, cursor: 'pointer' }}
                >
                  {es ? '¿Olvidaste tu contraseña?' : 'Forgot your password?'}
                </span>
              </div>
            )}
          </>
        )}

        {/* Feedback */}
        {error && (
          <p style={{ fontFamily: FONTS.body, fontSize: 12, color: '#E05C5C', marginBottom: 12, textAlign: 'center', lineHeight: 1.4 }}>
            {error}
          </p>
        )}
        {success && (
          <p style={{ fontFamily: FONTS.body, fontSize: 13, color: BRAND.pod, marginBottom: 12, textAlign: 'center', lineHeight: 1.5 }}>
            {success}
          </p>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%', padding: '15px 16px', borderRadius: 10, border: 'none',
            background: loading ? `${BRAND.pod}55` : `linear-gradient(135deg, ${BRAND.pod}, ${BRAND.amazon})`,
            color: BRAND.heirloom, cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: FONTS.display, fontWeight: 700,
            fontSize: 13, letterSpacing: '0.14em', textTransform: 'uppercase',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {ctaLabel()}
        </button>

        {/* Footer links */}
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          {(mode === 'login' || mode === 'register') && (
            <p style={{ fontFamily: FONTS.body, fontSize: 12, color: `${BRAND.heirloom}55`, margin: 0 }}>
              {mode === 'login' ? `${T('auth_no_acct')} ` : `${T('auth_yes_acct')} `}
              <span
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setSuccess('') }}
                style={{ color: BRAND.pod, cursor: 'pointer', textDecoration: 'underline' }}
              >
                {mode === 'login' ? T('auth_signup') : T('auth_signin')}
              </span>
            </p>
          )}
          {(mode === 'forgot' || mode === 'reset') && (
            <span
              onClick={() => { setMode('login'); setError(''); setSuccess('') }}
              style={{ fontFamily: FONTS.body, fontSize: 12, color: `${BRAND.heirloom}44`, cursor: 'pointer' }}
            >
              ← {es ? 'Volver al inicio de sesión' : 'Back to sign in'}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
