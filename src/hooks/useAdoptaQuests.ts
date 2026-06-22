import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export type AdoptaQuest = {
  id: string
  quest_id: string
  state: 'open' | 'complete' | 'claimed'
  target: number
  progress: number
  reward_mz: number
  title: string
  descripcion: string
  started_at: string
  completed_at: string | null
  claimed_at: string | null
}

/**
 * List active and completed quests for the user. Claim atomically via the
 * claim_adopta_quest RPC. Hides claimed quests from the active list but keeps
 * them in `claimed` for retro display.
 */
export function useAdoptaQuests(): {
  active: AdoptaQuest[]
  claimed: AdoptaQuest[]
  loading: boolean
  claim: (questId: string) => Promise<{ ok: boolean; reward?: number; error?: string }>
} {
  const { userId } = useAuth()
  const [items, setItems] = useState<AdoptaQuest[]>([])
  const [loading, setLoading] = useState<boolean>(() => Boolean(userId))

  const fetchAll = useCallback(async () => {
    if (!userId) return
    const { data } = await supabase
      .from('adopta_quests')
      .select('id, quest_id, state, target, progress, reward_mz, title, descripcion, started_at, completed_at, claimed_at')
      .eq('user_id', userId)
      .order('started_at', { ascending: true })
    setItems((data ?? []) as AdoptaQuest[])
    setLoading(false)
  }, [userId])

  useEffect(() => {
    if (!userId) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchAll()
    const channel = supabase
      .channel(`adopta_quests:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'adopta_quests', filter: `user_id=eq.${userId}` },
        () => { void fetchAll() },
      )
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [userId, fetchAll])

  const claim = useCallback(
    async (questId: string) => {
      if (!userId) return { ok: false, error: 'unauthenticated' }
      const quest = items.find((q) => q.id === questId)
      if (!quest) return { ok: false, error: 'quest_not_found' }
      const { data, error } = await supabase.rpc('claim_adopta_quest', {
        p_user_id: userId,
        p_quest_id: questId,
      })
      if (error) return { ok: false, error: error.message }
      const reward = (data as { reward_mz?: number } | null)?.reward_mz
      await fetchAll()
      return { ok: true, reward }
    },
    [userId, items, fetchAll],
  )

  return {
    active:  items.filter((q) => q.state !== 'claimed'),
    claimed: items.filter((q) => q.state === 'claimed'),
    loading,
    claim,
  }
}
