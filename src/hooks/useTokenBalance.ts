import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

interface TokenBalance {
  beans: number
  mazorcas: number
  beansLifetime: number
}

export function useTokenBalance(): TokenBalance & { loading: boolean; error: string | null } {
  const { user } = useAuth()
  const [balance, setBalance] = useState<TokenBalance>({
    beans: 0,
    mazorcas: 0,
    beansLifetime: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const fetchBalance = async () => {
      try {
        const { data, error: err } = await supabase
          .from('user_profiles')
          .select('beans_balance, mazorcas_balance, beans_lifetime')
          .eq('user_id', user.id)
          .single()

        if (err) throw err

        setBalance({
          beans: data?.beans_balance || 0,
          mazorcas: data?.mazorcas_balance || 0,
          beansLifetime: data?.beans_lifetime || 0,
        })
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to fetch token balance')
      } finally {
        setLoading(false)
      }
    }

    fetchBalance()

    // Subscribe to realtime updates
    const subscription = supabase
      .from('user_profiles')
      .on('*', payload => {
        if (payload.new) {
          setBalance({
            beans: payload.new.beans_balance || 0,
            mazorcas: payload.new.mazorcas_balance || 0,
            beansLifetime: payload.new.beans_lifetime || 0,
          })
        }
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user])

  return { ...balance, loading, error }
}
