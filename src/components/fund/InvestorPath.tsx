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

type Step = 'choose-kind' | 'choose-network' | 'transfer' | 'verify' | 'submitting' | 'success'
type WalletOwner = keyof typeof INVESTOR_WALLETS

interface NetworkOption {
  id:        string
  asset:     string   // ETH, USDC, BTC, SOL
  network:   string   // ethereum, polygon, base, bitcoin, solana
  label:     string
  badge:     string   // emoji o ticker
  active:    boolean  // si false, render como "Próximamente"
  warning?:  string   // texto crítico al lado del address
}

const NETWORK_OPTIONS: NetworkOption[] = [
  {
    id: 'eth-mainnet',
    asset: 'ETH', network: 'ethereum',
    label: 'ETH · Ethereum mainnet',
    badge: '⟠',
    active: true,
    warning: 'Solo ETH en Ethereum mainnet. NO envíes USDC, USDT, ni ETH en Polygon/Base/Arbitrum — pérdida permanente.',
  },
  {
    id: 'usdc-multi',
    asset: 'USDC', network: 'ethereum',
    label: 'USDC · Ethereum / Base / Polygon',
    badge: '$',
    active: false,
  },
  {
    id: 'btc',
    asset: 'BTC', network: 'bitcoin',
    label: 'Bitcoin · BTC mainnet',
    badge: '₿',
    active: false,
  },
  {
    id: 'sol',
    asset: 'SOL', network: 'solana',
    label: 'Solana · SOL',
    badge: '◎',
    active: false,
  },
]

