// src/pages/CheckoutDrop.tsx
//
// Caua Cacao Drop · Cohorte 01 · Lote 2025 — Checkout page.
// Route: /checkout/drop?sku=mucilago|bean
//
// Flow:
//   /drop  → user clicks "Reservar mi Drop →" → navigate('/checkout/drop?sku=X')
//   /checkout/drop → user fills shipping form → click "Pagar con Stripe COP"
//   → invoke create-drop-checkout-session → redirect to Stripe Checkout
//   → on success: Stripe redirects to /drop/success?id={CHECKOUT_SESSION_ID}
//   → on cancel:  Stripe redirects to /drop
//
// Brand canon: VISUAL_KEY_VALUES.md — Luxury Botanical Brutalism.
//   - Background hex literal (NUNCA CSS vars) — CauaCore §8
//   - Display: Barlow Condensed 900 uppercase
//   - Serif italic for eyebrow accents
//   - Lexicon: "Functional Cacao", "Sacred", "Activación" — NUNCA "chocolate"
//
// Spec: ~/Documents/Caua/integrations/social/specs/CAUA-CACAO-DROP.md §4-§5
// Schema: supabase/migrations/044_caua_creyentes_funnel.sql (drop_purchases)

import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { BRAND, FONTS } from '../utils/constants'
import { supabase } from '../lib/supabase'
import { createDropCheckoutSession, type DropShippingInfo } from '../lib/stripe-drop'
import {
  createDropCoinbaseCharge,
  type DropShippingInfoInternational,
} from '../lib/coinbase-drop'
import type { DropSku } from '../hooks/useDropAvailability'

// Rail de pago — agregado por SA-07 Dev Spec-Driven (Coinbase Commerce slice).
// 'stripe_cop'   → Colombia COP doméstico (rail original del agent Stripe).
// 'coinbase_usdc'→ Internacional USDC (charge hosted, NO custodia user wallet).
// Charter §I.3 compliance: el toggle es solo UI; ambos rails delegan firma a
// gateway externo, ningún private key vive en este componente.
type PayRail = 'stripe_cop' | 'coinbase_usdc'

// ─── Pricing canónico (alineado con spec §1 y Drop.tsx) ────────────────────
// Edge Function re-valida server-side. Estos valores son SOLO para UI display.
interface SkuMeta {
  id:        DropSku
  eyebrow:   string
  title:     string
  grams:     string
  copy:      string
  amountCop: number       // numeric(12,2) en drop_purchases
  priceCop:  string       // display formateado
  priceUsd:  string
  image:     string
  accent:    string       // hex literal, no CSS var
  ctaGrad:   string       // segundo stop del gradiente CTA
}

const SKU_META: Record<DropSku, SkuMeta> = {
  mucilago: {
    id:        'mucilago',
    eyebrow:   'SKU A · Cristales rosados',
    title:     'Mucílago Liofilizado',
    grams:     '30g',
    copy:      'Cristales rosados que la fermentación libera. Bioflavonoids + electrolitos vivos. 1 cucharadita activa tu mañana.',
    amountCop: 130000,
    priceCop:  '$130.000 COP',
    priceUsd:  '$99 USD',
    image:     '/uploads/mucilago-liofilizado.jpg',
    accent:    BRAND.criollo,    // #8D2679
    ctaGrad:   '#8D2679',
  },
  bean: {
    id:        'bean',
    eyebrow:   'SKU B · Bean Criollo Élite',
    title:     'Bean Liofilizado',
    grams:     '50g',
    copy:      'Bean Criollo Élite Pentámera, fermentado 6 días, liofilizado al vacío. Theobromine + magnesio + bioflavonoids enteros.',
    amountCop: 150000,
    priceCop:  '$150.000 COP',
    priceUsd:  '$129 USD',
    image:     '/uploads/bean-liofilizado.jpg',
    accent:    BRAND.mazorca,    // #F1A91E
    ctaGrad:   '#DB5527',
  },
}


