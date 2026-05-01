// English-first Web3 landing — targeted at Austin TX cryptobros + global cacao crypto crowd.
// Reuses the standalone vanilla Three.js scene at /investor-3d.js for the hero.
// Brutalist-luxury palette, hex-only per CauaCore §8.

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import Web3Provider from '../components/web3/Web3Provider'
import ConnectWalletButton from '../components/web3/ConnectWalletButton'
import OnrampButton from '../components/web3/OnrampButton'
import {
  BRAND, FONTS,
  BASE_CHAIN_ID, MAZORCA_TO_CACAO_RATE, CACAO_TOTAL_SUPPLY_CAP, ADOPTION_SPLIT_BPS,
} from '../utils/constants'

// ─── Motion primitives ───────────────────────────────────────────────

// IntersectionObserver-based reveal: fade + translateY when the element enters viewport.
// Disconnects after first reveal — landing pages don't need re-trigger logic.
function useInView<T extends Element>(rootMargin = '0px 0px -10% 0px'): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || inView) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setInView(true)
          io.disconnect()
        }
      },
      { rootMargin, threshold: 0.15 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [inView, rootMargin])
  return [ref, inView]
}

function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const [ref, inView] = useInView<HTMLDivElement>()
  return (
    <div
      ref={ref}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

// Animate a numeric stat from 0 to target when scrolled into view.
// Supports suffix (%, M, :1) by accepting a formatter.
function CountUp({ to, suffix = '', durationMs = 1400 }: { to: number; suffix?: string; durationMs?: number }) {
  const [ref, inView] = useInView<HTMLSpanElement>()
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!inView) return
    const start = performance.now()
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / durationMs)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(to * eased * 100) / 100)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, to, durationMs])
  // Friendlier display: integers shown without decimal, decimals trimmed
  const display = useMemo(() => {
    if (Number.isInteger(to)) return Math.round(val).toString()
    return val.toFixed(1)
  }, [val, to])
  return <span ref={ref}>{display}{suffix}</span>
}

// ─── Pillar icons (brutalist line glyphs, 1.5px stroke) ──────────────

function IconTree({ color }: { color: string }) {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 4 C 10 9 8 13 8 17 a 8 8 0 0 0 16 0 c 0 -4 -2 -8 -8 -13 z" />
      <path d="M16 17 v 11" />
      <path d="M16 21 l -3 -3" /><path d="M16 24 l 3 -3" />
    </svg>
  )
}
function IconBolt({ color }: { color: string }) {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 4 L 8 18 H 15 L 14 28 L 24 14 H 17 L 18 4 Z" />
    </svg>
  )
}
function IconSensor({ color }: { color: string }) {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="16" cy="16" r="3" />
      <path d="M22 10 a 8 8 0 0 1 0 12" /><path d="M10 22 a 8 8 0 0 1 0 -12" />
      <path d="M26 6 a 14 14 0 0 1 0 20" /><path d="M6 26 a 14 14 0 0 1 0 -20" />
    </svg>
  )
}
function IconScale({ color }: { color: string }) {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 4 v 24" />
      <path d="M8 28 h 16" />
      <path d="M16 8 L 6 16 a 5 5 0 0 0 10 0 z" />
      <path d="M16 8 L 26 16 a 5 5 0 0 1 -10 0 z" />
    </svg>
  )
}
const PILLAR_ICONS: Record<string, React.ComponentType<{ color: string }>> = {
  '01': IconTree,
  '02': IconBolt,
  '03': IconSensor,
  '04': IconScale,
}

// ─── Content data ────────────────────────────────────────────────────

interface Pillar { num: string; title: string; body: string; accent: string }

const PILLARS: Pillar[] = [
  {
    num: '01', accent: BRAND.pod,
    title: 'A REAL TREE',
    body: 'ERC-721 on Base. GPS-hashed to a real Guardian-cultivated tree in Colombia. Transferable, tradable on OpenSea / Zora.',
  },
  {
    num: '02', accent: BRAND.mazorca,
    title: 'GAMEPLAY YIELD',
    body: `Burn ${MAZORCA_TO_CACAO_RATE} mazorcas earned via care → mint 1 $CACAO. Capped at ${(Number(CACAO_TOTAL_SUPPLY_CAP) / 1_000_000).toString()}M. Earn-only.`,
  },
  {
    num: '03', accent: BRAND.heroic,
    title: 'ATTESTED DATA',
    body: "ESP32 + Ed25519-signed sensor readings, Merkle-rooted weekly on Base. Your tree's climate is verifiable on-chain.",
  },
  {
    num: '04', accent: BRAND.criollo,
    title: 'GUARDIAN-FIRST SPLITS',
    body: `${ADOPTION_SPLIT_BPS.guardian / 100}% of every adoption goes to the Guardian wallet atomically. ${ADOPTION_SPLIT_BPS.treasury / 100}% treasury · ${ADOPTION_SPLIT_BPS.protocol / 100}% protocol.`,
  },
]

