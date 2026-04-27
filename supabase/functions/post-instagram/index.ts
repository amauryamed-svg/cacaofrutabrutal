/**
 * post-instagram — publish a single image post to Instagram Business via Graph API.
 *
 * 2-step flow:
 *   1. POST /{ig_user_id}/media        with image_url + caption → container creation_id
 *   2. POST /{ig_user_id}/media_publish with creation_id        → published media id
 *
 * POST body:
 *   { image_url: string, caption?: string }
 *
 * Env: META_APP_SECRET, INSTAGRAM_BUSINESS_ACCOUNT_ID, FACEBOOK_PAGE_ACCESS_TOKEN
 *
 * Note: image_url must be a publicly reachable HTTPS URL of a JPEG/PNG.
 * For dynamic IG thumbnails reuse `https://cacaofrutabrutal.com/api/og?...`.
 */

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import {
  GRAPH_API_BASE,
  appsecretProof,
  metaFetch,
  notConfiguredResponse,
  requireEnv,
} from '../_meta-shared/auth.ts';
import { logOutbound } from '../_meta-shared/log.ts';
import { getCorsHeaders } from '../cors-config.ts';

const REQUIRED_ENV = [
  'META_APP_SECRET',
  'INSTAGRAM_BUSINESS_ACCOUNT_ID',
  'FACEBOOK_PAGE_ACCESS_TOKEN',
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
  const { META_APP_SECRET, INSTAGRAM_BUSINESS_ACCOUNT_ID, FACEBOOK_PAGE_ACCESS_TOKEN } = env.values;

  let body: { image_url?: string; caption?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
  if (!body.image_url) {
    return new Response(JSON.stringify({ error: 'Missing `image_url`' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const proof = await appsecretProof(FACEBOOK_PAGE_ACCESS_TOKEN, META_APP_SECRET);

  // Step 1: create media container
  const containerUrl = `${GRAPH_API_BASE}/${INSTAGRAM_BUSINESS_ACCOUNT_ID}/media?appsecret_proof=${proof}`;
  const containerRes = await metaFetch(containerUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${FACEBOOK_PAGE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image_url: body.image_url,
      caption: body.caption ?? '',
    }),
  });

  if (!containerRes.ok) {
    await logOutbound({
      channel: 'instagram',
      target_id: INSTAGRAM_BUSINESS_ACCOUNT_ID,
      template: null,
      status: 'failed',
      response_body: containerRes.rawBody,
    });
    return new Response(
      JSON.stringify({ ok: false, step: 'container', meta_response: containerRes.body }),
      { status: containerRes.status, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  }

  const creationId = (containerRes.body as { id: string }).id;

  // Step 2: publish
  const publishUrl = `${GRAPH_API_BASE}/${INSTAGRAM_BUSINESS_ACCOUNT_ID}/media_publish?appsecret_proof=${proof}`;
  const publishRes = await metaFetch(publishUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${FACEBOOK_PAGE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ creation_id: creationId }),
  });

  const mediaId = (publishRes.body as { id?: string })?.id ?? null;
  const status: 'sent' | 'failed' | 'rate_limited' = publishRes.ok
    ? 'sent'
    : publishRes.status === 429
    ? 'rate_limited'
    : 'failed';

  const log = await logOutbound({
    channel: 'instagram',
    target_id: INSTAGRAM_BUSINESS_ACCOUNT_ID,
    template: null,
    status,
    meta_message_id: mediaId,
    response_body: publishRes.rawBody,
  });

  return new Response(
    JSON.stringify({
      ok: publishRes.ok,
      ig_media_id: mediaId,
      creation_id: creationId,
      log_id: log?.id ?? null,
      meta_response: publishRes.body,
    }),
    {
      status: publishRes.ok ? 200 : publishRes.status,
      headers: { ...cors, 'Content-Type': 'application/json' },
    }
  );
});
