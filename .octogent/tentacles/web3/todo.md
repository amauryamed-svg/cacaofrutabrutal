# web3 — todo

> Updated 2026-04-27 · Phases 1-3 code-side complete; secrets/deploy pending.

## P0 — Phase 1: Compliance & Charter Foundation (Semanas 1–2) ✅

- [x] `docs/CHARTER.md` — carta ética/moral firmable on-chain
- [x] `docs/WEB3.md` — overview arquitectura on-chain (Base, contratos, sync)
- [x] `docs/COMPLIANCE.md` — programa AML/CFT, OFAC cron, geo-block list
- [x] `docs/KYC.md` — flow Persona, retención, RLS, webhook HMAC
- [x] `docs/LEGAL.md` — análisis utility-token, Texas MSA stance, ToS/Privacy
- [x] `.octogent/tentacles/web3/CONTEXT.md`
- [x] `.octogent/tentacles/web3/todo.md` (este archivo)
- [x] `.octogent/tentacles/web3/NOTES.md`
- [x] `.octogent/config.json` — registry actualizado a 9 tentáculos
- [x] `CLAUDE.md` §10 Web3 Non-Negotiables + routing nuevo

## P1 — Phase 2: Identity, KYC & Wallet Linking (Semanas 2–3) — code-side ✅, secrets/deploy ❌

- [x] `supabase/migrations/028_kyc_wallet.sql`
- [x] `supabase/functions/persona-webhook/index.ts`
- [x] `supabase/functions/siwe-nonce/index.ts` (extra — issuer)
- [x] `supabase/functions/siwe-link-wallet/index.ts`
- [x] `src/lib/web3/wagmi.ts` + `siwe.ts`
- [x] `src/components/web3/ConnectWalletButton.tsx`
- [x] `src/components/web3/Web3Provider.tsx`
- [x] `src/hooks/useKYCStatus.ts`
- [x] `src/pages/Web3Onboarding.tsx`
- [x] `src/App.tsx` lazy route
- [x] `src/utils/constants.ts` BASE_CHAIN_ID, GEO_BLOCKED_COUNTRIES, KYC tiers
- [x] `package.json` wagmi/viem/RainbowKit/siwe deps
- [x] `supabase/config.toml` persona-webhook verify_jwt=false
- [ ] `npm install` (user)
- [ ] Persona account + 3 inquiry templates (user)
- [ ] WalletConnect Project ID (user)
- [ ] Chainalysis Address Screening API key (user)
- [ ] `npx supabase db push` (deploy migration 028)
- [ ] `npx supabase functions deploy persona-webhook siwe-nonce siwe-link-wallet`
- [ ] OFAC SDN cron pull (pg_cron job)
- [ ] Test e2e: SIWE happy path + OFAC reject + geo-block reject

## P1 — Phase 3: Tree NFT Mint + Game Loop Sync (Semanas 3–5) — code-side ✅, deploy ❌

- [x] `contracts/foundry.toml` + remappings + README
- [x] `contracts/src/CacaoTreeNFT.sol` ERC-721 + Pausable + AccessControl + IERC4906
- [x] `contracts/test/CacaoTreeNFT.t.sol` Foundry tests (mint, pause, fuzz, ERC4906)
- [x] `contracts/script/Deploy.s.sol`
- [x] `supabase/functions/mint-tree-nft/index.ts` — relayer with viem
- [x] `supabase/functions/alchemy-nft-webhook/index.ts`
- [x] `supabase/functions/tree-metadata/index.ts`
- [x] `supabase/migrations/029_tree_nft.sql` — NFT columns + tree_mints audit
- [x] `src/components/dashboard/MintTreeButton.tsx`
- [x] `src/utils/growthSystem.ts` — `getMetadataAttributes` + `getRarityScore`
- [x] `supabase/config.toml` — alchemy-nft-webhook + tree-metadata
- [ ] `forge install OpenZeppelin/openzeppelin-contracts@v5.0.2 forge-std`
- [ ] `forge build && forge test -vv` (user)
- [ ] Deploy `CacaoTreeNFT` to Base Sepolia
- [ ] Mint 1 testnet tree end-to-end (relayer key + alchemy webhook URL configured)
- [ ] Verify on Sepolia BaseScan + OpenSea testnet
- [ ] Pinata IPFS account + API key
- [ ] Coinbase Developer Platform account (RPC + Paymaster — Paymaster integration deferred to post-MVP)
- [ ] Alchemy account + Custom Webhook (Transfer events on `CACAO_TREE_NFT_ADDRESS`)
- [ ] Set `CACAO_TREE_NFT_ADDRESS` in `src/utils/constants.ts:WEB3_CONTRACTS` + Edge Function env
- [ ] Wire `MintTreeButton` into `src/pages/TreeDetail.tsx`
- [ ] Test e2e: mint Sepolia → OpenSea testnet → care action triggers `touch()` → metadata update

