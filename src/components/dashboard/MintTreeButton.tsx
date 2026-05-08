import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useKYCStatus } from '../../hooks/useKYCStatus'
import { BRAND, FONTS, BASE_CHAIN_ID } from '../../utils/constants'

interface Props {
  treeId: string
  alreadyMintedTokenId?: number | null
  alreadyMintedContract?: string | null
  /** Called when mint completes (the parent can refresh the tree row). */
  onMinted?: (txHash: string) => void
}

interface MintResponse {
  ok?: boolean
  tx_hash?: string
  chain_id?: number
  contract?: string
  explorer?: string
  error?: string
}

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`

export default function MintTreeButton({ treeId, alreadyMintedTokenId, alreadyMintedContract, onMinted }: Props) {
  const kyc = useKYCStatus()
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<MintResponse | null>(null)

  const minted = alreadyMintedTokenId != null

  async function onClick() {
    setSubmitting(true)
    setResult(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${FUNCTIONS_URL}/mint-tree-nft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token ?? ''}`,
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

  // ─── Render branches ────────────────────────────────────────────────

  if (minted) {
    const isBaseMainnet = (alreadyMintedContract && alreadyMintedTokenId)
    const openseaUrl = isBaseMainnet
      ? `https://opensea.io/assets/base/${alreadyMintedContract}/${alreadyMintedTokenId}`
      : null
    return (
      <div style={mintedBoxStyle}>
        <div style={{ ...labelStyle, color: BRAND.pod }}>✓ MINTED ON BASE</div>
        <div style={tokenIdStyle}>Token #{String(alreadyMintedTokenId).padStart(5, '0')}</div>
        {openseaUrl && (
          <a href={openseaUrl} target="_blank" rel="noopener noreferrer" style={linkStyle}>
            View on OpenSea →
          </a>
        )}
      </div>
    )
  }

  // Phase 1: don't push Web3 onboarding from TreeDetail. Users who haven't
  // completed KYC + wallet linking see nothing here — the mint CTA lives in
  // /web3 only. Loading state is also hidden to avoid a flash of "Loading…"
  // for the freemium majority who never reach the ready-to-mint state.
  if (kyc.loading || !kyc.canPerform('mint')) {
    return null
  }

  return (
    <div style={ctaBoxStyle}>
      <div style={{ ...labelStyle, color: BRAND.mazorca }}>READY TO MINT</div>
      <p style={hintStyle}>
        Mint this tree as an NFT on Base (chain {BASE_CHAIN_ID}). Gasless — CauaCorp covers the fee.
        On-chain ownership unlocks transfer, secondary sale, and care-action rarity progression.
      </p>
      <button onClick={onClick} disabled={submitting} style={btnStyle}>
        {submitting ? 'SUBMITTING…' : 'MINT TREE NFT'}
      </button>

      {result?.tx_hash && (
        <div style={{ marginTop: 12, fontSize: 13 }}>
          ✓ Tx submitted:{' '}
          <a href={result.explorer} target="_blank" rel="noopener noreferrer" style={linkStyle}>
            {result.tx_hash.slice(0, 10)}…{result.tx_hash.slice(-6)}
          </a>
          <p style={{ ...hintStyle, marginTop: 8 }}>
            Token id will appear within ~60s once the Transfer event is indexed.
          </p>
        </div>
      )}

      {result?.error && (
        <div style={{ marginTop: 12, color: BRAND.theobroma, fontSize: 13 }}>
          Error: {result.error}
          {result.error === 'rate_limited_24h' && (
            <p style={hintStyle}>You can mint at most one tree per 24 hours. Try again later.</p>
          )}
          {result.error === 'wallet_not_linked' && (
            <p style={hintStyle}>
              <a href="/app/web3/onboarding" style={ctaLinkStyle}>Link your wallet first →</a>
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Styles (hex-only per CauaCore §8) ───────────────────────────────

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
}
const linkStyle: React.CSSProperties = {
  color: BRAND.mazorca,
  textDecoration: 'underline',
  fontFamily: 'monospace',
}
const ctaLinkStyle: React.CSSProperties = {
  color: BRAND.mazorca,
  textDecoration: 'underline',
  fontWeight: 600,
}
