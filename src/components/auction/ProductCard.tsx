import { lazy, Suspense, useState } from 'react'
import { BRAND, FONTS, CACAO_PER_USD } from '../../utils/constants'
import { useCountdown } from '../../hooks/useCountdown'
import ProductIllustration from '../ui/ProductIllustration'
import type { Product } from '../../types'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../../context/LangContext'
import { useTokenBalance } from '../../hooks/useTokenBalance'
import { useRedeemTokens } from '../../hooks/useRedeemTokens'

const CacaoPayButton = lazy(() => import('../fund/CacaoPayButton'))

interface Props {
  product: Product
  multiplier: number
  user: string | null
  roleDiscount?: number // 0-1, where 1 = no discount, 0 = 100% off
}

// Product image slots — swap for real photo URLs when available
const PRODUCT_IMAGES: Record<number, string | undefined> = {
  1: undefined,
  2: undefined,
  3: undefined,
  4: undefined,
  5: undefined,
  6: undefined,
  7: undefined,
  8: undefined,
  9:  undefined,
  10: undefined,
}

const TYPE_CONFIG = {
  preorder:     { label: 'PRE-ORDER',    color: BRAND.heroic,   cta: 'Reserva tu lugar',  sub: 'Envío al confirmar producción' },
  auction:      { label: 'SUBASTA VIVA', color: BRAND.mazorca,  cta: 'Participar ahora',  sub: 'Precio mejora con tu comunidad' },
  subscription: { label: 'MEMBRESÍA',   color: BRAND.criollo,  cta: 'Unirme al círculo', sub: 'Cancela cuando quieras' },
}

// Benefit tags per product — sensory, functional language for female audience
const PRODUCT_BENEFITS: Record<number, string[]> = {
  1: ['Funcional','Sin azúcar','Novel Food EU'],
  2: ['Alta concentración','Adaptógeno','Vespertino'],
  3: ['Fine Flavor','Origen único','Ceremonia'],
  4: ['Colección limitada','5 terroirs','Regalo consciente'],
  5: ['Comunidad viva','Mensual','Impacto directo'],
  6: ['Fermentado 72h','Probiótico','Cold brew'],
  7: ['HydroSol™','500mL','Cosmético + alimentario'],
  8: ['Mucílago','Endulzante natural','Gastronómico'],
  9:  ['Bioactivo','Lote B2B','Cobertura Blanca','Whey'],
  10: ['Bioactivo','Lote B2B','Cobertura Oscura','72% Cacao'],
}

