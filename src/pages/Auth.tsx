import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BRAND } from '../utils/constants'
import CauaLogo from '../components/ui/CauaLogo'
import { useAuth } from '../context/AuthContext'

export default function Auth() {
  const [email, setEmail]   = useState('')
  const [pass, setPass]     = useState('')
  const [mode, setMode]     = useState<'login' | 'register'>('login')
  const { setUser }         = useAuth()
  const navigate            = useNavigate()

  const inputStyle = {
    width: '100%', padding: '12px 16px', borderRadius: 8,
    border: `1px solid ${BRAND.amazon}66`, background: '#0F2218',
    color: BRAND.heirloom, fontFamily: 'system-ui', fontSize: 14,
    marginBottom: 8, boxSizing: 'border-box' as const, outline: 'none',
  }

  const handleSubmit = () => {
    if (email.trim()) { setUser(email.split('@')[0]); navigate('/') }
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
          }}>With Nature We Walk</p>
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
            Continuar con {provider}
          </button>
        ))}

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
          <div style={{ flex: 1, height: 1, background: `${BRAND.amazon}66` }} />
          <span style={{ color: `${BRAND.heirloom}44`, fontSize: 11 }}>o</span>
          <div style={{ flex: 1, height: 1, background: `${BRAND.amazon}66` }} />
        </div>

        <input value={email} onChange={e => setEmail(e.target.value)}
          placeholder="correo@ejemplo.com" style={inputStyle} />
        <input value={pass} onChange={e => setPass(e.target.value)}
          placeholder="Contraseña" type="password" style={{ ...inputStyle, marginBottom: 16 }} />

        <button onClick={handleSubmit} style={{
          width: '100%', padding: '14px 16px', borderRadius: 8, border: 'none',
          background: `linear-gradient(135deg, ${BRAND.pod}, ${BRAND.amazon})`,
          color: BRAND.heirloom, cursor: 'pointer',
          fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
          fontSize: 14, letterSpacing: '0.1em',
        }}>
          {mode === 'login' ? 'INICIAR SESIÓN' : 'CREAR CUENTA'}
        </button>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: `${BRAND.heirloom}66` }}>
          {mode === 'login' ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
          <span onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            style={{ color: BRAND.pod, cursor: 'pointer', textDecoration: 'underline' }}>
            {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
          </span>
        </p>
      </div>
    </div>
  )
}
