/**
 * Phase 7 — seed initial $CACAO/USDC liquidity on Uniswap v3 (Base) and lock
 * the LP NFT in LPTimelock for 12 months. Charter principle I.4: no-rug by design.
 *
 * This script is one-shot. Run AFTER:
 *   1. Audit clean (Code4rena/Sherlock — see docs/AUDIT.md)
 *   2. CharterRegistry deployed AND signed by CTO + CEO
 *   3. Treasury holds enough $CACAO + USDC for the chosen seed
 *   4. LPTimelock deployed with `LP_RELEASE_AT >= now + 365 days`
 *
 * USAGE:
 *   tsx scripts/seed_uniswap_v3.ts \
 *     --treasury-key $TREASURY_PRIVATE_KEY \
 *     --cacao $CACAO_TOKEN_ADDRESS \
 *     --usdc $BASE_USDC \
 *     --timelock $LP_TIMELOCK \
 *     --cacao-amount 1000000000000000000000  # 1k $CACAO (18 dec)
 *     --usdc-amount  10000000000             # 10k USDC  (6 dec)
 *
 * NOTES:
 *   - Fee tier 10000 (1%) — appropriate for low-liquidity launch.
 *   - Tick range chosen as full-range for simplicity; concentrated ranges
 *     can be added in a follow-up after price discovery.
 *   - Treasury wallet MUST sign — this script does NOT execute automatically.
 */

import {
  createWalletClient,
  createPublicClient,
  http,
  parseAbi,
  encodeFunctionData,
  type Hex,
  type Address,
} from 'viem'
import { base, baseSepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

const args = parseArgs(process.argv.slice(2))
const chain = args.network === 'base-sepolia' ? baseSepolia : base
const rpc   = process.env.BASE_RPC_URL ?? (chain === base ? 'https://mainnet.base.org' : 'https://sepolia.base.org')

// Uniswap v3 NonfungiblePositionManager — Base mainnet canonical address.
// Override via env if a different deployment is used.
const NPM_BASE_MAINNET = '0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1' as const
const NPM_BASE_SEPOLIA = '0x27F971cb582BF9E50F397e4d29a5C7A34f11faA2' as const
const NPM = (process.env.UNISWAP_V3_NPM as Address) ?? (chain === base ? NPM_BASE_MAINNET : NPM_BASE_SEPOLIA)

const FEE_TIER_1PCT = 10000

// Tick math for FULL RANGE liquidity.
// Uniswap v3 spec: MIN_TICK = -887272, MAX_TICK = 887272.
// For fee tier 10000, tickSpacing = 200, so usable bounds are ±887200.
const FULL_RANGE_TICK_LOWER = -887200
const FULL_RANGE_TICK_UPPER =  887200

// ─── ABIs ───────────────────────────────────────────────────────────────

const ERC20_ABI = parseAbi([
  'function approve(address spender, uint256 value) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
])

const NPM_ABI = parseAbi([
  'function createAndInitializePoolIfNecessary(address token0, address token1, uint24 fee, uint160 sqrtPriceX96) external payable returns (address pool)',
  'function mint((address token0,address token1,uint24 fee,int24 tickLower,int24 tickUpper,uint256 amount0Desired,uint256 amount1Desired,uint256 amount0Min,uint256 amount1Min,address recipient,uint256 deadline)) external payable returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)',
  'function safeTransferFrom(address from, address to, uint256 tokenId) external',
])

// ─── Helpers ────────────────────────────────────────────────────────────

function parseArgs(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2)
      const val = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true'
      out[key] = val
    }
  }
  return out
}

function require_(key: string): string {
  const v = args[key.replaceAll('_', '-')] ?? process.env[key]
  if (!v) throw new Error(`missing required arg --${key.replaceAll('_', '-')} or env ${key}`)
  return v
}

function sortTokens(a: Address, b: Address): { token0: Address; token1: Address; flipped: boolean } {
  const flipped = a.toLowerCase() > b.toLowerCase()
  return flipped ? { token0: b, token1: a, flipped } : { token0: a, token1: b, flipped }
}

/**
 * Compute sqrtPriceX96 for an initial price = price1 / price0 (token1 per token0).
 * For $CACAO/USDC: 1 $CACAO = X USDC → price = X / 1 (after decimal adjustment).
 * The chosen seed price should reflect the implied utility (Marketplace discount tier).
 *
 * sqrtPriceX96 = sqrt(price1 * 10^d1 / (price0 * 10^d0)) * 2^96
 *
 * For simplicity we accept it precomputed via env SEED_SQRT_PRICE_X96.
 */
