-- ═══════════════════════════════════════════════════════════════════
-- CAUA Corporation — CRM Pipeline: Companies · Deals · Activities
-- Migration 010 — FastAPI backend layer
-- ═══════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────
-- 1. COMPANIES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS crm_companies (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                text NOT NULL,
  domain              text,
  industry            text,
  country             text DEFAULT 'Colombia',
  hubspot_company_id  text,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

CREATE INDEX idx_crm_companies_domain ON crm_companies(domain);
CREATE INDEX idx_crm_companies_hubspot ON crm_companies(hubspot_company_id);

-- ─────────────────────────────────────────────
-- 2. DEALS (pipeline B2B)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS crm_deals (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title               text NOT NULL,
  company_id          uuid REFERENCES crm_companies(id) ON DELETE SET NULL,
  contact_name        text NOT NULL,
  contact_email       text NOT NULL,
  contact_role        text,
  stage               text NOT NULL DEFAULT 'abierto'
                        CHECK (stage IN (
                          'abierto',
                          'contactado',
                          'propuesta_enviada',
                          'propuesta_vista',
                          'negociacion',
                          'ganado',
                          'perdido'
                        )),
  value_cop           int NOT NULL DEFAULT 0,
  cotizacion_slug     text REFERENCES cotizaciones_b2b(slug) ON DELETE SET NULL,
  hubspot_deal_id     text,
  hubspot_synced_at   timestamptz,
  notes               text,
  expected_close_date date,
  owner_email         text DEFAULT 'amaury@cauacolombia.co',
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

CREATE INDEX idx_crm_deals_stage         ON crm_deals(stage);
CREATE INDEX idx_crm_deals_contact_email ON crm_deals(contact_email);
CREATE INDEX idx_crm_deals_company       ON crm_deals(company_id);
CREATE INDEX idx_crm_deals_hubspot       ON crm_deals(hubspot_deal_id);

-- ─────────────────────────────────────────────
-- 3. ACTIVITIES (audit trail)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS crm_activities (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id     uuid NOT NULL REFERENCES crm_deals(id) ON DELETE CASCADE,
  type        text NOT NULL CHECK (type IN (
                'nota',
                'email_enviado',
                'llamada',
                'reunion',
                'propuesta_vista',
                'stage_change',
                'hubspot_sync',
                'cotizacion_creada'
              )),
  description text,
  metadata    jsonb DEFAULT '{}',
  created_by  text DEFAULT 'system',
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX idx_crm_activities_deal    ON crm_activities(deal_id);
CREATE INDEX idx_crm_activities_type    ON crm_activities(type);
CREATE INDEX idx_crm_activities_created ON crm_activities(created_at DESC);

-- ─────────────────────────────────────────────
-- 4. RLS — solo service_role (FastAPI usa service_role key)
-- ─────────────────────────────────────────────
ALTER TABLE crm_companies  ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_deals      ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_activities ENABLE ROW LEVEL SECURITY;

-- Solo el backend (service_role) accede al CRM
CREATE POLICY "crm_service_only" ON crm_companies  USING (auth.role() = 'service_role');
CREATE POLICY "crm_service_only" ON crm_deals      USING (auth.role() = 'service_role');
CREATE POLICY "crm_service_only" ON crm_activities USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────
-- 5. SEED — Universidad CESA + Andrea Rojas
-- ─────────────────────────────────────────────
WITH company AS (
  INSERT INTO crm_companies (name, domain, industry, country)
  VALUES ('Universidad CESA', 'cesa.edu.co', 'Educación Superior', 'Colombia')
  ON CONFLICT DO NOTHING
  RETURNING id
),
deal AS (
  INSERT INTO crm_deals (
    title, company_id, contact_name, contact_email, contact_role,
    stage, value_cop, cotizacion_slug, notes, expected_close_date
  )
  SELECT
    'Catación Cinco Tiempos — CESA',
    company.id,
    'Andrea Rojas',
    'andrea.rojas@cesa.edu.co',
    'Turismo Sostenible',
    'propuesta_vista',
    100000,
    'andrea-rojas',
    'Propuesta vista el 2026-04-14. Interés en experiencia premium Cinco Tiempos para grupo académico.',
    '2026-05-30'
  FROM company
  RETURNING id
)
INSERT INTO crm_activities (deal_id, type, description, metadata, created_by)
SELECT
  deal.id,
  'propuesta_vista',
  'Andrea Rojas accedió a la propuesta Cinco Tiempos de Cacao',
  '{"source": "web", "page": "/cotizacion/andrea-rojas", "cotizacion_slug": "andrea-rojas"}'::jsonb,
  'system'
FROM deal;