interface Step { num: string; title: string; body: string }

const STEPS: Step[] = [
  { num: '01', title: 'CONNECT', body: 'Coinbase Smart Wallet, MetaMask, or any WalletConnect-enabled wallet.' },
  { num: '02', title: 'KYC + LINK',  body: 'Persona KYC + sign-in-with-Ethereum to link a screened wallet.' },
  { num: '03', title: 'ADOPT',       body: 'Adopt a tree on Base in USDC, ETH, or cbBTC. Splits settle atomically.' },
  { num: '04', title: 'CARE',        body: 'Daily on-chain care actions earn beans + mazorcas. Rarity moves with stewardship.' },
  { num: '05', title: 'BURN → $CACAO', body: `Burn ${MAZORCA_TO_CACAO_RATE} mazorcas → claim 1 $CACAO. EIP-712 signed. 30-day cooldown.` },
]

interface Pill { label: string; tone: string }

const COMPLIANCE_PILLS: Pill[] = [
  { label: 'PERSONA KYC',         tone: BRAND.pod },
  { label: 'CHAINALYSIS SCREENING', tone: BRAND.heroic },
  { label: 'OFAC PRE-WRITE',      tone: BRAND.theobroma },
  { label: 'TEXAS MSA · MERCHANT', tone: BRAND.mazorca },
  { label: 'GEO-BLOCKED',         tone: BRAND.criollo },
]

interface HeroStat { numericValue: number; suffix: string; label: string; accent: string }

const HERO_STATS: HeroStat[] = [
  { numericValue: ADOPTION_SPLIT_BPS.guardian / 100,             suffix: '%',  label: 'TO GUARDIAN, ATOMIC',     accent: BRAND.pod },
  { numericValue: MAZORCA_TO_CACAO_RATE,                          suffix: ':1', label: 'MAZORCAS → $CACAO',       accent: BRAND.mazorca },
  { numericValue: Number(CACAO_TOTAL_SUPPLY_CAP) / 1_000_000,    suffix: 'M',  label: 'TOTAL SUPPLY CAP',        accent: BRAND.heroic },
  { numericValue: 0,                                              suffix: '%',  label: 'PRESALE · ICO · INSIDER', accent: BRAND.theobroma },
]

// ─── Page ────────────────────────────────────────────────────────────

