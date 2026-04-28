// Web3 Onboarding — link a wallet on Base, verify KYC, unlock mint/redeem/adopt-with-crypto.
// Brutalist-luxury, hex-only per CauaCore §8. SIWE flow pinned to docs/KYC.md + docs/WEB3.md.

import { useEffect, useState, type ReactNode } from 'react'
import { useAccount, useChainId, useSignMessage, useSwitchChain } from 'wagmi'
import { base } from 'wagmi/chains'
import Web3Provider from '../components/web3/Web3Provider'
import ConnectWalletButton from '../components/web3/ConnectWalletButton'
import { useKYCStatus } from '../hooks/useKYCStatus'
import { useAuth } from '../context/AuthContext'
import { BRAND, FONTS, BASE_CHAIN_ID } from '../utils/constants'
import { buildSiweMessage, linkWallet, requestNonce } from '../lib/web3/siwe'

type Step = 'connect' | 'switch' | 'sign' | 'kyc' | 'done'

const STEP_INDEX: Record<Step, number> = {
  connect: 0, switch: 1, sign: 2, kyc: 3, done: 4,
}
const TOTAL_STEPS = 4

interface StepDef { id: Step; num: number; title: string; subtitle: string }

const STEPS: StepDef[] = [
  { id: 'connect', num: 1, title: 'CONNECT WALLET',  subtitle: 'Coinbase Smart Wallet, Rabby, MetaMask, or any WalletConnect-enabled wallet.' },
  { id: 'switch',  num: 2, title: 'SWITCH TO BASE',  subtitle: `Caúa contracts live on Base mainnet (chain ${BASE_CHAIN_ID}).` },
  { id: 'sign',    num: 3, title: 'SIGN SIWE',       subtitle: 'EIP-4361 message proves wallet ownership. We screen against OFAC + Chainalysis before linking.' },
  { id: 'kyc',     num: 4, title: 'VERIFY IDENTITY', subtitle: 'Persona-handled KYC tier 1. Required for mint, redeem, and crypto adoption.' },
]

interface PillTone { label: string; tone: string }
const COMPLIANCE_PILLS: PillTone[] = [
  { label: 'PERSONA KYC',         tone: BRAND.pod },
  { label: 'CHAINALYSIS',         tone: BRAND.heroic },
  { label: 'OFAC PRE-WRITE',      tone: BRAND.theobroma },
  { label: 'TEXAS MSA · MERCHANT', tone: BRAND.mazorca },
]

