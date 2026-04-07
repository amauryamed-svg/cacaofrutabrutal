import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { trackLoggedInUser } from '../lib/hubspotTracking'
import type { UserProfile } from '../lib/database.types'

// ── Types ─────────────────────────────────────────────────────────────────────
interface AuthState {
  user:    string | null
  profile: UserProfile | null   // single DB fetch on login, cached for session
  loading: boolean
  setUser: (u: string | null) => void
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState>({
  user: null, profile: null, loading: true,
  setUser: () => {}, signOut: async () => {},
})

export const useAuth = () => useContext(AuthContext)

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUserState] = useState<string | null>(null)
  const [profile, setProfile]   = useState<UserProfile | null>(null)
  const [loading, setLoading]   = useState(true)

  // ── ONE DB CALL per session ── fetches all user state at once ─────────────
  const fetchProfile = useCallback(async (userId: string, email: string) => {
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    const p = data as UserProfile | null
    if (!p) return

    setProfile(p)

    // last_seen update — fire-and-forget, never blocks or re-fetches
    supabase.from('user_profiles')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('user_id', userId)
      .then(() => {})

    // HubSpot first-party tracking — gates on analytics consent internally
    trackLoggedInUser(email, {
      region:           p.region,
      ritual_streak:    p.ritual_streak,
      completed_orders: p.completed_orders,
      referral_count:   p.referral_count,
    })
  }, [])

  // ── Supabase auth listener ─────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: { user: { id: string; email?: string; user_metadata?: Record<string, string> } } | null } }) => {
      if (session?.user) {
        const display = session.user.user_metadata?.full_name
          ?? session.user.email?.split('@')[0] ?? 'usuario'
        setUserState(display)
        fetchProfile(session.user.id, session.user.email ?? '')
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: string, session: { user: { id: string; email?: string; user_metadata?: Record<string, string> } } | null) => {
        if (session?.user) {
          const display = session.user.user_metadata?.full_name
            ?? session.user.email?.split('@')[0] ?? 'usuario'
          setUserState(display)
          fetchProfile(session.user.id, session.user.email ?? '')
        } else {
          setUserState(null)
          setProfile(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  const setUser = (u: string | null) => setUserState(u)
  const signOut = async () => {
    await supabase.auth.signOut()
    setUserState(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, setUser, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