export default function InvestorPath({ open, onClose, lang }: Props) {
  const [step,         setStep]         = useState<Step>('choose-kind')
  const [kind,         setKind]         = useState<InvestorPackageKind | null>(null)
  const [amount,       setAmount]       = useState<number>(1000)
  const [networkOpt,   setNetworkOpt]   = useState<NetworkOption | null>(null)
  const [walletOwner,  setWalletOwner]  = useState<WalletOwner>('cto')
  const [copied,       setCopied]       = useState(false)
  const [txHash,       setTxHash]       = useState('')
  const [amountSent,   setAmountSent]   = useState<string>('')
  const [resultId,     setResultId]     = useState<string | null>(null)
  const [etherscanUrl, setEtherscanUrl] = useState<string | null>(null)
  const [err,          setErr]          = useState<string | null>(null)

  const T = (es: string, en: string) => (lang === 'es' ? es : en)

  if (!open) return null

  const reset = () => {
    setStep('choose-kind'); setKind(null); setAmount(1000)
    setNetworkOpt(null); setWalletOwner('cto')
    setCopied(false); setTxHash(''); setAmountSent('')
    setResultId(null); setEtherscanUrl(null); setErr(null)
  }
  const close = () => { reset(); onClose() }

  const pickKind = (k: InvestorPackageKind) => {
    setKind(k)
    if (k === 'equity_5k') { setAmount(5000); setAmountSent('5000') }
    else { setAmountSent(String(amount)) }
    setStep('choose-network')
    hsTrackEvent('investor_kind_selected', { kind: k })
  }

  const pickNetwork = (opt: NetworkOption) => {
    if (!opt.active) return
    setNetworkOpt(opt)
    setStep('transfer')
    hsTrackEvent('investor_network_selected', { network: opt.network, asset: opt.asset })
  }

  const copyAddress = async (addr: string) => {
    try {
      await navigator.clipboard.writeText(addr)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch { /* clipboard blocked — user manually selects */ }
  }

  const submitTransfer = async () => {
    if (!kind || !networkOpt) return
    setErr(null); setStep('submitting')
    try {
      const { data, error } = await supabase.functions.invoke('record-investor-transfer', {
        body: {
          kind,
          destination:     walletOwner,
          amount_usd:      amount,
          amount_sent_usd: Number(amountSent),
          tx_hash:         txHash.trim(),
          network:         networkOpt.network,
          asset:           networkOpt.asset,
        },
      })
      if (error || !data?.id) throw new Error(error?.message ?? 'Error registering transfer')
      hsTrackEvent('investor_transfer_recorded', {
        kind, amount_usd: amount, amount_sent_usd: Number(amountSent),
        network: networkOpt.network, asset: networkOpt.asset,
      })
      setResultId(data.id)
      setEtherscanUrl(data.etherscan_url ?? null)
      setStep('success')
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error')
      setStep('verify')
    }
  }

  const stepIndex = ['choose-kind', 'choose-network', 'transfer', 'verify', 'success'].indexOf(
    step === 'submitting' ? 'verify' : step,
  )

  return (
    <>
      <div onClick={close} style={overlayStyle} />
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        style={modalStyle}
      >
        {/* Header + step indicator */}
        <div style={{ padding: '20px 24px 12px', borderBottom: `1px solid ${BRAND.amazon}55` }}>
          <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 9, letterSpacing: '0.25em', color: BRAND.mazorca, marginBottom: 4 }}>
            {T('SOY INVESTOR · CFB CHECKOUT', 'I AM AN INVESTOR · CFB CHECKOUT')}
          </div>
          <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 22, color: BRAND.heirloom, marginBottom: 12 }}>
            {step === 'choose-kind'    && T('Elige tu paquete',     'Pick your package')}
            {step === 'choose-network' && T('Elige red y activo',   'Pick network and asset')}
            {step === 'transfer'       && T('Transfiere desde tu wallet', 'Transfer from your wallet')}
            {(step === 'verify' || step === 'submitting') && T('Verifica tu transferencia', 'Verify your transfer')}
            {step === 'success'        && T('Allocación asegurada', 'Allocation secured')}
          </div>
          {/* Progress dots */}
          <div style={{ display: 'flex', gap: 6 }}>
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} style={{
                flex: 1, height: 3, borderRadius: 2,
                background: i <= stepIndex ? BRAND.pod : `${BRAND.amazon}88`,
                transition: 'background 0.3s',
              }} />
            ))}
          </div>
        </div>

        <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '74vh', overflowY: 'auto' }}>
          <AnimatePresence mode="wait">

            {/* STEP 1 — package */}
            {step === 'choose-kind' && (
              <motion.div key="kind" {...stepMotion} style={{ display: 'grid', gap: 12 }}>
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
                <p style={legalNote}>
                  {T('Consulta con el CTO antes de transferir. CFB nunca pedirá tu private key.',
                     'Consult the CTO before transferring. CFB will never ask for your private key.')}
                </p>
              </motion.div>
            )}

            {/* STEP 2 — network/asset */}
            {step === 'choose-network' && kind && (
              <motion.div key="network" {...stepMotion} style={{ display: 'grid', gap: 10 }}>
                {/* Custom amount input for B2B */}
                {kind === 'b2b_sponsorship' && (
                  <div>
                    <div style={labelStyle}>{T('MONTO USD', 'AMOUNT USD')}</div>
                    <input
                      type="number" min={100} max={50000} step={100}
                      value={amount}
                      onChange={e => {
                        const v = Math.max(100, Math.min(50000, Number(e.target.value) || 100))
                        setAmount(v); setAmountSent(String(v))
                      }}
                      style={inputStyle}
                    />
                  </div>
                )}

                {NETWORK_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => pickNetwork(opt)}
                    disabled={!opt.active}
                    style={{
                      ...cardBtn(opt.active ? BRAND.heroic : BRAND.amazon),
                      cursor: opt.active ? 'pointer' : 'not-allowed',
                      opacity: opt.active ? 1 : 0.45,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{
                        fontSize: 22, width: 36, height: 36, borderRadius: 18,
                        background: `${BRAND.bgDeep}aa`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: opt.active ? BRAND.heirloom : `${BRAND.heirloom}66`,
                      }}>{opt.badge}</span>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 13, color: BRAND.heirloom }}>
                          {opt.label}
                        </div>
                        <div style={{ fontFamily: FONTS.body, fontSize: 10, color: `${BRAND.heirloom}66`, marginTop: 2 }}>
                          {opt.active
                            ? T('Coinbase Wallet · MetaMask · cualquier wallet ETH · Bitso', 'Coinbase Wallet · MetaMask · any ETH wallet · Bitso')
                            : T('Próximamente · esperando wallets multi-chain', 'Coming soon · awaiting multi-chain wallets')}
                        </div>
                      </div>
                    </div>
                    {!opt.active && (
                      <span style={{
                        fontFamily: FONTS.display, fontWeight: 700, fontSize: 9, letterSpacing: '0.15em',
                        color: BRAND.mazorca, padding: '3px 8px',
                        background: `${BRAND.mazorca}22`, borderRadius: 4, textTransform: 'uppercase',
                      }}>
                        {T('Próximo', 'Soon')}
                      </span>
                    )}
                  </button>
                ))}

                <button onClick={() => setStep('choose-kind')} style={ghostBtn}>← {T('Volver', 'Back')}</button>
              </motion.div>
            )}

            {/* STEP 3 — transfer (show address) */}
            {step === 'transfer' && kind && networkOpt && (
              <motion.div key="transfer" {...stepMotion} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Amount summary */}
                <div style={{
                  background: `${BRAND.pod}18`, border: `1px solid ${BRAND.pod}66`,
                  borderRadius: 10, padding: '12px 14px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <div style={labelStyle}>{T('MONTO A TRANSFERIR', 'AMOUNT TO TRANSFER')}</div>
                    <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 28, color: BRAND.pod, lineHeight: 1 }}>
                      ${amount.toLocaleString('en-US')} <span style={{ fontSize: 13, color: `${BRAND.heirloom}88` }}>USD</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 11, color: `${BRAND.heirloom}88` }}>
                    {T('en', 'in')} <strong style={{ color: BRAND.heirloom }}>{networkOpt.asset}</strong><br />
                    <span style={{ fontSize: 9 }}>{networkOpt.network}</span>
                  </div>
                </div>

                {/* Critical warning */}
                {networkOpt.warning && (
                  <div style={warningStyle}>
                    <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 11, letterSpacing: '0.15em', color: BRAND.radioRed, marginBottom: 6 }}>
                      ⚠️ {T('LEE ANTES DE TRANSFERIR', 'READ BEFORE TRANSFERRING')}
                    </div>
                    <p style={{ fontFamily: FONTS.body, fontSize: 11, color: BRAND.heirloom, lineHeight: 1.55, margin: 0 }}>
                      {networkOpt.warning}
                    </p>
                  </div>
                )}

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

                {/* Address card */}
                <div style={{
                  background: BRAND.bgCard, border: `1px solid ${BRAND.amazon}88`,
                  borderRadius: 10, padding: '12px 14px',
                }}>
                  <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 9, letterSpacing: '0.15em', color: `${BRAND.heirloom}66`, marginBottom: 6 }}>
                    {T(`DIRECCIÓN ${networkOpt.asset}`, `${networkOpt.asset} ADDRESS`)} · {networkOpt.network}
                  </div>
                  <div style={addressBoxStyle}>
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

                {/* Continue */}
                <button onClick={() => setStep('verify')} style={primaryBtn}>
                  {T('YA TRANSFERÍ · CONTINUAR →', 'I TRANSFERRED · CONTINUE →')}
                </button>
                <button onClick={() => setStep('choose-network')} style={ghostBtn}>← {T('Volver', 'Back')}</button>
              </motion.div>
            )}

            {/* STEP 4 — verify (tx hash form) */}
            {(step === 'verify' || step === 'submitting') && kind && networkOpt && (
              <motion.div key="verify" {...stepMotion} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ fontFamily: FONTS.body, fontSize: 12, color: `${BRAND.heirloom}aa`, lineHeight: 1.55, margin: 0 }}>
                  {T(
                    'Pega el hash de la transacción que aparece en tu wallet o en Etherscan después de confirmar el envío. Empieza con 0x y tiene 64 caracteres.',
                    'Paste the transaction hash shown in your wallet or on Etherscan after confirming the send. Starts with 0x and has 64 characters.',
                  )}
                </p>

                <div>
                  <div style={labelStyle}>{T('TX HASH', 'TX HASH')}</div>
                  <input
                    type="text"
                    value={txHash}
                    onChange={e => setTxHash(e.target.value)}
                    placeholder="0x..."
                    spellCheck={false}
                    autoCapitalize="off"
                    autoCorrect="off"
                    style={{ ...inputStyle, fontFamily: 'ui-monospace, monospace', fontSize: 12 }}
                  />
                </div>

                <div>
                  <div style={labelStyle}>{T('MONTO ENVIADO USD', 'AMOUNT SENT USD')}</div>
                  <input
                    type="number" min={1} step={1}
                    value={amountSent}
                    onChange={e => setAmountSent(e.target.value)}
                    style={inputStyle}
                  />
                  {Number(amountSent) !== amount && Number(amountSent) > 0 && (
                    <div style={{ fontSize: 10, color: BRAND.mazorca, marginTop: 4 }}>
                      ⚠️ {T(
                        `Diferencia con el solicitado ($${amount.toLocaleString('en-US')}). El equipo lo revisará.`,
                        `Differs from requested ($${amount.toLocaleString('en-US')}). Team will review.`,
                      )}
                    </div>
                  )}
                </div>

                {err && <div style={errStyle}>{err}</div>}

                <button
                  onClick={submitTransfer}
                  disabled={step === 'submitting' || txHash.trim().length < 66 || !Number(amountSent)}
                  style={{
                    ...primaryBtn,
                    opacity: (step === 'submitting' || txHash.trim().length < 66 || !Number(amountSent)) ? 0.5 : 1,
                    cursor: step === 'submitting' ? 'wait' : 'pointer',
                  }}
                >
                  {step === 'submitting'
                    ? T('REGISTRANDO...', 'RECORDING...')
                    : T('CONFIRMAR TRANSFERENCIA →', 'CONFIRM TRANSFER →')}
                </button>
                <button onClick={() => setStep('transfer')} style={ghostBtn} disabled={step === 'submitting'}>
                  ← {T('Volver', 'Back')}
                </button>
              </motion.div>
            )}

            {/* STEP 5 — success: Allocación Asegurada */}
            {step === 'success' && (
              <motion.div key="success" {...stepMotion} style={{ textAlign: 'center', padding: '12px 0' }}>
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.05, type: 'spring', stiffness: 220, damping: 15 }}
                  style={{ fontSize: 56, marginBottom: 16 }}
                >
                  ✅
                </motion.div>
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

                {/* Tx reference */}
                {resultId && (
                  <div style={{
                    background: BRAND.bgCard, border: `1px solid ${BRAND.amazon}88`,
                    borderRadius: 10, padding: '12px 14px', textAlign: 'left', marginBottom: 14,
                  }}>
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

                <button onClick={close} style={primaryBtn}>
                  {T('Listo', 'Done')}
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </>
  )
}

