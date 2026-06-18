import { useState, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { BRAND, FONTS } from '../../utils/constants'
import { supabase } from '../../lib/supabase'
import type { Technology, Mvp, InvestMode } from '../../types/fund.types'
import type { UserProfile } from '../../lib/database.types'

const CryptoPayButton  = lazy(() => import('./CryptoPayButton'))
const CacaoPayButton   = lazy(() => import('./CacaoPayButton'))

interface Props {
  technology: Technology
  mvp?: Mvp | null
  mode: InvestMode
  onClose: () => void
  user: string | null
  profile?: UserProfile | null
  lang: 'es' | 'en'
}

const EUR_USD_APPROX = 1.10

export default function InvestModal({ technology, mvp, mode, onClose, user, profile, lang }: Props) {
  const [qty,     setQty]     = useState(1)
  const [loading, setLoading] = useState<'mp' | 'stripe' | null>(null)
  const [err,     setErr]     = useState<string | null>(null)
  const [done,    setDone]    = useState(false)
  const navigate = useNavigate()

  const T = (es: string, en: string) => lang === 'es' ? es : en

  const isInvestor = profile?.caua_role === 'investor' && mode === 'lot'
  const discount   = isInvestor ? 0.5 : 1

  const unitUsdCents = (mode === 'mvp' && mvp ? mvp.price_usd_cents : technology.lot_price_usd_cents) * discount
  const unitCop      = (mode === 'mvp' && mvp ? (mvp.price_cop ?? 0) : technology.lot_price_cop) * discount

  const totalUsdCents = unitUsdCents * qty
  const totalCop      = unitCop * qty
  const totalEurCents = Math.round(totalUsdCents / EUR_USD_APPROX)

  const fmtUsd = (c: number) => '$' + (c / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })
  const fmtCop = (v: number) => '$' + v.toLocaleString('es-CO') + ' COP'
  const fmtEur = (c: number) => '€' + (c / 100).toLocaleString('de-DE', { maximumFractionDigits: 0 })

  const itemName = mode === 'mvp' && mvp ? mvp.name : technology.name
  const itemSub  = mode === 'mvp' && mvp ? mvp.size_label : technology.tagline

  // ── Not logged in ─────────────────────────────────────────────────────────
  if (!user) {
    return (
      <Overlay onClose={onClose}>
        <div style={{ padding: '48px 28px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🫘</div>
          <p style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 16, color: BRAND.heirloom, marginBottom: 8 }}>
            {T('ÚNETE PARA INVERTIR', 'JOIN TO INVEST')}
          </p>
          <p style={{ fontFamily: FONTS.body, color: `${BRAND.heirloom}77`, fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
            {T('Regístrate para acceder al crowdfunding y al ecosistema CAÚA.', 'Register to access crowdfunding and the CAÚA ecosystem.')}
          </p>
          <button onClick={() => { onClose(); navigate('/auth') }} style={ctaBtn(BRAND.pod)}>
            {T('CREAR CUENTA GRATIS', 'CREATE FREE ACCOUNT')}
          </button>
          <button onClick={() => { onClose(); navigate('/auth?mode=login') }} style={{ ...ctaBtn(`${BRAND.heirloom}22`), marginTop: 8, color: `${BRAND.heirloom}99` }}>
            {T('YA TENGO CUENTA', 'I HAVE AN ACCOUNT')}
          </button>
        </div>
      </Overlay>
    )
  }

  // ── Success after crypto ───────────────────────────────────────────────────
  if (done) {
    return (
      <Overlay onClose={onClose}>
        <div style={{ padding: '48px 28px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🌱</div>
          <p style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 18, color: BRAND.pod, marginBottom: 8, letterSpacing: '0.04em' }}>
            {T('INVERSIÓN REGISTRADA', 'INVESTMENT REGISTERED')}
          </p>
          <p style={{ fontFamily: FONTS.body, color: `${BRAND.heirloom}77`, fontSize: 13, lineHeight: 1.6 }}>
            {T('Confirmamos tu pago en 24h y te escribimos con los próximos pasos.', 'We\'ll confirm your payment in 24h and reach out with next steps.')}
          </p>
          <button onClick={onClose} style={{ ...ctaBtn(BRAND.pod), marginTop: 24 }}>
            {T('CERRAR', 'CLOSE')}
          </button>
        </div>
      </Overlay>
    )
  }

  // ── Checkout fiat via Edge Function ───────────────────────────────────────
  const payFiat = async (provider: 'mp' | 'stripe', currency: 'COP' | 'USD' | 'EUR') => {
    setLoading(provider); setErr(null)
    try {
      const fn = provider === 'mp' ? 'create-mp-preference' : 'create-stripe-checkout'
      const { data, error } = await supabase.functions.invoke(fn, {
        body: {
          technology_id: technology.id,
          mvp_id:   mode === 'mvp' ? mvp?.id : null,
          lots_count: qty,
          currency,
          success_url: `${window.location.origin}/fund?status=success`,
          cancel_url:  `${window.location.origin}/fund?status=cancelled`,
        },
      })
      if (error) {
        // Supabase wraps the actual body in error.message when status is 4xx/5xx
        const msg = error?.message ?? 'Error al conectar con el servidor de pago.'
        throw new Error(msg)
      }
      if (!data?.url) throw new Error('No se recibió URL de pago. Intenta de nuevo.')
      window.location.href = data.url
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Error desconocido')
      setLoading(null)
    }
  }

  return (
    <Overlay onClose={onClose}>
      {/* ── Header ── */}
      <div style={{ padding: '18px 22px 14px', borderBottom: `1px solid ${BRAND.amazon}33`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontFamily: FONTS.body, fontSize: 10, color: `${BRAND.heirloom}44`, letterSpacing: '0.2em', marginBottom: 3 }}>
            {mode === 'lot' ? T('INVERSIÓN POR LOTES', 'LOT INVESTMENT') : T('PRE-COMPRA MVP', 'MVP PRE-BUY')}
          </div>
          <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 18, color: BRAND.heirloom }}>{itemName}</div>
          {itemSub && <div style={{ fontFamily: FONTS.body, fontSize: 11, color: `${BRAND.heirloom}44`, marginTop: 2 }}>{itemSub}</div>}
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: `${BRAND.heirloom}55`, fontSize: 20, lineHeight: 1, padding: 4 }}>✕</button>
      </div>

      <div style={{ padding: '18px 22px 22px', display: 'flex', flexDirection: 'column', gap: 18, maxHeight: '78vh', overflowY: 'auto' }}>

        {/* ── Qty + price ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => setQty(q => Math.max(1, q - 1))} style={stepBtn}>−</button>
            <span style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 28, color: BRAND.heirloom, minWidth: 28, textAlign: 'center' }}>{qty}</span>
            <button onClick={() => setQty(q => Math.min(20, q + 1))} style={stepBtn}>+</button>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 22, color: BRAND.pod }}>{fmtCop(totalCop)}</div>
            <div style={{ fontFamily: FONTS.body, fontSize: 9, color: `${BRAND.heirloom}44` }}>
              {fmtUsd(totalUsdCents)} · {fmtEur(totalEurCents)}
            </div>
          </div>
        </div>

        {isInvestor && (
          <div style={{ fontFamily: FONTS.body, fontSize: 10, color: BRAND.pod }}>✓ {T('Descuento inversor 50%', '50% investor discount')}</div>
        )}

        {/* ── Payment buttons ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

          {/* Stripe USD */}
          <button
            onClick={() => payFiat('stripe', 'USD')}
            disabled={loading !== null}
            style={payBtn(BRAND.mazorca, loading === 'stripe')}
          >
            <span style={{ fontSize: 18 }}>💳</span>
            <span style={{ flex: 1, textAlign: 'left' }}>
              <span style={{ display: 'block', fontFamily: FONTS.display, fontWeight: 800, fontSize: 12, letterSpacing: '0.08em' }}>
                {loading === 'stripe' ? T('ABRIENDO…', 'OPENING…') : `TARJETA · ${fmtUsd(totalUsdCents)}`}
              </span>
              <span style={{ display: 'block', fontFamily: FONTS.body, fontSize: 9, opacity: 0.6, marginTop: 2 }}>Visa · Mastercard · Amex · Apple Pay</span>
            </span>
            {loading !== 'stripe' && <span style={{ fontFamily: FONTS.display, fontSize: 12 }}>→</span>}
          </button>

          {/* Error from stripe */}
          {err && (
            <div style={{
              padding: '10px 12px', borderRadius: 10,
              background: `${BRAND.radioRed}14`, border: `1px solid ${BRAND.radioRed}33`,
              fontFamily: FONTS.body, fontSize: 11, color: `${BRAND.radioRed}cc`, lineHeight: 1.5,
            }}>
              {err}
              <div style={{ marginTop: 6, fontSize: 9, opacity: 0.7 }}>
                {T('Si el problema persiste, usa pago ETH o $CACAO.', 'If the issue persists, use ETH or $CACAO payment.')}
              </div>
            </div>
          )}

          {/* ETH on-chain */}
          <Suspense fallback={<PayBtnSkeleton color={BRAND.heroic} label="ETH on Base" />}>
            <CryptoPayButton
              amountUsd={Math.round(totalUsdCents / 100)}
              label={`${itemName} × ${qty}`}
              techId={technology.id}
              mvpId={mode === 'mvp' ? (mvp?.id ?? null) : null}
              lotsCount={qty}
              lang={lang}
              onSuccess={() => setDone(true)}
            />
          </Suspense>

          {/* $CACAO burn */}
          <Suspense fallback={<PayBtnSkeleton color={BRAND.criollo} label="$CACAO" />}>
            <CacaoPayButton
              amountUsd={Math.round(totalUsdCents / 100)}
              label={`${itemName} × ${qty}`}
              techId={technology.id}
              mvpId={mode === 'mvp' ? (mvp?.id ?? null) : null}
              lotsCount={qty}
              lang={lang}
              onSuccess={() => setDone(true)}
            />
          </Suspense>
        </div>

        <p style={{ fontFamily: FONTS.body, fontSize: 9, color: `${BRAND.heirloom}28`, textAlign: 'center', margin: 0, lineHeight: 1.6 }}>
          {T('Pago seguro · sin datos de tarjeta guardados · pagos on-chain irrevocables en Base.', 'Secure · no card data stored · on-chain payments irreversible on Base.')}
        </p>
      </div>
    </Overlay>
  )
}

