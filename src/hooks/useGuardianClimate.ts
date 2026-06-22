import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export type ClimatePayload = {
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

const CACHE_FRESH_MS = 60 * 60 * 1000 // mirror the Edge Function TTL (1h)

/**
 * Reads guardian_climate_cache directly. If row missing or stale, calls the
 * guardian-climate Edge Function which writes through. Returns null while
 * loading and on hard failure (UI shows "—" placeholder per design).
 */
export function useGuardianClimate(guardianId: number | null): {
  climate: ClimatePayload | null
  loading: boolean
} {
  const [climate, setClimate] = useState<ClimatePayload | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (guardianId === null || guardianId === undefined) return
    let cancelled = false
    const run = async () => {
      setLoading(true)
      try {
        // Try cache first (anon-readable).
        const { data: row } = await supabase
          .from('guardian_climate_cache')
          .select('payload, fetched_at')
          .eq('guardian_id', guardianId)
          .maybeSingle()
        const cached = row as { payload: ClimatePayload; fetched_at: string } | null
        const fresh =
          cached && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_FRESH_MS
        if (cached && fresh) {
          if (!cancelled) setClimate(cached.payload)
          if (!cancelled) setLoading(false)
          return
        }
        // Cache miss / stale → invoke Edge Function via direct fetch
        // (supabase-js invoke doesn't support GET query params cleanly).
        const baseUrl = import.meta.env.VITE_SUPABASE_URL as string
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string
        let payload: ClimatePayload | null = null
        if (baseUrl && anonKey) {
          const r = await fetch(
            `${baseUrl}/functions/v1/guardian-climate?guardian_id=${guardianId}`,
            { headers: { Authorization: `Bearer ${anonKey}`, apikey: anonKey } },
          )
          if (r.ok) {
            const j = await r.json() as { payload?: ClimatePayload }
            payload = j.payload ?? null
          }
        }
        if (!payload) {
          if (!cancelled) setClimate(cached?.payload ?? null)
          return
        }
        if (!cancelled) setClimate(payload)
      } catch {
        if (!cancelled) setClimate(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [guardianId])

  return { climate, loading }
}
