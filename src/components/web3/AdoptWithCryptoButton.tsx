import { useEffect, useMemo, useState } from 'react'
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi'
import { useKYCStatus } from '../../hooks/useKYCStatus'
import {
  BRAND,
  FONTS,
  BASE_CHAIN_ID,
  WEB3_CONTRACTS,
  BASE_ERC20,
  ADOPTION_SPLIT_BPS,
} from '../../utils/constants'
import {
  TREE_ADOPTION_ABI,
  ERC20_APPROVE_ABI,
  ETH_ASSET,
  treeIdToBytes32,
  varietyToBytes32,
} from '../../lib/web3/adoption'
import type { Hex } from 'viem'

interface Props {
  treeId: string
  guardianId: number
  variety: string
  /** Provided by server — keccak256(lat||lng||salt). */
  gpsHash: Hex
  onAdopted?: (txHash: string, asset: 'ETH' | 'USDC' | 'cbBTC') => void
}

type Asset = 'ETH' | 'USDC' | 'cbBTC'

const ASSET_ADDRESSES: Record<Asset, `0x${string}`> = {
  ETH:   ETH_ASSET as `0x${string}`,
  USDC:  BASE_ERC20.USDC,
  cbBTC: BASE_ERC20.cbBTC,
}

const ASSET_DECIMALS: Record<Asset, number> = { ETH: 18, USDC: 6, cbBTC: 8 }

export default function AdoptWithCryptoButton({ treeId, guardianId, variety, gpsHash, onAdopted }: Props) {
  const kyc = useKYCStatus()
  const { address, isConnected } = useAccount()
  const [asset, setAsset] = useState<Asset>('USDC')
  const [phase, setPhase] = useState<'idle' | 'approving' | 'adopting' | 'mining' | 'done' | 'error'>('idle')
  const [errMsg, setErrMsg] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null)

  const adoptionAddr = WEB3_CONTRACTS.treeAdoption as `0x${string}` | ''
  const assetAddr = ASSET_ADDRESSES[asset]

  // ─── Reads ────────────────────────────────────────────────────────
  const priceQuery = useReadContract({
    address: adoptionAddr || undefined,
    abi: TREE_ADOPTION_ABI,
    functionName: 'priceByAsset',
    args: [assetAddr],
    chainId: BASE_CHAIN_ID,
    query: { enabled: !!adoptionAddr },
  })
  const price = (priceQuery.data ?? 0n) as bigint

  const allowanceQuery = useReadContract({
    address: asset === 'ETH' ? undefined : assetAddr,
    abi: ERC20_APPROVE_ABI,
    functionName: 'allowance',
    args: address && adoptionAddr ? [address, adoptionAddr] : undefined,
    chainId: BASE_CHAIN_ID,
    query: { enabled: asset !== 'ETH' && !!address && !!adoptionAddr },
  })
  const allowance = (allowanceQuery.data ?? 0n) as bigint

  // ─── Writes ───────────────────────────────────────────────────────
  const { writeContractAsync } = useWriteContract()
  const receipt = useWaitForTransactionReceipt({ hash: txHash ?? undefined })

  useEffect(() => {
    if (!txHash) return
    if (receipt.isLoading) setPhase('mining')
    else if (receipt.isSuccess) {
      setPhase('done')
      if (onAdopted) onAdopted(txHash, asset)
    } else if (receipt.isError) {
      setPhase('error')
      setErrMsg('Transaction reverted on-chain.')
    }
  }, [receipt.isLoading, receipt.isSuccess, receipt.isError, txHash, onAdopted, asset])

  const treeIdHash = useMemo(() => treeIdToBytes32(treeId), [treeId])
  const varietyHash = useMemo(() => varietyToBytes32(variety), [variety])

  const needsApproval = asset !== 'ETH' && price > 0n && allowance < price

  async function onAdopt() {
    if (!adoptionAddr) {
      setErrMsg('TreeAdoption contract address not configured.')
      setPhase('error')
      return
    }
    setErrMsg(null)
    try {
      if (needsApproval) {
        setPhase('approving')
        const approveHash = await writeContractAsync({
          address: assetAddr,
          abi: ERC20_APPROVE_ABI,
          functionName: 'approve',
          args: [adoptionAddr, price],
          chainId: BASE_CHAIN_ID,
        })
        // Wait briefly for approval to land — receipt hook needs hash but here we just refetch allowance.
        await new Promise(r => setTimeout(r, 1500))
        await allowanceQuery.refetch()
        // Use approveHash for traceability if we want — currently noop.
        void approveHash
      }

      setPhase('adopting')
      const hash = asset === 'ETH'
        ? await writeContractAsync({
            address: adoptionAddr,
            abi: TREE_ADOPTION_ABI,
            functionName: 'adoptWithEth',
            args: [treeIdHash, guardianId, varietyHash, gpsHash],
            value: price,
            chainId: BASE_CHAIN_ID,
          })
        : await writeContractAsync({
            address: adoptionAddr,
            abi: TREE_ADOPTION_ABI,
            functionName: 'adoptWithToken',
            args: [assetAddr, treeIdHash, guardianId, varietyHash, gpsHash],
            chainId: BASE_CHAIN_ID,
          })
      setTxHash(hash)
    } catch (e) {
      setPhase('error')
      setErrMsg(e instanceof Error ? e.message : 'adopt_failed')
    }
  }

  // ─── Render ───────────────────────────────────────────────────────

  if (!isConnected) {
    return (
      <div style={boxStyle}>
        <div style={titleStyle}>ADOPT WITH CRYPTO</div>
        <p style={hintStyle}>Connect your wallet to adopt with ETH, USDC, or cbBTC on Base.</p>
        <a href="/app/web3/onboarding" style={ctaLinkStyle}>→ Connect & verify</a>
      </div>
    )
  }

  if (!kyc.canPerform('adopt_crypto')) {
    return (
      <div style={boxStyle}>
        <div style={titleStyle}>ADOPT WITH CRYPTO</div>
        <p style={hintStyle}>
          Crypto adoption requires KYC tier ≥ 2 (Enhanced). Complete identity verification first.
        </p>
        <a href="/app/web3/onboarding" style={ctaLinkStyle}>→ Upgrade KYC</a>
      </div>
    )
  }

  if (!adoptionAddr) {
    return (
      <div style={boxStyle}>
        <div style={titleStyle}>ADOPT WITH CRYPTO</div>
        <p style={hintStyle}>TreeAdoption contract not yet deployed on this environment.</p>
      </div>
    )
  }

  return (
    <div style={boxStyle}>
      <div style={titleStyle}>ADOPT WITH CRYPTO</div>

      <div style={pillRowStyle}>
        {(['USDC', 'ETH', 'cbBTC'] as Asset[]).map(a => (
          <button
            key={a}
            onClick={() => setAsset(a)}
            style={{
              ...pillStyle,
              borderColor: asset === a ? BRAND.mazorca : BRAND.heirloom,
              color: asset === a ? BRAND.mazorca : BRAND.heirloom,
            }}
          >
            {a}
          </button>
        ))}
      </div>

      <p style={hintStyle}>
        Price: {price === 0n ? '—' : formatAmount(price, ASSET_DECIMALS[asset])} {asset}
      </p>
      <p style={hintStyle}>
        Split: {ADOPTION_SPLIT_BPS.guardian / 100}% Guardian · {ADOPTION_SPLIT_BPS.treasury / 100}% Treasury · {ADOPTION_SPLIT_BPS.protocol / 100}% Protocol
      </p>

      {phase === 'done' && txHash ? (
        <div style={{ ...summaryStyle, borderColor: BRAND.pod, color: BRAND.pod }}>
          ✓ Adopted! <a href={`https://basescan.org/tx/${txHash}`} target="_blank" rel="noopener noreferrer" style={ctaLinkStyle}>View tx</a>
        </div>
      ) : (
        <button
          onClick={onAdopt}
          disabled={phase === 'approving' || phase === 'adopting' || phase === 'mining' || price === 0n}
          style={btnStyle}
        >
          {phase === 'approving' ? 'APPROVING…'
            : phase === 'adopting' ? 'CONFIRMING…'
            : phase === 'mining' ? 'MINING…'
            : needsApproval ? `APPROVE ${asset} & ADOPT`
            : `ADOPT WITH ${asset}`}
        </button>
      )}

      {errMsg && (
        <div style={{ ...summaryStyle, borderColor: BRAND.theobroma, color: BRAND.theobroma }}>
          {errMsg}
        </div>
      )}
    </div>
  )
}

