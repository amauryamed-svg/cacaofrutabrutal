# CauaCorp Smart Contracts

Foundry project. Owned by tentacle [`web3`](../.octogent/tentacles/web3/CONTEXT.md).

> Subordinated to [`docs/CHARTER.md`](../docs/CHARTER.md), [`docs/WEB3.md`](../docs/WEB3.md), and CauaCore §10 in [`CLAUDE.md`](../CLAUDE.md).

## Setup

```bash
# 1. Install Foundry (one-time)
curl -L https://foundry.paradigm.xyz | bash && foundryup

# 2. Install dependencies (run from /contracts/)
forge install OpenZeppelin/openzeppelin-contracts@v5.0.2 --no-commit
forge install foundry-rs/forge-std --no-commit

# 3. Build
forge build

# 4. Test (fuzz + invariants)
forge test -vv

# 5. Gas report
forge test --gas-report

# 6. Deploy (Sepolia first)
export DEPLOYER_PRIVATE_KEY=0x...     # NEVER commit
export BASE_SEPOLIA_RPC_URL=https://...
export BASESCAN_API_KEY=...
forge script script/Deploy.s.sol --rpc-url base_sepolia --broadcast --verify
```

## Contracts

| File | Phase | Purpose |
|---|---|---|
| `src/CacaoTreeNFT.sol` | 3 | ERC-721 árbol on Base — minted by relayer, gasless for user |
| `src/CacaoToken.sol` (Phase 4) | 4 | ERC-20 `$CACAO`, cap 21M, mint only from MazorcaRedemption |
| `src/MazorcaRedemption.sol` (Phase 4) | 4 | EIP-712 verify off-chain burn → mint $CACAO |
| `src/TreeAdoption.sol` (Phase 5) | 5 | Adoption escrow, accepts ETH/cbBTC/USDC, 60/30/10 split |
| `src/IoTAttestation.sol` (Phase 6) | 6 | Weekly Merkle root posted by oracle |

## Conventions

- **OZ v5 only** — never copy-paste audited code, always import.
- **Custom errors** — gas-cheaper than revert strings.
- **Pausable on every contract** — emergency switch held by multisig (CTO+CEO 2-of-2).
- **Roles via AccessControl** — `MINTER_ROLE`, `PAUSER_ROLE`, never `Ownable.transferOwnership` to multisig directly.
- **No upgradeability** (no proxies) — if logic must change, deploy new contract; ownership of old NFTs persists (it's the user's, not ours).
- **Fuzz tests required** — every external function has at least one fuzz test on input bounds.
- **Foundry tests are the audit floor** — Code4rena/Sherlock contest at Phase 7 is the audit ceiling.
