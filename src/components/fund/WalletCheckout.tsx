import { useState } from 'react'
import { motion } from 'framer-motion'
import { BRAND, FONTS, INVESTOR_WALLETS } from '../../utils/constants'
import { supabase } from '../../lib/supabase'
import { hsTrackEvent } from '../../lib/hubspotTracking'

/**
 * 3-phase ETH wallet checkout — usado tanto por InvestorPath (5K equity / B2B sponsorship)
 * como por InvestModal (lot/MVP investment con payment_method='wallet_eth_direct').
 * Phases: transfer → verify → success ("Allocación Asegurada · 24h").
 */

export type WalletCheckoutKind = 'equity_5k' | 'b2b_sponsorship'

export interface WalletCheckoutContext {
  tech_id?:    string
  mvp_id?:     string | null
  lots_count?: number
  currency?:   string
}

interface Props {
  /** Monto solicitado en USD (mostrado al investor + grabado en investor_charges). */
  amount_usd: number
  /** Discriminator de paquete — afecta validación de monto en el Edge Function. */
  kind: WalletCheckoutKind
  /** Metadata extra (tech_id, mvp_id, lots_count) si viene del per-tech InvestModal. */
  context?: WalletCheckoutContext
  lang: 'es' | 'en'
  /** Llamado al cerrar el flujo (success O cancel). */
  onClose: () => void
}

type Phase = 'transfer' | 'verify' | 'submitting' | 'success'
type WalletOwner = keyof typeof INVESTOR_WALLETS

const ETHERSCAN = 'https://etherscan.io/tx/'

