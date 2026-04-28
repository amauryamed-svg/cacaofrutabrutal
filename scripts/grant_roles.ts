/**
 * Post-deploy role wiring. Consolidates the role grants the Deploy.s.sol
 * functions document but don't execute (since some require knowing the
 * relayer/oracle EOA addresses determined out-of-band).
 *
 * Run after EACH of: Phase 3, 4, 5, 6, 7 deploys.
 *
 * USAGE:
 *   tsx scripts/grant_roles.ts --phase 3 --admin-key $ADMIN_PRIVATE_KEY
 *
 * Required env per phase (only what each phase needs):
 *   Phase 3: CACAO_TREE_NFT_ADDRESS, RELAYER_ADDRESS
 *   Phase 4: CACAO_TOKEN_ADDRESS, MAZORCA_REDEMPTION_ADDRESS, IOT_ORACLE_ADDRESS (no — that's Phase 6)
 *            ORACLE_ADDRESS (the redemption signer EOA)
 *   Phase 5: TREE_ADOPTION_ADDRESS, GUARDIAN_0_WALLET..GUARDIAN_4_WALLET, USDC, ETH price wei, etc.
 *   Phase 6: IOT_ATTESTATION_ADDRESS, IOT_ORACLE_ADDRESS
 */

import {
  createWalletClient,
  http,
  parseAbi,
  encodeFunctionData,
  type Hex,
  type Address,
} from 'viem'
import { base, baseSepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

const args = Object.fromEntries(
  process.argv.slice(2).reduce<[string, string][]>((acc, a, i, arr) => {
    if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1] ?? 'true'])
    return acc
  }, [])
)

const chain = process.env.WEB3_CHAIN_ID === '84532' ? baseSepolia : base
const rpc   = process.env.BASE_RPC_URL ?? (chain === base ? 'https://mainnet.base.org' : 'https://sepolia.base.org')

const ACCESS_CONTROL_ABI = parseAbi([
  'function MINTER_ROLE() external view returns (bytes32)',
  'function ORACLE_ROLE() external view returns (bytes32)',
  'function ADMIN_ROLE() external view returns (bytes32)',
  'function PAUSER_ROLE() external view returns (bytes32)',
  'function grantRole(bytes32 role, address account) external',
])

const TREE_ADOPTION_ABI = parseAbi([
  'function setGuardianWallet(uint8 guardianId, address wallet) external',
  'function setAssetEnabled(address asset, bool enabled) external',
  'function setPrice(address asset, uint256 amount) external',
])

