import {
  AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig,
  Sequence, Easing,
} from 'remotion'

// ── Brand ──────────────────────────────────────────────────────────────────
const B = {
  bg:       '#040C06',
  bgCard:   '#132B1C',
  pod:      '#91A63B',
  mazorca:  '#F1A91E',
  heroic:   '#00A3CD',
  criollo:  '#8D2679',
  heirloom: '#F7F1EE',
  amazon:   '#1C3B26',
  theobroma:'#DB5527',
}

const DISPLAY = "'Barlow Condensed', Impact, sans-serif"
const MONO    = "'Courier New', monospace"

// ── Helpers ────────────────────────────────────────────────────────────────
function useFadeIn(startFrame: number, dur = 12) {
  const frame = useCurrentFrame()
  return interpolate(frame - startFrame, [0, dur], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
}

function useSlideUp(startFrame: number, delay = 0) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const s = spring({ frame: frame - startFrame - delay, fps, config: { damping: 18, stiffness: 100 } })
  return interpolate(s, [0, 1], [48, 0])
}

function Glow({ color, size = 300 }: { color: string; size?: number }) {
  const frame = useCurrentFrame()
  const pulse = Math.sin(frame / 20) * 0.15 + 0.85
  return (
    <div style={{
      position: 'absolute', borderRadius: '50%',
      width: size, height: size,
      background: `radial-gradient(circle, ${color}44 0%, transparent 70%)`,
      opacity: pulse, pointerEvents: 'none',
    }} />
  )
}

function Eyebrow({ text, color, opacity = 1 }: { text: string; color: string; opacity?: number }) {
  return (
    <div style={{
      fontFamily: MONO, fontSize: 18, letterSpacing: '0.28em',
      color, textTransform: 'uppercase', marginBottom: 24, opacity,
    }}>
      {text}
    </div>
  )
}

function BigTitle({ children, color = B.heirloom, size = 120 }: {
  children: React.ReactNode; color?: string; size?: number
}) {
  return (
    <div style={{
      fontFamily: DISPLAY, fontWeight: 900, fontSize: size,
      lineHeight: 0.95, textTransform: 'uppercase',
      color, letterSpacing: '-0.01em',
    }}>
      {children}
    </div>
  )
}

function Tag({ text, color }: { text: string; color: string }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '6px 18px',
      border: `1px solid ${color}66`, color,
      background: `${color}11`,
      fontFamily: MONO, fontSize: 14, letterSpacing: '0.2em',
      marginRight: 12, marginBottom: 12,
    }}>
      {text}
    </div>
  )
}

function StatBox({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div style={{
      flex: 1, padding: '28px 24px',
      background: B.bgCard,
      borderTop: `3px solid ${color}`,
      border: `1px solid ${B.amazon}`,
    }}>
      <div style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 64, color, lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontFamily: MONO, fontSize: 13, color: `${B.heirloom}77`, letterSpacing: '0.16em', marginTop: 8 }}>
        {label}
      </div>
    </div>
  )
}

