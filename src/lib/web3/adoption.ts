// Helpers for the TreeAdoption.sol crypto-adoption flow.
// Reads price for the chosen asset from the contract; surfaces a single
// `prepareAdopt` helper that wagmi callers wire into useWriteContract.

import { keccak256, toHex, type Hex } from 'viem'
import { ETH_PSEUDO_ADDRESS } from '../../utils/constants'

/** Minimal ABI for adopt entrypoints + reads. */
export const TREE_ADOPTION_ABI = [
  {
    type: 'function',
    name: 'adoptWithEth',
    stateMutability: 'payable',
    inputs: [
      { name: 'treeId',      type: 'bytes32' },
      { name: 'guardianId',  type: 'uint8' },
      { name: 'varietyHash', type: 'bytes32' },
      { name: 'gpsHash',     type: 'bytes32' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'adoptWithToken',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'asset',       type: 'address' },
      { name: 'treeId',      type: 'bytes32' },
      { name: 'guardianId',  type: 'uint8' },
      { name: 'varietyHash', type: 'bytes32' },
      { name: 'gpsHash',     type: 'bytes32' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'priceByAsset',
    stateMutability: 'view',
    inputs: [{ name: 'asset', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'assetEnabled',
    stateMutability: 'view',
    inputs: [{ name: 'asset', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'guardianWallets',
    stateMutability: 'view',
    inputs: [{ name: 'guardianId', type: 'uint8' }],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    type: 'event',
    name: 'TreeAdopted',
    inputs: [
      { name: 'buyer',       type: 'address', indexed: true },
      { name: 'treeId',      type: 'bytes32', indexed: true },
      { name: 'guardianId',  type: 'uint8',   indexed: false },
      { name: 'asset',       type: 'address', indexed: true },
      { name: 'amount',      type: 'uint256', indexed: false },
      { name: 'varietyHash', type: 'bytes32', indexed: false },
      { name: 'gpsHash',     type: 'bytes32', indexed: false },
    ],
  },
] as const

/** ERC-20 minimal ABI for approve calls before adoptWithToken. */
export const ERC20_APPROVE_ABI = [
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'value',   type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
  {
    type: 'function',
    name: 'allowance',
    stateMutability: 'view',
    inputs: [
      { name: 'owner',   type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'decimals',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint8' }],
  },
] as const

/**
 * Convert a Supabase tree UUID to the bytes32 the contract expects.
 * Mirrors the hash strategy used by `mint-tree-nft` Edge Function.
 */
export function treeIdToBytes32(uuid: string): Hex {
  return keccak256(toHex(uuid))
}

/** keccak256(variety) — bytes32. */
export function varietyToBytes32(variety: string): Hex {
  return keccak256(toHex(variety))
}

/**
 * GPS hash mirrors the server-side strategy: keccak256(lat || lng || guardianSalt).
 * Frontend never sees raw GPS — server provides this hash via API.
 */
export function gpsHashFromServer(serverProvided: string): Hex {
  return serverProvided as Hex
}

export const ETH_ASSET = ETH_PSEUDO_ADDRESS