// ── shared style helpers ──
const stepMotion = {
  initial: { opacity: 0, x: 12 },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: -12 },
  transition: { duration: 0.2 },
}
const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(4,12,6,0.88)',
  backdropFilter: 'blur(8px)', zIndex: 500,
}
const modalStyle: React.CSSProperties = {
  position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
  zIndex: 501, width: 'min(540px, 95vw)',
  background: BRAND.bgDark, border: `1px solid ${BRAND.amazon}77`,
  borderRadius: 20, overflow: 'hidden', maxHeight: '92vh',
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
const addressBoxStyle: React.CSSProperties = {
  fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
  fontSize: 12, color: BRAND.heirloom, wordBreak: 'break-all',
  background: BRAND.bgDeep, border: `1px solid ${BRAND.amazon}55`,
  borderRadius: 6, padding: '10px 12px', marginBottom: 8,
}
const legalNote: React.CSSProperties = {
  fontFamily: FONTS.body, fontSize: 10, color: `${BRAND.heirloom}44`,
  textAlign: 'center', margin: '8px 0 0', lineHeight: 1.5,
}
function cardBtn(accent: string): React.CSSProperties {
  return {
    width: '100%', padding: '14px 16px', borderRadius: 14,
    background: `linear-gradient(135deg, ${accent}18, ${BRAND.bgCard})`,
    border: `1px solid ${accent}77`,
    color: BRAND.heirloom, cursor: 'pointer', textAlign: 'left',
  }
}
