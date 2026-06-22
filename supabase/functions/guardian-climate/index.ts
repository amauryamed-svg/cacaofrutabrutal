// guardian-climate — Edge Function returning live climate for a guardian's
// region with a write-through 1h cache (table: guardian_climate_cache).
//
// Public read: anon may call. No PII. Mirrors GUARDIAN_DATA lat/lon from
// api/cacao_predictor.py so we don't depend on the Python service being up.
//
// GET /guardian-climate?guardian_id=0
//   → 200 { guardian_id, payload: {...}, cached_at, source: 'cache'|'fresh' }
//   → 404 if guardian_id invalid
//   → 502 if upstream Open-Meteo fails AND no cache row to fall back on

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  })
}

const CACHE_TTL_MS = 60 * 60 * 1000 // 1h

// Mirror of GUARDIAN_DATA in api/cacao_predictor.py — kept in sync manually.
const GUARDIAN_COORDS: Record<number, { lat: string; lon: string; region: string; town: string }> = {
  0: { lat: '2.5746', lon: '-75.4503', region: 'Huila',        town: 'Hobo' },
  1: { lat: '7.0881', lon: '-70.7594', region: 'Arauca',       town: 'Arauca' },
  2: { lat: '4.2694', lon: '-74.4144', region: 'Cundinamarca', town: 'Arbeláez' },
  3: { lat: '3.8868', lon: '-73.7683', region: 'Meta',         town: 'Guamal' },
  4: { lat: '6.2185', lon: '-73.8116', region: 'Santander',    town: 'Landázuri' },
}

const OPTIMAL_TEMP_MIN = 22.0
const OPTIMAL_TEMP_MAX = 27.0
const OPTIMAL_RAIN_MM_WEEK = 20.0

type ClimatePayload = {
  region: string
  town: string
  temp_avg_c: number
  temp_max_c: number
  temp_min_c: number
  rain_total_mm: number
  uv_index: number | null
  humidity_pct: number | null
  ideal_band: 'optimal' | 'warm' | 'cold' | 'dry' | 'wet'
  status_label: string
}

async function fetchOpenMeteo(lat: string, lon: string): Promise<{
  t_max: number[]; t_min: number[]; rain: number[]; uv: number[] | null; rh: number[] | null
}> {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,uv_index_max` +
    `&hourly=relative_humidity_2m` +
    `&forecast_days=7&timezone=America%2FBogota`
  const r = await fetch(url)
  if (!r.ok) throw new Error(`open_meteo_status_${r.status}`)
  const j = await r.json() as {
    daily?: { temperature_2m_max?: number[]; temperature_2m_min?: number[]; precipitation_sum?: number[]; uv_index_max?: number[] }
    hourly?: { relative_humidity_2m?: number[] }
  }
  return {
    t_max: j.daily?.temperature_2m_max ?? [25],
    t_min: j.daily?.temperature_2m_min ?? [18],
    rain:  j.daily?.precipitation_sum  ?? [3],
    uv:    j.daily?.uv_index_max       ?? null,
    rh:    j.hourly?.relative_humidity_2m ?? null,
  }
}

function buildPayload(coords: { region: string; town: string }, raw: Awaited<ReturnType<typeof fetchOpenMeteo>>): ClimatePayload {
  const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length)
  const temp_max_c = avg(raw.t_max)
  const temp_min_c = avg(raw.t_min)
  const temp_avg_c = (temp_max_c + temp_min_c) / 2
  const rain_total_mm = raw.rain.reduce((a, b) => a + b, 0)
  const uv_index = raw.uv ? Math.max(...raw.uv) : null
  const humidity_pct = raw.rh ? avg(raw.rh) : null

  let ideal_band: ClimatePayload['ideal_band'] = 'optimal'
  let status_label = 'Clima óptimo'
  if (temp_avg_c > OPTIMAL_TEMP_MAX) {
    ideal_band = 'warm'; status_label = 'Calor sobre el óptimo'
  } else if (temp_avg_c < OPTIMAL_TEMP_MIN) {
    ideal_band = 'cold'; status_label = 'Bajo lo óptimo'
  } else if (rain_total_mm < OPTIMAL_RAIN_MM_WEEK * 0.5) {
    ideal_band = 'dry'; status_label = 'Lluvia baja'
  } else if (rain_total_mm > OPTIMAL_RAIN_MM_WEEK * 2) {
    ideal_band = 'wet'; status_label = 'Lluvia alta'
  }

  return {
    region: coords.region,
    town: coords.town,
    temp_avg_c: Number(temp_avg_c.toFixed(1)),
    temp_max_c: Number(temp_max_c.toFixed(1)),
    temp_min_c: Number(temp_min_c.toFixed(1)),
    rain_total_mm: Number(rain_total_mm.toFixed(1)),
    uv_index: uv_index === null ? null : Number(uv_index.toFixed(1)),
    humidity_pct: humidity_pct === null ? null : Math.round(humidity_pct),
    ideal_band,
    status_label,
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS })
  if (req.method !== 'GET')     return jsonResponse({ error: 'method_not_allowed' }, 405)

  try {
    const url = new URL(req.url)
    const idStr = url.searchParams.get('guardian_id')
    const guardian_id = idStr === null ? NaN : Number(idStr)
    if (!Number.isInteger(guardian_id) || !(guardian_id in GUARDIAN_COORDS)) {
      return jsonResponse({ error: 'invalid_guardian_id' }, 404)
    }
    const coords = GUARDIAN_COORDS[guardian_id]

    // 1) Try cache.
    const { data: cached } = await supabase
      .from('guardian_climate_cache')
      .select('payload, fetched_at')
      .eq('guardian_id', guardian_id)
      .single<{ payload: ClimatePayload; fetched_at: string }>()

    if (cached) {
      const fetchedMs = new Date(cached.fetched_at).getTime()
      if (Date.now() - fetchedMs < CACHE_TTL_MS) {
        return jsonResponse({
          guardian_id,
          payload: cached.payload,
          cached_at: cached.fetched_at,
          source: 'cache',
        })
      }
    }

    // 2) Cache miss / expired → fetch fresh.
    let payload: ClimatePayload
    try {
      const raw = await fetchOpenMeteo(coords.lat, coords.lon)
      payload = buildPayload(coords, raw)
    } catch (e) {
      // Upstream failed. Fall back to stale cache if any.
      if (cached) {
        return jsonResponse({
          guardian_id,
          payload: cached.payload,
          cached_at: cached.fetched_at,
          source: 'stale_cache',
          warning: 'upstream_failed',
        })
      }
      return jsonResponse({
        error: 'upstream_failed',
        detail: e instanceof Error ? e.message : 'unknown',
      }, 502)
    }

    // 3) Write through to cache.
    const { error: upsertErr } = await supabase
      .from('guardian_climate_cache')
      .upsert({
        guardian_id,
        payload,
        fetched_at: new Date().toISOString(),
      }, { onConflict: 'guardian_id' })

    if (upsertErr) {
      console.error('guardian_climate_cache upsert failed:', upsertErr)
      // Non-fatal — return fresh payload anyway.
    }

    return jsonResponse({
      guardian_id,
      payload,
      cached_at: new Date().toISOString(),
      source: 'fresh',
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'unknown'
    return jsonResponse({ error: msg }, 500)
  }
})
