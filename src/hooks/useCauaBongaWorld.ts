import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { GUARDIANS } from '../utils/constants'
import { TOWN_PINS, REGION_BIOME, type Region, type Biome } from '../utils/colombiaGeo'

export interface BongaFarm {
  guardian_id:   number
  region:        Region
  layout_x:      number
  layout_y:      number
  biome:         Biome
  npc_dialogue:  string[]
  /** Resuelto desde GUARDIANS[guardian_id] — name, emoji, character */
  guardianName:  string
  guardianEmoji: string
}

/**
 * Carga las 5 fincas del mundo CauaBonga desde Supabase.
 * Si la migración 020 aún no ha corrido o la tabla está vacía, hace fallback a constants
 * client-side (TOWN_PINS + REGION_BIOME + GUARDIANS) para que el skeleton funcione siempre.
 */
export function useCauaBongaWorld() {
  const [farms,   setFarms]   = useState<BongaFarm[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const fallback = (): BongaFarm[] =>
      GUARDIANS.map((g, idx) => {
        const region = g.region as Region
        const pin = TOWN_PINS[region]
        const bio = REGION_BIOME[region]
        return {
          guardian_id:   idx,
          region,
          layout_x:      pin?.x ?? 50,
          layout_y:      pin?.y ?? 65,
          biome:         bio?.biome ?? 'cordillera',
          npc_dialogue:  [`Bienvenido a la finca de ${g.name}.`, g.character.split('.')[0] + '.'],
          guardianName:  g.name,
          guardianEmoji: g.emoji,
        }
      })

    const enrich = (raw: { guardian_id: number; region: string; layout_x: number; layout_y: number; biome: string; npc_dialogue: string[] | null }[]): BongaFarm[] =>
      raw
        .map(r => {
          const g = GUARDIANS[r.guardian_id]
          if (!g) return null
          return {
            guardian_id:   r.guardian_id,
            region:        r.region as Region,
            layout_x:      Number(r.layout_x),
            layout_y:      Number(r.layout_y),
            biome:         r.biome as Biome,
            npc_dialogue:  r.npc_dialogue ?? [],
            guardianName:  g.name,
            guardianEmoji: g.emoji,
          }
        })
        .filter((x): x is BongaFarm => x !== null)
        .sort((a, b) => a.guardian_id - b.guardian_id)

    ;(async () => {
      try {
        // Tabla nueva (migration 020) — types se regeneran tras `npx supabase gen types`.
        // Mientras tanto el cliente Supabase la trata genérica; el catch + fallback cubre el caso missing.
        const { data, error: err } = await supabase
          .from('caua_bonga_farms')
          .select('guardian_id, region, layout_x, layout_y, biome, npc_dialogue')
          .order('guardian_id', { ascending: true })

        if (cancelled) return
        if (err || !data || data.length === 0) {
          setFarms(fallback())
        } else {
          setFarms(enrich(data))
        }
      } catch (e) {
        if (cancelled) return
        setError(e instanceof Error ? e.message : 'Error loading farms')
        setFarms(fallback())
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => { cancelled = true }
  }, [])

  return { farms, loading, error }
}