function Inner() {
  const { user, userId } = useAuth()
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain, isPending: switching } = useSwitchChain()
  const { signMessageAsync, isPending: signing } = useSignMessage()
  const kyc = useKYCStatus()

  const [step, setStep] = useState<Step>('connect')
  const [linking, setLinking] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!isConnected) return setStep('connect')
    if (chainId !== BASE_CHAIN_ID) return setStep('switch')
    if (!kyc.walletAddress || kyc.walletAddress.toLowerCase() !== address?.toLowerCase()) return setStep('sign')
    if (kyc.status !== 'verified') return setStep('kyc')
    setStep('done')
  }, [isConnected, chainId, kyc.walletAddress, kyc.status, address])

  async function onSignAndLink() {
    if (!address) return
    setLinking(true)
    setErr(null)
    try {
      const { nonce } = await requestNonce()
      const message = buildSiweMessage({ address, chainId: BASE_CHAIN_ID, nonce })
      const signature = await signMessageAsync({ message })
      await linkWallet({ message, signature })
      await kyc.refresh()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'sign_failed')
    } finally {
      setLinking(false)
    }
  }

  function copyAddress() {
    if (!address) return
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    }).catch(() => {})
  }

  // ── Auth-required short-circuit ────────────────────────────────────
  if (!userId) {
    return (
      <Shell>
        <div style={hero}>
          <div style={chip}>WEB3 ONBOARDING</div>
          <h1 style={h1}>SIGN IN FIRST.</h1>
          <p style={lead}>You need a CauaCorp account before linking a wallet — your Supabase user is the anchor identity that owns the linked address.</p>
          <a href="/app/auth" style={btnStyle}>→ GO TO SIGN-IN</a>
        </div>
      </Shell>
    )
  }
  void user // reserved for greeting copy in Phase 5

  const idx = STEP_INDEX[step]
  const progressPct = (Math.min(idx, TOTAL_STEPS) / TOTAL_STEPS) * 100

  // ── Done state ─────────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <Shell>
        <div style={hero}>
          <div style={{ ...chip, borderColor: BRAND.pod, color: BRAND.pod }}>
            <span style={{ ...chipDot, background: BRAND.pod, boxShadow: `0 0 10px ${BRAND.pod}` }} />
            VERIFIED · BASE
          </div>
          <h1 style={h1}>WELCOME TO<br/><span style={{ color: BRAND.pod }}>CAÚA WEB3.</span></h1>
          <p style={lead}>
            Your wallet is linked, identity verified, and screened. You can now mint trees as ERC-721 NFTs,
            redeem mazorcas for $CACAO, and adopt with crypto across USDC / ETH / cbBTC.
          </p>

          <WalletInfoCard address={address!} chainId={chainId} onCopy={copyAddress} copied={copied} />

          <div style={ctaRow}>
            <a href="/app/adoptar"   style={btnStyle}>ADOPT A TREE →</a>
            <a href="/app/dashboard" style={btnGhostStyle}>YOUR DASHBOARD</a>
          </div>

          <CompliancePills />
        </div>
      </Shell>
    )
  }

  // ── Active flow ────────────────────────────────────────────────────
  return (
    <Shell>
      <div style={hero}>
        <div style={chip}>WEB3 ONBOARDING · {idx + 1}/{TOTAL_STEPS}</div>
        <h1 style={h1}>LINK YOUR WALLET<br/>TO <span style={{ color: BRAND.mazorca }}>MINT, EARN, ADOPT.</span></h1>
        <p style={lead}>
          Four steps. Read the <a href="/docs/CHARTER.md" style={linkInline}>Charter</a> before signing —
          this binds your identity to an on-chain address.
        </p>
      </div>

      {/* ── Progress rail ──────────────────────────────────────────── */}
      <div style={progressWrap}>
        <div style={progressTrack}>
          <div style={{ ...progressFill, width: `${progressPct}%` }} />
        </div>
        <div style={progressDots}>
          {STEPS.map((s, i) => {
            const done = idx > i
            const active = idx === i
            return (
              <div key={s.id} style={dotWrap}>
                <div style={{
                  ...dot,
                  background: done ? BRAND.pod : active ? BRAND.mazorca : BRAND.bgDeep,
                  borderColor: done ? BRAND.pod : active ? BRAND.mazorca : `${BRAND.heirloom}33`,
                  color: done ? BRAND.bgDeep : active ? BRAND.bgDeep : `${BRAND.heirloom}55`,
                  boxShadow: active ? `0 0 22px ${BRAND.mazorca}66` : 'none',
                }}>
                  {done ? '✓' : s.num}
                </div>
                <div style={{
                  ...dotLabel,
                  color: done || active ? BRAND.heirloom : `${BRAND.heirloom}55`,
                }}>{s.title}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Step cards stacked ─────────────────────────────────────── */}
      <div style={stepsWrap}>
        {STEPS.map((s) => {
          const sIdx = STEP_INDEX[s.id]
          const isDone   = idx > sIdx
          const isActive = idx === sIdx
          return (
            <article key={s.id} style={stepCard(isActive, isDone)}>
              <div style={stepHeader}>
                <div style={{ ...stepNumBadge, color: isDone ? BRAND.pod : isActive ? BRAND.mazorca : `${BRAND.heirloom}55` }}>
                  {isDone ? '✓' : `0${s.num}`}
                </div>
                <div>
                  <div style={stepTitleStyle}>{s.title}</div>
                  <div style={stepSubtitleStyle}>{s.subtitle}</div>
                </div>
              </div>

              {s.id === 'connect' && isActive && (
                <div style={stepAction}><ConnectWalletButton /></div>
              )}

              {s.id === 'switch' && isActive && (
                <div style={stepAction}>
                  <button
                    onClick={() => switchChain({ chainId: base.id })}
                    disabled={switching}
                    style={btnStyle}
                  >
                    {switching ? 'SWITCHING…' : 'SWITCH TO BASE'}
                  </button>
                </div>
              )}

              {s.id === 'sign' && (isActive || isDone) && address && (
                <div style={stepAction}>
                  <WalletInfoCard address={address} chainId={chainId} onCopy={copyAddress} copied={copied} dense />
                  {isActive && (
                    <button
                      onClick={onSignAndLink}
                      disabled={signing || linking}
                      style={{ ...btnStyle, marginTop: 14 }}
                    >
                      {linking || signing ? 'AWAITING WALLET…' : 'SIGN & LINK'}
                    </button>
                  )}
                </div>
              )}

              {s.id === 'kyc' && isActive && (
                <div style={stepAction}>
                  <p style={{ ...lead, fontSize: 13, marginBottom: 14, color: `${BRAND.heirloom}99` }}>
                    KYC is handled by Persona. We never store ID document images server-side; only the verdict
                    and a redacted reference per <a href="/docs/COMPLIANCE.md" style={linkInline}>Compliance</a>.
                  </p>
                  <button
                    onClick={() => alert('Persona flow wiring pending — set PERSONA_TMPL_BASIC env + integrate hosted flow')}
                    style={btnStyle}
                    disabled
                    title="Persona setup pending"
                  >
                    VERIFY IDENTITY · PERSONA SETUP PENDING
                  </button>
                </div>
              )}
            </article>
          )
        })}
      </div>

      {err && (
        <div style={errBox}>
          <div style={errLabel}>ERROR</div>
          <div style={{ fontSize: 14 }}>{err}</div>
        </div>
      )}

      <CompliancePills />
    </Shell>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────

function WalletInfoCard({
  address, chainId, onCopy, copied, dense = false,
}: { address: string; chainId: number; onCopy: () => void; copied: boolean; dense?: boolean }) {
  const truncated = `${address.slice(0, 6)}…${address.slice(-4)}`
  const onBase = chainId === BASE_CHAIN_ID
  return (
    <div style={dense ? walletCardDense : walletCard}>
      <div style={walletLeft}>
        <div style={walletAvatar} aria-hidden="true">
          {/* Subtle abstract gradient based on address last byte */}
          <div style={{
            width: '100%', height: '100%', borderRadius: '50%',
            background: `conic-gradient(from 0deg, ${BRAND.pod}, ${BRAND.mazorca}, ${BRAND.heroic}, ${BRAND.criollo}, ${BRAND.pod})`,
            filter: 'saturate(0.85)',
          }} />
        </div>
        <div>
          <div style={walletLabel}>LINKED WALLET</div>
          <div style={walletAddr}>{truncated}</div>
        </div>
      </div>

      <div style={walletRight}>
        <button onClick={onCopy} style={walletCopyBtn} title="Copy address">
          {copied ? '✓ COPIED' : 'COPY'}
        </button>
        <div style={{
          ...walletChain,
          borderColor: onBase ? BRAND.pod + '88' : BRAND.theobroma + '88',
          color: onBase ? BRAND.pod : BRAND.theobroma,
        }}>
          {onBase ? `BASE · ${chainId}` : `WRONG CHAIN · ${chainId}`}
        </div>
      </div>
    </div>
  )
}

function CompliancePills() {
  return (
    <div style={pillsWrap}>
      <div style={pillsLabel}>SCREENED BY</div>
      <div style={pillsRow}>
        {COMPLIANCE_PILLS.map(p => (
          <span key={p.label} style={pillStyle(p.tone)}>{p.label}</span>
        ))}
      </div>
    </div>
  )
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <main style={shellStyle}>
      <div style={shellInner}>{children}</div>
    </main>
  )
}

// ─── Styles (hex-only per CauaCore §8) ───────────────────────────────

const shellStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: BRAND.bgDeep,
  color: BRAND.heirloom,
  fontFamily: FONTS.body,
  paddingTop: 96, // nav offset
  paddingBottom: 80,
}
const shellInner: React.CSSProperties = {
  maxWidth: 880,
  margin: '0 auto',
  padding: '0 clamp(20px, 4vw, 32px)',
}

// ── Hero ──────────────────────────────────────────────────────────────
const hero: React.CSSProperties = {
  marginBottom: 48,
}
const chip: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  border: `1px solid ${BRAND.mazorca}`,
  color: BRAND.mazorca,
  padding: '6px 14px',
  fontFamily: FONTS.display,
  fontSize: 11,
  letterSpacing: '0.2em',
  marginBottom: 24,
  textTransform: 'uppercase',
  borderRadius: 999,
  fontWeight: 700,
}
const chipDot: React.CSSProperties = {
  width: 7, height: 7, borderRadius: '50%',
}
const h1: React.CSSProperties = {
  fontFamily: FONTS.display,
  fontSize: 'clamp(36px, 6vw, 64px)',
  fontWeight: 900,
  lineHeight: 1.05,
  letterSpacing: '-0.005em',
  margin: '0 0 24px 0',
  textTransform: 'uppercase',
}
const lead: React.CSSProperties = {
  fontSize: 16,
  lineHeight: 1.6,
  color: `${BRAND.heirloom}cc`,
  marginBottom: 24,
  maxWidth: 640,
}
const linkInline: React.CSSProperties = {
  color: BRAND.mazorca,
  textDecoration: 'none',
  borderBottom: `1px solid ${BRAND.mazorca}55`,
}
const ctaRow: React.CSSProperties = {
  display: 'flex', gap: 12, flexWrap: 'wrap',
  marginTop: 24, marginBottom: 32,
}

// ── Progress rail ─────────────────────────────────────────────────
const progressWrap: React.CSSProperties = {
  position: 'relative',
  marginBottom: 56,
  padding: '0 4px',
}
const progressTrack: React.CSSProperties = {
  position: 'absolute',
  top: 22,
  left: '4%',
  right: '4%',
  height: 2,
  background: `${BRAND.heirloom}1a`,
  zIndex: 0,
}
const progressFill: React.CSSProperties = {
  height: '100%',
  background: `linear-gradient(90deg, ${BRAND.pod}, ${BRAND.mazorca})`,
  transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
  boxShadow: `0 0 14px ${BRAND.mazorca}55`,
}
const progressDots: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: `repeat(${TOTAL_STEPS}, 1fr)`,
  gap: 8,
  position: 'relative',
  zIndex: 1,
}
const dotWrap: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
}
const dot: React.CSSProperties = {
  width: 44, height: 44, borderRadius: '50%',
  border: '2px solid',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: FONTS.display, fontWeight: 900, fontSize: 16,
  letterSpacing: '0.04em',
  transition: 'all 0.4s',
}
const dotLabel: React.CSSProperties = {
  fontFamily: FONTS.display, fontSize: 9, letterSpacing: '0.16em',
  textAlign: 'center', textTransform: 'uppercase',
  transition: 'color 0.3s',
}