## P2 — Phase 4: Mazorca→$CACAO Redemption (Semanas 5–7) — code-side ✅, deploy ❌

- [x] `contracts/src/CacaoToken.sol` ERC-20 cap 21M (Capped + Burnable + Pausable + AccessControl)
- [x] `contracts/src/MazorcaRedemption.sol` EIP-712 verify + 30d cooldown + nonce
- [x] `contracts/test/CacaoToken.t.sol` (cap, role gating, pause, burnable, fuzz)
- [x] `contracts/test/MazorcaRedemption.t.sol` (happy, replay, deadline, cooldown, rogue signer, pause, fuzz rate)
- [x] `contracts/script/Deploy.s.sol` extended with `deployTokenAndRedemption()`
- [x] `supabase/migrations/030_mazorca_redemptions.sql` + atomic decrement/refund/expire helpers
- [x] `supabase/functions/sign-mazorca-burn/index.ts` (atomic decrement + EIP-712 sign)
- [x] `supabase/functions/refund-expired-redemption/index.ts` (idempotent refund, cron-friendly)
- [x] `src/utils/constants.ts` — `MAZORCA_TO_CACAO_RATE`, `CACAO_DECIMALS`, `CACAO_TOTAL_SUPPLY_CAP`, `MAZORCA_REDEMPTION_DOMAIN/TYPES`
- [x] `src/lib/web3/redemption.ts` — `requestBurnSignature` + `MAZORCA_REDEMPTION_ABI` + `burnArgs`
- [x] `src/components/web3/RedeemMazorcasModal.tsx` (5-phase UX: pick → sign → ready → mining → done)
- [x] `supabase/config.toml` — `verify_jwt=false` for `refund-expired-redemption`
- [ ] `forge script script/Deploy.s.sol:Deploy --sig "deployTokenAndRedemption()"` (Sepolia first)
- [ ] Grant `ORACLE_ROLE` on `MazorcaRedemption` to oracle EOA used by `sign-mazorca-burn`
- [ ] Set `MAZORCA_REDEMPTION_ADDRESS` + `ORACLE_PRIVATE_KEY` in Supabase Edge Function env
- [ ] Set `WEB3_CONTRACTS.cacaoToken` + `mazorcaRedemption` in `src/utils/constants.ts`
- [ ] Schedule pg_cron jobs: `expire_mazorca_redemptions` every 15 min + nightly call to `refund-expired-redemption`
- [ ] Wire `RedeemMazorcasModal` into Dashboard / TokenBalance UI (next task)
- [ ] Test e2e: 1000 mazorcas burn → 1 $CACAO mint → token_events row → refund flow on expired

## P2 — Phase 5: BTC + Fiat Onramp + Web3 Landing (Semanas 7–8) — code-side ✅, deploy ❌

