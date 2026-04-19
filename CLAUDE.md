# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# CAUA Corporation — Claude Code

> Contexto completo: [[docs/MAIN.md]] | Ownership: `api/` `supabase/` `scripts/`

## Stack
React 18 + Vite + TypeScript + TailwindCSS | Supabase Auth + PostgreSQL | Stripe + MercadoPago | Vercel | Python ML (`api/`)

## Comandos
```bash
npm run dev        # localhost:3000
npm run build      # tsc -b && vite build
npm run lint       # ESLint
npx supabase gen types typescript --local   # regenerar tipos DB tras migración

# Python API (api/)
cd api && pip install -r requirements.txt
python -c "from cacao_predictor import fetch_climate; print(fetch_climate('2.5359','-75.5277'))"

# Supabase
npx supabase link --project-ref kjygovuiphbxcdxeduco
npx supabase db push
npx supabase functions deploy <nombre>
```

## CauaCore §8 — No negociables
- Backgrounds: hex values ONLY, nunca CSS custom properties
- NUNCA pastel gradients — brutalist luxury only
- NUNCA localStorage — Supabase o React context
- NUNCA `.env` en commits — usar `.env.local`
- Stripe secret key: Edge Functions only
- Supabase `service_role`: nunca en client code
- Python functions: max 20 líneas cada una
- RLS: siempre `(select auth.uid())`, nunca `auth.uid()` directo
- Frontend siempre filtra `.eq('user_id', userId)` — RLS es capa de seguridad, no filtro

## Token Budget (CauaOptimize §1)
Antes de proceder: ¿Leo archivos o uso Explore? ¿Agrupo 3+ cambios antes de deploy?

| Modelo | Cuándo |
|--------|--------|
| Haiku  | Copy, edits pequeños, config |
| Sonnet | Features, componentes, migraciones |
| Opus   | Bugs reiterativos (≥2 fallos), decisiones críticas |

## Skill Routing
| Tarea | Skill |
|-------|-------|
| Arquitectura / DB / API | `plan-eng-review` |
| Bug / error | `investigate` |
| Seguridad / RLS / secrets | `cso` |
| Deploy / PR | `ship` |
| Supabase schema | `supabase` |
| Design / componentes | `design-consultation` → Gemini |
| QA / browser | `qa` |
| Health semanal | `health` |
