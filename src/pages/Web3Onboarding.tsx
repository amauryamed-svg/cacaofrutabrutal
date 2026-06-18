// Web3 Onboarding — 2-step flow: Connect → Sign.
// KYC (Persona) deferred to mint/redeem. ON-CHAIN + ON-RAMP both visible from step 1.
// Trust signals (Chainalysis, OFAC, Persona) surface at the exact step they matter.
// Brutalist-luxury, hex-only per CauaCore §8.

import { useEffect, useState } from 'react'
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

  useEffect(() => {
    if (!isConnected) { setStep('connect'); return }
    if (chainId !== ACTIVE_CHAIN_ID) {
      switchChain({ chainId: ACTIVE_CHAIN_ID })
    }
    if (!kyc.walletAddress || kyc.walletAddress.toLowerCase() !== address?.toLowerCase()) {
      setStep('sign')
      return
    }
    setStep('done')
  }, [isConnected, chainId, kyc.walletAddress, address, switchChain])

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

  // ── Not signed in ──────────────────────────────────────────────────────
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

  // ── Done ───────────────────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <Shell>
        <Screen>
          <Chip color={BRAND.pod}><PulseDot color={BRAND.pod} /> WALLET LINKED · READY</Chip>
          <H1>WELCOME TO<br /><span style={{ color: BRAND.pod }}>CAÚA WEB3.</span></H1>
          <Lead>Wallet vinculada y verificada. Listo para adoptar, mintear y ganar $CACAO.</Lead>

          <div style={doneGrid}>
            <div style={onchainSection}>
              <div style={sectionEyebrow(BRAND.pod)}>YOU'RE ON-CHAIN ✓</div>
              <a href="/adoptar" style={{ ...btnPrimary(BRAND.mazorca), display: 'block', textAlign: 'center' }}>
                ADOPT A TREE →
              </a>
              <p style={sectionSub}>ERC-721 on Base · árbol real en Colombia</p>
            </div>

            <div style={onrampSection}>
              <div style={sectionEyebrow(BRAND.heroic)}>ADD FUNDS VIA ONRAMP</div>
              <OnrampButton presetUsd={5} asset="USDC" label="BUY USDC WITH CARD" />
              <p style={sectionSub}>USDC via Coinbase · usa tu tarjeta · sin Persona</p>
            </div>
          </div>

          <PersonaNotice />
          <a href="/dashboard" style={dashLink}>→ Tu Dashboard</a>
        </Screen>
      </Shell>
    )
  }

  // ── Connect + Sign ─────────────────────────────────────────────────────
  const isSign = step === 'sign'
  const truncated = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : ''

  return (
    <Shell>
      <ProgressBar step={step} />
      <Screen>
        {!isSign ? (
          <>
            <Chip color={BRAND.mazorca}>● BASE · SEPOLIA</Chip>
            <JourneyStrip />
            <H1>YOUR TREE.<br /><span style={{ color: BRAND.pod }}>YOUR CHAIN.</span></H1>
            <Lead>
              Dos caminos para empezar. Conecta tu wallet on-chain, o compra USDC directo con tarjeta.
            </Lead>

            <div style={dualGrid}>
              <DualCard
                accent={BRAND.pod}
                eyebrow="ON-CHAIN · STEP 1"
                title="CONNECT YOUR WALLET"
                body="Tu identidad on Base. Gratis. No-custodial."
                pill="NON-CUSTODIAL · BASE L2"
                pillColor={BRAND.pod}
              >
                <ConnectWalletButton />
              </DualCard>

              <DualCard
                accent={BRAND.heroic}
                eyebrow="ON-RAMP · STEP 2"
                title="BUY USDC WITH CARD"
                body="Compra USDC con tarjeta. Coinbase maneja el KYC fiat."
                pill="POWERED BY COINBASE"
                pillColor={BRAND.heroic}
              >
                <OnrampButton presetUsd={5} asset="USDC" label="BUY USDC WITH CARD" />
              </DualCard>
            </div>
          </>
        ) : (
          <>
            <Chip color={BRAND.pod}>✓ CONNECTED · STEP 2 OF 2</Chip>
            <H1>SIGN ONCE.<br /><span style={{ color: BRAND.mazorca }}>OWN FOREVER.</span></H1>
            <Lead>
              Una firma prueba que eres el dueño. Nada más.{' '}
              <span style={{ color: `${BRAND.heirloom}77` }}>Sin ID requerida en este paso.</span>
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

            <ScreeningNotice />

            <button
              onClick={onSign}
              disabled={signing || linking}
              style={{ ...btnPrimary(BRAND.mazorca), opacity: signing || linking ? 0.6 : 1 }}
            >
              {signing || linking ? 'AWAITING WALLET…' : 'SIGN & LINK WALLET →'}
            </button>

            {err && <ErrBox msg={err} />}
          </>
        )}
      </Screen>
    </Shell>
  )
}

