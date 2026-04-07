import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BRAND, FONTS } from '../utils/constants'
import CauaLogo from '../components/ui/CauaLogo'
import { supabase } from '../lib/supabase'
import { hsSubmitForm, readConsent } from '../lib/hubspotTracking'
import { useLang } from '../context/LangContext'
import { makeT } from '../utils/i18n'

export default function Auth() {
  const [email, setEmail]     = useState('')
  const [pass, setPass]       = useState('')
  const [mode, setMode]       = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')
  const navigate              = useNavigate()
  const { lang } = useLang()
  const T = makeT(lang)

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
    if (!email.trim() || !pass.trim()) return
    setLoading(true)
    setError('')
    setSuccess('')

    if (mode === 'register') {
      const { error: signUpError } = await supabase.auth.signUp({ email, password: pass })
      if (signUpError) { setError(signUpError.message); setLoading(false); return }

      if (readConsent().analytics) {
        hsSubmitForm({
          email,
          caua_region:            'OTHER',
          caua_streak:            '0',
          caua_orders:            '0',
          caua_referrals:         '0',
          caua_login_status:      'anonymous',
          caua_tracking_consent:  'analytics',
          caua_persona_label:     'new_registrant',
        })
      }

      setSuccess('¡Cuenta creada! Revisa tu correo para confirmar.')
      setLoading(false)
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: pass })
      if (signInError) { setError(signInError.message); setLoading(false); return }
      navigate('/')
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: BRAND.bgDeep,
      padding: 24, position: 'relative', overflow: 'hidden',
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
        borderRadius: 20, padding: '40px 36px',
        maxWidth: 400, width: '100%',
        border: `1px solid ${BRAND.amazon}66`,
        boxShadow: `0 40px 80px rgba(0,0,0,0.6), 0 0 80px ${BRAND.pod}08`,
        position: 'relative', zIndex: 1,
      }}>

        {/* Logo + tagline */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <CauaLogo size={36} />
          </div>
          <p style={{
            fontFamily: FONTS.serif, fontStyle: 'italic',
            color: `${BRAND.heirloom}55`, fontSize: 12, margin: 0,
            letterSpacing: '0.06em',
          }}>{T('auth_tagline')}</p>
        </div>

        {/* Mode tabs */}
        <div style={{
          display: 'flex', borderRadius: 10, overflow: 'hidden',
          border: `1px solid ${BRAND.amazon}66`, marginBottom: 28,
        }}>
          {(['login', 'register'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
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
            transition: 'border-color 0.2s',
          }}>
            <span style={{
              width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'serif', fontWeight: 700, fontSize: 14,
              color: provider === 'Google' ? BRAND.mazorca : BRAND.heirloom,
            }}>{provider === 'Google' ? 'G' : ''}</span>
            {T('auth_continue')} {provider}
          </button>
        ))}

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
          <div style={{ flex: 1, height: 1, background: `${BRAND.amazon}55` }} />
          <span style={{ fontFamily: FONTS.body, color: `${BRAND.heirloom}33`, fontSize: 10, letterSpacing: '0.1em' }}>
            {lang === 'es' ? 'o continúa con email' : 'or continue with email'}
          </span>
          <div style={{ flex: 1, height: 1, background: `${BRAND.amazon}55` }} />
        </div>

        {/* Inputs */}
        <input
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder={T('auth_email')}
          type="email"
          style={inputStyle}
          onFocus={e => (e.currentTarget.style.borderColor = `${BRAND.pod}66`)}
          onBlur={e => (e.currentTarget.style.borderColor = `${BRAND.amazon}66`)}
        />
        <input
          value={pass}
          onChange={e => setPass(e.target.value)}
          placeholder={T('auth_pass')}
          type="password"
          style={{ ...inputStyle, marginBottom: 20 }}
          onFocus={e => (e.currentTarget.style.borderColor = `${BRAND.pod}66`)}
          onBlur={e => (e.currentTarget.style.borderColor = `${BRAND.amazon}66`)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        />

        {/* Feedback */}
        {error && (
          <p style={{
            fontFamily: FONTS.body, fontSize: 12, color: '#E05C5C',
            marginBottom: 12, textAlign: 'center', lineHeight: 1.4,
          }}>{error}</p>
        )}
        {success && (
          <p style={{
            fontFamily: FONTS.body, fontSize: 12, color: BRAND.pod,
            marginBottom: 12, textAlign: 'center', lineHeight: 1.4,
          }}>{success}</p>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%', padding: '15px 16px', borderRadius: 10, border: 'none',
            background: loading
              ? `${BRAND.pod}55`
              : `linear-gradient(135deg, ${BRAND.pod}, ${BRAND.amazon})`,
            color: BRAND.heirloom,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: FONTS.display, fontWeight: 700,
            fontSize: 13, letterSpacing: '0.14em', textTransform: 'uppercase',
            transition: 'opacity 0.2s',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? '…' : mode === 'login' ? T('auth_login') : T('auth_register')}
        </button>

        {/* Switch mode */}
        <p style={{
          textAlign: 'center', marginTop: 20, marginBottom: 0,
          fontFamily: FONTS.body, fontSize: 12, color: `${BRAND.heirloom}55`,
        }}>
          {mode === 'login' ? `${T('auth_no_acct')} ` : `${T('auth_yes_acct')} `}
          <span
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            style={{ color: BRAND.pod, cursor: 'pointer', textDecoration: 'underline' }}
          >
            {mode === 'login' ? T('auth_signup') : T('auth_signin')}
          </span>
        </p>
      </div>
    </div>
  )
}
