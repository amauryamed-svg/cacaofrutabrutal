import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BRAND, FONTS, INVESTOR_WALLETS, INVESTOR_PACKAGES, type InvestorPackageKind } from '../../utils/constants'
import { supabase } from '../../lib/supabase'
import { hsTrackEvent } from '../../lib/hubspotTracking'

interface Props {
  open: boolean
  onClose: () => void
  lang: 'es' | 'en'
}

type Step = 'choose-kind' | 'choose-method' | 'eth-direct' | 'paying'
type WalletOwner = keyof typeof INVESTOR_WALLETS

export default function InvestorPath({ open, onClose, lang }: Props) {
  const [step,    setStep]    = useState<Step>('choose-kind')
  const [kind,    setKind]    = useState<InvestorPackageKind | null>(null)
  const [amount,  setAmount]  = useState<number>(1000)
  const [walletOwner, setWalletOwner] = useState<WalletOwner>('cto')
  const [copied,  setCopied]  = useState(false)
  const [err,     setErr]     = useState<string | null>(null)

  const T = (es: string, en: string) => (lang === 'es' ? es : en)

  if (!open) return null

  const reset = () => {
    setStep('choose-kind'); setKind(null); setAmount(1000)
    setCopied(false); setErr(null)
  }
  const close = () => { reset(); onClose() }

  const pickKind = (k: InvestorPackageKind) => {
    setKind(k)
    if (k === 'equity_5k') setAmount(5000)
    setStep('choose-method')
    hsTrackEvent('investor_kind_selected', { kind: k })
  }

  const goCoinbase = async () => {
    if (!kind) return
    setStep('paying'); setErr(null)
    try {
      const { data, error } = await supabase.functions.invoke('create-coinbase-charge', {
        body: {
          kind,
          amount_usd: amount,
          success_url: `${window.location.origin}/fund?status=success&via=coinbase`,
          cancel_url:  `${window.location.origin}/fund?status=cancelled&via=coinbase`,
        },
      })
      if (error || !data?.url) throw new Error(error?.message ?? 'No checkout URL')
      hsTrackEvent('investor_intent', { kind, amount_usd: amount, method: 'coinbase_usdc' })
      window.location.href = data.url
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error')
      setStep('choose-method')
    }
  }

  const goDirect = () => {
    if (!kind) return
    hsTrackEvent('investor_intent', { kind, amount_usd: amount, method: 'eth_direct', wallet_owner: walletOwner })
    setStep('eth-direct')
  }

  const copyAddress = async (addr: string) => {
    try {
      await navigator.clipboard.writeText(addr)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch { /* clipboard blocked — user can manually select */ }
  }

  return (
    <>
      <div onClick={close} style={overlayStyle} />
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        style={modalStyle}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${BRAND.amazon}55` }}>
          <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 9, letterSpacing: '0.25em', color: BRAND.mazorca, marginBottom: 4 }}>
            {T('SOY INVESTOR · CFB', 'I AM AN INVESTOR · CFB')}
          </div>
          <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 22, color: BRAND.heirloom }}>
            {step === 'choose-kind'   && T('Elige tu camino',  'Pick your path')}
            {step === 'choose-method' && T('Elige tu método de pago', 'Pick your payment method')}
            {step === 'eth-direct'    && T('Transferencia directa de ETH', 'Direct ETH transfer')}
            {step === 'paying'        && T('Conectando con Coinbase…', 'Connecting to Coinbase…')}
          </div>
        </div>

        <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '74vh', overflowY: 'auto' }}>

          <AnimatePresence mode="wait">
            {step === 'choose-kind' && (
              <motion.div key="kind" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'grid', gap: 12 }}>
                {(Object.keys(INVESTOR_PACKAGES) as InvestorPackageKind[]).map(k => {
                  const p = INVESTOR_PACKAGES[k]
                  return (
                    <button key={k} onClick={() => pickKind(k)} style={cardBtn(BRAND.pod)}>
                      <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 16, color: BRAND.heirloom, marginBottom: 4 }}>
                        {lang === 'es' ? p.labelEs : p.label}
                      </div>
                      {p.amount_usd > 0 && (
                        <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 24, color: BRAND.pod, margin: '4px 0' }}>
                          ${p.amount_usd.toLocaleString('en-US')} <span style={{ fontSize: 11, opacity: 0.7 }}>USD</span>
                        </div>
                      )}
                      <div style={{ fontFamily: FONTS.body, fontSize: 11, color: `${BRAND.heirloom}88`, lineHeight: 1.5 }}>
                        {lang === 'es' ? p.descEs : p.desc}
                      </div>
                    </button>
                  )
                })}
                <p style={{ fontFamily: FONTS.body, fontSize: 10, color: `${BRAND.heirloom}44`, textAlign: 'center', margin: '8px 0 0', lineHeight: 1.5 }}>
                  {T('Consulta con el CTO antes de transferir. CFB nunca pedirá tu private key.',
                     'Consult with the CTO before transferring. CFB will never ask for your private key.')}
                </p>
              </motion.div>
            )}

            {step === 'choose-method' && kind && (
              <motion.div key="method" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'grid', gap: 12 }}>
                {/* Amount stepper for B2B */}
                {kind === 'b2b_sponsorship' && (
                  <div>
                    <div style={labelStyle}>{T('MONTO USD', 'AMOUNT USD')}</div>
                    <input
                      type="number" min={100} max={50000} step={100}
                      value={amount}
                      onChange={e => setAmount(Math.max(100, Math.min(50000, Number(e.target.value) || 100)))}
                      style={{
                        width: '100%', padding: '12px 14px', borderRadius: 10,
                        background: BRAND.bgCard, border: `1px solid ${BRAND.amazon}88`,
                        color: BRAND.heirloom, fontFamily: FONTS.display, fontWeight: 700, fontSize: 18,
                      }}
                    />
                  </div>
                )}

                <button onClick={goCoinbase} style={{ ...cardBtn(BRAND.heroic), textAlign: 'left' as const }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 22 }}>💳</span>
                    <div>
                      <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 14, color: BRAND.heirloom }}>
                        {T('Pagar con USDC', 'Pay with USDC')}
                      </div>
                      <div style={{ fontFamily: FONTS.body, fontSize: 10, color: `${BRAND.heirloom}88`, marginTop: 2 }}>
                        {T('Coinbase Commerce · checkout automático · cualquier red', 'Coinbase Commerce · automated checkout · any chain')}
                      </div>
                    </div>
                  </div>
                </button>

                <button onClick={goDirect} style={{ ...cardBtn(BRAND.mazorca), textAlign: 'left' as const }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 22 }}>⚡</span>
                    <div>
                      <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 14, color: BRAND.heirloom }}>
                        {T('Enviar ETH directo', 'Send ETH directly')}
                      </div>
                      <div style={{ fontFamily: FONTS.body, fontSize: 10, color: `${BRAND.heirloom}88`, marginTop: 2 }}>
                        {T('Transfer manual · Bitso · ETH-only en red Ethereum', 'Manual transfer · Bitso · ETH-only on Ethereum mainnet')}
                      </div>
                    </div>
                  </div>
                </button>

                {err && (
                  <div style={errStyle}>{err}</div>
                )}

                <button onClick={() => setStep('choose-kind')} style={ghostBtn}>
                  ← {T('Volver', 'Back')}
                </button>
              </motion.div>
            )}

            {step === 'eth-direct' && kind && (
              <motion.div key="eth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                {/* Critical warning */}
                <div style={{
                  background: `${BRAND.radioRed}22`, border: `1.5px solid ${BRAND.radioRed}`,
                  borderRadius: 10, padding: '12px 14px',
                }}>
                  <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 11, letterSpacing: '0.15em', color: BRAND.radioRed, marginBottom: 6 }}>
                    ⚠️ {T('LEE ANTES DE TRANSFERIR', 'READ BEFORE TRANSFERRING')}
                  </div>
                  <ul style={{ fontFamily: FONTS.body, fontSize: 11, color: BRAND.heirloom, lineHeight: 1.55, margin: 0, paddingLeft: 18 }}>
                    <li>{T('Solo ETH en red Ethereum mainnet.', 'ETH on Ethereum mainnet ONLY.')}</li>
                    <li>{T('NO envíes USDC, USDT, ni ETH en Polygon/Base/Arbitrum — perdidas permanentes.', 'Do NOT send USDC, USDT, or ETH on Polygon/Base/Arbitrum — permanent loss.')}</li>
                    <li>{T('Bitso no recupera depósitos mal dirigidos.', 'Bitso does not recover misdirected deposits.')}</li>
                    <li>{T('Verifica la address completa antes de confirmar la transacción.', 'Verify the full address before confirming the transaction.')}</li>
                  </ul>
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
                          fontFamily: FONTS.display, fontWeight: 700, fontSize: 11, letterSpacing: '0.1em',
                          textTransform: 'uppercase' as const,
                        }}>
                          {w.role} · {w.name}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Selected address display */}
                <div style={{
                  background: BRAND.bgCard, border: `1px solid ${BRAND.amazon}88`,
                  borderRadius: 10, padding: '12px 14px',
                }}>
                  <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 9, letterSpacing: '0.15em', color: `${BRAND.heirloom}66`, marginBottom: 6 }}>
                    {T('DIRECCIÓN ETH', 'ETH ADDRESS')} · {INVESTOR_WALLETS[walletOwner].network}
                  </div>
                  <div style={{
                    fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
                    fontSize: 12, color: BRAND.heirloom, wordBreak: 'break-all',
                    background: BRAND.bgDeep, border: `1px solid ${BRAND.amazon}55`,
                    borderRadius: 6, padding: '10px 12px', marginBottom: 8,
                  }}>
                    {INVESTOR_WALLETS[walletOwner].eth}
                  </div>
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

                <p style={{ fontFamily: FONTS.body, fontSize: 11, color: `${BRAND.heirloom}77`, lineHeight: 1.55, margin: '4px 0 0' }}>
                  {T(
                    `Después de enviar, escríbenos a hola@cacaofrutabrutal.com con el tx hash y monto (~$${amount.toLocaleString('en-US')} USD en ETH). Confirmamos en <24h.`,
                    `After sending, email hola@cacaofrutabrutal.com with the tx hash and amount (~$${amount.toLocaleString('en-US')} USD worth of ETH). We confirm within 24h.`,
                  )}
                </p>

                <button onClick={() => setStep('choose-method')} style={ghostBtn}>
                  ← {T('Volver', 'Back')}
                </button>
              </motion.div>
            )}

            {step === 'paying' && (
              <motion.div key="paying" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
                <div style={{ fontFamily: FONTS.body, color: `${BRAND.heirloom}88`, fontSize: 13 }}>
                  {T('Generando charge en Coinbase Commerce…', 'Generating Coinbase Commerce charge…')}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  )
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(4,12,6,0.88)',
  backdropFilter: 'blur(8px)', zIndex: 500,
}
const modalStyle: React.CSSProperties = {
  position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
  zIndex: 501, width: 'min(520px, 95vw)',
  background: BRAND.bgDark, border: `1px solid ${BRAND.amazon}77`,
  borderRadius: 20, overflow: 'hidden', maxHeight: '92vh',
}
const labelStyle: React.CSSProperties = {
  fontFamily: FONTS.display, fontWeight: 700, fontSize: 9,
  letterSpacing: '0.25em', color: `${BRAND.heirloom}66`, marginBottom: 8,
  textTransform: 'uppercase',
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
function cardBtn(accent: string): React.CSSProperties {
  return {
    width: '100%', padding: '14px 16px', borderRadius: 14,
    background: `linear-gradient(135deg, ${accent}18, ${BRAND.bgCard})`,
    border: `1px solid ${accent}77`,
    color: BRAND.heirloom, cursor: 'pointer', textAlign: 'left',
  }
}