function formatAmount(raw: bigint, decimals: number): string {
  const denom = 10n ** BigInt(decimals)
  const whole = raw / denom
  const frac  = raw % denom
  if (frac === 0n) return whole.toString()
  const fracStr = frac.toString().padStart(decimals, '0').replace(/0+$/, '').slice(0, 6)
  return fracStr ? `${whole}.${fracStr}` : whole.toString()
}

const boxStyle: React.CSSProperties = {
  background: BRAND.bgCard,
  border: `1px solid ${BRAND.pod}`,
  padding: 20,
  fontFamily: FONTS.body,
  color: BRAND.heirloom,
}
const titleStyle: React.CSSProperties = {
  fontFamily: FONTS.display,
  fontSize: 12,
  letterSpacing: '0.14em',
  marginBottom: 12,
  color: BRAND.mazorca,
  textTransform: 'uppercase',
}
const hintStyle: React.CSSProperties = { fontSize: 13, marginBottom: 8, opacity: 0.85 }
const pillRowStyle: React.CSSProperties = { display: 'flex', gap: 8, marginBottom: 12 }
const pillStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid',
  padding: '6px 14px',
  fontFamily: FONTS.display,
  fontSize: 12,
  letterSpacing: '0.12em',
  cursor: 'pointer',
}
const summaryStyle: React.CSSProperties = {
  border: `1px solid ${BRAND.mazorca}`,
  padding: 10,
  fontSize: 13,
  marginTop: 12,
}
const btnStyle: React.CSSProperties = {
  width: '100%',
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
const ctaLinkStyle: React.CSSProperties = {
  color: BRAND.mazorca,
  textDecoration: 'underline',
  fontWeight: 600,
}
