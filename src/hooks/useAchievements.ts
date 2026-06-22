import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export type AchievementCatalogRow = {
  id: string
  name: string
  descripcion: string
  icon: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  secret: boolean
  reward_mz: number
  sort_order: number
}

export type AchievementWithUnlock = AchievementCatalogRow & {
  unlocked_at: string | null
}

/**
 * Returns the full achievement catalog joined with the current user's
 * user_achievements table (LEFT JOIN). Locked badges show grayscale, secret
 * badges show "?" until unlocked. Realtime subscription so a freshly
 * unlocked badge surfaces without page reload.
 */
export function useAchievements(): {
  achievements: AchievementWithUnlock[]
  loading: boolean
} {
  const { userId } = useAuth()
  const [items, setItems] = useState<AchievementWithUnlock[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const fetchAll = async () => {
      const [{ data: catalog }, { data: unlocks }] = await Promise.all([
        supabase
          .from('achievements_catalog')
          .select('id, name, descripcion, icon, rarity, secret, reward_mz, sort_order')
          .order('sort_order', { ascending: true }),
        userId
          ? supabase
              .from('user_achievements')
              .select('achievement_id, unlocked_at')
              .eq('user_id', userId)
          : Promise.resolve({ data: [] as { achievement_id: string; unlocked_at: string }[] }),
      ])
      if (cancelled) return
      const unlockMap = new Map<string, string>()
      for (const u of (unlocks ?? []) as { achievement_id: string; unlocked_at: string }[]) {
        unlockMap.set(u.achievement_id, u.unlocked_at)
      }
      const merged: AchievementWithUnlock[] = ((catalog ?? []) as AchievementCatalogRow[]).map((a) => ({
        ...a,
        unlocked_at: unlockMap.get(a.id) ?? null,
      }))
      setItems(merged)
      setLoading(false)
    }
    void fetchAll()
    if (!userId) return
    const channel = supabase
      .channel(`user_achievements:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'user_achievements', filter: `user_id=eq.${userId}` },
        () => { void fetchAll() },
      )
      .subscribe()
    return () => {
      cancelled = true
      void supabase.removeChannel(channel)
    }
  }, [userId])

  return { achievements: items, loading }
}
