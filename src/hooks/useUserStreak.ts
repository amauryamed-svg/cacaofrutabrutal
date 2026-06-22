import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export type Streak = {
  currentDays: number
  longestDays: number
  lastCareDate: string | null
}

/**
 * Reads user_streaks row for the authenticated user. Returns zeros if no row
 * exists yet (first session). Subscribes to realtime updates so the chip
 * reflects new streaks immediately after a care action.
 */
export function useUserStreak(): {
  streak: Streak
  loading: boolean
} {
  const { userId } = useAuth()
  const [streak, setStreak] = useState<Streak>({
    currentDays: 0,
    longestDays: 0,
    lastCareDate: null,
  })
  const [loading, setLoading] = useState<boolean>(() => Boolean(userId))

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    const fetchStreak = async () => {
      const { data } = await supabase
        .from('user_streaks')
        .select('current_days, longest_days, last_care_date')
        .eq('user_id', userId)
        .maybeSingle()
      if (cancelled) return
      const row = data as { current_days?: number; longest_days?: number; last_care_date?: string } | null
      setStreak({
        currentDays:  row?.current_days ?? 0,
        longestDays:  row?.longest_days ?? 0,
        lastCareDate: row?.last_care_date ?? null,
      })
      setLoading(false)
    }
    void fetchStreak()
    // Realtime subscription so streak chip updates after care without a manual refetch.
    const channel = supabase
      .channel(`user_streaks:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_streaks', filter: `user_id=eq.${userId}` },
        () => { void fetchStreak() },
      )
      .subscribe()
    return () => {
      cancelled = true
      void supabase.removeChannel(channel)
    }
  }, [userId])

  return { streak, loading }
}
