// Auto-generated with: npx supabase gen types typescript --local
// Manual stub until Supabase project is linked

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfile
        Insert: Omit<UserProfile, 'created_at'>
        Update: Partial<Omit<UserProfile, 'id'>>
      }
      products: {
        Row: Product
        Insert: Omit<Product, 'id' | 'created_at'>
        Update: Partial<Omit<Product, 'id'>>
      }
      bids: {
        Row: Bid
        Insert: Omit<Bid, 'id' | 'created_at'>
        Update: Partial<Omit<Bid, 'id'>>
      }
      orders: {
        Row: Order
        Insert: Omit<Order, 'id' | 'created_at'>
        Update: Partial<Omit<Order, 'id'>>
      }
      user_rituals: {
        Row: UserRitual
        Insert: Omit<UserRitual, 'id'>
        Update: Partial<UserRitual>
      }
      user_referrals: {
        Row: UserReferral
        Insert: Omit<UserReferral, 'id' | 'created_at'>
        Update: never
      }
      cookie_consents: {
        Row: CookieConsent
        Insert: Omit<CookieConsent, 'id' | 'created_at'>
        Update: Partial<CookieConsent>
      }
    }
  }
}

export interface UserProfile {
  id: string
  user_id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  locale: 'es' | 'en'
  region: 'EU' | 'US' | 'CO' | 'OTHER'
  hubspot_contact_id: string | null
  referral_code: string | null
  referral_count: number
  completed_orders: number
  ritual_streak: number
  last_seen_at: string
  created_at: string
}

export interface Product {
  id: string
  name: string
  description: string | null
  base_price_cents: number
  auction_end: string | null
  stock: number
  product_type: 'preorder' | 'auction' | 'subscription'
  image_url: string | null
  created_at: string
}

export interface Bid {
  id: string
  product_id: string
  user_id: string
  amount_cents: number
  multiplier: number
  created_at: string
}

export interface Order {
  id: string
  user_id: string
  product_id: string
  amount_cents: number
  stripe_session_id: string | null
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  created_at: string
}

export interface UserRitual {
  id: string
  user_id: string
  last_draw_date: string
  streak_count: number
  total_draws: number
}

export interface UserReferral {
  id: string
  referrer_id: string
  referred_id: string
  created_at: string
}

export interface CookieConsent {
  id: string
  session_id: string
  user_id: string | null
  necessary: true
  analytics: boolean
  marketing: boolean
  locale: 'es' | 'en'
  region: string
  ip_country: string | null
  user_agent: string | null
  created_at: string
}
