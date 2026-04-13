import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import type { CacaoTree, TreeUpdate } from '../lib/database.types'

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
        },
      ])
      .select()
      .single()

    if (insertErr) {
      console.error('Supabase DB Insert Error:', insertErr)
      throw new Error(insertErr.message || 'Error inserting row into cacao_trees')
    }

    // Update local state
    setTrees(prev => [data, ...prev])

    // Award tokens via Edge Function (best-effort, silent fail)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token
      if (token) {
        await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/award-tokens`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ event_type: 'tree_adoption', ref_id: data.id }),
          }
        )
      }
    } catch (_) {
      // Token award is non-critical; tree adoption succeeds regardless
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

  return { trees, loading, error, adoptTree, fetchUpdatesForTree }
}