export default function WalletCheckout({ amount_usd, kind, context, lang, onClose }: Props) {
  const [phase,        setPhase]        = useState<Phase>('transfer')
  const [walletOwner,  setWalletOwner]  = useState<WalletOwner>('cto')
  const [copied,       setCopied]       = useState(false)
  const [txHash,       setTxHash]       = useState('')
  const [amountSent,   setAmountSent]   = useState<string>(String(amount_usd))
  const [resultId,     setResultId]     = useState<string | null>(null)
  const [etherscanUrl, setEtherscanUrl] = useState<string | null>(null)
  const [err,          setErr]          = useState<string | null>(null)

  const T = (es: string, en: string) => (lang === 'es' ? es : en)

  const copyAddress = async (addr: string) => {
    try {
      await navigator.clipboard.writeText(addr)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch { /* clipboard blocked — manual select still works */ }
  }

  const submit = async () => {
    setErr(null); setPhase('submitting')
    try {
      const { data, error } = await supabase.functions.invoke('record-investor-transfer', {
        body: {
          kind,
          destination:     walletOwner,
          amount_usd,
          amount_sent_usd: Number(amountSent),
          tx_hash:         txHash.trim(),
          network:         'ethereum',
          asset:           'ETH',
          context:         context ?? {},
        },
      })
      if (error || !data?.id) throw new Error(error?.message ?? 'Error registering transfer')
      hsTrackEvent('investor_transfer_recorded', {
        kind,
        amount_usd,
        amount_sent_usd: Number(amountSent),
        method: 'wallet_eth_direct',
        ...(context?.tech_id   ? { tech_id:    context.tech_id }    : {}),
        ...(context?.lots_count ? { lots_count: context.lots_count } : {}),
      })
      setResultId(data.id)
      setEtherscanUrl(data.etherscan_url ?? `${ETHERSCAN}${txHash.trim()}`)
      setPhase('success')
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error')
      setPhase('verify')
    }
  }

  // Render: simple conditional sin AnimatePresence (evita nested-AnimatePresence
  // con el que envuelve InvestorPath/InvestModal — causaba que el contenido no se montara).
  return (
    <div>

      {/* PHASE 1 — Transfer (show address) */}
      {phase === 'transfer' && (
        <motion.div key="transfer" {...phaseMotion} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Amount summary */}
          <div style={summaryBoxStyle}>
            <div>
              <div style={labelStyle}>{T('MONTO A TRANSFERIR', 'AMOUNT TO TRANSFER')}</div>
              <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 28, color: BRAND.pod, lineHeight: 1 }}>
                ${amount_usd.toLocaleString('en-US')} <span style={{ fontSize: 13, color: `${BRAND.heirloom}88` }}>USD</span>
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 11, color: `${BRAND.heirloom}88` }}>
              {T('en', 'in')} <strong style={{ color: BRAND.heirloom }}>ETH</strong><br />
              <span style={{ fontSize: 9 }}>Ethereum mainnet</span>
            </div>
          </div>

          {/* Critical warning */}
          <div style={warningStyle}>
            <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 11, letterSpacing: '0.15em', color: BRAND.radioRed, marginBottom: 6 }}>
              ⚠️ {T('LEE ANTES DE TRANSFERIR', 'READ BEFORE TRANSFERRING')}
            </div>
            <p style={{ fontFamily: FONTS.body, fontSize: 11, color: BRAND.heirloom, lineHeight: 1.55, margin: 0 }}>
              {T(
                'Solo ETH en Ethereum mainnet. NO envíes USDC, USDT, ni ETH en Polygon/Base/Arbitrum — pérdida permanente. Ni Bitso ni Coinbase recuperan depósitos mal dirigidos.',
                'ETH on Ethereum mainnet ONLY. Do NOT send USDC, USDT, or ETH on Polygon/Base/Arbitrum — permanent loss. Neither Bitso nor Coinbase recover misdirected deposits.',
              )}
            </p>
          </div>

          {/* Wallet owner toggle */}
          <div>
            <div style={labelStyle}>{T('A QUIÉN ENVIAR', 'SEND TO')}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {(Object.keys(INVESTOR_WALLETS) as WalletOwner[]).map(o => {
                const w = INVESTOR_WALLETS[o]
                const active = walletOwner === o
                return (
                  <button key={o} onClick={() => setWalletOwner(o)} style={{
                    flex: 1, padding: '10px 12px', borderRadius: 10,
                    background: active ? `${BRAND.mazorca}22` : BRAND.bgCard,
                    border: `1px solid ${active ? BRAND.mazorca : BRAND.amazon}99`,
                    color: BRAND.heirloom, cursor: 'pointer',
                    fontFamily: FONTS.display, fontWeight: 700, fontSize: 10, letterSpacing: '0.08em',
                    textTransform: 'uppercase' as const, lineHeight: 1.3,
                  }}>
                    <div>{w.role} · {w.name}</div>
                    <div style={{ fontSize: 9, color: `${BRAND.heirloom}77`, fontWeight: 500, marginTop: 3, letterSpacing: '0.06em' }}>
                      via {w.custody}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Address card */}
          <div style={{ background: BRAND.bgCard, border: `1px solid ${BRAND.amazon}88`, borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 9, letterSpacing: '0.15em', color: `${BRAND.heirloom}66`, marginBottom: 6 }}>
              {T('DIRECCIÓN ETH', 'ETH ADDRESS')} · Ethereum mainnet
            </div>
            <div style={addressBoxStyle}>{INVESTOR_WALLETS[walletOwner].eth}</div>
            <button
              onClick={() => copyAddress(INVESTOR_WALLETS[walletOwner].eth)}
              style={{
                width: '100%', padding: '10px', borderRadius: 8,
                background: copied ? `${BRAND.pod}33` : BRAND.amazon,
                border: `1px solid ${BRAND.pod}88`, color: BRAND.heirloom, cursor: 'pointer',
                fontFamily: FONTS.display, fontWeight: 700, fontSize: 11, letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              {copied ? `✓ ${T('Copiada', 'Copied')}` : `📋 ${T('Copiar address', 'Copy address')}`}
            </button>
          </div>

          <button onClick={() => setPhase('verify')} style={primaryBtn}>
            {T('YA TRANSFERÍ · CONTINUAR →', 'I TRANSFERRED · CONTINUE →')}
          </button>
        </motion.div>
      )}

      {/* PHASE 2 — Verify (tx hash form) */}
      {(phase === 'verify' || phase === 'submitting') && (
        <motion.div key="verify" {...phaseMotion} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontFamily: FONTS.body, fontSize: 12, color: `${BRAND.heirloom}aa`, lineHeight: 1.55, margin: 0 }}>
            {T(
              'Pega el hash de la transacción que aparece en tu wallet o en Etherscan después de confirmar el envío. Empieza con 0x y tiene 64 caracteres.',
              'Paste the transaction hash shown in your wallet or on Etherscan after confirming the send. Starts with 0x and has 64 characters.',
            )}
          </p>

          <div>
            <div style={labelStyle}>{T('TX HASH', 'TX HASH')}</div>
            <input
              type="text" value={txHash}
              onChange={e => setTxHash(e.target.value)}
              placeholder="0x..." spellCheck={false} autoCapitalize="off" autoCorrect="off"
              style={{ ...inputStyle, fontFamily: 'ui-monospace, monospace', fontSize: 12 }}
            />
          </div>

          <div>
            <div style={labelStyle}>{T('MONTO ENVIADO USD', 'AMOUNT SENT USD')}</div>
            <input
              type="number" min={1} step={1} value={amountSent}
              onChange={e => setAmountSent(e.target.value)}
              style={inputStyle}
            />
            {Number(amountSent) !== amount_usd && Number(amountSent) > 0 && (
              <div style={{ fontSize: 10, color: BRAND.mazorca, marginTop: 4 }}>
                ⚠️ {T(
                  `Diferencia con el solicitado ($${amount_usd.toLocaleString('en-US')}). El equipo lo revisará.`,
                  `Differs from requested ($${amount_usd.toLocaleString('en-US')}). Team will review.`,
                )}
              </div>
            )}
          </div>

          {err && <div style={errStyle}>{err}</div>}

          <button
            onClick={submit}
            disabled={phase === 'submitting' || txHash.trim().length < 66 || !Number(amountSent)}
            style={{
              ...primaryBtn,
              opacity: (phase === 'submitting' || txHash.trim().length < 66 || !Number(amountSent)) ? 0.5 : 1,
              cursor: phase === 'submitting' ? 'wait' : 'pointer',
            }}
          >
            {phase === 'submitting' ? T('REGISTRANDO...', 'RECORDING...') : T('CONFIRMAR TRANSFERENCIA →', 'CONFIRM TRANSFER →')}
          </button>
          <button onClick={() => setPhase('transfer')} style={ghostBtn} disabled={phase === 'submitting'}>
            ← {T('Volver', 'Back')}
          </button>
        </motion.div>
      )}

      {/* PHASE 3 — Success: Allocación Asegurada */}
      {phase === 'success' && (
        <motion.div key="success" {...phaseMotion} style={{ textAlign: 'center', padding: '12px 0' }}>
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.05, type: 'spring', stiffness: 220, damping: 15 }}
            style={{ fontSize: 56, marginBottom: 16 }}
          >✅</motion.div>
          <div style={{
            fontFamily: FONTS.display, fontWeight: 900, fontSize: 'clamp(22px,5vw,28px)',
            color: BRAND.pod, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 10,
          }}>
            {T('Allocación Asegurada', 'Allocation Secured')}
          </div>
          <p style={{ fontFamily: FONTS.body, fontSize: 13, color: `${BRAND.heirloom}cc`, lineHeight: 1.6, margin: '0 0 18px', maxWidth: 380, marginInline: 'auto' }}>
            {T(
              'Nuestro equipo se contactará en 24 horas para completar tu documentación y transferencia.',
              'Our team will contact you within 24 hours to complete your documentation and transfer.',
            )}
          </p>

          {resultId && (
            <div style={{ background: BRAND.bgCard, border: `1px solid ${BRAND.amazon}88`, borderRadius: 10, padding: '12px 14px', textAlign: 'left', marginBottom: 14 }}>
              <div style={labelStyle}>{T('REFERENCIA INTERNA', 'INTERNAL REFERENCE')}</div>
              <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, color: `${BRAND.heirloom}aa`, wordBreak: 'break-all' }}>
                {resultId}
              </div>
              <div style={{ ...labelStyle, marginTop: 10 }}>{T('TX HASH', 'TX HASH')}</div>
              <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, color: BRAND.heirloom, wordBreak: 'break-all' }}>
                {txHash}
              </div>
              {etherscanUrl && (
                <a href={etherscanUrl} target="_blank" rel="noopener noreferrer" style={{
                  display: 'inline-block', marginTop: 8, fontSize: 11, color: BRAND.heroic,
                  textDecoration: 'none', borderBottom: `1px solid ${BRAND.heroic}55`,
                }}>
                  {T('Ver en Etherscan ↗', 'View on Etherscan ↗')}
                </a>
              )}
            </div>
          )}

          <button onClick={onClose} style={primaryBtn}>{T('Listo', 'Done')}</button>
        </motion.div>
      )}

    </div>
  )
}