function PayBtnSkeleton({ color, label }: { color: string; label: string }) {
  return (
    <div style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
      padding: '14px 16px', borderRadius: 12,
      background: `${color}12`, border: `1.5px solid ${color}22`,
      color: `${BRAND.heirloom}33`,
    }}>
      <span style={{ fontFamily: FONTS.body, fontSize: 10 }}>{label}…</span>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(4,12,6,0.88)', backdropFilter: 'blur(8px)', zIndex: 500 }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        zIndex: 501, width: 'min(440px, 95vw)',
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

function payBtn(color: string, active: boolean): React.CSSProperties {
  return {
    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
    padding: '14px 16px', borderRadius: 12, cursor: active ? 'not-allowed' : 'pointer',
    background: active ? `${color}22` : `${color}14`,
    border: `1.5px solid ${active ? color + '55' : color + '44'}`,
    color: BRAND.heirloom, transition: 'all 0.18s',
    opacity: active ? 0.75 : 1,
  }
}

function ctaBtn(color: string): React.CSSProperties {
  return {
    width: '100%', padding: '14px', borderRadius: 999,
    background: color, color: color === BRAND.pod ? '#040C06' : `${BRAND.heirloom}99`,
    border: 'none', cursor: 'pointer',
    fontFamily: FONTS.display, fontWeight: 700,
    fontSize: 10, letterSpacing: '0.1em',
  }
}