// ── Step cards ────────────────────────────────────────────────────
const stepsWrap: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 12,
  marginBottom: 32,
}
function stepCard(isActive: boolean, isDone: boolean): React.CSSProperties {
  const accent = isDone ? BRAND.pod : isActive ? BRAND.mazorca : BRAND.amazon
  return {
    background: BRAND.bgCard,
    border: `1px solid ${accent}${isActive ? '' : '55'}`,
    borderLeft: `3px solid ${accent}`,
    padding: 'clamp(16px, 2vw, 24px)',
    opacity: isActive || isDone ? 1 : 0.55,
    transition: 'opacity 0.3s, border-color 0.3s',
  }
}
const stepHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 16,
  marginBottom: 0,
}
const stepNumBadge: React.CSSProperties = {
  fontFamily: FONTS.display,
  fontWeight: 900,
  fontSize: 26,
  letterSpacing: '-0.005em',
  lineHeight: 1,
  minWidth: 38,
}
const stepTitleStyle: React.CSSProperties = {
  fontFamily: FONTS.display,
  fontSize: 16,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  fontWeight: 900,
  color: BRAND.heirloom,
  marginBottom: 6,
}
const stepSubtitleStyle: React.CSSProperties = {
  fontSize: 13,
  lineHeight: 1.55,
  color: `${BRAND.heirloom}99`,
}
const stepAction: React.CSSProperties = {
  marginTop: 16,
  paddingTop: 16,
  borderTop: `1px solid ${BRAND.amazon}55`,
}

