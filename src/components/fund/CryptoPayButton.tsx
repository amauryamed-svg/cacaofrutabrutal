import { useState } from 'react'
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { parseEther } from 'viem'
import { BRAND, FONTS, INVESTOR_WALLETS, ACTIVE_CHAIN_ID, BASE_SEPOLIA_CHAIN_ID } from '../../utils/constants'
import { supabase } from '../../lib/supabase'
import Web3Provider from '../web3/Web3Provider'

const ETH_USD_RATE = 3_400
const TREASURY = INVESTOR_WALLETS.cto.eth as `0x${string}`

interface Props {
  amountUsd:   number
  label:       string
  techId?:     string
  mvpId?:      string | null
  lotsCount?:  number
  lang:        'es' | 'en'
  onSuccess?:  (txHash: string) => void
}

function CryptoPayInner({ amountUsd, label, techId, mvpId, lotsCount = 1, lang, onSuccess }: Props) {
  const { address, chainId } = useAccount()
  const { openConnectModal } = useConnectModal()
  const T = (es: string, en: string) => lang === 'es' ? es : en

  const ethAmount = (amountUsd / ETH_USD_RATE).toFixed(5)
  const ethWei = parseEther(ethAmount)

  const { sendTransaction, data: txHash, isPending, error: sendError, reset } = useSendTransaction()
  const { isLoading: isMining, isSuccess: isMined } = useWaitForTransactionReceipt({ hash: txHash })

  const isTestnet   = ACTIVE_CHAIN_ID === BASE_SEPOLIA_CHAIN_ID
  const wrongChain  = address !== undefined && chainId !== ACTIVE_CHAIN_ID
  const basescanUrl = isTestnet ? 'https://sepolia.basescan.org/tx/' : 'https://basescan.org/tx/'

  async function recordTx(hash: string) {
    try {
      await supabase.functions.invoke('record-investor-transfer', {
        body: {
          tx_hash:     hash,
          amount_usd:  amountUsd,
          asset:       'ETH',
          chain_id:    ACTIVE_CHAIN_ID,
          tech_id:     techId ?? null,
          mvp_id:      mvpId ?? null,
          lots_count:  lotsCount,
          kind:        'b2b_sponsorship',
          label,
        },
      })
    } catch { /* non-blocking — tx is already on-chain */ }
  }

  // Record once mined
  const [recorded, setRecorded] = useState(false)
  if (isMined && txHash && !recorded) {
    setRecorded(true)
    recordTx(txHash)
    onSuccess?.(txHash)
  }

  // Not connected
  if (!address) {
    return (
      <button onClick={openConnectModal} style={btnStyle(BRAND.heroic, false)}>
        <span>⬡</span>
        <span style={{ flex: 1, textAlign: 'left' }}>
          <span style={{ display: 'block', fontFamily: FONTS.display, fontWeight: 800, fontSize: 12, letterSpacing: '0.1em' }}>
            {T('CONECTAR WALLET · ETH ON BASE', 'CONNECT WALLET · ETH ON BASE')}
          </span>
          <span style={{ display: 'block', fontFamily: FONTS.body, fontSize: 9, opacity: 0.6, marginTop: 2 }}>
            {ethAmount} ETH ≈ ${amountUsd.toLocaleString()} USD
          </span>
        </span>
      </button>
    )
  }

  // Wrong chain
  if (wrongChain) {
    return (
      <div style={{ padding: '12px 14px', borderRadius: 12, background: `${BRAND.mazorca}12`, border: `1px solid ${BRAND.mazorca}33`, fontFamily: FONTS.body, fontSize: 11, color: BRAND.mazorca }}>
        {T('Cambia a Base en tu wallet para pagar con ETH.', 'Switch to Base in your wallet to pay with ETH.')}
      </div>
    )
  }

  // Success
  if (isMined && txHash) {
    return (
      <div style={{ padding: '14px', borderRadius: 12, background: `${BRAND.pod}12`, border: `1.5px solid ${BRAND.pod}44`, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 12, color: BRAND.pod, letterSpacing: '0.08em' }}>
          ✓ {T('PAGO ON-CHAIN CONFIRMADO', 'ON-CHAIN PAYMENT CONFIRMED')}
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

  // Ready to send
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <button
        onClick={() => sendTransaction({ to: TREASURY, value: ethWei, chainId: ACTIVE_CHAIN_ID })}
        disabled={isPending || isMining}
        style={btnStyle(BRAND.heroic, isPending || isMining)}
      >
        <span style={{ fontSize: 16 }}>⬡</span>
        <span style={{ flex: 1, textAlign: 'left' }}>
          <span style={{ display: 'block', fontFamily: FONTS.display, fontWeight: 800, fontSize: 12, letterSpacing: '0.1em' }}>
            {isPending ? T('CONFIRMA EN TU WALLET…', 'CONFIRM IN WALLET…')
              : isMining ? T('PROCESANDO EN BASE…', 'PROCESSING ON BASE…')
              : T('PAGAR CON ETH · BASE', 'PAY WITH ETH · BASE')}
          </span>
          <span style={{ display: 'block', fontFamily: FONTS.body, fontSize: 9, opacity: 0.65, marginTop: 2 }}>
            {ethAmount} ETH · ≈ ${amountUsd.toLocaleString()} USD
            {isTestnet ? ' · testnet' : ' · Base mainnet'}
          </span>
        </span>
        {!isPending && !isMining && <span style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 12 }}>→</span>}
      </button>
      {sendError && (
        <div style={{ fontFamily: FONTS.body, fontSize: 9, color: BRAND.radioRed, padding: '4px 8px' }}>
          {sendError.message.split('\n')[0].slice(0, 120)}
        </div>
      )}
    </div>
  )
}

function btnStyle(color: string, disabled: boolean): React.CSSProperties {
  return {
    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
    padding: '14px 16px', borderRadius: 12, cursor: disabled ? 'not-allowed' : 'pointer',
    background: disabled ? `${color}22` : `${color}18`,
    border: `1.5px solid ${disabled ? color + '33' : color + '66'}`,
    color: BRAND.heirloom, transition: 'all 0.18s', opacity: disabled ? 0.7 : 1,
  }
}

export default function CryptoPayButton(props: Props) {
  return (
    <Web3Provider>
      <CryptoPayInner {...props} />
    </Web3Provider>
  )
}
