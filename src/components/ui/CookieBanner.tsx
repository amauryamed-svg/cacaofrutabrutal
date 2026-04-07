import { useState, useEffect } from 'react'
import { BRAND } from '../../utils/constants'
import { loadHubSpot } from '../../lib/hubspot'
import { supabase } from '../../lib/supabase'

// ── i18n ─────────────────────────────────────────────────────────────────────
const T = {
  es: {
    title:       'Usamos cookies',
    body:        'Utilizamos cookies para mejorar tu experiencia, analizar el tráfico y personalizar el contenido. Puedes elegir qué categorías aceptar.',
    necessary:   'Esenciales',
    necessaryD:  'Necesarias para el funcionamiento del sitio. Siempre activas.',
    analytics:   'Analítica',
    analyticsD:  'Nos ayudan a entender cómo usas la app (HubSpot Analytics). Datos anonimizados.',
    marketing:   'Marketing',
    marketingD:  'Usadas para personalizar comunicaciones y hacer seguimiento CRM (HubSpot).',
    acceptAll:   'ACEPTAR TODO',
    acceptSel:   'ACEPTAR SELECCIÓN',
    rejectAll:   'SOLO ESENCIALES',
    gdpr:        'Cumplimos con el RGPD (UE) y la CCPA (California). Ver',
    privacy:     'Política de Privacidad',
    lang:        'EN',
  },
  en: {
    title:       'We use cookies',
    body:        'We use cookies to enhance your experience, analyze traffic, and personalize content. Choose which categories to accept.',
    necessary:   'Essential',
    necessaryD:  'Required for the site to function. Always active.',
    analytics:   'Analytics',
    analyticsD:  'Help us understand how you use the app (HubSpot Analytics). Anonymized data.',
    marketing:   'Marketing',
    marketingD:  'Used to personalize communications and CRM tracking (HubSpot).',
    acceptAll:   'ACCEPT ALL',
    acceptSel:   'ACCEPT SELECTION',
    rejectAll:   'ESSENTIALS ONLY',
    gdpr:        'We comply with GDPR (EU) and CCPA (California). See our',
    privacy:     'Privacy Policy',
    lang:        'ES',
  },
} as const

type Lang = 'es' | 'en'

interface Prefs { analytics: boolean; marketing: boolean }

const STORAGE_KEY = 'caua_cookie_consent'
const SESSION_KEY = 'caua_session_id'

