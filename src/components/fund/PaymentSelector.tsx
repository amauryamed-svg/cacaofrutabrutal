import { BRAND, FONTS } from '../../utils/constants'
import type { PaymentMethod } from '../../types/fund.types'

interface Props {
  selected: PaymentMethod
  onSelect: (m: PaymentMethod) => void
  lang: 'es' | 'en'
}

export default function PaymentSelector({ selected, onSelect, lang }: Props) {
  const OPTIONS: { id: PaymentMethod; label: string; sub: string; icon: string }[] = [
    {
      id: 'stripe',
      label: lang === 'es' ? 'Tarjeta (USD/EUR)' : 'Card (USD/EUR)',
      sub:   lang === 'es' ? 'Visa · Mastercard · Amex' : 'Visa · Mastercard · Amex',
      icon: '💳',
    },
    {
      id: 'mercadopago',
      label: lang === 'es' ? 'MercadoPago (COP)' : 'MercadoPago (COP)',
      sub:   lang === 'es' ? 'PSE · Nequi · Daviplata · Crédito' : 'PSE · Nequi · Daviplata · Credit',
      icon: '🏦',
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 9, letterSpacing: '0.2em', color: `${BRAND.heirloom}55` }}>
        {lang === 'es' ? 'MÉTODO DE PAGO' : 'PAYMENT METHOD'}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {OPTIONS.map(opt => {
          const active = selected === opt.id
          return (
            <button
              key={opt.id}
              onClick={() => onSelect(opt.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 16px', borderRadius: 10, cursor: 'pointer',
                background: active ? `${BRAND.pod}14` : 'transparent',
                border: `1px solid ${active ? BRAND.pod : BRAND.amazon + '44'}`,
                textAlign: 'left', transition: 'all 0.2s',
              }}
            >
              <span style={{ fontSize: 20, flexShrink: 0 }}>{opt.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 11, letterSpacing: '0.08em', color: active ? BRAND.pod : BRAND.heirloom }}>{opt.label}</div>
                <div style={{ fontFamily: FONTS.body, fontSize: 10, color: `${BRAND.heirloom}55`, marginTop: 2 }}>{opt.sub}</div>
              </div>
              <div style={{
                width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
                border: `2px solid ${active ? BRAND.pod : BRAND.amazon + '66'}`,
                background: active ? BRAND.pod : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {active && <div style={{ width: 5, height: 5, borderRadius: '50%', background: BRAND.bgDeep }} />}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
