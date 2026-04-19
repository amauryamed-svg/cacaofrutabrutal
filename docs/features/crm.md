---
tags: [cold, feature, crm, b2b, fastapi, hubspot]
status: active
---
# Feature: CRM — Pipeline B2B + FastAPI + HubSpot

> Phase F (usuarios/tokens): done ✅ | Pipeline B2B: activo 🚀

## Arquitectura

```
Frontend (AdminCRM.tsx)
    ↓  fetch /api/crm/*  (X-CRM-Key header)
FastAPI CRM (api/crm.py)  ← Vercel Python serverless + mangum
    ↓  service_role key
Supabase PostgreSQL (crm_deals, crm_companies, crm_activities)
    ↓  HubSpot Private App Token
HubSpot CRM API v3 (Deals, Contacts, Companies)
```

## Endpoints FastAPI (`/api/crm`)

| Método | Ruta | Acción |
|--------|------|--------|
| GET | `/deals` | Lista todos los deals con empresa + última actividad |
| POST | `/deals` | Crea deal + company (si nueva) |
| GET | `/deals/{id}` | Deal detail + timeline de actividades |
| PATCH | `/deals/{id}` | Cambia stage / notas / valor |
| POST | `/deals/{id}/activities` | Registra nota, llamada, reunión… |
| POST | `/deals/{id}/sync` | Push deal → HubSpot (contact + company + deal) |
| GET | `/health` | Liveness check |

## Tablas de DB (migración 010)

```sql
crm_companies   -- empresa, domain, industry, hubspot_company_id
crm_deals       -- título, stage, valor, contacto, company_id, hubspot_deal_id
crm_activities  -- deal_id, type, description, metadata (audit trail JSONB)
```

**Stages del pipeline:**
`abierto → contactado → propuesta_enviada → propuesta_vista → negociacion → ganado / perdido`

## Variables de Entorno (Vercel Dashboard)

| Variable | Descripción |
|---------|-------------|
| `CRM_SECRET` | API key para header `X-CRM-Key` — generar con `openssl rand -base64 32` |
| `HUBSPOT_ACCESS_TOKEN` | Private App token con permisos: `crm.objects.deals.write`, `crm.objects.contacts.write`, `crm.objects.companies.write` |
| `VITE_CRM_SECRET` | Mismo valor que `CRM_SECRET` — expuesto al frontend (admin-only) |

## HubSpot Stage Mapping

| CAUA Stage | HubSpot Stage ID |
|-----------|-----------------|
| abierto | appointmentscheduled |
| contactado | qualifiedtobuy |
| propuesta_enviada | presentationscheduled |
| propuesta_vista | decisionmakerboughtin |
| negociacion | contractsent |
| ganado | closedwon |
| perdido | closedlost |

## Deal Activo: Andrea Rojas — CESA

- **Empresa:** Universidad CESA (`cesa.edu.co`)
- **Contacto:** Andrea Rojas · Turismo Sostenible · `andrea.rojas@cesa.edu.co`
- **Propuesta:** Catación Cinco Tiempos · 100,000 COP
- **Stage actual:** `propuesta_vista` (accedió a la propuesta el 2026-04-14)
- **Cotización:** `/cotizacion/andrea-rojas` — página ProposalAndreaRojas.tsx
- **Cierre esperado:** 2026-05-30

## Archivos Clave

| Archivo | Rol |
|---------|-----|
| `api/crm.py` | FastAPI app + Vercel entry (mangum) |
| `api/_hubspot.py` | HubSpot API v3 client |
| `src/lib/crmApi.ts` | TypeScript client para /api/crm/* |
| `src/components/dashboard/B2BPipeline.tsx` | Kanban + DealDetail panel |
| `src/components/dashboard/CotizacionForm.tsx` | Modal crear nueva cotización |
| `src/pages/AdminCRM.tsx` | Tab "Pipeline B2B" añadido |
| `supabase/migrations/010_crm_pipeline.sql` | Schema + seed Andrea Rojas |
