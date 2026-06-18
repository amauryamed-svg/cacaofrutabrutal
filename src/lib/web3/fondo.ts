// ABI and helpers for FondoCaua.sol on-chain treasury.

/** Sentinel for ETH in contract asset mappings. */
export const ETH_ASSET = '0x0000000000000000000000000000000000000000' as `0x${string}`

/** USDC on Base Sepolia (Circle official). */
export const USDC_BASE_SEPOLIA = '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as `0x${string}`

/** USDC on Base mainnet. */
export const USDC_BASE_MAINNET = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as `0x${string}`

/** Allocation percentages — mirrors FondoCaua.sol immutable BPS constants. */
export const FONDO_ALLOC = { tech: 40, lots: 40, rd: 20 } as const

/** Campaign goal in USD cents ($250 000). */
export const FONDO_GOAL_USD_CENTS = 25_000_000

/** Approximate ETH/USD rate for display — not authoritative, no oracle dependency. */
export const ETH_USD_APPROX = 3_400

export const FONDO_CAUA_ABI = [
  {
    type: 'function', name: 'contributeETH',
    stateMutability: 'payable', inputs: [], outputs: [],
  },
  {
    type: 'function', name: 'contributeToken',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'token', type: 'address' }, { name: 'amount', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function', name: 'totalRaised',
    stateMutability: 'view',
    inputs: [{ name: 'asset', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function', name: 'ethContributed',
    stateMutability: 'view',
    inputs: [{ name: 'contributor', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function', name: 'tokenContributed',
    stateMutability: 'view',
    inputs: [{ name: 'contributor', type: 'address' }, { name: 'token', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function', name: 'tokenEnabled',
    stateMutability: 'view',
    inputs: [{ name: 'token', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function', name: 'paused',
    stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function', name: 'TECH_BPS',
    stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'uint16' }],
  },
  {
    type: 'function', name: 'LOTS_BPS',
    stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'uint16' }],
  },
  {
    type: 'function', name: 'RD_BPS',
    stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'uint16' }],
  },
  {
    type: 'event', name: 'Contributed',
    inputs: [
      { name: 'contributor', type: 'address', indexed: true },
      { name: 'asset',       type: 'address', indexed: true },
      { name: 'amount',      type: 'uint256', indexed: false },
      { name: 'timestamp',   type: 'uint256', indexed: false },
    ],
  },
] as const

/** wei → ETH string, 4 decimals. */
export function fmtEth(wei: bigint): string {
  return (Number(wei) / 1e18).toFixed(4)
}

/** USDC raw (6 decimals) → display string. */
export function fmtUsdc(raw: bigint): string {
  return (Number(raw) / 1e6).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/**
 * Rough USD estimate from on-chain totals.
 * ETH price is approximate — not from oracle. For display only.
 */
export function estimateUsd(ethWei: bigint, usdcRaw: bigint): number {
  const ethUsd  = (Number(ethWei)  / 1e18) * ETH_USD_APPROX
  const usdcUsd = Number(usdcRaw)  / 1e6
  return ethUsd + usdcUsd
}