// Países comunes para envío internacional (rail USDC). 'OTHER' abre input ISO-2
// libre. Colombia EXCLUIDA — los CO debe pagar Stripe COP (geo-coherencia).
const INTL_COUNTRIES: Array<{ code: string; name: string }> = [
  { code: 'US',    name: 'United States' },
  { code: 'MX',    name: 'México' },
  { code: 'ES',    name: 'España' },
  { code: 'AR',    name: 'Argentina' },
  { code: 'CL',    name: 'Chile' },
  { code: 'PE',    name: 'Perú' },
  { code: 'EC',    name: 'Ecuador' },
  { code: 'BR',    name: 'Brasil' },
  { code: 'CA',    name: 'Canada' },
  { code: 'GB',    name: 'United Kingdom' },
  { code: 'DE',    name: 'Germany' },
  { code: 'FR',    name: 'France' },
  { code: 'IT',    name: 'Italy' },
  { code: 'NL',    name: 'Netherlands' },
  { code: 'PT',    name: 'Portugal' },
  { code: 'AU',    name: 'Australia' },
  { code: 'JP',    name: 'Japan' },
  { code: 'SG',    name: 'Singapore' },
  { code: 'OTHER', name: 'Other (write ISO-2 below)' },
]

// 32 departamentos Colombia — orden alfabético, hardcoded para no depender
// de fetch externo. Edge Function NO valida este enum (free-text), pero el
// dropdown protege calidad de data en el 95% de casos felices.
const COLOMBIA_DEPARTAMENTOS = [
  'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bogotá D.C.', 'Bolívar',
  'Boyacá', 'Caldas', 'Caquetá', 'Casanare', 'Cauca', 'Cesar', 'Chocó',
  'Córdoba', 'Cundinamarca', 'Guainía', 'Guaviare', 'Huila', 'La Guajira',
  'Magdalena', 'Meta', 'Nariño', 'Norte de Santander', 'Putumayo', 'Quindío',
  'Risaralda', 'San Andrés y Providencia', 'Santander', 'Sucre', 'Tolima',
  'Valle del Cauca', 'Vaupés', 'Vichada',
]

