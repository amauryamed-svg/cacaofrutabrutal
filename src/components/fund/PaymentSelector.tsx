import { useState } from 'react'
import { BRAND, FONTS } from '../../utils/constants'
import type { PaymentMethod, Currency } from '../../types/fund.types'

interface Props {
  selected:  PaymentMethod
  currency:  Currency
  onSelect:  (m: PaymentMethod) => void
  onCurrency:(c: Currency) => void
  lang: 'es' | 'en'
}

type Option = {
  id:        PaymentMethod
  label:     string
  sub:       string
  icon:      string
  currency:  Currency
  coming?:   boolean
}

export default function PaymentSelector({ selected, currency, onSelect, onCurrency, lang }: Props) {
  const [showCrypto, setShowCrypto] = useState(false)

  const T = (es: string, en: string) => lang === 'es' ? es : en

  // Currency tabs
  const CURRENCIES: { id: Currency; label: string; flag: string }[] = [
    { id: 'COP', label: 'Pesos COP', flag: '🇨🇴' },
    { id: 'USD', label: 'Dólares USD', flag: '🇺🇸' },
    { id: 'EUR', label: 'Euros EUR', flag: '🇪🇺' },
  ]

  const FIAT_OPTIONS: Option[] = [
    {
      id: 'mercadopago',
      label: 'MercadoPago',
      sub: T('PSE · Nequi · Daviplata · Crédito', 'PSE · Nequi · Daviplata · Credit'),
      icon: '🏦', currency: 'COP',
    },
    {
      id: 'stripe_usd',
      label: T('Tarjeta USD', 'Card USD'),
      sub: 'Visa · Mastercard · Amex · Apple Pay',
      icon: '💳', currency: 'USD',
    },
    {
      id: 'stripe_eur',
      label: T('Tarjeta EUR', 'Card EUR'),
      sub: 'Visa · Mastercard · Amex · SEPA',
      icon: '💳', currency: 'EUR',
    },
  ]

  const CRYPTO_OPTIONS: Option[] = [
    {
      id: 'coinbase_usdc',
      label: 'USDC · Coinbase',
      sub: T('USD Coin en cadena · Coinbase Commerce', 'USD Coin on-chain · Coinbase Commerce'),
      icon: '🔵', currency: 'USD',
    },
    {
      id: 'coinbase_cop_digital',
      label: 'COP Digital',
      sub: T('Peso digital colombiano · en proceso', 'Colombian digital peso · coming soon'),
      icon: '🟡', currency: 'COP', coming: true,
    },
    {
      id: 'coinbase_eur_digital',
      label: 'EUR Digital',
      sub: T('Euro digital CBDC · en proceso', 'Digital euro CBDC · coming soon'),
      icon: '🟣', currency: 'EUR', coming: true,
    },
  ]

  // Filter fiat to current currency tab (show all if no match)
  const visibleFiat = FIAT_OPTIONS.filter(o => o.currency === currency)

  const handleCurrency = (c: Currency) => {
    onCurrency(c)
    // Auto-select the default gateway for this currency
    if (c === 'COP') onSelect('mercadopago')
    if (c === 'USD') onSelect('stripe_usd')
    if (c === 'EUR') onSelect('stripe_eur')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Currency tabs */}
      <div>
        <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 9, letterSpacing: '0.2em', color: `${BRAND.heirloom}55`, marginBottom: 8 }}>
          {T('MONEDA', 'CURRENCY')}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {CURRENCIES.map(c => {
            const active = currency === c.id
            return (
              <button
                key={c.id}
                onClick={() => handleCurrency(c.id)}
                style={{
                  flex: 1, padding: '8px 6px', borderRadius: 8, cursor: 'pointer',
                  background: active ? `${BRAND.pod}18` : 'transparent',
                  border: `1px solid ${active ? BRAND.pod : BRAND.amazon + '44'}`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                  transition: 'all 0.18s',
                }}
              >
                <span style={{ fontSize: 16 }}>{c.flag}</span>
                <span style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 8, letterSpacing: '0.08em', color: active ? BRAND.pod : `${BRAND.heirloom}66` }}>{c.id}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Fiat gateways */}
      <div>
        <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 9, letterSpacing: '0.2em', color: `${BRAND.heirloom}55`, marginBottom: 6 }}>
          {T('PASARELA DE PAGO', 'PAYMENT GATEWAY')}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {visibleFiat.map(opt => <GatewayRow key={opt.id} opt={opt} selected={selected} onSelect={onSelect} />)}
        </div>
      </div>

      {/* Crypto toggle */}
      <button
        onClick={() => setShowCrypto(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'transparent', border: 'none', cursor: 'pointer',
          fontFamily: FONTS.display, fontWeight: 700, fontSize: 9,
          letterSpacing: '0.15em', color: `${BRAND.heirloom}44`, padding: 0,
        }}
      >
        <span style={{ transform: showCrypto ? 'rotate(90deg)' : 'none', display: 'inline-block', transition: 'transform 0.2s' }}>▶</span>
        {T('OPCIONES CRYPTO · COINBASE', 'CRYPTO OPTIONS · COINBASE')}
      </button>

      {showCrypto && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, paddingLeft: 10, borderLeft: `2px solid ${BRAND.amazon}33` }}>
          {CRYPTO_OPTIONS.map(opt => <GatewayRow key={opt.id} opt={opt} selected={selected} onSelect={onSelect} />)}
          <p style={{ fontFamily: FONTS.body, fontSize: 9, color: `${BRAND.heirloom}33`, margin: '4px 0 0' }}>
            {T('Pagos crypto procesados por Coinbase Commerce. Monedas digitales en proceso de integración.', 'Crypto payments processed by Coinbase Commerce. Digital currencies integration in progress.')}
          </p>
        </div>
      )}
    </div>
  )
}

function GatewayRow({ opt, selected, onSelect }: { opt: { id: PaymentMethod; label: string; sub: string; icon: string; coming?: boolean }; selected: PaymentMethod; onSelect: (m: PaymentMethod) => void }) {
  const active = selected === opt.id
  return (
    <button
      onClick={() => !opt.coming && onSelect(opt.id)}
      disabled={opt.coming}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px', borderRadius: 8, cursor: opt.coming ? 'default' : 'pointer',
        background: active ? `${BRAND.pod}14` : 'transparent',
        border: `1px solid ${active ? BRAND.pod : BRAND.amazon + '33'}`,
        textAlign: 'left', transition: 'all 0.18s',
        opacity: opt.coming ? 0.5 : 1,
      }}
    >
      <span style={{ fontSize: 18, flexShrink: 0 }}>{opt.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 10, letterSpacing: '0.06em', color: active ? BRAND.pod : BRAND.heirloom }}>{opt.label}</span>
          {opt.coming && (
            <span style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 7, letterSpacing: '0.12em', color: `${BRAND.mazorca}cc`, background: `${BRAND.mazorca}18`, padding: '2px 6px', borderRadius: 999 }}>EN PROCESO</span>
          )}
        </div>
        <div style={{ fontFamily: FONTS.body, fontSize: 9, color: `${BRAND.heirloom}44`, marginTop: 1 }}>{opt.sub}</div>
      </div>
      {!opt.coming && (
        <div style={{
          width: 12, height: 12, borderRadius: '50%', flexShrink: 0,
          border: `2px solid ${active ? BRAND.pod : BRAND.amazon + '55'}`,
          background: active ? BRAND.pod : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {active && <div style={{ width: 4, height: 4, borderRadius: '50%', background: BRAND.bgDeep }} />}
        </div>
      )}
    </button>
  )
}
