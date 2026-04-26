import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BRAND, FONTS, INVESTOR_PACKAGES, type InvestorPackageKind } from '../../utils/constants'
import { hsTrackEvent } from '../../lib/hubspotTracking'
import WalletCheckout from './WalletCheckout'

interface Props {
  open: boolean
  onClose: () => void
  lang: 'es' | 'en'
}

type Step = 'choose-kind' | 'choose-network' | 'wallet'

interface NetworkOption {
  id:        string
  asset:     string
  network:   string
  label:     string
  badge:     string
  active:    boolean
}

const NETWORK_OPTIONS: NetworkOption[] = [
  { id: 'eth-mainnet', asset: 'ETH',  network: 'ethereum', label: 'ETH · Ethereum mainnet',           badge: '⟠', active: true  },
  { id: 'usdc-multi',  asset: 'USDC', network: 'ethereum', label: 'USDC · Ethereum / Base / Polygon', badge: '$', active: false },
  { id: 'btc',         asset: 'BTC',  network: 'bitcoin',  label: 'Bitcoin · BTC mainnet',            badge: '₿', active: false },
  { id: 'sol',         asset: 'SOL',  network: 'solana',   label: 'Solana · SOL',                     badge: '◎', active: false },
]

export default function InvestorPath({ open, onClose, lang }: Props) {
  const [step,        setStep]        = useState<Step>('choose-kind')
  const [kind,        setKind]        = useState<InvestorPackageKind | null>(null)
  const [amount,      setAmount]      = useState<number>(1000)
  const [networkOpt,  setNetworkOpt]  = useState<NetworkOption | null>(null)

  const T = (es: string, en: string) => (lang === 'es' ? es : en)

  if (!open) return null

  const reset = () => {
    setStep('choose-kind'); setKind(null); setAmount(1000); setNetworkOpt(null)
  }
  const close = () => { reset(); onClose() }

  const pickKind = (k: InvestorPackageKind) => {
    setKind(k)
    if (k === 'equity_5k') setAmount(5000)
    setStep('choose-network')
    hsTrackEvent('investor_kind_selected', { kind: k })
  }

  const pickNetwork = (opt: NetworkOption) => {
    if (!opt.active) return
    setNetworkOpt(opt)
    setStep('wallet')
    hsTrackEvent('investor_network_selected', { network: opt.network, asset: opt.asset })
  }

  // Progress dots: kind → network → (transfer→verify→success grouped as "wallet")
  const stepIndex = ['choose-kind', 'choose-network', 'wallet'].indexOf(step)
  const totalDots = 5  // kind, network, transfer, verify, success — visual continuity

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
            {step === 'choose-kind'    && T('Elige tu paquete',    'Pick your package')}
            {step === 'choose-network' && T('Elige red y activo',  'Pick network and asset')}
            {step === 'wallet'         && T('Transferencia y verificación', 'Transfer and verify')}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {Array.from({ length: totalDots }).map((_, i) => (
              <div key={i} style={{
                flex: 1, height: 3, borderRadius: 2,
                background: i <= stepIndex || (step === 'wallet' && i >= 2) ? BRAND.pod : `${BRAND.amazon}88`,
                transition: 'background 0.3s',
              }} />
            ))}
          </div>
        </div>

        <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '74vh', overflowY: 'auto' }}>
          <AnimatePresence mode="wait">

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

            {step === 'choose-network' && kind && (
              <motion.div key="network" {...stepMotion} style={{ display: 'grid', gap: 10 }}>
                {kind === 'b2b_sponsorship' && (
                  <div>
                    <div style={labelStyle}>{T('MONTO USD', 'AMOUNT USD')}</div>
                    <input
                      type="number" min={100} max={50000} step={100}
                      value={amount}
                      onChange={e => setAmount(Math.max(100, Math.min(50000, Number(e.target.value) || 100)))}
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

            {step === 'wallet' && kind && networkOpt && (
              <motion.div key="wallet" {...stepMotion}>
                <WalletCheckout
                  amount_usd={amount}
                  kind={kind}
                  lang={lang}
                  onClose={close}
                />
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
const ghostBtn: React.CSSProperties = {
  background: 'transparent', border: 'none',
  color: `${BRAND.heirloom}66`, cursor: 'pointer',
  fontFamily: FONTS.display, fontWeight: 700, fontSize: 11, letterSpacing: '0.1em',
  padding: '8px 0', textTransform: 'uppercase',
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
