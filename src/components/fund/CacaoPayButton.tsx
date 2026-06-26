import { useState } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { parseUnits, formatUnits } from 'viem'
import {
  BRAND, FONTS,
  WEB3_CONTRACTS,
  ACTIVE_CHAIN_ID, BASE_SEPOLIA_CHAIN_ID,
  CACAO_PER_USD, CACAO_DECIMALS,
} from '../../utils/constants'
import { supabase } from '../../lib/supabase'
import Web3Provider from '../web3/Web3Provider'

const ERC20_ABI = [
  { type: 'function', name: 'balanceOf', stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }] },
  { type: 'function', name: 'burn', stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [] },
] as const

interface Props {
  amountUsd:  number
  label:      string
  techId?:    string
  mvpId?:     string | null
  lotsCount?: number
  lang:       'es' | 'en'
  onSuccess?: () => void
}

function CacaoPayInner({ amountUsd, label, techId, mvpId, lotsCount = 1, lang, onSuccess }: Props) {
  const T = (es: string, en: string) => lang === 'es' ? es : en
  const { address, chainId } = useAccount()
  const { openConnectModal } = useConnectModal()

  const cacaoNeeded   = amountUsd * CACAO_PER_USD
  const cacaoNeededWei = parseUnits(cacaoNeeded.toString(), CACAO_DECIMALS)

  const { data: balanceWei } = useReadContract({
    address: WEB3_CONTRACTS.cacaoToken,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 10_000 },
  })

  const balanceCacao = balanceWei ? Number(formatUnits(balanceWei, CACAO_DECIMALS)) : 0
  const hasEnough    = balanceCacao >= cacaoNeeded
  const wrongChain   = address !== undefined && chainId !== ACTIVE_CHAIN_ID
  const isTestnet    = ACTIVE_CHAIN_ID === BASE_SEPOLIA_CHAIN_ID

  const { writeContract, data: txHash, isPending, error: writeError, reset } = useWriteContract()
  const { isLoading: isMining, isSuccess: isMined } = useWaitForTransactionReceipt({ hash: txHash })

  const [recorded, setRecorded] = useState(false)
  if (isMined && txHash && !recorded) {
    setRecorded(true)
    supabase.functions.invoke('record-investor-transfer', {
      body: {
        tx_hash:    txHash,
        amount_usd: amountUsd,
        asset:      'CACAO',
        chain_id:   ACTIVE_CHAIN_ID,
        tech_id:    techId ?? null,
        mvp_id:     mvpId ?? null,
        lots_count: lotsCount,
        kind:       'cacao_burn',
        label,
      },
    }).catch(() => {})
    onSuccess?.()
  }

  const basescanUrl = isTestnet ? 'https://sepolia.basescan.org/tx/' : 'https://basescan.org/tx/'

  if (!address) {
    return (
      <button onClick={openConnectModal} style={btn(BRAND.criollo, false)}>
        <span>◈</span>
        <span style={{ flex: 1, textAlign: 'left' }}>
          <span style={{ display: 'block', fontFamily: FONTS.display, fontWeight: 800, fontSize: 12, letterSpacing: '0.1em' }}>
            {T('CONECTAR · PAGAR CON $CACAO', 'CONNECT · PAY WITH $CACAO')}
          </span>
          <span style={{ display: 'block', fontFamily: FONTS.body, fontSize: 9, opacity: 0.6, marginTop: 2 }}>
            {cacaoNeeded.toLocaleString()} $CACAO · burn on Base
          </span>
        </span>
      </button>
    )
  }

  if (wrongChain) {
    return (
      <div style={{ padding: '12px 14px', borderRadius: 12, background: `${BRAND.mazorca}12`, border: `1px solid ${BRAND.mazorca}33`, fontFamily: FONTS.body, fontSize: 11, color: BRAND.mazorca }}>
        {T('Cambia a Base en tu wallet para pagar con $CACAO.', 'Switch to Base in your wallet to pay with $CACAO.')}
      </div>
    )
  }

  if (isMined && txHash) {
    return (
      <div style={{ padding: '14px', borderRadius: 12, background: `${BRAND.criollo}12`, border: `1.5px solid ${BRAND.criollo}44`, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 12, color: BRAND.criollo, letterSpacing: '0.08em' }}>
          ✓ {T('$CACAO QUEMADO · PAGO CONFIRMADO', '$CACAO BURNED · PAYMENT CONFIRMED')}
        </div>
        <a href={`${basescanUrl}${txHash}`} target="_blank" rel="noopener noreferrer"
          style={{ fontFamily: FONTS.body, fontSize: 9, color: BRAND.heroic, letterSpacing: '0.1em' }}>
          {T('Ver en BaseScan →', 'View on BaseScan →')}
        </a>
        <button onClick={reset} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: FONTS.body, fontSize: 9, color: `${BRAND.heirloom}55`, alignSelf: 'flex-start' }}>
          {T('Nueva transacción', 'New transaction')}
        </button>
      </div>
    )
  }

  const disabled = isPending || isMining || !hasEnough

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <button
        onClick={() => writeContract({
          address: WEB3_CONTRACTS.cacaoToken,
          abi: ERC20_ABI,
          functionName: 'burn',
          args: [cacaoNeededWei],
          chainId: ACTIVE_CHAIN_ID,
        })}
        disabled={disabled}
        style={btn(BRAND.criollo, disabled)}
      >
        <span style={{ fontSize: 16 }}>◈</span>
        <span style={{ flex: 1, textAlign: 'left' }}>
          <span style={{ display: 'block', fontFamily: FONTS.display, fontWeight: 800, fontSize: 12, letterSpacing: '0.1em' }}>
            {isPending ? T('CONFIRMA EN TU WALLET…', 'CONFIRM IN WALLET…')
              : isMining ? T('PROCESANDO EN BASE…', 'PROCESSING ON BASE…')
              : !hasEnough ? T('$CACAO INSUFICIENTE', 'INSUFFICIENT $CACAO')
              : T(`QUEMAR ${cacaoNeeded.toLocaleString()} $CACAO`, `BURN ${cacaoNeeded.toLocaleString()} $CACAO`)}
          </span>
          <span style={{ display: 'block', fontFamily: FONTS.body, fontSize: 9, opacity: 0.65, marginTop: 2 }}>
            {hasEnough
              ? `Balance: ${balanceCacao.toLocaleString(undefined, { maximumFractionDigits: 2 })} $CACAO · ≈ $${amountUsd} USD${isTestnet ? ' · testnet' : ''}`
              : `Necesitas ${cacaoNeeded.toLocaleString()} $CACAO · tienes ${balanceCacao.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
          </span>
        </span>
        {!disabled && <span style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 12 }}>→</span>}
      </button>
      {!hasEnough && (
        <a href="/burn" style={{ fontFamily: FONTS.body, fontSize: 9, color: BRAND.criollo, textAlign: 'right', letterSpacing: '0.08em' }}>
          {T('↗ Quemar mazorcas para obtener $CACAO', '↗ Burn mazorcas to earn $CACAO')}
        </a>
      )}
      {writeError && (
        <div style={{ fontFamily: FONTS.body, fontSize: 9, color: BRAND.radioRed, padding: '4px 8px' }}>
          {writeError.message.split('\n')[0].slice(0, 120)}
        </div>
      )}
    </div>
  )
}

function btn(color: string, disabled: boolean): React.CSSProperties {
  return {
    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
    padding: '14px 16px', borderRadius: 12, cursor: disabled ? 'not-allowed' : 'pointer',
    background: disabled ? `${color}22` : `${color}18`,
    border: `1.5px solid ${disabled ? color + '33' : color + '66'}`,
    color: BRAND.heirloom, transition: 'all 0.18s', opacity: disabled ? 0.7 : 1,
  }
}

export default function CacaoPayButton(props: Props) {
  return (
    <Web3Provider>
      <CacaoPayInner {...props} />
    </Web3Provider>
  )
}
