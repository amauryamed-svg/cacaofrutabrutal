# CauaBonga — Game Design Document

> v0.1 · 2026-04-28 · Drafted by `game-designer` (in-context). Source-of-truth for all CauaBonga implementation. Cross-link from `CONTEXT.md`. Updated alongside `economy.md` (sinks/faucets) and `architecture.md` (systems implementation).

---

## 1. Vision & Pillars

**CauaBonga is the playable layer of Caúa** — a Web3 farming-sim where every player owns a parcela in a real Colombian guardian's finca and learns, through play, that **regenerative agroforestry beats extractive monoculture economically over time**. The game's mechanical truth mirrors agronomic truth: companion planting + soil care compounds; monocultivo extracts and collapses.

The game is **async, no battles, Charter-aligned earn-only**. Players plant, care, harvest, burn mazorcas to $CACAO, and graduate from one parcela to a small operation across the 5 guardian regions. Every on-chain action is KYC-gated, OFAC-screened, and gasless via the existing relayer.

### Design pillars

1. **Regenerative > Extractive (mechanically true)** — every system, from yield curves to NFT attributes, must make regenerative farming the dominant strategy in the long run while letting extraction win short bursts. The teaching is in the math, not the copy.
2. **Async-first** — a session is 5–15 minutes, twice a day. The game punishes only neglect that mirrors real farming neglect (soil drift, pest risk). Never punish absence with permanent loss.
3. **Earn-only, Charter-faithful** — no presale plot drops, no founder mints outside gameplay, no insider allocation. First plot is free; subsequent plots cost mazorcas earned in-game.
4. **The forest is the protagonist** — the visual style anchors on the existing hyperrealistic vector tree (`/cacao-tree-illustration.svg`) and the cacao→heart morph (`/cacao-heart-morph.svg`). The plot grid renders in that same brutalist-luxury aesthetic.
5. **Educational by mechanic, not by tutorial** — the player learns "shade matters", "plátano is nitrogen-fixing", "Pacific biodiversity yields rare aromatics" by experiencing those modifiers in their yield numbers.

### Why this works

Per Eyal's Hook Model, this is a **Facilitator** product: it materially improves life (educates a generation about regenerative ag, distributes value to actual cacaocultores via the 60% guardian split that already exists in `TreeAdoption.sol`), and the makers use the product (the 5 guardianes are real people whose fincas players are visiting in-game).

---

## 2. Target audience

**Primary (60%) — Achievers** (Bartle): yield optimizers, soil-health min-maxers. They will discover regen dominates traditional after ~3 sessions and they'll evangelize. Caúa adopters who already mint and care for tree NFTs are the seed cohort.

**Secondary (25%) — Explorers**: drawn by the 5 distinct biomes (Andean valley, Llanos savanna, foothills, Pacific cordillera, páramo) and the unlockable rare varieties per region.

**Tertiary (15%) — Socializers**: drawn by leaderboards per finca, NPC dialogue with the 5 guardianes, public visit-other-fincas mode.

**Anti-targets**: Killers (no PvP, no griefing). If someone is here for adversarial competition, this is the wrong game.

**Demographic anchors**:
- Austin ReFi crypto crowd (existing CauaCorp seed audience)
- LATAM Web3 farmers who relate to the cacaocultor archetype
- Stardew Valley + Pixels.xyz crossover gamers
- Climate-aware millennials who'd never touch an Axie battler

---

## 3. Core loop (per session, ~10 minutes)

```
   ┌──────────────────────────────────────────────────────────────┐
   │                     OPEN CAUABONGA                           │
   │                          │                                   │
   │                          ▼                                   │
   │   1. SEE: daily quest banner + crop-ready notifications      │
   │                          │                                   │
   │                          ▼                                   │
   │   2. WALK: pick a finca tile (1 of 5 guardianes)             │
   │                          │                                   │
   │                          ▼                                   │
   │   3. ENTER: plot grid (your parcela inside that finca)       │
   │                          │                                   │
   │           ┌──────────────┼──────────────┐                    │
   │           ▼              ▼              ▼                    │
   │   4a. HARVEST       4b. CARE       4c. PLANT                 │
   │   ready crops       growing crops   empty tiles              │
   │      │                  │                │                   │
   │      ▼                  ▼                ▼                   │
   │   +mazorcas         soil delta      regen vs traditional?    │
   │                          │                                   │
   │                          ▼                                   │
   │   5. CHECK: soil-health bar, daily quest progress, balance   │
   │                          │                                   │
   │                          ▼                                   │
   │   6. CLOSE — or repeat steps 2-5 in another finca            │
   └──────────────────────────────────────────────────────────────┘
```

