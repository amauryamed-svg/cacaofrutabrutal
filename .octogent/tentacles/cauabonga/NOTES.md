# CauaBonga — architectural decisions

## 2026-04-28

- **P2E type chosen: farming-sim Web3** (Pixels.xyz / Sunflower Land lineage). Battles ruled out — incompatible with the regenerative-agriculture brand message. World-building (Sandbox-style) ruled out — out of scope for MVP.
- **No new fungible token.** Game emits **mazorcas** (off-chain) and burns through `MazorcaRedemption` to **$CACAO** (existing ERC-20). Charter §10 earn-only respected. One new ERC-721 only: **PlotNFT** on Base Sepolia.
- **Educational core: regenerative vs traditional.** Two play modes per plot. Regen wins long-term economically; traditional degrades soil. Mechanics teach the lesson.
- **5 guardianes = 5 hub worlds.** Existing `GUARDIANS` constant is canonical. Plots live within a guardian's finca. Map of Colombia (`ColombiaMap.tsx` + `REGION_BIOME`) becomes the world hub.
- **Game Studios studio framework adopted.** Curated 12 agents (game-designer, economy-designer, systems-designer, level-designer, world-builder, narrative-director, gameplay-programmer, technical-director, ux-designer, ui-programmer, art-director, writer) + 10 skills (brainstorm, create-architecture, create-epics, create-stories, art-bible, asset-spec, map-systems, balance-check, prototype, quick-design) installed in `.claude/`. Engine-specific agents (Godot/Unity/Unreal) skipped — we're React+Vite.

## Cross-tentacle dependencies

- **web3 tentacle**: PlotNFT joins the contract suite. Same KYC + OFAC + geo-block gate. Same relayer for gasless mint.
- **supabase-backend tentacle**: 4 new tables (plots, plantings, harvests, soil_history) + 2 Edge Functions (mint-plot, claim-harvest).
- **token-economy tentacle**: mazorca emission rate must be co-balanced with existing tree-care emission so total faucet stays bounded.
- **design-system tentacle**: art-bible will pull from the new vector assets in `public/` (`cacao-tree-illustration.svg`, `cacao-heart-morph.svg`) — they ARE the visual style guide for this game.
