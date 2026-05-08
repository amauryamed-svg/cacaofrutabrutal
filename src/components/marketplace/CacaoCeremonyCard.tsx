import { useState } from 'react'
import { BRAND, FONTS } from '../../utils/constants'
import { useAuth } from '../../context/AuthContext'

/**
 * CacaoCeremonyCard · CRM360 Camino A · Bono RedimeCacao10K
 *
 * Versión simplificada (2026-05-07): sin multiplicadores de árboles ni
 * mazorcas, sin Edge Function `create-shopify-discount`. El bono es fijo
 * en $10.000 COP de Gift Card (`RedimeCacao10K`) por adoptar — flow del
 * Camino A del CRM360 (sin fricción, audiencia casual adopter).
 *
 * Para el Camino B (4 hitos · GoldenTicket · Cacao Ceremony 100% gratis),
 * ver `MiLaboratorio.tsx` post-forge state que apunta a
 * https://cauacolombia.co/pages/goldenticket
 *
 * Phase 1: el código se vuelve único per user via Edge Function
 * `create-shopify-giftcard` (en lugar de hardcoded `RedimeCacao10K`).
 */

const REDEEM_CODE = 'RedimeCacao10K'
const REDEEM_AMOUNT_COP = 10000
// Shopify auto-discount URL: redirige al producto y aplica el bono al checkout sin
// que el usuario tenga que copiar el código. Pattern oficial: /discount/CODE?redirect=...
const REDEEM_URL = 'https://cauacolombia.co/discount/RedimeCacao10K?redirect=/products/cacao-ceremonial-250gr-origen-hobo-huila'

export default function CacaoCeremonyCard() {
  const { user } = useAuth()
  const [copied, setCopied] = useState(false)

  if (!user) {
    return (
      <div id="cacao-ceremony" style={cardStyle}>
        <Eyebrow />
        <Title />
        <p style={subtitleStyle}>
          Inicia sesión y adopta tu primer árbol para desbloquear tu bono de $10.000 COP en CAÚA Colombia.
        </p>
        <a href="/app/adoptar" style={ctaSecondaryStyle}>Adoptar árbol →</a>
      </div>
    )
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(REDEEM_CODE)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch { /* clipboard denied */ }
  }

  return (
    <div id="cacao-ceremony" style={cardStyle}>
      <Eyebrow />
      <Title />

      <p style={subtitleStyle}>
        Tu bono por adoptar: <strong style={{ color: BRAND.mazorca }}>${REDEEM_AMOUNT_COP.toLocaleString('es-CO')} COP</strong> de Gift Card. Tipea el código en el checkout de CAÚA Colombia.
      </p>

      <button
        type="button"
        onClick={handleCopy}
        style={codeBoxStyle}
        aria-label={`Copiar código ${REDEEM_CODE}`}
      >
        <span style={codeLabelStyle}>Código de Gift Card</span>
        <span style={codeValueStyle}>{REDEEM_CODE}</span>
        <span style={copyHintStyle}>{copied ? '✓ COPIADO' : '⧉ COPIAR'}</span>
      </button>

      <a
        href={REDEEM_URL}
        target="_blank"
        rel="noopener noreferrer"
        data-cta-name="cfb-marketplace-redime"
        data-cta-surface="marketplace-cacao-ceremony"
        data-cta-destination="cauacolombia-pdp"
        style={ctaPrimaryStyle}
      >
        Reclamar en CAÚA Colombia →
      </a>

      <p style={fineprintStyle}>
        cauacolombia.co · 250 g cacao ceremonial Híbrido Acriollado · 1 uso por cliente · vence en 30 días
      </p>

      {/* ─── Funnel hacia forja · CRM360 cross-link ───
          Después del bono Camino A, el siguiente paso lógico es el Lab
          (forja del chocolate) — primer hito del Camino B. Sin este link
          el user no encuentra el path al Workshop / Golden Ticket. */}
      <div style={funnelBoxStyle}>
        <span style={funnelEyebrowStyle}>↓ Siguiente paso</span>
        <p style={funnelLedeStyle}>
          ¿Tu árbol ya cosechó? <strong style={{ color: BRAND.pod }}>Forja tu chocolate</strong> en el Laboratorio. El Hito 4 del Camino del Creyente desbloquea un Cacao Ceremony 100% gratis (1 de 30 cupos).
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a href="/app/lab"
             data-cta-name="cfb-marketplace-funnel-lab"
             data-cta-surface="marketplace-cacao-ceremony"
             data-cta-destination="cfb-lab"
             style={funnelCtaPrimaryStyle}>
            🍫 Ir al Laboratorio
          </a>
          <a href="https://cauacolombia.co/pages/goldenticket"
             target="_blank"
             rel="noopener noreferrer"
             data-cta-name="cfb-marketplace-funnel-goldenticket"
             data-cta-surface="marketplace-cacao-ceremony"
             data-cta-destination="cauacolombia-goldenticket"
             style={funnelCtaSecondaryStyle}>
            Ver el Camino →
          </a>
        </div>
      </div>
    </div>
  )
}

