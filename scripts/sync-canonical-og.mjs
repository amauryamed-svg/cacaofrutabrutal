#!/usr/bin/env node
// Upserts the canonical OG thumbnail into Supabase brand_assets.
// In-house storage — bytes live in the DB, independent of Vercel/HubSpot/external CDN.
//
// Prereq: migration 023_brand_assets must be applied (npx supabase db push).
//
// Usage:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/sync-canonical-og.mjs
//
// Or pull from .env.local:
//   set -a && . .env.local && set +a && node scripts/sync-canonical-og.mjs

import { createClient } from '@supabase/supabase-js';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PNG_PATH = resolve(__dirname, '..', 'public', 'og.png');
const ASSET_NAME = 'og-default-v1';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const bytes = await readFile(PNG_PATH);
const sha256 = createHash('sha256').update(bytes).digest('hex');

console.log(`PNG: ${PNG_PATH}`);
console.log(`Size: ${bytes.length} bytes  SHA256: ${sha256}`);

// bytea inserts via PostgREST need hex-encoded string with leading \x
const bytesHex = '\\x' + bytes.toString('hex');

const { data, error } = await supabase
  .from('brand_assets')
  .upsert(
    {
      name: ASSET_NAME,
      mime: 'image/png',
      width: 1200,
      height: 630,
      bytes_size: bytes.length,
      sha256,
      bytes: bytesHex,
      is_canonical: true,
      notes: 'Canonical brutalist landing OG. Source: scripts/og-template.html via npm run og:build. Validated at native 1200x630 for WhatsApp/FB/Twitter.',
    },
    { onConflict: 'name' }
  )
  .select('id, name, sha256, bytes_size, is_canonical, updated_at');

if (error) {
  console.error('Upsert failed:', error);
  process.exit(1);
}

console.log('OK:', data);
