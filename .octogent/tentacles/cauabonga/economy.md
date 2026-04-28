# CauaBonga — Master Economy Document

> v0.1 · 2026-04-28 · Authored by `economy-designer`.  
> Source-of-truth for all CauaBonga resource flows. Cross-links: `GDD.md` (game rules),
> `CONTEXT.md` (token anchors), `src/utils/constants.ts` (`TOKEN_RATES`, `MAZORCA_TO_CACAO_RATE`).  
> Canonical mazorca→$CACAO rate: **1 000 mazorcas = 1 $CACAO** (`MAZORCA_TO_CACAO_RATE = 1000`).

---

## 1. Goals

The CauaBonga economy must accomplish five things simultaneously — ranked by priority:

### 1.1 Carry the educational message mechanically

Regenerative farming must be the **dominant strategy over any 8-cycle horizon**, not just the "good" one in the tutorial copy. The math, not the marketing, teaches the player. Traditional mode must be temporarily attractive (faster first harvest, lower barrier to entry) but structurally worse by cycle 6–8 via soil degradation compounding (GDD §9). If a player can sustain traditional yields indefinitely, the thesis fails.

### 1.2 Create a sustainable token sink that absorbs emission

The mazorca ledger is shared with the existing CauaCorp economy (`award-tokens` Edge Function). CauaBonga is a major new faucet. Without sufficient sinks — seed costs, upgrades, plot expansion, and above all the 1 000-mazorca $CACAO burn — the ledger inflates, devaluing rewards across every product in the ecosystem. **Target: ≥ 85% of weekly faucet emission absorbed by sinks at steady state.**

### 1.3 Drive daily retention without punishing absence

The Hook Model cadence (GDD §14–15) demands meaningful rewards in a 10-minute session. Players must feel progress every day. But Charter §I forbids permanent loss — a 3-day absence should set back progress, not delete it. Economy levers: soil drift (recoverable), streak bonuses (lost but restartable), no NFT burning for inactivity.

### 1.4 No whale dominance

A player with 10 plots (post-v1.2) should earn at most 3–4× the mazorcas of a player with 1 plot, not 10×. This is enforced by per-plot diminishing returns on daily cap contributions, per-user daily ceiling, and the soulbound constraint at v1.0 (1 plot per finca = 5 plots max total). Any mechanic that lets a single player extract disproportionate $CACAO supply undermines the earn-only Charter principle.

### 1.5 Target emission budget

| Metric | Target |
|--------|--------|
| Casual player mazorcas/day | 30–60 |
| Engaged farmer mazorcas/day | 80–120 |
| Endgame (5 fincas, all upgraded) mazorcas/day | 130–180 |
| Hard ceiling per user per day | 200 |
| Weekly net emission (faucets − sinks, per active user) | ≤ 150 mz |
| Days to first $CACAO redemption (casual) | ~25 days |
| Days to first $CACAO redemption (engaged) | ~10 days |

---

## 2. Faucets — Sources of Mazorcas

All faucets feed the existing `token_events` ledger via the `award-tokens` Edge Function or its CauaBonga-specific successor (`claim-cauabonga-harvest`). New `event_type` values required — see §10.

### 2.1 Harvest yields (primary faucet)

Harvest is the engine. Base yields per crop are defined in GDD §7. The actual payout formula is:

```
harvest_mazorcas = base_yield
                 × regen_multiplier
                 × soil_multiplier
                 × companion_multiplier
                 × regional_modifier
                 × streak_bonus
```

Where each multiplier is defined in GDD §7 (regen), §9 (soil), §5 (regional), §4 (streak).

**Base yield reference table (GDD §7 — no modification here):**

| Crop | Base yield (mz) | Grow time | Regen mult | Notes |
|------|----------------|-----------|------------|-------|
| Cacao Criollo | 12 | 8 h | 1.30 | Core crop L1 |
| Cacao Trinitario | 14 | 6 h | 1.25 | L1, fastest cacao |
| Cacao Forastero | 10 | 5 h | 1.20 | L1, lowest ceiling |
| Plátano Dominico | 8 | 4 h | 1.15 | L2, companion |
| Plátano Hartón | 6 | 3 h | 1.10 | L2, companion |
| Cedro forestal | 40 | 24 h | 1.50 | L5, high value |
| Guayacán | 55 | 30 h | 1.50 | L8, highest yield |
| Guanábana | 25 | 12 h | 1.25 | L10 |
| Aguacate Hass | 30 | 16 h | 1.20 | L10 |
| Criollo Élite | 50 | 12 h | 1.40 | L15, drop-only |

**Realistic harvest rate for a 9-tile regen plot (Cacao Criollo + Plátano Dominico mix, soil 75, no companion bonus):**

- Criollo base yield: 12 × 1.30 (regen) × 1.20 (soil 61–85 tier) = **18.7 mz per harvest**
- Per 8-hour cycle: 18.7 mz per planted cacao tile
- 5 cacao + 4 plátano tiles, no fallow overlap: ~3 cacao harvests/day + 6 plátano harvests/day
- Daily harvest faucet: (3 × 18.7) + (6 × 8 × 1.15 × 1.20) = **56 + 66 ≈ 80 mz/day** (engaged, all tiles always planted)

This is within the 80–120 engaged target. Casual players (partial planting, some missed harvests) land at 30–50 mz/day from harvests alone.

**Per-user daily harvest cap: 120 mz from harvests.** Server rejects claims beyond this threshold within any 24h window. Casual players will never hit it organically. Engaged players hit it only if they have 9+ tiles fully optimized — intended.

### 2.2 Daily quests (secondary faucet)

