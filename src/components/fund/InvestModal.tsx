import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BRAND, FONTS } from '../../utils/constants'
import { supabase } from '../../lib/supabase'
import PaymentSelector from './PaymentSelector'
import type { Technology, Mvp, PaymentMethod, Currency, InvestMode } from '../../types/fund.types'

interface Props {
  technology: Technology
  mvp?: Mvp | null
  mode: InvestMode
  onClose: () => void
  user: string | null
  lang: 'es' | 'en'
}

const EUR_COP_APPROX = 4500   // 1 EUR ≈ 4 500 COP (display only — server prices from DB)
const EUR_USD_APPROX = 1.10   // 1 EUR ≈ 1.10 USD (display only)

export default function InvestModal({ technology, mvp, mode, onClose, user, lang }: Props) {
  const [lots,     setLots]    = useState(1)
  const [payment,  setPayment] = useState<PaymentMethod>('mercadopago')
  const [currency, setCurrency] = useState<Currency>('COP')
  const [loading,  setLoading] = useState(false)
  const [err,      setErr]     = useState<string | null>(null)
  const navigate = useNavigate()

  const T = (es: string, en: string) => lang === 'es' ? es : en

  const unitUsd = mode === 'mvp' && mvp ? mvp.price_usd_cents : technology.lot_price_usd_cents
  const unitCop = mode === 'mvp' && mvp ? (mvp.price_cop ?? 0) : technology.lot_price_cop

  // Display totals per currency (server always re-prices — these are for display only)
  const totalCop = unitCop * lots
  const totalUsd = unitUsd * lots
  const totalEur = Math.round(totalUsd / EUR_USD_APPROX)

  const fmtUsd = (c: number) => '$' + (c / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })
  const fmtCop = (v: number) => '$' + v.toLocaleString('es-CO') + ' COP'
  const fmtEur = (c: number) => '€' + (c / 100).toLocaleString('de-DE', { maximumFractionDigits: 0 })

  const displayTotal = currency === 'COP' ? fmtCop(totalCop)
    : currency === 'USD' ? fmtUsd(totalUsd)
    : fmtEur(totalEur)

  if (!user) {
    return (
      <Overlay onClose={onClose}>
        <div style={{ padding: '48px 28px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🫘</div>
          <p style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 16, color: BRAND.heirloom, marginBottom: 8 }}>
            {T('ÚNETE PARA INVERTIR', 'JOIN TO INVEST')}
          </p>
          <p style={{ fontFamily: FONTS.body, color: `${BRAND.heirloom}77`, fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
            {T('Regístrate para acceder al crowdfunding, seguimiento de lotes y el ecosistema CAUA.', 'Register to access crowdfunding, lot tracking and the CAUA ecosystem.')}
          </p>
          <button onClick={() => { onClose(); navigate('/auth') }} style={ctaStyle(BRAND.pod)}>
            {T('CREAR CUENTA GRATIS', 'CREATE FREE ACCOUNT')}
          </button>
          <button onClick={() => { onClose(); navigate('/auth?mode=login') }} style={{ ...ctaStyle(`${BRAND.heirloom}22`), marginTop: 8, color: `${BRAND.heirloom}99` }}>
            {T('YA TENGO CUENTA', 'I HAVE AN ACCOUNT')}
          </button>
        </div>
      </Overlay>
    )
  }

  const handlePay = async () => {
    if (payment === 'coinbase_cop_digital' || payment === 'coinbase_eur_digital') return // UI disabled
    setLoading(true); setErr(null)
    try {
      const isCrypto = payment === 'coinbase_usdc'
      const fn = payment === 'mercadopago'
        ? 'create-mp-preference'
        : isCrypto ? 'create-coinbase-charge' : 'create-stripe-checkout'

      const body = {
        technology_id: technology.id,
        mvp_id: mode === 'mvp' ? mvp?.id : null,
        lots_count: lots,
        currency,
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

  const ctaLabel = () => {
    if (loading) return T('PROCESANDO...', 'PROCESSING...')
    if (payment === 'mercadopago') return `${T('PAGAR CON MERCADOPAGO', 'PAY WITH MERCADOPAGO')} · ${displayTotal}`
    if (payment === 'stripe_usd' || payment === 'stripe_eur') return `${T('PAGAR CON TARJETA', 'PAY BY CARD')} · ${displayTotal}`
    if (payment === 'coinbase_usdc') return `${T('PAGAR CON USDC', 'PAY WITH USDC')} · ${fmtUsd(totalUsd)}`
    return T('PAGAR', 'PAY')
  }

  return (
    <Overlay onClose={onClose}>
      {/* Header */}
      <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${BRAND.amazon}33` }}>
        <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 9, letterSpacing: '0.2em', color: `${BRAND.heirloom}55`, marginBottom: 4 }}>
          {mode === 'lot' ? T('INVERSIÓN POR LOTES', 'LOT INVESTMENT') : T('PRE-COMPRA MVP', 'MVP PRE-BUY')}
        </div>
        <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 20, color: BRAND.heirloom }}>
          {mode === 'mvp' && mvp ? mvp.name : technology.name}
        </div>
        {(mode === 'mvp' ? mvp?.size_label : technology.tagline) && (
          <div style={{ fontFamily: FONTS.body, fontSize: 11, color: `${BRAND.heirloom}44`, marginTop: 2 }}>
            {mode === 'mvp' && mvp ? mvp.size_label : technology.tagline}
          </div>
        )}
      </div>

      <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 20, maxHeight: '70vh', overflowY: 'auto' }}>
        {/* Qty stepper */}
        <div>
          <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 9, letterSpacing: '0.2em', color: `${BRAND.heirloom}55`, marginBottom: 8 }}>
            {mode === 'lot' ? T('NÚMERO DE LOTES', 'NUMBER OF LOTS') : T('CANTIDAD', 'QUANTITY')}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setLots(l => Math.max(1, l - 1))} style={stepBtn}>−</button>
            <span style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 28, color: BRAND.heirloom, minWidth: 32, textAlign: 'center' }}>{lots}</span>
            <button onClick={() => setLots(l => Math.min(20, l + 1))} style={stepBtn}>+</button>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 22, color: BRAND.pod }}>{displayTotal}</div>
              {currency !== 'COP' && totalCop > 0 && (
                <div style={{ fontFamily: FONTS.body, fontSize: 9, color: `${BRAND.heirloom}33` }}>≈ {fmtCop(totalCop)}</div>
              )}
            </div>
          </div>
          {mode === 'lot' && (
            <div style={{ fontFamily: FONTS.body, fontSize: 10, color: `${BRAND.heirloom}44`, marginTop: 6 }}>
              {fmtUsd(unitUsd)} {T('por lote · 40 kg input · 22 kg output', 'per lot · 40 kg input · 22 kg output')}
            </div>
          )}
        </div>

        {/* Payment selector */}
        <PaymentSelector
          selected={payment}
          currency={currency}
          onSelect={setPayment}
          onCurrency={c => { setCurrency(c) }}
          lang={lang}
        />

        {err && (
          <div style={{ padding: '8px 12px', borderRadius: 8, background: `${BRAND.radioRed}18`, border: `1px solid ${BRAND.radioRed}44`, fontFamily: FONTS.body, fontSize: 11, color: `${BRAND.radioRed}cc` }}>
            {err}
          </div>
        )}

        <button
          onClick={handlePay}
          disabled={loading || payment === 'coinbase_cop_digital' || payment === 'coinbase_eur_digital'}
          style={{
            ...ctaStyle(BRAND.pod),
            opacity: (loading || payment === 'coinbase_cop_digital' || payment === 'coinbase_eur_digital') ? 0.5 : 1,
            cursor: (loading || payment === 'coinbase_cop_digital' || payment === 'coinbase_eur_digital') ? 'not-allowed' : 'pointer',
          }}
        >
          {ctaLabel()}
        </button>

        <p style={{ fontFamily: FONTS.body, fontSize: 9, color: `${BRAND.heirloom}33`, textAlign: 'center', margin: 0 }}>
          {T('Pago seguro · Redireccionamiento externo · Sin almacenar datos de tarjeta', 'Secure payment · External redirect · No card data stored')}
        </p>

        {/* EU conversion note */}
        {currency === 'EUR' && (
          <p style={{ fontFamily: FONTS.body, fontSize: 9, color: `${BRAND.heirloom}22`, textAlign: 'center', margin: '-12px 0 0' }}>
            {T(`Tasa indicativa 1 EUR ≈ $${EUR_COP_APPROX.toLocaleString('es-CO')} COP. El servidor calcula el precio final.`,
               `Indicative rate 1 EUR ≈ $${EUR_COP_APPROX.toLocaleString('en-US')} COP. Server calculates final price.`)}
          </p>
        )}
      </div>
    </Overlay>
  )
}

// ── helpers ───────────────────────────────────────────────────────────────────
function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(4,12,6,0.88)', backdropFilter: 'blur(8px)', zIndex: 500 }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        zIndex: 501, width: 'min(500px, 95vw)',
        background: BRAND.bgDark,
        border: `1px solid ${BRAND.amazon}55`,
        borderRadius: 20, overflow: 'hidden',
        maxHeight: '92vh', overflowY: 'auto',
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
    fontSize: 10, letterSpacing: '0.1em',
  }
}
