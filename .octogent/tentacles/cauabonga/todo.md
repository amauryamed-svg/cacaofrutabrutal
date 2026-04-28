# CauaBonga — todo

> Phase 0: scaffolding + GDD (drafted by Game Studios `game-designer` agent).

## P0 — Foundation (this sprint)

- [x] Install Game Studios agents (12) + skills (10) into `.claude/`
- [x] Scaffold tentacle: CONTEXT.md · todo.md · NOTES.md
- [x] Draft GDD.md via `game-designer` agent — core loop, progression, 5 fincas, regen vs traditional, daily quests
- [x] Draft economy.md via `economy-designer` — sinks, faucets, daily emission cap 200 mz, 12-cycle regen vs traditional curves
- [x] Reconcile guardianes roster with `src/utils/constants.ts:99` (canonical 5: Lucho/Marta/Rafael/Fernando/Ricardo)
- [x] Run `/map-systems` (via systems-designer agent) — `systems-map.md` with 28 systems indexed, 4-sprint build order, critical path documented
- [x] Run `/create-architecture` (via technical-director agent) — `architecture.md` ~7,200 words, 9 tables, 7 Edge Functions, EIP-712 typed-data spec, CauaBongaPlot.sol design, 8 ADRs (CB-001..008), risk register
- [ ] Run `/art-bible` to lock visual style (anchored to the new SVG tree + heart morph + human silhouette)
- [ ] Resolve ADR CB-001 (soulbound v1.0 confirm), CB-003 (cron infra: pg_cron + Supabase Scheduled), CB-006 (yield formula in `src/utils/cauabonga.ts`) before contract deploy

## P1 — Architecture + epics (next sprint)

- [ ] Run `/create-epics` — produces 1 epic per system (PlotNFT contract, plot UI grid, planting flow, growth ticker, harvest claim, soil-health, regen vs traditional comparison overlay, daily quests, leaderboards)
- [ ] Run `/create-stories` per epic — implementable tickets with TR-IDs

## P2 — MVP playable (sprint 3-4)

- [x] Migration `033_cauabonga_plots.sql`: 8 tables (plots/plantings/harvests/soil_history/mint_nonces/daily_quests/action_log/weekly_attestations) + 19 indexes + 8 RLS policies + 2 updated_at triggers + `apply_cauabonga_harvest` atomic RPC. Aligned to `architecture.md` §2.
- [ ] Edge Function `cauabonga-plant-seed` (validates KYC + tile bounds + cost; inserts planting row)
- [ ] Edge Function `claim-cauabonga-harvest` (validates timer, awards mazorcas, updates soil, inserts audit + token_event)
- [ ] Edge Function `cauabonga-care-action` (water/sun/nutrients/pruning ticks per cooldown)
- [ ] React: `CauaBongaPlot.tsx` (3×3 inner grid view, plant/harvest UI, regen mode default for MVP)
- [ ] React: extend `CauaBonga.tsx` with active-plots HUD
- [ ] PlotNFT.sol contract + Foundry tests + Sepolia deploy *(POST-MVP per GDD §19)*
- [ ] Edge Function `mint-cauabonga-plot` *(POST-MVP)*
- [ ] Daily quest engine + token rewards *(POST-MVP)*
- [ ] Regen vs traditional comparison overlay (educational hover)

## P3 — Polish + economy balance

- [ ] `/balance-check` against the live economy parameters
- [ ] Leaderboards per finca (top regen farmers)
- [ ] NPC dialogue from the 5 guardianes (writer agent)
- [ ] Weekly seasons / events
- [ ] Sound design (audio-director agent, deferred)

## Open questions

- ~~5th guardian identity~~ — **RESOLVED 2026-04-28**: canonical roster in `src/utils/constants.ts:99` is Lucho/Marta/Rafael/Fernando/Ricardo. GDD §5 + CONTEXT.md updated to match. No fictional Maicol/Sumapaz — the Sumapaz altitude territory is already covered by Rafael (Arbeláez/Cundinamarca).
- ~~Plot grid size~~ — **RESOLVED**: 5×5 (9 starter inner + 16 unlockable ring), per GDD §6.
- Soulbound vs transferable PlotNFT — affects secondary market (GDD §10 leans soulbound v1, Charter signoff pending)
- Regen yield bonus exact %: charter targets +30% but balance-check may tune
