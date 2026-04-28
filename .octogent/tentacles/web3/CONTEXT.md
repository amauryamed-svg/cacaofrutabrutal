# Tentacle: web3

## Domain
On-chain layer of CauaCorp — wallet linking, KYC/AML, NFT árbol (ERC-721 en Base), token utility `$CACAO` (ERC-20), redemption gameplay→on-chain, IoT attestation oracle, Coinbase Onramp/Onchain Kit integration. Ground truth para todo lo que toca cadena.

## Mandate (qué objetivo cumple este tentáculo)
Ejecutar la transformación Web3 descrita en `docs/WEB3.md` y `/Users/amauryamed/.claude/plans/actua-como-ingeniero-de-imperative-lighthouse.md` siguiendo el Charter en `docs/CHARTER.md`. La meta no es "añadir cripto"; es hacer que la propiedad del árbol y el valor del cuidado vivan on-chain de manera verificable.

## What This Domain Owns

### Frontend
- `/src/lib/web3/` — wagmi config, viem clients, helpers EIP-712, rarity calc
- `/src/components/web3/` — ConnectWalletButton, OnrampButton, MintTreeButton, RedeemMazorcasModal, AdoptWithCryptoButton
- `/src/pages/Web3Onboarding.tsx` — ruta `/web3/onboarding` (English-first)
- `/src/pages/Web3Landing.tsx` — ruta `/web3` (Phase 5)

### Smart contracts
- `/contracts/foundry.toml` — Foundry config
- `/contracts/src/CacaoTreeNFT.sol` — ERC-721 árbol (Phase 3)
- `/contracts/src/CacaoToken.sol` — ERC-20 `$CACAO` cap 21M (Phase 4)
- `/contracts/src/MazorcaRedemption.sol` — burn off-chain → mint on-chain (Phase 4)
- `/contracts/src/TreeAdoption.sol` — escrow + revenue split (Phase 5)
- `/contracts/src/IoTAttestation.sol` — Merkle root semanal (Phase 6)
- `/contracts/test/*.t.sol` — Foundry fuzz/invariant
- `/contracts/script/Deploy.s.sol`

### Edge Functions (server-side relayers + verifiers)
- `/supabase/functions/persona-webhook/` — KYC verification webhook
- `/supabase/functions/siwe-link-wallet/` — SIWE verify + Chainalysis/OFAC screening
- `/supabase/functions/mint-tree-nft/` — relayer gasless via CDP Paymaster
- `/supabase/functions/alchemy-nft-webhook/` — listener Transfer → Supabase sync
- `/supabase/functions/tree-metadata/` — `tokenURI` dinámico (IPFS + game state)
- `/supabase/functions/sign-mazorca-burn/` — EIP-712 sign off-chain burn
- `/supabase/functions/coinbase-commerce-webhook/` — finalmente wire el missing webhook

### Data
- Migrations 028–032 (KYC/wallet, tree NFT, mazorca redemptions, guardian wallets, IoT devices)
- Tablas owned: `sanctions_screenings`, `ofac_blocklist`, `wallet_link_nonces`, `mazorca_redemptions`, `iot_devices`, `iot_readings_signed`, `iot_attestation_roots`
- Columnas extendidas: `user_profiles.{country, kyc_*, wallet_address, wallet_chain_id, geo_blocked}`, `cacao_trees.{nft_token_id, nft_contract, owner_wallet, metadata_ipfs_cid}`, `guardians.payout_wallet`

### Firmware (Phase 6)
- `/firmware/cacao_node/main.cpp` — ESP32 + Ed25519 + DHT22 + soil moisture

### Scripts
- `/scripts/post_weekly_root.ts` — pg_cron + Vercel Function (Phase 6)
- `/scripts/seed_uniswap_v3.ts` — LP seed con timelock (Phase 7)

## Cross-Tentacle Dependencies

| Cross-tentacle | Dirección | Por qué |
|---|---|---|
| `supabase-backend` | web3 → supabase-backend | Migrations 028–032 deben aprobarse vía supabase tentacle review |
| `cacao-gotchi` | cacao-gotchi → web3 | Care actions emiten `MetadataUpdate` events; growthSystem.ts es source-of-truth de attributes[] |
| `ml-pipeline` | ml-pipeline → web3 | `ml_predictor.py` consume `iot_readings_signed` (rows verificadas) preservando privacy SHA-256 |
| `design-system` | web3 → design-system | Web3 components usan BRAND palette hex-only, brutalist luxury, no nuevos primitives |
| `b2b-marketplace` | b2b-marketplace → web3 | Adoption checkout migra de manual ETH flow a `TreeAdoption.sol` escrow (Phase 5) |
| `infra-devops` | web3 → infra-devops | Foundry CI, Alchemy webhook URLs en Vercel, secrets en Supabase config |
| `token-economy` | token-economy ↔ web3 | beans/mazorcas siguen off-chain; mazorca burn → `$CACAO` mint es la única bridge |

