import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BRAND, FONTS, ACTIVE_CHAIN_ID, BASE_SEPOLIA_CHAIN_ID } from '../utils/constants'
import CauaButton from '../components/ui/CauaButton'
import { useLang } from '../context/LangContext'
import { makeT } from '../utils/i18n'
import CacaoGallery from '../components/landing/CacaoGallery'
import CauaWordmark from '../components/landing/CauaWordmark'
import PublicTabNav from '../components/landing/PublicTabNav'

export default function Landing() {
  const [visible, setVisible] = useState(false)
  const navigate = useNavigate()
  const { lang } = useLang()
  const T = makeT(lang)

  useEffect(() => { setTimeout(() => setVisible(true), 80) }, [])

  return (
    <div style={{ background: BRAND.bgDeep, minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <PublicTabNav mode="adoptar" />
      <CacaoGallery />

      {/* ── Hero ── */}
      <div style={{
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 'clamp(80px,12vw,100px) clamp(20px,5vw,48px) clamp(48px,8vw,60px)',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{
          textAlign: 'center', maxWidth: 900, width: '100%',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(48px)',
          transition: 'all 1.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          <div style={{ marginBottom: 'clamp(20px, 4vw, 44px)' }}>
            <CauaWordmark variant="hero" />
          </div>

          <p style={{
            fontFamily: FONTS.serif, fontStyle: 'italic',
            color: BRAND.mazorca,
            fontSize: 'clamp(12px, 1.8vw, 16px)',
            marginBottom: 'clamp(12px, 2.5vw, 24px)',
            letterSpacing: '0.25em', textTransform: 'lowercase',
          }}>{T('land_eyebrow')}</p>

          <h1 style={{
            fontFamily: FONTS.display, fontWeight: 900,
            fontSize: 'clamp(44px, 14vw, 184px)',
            lineHeight: 0.86,
            letterSpacing: '-0.02em', color: BRAND.heirloom,
            textTransform: 'uppercase', margin: '0 0 clamp(28px, 4vw, 48px)',
          }}>
            CACAO<br />
            <span style={{ color: BRAND.pod }}>FRUTA</span><br />
            BRUTAL
          </h1>

          <p style={{
            fontFamily: FONTS.body, color: `${BRAND.heirloom}70`,
            fontSize: 'clamp(14px, 2.2vw, 17px)',
            maxWidth: 440, margin: '0 auto clamp(32px, 5vw, 48px)',
            lineHeight: 1.7,
          }}>
            {T('land_sub')}
          </p>

          <CauaButton size="lg" onClick={() => navigate('/adoptar')}>
            {T('land_cta1')}
          </CauaButton>
        </div>

        {/* Scroll indicator */}
        <div style={{
          position: 'absolute', bottom: 36, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
          opacity: visible ? 0.45 : 0, transition: 'opacity 2s ease 1.5s',
        }}>
          <div style={{ width: 1, height: 36, background: `linear-gradient(${BRAND.pod}55, transparent)` }} />
        </div>
      </div>

      {/* ── Legal footer ── */}
      <div style={{
        padding: '20px clamp(20px,5vw,48px) 32px',
        textAlign: 'center',
        borderTop: `1px solid ${BRAND.amazon}22`,
        position: 'relative', zIndex: 1,
      }}>
        {ACTIVE_CHAIN_ID === BASE_SEPOLIA_CHAIN_ID && (
          <p style={{
            fontFamily: FONTS.body, fontSize: 9.5,
            color: `${BRAND.heirloom}33`, letterSpacing: '0.06em',
            margin: '0 auto 8px', maxWidth: 520, lineHeight: 1.55,
          }}>
            Base Sepolia (testnet) · Mainnet Q3 2026 tras auditoría.
          </p>
        )}
        <p style={{
          fontFamily: FONTS.body, fontSize: 10,
          color: `${BRAND.heirloom}44`, letterSpacing: '0.08em', margin: 0,
        }}>
          CAUA COLOMBIA SAS · NIT 901.213.846-7 · Bogotá D.C. · Colombia
        </p>
      </div>
    </div>
  )
}