function Inner() {
  // Lazy-load the standalone Three.js hero (already used by /public/investor-landing.html).
  // The builder script must load BEFORE investor-3d.js — we use a sequential pattern
  // (script.onload) instead of two parallel async tags. Bails if either fails (graceful degrade).
  useEffect(() => {
    const builder = document.createElement('script')
    builder.src = '/cacao-tree-builder.js'
    let scene: HTMLScriptElement | null = null
    builder.onload = () => {
      scene = document.createElement('script')
      scene.src = '/investor-3d.js'
      document.head.appendChild(scene)
    }
    document.head.appendChild(builder)
    return () => {
      try { document.head.removeChild(builder) } catch { /* already gone */ }
      if (scene) { try { document.head.removeChild(scene) } catch { /* already gone */ } }
    }
  }, [])

  return (
    <main style={pageStyle}>
      {/* 3D hero canvas — full viewport, behind everything */}
      <canvas id="gl-canvas" style={canvasStyle} aria-hidden="true" />
      {/* Vignette overlay so type stays legible over the 3D scene */}
      <div style={vignetteStyle} aria-hidden="true" />

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section style={heroStyle}>
        <Reveal>
          <div style={chipStyle}>
            <span style={chipDotStyle} />
            BASE · CHAIN {BASE_CHAIN_ID}
          </div>
        </Reveal>
        <Reveal delay={120}>
          <h1 style={h1Style}>
            OWN A CACAO TREE.<br/>
            <span style={{ color: BRAND.mazorca }}>EARN $CACAO.</span> ON BASE.
          </h1>
        </Reveal>
        <Reveal delay={240}>
          <p style={leadStyle}>
            Caúa is a regenerative-finance protocol where every adopted tree is a real ERC-721 on Base,
            every care action moves rarity, and every redeem mints a utility token earned exclusively
            through gameplay.
          </p>
        </Reveal>
        <Reveal delay={360}>
          <div style={ctaRowStyle}>
            <ConnectWalletButton />
            <OnrampButton presetUsd={5} asset="USDC" />
          </div>
          <p style={fineStyle}>
            KYC required for mint and redemption · Charter:{' '}
            <a href="/docs/CHARTER.md" style={linkStyle}>read</a> · Compliance:{' '}
            <a href="/docs/COMPLIANCE.md" style={linkStyle}>read</a>
          </p>
        </Reveal>

        {/* Scroll indicator */}
        <div style={scrollIndicatorStyle} aria-hidden="true">
          <span style={scrollLabelStyle}>SCROLL</span>
          <span style={scrollLineStyle} />
        </div>
      </section>

      {/* ── Hero stats strip ─────────────────────────────────── */}
      <section style={statsStripStyle}>
        {HERO_STATS.map((s, i) => (
          <div key={i} style={statBoxStyle(i === HERO_STATS.length - 1)}>
            <div style={statValueStyle(s.accent)}>
              <CountUp to={s.numericValue} suffix={s.suffix} />
            </div>
            <div style={statLabelStyle}>{s.label}</div>
          </div>
        ))}
      </section>

      {/* ── Pillars ─────────────────────────────────────────── */}
      <section style={sectionStyle}>
        <Reveal>
          <div style={sectionEyebrowStyle}>01 · WHAT YOU OWN</div>
          <h2 style={h2Style}>FOUR THINGS, ALL ON-CHAIN.</h2>
        </Reveal>
        <div style={pillarsGridStyle}>
          {PILLARS.map((p, i) => (
            <Reveal key={p.num} delay={i * 80}>
              <PillarCard pillar={p} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────── */}
      <section style={{ ...sectionStyle, paddingTop: 32 }}>
        <Reveal>
          <div style={sectionEyebrowStyle}>02 · HOW IT WORKS</div>
          <h2 style={h2Style}>FIVE STEPS. NO MIDDLEMEN.</h2>
        </Reveal>
        <div style={stepsRailStyle}>
          {STEPS.map((s, i) => (
            <Reveal key={s.num} delay={i * 80}>
              <div style={stepCardStyle(i === STEPS.length - 1)}>
                <div style={stepNumStyle}>{s.num}</div>
                <div style={stepTitleStyle}>{s.title}</div>
                <p style={stepBodyStyle}>{s.body}</p>
                {i < STEPS.length - 1 && (
                  <div style={stepArrowStyle} aria-hidden="true">→</div>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Charter ribbon ──────────────────────────────────── */}
      <section style={charterStyle}>
        <div style={charterAccentStyle} aria-hidden="true" />
        <Reveal>
          <div style={charterContentStyle}>
            <div style={sectionEyebrowStyle}>03 · THE CACAO COVENANT</div>
            <p style={pullQuoteStyle}>
              "No founder mint outside gameplay. No presale. No ICO.
              Liquidity seeds Uniswap v3 only after audit, with LP timelocked 12 months on-chain."
            </p>
            <div style={ctaRowStyle}>
              <a href="/docs/CHARTER.md" style={btnStyle}>READ THE CHARTER →</a>
              <a href="/docs/AUDIT.md" style={btnGhostStyle}>AUDIT POSTURE</a>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Compliance / Austin ─────────────────────────────── */}
      <section style={sectionStyle}>
        <Reveal>
          <div style={sectionEyebrowStyle}>04 · BUILT FOR AUSTIN ReFi</div>
          <h2 style={h2Style}>COMPLIANT BY DESIGN.</h2>
          <p style={leadStyle}>
            We launch publicly with the Austin ReFi community. Every linked address is screened
            before any on-chain write. We are merchant, not transmitter.
          </p>
          <div style={pillsRowStyle}>
            {COMPLIANCE_PILLS.map(p => (
              <span key={p.label} style={pillStyle(p.tone)}>{p.label}</span>
            ))}
          </div>
          <div style={{ ...ctaRowStyle, marginTop: 32 }}>
            <a href="/app/web3/onboarding" style={btnStyle}>START WEB3 ONBOARDING →</a>
            <a href="/docs/LEGAL.md" style={btnGhostStyle}>LEGAL POSTURE</a>
          </div>
        </Reveal>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer style={footerStyle}>
        <div style={footerInnerStyle}>
          <div style={footerLogoStyle}>CAÚA · ON-CHAIN CACAO</div>
          <div style={footerLinksStyle}>
            <a href="/docs/CHARTER.md"    style={linkStyle}>CHARTER</a>
            <a href="/docs/COMPLIANCE.md" style={linkStyle}>COMPLIANCE</a>
            <a href="/docs/AUDIT.md"      style={linkStyle}>AUDIT</a>
            <a href="/docs/LEGAL.md"      style={linkStyle}>LEGAL</a>
            <a href="/docs/SECURITY.md"   style={linkStyle}>SECURITY</a>
          </div>
        </div>
        <div style={footerFineStyle}>
          © {new Date().getFullYear()} CauaCorp. Charter governs · Smart contract risk: see{' '}
          <a href="/docs/LEGAL.md" style={linkStyle}>LEGAL.md</a>.
        </div>
      </footer>
    </main>
  )
}

function PillarCard({ pillar }: { pillar: Pillar }) {
  const Icon = PILLAR_ICONS[pillar.num]
  return (
    <div
      style={{ ...pillarStyle, borderTop: `2px solid ${pillar.accent}` }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.boxShadow = `0 18px 40px rgba(0,0,0,0.45), 0 0 0 1px ${pillar.accent}55`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <div style={pillarIconRowStyle}>
        {Icon && <Icon color={pillar.accent} />}
        <div style={{ ...pillarNumStyle, color: pillar.accent }}>{pillar.num}</div>
      </div>
      <div style={pillarTitleStyle}>{pillar.title}</div>
      <p style={pillarBodyStyle}>{pillar.body}</p>
    </div>
  )
}

// ─── Styles (hex-only per CauaCore §8) ───────────────────────────────

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: BRAND.bgDeep,
  color: BRAND.heirloom,
  fontFamily: FONTS.body,
  position: 'relative',
}
const canvasStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  width: '100vw',
  height: '100vh',
  zIndex: 0,
  pointerEvents: 'none',
}
const vignetteStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 1,
  pointerEvents: 'none',
  background: `radial-gradient(ellipse at 50% 30%, rgba(4,12,6,0) 0%, rgba(4,12,6,0.55) 60%, rgba(4,12,6,0.92) 100%)`,
}
const heroStyle: React.CSSProperties = {
  position: 'relative',
  zIndex: 2,
  padding: 'clamp(96px, 16vh, 160px) clamp(20px, 4vw, 32px) clamp(64px, 10vh, 96px)',
  maxWidth: 1080,
  margin: '0 auto',
}
const chipStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  border: `1px solid ${BRAND.pod}`,
  color: BRAND.pod,
  padding: '7px 14px',
  fontFamily: FONTS.display,
  fontSize: 11,
  letterSpacing: '0.2em',
  marginBottom: 28,
  textTransform: 'uppercase',
  borderRadius: 999,
  background: `${BRAND.bgDeep}cc`,
  backdropFilter: 'blur(6px)',
}
const chipDotStyle: React.CSSProperties = {
  width: 7, height: 7, borderRadius: '50%',
  background: BRAND.pod,
  boxShadow: `0 0 10px ${BRAND.pod}`,
}
const h1Style: React.CSSProperties = {
  fontFamily: FONTS.display,
  fontSize: 'clamp(40px, 7.5vw, 88px)',
  lineHeight: 1.02,
  letterSpacing: '-0.005em',
  margin: '0 0 28px 0',
  textTransform: 'uppercase',
  fontWeight: 900,
}
const leadStyle: React.CSSProperties = {
  fontSize: 'clamp(15px, 1.4vw, 18px)',
  lineHeight: 1.6,
  maxWidth: 720,
  marginBottom: 28,
  color: `${BRAND.heirloom}cc`,
}
const ctaRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  flexWrap: 'wrap',
  marginBottom: 16,
}
const fineStyle: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.06em',
  color: `${BRAND.heirloom}66`,
  textTransform: 'uppercase',
  fontFamily: FONTS.display,
}
const scrollIndicatorStyle: React.CSSProperties = {
  marginTop: 64,
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  opacity: 0.45,
}
const scrollLabelStyle: React.CSSProperties = {
  fontFamily: FONTS.display,
  fontSize: 10,
  letterSpacing: '0.3em',
  color: BRAND.heirloom,
}
const scrollLineStyle: React.CSSProperties = {
  display: 'inline-block',
  width: 56,
  height: 1,
  background: `linear-gradient(90deg, ${BRAND.heirloom}, transparent)`,
}

