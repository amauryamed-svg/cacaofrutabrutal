# CauaCorp Web3 Architecture

> Companion técnico de [`docs/CHARTER.md`](CHARTER.md) (carta ética) y del roadmap de transformación. Este doc describe **cómo** se hace; CHARTER describe **por qué** y bajo qué reglas.

## Resumen ejecutivo

CauaCorp opera un protocolo agroforestal donde:
- Cada **árbol de cacao físico** tiene un gemelo on-chain como **NFT ERC-721** en Base.
- Cada **acción de cuidado** (ritual, riego, poda) actualiza la metadata del NFT y emite `ERC-4906 MetadataUpdate`.
- El **ledger Supabase** (`token_events`, `cacao_trees`) sigue siendo source-of-truth para gameplay; la cadena es la capa de propiedad y prueba.
- El token de utilidad **`$CACAO`** (ERC-20, cap 21M) se mintea solo por burn de mazorcas off-chain via EIP-712 firmado por server.
- La **telemetría IoT** se firma con Ed25519 en el dispositivo, se verifica en Edge Function, y se publica como **Merkle root semanal** on-chain.
- Los **pagos cripto** (ETH, cbBTC, USDC) llegan a un escrow `TreeAdoption.sol` que hace **revenue split atómico** 60% Guardián / 30% tesorería / 10% protocolo.

## Principios técnicos

1. **Cadena: Base (Coinbase L2 EVM)**, chain ID `8453`. Mainnet + Sepolia testnet. RPC default: Coinbase Developer Platform free tier.
2. **Off-chain authoritative para gameplay, on-chain authoritative para propiedad.** El estado del juego (vitals, stage, care log) vive en Supabase porque cambia segundos; el ownership, los splits y las atestaciones IoT viven on-chain porque necesitan verificabilidad pública.
3. **Toda firma off-chain → on-chain es EIP-712 typed-data.** Domain separator obligatorio (`name`, `version`, `chainId`, `verifyingContract`). Sin `eth_sign`, sin firmas raw.
4. **Toda mutación on-chain por server pasa por Paymaster.** Usuarios no pagan gas. Cap por usuario en Edge Function previene drain.
5. **KYC-gate antes de cualquier write on-chain con `wallet_address`.** Mint, redeem, adopción cripto: todos requieren `kyc_verified_at IS NOT NULL` + screening Chainalysis/OFAC verde.

## Diagrama de capas

```
┌─────────────────── PRESENTATION (React 19 SPA) ─────────────────┐
│  /web3/*  ─►  src/lib/web3/wagmi.ts  ◄─►  Smart Wallet/Rainbow  │
└─────────────────────────────┬────────────────────────────────────┘
                              │
┌─────────────────────────────▼────────────────────────────────────┐
│  EDGE FUNCTIONS (Deno · Supabase)                                │
│  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────────┐ │
│  │ siwe-link-wallet │ │ persona-webhook   │ │ mint-tree-nft    │ │
│  │ (SIWE + screen)  │ │ (KYC HMAC verify) │ │ (Paymaster relay)│ │
│  └─────────────────┘  └──────────────────┘  └─────────────────┘ │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ │
│  │ sign-mazorca-burn│ │ tree-metadata    │ │ alchemy-nft-hook │ │
│  │ (EIP-712 sig)    │ │ (tokenURI dyn)   │ │ (Transfer sync)  │ │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘ │
└──────────────────┬───────────────────────────┬───────────────────┘
                   │                           │
   ┌───────────────▼──────────────┐  ┌────────▼─────────────────────┐
   │  SUPABASE DB (PostgreSQL)    │  │  BASE MAINNET (chain id 8453)│
   │  user_profiles, cacao_trees  │  │  CacaoTreeNFT.sol  (ERC-721) │
   │  token_events (ledger)       │  │  CacaoToken.sol    (ERC-20)  │
   │  iot_readings_signed         │  │  MazorcaRedemption.sol       │
   │  sanctions_screenings        │  │  TreeAdoption.sol (escrow)   │
   │  wallet_link_nonces          │  │  IoTAttestation.sol (oracle) │
   └──────────────────────────────┘  └──────────────────────────────┘
                   ▲                           ▲
                   │                           │
   ┌───────────────┴──────────────┐  ┌────────┴─────────────────────┐
   │  PYTHON ML (api/ Vercel)     │  │  IPFS (Pinata) — birth certs │
   │  ml_predictor.py             │  │  Supabase Storage — game JSON│
   │  iot_verify.py · iot_merkle  │  └──────────────────────────────┘
   └──────────────────────────────┘
                   ▲
                   │
   ┌───────────────┴──────────────┐
   │  IOT FIELD (ESP32 · 5 Guardianes)│
   │  Ed25519 signed readings + cell  │
   └──────────────────────────────────┘
```

## Contratos (`/contracts/src/`)

