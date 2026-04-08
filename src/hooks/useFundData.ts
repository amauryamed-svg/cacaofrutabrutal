import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Technology } from '../types/fund.types'

interface FundData {
  technologies: Technology[]
  totalRaisedUsd: number
  totalGoalUsd: number
  loading: boolean
  error: string | null
}

export function useFundData(): FundData {
  const [technologies, setTechnologies] = useState<Technology[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('technologies')
      .select('*, mvps(*)')
      .eq('active', true)
      .order('sort_order')
      .then(({ data, error: err }) => {
        if (err) { setError(err.message); return }
        setTechnologies((data as Technology[]) ?? [])
        setLoading(false)
      })
  }, [])

  const totalRaisedUsd = technologies.reduce((s, t) => s + t.raised_usd_cents, 0)
  const totalGoalUsd   = technologies.reduce((s, t) => s + t.goal_usd_cents, 0)

  return { technologies, totalRaisedUsd, totalGoalUsd, loading, error }
}
