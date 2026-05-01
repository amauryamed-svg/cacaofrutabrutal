import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  as string
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!SUPABASE_URL || !SUPABASE_ANON) {
  console.warn('[CAUA] Supabase env vars not set — running in mock mode')
}

// Auth options are mostly defaults, but stating them explicitly documents
// the intent and lets us tune later (e.g. flowType for OAuth).
// supabase-js auto-retries `Failed to fetch` during _refreshAccessToken
// internally; transient network blips look noisy in DevErrorMonitor but
// don't actually break the session — DevErrorMonitor.tsx filters them.
//
// Untyped until `npx supabase gen types typescript --local` runs.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = createClient<any>(
  SUPABASE_URL  || 'https://placeholder.supabase.co',
  SUPABASE_ANON || 'placeholder-anon-key',
  {
    auth: {
      autoRefreshToken:    true,
      persistSession:      true,
      detectSessionInUrl:  true,
      // NOTE: do not set storageKey — changing it invalidates every existing
      // user session (forces re-login). Default key is fine.
    },
  },
)
