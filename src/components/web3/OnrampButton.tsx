import { useAccount } from 'wagmi'
import { BRAND, FONTS, BASE_CHAIN_ID } from '../../utils/constants'

/**
 * Coinbase Onramp launcher — fiat → ETH/cbBTC/USDC on Base.
 *
 * The user lands on Coinbase's hosted onramp with the destination address
 * pre-filled (their connected wallet). Onramp handles its own KYC + AML +
 * card processing; CauaCorp never touches fiat. This is why we are NOT a
 * Money Service Business (see docs/LEGAL.md).
 *
 * Pricing: handled by Coinbase. Typical fee 1–2% on credit card, lower on ACH.
 */

const ONRAMP_BASE = 'https://pay.coinbase.com/buy/select-asset'

interface Props {
  /** Optional preset purchase amount in USD. */
  presetUsd?: number
  /** Asset to buy. Defaults to USDC for easiest adoption. */
  asset?: 'ETH' | 'USDC' | 'CBBTC'
  label?: string
}

export default function OnrampButton({ presetUsd, asset = 'USDC', label }: Props) {
  const { address, isConnected } = useAccount()
  const appId = (import.meta.env.VITE_COINBASE_ONRAMP_APP_ID as string | undefined) ?? ''

  const disabled = !isConnected || !appId

  function onClick() {
    if (!address) return
    const params = new URLSearchParams({
      appId,
      addresses: JSON.stringify({ [address]: ['base'] }),
      assets: JSON.stringify([asset]),
      defaultNetwork: 'base',
      defaultAsset: asset,
      defaultPaymentMethod: 'CARD',
    })
    if (presetUsd) params.set('presetFiatAmount', String(presetUsd))

    const url = `${ONRAMP_BASE}?${params.toString()}`
    window.open(url, '_blank', 'noopener,noreferrer,width=480,height=720')
  }

  if (!isConnected) {
    return (
      <button disabled style={{ ...btnStyle, opacity: 0.4, cursor: 'not-allowed' }} title="Connect a wallet first">
        BUY {asset} WITH CARD
      </button>
    )
  }

  if (!appId) {
    return (
      <button
        disabled
        style={{ ...btnStyle, opacity: 0.4, cursor: 'not-allowed' }}
        title="VITE_COINBASE_ONRAMP_APP_ID not configured"
      >
        ONRAMP CONFIG PENDING
      </button>
    )
  }

  return (
    <button onClick={onClick} disabled={disabled} style={btnStyle}>
      {label ?? `BUY ${asset} WITH CARD · ${BASE_CHAIN_ID === 8453 ? 'BASE' : 'BASE SEPOLIA'}`}
    </button>
  )
}

const btnStyle: React.CSSProperties = {
  background: BRAND.heroic,
  color: BRAND.bgDeep,
  border: 'none',
  padding: '12px 22px',
  fontFamily: FONTS.display,
  fontSize: 14,
  letterSpacing: '0.12em',
  cursor: 'pointer',
  textTransform: 'uppercase',
}
