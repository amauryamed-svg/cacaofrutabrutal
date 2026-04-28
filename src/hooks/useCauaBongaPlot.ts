import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import {
  CROPS,
  PLOT_GRID_SIZE,
  type CropSlug,
} from '../utils/cauabonga'

/**
 * useCauaBongaPlot — fetch + manage a single user plot for one guardian.
 *
 * MVP scope (per GDD §19): Lucho's finca only, regen mode only, 2 crops
 * (cacao_criollo + platano_dominico), off-chain plot only.
 *
 * Returns the plot row, the live tile rows (5×5 dense — empty tiles fall
 * back to a synthesised `EmptyTile` placeholder), and three mutation
 * helpers: ensurePlot, plant, harvest. Reads via direct supabase.from RLS;
 * harvest writes go through the Edge Function (server-authoritative timer
 * + daily cap + atomic RPC).
 */

export interface PlotRow {
  id:                 string
  user_id:            string
  guardian_id:        number
  tile_count:         number
  rarity:             'common' | 'rare' | 'epic' | 'legendary'
  soil_tier:          number
  avg_soil_health:    number
  regen_streak_days:  number
  total_harvests:     number
  state:              'active' | 'infertile' | 'paused'
  created_at:         string
}

export interface TileRow {
  id:           string
  plot_id:      string
  user_id:      string
  tile_idx:     number
  state:        'empty' | 'seeded' | 'growing' | 'ready' | 'fallow' | 'infertile'
  crop_slug:    CropSlug | null
  mode:         'regen' | 'traditional' | null
  planted_at:   string | null
  ready_at:     string | null
  fallow_until: string | null
  soil_health:  number
}

export interface UseCauaBongaPlot {
  plot:        PlotRow | null
  tiles:       TileRow[]                   // dense grid, length === tile_count (rows pre-created at mint)
  loading:     boolean
  error:       string | null
  refresh:     () => Promise<void>
  ensurePlot:  () => Promise<PlotRow | null>
  plantTile:   (tileIdx: number, cropSlug: CropSlug, mode?: 'regen' | 'traditional') => Promise<void>
  harvestTile: (tile: TileRow) => Promise<HarvestResult>
}

export interface HarvestResult {
  ok:           boolean
  yield_mz?:    number
  new_balance?: number
  soil_after?:  number
  fallow_until?: string
  error?:       string
}

