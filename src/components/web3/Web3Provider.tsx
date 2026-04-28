import { ReactNode } from 'react'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { wagmiConfig } from '../../lib/web3/wagmi'
import { BRAND, FONTS } from '../../utils/constants'

import '@rainbow-me/rainbowkit/styles.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

const cauaTheme = darkTheme({
  accentColor: BRAND.mazorca,
  accentColorForeground: BRAND.bgDeep,
  borderRadius: 'small',
  fontStack: 'system',
  overlayBlur: 'small',
})

cauaTheme.fonts.body = FONTS.body

export default function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={cauaTheme} modalSize="compact">
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