// ── Scene 1 — HERO (frames 0-89) ───────────────────────────────────────────
function SceneHero() {
  const frame = useCurrentFrame()
  const opacity = useFadeIn(0, 20)
  const slideY  = useSlideUp(0)
  const slideY2 = useSlideUp(0, 8)
  const slideY3 = useSlideUp(0, 16)

  const glitchOffset = frame % 4 === 0 ? Math.random() * 4 - 2 : 0

  return (
    <AbsoluteFill style={{ background: B.bg, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
      {/* Ambient glows */}
      <div style={{ position: 'absolute', top: -80, left: -80 }}>
        <Glow color={B.pod} size={500} />
      </div>
      <div style={{ position: 'absolute', bottom: -80, right: -80 }}>
        <Glow color={B.criollo} size={400} />
      </div>

      {/* Grid lines */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(${B.amazon}22 1px, transparent 1px), linear-gradient(90deg, ${B.amazon}22 1px, transparent 1px)`,
        backgroundSize: '80px 80px',
        opacity: 0.6,
      }} />

      <div style={{ textAlign: 'center', opacity, transform: `translateY(${slideY}px)`, zIndex: 1 }}>
        <Eyebrow text="◈ BASE × COINBASE CDP × COLOMBIA" color={B.heroic} />

        <div style={{ transform: `translateX(${glitchOffset}px)` }}>
          <BigTitle size={160}>
            <span style={{ color: B.pod }}>CACAO</span>
            <br />
            <span style={{ color: B.heirloom }}>FRUTA</span>
            <br />
            <span style={{ color: B.mazorca }}>BRUTAL</span>
          </BigTitle>
        </div>

        <div style={{
          transform: `translateY(${slideY2}px)`,
          fontFamily: MONO, fontSize: 22, color: `${B.heirloom}88`,
          marginTop: 32, letterSpacing: '0.12em',
        }}>
          THE FIRST REAL ASSET ON BASE YOU CAN EAT
        </div>

        <div style={{ transform: `translateY(${slideY3}px)`, marginTop: 28, display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Tag text="ERC-721 TREE NFT" color={B.pod} />
          <Tag text="$CACAO ERC-20" color={B.mazorca} />
          <Tag text="COINBASE ONRAMP" color={B.heroic} />
          <Tag text="NO ICO · EARN ONLY" color={B.criollo} />
        </div>
      </div>
    </AbsoluteFill>
  )
}

// ── Scene 2 — THE ASSET (frames 90-179) ────────────────────────────────────
function SceneAsset() {
  const frame = useCurrentFrame()
  const opacity = useFadeIn(0, 15)
  const slideY  = useSlideUp(0)

  return (
    <AbsoluteFill style={{ background: B.bg, padding: '80px 120px', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 200, right: 80 }}>
        <Glow color={B.mazorca} size={600} />
      </div>

      <div style={{ opacity }}>
        <Eyebrow text="THE ASSET" color={B.mazorca} />
        <div style={{ transform: `translateY(${slideY}px)` }}>
          <BigTitle size={110}>
            ONE TREE.<br />
            <span style={{ color: B.pod }}>ONE NFT.</span><br />
            <span style={{ color: B.mazorca }}>REAL CACAO.</span>
          </BigTitle>
        </div>

        <div style={{ display: 'flex', gap: 20, marginTop: 60 }}>
          {[
            { icon: '🌱', title: 'ADOPT', body: 'Real Theobroma cacao tree in Colombian highlands. GPS coordinates on-chain.', color: B.pod },
            { icon: '🎮', title: 'CARE', body: 'Daily on-chain care actions. Earn mazorcas. NFT rarity evolves with stewardship.', color: B.mazorca },
            { icon: '🔥', title: 'BURN → $CACAO', body: 'Burn mazorcas → claim $CACAO. Fixed supply cap. Zero presale. Zero ICO.', color: B.heroic },
            { icon: '🍫', title: 'REDEEM', body: 'Burn $CACAO → real NIBS shipped. Bioactive. Lyophilized. Functional chocolate.', color: B.criollo },
          ].map((c, i) => (
            <div key={i} style={{
              flex: 1, padding: '24px 20px',
              background: B.bgCard,
              borderTop: `3px solid ${c.color}`,
              border: `1px solid ${B.amazon}`,
              opacity: interpolate(frame, [i * 6, i * 6 + 12], [0, 1], { extrapolateRight: 'clamp' }),
              transform: `translateY(${interpolate(frame, [i * 6, i * 6 + 18], [30, 0], { extrapolateRight: 'clamp' })}px)`,
            }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>{c.icon}</div>
              <div style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 22, color: c.color, letterSpacing: '0.06em', marginBottom: 8 }}>
                {c.title}
              </div>
              <div style={{ fontFamily: MONO, fontSize: 13, color: `${B.heirloom}66`, lineHeight: 1.5 }}>
                {c.body}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  )
}

// ── Scene 3 — TOKENOMICS (frames 180-269) ──────────────────────────────────
function SceneTokenomics() {
  const frame = useCurrentFrame()
  const opacity = useFadeIn(0, 15)

  const barProgress = interpolate(frame, [20, 50], [0, 1], { extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) })

  return (
    <AbsoluteFill style={{ background: B.bg, padding: '80px 120px', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', bottom: 0, left: '40%' }}>
        <Glow color={B.heroic} size={500} />
      </div>

      <div style={{ opacity }}>
        <Eyebrow text="◈ $CACAO TOKENOMICS" color={B.heroic} />
        <BigTitle size={100}>
          EARN ONLY.<br />
          <span style={{ color: B.heroic }}>NO WHALES.</span><br />
          <span style={{ color: B.mazorca }}>NO RUGS.</span>
        </BigTitle>

        <div style={{ display: 'flex', gap: 16, marginTop: 56 }}>
          <StatBox value="0" label="PRESALE ALLOCATION" color={B.pod} />
          <StatBox value="0" label="FOUNDER TOKENS" color={B.pod} />
          <StatBox value="∞" label="EARN POTENTIAL (GAMEPLAY)" color={B.mazorca} />
          <StatBox value="BASE" label="L2 CHAIN (ID 8453)" color={B.heroic} />
        </div>

        <div style={{ marginTop: 40, display: 'flex', gap: 20, alignItems: 'center' }}>
          <div style={{ fontFamily: MONO, fontSize: 14, color: `${B.heirloom}55`, letterSpacing: '0.2em', minWidth: 180 }}>
            SUPPLY DISTRIBUTION
          </div>
          <div style={{ flex: 1, height: 8, background: `${B.amazon}55`, position: 'relative' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${barProgress * 100}%`, background: `linear-gradient(90deg, ${B.pod}, ${B.mazorca})` }} />
          </div>
          <div style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 24, color: B.mazorca }}>
            100% EARNED IN-GAME
          </div>
        </div>
      </div>
    </AbsoluteFill>
  )
}

