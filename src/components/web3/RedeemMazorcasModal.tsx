import { useEffect, useMemo, useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import Web3Provider from './Web3Provider'
import { useKYCStatus } from '../../hooks/useKYCStatus'
import {
  BRAND,
  FONTS,
  MAZORCA_TO_CACAO_RATE,
  WEB3_CONTRACTS,
  BASE_CHAIN_ID,
} from '../../utils/constants'
import {
  requestBurnSignature,
  burnArgs,
  MAZORCA_REDEMPTION_ABI,
  type SignedRedemption,
} from '../../lib/web3/redemption'

interface Props {
  open: boolean
  onClose: () => void
  mazorcasBalance: number
  onClaimed?: (txHash: string) => void
}

type Phase = 'pick' | 'signing' | 'ready' | 'claiming' | 'mining' | 'done' | 'error'

// Public export wraps Inner in Web3Provider so the modal works on routes that
// don't wrap their tree in WagmiProvider (e.g. Dashboard). Provider only mounts
// while the modal is open — wallet code stays cold otherwise.
export default function RedeemMazorcasModal(props: Props) {
  if (!props.open) return null
  return (
    <Web3Provider>
      <RedeemInner {...props} />
    </Web3Provider>
  )
}

function RedeemInner({ open, onClose, mazorcasBalance, onClaimed }: Props) {
  const kyc = useKYCStatus()
  const { address } = useAccount()
  const { writeContractAsync } = useWriteContract()

  const [phase, setPhase] = useState<Phase>('pick')
  const [amount, setAmount] = useState<number>(MAZORCA_TO_CACAO_RATE)
  const [redemption, setRedemption] = useState<SignedRedemption | null>(null)
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null)
  const [errMsg, setErrMsg] = useState<string | null>(null)

  const receipt = useWaitForTransactionReceipt({ hash: txHash ?? undefined })

  // Reset on open
  useEffect(() => {
    if (open) {
      setPhase('pick')
      setAmount(MAZORCA_TO_CACAO_RATE)
      setRedemption(null)
      setTxHash(null)
      setErrMsg(null)
    }
  }, [open])

  // Drive phases off the receipt status
  useEffect(() => {
    if (!txHash) return
    if (receipt.isLoading) setPhase('mining')
    else if (receipt.isSuccess) {
      setPhase('done')
      if (onClaimed) onClaimed(txHash)
    } else if (receipt.isError) {
      setPhase('error')
      setErrMsg('Transaction reverted on-chain.')
    }
  }, [receipt.isLoading, receipt.isSuccess, receipt.isError, txHash, onClaimed])

  const cacaoOut = useMemo(() => Math.floor(amount / MAZORCA_TO_CACAO_RATE), [amount])
  const canRedeem = kyc.canPerform('redeem') && address && mazorcasBalance >= MAZORCA_TO_CACAO_RATE

  if (!open) return null

  async function onSign() {
    setPhase('signing')
    setErrMsg(null)
    try {
      const r = await requestBurnSignature(amount)
      setRedemption(r)
      setPhase('ready')
    } catch (e) {
      setPhase('error')
      setErrMsg(e instanceof Error ? e.message : 'sign_failed')
    }
  }

  async function onClaim() {
    if (!redemption || !WEB3_CONTRACTS.mazorcaRedemption) return
    setPhase('claiming')
    setErrMsg(null)
    try {
      const args = burnArgs(redemption)
      const hash = await writeContractAsync({
        address: WEB3_CONTRACTS.mazorcaRedemption as `0x${string}`,
        abi: MAZORCA_REDEMPTION_ABI,
        functionName: 'claim',
        args,
        chainId: BASE_CHAIN_ID,
      })
      setTxHash(hash)
    } catch (e) {
      setPhase('error')
      setErrMsg(e instanceof Error ? e.message : 'claim_failed')
    }
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <div style={titleStyle}>REDEEM MAZORCAS</div>
          <button onClick={onClose} style={closeStyle} aria-label="Close">×</button>
        </div>

        {!canRedeem ? (
          <Locked kycLoading={kyc.loading} canPerform={kyc.canPerform('redeem')} hasWallet={!!address} balance={mazorcasBalance} />
        ) : phase === 'pick' || phase === 'signing' ? (
          <PickPhase
            balance={mazorcasBalance}
            amount={amount}
            onAmountChange={setAmount}
            cacaoOut={cacaoOut}
            onSign={onSign}
            signing={phase === 'signing'}
          />
        ) : phase === 'ready' || phase === 'claiming' ? (
          <ReadyPhase redemption={redemption!} onClaim={onClaim} claiming={phase === 'claiming'} />
        ) : phase === 'mining' ? (
          <MiningPhase txHash={txHash!} />
        ) : phase === 'done' ? (
          <DonePhase txHash={txHash!} cacao={cacaoOut} />
        ) : (
          <ErrorPhase message={errMsg ?? 'unknown_error'} onRetry={() => setPhase('pick')} />
        )}
      </div>
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────

function Locked({ kycLoading, canPerform, hasWallet, balance }: {
  kycLoading: boolean; canPerform: boolean; hasWallet: boolean; balance: number
}) {
  if (kycLoading) return <p style={pStyle}>Loading wallet status…</p>
  if (!canPerform) return (
    <>
      <p style={pStyle}>Redemption requires KYC tier ≥ 1 and a linked wallet.</p>
      <a href="/app/web3/onboarding" style={ctaLinkStyle}>→ Complete Web3 onboarding</a>
    </>
  )
  if (!hasWallet) return <p style={pStyle}>Connect your wallet first to redeem.</p>
  return (
    <p style={pStyle}>
      You need at least {MAZORCA_TO_CACAO_RATE} mazorcas to redeem.
      Current balance: <strong>{balance}</strong>
    </p>
  )
}

function PickPhase({ balance, amount, onAmountChange, cacaoOut, onSign, signing }: {
  balance: number; amount: number; onAmountChange: (n: number) => void
  cacaoOut: number; onSign: () => void; signing: boolean
}) {
  const max = Math.floor(balance / MAZORCA_TO_CACAO_RATE) * MAZORCA_TO_CACAO_RATE
  return (
    <>
      <p style={pStyle}>
        Burn mazorcas (off-chain) to mint $CACAO on Base.
        Rate: <strong>{MAZORCA_TO_CACAO_RATE} mazorcas → 1 $CACAO</strong>.
      </p>
      <p style={hintStyle}>Cooldown: max 1 redemption per 30 days.</p>

      <div style={fieldStyle}>
        <label style={labelStyle}>Mazorcas to burn</label>
        <input
          type="number"
          value={amount}
          min={MAZORCA_TO_CACAO_RATE}
          max={max}
          step={MAZORCA_TO_CACAO_RATE}
          onChange={(e) => onAmountChange(Math.max(MAZORCA_TO_CACAO_RATE, Math.min(max, Number(e.target.value))))}
          style={inputStyle}
        />
        <p style={hintStyle}>Available: {balance} · Multiples of {MAZORCA_TO_CACAO_RATE}</p>
      </div>

      <div style={summaryStyle}>
        You receive: <strong style={{ color: BRAND.mazorca }}>{cacaoOut} $CACAO</strong>
      </div>

      <button onClick={onSign} disabled={signing} style={btnStyle}>
        {signing ? 'SIGNING SERVER PAYLOAD…' : 'SIGN BURN'}
      </button>
    </>
  )
}

function ReadyPhase({ redemption, onClaim, claiming }: {
  redemption: SignedRedemption; onClaim: () => void; claiming: boolean
}) {
  const expiresAt = new Date(Number(redemption.burn.deadline) * 1000)
  return (
    <>
      <div style={summaryStyle}>
        Server signed your burn for <strong>{redemption.burn.mazorcaCount}</strong> mazorcas.
      </div>
      <p style={hintStyle}>
        Click below to submit the on-chain claim. Your wallet will sign the tx.
        <br />Deadline: {expiresAt.toLocaleString()}
      </p>
      <button onClick={onClaim} disabled={claiming} style={btnStyle}>
        {claiming ? 'AWAITING WALLET…' : 'CLAIM ON BASE'}
      </button>
    </>
  )
}

function MiningPhase({ txHash }: { txHash: string }) {
  return (
    <>
      <div style={summaryStyle}>Tx submitted. Waiting for confirmation…</div>
      <p style={hintStyle}>
        <a href={`https://basescan.org/tx/${txHash}`} target="_blank" rel="noopener noreferrer" style={ctaLinkStyle}>
          View on BaseScan ↗
        </a>
      </p>
    </>
  )
}

function DonePhase({ txHash, cacao }: { txHash: string; cacao: number }) {
  return (
    <>
      <div style={{ ...summaryStyle, borderColor: BRAND.pod }}>
        ✓ Claimed <strong style={{ color: BRAND.pod }}>{cacao} $CACAO</strong>
      </div>
      <p style={hintStyle}>
        <a href={`https://basescan.org/tx/${txHash}`} target="_blank" rel="noopener noreferrer" style={ctaLinkStyle}>
          View confirmation on BaseScan ↗
        </a>
      </p>
      <p style={hintStyle}>
        Add $CACAO to your wallet (use contract address from{' '}
        <code style={{ color: BRAND.heirloom }}>WEB3_CONTRACTS.cacaoToken</code>).
      </p>
    </>
  )
}

function ErrorPhase({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <>
      <div style={{ ...summaryStyle, borderColor: BRAND.theobroma, color: BRAND.theobroma }}>
        Error: {message}
      </div>
      <button onClick={onRetry} style={btnStyle}>TRY AGAIN</button>
    </>
  )
}

// ─── Styles (hex-only) ─────────────────────────────────────────────────

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: '#000000cc',
  zIndex: 9999,
  display: 'grid',
  placeItems: 'center',
  padding: 16,
  fontFamily: FONTS.body,
}
const modalStyle: React.CSSProperties = {
  background: BRAND.bgCard,
  border: `1px solid ${BRAND.pod}`,
  padding: 28,
  width: 'min(440px, 100%)',
  color: BRAND.heirloom,
}
const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 16,
}
const titleStyle: React.CSSProperties = {
  fontFamily: FONTS.display,
  fontSize: 18,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
}
const closeStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: BRAND.heirloom,
  fontSize: 24,
  lineHeight: 1,
  cursor: 'pointer',
}
const pStyle: React.CSSProperties = { fontSize: 14, lineHeight: 1.55, marginBottom: 12 }
const hintStyle: React.CSSProperties = { fontSize: 12, opacity: 0.7, marginBottom: 12 }
const fieldStyle: React.CSSProperties = { marginBottom: 16 }
const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: FONTS.display,
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  marginBottom: 6,
}
const inputStyle: React.CSSProperties = {
  width: '100%',
  background: BRAND.bgDeep,
  border: `1px solid ${BRAND.heirloom}`,
  color: BRAND.heirloom,
  padding: '10px 12px',
  fontFamily: 'monospace',
  fontSize: 16,
}
const summaryStyle: React.CSSProperties = {
  border: `1px solid ${BRAND.mazorca}`,
  padding: 12,
  fontSize: 14,
  margin: '12px 0',
}
const btnStyle: React.CSSProperties = {
  width: '100%',
  background: BRAND.mazorca,
  color: BRAND.bgDeep,
  border: 'none',
  padding: '14px',
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
