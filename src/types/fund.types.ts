// ── Crowdfunding Types ────────────────────────────────────────────────────────

export type CauaRole = 'investor' | 'creyente' | 'nativo' | 'farmer' | 'founder'

export interface RoleConfig {
  label: string
  labelEs: string
  icon: string
  color: string
  desc: string
  descEs: string
  minUsd: number
  discount: number         // 0–1 multiplier off price
  canPost: boolean        // blog post creation
  canVend: boolean        // vendor listing
  isSuperAdmin: boolean   // full CRM + admin access
}

export const ROLE_CONFIG: Record<CauaRole, RoleConfig> = {
  investor: {
    label: 'Investor',  labelEs: 'Inversor',
    icon: '💼', color: '#00A3CD',
    desc: 'Angel capital + returns',   descEs: 'Capital ángel + retornos',
    minUsd: 1000, discount: 0.5, canPost: false, canVend: false, isSuperAdmin: false,
  },
  founder: {
    label: 'Founder',   labelEs: 'Fundador',
    icon: '⚡', color: '#F7F1EE',
    desc: 'Core team + equity',        descEs: 'Equipo fundador + equity',
    minUsd: 0, discount: 0, canPost: true, canVend: true, isSuperAdmin: true,
  },
  creyente: {
    label: 'Believer',  labelEs: 'Creyente',
    icon: '🌱', color: '#91A63B',
    desc: 'Community early adopter',   descEs: 'Early adopter comunitario',
    minUsd: 20, discount: 0.15, canPost: false, canVend: false, isSuperAdmin: false,
  },
  nativo: {
    label: 'Native',    labelEs: 'Nativo',
    icon: '🌿', color: '#8D2679',
    desc: 'Heritage guardian',         descEs: 'Guardián del territorio',
    minUsd: 10, discount: 0.25, canPost: false, canVend: false, isSuperAdmin: false,
  },
  farmer: {
    label: 'Farmer',    labelEs: 'Guardián',
    icon: '🫘', color: '#DB5527',
    desc: 'Supplies fresh mucilage',   descEs: 'Proveedor de mucílago fresco',
    minUsd: 0, discount: 0, canPost: true, canVend: true, isSuperAdmin: false,
  },
}

export interface ProcessStep {
  step: number
  label: string
  icon: string
  detail: string
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

export interface Technology {
  id: string
  slug: string
  name: string
  tagline: string | null
  input_description: string
  process_steps: ProcessStep[]
  output_description: string
  lot_price_cop: number
  lot_price_usd_cents: number
  lots_total: number
  lots_funded: number
  goal_usd_cents: number
  raised_usd_cents: number
  category: 'extract' | 'hydrosol' | 'beverage' | 'ferment' | 'ceremonial'
  eu_approval_target: string | null
  active: boolean
  sort_order: number
  created_at: string
  mvps?: Mvp[]
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

export type Currency      = 'COP' | 'USD' | 'EUR'
export type PaymentMethod =
  | 'mercadopago'        // COP — PSE, Nequi, Daviplata
  | 'stripe_usd'         // USD — Visa/MC/Amex
  | 'stripe_eur'         // EUR — Visa/MC/Amex
  | 'wallet_eth_direct'  // ETH directo → wallets CTO/CEO (Bitso/Coinbase Wallet); usa record-investor-transfer Edge Fn
  | 'coinbase_usdc'      // DEPRECATED — usar wallet_eth_direct (kept por backwards compat con DB enum existente)
  | 'coinbase_cop_digital' // en proceso
  | 'coinbase_eur_digital' // en proceso
export type InvestMode   = 'lot' | 'mvp'