function getSessionId() {
  let id = sessionStorage.getItem(SESSION_KEY)
  if (!id) { id = crypto.randomUUID(); sessionStorage.setItem(SESSION_KEY, id) }
  return id
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function CookieBanner() {
  const [visible, setVisible]   = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [lang, setLang]         = useState<Lang>('es')
  const [prefs, setPrefs]       = useState<Prefs>({ analytics: false, marketing: false })

  const t = T[lang]

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) { setTimeout(() => setVisible(true), 1200) }
    else {
      const saved = JSON.parse(stored) as Prefs & { analytics: boolean }
      if (saved.analytics) loadHubSpot()
    }
  }, [])

  async function save(analytics: boolean, marketing: boolean) {
    const consent = { analytics, marketing }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consent))
    setVisible(false)

    if (analytics) loadHubSpot()

    // Persist to Supabase (fire-and-forget — never blocks UX)
    supabase.from('cookie_consents').insert({
      session_id: getSessionId(),
      necessary:  true,
      analytics,
      marketing,
      locale:     lang,
      region:     Intl.DateTimeFormat().resolvedOptions().timeZone.startsWith('Europe') ? 'EU' : 'OTHER',
      user_agent: navigator.userAgent.slice(0, 200),
    }).then(() => {/* silent */})
  }

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10000,
      background: '#0F2218', borderTop: `1px solid ${BRAND.amazon}88`,
      boxShadow: '0 -8px 40px rgba(0,0,0,0.6)',
      padding: '20px 24px',
      animation: 'slideUp 0.4s cubic-bezier(0.16,1,0.3,1)',
    }}>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>

      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>🍪</span>
            <span style={{
              fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900,
              fontSize: 16, letterSpacing: '0.08em', color: BRAND.heirloom,
            }}>{t.title}</span>
          </div>

          {/* Language toggle */}
          <button onClick={() => setLang(l => l === 'es' ? 'en' : 'es')} style={{
            background: `${BRAND.amazon}66`, border: `1px solid ${BRAND.amazon}`,
            borderRadius: 999, padding: '3px 10px', cursor: 'pointer',
            fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
            fontSize: 10, letterSpacing: '0.15em', color: BRAND.pod,
            flexShrink: 0,
          }}>{t.lang}</button>
        </div>

        {/* Body */}
        <p style={{
          fontFamily: 'system-ui', fontSize: 12, lineHeight: 1.6,
          color: `${BRAND.heirloom}99`, marginBottom: 12,
        }}>{t.body}</p>

        {/* Expandable preferences */}
        {expanded && (
          <div style={{
            background: `${BRAND.bgDeep}cc`, borderRadius: 8,
            border: `1px solid ${BRAND.amazon}44`, padding: 16,
            marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            {/* Necessary — always on */}
            <Row label={t.necessary} desc={t.necessaryD} checked disabled />

            {/* Analytics */}
            <Row
              label={t.analytics} desc={t.analyticsD}
              checked={prefs.analytics}
              onChange={v => setPrefs(p => ({ ...p, analytics: v }))}
            />

            {/* Marketing */}
            <Row
              label={t.marketing} desc={t.marketingD}
              checked={prefs.marketing}
              onChange={v => setPrefs(p => ({ ...p, marketing: v }))}
            />
          </div>
        )}

        {/* GDPR/CCPA notice */}
        <p style={{
          fontFamily: 'system-ui', fontSize: 10, color: `${BRAND.heirloom}55`,
          marginBottom: 14,
        }}>
          {t.gdpr}{' '}
          <a href="/privacy" style={{ color: BRAND.pod, textDecoration: 'underline' }}>
            {t.privacy}
          </a>.
        </p>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={() => save(true, true)} style={btnStyle(BRAND.pod, '#040C06')}>
            {t.acceptAll}
          </button>
          {expanded ? (
            <button onClick={() => save(prefs.analytics, prefs.marketing)} style={btnStyle(BRAND.amazon, BRAND.heirloom)}>
              {t.acceptSel}
            </button>
          ) : (
            <button onClick={() => setExpanded(true)} style={btnStyle(BRAND.amazon, BRAND.heirloom)}>
              ⚙ PERSONALIZAR
            </button>
          )}
          <button onClick={() => save(false, false)} style={{
            background: 'transparent', border: 'none',
            color: `${BRAND.heirloom}55`, cursor: 'pointer',
            fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
            fontSize: 10, letterSpacing: '0.1em', textDecoration: 'underline',
          }}>{t.rejectAll}</button>
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────
function Row({ label, desc, checked, disabled, onChange }: {
  label: string; desc: string; checked: boolean
  disabled?: boolean; onChange?: (v: boolean) => void
}) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <Toggle checked={checked} disabled={disabled} onChange={onChange} />
      <div>
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
          fontSize: 12, color: BRAND.heirloom, letterSpacing: '0.08em',
        }}>{label}</div>
        <div style={{ fontFamily: 'system-ui', fontSize: 11, color: `${BRAND.heirloom}77`, marginTop: 2 }}>
          {desc}
        </div>
      </div>
    </div>
  )
}

function Toggle({ checked, disabled, onChange }: {
  checked: boolean; disabled?: boolean; onChange?: (v: boolean) => void
}) {
  return (
    <button
      onClick={() => !disabled && onChange?.(!checked)}
      disabled={disabled}
      style={{
        width: 36, height: 20, borderRadius: 999, border: 'none', cursor: disabled ? 'default' : 'pointer',
        background: checked ? BRAND.pod : `${BRAND.amazon}88`,
        position: 'relative', flexShrink: 0, transition: 'background 0.2s',
      }}
    >
      <div style={{
        position: 'absolute', top: 3, width: 14, height: 14, borderRadius: '50%',
        background: BRAND.heirloom, transition: 'left 0.2s',
        left: checked ? 19 : 3,
      }} />
    </button>
  )
}

function btnStyle(bg: string, color: string): React.CSSProperties {
  return {
    background: bg, color, border: 'none', borderRadius: 999,
    padding: '8px 20px', cursor: 'pointer',
    fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
    fontSize: 11, letterSpacing: '0.12em',
  }
}
