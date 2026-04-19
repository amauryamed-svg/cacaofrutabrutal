# CAUA Corporation — Gemini (Frontend)

> Contexto completo: [[docs/MAIN.md]] | Ownership: `src/`

## Tu dominio
Gemini es responsable de todo en `src/`: componentes React, páginas, hooks, design system, animaciones (Framer Motion), TailwindCSS.

## Stack Frontend
React 18 + Vite + TypeScript + TailwindCSS + Framer Motion + React Router v7

## Arquitectura: Feature-Sliced Design (FSD)
```
src/
├── pages/        # Rutas (Landing, Dashboard, Adoptar, Catacion, AdminCRM…)
├── components/   # Features: auction/ blog/ dashboard/ fund/ ritual/ ui/
├── context/      # AuthContext
├── hooks/        # Custom hooks (useCocoaTrees, etc.)
├── lib/          # supabase.ts — cliente Supabase
├── design/       # tokens.ts — design system
└── types/        # database.types.ts — generado por Supabase
```

## Reglas de Diseño — CauaCore §8
- Backgrounds: **hex values ONLY** — nunca `var(--color)` ni CSS custom properties
- NUNCA pastel gradients — **brutalist luxury** only
- Sin `localStorage` — usar Supabase o React context
- Componentes max ~150 líneas; split si crece más

## Comunicación con Backend
- Cliente: `src/lib/supabase.ts`
- Auth: `context/AuthContext.tsx`
- Tipos DB: `src/types/database.types.ts` (regenerar con `npx supabase gen types typescript --local`)
- Edge Functions: llamar via `supabase.functions.invoke('nombre')`

## Leer antes de codificar
- [[docs/context/constraints.md]] — reglas no negociables
- [[docs/context/ownership.md]] — qué toca Claude, qué tocas tú
- [[memory.md]] — decisiones arquitectónicas activas
