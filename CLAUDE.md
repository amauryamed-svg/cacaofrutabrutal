# CAUA Corporation App

## Stack
React 19 + Vite 8 + TypeScript 6 + TailwindCSS v4 | Supabase Auth + PostgreSQL + Edge Functions | Stripe + MercadoPago + Coinbase | Vercel

> Stack correction: This is React 19 + Vite (NOT Next.js). Client-side SPA. React Router DOM v7. No SSR, no App Router, no Server Components.

## Commands
- dev: `npm run dev` (localhost:3000)
- build: `npm run build`
- types: `npx supabase gen types typescript --local`

## Non-negotiable constraints (CauaCore §8)
- Backgrounds: hex values only, NEVER CSS custom properties
- Python functions: max 20 lines each
- NEVER pastel gradients — brutalist luxury only
- NEVER localStorage — use Supabase or React context
- NEVER commit .env files — use .env.local (gitignored)
- Stripe secret key: Edge Functions only, never frontend
- Supabase service_role key: never in client code

## Token Budget — Ask-First Pattern (CauaOptimize §1)
Antes de proceder:
- **Exploración:** ¿Leo archivos o usamos subagente Explore?
- **Deploy:** ¿Deployamos ahora o agrupamos 3+ cambios?
- **Lectura:** ¿Puedo resolverlo sin leer X?

**Modelos por tarea:**
- Haiku (default): copy, edits pequeños, config
- Sonnet: features, componentes, migraciones
- Opus: bugs reiterativos (≥2 fallos) ó decisiones críticas

**Memory:** Cargar solo HOT/WARM. COLD solo si piden.

## Pre-commit Hook (CauaOptimize §2)
- `npm run postinstall` → instala hook Python
- Corre `python scripts/health.py` en cada commit
- Bloquea si hay `console.log` en producción
- Avisa (no bloquea) si archivos >200 líneas o imports no usados

## Skill routing — invoke FIRST before any other action
- Architecture / data model / API design     → plan-eng-review
- Design system / brand / component          → design-consultation
- Visual polish / live site audit            → design-review
- Bug / error / broken feature               → investigate
- QA / test flows / browser testing          → qa
- Code review / pre-merge check              → review
- Security / RLS / webhook / secrets         → cso
- Deploy / ship / create PR                  → ship
- Supabase schema / migrations / RLS         → supabase
- Weekly code quality                        → health
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

### Fan-Out / Fan-In Pattern
For large features spanning multiple tentacles:
1. Orchestrator agent reads all relevant CONTEXT.md files
2. Creates bounded sub-tasks for each tentacle (each sub-task self-contained)
3. Child agents work independently on their slice
4. Orchestrator integrates and resolves cross-tentacle conflicts
