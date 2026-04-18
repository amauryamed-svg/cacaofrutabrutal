# todo — cacao-gotchi

## P0 — Launch Blockers

- [ ] [P0] Wire real health/moisture/sunlight values from `cacao_trees` row into `CauaGotchi` props — replace hardcoded (85/60/90) in `src/pages/Dashboard.tsx`
- [ ] [P0] Build care action buttons (Water / Sunlight / Nutrients / Prune / Molasses) in `src/pages/TreeDetail.tsx` that write care events to `cacao_trees`
- [ ] [P0] Enforce 3h care cooldown: check `last_update_at` before allowing any care action, show countdown timer if blocked

## P1 — Q2 Meaningful Experience

- [ ] [P1] Auto-advance growth stage: Edge Function or Supabase pg_cron job that calls `getStageByDays()` and updates `cacao_trees.stage` daily
- [ ] [P1] Wire problem detection — set plague/fungus/drought flag in tree row when conditions met; display alert in CauaGotchi
- [ ] [P1] Add `co2_kg` increment (+0.02) on every successful care action write
- [ ] [P1] Wire harvest completion event: when stage reaches `maduracion` → trigger `tree_harvest_share` token award + show share CTA
- [ ] [P1] Add push notification trigger when tree needs care (>3h since last_update_at) — see `notify-tree-care` Edge Function in supabase-backend tentacle

## P2 — Q3–Q4 Scale

- [ ] [P2] Social share card for stage transitions — TikTok/Reels format (1080×1920 ratio), show tree emoji + Guardian + region
- [ ] [P2] Wire ML predictor response back to tree health display: call ML service via Edge Function proxy, show `predicted_health` as secondary bar
- [ ] [P2] Add IoT sensor data visualization: show temp_c / soil_moisture / sunlight_lux readings from `tree_updates` in TreeDetail
- [ ] [P2] Build tree history timeline: paginated list of `tree_updates` rows for a given tree