// ─── New sub-components ───────────────────────────────────────────────────

function JourneyStrip() {
  return (
    <div style={journeyWrap}>
      <div style={journeyNode}>
        <span style={{ fontSize: 18 }}>💳</span>
        <span style={journeyNodeLabel}>CARD</span>
      </div>
      <JourneyConnector color={BRAND.heroic} label="ONRAMP" />
      <div style={journeyNode}>
        <span style={{ fontSize: 18 }}>🔷</span>
        <span style={journeyNodeLabel}>USDC</span>
      </div>
      <JourneyConnector color={BRAND.pod} label="ONCHAIN" />
      <div style={journeyNode}>
        <span style={{ fontSize: 18 }}>🌱</span>
        <span style={journeyNodeLabel}>ÁRBOL NFT</span>
      </div>
    </div>
  )
}

function JourneyConnector({ color, label }: { color: string; label: string }) {
  return (
    <div style={journeyConnector}>
      <div style={{ height: 1, flex: 1, background: `${color}55` }} />
      <span style={{ ...journeyConnectorLabel, color, background: `${color}15`, borderColor: `${color}44` }}>
        {label}
      </span>
      <div style={{ height: 1, flex: 1, background: `${color}55` }} />
      <span style={{ color, fontSize: 10, marginLeft: 2, lineHeight: 1 }}>▶</span>
    </div>
  )
}

function DualCard({ accent, eyebrow, title, body, pill, pillColor, children }: {
  accent: string; eyebrow: string; title: string; body: string
  pill: string; pillColor: string; children: React.ReactNode
}) {
  return (
    <div style={dualCardBox(accent)}>
      <div style={dualCardEyebrow(accent)}>{eyebrow}</div>
      <div style={dualCardTitle}>{title}</div>
      <div style={dualCardBody}>{body}</div>
      <div style={{ margin: '16px 0 12px' }}>{children}</div>
      <div style={dualCardPill(pillColor)}>{pill}</div>
    </div>
  )
}

function ScreeningNotice() {
  const rows: { icon: string; label: string; desc: string; color: string }[] = [
    { icon: '🔍', label: 'CHAINALYSIS', desc: 'Esta dirección se escanea automáticamente', color: BRAND.heroic },
    { icon: '📋', label: 'OFAC', desc: 'Lista de sanciones — check pre-vinculación', color: BRAND.theobroma },
    { icon: '🔒', label: 'SIN CUSTODIA', desc: 'Nunca tocamos tus claves privadas', color: BRAND.pod },
  ]
  return (
    <div style={screeningBox}>
      <div style={screeningHeader}>QUÉ PASA CUANDO FIRMAS</div>
      {rows.map(r => (
        <div key={r.label} style={screeningRow}>
          <span style={{ fontSize: 13, flexShrink: 0 }}>{r.icon}</span>
          <span style={{ ...screeningLabel, color: r.color }}>{r.label}</span>
          <span style={screeningDesc}>{r.desc}</span>
        </div>
      ))}
    </div>
  )
}

function PersonaNotice() {
  return (
    <div style={personaBox}>
      <span style={personaIcon}>ⓘ</span>
      <span style={personaText}>
        Mintear tu NFT requiere verificación de identidad (Persona) — solo para acciones on-chain.
        No requerida para comprar USDC.
      </span>
    </div>
  )
}

// ─── Existing sub-components ─────────────────────────────────────────────

