# memory.md — Registro de Decisiones Arquitectónicas

> Ambos agentes (Claude Code y Gemini) leen este archivo antes de codificar.
> Agregar nuevas decisiones con `[YYYY-MM-DD]` al inicio de la sección 2.

---

## 1. Stack Activo

| Capa | Tecnología |
|------|-----------|
| Frontend | **React 18 + Vite + TypeScript + TailwindCSS** (NO Next.js) |
| Routing | React Router v7 |
| Animaciones | Framer Motion |
| Auth + DB | Supabase (PostgreSQL + RLS) |
| Pagos | Stripe Checkout + MercadoPago |
| Backend ML | Python en `api/` — cacao_predictor.py, iot_receiver.py |
| Deploy | Vercel (frontend + Python cron `/api/cacao_predictor` cada 6h) |
| Email | Resend via Edge Functions |

## 2. Registro de Decisiones

- **[2026-04-15]** Árbol de contexto HOT/WARM/COLD en `docs/`. Default load: `CLAUDE.md` + `docs/MAIN.md` = 90 líneas (96% ahorro vs carga naïve). Claude Code = `api/` + `supabase/`. Gemini = `src/`.

- **[2026-04-15]** `vercel.json` requiere `"installCommand": "npm install --ignore-scripts"`. Sin esto, `@playwright/test` y `supabase` CLI fallan en el sandbox de Vercel con exit 127.

- **[2026-04-14]** Phase F (CRM) completada ✅: `blog_posts`, `token_events`, `email_log`. AdminCRM con lead scoring (🫘 mazorcas), EditUserPanel, EmailsTable. Ver `docs/features/crm.md`.

- **[2026-04-13]** Ecosistema Multi-Agente: Claude Code para Backend/ML/RLS, Gemini para Frontend/gamificación. Modelo 1-1-1-1 en `docs/context/1111-model.md`.

## 3. Tareas Críticas Pendientes

- [ ] Dashboard MVP "Cacao-gotchi" — UI del Gemelo Digital → `docs/features/cacao-gotchi.md`
- [ ] Pipeline ML Python — conectar `api/cacao_predictor.py` a producción
- [ ] Índices DB faltantes: compound `(caua_role, user_id)` en user_profiles, `(status)` en orders
- [ ] Auditoría RLS fases 1-4 → ver `docs/arch/database.md`