function Eyebrow() {
  return (
    <p style={{
      fontFamily: FONTS.serif, fontStyle: 'italic',
      color: BRAND.mazorca, fontSize: 11, letterSpacing: '0.25em', margin: 0,
    }}>BONO ADOPTANTE · CAMINO A</p>
  )
}

function Title() {
  return (
    <h3 style={{
      fontFamily: "'Barlow Condensed', Impact, sans-serif", fontWeight: 900,
      fontSize: 'clamp(24px, 4vw, 32px)', color: BRAND.heirloom,
      textTransform: 'uppercase', margin: '4px 0 0', lineHeight: 1,
    }}>Gift Card $10.000 · Cauacolombia</h3>
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
  fontFamily: FONTS.body, color: `${BRAND.heirloom}cc`,
  fontSize: 13, lineHeight: 1.6, margin: '12px 0 18px', maxWidth: 540,
}

const codeBoxStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  gap: 14, width: '100%',
  background: '#040C06', border: `2px dashed ${BRAND.mazorca}aa`,
  borderRadius: 10, padding: '14px 18px', margin: '8px 0 16px',
  cursor: 'pointer', appearance: 'none',
  transition: 'border-color 160ms ease, background 160ms ease',
}

const codeLabelStyle: React.CSSProperties = {
  fontFamily: FONTS.body, color: `${BRAND.heirloom}66`,
  fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase',
}

const codeValueStyle: React.CSSProperties = {
  fontFamily: 'ui-monospace, monospace', fontWeight: 800,
  color: BRAND.heirloom, fontSize: 'clamp(18px, 2.5vw, 22px)',
  letterSpacing: '0.12em', flex: 1, textAlign: 'left',
}

const copyHintStyle: React.CSSProperties = {
  fontFamily: FONTS.body, color: BRAND.mazorca,
  fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase',
  border: `1px solid ${BRAND.mazorca}66`, padding: '4px 10px', borderRadius: 4,
}

const ctaPrimaryStyle: React.CSSProperties = {
  display: 'block', width: '100%', padding: '14px 20px',
  background: BRAND.mazorca, color: '#040C06',
  border: 'none', borderRadius: 8, cursor: 'pointer',
  fontFamily: FONTS.display, fontWeight: 900, fontSize: 13,
  letterSpacing: '0.12em', textTransform: 'uppercase',
  textDecoration: 'none', textAlign: 'center',
  boxSizing: 'border-box',
}

const ctaSecondaryStyle: React.CSSProperties = {
  display: 'inline-block', marginTop: 12, padding: '10px 16px',
  background: 'transparent', color: BRAND.mazorca,
  border: `1px solid ${BRAND.mazorca}88`, borderRadius: 8,
  fontFamily: FONTS.display, fontWeight: 700, fontSize: 12,
  letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none',
}

const fineprintStyle: React.CSSProperties = {
  fontFamily: FONTS.body, color: `${BRAND.heirloom}55`,
  fontSize: 10, marginTop: 14, textAlign: 'center', letterSpacing: '0.04em',
}

const funnelBoxStyle: React.CSSProperties = {
  marginTop: 20, paddingTop: 18,
  borderTop: `1px dashed ${BRAND.mazorca}55`,
  display: 'flex', flexDirection: 'column', gap: 10,
}

const funnelEyebrowStyle: React.CSSProperties = {
  fontFamily: FONTS.body, color: BRAND.mazorca,
  fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase',
  fontWeight: 700,
}

const funnelLedeStyle: React.CSSProperties = {
  fontFamily: FONTS.body, color: `${BRAND.heirloom}cc`,
  fontSize: 12, lineHeight: 1.5, margin: 0,
}

const funnelCtaPrimaryStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '10px 16px',
  background: BRAND.pod, color: BRAND.bgDeep,
  fontFamily: FONTS.display, fontWeight: 800, fontSize: 11,
  letterSpacing: '0.14em', textTransform: 'uppercase',
  borderRadius: 999, textDecoration: 'none',
}

const funnelCtaSecondaryStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '10px 16px',
  background: 'transparent', color: BRAND.mazorca,
  border: `1px solid ${BRAND.mazorca}88`,
  fontFamily: FONTS.display, fontWeight: 700, fontSize: 11,
  letterSpacing: '0.14em', textTransform: 'uppercase',
  borderRadius: 999, textDecoration: 'none',
}
