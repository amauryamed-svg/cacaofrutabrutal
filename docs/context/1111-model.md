---
tags: [hot, strategy, scale]
---
# Modelo 1-1-1-1 — Estrategia y Escala

> Por qué existe este proyecto y cómo escala a 100k usuarios.

## El Modelo

| Pilar | Definición |
|-------|-----------|
| **1 Framework** | Vite + React + Supabase + Python ML — no cambiar stack |
| **1 Target** | Eco-inversores (USA/Europa) · $10 USD/año suscripción |
| **1 Canal** | Gamificación social (TikTok/Reels) mostrando impacto real |
| **1 Feature** | Gemelo Digital "Cacao-gotchi" — salud del árbol, CO2, cosecha |

**Meta operativa:** $1M USD ingresos (100k usuarios) · <$10k USD/año mantenimiento

---

## Reglas de Escala a 100k

### Supabase / PostgreSQL
- RLS: siempre `(select auth.uid())` — cacheable por el planner
- Security definer para founder queries (evita N+1): `get_founder_user_ids()`
- Índices `btree` en toda columna usada en política RLS
- Frontend filtra explícito `.eq('user_id', userId)` — RLS es seguridad, no filtro
- Paginación siempre — nunca `SELECT *` sin límite

### Vercel / Edge
- Edge Functions stateless — sin estado local entre ejecuciones
- Cron Python: `/api/cacao_predictor` cada 6h (configurado en `vercel.json`)
- `installCommand: npm install --ignore-scripts` — evita fallos en sandbox

### Python ML
- Funciones max 20 líneas — composición, no monolitos
- Datos pseudonimizados antes de entrar al feature store
- Respuestas cacheadas en `tree_updates` tabla — no llamar Open-Meteo por usuario

---

## Economía de Tokens

```
Default load = CLAUDE.md (44l) + docs/MAIN.md (35l) = 79 líneas
HOT load     = + context/ (~120l)                   = 199 líneas total
WARM load    = + 1 arch/ (~60l)                     = ~260 líneas
COLD load    = + 1 feature/ (~50l)                  = ~310 líneas
Naïve load   = todos los MDs del root               = 2.422 líneas
Ahorro real  = 87% en sesión típica
```