### CacaoTreeNFT.sol (Phase 3)
- ERC-721 OZ v5, `Ownable`, `Pausable`, `ERC721Burnable`, `IERC4906`.
- `function mintTree(address to, uint256 treeId, uint8 guardianId, bytes32 varietyHash, bytes32 gpsHash)` — solo `MINTER_ROLE` (Edge Function relayer).
- `tokenURI(tokenId)` returnea `https://kjygovuiphbxcdxeduco.supabase.co/functions/v1/tree-metadata?tokenId={id}`.
- Care actions emiten `MetadataUpdate(tokenId)` via relayer (función `touch(tokenId)` con role-gating).
- Pausable global emergency switch (PAUSER_ROLE en multisig 2-of-2 CTO+CEO).

### CacaoToken.sol (Phase 4)
- ERC-20 OZ v5, `name="Cacao"`, `symbol="CACAO"`, `cap=21_000_000 * 10**18`.
- `mint(address to, uint256 amount)` solo `MINTER_ROLE` = `MazorcaRedemption.sol`.
- Sin función de mint para founders. Sin allocation pre-launch. Cero excepciones.

### MazorcaRedemption.sol (Phase 4)
- Verifica firma EIP-712 emitida por `sign-mazorca-burn` Edge Function (oracle EOA).
- TypedData: `{user, mazorcaCount, nonce, deadline}` + domain separator.
- Mint ratio: `1000 mazorcas → 1 $CACAO` (configurable via `setRate()`, multisig-gated).
- Rate-limit on-chain: máximo 1 redemption/usuario/30d (cooldown stored en mapping).

### TreeAdoption.sol (Phase 5)
- Escrow que acepta ETH/cbBTC/USDC. Pago atómico con mint del NFT árbol.
- Revenue split en mismo `call`: 60% → `guardians[guardianId].payoutWallet`, 30% → tesorería, 10% → protocol fee receiver.
- Fail-safe: si Guardián no tiene `payoutWallet`, queue en `pendingPayouts` mapping (admin claim).

### IoTAttestation.sol (Phase 6)
- `function postRoot(bytes32 root, uint64 weekIndex)` solo oracle EOA.
- Mapping `weekIndex → root` para verificar leaf-proofs históricos.
- Sin upgradeability — si necesitamos cambiar formato, deploy nuevo contrato.

## Edge Functions detalle (`/supabase/functions/`)

Cada Edge Function sigue el patrón establecido en [`award-tokens/index.ts`](../supabase/functions/award-tokens/index.ts):
1. Verify JWT del usuario (excepto webhooks que verifican HMAC).
2. Lookup `user_id` desde JWT.
3. **Pre-write screening**: Chainalysis Address Screening + OFAC SDN check + geo-block check.
4. Mutación atómica de Supabase (Postgres transaction).
5. Si aplica: firma EIP-712 con oracle key (env `ORACLE_PRIVATE_KEY`, server-only).
6. Return `{ success, ...payload }`.

| Function | Auth | Output |
|---|---|---|
| `siwe-link-wallet` | Bearer JWT + SIWE message | `wallet_address` linkeado |
| `persona-webhook` | HMAC verify | `kyc_verified_at` actualizado |
| `mint-tree-nft` | Bearer JWT + KYC gate | `tx_hash` del mint |
| `tree-metadata` | Public read | `application/json` ERC-721 metadata |
| `alchemy-nft-webhook` | Alchemy signature | sync `cacao_trees.owner_wallet` |
| `sign-mazorca-burn` | Bearer JWT + KYC gate | EIP-712 signature |
| `coinbase-commerce-webhook` | HMAC verify | sync `investor_charges.status` |

## Sync on-chain → off-chain

Alchemy Custom Webhook subscrito a:
- `Transfer(address,address,uint256)` en `CacaoTreeNFT` → updates `cacao_trees.owner_wallet`.
- `Transfer(address,address,uint256)` en `CacaoToken` → updates user-side $CACAO balance display (no Supabase auth, solo cache).
- `RootPosted(bytes32,uint64)` en `IoTAttestation` → log into `iot_attestation_roots`.

Latencia objetivo: <60s desde block confirm a Supabase row update.

## Sync off-chain → on-chain

- **Care action** (Supabase mutation) → relayer llama `CacaoTreeNFT.touch(tokenId)` → emite `MetadataUpdate` → OpenSea/Zora refresh metadata.
- **Mazorca burn** (Supabase decrement) → server firma EIP-712 → user llama `MazorcaRedemption.claim(sig)` → contract mint $CACAO.
- **IoT readings** (verified rows en Supabase) → cron semanal `post_weekly_root.ts` agrega Merkle root → oracle EOA llama `IoTAttestation.postRoot()`.

## Metadata NFT (`tree-metadata` Edge Function)

