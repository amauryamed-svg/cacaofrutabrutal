/**
 * post-facebook-page — publish a post to the Facebook Page Caua via Graph API.
 *
 * POST body:
 *   {
 *     message?: string,
 *     link?: string,        // for shared link posts → /{page_id}/feed
 *     image_url?: string    // for image posts      → /{page_id}/photos
 *   }
 *
 * Routing:
 *   - image_url present → POST /{page_id}/photos with `url` + `caption`
 *   - else              → POST /{page_id}/feed   with `message` + optional `link`
 *
 * Env: META_APP_SECRET, FACEBOOK_PAGE_ID, FACEBOOK_PAGE_ACCESS_TOKEN
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
  'FACEBOOK_PAGE_ID',
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
  const { META_APP_SECRET, FACEBOOK_PAGE_ID, FACEBOOK_PAGE_ACCESS_TOKEN } = env.values;

  let body: { message?: string; link?: string; image_url?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
  if (!body.message && !body.image_url) {
    return new Response(JSON.stringify({ error: 'Need at least `message` or `image_url`' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const proof = await appsecretProof(FACEBOOK_PAGE_ACCESS_TOKEN, META_APP_SECRET);

  let url: string;
  let payload: Record<string, unknown>;
  if (body.image_url) {
    url = `${GRAPH_API_BASE}/${FACEBOOK_PAGE_ID}/photos?appsecret_proof=${proof}`;
    payload = { url: body.image_url, caption: body.message ?? '', published: true };
  } else {
    url = `${GRAPH_API_BASE}/${FACEBOOK_PAGE_ID}/feed?appsecret_proof=${proof}`;
    payload = { message: body.message, link: body.link };
  }

  const fb = await metaFetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${FACEBOOK_PAGE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  // Page feed returns { id, post_id }, photos returns { id, post_id? }
  const postId =
    (fb.body as { post_id?: string; id?: string })?.post_id ??
    (fb.body as { id?: string })?.id ??
    null;

  const status: 'sent' | 'failed' | 'rate_limited' = fb.ok
    ? 'sent'
    : fb.status === 429
    ? 'rate_limited'
    : 'failed';

  const log = await logOutbound({
    channel: 'facebook_page',
    target_id: FACEBOOK_PAGE_ID,
    template: null,
    status,
    meta_message_id: postId,
    response_body: fb.rawBody,
  });

  return new Response(
    JSON.stringify({
      ok: fb.ok,
      fb_post_id: postId,
      log_id: log?.id ?? null,
      meta_response: fb.body,
    }),
    {
      status: fb.ok ? 200 : fb.status,
      headers: { ...cors, 'Content-Type': 'application/json' },
    }
  );
});
