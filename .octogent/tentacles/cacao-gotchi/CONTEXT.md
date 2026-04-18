# Tentacle: cacao-gotchi

## Domain
B2C digital twin game — tree adoption, CauaGotchi care game, 8-stage growth lifecycle, ML integration.

## What This Domain Owns
- `/src/pages/Adoptar.tsx` — Swipeable Guardian selection carousel (5 Guardians)
- `/src/pages/TreeDetail.tsx` — Full tree care game UI (health/moisture/sunlight bars, care actions)
- `/src/components/dashboard/CauaGotchi.tsx` — Retro GameBoy-style pixel art display (Framer Motion)
- `/src/utils/growthSystem.ts` — 8-stage growth cycle logic, care interval calculations
- `/src/hooks/useCocoaTrees.ts` — Supabase query for user's adopted trees
- `/src/components/ui/SwipeableTreeCard.tsx` — Guardian card carousel component

## Data Model

### `cacao_trees` table
```
id               uuid PK
user_id          uuid FK → auth.users
guardian_id      int  (0-4, index into GUARDIANS array in constants.ts)
guardian_name    text
region           text
variety          text
stage            text (enum: siembra|germinacion|plantula|crecimiento|desarrollo|floracion|formacion|maduracion)
adopted_at       timestamptz
predicted_harvest_at timestamptz
co2_kg           numeric (default 0, increments +0.02 per care action)
health           int  (0-100)
moisture         int  (0-100)
sunlight         int  (0-100)
last_update_at   timestamptz
```

### `tree_updates` table
```
id               uuid PK
tree_id          uuid FK → cacao_trees
climate          jsonb (temp_c, humidity_pct, rainfall_mm)
stage_change     text
harvest_prediction date
co2_update       numeric
created_at       timestamptz
```

## Growth System (src/utils/growthSystem.ts)

8 stages with `dayThreshold` (fractional days within a 5-day adoption window):
```
GROWTH_STAGES = [
  { id: 'siembra',      dayThreshold: 0,    label: 'Siembra',      emoji: '🌰' },
  { id: 'germinacion',  dayThreshold: 0.5,  label: 'Germinación',  emoji: '🌱' },
  { id: 'plantula',     dayThreshold: 1.0,  label: 'Plántula',     emoji: '🌿' },
  { id: 'crecimiento',  dayThreshold: 1.5,  label: 'Crecimiento',  emoji: '🌳' },
  { id: 'desarrollo',   dayThreshold: 2.5,  label: 'Desarrollo',   emoji: '🌲' },
  { id: 'floracion',    dayThreshold: 3.0,  label: 'Floración',    emoji: '🌸' },
  { id: 'formacion',    dayThreshold: 3.5,  label: 'Formación',    emoji: '🍫' },
  { id: 'maduracion',   dayThreshold: 4.0,  label: 'Maduración',   emoji: '🎉' },
]
```

`getStageByDays(daysSinceAdoption)` → returns the correct stage object.
`getCareStatus(lastCareAt)` → returns { canCare, minutesUntilNextCare } based on 3h interval.

## The 5 Guardians (src/utils/constants.ts GUARDIANS array)

| Index | Name    | Region        | Town       | Variety       |
|-------|---------|---------------|------------|---------------|
| 0     | Lucho   | Huila         | Acevedo    | Criollo Élite |
| 1     | Marta   | Arauca        | Saravena   | Trinitario    |
| 2     | Rafael  | Cundinamarca  | La Palma   | Híbrido       |
| 3     | Fernando| Meta          | Lejanías   | Criollo Élite |
| 4     | Ricardo | Santander     | San Vicente| Trinitario    |

Fernando (Meta/FEAR5) holds Medalla de Oro 2024.

## Care Actions & Stats

| Action    | Health Δ | Moisture Δ | Sunlight Δ | CO2 Δ |
|-----------|----------|------------|------------|-------|
| Water     | +5       | +20        | 0          | +0.02 |
| Sunlight  | +5       | -5         | +25        | +0.02 |
| Nutrients | +25      | +10        | 0          | +0.02 |
| Prune     | +15      | 0          | +20        | +0.02 |
| Molasses  | +30      | +5         | 0          | +0.02 |

Care cooldown: 3 hours between actions. Block care if `last_update_at` within 3h.

## Problem Events (triggers when neglected)

| Problem  | Trigger condition          | Effect           |
|----------|---------------------------|------------------|
| Plague   | Health < 30% + no care 6h | health drain -5/h |
| Fungus   | Moisture > 90% + no care  | health drain -3/h |
| Drought  | Moisture < 10%            | health drain -8/h |

## Token Integration

- Tree adoption: `award-tokens` Edge Function called with `{ event: 'tree_adoption', beans: 10, mazorcas: 3 }`
- Care action (tree_update_read): `{ event: 'tree_update_read', beans: 0.5 }`
- Harvest completion: `{ event: 'tree_harvest_share', beans: 5, mazorcas: 2 }`

## Current Critical Gaps

1. **CauaGotchi props are hardcoded** in `src/pages/Dashboard.tsx`:
   ```tsx
   <CauaGotchi health={85} moisture={60} sunlight={90} ... />
   ```
   These must be wired to real `cacao_trees` row data via `useCocoaTrees` hook.

2. **Care action buttons not built** — `TreeDetail.tsx` shows the game UI but does not have functional Water/Sunlight/Nutrients/Prune/Molasses buttons that write to the DB.

3. **Care cooldown not enforced** — No check for `last_update_at` + 3h before allowing care.

## Aesthetic Rules

- Retro CRT style: `fontFamily: 'Courier New'`, scanline overlay via CSS
- Pixel art emoji sprites per growth stage (in CauaGotchi.tsx)
- Framer Motion used only for CauaGotchi sprite breathing pulse — no other animations
- Background: `BRAND.bgDeep = #040C06` (always, never CSS variables)
- Accent: `BRAND.pod = #91A63B` for health bar, `BRAND.mazorca = #F1A91E` for moisture

## ML Integration (api/ml_predictor.py)

The Python ML microservice predicts tree health from sensor data:
- Input: `{ user_id, tree_id, temp_c, soil_moisture, sunlight_lux }`
- Output: `{ anon_token, predicted_health, stress_alert, timestamp }`
- Stress alert fires when `predicted_health < 50`
- Writes to `ml_predictions_log` table (pending migration 011)
- Auth: `X-ML-Secret` header. Never call from frontend — proxy via Supabase Edge Function.