```jsonc
{
  "name": "Cacao Tree #00042 — Lucho's Grove",
  "description": "Adopted on Base · Variety: Trinitario · Guardian: Lucho (Huila)",
  "image": "ipfs://QmBirthCert.../00042.png",       // immutable IPFS pin
  "external_url": "https://cacaofrutabrutal.com/tree/uuid",
  "animation_url": "https://kjygovuiphbxcdxeduco.supabase.co/functions/v1/tree-anim?tokenId=42", // dynamic
  "attributes": [
    { "trait_type": "Stage", "value": "Floración" },
    { "trait_type": "Health", "value": 87, "max_value": 100 },
    { "trait_type": "Variety", "value": "Trinitario" },
    { "trait_type": "Guardian", "value": "Lucho · Huila" },
    { "trait_type": "Care Streak (days)", "value": 14 },
    { "trait_type": "Rarity Score", "value": 312 }
  ]
}
```

- **Birth certificate** (immutable IPFS): pinned at mint time, contains `tokenId`, `gpsHash`, `varietyHash`, `mintBlock`.
- **Game state** (dynamic Supabase): `attributes[]` se recalcula en cada request a `tree-metadata`.

## Privacy & data ownership

- **anon_token** (preexistente en `ml_predictor.py`): SHA-256(`user_id` + `tree_id` + `PRIVACY_SALT`). Logs ML nunca contienen `user_id` ni `tree_id` raw. Se mantiene en Phase 6.
- **GPS hash** (no GPS raw on-chain): `gpsHash = keccak256(lat ‖ lng ‖ guardian_salt)`. La coordenada exacta vive en Supabase con RLS founder-only; el hash on-chain prueba que el árbol corresponde a una ubicación específica sin revelarla.
- **Wallet ↔ user_id link**: pública on-chain (cualquiera puede ver `Transfer` events). En Supabase, el link `wallet_address ↔ user_id` está RLS-gated (user lee la propia, founders leen todas).

## Costos operacionales (al MVP)

| Concepto | Costo | Frecuencia |
|---|---|---|
| Deploy CacaoTreeNFT.sol | ~$3 | One-time |
| Mint NFT árbol (con Paymaster) | ~$0.002 | Por mint |
| Care action relayer (touch event) | ~$0.0005 | Por care action |
| Mazorca redemption tx | ~$0.01 | Por usuario, máx 1/mes |
| Adoption tx (TreeAdoption.sol split) | ~$0.005 | Por adoption |
| IoT root weekly post | ~$0.05 | 1/semana |
| Alchemy webhook | $0 | 100k/mo free |
| Pinata IPFS | $0 | 500 pins free |
| Coinbase CDP RPC | $0 | 30M req/mo free |
| Persona KYC | $0 | 1k verifs/mo free, $0.50–$2/verif después |

Total infra Web3 mensual al MVP (Phases 1–3): **<$300/mes**.

## Release gates

Cada fase tiene un gate explícito antes de pasar a la siguiente:

- **Phase 1 → 2:** Charter + COMPLIANCE + KYC + LEGAL docs publicados; tentacle web3 inicializado; CLAUDE.md §10 merged.
- **Phase 2 → 3:** SIWE flow happy-path probado; OFAC `0x8589...` rejection probado; geo-block IP iraní → 403 probado; Persona webhook escribiendo `kyc_verified_at` en Supabase.
- **Phase 3 → 4:** Mint testnet → OpenSea testnet → care action → metadata refresh probado e2e; Foundry fuzz pass.
- **Phase 4 → 5:** Burn 1000 mazorcas → 1 $CACAO mint probado e2e; rate-limit on-chain probado (segundo intento <30d → revert).
- **Phase 5 → 6:** Adoption con USDC → split confirmado en BaseScan; webhook Coinbase Commerce funcional.
- **Phase 6 → 7:** Bench-test ESP32 → root posted Sepolia → leaf-proof verifier returns true; firmware flash de 5 unidades listas para deploy.
- **Phase 7 → public launch:** Audit clean (no Critical, no High open); $CACAO/USDC pool live con LP timelock confirmado; Charter firmado on-chain; Mirror.xyz post publicado.

## Referencias internas

- [`docs/CHARTER.md`](CHARTER.md) — Carta ética/moral
- [`docs/COMPLIANCE.md`](COMPLIANCE.md) — Programa AML/CFT
- [`docs/KYC.md`](KYC.md) — Flow Persona, retención, RLS
- [`docs/LEGAL.md`](LEGAL.md) — Análisis utility-token, Texas MSA, ToS
- [`.octogent/tentacles/web3/CONTEXT.md`](../.octogent/tentacles/web3/CONTEXT.md)
- [`/Users/amauryamed/.claude/plans/actua-como-ingeniero-de-imperative-lighthouse.md`](file:///Users/amauryamed/.claude/plans/actua-como-ingeniero-de-imperative-lighthouse.md)
