/**
 * Phase 7 — sign the Charter (docs/CHARTER.md) on-chain via CharterRegistry.
 *
 * The transaction calldata embeds the SHA-256 of the Charter UTF-8 bytes plus
 * the version string parsed from the file's first lines. Anyone can verify
 * the on-chain hash matches the file at a given commit.
 *
 * USAGE:
 *   tsx scripts/sign_charter_onchain.ts \
 *     --signer-key $CTO_PRIVATE_KEY \
 *     --registry $CHARTER_REGISTRY_ADDRESS \
 *     --charter docs/CHARTER.md
 *
 * After running:
 *   - Append the tx hash to docs/CHARTER.md "Firmantes" section
 *   - Repeat for CEO and each Guardián post-onboarding
 */

import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
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

const REGISTRY_ABI = parseAbi([
  'function sign(bytes32 charterHash, string calldata version) external',
])

function sha256Hex(buf: Buffer): Hex {
  return ('0x' + createHash('sha256').update(buf).digest('hex')) as Hex
}

function extractVersion(text: string): string {
  // Match "Versión 1.0" or "Version 1.0" in the first 5 lines
  const head = text.split('\n').slice(0, 8).join('\n')
  const m = head.match(/Versi[óo]n\s+([0-9.]+)/i) ?? head.match(/Version\s+([0-9.]+)/i)
  return m?.[1] ?? '1.0'
}

async function main() {
  const signerKey = (args['signer-key'] ?? process.env.SIGNER_PRIVATE_KEY) as Hex
  const registry  = (args.registry ?? process.env.CHARTER_REGISTRY_ADDRESS) as Address
  const charterPath = args.charter ?? 'docs/CHARTER.md'
  if (!signerKey || !registry) throw new Error('--signer-key + --registry required')

  const text   = readFileSync(charterPath, 'utf-8')
  const buffer = Buffer.from(text, 'utf-8')
  const hash   = sha256Hex(buffer)
  const version = extractVersion(text)
  console.log(`Charter sha256: ${hash}`)
  console.log(`Version: ${version}`)

  const chain = process.env.WEB3_CHAIN_ID === '84532' ? baseSepolia : base
  const rpc   = process.env.BASE_RPC_URL ?? (chain === base ? 'https://mainnet.base.org' : 'https://sepolia.base.org')

  const account = privateKeyToAccount(signerKey)
  const wallet  = createWalletClient({ account, chain, transport: http(rpc) })

  const data = encodeFunctionData({
    abi: REGISTRY_ABI,
    functionName: 'sign',
    args: [hash, version],
  })

  console.log(`Signing as ${account.address}…`)
  const tx = await wallet.sendTransaction({ to: registry, data })
  console.log(`Tx: ${tx}`)
  console.log(`Explorer: ${chain === base ? 'https://basescan.org' : 'https://sepolia.basescan.org'}/tx/${tx}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