async function main() {
  const phase = Number(args.phase)
  const key   = (args['admin-key'] ?? process.env.ADMIN_PRIVATE_KEY) as Hex
  if (!key)   throw new Error('--admin-key or ADMIN_PRIVATE_KEY required')

  const account = privateKeyToAccount(key)
  const wallet  = createWalletClient({ account, chain, transport: http(rpc) })
  console.log(`Admin: ${account.address} · phase ${phase} · chain ${chain.id}`)

  if (phase === 3) {
    const nft     = process.env.CACAO_TREE_NFT_ADDRESS as Address
    const relayer = process.env.RELAYER_ADDRESS as Address
    if (!nft || !relayer) throw new Error('Phase 3 needs CACAO_TREE_NFT_ADDRESS + RELAYER_ADDRESS')
    const minterRole = '0x' + 'minter'.padEnd(64, '0') as Hex // overwritten below
    const role = await readBytes32Role(wallet, nft, 'MINTER_ROLE')
    void minterRole
    await sendRoleGrant(wallet, nft, role, relayer)
  }

  if (phase === 4) {
    const token       = process.env.CACAO_TOKEN_ADDRESS as Address
    const redemption  = process.env.MAZORCA_REDEMPTION_ADDRESS as Address
    const oracle      = process.env.ORACLE_ADDRESS as Address
    if (!token || !redemption || !oracle) {
      throw new Error('Phase 4 needs CACAO_TOKEN_ADDRESS + MAZORCA_REDEMPTION_ADDRESS + ORACLE_ADDRESS')
    }
    const minterRole = await readBytes32Role(wallet, token, 'MINTER_ROLE')
    await sendRoleGrant(wallet, token, minterRole, redemption)
    const oracleRole = await readBytes32Role(wallet, redemption, 'ORACLE_ROLE')
    await sendRoleGrant(wallet, redemption, oracleRole, oracle)
  }

  if (phase === 5) {
    const adoption = process.env.TREE_ADOPTION_ADDRESS as Address
    if (!adoption) throw new Error('Phase 5 needs TREE_ADOPTION_ADDRESS')
    const usdc = process.env.USDC_ADDRESS as Address
    const usdcPrice = BigInt(process.env.USDC_PRICE_RAW ?? '0')
    const ethPriceWei = BigInt(process.env.ETH_PRICE_WEI ?? '0')

    for (let i = 0; i <= 4; i++) {
      const w = process.env[`GUARDIAN_${i}_WALLET`] as Address | undefined
      if (!w) { console.log(`Skipping guardian ${i} (no env)`); continue }
      console.log(`Setting guardian[${i}] = ${w}`)
      await sendCalldata(wallet, adoption, encodeFunctionData({
        abi: TREE_ADOPTION_ABI, functionName: 'setGuardianWallet', args: [i, w],
      }))
    }
    if (usdc && usdcPrice > 0n) {
      await sendCalldata(wallet, adoption, encodeFunctionData({ abi: TREE_ADOPTION_ABI, functionName: 'setAssetEnabled', args: [usdc, true] }))
      await sendCalldata(wallet, adoption, encodeFunctionData({ abi: TREE_ADOPTION_ABI, functionName: 'setPrice',        args: [usdc, usdcPrice] }))
    }
    if (ethPriceWei > 0n) {
      const eth = '0x0000000000000000000000000000000000000000' as Address
      await sendCalldata(wallet, adoption, encodeFunctionData({ abi: TREE_ADOPTION_ABI, functionName: 'setAssetEnabled', args: [eth, true] }))
      await sendCalldata(wallet, adoption, encodeFunctionData({ abi: TREE_ADOPTION_ABI, functionName: 'setPrice',        args: [eth, ethPriceWei] }))
    }
  }

  if (phase === 6) {
    const att   = process.env.IOT_ATTESTATION_ADDRESS as Address
    const orac  = process.env.IOT_ORACLE_ADDRESS as Address
    if (!att || !orac) throw new Error('Phase 6 needs IOT_ATTESTATION_ADDRESS + IOT_ORACLE_ADDRESS')
    const role = await readBytes32Role(wallet, att, 'ORACLE_ROLE')
    await sendRoleGrant(wallet, att, role, orac)
  }

  console.log('Done.')
}

async function readBytes32Role(
  wallet: ReturnType<typeof createWalletClient>,
  contract: Address,
  fn: 'MINTER_ROLE' | 'ORACLE_ROLE' | 'ADMIN_ROLE' | 'PAUSER_ROLE'
): Promise<Hex> {
  // Compute the keccak256 ourselves to avoid an extra RPC for the constant
  // (contracts derive these the same way: keccak256("MINTER_ROLE") etc.).
  const keccak = await import('viem').then(m => m.keccak256)
  const toBytes = await import('viem').then(m => m.toBytes)
  return keccak(toBytes(fn))
}

async function sendRoleGrant(
  wallet: ReturnType<typeof createWalletClient>,
  contract: Address,
  role: Hex,
  account: Address
): Promise<void> {
  const data = encodeFunctionData({
    abi: ACCESS_CONTROL_ABI,
    functionName: 'grantRole',
    args: [role, account],
  })
  await sendCalldata(wallet, contract, data)
}

async function sendCalldata(
  wallet: ReturnType<typeof createWalletClient>,
  to: Address,
  data: Hex
): Promise<void> {
  const hash = await wallet.sendTransaction({ to, data })
  console.log(`  → ${hash}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
