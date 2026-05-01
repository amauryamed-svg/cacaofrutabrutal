import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

interface TokenBalance {
  beans: number
  mazorcas: number
  beansLifetime: number
  /** Grams of mucilage carried by the user (Phase 1 — harvest minigame output,
   *  chocolate-making input). Persisted in user_profiles by migration 037. */
  mucilageG: number
  /** Grams of fermented cacao mass — same lifecycle as mucilage. */
  cacaoMassG: number
  /** Off-chain count of chocolate bars forged in the Lab (Phase 3 — mig 038). */
  chocolateBarsMade: number
}

export function useTokenBalance(): TokenBalance & { loading: boolean; error: string | null } {
  const { userId } = useAuth()
  const [balance, setBalance] = useState<TokenBalance>({
    beans: 0,
    mazorcas: 0,
    beansLifetime: 0,
    mucilageG: 0,
    cacaoMassG: 0,
    chocolateBarsMade: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const fetchBalance = async () => {
      try {
        const { data, error: err } = await supabase
          .from('user_profiles')
          .select('beans_balance, mazorcas_balance, beans_lifetime, mucilage_g, cacao_mass_g, chocolate_bars_made')
          .eq('user_id', userId)
          .single()

        if (err) throw err

        setBalance({
          beans: data?.beans_balance || 0,
          mazorcas: data?.mazorcas_balance || 0,
          beansLifetime: data?.beans_lifetime || 0,
          mucilageG: Number(data?.mucilage_g ?? 0),
          cacaoMassG: Number(data?.cacao_mass_g ?? 0),
          chocolateBarsMade: Number(data?.chocolate_bars_made ?? 0),
        })
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to fetch token balance')
      } finally {
        setLoading(false)
      }
    }

    fetchBalance()

    // Poll for updates every 5 seconds
    const interval = setInterval(fetchBalance, 5000)
    return () => clearInterval(interval)
  }, [userId])

  return { ...balance, loading, error }
}