export function useCauaBongaPlot(guardianId: number): UseCauaBongaPlot {
  const { userId } = useAuth()
  const [plot, setPlot] = useState<PlotRow | null>(null)
  const [tiles, setTiles] = useState<TileRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!userId) { setLoading(false); return }
    setError(null)
    try {
      const { data: plotData, error: plotErr } = await supabase
        .from('cauabonga_plots')
        .select('id, user_id, guardian_id, tile_count, rarity, soil_tier, avg_soil_health, regen_streak_days, total_harvests, state, created_at')
        .eq('user_id', userId)
        .eq('guardian_id', guardianId)
        .neq('state', 'paused')
        .maybeSingle()

      if (plotErr) throw plotErr

      if (!plotData) {
        setPlot(null)
        setTiles([])
        return
      }

      setPlot(plotData as PlotRow)

      const { data: tileData, error: tileErr } = await supabase
        .from('cauabonga_plantings')
        .select('id, plot_id, user_id, tile_idx, state, crop_slug, mode, planted_at, ready_at, fallow_until, soil_health')
        .eq('plot_id', plotData.id)
        .eq('user_id', userId)
        .order('tile_idx', { ascending: true })

      if (tileErr) throw tileErr
      setTiles((tileData ?? []) as TileRow[])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'plot_fetch_failed')
    } finally {
      setLoading(false)
    }
  }, [userId, guardianId])

  useEffect(() => {
    void refresh()
    // Poll for ready_at transitions every 30s — server still authoritative.
    const interval = setInterval(refresh, 30_000)
    return () => clearInterval(interval)
  }, [refresh])

  const ensurePlot = useCallback(async (): Promise<PlotRow | null> => {
    if (!userId) return null
    if (plot) return plot
    // First-plot-free per GDD §13. RLS allows user to insert their own row.
    const { data, error: insErr } = await supabase
      .from('cauabonga_plots')
      .insert({
        user_id: userId,
        guardian_id: guardianId,
        tile_count: 9,                        // 3×3 starter inner per GDD §6
        soil_tier: 3,
        rarity: 'common',
        state: 'active',
      })
      .select('id, user_id, guardian_id, tile_count, rarity, soil_tier, avg_soil_health, regen_streak_days, total_harvests, state, created_at')
      .single()

    if (insErr) {
      setError(insErr.message)
      return null
    }
    const newPlot = data as PlotRow

    // Pre-create 25 tile rows (architecture §2.2 — play hot path is update-only).
    // RLS allows user-owned inserts. Tiles 9-24 will sit dormant until tile_count expands via XP.
    const totalTiles = PLOT_GRID_SIZE * PLOT_GRID_SIZE
    const rows = Array.from({ length: totalTiles }, (_, i) => ({
      plot_id:     newPlot.id,
      user_id:     userId,
      tile_idx:    i,
      state:       'empty' as const,
      soil_health: 75,
    }))
    const { error: tileInsErr } = await supabase.from('cauabonga_plantings').insert(rows)
    if (tileInsErr) {
      // Plot exists, tiles failed — surface the error but keep the plot.
      setError(tileInsErr.message)
    }
    await refresh()
    return newPlot
  }, [userId, guardianId, plot, refresh])

  const plantTile = useCallback(async (
    tileIdx: number,
    cropSlug: CropSlug,
    mode: 'regen' | 'traditional' = 'regen',
  ): Promise<void> => {
    if (!userId || !plot) {
      setError('plot_required')
      return
    }
    const crop = CROPS[cropSlug]
    if (!crop) { setError('unknown_crop'); return }
    if (crop.seedCost === null) { setError('crop_drop_only'); return }

    const plantedAt = new Date()
    const readyAt = new Date(plantedAt.getTime() + crop.growMinutes * 60_000)

    const { error: updErr } = await supabase
      .from('cauabonga_plantings')
      .update({
        state:        'growing',
        crop_slug:    cropSlug,
        mode,
        planted_at:   plantedAt.toISOString(),
        ready_at:     readyAt.toISOString(),
        fallow_until: null,
      })
      .eq('plot_id', plot.id)
      .eq('tile_idx', tileIdx)
      .eq('user_id', userId)
      .eq('state', 'empty')                            // optimistic-concurrency guard

    if (updErr) {
      setError(updErr.message)
      return
    }
    // Action log (best-effort, RLS may reject; that's ok for MVP)
    void supabase.from('cauabonga_action_log').insert({
      user_id: userId,
      plot_id: plot.id,
      action: 'plant',
    })
    await refresh()
  }, [userId, plot, refresh])

  const harvestTile = useCallback(async (tile: TileRow): Promise<HarvestResult> => {
    if (!userId) return { ok: false, error: 'unauthenticated' }
    if (tile.state !== 'ready') return { ok: false, error: 'not_ready' }

    const { data: { session } } = await supabase.auth.getSession()
    const accessToken = session?.access_token
    if (!accessToken) return { ok: false, error: 'no_session' }

    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/claim-cauabonga-harvest`
    let res: Response
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'apikey':        import.meta.env.VITE_SUPABASE_ANON_KEY as string,
        },
        body: JSON.stringify({ planting_id: tile.id }),
      })
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : 'network_error' }
    }
    const json = await res.json().catch(() => null) as Record<string, unknown> | null
    if (!res.ok || !json?.ok) {
      return {
        ok: false,
        error: typeof json?.error === 'string' ? json.error : `http_${res.status}`,
      }
    }
    const harvest = json.harvest as Record<string, unknown> | undefined
    await refresh()
    return {
      ok:           true,
      yield_mz:     harvest?.yield_mz as number | undefined,
      new_balance:  harvest?.new_balance as number | undefined,
      soil_after:   harvest?.soil_after as number | undefined,
      fallow_until: harvest?.fallow_until as string | undefined,
    }
  }, [userId, refresh])

  return {
    plot,
    tiles,
    loading,
    error,
    refresh,
    ensurePlot,
    plantTile,
    harvestTile,
  }
}
