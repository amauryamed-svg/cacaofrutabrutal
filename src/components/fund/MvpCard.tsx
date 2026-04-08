import { BRAND, FONTS } from '../../utils/constants'
import type { Mvp } from '../../types/fund.types'

interface Props {
  mvp: Mvp
  onPreBuy: (mvp: Mvp) => void
  lang: 'es' | 'en'
}

export default function MvpCard({ mvp, onPreBuy, lang }: Props) {
  const usd = `$${(mvp.price_usd_cents / 100).toFixed(0)}`
  const cop  = mvp.price_cop ? `$${mvp.price_cop.toLocaleString()} COP` : null

  return (
    <div style={{
      background: BRAND.bgCard,
      border: `1px solid ${BRAND.amazon}44`,
      borderRadius: 12, padding: '16px 16px 14px',
      display: 'flex', flexDirection: 'column', gap: 10,
      transition: 'border-color 0.2s',
      position: 'relative',
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = `${BRAND.pod}44` }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = `${BRAND.amazon}44` }}
    >
      {/* MVP badge */}
      <div style={{
        position: 'absolute', top: 10, right: 10,
        padding: '2px 8px', borderRadius: 999,
        background: `${BRAND.mazorca}18`,
        border: `1px solid ${BRAND.mazorca}33`,
        fontFamily: FONTS.display, fontWeight: 700,
        fontSize: 7, letterSpacing: '0.15em', color: BRAND.mazorca,
      }}>
        MVP / PAID PILOT
      </div>

      {/* Name + size */}
      <div style={{ paddingRight: 60 }}>
        <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 16, color: BRAND.heirloom, lineHeight: 1.1 }}>{mvp.name}</div>
        {mvp.size_label && (
          <div style={{ fontFamily: FONTS.body, fontSize: 11, color: `${BRAND.heirloom}55`, marginTop: 2 }}>{mvp.size_label}</div>
        )}
      </div>

      {/* Description */}
      {mvp.description && (
        <p style={{ fontFamily: FONTS.body, fontSize: 11, color: `${BRAND.heirloom}70`, lineHeight: 1.55, margin: 0 }}>
          {mvp.description}
        </p>
      )}

      {/* Price row + CTA */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <span style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 22, color: BRAND.pod }}>{usd}</span>
          {cop && <span style={{ fontFamily: FONTS.body, fontSize: 10, color: `${BRAND.heirloom}44`, marginLeft: 6 }}>{cop}</span>}
        </div>
        <button
          onClick={() => onPreBuy(mvp)}
          style={{
            padding: '8px 16px', borderRadius: 999,
            background: `linear-gradient(135deg, ${BRAND.pod}, ${BRAND.mazorca}cc)`,
            color: BRAND.bgDeep, border: 'none', cursor: 'pointer',
            fontFamily: FONTS.display, fontWeight: 700,
            fontSize: 10, letterSpacing: '0.1em',
          }}
        >
          {lang === 'es' ? 'PRE-COMPRAR' : 'PRE-BUY'}
        </button>
      </div>

      {/* Stock */}
      {mvp.stock > 0 && mvp.stock < 100 && (
        <div style={{ fontFamily: FONTS.body, fontSize: 9, color: `${BRAND.theobroma}88` }}>
          ⚠ {mvp.stock} {lang === 'es' ? 'unidades disponibles' : 'units available'}
        </div>
      )}
    </div>
  )
}
