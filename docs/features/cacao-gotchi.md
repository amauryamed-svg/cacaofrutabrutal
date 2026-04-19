---
tags: [cold, feature, mvp, ml]
status: en-desarrollo
---
# Feature: Cacao-gotchi — Gemelo Digital

> Estado: **EN DESARROLLO** — feature principal del MVP

## Qué es

El "Gemelo Digital" de cada árbol adoptado. Muestra en tiempo real:
- Salud del árbol (stage: seedling → sapling → mature → harvest)
- CO2 absorbido (kg)
- Pronóstico de cosecha (ML prediction)
- Clima actual en la finca (Open-Meteo API)

## Stack de esta Feature

| Capa | Archivo | Agente |
|------|---------|--------|
| Frontend | `src/pages/Adoptar.tsx` · `src/pages/TreeDetail.tsx` | Gemini |
| Componentes | `src/components/ritual/` | Gemini |
| API cron | `api/cacao_predictor.py` | Claude Code |
| DB | `supabase/migrations/005_cacao_trees.sql` | Claude Code |
| Edge Fn | `supabase/functions/award-tokens/` | Claude Code |

## Tablas de DB

```sql
cacao_trees   -- un registro por árbol adoptado
  id, user_id, guardian_id, variety, stage, co2_kg, created_at

tree_updates  -- feed de actualizaciones del cron
  id, tree_id, update_type, message, climate_data, created_at
```

## Flujo de Adopción

```
/adoptar → seleccionar guardián + variedad → INSERT cacao_trees
→ award-tokens Edge Fn (+10 beans, +3 mazorcas)
→ animación de recompensa en UI
→ cron diario actualiza stage/CO2 via cacao_predictor.py
```

## Token Rewards

| Evento | Beans | Mazorcas |
|--------|-------|---------|
| tree_adoption | +10 | +3 |
| tree_update_read | +1 | 0 |
| tree_harvest_share | +5 | +1 |

## Pendiente (MVP)

- [ ] Dashboard "Cacao-gotchi" — UI principal del Gemelo Digital
- [ ] Conectar `api/cacao_predictor.py` a producción en Vercel
- [ ] Visualización CO2 + harvest prediction en TreeDetail
- [ ] Notificaciones push cuando árbol sube de stage
