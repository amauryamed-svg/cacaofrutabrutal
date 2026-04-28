# CauaCorp — Phase 7 Launch Playbook

> One-shot cutover from soft-launch to public mainnet. Read [`docs/AUDIT.md`](AUDIT.md), [`docs/SEED_LP.md`](SEED_LP.md), and [`docs/SECURITY.md`](SECURITY.md) before running anything here.

## T-30: pre-launch (4 weeks before public launch)

- [ ] Code4rena/Sherlock contest scoped + funded ($5–15k pool)
- [ ] Foundry coverage ≥ 90% on `contracts/src/*`
- [ ] All Edge Functions reviewed by application security counsel (if budget allows)
- [ ] Persona KYC sandbox → production migration
- [ ] Chainalysis API key upgraded if expecting > 50 calls/day
- [ ] Pinata IPFS pinning policies set (auto-pin via API)
- [ ] Coinbase Developer Platform RPC moved to paid tier if needed (free tier 30M req/mo)
- [ ] Alchemy webhooks consolidated to single Custom Webhook subscribed to all CauaCorp contract addresses
- [ ] Multisig (Gnosis Safe on Base) deployed with CTO + CEO signers
- [ ] All `PAUSER_ROLE` + `DEFAULT_ADMIN_ROLE` ownership transferred to multisig (verify on BaseScan)

## T-14: audit + remediation

- [ ] Audit contest live
- [ ] All Critical + High findings remediated
- [ ] Re-run `forge test -vv` → all pass
- [ ] Re-deploy if needed; `tsx scripts/grant_roles.ts` for each phase
- [ ] Public summary of audit findings drafted for Mirror.xyz

## T-7: charter + LP seed

- [ ] CTO signs Charter on-chain via `tsx scripts/sign_charter_onchain.ts`
- [ ] CEO signs Charter on-chain
- [ ] (Optional) Guardianes sign Charter on-chain after onboarding their wallets
- [ ] Treasury Uniswap v3 LP seed via `tsx scripts/seed_uniswap_v3.ts`
- [ ] LP NFT transferred to LPTimelock; verify `LPTimelock.tokenId() != 0`
- [ ] `docs/SEED_LP.md` updated with all tx hashes + LPTimelock address
- [ ] Mirror.xyz draft includes: Charter sha256, signers, LP seed txs, audit summary

## T-1: dress rehearsal

- [ ] Soft-launch list (~50 Austin ReFi cryptobros) gets `/web3/onboarding` access
- [ ] At least 5 successful end-to-end mints on Base mainnet
- [ ] At least 1 successful Mazorca → $CACAO redemption
- [ ] At least 1 successful adopt-with-USDC tx with verified 60/30/10 split on BaseScan
- [ ] IoT pilot: 1+ ESP32 device deployed; first weekly Merkle root posted
- [ ] Public dashboard at `/web3/transparency` showing TVL, treasury wallet balances, LP timelock countdown
- [ ] Mirror.xyz Charter post scheduled

## T-0: public launch

- [ ] Mirror.xyz Charter post goes live
- [ ] Twitter / Farcaster announcement with permalink to Charter sha256 verification
- [ ] Email list announcement: existing CauaCorp users hear about `/web3` first
- [ ] Austin ReFi meetup IRL event (date TBD) — Charter signing ceremony optional
- [ ] Coinbase Onramp + Persona widgets live
- [ ] `/web3` lifted from soft-launch list to public
- [ ] All routes `/app/web3/*` indexed in sitemap
- [ ] HubSpot CRM tag `web3-launched-2026-Q3` added to all new signups
- [ ] On-call rotation: CTO + CEO covers first 72 hours

## T+1 to T+30: stabilisation

- [ ] Daily check on Alchemy webhook delivery health (latency, drops)
- [ ] Weekly check on `iot_attestation_roots` cron firing on schedule
- [ ] Daily review of `sanctions_screenings` flagged-for-review queue
- [ ] Weekly Twitter / Farcaster recap of mint volume + LP fee income
- [ ] Bug bounty pool funded; Immunefi listing active
- [ ] First post-mortem (if any incidents) published within 14 days

## Rollback / pause procedure

If a Critical issue is discovered post-launch:

1. **Pause** all contracts via multisig (`pause()` on each).
2. Public statement on Twitter / Farcaster + Mirror.xyz within 4 hours.
3. Halt new KYC + Onramp redirects (frontend banner).
4. Triage in private Discord channel with reporter (if applicable).
5. Patch + re-audit (mini-audit or formal verification of fix).
6. Unpause + post-mortem within 14 days.

## Communication channels

- **Public:** `/web3` landing, Twitter `@CauaCorp`, Farcaster `caua`, Mirror.xyz `caua.mirror.xyz`
- **Private (signers):** Signal group "Caua Web3 Ops"
- **Bug bounty:** Immunefi
- **General security:** `security@cauacorp` (PGP)

## Success metrics (first 90 days)

| KPI | Target |
|---|---|
| Distinct adopting wallets (with KYC) | ≥ 200 |
| Total NFT trees minted | ≥ 250 |
| Mazorca → $CACAO redemptions | ≥ 50 |
| `$CACAO/USDC` Uniswap pool TVL | ≥ $25k |
| Guardian payout total (60% of adoption revenue) | ≥ $15k |
| IoT devices deployed in field | 5 (one per Guardián) |
| Critical / High bugs disclosed | 0 (target — but bounty exists, so > 0 is acceptable if they're disclosed and fixed cleanly) |

If KPIs miss by > 50%, re-evaluate Charter §IV (mecanismo de enmienda) for tokenómica or pricing tuning.
