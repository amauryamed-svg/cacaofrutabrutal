# CauaCorp Security Policy

> Versión 1.0 · 2026-04-27 · Companion to [`docs/COMPLIANCE.md`](COMPLIANCE.md), [`docs/AUDIT.md`](AUDIT.md), and [`docs/CHARTER.md`](CHARTER.md).

CauaCorp operates a Web3 protocol on Base mainnet. Smart-contract bugs, oracle key compromise, or off-chain pipeline vulnerabilities can all destroy user value. This document is our public commitment to handle disclosures responsibly and reward researchers fairly.

## Reporting a vulnerability

**Preferred:** open a private report through the [Immunefi bounty program](https://immunefi.com/bounty/caua/) (live as of Phase 7 launch).

**Alternative:** email `security@cauacorp` with the subject line `[VULN] <one-line summary>`. PGP key fingerprint published in [`docs/keys/security.pgp`](keys/security.pgp) (TBD, Phase 7 cutover).

Do **not**:
- Open public GitHub issues for vulnerabilities.
- Demonstrate exploits on mainnet against contracts holding real funds.
- Use vulnerabilities to extract user data beyond the minimum needed to prove impact.

## Bounty pool (post-Phase 7 launch)

Initial pool: **$5,000 USD** in $CACAO + USDC, escalating with TVL.

| Severity | Target reward (USD-equivalent) |
|---|---|
| **Critical** — direct theft of user funds, mass un-pausable mint, governance hijack | up to $5,000 (capped at MVP, scales with TVL) |
| **High** — temporary fund freezing, unauthorized state mutation in core contracts, replay of EIP-712 sigs | $1,500 |
| **Medium** — unauthorized data exposure beyond RLS bypass, griefing attacks (Paymaster drain at scale) | $400 |
| **Low** — informational, gas-griefing, UX-affecting bugs without fund risk | $100 |

Severity is judged using [Immunefi's classification](https://immunefi.com/severity-system/).

## In-scope assets

### Smart contracts (Base mainnet)
- `CacaoTreeNFT` — see [`contracts/src/CacaoTreeNFT.sol`](../contracts/src/CacaoTreeNFT.sol)
- `CacaoToken` — see [`contracts/src/CacaoToken.sol`](../contracts/src/CacaoToken.sol)
- `MazorcaRedemption` — see [`contracts/src/MazorcaRedemption.sol`](../contracts/src/MazorcaRedemption.sol)
- `TreeAdoption` — see [`contracts/src/TreeAdoption.sol`](../contracts/src/TreeAdoption.sol)
- `IoTAttestation` — see [`contracts/src/IoTAttestation.sol`](../contracts/src/IoTAttestation.sol)
- `LPTimelock` — see [`contracts/src/LPTimelock.sol`](../contracts/src/LPTimelock.sol)
- `CharterRegistry` — see [`contracts/src/CharterRegistry.sol`](../contracts/src/CharterRegistry.sol)

Addresses are published in [`src/utils/constants.ts:WEB3_CONTRACTS`](../src/utils/constants.ts) and verified on BaseScan.

### Off-chain pipeline
- `supabase/functions/*` — Edge Functions (Deno). Especially: `siwe-link-wallet`, `mint-tree-nft`, `sign-mazorca-burn`, `post-iot-root`, `persona-webhook`, `coinbase-commerce-webhook`, `alchemy-nft-webhook`.
- `api/iot_*.py` — Python serverless on Vercel.
- Supabase RLS policies on `user_profiles`, `cacao_trees`, `mazorca_redemptions`, `iot_readings_signed`, `sanctions_screenings`.

### Out of scope
- Third-party providers (Coinbase, Persona, Chainalysis, Pinata, Alchemy) — report directly to them.
- Marketing site (`/`, `/web3` landing) front-end XSS unless it leads to fund theft.
- Theoretical attacks requiring control of a Guardián's IoT device or compromised user wallet.
- Issues already documented in [`docs/AUDIT.md`](AUDIT.md) "Known Limitations".

## Response SLA

- **First reply:** within 48 hours of disclosure.
- **Severity triage:** within 5 business days.
- **Fix + on-chain mitigation (e.g. pause):** Critical within 24 hours; High within 7 days; Medium within 30 days.
- **Public post-mortem:** within 14 days of resolution for any Critical/High that touched mainnet funds.

## Pause governance

Each contract inherits OZ `Pausable`. `PAUSER_ROLE` is held by a Gnosis Safe multisig:
- **Phases 3–6:** 2-of-2 (CTO + CEO)
- **Phase 7+:** 3-of-5 (CTO + CEO + 3 Guardianes after onboarding)

Multisig signers are public on Etherscan. Any signer can propose pause; quorum executes.

## Disclosure timeline policy

We follow a **90-day max** disclosure window from acknowledgement to public post-mortem. Researchers may request extensions for complex bugs requiring multi-contract migrations.

## Hall of fame

Researchers credited in [`docs/HALL_OF_FAME.md`](HALL_OF_FAME.md) (created on first valid bounty payout).

## Rotating documents

This file is amended via PR with sign-off from CTO + CEO. Material changes (bounty pool, scope changes, SLA changes) trigger a notice on the `/web3` landing for 14 days.
