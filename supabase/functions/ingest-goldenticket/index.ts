/**
 * ingest-goldenticket · Supabase Edge Function
 *
 * Receiver del beacon POST de cta-telemetry.js extendido (CauaColombia.co
 * /pages/goldenticket). Inserta cada evento en `goldenticket_events`.
 *
 * CRM360 Phase 1.5 (2026-05-07).
 *
 * Endpoints:
 *   POST  /ingest-goldenticket   ← single event from storefront
 *   OPTIONS                       ← CORS preflight
 *
 * Required secrets:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * CORS: allows cauacolombia.co + caua-colombia-sas.myshopify.com only.
 *
 * Sample payload (any of these event_type values):
 *   {
 *     "event": "page_view" | "cta_click" | "hito_click" | "share_click" |
 *              "redeem_click" | "form_submit_click" | "form_submit",
 *     "visitor_id": "uuid",
 *     "session_id": "uuid",
 *     "cohort": "udistrital" | "atmospherex" | "aneiap" | "mixed" | null,
 *     "utm": { utm_source, utm_medium, utm_campaign, utm_content, utm_term },
 *     "cta_name": "gallardo-hito-1-adopt",
 *     "cta_surface": "gallardo100",
 *     "cta_destination": "cfb-adoptar",
 *     "hito_n": 1,
 *     "page_path": "/pages/goldenticket?...",
 *     "page_title": "...",
 *     "referrer": "https://cauacolombia.co/...",
 *     "locale": "es",
 *     "timestamp_iso": "2026-05-07T14:00:00.000Z",
 *     "email": "user@udistrital.edu.co"  // only on form_submit
 *   }
 */

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const ALLOWED_ORIGINS = new Set([
  'https://cauacolombia.co',
  'https://www.cauacolombia.co',
  'https://caua-colombia-sas.myshopify.com',
]);

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.has(origin) ? origin : '*';
  return {
    'Access-Control-Allow-Origin':  allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
    'Access-Control-Max-Age':       '86400',
  };
}

function jsonResponse(body: unknown, status = 200, origin: string | null = null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

const EVENT_TYPES = new Set([
  'page_view',
  'cta_click',
  'hito_click',
  'share_click',
  'redeem_click',
  'form_submit_click',
  'form_submit',
]);

function safeStr(v: unknown, max = 1024): string | null {
  if (v == null) return null;
  const s = String(v);
  return s.length > max ? s.slice(0, max) : s;
}

function safeUuid(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  // RFC4122 v4-ish: 8-4-4-4-12 hex
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v) ? v : null;
}

function safeInt(v: unknown, min: number, max: number): number | null {
  const n = typeof v === 'number' ? v : parseInt(String(v), 10);
  if (Number.isNaN(n)) return null;
  if (n < min || n > max) return null;
  return Math.floor(n);
}

function safeJson(v: unknown): unknown {
  if (v == null) return {};
  if (typeof v === 'object') return v;
  return {};
}

function safeIp(req: Request): string | null {
  const xff = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip');
  if (!xff) return null;
  const first = xff.split(',')[0].trim();
  // Validate basic IPv4/IPv6 shape
  if (!/^([0-9]{1,3}(\.[0-9]{1,3}){3}|[0-9a-f:]+)$/i.test(first)) return null;
  return first;
}

serve(async (req) => {
  const origin = req.headers.get('origin');

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405, origin);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'invalid_json' }, 400, origin);
  }

  const event_type = safeStr(body.event);
  if (!event_type || !EVENT_TYPES.has(event_type)) {
    return jsonResponse({ error: 'invalid_event_type', received: event_type }, 400, origin);
  }

  const visitor_id = safeUuid(body.visitor_id);
  if (!visitor_id) {
    return jsonResponse({ error: 'invalid_visitor_id' }, 400, origin);
  }

  const row = {
    visitor_id,
    session_id:      safeUuid(body.session_id),
    event_type,
    hito_n:          safeInt(body.hito_n, 1, 4),
    cohort:          safeStr(body.cohort, 64),
    utm:             safeJson(body.utm),
    cta_name:        safeStr(body.cta_name, 128),
    cta_surface:     safeStr(body.cta_surface, 128),
    cta_destination: safeStr(body.cta_destination, 256),
    page_path:       safeStr(body.page_path, 512),
    page_title:      safeStr(body.page_title, 256),
    referrer:        safeStr(body.referrer, 512),
    locale:          safeStr(body.locale, 16),
    email:           safeStr(body.email, 256),
    payload:         safeJson(body.payload),
    ip:              safeIp(req),
    user_agent:      safeStr(req.headers.get('user-agent'), 512),
    origin:          safeStr(origin, 256),
    occurred_at:     safeStr(body.timestamp_iso, 64) || new Date().toISOString(),
  };

  const { error } = await supabase.from('goldenticket_events').insert(row);
  if (error) {
    console.error('[ingest-goldenticket] insert failed', error);
    return jsonResponse({ error: 'insert_failed', detail: error.message }, 500, origin);
  }

  return jsonResponse({ ok: true, event: event_type, visitor_id }, 200, origin);
});
