import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import type { CacaoTree, TreeUpdate } from '../lib/database.types'
import { getCurrentSeason } from '../utils/seasonSystem'

const CARE_DELTAS = {
  water:     { health: 5,  moisture: 20, sunlight:  0 },
  sunlight:  { health: 5,  moisture: -5, sunlight: 25 },
  nutrients: { health: 25, moisture: 10, sunlight:  0 },
  pruning:   { health: 15, moisture:  0, sunlight: 20 },
  molasses:  { health: 30, moisture:  5, sunlight:  0 },
} as const

export type CareAction = keyof typeof CARE_DELTAS

export function useCocoaTrees() {
  const { user } = useAuth()
  const [trees, setTrees] = useState<CacaoTree[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTrees = async (userId: string) => {
    const { data, error: err } = await supabase
      .from('cacao_trees')
      .select('*')
      .eq('user_id', userId)
      .order('adopted_at', { ascending: false })
    if (err) throw err
    setTrees(data || [])
  }

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    // Get real Supabase user ID (useAuth().user is display name string)
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        setLoading(false)
        return
      }
      fetchTrees(data.user.id)
        .catch(e => setError(e.message))
        .finally(() => setLoading(false))
    })
  }, [user])

  const adoptTree = async (
    guardianId: number,
    variety: string,
    region: string
  ): Promise<CacaoTree> => {
    const { data: sbUser, error: authErr } = await supabase.auth.getUser()
    if (authErr || !sbUser.user) throw new Error('Not authenticated')

    // Insert tree
    const { data, error: insertErr } = await supabase
      .from('cacao_trees')
      .insert([
        {
          user_id: sbUser.user.id,
          guardian_id: guardianId,
          region,
          variety,
          adoption_season: getCurrentSeason(),
        },
      ])
      .select()
      .single()

    if (insertErr) {
      throw new Error(insertErr.message || 'Error inserting row into cacao_trees')
    }

    // Update local state
    setTrees(prev => [data, ...prev])

    // Award tokens + send adoption email via Edge Functions (best-effort, silent fail)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token
      if (token) {
        // Both fire-and-forget — UX shouldn't wait. Both Edge Functions
        // log to email_log/token_events independently and the user's
        // CauaGotchi will reflect updates on next refresh.
        const baseUrl = import.meta.env.VITE_SUPABASE_URL
        const headers = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        }

        // Token award (+10 beans, +3 mazorcas)
        fetch(`${baseUrl}/functions/v1/award-tokens`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ event_type: 'tree_adoption', ref_id: data.id }),
        }).catch(() => { /* non-critical */ })

        // Adoption confirmation email (Resend, brutalist luxury template)
        fetch(`${baseUrl}/functions/v1/send-adoption-email`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ tree_id: data.id }),
        }).catch(() => { /* non-critical */ })
      }
    } catch (_) {
      // Token award + email are non-critical; tree adoption succeeds regardless
    }

    return data
  }

  const fetchUpdatesForTree = async (treeId: string): Promise<TreeUpdate[]> => {
    const { data, error: err } = await supabase
      .from('tree_updates')
      .select('*')
      .eq('tree_id', treeId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (err) throw err
    return data || []
  }

  const careForTree = async (
    treeId: string,
    action: CareAction,
    newVitals: { health: number; moisture: number; sunlight: number; co2_kg: number },
  ): Promise<void> => {
    const { health, moisture, sunlight, co2_kg } = newVitals
    const last_update_at = new Date().toISOString()

    const { error: err } = await supabase
      .from('cacao_trees')
      .update({ health, moisture, sunlight, co2_kg, last_update_at })
      .eq('id', treeId)

    if (err) throw new Error(err.message)

    setTrees(prev => prev.map(t =>
      t.id === treeId ? { ...t, health, moisture, sunlight, co2_kg, last_update_at } : t
    ))

    supabase.from('tree_updates').insert({
      tree_id: treeId,
      update_type: 'co2_update',
      message: `${action}: HP ${health}% H₂O ${moisture}% ☀️ ${sunlight}%`,
    }).then(() => {})

    // Care faucet: reuse tree_update_read rate (+0.5 beans). Day-bucket dedup by
    // (tree, action) so spamming the same care doesn't farm beans.
    ;(async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const token = sessionData?.session?.access_token
        const uid = sessionData?.session?.user?.id
        if (!token || !uid) return
        const day = new Date().toISOString().slice(0, 10)
        const refId = `care:${treeId}:${day}:${action}`
        const { data: existing } = await supabase
          .from('token_events')
          .select('id')
          .eq('user_id', uid)
          .eq('event_type', 'tree_update_read')
          .eq('ref_id', refId)
          .limit(1)
        if (existing && existing.length > 0) return
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/award-tokens`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ event_type: 'tree_update_read', ref_id: refId }),
        })
      } catch { /* non-critical */ }
    })()

  }

  /**
   * Delete a tree row (typically a dead one the user wants out of their list).
   * RLS on cacao_trees scopes the delete to the owning user — the WHERE in
   * the supabase client is belt-and-suspenders, the policy is the real lock.
   * Tokens were already burned by tree-death-forfeit; deleting the row just
   * removes it from the UI list.
   */
  const deleteTree = async (treeId: string): Promise<void> => {
    const { data: sbUser, error: authErr } = await supabase.auth.getUser()
    if (authErr || !sbUser.user) throw new Error('Not authenticated')

    const { error: delErr } = await supabase
      .from('cacao_trees')
      .delete()
      .eq('id', treeId)
      .eq('user_id', sbUser.user.id)

    if (delErr) throw new Error(delErr.message)

    setTrees(prev => prev.filter(t => t.id !== treeId))
  }

  return { trees, loading, error, adoptTree, careForTree, fetchUpdatesForTree, deleteTree }
}