function ProgressBar({ step }: { step: Step }) {
  const pct = step === 'connect' ? 0 : step === 'sign' ? 50 : 100
  return (
    <div style={progressWrap}>
      <div style={progressTrack}>
        <div style={{ ...progressFill, width: `${pct}%` }} />
      </div>
      <div style={progressDots}>
        {(['connect', 'sign'] as const).map((s, i) => {
          const done = (step === 'sign' && i === 0) || step === 'done'
          const active = step === s
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
      background: color, boxShadow: `0 0 10px ${color}`,
      marginRight: 6, verticalAlign: 'middle',
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
const screenStyle: React.CSSProperties = { marginBottom: 48 }

// Progress bar
const progressWrap: React.CSSProperties = {
  position: 'relative',
  maxWidth: 240,
  margin: '0 auto 52px',
}
const progressTrack: React.CSSProperties = {
  position: 'absolute',
  top: 21, left: '20%', right: '20%',
  height: 2, background: `${BRAND.heirloom}15`, zIndex: 0,
}
const progressFill: React.CSSProperties = {
  height: '100%',
  background: `linear-gradient(90deg, ${BRAND.pod}, ${BRAND.mazorca})`,
  transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
  boxShadow: `0 0 10px ${BRAND.mazorca}66`,
}
const progressDots: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
  position: 'relative', zIndex: 1,
}
const dotCol: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
}
const dotCircle: React.CSSProperties = {
  width: 42, height: 42, borderRadius: '50%', border: '2px solid',
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
  border: '1px solid', padding: '5px 14px',
  fontFamily: FONTS.display, fontSize: 11, letterSpacing: '0.18em',
  textTransform: 'uppercase', fontWeight: 700, borderRadius: 999, marginBottom: 24,
}

// Typography
const h1Style: React.CSSProperties = {
  fontFamily: FONTS.display,
  fontSize: 'clamp(40px, 7vw, 72px)',
  fontWeight: 900, lineHeight: 1.0,
  letterSpacing: '-0.01em', textTransform: 'uppercase',
  margin: '0 0 20px 0',
}
const leadStyle: React.CSSProperties = {
  fontSize: 17, lineHeight: 1.6,
  color: `${BRAND.heirloom}cc`,
  marginBottom: 28, maxWidth: 560,
}

// Journey strip
const journeyWrap: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8,
  padding: '14px 20px',
  background: BRAND.bgCard,
  border: `1px solid ${BRAND.amazon}`,
  borderRadius: 10, marginBottom: 28, overflowX: 'auto',
}
const journeyNode: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0,
}
const journeyNodeLabel: React.CSSProperties = {
  fontFamily: FONTS.display, fontSize: 8, letterSpacing: '0.2em',
  color: `${BRAND.heirloom}77`, textTransform: 'uppercase',
}
const journeyConnector: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 4, flex: 1, minWidth: 60,
}
const journeyConnectorLabel: React.CSSProperties = {
  fontFamily: FONTS.display, fontSize: 8, letterSpacing: '0.16em', fontWeight: 700,
  textTransform: 'uppercase', flexShrink: 0,
  padding: '2px 6px', borderRadius: 3, border: '1px solid',
}

// Dual card grid (connect step)
const dualGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: 14, marginTop: 4,
}
function dualCardBox(accent: string): React.CSSProperties {
  return {
    padding: '20px 18px',
    background: BRAND.bgCard,
    borderTop: `3px solid ${accent}`,
    borderRight: `1px solid ${BRAND.amazon}`,
    borderBottom: `1px solid ${BRAND.amazon}`,
    borderLeft: `1px solid ${BRAND.amazon}`,
    borderRadius: 10,
  }
}
function dualCardEyebrow(accent: string): React.CSSProperties {
  return {
    fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.2em',
    textTransform: 'uppercase', color: accent, marginBottom: 8, fontWeight: 700,
  }
}
const dualCardTitle: React.CSSProperties = {
  fontFamily: FONTS.display, fontSize: 18, fontWeight: 900,
  letterSpacing: '0.06em', textTransform: 'uppercase',
  color: BRAND.heirloom, marginBottom: 6,
}
const dualCardBody: React.CSSProperties = {
  fontFamily: FONTS.body, fontSize: 12,
  color: `${BRAND.heirloom}77`, lineHeight: 1.5,
}
function dualCardPill(color: string): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center',
    padding: '4px 10px',
    border: `1px solid ${color}55`, color,
    background: `${color}11`,
    fontFamily: FONTS.display, fontSize: 9, fontWeight: 700,
    letterSpacing: '0.14em', textTransform: 'uppercase', borderRadius: 999,
  }
}

// Wallet preview (sign step)
const walletPreview: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
  marginTop: 28, marginBottom: 16,
  padding: '16px 20px',
  background: BRAND.bgCard, border: `1px solid ${BRAND.amazon}`, borderRadius: 12,
}
const walletPreviewLeft: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 12 }
const walletAvatar: React.CSSProperties = {
  width: 34, height: 34, borderRadius: '50%',
  background: `conic-gradient(from 0deg, ${BRAND.pod}, ${BRAND.mazorca}, ${BRAND.heroic}, ${BRAND.criollo}, ${BRAND.pod})`,
  filter: 'saturate(0.85)', flexShrink: 0, border: `1px solid ${BRAND.amazon}`,
}
const walletLabel: React.CSSProperties = {
  fontFamily: FONTS.display, fontSize: 9, letterSpacing: '0.18em',
  color: `${BRAND.heirloom}55`, textTransform: 'uppercase',
}
const walletAddr: React.CSSProperties = {
  fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: BRAND.heirloom, marginTop: 4,
}
const copyBtn: React.CSSProperties = {
  background: 'transparent', border: `1px solid ${BRAND.heirloom}33`,
  color: BRAND.heirloom, padding: '5px 12px',
  fontFamily: FONTS.display, fontSize: 10, fontWeight: 700,
  letterSpacing: '0.16em', textTransform: 'uppercase', borderRadius: 999, cursor: 'pointer',
}

