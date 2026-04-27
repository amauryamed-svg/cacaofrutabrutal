import { useEffect, useState } from 'react'
import { BRAND, FONTS } from '../../utils/constants'
import { useAuth } from '../../context/AuthContext'
import { useTokenBalance } from '../../hooks/useTokenBalance'
import { supabase } from '../../lib/supabase'

const TREE_TIER_PCT: Record<number, number> = { 0: 0, 1: 5, 2: 10, 3: 15 }
const TREE_TIER_CAP_PCT = 20
const MAZORCA_TO_PCT = 1
const MAZORCA_REDEEM_CAP_PCT = 10
const TOTAL_DISCOUNT_CAP = 30
const PRICE_USD = 33

function calcTreeDiscount(n: number): number {
  if (n <= 0) return 0
  if (n >= 4) return TREE_TIER_CAP_PCT
  return TREE_TIER_PCT[n] ?? 0
}

export default function CacaoCeremonyCard() {
  const { user, userId } = useAuth()
  const { mazorcas } = useTokenBalance()
  const [treeCount, setTreeCount] = useState(0)
  const [mazorcasToRedeem, setMazorcasToRedeem] = useState(0)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) { setTreeCount(0); return }
    supabase
      .from('cacao_trees')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .then(({ count }) => setTreeCount(count ?? 0))
  }, [userId])

  const treeDiscountPct = calcTreeDiscount(treeCount)
  const maxRedeemable = Math.min(MAZORCA_REDEEM_CAP_PCT, Math.floor(mazorcas))
  const mazorcaDiscountPct = Math.min(mazorcasToRedeem * MAZORCA_TO_PCT, MAZORCA_REDEEM_CAP_PCT)
  const totalPct = Math.min(treeDiscountPct + mazorcaDiscountPct, TOTAL_DISCOUNT_CAP)
  const finalPrice = (PRICE_USD * (1 - totalPct / 100)).toFixed(2)

  const eligible = totalPct > 0

  async function handleRedeem() {
    if (!user) return
    setLoading(true)
    setErr(null)
    try {
      const { data, error } = await supabase.functions.invoke('create-shopify-discount', {
        body: { mazorcas_to_redeem: mazorcasToRedeem },
      })
      if (error) throw new Error(error.message ?? 'Edge function error')
      if (!data?.checkout_url) throw new Error('No checkout URL returned')
      if (typeof window !== 'undefined' && (window as unknown as { hsq?: unknown[] }).hsq) {
        ((window as unknown as { hsq: unknown[] }).hsq).push(['trackEvent', { id: 'cacao_ceremony_traffic_sent', value: data.discount_pct }])
      }
      window.open(data.checkout_url, '_blank', 'noopener,noreferrer')
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div id="cacao-ceremony" style={cardStyle}>
        <Eyebrow />
        <Title />
        <p style={subtitleStyle}>Inicia sesión y adopta tu primer árbol para desbloquear descuentos en Cacao Ceremony de Cauaculture.</p>
        <a href="/app/adoptar" style={ctaSecondaryStyle}>Adoptar árbol →</a>
      </div>
    )
  }

  return (
    <div id="cacao-ceremony" style={cardStyle}>
      <Eyebrow />
      <Title />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, margin: '20px 0 16px' }}>
        <Stat label="Árboles adoptados" value={String(treeCount)} accent={BRAND.amazon} />
        <Stat label="Mazorcas disponibles" value={String(Math.floor(mazorcas))} accent={BRAND.mazorca} />
        <Stat label="Descuento por árboles" value={`${treeDiscountPct}%`} accent={treeDiscountPct ? BRAND.pod : `${BRAND.heirloom}55`} />
      </div>

      {maxRedeemable > 0 && (
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>
            Canjear mazorcas (1 = 1% off, máx {MAZORCA_REDEEM_CAP_PCT})
          </label>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
            <input
              type="range"
              min={0}
              max={maxRedeemable}
              value={mazorcasToRedeem}
              onChange={(e) => setMazorcasToRedeem(parseInt(e.target.value, 10))}
              style={{ flex: 1, accentColor: BRAND.mazorca }}
            />
            <div style={{ minWidth: 70, textAlign: 'right', fontFamily: FONTS.display, fontWeight: 700, color: BRAND.mazorca }}>
              {mazorcasToRedeem} → +{mazorcaDiscountPct}%
            </div>
          </div>
        </div>
      )}

      <div style={priceBoxStyle}>
        <div>
          <div style={{ fontFamily: FONTS.body, color: `${BRAND.heirloom}66`, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Precio final
          </div>
          <div style={{ fontFamily: FONTS.display, fontWeight: 900, color: BRAND.heirloom, fontSize: 36, lineHeight: 1 }}>
            ${finalPrice}
          </div>
          {totalPct > 0 && (
            <div style={{ fontFamily: FONTS.body, color: `${BRAND.heirloom}55`, fontSize: 12, textDecoration: 'line-through', marginTop: 4 }}>
              ${PRICE_USD.toFixed(2)} USD
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: FONTS.body, color: `${BRAND.heirloom}66`, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Tu descuento
          </div>
          <div style={{ fontFamily: FONTS.display, fontWeight: 900, color: totalPct > 0 ? BRAND.pod : `${BRAND.heirloom}33`, fontSize: 36, lineHeight: 1 }}>
            {totalPct}%
          </div>
        </div>
      </div>

      {err && (
        <div style={{ background: '#FF5A5A11', border: '1px solid #FF5A5A55', borderRadius: 8, padding: 12, marginTop: 12, color: '#FF8A8A', fontFamily: FONTS.body, fontSize: 12 }}>
          {err}
        </div>
      )}

      <button
        onClick={handleRedeem}
        disabled={!eligible || loading}
        style={eligible && !loading ? ctaPrimaryStyle : ctaDisabledStyle}
      >
        {loading
          ? 'Generando código…'
          : eligible
            ? `Reclamar ${totalPct}% → Cacao Ceremony`
            : 'Adopta un árbol para desbloquear'}
      </button>

      <p style={{ fontFamily: FONTS.body, color: `${BRAND.heirloom}44`, fontSize: 10, marginTop: 12, textAlign: 'center' }}>
        Cauaculture.co · 250g cacao ceremonial Criollo · envío incluido
      </p>
    </div>
  )
}

function Eyebrow() {
  return (
    <p style={{
      fontFamily: FONTS.serif, fontStyle: 'italic',
      color: BRAND.mazorca, fontSize: 11, letterSpacing: '0.25em', margin: 0,
    }}>BENEFICIO ADOPTANTE</p>
  )
}

function Title() {
  return (
    <h3 style={{
      fontFamily: "'Barlow Condensed', Impact, sans-serif", fontWeight: 900,
      fontSize: 'clamp(24px, 4vw, 32px)', color: BRAND.heirloom,
      textTransform: 'uppercase', margin: '4px 0 0', lineHeight: 1,
    }}>Cacao Ceremony · Cauaculture</h3>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div style={{ background: '#0E1A12', border: `1px solid ${BRAND.amazon}44`, borderRadius: 10, padding: 12 }}>
      <div style={{ fontFamily: FONTS.body, color: `${BRAND.heirloom}66`, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ fontFamily: FONTS.display, fontWeight: 900, color: accent, fontSize: 22, marginTop: 4 }}>
        {value}
      </div>
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  marginTop: 40,
  background: 'linear-gradient(135deg, #132B1C 0%, #0A1810 100%)',
  border: `1px solid ${BRAND.mazorca}55`,
  borderRadius: 12,
  padding: 24,
}

const subtitleStyle: React.CSSProperties = {
  fontFamily: FONTS.body, color: `${BRAND.heirloom}88`,
  fontSize: 13, lineHeight: 1.6, margin: '12px 0 16px', maxWidth: 540,
}

const labelStyle: React.CSSProperties = {
  fontFamily: FONTS.body, color: `${BRAND.heirloom}88`,
  fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
}

const priceBoxStyle: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
  background: '#040C06', border: `1px solid ${BRAND.amazon}66`,
  borderRadius: 10, padding: 16, margin: '8px 0 16px',
}

const ctaPrimaryStyle: React.CSSProperties = {
  width: '100%', padding: '14px 20px',
  background: BRAND.mazorca, color: '#040C06',
  border: 'none', borderRadius: 8, cursor: 'pointer',
  fontFamily: FONTS.display, fontWeight: 900, fontSize: 13,
  letterSpacing: '0.12em', textTransform: 'uppercase',
}

const ctaDisabledStyle: React.CSSProperties = {
  ...ctaPrimaryStyle,
  background: `${BRAND.amazon}44`, color: `${BRAND.heirloom}66`,
  cursor: 'not-allowed',
}

const ctaSecondaryStyle: React.CSSProperties = {
  display: 'inline-block', marginTop: 12, padding: '10px 16px',
  background: 'transparent', color: BRAND.mazorca,
  border: `1px solid ${BRAND.mazorca}88`, borderRadius: 8,
  fontFamily: FONTS.display, fontWeight: 700, fontSize: 12,
  letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none',
}
