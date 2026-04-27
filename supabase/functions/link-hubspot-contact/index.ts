import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const hubspotToken = Deno.env.get('HUBSPOT_PRIVATE_APP_TOKEN')

const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      })
    }

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const userJwt = authHeader.substring(7)
    const { data: userData, error: userErr } = await supabase.auth.getUser(userJwt)
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    const user = userData.user

    if (!hubspotToken) {
      return new Response(JSON.stringify({ error: 'HUBSPOT_PRIVATE_APP_TOKEN not configured' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!user.email) {
      return new Response(JSON.stringify({ error: 'User has no email' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const searchRes = await fetch(
      'https://api.hubapi.com/crm/v3/objects/contacts/search',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${hubspotToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filterGroups: [{
            filters: [{ propertyName: 'email', operator: 'EQ', value: user.email }],
          }],
          properties: ['email'],
          limit: 1,
        }),
      }
    )

    if (!searchRes.ok) {
      const detail = await searchRes.text()
      return new Response(JSON.stringify({ error: 'HubSpot search failed', detail }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const search = await searchRes.json() as { results?: Array<{ id: string }> }
    const contactId = search.results?.[0]?.id

    if (!contactId) {
      return new Response(JSON.stringify({ linked: false, reason: 'contact_not_found_yet' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { error: updateErr } = await supabase
      .from('user_profiles')
      .update({ hubspot_contact_id: contactId })
      .eq('user_id', user.id)

    if (updateErr) {
      return new Response(JSON.stringify({ error: 'Profile update failed', detail: updateErr.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ linked: true, hubspot_contact_id: contactId }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
