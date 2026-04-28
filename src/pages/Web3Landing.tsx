// English-first Web3 landing — targeted at Austin TX cryptobros + global cacao crypto crowd.
// Reuses the standalone vanilla Three.js scene at /investor-3d.js for the hero.
// Brutalist-luxury palette, hex-only per CauaCore §8.

import { useEffect } from 'react'
import Web3Provider from '../components/web3/Web3Provider'
import ConnectWalletButton from '../components/web3/ConnectWalletButton'
import OnrampButton from '../components/web3/OnrampButton'
import { BRAND, FONTS, BASE_CHAIN_ID, MAZORCA_TO_CACAO_RATE, CACAO_TOTAL_SUPPLY_CAP, ADOPTION_SPLIT_BPS } from '../utils/constants'

function Inner() {
  // Lazy-load the standalone Three.js hero (already used by /public/investor-landing.html).
  // We mount it into a fixed canvas overlay; bail if it fails (graceful degrade).
  useEffect(() => {
    const script = document.createElement('script')
    script.src = '/investor-3d.js'
    script.async = true
    document.head.appendChild(script)
    return () => { document.head.removeChild(script) }
  }, [])

  return (
    <main style={pageStyle}>
      {/* Three.js canvas mount target (the script targets #gl-canvas if present) */}
      <canvas id="gl-canvas" style={canvasStyle} aria-hidden="true" />

      {/* Hero */}
      <section style={heroStyle}>
        <div style={chipStyle}>BASE · CHAIN {BASE_CHAIN_ID}</div>
        <h1 style={h1Style}>OWN A CACAO TREE.<br/>EARN $CACAO. ON BASE.</h1>
        <p style={leadStyle}>
          Caúa is a regenerative-finance protocol where every adopted tree is a real ERC-721
          on Base, every care action moves rarity, and every redeem mints a utility token earned
          exclusively through gameplay. No presale. No insider allocation. {ADOPTION_SPLIT_BPS.guardian / 100}% of every adoption
          goes directly to the cultivator on the same block.
        </p>
        <div style={ctaRowStyle}>
          <ConnectWalletButton />
          <OnrampButton presetUsd={50} asset="USDC" />
        </div>
        <p style={fineStyle}>
          KYC required for mint and redemption. Charter:{' '}
          <a href="/docs/CHARTER.md" style={linkStyle}>read</a>. Compliance:{' '}
          <a href="/docs/COMPLIANCE.md" style={linkStyle}>read</a>.
        </p>
      </section>

      {/* Pillars */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>WHAT YOU OWN</h2>
        <div style={gridStyle}>
          <Pillar title="A TREE" body="ERC-721 on Base. GPS-hashed to a real Guardian-cultivated tree in Colombia. Transferable, tradable on OpenSea/Zora." />
          <Pillar title="GAMEPLAY YIELD" body={`Burn ${MAZORCA_TO_CACAO_RATE} mazorcas earned via care → mint 1 $CACAO. Capped supply: ${Number(CACAO_TOTAL_SUPPLY_CAP).toLocaleString()}M. Earn-only.`} />
          <Pillar title="ATTESTED DATA" body="ESP32 + Ed25519-signed sensor readings, Merkle-rooted weekly on Base. Your tree's climate is verifiable on-chain." />
          <Pillar title="GUARDIAN-FIRST SPLITS" body={`${ADOPTION_SPLIT_BPS.guardian / 100}% of adoption goes to the Guardian wallet atomically. ${ADOPTION_SPLIT_BPS.treasury / 100}% treasury. ${ADOPTION_SPLIT_BPS.protocol / 100}% protocol.`} />
        </div>
      </section>

      {/* Charter ribbon */}
      <section style={{ ...sectionStyle, background: BRAND.bgCard, padding: '48px 32px' }}>
        <h2 style={h2Style}>THE CACAO COVENANT</h2>
        <p style={leadStyle}>
          Caúa is governed by a public Charter. No founder mint outside gameplay. No presale, no ICO.
          Liquidity seeds Uniswap v3 only after audit, with LP timelocked 12 months on-chain.
        </p>
        <a href="/docs/CHARTER.md" style={btnGhostStyle}>READ THE CHARTER</a>
      </section>

      {/* Compliance / Austin */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>BUILT FOR AUSTIN ReFi</h2>
        <p style={leadStyle}>
          Caúa launches publicly with the Austin ReFi community. Coinbase Smart Wallet support out of the box.
          Persona KYC. Chainalysis + OFAC pre-write screening on every linked address. Geo-restricted from
          OFAC-sanctioned jurisdictions. Texas Money Services Act compliant by design (we are merchant, not transmitter).
        </p>
        <div style={ctaRowStyle}>
          <a href="/app/web3/onboarding" style={btnStyle}>START WEB3 ONBOARDING →</a>
          <a href="/docs/LEGAL.md" style={btnGhostStyle}>LEGAL POSTURE</a>
        </div>
      </section>

      <footer style={footerStyle}>
        <p>© {new Date().getFullYear()} CauaCorp. Charter governs. Smart contract risk: see <a href="/docs/LEGAL.md" style={linkStyle}>LEGAL.md</a>.</p>
      </footer>
    </main>
  )
}

function Pillar({ title, body }: { title: string; body: string }) {
  return (
    <div style={pillarStyle}>
      <div style={pillarTitleStyle}>{title}</div>
      <p style={pillarBodyStyle}>{body}</p>
    </div>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────

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
const heroStyle: React.CSSProperties = {
  position: 'relative',
  zIndex: 1,
  padding: '128px 32px 96px',
  maxWidth: 920,
  margin: '0 auto',
}
const chipStyle: React.CSSProperties = {
  display: 'inline-block',
  border: `1px solid ${BRAND.pod}`,
  color: BRAND.pod,
  padding: '6px 12px',
  fontFamily: FONTS.display,
  fontSize: 11,
  letterSpacing: '0.18em',
  marginBottom: 24,
  textTransform: 'uppercase',
}
const h1Style: React.CSSProperties = {
  fontFamily: FONTS.display,
  fontSize: 'clamp(40px, 7vw, 80px)',
  lineHeight: 1.05,
  letterSpacing: '0.03em',
  margin: '0 0 24px 0',
  textTransform: 'uppercase',
}
const h2Style: React.CSSProperties = {
  fontFamily: FONTS.display,
  fontSize: 'clamp(28px, 4vw, 44px)',
  letterSpacing: '0.04em',
  marginBottom: 24,
  textTransform: 'uppercase',
}
const leadStyle: React.CSSProperties = {
  fontSize: 18,
  lineHeight: 1.6,
  maxWidth: 720,
  marginBottom: 24,
}
const ctaRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  flexWrap: 'wrap',
  marginBottom: 16,
}
const fineStyle: React.CSSProperties = { fontSize: 12, opacity: 0.6 }
const sectionStyle: React.CSSProperties = {
  position: 'relative',
  zIndex: 1,
  padding: '64px 32px',
  maxWidth: 1080,
  margin: '0 auto',
}
const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: 16,
}
const pillarStyle: React.CSSProperties = {
  background: BRAND.bgCard,
  border: `1px solid ${BRAND.amazon}`,
  padding: 20,
}
const pillarTitleStyle: React.CSSProperties = {
  fontFamily: FONTS.display,
  fontSize: 14,
  letterSpacing: '0.14em',
  marginBottom: 8,
  color: BRAND.mazorca,
  textTransform: 'uppercase',
}
const pillarBodyStyle: React.CSSProperties = { fontSize: 14, lineHeight: 1.55 }
const linkStyle: React.CSSProperties = { color: BRAND.mazorca, textDecoration: 'underline' }
const btnStyle: React.CSSProperties = {
  background: BRAND.mazorca,
  color: BRAND.bgDeep,
  border: 'none',
  padding: '12px 22px',
  fontFamily: FONTS.display,
  fontSize: 14,
  letterSpacing: '0.12em',
  cursor: 'pointer',
  textTransform: 'uppercase',
  textDecoration: 'none',
  display: 'inline-block',
}
const btnGhostStyle: React.CSSProperties = {
  background: 'transparent',
  color: BRAND.heirloom,
  border: `1px solid ${BRAND.heirloom}`,
  padding: '12px 22px',
  fontFamily: FONTS.display,
  fontSize: 14,
  letterSpacing: '0.12em',
  cursor: 'pointer',
  textTransform: 'uppercase',
  textDecoration: 'none',
  display: 'inline-block',
}
const footerStyle: React.CSSProperties = {
  position: 'relative',
  zIndex: 1,
  padding: '32px',
  borderTop: `1px solid ${BRAND.amazon}`,
  textAlign: 'center',
  fontSize: 12,
  opacity: 0.6,
}

// ─── Default export ──────────────────────────────────────────────────

export default function Web3Landing() {
  return (
    <Web3Provider>
      <Inner />
    </Web3Provider>
  )
}
