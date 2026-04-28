# CauaBonga — Systems Map

> v0.1 · 2026-04-28 · Authored by `systems-designer`.
> Decomposition of `GDD.md` + `economy.md` into a build-ordered implementation plan.
> Cross-links: `GDD.md` (game rules), `economy.md` (sinks/faucets), `CONTEXT.md` (domain anchors).
> All section citations refer to GDD.md unless prefixed with `economy §`.

---

## 1. Systems Index

Every distinct game system, its owning tentacle, its sub-systems, and its priority tier (P0 = MVP blocker, P1 = v1.0 required, P2 = v1.1+).

| # | System Name | Owning Tentacle | Sub-systems | Priority |
|---|-------------|-----------------|-------------|----------|
| S01 | **Plot State Machine** | cauabonga | Tile state enum (empty/seeded/growing/ready/fallow/infertile); tile unlock gating; per-tile field storage | P0 |
| S02 | **Planting Engine** | cauabonga | Seed catalog; mode selection (regen/traditional); seed cost deduction; grow timer start; companion adjacency resolver | P0 |
| S03 | **Growth Ticker** | cauabonga | Server-authoritative grow timer; care-action deficit accumulator; tile state transitions; push notification trigger | P0 |
| S04 | **Care Actions** | cauabonga | 5 verbs (water/sun/nutrients/pruning/molasses); per-action cooldown enforcement; plot-wide application; moisture/health delta; nutrient inventory | P0 |
| S05 | **Soil-Health Ledger** | cauabonga | Per-tile soil_health int 0–100; delta rules (regen/trad/pest/idle); yield multiplier curve lookup; infertile threshold; legacy bonus flag | P0 |
| S06 | **Harvest + Yield Calculator** | cauabonga | yield formula (base × regen × soil × companion × regional × streak); server-side timer verification; token_events insert; cauabonga_harvests audit row; fallow trigger | P0 |
| S07 | **Daily Emission Cap Enforcer** | cauabonga + token-economy | 24h rolling window query; per-source sub-caps (harvest 120, quest 120); 200 mz hard ceiling; claim rejection | P0 |
| S08 | **Mazorca Ledger Integration** | token-economy | New `cauabonga_*` event_type values; variable-amount event handling in award-tokens; `claim-cauabonga-harvest` Edge Function; ref_id structured format | P0 |
| S09 | **Guardian Hub Router** | cauabonga | Colombia map → finca selection; per-guardian regional modifier constants; biome metadata; GDD §5 modifier application at harvest | P0 (Lucho only at MVP) |
| S10 | **Onboarding Flow** | cauabonga | 60-second hero → wallet/guest split; guided first 10 minutes; tutorial accelerated grow; push notification permission; GDD §14 sequence | P0 |
| S11 | **Daily Quest Engine** | cauabonga | 3-quest daily draw from 30-template pool; quest progress tracker; reward dispatch; midnight COL reset cron; quest cap enforcement | P0 (1 template type at MVP) |
| S12 | **XP + Level Progression** | cauabonga | XP source accumulation; level thresholds; tile unlock gating at level milestones; crop unlock gating; GDD §12 table | P1 |
| S13 | **Regen vs. Traditional Comparator** | cauabonga | Compare-view overlay; real-time yield projection for current tile; historical cycle chart; engagement faucet (5 mz/48h) | P1 |
| S14 | **Leaderboard** | cauabonga | Per-finca regen yield ranking; Sunday reset cron; top-10 reward dispatch; participation reward; GDD §4 weekly cadence | P1 |
| S15 | **Regen Streak Tracker** | cauabonga | Per-plot streak counter; daily increment/reset logic; streak bonus multiplier (+0.5% per day); Saturday rare-drop gate; GDD §4 | P1 |
| S16 | **PlotNFT Contract** | web3 | `CauaBongaPlot.sol` ERC-721 soulbound; on-chain attributes (soilTier, regenStreakDays, tileCount); `mint-cauabonga-plot` Edge Function; gasless relayer; KYC/OFAC gate; GDD §13 | P1 |
| S17 | **Off-chain Plot Anchor (pre-NFT)** | supabase-backend | `cauabonga_plots` Postgres row tied to user_id; soilTier as int column; no wallet requirement at MVP | P0 |
| S18 | **Weekly Oracle / State Hash** | web3 | Weekly regen streak + harvest count hash written to `IoTAttestation`-style on-chain anchor; off-chain → on-chain sync pattern | P2 |
| S19 | **Tile Upgrade System** | cauabonga | Mulch ring (50 mz, +10% yield, +2 soil/harvest); drip irrigation (200 mz, auto-water); mazorca deduction; upgrade flag per tile; GDD §6 | P1 |
| S20 | **Pest Event System** | cauabonga | Server-driven random pest seed (client-blind RNG); pest probability curve; −8 soil penalty; pruning care action as defense; GDD §16 | P1 |
| S21 | **Rare Drop System** | cauabonga | Criollo Élite 1% drop gate (Level 15+ only); Saravena 12 drop (Marta finca, regen only); server-side RNG; verifiable signature; client-blind | P1 |
| S22 | **Achievement System** | cauabonga | Achievement slug registry; one-time trigger checks; reward dispatch; cosmetic badge storage | P2 |
| S23 | **Daily Reset Cron** | supabase-backend | Midnight COL (05:00 UTC) pg_cron job: quest rotation, leaderboard snapshot, streak day tick, idle soil decay | P1 |
| S24 | **Push Notification System** | cauabonga | Web Push subscription storage; crop-ready trigger; daily quest reset reminder; streak-at-risk alert | P1 |
| S25 | **NPC Dialogue Engine** | cauabonga | Per-guardian 30+ snippets; trigger events (plot entry, harvest, milestone); dialogue slot in HUD panel | P2 |
| S26 | **Plot Grid Renderer** | design-system | SVG tile grid 5×5 (520×520px); tile state → visual mapping; isometric tilt; grow/ready/fallow animations; cacao-heart-morph on harvest | P0 |
| S27 | **Care-Action Deficit Mechanic** | cauabonga | −5% yield per missed care cycle (stacking to −40% max); resets on care action; economy §8.4 anti-spam block | P1 [TBD: economy §9 item #5] |
| S28 | **Soil Restoration Burn** | web3 + cauabonga | Player triggers 5 $CACAO burn; `sign-mazorca-burn` pattern reused; plot soil restored to 60; infertile flag cleared | P1 |

---

## 2. Dependency Graph

Reading direction: A → B means "A must exist before B can be built."

```
S17 (Off-chain Plot Anchor)
  └─→ S01 (Plot State Machine)
        ├─→ S02 (Planting Engine)
        │     ├─→ S03 (Growth Ticker)
        │     │     ├─→ S04 (Care Actions)
        │     │     │     └─→ S05 (Soil-Health Ledger)
        │     │     └─→ S05 (Soil-Health Ledger)
        │     │           └─→ S06 (Harvest + Yield Calculator)
        │     │                 ├─→ S07 (Daily Cap Enforcer)
        │     │                 │     └─→ S08 (Mazorca Ledger Integration)
        │     │                 └─→ S15 (Regen Streak Tracker)
        │     │                       └─→ S14 (Leaderboard)
        │     └─→ S12 (XP + Level Progression)
        │           └─→ S19 (Tile Upgrade System)
        └─→ S09 (Guardian Hub Router)
              └─→ S06 (Harvest + Yield Calculator) [regional modifier input]

S10 (Onboarding) → S01, S02, S03, S04, S06, S09, S11

S11 (Daily Quest Engine) → S08 (Mazorca Ledger Integration)

S26 (Plot Grid Renderer) → S01 (reads tile states)

S20 (Pest Event) → S05 (writes soil delta)
S21 (Rare Drop) → S06 (hooks post-harvest), S15 (level gate)
S13 (Comparator) → S05, S06 (reads history)
S23 (Daily Reset Cron) → S11, S14, S15, S05 (idle decay)
S24 (Push Notifications) → S03 (crop-ready event), S11 (quest reset)
S27 (Care Deficit) → S04, S06
S28 (Soil Restoration) → S05, web3 burn path

S16 (PlotNFT Contract) → S17 (replaces at v1.0), S08, web3 KYC/OFAC/relayer
S18 (Weekly Oracle) → S16, S15
S22 (Achievements) → S06, S12, S05
S25 (NPC Dialogue) → S09
```

### Critical Path (must-build-first chain)

```
S17 → S01 → S02 → S03 → S05 → S06 → S07 → S08
```

Every other system is either a consumer of this chain or an independent leaf that can be parallelized. The chain represents the minimal playable loop: a plot exists, something can be planted, it grows, soil updates, harvest fires, tokens are credited with the cap enforced.

Parallel to the critical path (can begin once S17 exists):
- S26 (Grid Renderer) — purely visual, reads S01 states
- S09 (Guardian Router) — provides modifier constants, needs to be done before S06 is finalized
- S10 (Onboarding) — orchestrates the above but does not block their build

---

## 3. Implementation Order — Four Sprints

Sprint scope assumes ~1 week each for a focused dev. MVP = Sprints 1–2.

### Sprint 1 — The Living Plot (MVP core loop)

Goal: a single player can log in as a guest or KYC'd user, enter Lucho's finca, plant a Cacao Criollo, have it grow server-authoritatively, and harvest for mazorcas.

| System | Key deliverables | Files to create/modify |
|--------|-----------------|------------------------|
| S17 — Off-chain Plot Anchor | DB migration 033 with `cauabonga_plots`, `cauabonga_tiles`, `cauabonga_plantings` tables | `supabase/migrations/033_cauabonga_plots.sql` |
| S01 — Plot State Machine | Tile state enum + server-side state transitions | `supabase/migrations/033_cauabonga_plots.sql` (tile_state enum), `src/hooks/useCauaBongaPlots.ts` (new) |
| S02 — Planting Engine (regen only, 2 crops) | plant-crop Edge Function; seed cost deduct; grow timer insert | `supabase/functions/plant-crop/index.ts` (new) |
| S03 — Growth Ticker | Server verifies timer on harvest attempt; no client clock trust | Part of `claim-cauabonga-harvest` Edge Function |
| S05 — Soil-Health Ledger (3-zone simplified) | soil_health column on `cauabonga_tiles`; delta on harvest | `supabase/migrations/033_cauabonga_plots.sql`, `claim-cauabonga-harvest` |
| S06 — Harvest + Yield Calculator | `claim-cauabonga-harvest` Edge Function with full formula (simplified: no companion, no regional) | `supabase/functions/claim-cauabonga-harvest/index.ts` (new) |
| S07 — Daily Cap Enforcer | 24h rolling window in `claim-cauabonga-harvest` | Part of `claim-cauabonga-harvest` |
| S08 — Mazorca Ledger Integration | New `cauabonga_*` event types; `claim-cauabonga-harvest` inserts to `token_events` | `supabase/functions/award-tokens/index.ts` (modify), `src/utils/constants.ts` (add event types) |
| S09 — Guardian Hub Router (Lucho only) | Guardian 0 modifier constant wired; finca selection stub for others | `src/pages/CauaBonga.tsx` (extend), `src/utils/constants.ts` |
| S26 — Plot Grid Renderer (3×3 MVP view) | SVG tile grid, 3×3 visible, tile state → visual map | `src/pages/CauaBongaGame.tsx` (new), `src/components/cauabonga/PlotGrid.tsx` (new) |
| S10 — Onboarding (linear guided flow) | Tutorial sequence component; accelerated grow; first harvest animation | `src/components/cauabonga/Onboarding.tsx` (new) |

**Sprint 1 exit criteria:** Player can plant → wait (or tutorial-accelerated) → harvest → see mazorca balance increment. Soil visible but simplified (3 zones). No NFT, no quests, no leaderboard.

---

### Sprint 2 — Quest + Soil + Traditional Mode (MVP completion)

Goal: complete the GDD §19 MVP spec — add 1 daily quest, full soil model, regen-only constraint (traditional deferred to v1.0), and guest/KYC split.

| System | Key deliverables | Files to create/modify |
|--------|-----------------|------------------------|
| S05 — Soil-Health Ledger (full 5-zone) | Full yield multiplier curve; pest delta hook; idle decay stub; legacy bonus flag | `supabase/migrations/034_soil_full_curve.sql` (or in 033), `claim-cauabonga-harvest` update |
| S04 — Care Actions | Water + Sun (free, no cooldown enforcement in MVP); nutrients stub | `supabase/functions/care-cauabonga-plot/index.ts` (new), `src/components/cauabonga/CareBar.tsx` (new) |
| S11 — Daily Quest Engine (1 type) | Quest draw (1 template: "Harvest your first mazorca"); progress tracker; reward dispatch | `supabase/migrations/034_cauabonga_quests.sql` (new), `supabase/functions/claim-cauabonga-harvest/` (quest trigger hook) |
| S15 — Regen Streak Tracker (stub) | Daily streak increment on harvest; stored on `cauabonga_plots.regen_streak_days` | Part of `claim-cauabonga-harvest` |
| S10 — Onboarding polish | Push notification permission prompt; regen mode explanation copy | `src/components/cauabonga/Onboarding.tsx` (extend) |
| HUD + Balance display | Soil bar, XP bar, mazorca balance, quest progress badge | `src/components/cauabonga/HUD.tsx` (new) |

**Sprint 2 exit criteria:** Matches GDD §19 MVP spec exactly. Lucho finca, 3×3 grid, 2 crops, regen only, off-chain plot, simplified 3-zone soil displayed but full 5-zone computed, 1 daily quest, guest + KYC both work.

---

### Sprint 3 — v1.0 Feature Set (all 5 guardianes, full crop catalog)

Goal: ship the full v1.0 experience — all guardianes, all crops, regen vs. traditional toggle, full quest engine, leaderboards, PlotNFT on Base Sepolia.

| System | Key deliverables |
|--------|-----------------|
| S02 — Planting Engine (full, regen + traditional) | Traditional mode flow; soil penalties; fallow enforcement |
| S09 — Guardian Hub Router (all 5) | All 5 guardian modifier constants active; biome visuals per finca |
| S11 — Daily Quest Engine (30 templates) | Full template pool; 3-quest daily draw; hard quest cap 120 mz |
| S12 — XP + Level Progression | XP accumulation; level-gate for crops and tile unlocks |
| S13 — Regen vs. Traditional Comparator | Compare-view overlay; 12-cycle projection chart; engagement faucet |
| S14 — Leaderboard | Per-finca ranking; Sunday reset cron; top-10 reward dispatch |
| S20 — Pest Event System | Server-side RNG pest events; pruning defense |
| S21 — Rare Drop System | Criollo Élite 1% post-harvest server RNG; Marta's Saravena 12 |
| S16 — PlotNFT Contract | `CauaBongaPlot.sol` deploy to Base Sepolia; `mint-cauabonga-plot` Edge Function; soulbound; KYC gate |
| S23 — Daily Reset Cron | pg_cron at 05:00 UTC; quest rotation + leaderboard snapshot + idle soil decay |
| S24 — Push Notifications | Web Push subscription; crop-ready trigger; quest reminder |

---

### Sprint 4 — v1.1 Depth Layer

Goal: add long-tail retention systems and tile upgrade economy.

| System | Key deliverables |
|--------|-----------------|
| S19 — Tile Upgrade System | Mulch ring + drip irrigation purchase flow; per-tile upgrade flags |
| S27 — Care-Action Deficit | −5%/missed cycle debuff; stacking cap; reset on care |
| S22 — Achievement System | Achievement registry; one-time trigger checks; cosmetic badges |
| S28 — Soil Restoration Burn | $CACAO burn path; soil reset to 60; infertile clear |
| S25 — NPC Dialogue Engine | Per-guardian snippet pool; trigger events |
| S18 — Weekly Oracle (stub) | Regen streak hash prep; IoTAttestation pattern reuse |
| Plot expansion tiles | Ring-tier unlock flow (mazorca cost + XP gate) |

---

## 4. Cross-Tentacle Handoff

For each system that touches another tentacle, the specific files to create or modify.

| System | Primary Owner | Touches | Concrete files |
|--------|--------------|---------|---------------|
| S08 — Mazorca Ledger Integration | token-economy | cauabonga, supabase-backend | `src/utils/constants.ts` (add `cauabonga_*` keys to `TOKEN_RATES`); `supabase/functions/award-tokens/index.ts` (add variable-amount handling); `supabase/functions/claim-cauabonga-harvest/index.ts` (new) |
| S16 — PlotNFT Contract | web3 | cauabonga, supabase-backend | `contracts/src/CauaBongaPlot.sol` (new); `contracts/test/CauaBongaPlotTest.t.sol` (new); `supabase/functions/mint-cauabonga-plot/index.ts` (new, mirrors `mint-tree-nft`); `supabase/migrations/035_cauabonga_nft.sql` (new: `cauabonga_plot_nfts` table) |
| S17 — Off-chain Plot Anchor | supabase-backend | cauabonga | `supabase/migrations/033_cauabonga_plots.sql` (new: `cauabonga_plots`, `cauabonga_tiles`, `cauabonga_plantings`, `cauabonga_harvests`) |
| S23 — Daily Reset Cron | supabase-backend | cauabonga | `supabase/migrations/033_cauabonga_plots.sql` (pg_cron extension + job); or standalone `034_cauabonga_cron.sql` |
| S28 — Soil Restoration Burn | web3 | cauabonga | Reuses `sign-mazorca-burn` Edge Function; new `soil_restorations` table or column in `cauabonga_plots`; `src/components/cauabonga/SoilRestoreModal.tsx` (new) |
| S18 — Weekly Oracle | web3 | cauabonga, supabase-backend | New weekly cron script (mirrors `scripts/post_weekly_root.ts`); adds `regen_streak_hash` column to `cauabonga_plot_nfts` |
| S26 — Plot Grid Renderer | design-system | cauabonga | `src/components/cauabonga/PlotGrid.tsx` (new, uses BRAND hex palette + existing SVG assets); reuses `/public/cacao-tree-illustration.svg` pod symbols; reuses `/public/cacao-heart-morph.svg` for harvest animation |
| S07 + S08 — Cap Enforcer + Ledger | token-economy | supabase-backend | `claim-cauabonga-harvest` queries `token_events` with `event_type LIKE 'cauabonga_%'` for 24h window; no new table; reads `user_profiles.mazorcas_balance` |

### Tentacle ownership summary

| Tentacle | Systems owned |
|----------|--------------|
| **cauabonga** | S01, S02, S03, S04, S05, S06, S09, S10, S11, S12, S13, S14, S15, S19, S20, S21, S22, S24, S25, S27 |
| **supabase-backend** | S17, S23 (cron), migration 033–035 |
| **token-economy** | S07, S08 (award-tokens extension) |
| **web3** | S16 (PlotNFT), S18 (oracle), S28 (burn path) |
| **design-system** | S26 (grid renderer visual language) |

---

## 5. MVP Cut

Per GDD §19: Lucho only, 3×3 grid, 2 crops (Cacao Criollo + Plátano Dominico), regen mode only, off-chain plot, manual harvest, simplified soil curve, 1 daily quest, guest + KYC.

### Systems IN MVP (Sprints 1–2)

| System | MVP scope restriction |
|--------|----------------------|
| S17 — Off-chain Plot Anchor | Full implementation; no NFT dependency |
| S01 — Plot State Machine | 3×3 grid only; 6 tile states all needed; outer-ring tiles locked |
| S02 — Planting Engine | Regen mode only; 2 crops only (Criollo + Plátano); companion adjacency resolver required for Plátano bonus |
| S03 — Growth Ticker | Full server-authoritative timer required; no client-trust |
| S04 — Care Actions | Water + Sun only (free); nutrients/pruning stubbed for v1.0 |
| S05 — Soil-Health Ledger | 3-zone display (simplified UI); 5-zone computation in server |
| S06 — Harvest + Yield Calculator | Full formula required (regen × soil × companion); regional modifier = Lucho's Shade Canopy Mastery only |
| S07 — Daily Cap Enforcer | Full implementation; required to prevent abuse from day 1 |
| S08 — Mazorca Ledger Integration | `cauabonga_harvest` + `cauabonga_quest_complete` event types minimum |
| S09 — Guardian Hub Router | Lucho only; 4 other finca tiles visible but locked ("próximamente") |
| S10 — Onboarding Flow | Full 10-minute guided sequence |
| S11 — Daily Quest Engine | 1 template type only ("Harvest your first mazorca" / "Plant 3 seeds") |
| S15 — Regen Streak Tracker | Counter only; no leaderboard dependency yet |
| S26 — Plot Grid Renderer | 3×3 visible; 5×5 rendered but greyed outer ring |

### Systems POST-MVP

| System | Target version |
|--------|---------------|
| S04 full (nutrients/pruning/molasses) | v1.0 |
| S09 all 5 guardianes | v1.0 |
| S11 full 30-template quest pool | v1.0 |
| S12 XP + Level Progression | v1.0 |
| S13 Regen vs. Traditional Comparator | v1.0 |
| S14 Leaderboard | v1.0 |
| S16 PlotNFT Contract (Base Sepolia) | v1.0 |
| S20 Pest Event System | v1.0 |
| S21 Rare Drop System | v1.0 |
| S23 Daily Reset Cron | v1.0 |
| S24 Push Notifications | v1.0 |
| S02 traditional mode | v1.0 |
| S19 Tile Upgrade System | v1.1 |
| S22 Achievement System | v1.1 |
| S25 NPC Dialogue Engine | v1.1 |
| S27 Care-Action Deficit | v1.1 |
| S28 Soil Restoration Burn | v1.1 |
| S18 Weekly Oracle | v1.2 |
| S16 PlotNFT mainnet + transferable | v1.2 |

---

## 6. Risk Callouts

### R01 — Growth Ticker Scheduling (HIGH risk, P0)

**The problem:** Server-authoritative timers for up to 25 tiles × N players is not a polling problem — it's a scheduling problem. The naive approach (client polls `/harvest-ready` repeatedly) creates thundering-herd load when a popular crop cycle completes. The correct approach stores `grows_at TIMESTAMPTZ` per tile in Postgres and lets `claim-cauabonga-harvest` validate server-side on tap, while push notifications are triggered by a separate scheduled function.

**Risk if not addressed:** Client clock manipulation allows speedhacking. Push notification latency causes UX frustration. Heavy polling spikes Supabase Edge Function invocations past free tier.

**Recommended mitigation:** Store `grows_at` and `fallow_ends_at` per tile. Push notification fires from pg_cron (`SELECT * FROM cauabonga_tiles WHERE grows_at <= now() AND tile_state = 'growing'`) on a 5-minute resolution. Accept ±5 minutes of notification latency — consistent with Stardew Valley pattern.

---

### R02 — Off-chain → On-chain Weekly Oracle Complexity (HIGH risk, P1/P2 boundary)

**The problem:** Per GDD §13, critical state hashes (regen streak, total harvests, soil-health summary) are written to chain weekly via an oracle — "same pattern as IoTAttestation." But `IoTAttestation.sol` writes Merkle roots for sensor data, not game state. The game-state oracle needs a new Merkle tree construction over `{plot_id, regen_streak_days, total_harvests, soil_health_avg}` per player. This is a non-trivial cryptographic construction not currently in the codebase.

**Risk if not addressed:** The PlotNFT's on-chain attributes become stale proxies for real game state, undermining the "on-chain anchor" value proposition. The `regenStreakDays` attribute on the NFT could lie.

**Recommended mitigation:** At v1.0, skip the weekly oracle entirely — PlotNFT on-chain attributes are set at mint and updated only on explicit user actions (tile count expansion, major milestone). Weekly oracle deferred to v1.2 after the `IoTAttestation` oracle pattern is validated at scale. Document this as a known limitation in the v1.0 PlotNFT metadata spec. [TBD: confirm with web3 tentacle]

---

### R03 — Regen vs. Traditional Yield Formula Tension (MEDIUM risk, P0)

**The problem:** `economy §4.4` identifies that regen wins from cycle 1 under the flat 1.30× multiplier (GDD §7), undermining the educational tension. The recommended fix (Option A: soil-dependent regen scaling from 1.10× to 1.40×) changes a core GDD constant. This is an open balance question (economy §9 item #1).

**Risk if not addressed:** Traditional mode never feels genuinely attractive. Players never experience the "aha" moment of soil degradation catching up. The game's educational thesis lands as copy, not mechanic. Worse, if the regen multiplier is too flat, the game ships with the design pillar (Pillar 1: "regenerative > extractive, mechanically true") broken.

**Recommended mitigation:** Adopt Option A before MVP: regen multiplier = 1.10× at soil 31–60, 1.25× at soil 61–85, 1.40× at soil 86–100. This is a single constant in `claim-cauabonga-harvest`'s yield formula. The fallow overhead (economy §4.5) restores genuine early-game tension by making traditional faster in the first 2 weeks even if regen per-cycle yield is marginally higher. Confirm with `/balance-check` skill before Sprint 1 exit.

---

### R04 — Companion Adjacency Resolver Performance (MEDIUM risk, P0)

**The problem:** The companion bonus requires checking 3-tile radius adjacency for each tile on harvest (GDD §7: Fernando's +4% per unique companion in 3-tile radius, stacking to +24%). On a 25-tile grid, this is a graph traversal computed server-side at harvest time. With many simultaneous harvests, this could add meaningful latency to `claim-cauabonga-harvest`.

**Risk if not addressed:** Harvest endpoint becomes slow (>500ms) at scale, degrading the one-tap UX.

**Recommended mitigation:** Pre-compute and cache the companion adjacency map per plot at plant time (when the player places a crop). Store `companion_bonus_pct SMALLINT` on the `cauabonga_tiles` row, recalculated only when adjacent tiles change. At harvest, read the cached value — O(1). Invalidate cache on any neighboring tile plant/harvest event.

---

### R05 — Daily Quest Cap Conflict Between GDD and Economy (LOW risk, P0)

**The problem:** GDD §11 sets a 200 mz/day quest cap. `economy §2.2` revises this to 120 mz/day after analysis shows the combined harvest + quest emission could reach ~320 mz/day before sinks. These two documents are currently inconsistent.

**Risk if not addressed:** If the implementation uses the GDD cap (200), inflation risk materializes. If it uses the economy cap (120) without updating the GDD, implementers reading only the GDD will implement the wrong cap.

**Recommended mitigation:** Update GDD §11 to state 120 mz/day quest cap (with a cross-reference to economy §2.2's recalibration note). This is a documentation fix, not a design change. The 120 mz cap is the canonical value for implementation. [TBD: game-designer to confirm GDD §11 update]

---

### R06 — Fallow Enforcement + Session Pacing (LOW risk, P1)

**The problem:** Regen mode requires a 1-day fallow after each harvest (GDD §7, GDD §6 tile state "Fallow"). The fallow period is the primary mechanism that makes traditional mode look faster short-term (economy §4.5). But if the fallow UX is invisible or skippable by the player (e.g., the UI shows "ready to plant" without enforcing it), the educational tension collapses.

**Risk if not addressed:** Players discover they can skip fallow (or don't realize it is enforced) and the traditional-mode tension disappears. The 32h effective regen cycle (vs. 24h traditional cycle) is load-bearing for the educational thesis.

**Recommended mitigation:** Fallow state must be server-enforced in `plant-crop` Edge Function: reject planting on a tile where `fallow_ends_at > now()`. Display fallow timer prominently in the tile UI ("Recovering — 18h remaining") with the "Infertile" cracked-earth texture. Make the fallow period feel purposeful, not punishing — show the soil bar ticking up during fallow.

---

### R07 — KYC / Guest Split on Token Emission (LOW risk, P0)

**The problem:** GDD §16 states "Captcha on guest/non-KYC flows for any economic action." `economy §1` implies guests cannot earn mazorcas (no `token_events` write without KYC). But the GDD §14 onboarding allows "continue as guest (off-chain only)" with a first harvest in ~5 minutes. If the guest harvest awards mazorcas, it bypasses KYC. If it doesn't, the "first harvest" reward moment is hollow.

**Risk if not addressed:** Either the onboarding demo is misleading (guests think they earned real tokens) or a KYC bypass exists.

**Recommended mitigation:** Clarify the split explicitly in `claim-cauabonga-harvest`: if `user.kyc_tier < 1`, compute and display the harvest yield number but write to a `guest_preview_balance` field only — not to `token_events`. Show a conversion CTA: "You earned 12 mazorcas — link your wallet to keep them." On KYC completion, migrate `guest_preview_balance` to real `token_events` (up to a 24h lookback cap). This keeps the onboarding demo emotionally real without creating a token-emission bypass. [TBD: confirm with token-economy tentacle]

---

## 7. Ambiguities Flagged as [TBD]

| # | Ambiguity | GDD/Economy ref | Blocking? |
|---|-----------|-----------------|-----------|
| T1 | Regen multiplier: flat 1.30× vs. soil-dependent Option A | economy §9 item #1 | P0 — must resolve before Sprint 1 yield formula |
| T2 | Daily quest cap: 120 mz (economy) vs. 200 mz (GDD §11) | economy §2.2 note | P0 — must resolve before quest engine build |
| T3 | Plot-mint cost: 500 mz vs. 1,000 mz | GDD §18 Q2, economy §3.4 | P1 — blocks PlotNFT Edge Function |
| T4 | Soulbound v1 confirmed? | GDD §18 Q3, GDD §13 | P1 — affects contract spec and market copy |
| T5 | Guest → KYC token migration path | R07 above | P0 — affects onboarding architecture |
| T6 | Care-action deficit debuff: −5% vs. −10%/missed cycle | economy §9 item #5 | P1 |
| T7 | soilTier reset on NFT transfer (v1.2) | economy §8.3, economy §9 item #6 | P2 — v1.2 only |
| T8 | Claim diminishing-return thresholds (15/25/35) | economy §7.3 | P1 — needs playtest data |
| T9 | Plot abandonment scar (−5% permanent after soil = 0) | economy §8.5 | P1 — v1.1 target |
| T10 | Weekly oracle state hash construction (Merkle format for game state) | GDD §13, R02 above | P2 |
| T11 | Criollo Élite crafted seed cost | economy §3.5 | P2 |
| T12 | Season length: 1 week vs. 4 weeks | GDD §18 Q6 | P1 — blocks leaderboard reset cron |
| T13 | IPFS pinning account for PlotNFT metadata | GDD §18 Q7 | P1 — Pinata account exists per web3 tentacle, confirm reuse |

---

> **3-line summary:**
> The critical build path is S17 → S01 → S02 → S03 → S05 → S06 → S07 → S08 (plot anchor → planting → growth → soil → harvest → cap → ledger); everything else is a consumer of this chain or a parallel leaf. MVP is Sprints 1–2 (Lucho, 3×3, 2 crops, regen only, off-chain) with 14 systems in scope and 14 deferred post-MVP. The highest-risk items are the growth ticker scheduling strategy (R01), the weekly oracle complexity (R02), and the regen multiplier balance question (R03/T1) — all three need resolution before Sprint 1 exits.
