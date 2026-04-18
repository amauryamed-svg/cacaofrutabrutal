# Documento de Memoria y Decisiones Arquitectónicas (memory.md)

Este documento es el cerebro de contexto para Cacao Fruta Brutal. Todo agente y subagente debe leer este archivo antes de comenzar a codificar para asegurar que las decisiones tomadas previamente se respetan.

## 1. Decisiones Base
- **Frontend**: React 19 + Vite 8 + React Router DOM v7 (SPA — NOT Next.js). Deployado a Vercel como build estático.
- **Backend/DB**: Supabase (PostgreSQL + Auth + Edge Functions Deno).
- **ML**: Python (FastAPI + scikit-learn). Deployado en `api/` como serverless en Vercel.
- **Arquitectura de UI**: `src/pages/` + `src/components/{domain}/`. Inline styles con `BRAND` constants. Tailwind solo para utilidades.
- **Pagos**: Stripe (USD/EUR) + MercadoPago (COP) + Coinbase Commerce (USDC planeado).

> ⚠️ CORRECCIÓN [2026-04-18]: El SRS v1 (2026-04-13) mencionaba Next.js App Router y Feature-Sliced Design (FSD). Ambas referencias eran incorrectas. Este proyecto usa React 19 + Vite, nunca ha usado Next.js. Ver SRS.md v2 para la especificación correcta.

## 2. Registro de Decisiones Importantes
*(Agrega nuevas decisiones arquitectónicas aquí con fecha, contexto y la decisión tomada)*

- **[2026-04-13]**: Creado el documento `SRS.md` v1 definiendo el ecosistema Multi-Agente usando Claude Code. Modelo de negocio 1-1-1-1. NOTA: SRS v1 contenía referencias incorrectas a Next.js — corregidas en v2.
- **[2026-04-18]**: SRS.md reescrito completamente (v2). Corrección crítica: Next.js → React 19 + Vite. Añadidas: especificaciones de 3 capas (B2C/B2B/Token bridge), modelo de datos completo (15+ tablas), tests de aceptación (AC-01 a AC-10), sección Octogent.
- **[2026-04-18]**: PRD.md creado. Incluye: 4 personas de usuario (Eco-inversor, Consumidor colombiano, Comprador B2B, Guardian farmer), Feature Matrix P0/P1/P2, 4 OKRs con KRs, roadmap Q1-Q4 2026, justificación del token economy dual.
- **[2026-04-18]**: Scaffold Octogent creado en `.octogent/`. 8 tentáculos: cacao-gotchi, b2b-marketplace, token-economy, blog-cms, supabase-backend, ml-pipeline, design-system, infra-devops. Cada uno con CONTEXT.md + todo.md + NOTES.md. Ver `.octogent/config.json` para registro completo.

## 3. Tareas Críticas Pendientes (P0 — Launch Blockers)
- [cacao-gotchi] Conectar props reales de DB a `CauaGotchi` — actualmente hardcodeadas (85/60/90)
- [cacao-gotchi] Construir botones de cuidado (Water/Sunlight/Nutrients/Prune/Molasses) en TreeDetail.tsx
- [blog-cms] Sembrar `blog_posts` con 3-5 historias de Guardianes
- [supabase-backend] Crear migración 011_ml_predictions_log.sql
- [ml-pipeline] Refactorizar `predict_tree_health` a subfunciones ≤20 líneas (viola CauaCore §8)

Ver `.octogent/tentacles/*/todo.md` para lista completa de tareas por dominio.
