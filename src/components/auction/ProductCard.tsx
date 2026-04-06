import { BRAND } from '../../utils/constants'
import { useCountdown } from '../../hooks/useCountdown'
import ProductIllustration from '../ui/ProductIllustration'
import type { Product } from '../../types'
import { useNavigate } from 'react-router-dom'

interface Props {
  product: Product
  multiplier: number
  user: string | null
}

// Product image slots — swap for real photo URLs when available
const PRODUCT_IMAGES: Record<number, string | undefined> = {
  1: undefined,  // TODO: swap for real Sunrise Shot photo
  2: undefined,  // TODO: swap for real Sunset Shot photo
  3: undefined,  // TODO: swap for real Cacao Ceremonial photo
  4: undefined,  // TODO: swap for real Edición Guardián mockup
  5: undefined,  // TODO: swap for real Círculo Sumapaz visual
  6: undefined,  // TODO: swap for real Cold Brew Cacao photo
}

const TYPE_CONFIG = {
  preorder:     { label: 'PRE-ORDER',    color: BRAND.heroic,   cta: 'Reserva tu lugar',  sub: 'Envío al confirmar producción' },
  auction:      { label: 'SUBASTA VIVA', color: BRAND.mazorca,  cta: 'Participar ahora',  sub: 'Precio mejora con tu comunidad' },
  subscription: { label: 'MEMBRESÍA',   color: BRAND.criollo,  cta: 'Unirme al círculo', sub: 'Cancela cuando quieras' },
}

// Benefit tags per product — sensory, functional language for female audience
const PRODUCT_BENEFITS: Record<number, string[]> = {
  1: ['Funcional','Sin azúcar','Novel Food EU'],
  2: ['Alta concentración','Adaptógeno','Ritual matutino'],
  3: ['Fine Flavor','Origen único','Ceremonia'],
  4: ['Colección limitada','5 terroirs','Regalo consciente'],
  5: ['Comunidad viva','Mensual','Impacto directo'],
  6: ['Fermentado','Probiótico','Refrescante'],
}

export default function ProductCard({ product: p, multiplier, user }: Props) {
  const navigate        = useNavigate()
  const countdown       = useCountdown(p.timer ?? 0)
  const tc              = TYPE_CONFIG[p.type]
  const discountedPrice = p.type === 'auction' ? Math.round(p.price / multiplier) : p.price
  const hasDiscount     = p.type === 'auction' && multiplier > 1
  const benefits        = PRODUCT_BENEFITS[p.id] ?? []

  return (
    <article style={{
      background: '#132B1C',
      border: `1px solid ${BRAND.amazon}55`,
      borderRadius: 16,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      transition: 'transform 0.3s, box-shadow 0.3s',
      cursor: 'pointer',
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'
        ;(e.currentTarget as HTMLElement).style.boxShadow = `0 20px 48px rgba(0,0,0,0.4), 0 0 0 1px ${tc.color}33`
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
        ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
      }}
    >
      {/* Illustration / Photo */}
      <div style={{ position: 'relative' }}>
        <ProductIllustration productId={p.id} imageSrc={PRODUCT_IMAGES[p.id]} height={168} />

        {/* Type badge — top left */}
        <div style={{
          position: 'absolute', top: 12, left: 12,
          background: `${BRAND.bgDeep}cc`,
          border: `1px solid ${tc.color}66`,
          backdropFilter: 'blur(8px)',
          padding: '4px 10px', borderRadius: 999,
          fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
          fontSize: 9, letterSpacing: '0.14em', color: tc.color,
        }}>{tc.label}</div>

        {/* Countdown — auctions only */}
        {p.type === 'auction' && p.timer && (
          <div style={{
            position: 'absolute', top: 12, right: 12,
            background: `${BRAND.bgDeep}cc`, backdropFilter: 'blur(8px)',
            border: `1px solid ${BRAND.mazorca}44`,
            padding: '4px 10px', borderRadius: 999,
            fontFamily: 'system-ui', fontSize: 9, color: BRAND.mazorca,
          }}>⏱ {countdown}</div>
        )}

        {/* Discount ribbon — when multiplier active */}
        {hasDiscount && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: `linear-gradient(90deg, ${BRAND.mazorca}22, transparent)`,
            borderTop: `1px solid ${BRAND.mazorca}33`,
            padding: '5px 12px',
            fontFamily: 'system-ui', fontSize: 10, color: BRAND.mazorca,
          }}>
            Tu multiplicador activo: <strong>{multiplier.toFixed(1)}x</strong>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '18px 18px 20px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>

        {/* Benefit tags */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {benefits.map(b => (
            <span key={b} style={{
              background: `${BRAND.amazon}66`,
              border: `1px solid ${BRAND.amazon}`,
              padding: '2px 8px', borderRadius: 999,
              fontFamily: 'system-ui', fontSize: 9, color: `${BRAND.heirloom}99`,
              letterSpacing: '0.05em',
            }}>{b}</span>
          ))}
        </div>

        {/* Name + description */}
        <div>
          <h3 style={{
            fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900,
            color: BRAND.heirloom, fontSize: 20, margin: '0 0 5px',
            letterSpacing: '0.04em', lineHeight: 1.1,
          }}>{p.name}</h3>
          <p style={{
            fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic',
            color: `${BRAND.heirloom}77`, fontSize: 11.5, margin: 0, lineHeight: 1.55,
          }}>{p.desc}</p>
        </div>

        {/* Price */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{
            fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900,
            fontSize: 26, color: BRAND.heirloom, lineHeight: 1,
          }}>${(discountedPrice / 100).toFixed(0)}</span>
          {hasDiscount && (
            <span style={{ fontFamily: 'system-ui', fontSize: 13, color: `${BRAND.heirloom}40`, textDecoration: 'line-through' }}>
              ${(p.price / 100).toFixed(0)}
            </span>
          )}
          <span style={{ fontFamily: 'system-ui', fontSize: 10, color: `${BRAND.heirloom}50` }}>
            USD{p.type === 'subscription' ? '/mes' : ''}
          </span>
        </div>

        {/* CTA */}
        <div style={{ marginTop: 'auto' }}>
          <button onClick={() => {
            if (!user) { navigate('/auth'); return }
            alert(`✓ ${p.name} — Checkout con Stripe próximamente`)
          }} style={{
            width: '100%', padding: '13px 16px',
            borderRadius: 10, border: 'none',
            background: `linear-gradient(135deg, ${BRAND.pod}, ${BRAND.amazon})`,
            color: BRAND.heirloom, cursor: 'pointer',
            fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
            fontSize: 13, letterSpacing: '0.1em',
            transition: 'opacity 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            {tc.cta}
          </button>
          <p style={{
            textAlign: 'center', margin: '7px 0 0',
            fontFamily: 'system-ui', fontSize: 10, color: `${BRAND.heirloom}44`,
          }}>{tc.sub}</p>
        </div>

        {/* Trust signal */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          paddingTop: 10, borderTop: `1px solid ${BRAND.amazon}44`,
        }}>
          <span style={{ fontSize: 10 }}>🌿</span>
          <span style={{ fontFamily: 'system-ui', fontSize: 9.5, color: `${BRAND.heirloom}55` }}>
            {p.stock} unidades · Guardián verificado · Trazable
          </span>
        </div>
      </div>
    </article>
  )
}
