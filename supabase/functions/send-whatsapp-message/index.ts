/**
 * send-whatsapp-message — outbound WhatsApp via Meta Cloud API.
 *
 * POST body:
 *   {
 *     to: string,                       // E.164 phone, e.g. "+573102227848"
 *     mode: "template" | "text",        // default "template"
 *     // mode=template:
 *     template_name?: string,           // e.g. "hello_world"
 *     language?: string,                // default "es"
 *     components?: unknown[],           // template variable bindings
 *     // mode=text (only valid in 24h customer service window):
 *     text?: string,
 *     // optional sync targets:
 *     log_to_hubspot?: boolean,         // default true
 *     hubspot_contact?: { firstname?, lastname? }
 *   }
 *
 * Returns:
 *   { meta_message_id, log_id, hubspot_engagement_id?, hubspot_contact_id? }
 *
 * Env required:
 *   META_APP_SECRET, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN
 *   Optional: HUBSPOT_API_KEY (skips HubSpot logging if absent)
 */

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import {
  GRAPH_API_BASE,
  appsecretProof,
  metaFetch,
  notConfiguredResponse,
  requireEnv,
} from '../_meta-shared/auth.ts';
import {
  findOrCreateContact,
  logCommunicationEngagement,
} from '../_meta-shared/hubspot.ts';
import { logOutbound } from '../_meta-shared/log.ts';
import { getCorsHeaders } from '../cors-config.ts';

const REQUIRED_ENV = [
  'META_APP_SECRET',
  'WHATSAPP_PHONE_NUMBER_ID',
  'WHATSAPP_ACCESS_TOKEN',
] as const;

serve(async (req) => {
  const cors = getCorsHeaders(req.headers.get('origin') ?? undefined);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const env = requireEnv(REQUIRED_ENV);
  if (!env.ok) return notConfiguredResponse(env.missing, cors);
  const { META_APP_SECRET, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN } = env.values;
  const HUBSPOT_API_KEY = Deno.env.get('HUBSPOT_API_KEY') ?? null;

  let body: {
    to?: string;
    mode?: 'template' | 'text';
    template_name?: string;
    language?: string;
    components?: unknown[];
    text?: string;
    log_to_hubspot?: boolean;
    hubspot_contact?: { firstname?: string; lastname?: string };
  };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  if (!body.to) {
    return new Response(JSON.stringify({ error: 'Missing `to`' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const mode = body.mode ?? 'template';
  let payload: Record<string, unknown>;
  let templateLabel: string | null = null;
  let messageBody = '';

  if (mode === 'template') {
    if (!body.template_name) {
      return new Response(JSON.stringify({ error: 'Missing `template_name`' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
    payload = {
      messaging_product: 'whatsapp',
      to: body.to,
      type: 'template',
      template: {
        name: body.template_name,
        language: { code: body.language ?? 'es' },
        components: body.components ?? [],
      },
    };
    templateLabel = body.template_name;
    messageBody = `[template:${body.template_name}] vars=${JSON.stringify(body.components ?? [])}`;
  } else {
    if (!body.text) {
      return new Response(JSON.stringify({ error: 'Missing `text` for mode=text' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
    payload = {
      messaging_product: 'whatsapp',
      to: body.to,
      type: 'text',
      text: { body: body.text, preview_url: false },
    };
    messageBody = body.text;
  }

  const proof = await appsecretProof(WHATSAPP_ACCESS_TOKEN, META_APP_SECRET);
  const url = `${GRAPH_API_BASE}/${WHATSAPP_PHONE_NUMBER_ID}/messages?appsecret_proof=${proof}`;

  const meta = await metaFetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const metaMessageId =
    (meta.body as { messages?: Array<{ id: string }> })?.messages?.[0]?.id ?? null;
  const status: 'sent' | 'failed' | 'rate_limited' = meta.ok
    ? 'sent'
    : meta.status === 429
    ? 'rate_limited'
    : 'failed';

  // Optional user_id from JWT (verify_jwt is on by default for this function)
  const authHeader = req.headers.get('authorization');
  let userId: string | null = null;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const jwt = authHeader.slice(7);
      const claims = JSON.parse(atob(jwt.split('.')[1]));
      if (typeof claims.sub === 'string') userId = claims.sub;
    } catch {
      // ignore — user_id is optional
    }
  }

  let hubspotContactId: string | null = null;
  let hubspotEngagementId: string | null = null;
  const wantsHubspot = body.log_to_hubspot !== false; // default true

  if (status === 'sent' && wantsHubspot && HUBSPOT_API_KEY) {
    const contact = await findOrCreateContact(HUBSPOT_API_KEY, {
      phone: body.to,
      firstname: body.hubspot_contact?.firstname,
      lastname: body.hubspot_contact?.lastname,
    });
    if (contact) {
      hubspotContactId = contact.id;
      hubspotEngagementId = await logCommunicationEngagement(HUBSPOT_API_KEY, {
        contactId: contact.id,
        direction: 'OUTGOING',
        body: `[OUTBOUND] ${messageBody}`,
        timestamp: Date.now(),
        metaMessageId: metaMessageId ?? undefined,
        channel: 'WHATS_APP',
      });
    }
  }

  const log = await logOutbound({
    channel: 'whatsapp',
    target_id: body.to,
    template: templateLabel,
    status,
    meta_message_id: metaMessageId,
    response_body: meta.rawBody,
    user_id: userId,
    hubspot_engagement_id: hubspotEngagementId,
    hubspot_contact_id: hubspotContactId,
  });

  return new Response(
    JSON.stringify({
      ok: meta.ok,
      meta_message_id: metaMessageId,
      log_id: log?.id ?? null,
      hubspot_contact_id: hubspotContactId,
      hubspot_engagement_id: hubspotEngagementId,
      meta_response: meta.body,
    }),
    {
      status: meta.ok ? 200 : meta.status,
      headers: { ...cors, 'Content-Type': 'application/json' },
    }
  );
});
