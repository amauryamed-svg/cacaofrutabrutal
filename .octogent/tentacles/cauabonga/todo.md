# CauaBonga — todo

> Phase 0: scaffolding + GDD (drafted by Game Studios `game-designer` agent).

## P0 — Foundation (this sprint)

- [x] Install Game Studios agents (12) + skills (10) into `.claude/`
- [x] Scaffold tentacle: CONTEXT.md · todo.md · NOTES.md
- [ ] Draft GDD.md via `game-designer` agent — core loop, progression, 5 fincas, regen vs traditional mechanics, daily quests
- [ ] Draft economy.md via `economy-designer` — sinks, faucets, hourly yield curves, mazorca/CACAO emission
- [ ] Run `/map-systems` to decompose GDD into systems index
- [ ] Run `/art-bible` to lock visual style (anchored to the new SVG tree + heart morph)

## P1 — Architecture + epics (next sprint)

- [ ] Run `/create-architecture` — DB schema (plots, plantings, harvest_claims, soil_health), Edge Functions, contracts, on-chain mint flow
- [ ] Run `/create-epics` — produces 1 epic per system (PlotNFT contract, plot UI grid, planting flow, growth ticker, harvest claim, soil-health, regen vs traditional comparison overlay, daily quests, leaderboards)
- [ ] Run `/create-stories` per epic — implementable tickets with TR-IDs

## P2 — MVP playable (sprint 3-4)

- [ ] Migration: `cauabonga_plots`, `cauabonga_plantings`, `cauabonga_harvests`, `cauabonga_soil_history`
- [ ] PlotNFT.sol contract + Foundry tests + Sepolia deploy
- [ ] Edge Function `mint-cauabonga-plot` (gasless via existing relayer infra)
- [ ] Edge Function `claim-cauabonga-harvest` (validates timer, awards mazorcas, updates soil)
- [ ] React: `CauaBongaPlot.tsx` (per-plot grid view, plant/harvest UI)
- [ ] React: extend `CauaBonga.tsx` with active-plots HUD + 5 guardianes deeper lore
- [ ] Daily quest engine + token rewards
- [ ] Regen vs traditional comparison overlay (educational hover)

## P3 — Polish + economy balance

- [ ] `/balance-check` against the live economy parameters
- [ ] Leaderboards per finca (top regen farmers)
- [ ] NPC dialogue from the 5 guardianes (writer agent)
- [ ] Weekly seasons / events
- [ ] Sound design (audio-director agent, deferred)

## Open questions

- 5th guardian identity (region + variety) — not yet assigned in `GUARDIANS` constant
- Plot grid size (3×3? 5×5?) — to be locked in GDD
- Soulbound vs transferable PlotNFT — affects secondary market
- Regen yield bonus exact %: charter targets +30% but balance-check may tune
