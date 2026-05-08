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

## Adoption UX/UI Sprint 1 (post-`adoption-ux-designer` creation, 2026-05-08)

Owner: `adoption-ux-designer` agent. Each item is a spec-first task — the agent writes the spec, gets user approval, then hands off implementation to `ui-programmer`.

- [x] [P0] Implement Golden Ticket Freemium mode in `src/pages/Adoptar.tsx`: struck-through `$5 USD` + "GRATIS · Golden Ticket activo" badge + "Adopta gratis" CTA + payment-surface bypass when flag active. Flag must be dynamic (Supabase `app_config` row or env), not hardcoded. Add tooltip/modal "¿Qué es Golden Ticket?" explaining 4 hitos + 30 cupos. **Done 2026-05-08:** Flag `VITE_GOLDEN_TICKET_FREEMIUM` (Vite env). Hero ribbon + confirm-modal eyebrow + tachado/GRATIS treatment + done-state hito chip + full-screen GT modal con 4 hitos. Telemetry `ingest-goldenticket` deferred — requires CORS allow-list update + new event_type `'adopt_complete'` in Edge Function.
- [ ] [P1] Remove redundant auth-gate at `src/pages/Adoptar.tsx:40` — `<AuthGate>` already wraps the route in `src/App.tsx:74`. The inline `if (!user) navigate('/auth')` is dead code that confuses the swipe-right flow.
- [ ] [P1] Replace hardcoded `RedimeCacao10K` literal at `src/pages/Adoptar.tsx:353` with a call to `supabase/functions/create-shopify-giftcard` Edge Function. Spec the per-user code generation, error fallback, and clipboard-copy affordance.
- [ ] [P1] Unify payment surface inside the confirm modal: integrate `AdoptWithCryptoButton` or `OnrampButton` directly (currently only descriptive text at `src/pages/Adoptar.tsx:558`). Show only when freemium is NOT active.
- [ ] [P2] CauaGotchi preview chip on slide 3 (journey) of `src/components/ui/SwipeableTreeCard.tsx` — sprite + stage + first vital, so the user sees the game they'll inherit.
- [ ] [P2] Email-feedback toast post-adoption: `send-adoption-email` is fire-and-forget at `src/hooks/useCocoaTrees.ts:101`. Add visible confirmation + "Enviar de nuevo" fallback.
- [ ] [P2] Mobile responsiveness sweep on `Adoptar.tsx` + `SwipeableTreeCard.tsx` at 320px–768px. Verify touch targets ≥ 44px on chips and CTAs.
- [ ] [P2] Hit `ingest-goldenticket` Edge Function with `event_type: 'adopt_complete'` in the done-state when user comes from Camino B (cohort URL param present).
