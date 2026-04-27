# Meta API Outbound — Setup Runbook

> Status: Edge Functions scaffolded and deployable. They return `503 META_NOT_CONFIGURED` until the secrets below are set. HubSpot CRM sync is wired but optional (gated on `HUBSPOT_API_KEY`).

## What ships in this PR

| Edge Function | Purpose | JWT |
|---|---|---|
| `send-whatsapp-message` | Outbound WA template/text + HubSpot engagement log | required |
| `post-instagram` | Publish image post to IG Business (2-step container/publish) | required |
| `post-facebook-page` | Publish text/link/photo to FB Page Caua | required |
| `meta-webhook` | Unified inbound (WA/IG/FB) + HubSpot inbound log | **disabled** (HMAC-verified) |

| Migration | What |
|---|---|
| `025_meta_outbound.sql` | `meta_outbound_log` + `meta_inbound_messages` tables, RLS, indexes |

| Helpers | What |
|---|---|
| `_meta-shared/auth.ts` | HMAC verify, `appsecret_proof`, env checks, `metaFetch` retry |
| `_meta-shared/hubspot.ts` | `findOrCreateContact`, `logCommunicationEngagement` |
| `_meta-shared/log.ts` | `logOutbound`, `logInbound` (idempotent on `message_id`) |

## Pre-requisites

