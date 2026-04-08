// ── Crowdfunding Types ────────────────────────────────────────────────────────

export type CauaRole = 'investor' | 'creyente' | 'colono' | 'nativo' | 'farmer' | 'founder'

export interface RoleConfig {
  label: string
  labelEs: string
  icon: string
  color: string
  desc: string
  descEs: string
  minUsd: number
}

export const ROLE_CONFIG: Record<CauaRole, RoleConfig> = {
  investor: {
    label: 'Investor',  labelEs: 'Inversor',
    icon: '💼', color: '#00A3CD',
    desc: 'Angel capital + returns',   descEs: 'Capital ángel + retornos',
    minUsd: 1000,
  },
  founder: {
    label: 'Founder',   labelEs: 'Fundador',
    icon: '⚡', color: '#F7F1EE',
    desc: 'Core team + equity',        descEs: 'Equipo fundador + equity',
    minUsd: 0,
  },
  colono: {
    label: 'Settler',   labelEs: 'Colono',
    icon: '🏡', color: '#F1A91E',
    desc: 'Regional pioneer backer',   descEs: 'Pionero regional',
    minUsd: 100,
  },
  creyente: {
    label: 'Believer',  labelEs: 'Creyente',
    icon: '🌱', color: '#91A63B',
    desc: 'Community early adopter',   descEs: 'Early adopter comunitario',
    minUsd: 20,
  },
  nativo: {
    label: 'Native',    labelEs: 'Nativo',
    icon: '🌿', color: '#8D2679',
    desc: 'Heritage guardian',         descEs: 'Guardián del territorio',
    minUsd: 10,
  },
  farmer: {
    label: 'Farmer',    labelEs: 'Guardián',
    icon: '🫘', color: '#DB5527',
    desc: 'Supplies fresh mucilage',   descEs: 'Proveedor de mucílago fresco',
    minUsd: 0,
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
  | 'coinbase_usdc'      // USDC on-chain — Coinbase Commerce
  | 'coinbase_cop_digital' // COP Digital — en proceso
  | 'coinbase_eur_digital' // EUR Digital — en proceso
export type InvestMode   = 'lot' | 'mvp'
