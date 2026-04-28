// wagmi v2 + RainbowKit + Coinbase Smart Wallet config.
// Lazy-imported only by /app/web3/* routes — keeps the marketing bundle clean.
// See docs/WEB3.md.

import { http, createConfig } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { coinbaseWallet, walletConnect, injected } from 'wagmi/connectors'
import { BASE_RPC, BASE_CHAIN_ID } from '../../utils/constants'

const walletConnectProjectId =
  (import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string | undefined) ?? ''

/**
 * wagmi config — Base mainnet primary, Sepolia testnet for dev.
 * Smart Wallet (passkey) is the headline UX; injected covers Rabby/MetaMask;
 * WalletConnect covers mobile + everything else.
 */
export const wagmiConfig = createConfig({
  chains: [base, baseSepolia],
  connectors: [
    coinbaseWallet({
      appName: 'CauaCorp',
      preference: 'smartWalletOnly',
    }),
    injected({ shimDisconnect: true }),
    ...(walletConnectProjectId
      ? [walletConnect({ projectId: walletConnectProjectId, showQrModal: true })]
      : []),
  ],
  transports: {
    [base.id]: http(BASE_RPC),
    [baseSepolia.id]: http('https://sepolia.base.org'),
  },
  ssr: false,
})

export const DEFAULT_CHAIN_ID = BASE_CHAIN_ID
