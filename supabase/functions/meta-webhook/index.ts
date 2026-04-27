/**
 * meta-webhook — unified inbound receiver for WhatsApp / Instagram / Facebook Page.
 *
 * GET  /meta-webhook?hub.mode=subscribe&hub.verify_token=...&hub.challenge=...
 *      → echoes hub.challenge if hub.verify_token === META_VERIFY_TOKEN
 *
 * POST /meta-webhook
 *      → verifies x-hub-signature-256 (HMAC SHA-256 with META_APP_SECRET),
 *        dispatches by `object` field of payload, persists to
 *        meta_inbound_messages (idempotent on message_id), and — for
 *        WhatsApp inbound — also logs the engagement to HubSpot if
 *        HUBSPOT_API_KEY is set.
 *
 * Configured with verify_jwt = false (Meta does not send Supabase JWTs).
 *
 * Env required:
 *   META_APP_SECRET, META_VERIFY_TOKEN
 *   Optional: HUBSPOT_API_KEY
 */

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { verifyMetaSignature, requireEnv } from '../_meta-shared/auth.ts';
import { findOrCreateContact, logCommunicationEngagement } from '../_meta-shared/hubspot.ts';
import { logInbound, type Channel } from '../_meta-shared/log.ts';

const REQUIRED_ENV = ['META_APP_SECRET', 'META_VERIFY_TOKEN'] as const;

type WhatsAppMessage = {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  button?: { text: string };
  interactive?: { type: string; [k: string]: unknown };
};

type WhatsAppContact = {
  wa_id: string;
  profile?: { name?: string };
};

serve(async (req) => {
  // ── GET handshake ──────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const env = requireEnv(REQUIRED_ENV);
    if (!env.ok) return new Response('Server misconfigured', { status: 503 });
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');
    if (mode === 'subscribe' && token === env.values.META_VERIFY_TOKEN && challenge) {
      return new Response(challenge, { status: 200, headers: { 'Content-Type': 'text/plain' } });
    }
    return new Response('Forbidden', { status: 403 });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const env = requireEnv(REQUIRED_ENV);
  if (!env.ok) return new Response('Server misconfigured', { status: 503 });
  const HUBSPOT_API_KEY = Deno.env.get('HUBSPOT_API_KEY') ?? null;

  // ── POST: verify signature on RAW body before parsing ───────────────────
  const rawBody = await req.text();
  const signature = req.headers.get('x-hub-signature-256');
  const valid = await verifyMetaSignature(rawBody, signature, env.values.META_APP_SECRET);
  if (!valid) {
    return new Response('Invalid signature', { status: 401 });
  }

  let payload: { object?: string; entry?: unknown[] };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  // Always 200 OK to Meta — log errors internally but do not retry-loop.
  try {
    await dispatch(payload, HUBSPOT_API_KEY);
  } catch (e) {
    console.error('[meta-webhook] dispatch error', e);
  }
  return new Response('EVENT_RECEIVED', { status: 200 });
});

async function dispatch(
  payload: { object?: string; entry?: unknown[] },
  hubspotKey: string | null
): Promise<void> {
  const { object, entry } = payload;
  if (!Array.isArray(entry)) return;

  if (object === 'whatsapp_business_account') {
    for (const e of entry as Array<{ changes?: Array<{ value?: unknown; field?: string }> }>) {
      for (const change of e.changes ?? []) {
        if (change.field !== 'messages') continue;
        await handleWhatsAppChange(change.value as never, hubspotKey);
      }
    }
    return;
  }

  if (object === 'instagram') {
    for (const e of entry as Array<{ id: string; changes?: Array<unknown>; messaging?: Array<unknown> }>) {
      for (const change of e.changes ?? []) {
        await logInbound({
          channel: 'instagram',
          from_id: e.id,
          message_id: `ig:${e.id}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
          payload: change,
        });
      }
    }
    return;
  }

  if (object === 'page') {
    for (const e of entry as Array<{ id: string; changes?: Array<unknown>; messaging?: Array<unknown> }>) {
      for (const change of e.changes ?? []) {
        await logInbound({
          channel: 'facebook_page',
          from_id: e.id,
          message_id: `fb:${e.id}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
          payload: change,
        });
      }
    }
  }
}

async function handleWhatsAppChange(
  value: {
    messaging_product?: string;
    metadata?: { phone_number_id?: string; display_phone_number?: string };
    contacts?: WhatsAppContact[];
    messages?: WhatsAppMessage[];
    statuses?: unknown[];
  },
  hubspotKey: string | null
): Promise<void> {
  const messages = value.messages ?? [];
  const contacts = value.contacts ?? [];

  for (const msg of messages) {
    const channel: Channel = 'whatsapp';

    // Resolve contact name
    const contact = contacts.find((c) => c.wa_id === msg.from);
    const profileName = contact?.profile?.name ?? '';

    // Build a readable body text
    let messageBody = `[${msg.type}]`;
    if (msg.type === 'text' && msg.text?.body) messageBody = msg.text.body;
    else if (msg.type === 'button' && msg.button?.text) messageBody = `[button] ${msg.button.text}`;
    else if (msg.type === 'interactive') messageBody = `[interactive] ${JSON.stringify(msg.interactive)}`;

    let hubspotContactId: string | null = null;
    let hubspotEngagementId: string | null = null;

    if (hubspotKey) {
      const [firstname, ...rest] = profileName.trim().split(/\s+/);
      const contactRecord = await findOrCreateContact(hubspotKey, {
        phone: msg.from,
        firstname: firstname || undefined,
        lastname: rest.join(' ') || undefined,
      });
      if (contactRecord) {
        hubspotContactId = contactRecord.id;
        hubspotEngagementId = await logCommunicationEngagement(hubspotKey, {
          contactId: contactRecord.id,
          direction: 'INCOMING',
          body: `[INBOUND] ${messageBody}`,
          timestamp: Number(msg.timestamp) * 1000 || Date.now(),
          metaMessageId: msg.id,
          channel: 'WHATS_APP',
        });
      }
    }

    await logInbound({
      channel,
      from_id: msg.from,
      message_id: msg.id,
      payload: { message: msg, profile_name: profileName },
      hubspot_contact_id: hubspotContactId,
      hubspot_engagement_id: hubspotEngagementId,
    });
  }

  // Ignore statuses for now (delivery receipts) — could be persisted in a separate table later.
}
