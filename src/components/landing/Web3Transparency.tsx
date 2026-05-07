import { BRAND, FONTS, WEB3_CONTRACTS, ACTIVE_CHAIN_ID, BASE_SEPOLIA_CHAIN_ID } from '../../utils/constants'

/**
 * On-chain transparency — 5 verified Base Sepolia contracts that power the
 * adoption + redemption flows. Linked to BaseScan so attendees at the
 * AtmosphereX event (and any future visitor) can verify by themselves.
 *
 * Per Charter §I.1 + §I.3: payment splits in same tx, no founder allocation.
 * Per CauaCore §8: hex backgrounds only, no pastel gradients.
 */

const CHAIN_LABEL = ACTIVE_CHAIN_ID === BASE_SEPOLIA_CHAIN_ID ? 'Base Sepolia (testnet)' : 'Base mainnet'
const SCAN_BASE = ACTIVE_CHAIN_ID === BASE_SEPOLIA_CHAIN_ID
  ? 'https://sepolia.basescan.org/address/'
  : 'https://basescan.org/address/'

interface Contract {
  name: string
  tag: string
  desc: string
  address: string
}

const CONTRACTS: Contract[] = [
  {
    name: 'CacaoTreeNFT',
    tag: 'ERC-721',
    desc: 'Cada árbol adoptado es un NFT único, con metadata dinámica que cambia con tu cuidado.',
    address: WEB3_CONTRACTS.cacaoTreeNFT,
  },
  {
    name: 'TreeAdoption',
    tag: 'Escrow 60/30/10',
    desc: 'Tu pago se divide on-chain en la misma transacción: 60 % al guardián, 30 % cooperativa, 10 % protocolo.',
    address: WEB3_CONTRACTS.treeAdoption,
  },
  {
    name: 'CacaoToken ($CACAO)',
    tag: 'ERC-20 · cap 21M',
    desc: 'Token utility 100 % earned. Sin presale, sin ICO. Solo se mintea quemando mazorcas de gameplay.',
    address: WEB3_CONTRACTS.cacaoToken,
  },
  {
    name: 'MazorcaRedemption',
    tag: 'EIP-712 · 1000:1',
    desc: 'Quemás 1000 mazorcas off-chain → minteás 1 $CACAO on-chain. Cooldown 30 días por usuario.',
    address: WEB3_CONTRACTS.mazorcaRedemption,
  },
  {
    name: 'IoTAttestation',
    tag: 'Merkle weekly',
    desc: 'Sensores en finca firman lecturas con Ed25519. Raíz Merkle semanal publicada on-chain.',
    address: WEB3_CONTRACTS.iotAttestation,
  },
]

function truncate(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

export default function Web3Transparency() {
  return (
    <section style={{
      padding: 'var(--space-section) var(--space-page) clamp(48px, 8vw, 80px)',
      maxWidth: 1040,
      margin: '0 auto',
      position: 'relative',
      zIndex: 1,
    }}>
      <div style={{ marginBottom: 32 }}>
        <p style={{
          fontFamily: FONTS.serif,
          fontStyle: 'italic',
          color: BRAND.mazorca,
          fontSize: 12,
          letterSpacing: '0.25em',
          marginBottom: 10,
        }}>
          Verificación on-chain · {CHAIN_LABEL}
        </p>
        <h2 style={{
          fontFamily: FONTS.display,
          fontWeight: 900,
          fontSize: 'clamp(24px, 5vw, 56px)',
          color: BRAND.heirloom,
          textTransform: 'uppercase',
          margin: 0,
          lineHeight: 0.92,
        }}>
          Transparencia<br />
          <span style={{ color: BRAND.pod }}>auditable</span>
        </h2>
        <p style={{
          fontFamily: FONTS.body,
          color: `${BRAND.heirloom}88`,
          fontSize: 'clamp(13px, 2vw, 15px)',
          lineHeight: 1.6,
          maxWidth: 560,
          marginTop: 16,
        }}>
          5 contratos verificados que sostienen tu adopción. Click en cualquiera para verlos en BaseScan.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))',
        gap: 12,
      }}>
        {CONTRACTS.map((c) => (
          <a
            key={c.address}
            href={`${SCAN_BASE}${c.address}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: BRAND.bgCard,
              border: `1px solid ${BRAND.amazon}55`,
              borderRadius: 14,
              padding: '18px 18px 16px',
              textDecoration: 'none',
              transition: 'border-color 200ms ease, transform 200ms ease',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = BRAND.pod
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = `${BRAND.amazon}55`
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              gap: 8,
            }}>
              <span style={{
                fontFamily: FONTS.display,
                fontWeight: 800,
                fontSize: 13,
                color: BRAND.heirloom,
                letterSpacing: '0.04em',
                lineHeight: 1.2,
              }}>{c.name}</span>
              <span style={{
                fontFamily: FONTS.body,
                fontSize: 9,
                color: BRAND.pod,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}>{c.tag}</span>
            </div>

            <p style={{
              fontFamily: FONTS.body,
              fontSize: 11,
              color: `${BRAND.heirloom}aa`,
              lineHeight: 1.55,
              margin: 0,
              flex: 1,
            }}>{c.desc}</p>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 6,
              paddingTop: 10,
              borderTop: `1px solid ${BRAND.amazon}33`,
            }}>
              <code style={{
                fontFamily: 'SF Mono, Monaco, Consolas, monospace',
                fontSize: 10,
                color: `${BRAND.heirloom}88`,
                letterSpacing: '0.02em',
              }}>{truncate(c.address)}</code>
              <span style={{
                fontFamily: FONTS.body,
                fontSize: 9,
                color: BRAND.mazorca,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
              }}>BaseScan ↗</span>
            </div>
          </a>
        ))}
      </div>

    </section>
  )
}