// ── Stats strip ──────────────────────────────────────────────────────
const statsStripStyle: React.CSSProperties = {
  position: 'relative',
  zIndex: 2,
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: 0,
  borderTop: `1px solid ${BRAND.amazon}`,
  borderBottom: `1px solid ${BRAND.amazon}`,
  background: `${BRAND.bgDeep}f0`,
  backdropFilter: 'blur(8px)',
}
function statBoxStyle(isLast: boolean): React.CSSProperties {
  return {
    padding: 'clamp(20px, 3vw, 32px)',
    borderRight: isLast ? 'none' : `1px solid ${BRAND.amazon}`,
  }
}
function statValueStyle(accent: string): React.CSSProperties {
  return {
    fontFamily: FONTS.display,
    fontSize: 'clamp(36px, 5vw, 56px)',
    fontWeight: 900,
    color: accent,
    lineHeight: 1,
    marginBottom: 8,
    letterSpacing: '-0.01em',
    textShadow: `0 0 28px ${accent}33`,
  }
}
const statLabelStyle: React.CSSProperties = {
  fontFamily: FONTS.display,
  fontSize: 10,
  letterSpacing: '0.18em',
  color: `${BRAND.heirloom}77`,
  textTransform: 'uppercase',
}

// ── Sections ─────────────────────────────────────────────────────────
const sectionStyle: React.CSSProperties = {
  position: 'relative',
  zIndex: 2,
  padding: 'clamp(64px, 10vh, 96px) clamp(20px, 4vw, 32px)',
  maxWidth: 1080,
  margin: '0 auto',
}
const sectionEyebrowStyle: React.CSSProperties = {
  fontFamily: FONTS.display,
  fontSize: 11,
  letterSpacing: '0.24em',
  color: BRAND.mazorca,
  textTransform: 'uppercase',
  marginBottom: 16,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 10,
}
const h2Style: React.CSSProperties = {
  fontFamily: FONTS.display,
  fontSize: 'clamp(28px, 4.5vw, 52px)',
  letterSpacing: '-0.005em',
  margin: '0 0 36px 0',
  textTransform: 'uppercase',
  fontWeight: 900,
  lineHeight: 1.05,
}