// ── shared style helpers ──
const phaseMotion = {
  initial: { opacity: 0, x: 12 },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: -12 },
  transition: { duration: 0.2 },
}
const labelStyle: React.CSSProperties = {
  fontFamily: FONTS.display, fontWeight: 700, fontSize: 9,
  letterSpacing: '0.25em', color: `${BRAND.heirloom}66`, marginBottom: 8,
  textTransform: 'uppercase',
}
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', borderRadius: 10,
  background: BRAND.bgCard, border: `1px solid ${BRAND.amazon}88`,
  color: BRAND.heirloom, fontFamily: FONTS.display, fontWeight: 700, fontSize: 16,
}
const primaryBtn: React.CSSProperties = {
  width: '100%', padding: '14px', borderRadius: 999,
  background: `linear-gradient(135deg, ${BRAND.pod}, ${BRAND.amazon})`,
  color: BRAND.heirloom, border: 'none', cursor: 'pointer',
  fontFamily: FONTS.display, fontWeight: 800, fontSize: 12, letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
}
const ghostBtn: React.CSSProperties = {
  background: 'transparent', border: 'none',
  color: `${BRAND.heirloom}66`, cursor: 'pointer',
  fontFamily: FONTS.display, fontWeight: 700, fontSize: 11, letterSpacing: '0.1em',
  padding: '8px 0', textTransform: 'uppercase',
}
const errStyle: React.CSSProperties = {
  padding: '8px 12px', borderRadius: 8,
  background: `${BRAND.radioRed}18`, border: `1px solid ${BRAND.radioRed}44`,
  fontFamily: FONTS.body, fontSize: 11, color: `${BRAND.radioRed}cc`,
}
const warningStyle: React.CSSProperties = {
  background: `${BRAND.radioRed}22`, border: `1.5px solid ${BRAND.radioRed}`,
  borderRadius: 10, padding: '12px 14px',
}
const summaryBoxStyle: React.CSSProperties = {
  background: `${BRAND.pod}18`, border: `1px solid ${BRAND.pod}66`,
  borderRadius: 10, padding: '12px 14px',
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
}
const addressBoxStyle: React.CSSProperties = {
  fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
  fontSize: 12, color: BRAND.heirloom, wordBreak: 'break-all',
  background: BRAND.bgDeep, border: `1px solid ${BRAND.amazon}55`,
  borderRadius: 6, padding: '10px 12px', marginBottom: 8,
}
