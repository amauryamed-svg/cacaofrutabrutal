---
tags: [hot, navigation, root]
---
# CAUA Context Tree — docs/MAIN.md

> Punto de entrada del árbol de contexto. Navega por temperatura de carga.

## Temperatura de Carga

| Nivel | Cuándo cargar | Líneas aprox. |
|-------|--------------|--------------|
| 🔴 ROOT | Siempre — entry de cada agente | `CLAUDE.md` (45l) · `GEMINI.md` (38l) |
| 🔥 HOT | Siempre, junto al ROOT | `context/` — 3 archivos · ~135 líneas |
| 🌡️ WARM | Al activar ese dominio | `arch/` — 3 archivos · ~170 líneas |
| 🧊 COLD ops | Solo al deployar | `ops/` — 2 archivos · ~100 líneas |
| 🧊 COLD features | Solo esa feature | `features/` — 3 archivos · ~160 líneas |
| 📄 PROPOSALS | Solo para comercial | `proposals/` — HTML + INDEX |
| 🗄️ ARCHIVE | Nunca — solo referencia humana | `archive/` — 13 originales |

---

## 🔥 HOT — Cargar siempre

- [[context/1111-model]] — Estrategia de negocio, reglas de escala, meta 100k usuarios
- [[context/constraints]] — CauaCore §8 — lo que NUNCA se hace
- [[context/ownership]] — Quién toca qué: Claude Code vs Gemini
- [[context/ui-ux-bar]] — Immersive Experience Bar — aplica a toda página nueva

---

## 🌡️ WARM — Cargar por dominio activo

| Dominio activo | Archivo |
|---------------|---------|
| DB / RLS / Supabase | [[arch/database]] |
| Python ML / `api/` | [[arch/python-api]] |
| Seguridad / Headers / CORS | [[arch/security]] |

---

## 🧊 COLD — Cargar solo cuando la tarea lo requiere

**Operaciones:**
- [[ops/deploy]] — Vercel deploy SOP + troubleshooting
- [[ops/supabase]] — Migrations workflow + Edge Functions

**Features:**
- [[features/cacao-gotchi]] — Gemelo Digital, tree adoption, ML twin *(en desarrollo)*
- [[features/catacion]] — Lead capture magic link OTP *(done ✅)*
- [[features/crm]] — CRM Phase F: AdminCRM, tokens, email log *(done ✅)*

**Propuestas comerciales:**
- [[proposals/INDEX]] — Cotizaciones, pitch deck, Cinco Tiempos (HTML → PDF)

---

## Mapa de Directorios del Proyecto

```
cacaofrutabrutal/
├── CLAUDE.md          ← 🔴 Entry Claude Code
├── GEMINI.md          ← 🔴 Entry Gemini
├── memory.md          ← ADR log — ambos agentes
├── index.html         ← Vite entry (no mover)
├── vercel.json        ← Deploy config + crons + security headers
├── package.json       ← Dependencias + scripts npm
├── tsconfig*.json     ← TypeScript config (3 archivos)
├── vite.config*.ts    ← Vite build config
├── eslint.config.js   ← Linting
├── skills-lock.json   ← Claude Code skills lock
│
├── src/               ← 🔵 Gemini — React FSD
│   ├── pages/         ← 14 rutas
│   ├── components/    ← auction/ blog/ dashboard/ fund/ ritual/ ui/
│   ├── context/       ← AuthContext
│   ├── hooks/         ← Custom hooks
│   ├── lib/           ← supabase.ts
│   ├── design/        ← tokens.ts
│   └── types/         ← database.types.ts (generado)
│
├── api/               ← 🔴 Claude Code — Python ML
│   ├── cacao_predictor.py
│   ├── iot_receiver.py
│   ├── ml_predictor.py
│   └── requirements.txt
│
├── supabase/          ← 🔴 Claude Code — DB + Edge Functions
│   ├── migrations/    ← 001→009
│   └── functions/     ← 6 Edge Functions
│
├── scripts/           ← 🔴 Claude Code — Automatización
│   ├── health.py
│   ├── health-monitor.py
│   ├── install-hooks.sh
│   ├── pre-commit-hook
│   ├── DEPLOY.sh
│   ├── deploy.ps1
│   └── start-health-monitor.bat
│
├── public/            ← Assets estáticos
├── caua-brand/        ← Brand assets
│
└── docs/              ← Este árbol de contexto
    ├── MAIN.md        ← (este archivo)
    ├── context/       ← 🔥 HOT (3 archivos)
    ├── arch/          ← 🌡️ WARM (3 archivos)
    ├── ops/           ← 🧊 COLD deploy (2 archivos)
    ├── features/      ← 🧊 COLD features (3 archivos)
    ├── proposals/     ← 📄 Comercial (6 HTML + INDEX)
    └── archive/       ← 🗄️ 13 originales preservados
```