// ── Pillars ──────────────────────────────────────────────────────────
const pillarsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
  gap: 16,
}
const pillarStyle: React.CSSProperties = {
  background: `${BRAND.bgCard}cc`,
  backdropFilter: 'blur(8px)',
  border: `1px solid ${BRAND.amazon}`,
  padding: 'clamp(20px, 2vw, 28px)',
  position: 'relative',
  transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s',
  cursor: 'default',
}
const pillarIconRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 14,
}
const pillarNumStyle: React.CSSProperties = {
  fontFamily: FONTS.display,
  fontSize: 11,
  letterSpacing: '0.2em',
  fontWeight: 900,
}
const pillarTitleStyle: React.CSSProperties = {
  fontFamily: FONTS.display,
  fontSize: 'clamp(16px, 1.6vw, 20px)',
  letterSpacing: '0.06em',
  marginBottom: 12,
  color: BRAND.heirloom,
  textTransform: 'uppercase',
  fontWeight: 900,
}
const pillarBodyStyle: React.CSSProperties = {
  fontSize: 14,
  lineHeight: 1.6,
  color: `${BRAND.heirloom}aa`,
}

// ── How it works steps ─────────────────────────────────────────────
const stepsRailStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))',
  gap: 0,
  border: `1px solid ${BRAND.amazon}`,
  background: `${BRAND.bgDark}cc`,
  backdropFilter: 'blur(6px)',
}
function stepCardStyle(isLast: boolean): React.CSSProperties {
  return {
    padding: 'clamp(20px, 2vw, 28px)',
    borderRight: isLast ? 'none' : `1px solid ${BRAND.amazon}`,
    position: 'relative',
  }
}
const stepArrowStyle: React.CSSProperties = {
  position: 'absolute',
  right: -10,
  top: '50%',
  transform: 'translateY(-50%)',
  width: 20, height: 20,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: BRAND.bgDeep,
  border: `1px solid ${BRAND.amazon}`,
  color: BRAND.mazorca,
  fontFamily: FONTS.display,
  fontSize: 11,
  fontWeight: 900,
  borderRadius: 999,
  zIndex: 3,
}
const stepNumStyle: React.CSSProperties = {
  fontFamily: FONTS.display,
  fontSize: 'clamp(28px, 3vw, 40px)',
  fontWeight: 900,
  color: BRAND.mazorca,
  lineHeight: 1,
  marginBottom: 12,
  letterSpacing: '-0.01em',
}
const stepTitleStyle: React.CSSProperties = {
  fontFamily: FONTS.display,
  fontSize: 13,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  fontWeight: 900,
  color: BRAND.heirloom,
  marginBottom: 8,
}
const stepBodyStyle: React.CSSProperties = {
  fontSize: 12,
  lineHeight: 1.55,
  color: `${BRAND.heirloom}88`,
  margin: 0,
}

