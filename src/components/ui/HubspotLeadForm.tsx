/**
 * HubspotLeadForm.tsx
 *
 * Renders either:
 *   A) The embedded HubSpot form (when FORM_GUID is set) — HubSpot manages UI
 *   B) A minimal custom form that submits via Forms API — used as fallback
 *
 * No demographic fields. Collects only email + declared interest toggles.
 * Declared interests are set by the USER, never inferred.
 */

import { useState, useEffect } from 'react'
import { BRAND } from '../../utils/constants'
import {
  readConsent,
  hsSubmitForm,
  type HubSpotContactProps,
} from '../../lib/hubspotTracking'

const PORTAL_ID = import.meta.env.VITE_HUBSPOT_PORTAL_ID as string ?? '51142173'
const FORM_GUID = import.meta.env.VITE_HUBSPOT_FORM_GUID as string ?? ''

// ── Props ─────────────────────────────────────────────────────────────────────
interface HubspotLeadFormProps {
  /** Pre-fill email if user is logged in — connect to useAuth().profile.email */
  prefillEmail?: string

  /** Pre-fill region from Supabase profile — connect to useAuth().profile.region */
  prefillRegion?: HubSpotContactProps['caua_region']

  /** Pre-fill behavioral counters from Supabase profile */
  prefillBehavior?: {
    streak:   number
    orders:   number
    referrals: number
  }

  onSuccess?: () => void
  onError?:   (err: string) => void

  /** Which variant to render */
  variant?: 'embedded' | 'custom'
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function HubspotLeadForm({
  prefillEmail    = '',
  prefillRegion   = 'OTHER',
  prefillBehavior = { streak: 0, orders: 0, referrals: 0 },
  onSuccess,
  onError,
  variant = FORM_GUID ? 'embedded' : 'custom',
}: HubspotLeadFormProps) {
  const consent = readConsent()

  // If no analytics consent → show consent prompt, not the form
  if (!consent.analytics) {
    return <ConsentRequired />
  }

  if (variant === 'embedded' && FORM_GUID) {
    return (
      <EmbeddedHubSpotForm
        portalId={PORTAL_ID}
        formGuid={FORM_GUID}
        onSuccess={onSuccess}
      />
    )
  }

  return (
    <CustomLeadForm
      prefillEmail={prefillEmail}
      prefillRegion={prefillRegion}
      prefillBehavior={prefillBehavior}
      onSuccess={onSuccess ?? (() => {})}
      onError={onError ?? (() => {})}
    />
  )
}

// ── Embedded HubSpot Form (new div-based embed, hsforms.net) ─────────────────
function EmbeddedHubSpotForm({
  portalId, formGuid,
}: { portalId: string; formGuid: string; onSuccess?: () => void }) {
  useEffect(() => {
    const scriptId = 'hs-embed-script'
    if (document.getElementById(scriptId)) return
    const s = document.createElement('script')
    s.id    = scriptId
    s.src   = `https://js.hsforms.net/forms/embed/${portalId}.js`
    s.defer = true
    document.head.appendChild(s)
  }, [portalId])

  return (
    <div style={{
      background: '#132B1C', borderRadius: 12,
      border: `1px solid ${BRAND.amazon}66`, padding: '24px',
    }}>
      <style>{`
        .hs-form-frame input,
        .hs-form-frame select {
          background: #0F2218 !important;
          border: 1px solid #1C3B2666 !important;
          color: #F7F1EE !important;
          border-radius: 8px !important;
          padding: 10px 14px !important;
          font-family: system-ui !important;
          width: 100% !important;
        }
        .hs-form-frame .hs-button {
          background: #91A63B !important;
          color: #040C06 !important;
          border: none !important;
          border-radius: 999px !important;
          font-family: 'Barlow Condensed', sans-serif !important;
          font-weight: 700 !important;
          letter-spacing: 0.1em !important;
          padding: 10px 28px !important;
          cursor: pointer !important;
          width: 100% !important;
        }
        .hs-form-frame label {
          color: #F7F1EEcc !important;
          font-family: system-ui !important;
          font-size: 12px !important;
        }
      `}</style>
      <div
        className="hs-form-frame"
        data-region="na1"
        data-portal-id={portalId}
        data-form-id={formGuid}
      />
    </div>
  )
}

// ── Custom fallback form (no FORM_GUID needed) ────────────────────────────────
function CustomLeadForm({
  prefillEmail, prefillRegion, prefillBehavior, onSuccess, onError,
}: Required<Pick<HubspotLeadFormProps, 'prefillEmail' | 'prefillRegion' | 'prefillBehavior' | 'onSuccess' | 'onError'>>) {
  const [email,       setEmail]       = useState(prefillEmail)
  const [organic,     setOrganic]     = useState<boolean | undefined>(undefined)
  const [novelFoods,  setNovelFoods]  = useState<boolean | undefined>(undefined)
  const [submitting,  setSubmitting]  = useState(false)
  const [done,        setDone]        = useState(false)

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!email.includes('@')) return

    setSubmitting(true)