export default function CheckoutDrop() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const skuParam = (params.get('sku') ?? '') as DropSku

  // ─── SKU validation guard ────────────────────────────────────────────────
  // Si el param es inválido, redirigimos a /drop. NUNCA mostramos pantalla
  // rota al usuario — el navigate corre en useEffect para evitar warning
  // "Cannot update state during render".
  const sku: DropSku | null = useMemo(() => {
    if (skuParam === 'mucilago' || skuParam === 'bean') return skuParam
    return null
  }, [skuParam])

  useEffect(() => {
    if (!sku) navigate('/drop', { replace: true })
  }, [sku, navigate])

  // ─── Auth state — AuthGate ya garantiza user logged in ──────────────────
  // Pero leemos session para pre-poblar email del form (UX nicety).
  const [userEmail, setUserEmail] = useState<string>('')
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setUserEmail(user.email)
    })
  }, [])

  // ─── Pay rail toggle state ──────────────────────────────────────────────
  // Default 'stripe_cop' porque la mayoría del tráfico orgánico viene de los
  // emails D21 lifecycle (audiencia colombiana). Internacional opta-in via UI.
  const [rail, setRail] = useState<PayRail>('stripe_cop')

  // ─── Shipping form state — Stripe COP rail (rail original) ─────────────
  const [shipping, setShipping] = useState<DropShippingInfo>({
    full_name:  '',
    email:      '',
    phone:      '',
    address:    '',
    city:       '',
    department: '',
    notes:      '',
  })
  useEffect(() => {
    if (userEmail && !shipping.email) {
      setShipping(s => ({ ...s, email: userEmail }))
    }
  }, [userEmail, shipping.email])

  // ─── Shipping form state — Coinbase USDC rail (internacional) ──────────
  // Estructura distinta a `shipping` (CO): country ISO-2 + postal_code en vez
  // de "departamento". Mantenemos los 2 states separados para no perder data
  // si el user toggle-a entre rails durante checkout (UX defensiva).
  const [intlShipping, setIntlShipping] = useState<DropShippingInfoInternational>({
    full_name:         '',
    email:             '',
    phone:             '',
    address:           '',
    city:              '',
    state_or_province: '',
    postal_code:       '',
    country:           'US',
    notes:             '',
  })
  const [intlCountrySelect, setIntlCountrySelect] = useState<string>('US')
  useEffect(() => {
    if (userEmail && !intlShipping.email) {
      setIntlShipping(s => ({ ...s, email: userEmail }))
    }
  }, [userEmail, intlShipping.email])

  // Geo-coherence guard: si user selecciona 'OTHER' y escribe 'CO', resetea
  // a 'US' silenciosamente. La validación + Edge Function también bloquean,
  // pero esto evita confusión visual antes del submit.
  useEffect(() => {
    if (rail === 'coinbase_usdc' && intlShipping.country.toUpperCase() === 'CO') {
      setIntlShipping(s => ({ ...s, country: 'US' }))
      setIntlCountrySelect('US')
    }
  }, [rail, intlShipping.country])

  const [loading, setLoading] = useState(false)
  const [err, setErr]         = useState<string | null>(null)

  // ─── SEO ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const prev = document.title
    document.title = 'Checkout · Caua Cacao Drop · Cohorte 01'
    return () => { document.title = prev }
  }, [])

  if (!sku) return null  // useEffect arriba ya disparó el navigate
  const meta = SKU_META[sku]

  // ─── Validación por rail ────────────────────────────────────────────────
  // Stripe COP: full_name+email+phone+address+city+department mín. lengths.
  // Coinbase USDC: full_name+email+phone+address+city+country (ISO-2 != 'CO')
  // + postal_code. NO requiere state_or_province (algunos países no lo usan,
  // ej. Singapore, Monaco).
  const effectiveIntlCountry = (intlCountrySelect === 'OTHER'
    ? intlShipping.country.trim().toUpperCase()
    : intlCountrySelect)

  const isValid = rail === 'stripe_cop'
    ? (
        shipping.full_name.trim().length >= 3 &&
        /\S+@\S+\.\S+/.test(shipping.email) &&
        shipping.phone.trim().length      >= 7 &&
        shipping.address.trim().length    >= 5 &&
        shipping.city.trim().length       >= 2 &&
        shipping.department.length        >= 2
      )
    : (
        intlShipping.full_name.trim().length >= 3 &&
        /\S+@\S+\.\S+/.test(intlShipping.email) &&
        intlShipping.phone.trim().length    >= 5 &&
        intlShipping.address.trim().length  >= 5 &&
        intlShipping.city.trim().length     >= 2 &&
        intlShipping.postal_code.trim().length >= 2 &&
        effectiveIntlCountry.length === 2 &&
        effectiveIntlCountry !== 'CO'
      )

  const handlePay = async () => {
    if (!isValid || loading) return
    setLoading(true); setErr(null)
    try {
      if (rail === 'stripe_cop') {
        const { url } = await createDropCheckoutSession({
          sku,
          shipping_info: shipping,
        })
        // Hard redirect a Stripe Checkout — NO usar navigate (es URL externa).
        window.location.href = url
        return
      }

      // Coinbase USDC rail
      const { hosted_url } = await createDropCoinbaseCharge({
        sku,
        shipping_info_international: {
          ...intlShipping,
          country: effectiveIntlCountry,
        },
      })
      // Hard redirect a Coinbase Commerce hosted checkout.
      window.location.href = hosted_url
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Error desconocido')
      setLoading(false)
    }
  }

  // ─── Inline style helpers ───────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width:        '100%',
    padding:      '13px 14px',
    background:   '#040C06',
    border:       '1px solid #91A63B33',
    borderRadius: 10,
    color:        '#F7F1EE',
    fontFamily:   FONTS.body,
    fontSize:     14,
    outline:      'none',
    transition:   'border-color 0.2s',
  }
  const labelStyle: React.CSSProperties = {
    fontFamily:    FONTS.display,
    fontWeight:    700,
    fontSize:      10,
    color:         '#91A63B',
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    marginBottom:  6,
    display:       'block',
  }

  return (
    <div style={{
      background:  '#040C06',
      minHeight:   '100vh',
      paddingTop:  'calc(var(--nav-h, 60px) + 12px)',
      color:       '#F7F1EE',
    }}>
      {/* ─── Hero strip ─────────────────────────────────────────────────── */}
      <section style={{
        maxWidth: 1080,
        margin:   '0 auto',
        padding:  'clamp(28px, 5vw, 48px) var(--space-page) clamp(20px, 3vw, 32px)',
      }}>
        <button
          onClick={() => navigate('/drop')}
          style={{
            background:    'transparent',
            border:        'none',
            color:         '#91A63B',
            fontFamily:    FONTS.display,
            fontWeight:    700,
            fontSize:      11,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            cursor:        'pointer',
            padding:       '0 0 18px',
          }}
        >
          ← Volver al Drop
        </button>

        <p style={{
          fontFamily:    FONTS.serif, fontStyle: 'italic',
          color:         '#91A63B', fontSize: 13, letterSpacing: '0.28em',
          textTransform: 'uppercase', marginBottom: 10,
        }}>
          Reservar · Cohorte 01 · Lote 2025
        </p>

        <h1 style={{
          fontFamily:    FONTS.display, fontWeight: 900,
          fontSize:      'clamp(36px, 8vw, 64px)',
          color:         '#F7F1EE', textTransform: 'uppercase',
          lineHeight:    0.92, margin: '0 0 12px',
          letterSpacing: '-0.01em',
        }}>
          Activá tu <span style={{ color: '#F1A91E' }}>Drop</span>
        </h1>

        <p style={{
          fontFamily: FONTS.serif, fontStyle: 'italic',
          color:      '#F7F1EE', opacity: 0.82,
          fontSize:   'clamp(14px, 2.4vw, 17px)',
          maxWidth:   620, margin: 0, lineHeight: 1.5,
        }}>
          Functional Cacao Sacred · Upcycled · Alive. Confirmá los datos de envío y procedé al pago seguro con Stripe.
        </p>
      </section>

      {/* ─── 2-column grid: producto + form ──────────────────────────────── */}
      <section style={{
        maxWidth: 1080,
        margin:   '0 auto',
        padding:  '0 var(--space-page) clamp(48px, 6vw, 80px)',
        display:  'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
        gap:      'clamp(20px, 3vw, 36px)',
        alignItems: 'start',
      }}>
        {/* ─── Producto card (sticky en desktop) ─────────────────────── */}
        <aside style={{
          background:   '#0F2218',
          border:       `1.5px solid ${meta.accent}66`,
          borderRadius: 20,
          overflow:     'hidden',
          boxShadow:    `0 24px 60px ${meta.accent}22, inset 0 1px 0 #F7F1EE11`,
          position:     'sticky',
          top:          'calc(var(--nav-h, 60px) + 24px)',
        }}>
          <div style={{
            width:       '100%',
            aspectRatio: '4 / 3',
            background:  'linear-gradient(160deg, #1C3B26 0%, #040C06 100%)',
            position:    'relative',
            overflow:    'hidden',
          }}>
            <img
              src={meta.image}
              alt={`${meta.title} ${meta.grams}`}
              loading="lazy"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            <div style={{
              position:      'absolute', top: 14, left: 14,
              background:    '#040C06cc',
              border:        `1px solid ${meta.accent}`,
              borderRadius:  999,
              padding:       '6px 12px',
              fontFamily:    FONTS.display, fontWeight: 700, fontSize: 10,
              color:         meta.accent, letterSpacing: '0.18em',
              textTransform: 'uppercase',
              backdropFilter: 'blur(8px)',
            }}>
              {meta.eyebrow}
            </div>
          </div>

          <div style={{ padding: 'clamp(20px, 3vw, 28px)' }}>
            <h2 style={{
              fontFamily:    FONTS.display, fontWeight: 900,
              fontSize:      'clamp(24px, 4vw, 30px)',
              color:         '#F7F1EE', textTransform: 'uppercase',
              lineHeight:    1, margin: '0 0 6px',
              letterSpacing: '-0.005em',
            }}>
              {meta.title}
            </h2>
            <div style={{
              fontFamily:    FONTS.display, fontWeight: 700, fontSize: 12,
              color:         meta.accent, letterSpacing: '0.22em',
              textTransform: 'uppercase', marginBottom: 14,
            }}>
              {meta.grams} · Functional Cacao Sacred
            </div>

            <p style={{
              fontFamily: FONTS.body, fontSize: 13,
              color:      '#F7F1EE', opacity: 0.75,
              lineHeight: 1.55, margin: '0 0 18px',
            }}>
              {meta.copy}
            </p>

            <div style={{
              display:    'flex', alignItems: 'baseline', gap: 12,
              paddingTop: 14, borderTop: '1px solid #F7F1EE15',
            }}>
              <span style={{
                fontFamily:    FONTS.display, fontWeight: 900,
                fontSize:      'clamp(22px, 3.4vw, 26px)',
                color:         '#F7F1EE', letterSpacing: '-0.01em',
              }}>
                {meta.priceCop}
              </span>
              <span style={{
                fontFamily:    FONTS.display, fontWeight: 700, fontSize: 13,
                color:         meta.accent, letterSpacing: '0.08em',
              }}>
                · {meta.priceUsd}
              </span>
            </div>

            <p style={{
              fontFamily: FONTS.body, fontSize: 11,
              color:      '#F7F1EE', opacity: 0.5,
              marginTop:  14, letterSpacing: '0.04em', lineHeight: 1.5,
            }}>
              Envío Colombia 5-7 días hábiles · Reembolso garantizado si delay &gt; 14 días.
            </p>
          </div>
        </aside>

        {/* ─── Shipping form + CTA ──────────────────────────────────── */}
        <div style={{
          background:   '#0F2218',
          border:       '1px solid #91A63B33',
          borderRadius: 20,
          padding:      'clamp(22px, 3vw, 32px)',
        }}>
          <p style={{
            fontFamily:    FONTS.serif, fontStyle: 'italic',
            color:         '#91A63B', fontSize: 12, letterSpacing: '0.28em',
            textTransform: 'uppercase', margin: '0 0 8px',
          }}>
            {rail === 'stripe_cop' ? 'Envío Colombia' : 'International Shipping'}
          </p>
          <h3 style={{
            fontFamily:    FONTS.display, fontWeight: 900,
            fontSize:      'clamp(22px, 3.6vw, 28px)',
            color:         '#F7F1EE', textTransform: 'uppercase',
            margin:        '0 0 18px', letterSpacing: '-0.005em',
            lineHeight:    1,
          }}>
            {rail === 'stripe_cop' ? 'Datos de Activación' : 'Activation Details'}
          </h3>

          {/* ─── Rail toggle (Stripe COP ↔ Coinbase USDC) ─────────────── */}
          {/* Patrón segmented control. Brand canon: fondo botellero #040C06,
              accent activo amber (#F1A91E) — alta saturación señala "elegido".
              Sub-label declara audiencia esperada (Colombia / International). */}
          <div style={{
            display:             'grid',
            gridTemplateColumns: '1fr 1fr',
            gap:                 8,
            padding:             6,
            background:          '#040C06',
            border:              '1px solid #91A63B33',
            borderRadius:        12,
            marginBottom:        22,
          }}>
            {([
              { id: 'stripe_cop',    label: 'Pagar con Stripe COP', sub: 'Colombia' },
              { id: 'coinbase_usdc', label: 'Pay with Crypto USDC', sub: 'International' },
            ] as const).map(opt => {
              const active = rail === opt.id
              return (
                <button
                  key={opt.id}
                  onClick={() => { setRail(opt.id); setErr(null) }}
                  style={{
                    padding:       '12px 14px',
                    background:    active ? '#F1A91E' : 'transparent',
                    color:         active ? '#040C06' : '#F7F1EE',
                    border:        'none',
                    borderRadius:  8,
                    cursor:        'pointer',
                    fontFamily:    FONTS.display,
                    fontWeight:    800,
                    fontSize:      11,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    transition:    'background 0.2s, color 0.2s',
                    display:       'flex',
                    flexDirection: 'column',
                    gap:           3,
                    alignItems:    'flex-start',
                    textAlign:     'left',
                  }}
                >
                  <span>{opt.label}</span>
                  <span style={{
                    fontSize: 9, letterSpacing: '0.22em',
                    opacity:  active ? 0.7 : 0.5,
                  }}>
                    {opt.sub}
                  </span>
                </button>
              )
            })}
          </div>

          {/* ─── Form fields — switch por rail ──────────────────────── */}
          {rail === 'stripe_cop' ? (
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <label style={labelStyle}>Nombre completo *</label>
                <input
                  type="text"
                  value={shipping.full_name}
                  onChange={(e) => setShipping(s => ({ ...s, full_name: e.target.value }))}
                  placeholder="Como aparece en tu documento"
                  style={inputStyle}
                  autoComplete="name"
                />
              </div>

              <div>
                <label style={labelStyle}>Email *</label>
                <input
                  type="email"
                  value={shipping.email}
                  onChange={(e) => setShipping(s => ({ ...s, email: e.target.value }))}
                  placeholder="tu@correo.co"
                  style={inputStyle}
                  autoComplete="email"
                />
              </div>

              <div>
                <label style={labelStyle}>Teléfono *</label>
                <input
                  type="tel"
                  value={shipping.phone}
                  onChange={(e) => setShipping(s => ({ ...s, phone: e.target.value }))}
                  placeholder="+57 300 000 0000"
                  style={inputStyle}
                  autoComplete="tel"
                />
              </div>

              <div>
                <label style={labelStyle}>Dirección *</label>
                <input
                  type="text"
                  value={shipping.address}
                  onChange={(e) => setShipping(s => ({ ...s, address: e.target.value }))}
                  placeholder="Calle 123 #45-67 · Apto/Casa"
                  style={inputStyle}
                  autoComplete="street-address"
                />
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap:     12,
              }}>
                <div>
                  <label style={labelStyle}>Ciudad *</label>
                  <input
                    type="text"
                    value={shipping.city}
                    onChange={(e) => setShipping(s => ({ ...s, city: e.target.value }))}
                    placeholder="Bogotá"
                    style={inputStyle}
                    autoComplete="address-level2"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Departamento *</label>
                  <select
                    value={shipping.department}
                    onChange={(e) => setShipping(s => ({ ...s, department: e.target.value }))}
                    style={{ ...inputStyle, appearance: 'none', paddingRight: 14 }}
                  >
                    <option value="" style={{ background: '#040C06' }}>Selecciona…</option>
                    {COLOMBIA_DEPARTAMENTOS.map(d => (
                      <option key={d} value={d} style={{ background: '#040C06' }}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Notas (opcional)</label>
                <textarea
                  value={shipping.notes ?? ''}
                  onChange={(e) => setShipping(s => ({ ...s, notes: e.target.value }))}
                  placeholder="Referencia de entrega, horario, etc."
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
                />
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <label style={labelStyle}>Full name *</label>
                <input
                  type="text"
                  value={intlShipping.full_name}
                  onChange={(e) => setIntlShipping(s => ({ ...s, full_name: e.target.value }))}
                  placeholder="As shown on your ID"
                  style={inputStyle}
                  autoComplete="name"
                />
              </div>

              <div>
                <label style={labelStyle}>Email *</label>
                <input
                  type="email"
                  value={intlShipping.email}
                  onChange={(e) => setIntlShipping(s => ({ ...s, email: e.target.value }))}
                  placeholder="you@email.com"
                  style={inputStyle}
                  autoComplete="email"
                />
              </div>

              <div>
                <label style={labelStyle}>Phone *</label>
                <input
                  type="tel"
                  value={intlShipping.phone}
                  onChange={(e) => setIntlShipping(s => ({ ...s, phone: e.target.value }))}
                  placeholder="+1 555 000 0000"
                  style={inputStyle}
                  autoComplete="tel"
                />
              </div>

              <div>
                <label style={labelStyle}>Street address *</label>
                <input
                  type="text"
                  value={intlShipping.address}
                  onChange={(e) => setIntlShipping(s => ({ ...s, address: e.target.value }))}
                  placeholder="123 Main St · Apt 4B"
                  style={inputStyle}
                  autoComplete="street-address"
                />
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap:     12,
              }}>
                <div>
                  <label style={labelStyle}>Country *</label>
                  <select
                    value={intlCountrySelect}
                    onChange={(e) => {
                      const v = e.target.value
                      setIntlCountrySelect(v)
                      if (v !== 'OTHER') {
                        setIntlShipping(s => ({ ...s, country: v }))
                      } else {
                        setIntlShipping(s => ({ ...s, country: '' }))
                      }
                    }}
                    style={{ ...inputStyle, appearance: 'none', paddingRight: 14 }}
                    autoComplete="country"
                  >
                    {INTL_COUNTRIES.map(c => (
                      <option key={c.code} value={c.code} style={{ background: '#040C06' }}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>
                    {intlCountrySelect === 'OTHER' ? 'Country ISO-2 *' : 'State / Province'}
                  </label>
                  {intlCountrySelect === 'OTHER' ? (
                    <input
                      type="text"
                      value={intlShipping.country}
                      onChange={(e) => setIntlShipping(s => ({
                        ...s,
                        country: e.target.value.toUpperCase().slice(0, 2),
                      }))}
                      placeholder="e.g. NO, SE, IE"
                      style={inputStyle}
                      maxLength={2}
                    />
                  ) : (
                    <input
                      type="text"
                      value={intlShipping.state_or_province}
                      onChange={(e) => setIntlShipping(s => ({
                        ...s, state_or_province: e.target.value,
                      }))}
                      placeholder="CA / Madrid / NSW"
                      style={inputStyle}
                      autoComplete="address-level1"
                    />
                  )}
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap:     12,
              }}>
                <div>
                  <label style={labelStyle}>City *</label>
                  <input
                    type="text"
                    value={intlShipping.city}
                    onChange={(e) => setIntlShipping(s => ({ ...s, city: e.target.value }))}
                    placeholder="Austin"
                    style={inputStyle}
                    autoComplete="address-level2"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Postal / ZIP *</label>
                  <input
                    type="text"
                    value={intlShipping.postal_code}
                    onChange={(e) => setIntlShipping(s => ({ ...s, postal_code: e.target.value }))}
                    placeholder="78701"
                    style={inputStyle}
                    autoComplete="postal-code"
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Notes (optional)</label>
                <textarea
                  value={intlShipping.notes ?? ''}
                  onChange={(e) => setIntlShipping(s => ({ ...s, notes: e.target.value }))}
                  placeholder="Delivery instructions, gate code, etc."
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
                />
              </div>
            </div>
          )}

          {/* ─── Total + CTA ──────────────────────────────────────── */}
          <div style={{
            marginTop:    26,
            paddingTop:   22,
            borderTop:    '1px solid #F7F1EE15',
            display:      'flex',
            flexDirection: 'column',
            gap:          14,
          }}>
            <div style={{
              display:        'flex',
              justifyContent: 'space-between',
              alignItems:     'baseline',
            }}>
              <span style={{
                fontFamily:    FONTS.display, fontWeight: 700, fontSize: 12,
                color:         '#F7F1EE', opacity: 0.7,
                letterSpacing: '0.22em', textTransform: 'uppercase',
              }}>
                Total a pagar
              </span>
              <span style={{
                fontFamily:    FONTS.display, fontWeight: 900,
                fontSize:      'clamp(24px, 4vw, 30px)',
                color:         '#F7F1EE', letterSpacing: '-0.01em',
              }}>
                {meta.priceCop}
              </span>
            </div>

            {err && (
              <div style={{
                background:   '#8C201D22',
                border:       '1px solid #8C201D',
                borderRadius: 10,
                padding:      '12px 14px',
                fontFamily:   FONTS.body, fontSize: 13,
                color:        '#F7F1EE', lineHeight: 1.5,
              }}>
                {err}
              </div>
            )}

            <button
              onClick={handlePay}
              disabled={!isValid || loading}
              style={{
                width:       '100%',
                padding:     '16px 22px',
                background: (!isValid || loading)
                  ? '#1C3B2633'
                  : `linear-gradient(135deg, ${meta.accent}, ${meta.ctaGrad})`,
                color:       (!isValid || loading) ? '#F7F1EE55' : '#040C06',
                border:      'none',
                borderRadius: 999,
                cursor:      (!isValid || loading) ? 'not-allowed' : 'pointer',
                fontFamily:  FONTS.display, fontWeight: 800, fontSize: 13,
                letterSpacing: '0.18em', textTransform: 'uppercase',
                boxShadow:   (!isValid || loading) ? 'none' : `0 12px 28px ${meta.accent}55`,
                transition:  'transform 0.2s, box-shadow 0.2s',
              }}
            >
              {loading
                ? 'Procesando…'
                : !isValid
                  ? 'Completá los campos'
                  : `Pagar con Stripe · ${meta.priceCop}`}
            </button>

            <p style={{
              fontFamily: FONTS.body, fontSize: 11,
              color:      '#F7F1EE', opacity: 0.45,
              margin:     0, textAlign: 'center', lineHeight: 1.5,
              letterSpacing: '0.04em',
            }}>
              Pago seguro via Stripe · Tu tarjeta nunca toca nuestros servidores.<br />
              Al confirmar, aceptás el envío 5-7 días hábiles desde Bogotá.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
