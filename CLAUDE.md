# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# CAUA Corporation — Claude Code

> Contexto completo: [[docs/MAIN.md]] | Ownership: `api/` `supabase/` `scripts/`

## Stack
React 19 + Vite + TypeScript + TailwindCSS v4 | Supabase Auth + PostgreSQL + Edge Functions | Stripe + MercadoPago + Coinbase | Vercel | Python ML (`api/`)

> Stack: Client-side SPA con React Router DOM v7. No SSR, no App Router, no Server Components.

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
- **UI/UX:** toda página nueva cumple [`docs/context/ui-ux-bar.md`](docs/context/ui-ux-bar.md) — performance, motion, 3D assets, a11y

## Token Budget (CauaOptimize §1)
Antes de proceder: ¿Leo archivos o uso Explore? ¿Agrupo 3+ cambios antes de deploy?

| Modelo | Cuándo |
|--------|--------|
| Haiku  | Copy, edits pequeños, config |
| Sonnet | Features, componentes, migraciones |
| Opus   | Bugs reiterativos (≥2 fallos), decisiones críticas |

## Skill Routing — invocar PRIMERO antes de cualquier acción
- Arquitectura / DB / API design             → plan-eng-review
- Design system / brand / componente         → design-consultation
- Visual polish / live site audit            → design-review
- Bug / error / feature rota                 → investigate
- QA / test flows / browser                  → qa
- Code review / pre-merge                    → review
- Seguridad / RLS / secrets                  → cso
- Deploy / PR                                → ship
- Supabase schema / migraciones / RLS        → supabase
- Health semanal                             → health
- Sprint retrospective                       → retro
- Save progress before major refactor        → checkpoint

---

## Octogent Multi-Agent Orchestration

This project uses Octogent — a multi-agent framework that gives each work domain its own "tentacle" folder. A tentacle is a scoped context container for one slice of work, containing CONTEXT.md (domain knowledge), todo.md (task list), and NOTES.md (architectural decisions).

### Directory Structure
```
.octogent/
├── config.json               — Global project config + tentacle registry
└── tentacles/
    ├── cacao-gotchi/         — B2C digital twin game (Adoptar, TreeDetail, CauaGotchi)
    ├── b2b-marketplace/      — Crowdfunding + payments (Fund, Marketplace)
    ├── token-economy/        — Dual-token system (beans + mazorcas)
    ├── blog-cms/             — Blog posts + content + token rewards
    ├── supabase-backend/     — DB schema + RLS + Edge Functions + triggers
    ├── ml-pipeline/          — Python ML microservice (FastAPI, predictions)
    ├── design-system/        — BRAND palette + typography + UI components
    └── infra-devops/         — CI/CD + deploy + E2E tests + health monitoring
```

### Agent Protocol — Read This Before Any Task
1. Identify which tentacle domain your task belongs to (use routing table below)
2. Read `.octogent/tentacles/<tentacle-id>/CONTEXT.md` — ground truth for that domain
3. Check `.octogent/tentacles/<tentacle-id>/todo.md` — open items with P0/P1/P2 priorities
4. Complete the task
5. Check off completed items in `todo.md`
6. Add architectural decisions to `NOTES.md` with date and one-line rationale

### Tentacle Routing
| Work area | Tentacle |
|-----------|----------|
| Tree adoption, CauaGotchi, care actions, growth stages | `cacao-gotchi` |
| Fund page, lot investments, Stripe/MP/Coinbase payments | `b2b-marketplace` |
| Beans, mazorcas, TOKEN_RATES, award-tokens Edge Function | `token-economy` |
| Blog posts, Markdown rendering, blog token awards | `blog-cms` |
| DB migrations, RLS policies, Edge Functions, triggers | `supabase-backend` |
| api/ Python files, ML predictions, IoT, climate | `ml-pipeline` |
| BRAND colors, fonts, UI components in src/components/ui/ | `design-system` |
| vite.config, vercel.json, scripts/, Playwright tests, CI | `infra-devops` |

### Multi-Tentacle Tasks
If a task spans domains (e.g., "wire token award on tree care"):
1. Identify the primary tentacle (most code changes)
2. Read CONTEXT.md for all affected tentacles before starting
3. Document cross-tentacle dependencies in NOTES.md of the primary tentacle

### Context Hygiene
- Use `/clear` between tasks in different tentacle domains
- Use `/compact` when a single tentacle task gets long
- Never carry assumptions from one tentacle session to another — always re-read CONTEXT.md
