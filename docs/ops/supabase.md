---
tags: [cold, ops, supabase, migrations]
---
# Supabase — Migrations y Edge Functions SOP

> Referencias: [[../archive/CATACION_SETUP.md]] · [[../archive/CACAO_MODULE_SETUP.md]]

## Link al Proyecto

```bash
export SUPABASE_ACCESS_TOKEN="tu_token"  # app.supabase.com → Avatar → Access Tokens
npx supabase link --project-ref kjygovuiphbxcdxeduco
```

## Correr Migrations

```bash
npx supabase db push          # aplica todas las migrations pendientes
npx supabase migration up     # alternativa
```

Manual (si CLI falla): Supabase Studio → SQL Editor → copiar contenido del archivo `.sql`

## Deploying Edge Functions

```bash
npx supabase functions deploy <nombre>
# Ejemplos:
npx supabase functions deploy award-tokens
npx supabase functions deploy notify-catacion-lead
npx supabase functions deploy create-stripe-checkout
```

## Edge Functions Activas

| Función | Propósito |
|---------|----------|
| `award-tokens` | Otorga beans/mazorcas en tree adoption, reads, harvest |
| `notify-catacion-lead` | Email a amaury@cauaculture.co en nuevo lead |
| `create-stripe-checkout` | Crea sesión de pago Stripe |
| `create-mp-preference` | Crea preferencia MercadoPago |
| `stripe-webhook` | Procesa eventos webhook de Stripe |
| `send-order-email` | Email confirmación de orden |

## Variables de Entorno en Edge Functions

Configurar en: Supabase Studio → Settings → Edge Functions
- `RESEND_API_KEY` — para funciones que envían email
- Stripe keys si aplica (desde Vercel, no Supabase)

## Generar Tipos TypeScript

```bash
npx supabase gen types typescript --local > src/types/database.types.ts
```
Correr después de cada migration nueva.
