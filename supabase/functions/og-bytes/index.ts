import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const DEFAULT_NAME = 'og-default-v1'

serve(async (req) => {
  try {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const url = new URL(req.url)
    const name = url.searchParams.get('name') || DEFAULT_NAME

    const { data, error } = await supabase
      .from('brand_assets')
      .select('mime, sha256, bytes, bytes_size')
      .eq('name', name)
      .single()

    if (error || !data) {
      return new Response(JSON.stringify({ error: 'Asset not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const ifNoneMatch = req.headers.get('if-none-match')
    const etag = `"${data.sha256}"`
    if (ifNoneMatch === etag) {
      return new Response(null, { status: 304, headers: { ETag: etag } })
    }

    const hex = (data.bytes as string).startsWith('\\x')
      ? (data.bytes as string).slice(2)
      : (data.bytes as string)
    const bytes = new Uint8Array(hex.length / 2)
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.substr(i * 2, 2), 16)
    }

    return new Response(bytes, {
      status: 200,
      headers: {
        'Content-Type': data.mime,
        'Content-Length': String(data.bytes_size),
        'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000',
        ETag: etag,
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
