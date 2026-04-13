import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { trackLoggedInUser } from '../lib/hubspotTracking'
import type { UserProfile } from '../lib/database.types'

const SUPER_ADMINS = ['amauryamed@gmail.com', 'amaury@cauaculture.co']

// ── Types ─────────────────────────────────────────────────────────────────────
interface AuthState {
  user:       string | null
  userId:     string | null
  email:      string | null        // raw email — used for admin CRM guard
  isAdmin:    boolean              // true only for SUPER_ADMIN
  profile:    UserProfile | null
  loading:    boolean
  setUser:    (u: string | null) => void
  signOut:    () => Promise<void>
}

const AuthContext = createContext<AuthState>({
  user: null, userId: null, email: null, isAdmin: false,
  profile: null, loading: true,
  setUser: () => {}, signOut: async () => {},
})

export const useAuth = () => useContext(AuthContext)

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUserState] = useState<string | null>(null)
  const [userId,  setUserId]    = useState<string | null>(null)
  const [email,   setEmail]     = useState<string | null>(null)
  const [profile, setProfile]   = useState<UserProfile | null>(null)
  const [loading, setLoading]   = useState(true)

  const isAdmin = email ? SUPER_ADMINS.includes(email) || profile?.caua_role === 'founder' : false

  // ── ONE DB CALL per session ────────────────────────────────────────────────
  const fetchProfile = useCallback(async (userId: string, userEmail: string) => {
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    const p = data as UserProfile | null
    if (!p) return

    setProfile(p)

    supabase.from('user_profiles')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('user_id', userId)
      .then(() => {})

    trackLoggedInUser(userEmail, {
      region:           p.region,
      ritual_streak:    p.ritual_streak,
      completed_orders: p.completed_orders,
      referral_count:   p.referral_count,
    })
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: { user: { id: string; email?: string; user_metadata?: Record<string, string> } } | null } }) => {
      if (session?.user) {
        const display = session.user.user_metadata?.full_name
          ?? session.user.email?.split('@')[0] ?? 'usuario'
        setUserState(display)
        setUserId(session.user.id)
        setEmail(session.user.email ?? null)
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
          setUserId(session.user.id)
          setEmail(session.user.email ?? null)
          fetchProfile(session.user.id, session.user.email ?? '')
        } else {
          setUserState(null)
          setUserId(null)
          setEmail(null)
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
    setUserId(null)
    setEmail(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, userId, email, isAdmin, profile, loading, setUser, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
