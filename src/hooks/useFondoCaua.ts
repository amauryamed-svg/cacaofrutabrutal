import { useReadContracts, useAccount } from 'wagmi'
import { WEB3_CONTRACTS, ACTIVE_CHAIN_ID } from '../utils/constants'
import { FONDO_CAUA_ABI, ETH_ASSET, USDC_BASE_SEPOLIA, estimateUsd, FONDO_GOAL_USD_CENTS } from '../lib/web3/fondo'

const ZERO_ADDR = '0x0000000000000000000000000000000000000000' as `0x${string}`
const NOT_DEPLOYED = WEB3_CONTRACTS.fondoCaua === ZERO_ADDR

export interface FondoCauaData {
  totalEthWei:    bigint
  totalUsdcRaw:   bigint
  userEthWei:     bigint
  userUsdcRaw:    bigint
  isPaused:       boolean
  estimatedUsd:   number
  goalUsd:        number
  pctFunded:      number
  deployed:       boolean
  loading:        boolean
  error:          boolean
}

export function useFondoCaua(): FondoCauaData {
  const { address } = useAccount()
  const caller = address ?? ZERO_ADDR

  const contract = {
    address: WEB3_CONTRACTS.fondoCaua,
    abi: FONDO_CAUA_ABI,
    chainId: ACTIVE_CHAIN_ID,
  } as const

  const { data, isLoading, isError } = useReadContracts({
    contracts: [
      { ...contract, functionName: 'totalRaised',      args: [ETH_ASSET] },
      { ...contract, functionName: 'totalRaised',      args: [USDC_BASE_SEPOLIA] },
      { ...contract, functionName: 'ethContributed',   args: [caller] },
      { ...contract, functionName: 'tokenContributed', args: [caller, USDC_BASE_SEPOLIA] },
      { ...contract, functionName: 'paused' },
    ],
    query: { enabled: !NOT_DEPLOYED, refetchInterval: 12_000 },
  })

  const totalEthWei  = (data?.[0]?.result as bigint | undefined) ?? 0n
  const totalUsdcRaw = (data?.[1]?.result as bigint | undefined) ?? 0n
  const userEthWei   = (data?.[2]?.result as bigint | undefined) ?? 0n
  const userUsdcRaw  = (data?.[3]?.result as bigint | undefined) ?? 0n
  const isPaused     = (data?.[4]?.result as boolean | undefined) ?? false

  const goalUsd      = FONDO_GOAL_USD_CENTS / 100
  const estimatedUsd = estimateUsd(totalEthWei, totalUsdcRaw)
  const pctFunded    = goalUsd > 0 ? Math.min(100, Math.round((estimatedUsd / goalUsd) * 100)) : 0

  return {
    totalEthWei, totalUsdcRaw, userEthWei, userUsdcRaw,
    isPaused, estimatedUsd, goalUsd, pctFunded,
    deployed: !NOT_DEPLOYED,
    loading: isLoading,
    error:   isError,
  }
}
