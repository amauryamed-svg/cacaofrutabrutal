import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BRAND } from '../utils/constants'
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
    width: '100%', padding: '12px 16px', borderRadius: 8,
    border: `1px solid ${BRAND.amazon}66`, background: '#0F2218',
    color: BRAND.heirloom, fontFamily: 'system-ui', fontSize: 14,
    marginBottom: 8, boxSizing: 'border-box' as const, outline: 'none',
  }

  const handleSubmit = async () => {
    if (!email.trim() || !pass.trim()) return
    setLoading(true)
    setError('')
    setSuccess('')

    if (mode === 'register') {
      const { error: signUpError } = await supabase.auth.signUp({ email, password: pass })
      if (signUpError) { setError(signUpError.message); setLoading(false); return }

      // HubSpot: capture lead at moment of registration
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
      // AuthContext.onAuthStateChange fires → fetchProfile → trackLoggedInUser()
      navigate('/')
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#040C06', padding: 24,
    }}>
      <div style={{
        background: '#132B1C', borderRadius: 16, padding: 40, maxWidth: 400, width: '100%',
        border: `1px solid ${BRAND.amazon}66`,
        boxShadow: `0 32px 64px rgba(0,0,0,0.5), ${BRAND.pod}11 0 0 80px`,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <CauaLogo size={40} />
          <p style={{
            fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic',
            color: `${BRAND.heirloom}88`, fontSize: 12, marginTop: 12,
          }}>{T('auth_tagline')}</p>
        </div>

        {/* Social */}
        {['Google', 'Apple'].map(provider => (
          <button key={provider} style={{
            width: '100%', padding: '12px 16px', borderRadius: 8,
            border: `1px solid ${BRAND.amazon}88`, background: '#0F2218',
            color: BRAND.heirloom, cursor: 'pointer', fontFamily: 'system-ui',
            fontSize: 14, marginBottom: 8, display: 'flex',
            alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <span style={{ fontSize: 18 }}>{provider === 'Google' ? 'G' : ''}</span>
            {T('auth_continue')} {provider}
          </button>
        ))}

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
          <div style={{ flex: 1, height: 1, background: `${BRAND.amazon}66` }} />
          <span style={{ color: `${BRAND.heirloom}44`, fontSize: 11 }}>o</span>
          <div style={{ flex: 1, height: 1, background: `${BRAND.amazon}66` }} />
        </div>

        <input value={email} onChange={e => setEmail(e.target.value)}
          placeholder={T('auth_email')} style={inputStyle} />
        <input value={pass} onChange={e => setPass(e.target.value)}
          placeholder={T('auth_pass')} type="password" style={{ ...inputStyle, marginBottom: 16 }} />

        {error && (
          <p style={{ fontFamily: 'system-ui', fontSize: 12, color: '#E05C5C', marginBottom: 10, textAlign: 'center' }}>
            {error}
          </p>
        )}
        {success && (
          <p style={{ fontFamily: 'system-ui', fontSize: 12, color: BRAND.pod, marginBottom: 10, textAlign: 'center' }}>
            {success}
          </p>
        )}

        <button onClick={handleSubmit} disabled={loading} style={{
          width: '100%', padding: '14px 16px', borderRadius: 8, border: 'none',
          background: loading
            ? `${BRAND.pod}66`
            : `linear-gradient(135deg, ${BRAND.pod}, ${BRAND.amazon})`,
          color: BRAND.heirloom, cursor: loading ? 'not-allowed' : 'pointer',
          fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
          fontSize: 14, letterSpacing: '0.1em',
        }}>
          {loading ? '…' : mode === 'login' ? T('auth_login') : T('auth_register')}
        </button>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: `${BRAND.heirloom}66` }}>
          {mode === 'login' ? `${T('auth_no_acct')} ` : `${T('auth_yes_acct')} `}
          <span onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            style={{ color: BRAND.pod, cursor: 'pointer', textDecoration: 'underline' }}>
            {mode === 'login' ? T('auth_signup') : T('auth_signin')}
          </span>
        </p>
      </div>
    </div>
  )
}
