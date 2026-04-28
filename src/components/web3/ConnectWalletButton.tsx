import { ConnectButton } from '@rainbow-me/rainbowkit'
import { BRAND, FONTS } from '../../utils/constants'

/**
 * Branded wrapper around RainbowKit's ConnectButton.
 * Custom render keeps brutalist-luxury hex palette + Barlow Condensed display.
 */
export default function ConnectWalletButton() {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
        const ready = mounted
        const connected = ready && account && chain

        return (
          <div
            aria-hidden={!ready}
            style={{ opacity: ready ? 1 : 0, pointerEvents: ready ? 'auto' : 'none' }}
          >
            {!connected ? (
              <button onClick={openConnectModal} type="button" style={btnStyle}>
                CONNECT WALLET
              </button>
            ) : chain.unsupported ? (
              <button onClick={openChainModal} type="button" style={{ ...btnStyle, borderColor: BRAND.theobroma, color: BRAND.theobroma }}>
                WRONG NETWORK
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={openChainModal} type="button" style={chipStyle}>
                  {chain.hasIcon && chain.iconUrl && (
                    <img src={chain.iconUrl} alt={chain.name ?? ''} width={16} height={16} style={{ marginRight: 6 }} />
                  )}
                  {chain.name}
                </button>
                <button onClick={openAccountModal} type="button" style={chipStyle}>
                  {account.displayName}
                  {account.displayBalance ? ` · ${account.displayBalance}` : ''}
                </button>
              </div>
            )}
          </div>
        )
      }}
    </ConnectButton.Custom>
  )
}

const btnStyle: React.CSSProperties = {
  background: BRAND.bgDeep,
  color: BRAND.heirloom,
  border: `1px solid ${BRAND.heirloom}`,
  padding: '10px 18px',
  fontFamily: FONTS.display,
  fontSize: 14,
  letterSpacing: '0.12em',
  cursor: 'pointer',
  textTransform: 'uppercase',
}

const chipStyle: React.CSSProperties = {
  background: BRAND.bgCard,
  color: BRAND.heirloom,
  border: `1px solid ${BRAND.pod}`,
  padding: '8px 14px',
  fontFamily: FONTS.body,
  fontSize: 13,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
}
