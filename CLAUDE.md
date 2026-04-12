# CAUA Corporation App

## Stack
React 18 + Vite + TypeScript + TailwindCSS | Supabase Auth + PostgreSQL | Stripe Checkout | Vercel

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