// ── Scene 4 — COINBASE CDP (frames 270-359) ────────────────────────────────
function SceneCDP() {
  const frame = useCurrentFrame()
  const opacity = useFadeIn(0, 15)
  const slideY  = useSlideUp(0)

  return (
    <AbsoluteFill style={{ background: B.bg, padding: '80px 120px', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 100, right: 60 }}>
        <Glow color={B.heroic} size={600} />
      </div>

      <div style={{ opacity }}>
        <Eyebrow text="POWERED BY COINBASE CDP" color={B.heroic} />
        <div style={{ transform: `translateY(${slideY}px)` }}>
          <BigTitle size={100}>
            <span style={{ color: B.heroic }}>FIAT → USDC</span><br />
            <span style={{ color: B.heirloom }}>IN ONE TAP.</span>
          </BigTitle>
        </div>

        <div style={{ display: 'flex', gap: 24, marginTop: 60 }}>
          <div style={{
            flex: 1, padding: '32px 28px',
            background: B.bgCard,
            borderLeft: `4px solid ${B.heroic}`,
            border: `1px solid ${B.amazon}`,
            opacity: interpolate(frame, [15, 28], [0, 1], { extrapolateRight: 'clamp' }),
          }}>
            <div style={{ fontFamily: MONO, fontSize: 13, color: B.heroic, letterSpacing: '0.2em', marginBottom: 16 }}>
              ARCHITECTURE
            </div>
            {[
              '→  User clicks "BUY USDC WITH CARD"',
              '→  Edge Function verifies Supabase JWT',
              '→  Signs CDP session token (ES256)',
              '→  Opens pay.coinbase.com popup',
              '→  Wallet address: server-side only',
            ].map((line, i) => (
              <div key={i} style={{
                fontFamily: MONO, fontSize: 15,
                color: `${B.heirloom}${i === 4 ? 'FF' : '88'}`,
                marginBottom: 10, lineHeight: 1.4,
                opacity: interpolate(frame, [20 + i * 4, 32 + i * 4], [0, 1], { extrapolateRight: 'clamp' }),
              }}>
                {line}
              </div>
            ))}
          </div>

          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column', gap: 16,
            opacity: interpolate(frame, [25, 40], [0, 1], { extrapolateRight: 'clamp' }),
          }}>
            {[
              { label: 'ONRAMP ASSET', value: 'USDC · BASE', color: B.heroic },
              { label: 'KYC PROVIDER', value: 'Coinbase (zero Persona)', color: B.pod },
              { label: 'WALLET', value: 'Coinbase Smart Wallet', color: B.mazorca },
              { label: 'CHAIN', value: 'Base L2 (EIP-712)', color: B.heroic },
              { label: 'COMPLIANCE', value: 'OFAC + Chainalysis pre-write', color: B.theobroma },
            ].map((r, i) => (
              <div key={i} style={{
                padding: '16px 20px',
                background: B.bgCard,
                border: `1px solid ${r.color}33`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div style={{ fontFamily: MONO, fontSize: 12, color: `${B.heirloom}55`, letterSpacing: '0.16em' }}>
                  {r.label}
                </div>
                <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 18, color: r.color }}>
                  {r.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  )
}

// ── Scene 5 — UNIT ECONOMICS (frames 360-419) ──────────────────────────────
function SceneEconomics() {
  const frame = useCurrentFrame()
  const opacity = useFadeIn(0, 15)
  const slideY  = useSlideUp(0)

  return (
    <AbsoluteFill style={{ background: B.bg, padding: '80px 120px', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Glow color={B.pod} size={800} />
      </div>

      <div style={{ opacity, position: 'relative', zIndex: 1 }}>
        <Eyebrow text="UNIT ECONOMICS · PILOT LOT" color={B.pod} />
        <div style={{ transform: `translateY(${slideY}px)` }}>
          <BigTitle size={110}>
            <span style={{ color: B.pod }}>80%</span>
            <span style={{ color: B.heirloom }}> MARGIN.</span><br />
            <span style={{ color: B.mazorca }}>ON-CHAIN</span>
            <span style={{ color: B.heirloom }}> PROOF.</span>
          </BigTitle>
        </div>

        <div style={{ display: 'flex', gap: 16, marginTop: 56 }}>
          <StatBox value="312kg" label="PILOT LOT · HUILA" color={B.pod} />
          <StatBox value="1,000u" label="BARS · 250g EACH" color={B.mazorca} />
          <StatBox value="$6.18" label="COST PER BAR FOB AUSTIN" color={B.heirloom} />
          <StatBox value="$35" label="DTC RETAIL PRICE" color={B.heroic} />
        </div>

        <div style={{
          marginTop: 40, padding: '24px 32px',
          background: `${B.pod}11`, border: `1px solid ${B.pod}44`,
          display: 'flex', alignItems: 'center', gap: 32,
          opacity: interpolate(frame, [30, 45], [0, 1], { extrapolateRight: 'clamp' }),
        }}>
          <div style={{ fontFamily: MONO, fontSize: 15, color: `${B.heirloom}77`, letterSpacing: '0.12em' }}>
            EVERY TRANSACTION VERIFIABLE ON-CHAIN · BASE L2 · &lt;$0.01 GAS
          </div>
          <div style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 40, color: B.pod, whiteSpace: 'nowrap' }}>
            SEED ROUND OPEN →
          </div>
        </div>
      </div>
    </AbsoluteFill>
  )
}

// ── ROOT COMPOSITION ────────────────────────────────────────────────────────
export function CacaoPitch() {
  return (
    <AbsoluteFill style={{ background: B.bg, fontFamily: DISPLAY }}>
      {/* Load fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&display=swap');
      `}</style>

      <Sequence from={0}   durationInFrames={90}>  <SceneHero />       </Sequence>
      <Sequence from={90}  durationInFrames={90}>  <SceneAsset />      </Sequence>
      <Sequence from={180} durationInFrames={90}>  <SceneTokenomics /> </Sequence>
      <Sequence from={270} durationInFrames={90}>  <SceneCDP />        </Sequence>
      <Sequence from={360} durationInFrames={60}>  <SceneEconomics />  </Sequence>
    </AbsoluteFill>
  )
}
