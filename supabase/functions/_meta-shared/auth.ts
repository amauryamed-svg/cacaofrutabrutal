/**
 * Shared Meta Graph API helpers — HMAC verification, appsecret_proof, env checks, fetch with retry.
 *
 * Used by: send-whatsapp-message, post-instagram, post-facebook-page, meta-webhook
 */

const GRAPH_API_VERSION = 'v20.0';
export const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

/**
 * Compute HMAC SHA-256 hex digest of a message using a secret.
 */
async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Constant-time string equality to avoid timing-leak signature verification.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Verify Meta webhook signature header `x-hub-signature-256: sha256=<hex>`.
 * Returns true if the signature matches HMAC-SHA256(rawBody, META_APP_SECRET).
 */
export async function verifyMetaSignature(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string
): Promise<boolean> {
  if (!signatureHeader || !signatureHeader.startsWith('sha256=')) return false;
  const provided = signatureHeader.slice('sha256='.length);
  const expected = await hmacSha256Hex(appSecret, rawBody);
  return timingSafeEqual(provided, expected);
}

/**
 * Build appsecret_proof for graph.facebook.com calls.
 * Required by Meta when calling with a long-lived access token.
 */
export async function appsecretProof(accessToken: string, appSecret: string): Promise<string> {
  return hmacSha256Hex(appSecret, accessToken);
}

/**
 * Env var presence check. Returns the values map or list of missing keys.
 */
export function requireEnv(keys: readonly string[]):
  | { ok: true; values: Record<string, string> }
  | { ok: false; missing: string[] } {
  const missing: string[] = [];
  const values: Record<string, string> = {};
  for (const key of keys) {
    const v = Deno.env.get(key);
    if (!v) missing.push(key);
    else values[key] = v;
  }
  return missing.length ? { ok: false, missing } : { ok: true, values };
}

/**
 * Fetch wrapper with single rate-limit retry (Meta returns 429 or code 4/17/32/613).
 * Always reads the response body (so callers can log/return it).
 */
export async function metaFetch(
  url: string,
  init: RequestInit,
  retryOnRateLimit = true
): Promise<{ ok: boolean; status: number; body: unknown; rawBody: string }> {
  const doFetch = async () => {
    const res = await fetch(url, init);
    const rawBody = await res.text();
    let body: unknown = rawBody;
    try {
      body = JSON.parse(rawBody);
    } catch {
      // not JSON
    }
    return { ok: res.ok, status: res.status, body, rawBody };
  };

  const first = await doFetch();
  if (first.ok || !retryOnRateLimit) return first;

  // Retry once on 429 / explicit rate-limit codes.
  const errCode = (first.body as { error?: { code?: number } })?.error?.code;
  const isRateLimited = first.status === 429 || [4, 17, 32, 613].includes(errCode ?? -1);
  if (isRateLimited) {
    await new Promise((r) => setTimeout(r, 1500));
    return doFetch();
  }
  return first;
}

/**
 * Standard 503 response when env credentials are not configured.
 * Lets us deploy functions before secrets are wired.
 */
export function notConfiguredResponse(missing: string[], cors: HeadersInit): Response {
  return new Response(
    JSON.stringify({
      error: 'META_NOT_CONFIGURED',
      missing,
      hint: 'Set required secrets via `npx supabase secrets set KEY=value`. See docs/meta-api-setup.md',
    }),
    { status: 503, headers: { ...cors, 'Content-Type': 'application/json' } }
  );
}
