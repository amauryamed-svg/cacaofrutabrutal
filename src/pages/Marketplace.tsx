import { useState } from 'react'
import { BRAND, PRODUCTS } from '../utils/constants'
import { useAuth } from '../context/AuthContext'
import ProductCard from '../components/auction/ProductCard'
import { useLang } from '../context/LangContext'
import { makeT } from '../utils/i18n'
import type { Product } from '../types'

type Filter = 'all' | 'preorder' | 'auction' | 'subscription'

function getMultiplier(referrals: number, prevLots: number): number {
  const refBonus = Math.min(referrals * 0.1, 1.0)
  const loyBonus = Math.min(prevLots * 0.15, 1.0)
  return Math.min(1.0 + refBonus + loyBonus, 3.0)
}

export default function Marketplace() {
  const { user }          = useAuth()
  const [filter, setFilter] = useState<Filter>('all')
  const { lang } = useLang()
  const T = makeT(lang)

  const FILTERS: { id: Filter; label: string }[] = [
    { id: 'all',          label: T('mkt_all')      },
    { id: 'preorder',     label: T('mkt_preorder') },
    { id: 'auction',      label: T('mkt_auction')  },
    { id: 'subscription', label: T('mkt_sub')      },
  ]
  const referrals           = 2   // TODO: query from Supabase user_referrals
  const prevLots            = 1   // TODO: query from Supabase orders
  const mult                = getMultiplier(referrals, prevLots)
  const filtered            = filter === 'all' ? PRODUCTS : PRODUCTS.filter((p: Product) => p.type === filter)

  return (
    <div style={{ background: '#040C06', minHeight: '100vh', paddingTop: 80 }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px' }}>

        <p style={{
          fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic',
          color: BRAND.mazorca, fontSize: 12, letterSpacing: '0.25em', marginBottom: 10,
        }}>{T('mkt_eyebrow')}</p>
        <h2 style={{
          fontFamily: "'Barlow Condensed', Impact, sans-serif", fontWeight: 900,
          fontSize: 'clamp(36px, 8vw, 64px)', color: BRAND.heirloom,
          textTransform: 'uppercase', margin: '0 0 8px', lineHeight: 0.9,
        }}>{T('mkt_title')}</h2>
        <p style={{
          fontFamily: 'system-ui', color: `${BRAND.heirloom}60`,
          fontSize: 14, margin: '0 0 28px', lineHeight: 1.6, maxWidth: 540,
        }}>
          {T('mkt_desc')}
        </p>

        {/* Multiplier badge */}
        {user && (
          <div style={{
            background: `linear-gradient(135deg, ${BRAND.mazorca}22, ${BRAND.theobroma}11)`,
            border: `1px solid ${BRAND.mazorca}44`, borderRadius: 12,
            padding: '16px 20px', marginBottom: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
          }}>
            <div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, color: BRAND.mazorca, fontSize: 12, letterSpacing: '0.1em' }}>
                {T('mkt_mult_label')}
              </div>
              <div style={{ fontFamily: 'system-ui', color: `${BRAND.heirloom}88`, fontSize: 11, marginTop: 2 }}>
                {referrals} {lang === 'es' ? 'referidos' : 'referrals'} + {prevLots} {lang === 'es' ? 'lotes previos' : 'previous lots'}
              </div>
            </div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 32, color: BRAND.mazorca }}>
              {mult.toFixed(1)}x
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{
              background: filter === f.id ? `${BRAND.pod}22` : 'transparent',
              border: `1px solid ${filter === f.id ? BRAND.pod : BRAND.amazon}44`,
              color: filter === f.id ? BRAND.pod : `${BRAND.heirloom}66`,
              padding: '6px 14px', borderRadius: 999, cursor: 'pointer',
              fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
              fontSize: 10, letterSpacing: '0.12em',
            }}>{f.label}</button>
          ))}
        </div>

        {/* Product grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {filtered.map(p => (
            <ProductCard key={p.id} product={p} multiplier={mult} user={user} />
          ))}
        </div>

        {/* Crowdfunding bar */}
        <div style={{
          marginTop: 40, background: '#132B1C', border: `1px solid ${BRAND.amazon}66`,
          borderRadius: 12, padding: 24,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, color: BRAND.heirloom, fontSize: 14, letterSpacing: '0.08em' }}>
                CROWDFUNDING · RONDA SEMILLA
              </div>
              <div style={{ fontFamily: 'system-ui', color: `${BRAND.heirloom}66`, fontSize: 11, marginTop: 2 }}>
                Transparencia total — cada compra impulsa el desarrollo rural
              </div>
            </div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, color: BRAND.pod, fontSize: 24 }}>
              23%
            </div>
          </div>
          <div style={{ height: 6, background: `${BRAND.amazon}66`, borderRadius: 999, overflow: 'hidden' }}>
            <div style={{
              width: '23%', height: '100%', borderRadius: 999,
              background: `linear-gradient(90deg, ${BRAND.pod}, ${BRAND.mazorca})`,
              transition: 'width 1s ease',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontFamily: 'system-ui', fontSize: 10, color: `${BRAND.heirloom}55` }}>
            <span>$17,250 USD recaudado</span>
            <span>Meta: $75,000 USD</span>
          </div>
        </div>
      </div>
    </div>
  )
}
