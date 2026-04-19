---
tags: [hot, rules, non-negotiable]
---
# CauaCore §8 — Restricciones No Negociables

> Estas reglas no se discuten. Aplican a Claude Code y Gemini por igual.

## Código

| Regla | Razón |
|-------|-------|
| Backgrounds: **hex ONLY** (`#1a1a1a`) | `var(--color)` rompe el sistema de diseño en SSR y dark mode |
| **NUNCA** pastel gradients | Brand: brutalist luxury. Paleta en `src/design/tokens.ts` |
| **NUNCA** `localStorage` | Datos de usuario deben vivir en Supabase o React context |
| **NUNCA** commit `.env` | Solo `.env.local` (gitignored) — usar Vercel env vars en prod |
| Stripe secret key → Edge Functions **only** | Nunca exponer en bundle del cliente |
| `supabase.service_role` → nunca en client code | Bypasea RLS completamente |
| Python: max **20 líneas** por función | Composición > monolitos; legibilidad del agente |

## Base de Datos

| Regla | Razón |
|-------|-------|
| `(select auth.uid())` en RLS, nunca `auth.uid()` directo | El `select` permite cache del planner PostgreSQL |
| Índice `btree` en toda columna de política RLS | Sin índice = seq scan en 100k filas |
| Frontend filtra `.eq('user_id', userId)` siempre | RLS es seguridad, no sustituto de filtros |
| Security definer para founder queries | Evita N+1 en admin reads |

## Calidad

- Archivos frontend: aviso si >200 líneas, split si >300
- No `console.log` en producción (bloqueado por pre-commit hook)
- No imports no usados (pre-commit hook avisa)
- TypeScript strict — no `any` sin justificación

## Pre-commit Hook

```bash
# Instalado automáticamente vía: npm run postinstall
# Bloquea: console.log en producción
# Avisa: archivos >200 líneas, imports no usados
# Script: scripts/health.py
```