export default function ProductCard({ product: p, multiplier, user, roleDiscount = 1 }: Props) {
  const navigate        = useNavigate()
  const { lang }        = useLang()
  const countdown       = useCountdown(p.timer ?? 0)
  const tc              = TYPE_CONFIG[p.type]
  let discountedPrice   = p.type === 'auction' ? Math.round(p.price / multiplier) : p.price
  // Apply role-based discount on top
  discountedPrice       = Math.round(discountedPrice * roleDiscount)

  const { beans }                    = useTokenBalance()
  const { redeem, productBeansPrice } = useRedeemTokens()
  const beansCost                    = productBeansPrice(discountedPrice)
  const canPayWithBeans              = user !== null && beans >= beansCost

  const [beansState, setBeansState] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [beansMsg,   setBeansMsg]   = useState('')

  const handleBeansPayment = async () => {
    setBeansState('loading')
    const result = await redeem('product_custom', {
      beans_to_spend: beansCost,
      item_ref: `product-${p.id}`,
    })
    if (result.ok) {
      setBeansState('ok')
      setBeansMsg(`Reservado con ${beansCost} $CACAO. Balance: ${(result.new_balance ?? 0).toFixed(0)}`)
    } else {
      setBeansState('error')
      setBeansMsg(result.error === 'insufficient_balance'
        ? `Faltan ${Math.ceil((result.need ?? 0) - (result.have ?? 0))} $CACAO`
        : 'Error al redimir $CACAO')
    }
  }
  const hasDiscount     = (p.type === 'auction' && multiplier > 1) || roleDiscount < 1
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
          fontFamily: FONTS.display, fontWeight: 700,
          fontSize: 9, letterSpacing: '0.14em', color: tc.color,
        }}>{tc.label}</div>

        {/* Countdown — auctions only */}
        {p.type === 'auction' && p.timer && (
          <div style={{
            position: 'absolute', top: 12, right: 12,
            background: `${BRAND.bgDeep}cc`, backdropFilter: 'blur(8px)',
            border: `1px solid ${BRAND.mazorca}44`,
            padding: '4px 10px', borderRadius: 999,
            fontFamily: FONTS.body, fontSize: 9, color: BRAND.mazorca,
          }}>⏱ {countdown}</div>
        )}

        {/* Discount ribbon — when multiplier or role discount active */}
        {hasDiscount && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: `linear-gradient(90deg, ${BRAND.pod}22, transparent)`,
            borderTop: `1px solid ${BRAND.pod}33`,
            padding: '5px 12px',
            fontFamily: FONTS.body, fontSize: 10, color: BRAND.pod,
          }}>
            {multiplier > 1 && `Multiplicador: ${multiplier.toFixed(1)}x`}
            {roleDiscount < 1 && ` ${multiplier > 1 ? '·' : ''} ${Math.round((1 - roleDiscount) * 100)}% descuento`}
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
              fontFamily: FONTS.body, fontSize: 9, color: `${BRAND.heirloom}99`,
              letterSpacing: '0.05em',
            }}>{b}</span>
          ))}
        </div>

        {/* Name + description */}
        <div>
          <h3 style={{
            fontFamily: FONTS.display, fontWeight: 900,
            color: BRAND.heirloom, fontSize: 20, margin: '0 0 5px',
            letterSpacing: '0.04em', lineHeight: 1.1,
          }}>{p.name}</h3>
          <p style={{
            fontFamily: FONTS.serif, fontStyle: 'italic',
            color: `${BRAND.heirloom}77`, fontSize: 11.5, margin: 0, lineHeight: 1.55,
          }}>{p.desc}</p>
        </div>

        {/* Price — $CACAO primary, USD secondary, beans off-chain tertiary */}
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
            <span style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 13, color: BRAND.heroic, lineHeight: 1,
            }}>◈ {Math.round((discountedPrice / 100) * CACAO_PER_USD)}</span>
            <span style={{ fontFamily: FONTS.body, fontSize: 10, color: BRAND.heroic }}>
              $CACAO{p.type === 'subscription' ? '/mes' : ''}
            </span>
          </div>
          <div style={{ fontFamily: FONTS.body, fontSize: 10, color: `${BRAND.heirloom}44` }}>
            ≈ ${(discountedPrice / 100).toFixed(0)} USD{p.type === 'subscription' ? '/mes' : ''}
            {hasDiscount && (
              <span style={{ marginLeft: 6, textDecoration: 'line-through', opacity: 0.5 }}>
                ${(p.price / 100).toFixed(0)}
              </span>
            )}
          </div>
          {/* Off-chain beans price — shows user's proximity to affording this */}
          {user && (
            <div style={{
              marginTop: 5, display: 'inline-flex', alignItems: 'center', gap: 5,
              background: canPayWithBeans ? `${BRAND.pod}18` : `${BRAND.heirloom}08`,
              border: `1px solid ${canPayWithBeans ? BRAND.pod + '66' : BRAND.heirloom + '18'}`,
              borderRadius: 999, padding: '3px 8px',
            }}>
              <span style={{
                fontFamily: "'Press Start 2P', monospace", fontSize: 5,
                color: canPayWithBeans ? BRAND.pod : `${BRAND.heirloom}44`,
                letterSpacing: '0.08em',
              }}>
                {canPayWithBeans ? `✓ ${beansCost} $CACAO` : `${Math.floor(beans)}/${beansCost} $CACAO`}
              </span>
            </div>
          )}
        </div>

        {/* CTA — CacaoPayButton */}
        <div style={{ marginTop: 'auto' }}>
          {!user ? (
            <button
              onClick={() => navigate('/auth')}
              style={{
                width: '100%', padding: '13px 16px',
                borderRadius: 0, border: `2px solid ${BRAND.heroic}88`,
                background: `${BRAND.heroic}22`,
                color: BRAND.heroic, cursor: 'pointer',
                fontFamily: "'Press Start 2P', monospace",
                fontSize: 9, letterSpacing: '0.1em',
              }}
            >
              CONECTAR →
            </button>
          ) : (
            <Suspense fallback={
              <div style={{
                width: '100%', padding: '13px 16px',
                background: `${BRAND.heroic}22`, border: `2px solid ${BRAND.heroic}44`,
                borderRadius: 0, textAlign: 'center',
                fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: `${BRAND.heroic}88`,
              }}>
                CARGANDO…
              </div>
            }>
              <CacaoPayButton
                amountUsd={discountedPrice / 100}
                label={lang === 'es' ? `Comprar con $CACAO` : 'Buy with $CACAO'}
                lang={lang as 'es' | 'en'}
                mvpId={`product-${p.id}`}
                onSuccess={() => { /* handled inside button */ }}
              />
            </Suspense>
          )}
          <p style={{
            textAlign: 'center', margin: '6px 0 0',
            fontFamily: "'Press Start 2P', monospace", fontSize: 6,
            color: BRAND.pod, letterSpacing: '0.1em',
          }}>
            🔥 QUEMA MAZORCAS → $CACAO → COMPRA
          </p>

          {/* Off-chain beans path — available today, no wallet required */}
          {user && beansState !== 'ok' && (
            <div style={{ marginTop: 8 }}>
              <button
                onClick={handleBeansPayment}
                disabled={!canPayWithBeans || beansState === 'loading'}
                style={{
                  width: '100%', padding: '10px 12px',
                  background: canPayWithBeans ? `${BRAND.pod}18` : 'transparent',
                  border: `1px solid ${canPayWithBeans ? BRAND.pod + '66' : BRAND.heirloom + '22'}`,
                  borderRadius: 0, cursor: canPayWithBeans ? 'pointer' : 'not-allowed',
                  color: canPayWithBeans ? BRAND.pod : `${BRAND.heirloom}33`,
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: 6, letterSpacing: '0.08em', textTransform: 'uppercase',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                {beansState === 'loading' ? '...' : `◈ RESERVAR · ${beansCost} $CACAO`}
              </button>
              {beansState === 'error' && (
                <div style={{ marginTop: 4, fontFamily: FONTS.body, fontSize: 9, color: '#E47966', textAlign: 'center' }}>
                  {beansMsg}
                </div>
              )}
            </div>
          )}
          {beansState === 'ok' && (
            <div style={{
              marginTop: 8, padding: '8px 12px',
              background: `${BRAND.pod}18`, border: `1px solid ${BRAND.pod}44`,
              borderRadius: 0, textAlign: 'center',
              fontFamily: "'Press Start 2P', monospace", fontSize: 6, color: BRAND.pod,
              letterSpacing: '0.08em',
            }}>
              ✓ RESERVADO · {beansMsg}
            </div>
          )}
        </div>

        {/* Trust signal */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          paddingTop: 10, borderTop: `1px solid ${BRAND.amazon}44`,
        }}>
          <span style={{ fontSize: 10 }}>🌿</span>
          <span style={{ fontFamily: FONTS.body, fontSize: 9.5, color: `${BRAND.heirloom}55` }}>
            {p.stock} unidades · Guardián verificado · Trazable
          </span>
        </div>
      </div>
    </article>
  )
}
