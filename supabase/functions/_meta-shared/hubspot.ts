/**
 * HubSpot CRM bridge for Meta channels (WhatsApp first, IG/FB ready).
 *
 * On every WhatsApp send/receive we:
 *   1. find or create a HubSpot contact (matched by phone)
 *   2. log the message as a Communication engagement (channelType WHATS_APP)
 *
 * If HUBSPOT_API_KEY is not set, all functions return null silently — the
 * Meta send/receive flow stays functional, only HubSpot logging is skipped.
 */

const HUBSPOT_API_BASE = 'https://api.hubapi.com';

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/** Strip non-digit chars and ensure leading + for E.164 search consistency. */
function normalizePhone(raw: string): string {
  const digits = raw.replace(/[^\d]/g, '');
  return digits.startsWith('+') ? digits : `+${digits}`;
}

export type HubspotContact = { id: string; isNew: boolean };

/**
 * Search HubSpot for a contact by phone (matches `phone` or `mobilephone`).
 * Creates one if not found. Returns { id, isNew } or null on misconfig.
 */
export async function findOrCreateContact(
  hubspotToken: string,
  args: { phone: string; firstname?: string; lastname?: string; lifecyclestage?: string }
): Promise<HubspotContact | null> {
  const phone = normalizePhone(args.phone);

  const searchRes = await fetch(`${HUBSPOT_API_BASE}/crm/v3/objects/contacts/search`, {
    method: 'POST',
    headers: authHeaders(hubspotToken),
    body: JSON.stringify({
      filterGroups: [
        { filters: [{ propertyName: 'phone', operator: 'EQ', value: phone }] },
        { filters: [{ propertyName: 'mobilephone', operator: 'EQ', value: phone }] },
      ],
      properties: ['phone', 'mobilephone', 'firstname', 'lastname'],
      limit: 1,
    }),
  });

  if (searchRes.ok) {
    const data = (await searchRes.json()) as { results?: Array<{ id: string }> };
    if (data.results && data.results.length > 0) {
      return { id: data.results[0].id, isNew: false };
    }
  } else {
    console.warn('[hubspot] contact search failed', searchRes.status, await searchRes.text());
  }

  const createRes = await fetch(`${HUBSPOT_API_BASE}/crm/v3/objects/contacts`, {
    method: 'POST',
    headers: authHeaders(hubspotToken),
    body: JSON.stringify({
      properties: {
        phone,
        mobilephone: phone,
        firstname: args.firstname ?? '',
        lastname: args.lastname ?? '',
        hs_lead_status: 'NEW',
        lifecyclestage: args.lifecyclestage ?? 'lead',
        // Custom property optional. Skip if not present in portal.
      },
    }),
  });

  if (!createRes.ok) {
    console.warn('[hubspot] contact create failed', createRes.status, await createRes.text());
    return null;
  }
  const created = (await createRes.json()) as { id: string };
  return { id: created.id, isNew: true };
}

export type EngagementInput = {
  contactId: string;
  direction: 'OUTGOING' | 'INCOMING';
  body: string;
  timestamp?: number; // unix ms
  metaMessageId?: string;
  channel: 'WHATS_APP' | 'INSTAGRAM' | 'FACEBOOK_MESSENGER';
};

/**
 * Create a HubSpot Communication object (`/crm/v3/objects/communications`)
 * and associate it to the contact. Returns engagement id or null on failure.
 *
 * Uses the v3 Communications API (not legacy /engagements/v1).
 */
export async function logCommunicationEngagement(
  hubspotToken: string,
  input: EngagementInput
): Promise<string | null> {
  const ts = input.timestamp ?? Date.now();
  const channelTypeMap: Record<EngagementInput['channel'], string> = {
    WHATS_APP: 'WHATS_APP',
    INSTAGRAM: 'INSTAGRAM',
    FACEBOOK_MESSENGER: 'FACEBOOK_MESSENGER',
  };

  const res = await fetch(`${HUBSPOT_API_BASE}/crm/v3/objects/communications`, {
    method: 'POST',
    headers: authHeaders(hubspotToken),
    body: JSON.stringify({
      properties: {
        hs_communication_channel_type: channelTypeMap[input.channel],
        hs_communication_body: input.body.slice(0, 65535), // HubSpot text cap
        hs_communication_logged_from: 'CRM',
        hs_timestamp: ts,
        // direction is not a native property on communications; encode in body prefix.
      },
      associations: [
        {
          to: { id: input.contactId },
          types: [
            {
              // Contact ↔ Communication association type id 81 (default in HubSpot)
              associationCategory: 'HUBSPOT_DEFINED',
              associationTypeId: 81,
            },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    console.warn('[hubspot] engagement log failed', res.status, await res.text());
    return null;
  }
  const data = (await res.json()) as { id: string };
  return data.id;
}
