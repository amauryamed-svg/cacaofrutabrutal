---
tags: [hot, agents, ownership]
---
# Mapa de Propiedad — Claude Code vs Gemini

## División por Directorio

| Directorio | Agente | Descripción |
|-----------|--------|-------------|
| `api/` | **Claude Code** | Python ML: cacao_predictor.py, iot_receiver.py, ml_predictor.py |
| `supabase/migrations/` | **Claude Code** | SQL migrations (001→009) |
| `supabase/functions/` | **Claude Code** | Edge Functions TypeScript |
| `scripts/` | **Claude Code** | health.py, install-hooks.sh, pre-commit-hook |
| `vercel.json` | **Claude Code** | Deploy config, crons, headers de seguridad |
| `src/` | **Gemini** | React FSD: pages/, components/, hooks/, context/ |
| `src/design/` | **Gemini** | Design system, tokens, paleta |
| `src/types/` | **Ambos** | database.types.ts — generado, no editar manual |
| `public/` | **Gemini** | Assets estáticos |
| `caua-brand/` | **Gemini** | Brand assets |
| `docs/` | **Ambos** | Este árbol de contexto — colaborativo |
| `memory.md` | **Ambos** | ADR log — ambos leen y escriben |

## Protocolo de Colaboración

```
Decisión de DB schema → Claude diseña → Gemini adapta tipos en src/types/
Nuevo componente → Gemini propone → Claude revisa si necesita Edge Function
Deploy → Claude ejecuta → Gemini verifica en browser
Bug cross-layer → memory.md documenta → ambos coordinan fix
```

## Zonas de Conflicto Potencial

- `src/lib/supabase.ts` — Gemini usa, Claude no modifica
- `src/types/database.types.ts` — generado por CLI, ninguno edita manual
- `vercel.json` — Claude es dueño, Gemini no modifica

## Comunicación entre Agentes

Toda decisión que afecta a ambos dominios se registra en `memory.md` con fecha.
Formato: `- **[YYYY-MM-DD]** Decisión tomada. Razón. Quién implementa.`
