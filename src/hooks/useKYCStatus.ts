import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
  KYC_TIER_REQUIREMENTS,
  type GatedAction,
  type KycTier,
} from '../utils/constants'

// AuthContext exposes `userId` (UUID) and `user` (display name).

export interface KYCStatus {
  status: 'none' | 'pending' | 'verified' | 'failed' | 'blocked' | 'paused_review'
  tier: KycTier
  verifiedAt: string | null
  walletAddress: string | null
  chainId: number | null
  country: string | null
  geoBlocked: boolean
}

const EMPTY: KYCStatus = {
  status: 'none',
  tier: 0,
  verifiedAt: null,
  walletAddress: null,
  chainId: null,
  country: null,
  geoBlocked: false,
}

/**
 * Reads KYC + wallet binding state from user_profiles.
 * RLS ensures the user only sees their own row.
 */
export function useKYCStatus() {
  const { userId } = useAuth()
  const [data, setData] = useState<KYCStatus>(EMPTY)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!userId) {
      setData(EMPTY)
      setLoading(false)
      return
    }
    setLoading(true)
    const { data: row, error } = await supabase
      .from('user_profiles')
      .select('kyc_status, kyc_tier, kyc_verified_at, wallet_address, wallet_chain_id, country, geo_blocked')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      setError(error.message)
      setData(EMPTY)
    } else if (row) {
      setData({
        status: (row.kyc_status as KYCStatus['status']) ?? 'none',
        tier: ((row.kyc_tier as number) ?? 0) as KycTier,
        verifiedAt: row.kyc_verified_at ?? null,
        walletAddress: row.wallet_address ?? null,
        chainId: row.wallet_chain_id ?? null,
        country: row.country ?? null,
        geoBlocked: !!row.geo_blocked,
      })
    }
    setLoading(false)
  }, [userId])

  useEffect(() => { refresh() }, [refresh])

  /** True if the user can perform `action` per docs/KYC.md tier matrix. */
  const canPerform = (action: GatedAction): boolean => {
    if (data.geoBlocked) return false
    if (data.status !== 'verified') return false
    return data.tier >= KYC_TIER_REQUIREMENTS[action]
  }

  return { ...data, loading, error, refresh, canPerform }
}
