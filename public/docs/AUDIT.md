# CauaCorp — Audit Preparation Pack

> Phase 7 gate. NO mainnet deploys touch real user funds until this audit completes clean.

## Engagement plan

- **Provider:** Code4rena Contest OR Sherlock-style competitive audit.
- **Budget:** $5,000 – $15,000 USD (pool size + payouts).
- **Window:** 7–14 days.
- **Pre-audit prep:** 5 business days. Foundry `forge test --gas-report` clean; coverage > 90% on contracts in scope; this doc up to date.

## Contracts in scope

| Contract | LOC | Storage | External fns | Roles | Notes |
|---|---|---|---|---|---|
| `CacaoTreeNFT.sol` | 151 | 3 mappings, 2 vars | `mintTree`, `touch`, `setBaseURI`, `pause`, `unpause`, `tokenURI`, `supportsInterface` | MINTER_ROLE, PAUSER_ROLE, DEFAULT_ADMIN_ROLE | ERC-721 + IERC4906; OZ v5 |
| `CacaoToken.sol` | 60 | inherited | `mint`, `pause`, `unpause`, ERC-20 surface, ERC20Burnable | MINTER_ROLE only granted to MazorcaRedemption | Cap 21M; ERC20Capped + Burnable |
| `MazorcaRedemption.sol` | 150 | 2 mappings, 2 vars | `claim`, `setMazorcasPerToken`, `pause`, `unpause`, `domainSeparator`, `hashBurn` | ORACLE_ROLE (server EOA), PAUSER_ROLE, ADMIN_ROLE | EIP-712; nonce single-use; 30-day cooldown |
| `TreeAdoption.sol` | 214 | 2 mappings, 4 vars | `adoptWithEth`, `adoptWithToken`, admin setters, `pause`, `rescue` | PAUSER_ROLE, ADMIN_ROLE | ReentrancyGuard; SafeERC20; Address.sendValue |
| `IoTAttestation.sol` | 99 | 1 mapping, 1 var | `postRoot`, `verifyLeaf`, `getRoot`, `pause`, `unpause` | ORACLE_ROLE, PAUSER_ROLE | OZ MerkleProof; single-write per week |
| `LPTimelock.sol` | 130 | 4 vars | `onERC721Received`, `collectFees`, `release`, `timeUntilRelease` | beneficiary-only modifier (no roles) | Single LP NFT; 12-month timelock; fees collectable anytime |
| `CharterRegistry.sol` | 60 | 2 mappings | `sign`, `getSignature` | none — append-only by anyone | Public ledger of Charter sigs |

**Out of scope:**
- Off-chain Edge Functions (separate audit by application security firm if needed).
- Third-party (Uniswap v3 NPM, OZ contracts).
- Front-end React code.

## Threat model — high-priority concerns

| # | Threat | Affected | Mitigation in code | Audit ask |
|---|---|---|---|---|
| 1 | Relayer key theft → drain Paymaster + rogue mints | mint-tree-nft + CacaoTreeNFT | Per-user 24h rate limit in Edge Function | Confirm there's no on-chain way to bypass the off-chain rate limit |
| 2 | Oracle key theft → free $CACAO mint | sign-mazorca-burn + MazorcaRedemption | On-chain 30-day per-user cooldown + nonce single-use | Confirm replay impossible across chains (chainId in domain) and across versions (version in domain) |
| 3 | EIP-712 domain mismatch between server + contract | sign-mazorca-burn + MazorcaRedemption | Hardcoded `name="CauaMazorcaRedemption"`, `version="1"` in both | Confirm both sides byte-identical; suggest test that signs with one side and verifies with the other |
| 4 | Reentrancy via ERC-20 hooks on TreeAdoption | TreeAdoption | OZ ReentrancyGuard + checks-effects-interactions | Confirm SafeERC20 + sendValue ordering doesn't leave an opening |
| 5 | Asset whitelist bypass (allow ETH-pseudo through `adoptWithToken`) | TreeAdoption | `revert AssetNotEnabled(0)` early in `adoptWithToken` | Already tested; confirm |
| 6 | LP timelock bypass | LPTimelock | Beneficiary-only `release()` + `block.timestamp >= releaseAt` + `released` flag | Confirm no callback-style attack via NPM |
| 7 | Merkle proof second-preimage on IoTAttestation | IoTAttestation | OZ `MerkleProof.verify` (sorted-pair, leaves 32 bytes) | Confirm leaf format prevents second-preimage (we use SHA-256 leaves; OZ uses keccak256 internal — confirm no length-extension attack vector) |
| 8 | NFT mint griefing | CacaoTreeNFT | `treeIdToToken` mapping prevents double-mint by treeId | Confirm |
| 9 | Pause bypass | All contracts | OZ `Pausable._update` hooks | Confirm `_update` is called on every state-changing path |
| 10 | Charter signature replay across chains | CharterRegistry | None on-chain; off-chain readers should check chainId | Suggest adding `block.chainid` to event for explorer clarity (low priority) |

