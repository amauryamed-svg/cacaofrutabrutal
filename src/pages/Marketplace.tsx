import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { BRAND, FONTS, PRODUCTS, ROLE_CONFIG } from '../utils/constants'
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
  const { user, profile }   = useAuth()
  const navigate             = useNavigate()
  const [filter, setFilter] = useState<Filter>('all')
  const { lang } = useLang()
  const T = makeT(lang)
  const { hash } = useLocation()

  useEffect(() => {
    if (hash) {
      const id = hash.replace('#', '')
      requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
  }, [hash])

  const FILTERS: { id: Filter; label: string }[] = [
    { id: 'all',          label: T('mkt_all')      },
    { id: 'preorder',     label: T('mkt_preorder') },
    { id: 'auction',      label: T('mkt_auction')  },
    { id: 'subscription', label: T('mkt_sub')      },
  ]
  const referrals           = 2   // TODO: query from Supabase user_referrals
  const prevLots            = 1   // TODO: query from Supabase orders
  const mult                = getMultiplier(referrals, prevLots)
  const roleDiscount        = profile?.caua_role ? (1 - ROLE_CONFIG[profile.caua_role].discount) : 1
  const filtered            = filter === 'all' ? PRODUCTS : PRODUCTS.filter((p: Product) => p.type === filter)

  return (
    <div style={{ background: '#040C06', minHeight: '100vh', paddingTop: 'calc(var(--nav-h, 60px) + 12px)' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: 'clamp(20px,5vw,40px) var(--space-page) clamp(40px,8vw,80px)' }}>

        {/* Hero header — game-style */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 8, color: BRAND.heroic,
            letterSpacing: '0.2em', marginBottom: 12,
          }}>
            ◈ MERCADO CAÚA · POWERED BY $CACAO
          </div>
          <h2 style={{
            fontFamily: "'Barlow Condensed', Impact, sans-serif", fontWeight: 900,
            fontSize: 'clamp(52px, 12vw, 80px)', color: BRAND.heirloom,
            textTransform: 'uppercase', margin: '0 0 6px', lineHeight: 0.9,
          }}>
            MERCADO <span style={{ color: BRAND.mazorca }}>CAÚA</span>
          </h2>
          <p style={{
            fontFamily: FONTS.body, color: `${BRAND.heirloom}66`,
            fontSize: 13, margin: '8px auto 0', lineHeight: 1.6, maxWidth: 480,
          }}>
            {lang === 'es'
              ? 'Quema $CACAO. Obtén productos reales. El ciclo completo on-chain.'
              : 'Burn $CACAO. Get real products. The complete on-chain cycle.'}
          </p>
        </div>

        {/* Todo Caúa tokenizado — bloque narrativo $CACAO on-chain */}
        <div style={{
          background: '#132B1C',
          border: `1px solid #00A3CD33`,
          borderRadius: 8, padding: '18px 20px', marginBottom: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
        }}>
          <div>
            <div style={{
              fontFamily: "'Press Start 2P', monospace", fontSize: 7,
              color: '#00A3CD', letterSpacing: '0.16em', marginBottom: 8,
            }}>
              ◈ TODO CAÚA ESTÁ TOKENIZADO
            </div>
            <div style={{ fontFamily: FONTS.body, fontSize: 12, color: '#F7F1EE88', lineHeight: 1.5 }}>
              Cada árbol · cada cosecha · cada NIBS → $CACAO on Base
            </div>
          </div>
          <button onClick={() => navigate('/lab')} style={{
            background: '#00A3CD22', border: '1px solid #00A3CD55',
            borderRadius: 0, padding: '8px 14px', cursor: 'pointer',
            fontFamily: "'Press Start 2P', monospace", fontSize: 6,
            color: '#00A3CD', letterSpacing: '0.1em', flexShrink: 0,
          }}>FORJAR →</button>
        </div>

        {/* Multiplier badge */}
        {user && (
          <div style={{
            background: `linear-gradient(135deg, ${BRAND.mazorca}22, ${BRAND.theobroma}11)`,
            border: `1px solid ${BRAND.mazorca}44`, borderRadius: 12,
            padding: '16px 20px', marginBottom: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
          }}>
            <div>
              <div style={{ fontFamily: FONTS.display, fontWeight: 700, color: BRAND.mazorca, fontSize: 12, letterSpacing: '0.1em' }}>
                {T('mkt_mult_label')}
              </div>
              <div style={{ fontFamily: FONTS.body, color: `${BRAND.heirloom}88`, fontSize: 11, marginTop: 2 }}>
                {referrals} {lang === 'es' ? 'referidos' : 'referrals'} + {prevLots} {lang === 'es' ? 'lotes previos' : 'previous lots'}
              </div>
            </div>
            <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 32, color: BRAND.mazorca }}>
              {mult.toFixed(1)}x
            </div>
          </div>
        )}

        {/* EARN $CACAO pipeline */}
        <div style={{
          background: BRAND.bgCard, border: `1px solid ${BRAND.amazon}44`,
          borderRadius: 8, padding: 'clamp(14px, 3vw, 20px)',
          marginBottom: 24,
        }}>
          <div style={{
            fontFamily: "'Press Start 2P', monospace", fontSize: 6,
            color: `${BRAND.heirloom}44`, letterSpacing: '0.16em',
            textTransform: 'uppercase', textAlign: 'center', marginBottom: 14,
          }}>
            — CÓMO OBTENER $CACAO —
          </div>
          <div style={{
            display: 'flex', alignItems: 'stretch', gap: 4,
            justifyContent: 'center',
          }}>
            {[
              { icon: '🌱', label: 'ADOPTAR', sub: 'árbol', color: BRAND.pod },
              { icon: '→', label: '', sub: '', color: `${BRAND.heirloom}22` },
              { icon: '🌽', label: 'MAZORCAS', sub: 'ganar', color: BRAND.mazorca },
              { icon: '→', label: '', sub: '', color: `${BRAND.heirloom}22` },
              { icon: '◈', label: '$CACAO', sub: 'quemar', color: BRAND.heroic, cta: true },
              { icon: '→', label: '', sub: '', color: `${BRAND.heirloom}22` },
              { icon: '🛒', label: 'COMPRAR', sub: 'aquí', color: BRAND.criollo },
            ].map((n, i) => n.label === '' ? (
              <div key={i} style={{ display: 'flex', alignItems: 'center', color: `${BRAND.heirloom}22`, fontFamily: "'Press Start 2P', monospace", fontSize: 8 }}>→</div>
            ) : (
              <div key={i} style={{
                flex: 1, textAlign: 'center', padding: '10px 4px',
                background: `${n.color}11`, border: `1px solid ${n.color}44`,
                borderRadius: 4,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              }}>
                <div style={{ fontSize: 18 }}>{n.icon}</div>
                <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 5, color: n.color, letterSpacing: '0.08em', lineHeight: 1.4 }}>
                  {n.label}
                </div>
                {n.cta && (
                  <button
                    onClick={() => navigate('/burn')}
                    style={{
                      background: BRAND.heroic, border: 'none', borderRadius: 2,
                      padding: '3px 6px', cursor: 'pointer',
                      fontFamily: "'Press Start 2P', monospace", fontSize: 4,
                      color: BRAND.bgDeep, letterSpacing: '0.06em', marginTop: 2,
                    }}
                  >
                    BURN →
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Filters — pixel style */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24, overflowX: 'auto', scrollbarWidth: 'none', flexWrap: 'nowrap', paddingBottom: 4 }}>
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{
              background: filter === f.id ? `${BRAND.pod}22` : 'transparent',
              border: `2px solid ${filter === f.id ? BRAND.pod : BRAND.amazon + '44'}`,
              color: filter === f.id ? BRAND.pod : `${BRAND.heirloom}55`,
              padding: '7px 12px', borderRadius: 0, cursor: 'pointer',
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 7, letterSpacing: '0.08em',
              boxShadow: filter === f.id ? `0 0 8px ${BRAND.pod}33` : 'none',
            }}>{f.label}</button>
          ))}
        </div>

        {/* Product grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: 16 }}>
          {filtered.map(p => (
            <ProductCard key={p.id} product={p} multiplier={mult} user={user} roleDiscount={roleDiscount} />
          ))}
        </div>

        {/* Crowdfunding bar — pixel style */}
        <div style={{
          marginTop: 40, background: '#132B1C', border: `2px solid ${BRAND.amazon}66`,
          borderRadius: 0, padding: 'clamp(16px, 3vw, 24px)',
          boxShadow: `inset 0 0 20px ${BRAND.bgDeep}88`,
        }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 8, color: BRAND.pod, letterSpacing: '0.12em', marginBottom: 4,
            }}>
              CROWDFUNDING · RONDA SEMILLA
            </div>
            <div style={{ fontFamily: FONTS.body, color: `${BRAND.heirloom}55`, fontSize: 10, marginTop: 2 }}>
              Transparencia total — cada compra impulsa el desarrollo rural
            </div>
          </div>
          {/* Block progress bar */}
          <div style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 9, color: BRAND.pod, letterSpacing: '0.02em', marginBottom: 6,
          }}>
            {'■'.repeat(2)}{'□'.repeat(8)}
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: `${BRAND.heirloom}55`,
            marginBottom: 14,
          }}>
            <span>$17,250 USD</span>
            <span style={{ color: BRAND.pod }}>23%</span>
            <span>META: $75,000</span>
          </div>
          <button
            onClick={() => {}} // TODO: open InvestModal
            style={{
              width: '100%', padding: '14px',
              background: `linear-gradient(135deg, ${BRAND.heroic}, ${BRAND.amazon})`,
              border: 'none', borderRadius: 0, cursor: 'pointer',
              fontFamily: "'Press Start 2P', monospace", fontSize: 8,
              color: BRAND.heirloom, letterSpacing: '0.1em',
              boxShadow: `0 0 20px ${BRAND.heroic}33`,
            }}
          >
            ◈ INVERTIR CON $CACAO →
          </button>
        </div>
        <style>{`
          @keyframes hud-pulse-mkt {
            0%, 100% { box-shadow: 0 0 8px ${BRAND.heroic}33; }
            50%       { box-shadow: 0 0 20px ${BRAND.heroic}66; }
          }
        `}</style>
      </div>
    </div>
  )
}