// Screening notice (sign step)
const screeningBox: React.CSSProperties = {
  marginBottom: 20,
  padding: '14px 16px',
  background: BRAND.bgCard, border: `1px solid ${BRAND.amazon}`, borderRadius: 8,
}
const screeningHeader: React.CSSProperties = {
  fontFamily: FONTS.display, fontSize: 9, letterSpacing: '0.2em',
  color: `${BRAND.heirloom}44`, textTransform: 'uppercase', marginBottom: 10,
}
const screeningRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10,
  paddingTop: 8, borderTop: `1px solid ${BRAND.amazon}55`,
}
const screeningLabel: React.CSSProperties = {
  fontFamily: FONTS.display, fontSize: 10, fontWeight: 700, letterSpacing: '0.16em',
  textTransform: 'uppercase', flexShrink: 0, minWidth: 90,
}
const screeningDesc: React.CSSProperties = {
  fontFamily: FONTS.body, fontSize: 12, color: `${BRAND.heirloom}66`,
}

// Done state sections
const doneGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: 14, marginTop: 28, marginBottom: 20,
}
const onchainSection: React.CSSProperties = {
  padding: '20px 18px', background: BRAND.bgCard,
  borderTop: `1px solid ${BRAND.amazon}`,
  borderRight: `1px solid ${BRAND.amazon}`,
  borderBottom: `1px solid ${BRAND.amazon}`,
  borderLeft: `3px solid ${BRAND.pod}`,
  borderRadius: 8,
}
const onrampSection: React.CSSProperties = {
  padding: '20px 18px', background: BRAND.bgCard,
  borderTop: `1px solid ${BRAND.amazon}`,
  borderRight: `1px solid ${BRAND.amazon}`,
  borderBottom: `1px solid ${BRAND.amazon}`,
  borderLeft: `3px solid ${BRAND.heroic}`,
  borderRadius: 8,
}
function sectionEyebrow(color: string): React.CSSProperties {
  return {
    fontFamily: FONTS.display, fontSize: 9, letterSpacing: '0.2em', fontWeight: 700,
    textTransform: 'uppercase', color, marginBottom: 12,
  }
}
const sectionSub: React.CSSProperties = {
  fontFamily: FONTS.body, fontSize: 12, color: `${BRAND.heirloom}55`, marginTop: 8, lineHeight: 1.4,
}

// Persona notice (done state)
const personaBox: React.CSSProperties = {
  display: 'flex', alignItems: 'flex-start', gap: 10,
  padding: '12px 16px',
  background: `${BRAND.mazorca}0A`,
  borderLeft: `2px solid ${BRAND.mazorca}66`,
  borderRadius: 6, marginBottom: 16,
}
const personaIcon: React.CSSProperties = {
  fontFamily: FONTS.display, fontSize: 13, color: BRAND.mazorca, flexShrink: 0, lineHeight: 1.6,
}
const personaText: React.CSSProperties = {
  fontFamily: FONTS.body, fontSize: 12, color: `${BRAND.heirloom}77`, lineHeight: 1.5,
}

// Dashboard text link
const dashLink: React.CSSProperties = {
  display: 'inline-block',
  fontFamily: FONTS.display, fontSize: 11, letterSpacing: '0.14em',
  color: `${BRAND.heirloom}55`, textDecoration: 'none', textTransform: 'uppercase',
}

// Primary button
function btnPrimary(color: string): React.CSSProperties {
  return {
    background: color, color: BRAND.bgDeep, border: 'none',
    padding: '14px 24px',
    fontFamily: FONTS.display, fontSize: 14, fontWeight: 900,
    letterSpacing: '0.14em', textTransform: 'uppercase',
    cursor: 'pointer', textDecoration: 'none',
    display: 'inline-block', borderRadius: 2,
    transition: 'opacity 0.2s', marginBottom: 8,
  }
}

// Error
const errBox: React.CSSProperties = {
  marginTop: 14, padding: '12px 16px',
  background: `${BRAND.theobroma}15`, border: `1px solid ${BRAND.theobroma}55`,
  color: BRAND.theobroma, fontSize: 13, borderRadius: 8,
}

export default function Web3Onboarding() {
  return (
    <Web3Provider>
      <Inner />
    </Web3Provider>
  )
}
