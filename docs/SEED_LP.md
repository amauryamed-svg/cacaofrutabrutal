# Phase 7 — $CACAO/USDC Liquidity Seed Runbook

> Charter principle I.4: liquidez seed timelocked 12 meses. No-rug por diseño.

This runbook documents the one-shot seeding of initial Uniswap v3 liquidity for `$CACAO/USDC` on Base, and the immediate transfer of the resulting LP NFT to [`LPTimelock.sol`](../contracts/src/LPTimelock.sol). Once executed, the on-chain tx hashes go below for public verification.

## Pre-conditions

- [ ] Audit clean (see [`docs/AUDIT.md`](AUDIT.md))
- [ ] `CharterRegistry` deployed; CTO + CEO have signed Charter v1.0 on-chain
- [ ] Treasury wallet holds:
  - $CACAO tokens (earned through gameplay only — no founder mint, see Charter I.3)
  - USDC matching the chosen seed depth
- [ ] `LPTimelock` deployed with `releaseAt = now + 12 months` minimum
- [ ] Audit findings posted publicly on Mirror.xyz
- [ ] `docs/LEGAL.md` updated with the disclosures listed in section 7 of that file

## Parameters (to be filled in pre-launch)

| Parameter | Value | Source |
|---|---|---|
| Pool fee tier | 1% (10000) | Default for low-liquidity launch |
| Tick range | Full range (`±887200`) | Simplest; refine to concentrated post price discovery |
| Initial price ($CACAO per USDC) | _TBD_ | Implied by Marketplace utility — fill before run |
| Seed $CACAO amount | _TBD_ (in 18-decimal wei) | Treasury holdings |
| Seed USDC amount | _TBD_ (in 6-decimal units) | Treasury holdings |
| `LP_RELEASE_AT` | _TBD_ unix ts | `now + 365 days` minimum |
| Treasury wallet | _TBD_ Base Smart Wallet (Safe) | Multi-sig |

## Run

```bash
export TREASURY_PRIVATE_KEY=0x...                # NEVER committed
export BASE_RPC_URL=https://...                  # Coinbase CDP
export SEED_SQRT_PRICE_X96=...                   # Computed offline

tsx scripts/seed_uniswap_v3.ts \
  --treasury-key $TREASURY_PRIVATE_KEY \
  --cacao $CACAO_TOKEN_ADDRESS \
  --usdc 0x833589fcd6edb6e08f4c7c32d4f71b54bda02913 \
  --timelock $LP_TIMELOCK_ADDRESS \
  --cacao-amount <CACAO_WEI> \
  --usdc-amount  <USDC_RAW>
```

Expected steps logged:
1. `createAndInitializePoolIfNecessary` tx
2. ERC-20 approval txs (×2)
3. `mint` tx → returns LP NFT tokenId
4. `safeTransferFrom(treasury, timelock, tokenId)` tx

## Post-run checklist

- [ ] All 4 txs confirmed on BaseScan
- [ ] LP NFT owner = LPTimelock address (verify via `npm.ownerOf(tokenId)`)
- [ ] `LPTimelock.tokenId()` returns the same tokenId
- [ ] Update this section with tx hashes (replace `_TBD_`)
- [ ] Mirror.xyz post: include all 4 tx hashes + LPTimelock address + 12-month release date
- [ ] `src/utils/constants.ts:WEB3_CONTRACTS` updated with `lpTimelock` slot
- [ ] Public dashboard at `/web3/transparency` (Phase 8) reads from `LPTimelock.timeUntilRelease()`

## Public proof (filled in post-launch)

| Step | Tx Hash | Block | Notes |
|---|---|---|---|
| Pool init | `_TBD_` | `_TBD_` | |
| Approve $CACAO | `_TBD_` | `_TBD_` | |
| Approve USDC | `_TBD_` | `_TBD_` | |
| Mint LP | `_TBD_` | `_TBD_` | tokenId: `_TBD_` |
| Transfer to timelock | `_TBD_` | `_TBD_` | LPTimelock: `_TBD_` |

## Why fee tier 1%?

Low initial liquidity → fewer swaps → fee tier matters less for LP yield, but a lower tier (0.05% or 0.30%) would let arb bots drain it cheaply during early price discovery. 1% is the standard for new tokens on Uniswap v3 and matches what most $CACAO-equivalent launches use.

## Why full-range?

Concentrated liquidity rewards LPs with higher fee yield IF the price stays in range. For a brand-new launch with no oracle price, full-range is the only way to guarantee swaps execute regardless of where the market settles. We can migrate to concentrated ranges in a follow-up after 90 days of price data.

## After 12 months

`LPTimelock.release()` becomes callable by `beneficiary` (treasury). At that point, governance (Charter §IV mecanismo de enmienda) decides whether to:
- Withdraw and migrate to a different protocol
- Re-deposit into a new timelock for another 12 months (recommended default)
- Restructure (concentrated range, new fee tier)

Whatever choice is made, the decision is published 30 days before action with the same Charter amendment process.

## Contingency: paused contract

If the audit reveals a critical issue post-deploy that requires `pause()`, the LP seed is **deferred** until contracts are unpaused and re-audited. Treasury holds funds in cold storage in the meantime.
