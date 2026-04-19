---
tags: [cold, feature, leads]
status: done
---
# Feature: Catación — Lead Capture

> Estado: **DONE ✅** — en producción

## Qué es

Página `/catacion` para captura de leads premium con magic link OTP.
El lead recibe acceso temporal + notificación a amaury@cauaculture.co.

## Flujo

```
/catacion → form (nombre + email)
→ INSERT catacion_leads (Supabase)
→ Supabase envía magic link OTP al email del lead
→ Edge Function notify-catacion-lead → email a amaury@cauaculture.co
→ Lead accede con OTP → sesión autenticada
```

## DB

```sql
-- supabase/migrations/008_catacion_leads.sql
catacion_leads: id, email, full_name, status, source, created_at, updated_at
```

## Setup (si se necesita re-deploy)

```bash
npx supabase db push                                    # aplica 008_catacion_leads.sql
npx supabase functions deploy notify-catacion-lead     # edge function
# Env var en Supabase: RESEND_API_KEY
```

## Archivos Clave

| Archivo | Qué hace |
|---------|---------|
| `src/pages/Catacion.tsx` (34kb) | Página completa con form y animaciones |
| `supabase/functions/notify-catacion-lead/index.ts` | Envía email via Resend |
| `supabase/migrations/008_catacion_leads.sql` | Schema + RLS |
