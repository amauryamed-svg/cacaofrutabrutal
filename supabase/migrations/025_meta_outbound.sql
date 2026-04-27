-- 025_meta_outbound.sql
-- Tables for Meta (WhatsApp / Instagram / Facebook Page) outbound + inbound message audit.
-- Used by Edge Functions: send-whatsapp-message, post-instagram, post-facebook-page, meta-webhook.

-- ── Outbound log ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.meta_outbound_log (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel                  text NOT NULL CHECK (channel IN ('whatsapp', 'instagram', 'facebook_page')),
  target_id                text NOT NULL,
  template                 text,
  status                   text NOT NULL CHECK (status IN ('sent', 'failed', 'rate_limited')),
  meta_message_id          text,
  response_body            text,
  user_id                  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  hubspot_engagement_id    text,
  hubspot_contact_id       text,
  created_at               timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meta_outbound_log_user_id
  ON public.meta_outbound_log (user_id);
CREATE INDEX IF NOT EXISTS idx_meta_outbound_log_channel_created
  ON public.meta_outbound_log (channel, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_meta_outbound_log_meta_message_id
  ON public.meta_outbound_log (meta_message_id);

ALTER TABLE public.meta_outbound_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS meta_outbound_log_select_own ON public.meta_outbound_log;
CREATE POLICY meta_outbound_log_select_own
  ON public.meta_outbound_log
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- service_role bypasses RLS and is the only writer (Edge Functions).

-- ── Inbound messages ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.meta_inbound_messages (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel                  text NOT NULL CHECK (channel IN ('whatsapp', 'instagram', 'facebook_page')),
  from_id                  text NOT NULL,
  message_id               text NOT NULL UNIQUE,
  payload                  jsonb NOT NULL,
  hubspot_engagement_id    text,
  hubspot_contact_id       text,
  processed_at             timestamptz,
  created_at               timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meta_inbound_messages_channel_created
  ON public.meta_inbound_messages (channel, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_meta_inbound_messages_from_id
  ON public.meta_inbound_messages (from_id);

ALTER TABLE public.meta_inbound_messages ENABLE ROW LEVEL SECURITY;
-- No SELECT policy → only service_role (admin) can read inbound payloads.
