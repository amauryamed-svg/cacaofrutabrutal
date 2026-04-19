---
tags: [warm, backend, supabase, rls]
---
# Base de Datos — Supabase + RLS

> Referencia completa: [[../archive/BACKEND_RLS_AUDIT.md]]

## Migraciones (en orden)

| # | Archivo | Qué crea |
|---|---------|---------|
| 001 | initial_schema.sql | user_profiles, products, orders, bids |
| 002 | crowdfunding.sql | lot_investments, technologies, mvps |
| 003 | blog_tokens_crm.sql | blog_posts, token_events, email_log · extensiones a user_profiles |
| 004 | user_profiles_rls.sql | RLS policies para user_profiles |
| 005 | cacao_trees.sql | cacao_trees, tree_updates (Cacao-gotchi) |
| 006 | rls_optimization.sql | Security definer `get_founder_user_ids()` · array cache |
| 007 | cacao_trees_complete.sql | Índices adicionales para tree tables |
| 008 | catacion_leads.sql | catacion_leads (lead capture) |
| 009 | cotizaciones_b2b.sql | B2B quotations |

## Reglas RLS — Patrones Obligatorios

```sql
-- ✅ CORRECTO — cacheable por el planner
WHERE user_id = (select auth.uid())

-- ❌ INCORRECTO — evalúa en cada fila
WHERE user_id = auth.uid()

-- ✅ Founder queries — security definer array
WHERE (select auth.uid()) = ANY(get_founder_user_ids())
```

## Índices Críticos para 100k Usuarios

| Estado | Tabla | Columnas | Tipo |
|--------|-------|---------|------|
| ✅ OK | user_profiles | user_id (PK) | btree |
| ⚠️ FALTANTE | user_profiles | (caua_role, user_id) | compound btree |
| ⚠️ FALTANTE | orders | status | btree |
| ✅ OK | cacao_trees | user_id, stage | btree |
| ✅ OK | token_events | user_id, created_at | btree |

## Roadmap de Optimización (100k scale)

```
Fase 1: Cache layer + índices compound  → 40% latency reduction   [PENDIENTE]
Fase 2: JWT payload denormalization      → reduce auth.uid() calls  [PENDIENTE]
Fase 3: Security definer en joins        → 100x en admin queries    [APLICADO en 006]
Fase 4: Admin pagination                 → evita full table scans   [PENDIENTE]
```

## Project ID
`kjygovuiphbxcdxeduco` — usar en `supabase link --project-ref`