- [x] `contracts/src/TreeAdoption.sol` (ETH + ERC-20, 60/30/10 atomic split, ReentrancyGuard, Pausable, rescue)
- [x] `contracts/test/TreeAdoption.t.sol` (ETH/token happy path, refund, underpayment, disabled asset, missing guardian, pause, fuzz split conservation)
- [x] `contracts/script/Deploy.s.sol` extended with `deployTreeAdoption()`
- [x] `supabase/migrations/031_guardian_wallets.sql` — guardians table seeded + adoption_charges ledger
- [x] `supabase/functions/coinbase-commerce-webhook/index.ts` — HMAC + routes by metadata.kind to investor_charges OR adoption_charges
- [x] `supabase/functions/alchemy-nft-webhook/` extended to confirm adoption_charges by tx_hash on TreeAdopted activity
- [x] `src/utils/constants.ts` — `BASE_ERC20`, `ETH_PSEUDO_ADDRESS`, `ADOPTION_SPLIT_BPS`
- [x] `src/lib/web3/adoption.ts` — `TREE_ADOPTION_ABI`, `ERC20_APPROVE_ABI`, `treeIdToBytes32`, `varietyToBytes32`
- [x] `src/components/web3/OnrampButton.tsx` (Coinbase Onramp pop-up; `VITE_COINBASE_ONRAMP_APP_ID` env)
- [x] `src/components/web3/AdoptWithCryptoButton.tsx` (USDC/ETH/cbBTC selector + approval + adopt + receipt)
- [x] `src/pages/Web3Landing.tsx` (`/app/web3`, English, brutalist, reuses `/investor-3d.js`)
- [x] `src/App.tsx` lazy route `/web3`
- [x] `supabase/config.toml` `verify_jwt=false` for `coinbase-commerce-webhook`
- [ ] `src/components/fund/WalletCheckout.tsx` — swap manual → wagmi (deferred — existing manual flow keeps working; refactor in a follow-up to avoid churn)
- [ ] Deploy `TreeAdoption.sol` to Sepolia
- [ ] Set TREASURY_WALLET + PROTOCOL_WALLET env, deploy
- [ ] Set Guardian wallets via `setGuardianWallet(0..4, ...)` post-deploy
- [ ] Enable assets + set prices: `setAssetEnabled(USDC, true)` + `setPrice(USDC, ...)` + same for ETH/cbBTC
- [ ] Set `WEB3_CONTRACTS.treeAdoption` in `src/utils/constants.ts`
- [ ] Configure Alchemy webhook to also subscribe to TreeAdopted events on the contract
- [ ] Coinbase Commerce webhook URL → Supabase Functions endpoint (for fallback fiat path)
- [ ] Test e2e: USDC adopt → BaseScan splits → adoption_charges row → mint flow follow-up

## P2 — Phase 6: IoT Attestation MVP (Semanas 8–10) — code-side ✅, deploy ❌

- [x] `api/iot_verify.py` Ed25519 verify + canonical JSON + payload_hash + week_index (≤20 lines/fn)
- [x] `api/iot_merkle.py` OZ-compatible sorted-pair keccak Merkle root + proof builder
- [x] `api/iot_receiver.py` rewritten — signed-payload verifier (no shared secret)
- [x] `api/requirements.txt` adds `pynacl`, `eth-utils`
- [x] `supabase/migrations/032_iot_devices.sql` — devices + signed_readings + attestation_roots + RLS + `compute_week_index()`
- [x] `contracts/src/IoTAttestation.sol` (`postRoot`, `verifyLeaf`, `getRoot`, Pausable, ORACLE_ROLE)
- [x] `contracts/test/IoTAttestation.t.sol` (post happy/empty/double/non-oracle, latestWeek monotonic, verify/tamper, paused)
- [x] `contracts/script/Deploy.s.sol` extended with `deployIoTAttestation()`
- [x] `firmware/cacao_node/main.cpp` ESP32 + libsodium-arduino + DHT22 + soil + LDR + canonical JSON
- [x] `firmware/cacao_node/README.md` BOM + build + provisioning + security model
- [x] `supabase/functions/post-iot-root/index.ts` cron-callable Deno: query → Merkle root → postRoot tx
- [x] `src/utils/constants.ts` — `IOT_WEEK_SECONDS` + `iotWeekIndex(ts)`
- [x] `supabase/config.toml` `verify_jwt=false` for `post-iot-root`
- [ ] `forge install OpenZeppelin/openzeppelin-contracts@v5.0.2` (pulls MerkleProof)
- [ ] Deploy `IoTAttestation` to Sepolia → grant `ORACLE_ROLE` to oracle EOA
- [ ] Set `IOT_ATTESTATION_ADDRESS` + `IOT_ORACLE_PRIVATE_KEY` + `ADMIN_BEARER_TOKEN` in Supabase Edge Function env
- [ ] pg_cron weekly: `select cron.schedule('post_iot_root_weekly', '0 3 * * 1', $$ select net.http_post(...) $$)`
- [ ] Hardware procurement: 5× ESP32 + DHT22 + soil moisture + LDR + LiPo + cell hat (~$250)
- [ ] Bench-test: 10 signed readings → root posted Sepolia → `verifyLeaf` returns true

