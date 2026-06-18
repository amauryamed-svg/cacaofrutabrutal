// wagmi v2 + RainbowKit + Coinbase Smart Wallet config.
// Uses connectorsForWallets (RainbowKit) so the "Get a Wallet" discovery
// screen is properly populated for non-crypto users.
// Lazy-imported only by /app/web3/* routes — keeps the marketing bundle clean.
// See docs/WEB3.md.

import { http, createConfig } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { connectorsForWallets } from '@rainbow-me/rainbowkit'
import {
  coinbaseWallet,
  metaMaskWallet,
  rabbyWallet,
  walletConnectWallet,
  rainbowWallet,
  trustWallet,
} from '@rainbow-me/rainbowkit/wallets'
import { BASE_RPC, BASE_CHAIN_ID } from '../../utils/constants'

// WalletConnect Project ID is public by design — visible in any client bundle.
const walletConnectProjectId =
  (import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string | undefined) ||
  'c686c263-811c-4eba-97e4-9eaea3d4375c'

// Coinbase Smart Wallet (passkey-based, no extension needed) — primary UX.
coinbaseWallet.preference = 'smartWalletOnly'

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [coinbaseWallet, metaMaskWallet, rabbyWallet, walletConnectWallet],
    },
    {
      groupName: 'More',
      wallets: [rainbowWallet, trustWallet],
    },
  ],
  { appName: 'CauaCorp', projectId: walletConnectProjectId },
)

export const wagmiConfig = createConfig({
  chains: [base, baseSepolia],
  connectors,
  transports: {
    [base.id]: http(BASE_RPC),
    [baseSepolia.id]: http('https://sepolia.base.org'),
  },
  ssr: false,
})

export const DEFAULT_CHAIN_ID = BASE_CHAIN_ID