function loadSqrtPriceX96(): bigint {
  const v = require_('SEED_SQRT_PRICE_X96')
  return BigInt(v)
}

// ─── Main ───────────────────────────────────────────────────────────────

async function main() {
  const treasuryKey = require_('treasury_key') as Hex
  const cacao       = require_('cacao').toLowerCase() as Address
  const usdc        = require_('usdc').toLowerCase()  as Address
  const timelock    = require_('timelock').toLowerCase() as Address
  const cacaoAmount = BigInt(require_('cacao_amount'))
  const usdcAmount  = BigInt(require_('usdc_amount'))

  const account = privateKeyToAccount(treasuryKey)
  const wallet  = createWalletClient({ account, chain, transport: http(rpc) })
  const pub     = createPublicClient({ chain, transport: http(rpc) })

  console.log('Treasury:', account.address)
  console.log('Chain:', chain.id)
  console.log('NPM:', NPM)

  const { token0, token1, flipped } = sortTokens(cacao, usdc)
  const amount0Desired = flipped ? usdcAmount  : cacaoAmount
  const amount1Desired = flipped ? cacaoAmount : usdcAmount

  // Step 1: createAndInitializePoolIfNecessary
  const sqrtPriceX96 = loadSqrtPriceX96()
  console.log(`Initialising pool ${token0}/${token1} at sqrtPriceX96=${sqrtPriceX96}…`)
  const initTx = await wallet.sendTransaction({
    to: NPM,
    data: encodeFunctionData({
      abi: NPM_ABI,
      functionName: 'createAndInitializePoolIfNecessary',
      args: [token0, token1, FEE_TIER_1PCT, sqrtPriceX96],
    }),
  })
  console.log(`Init tx: ${initTx}`)
  await pub.waitForTransactionReceipt({ hash: initTx })

  // Step 2: approve NPM to pull both tokens
  for (const [token, amount] of [[cacao, cacaoAmount], [usdc, usdcAmount]] as const) {
    console.log(`Approving ${token} for ${amount}…`)
    const tx = await wallet.sendTransaction({
      to: token,
      data: encodeFunctionData({ abi: ERC20_ABI, functionName: 'approve', args: [NPM, amount] }),
    })
    await pub.waitForTransactionReceipt({ hash: tx })
  }

  // Step 3: mint LP position to treasury (we move it to timelock in step 4)
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 600)
  console.log('Minting LP position…')
  const mintTx = await wallet.sendTransaction({
    to: NPM,
    data: encodeFunctionData({
      abi: NPM_ABI,
      functionName: 'mint',
      args: [{
        token0,
        token1,
        fee: FEE_TIER_1PCT,
        tickLower: FULL_RANGE_TICK_LOWER,
        tickUpper: FULL_RANGE_TICK_UPPER,
        amount0Desired,
        amount1Desired,
        amount0Min: 0n,
        amount1Min: 0n,
        recipient: account.address,
        deadline,
      }],
    }),
  })
  const mintReceipt = await pub.waitForTransactionReceipt({ hash: mintTx })
  console.log(`Mint tx: ${mintTx}`)

  // Step 4: parse tokenId from logs (Uniswap NPM emits IncreaseLiquidity + ERC721 Transfer).
  // The first ERC721 Transfer with from=zero, to=treasury IS the new LP NFT.
  const transferTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
  const lpTransferLog = mintReceipt.logs.find(l =>
    l.topics[0] === transferTopic
    && l.topics[1] === '0x0000000000000000000000000000000000000000000000000000000000000000'
  )
  if (!lpTransferLog) throw new Error('mint receipt missing LP Transfer log')
  const tokenId = BigInt(lpTransferLog.topics[3] as Hex)
  console.log(`LP tokenId: ${tokenId}`)

  // Step 5: safeTransferFrom NPM tokenId → LPTimelock
  console.log(`Locking LP NFT in ${timelock}…`)
  const lockTx = await wallet.sendTransaction({
    to: NPM,
    data: encodeFunctionData({
      abi: NPM_ABI,
      functionName: 'safeTransferFrom',
      args: [account.address, timelock, tokenId],
    }),
  })
  await pub.waitForTransactionReceipt({ hash: lockTx })
  console.log(`Lock tx: ${lockTx}`)
  console.log('Done. LP locked. Verify on BaseScan and post the txs to docs/SEED_LP.md.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