- Meta Business Account (https://business.facebook.com/)
- WhatsApp Business Account (WABA) created inside the Meta Business
- Facebook Page **Caua** owned by the same Meta Business
- Instagram Business profile linked to the Facebook Page
- HubSpot Private App access token (already in env as `HUBSPOT_API_KEY` per
  `.octogent/tentacles/supabase-backend/CONTEXT.md`)

## 1 — Create the Meta App

1. https://developers.facebook.com/apps → "Create App" → Use case **Other** → Type **Business**.
2. App Settings → Basic. Copy **App ID** and **App Secret**.
3. Add products:
   - **WhatsApp**
   - **Instagram Graph API**
   - **Facebook Login for Business** (only required if you ever do user-context auth)

## 2 — WhatsApp Cloud API

1. Products → WhatsApp → API Setup.
2. Create or select your WABA. Note the **WhatsApp Business Account ID**.
3. Add and verify a phone number → note the **Phone Number ID** (NOT the phone number itself).
4. Create at least one approved **template** (e.g. clone the pre-approved `hello_world`).
   - Template name and language code (default `es`) are passed in the
     `send-whatsapp-message` POST body as `template_name` + `language`.
5. Generate a **System User access token** (Business Settings → Users → System Users → Add → Admin).
   Assign asset access for: WABA, Page, IG Business. Generate a long-lived
   token with scopes:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_show_list`
   - `pages_manage_posts`
   - `pages_read_engagement`
   - `pages_messaging`

## 3 — Instagram + Facebook Page

1. The **Facebook Page Access Token** is a long-lived page token; for our use
   we reuse the System User token from step 2 (it works for `/{page_id}/feed`,
   `/{page_id}/photos`, and `/{ig_user_id}/media*`).
2. Find the **Page ID** in Page → About → Page transparency.
3. Find the **Instagram Business Account ID**:
   `GET /v20.0/{page_id}?fields=instagram_business_account&access_token=...`

## 4 — Set the secrets

```bash
# Core Meta
npx supabase secrets set META_APP_ID=...
npx supabase secrets set META_APP_SECRET=...
npx supabase secrets set META_VERIFY_TOKEN=$(openssl rand -hex 32)

# WhatsApp Cloud API
npx supabase secrets set WHATSAPP_BUSINESS_ACCOUNT_ID=...
npx supabase secrets set WHATSAPP_PHONE_NUMBER_ID=...
npx supabase secrets set WHATSAPP_ACCESS_TOKEN=...   # System User token

# Instagram + Facebook Page
npx supabase secrets set INSTAGRAM_BUSINESS_ACCOUNT_ID=...
npx supabase secrets set FACEBOOK_PAGE_ID=...
npx supabase secrets set FACEBOOK_PAGE_ACCESS_TOKEN=...   # may be same System User token

# HubSpot (already set, confirm)
npx supabase secrets list | grep HUBSPOT_API_KEY
```

Save `META_VERIFY_TOKEN` somewhere — you'll paste it into Meta's webhook UI in step 6.

## 5 — Deploy

```bash
npx supabase db push                                    # applies 025
npx supabase functions deploy send-whatsapp-message
npx supabase functions deploy post-instagram
npx supabase functions deploy post-facebook-page
npx supabase functions deploy meta-webhook              # picks up verify_jwt=false from supabase/config.toml
```

## 6 — Register the webhook in Meta App Dashboard

1. App Dashboard → Webhooks → Configure.
2. **Callback URL**: `https://kjygovuiphbxcdxeduco.supabase.co/functions/v1/meta-webhook`
3. **Verify Token**: paste your `META_VERIFY_TOKEN`.
4. Click **Verify and save** — Meta GETs the URL with `hub.challenge`; the
   function echoes it if the token matches → green check.
5. Subscribe each product to its fields:
   - **WhatsApp** → `messages`, `message_template_status_update`
   - **Instagram** → `comments`, `mentions`, `messages`
   - **Facebook Page** → `feed`, `messages`, `mention`

## 7 — Smoke tests

### 7.1 WhatsApp outbound (with HubSpot)

```bash
curl -s -X POST \
  https://kjygovuiphbxcdxeduco.supabase.co/functions/v1/send-whatsapp-message \
  -H "Authorization: Bearer $(supabase --workdir . anon-key)" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+573102227848",
    "template_name": "hello_world",
    "language": "en_US"
  }'
```

Expected response:
```json
{ "ok": true, "meta_message_id": "wamid.HBg...", "log_id": "...", "hubspot_contact_id": "...", "hubspot_engagement_id": "..." }
```

Verify:
- Message arrives on the target phone.
- Row in `public.meta_outbound_log` with `status = 'sent'` and the HubSpot ids.
- HubSpot CRM → Contacts → search the phone → Communications timeline shows
  one WhatsApp engagement with body `[OUTBOUND] [template:hello_world] ...`.

### 7.2 WhatsApp inbound (with HubSpot)

Send a WhatsApp message from any phone to the WABA test number. Verify:
- Edge Function logs (`supabase functions logs meta-webhook`) show `EVENT_RECEIVED`.
- Row in `public.meta_inbound_messages` with `channel='whatsapp'`,
  `from_id` = sender's E.164, and the message in `payload`.
- HubSpot Contact for the sender is created (or matched) with one
  Communication engagement, body `[INBOUND] <text>`.

### 7.3 IG / FB

```bash
# IG image post (image_url must be a public HTTPS image)
curl -X POST .../post-instagram -H "Auth..." \
  -d '{ "image_url": "https://cacaofrutabrutal.com/og.png?v=2026-04-26", "caption": "Test from CFB" }'

# FB Page text post
curl -X POST .../post-facebook-page -H "Auth..." \
  -d '{ "message": "Test from CFB", "link": "https://cacaofrutabrutal.com" }'
```

Both should return `ok: true` with a media/post id and a row in `meta_outbound_log`.

## HubSpot communications detail

- Contact match: by `phone` OR `mobilephone` equality on the normalized E.164
  string. If no contact → a new one is created with `lifecyclestage=lead` and
  `hs_lead_status=NEW`.
- Engagement: `POST /crm/v3/objects/communications` with
  `hs_communication_channel_type = WHATS_APP` and association type id `81`
  (HubSpot default Contact ↔ Communication).
- Body prefixes: `[OUTBOUND]` / `[INBOUND]` so the timeline reads natural.
- If `HUBSPOT_API_KEY` is missing or HubSpot returns non-200, the WhatsApp
  flow still succeeds — only the HubSpot ids will be `null` in the response
  and in `meta_outbound_log`.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `503 META_NOT_CONFIGURED` | Missing secret | `npx supabase secrets set <KEY>=<value>` then redeploy fn |
| Webhook handshake fails | Wrong verify token | Make sure `META_VERIFY_TOKEN` matches what you pasted into Meta UI |
| `401 Invalid signature` on POST | App Secret mismatch | Re-copy App Secret from Meta App Dashboard, set `META_APP_SECRET` |
| WA send returns 132000 / template error | Template not approved | Approve via WhatsApp Manager → Templates |
| HubSpot association 400 | Portal missing `Communications` object access | Enable Communications in HubSpot Settings → Objects |

## Frontend integration (later)

Frontend invocation pattern (after auth):

```ts
const { data, error } = await supabase.functions.invoke('send-whatsapp-message', {
  body: {
    to: lead.phone,
    template_name: 'cacao_outreach_v1',
    language: 'es',
    components: [{ type: 'body', parameters: [{ type: 'text', text: lead.firstname }] }],
    log_to_hubspot: true,
    hubspot_contact: { firstname: lead.firstname, lastname: lead.lastname },
  },
});
```

---

Owner: `supabase-backend` tentacle. See `.octogent/tentacles/supabase-backend/CONTEXT.md`.
