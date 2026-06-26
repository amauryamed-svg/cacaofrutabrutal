import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useKYCStatus } from '../../hooks/useKYCStatus'
import { BRAND, FONTS } from '../../utils/constants'

interface Props {
  treeId: string
  alreadyMintedTokenId?: number | null
  alreadyMintedContract?: string | null
  onMinted?: (txHash: string) => void
}

interface MintResponse {
  ok?: boolean
  tx_hash?: string
  chain_id?: number
  contract?: string
  explorer?: string
  simulated?: boolean
  error?: string
}

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`
const INDEXING_SECONDS = 60

// Countdown bar shown after tx submission
function IndexingTimer({ onComplete }: { onComplete: () => void }) {
  const [sec, setSec] = useState(INDEXING_SECONDS)

  useEffect(() => {
    const id = setInterval(() => {
      setSec(s => {
        if (s <= 1) { clearInterval(id); onComplete(); return 0 }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [onComplete])

  const pct = Math.round(((INDEXING_SECONDS - sec) / INDEXING_SECONDS) * 100)

  return (
    <div style={{ marginTop: 14 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 6,
      }}>
        <span style={{ fontFamily: FONTS.display, fontSize: 11, letterSpacing: '0.1em', color: BRAND.pod }}>
          INDEXANDO EN BASE
        </span>
        <span style={{ fontFamily: 'monospace', fontSize: 13, color: `${BRAND.heirloom}99` }}>
          {sec}s
        </span>
      </div>
      <div style={{ background: `${BRAND.amazon}88`, height: 4, borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          background: BRAND.pod,
          height: 4,
          width: `${pct}%`,
          borderRadius: 2,
          transition: 'width 1s linear',
        }} />
      </div>
      <p style={{ ...hintStyle, marginTop: 8, fontSize: 12 }}>
        Tu NFT aparece en el dashboard una vez que Base confirme el bloque.
      </p>
    </div>
  )
}

export default function MintTreeButton({ treeId, alreadyMintedTokenId, alreadyMintedContract, onMinted }: Props) {
  const kyc = useKYCStatus()
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<MintResponse | null>(null)
  const [indexed, setIndexed] = useState(false)

  const minted = alreadyMintedTokenId != null

  async function onClick() {
    setSubmitting(true)
    setResult(null)
    setIndexed(false)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${FUNCTIONS_URL}/mint-tree-nft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token ?? ''}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
        },
        body: JSON.stringify({ tree_id: treeId }),
      })
      const json = await res.json() as MintResponse
      setResult(json)
      if (res.ok && json.tx_hash && onMinted) onMinted(json.tx_hash)
    } catch (e) {
      setResult({ error: e instanceof Error ? e.message : 'mint_failed' })
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Already minted ─────────────────────────────────────────────────
  if (minted) {
    const openseaUrl = (alreadyMintedContract && alreadyMintedTokenId)
      ? `https://opensea.io/assets/base/${alreadyMintedContract}/${alreadyMintedTokenId}`
      : null
    return (
      <div style={mintedBoxStyle}>
        <div style={{ ...labelStyle, color: BRAND.pod }}>✓ ÁRBOL ON-CHAIN</div>
        <div style={tokenIdStyle}>Token #{String(alreadyMintedTokenId).padStart(5, '0')}</div>
        {openseaUrl && (
          <a href={openseaUrl} target="_blank" rel="noopener noreferrer" style={linkStyle}>
            Ver en OpenSea →
          </a>
        )}
      </div>
    )
  }

  if (kyc.loading || !kyc.canPerform('mint')) return null

  // ─── Submitting spinner ──────────────────────────────────────────────
  if (submitting) {
    return (
      <div style={ctaBoxStyle}>
        <div style={{ ...labelStyle, color: BRAND.mazorca }}>MINTANDO…</div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 8 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: '50%',
              background: BRAND.mazorca,
              opacity: 0.3,
              animation: `pulse 1.2s ease-in-out ${i * 0.4}s infinite`,
            }} />
          ))}
        </div>
        <p style={{ ...hintStyle, marginTop: 10 }}>Enviando transacción a Base…</p>
      </div>
    )
  }

  // ─── Post-mint: countdown + success ─────────────────────────────────
  if (result?.tx_hash) {
    return (
      <div style={ctaBoxStyle}>
        <div style={{ ...labelStyle, color: BRAND.pod }}>✓ TRANSACCIÓN ENVIADA</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0 4px' }}>
          <span style={{ fontSize: 12, color: `${BRAND.heirloom}77`, fontFamily: 'monospace' }}>
            {result.tx_hash.slice(0, 10)}…{result.tx_hash.slice(-6)}
          </span>
          {result.explorer && (
            <a href={result.explorer} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 11, color: BRAND.mazorca, textDecoration: 'none' }}>
              ↗
            </a>
          )}
        </div>

        {indexed ? (
          <div style={{
            marginTop: 12, padding: '10px 14px',
            background: `${BRAND.pod}18`, border: `1px solid ${BRAND.pod}44`,
            borderRadius: 8,
          }}>
            <div style={{ ...labelStyle, color: BRAND.pod, marginBottom: 4 }}>
              🌱 INDEXADO — RECARGA EL ÁRBOL
            </div>
            <button
              onClick={() => window.location.reload()}
              style={{ ...btnStyle, background: BRAND.pod, marginTop: 4 }}
            >
              VER MI NFT →
            </button>
          </div>
        ) : (
          <IndexingTimer onComplete={() => setIndexed(true)} />
        )}
      </div>
    )
  }

  // ─── Ready to mint CTA ───────────────────────────────────────────────
  return (
    <div style={ctaBoxStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: BRAND.mazorca,
          boxShadow: `0 0 0 3px ${BRAND.mazorca}33`,
        }} />
        <span style={{ ...labelStyle, color: BRAND.mazorca, marginBottom: 0 }}>
          LISTO PARA MINTEAR
        </span>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {[
          { icon: '⛽', text: 'Sin gas' },
          { icon: '🔒', text: 'Non-custodial' },
          { icon: '🌱', text: 'Base L2' },
        ].map(({ icon, text }) => (
          <div key={text} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '4px 10px', borderRadius: 999,
            background: `${BRAND.amazon}66`,
            border: `1px solid ${BRAND.pod}33`,
            fontSize: 11, fontFamily: FONTS.body, color: `${BRAND.heirloom}99`,
          }}>
            <span>{icon}</span>
            <span>{text}</span>
          </div>
        ))}
      </div>

      <button onClick={onClick} style={btnStyle}>
        MINT TREE NFT
      </button>

      {result?.error && (
        <div style={{ marginTop: 12, color: BRAND.theobroma, fontSize: 13 }}>
          Error: {result.error}
          {result.error === 'rate_limited_24h' && (
            <p style={hintStyle}>Máximo 1 mint cada 24h. Intenta más tarde.</p>
          )}
          {result.error === 'wallet_not_linked' && (
            <p style={hintStyle}>
              <a href="/web3/onboarding" style={{ color: BRAND.mazorca, textDecoration: 'underline' }}>
                Vincula tu wallet primero →
              </a>
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────

const ctaBoxStyle: React.CSSProperties = {
  background: BRAND.bgCard,
  border: `1px solid ${BRAND.pod}`,
  padding: 20,
  fontFamily: FONTS.body,
  color: BRAND.heirloom,
}
const mintedBoxStyle: React.CSSProperties = {
  background: BRAND.bgDeep,
  border: `1px solid ${BRAND.pod}`,
  padding: 16,
  fontFamily: FONTS.body,
  color: BRAND.heirloom,
}
const labelStyle: React.CSSProperties = {
  fontFamily: FONTS.display,
  fontSize: 12,
  letterSpacing: '0.14em',
  marginBottom: 8,
  textTransform: 'uppercase',
}
const hintStyle: React.CSSProperties = {
  fontSize: 13,
  lineHeight: 1.55,
  color: BRAND.heirloom,
  opacity: 0.78,
  margin: '0 0 12px 0',
}
const tokenIdStyle: React.CSSProperties = {
  fontFamily: FONTS.display,
  fontSize: 18,
  color: BRAND.heirloom,
  marginBottom: 8,
}
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
  fontWeight: 900,
}
const linkStyle: React.CSSProperties = {
  color: BRAND.mazorca,
  textDecoration: 'underline',
  fontFamily: 'monospace',
}
