# memory.md — Registro de Decisiones Arquitectónicas

> Ambos agentes (Claude Code y Gemini) leen este archivo antes de codificar.
> Agregar nuevas decisiones con `[YYYY-MM-DD]` al inicio de la sección 2.

---

## 1. Decisiones Base

| Capa | Tecnología |
|------|-----------|
| Frontend | **React 19 + Vite + TypeScript + TailwindCSS** (NO Next.js) |
| Routing | React Router v7 |
| Animaciones | Framer Motion |
| Auth + DB | Supabase (PostgreSQL + RLS + Edge Functions Deno) |
| Pagos | Stripe (USD/EUR) + MercadoPago (COP) + Coinbase Commerce (USDC planeado) |
| Backend ML | Python en `api/` — cacao_predictor.py, iot_receiver.py |
| Deploy | Vercel (frontend + Python cron `/api/cacao_predictor` cada 6h) |
| Email | Resend via Edge Functions |

> ⚠️ CORRECCIÓN [2026-04-18]: El SRS v1 (2026-04-13) mencionaba Next.js App Router y Feature-Sliced Design (FSD). Ambas referencias eran incorrectas. Este proyecto usa React 19 + Vite. Ver SRS.md v2 para la especificación correcta.

## 2. Registro de Decisiones

- **[2026-04-18]**: SRS.md reescrito completamente (v2). Corrección crítica: Next.js → React 19 + Vite. Añadidas: especificaciones de 3 capas (B2C/B2B/Token bridge), modelo de datos completo (15+ tablas), tests de aceptación (AC-01 a AC-10), sección Octogent.
- **[2026-04-18]**: PRD.md creado. Incluye: 4 personas de usuario, Feature Matrix P0/P1/P2, 4 OKRs con KRs, roadmap Q1-Q4 2026, justificación del token economy dual.
- **[2026-04-18]**: Scaffold Octogent creado en `.octogent/`. 8 tentáculos: cacao-gotchi, b2b-marketplace, token-economy, blog-cms, supabase-backend, ml-pipeline, design-system, infra-devops.
- **[2026-04-15]**: Árbol de contexto HOT/WARM/COLD en `docs/`. Default load: `CLAUDE.md` + `docs/MAIN.md` = 90 líneas (96% ahorro vs carga naïve).
- **[2026-04-15]**: `vercel.json` requiere `"installCommand": "npm install --ignore-scripts"`. Sin esto, `@playwright/test` y `supabase` CLI fallan en el sandbox de Vercel con exit 127.
- **[2026-04-14]**: Phase F (CRM) completada ✅: `blog_posts`, `token_events`, `email_log`. AdminCRM con lead scoring, EditUserPanel, EmailsTable.
- **[2026-04-13]**: Ecosistema Multi-Agente: Claude Code para Backend/ML/RLS, Gemini para Frontend/gamificación. Modelo 1-1-1-1.

## 3. Tareas Críticas Pendientes (P0 — Launch Blockers)
- [cacao-gotchi] Conectar props reales de DB a `CauaGotchi` — actualmente hardcodeadas (85/60/90)
- [cacao-gotchi] Construir botones de cuidado (Water/Sunlight/Nutrients/Prune/Molasses) en TreeDetail.tsx
- [blog-cms] Sembrar `blog_posts` con 3-5 historias de Guardianes
- [supabase-backend] Crear migración 011_ml_predictions_log.sql
- [ml-pipeline] Refactorizar `predict_tree_health` a subfunciones ≤20 líneas (viola CauaCore §8)
- [ ] Pipeline ML Python — conectar `api/cacao_predictor.py` a producción
- [ ] Índices DB faltantes: compound `(caua_role, user_id)` en user_profiles, `(status)` en orders
- [ ] Auditoría RLS fases 1-4 → ver `docs/arch/database.md`

Ver `.octogent/tentacles/*/todo.md` para lista completa de tareas por dominio.
