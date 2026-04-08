import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BRAND, FONTS } from '../../utils/constants'
import { supabase } from '../../lib/supabase'
import PaymentSelector from './PaymentSelector'
import type { Technology, Mvp, PaymentMethod, InvestMode } from '../../types/fund.types'

interface Props {
  technology: Technology
  mvp?: Mvp | null
  mode: InvestMode
  onClose: () => void
  user: string | null
  lang: 'es' | 'en'
}

export default function InvestModal({ technology, mvp, mode, onClose, user, lang }: Props) {
  const [lots, setLots]         = useState(1)
  const [payment, setPayment]   = useState<PaymentMethod>('stripe')
  const [loading, setLoading]   = useState(false)
  const [err, setErr]           = useState<string | null>(null)
  const navigate = useNavigate()

  const unitUsd  = mode === 'mvp' && mvp ? mvp.price_usd_cents : technology.lot_price_usd_cents
  const unitCop  = mode === 'mvp' && mvp ? (mvp.price_cop ?? 0) : technology.lot_price_cop
  const totalUsd = unitUsd * lots
  const totalCop = unitCop * lots

  const fmt = (cents: number) => '$' + (cents / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })
  const fmtCop = (v: number) => '$' + v.toLocaleString('es-CO')

  if (!user) {
    return (
      <Overlay onClose={onClose}>
        <div style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ fontSize: 36, marginBottom: 16 }}>🫘</div>
          <p style={{ fontFamily: FONTS.body, color: `${BRAND.heirloom}88`, marginBottom: 20 }}>
            {lang === 'es' ? 'Inicia sesión para invertir en esta tecnología.' : 'Sign in to invest in this technology.'}
          </p>
          <button onClick={() => { onClose(); navigate('/auth') }} style={ctaStyle(BRAND.pod)}>
            {lang === 'es' ? 'INICIAR SESIÓN' : 'SIGN IN'}
          </button>
        </div>
      </Overlay>
    )
  }

  const handlePay = async () => {
    setLoading(true); setErr(null)
    try {
      const fn = payment === 'stripe' ? 'create-stripe-checkout' : 'create-mp-preference'
      const body = {
        technology_id: technology.id,
        mvp_id: mode === 'mvp' ? mvp?.id : null,
        lots_count: lots,
        currency: payment === 'stripe' ? 'USD' : 'COP',
        success_url: `${window.location.origin}/fund?status=success`,
        cancel_url:  `${window.location.origin}/fund?status=cancelled`,
      }
      const { data, error } = await supabase.functions.invoke(fn, { body })
      if (error || !data?.url) throw new Error(error?.message ?? 'No checkout URL received')
      window.location.href = data.url
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Error desconocido')
      setLoading(false)
    }
  }

  return (
    <Overlay onClose={onClose}>
      {/* Header */}
      <div style={{ padding: '20px 24px 0', borderBottom: `1px solid ${BRAND.amazon}33`, paddingBottom: 16, marginBottom: 20 }}>
        <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 9, letterSpacing: '0.2em', color: `${BRAND.heirloom}55`, marginBottom: 4 }}>
          {mode === 'lot'
            ? (lang === 'es' ? 'INVERSIÓN POR LOTES' : 'LOT INVESTMENT')
            : (lang === 'es' ? 'PRE-COMPRA MVP' : 'MVP PRE-BUY')}
        </div>
        <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 20, color: BRAND.heirloom }}>
          {mode === 'mvp' && mvp ? mvp.name : technology.name}
        </div>
        <div style={{ fontFamily: FONTS.body, fontSize: 11, color: `${BRAND.heirloom}55`, marginTop: 2 }}>
          {mode === 'mvp' && mvp ? mvp.size_label : technology.tagline}
        </div>
      </div>

      <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Qty stepper */}
        <div>
          <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 9, letterSpacing: '0.2em', color: `${BRAND.heirloom}55`, marginBottom: 8 }}>
            {mode === 'lot' ? (lang === 'es' ? 'NÚMERO DE LOTES' : 'NUMBER OF LOTS') : (lang === 'es' ? 'CANTIDAD' : 'QUANTITY')}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setLots(l => Math.max(1, l - 1))} style={stepBtn}>−</button>
            <span style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 28, color: BRAND.heirloom, minWidth: 32, textAlign: 'center' }}>{lots}</span>
            <button onClick={() => setLots(l => Math.min(20, l + 1))} style={stepBtn}>+</button>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 24, color: BRAND.pod }}>{fmt(totalUsd)}</div>
              {totalCop > 0 && <div style={{ fontFamily: FONTS.body, fontSize: 10, color: `${BRAND.heirloom}44` }}>{fmtCop(totalCop)} COP</div>}
            </div>
          </div>
          {mode === 'lot' && (
            <div style={{ fontFamily: FONTS.body, fontSize: 10, color: `${BRAND.heirloom}44`, marginTop: 6 }}>
              {fmt(unitUsd)} {lang === 'es' ? 'por lote · 40kg input · 22kg output' : 'per lot · 40kg input · 22kg output'}
            </div>
          )}
        </div>

        {/* Payment selector */}
        <PaymentSelector selected={payment} onSelect={setPayment} lang={lang} />

        {/* Error */}
        {err && (
          <div style={{ padding: '8px 12px', borderRadius: 8, background: `${BRAND.radioRed}18`, border: `1px solid ${BRAND.radioRed}44`, fontFamily: FONTS.body, fontSize: 11, color: `${BRAND.radioRed}cc` }}>
            {err}
          </div>
        )}

        {/* CTA */}
        <button
          onClick={handlePay}
          disabled={loading}
          style={{
            ...ctaStyle(BRAND.pod),
            opacity: loading ? 0.6 : 1,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading
            ? (lang === 'es' ? 'PROCESANDO...' : 'PROCESSING...')
            : payment === 'stripe'
              ? (lang === 'es' ? `PAGAR CON TARJETA ${fmt(totalUsd)}` : `PAY BY CARD ${fmt(totalUsd)}`)
              : (lang === 'es' ? `PAGAR CON MERCADOPAGO ${fmtCop(totalCop)} COP` : `PAY WITH MERCADOPAGO ${fmtCop(totalCop)} COP`)}
        </button>

        <p style={{ fontFamily: FONTS.body, fontSize: 9, color: `${BRAND.heirloom}33`, textAlign: 'center', margin: 0 }}>
          {lang === 'es' ? 'Pago seguro · Redireccionamiento externo · Sin almacenar datos de tarjeta' : 'Secure payment · External redirect · No card data stored'}
        </p>
      </div>
    </Overlay>
  )
}

// ── helpers ──────────────────────────────────────────────────────────────────
function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(4,12,6,0.85)', backdropFilter: 'blur(6px)', zIndex: 500 }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        zIndex: 501, width: 'min(480px, 95vw)',
        background: BRAND.bgDark,
        border: `1px solid ${BRAND.amazon}55`,
        borderRadius: 20, overflow: 'hidden',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        {children}
      </div>
    </>
  )
}

const stepBtn: React.CSSProperties = {
  width: 36, height: 36, borderRadius: 8,
  background: BRAND.bgCard, border: `1px solid ${BRAND.amazon}55`,
  color: BRAND.heirloom, fontSize: 20, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: FONTS.display, fontWeight: 700,
}

function ctaStyle(color: string): React.CSSProperties {
  return {
    width: '100%', padding: '14px', borderRadius: 999,
    background: `linear-gradient(135deg, ${color}, ${color}cc)`,
    color: '#040C06', border: 'none', cursor: 'pointer',
    fontFamily: FONTS.display, fontWeight: 700,
    fontSize: 11, letterSpacing: '0.1em',
  }
}
