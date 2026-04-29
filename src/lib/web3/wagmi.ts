// wagmi v2 + RainbowKit + Coinbase Smart Wallet config.
// Lazy-imported only by /app/web3/* routes — keeps the marketing bundle clean.
// See docs/WEB3.md.

import { http, createConfig } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { coinbaseWallet, walletConnect, injected } from 'wagmi/connectors'
import { BASE_RPC, BASE_CHAIN_ID } from '../../utils/constants'

// WalletConnect Project ID is public by design — visible in any client bundle.
// Vercel env (prod + dev) overrides this fallback when set. Hardcoded so preview
// deploys without env var still get a working WalletConnect connector.
const WALLETCONNECT_PROJECT_ID_FALLBACK = 'c686c263-811c-4eba-97e4-9eaea3d4375c'
const walletConnectProjectId =
  (import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string | undefined) ||
  WALLETCONNECT_PROJECT_ID_FALLBACK

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
