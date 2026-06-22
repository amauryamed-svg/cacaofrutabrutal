import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export type UserLevel = {
  totalXp: number
  currentLevel: 1 | 2 | 3 | 4
  title: 'Aprendiz' | 'Cuidador' | 'Guardian' | 'Maestro'
}

const LEVEL_THRESHOLDS = {
  1: { min: 0,    max: 99 },
  2: { min: 100,  max: 499 },
  3: { min: 500,  max: 1999 },
  4: { min: 2000, max: Infinity },
} as const

/**
 * Reads user_levels for the current user. Falls back to live computation from
 * v_user_xp if user_levels row missing (not yet computed by daily cron).
 * Exposes thresholds so UI can render progress bar to next level.
 */
export function useUserLevel(): {
  level: UserLevel
  nextLevelXp: number | null
  progressToNext: number
  loading: boolean
} {
  const { userId } = useAuth()
  const [level, setLevel] = useState<UserLevel>({
    totalXp: 0,
    currentLevel: 1,
    title: 'Aprendiz',
  })
  const [loading, setLoading] = useState<boolean>(() => Boolean(userId))

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    const run = async () => {
      const { data: row } = await supabase
        .from('user_levels')
        .select('total_xp, current_level, title')
        .eq('user_id', userId)
        .maybeSingle()
      if (row) {
        const r = row as { total_xp: number; current_level: number; title: string }
        if (!cancelled) setLevel({
          totalXp: r.total_xp,
          currentLevel: Math.max(1, Math.min(4, r.current_level)) as 1 | 2 | 3 | 4,
          title: (r.title as UserLevel['title']) ?? 'Aprendiz',
        })
      } else {
        // Live fallback from view.
        const { data: xpRow } = await supabase
          .from('v_user_xp')
          .select('total_xp')
          .eq('user_id', userId)
          .maybeSingle()
        const xp = (xpRow as { total_xp?: number } | null)?.total_xp ?? 0
        const lvl: 1 | 2 | 3 | 4 =
          xp >= 2000 ? 4 : xp >= 500 ? 3 : xp >= 100 ? 2 : 1
        const title: UserLevel['title'] =
          lvl === 4 ? 'Maestro' : lvl === 3 ? 'Guardian' : lvl === 2 ? 'Cuidador' : 'Aprendiz'
        if (!cancelled) setLevel({ totalXp: xp, currentLevel: lvl, title })
      }
      if (!cancelled) setLoading(false)
    }
    void run()
    return () => { cancelled = true }
  }, [userId])

  const next = LEVEL_THRESHOLDS[Math.min(4, level.currentLevel + 1) as 1 | 2 | 3 | 4]
  const cur  = LEVEL_THRESHOLDS[level.currentLevel]
  const nextLevelXp = level.currentLevel >= 4 ? null : next.min
  const span = level.currentLevel >= 4 ? 1 : (next.min - cur.min)
  const progressToNext =
    level.currentLevel >= 4
      ? 1
      : Math.max(0, Math.min(1, (level.totalXp - cur.min) / span))

  return { level, nextLevelXp, progressToNext, loading }
}
