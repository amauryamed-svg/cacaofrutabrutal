// recompute-level — daily cron Edge Function.
// Recomputes user_levels.total_xp from token_events and updates current_level
// + title using levelFromXp() thresholds.
//
// Trigger: pg_cron daily call (similar pattern to evaluate-tree-vitals).
// Auth: bearer token check via app.admin_bearer_token Postgres setting.

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { levelFromXp } from '../_shared/streaks.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ADMIN_BEARER = Deno.env.get('ADMIN_BEARER_TOKEN') ?? ''

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS })
  if (req.method !== 'POST')    return jsonResponse({ error: 'method_not_allowed' }, 405)

  const auth = req.headers.get('authorization') ?? ''
  if (!auth.startsWith('Bearer ') || auth.slice(7) !== ADMIN_BEARER) {
    return jsonResponse({ error: 'unauthorized' }, 401)
  }

  try {
    // Pull XP totals from the v_user_xp view (already aggregates token_events).
    const { data: xpRows, error: xpErr } = await supabase
      .from('v_user_xp')
      .select('user_id, total_xp')
    if (xpErr) throw xpErr

    const rows = (xpRows ?? []) as { user_id: string; total_xp: number }[]
    let updated = 0

    for (const row of rows) {
      const { level, title } = levelFromXp(row.total_xp)
      const { error } = await supabase
        .from('user_levels')
        .upsert({
          user_id:       row.user_id,
          total_xp:      row.total_xp,
          current_level: level,
          title,
          updated_at:    new Date().toISOString(),
        }, { onConflict: 'user_id' })
      if (error) {
        console.error('user_levels upsert failed for', row.user_id, error)
      } else {
        updated += 1
      }
    }

    return jsonResponse({ ok: true, updated, total: rows.length })
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : 'unknown' }, 500)
  }
})