Three quests per day (GDD §11). Reward pool drawn from a 30-template set. Daily cap from quests: **120 mz** (raised slightly from GDD §11's 200 mz after recalibration — see §6 below).

| Quest tier | Reward range | Example |
|------------|-------------|---------|
| Easy | 15–25 mz | "Plant 2 cacao seeds" |
| Medium | 30–50 mz | "Harvest any 2 plots" |
| Hard | 60–90 mz | "Maintain regen mode 24h; companion-plant all 3 types" |
| Streak | 100 mz (weekly) | "Sign in 7 consecutive days" |
| Legendary | 200 mz (rare) | "Harvest a Criollo Élite" |

Daily quest draw is 1 Easy + 1 Medium + 1 Hard. Expected daily quest emission: **15+30+60 = 105 mz** average, **25+50+90 = 165 mz** max (capped at 120 by function). Legendary quests only appear if preconditions are met (player is Level 15+, Criollo Élite in inventory).

**Note on GDD §11 conflict:** GDD §11 sets a 200 mz/day cap from quests. Economy analysis shows this is too high when combined with harvest yields (risk of ~320 mz/day before sinks). Cap revised down to **120 mz/day from quests**. Flag for `/balance-check`.

### 2.3 Care-action streaks (retention faucet)

Rewarded at the daily-login / care layer, separate from harvest yield.

| Streak milestone | Mazorcas | Beans | event_type |
|-----------------|----------|-------|------------|
| 3-day care streak | 5 mz | 1.5 | `cauabonga_streak_3` |
| 7-day care streak | 15 mz | 3.5 | `cauabonga_streak_7` |
| 30-day care streak | 50 mz | 15 | `cauabonga_streak_30` |

Streak bonuses emit once per milestone reached, not per day. 7-day and 30-day are the retention anchors (Hook §15 Investment: streak counter raises switching cost).

### 2.4 Soil-health milestones (progression faucet)

One-time rewards per tile, per threshold crossing. Encourages regen commitment.

| Milestone | Reward | Condition |
|-----------|--------|-----------|
| First tile hits soil ≥ 85 | 50 mz | Once per tile |
| Plot average soil ≥ 80 | 30 mz | Once per plot |
| Regen streak 14 days active | 20 mz/week | Repeatable weekly |
| Legacy bonus unlocked (soil 85+ for 14 days, GDD §9) | 25 mz | Once per tile |

### 2.5 Regen vs. Traditional comparison view (engagement faucet)

When the player opens the "compare mode" overlay (a UI panel showing their regen yield vs. what traditional would have yielded at the same cycle count), they earn a small reward for engaging with the educational content. Capped at once per 48 hours.

| Action | Reward | Cap |
|--------|--------|-----|
| Open compare-view for ≥ 30 seconds | 5 mz | 1×/48h |

This is intentionally tiny — it's a nudge, not a grind vector. Total contribution over a week: ≤ 17.5 mz.

### 2.6 Weekly leaderboard rewards (competitive faucet)

Per finca, top 10 regen yield players rewarded Sunday reset (GDD §4).

| Leaderboard rank | Weekly bonus | Notes |
|-----------------|-------------|-------|
| 1st | 150 mz | Per finca |
| 2nd | 100 mz | Per finca |
| 3rd | 75 mz | Per finca |
| 4th–10th | 30 mz each | Per finca |
| Participation (any harvest logged) | 10 mz | Per finca, once/week |

A player active in all 5 fincas (v1.2) who ranks 10th in all = 5 × 30 = 150 mz/week from leaderboards alone. This is within the weekly budget. First-place across all 5 = 750 mz/week — high but achievable only by the most committed players; their sink burden (maintaining 5 plots) absorbs it.

### 2.7 Achievement unlocks (one-time faucets)

One-time rewards for milestone achievements. These are budget-neutral over the game's life since each fires once per player.

| Achievement | Reward | Trigger |
|-------------|--------|---------|
| "Primera Mazorca" | 25 mz | First harvest ever |
| "Manos de Tierra" | 50 mz | Reach Level 5 |
| "Guardián de la Sombra" | 75 mz | First regen tile hits legacy bonus |
| "Los Cinco Mundos" | 200 mz | Plant in all 5 fincas (v1.2) |
| "Maestro Cacaotero" | 500 mz | Reach Level 25 |

### 2.8 Faucet summary table

| Faucet | Daily emission (casual) | Daily emission (engaged) | Daily emission (endgame) | Repeatable? |
|--------|------------------------|--------------------------|--------------------------|-------------|
| Harvest yields | 20–40 mz | 60–100 mz | 120 mz (cap) | Yes |
| Daily quests | 50–80 mz | 80–120 mz | 120 mz (cap) | Yes |
| Care streaks | ~2 mz avg | ~5 mz avg | ~7 mz avg | Milestone |
| Soil milestones | ~5 mz avg | ~10 mz avg | ~15 mz avg | Semi |
| Compare view | 0 mz | ~3.5 mz/day avg | ~3.5 mz/day avg | 1×/48h |
| Leaderboard | 0–10 mz/week | 10–75 mz/week | 150+ mz/week | Weekly |
| Achievements | ~5 mz/day (early) | ~2 mz/day (mid) | ~0 mz/day (done) | Once |
| **TOTAL (daily est.)** | **~30–55 mz** | **~80–120 mz** | **~130–180 mz** | — |

**Hard ceiling per user per day: 200 mz** (enforced in server logic; see §6).

---

## 3. Sinks — Mazorca Outflows

Sinks must absorb at least 85% of weekly emission at steady state. They fall into three categories: consumable (recurring), capital (one-time), and irreversible ($CACAO burn).

### 3.1 Seed costs (recurring consumable sink)

Every planting event burns mazorcas from the player's balance. Costs from GDD §7, canonical here:

| Crop | Seed cost (mz) | Harvests/day (single tile) | Cost per harvest cycle |
|------|---------------|---------------------------|----------------------|
| Cacao Criollo | 25 | 3 (8h cycle) | 8.3 mz/harvest |
| Cacao Trinitario | 35 | 4 (6h cycle) | 8.75 mz/harvest |
| Cacao Forastero | 18 | 4.8 (5h cycle) | 3.75 mz/harvest |
| Plátano Dominico | 12 | 6 (4h cycle) | 2 mz/harvest |
| Plátano Hartón | 10 | 8 (3h cycle) | 1.25 mz/harvest |
| Cedro forestal | 60 | 1 (24h cycle) | 60 mz/harvest |
| Guayacán | 80 | 0.8 (30h cycle) | 100 mz/harvest |
| Guanábana | 45 | 2 (12h cycle) | 22.5 mz/harvest |
| Aguacate Hass | 55 | 1.5 (16h cycle) | 36.7 mz/harvest |
| Criollo Élite | Drop-only | 2 (12h cycle) | 0 mz (drop) |

**9-tile engaged player daily seed spend:** 5 cacao + 4 plátano, full replanting each cycle.
- Criollo: 5 × 25 × 3 cycles/day = 375 mz/day in seed costs
- Plátano: 4 × 12 × 6 cycles/day = 288 mz/day in seed costs
- **Total seed sink: ~663 mz/day**

This exceeds daily harvest yield (80 mz/day) by ~8×. This is **intentional and correct** — seed costs are the primary recurring sink. The player accumulates mazorcas from quests and then deploys them into seeds. The net daily burn from active farming is strongly negative, which is the desired sink/faucet balance. Players who only harvest without replanting will stockpile slowly; players who actively optimize will cycle mazorcas through seeds continuously.

Wait — re-check: the player earns mazorcas FROM the harvest, not in addition to seed costs. Let's be precise:

**Net daily mazorca flow for a 9-tile engaged player:**
- Faucets: 80 (harvest) + 100 (quests) = **180 mz/day in**
- Seed costs: Seeds are bought once, not per harvest. A Criollo Élite seed lasts for 1 harvest per planting. After harvest, the tile enters fallow (1 day regen) before replanting. Effective seed spend per day is bounded by tiles × cycles.
- With 5 Criollo tiles: 5 tiles × 3 cycles/day × 25 mz/seed = 375 mz/day in seeds
- With 4 Plátano tiles: 4 tiles × 6 cycles/day × 12 mz/seed = 288 mz/day in seeds
- **Total seed sink: 663 mz/day**

Net: 180 - 663 = **-483 mz/day** — this means a player cannot sustain full 9-tile farming purely from in-game emission. They must either: (a) farm selectively, (b) use slower-cycling forestales, (c) let tiles go empty sometimes, or (d) use mazorcas saved from achievements/quests.

**This is by design (natural pacing gate).** Adjust: reduce seed replanting frequency. A realistic engaged player replants only 2–3 tiles/day fully while harvesting from pre-planted tiles.

**Revised realistic seed sink (2-tile active replanting/day):**
- 2 × 25 mz (Criollo) = 50 mz/day in seeds
- Harvest from existing tiles generates 80 mz/day
- Quest income: ~100 mz/day
- Net: 80 + 100 - 50 = **+130 mz/day** before other sinks

This is the realistic operating mode. The full-field replanting scenario above is a useful upper bound that shows the seed sink can absorb everything if a player over-plants.

### 3.2 Tile upgrades (capital sink)

From GDD §6. One-time per tile, permanent benefit:

| Upgrade | Cost (mz) | Tiles available | Max total cost |
|---------|-----------|----------------|---------------|
| Mulch ring | 50 | 25 | 1,250 mz |
| Drip irrigation | 200 | 25 | 5,000 mz |
| (v1.1+) Premium soil amendment | [TBD] | 25 | [TBD] |

A player upgrading all 25 tiles to full drip + mulch spends **6,250 mz** in one-time capital. At 130 mz/day net accumulation, this is a 48-day investment. This is appropriate: upgrades represent meaningful progression milestones without being paywall-gated.

### 3.3 Plot expansion (capital sink, recurring)

Outer ring tiles cost mazorcas to unlock (XP gates their availability; mazorcas pay for the unlock):

| Tile unlock tier | Tiles unlocked | Cost per tile (mz) | Total tier cost | XP requirement |
|-----------------|---------------|-------------------|-----------------|---------------|
| Ring tier 1 (4 corner tiles) | 4 | 50 | 200 mz | Level 5 |
| Ring tier 2 (4 edge tiles) | 4 | 75 | 300 mz | Level 10 |
| Ring tier 3 (4 more tiles) | 4 | 100 | 400 mz | Level 15 |
| Ring tier 4 (4 final tiles) | 4 | 125 | 500 mz | Level 20 |
| Final tile | 1 | 150 | 150 mz | Level 25 |
| **Full 5×5 unlock total** | **16 tiles** | — | **1,550 mz** | — |

Total capital required to max out a single plot (tiles + upgrades): 1,550 + 6,250 = **7,800 mz** over ~2–3 months of engaged play. This is a healthy long-term sink.

### 3.4 Second plot mint (capital sink)

From GDD §13: subsequent plots cost 500 mz + gasless relay fee (~$0.50 USD, absorbed by relayer per Charter §10 gasless pattern). The 500 mz cost is a meaningful sink — at 130 mz/day net accumulation, it requires ~4 days of saving.

**GDD §18 open question #2** flags plot-mint cost as 500 vs 1,000 mz. Economy analysis recommends **500 mz** at v1.0 to keep the second plot reachable within one week of engagement. The plot-expansion tile costs and upgrade sinks provide the long-term depth. Flag for `/balance-check`.

### 3.5 Regen companion seeds — premium tier (consumable sink)

Criollo Élite seeds, when they do appear in-game via crafting or rare purchase (not drops), should cost premium mazorcas:

| Item | Cost | Availability | Notes |
|------|------|-------------|-------|
| Criollo Élite seed (crafted) | [TBD] | Level 15+, 1×/week per player | [TBD] by balance-check |
| Saravena 12 seed (Marta's finca) | [TBD] | Drop only in v1.0 | May add purchase in v1.1 |

Mark these as [TBD] pending the rare-economy balance pass.

### 3.6 Soil restoration burn — $CACAO sink (hard sink)

From GDD §9: plot hits soil = 0 → infertile. Player can burn **5 $CACAO** to instantly restore to 60. This is a hard double-sink: first the player spent 5,000 mazorcas to get 5 $CACAO (at 1,000:1), then they burn the $CACAO to skip a 60-day cooldown. This is a meaningful economic penalty for neglect, and a $CACAO sink that directly reduces circulating supply.

Expected frequency: rare for engaged players (who keep soil healthy), occasional for casual players who go dormant. Should not be a primary sink but a safety valve.

### 3.7 $CACAO redemption burn (irreversible hard sink)

The primary deflationary mechanism. From `MAZORCA_TO_CACAO_RATE = 1000`:

**1,000 mazorcas → 1 $CACAO (ERC-20, Base, 21M cap)**

This is a hard irreversible sink. Once 1,000 mazorcas are burned via `MazorcaRedemption.sol`, they are permanently destroyed and 1 $CACAO is minted. This is the primary long-term drain on the mazorca supply.

At an engaged player rate of ~130 mz/day net (after seeds), reaching 1,000 mz for a first redemption takes ~8 days — consistent with the 10-day target in §1. Casual players (~40 mz/day net) reach it in ~25 days — consistent with the §1 target.

### 3.8 Sink absorption summary

| Sink | Type | Est. daily absorption (engaged) |
|------|------|--------------------------------|
| Seed costs (selective replanting) | Recurring | 50–100 mz/day |
| Tile upgrades | Capital (one-time) | ~20 mz/day amortized |
| Plot expansion | Capital (one-time) | ~10 mz/day amortized |
| Plot mint (2nd+) | Capital (one-time) | ~5 mz/day amortized |
| Soil restoration ($CACAO burn) | Emergency | ~2 mz/day avg |
| $CACAO redemption | Hard/irreversible | ~13 mz/day (130/10 days) |
| **Total sink** | — | **~100–150 mz/day** |

Net daily accumulation (engaged): 130 mz in − 100–150 mz out = **-20 to +30 mz/day** at steady state. This is the correct "slightly positive" balance: players feel they're accumulating, but not stockpiling infinitely. The $CACAO burn pathway then periodically drains the stockpile.

---

## 4. Regen vs. Traditional Yield Curves

This section provides the concrete math that makes the educational thesis mechanically true. GDD §7 defines the rules; this section models the 12-cycle outcome.

### 4.1 Definitions

- **Cycle**: one complete plant→grow→harvest sequence for a given tile
- **Regen mode**: +30% yield, soil +2/harvest, 1-day fallow, companion bonuses active (GDD §7)
- **Traditional mode**: base yield, soil −3/harvest, no fallow (GDD §7)
- **Crop used for comparison**: Cacao Criollo (8h cycle, base 12 mz) — most common L1 crop
- **Starting soil**: 75 (GDD §9 initialization)
- **No companion bonuses** applied (isolates regen vs trad variable cleanly)
- **Soil yield multiplier** per GDD §9:
  - 0–10 → 0.30×
  - 11–30 → 0.60×
  - 31–60 → 1.00×
  - 61–85 → 1.20×
  - 86–100 → 1.40×

### 4.2 Soil trajectory

**Regen plot (starting soil: 75):**

| Cycle | Start soil | Harvest delta | Fallow delta | End soil |
|-------|-----------|--------------|-------------|---------|
| 1 | 75 | +2 | +1 | 78 |
| 2 | 78 | +2 | +1 | 81 |
| 3 | 81 | +2 | +1 | 84 |
| 4 | 84 | +2 | +1 | 87 |
| 5 | 87 | +2 | +1 | 90 |
| 6 | 90 | +2 | +1 | 93 |
| 7 | 93 | +2 | +1 | 96 |
| 8 | 96 | +2 | +1 | 99 |
| 9 | 99 | +2 | +1 | 100 (capped) |
| 10–12 | 100 | +2 | +1 | 100 (capped) |

Regen soil crosses into the 86–100 premium tier at cycle 4 (soil = 87). Once there, it stays there permanently (hits cap at cycle 9).

**Traditional plot (starting soil: 75):**

| Cycle | Start soil | Harvest delta | End soil |
|-------|-----------|--------------|---------|
| 1 | 75 | −3 | 72 |
| 2 | 72 | −3 | 69 |
| 3 | 69 | −3 | 66 |
| 4 | 66 | −3 | 63 |
| 5 | 63 | −3 | 60 |
| 6 | 60 | −3 | 57 |
| 7 | 57 | −3 | 54 |
| 8 | 54 | −3 | 51 |
| 9 | 51 | −3 | 48 |
| 10 | 48 | −3 | 45 |
| 11 | 45 | −3 | 42 |
| 12 | 42 | −3 | 39 |

Traditional soil crosses into the 31–60 degraded zone at cycle 5 (soil = 60) and continues falling. At cycle 12, soil is 39 — still in baseline zone but approaching degraded. If unchecked, infertility is reached at cycle ~25 (soil hits 0).

### 4.3 Yield per cycle

Formula: `yield = 12 (base) × regen_mult × soil_mult`

**Regen yield per cycle:**

| Cycle | Soil | Soil mult | Regen mult | Yield (mz) | Cumulative |
|-------|------|-----------|------------|-----------|------------|
| 1 | 75 | 1.20 | 1.30 | 18.7 | 18.7 |
| 2 | 78 | 1.20 | 1.30 | 18.7 | 37.4 |
| 3 | 81 | 1.20 | 1.30 | 18.7 | 56.2 |
| 4 | 87 | 1.40 | 1.30 | **21.8** | 78.0 |
| 5 | 90 | 1.40 | 1.30 | 21.8 | 99.9 |
| 6 | 93 | 1.40 | 1.30 | 21.8 | 121.7 |
| 7 | 96 | 1.40 | 1.30 | 21.8 | 143.5 |
| 8 | 99 | 1.40 | 1.30 | 21.8 | 165.4 |
| 9 | 100 | 1.40 | 1.30 | 21.8 | 187.2 |
| 10 | 100 | 1.40 | 1.30 | 21.8 | 209.0 |
| 11 | 100 | 1.40 | 1.30 | 21.8 | 230.9 |
| 12 | 100 | 1.40 | 1.30 | 21.8 | 252.7 |

**Traditional yield per cycle:**

| Cycle | Soil | Soil mult | Regen mult | Yield (mz) | Cumulative |
|-------|------|-----------|------------|-----------|------------|
| 1 | 75 | 1.20 | 1.00 | 14.4 | 14.4 |
| 2 | 72 | 1.20 | 1.00 | 14.4 | 28.8 |
| 3 | 69 | 1.20 | 1.00 | 14.4 | 43.2 |
| 4 | 66 | 1.20 | 1.00 | 14.4 | 57.6 |
| 5 | 60 | 1.00 | 1.00 | **12.0** | 69.6 |
| 6 | 57 | 1.00 | 1.00 | 12.0 | 81.6 |
| 7 | 54 | 1.00 | 1.00 | 12.0 | 93.6 |
| 8 | 51 | 1.00 | 1.00 | 12.0 | 105.6 |
| 9 | 48 | 1.00 | 1.00 | 12.0 | 117.6 |
| 10 | 45 | 1.00 | 1.00 | 12.0 | 129.6 |
| 11 | 42 | 1.00 | 1.00 | 12.0 | 141.6 |
| 12 | 39 | 1.00 | 1.00 | 12.0 | 153.6 |

### 4.4 Crossover analysis

| Cycle | Regen yield | Trad yield | Regen advantage | Regen ahead? |
|-------|------------|-----------|----------------|-------------|
| 1 | 18.7 | 14.4 | +4.3 mz (30%) | Yes |
| 2 | 18.7 | 14.4 | +4.3 mz (30%) | Yes |
| 3 | 18.7 | 14.4 | +4.3 mz (30%) | Yes |
| 4 | 21.8 | 14.4 | **+7.4 mz (51%)** | Yes |
| 5 | 21.8 | 12.0 | **+9.8 mz (82%)** | Yes |
| 6 | 21.8 | 12.0 | +9.8 mz | Yes |
| 8 | 21.8 | 12.0 | +9.8 mz | Yes |
| 12 | 21.8 | 12.0 | +9.8 mz | Yes |
| Cumulative @ 12 | **252.7** | **153.6** | **+99.1 mz (65%)** | Yes |

**Finding:** Regen is ahead from cycle 1 due to the base +30% bonus. The decisive break happens at cycle 4–5 when regen enters the premium soil tier (+40% multiplier) while traditional drops from healthy to baseline (−20% drop). By cycle 12, regen has earned 65% more mazorcas from the same tile.

**Note for game-designer:** Regen wins from cycle 1, not cycle 6–8 as GDD §7 states. GDD §7 says "regen wins after ~5 harvest cycles" implying trad wins early. Under current math, trad never wins — regen's base +30% multiplier already exceeds trad even at cycle 1. Two options to fix this:

**Option A (recommended):** Reduce regen base multiplier to 1.10 at low soil levels, scaling up to 1.30 only at soil ≥ 80. This makes trad faster in early cycles (when soil is still 75 and regen's lower base multiplier + fallow overhead makes trad look attractive), while regen dominates from cycle 5+ when soil compounds.

**Option B:** Keep current math but reframe GDD §7 copy: "regen is always ahead, but becomes decisively dominant at cycle 5+" — a weaker teaching moment since there's no genuine tension.

**[TBD — balance question]:** Confirm regen multiplier curve with `/balance-check`. Current economy.md uses flat 1.30 per GDD §7. Recommendation: adopt Option A before MVP. Added to §9.

### 4.5 Fallow cost analysis

Regen mode requires a 1-day fallow. With 8-hour Criollo cycles: regen does 3 harvests/day + 1 fallow/day = effectively **3 harvests per 32 hours** (8h × 3 + 8h fallow), vs traditional's **3 harvests per 24 hours**. Over a 12-cycle comparison period:

- Regen: 12 cycles × 32h = 16 days elapsed
- Traditional: 12 cycles × 8h = 4 days elapsed

Traditional completes 12 cycles in 4 days; regen takes 16 days. Over those 16 days, traditional completes **48 cycles** (at 12.0 mz each after soil drop = varies). This is the genuine early-game tension: **traditional produces more total mz in the first 2 weeks** because it cycles faster. Regen per-cycle yield superiority only outweighs the fallow overhead once the soil premium kicks in AND the player is playing long enough to see it.

**This restores the GDD §7 teaching moment.** The fallow overhead is the hook: traditional looks better short-term, but the soil graph tells the truth over a 30-day view. Flag for game-designer to confirm fallow is correctly surfaced in the compare UI.

---

## 5. Plot Economy

### 5.1 PlotNFT mint cost flow

From GDD §13:
- **First plot**: Free. KYC tier ≥ 1 + linked wallet + OFAC clear required for on-chain version.
- **Subsequent plots**: 500 mz mazorca burn + gasless relay (relayer absorbs gas per Charter §10).

The 500 mz cost is deducted from the player's off-chain ledger via Edge Function `mint-cauabonga-plot` before the on-chain ERC-721 is minted. The relayer (`RELAYER_PRIVATE_KEY`) signs the gasless transaction. Rate limit: 1 plot mint per player per 24 hours (mirrors `mint-tree-nft` pattern per Charter §10).

**v1.0 cap**: 1 plot per finca per player = 5 plots max. Total maximum plot-mint sink for a single player: 4 × 500 = **2,000 mz** (first plot free).

### 5.2 Plot tiers (soilTier NFT attribute)

The PlotNFT has a `soilTier: 1–5` attribute (GDD §13) that sets starting `soil_health`:

| soilTier | Starting soil | Rarity | Notes |
|----------|-------------|--------|-------|
| 1 | 60 | Common | Default first plot |
| 2 | 68 | Common | Earned via Level 5 achievement |
| 3 | 75 | Rare | Default mint (post-L8) |
| 4 | 83 | Rare | Top-10 leaderboard reward (v1.1) |
| 5 | 90 | Epic | Legendary achievement / guardian gift |

soilTier is immutable on-chain. It gives players a meaningful reason to earn higher-tier plots without making lower-tier plots obsolete (soil can always be brought to 100 via regen play).

### 5.3 Per-tile soil decay rates (summary from GDD §9)

| Event | Soil delta | Per-tile or per-plot |
|-------|-----------|---------------------|
| Regen harvest + companion | +2 | Per-tile |
| Regen harvest solo | +1 | Per-tile |
| Traditional harvest | −3 | Per-tile |
| Traditional monocultivo (3+ same in 3-tile radius) | −5 | Per-tile |
| Fallow day (regen) | +1 | Per-tile |
| Pest event | −8 | Per-tile |
| Idle > 30 days, no fallow | −1/day | Per-tile |

**Idle decay** is the key anti-abandonment mechanic. A plot with 75 soil left untouched for 30 days loses 30 soil (to 45) — still playable but visibly degraded. After 75 more idle days it hits 0. This gives returning players time to recover without immediate infertility.

### 5.4 Tile upgrade ROI

A mulch ring (50 mz) adds +2 soil per harvest. For a Criollo tile doing 3 harvests/day, that's +6 soil/day compounding. The yield improvement from reaching the 86–100 soil tier faster pays back the 50 mz cost in approximately:

- Without mulch: crosses into premium soil tier at cycle 4 (from soil 75)
- With mulch (applies +5 one-time): starts at soil 80, crosses premium tier at cycle 3
- Yield gained by advancing 1 cycle earlier: 21.8 vs 18.7 = +3.1 mz × 3 harvests/day = +9.3 mz/day
- ROI breakeven: 50 mz ÷ 9.3 mz/day = **5.4 days** — fast payback, clear upgrade incentive

Drip irrigation (200 mz) eliminates one required water care action. Value is in session-time savings (removes the "must water twice daily" friction) rather than yield improvement directly. ROI is qualitative (retention value) + small yield stabilization. This is intentional: some upgrades are quality-of-life, not pure yield math.

---

## 6. Daily and Weekly Emission Caps

### 6.1 Per-user daily mazorca cap: 200 mz

Enforced server-side by `claim-cauabonga-harvest` and `award-tokens` Edge Functions. The cap covers **all CauaBonga sources combined** (harvest + quests + streaks + milestones). It does NOT cover the existing non-CauaBonga award-tokens events (`ritual_draw`, `blog_read`, etc.) — those continue on their existing rates.

### 6.2 Cap breakdown by player tier

| Player type | Harvest ceiling | Quest ceiling | Other | Total ceiling |
|-------------|----------------|--------------|-------|--------------|
| Casual (1–2 sessions/day) | 40 mz | 80 mz | 5 mz | ~125 mz |
| Engaged (2–3 sessions/day) | 100 mz | 100 mz | 20 mz | ~200 mz (cap hit) |
| Endgame (5 plots, optimized) | 120 mz (sub-cap) | 120 mz (sub-cap) | 30 mz | 200 mz (cap hit) |

The 200 mz/day hard cap prevents a 5-plot endgame player from earning 5× a casual player's mazorcas. The diminishing returns are implicit: each additional plot adds marginal yield but the same cap applies.

**Sub-caps (soft, per source):**
- Harvest source: 120 mz/day
- Quest source: 120 mz/day
- Streak + milestone: 30 mz/day combined
- Leaderboard: counted weekly, not daily

### 6.3 Weekly emission budget

| Metric | Value |
|--------|-------|
| Weekly cap per user | 1,400 mz (7 × 200) |
| Expected engaged weekly emission | ~840–980 mz |
| Expected casual weekly emission | ~210–385 mz |
| Weekly $CACAO redemption threshold | 1,000 mz (drains ~1+ weeks of engaged play) |
| Target net accumulation (engaged, weekly) | ≤ 150 mz after sinks |

---

## 7. Hourly Progression Curve

### 7.1 Session structure

From GDD §3: morning session ~10 min, evening session ~5–8 min. Total ~15–20 min/day.

### 7.2 Mazorcas per minute, by tier

| Player tier | mz/session | Session length | mz/minute | Daily sessions | Daily total |
|-------------|-----------|----------------|-----------|---------------|-------------|
| Newbie (Day 1–7) | 20–35 mz | 10 min | 2–3.5 | 1 | 20–35 mz |
| Casual (Week 2–4) | 30–50 mz | 10 min | 3–5 | 2 | 60–100 mz |
| Engaged (Month 2+) | 50–80 mz | 15 min | 3.3–5.3 | 2 | 100–160 mz (cap 200) |
| Endgame (Month 4+) | 60–100 mz | 15 min | 4–6.7 | 2 | 120–200 mz (cap hit) |

### 7.3 Anti-grind: diminishing returns on actions

After a player exceeds N harvest-claim actions within a 24h window, per-action yield is reduced:

| Claims in 24h | Yield modifier |
|--------------|---------------|
| 1–15 | 1.00× (full yield) |
| 16–25 | 0.75× |
| 26–35 | 0.50× |
| 36+ | 0.25× (anti-bot floor) |

This targets the scenario where a player (or bot) claims harvests on a 15-minute micro-cycle by planting only fast-cycling crops. A player with 25 tiles of Plátano Hartón (3h cycle) could theoretically claim 200 times per day — diminishing returns reduce this to ~equivalent of 40 full-value claims.

The diminishing return kicks in above 15 claims, which is **the natural ceiling for a 25-tile 3-hour-cycle plot** doing 2 harvests/day (25 tiles × 2 = 50 claims, but only 15 at full value). Casual players with 9 tiles doing 2 harvest cycles/day: 18 claims/day — marginally hitting the 0.75× zone, which is acceptable.

**[TBD]:** Exact claim count thresholds need playtest data. Added to §9.

---

## 8. Sanity / Outliers — Degenerate Strategies

### 8.1 Alt accounts (Sybil farming)

**Strategy:** Create N accounts, get N free first plots, farm from N plots to multiply mazorcas.

**Blocks:**
1. **KYC gate**: on-chain PlotNFT mint requires KYC tier ≥ 1 + linked wallet. One wallet per KYC identity.
2. **Soulbound v1.0**: PlotNFT is non-transferable, so alt-account plots can't be consolidated.
3. **Per-wallet daily cap**: 200 mz/day applies per authenticated user, so N accounts = N separate caps with N separate KYC identities. Not economically viable unless attacker can fake N real identities.
4. **Guest mode**: Guests can play but cannot earn mazorcas (no `token_events` write without KYC). Guest demo is purely off-chain, no ledger impact.

**Residual risk:** Shared-device family accounts (legitimate). Mitigation: shared wallet address = shared KYC, different user_id but same wallet can't both mint PlotNFTs (wallet uniqueness constraint in `wallet_link_nonces` table).

### 8.2 Click farms / bot harvesting

**Strategy:** Automate harvest claims at maximum frequency to hit daily cap every day with zero engagement cost.

**Blocks:**
1. **Server-authoritative timers**: harvest is rejected if `grow_timer_expires_at > now()`. Client cannot accelerate grow time.
2. **Diminishing returns on claims** (§7.3): harvest value collapses above 15 claims/24h.
3. **Captcha** on guest/anonymous flows for any economic action.
4. **Rate limit on claim Edge Function**: 1 claim per tile per grow cycle (server checks `last_harvest_at` per tile_id).
5. **OFAC + KYC gate** on all mazorca-emitting actions — requires a real identity per account.

### 8.3 Plot flipping (post-v1.2 transferable NFTs)

**Strategy:** Upgrade a plot to max soil tier + all tile upgrades, then sell it for a premium on OpenSea, capturing the capital investment as price arbitrage.

**Blocks (v1.2):**
1. **soilTier is immutable** (set at mint) — upgrades to tile-level soil are off-chain state. A buyer gets the on-chain attributes, not the current soil_health value.
2. **Soil_health resets to soilTier baseline** on PlotNFT transfer (to be implemented in `CauaBongaPlot.sol` via a `_beforeTokenTransfer` hook). This kills upgrade-and-flip: the soil improvements don't transfer.
3. **Plot economy is additive** (tiles earn relative to their soil), so a premium soilTier 5 plot is legitimately more valuable — this is acceptable market behavior, not degenerate.

**[TBD]:** Confirm soil_health reset on transfer with `web3` tentacle before v1.2 contract design. Added to §9.

### 8.4 No-care planting spam

**Strategy:** Plant cheap Forastero seeds on every tile, never perform care actions, harvest minimum yield, repeat. Low attention cost, constant emission.

**Analysis:** This is intentionally allowed at low yield. A 9-tile Forastero no-care farm:
- Soil starts at 75, no care actions → no pest protection
- Pest event hits unprotected plot: −8 soil per event
- 5h cycle × 9 tiles = ~36 harvests/day potential
- But diminishing returns (§7.3) cap value above 15 claims
- Forastero base 10 mz × 1.20 soil mult × 1.00 (no regen) = 12 mz per harvest
- 15 full-value claims = 180 mz — hits close to the cap

**Block refinement needed:** No-care Forastero spam is actually a near-optimal lazy strategy if soil doesn't degrade quickly enough. **Recommend**: add a care-action deficit mechanic — if a tile goes 2+ grow cycles without any care action, apply a −10% yield debuff per missed cycle (stacking up to −40% max). This doesn't punish absence harshly but makes pure no-care farming visibly suboptimal vs. a cared plot. **[TBD]** — Added to §9.

### 8.5 Regen abandonment (traditional monoculture optimization)

**Strategy:** Stay in traditional mode permanently, cycle fast, accept soil degradation, abandon/reset plots by letting them hit 0 soil and waiting out the 60-day cooldown rather than paying 5 $CACAO to restore. Net: free plot reset every ~25 cycles.

**Analysis:** 25 traditional cycles on a single tile:
- Total yield: varies (14.4 → 12.0 → eventually 7.2 at degraded tier)
- Time elapsed: 25 × 8h = ~8.3 days
- Then 60-day cooldown = dead tile for 60 days
- Total mazorcas from 25 cycles: ~14.4×4 + 12.0×8 + 7.2×13 = 57.6 + 96 + 93.6 = **247 mz**
- Regen 25 cycles on same tile: ~18.7×3 + 21.8×22 = 56.1 + 479.6 = **536 mz** (over ~30 days including fallows)
- But regen takes 30 days vs trad 8.3 days. In 30 days, traditional completes: 30d/8.3d × 247 = **892 mz** across 3 reset cycles

Wait — the traditional player doesn't need to wait the 60-day cooldown; they can just plant a different tile while one is cooling. With 9 tiles, they rotate: 3 tiles always active, 3 in degradation, 3 in cooldown (at steady state after initial degradation). Roughly 3/9 tiles productive at any time = 1/3 yield efficiency vs a healthy regen farm.

A 9-tile regen farm at steady state (all 9 tiles in premium soil, ~21.8 mz/harvest):
- 3 harvests/day × 9 tiles = 27 harvests (but fallow means effective 3 harvests/tile/day isn't quite right with fallow)
- Correct: 8h cycle + 24h fallow = 1 harvest per 32h per tile = 9 tiles ÷ 32h × 24h = **6.75 harvests/day** at 21.8 mz = **147 mz/day** (before cap)

A 9-tile traditional rotation (3 tiles active/3 degrading/3 cooling):
- 3 active tiles, 5h Forastero cycle × 3 = 14.4 mz × 3 tiles × 4.8 harvests/day = **207 mz/day** (before degradation and cap)

**Finding:** Traditional rotation IS competitive with regen on raw mz/day in the short window before soil degradation. The 60-day cooldown is the real punishment — the player sacrifices 60 days of use per tile. Over a 6-month horizon, regen plots maintain 100% tile uptime vs. traditional plots' ~12% uptime (8.3 days productive / (8.3 + 60) cooldown). Regen wins decisively over any period > 4 weeks. The educational message holds.

**Mitigation for "rotation abandonment":** Cooldown period is the primary block. Secondary: add a **plot abandonment stigma** — a plot that has ever hit soil = 0 receives a permanent −5% yield penalty on that soilTier tier. Cosmetically, the tile shows a "scarred" texture. Recoverable via 1 $CACAO burn. Signals to the player that neglect has lasting consequences. **[TBD]** — Added to §9.

### 8.6 Quest farming (quest-only strategy, no planting)

**Strategy:** Complete daily quests without ever seriously farming, harvesting free tutorial seeds each day for minimal cost.

**Analysis:** Quest cap is 120 mz/day. If a player does quests only: 120 mz/day × 7 days = 840 mz/week. After 12 days: 1,440 mz — enough for a $CACAO redemption. This is actually an intended legitimate play style (quest-focused casual). Not degenerate; aligns with Charter earn-only.

**The only concern** is quests that require planting/harvesting (which they all do at some level) — so a pure quest farmer must actually engage with the planting loop to complete the quests. Self-policing by design.

---

## 9. Open Balance Questions

These items require `/balance-check` review before MVP implementation. All are marked `[TBD]` in the document above.

| # | Question | Impact | Recommendation |
|---|---------|--------|---------------|
| 1 | **Regen multiplier curve**: flat 1.30× vs. soil-dependent scaling (Option A/B from §4.4) | Affects whether trad ever looks genuinely attractive early | Adopt Option A: 1.10× at soil 31–60, 1.25× at 61–85, 1.40× at 86–100 for regen. Restores genuine early-game tension. |
| 2 | **Plot-mint cost**: 500 mz vs 1,000 mz | Sink depth vs. onboarding friction | Recommend 500 mz for v1.0; 750 mz at v1.2 when transferable plots have market value. |
| 3 | **Daily quest cap**: 120 mz vs 200 mz (original GDD §11) | Inflation risk if set too high | Recommend 120 mz cap. GDD §11 needs update. |
| 4 | **Claim diminishing return thresholds**: 15/25/35 claim breakpoints | Bot defense vs. legitimate multi-tile play | Playtest with real 25-tile players before locking. |
| 5 | **Care-action deficit debuff**: −10%/missed cycle | Blocks no-care Forastero spam | Needs playtester feedback; risk of feeling punishing for casual. Consider only −5%/missed cycle. |
| 6 | **soilTier reset on NFT transfer** (v1.2) | Blocks plot flip strategy | Confirm with web3 tentacle: implement as `_beforeTokenTransfer` soil reset in `CauaBongaPlot.sol`. |
| 7 | **Plot abandonment scar** (−5% permanent penalty after soil = 0) | Educational consequence mechanic | Low priority for MVP; add at v1.1. |
| 8 | **Criollo Élite crafted seed cost** (§3.5) | Premium sink depth | Set after rare-economy balance pass in v1.1. |
| 9 | **soilTier 4/5 leaderboard allocation** | How many per season? | Needs leaderboard size data; estimate 3–5 soilTier 4 plots per finca per season. |
| 10 | **Regen streak: exactly what counts as "regen mode active" for weekly leaderboard** | Anti-gaming for leaderboard reward | Define as: ≥ 1 regen harvest in the 7-day window AND no traditional harvest on the same plot in that window. |

---

## 10. Cross-Tentacle Handoff — Token Economy Requirements

CauaBonga introduces new emission events that must be registered in the `token-economy` tentacle and implemented in the `award-tokens` Edge Function (or a new sibling `claim-cauabonga-harvest` Edge Function). **No new tables are required yet** — all emissions use the existing `token_events` schema.

### 10.1 New event_type values required

The following `event_type` strings must be added to the `TOKEN_RATES` map in both `src/utils/constants.ts` and `supabase/functions/award-tokens/index.ts`:

| event_type | mazorcas | beans | Description |
|-----------|----------|-------|-------------|
| `cauabonga_harvest` | variable | 0 | Per-harvest yield; amount passed as `amount` param (not a fixed rate) |
| `cauabonga_quest_complete` | variable | 0 | Quest reward; amount passed as `amount` param |
| `cauabonga_streak_3` | 5 | 1.5 | 3-day care streak milestone |
| `cauabonga_streak_7` | 15 | 3.5 | 7-day streak (replaces existing `streak_7` for CauaBonga context) |
| `cauabonga_streak_30` | 50 | 15 | 30-day streak |
| `cauabonga_soil_milestone` | variable | 0 | Soil achievement reward; amount varies per milestone |
| `cauabonga_leaderboard` | variable | 0 | Weekly leaderboard reward; amount per rank |
| `cauabonga_achievement` | variable | 0 | One-time achievement reward; amount per achievement |
| `cauabonga_compare_view` | 5 | 0 | Regen vs. trad compare overlay engagement |

### 10.2 Variable-amount event handling

`cauabonga_harvest`, `cauabonga_quest_complete`, `cauabonga_soil_milestone`, `cauabonga_leaderboard`, and `cauabonga_achievement` pass a variable `amount` (mazorca count). The award-tokens function must support these: if `event_type` is in a "variable" set, use `amount` directly as the mazorca credit rather than looking up a fixed rate.

Precedent: the existing `purchase` event type scales `beans × amount`. Same pattern applies here.

### 10.3 Daily cap enforcement

The `claim-cauabonga-harvest` Edge Function must query the player's `token_events` for the last 24 hours (filtering on `event_type LIKE 'cauabonga_%'`) and reject emission above 200 mz/day. This is a **new server-side responsibility** not currently in `award-tokens`.

Recommendation: create a dedicated `claim-cauabonga-harvest` Edge Function that:
1. Verifies Supabase JWT (via `supabase.auth.getUser`)
2. Validates grow timer server-side
3. Calculates yield with full formula
4. Checks 24h emission window against cap
5. Inserts `token_events` row
6. Updates `user_profiles.mazorcas_balance`
7. Returns yield amount + new balance

This keeps CauaBonga economics isolated from the general `award-tokens` path and allows independent rate-limiting and auditability.

### 10.4 New token_events ledger reasons (ref_id usage)

`ref_id` (currently free-form string in `token_events`) should carry structured context for CauaBonga events:

| event_type | ref_id format | Example |
|-----------|-------------|---------|
| `cauabonga_harvest` | `plot:{plot_id}:tile:{tile_id}:cycle:{n}` | `plot:42:tile:7:cycle:3` |
| `cauabonga_quest_complete` | `quest:{quest_template_id}:day:{date}` | `quest:q_015:day:2026-05-01` |
| `cauabonga_leaderboard` | `finca:{guardian_id}:week:{iso_week}:rank:{n}` | `finca:0:week:2026-18:rank:1` |
| `cauabonga_achievement` | `achievement:{slug}` | `achievement:guardian_de_la_sombra` |

No new tables required at MVP. The `cauabonga_harvests` audit table mentioned in GDD §10 (for per-harvest server-side audit log) can be added as a separate migration at v1.0 launch alongside `cauabonga_plots`, `cauabonga_plantings`, and `cauabonga_soil_history` (referenced in GDD Appendix A, migration 033).

### 10.5 No new fungible token

Confirming Charter §10 compliance: CauaBonga introduces **zero new fungible tokens**. All economic value flows through:
- Mazorcas (existing off-chain ledger)
- $CACAO (existing ERC-20, 21M cap, `MazorcaRedemption.sol`)

The PlotNFT is an ERC-721 (non-fungible), not a currency. It does not introduce new token supply.

---

## Appendix A — Economy parameter quick reference

| Parameter | Value | Source |
|-----------|-------|--------|
| Mazorca → $CACAO rate | 1,000 : 1 | `MAZORCA_TO_CACAO_RATE` in `constants.ts` |
| $CACAO total supply cap | 21,000,000 | `CACAO_TOTAL_SUPPLY_CAP` in `constants.ts` |
| Daily emission hard cap | 200 mz/user | §6, enforced server-side |
| Harvest sub-cap | 120 mz/day | §6 |
| Quest sub-cap | 120 mz/day | §6 (revised from GDD §11's 200 mz) |
| First plot cost | 0 mz (free) | GDD §13 |
| Second plot cost | 500 mz | GDD §13, §3.4 |
| Mulch ring upgrade | 50 mz/tile | GDD §6 |
| Drip irrigation upgrade | 200 mz/tile | GDD §6 |
| Full 5×5 tile unlock cost | 1,550 mz | §3.3 |
| Full upgrade (all tiles, drip+mulch) | 6,250 mz | §3.2 |
| Total max capital sink (1 plot) | ~7,800 mz | §3.2 + §3.3 |
| Soil restoration burn | 5 $CACAO | GDD §9 |
| Starting soil_health | 75 | GDD §9 |
| Regen soil crossover to premium (86+) | Cycle 4 | §4.2 |
| Days to first $CACAO (casual) | ~25 days | §1.5 |
| Days to first $CACAO (engaged) | ~10 days | §1.5 |

---

> **Next step:** Submit §9 items to `/balance-check`. Priority order: #1 (regen multiplier curve) → #3 (quest cap) → #4 (claim thresholds) → #2 (plot cost). Items #5–10 are v1.1 concerns.