## Non-Negotiables (heredados de CauaCore §8 + nuevos web3)

### CauaCore §8 (aplicables aquí)
- Backgrounds: hex values ONLY
- Sin localStorage — todo en Supabase o React context
- Sin `.env` en commits
- service_role solo en Edge Functions (NUNCA en `/contracts/` ni en `/src/`)
- RLS: siempre `(select auth.uid())`, nunca `auth.uid()` directo
- Frontend siempre filtra `.eq('user_id', userId)` además de RLS
- Python ≤20 líneas/función — aplica a `api/iot_verify.py` y `api/iot_merkle.py`

### §10 Web3 Non-Negotiables (nuevos)
- **Cero private keys en cliente.** Toda firma en wallet del usuario (Smart Wallet/RainbowKit). Server-side keys (relayer Paymaster, oracle IoT) viven en Supabase Edge Function env, nunca en `src/`, nunca en `contracts/`.
- **EIP-712 typed-data en TODA firma off-chain → on-chain.** Sin firmas raw, sin `eth_sign`. Domain separator incluye `chainId`+`verifyingContract`.
- **Nonces obligatorios.** Toda firma off-chain consume un nonce. Tablas dedicadas (`wallet_link_nonces`, `mazorca_burn_nonces`) con TTL.
- **Mint/redeem siempre KYC-gated.** Sin `kyc_verified_at` no hay mint, no hay redemption, no hay adopción on-chain.
- **OFAC + Chainalysis screening pre-write.** Cada Edge Function que escribe `wallet_address` o ejecuta mint corre screening antes de firmar.
- **Cap rates en relayer.** `mint-tree-nft` cap 1 mint/user/24h; `sign-mazorca-burn` cap 1 redemption/user/30d (batch mensual). Sin caps → drain Paymaster.
- **Pausable everywhere.** Todo contrato hereda OZ `Pausable` con `PAUSER_ROLE` en multisig (CTO+CEO 2-of-2 mínimo).
- **`ERC-4906 MetadataUpdate` en cada cambio.** Cada care action que altere `tokenURI` debe emitir el event para invalidar caches OpenSea/Zora.
- **Sin presale, sin ICO, sin allocation founders fuera de gameplay.** Aplicable mientras esta carta esté vigente (ver `docs/CHARTER.md` III).
- **Liquidez timelocked.** Seed LP en Uniswap v3 (Phase 7) con timelock 12 meses. Sin excepciones.

## Architecture Snapshot (al arrancar Phase 1)

```
┌─────────────────────────────────────────────────────────────┐
│  USER (Cryptobro Austin TX or LATAM Cacao-lover)            │
└──────┬──────────────────────────────────────────────────────┘
       │ Browser passkey / WalletConnect
       ▼
┌─────────────────────────────────────────────────────────────┐
│  src/lib/web3/wagmi.ts  ←  Coinbase Smart Wallet + Rainbow  │
└──────┬──────────────────────────────────────────────────────┘
       │
       ├── SIWE message ─────► supabase/functions/siwe-link-wallet
       │                       └── Chainalysis + OFAC + nonce verify
       │
       ├── KYC flow ─────────► Persona Hosted ─► persona-webhook
       │                                          └── writes kyc_verified_at
       │
       ├── Mint Tree ────────► supabase/functions/mint-tree-nft (relayer + Paymaster)
       │                       └── tx → Base → Alchemy webhook → cacao_trees sync
       │
       ├── Care action ─────► existing Supabase mutation + ERC-4906 emit via relayer
       │
       ├── Redeem mazorcas ─► sign-mazorca-burn (EIP-712) ─► MazorcaRedemption.claim()
       │                                                     └── mints $CACAO
       │
       ├── Adopt with crypto ► TreeAdoption.sol (ETH/cbBTC/USDC) → split 60/30/10
       │
       └── IoT readings ────► ESP32 Ed25519 sign ─► api/iot_verify.py
                                                    └── weekly Merkle root → IoTAttestation.sol
```

## Glossary

- **SIWE** — Sign-In With Ethereum (EIP-4361). Usuario firma mensaje plaintext con su wallet → server verifica firma → vincula `wallet_address` a `user_id`.
- **EIP-712** — Standard de typed-data signing. Replay-safe, human-readable, requerido para cada firma off-chain.
- **Paymaster** — Smart contract que paga gas en nombre del usuario (gasless UX). Coinbase CDP ofrece uno managed.
- **cbBTC** — Coinbase Wrapped BTC. ERC-20 1:1 con BTC custodiado por Coinbase, vive en Base. Usable como ETH normal vía wagmi.
- **ERC-4906** — Extension de ERC-721 que añade `MetadataUpdate(uint256 tokenId)` event. Marketplaces (OpenSea/Zora) lo escuchan para refresh metadata.
- **anon_token** — SHA-256(`user_id` + `tree_id` + `PRIVACY_SALT`). Identificador estable para logs ML sin PII.
