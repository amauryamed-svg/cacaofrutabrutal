import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

/**
 * useLineageRegenerations — fetches the user's active "lineage regenerated"
 * records, populated by the Labranza machete arena (Phase 2.5).
 *
 * A regen is active when consumed_at IS NULL AND expires_at > NOW(). It's
 * keyed by guardian_id so Adoptar.tsx can show a "🌱 Lineage regenerated"
 * badge on the matching guardian card.
 */

export interface LineageRegen {
  id:              string
  guardian_id:     number
  source_tree_id:  string | null
  created_at:      string
  expires_at:      string
}

export function useLineageRegenerations() {
  const { userId } = useAuth()
  const [regens, setRegens] = useState<LineageRegen[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    if (!userId) { setLoading(false); return }

    const fetchRegens = async () => {
      try {
        const nowIso = new Date().toISOString()
        const { data, error: err } = await supabase
          .from('lineage_regenerations')
          .select('id, guardian_id, source_tree_id, created_at, expires_at')
          .eq('user_id', userId)
          .is('consumed_at', null)
          .gt('expires_at', nowIso)
          .order('created_at', { ascending: false })
        if (err) throw err
        setRegens((data ?? []) as LineageRegen[])
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to fetch regens')
      } finally {
        setLoading(false)
      }
    }

    fetchRegens()
    const id = setInterval(fetchRegens, 15_000)
    return () => clearInterval(id)
  }, [userId])

  /** Returns the most recent active regen for a given guardian, or null. */
  const findByGuardian = (guardianId: number): LineageRegen | null => {
    return regens.find(r => r.guardian_id === guardianId) ?? null
  }

  return { regens, findByGuardian, loading, error }
}