// ── Charter ribbon ────────────────────────────────────────────────
const charterStyle: React.CSSProperties = {
  position: 'relative',
  zIndex: 2,
  background: `linear-gradient(135deg, ${BRAND.bgCard} 0%, ${BRAND.bgDark} 100%)`,
  borderTop: `1px solid ${BRAND.amazon}`,
  borderBottom: `1px solid ${BRAND.amazon}`,
  padding: 'clamp(64px, 10vh, 96px) clamp(20px, 4vw, 32px)',
}
const charterAccentStyle: React.CSSProperties = {
  position: 'absolute',
  left: 0, top: '20%', bottom: '20%',
  width: 4,
  background: BRAND.mazorca,
  boxShadow: `0 0 24px ${BRAND.mazorca}66`,
}
const charterContentStyle: React.CSSProperties = {
  maxWidth: 920,
  margin: '0 auto',
  paddingLeft: 'clamp(20px, 4vw, 40px)',
}
const pullQuoteStyle: React.CSSProperties = {
  fontFamily: FONTS.display,
  fontSize: 'clamp(20px, 2.4vw, 32px)',
  fontWeight: 700,
  lineHeight: 1.3,
  color: BRAND.heirloom,
  margin: '0 0 32px 0',
  fontStyle: 'italic',
  letterSpacing: '-0.005em',
}

// ── Compliance pills ──────────────────────────────────────────────
const pillsRowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  marginTop: 8,
}
function pillStyle(tone: string): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 14px',
    border: `1px solid ${tone}66`,
    color: tone,
    background: `${tone}11`,
    fontFamily: FONTS.display,
    fontSize: 11,
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    borderRadius: 999,
  }
}

// ── Buttons ───────────────────────────────────────────────────────
const linkStyle: React.CSSProperties = {
  color: BRAND.mazorca,
  textDecoration: 'none',
  borderBottom: `1px solid ${BRAND.mazorca}55`,
  transition: 'border-color 0.2s',
}
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
  transition: 'background 0.2s, transform 0.2s',
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
  transition: 'border-color 0.2s, color 0.2s',
}

// ── Footer ────────────────────────────────────────────────────────
const footerStyle: React.CSSProperties = {
  position: 'relative',
  zIndex: 2,
  padding: 'clamp(40px, 6vh, 56px) clamp(20px, 4vw, 32px) 32px',
  borderTop: `1px solid ${BRAND.amazon}`,
  background: `${BRAND.bgDeep}f0`,
}
const footerInnerStyle: React.CSSProperties = {
  maxWidth: 1080,
  margin: '0 auto',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 24,
  flexWrap: 'wrap',
  marginBottom: 24,
}
const footerLogoStyle: React.CSSProperties = {
  fontFamily: FONTS.display,
  fontSize: 13,
  letterSpacing: '0.18em',
  fontWeight: 900,
  color: BRAND.heirloom,
}
const footerLinksStyle: React.CSSProperties = {
  display: 'flex',
  gap: 20,
  flexWrap: 'wrap',
  fontFamily: FONTS.display,
  fontSize: 11,
  letterSpacing: '0.16em',
}
const footerFineStyle: React.CSSProperties = {
  maxWidth: 1080,
  margin: '0 auto',
  fontSize: 11,
  color: `${BRAND.heirloom}55`,
  letterSpacing: '0.04em',
  textAlign: 'center',
  paddingTop: 24,
  borderTop: `1px solid ${BRAND.amazon}55`,
}

// ─── Default export ──────────────────────────────────────────────────

export default function Web3Landing() {
  return (
    <Web3Provider>
      <Inner />
    </Web3Provider>
  )
}
