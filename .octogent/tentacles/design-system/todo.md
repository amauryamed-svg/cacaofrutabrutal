# todo — design-system

## P1 — Q2 Meaningful Experience

- [ ] [P1] Create `CauaTokenChip` component (`src/components/ui/CauaTokenChip.tsx`): displays bean or mazorca count with correct icon — replaces inline token displays in TokenBalance, Ritual, Dashboard
- [ ] [P1] Create `CauaProgressBar` component (`src/components/ui/CauaProgressBar.tsx`): retro block-style progress bar — extracts duplication from CauaGotchi.tsx and AdminCRM.tsx and FundingProgress.tsx
- [ ] [P1] Create `CauaModal` component (`src/components/ui/CauaModal.tsx`): reusable modal with BRAND styling — standardizes InvestModal and EditUserPanel patterns
- [ ] [P1] Create `CauaStageCard` component: tree growth stage display card — extract from Adoptar.tsx and TreeDetail.tsx

## P2 — Q3–Q4 Scale

- [ ] [P2] Audit all inline backgrounds across `src/` — confirm zero CSS custom property usage: `grep -r "var(--" src/` should return no color-related results
- [ ] [P2] Create `CauaBadge` component (`src/components/ui/CauaBadge.tsx`): role badge (investor/creyente/nativo/farmer/founder) using ROLE_CONFIG colors
- [ ] [P2] Document all BRAND colors with semantic usage guidelines in `design/tokens.md` — which colors to use for which UI contexts
- [ ] [P2] Create `CauaNotification` component: push notification display for tree care reminders — receives `{ type, message, cta }` props
- [ ] [P2] Extract `CauaTimeline` component: reusable timeline from Dashboard.tsx TIMELINE constant — can be reused in user profile and investor dashboard
- [ ] [P2] Add dark mode documentation note to NOTES.md — clarify that the entire app IS dark mode (bgDeep = #040C06)