The loop honors **Fogg's B=MAT** (Behavior = Motivation × Ability × Trigger): each verb (HARVEST, CARE, PLANT) is one tap or one drag, no friction. Motivation is the variable reward of yield + the daily quest progress. Trigger is push notification on crop-ready.

**Session target**: 8–12 minutes morning, 5–8 minutes evening. Total daily ~15-20 minutes for an active player.

---

## 4. Meta loop (per week / per season)

**Weekly cadence** (Sunday 00:00 COL → Saturday 23:59 COL):
- Daily quests rotate every midnight
- Leaderboard per finca (top regen yield) resets Sunday
- Soil-health compounds — every day a regen plot stays in regen mode, +1 to a "regen streak" stat that boosts yield by streak * 0.5%
- Special crop drops (rare varieties) on Saturday based on regen streak

**Per-season (4 weeks)**:
- Climate event modifier (drought / wet / pest year) — each affects yields differently across the 5 biomes; players who diversified across fincas weather it best
- New plot expansions unlocked via XP tiers
- Premium variety unlocks (Criollo Élite from Marta's Saravena 12 strain) at level milestones
- Charter governance signal: top 100 regen farmers earn the right to sign the on-chain Charter Registry

**Long-tail meta**:
- Player levels 1–50 over ~6 months of casual play
- Plot upgrades (irrigation, agroforest tier 2/3, premium soil amendments)
- Achievement collection (first regen harvest, first $CACAO claim, etc.)

The meta loop creates **investment** (Hook stage 4): the longer you play, the more the soil-health and rare-seed inventory compound, raising switching cost.

---

## 5. The five Guardianes — five hub worlds

Roster is canonical in [src/utils/constants.ts:99](../../../src/utils/constants.ts#L99) (`GUARDIANS`). Each finca is mechanically distinct via one **regional modifier** anchored to that guardian's real-world cacao power.

| # | Guardian   | Region / Town          | Bioma                      | Variety hook                                  | Mechanical modifier                                                                                                                         |
|---|------------|------------------------|----------------------------|-----------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------|
| 0 | **Lucho**     | Huila / Hobo           | Andean valley · cedar shade | Híbrido Acriollado · mucílago cítrico         | **Shade canopy mastery**: any plot in regen mode with ≥1 forestal tile (Cedro Rosado, Guanábana) gets +20% yield on cacao tiles.            |
| 1 | **Marta**     | Arauca / Saravena      | Llanos savanna inundable   | Criollo Élite · FEAR5 · Saravena 12 · Tame 2   | **Floral rare-drop**: 1% chance per regen harvest of dropping a "Saravena 12" rare seed (yields 5× when planted, traditional ineligible).    |
| 2 | **Rafael**    | Cundinamarca / Arbeláez | Páramo edge · Sumapaz wind | Criollo Élite altitudinal · polifenoles diméricos · San Vicente 41 | **Altitude premium**: cacao takes +30% longer to mature but yields +50%; pest events do half damage. Rewards patient, regen-committed players. |
| 3 | **Fernando**  | Meta / Guamal          | Piedemonte llanero         | Criollo Élite premiado · FEAR5 · Medalla de Oro 2024 | **Award-winning biodiversity**: each unique companion crop in 3-tile radius adds +4% yield (stacks to +24%); rare San Vicente 41 morado drops at level 15+. |
| 4 | **Ricardo**   | Santander / Landázuri  | Montaña santandereana      | Trinitario robusto · trazabilidad lote-a-lote  | **Trazabilidad bonus**: completing all 4 regen care actions on schedule (no missed cooldowns) flags the harvest as "verified batch" → +25% yield + cosmetic gold tag (NFT metadata). |

Each finca renders the same 5×5 plot grid, but visually carries the biome's atmosphere — Llanos is open savanna with sparse trees, Sumapaz/Cundinamarca is fog and altitude, Santandereana is steep montane terraces. This is a brand alignment: the 5 guardianes are real cultivators, the player visits their world, the 60/30/10 adoption split (already on-chain in `TreeAdoption.sol`) means real money flows back. The game is a viewing window into the real economy.

> Note: an earlier GDD draft proposed a fictional "Maicol / Sumapaz" 5th guardian. The Sumapaz/altitude territory is already represented by **Rafael** (real cacaocultor, Arbeláez/Cundinamarca, polifenoles diméricos premium); the 5th seat goes to **Ricardo** in Santander/Landázuri, the Trinitario master whose trazabilidad lote-a-lote anchors the trust mechanic. No fictional guardianes — every modifier maps to a living person.

**NPC dialogue**: each guardian has 30+ dialogue snippets, written by the `writer` agent in P3 (after MVP). Dialogue surfaces on plot entry, harvest, and major milestones — see `CauaBonga.tsx:97` for the existing `npc_dialogue` field that we'll expand.

---

## 6. Plot system

### Grid

**5×5 grid (25 tiles per plot)**. Justification: 9 starter tiles (3×3 inner square) gives a manageable first session; 16 unlockable tiles (the surrounding ring) gives 6 months of meaningful XP-gated progression. 6×6 was considered but increases tutorial cognitive load past the 7±2 rule.

```
  ┌─┬─┬─┬─┬─┐
  │ │ │ │ │ │       Outer ring (16 tiles)
  ├─┼─┼─┼─┼─┤       — unlocked at levels 5, 10, 15, 20, 25
  │ │█│█│█│ │
  ├─┼─┼─┼─┼─┤
  │ │█│█│█│ │       Inner 3×3 = 9 starter tiles
  ├─┼─┼─┼─┼─┤
  │ │█│█│█│ │
  ├─┼─┼─┼─┼─┤
  │ │ │ │ │ │
  └─┴─┴─┴─┴─┘
```

### Tile states

- **Empty** — plantable. Costs nothing to leave empty.
- **Seeded** — crop just planted. Visually a nub. ~5% of grow time elapsed.
- **Growing** — visible plant, not harvestable. Care actions affect outcome here.
- **Ready** — pulsing visual aura. Tap to harvest.
- **Fallow** — post-harvest cooldown (regen: 1 day; traditional: 0 days but soil cost). Can't replant during fallow.
- **Infertile** — soil hit 0. 60-day cooldown before plot is reusable. Soft-blocks degenerate play.

### Tile upgrades

Spent mazorcas to upgrade a tile permanently:
- **Mulch ring** (50 mazorcas) — +10% yield, +2 soil-health per harvest
- **Drip irrigation** (200 mazorcas) — auto-water, frees the player from one care action
- **Companion guild** (free, applied via planting choice) — see §7

---

## 7. Crops + planting

### Crop catalog (v1 launch)

| Crop                | Cost (mazorcas) | Grow time | Base yield | Regen modifier | Companion bonus           | Unlock level |
|---------------------|----------------|-----------|------------|----------------|---------------------------|--------------|
| **Cacao Criollo**   | 25             | 8 h       | 12 mz      | +30%           | +Plátano: +15% yield      | Level 1      |
| **Cacao Trinitario**| 35             | 6 h       | 14 mz      | +25%           | +Forestal: +20% yield     | Level 1      |
| **Cacao Forastero** | 18             | 5 h       | 10 mz      | +20%           | (none)                    | Level 1      |
| **Plátano Dominico**| 12             | 4 h       | 8 mz       | +15%           | +Cacao: +10% nitrogen     | Level 2      |
| **Plátano Hartón**  | 10             | 3 h       | 6 mz       | +10%           | +Cacao: +8% nitrogen      | Level 2      |
| **Cedro forestal**  | 60             | 24 h      | 40 mz      | +50%           | +Cacao within 2: +20%     | Level 5      |
| **Guayacán**        | 80             | 30 h      | 55 mz      | +50%           | +Frutal within 2: +25%    | Level 8      |
| **Guanábana**       | 45             | 12 h      | 25 mz      | +25%           | +Forestal: +15%           | Level 10     |
| **Aguacate Hass**   | 55             | 16 h      | 30 mz      | +20%           | (none)                    | Level 10     |
| **Criollo Élite** *(rare, drop-only)* | (drop) | 12 h | 50 mz | +40% | All companions: +30% | Level 15 |

### Regen vs Traditional

When the player plants, they pick a mode:

```
┌──────────────────────────┬──────────────────────────┐
│       REGENERATIVE       │       TRADITIONAL         │
├──────────────────────────┼──────────────────────────┤
│ +30% yield               │ Base yield               │
│ Soil +1 per harvest      │ Soil −2 per harvest      │
│ Companion bonuses active │ No companion bonuses      │
│ 1-day fallow required    │ No fallow (replant fast) │
│ 4 care actions to harvest│ 2 care actions to harvest│
│ XP ×1.5                  │ XP ×1.0                  │
│ Eligible for rare drops  │ NOT eligible             │
└──────────────────────────┴──────────────────────────┘
```

The numeric balance ensures **regen wins after ~5 harvest cycles** for a given plot (the soil compound makes traditional yield drop below regen yield even on the surface). New players who pick traditional get fast wins, then notice their soil bar dropping, and naturally pivot. This is the **Diamond-Water paradox of mechanics**: the obvious-fast strategy is not optimal.

---

## 8. Care actions

Inherited directly from the existing `CauaGotchi` system in `src/pages/TreeDetail.tsx`. Same five verbs, same 5h cycle pacing:

| Action      | Cooldown | Effect                                                    | Resource         |
|-------------|----------|-----------------------------------------------------------|------------------|
| Water       | 30 min   | +moisture, +health on growing crop                        | Free             |
| Sun         | 30 min   | +sunlight, +growth velocity                               | Free             |
| Nutrients   | 1×/cycle | +25 health, locks regen if traditional plot               | Inventory item   |
| Pruning     | 1×/cycle | +20% yield on this harvest, removes pest risk             | Inventory item   |
| Molasses    | secret   | +30 health, cures fungus/plague (cacao tilde easter egg)  | Triple-tap drop  |

Plot care vs. tree care: in CauaBonga, care affects **the whole plot's growing crops** at once (not per-tile), but at lower magnitude. This keeps the 5-min session real — caring for 25 tiles individually would be punishing.

---

## 9. Soil-health system

The system that makes the educational thesis mechanically true.

### State

Each tile carries a `soil_health: integer 0-100`, initialized at 75 on first plot mint.

### Movement rules

| Trigger                                | Soil Δ               |
|----------------------------------------|----------------------|
| Regen harvest (cacao + companion)      | +2                   |
| Regen harvest (solo)                   | +1                   |
| Regen mulch upgrade applied            | +5 (one-time)        |
| Traditional harvest                    | −3                   |
| Traditional + monocultivo (3+ same crop in 3-tile radius) | −5 |
| Fallow day (regen)                     | +1                   |
| Pest event hits unprotected plot       | −8                   |
| Plot age > 30 days, no fallow ever     | −1/day               |

### Yield multiplier curve

```
soil_health  ─→  yield_multiplier
   0–10            0.30×    (collapse zone)
  11–30            0.60×    (degraded)
  31–60            1.00×    (baseline)
  61–85            1.20×    (healthy)
  86–100           1.40×    (premium)
```

A regen plot held above 85 soil for 14 days unlocks a **legacy bonus** (+5% yield permanent for as long as soil stays above 85). This rewards the patient regen player exponentially.

### Recovery

If a plot hits 0 soil: 60-day infertile cooldown. Or burn 5 $CACAO to instantly restore to 60 (monetary sink). After cooldown, plot returns at soil = 50. **Not** a permanent loss — Caúa's design philosophy is "punish neglect, never delete progress" (Charter §I).

---

## 10. Harvest + token flow

```
   ┌─────────────────────────────────────────────────────────┐
   │  Crop reaches READY (timer + care actions complete)     │
   │                       │                                 │
   │                       ▼                                 │
   │  Player taps tile → harvest animation                   │
   │                       │                                 │
   │                       ▼                                 │
   │  Edge Function: claim-cauabonga-harvest                 │
   │   • verifies on-server timer + care log                 │
   │   • calculates yield (base × regen × soil × companion)  │
   │   • inserts token_event { mazorcas: yield }             │
   │   • updates soil_health per §9                          │
   │   • inserts cauabonga_harvests row (audit)              │
   │                       │                                 │
   │                       ▼                                 │
   │  Mazorcas added to player ledger                        │
   │                       │                                 │
   │                       ▼ (later)                         │
   │  Burn 1000 mazorcas via existing MazorcaRedemption       │
   │   → 1 $CACAO minted on Base                              │
   └─────────────────────────────────────────────────────────┘
```

### Sink/faucet table (preview — full version in `economy.md`)

| Faucet (out)                | Sink (in)                          |
|----------------------------|-----------------------------------|
| Harvest yields             | Plot mint cost (500 mz)            |
| Daily quest rewards        | Crop seed cost (10–80 mz)          |
| Achievement unlocks        | Tile upgrade cost (50–200 mz)      |
| Care-action streaks        | Soil restore cost (5 $CACAO)       |
| Rare seed drops            | Inventory items (nutrients/pruning)|
|                            | Burn-to-$CACAO (1000:1)            |

Target: net mazorca emission ≤ 1.2× sink absorption per active player per week, balanced by `economy-designer` agent + `/balance-check` skill.

---

## 11. Daily quests

3 quests per day, refreshed at 00:00 COL. Drawn from a pool of ~30 templates with parameter randomization.

### Sample quests

| Quest                                              | Reward    |
|----------------------------------------------------|-----------|
| Plant 3 cacao seeds in any finca                    | 25 mz     |
| Harvest 2 plots in Lucho's finca                    | 30 mz     |
| Maintain regen mode on a plot for 24 hours          | 40 mz     |
| Care for crops in 3 different fincas today          | 50 mz     |
| Achieve soil-health 85+ on any tile                 | 80 mz     |
| Companion-plant cacao + plátano + forestal in plot  | 60 mz     |
| Harvest a Criollo Élite (rare drop)                 | 200 mz    |
| Sign-in 7 days in a row (streak bonus)              | 100 mz    |

Cap: 200 mz/day from quests alone (anti-grind). Streak bonus is the only quest that can scale beyond.

---

## 12. Progression & XP

| Level | XP threshold | Unlocks                                                     |
|-------|--------------|-------------------------------------------------------------|
| 1     | 0            | First plot (free, in any finca), 9 tiles, 3 cacao varieties |
| 2     | 100          | Plátano unlocked                                            |
| 5     | 500          | +4 tiles unlocked, Forestales (Cedro)                       |
| 8     | 1,200        | Guayacán; second plot purchasable                           |
| 10    | 2,000        | +4 tiles, Frutales (Guanábana, Aguacate)                    |
| 15    | 4,000        | Criollo Élite drops eligible                                 |
| 20    | 8,000        | +4 tiles, premium soil amendments                            |
| 25    | 15,000       | All 25 tiles unlocked, "Maestro" badge, Charter sign right  |
| 30+   | 25,000+      | Prestige tiers, weekly cosmetic seed drops                  |

XP sources: harvest (0.5 XP per mazorca yielded), daily quest completion (10 XP), soil-health milestones (50 XP at 85+ for first time), achievement unlocks (varies).

---

## 13. NFT model — PlotNFT

### Standard

ERC-721 deployed to Base Sepolia (testnet first), then Base mainnet. New contract: `contracts/src/CauaBongaPlot.sol`. Slots into the existing 5-contract suite alongside `CacaoTreeNFT`, `CacaoToken`, `MazorcaRedemption`, `TreeAdoption`, `IoTAttestation`.

### Attributes (on-chain metadata)

```json
{
  "tokenId": 1234,
  "guardianId": 0,
  "region": "Huila",
  "bioma": "Andean valley",
  "soilTier": 4,           // 1-5, drives starting soil_health
  "rarity": "epic",        // common | rare | epic | legendary
  "mintedAt": 1735593600,
  "owner": "0x...",
  "tileCount": 9,          // expanding to 25 via off-chain XP, on-chain via setter
  "regenStreakDays": 0
}
```

The PlotNFT is the **on-chain anchor**. Per-tile state (planted/growing/ready) lives off-chain in Postgres for performance. Critical state hashes (regen streak, total harvests, soil-health summary) are written to chain weekly via an oracle function — same pattern as `IoTAttestation` does for sensor data.

### Soulbound vs transferable

**v1.0: SOULBOUND** (non-transferable). Justification:
- Anti-bot: prevents wash-trading of premium plots
- Charter alignment: earn-only loop is preserved (you can't shortcut your way to a Maicol Maestro plot via market)
- Anti-Sybil: KYC + plot soulbinding makes multi-account farming uneconomic

**v1.2: transferable, with audit + multisig pause control** (Charter §10 Pausable everywhere). Secondary market opens after Code4rena audit clears.

### Mint cost + flow

- **First plot**: free. Required to pass KYC tier ≥ 1 + linked wallet + OFAC clear.
- **Subsequent plots**: 500 mazorcas + Onramp gas-equivalent (~$0.50). Gasless via existing relayer (`mint-cauabonga-plot` Edge Function uses `RELAYER_PRIVATE_KEY`).
- **Cap**: 1 plot per finca per player at MVP. v1.2 lifts to 5 per finca.

---

## 14. Onboarding

### First 60 seconds

```
0:00  Hero screen: caúa logo → "CAUABONGA" with the cacao→heart morph as icon
0:08  CTA "ENTRAR AL MUNDO" — single button, no choice paralysis
0:14  Connect Wallet (existing rainbow-kit flow) OR continue as guest (off-chain only)
0:30  KYC step (already wired) OR skip to guest demo
0:45  Map of Colombia appears with the 5 fincas highlighted
0:55  "Toca a Lucho para tu primera parcela" — guided pointer
```

### First 10 minutes

```
1:00  Lucho's finca opens, 3×3 inner grid visible, dialog from Lucho
1:30  Free seed: 1 Cacao Criollo placed in tutorial tile (animated)
2:00  Player picks regen vs traditional — copy explains in 12 words each
2:30  Place 2 more crops (player-chosen)
3:00  Care action prompt — "Riega tu cacao con un toque"
3:30  Daily quest banner reveals: "Cosecha tu primera mazorca"
4:00  Crops grow visibly accelerated for tutorial only — first harvest in ~5 min
9:00  First harvest: 12 mazorcas + 6 XP appear with a heart-morph mini-animation
9:30  Push notification permission prompt (system) for "te avisaremos cuando madure"
10:00 Free choice: visit another finca, plant more, or close
```

### Hook Model — first 7 days

| Day | External trigger          | Action                       | Variable reward         | Investment              |
|-----|---------------------------|------------------------------|-------------------------|-------------------------|
| 1   | Marketing / tutorial      | Plant 3 + harvest 1          | First mazorcas, XP burst| Plot exists             |
| 2   | Push: "tu cacao está listo"| Harvest + plant new          | Yield variance, soil delta | More plants in flight |
| 3   | Push + daily quest         | Care actions, soil tick up   | Companion bonus surprise | Soil-health stat       |
| 5   | Notification: rare drop chance | Plant Criollo Élite seeds | 1% rare seed drop        | Premium variety in inventory |
| 7   | Internal trigger (FOMO)    | Login without notification   | Streak bonus, leaderboard view | Streak counter visible |

By day 7 the trigger has shifted from external to internal — the Hook is forming.

---

## 15. Hook Model phase map

| Phase         | CauaBonga implementation                                                       |
|---------------|--------------------------------------------------------------------------------|
| **Trigger**   | External: push when crops ready, daily quest reset. Internal: soil-degradation FOMO, leaderboard ranking anxiety, streak preservation. |
| **Action**    | One-tap harvest, drag-place plant, slider for soil amendment quantity. Always ≤ 2 taps to a meaningful change. |
| **Variable Reward** | **Hunt**: yield numbers (regen variance ±10%), rare seed drops (Criollo Élite 1%), pest events. **Tribe**: leaderboard rank, NPC praise dialogue. **Self**: soil-health visible delta, mastery progression, achievement unlocks. |
| **Investment**| Soil-health compounds, regen streak, plot upgrades persist, NFT in wallet. Each session adds future Trigger value. |

---

## 16. Anti-degeneracy

### Bot defense

1. **KYC + OFAC** gate at on-chain mint (existing `siwe-link-wallet` + `persona-webhook` infrastructure).
2. **1 plot per finca per player** in v1; lifts to 5 in v1.2.
3. **Server-authoritative timers** — client cannot speedhack. All grow timers + care cooldowns checked in Edge Function.
4. **Daily mazorca cap** — 200 mz/day from quests + uncapped from harvests but harvests are timer-gated (max ~120 mz/day from harvests on a fully-tended plot).
5. **Soulbound NFTs** at v1 — wash-trading impossible.
6. **Rate-limit on mint Edge Function** — same pattern as `mint-tree-nft` (1/24h per user).
7. **Captcha** on guest/non-KYC flows for any economic action.

### Exploit hardening

- **Plot age decay**: idle plots > 30 days lose soil. Prevents farm-and-flip.
- **Companion bonus radius**: max 18% bonus per tile prevents min-max ring exploits.
- **Pest event randomness**: client never sees the seed; server-driven.
- **Rare drop client-blind**: server picks Criollo Élite drops; client gets a verifiable signature, never the RNG itself.

---

## 17. Visual & UX direction

### Style anchor

The new vector assets are the brand voice for CauaBonga:
- **`/cacao-tree-illustration.svg`** — the hyperrealistic vector tree. Every plot's mature crops render in this style. Pods on tiles use the `<symbol id="pod">` for color-driven variants (red/orange/yellow/green per ripeness).
- **`/cacao-heart-morph.svg`** — the cacao→heart transmutation plays on every harvest claim. Becomes the mini-animation that punctuates each successful yield.

### Color palette

Existing brand tokens from `src/utils/constants.ts:BRAND` — hex-only per CauaCore §8:
- `bgDeep`, `bgCard`, `bgDark` — backgrounds
- `pod` `#91A63B` — regenerative accent (UI buttons, soil-good zone)
- `mazorca` `#F1A91E` — token + harvest accent
- `theobroma` `#DB5527` — pest / traditional warning
- `criollo` `#8D2679` — premium / rare drop accent
- `heroic` `#00A3CD` — water / care actions

### Plot grid view

- Top-down 2D, isometric ¼ tilt for depth. SVG-rendered tiles for crispness on retina.
- Each tile: 96×96px, 8px gutter. Total grid 5×5 = 520×520px in viewport.
- Tile state shown by: empty (dark soil texture), seeded (sprout), growing (sapling sway animation), ready (pod glowing with mazorca-color halo + heart-morph icon corner), fallow (cracked earth overlay), infertile (dust + skull icon).

### HUD

```
┌───────────────────────────────────────────────────────────────┐
│ CAUABONGA   [Lucho's Finca · Huila]              ⚙ ?  [APP]  │
├───────────────────────────────────────────────────────────────┤
│ 🫘 1,247  🌽 24  ⚡ Lvl 8  🌱 Soil 78    [Daily quests: 2/3]  │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│            ┌───┬───┬───┬───┬───┐                              │
│            │   │   │ 🌱│   │   │                              │
│            ├───┼───┼───┼───┼───┤                              │
│            │   │ 🌳│ 🟢│ 🌳│   │                              │
│            ├───┼───┼───┼───┼───┤    "—Lucho: 'el cacao        │
│            │ 🌱│ 🟡│ 🟡│ 🌳│ 🌱│      bajo sombra es          │
│            ├───┼───┼───┼───┼───┤      criollo de verdad.'"    │
│            │   │ 🌱│ 🟢│ 🌱│   │                              │
│            ├───┼───┼───┼───┼───┤                              │
│            │   │   │ 🌳│   │   │                              │
│            └───┴───┴───┴───┴───┘                              │
│                                                               │
│ [PLANT]  [WATER ALL]  [SUN ALL]  [HARVEST READY (3)]          │
└───────────────────────────────────────────────────────────────┘
```

### Mobile-first

The grid scales down to 4×4 visible with horizontal swipe to reveal full 5×5. Tap-tile interaction stays 1-tap.

---

## 18. Open questions (block implementation)

| # | Question                                              | Owner          | Blocks                  |
|---|-------------------------------------------------------|----------------|-------------------------|
| ~~1~~ | ~~5th guardian identity~~ — **RESOLVED 2026-04-28**: roster reconciled with `src/utils/constants.ts:99`. The 5 are Lucho/Marta/Rafael/Fernando/Ricardo (Santander/Landázuri/Trinitario). No fictional guardianes. | — | — |
| 2 | Plot-mint cost: 500 mz vs 1000 mz vs USDC alternative? | economy-designer | Sink/faucet balance |
| 3 | Soulbound v1: confirm? affects UX copy + market plan | Charter signers | NFT contract spec      |
| 4 | Regen yield bonus — locked at +30% per Charter? balance-check may need ±5% | economy-designer + balance-check skill | Yield curves |
| 5 | Daily quest reward sizing — 25-200 vs 50-300 mz range? | economy-designer | Quest engine            |
| 6 | Season length — 1 week (high cadence) vs 4 weeks (long-tail)? | game-designer + analytics | Leaderboard reset cron |
| 7 | NFT metadata IPFS pinning — Pinata account exists per `web3` tentacle? | web3 lead | tree-metadata pattern reuse |
| 8 | First-plot-free vs always-cost: does free dilute value? Stardew model says no. | game-designer | Onboarding flow |

---

## 19. MVP cut + post-MVP roadmap

### MVP (4-week sprint)

**Vertical slice — Lucho's finca only**:
- 1 guardian (Lucho) — 1 hub world
- 3×3 grid (9 tiles, no expansion)
- 2 crops only: Cacao Criollo + Plátano Dominico
- Regen mode only (traditional shipped in v1.0 release after MVP)
- Manual harvest claim (no push notifications)
- **Off-chain plot only** — no NFT mint yet, just Postgres row tied to `user_id`
- Soil-health visible but simplified curve (3 zones instead of 5)
- 1 daily quest type
- Guest mode + KYC mode both supported

This proves the loop without committing to contract code yet.

### v1.0 (weeks 5–10)

- All 5 guardianes (5 hubs, 5 modifiers)
- Full 5×5 grid + XP-gated expansion
- All 10 crops including forestales + frutales + rare drops
- Regen vs traditional toggle with full soil model
- Daily quest engine (30-template pool)
- Leaderboards per finca
- **PlotNFT.sol** deployed to Base Sepolia, soulbound, gasless mint via relayer
- Push notifications
- NPC dialogue (writer agent)

### v1.1 (weeks 11–14)

- Premium varieties (Criollo Élite drops live)
- Tile upgrades (mulch, irrigation)
- Plot expansion via XP
- Achievement system + cosmetic badges
- Audio (sound-designer agent)

### v1.2 (post-audit)

- PlotNFT mainnet + transferable
- Secondary market UI (OpenSea integration)
- Premium soil amendments via $CACAO burn
- Charter on-chain signing for top regen players
- Cross-finca social features (visit other players)

---

## 20. Out of scope

- **PvP / battles** — incompatible with regenerative thesis. Hard no.
- **Voxel world-building** (Sandbox-style) — out of scope for at least v2.
- **Real-money trading** outside the existing $CACAO Uniswap path (Phase 7 of web3 tentacle, audit-gated).
- **Governance token / DAO voting** — Charter Registry handles immutable governance signals; no separate voting token.
- **Mobile native app (iOS/Android)** — web app first, native only after PMF.
- **Cross-game asset interop** — PlotNFT stays in Caúa ecosystem v1.

---

## Appendix A — File map (for implementer reference)

| Layer        | Files                                                                          |
|--------------|--------------------------------------------------------------------------------|
| GDD          | `.octogent/tentacles/cauabonga/GDD.md` (this file)                            |
| Economy      | `.octogent/tentacles/cauabonga/economy.md` (next, by economy-designer)         |
| Architecture | `.octogent/tentacles/cauabonga/architecture.md` (after `/create-architecture`) |
| Art bible    | `.octogent/tentacles/cauabonga/art-bible.md` (after `/art-bible`)              |
| Systems      | `.octogent/tentacles/cauabonga/systems-map.md` (after `/map-systems`)          |
| Epics        | `.octogent/tentacles/cauabonga/epics/*.md` (after `/create-epics`)             |
| Frontend     | `src/pages/CauaBongaGame.tsx` (new), `src/pages/CauaBonga.tsx` (extend)        |
| Hooks        | `src/hooks/useCauaBongaPlots.ts` (new), `useCauaBongaWorld.ts` (extend)        |
| DB           | `supabase/migrations/033_cauabonga_plots.sql` (new — plots, plantings, harvests, soil_history) |
| Edge fns     | `supabase/functions/{mint-cauabonga-plot,plant-crop,claim-cauabonga-harvest}/` |
| Contracts    | `contracts/src/CauaBongaPlot.sol`, tests in `contracts/test/`                  |
| Assets       | `public/cacao-tree-illustration.svg`, `cacao-heart-morph.svg` (existing, reused) |

---

> **Highest-risk design calls** (need playtest evidence before launch):
> 1. **Regen yield exact +30%** — too low and players never feel the win; too high and traditional becomes useless. Needs balance-check + 50-player playtest.
> 2. **Soulbound v1** — anti-bot win, but kills speculative onboarding driver. Need to confirm with growth team that earned-only narrative outweighs.
> 3. **5×5 grid size** — choosing 9 starter tiles vs 16 vs 25 affects session length and complexity ceiling. Soft-locked but reversible until first user test.
