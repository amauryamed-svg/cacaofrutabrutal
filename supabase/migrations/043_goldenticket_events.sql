-- 043_goldenticket_events.sql
-- CRM360 Phase 1.5 (2026-05-07) — behavior tracking 360° del journey GoldenTicket
-- en CauaColombia.co. Recibe eventos via Edge Function `ingest-goldenticket`
-- desde el storefront (cta-telemetry.js extendido).
--
-- Cohort tagging: derivado de utm_campaign en client-side (udistrital |
-- atmospherex | aneiap | mixed | raw). Verificable post-form via email domain.
--
-- Identidad bridge: visitor_id (UUID generado client-side, persiste en
-- localStorage) + email (populated post-form-submit). El email link permite
-- correlacionar pre-checkout (anonymous behavior) con identidad CFB
-- Supabase auth en Phase 2.

CREATE TABLE IF NOT EXISTS goldenticket_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id   uuid NOT NULL,
  session_id   uuid,
  event_type   text NOT NULL CHECK (event_type IN (
    'page_view',
    'cta_click',
    'hito_click',
    'share_click',
    'redeem_click',
    'form_submit_click',
    'form_submit'
  )),
  hito_n       int CHECK (hito_n IS NULL OR (hito_n BETWEEN 1 AND 4)),
  cohort       text,                 -- 'udistrital' | 'atmospherex' | 'aneiap' | 'mixed' | raw campaign
  utm          jsonb DEFAULT '{}',   -- { utm_source, utm_medium, utm_campaign, utm_content, utm_term }
  cta_name     text,
  cta_surface  text,
  cta_destination text,
  page_path    text,
  page_title   text,
  referrer     text,
  locale       text,
  email        text,                 -- populated post-form-submit (visitor → identity link)
  payload      jsonb DEFAULT '{}',   -- raw payload for any extras
  ip           inet,
  user_agent   text,
  origin       text,                 -- request origin header (cors validation)
  occurred_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_goldenticket_events_visitor   ON goldenticket_events (visitor_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_goldenticket_events_cohort    ON goldenticket_events (cohort, occurred_at) WHERE cohort IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_goldenticket_events_email     ON goldenticket_events (email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_goldenticket_events_event     ON goldenticket_events (event_type, occurred_at);
CREATE INDEX IF NOT EXISTS idx_goldenticket_events_occurred  ON goldenticket_events (occurred_at DESC);

-- RLS: lectura solo via service_role (Edge Function), escritura idem.
-- Reportes JTBD corren con SERVICE_ROLE_KEY en script Node.
ALTER TABLE goldenticket_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access" ON goldenticket_events
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

COMMENT ON TABLE goldenticket_events IS
  'CRM360 Phase 1.5 · behavior tracking del journey /pages/goldenticket en CauaColombia.co. Eventos vienen del storefront via Edge Function ingest-goldenticket.';
COMMENT ON COLUMN goldenticket_events.visitor_id IS
  'UUID generado client-side (localStorage caua_visitor_id), persistente cross-session.';
COMMENT ON COLUMN goldenticket_events.session_id IS
  'UUID por tab session (sessionStorage caua_session_id).';
COMMENT ON COLUMN goldenticket_events.cohort IS
  'Derivado de utm_campaign client-side. udistrital|atmospherex|aneiap|mixed|raw.';
COMMENT ON COLUMN goldenticket_events.email IS
  'Populated cuando event_type=form_submit. Bridge visitor_id ↔ identity.';