## P2 — Phase 7: Audit + Secondary Market + LP Seed (Semanas 10–12+) — code-side ✅, ops ❌

- [x] `contracts/src/LPTimelock.sol` (Uniswap v3 LP NFT timelock, beneficiary fee collect, no upgradeability)
- [x] `contracts/test/LPTimelock.t.sol` (deposit/double-deposit/wrong-NFT/collect/release/early/late/non-beneficiary)
- [x] `contracts/src/CharterRegistry.sol` (append-only sign(hash, version), no admin)
- [x] `contracts/test/CharterRegistry.t.sol` (sign happy / aggregate / double / new-hash / empty)
- [x] `contracts/script/Deploy.s.sol` extended with `deployLPTimelock()` + `deployCharterRegistry()`
- [x] `scripts/seed_uniswap_v3.ts` (init pool + approve + mint LP + transferToLPTimelock)
- [x] `scripts/grant_roles.ts` (per-phase role wiring + Phase 5 guardian/asset/price setters)
- [x] `scripts/sign_charter_onchain.ts` (SHA-256 of charter + version → CharterRegistry.sign)
- [x] `docs/SECURITY.md` (Immunefi bounty + responsible disclosure + SLAs)
- [x] `docs/AUDIT.md` (Code4rena/Sherlock prep + scope + threat model + known limitations)
- [x] `docs/SEED_LP.md` (Phase 7 LP runbook with placeholders for tx hashes)
- [x] `docs/LAUNCH.md` (T-30 → T+30 cutover playbook + KPIs + rollback)
- [x] `docs/LEGAL.md` updated with 7-item pre-pool disclosure list
- [ ] Code4rena/Sherlock contest scoped + funded ($5–15k)
- [ ] Audit findings remediated; tag `v1.0-audit-clean`
- [ ] Multisig (Safe on Base) deployed; admin/pauser roles transferred
- [ ] `tsx scripts/sign_charter_onchain.ts` from CTO + CEO
- [ ] `tsx scripts/seed_uniswap_v3.ts` (treasury runs, multi-sig signing)
- [ ] Verify all contracts on BaseScan
- [ ] Zora collection page setup
- [ ] Mirror.xyz post de `docs/CHARTER.md` with audit summary + LP seed proofs
- [ ] Immunefi bounty live ($5k pool)
- [ ] Austin ReFi meetup launch event

## Open questions / parking lot

- ¿Multisig 2-of-2 (CTO+CEO) suficiente para `PAUSER_ROLE` o subimos a 3-of-5 con Guardianes?
- ¿`$CACAO` totalSupply cap 21M es simbólico (Bitcoin homage) — ¿cap correcto vs adopción real esperada (1M árboles × 5 mazorcas/año × 1000:1)? Validar matemáticas en `docs/LEGAL.md`.
- ¿Necesitamos un dominio ENS `caua.eth`? (~0.05 ETH/año, decisión Phase 7).
- ¿Permitir transfer de NFT árbol incluso a wallets sin KYC, o gating? (decisión: permitir, KYC solo para mint y redeem).
