# CauaBonga — domain context

> Tentacle for the **CauaBonga P2E farming-sim** (Pixels.xyz / Sunflower Land lineage). Web3-native, on Base. Educational core: regenerative agroforestry vs. traditional monoculture, played out across 5 guardian fincas in 5 Colombian biomes.

## Anchors

- Game type: **farming-sim Web3** — async, no battles, plant→grow→harvest→tokens
- Visual style: brutalist-luxury 2D + the existing hyperrealistic vector tree already in `public/cacao-tree-illustration.svg` and `cacao-heart-morph.svg`
- Stack: React 19 + Vite + TypeScript (frontend), Supabase Postgres (game state), Solidity / Foundry (NFTs on Base / Base Sepolia)
- Existing scaffold to reuse:
  - `public/siembra.html` — narrative phases (Forestales · Plátano · Cacao Élite · Upcycling · Form). Source of the educational arc.
  - `src/pages/CauaBonga.tsx` — Colombia map with 5-finca tile router (already wired to `useCauaBongaWorld` + `ColombiaMap`)
  - `src/pages/CauaBongaFinca.tsx` — per-finca page (per-guardian)
  - `src/utils/colombiaGeo.ts` (`REGION_BIOME`) — biome assignment per region

## Tokens / NFTs (re-use, don't multiply)

Per Charter §10 + earn-only: **no new fungible token**. CauaBonga taps the existing economy:
- **Mazorcas** (off-chain ledger, [`token_events`](supabase/migrations/) table) — earned via care actions
- **$CACAO** (ERC-20 cap 21M, Base) — minted by burning 1000 mazorcas via [`MazorcaRedemption`](contracts/src/MazorcaRedemption.sol)
- **Tree NFT** (ERC-721, Base) — already exists for adopted trees ([`CacaoTreeNFT`](contracts/src/CacaoTreeNFT.sol))
- **NEW: PlotNFT** (ERC-721, Base Sepolia first) — represents one parcel within a guardian's finca. The plot is the canvas where the player plants. Soulbound? TBD by GDD.

KYC + OFAC + geo-block continue to gate any on-chain write per [`docs/COMPLIANCE.md`](docs/COMPLIANCE.md).

## 5 guardianes (canonical roster)

Source-of-truth: [`src/utils/constants.ts:99`](../../../src/utils/constants.ts#L99) (`GUARDIANS`).

| ID | Name      | Region / Town          | Bioma                     | Variety                                |
|----|-----------|------------------------|---------------------------|----------------------------------------|
| 0  | Lucho     | Huila / Hobo           | Andean valley · cedar shade | Híbrido Acriollado                    |
| 1  | Marta     | Arauca / Saravena      | Llanos savanna inundable  | Criollo Élite (FEAR5/Saravena 12/Tame 2) |
| 2  | Rafael    | Cundinamarca / Arbeláez | Páramo edge · Sumapaz wind | Criollo Élite altitudinal · polifenoles diméricos |
| 3  | Fernando  | Meta / Guamal          | Piedemonte llanero        | Criollo Élite premiado · Medalla de Oro 2024 |
| 4  | Ricardo   | Santander / Landázuri  | Montaña santandereana     | Trinitario robusto · trazabilidad lote-a-lote |

Each guardian's finca becomes a hub world. Plots within belong to players via PlotNFT. See [GDD §5](./GDD.md#5-the-five-guardianes--five-hub-worlds) for per-guardian mechanical modifiers.

## Educational core (the hook)

Two parallel modes for every plot:
1. **Agroforestería regenerativa** — companion planting (cacao + plátano + forestales + frutales), longer cycles, +30% yield, +XP, soil-health stat that compounds over time. Requires more user attention (care actions per phase).
2. **Agricultura tradicional** (monocultivo) — fast cycles, lower base yield, soil degrades each harvest, eventually plot becomes infertile. Cheaper to start.

Players naturally discover regen wins economically over the long run. Educational message bakes into mechanics.

## Reference inspirations

- Pixels.xyz / Sunflower Land — async farm, NFT plot, on-chain harvest claim
- Stardew Valley — care loop + seasons + NPC dialogue (5 guardianes are NPCs)
- The existing `siembra.html` — already has the 5-phase agroforestería narrative; we'll elevate from "explainer" to "playable"

## Source-of-truth files (this tentacle)

- `GDD.md` — master Game Design Document (drafted by game-designer agent)
- `economy.md` — sinks/faucets, cost/reward tables (drafted by economy-designer)
- `systems-map.md` — output of `/map-systems`
- `art-bible.md` — output of `/art-bible` (from existing vectors as base)
- `architecture.md` — output of `/create-architecture`
- `epics/*.md` — output of `/create-epics`

Update [todo.md](./todo.md) as items move; record cross-tentacle decisions in [NOTES.md](./NOTES.md).
