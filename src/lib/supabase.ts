import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  as string
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!SUPABASE_URL || !SUPABASE_ANON) {
  console.warn('[CAUA] Supabase env vars not set — running in mock mode')
}

// Untyped until `npx supabase gen types typescript --local` runs
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = createClient<any>(
  SUPABASE_URL  || 'https://placeholder.supabase.co',
  SUPABASE_ANON || 'placeholder-anon-key',
)