## Foundry test status

```
forge test -vv  →  expected: ALL PASS, no warnings
forge coverage  →  expected: > 90% on contracts/src/*
forge test --gas-report  →  attached to audit submission
```

Test files:
- `test/CacaoTreeNFT.t.sol`
- `test/CacaoToken.t.sol`
- `test/MazorcaRedemption.t.sol`
- `test/TreeAdoption.t.sol`
- `test/IoTAttestation.t.sol`
- `test/LPTimelock.t.sol`
- `test/CharterRegistry.t.sol`

## Known limitations (not bugs — design choices)

1. **Mint-tree-nft is decoupled from TreeAdoption.** A buyer who interacts with `TreeAdoption.adoptWithEth` directly without the app may pay successfully but never receive an NFT. Mitigation documented in tentacle NOTES; not in scope for this audit.
2. **Coordinate hash (gpsHash) is non-binding on-chain.** The contract trusts the relayer to compute it correctly. Off-chain Edge Function ensures correspondence; if the relayer is compromised, a tree could be minted with a bogus GPS hash. Documented as a Phase 8 hardening target.
3. **Oracle EOA key custody is server-side.** No multi-sig oracle for now (would require RGS-style threshold sigs, out of scope for MVP). Mitigation: rotation via `revokeRole` + `grantRole` on multisig.
4. **`MazorcaRedemption.setMazorcasPerToken` rate change is not retroactive for already-signed payloads.** Server caches `rate_at_sign`; on-chain `claim` uses current rate. Mitigation: server checks server rate matches contract rate before signing; if mismatch, refuses to sign.
5. **No upgradeability anywhere.** Charter principle I.5 — by design. If a critical bug requires logic change, deploy new contract; old NFTs/balances are user-owned and non-confiscatable.

## Post-audit deployment sequence

1. Audit findings resolved → re-run all tests → tag `v1.0-audit-clean`.
2. Deploy contracts in order: NFT → Token + Redemption (wire MINTER) → Adoption → IoTAttestation → CharterRegistry → LPTimelock.
3. `tsx scripts/grant_roles.ts --phase N` for each phase.
4. Verify all contracts on BaseScan.
5. CTO + CEO sign Charter via `tsx scripts/sign_charter_onchain.ts`.
6. Treasury seeds Uniswap v3 LP via `tsx scripts/seed_uniswap_v3.ts`; LP NFT transfers to LPTimelock.
7. Public post-mortem of any audit findings on Mirror.xyz; update `src/utils/constants.ts:WEB3_CONTRACTS`.
8. Soft-launch in Austin (private list) → 14-day soak → public launch.

## Audit deliverables expected back

- Findings report with severities (Critical / High / Medium / Low / Informational)
- Suggested remediations with code diffs where possible
- Re-test of remediations
- Public summary suitable for Mirror.xyz post

## References

- [`docs/SECURITY.md`](SECURITY.md) — bug bounty + responsible disclosure
- [`docs/CHARTER.md`](CHARTER.md) — ethical framing
- [`docs/COMPLIANCE.md`](COMPLIANCE.md) — AML/CFT program
- [`docs/LEGAL.md`](LEGAL.md) — utility-token analysis
- [`.octogent/tentacles/web3/NOTES.md`](../.octogent/tentacles/web3/NOTES.md) — design decisions log
