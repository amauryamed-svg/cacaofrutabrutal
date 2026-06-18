// Web3 Onboarding — 2-step flow: Connect → Sign.
// KYC (Persona) is deferred to mint/redeem — no blocker here.
// Brutalist-luxury, hex-only per CauaCore §8.

import { useEffect, useState, useRef } from 'react'
import { useAccount, useChainId, useSignMessage, useSwitchChain } from 'wagmi'
import Web3Provider from '../components/web3/Web3Provider'
import ConnectWalletButton from '../components/web3/ConnectWalletButton'
import OnrampButton from '../components/web3/OnrampButton'
import { useKYCStatus } from '../hooks/useKYCStatus'
import { useAuth } from '../context/AuthContext'
import { BRAND, FONTS, ACTIVE_CHAIN_ID } from '../utils/constants'
import { buildSiweMessage, linkWallet, requestNonce } from '../lib/web3/siwe'

type Step = 'connect' | 'sign' | 'done'

function useMounted() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  return mounted
}

function Inner() {
  const { userId } = useAuth()
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const { signMessageAsync, isPending: signing } = useSignMessage()
  const kyc = useKYCStatus()

  const [step, setStep] = useState<Step>('connect')
  const [linking, setLinking] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const prevStep = useRef<Step>('connect')

  // Auto-advance step based on wallet + kyc state
  useEffect(() => {
    if (!isConnected) { setStep('connect'); return }
    // Auto-switch chain silently — no explicit step needed
    if (chainId !== ACTIVE_CHAIN_ID) {
      switchChain({ chainId: ACTIVE_CHAIN_ID })
    }
    if (!kyc.walletAddress || kyc.walletAddress.toLowerCase() !== address?.toLowerCase()) {
      setStep('sign')
      return
    }
    setStep('done')
  }, [isConnected, chainId, kyc.walletAddress, address, switchChain])

  useEffect(() => { prevStep.current = step }, [step])

  async function onSign() {
    if (!address) return
    setLinking(true)
    setErr(null)
    try {
      const { nonce } = await requestNonce()
      const message = buildSiweMessage({ address, chainId: ACTIVE_CHAIN_ID, nonce })
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

  if (!userId) {
    return (
      <Shell>
        <Screen>
          <Chip color={BRAND.theobroma}>● NOT SIGNED IN</Chip>
          <H1>SIGN IN FIRST.</H1>
          <Lead>You need a Caúa account before linking a wallet.</Lead>
          <a href="/auth" style={btnPrimary(BRAND.mazorca)}>GO TO SIGN-IN →</a>
        </Screen>
      </Shell>
    )
  }

  if (step === 'done') {
    return (
      <Shell>
        <Screen>
          <Chip color={BRAND.pod}><PulseDot color={BRAND.pod} /> WALLET LINKED · READY</Chip>
          <H1>WELCOME TO<br /><span style={{ color: BRAND.pod }}>CAÚA WEB3.</span></H1>
          <Lead>Wallet linked and screened. Ready to adopt trees, mint NFTs, and earn $CACAO.</Lead>

          <div style={doneGrid}>
            <ActionCard
              href="/adoptar"
              accent={BRAND.pod}
              label="ADOPT A TREE"
              sub="ERC-721 on Base · real cacao tree"
              icon="🌱"
            />
            <ActionCard
              accent={BRAND.heroic}
              label="BUY USDC"
              sub="Fiat → USDC via Coinbase"
              icon="💳"
              cta={<OnrampButton presetUsd={5} asset="USDC" label="BUY USDC WITH CARD" />}
            />
            <ActionCard
              href="/dashboard"
              accent={BRAND.mazorca}
              label="YOUR DASHBOARD"
              sub="Trees · beans · mazorcas"
              icon="🫘"
            />
          </div>

          <WalletCard address={address!} chainId={chainId} onCopy={copyAddress} copied={copied} />
          <CompliancePills />
        </Screen>
      </Shell>
    )
  }

  const isSign = step === 'sign'
  const truncated = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : ''

  return (
    <Shell>
      {/* ── Progress indicator ── */}
      <ProgressBar step={step} />

      <Screen>
        {!isSign ? (
          <>
            <Chip color={BRAND.mazorca}>● STEP 1 OF 2 · CONNECT</Chip>
            <H1>YOUR TREE.<br /><span style={{ color: BRAND.pod }}>YOUR CHAIN.</span></H1>
            <Lead>Connect your wallet to adopt a real cacao tree as an ERC-721 on Base. One connection. Yours forever.</Lead>

            <div style={{ marginTop: 32, maxWidth: 360 }}>
              <ConnectWalletButton />
            </div>

            <p style={subCopy}>
              Coinbase Smart Wallet · MetaMask · Rainbow · any WalletConnect wallet
            </p>
          </>
        ) : (
          <>
            <Chip color={BRAND.pod}>✓ CONNECTED · STEP 2 OF 2</Chip>
            <H1>SIGN ONCE.<br /><span style={{ color: BRAND.mazorca }}>OWN FOREVER.</span></H1>
            <Lead>
              One signature proves wallet ownership. We screen against OFAC + Chainalysis before linking.{' '}
              <span style={{ color: `${BRAND.heirloom}77` }}>No ID required at this step.</span>
            </Lead>

            <div style={walletPreview}>
              <div style={walletPreviewLeft}>
                <div style={walletAvatar} />
                <div>
                  <div style={walletLabel}>CONNECTED WALLET</div>
                  <div style={walletAddr}>{truncated}</div>
                </div>
              </div>
              <button onClick={copyAddress} style={copyBtn}>
                {copied ? '✓' : 'COPY'}
              </button>
            </div>

            <button
              onClick={onSign}
              disabled={signing || linking}
              style={{ ...btnPrimary(BRAND.mazorca), marginTop: 24, opacity: signing || linking ? 0.6 : 1 }}
            >
              {signing || linking ? 'AWAITING WALLET…' : 'SIGN & LINK WALLET →'}
            </button>

            {err && <ErrBox msg={err} />}
          </>
        )}
      </Screen>

      <CompliancePills />
    </Shell>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────

function ProgressBar({ step }: { step: Step }) {
  const pct = step === 'connect' ? 0 : step === 'sign' ? 50 : 100
  return (
    <div style={progressWrap}>
      <div style={progressTrack}>
        <div style={{ ...progressFill, width: `${pct}%` }} />
      </div>
      <div style={progressDots}>
        {(['connect', 'sign'] as const).map((s, i) => {
          const done    = (step === 'sign' && i === 0) || step === 'done'
          const active  = step === s
          return (
            <div key={s} style={dotCol}>
              <div style={{
                ...dotCircle,
                background: done ? BRAND.pod : active ? BRAND.mazorca : BRAND.bgDark,
                borderColor: done ? BRAND.pod : active ? BRAND.mazorca : `${BRAND.heirloom}22`,
                boxShadow: active ? `0 0 18px ${BRAND.mazorca}66` : done ? `0 0 12px ${BRAND.pod}44` : 'none',
              }}>
                {done ? '✓' : i + 1}
              </div>
              <div style={{ ...dotLabel, color: done || active ? BRAND.heirloom : `${BRAND.heirloom}44` }}>
                {s === 'connect' ? 'CONNECT' : 'LINK'}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Chip({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <div style={{ ...chip, borderColor: `${color}66`, color }}>
      {children}
    </div>
  )
}

function PulseDot({ color }: { color: string }) {
  return (
    <span style={{
      display: 'inline-block',
      width: 7, height: 7, borderRadius: '50%',
      background: color,
      boxShadow: `0 0 10px ${color}`,
      marginRight: 6,
      verticalAlign: 'middle',
    }} />
  )
}

function H1({ children }: { children: React.ReactNode }) {
  return <h1 style={h1Style}>{children}</h1>
}

function Lead({ children }: { children: React.ReactNode }) {
  return <p style={leadStyle}>{children}</p>
}

function Shell({ children }: { children: React.ReactNode }) {
  const mounted = useMounted()
  return (
    <main style={shellStyle}>
      <div style={{
        ...shellInner,
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(16px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
      }}>
        {children}
      </div>
    </main>
  )
}

function Screen({ children }: { children: React.ReactNode }) {
  return <div style={screenStyle}>{children}</div>
}

function WalletCard({ address, chainId, onCopy, copied }: { address: string; chainId: number; onCopy: () => void; copied: boolean }) {
  const truncated = `${address.slice(0, 6)}…${address.slice(-4)}`
  const onBase = chainId === ACTIVE_CHAIN_ID
  return (
    <div style={walletCard}>
      <div style={walletPreviewLeft}>
        <div style={walletAvatar} />
        <div>
          <div style={walletLabel}>LINKED WALLET</div>
          <div style={walletAddr}>{truncated}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={onCopy} style={copyBtn}>{copied ? '✓ COPIED' : 'COPY'}</button>
        <div style={{
          ...chainBadge,
          borderColor: onBase ? `${BRAND.pod}88` : `${BRAND.theobroma}88`,
          color: onBase ? BRAND.pod : BRAND.theobroma,
        }}>
          {onBase ? `BASE · ${chainId}` : `WRONG CHAIN · ${chainId}`}
        </div>
      </div>
    </div>
  )
}

function ActionCard({ href, accent, label, sub, icon, cta }: {
  href?: string; accent: string; label: string; sub: string; icon: string; cta?: React.ReactNode
}) {
  const inner = (
    <div style={actionCard(accent)}>
      <div style={{ fontSize: 28, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontFamily: FONTS.display, fontSize: 13, letterSpacing: '0.12em', fontWeight: 900, color: BRAND.heirloom, marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: FONTS.body, fontSize: 12, color: `${BRAND.heirloom}77`, lineHeight: 1.4 }}>{sub}</div>
      {cta && <div style={{ marginTop: 14 }}>{cta}</div>}
    </div>
  )
  return href ? <a href={href} style={{ textDecoration: 'none' }}>{inner}</a> : inner
}

function CompliancePills() {
  const pills = [
    { label: 'CHAINALYSIS', color: BRAND.heroic },
    { label: 'OFAC PRE-WRITE', color: BRAND.theobroma },
    { label: 'NON-CUSTODIAL', color: BRAND.pod },
    { label: 'BASE · L2', color: BRAND.mazorca },
  ]
  return (
    <div style={pillsWrap}>
      <div style={pillsLabel}>SECURITY</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {pills.map(p => (
          <span key={p.label} style={pill(p.color)}>{p.label}</span>
        ))}
      </div>
    </div>
  )
}

function ErrBox({ msg }: { msg: string }) {
  return (
    <div style={errBox}>
      <span style={{ fontFamily: FONTS.display, fontSize: 10, letterSpacing: '0.18em', fontWeight: 900 }}>ERROR · </span>
      {msg}
    </div>
  )
}

// ─── Styles (hex-only per CauaCore §8) ─────────────────────────────────

const shellStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: BRAND.bgDeep,
  color: BRAND.heirloom,
  fontFamily: FONTS.body,
  paddingTop: 96,
  paddingBottom: 80,
}
const shellInner: React.CSSProperties = {
  maxWidth: 700,
  margin: '0 auto',
  padding: '0 clamp(20px, 4vw, 32px)',
}
const screenStyle: React.CSSProperties = {
  marginBottom: 48,
}

// Progress
const progressWrap: React.CSSProperties = {
  position: 'relative',
  marginBottom: 52,
  maxWidth: 240,
  margin: '0 auto 52px',
}
const progressTrack: React.CSSProperties = {
  position: 'absolute',
  top: 21,
  left: '20%',
  right: '20%',
  height: 2,
  background: `${BRAND.heirloom}15`,
  zIndex: 0,
}
const progressFill: React.CSSProperties = {
  height: '100%',
  background: `linear-gradient(90deg, ${BRAND.pod}, ${BRAND.mazorca})`,
  transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
  boxShadow: `0 0 10px ${BRAND.mazorca}66`,
}
const progressDots: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 8,
  position: 'relative',
  zIndex: 1,
}
const dotCol: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
}
const dotCircle: React.CSSProperties = {
  width: 42, height: 42, borderRadius: '50%',
  border: '2px solid',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: FONTS.display, fontWeight: 900, fontSize: 15,
  transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
}
const dotLabel: React.CSSProperties = {
  fontFamily: FONTS.display, fontSize: 9, letterSpacing: '0.18em',
  textTransform: 'uppercase', transition: 'color 0.3s',
}

// Chip
const chip: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  border: '1px solid',
  padding: '5px 14px',
  fontFamily: FONTS.display, fontSize: 11, letterSpacing: '0.18em',
  textTransform: 'uppercase', fontWeight: 700,
  borderRadius: 999,
  marginBottom: 24,
}

// Typography
const h1Style: React.CSSProperties = {
  fontFamily: FONTS.display,
  fontSize: 'clamp(40px, 7vw, 72px)',
  fontWeight: 900,
  lineHeight: 1.0,
  letterSpacing: '-0.01em',
  textTransform: 'uppercase',
  margin: '0 0 20px 0',
}
const leadStyle: React.CSSProperties = {
  fontSize: 17,
  lineHeight: 1.6,
  color: `${BRAND.heirloom}cc`,
  marginBottom: 0,
  maxWidth: 560,
}
const subCopy: React.CSSProperties = {
  marginTop: 16,
  fontFamily: FONTS.body,
  fontSize: 12,
  color: `${BRAND.heirloom}55`,
  letterSpacing: '0.06em',
}

// Wallet preview (sign step)
const walletPreview: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  gap: 12,
  marginTop: 28,
  padding: '16px 20px',
  background: BRAND.bgCard,
  border: `1px solid ${BRAND.amazon}`,
  borderRadius: 12,
}
const walletPreviewLeft: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 12,
}
const walletAvatar: React.CSSProperties = {
  width: 34, height: 34, borderRadius: '50%',
  background: `conic-gradient(from 0deg, ${BRAND.pod}, ${BRAND.mazorca}, ${BRAND.heroic}, ${BRAND.criollo}, ${BRAND.pod})`,
  filter: 'saturate(0.85)',
  flexShrink: 0,
  border: `1px solid ${BRAND.amazon}`,
}
const walletLabel: React.CSSProperties = {
  fontFamily: FONTS.display, fontSize: 9, letterSpacing: '0.18em',
  color: `${BRAND.heirloom}55`, textTransform: 'uppercase',
}
const walletAddr: React.CSSProperties = {
  fontFamily: 'monospace', fontSize: 14, fontWeight: 700,
  color: BRAND.heirloom, marginTop: 4,
}
const copyBtn: React.CSSProperties = {
  background: 'transparent',
  border: `1px solid ${BRAND.heirloom}33`,
  color: BRAND.heirloom,
  padding: '5px 12px',
  fontFamily: FONTS.display, fontSize: 10, fontWeight: 700,
  letterSpacing: '0.16em', textTransform: 'uppercase',
  borderRadius: 999, cursor: 'pointer',
}

// Wallet card (done state)
const walletCard: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  flexWrap: 'wrap', gap: 12,
  padding: '16px 20px',
  background: BRAND.bgCard,
  border: `1px solid ${BRAND.amazon}`,
  borderRadius: 12,
  marginTop: 28, marginBottom: 28,
}
const chainBadge: React.CSSProperties = {
  fontFamily: FONTS.display, fontSize: 10, fontWeight: 700,
  letterSpacing: '0.14em',
  padding: '5px 12px',
  border: '1px solid',
  borderRadius: 999,
  textTransform: 'uppercase',
}

// Done grid
const doneGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 14,
  marginTop: 32,
}
function actionCard(accent: string): React.CSSProperties {
  return {
    padding: '22px 18px',
    background: BRAND.bgCard,
    border: `1px solid ${accent}44`,
    borderTop: `3px solid ${accent}`,
    borderRadius: 10,
    cursor: 'pointer',
    transition: 'border-color 0.2s, transform 0.15s',
  }
}

// Buttons
function btnPrimary(color: string): React.CSSProperties {
  return {
    background: color,
    color: BRAND.bgDeep,
    border: 'none',
    padding: '15px 28px',
    fontFamily: FONTS.display,
    fontSize: 14, fontWeight: 900,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-block',
    borderRadius: 2,
    transition: 'opacity 0.2s',
  }
}

// Compliance pills
const pillsWrap: React.CSSProperties = {
  marginTop: 40,
  paddingTop: 20,
  borderTop: `1px solid ${BRAND.amazon}55`,
}
const pillsLabel: React.CSSProperties = {
  fontFamily: FONTS.display, fontSize: 9, letterSpacing: '0.2em',
  color: `${BRAND.heirloom}44`, textTransform: 'uppercase',
  marginBottom: 10,
}
function pill(color: string): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center',
    padding: '5px 11px',
    border: `1px solid ${color}55`,
    color, background: `${color}11`,
    fontFamily: FONTS.display, fontSize: 10, fontWeight: 700,
    letterSpacing: '0.14em', textTransform: 'uppercase',
    borderRadius: 999,
  }
}

// Error
const errBox: React.CSSProperties = {
  marginTop: 14,
  padding: '12px 16px',
  background: `${BRAND.theobroma}15`,
  border: `1px solid ${BRAND.theobroma}55`,
  color: BRAND.theobroma,
  fontSize: 13,
  borderRadius: 8,
}

export default function Web3Onboarding() {
  return (
    <Web3Provider>
      <Inner />
    </Web3Provider>
  )
}
