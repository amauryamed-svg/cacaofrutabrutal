export interface Product {
  id: number
  name: string
  desc: string
  price: number
  type: 'preorder' | 'auction' | 'subscription'
  stock: number
  timer?: number
  img: string
}

export interface TarotCard {
  id: number
  name: string
  meaning: string
  advice: string
  element: 'Tierra' | 'Fuego' | 'Agua' | 'Aire'
}

export interface Guardian {
  name: string
  region: string
  town: string
  power: string
  varieties: string[]
  companions: string[]
  character: string
  emoji: string
  variety_benefit: string   // Main benefit description for this variety
  territory: string         // Territory / heritage story
  market_uses: string[]     // End-product use cases
  pods: string              // Pod color/description
  heritage: string          // Heritage note (awards, recognition, legacy)
  blogSlug?: string         // Slug del post en /blog/{slug} con la historia territorial
}

export interface UserProfile {
  id: string
  email: string
  username: string
  referralCount: number
  previousLots: number
  ritualStreak: number
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface Bid {
  id: string
  productId: number
  userId: string
  amountCents: number
  multiplier: number
  createdAt: string
}

export interface Order {
  id: string
  userId: string
  productId: number
  amountCents: number
  stripeSessionId?: string
  status: 'pending' | 'completed' | 'failed'
  createdAt: string
}

export type Page = 'home' | 'auth' | 'market' | 'ritual' | 'impact'