    const props: HubSpotContactProps = {
      email,
      caua_region:           prefillRegion,
      caua_streak:           String(prefillBehavior.streak),
      caua_orders:           String(prefillBehavior.orders),
      caua_referrals:        String(prefillBehavior.referrals),
      caua_login_status:     prefillEmail ? 'logged_in' : 'anonymous',
      caua_tracking_consent: 'analytics',
      // Declared interests — set ONLY from user toggle, never inferred
      ...(organic    !== undefined && { caua_interest_organic:     organic    ? 'true' : 'false' }),
      ...(novelFoods !== undefined && { caua_interest_novel_foods: novelFoods ? 'true' : 'false' }),
      // Persona label will be refined by HubSpot workflows after behavioral clustering
      caua_persona_label: 'conscious_global_organic_novel_foods',
    }

    const ok = await hsSubmitForm(props)
    setSubmitting(false)

    if (ok) { setDone(true); onSuccess?.() }
    else    { onError?.('Error al enviar — intenta de nuevo') }
  }

  if (done) return <SuccessState />

  return (
    <form onSubmit={handleSubmit} style={{
      background: '#132B1C', borderRadius: 12,
      border: `1px solid ${BRAND.amazon}66`, padding: 24,
    }}>
      <p style={{
        fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900,
        fontSize: 16, color: BRAND.heirloom, letterSpacing: '0.08em',
        marginBottom: 16,
      }}>ÚNETE A CAUA</p>

      {/* Email */}
      <label style={labelStyle}>Correo electrónico</label>
      <input
        type="email" required value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="tu@correo.com"
        style={inputStyle}
      />

      {/* Declared interests — user-selected, never inferred */}
      <p style={{ ...labelStyle, marginTop: 16, marginBottom: 8 }}>
        ¿Qué te interesa? <span style={{ opacity: 0.5 }}>(opcional)</span>
      </p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        <InterestChip
          label="🌿 Agroforestería"
          active={organic === true}
          onClick={() => setOrganic(v => v === true ? undefined : true)}
        />
        <InterestChip
          label="⚗️ Novel Foods"
          active={novelFoods === true}
          onClick={() => setNovelFoods(v => v === true ? undefined : true)}
        />
        <InterestChip
          label="🫘 Cacao ceremonial"
          active={organic === true && novelFoods === true}
          onClick={() => { setOrganic(true); setNovelFoods(true) }}
        />
      </div>

      <button type="submit" disabled={submitting} style={{
        width: '100%', padding: '12px', borderRadius: 999, border: 'none',
        background: submitting ? `${BRAND.pod}66` : `linear-gradient(135deg, ${BRAND.pod}, ${BRAND.amazon})`,
        color: BRAND.heirloom, cursor: submitting ? 'not-allowed' : 'pointer',
        fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
        fontSize: 13, letterSpacing: '0.12em',
      }}>
        {submitting ? 'ENVIANDO…' : 'CONECTAR CON CAUA'}
      </button>

      <p style={{ fontFamily: 'system-ui', fontSize: 10, color: `${BRAND.heirloom}44`, marginTop: 10, textAlign: 'center' }}>
        Sin spam. Sin inferencias. Solo lo que tú decides compartir.
      </p>
    </form>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────
function ConsentRequired() {
  return (
    <div style={{
      background: '#132B1C', borderRadius: 12,
      border: `1px solid ${BRAND.amazon}44`, padding: 24,
      textAlign: 'center',
    }}>
      <p style={{ fontFamily: 'system-ui', color: `${BRAND.heirloom}88`, fontSize: 13 }}>
        Activa las cookies analíticas para conectarte con la comunidad CAUA.
      </p>
    </div>
  )
}

function SuccessState() {
  return (
    <div style={{
      background: `${BRAND.pod}15`, borderRadius: 12,
      border: `1px solid ${BRAND.pod}44`, padding: 28, textAlign: 'center',
    }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>🫘</div>
      <p style={{
        fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900,
        fontSize: 18, color: BRAND.pod, letterSpacing: '0.08em',
      }}>BIENVENIDO/A AL CÍRCULO</p>
      <p style={{ fontFamily: 'system-ui', color: `${BRAND.heirloom}88`, fontSize: 12, marginTop: 8 }}>
        Te hemos registrado. Pronto recibirás noticias de CAUA.
      </p>
    </div>
  )
}

function InterestChip({ label, active, onClick }: {
  label: string; active: boolean; onClick: () => void
}) {
  return (
    <button type="button" onClick={onClick} style={{
      padding: '7px 14px', borderRadius: 999, cursor: 'pointer',
      background: active ? `${BRAND.pod}22` : 'transparent',
      border: `1px solid ${active ? BRAND.pod : BRAND.amazon}66`,
      color: active ? BRAND.pod : `${BRAND.heirloom}88`,
      fontFamily: 'system-ui', fontSize: 12,
      transition: 'all 0.2s',
    }}>{label}</button>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 8,
  border: `1px solid ${BRAND.amazon}66`,
  background: '#0F2218', color: '#F7F1EE',
  fontFamily: 'system-ui', fontSize: 14,
  boxSizing: 'border-box', outline: 'none', marginBottom: 4,
}

const labelStyle: React.CSSProperties = {
  fontFamily: 'system-ui', fontSize: 11,
  color: `#F7F1EEaa`, display: 'block', marginBottom: 6,
}

