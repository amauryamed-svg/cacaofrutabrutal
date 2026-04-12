import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { JWT } from 'https://deno.land/x/jose@v5.4.1/mod.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Token earning rates
const TOKEN_RATES: Record<string, { beans: number; mazorcas: number }> = {
  ritual_draw: { beans: 0.5, mazorcas: 0 },
  streak_7: { beans: 3.5, mazorcas: 1 },
  streak_30: { beans: 15, mazorcas: 5 },
  purchase: { beans: 2, mazorcas: 0 }, // per USD
  lot: { beans: 5, mazorcas: 2 },
  blog_share: { beans: 1, mazorcas: 0 },
  blog_read: { beans: 0.2, mazorcas: 0 },
  referral: { beans: 10, mazorcas: 3 },
}

async function verifyAuth(authHeader: string) {
  if (!authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header')
  }

  const token = authHeader.substring(7)

  try {
    const secret = new TextEncoder().encode(Deno.env.get('JWT_SECRET')!)
    await JWT.verify(token, secret)
    const payload = JWT.decode(token)
    return payload.payload.sub as string
  } catch {
    throw new Error('Invalid JWT token')
  }
}

serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const userId = await verifyAuth(authHeader)
    const { event_type, ref_id, amount } = await req.json()

    if (!event_type || !TOKEN_RATES[event_type]) {
      return new Response(JSON.stringify({ error: 'Invalid event type' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    let { beans, mazorcas } = TOKEN_RATES[event_type]

    // Scale by amount if it's a purchase
    if (event_type === 'purchase' && amount) {
      beans *= amount
    }

    // Insert token event
    const { error: eventError } = await supabase
      .from('token_events')
      .insert([{
        user_id: userId,
        event_type,
        beans,
        mazorcas,
        ref_id,
      }])

    if (eventError) throw eventError

    // Update user balance
    const { data: profile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('beans_balance, mazorcas_balance, beans_lifetime')
      .eq('user_id', userId)
      .single()

    if (fetchError) throw fetchError

    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        beans_balance: (profile?.beans_balance || 0) + beans,
        mazorcas_balance: (profile?.mazorcas_balance || 0) + mazorcas,
        beans_lifetime: (profile?.beans_lifetime || 0) + beans,
      })
      .eq('user_id', userId)

    if (updateError) throw updateError

    return new Response(JSON.stringify({
      beans_awarded: beans,
      mazorcas_awarded: mazorcas,
      new_balance: {
        beans: (profile?.beans_balance || 0) + beans,
        mazorcas: (profile?.mazorcas_balance || 0) + mazorcas,
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