// ── Wallet info card ─────────────────────────────────────────────
const walletCard: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 16,
  padding: 20,
  background: BRAND.bgDark,
  border: `1px solid ${BRAND.amazon}`,
  borderRadius: 12,
  marginBottom: 24,
  flexWrap: 'wrap',
}
const walletCardDense: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  padding: '12px 14px',
  background: BRAND.bgDeep,
  border: `1px solid ${BRAND.amazon}`,
  borderRadius: 8,
  flexWrap: 'wrap',
}
const walletLeft: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 12,
}
const walletAvatar: React.CSSProperties = {
  width: 36, height: 36, borderRadius: '50%',
  overflow: 'hidden',
  border: `1px solid ${BRAND.amazon}`,
  flexShrink: 0,
}
const walletLabel: React.CSSProperties = {
  fontFamily: FONTS.display, fontSize: 9, letterSpacing: '0.18em',
  color: `${BRAND.heirloom}66`, textTransform: 'uppercase',
}
const walletAddr: React.CSSProperties = {
  fontFamily: 'monospace', fontSize: 14, fontWeight: 700,
  color: BRAND.heirloom, marginTop: 4,
}
const walletRight: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10,
}
const walletCopyBtn: React.CSSProperties = {
  background: 'transparent',
  border: `1px solid ${BRAND.heirloom}33`,
  color: BRAND.heirloom,
  padding: '6px 12px',
  fontFamily: FONTS.display, fontSize: 10, fontWeight: 700,
  letterSpacing: '0.16em',
  borderRadius: 999,
  cursor: 'pointer',
  textTransform: 'uppercase',
}
const walletChain: React.CSSProperties = {
  fontFamily: FONTS.display, fontSize: 10, fontWeight: 700,
  letterSpacing: '0.14em',
  padding: '6px 12px',
  border: '1px solid',
  borderRadius: 999,
  textTransform: 'uppercase',
}

