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
  caua_role: 'investor' | 'creyente' | 'nativo' | 'farmer' | 'founder'
  hubspot_contact_id: string | null
  referral_code: string | null
  referral_count: number
  completed_orders: number
  ritual_streak: number
  lead_score: number
  beans_balance: number
  mazorcas_balance: number
  beans_lifetime: number
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
  technology_id: string | null
  mvp_id: string | null
  lots_count: number
  currency: 'USD' | 'COP' | 'EUR'
  payment_provider: 'stripe' | 'mercadopago'
  mercadopago_preference_id: string | null
  created_at: string
}

export interface Technology {
  id: string
  slug: string
  name: string
  tagline: string | null
  input_description: string
  process_steps: unknown[]
  output_description: string
  lot_price_cop: number
  lot_price_usd_cents: number
  lots_total: number
  lots_funded: number
  goal_usd_cents: number
  raised_usd_cents: number
  category: string
  eu_approval_target: string | null
  active: boolean
  sort_order: number
  created_at: string
}

export interface Mvp {
  id: string
  technology_id: string
  name: string
  description: string | null
  sku: string | null
  size_label: string | null
  price_usd_cents: number
  price_cop: number | null
  stripe_price_id: string | null
  stock: number
  image_url: string | null
  active: boolean
  created_at: string
}

export interface LotInvestment {
  id: string
  user_id: string
  technology_id: string
  order_id: string
  lots_count: number
  amount_usd_cents: number
  amount_cop: number | null
  currency: 'USD' | 'COP' | 'EUR'
  caua_role: string | null
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

export interface CacaoTree {
  id: string
  user_id: string
  guardian_id: number
  region: string
  variety: 'Criollo' | 'Trinitario' | 'Forastero' | 'Nacional'
  stage: 'Semilla' | 'Plántula' | 'Árbol Joven' | 'Árbol Adulto' | 'Cosecha'
  adopted_at: string
  predicted_harvest_at: string | null
  co2_kg: number
  health: number
  moisture: number
  sunlight: number
  last_update_at: string
  created_at: string
}

export interface TreeUpdate {
  id: string
  tree_id: string
  update_type: 'climate' | 'stage_change' | 'harvest_prediction' | 'co2_update'
  message: string
  climate_data: Record<string, unknown> | null
  created_at: string
}
