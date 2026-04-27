/**
 * Persistence helpers for meta_outbound_log and meta_inbound_messages.
 * Wraps supabase-js with service-role key.
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

let cached: SupabaseClient | null = null;

function client(): SupabaseClient {
  if (cached) return cached;
  const url = Deno.env.get('SUPABASE_URL')!;
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  cached = createClient(url, key);
  return cached;
}

export type Channel = 'whatsapp' | 'instagram' | 'facebook_page';

export async function logOutbound(args: {
  channel: Channel;
  target_id: string;
  template?: string | null;
  status: 'sent' | 'failed' | 'rate_limited';
  meta_message_id?: string | null;
  response_body?: string | null;
  user_id?: string | null;
  hubspot_engagement_id?: string | null;
  hubspot_contact_id?: string | null;
}): Promise<{ id: string } | null> {
  const { data, error } = await client()
    .from('meta_outbound_log')
    .insert({
      channel: args.channel,
      target_id: args.target_id,
      template: args.template ?? null,
      status: args.status,
      meta_message_id: args.meta_message_id ?? null,
      response_body: args.response_body ? args.response_body.slice(0, 8192) : null,
      user_id: args.user_id ?? null,
      hubspot_engagement_id: args.hubspot_engagement_id ?? null,
      hubspot_contact_id: args.hubspot_contact_id ?? null,
    })
    .select('id')
    .single();

  if (error) {
    console.warn('[log] outbound insert failed', error.message);
    return null;
  }
  return data as { id: string };
}

export async function logInbound(args: {
  channel: Channel;
  from_id: string;
  message_id: string;
  payload: unknown;
  hubspot_engagement_id?: string | null;
  hubspot_contact_id?: string | null;
}): Promise<{ id: string; isNew: boolean } | null> {
  // Idempotent insert via UNIQUE on message_id; on conflict do nothing → return existing row.
  const { data: insert, error: insertErr } = await client()
    .from('meta_inbound_messages')
    .insert({
      channel: args.channel,
      from_id: args.from_id,
      message_id: args.message_id,
      payload: args.payload,
      hubspot_engagement_id: args.hubspot_engagement_id ?? null,
      hubspot_contact_id: args.hubspot_contact_id ?? null,
    })
    .select('id')
    .single();

  if (!insertErr && insert) return { id: (insert as { id: string }).id, isNew: true };

  // Conflict path: 23505 unique violation → fetch existing.
  if (insertErr && insertErr.code !== '23505') {
    console.warn('[log] inbound insert failed', insertErr.message);
    return null;
  }
  const { data: existing, error: selErr } = await client()
    .from('meta_inbound_messages')
    .select('id')
    .eq('message_id', args.message_id)
    .single();
  if (selErr || !existing) return null;
  return { id: (existing as { id: string }).id, isNew: false };
}