// ── Compliance pills row ─────────────────────────────────────────
const pillsWrap: React.CSSProperties = {
  marginTop: 48,
  paddingTop: 24,
  borderTop: `1px solid ${BRAND.amazon}55`,
}
const pillsLabel: React.CSSProperties = {
  fontFamily: FONTS.display, fontSize: 9, letterSpacing: '0.2em',
  color: `${BRAND.heirloom}55`, textTransform: 'uppercase',
  marginBottom: 12,
}
const pillsRow: React.CSSProperties = {
  display: 'flex', flexWrap: 'wrap', gap: 8,
}
function pillStyle(tone: string): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 12px',
    border: `1px solid ${tone}66`,
    color: tone,
    background: `${tone}11`,
    fontFamily: FONTS.display,
    fontSize: 10, fontWeight: 700,
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    borderRadius: 999,
  }
}

// ── Buttons ──────────────────────────────────────────────────────
const btnStyle: React.CSSProperties = {
  background: BRAND.mazorca,
  color: BRAND.bgDeep,
  border: 'none',
  padding: '14px 24px',
  fontFamily: FONTS.display,
  fontSize: 13,
  fontWeight: 900,
  letterSpacing: '0.14em',
  cursor: 'pointer',
  textTransform: 'uppercase',
  textDecoration: 'none',
  display: 'inline-block',
}
const btnGhostStyle: React.CSSProperties = {
  background: 'transparent',
  color: BRAND.heirloom,
  border: `1px solid ${BRAND.heirloom}55`,
  padding: '14px 24px',
  fontFamily: FONTS.display,
  fontSize: 13,
  fontWeight: 900,
  letterSpacing: '0.14em',
  cursor: 'pointer',
  textTransform: 'uppercase',
  textDecoration: 'none',
  display: 'inline-block',
}

// ── Error box ────────────────────────────────────────────────────
const errBox: React.CSSProperties = {
  background: `${BRAND.theobroma}1a`,
  border: `1px solid ${BRAND.theobroma}66`,
  padding: '14px 18px',
  borderRadius: 8,
  marginTop: 16,
  color: BRAND.theobroma,
}
const errLabel: React.CSSProperties = {
  fontFamily: FONTS.display, fontSize: 10, letterSpacing: '0.2em',
  color: BRAND.theobroma, marginBottom: 4,
  textTransform: 'uppercase', fontWeight: 900,
}

export default function Web3Onboarding() {
  return (
    <Web3Provider>
      <Inner />
    </Web3Provider>
  )
}
