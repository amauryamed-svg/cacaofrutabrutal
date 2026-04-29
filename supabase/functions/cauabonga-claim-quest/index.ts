/**
 * cauabonga-claim-quest — list/claim daily CauaBonga quests.
 *
 * Two-mode endpoint:
 *   GET  → idempotently seeds today's 3 quests, returns the list with progress.
 *   POST { quest_id } → attempts to claim a quest; returns reward + new_balance
 *         if complete, or progress + target if not.
 *
 * Math source: economy.md §6 (daily cap 120 mz from quests). Total emission
 * across the 3 templates = 10+25+45 = 80 mz/day, leaves headroom.
 */

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  })
}

async function verifyAuth(authHeader: string | null): Promise<string> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('missing_or_invalid_auth')
  }
  const token = authHeader.substring(7)
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) throw new Error('invalid_jwt')
  return user.id
}

async function listQuests(userId: string) {
  // Idempotent seed.
  await supabase.rpc('seed_cauabonga_daily_quests', { p_user_id: userId })

  const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' }))
  const isoDate = today.toISOString().slice(0, 10)

  const { data: quests, error } = await supabase
    .from('cauabonga_daily_quests')
    .select('id, slot, template_id, params, reward_mz, state, progress, target, completed_at')
    .eq('user_id', userId)
    .eq('quest_date', isoDate)
    .order('slot', { ascending: true })

  if (error) throw error
  return { quest_date: isoDate, quests: quests ?? [] }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  try {
    const userId = await verifyAuth(req.headers.get('authorization'))

    if (req.method === 'GET') {
      const result = await listQuests(userId)
      return jsonResponse({ ok: true, ...result })
    }

    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({})) as { quest_id?: string }
      if (!body.quest_id || typeof body.quest_id !== 'string') {
        return jsonResponse({ error: 'quest_id_required' }, 400)
      }
      const { data: rpcResult, error: rpcErr } = await supabase.rpc('claim_cauabonga_daily_quest', {
        p_user_id:  userId,
        p_quest_id: body.quest_id,
      })
      if (rpcErr) {
        const msg = rpcErr.message ?? 'rpc_failed'
        if (msg.includes('quest_not_found')) {
          return jsonResponse({ error: 'quest_not_found' }, 404)
        }
        if (msg.includes('quest_already_')) {
          return jsonResponse({ error: 'quest_already_claimed', detail: msg }, 409)
        }
        return jsonResponse({ error: 'rpc_failed', detail: msg }, 500)
      }
      return jsonResponse({ ok: true, claim: rpcResult })
    }

    return jsonResponse({ error: 'method_not_allowed' }, 405)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown_error'
    if (msg === 'missing_or_invalid_auth' || msg === 'invalid_jwt') {
      return jsonResponse({ error: msg }, 401)
    }
    return jsonResponse({ error: 'internal_error', detail: msg }, 500)
  }
})
