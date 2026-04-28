// Idempotent refund of mazorcas for redemptions that expired without an on-chain claim.
//
// Why we need this: when sign-mazorca-burn signs the EIP-712 payload, it has
// already decremented the user's mazorcas_balance. If the user never submits
// claim() to MazorcaRedemption.sol before `deadline`, those mazorcas would be
// stranded. expire_mazorca_redemptions() flips status to 'expired' on the cron;
// this function (called by cron OR manually by support) refunds the balance.
//
// Idempotency: only refunds where status='expired' AND refunded_at IS NULL.
// Each successful refund flips to status='refunded' and stamps refunded_at.

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const supabaseUrl        = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const adminBearer        = Deno.env.get('ADMIN_BEARER_TOKEN') ?? ''

const supabase = createClient(supabaseUrl, supabaseServiceKey)

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  if (req.method !== 'POST') return jsonResponse({ error: 'method_not_allowed' }, 405)

  // Auth — pg_cron + ops-only. Simple bearer instead of JWT.
  const auth = req.headers.get('authorization') ?? ''
  if (!adminBearer || auth !== `Bearer ${adminBearer}`) {
    return jsonResponse({ error: 'unauthorized' }, 401)
  }

  // Pick up to 100 expired redemptions per invocation.
  const { data: rows, error } = await supabase
    .from('mazorca_redemptions')
    .select('id, user_id, mazorca_count')
    .eq('status', 'expired')
    .is('refunded_at', null)
    .limit(100)

  if (error) return jsonResponse({ error: 'query_failed', detail: error.message }, 500)
  if (!rows || rows.length === 0) return jsonResponse({ ok: true, refunded: 0 })

  let refunded = 0
  for (const row of rows) {
    const { error: refErr } = await supabase.rpc('refund_mazorcas_atomic', {
      p_user_id: row.user_id,
      p_amount: row.mazorca_count,
    })
    if (refErr) continue

    // Insert the audit ledger event (positive mazorcas to mirror the original burn).
    await supabase.from('token_events').insert({
      user_id: row.user_id,
      event_type: 'mazorca_redemption_refund',
      beans: 0,
      mazorcas: row.mazorca_count,
      ref_id: row.id,
    })

    await supabase.from('mazorca_redemptions')
      .update({ status: 'refunded', refunded_at: new Date().toISOString() })
      .eq('id', row.id)

    refunded += 1
  }

  return jsonResponse({ ok: true, refunded })
})
