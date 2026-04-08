import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Technology } from '../types/fund.types'

// ── Static fallback — mirrors 002_crowdfunding.sql seed ──────────────────────
// Shown when the remote DB migration hasn't been applied yet.
// Tags and images here are the source-of-truth visual identity for each tech.
const STATIC_TECHNOLOGIES: Technology[] = [
  {
    id: 'static-mucilage',
    slug: 'mucilage-extract',
    name: 'MucilageExtract™',
    tagline: 'Liofilización de mucílago de cacao criollo élite para Novel Food EU',
    input_description: '40 kg de baba de cacao fresca · variedades criollo élite certificadas · 0 pesticidas',
    process_steps: [
      { step: 1, label: 'Cosecha',         icon: '🫘', detail: 'Recolección en 48h post-apertura · máxima actividad enzimática' },
      { step: 2, label: 'Centrifugación',  icon: '⚗️', detail: 'Separación de semillas · conservación de pulpa viva' },
      { step: 3, label: 'Liofilización',   icon: '❄️', detail: 'Secado a -50°C · conservación de bioactivos · <2% humedad' },
      { step: 4, label: 'MucilageExtract™',icon: '🧪', detail: 'Polvo funcional · vida útil 24 meses · certificado orgánico' },
    ],
    output_description: '22 kg MucilageExtract™ · polvo liofilizado premium · Novel Food EU pending',
    lot_price_cop: 1000000,
    lot_price_usd_cents: 25000,
    lots_total: 1000,
    lots_funded: 47,
    goal_usd_cents: 25000000,
    raised_usd_cents: 1175000,
    category: 'extract',
    eu_approval_target: 'EFSA Novel Food Authorization · en trámite',
    active: true,
    sort_order: 1,
    created_at: new Date().toISOString(),
    mvps: [
      {
        id: 'static-mvp-1',
        technology_id: 'static-mucilage',
        name: 'Baba de Cacao',
        description: 'Pulpa liofilizada 100% cacao criollo élite · Bebible · Sin aditivos',
        sku: 'MVP-BAB-100G',
        size_label: '100g',
        price_usd_cents: 2000,
        price_cop: 80000,
        stripe_price_id: null,
        stock: 500,
        image_url: null,
        active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'static-mvp-2',
        technology_id: 'static-mucilage',
        name: 'Mucílago Puro',
        description: 'Sachets concentrados · mucílago liofilizado puro · <2% humedad',
        sku: 'MVP-MUC-50G',
        size_label: '50g',
        price_usd_cents: 1500,
        price_cop: 60000,
        stripe_price_id: null,
        stock: 300,
        image_url: null,
        active: true,
        created_at: new Date().toISOString(),
      },
    ],
  },
  {
    id: 'static-hydrosol',
    slug: 'hydrosol',
    name: 'HydroSol™',
    tagline: 'Destilación de hidrosoles de cacao para industria de bebidas EU',
    input_description: '60 kg de baba de cacao (híbridos acriollados + trinitarios)',
    process_steps: [
      { step: 1, label: 'Selección varietal', icon: '🌱', detail: 'Híbridos acriollados y trinitarios certificados' },
      { step: 2, label: 'Prensado + vapor',   icon: '💧', detail: 'Destilación por arrastre de vapor a 100°C' },
      { step: 3, label: 'Separación',         icon: '⚗️', detail: 'Separación agua floral + aceite esencial' },
      { step: 4, label: 'Filtración fría',    icon: '🧪', detail: 'Micro-filtración 0.22µm · estabilización de pH' },
    ],
    output_description: '15 L hidrosol premium + 50 mL aceite esencial de cacao',
    lot_price_cop: 800000,
    lot_price_usd_cents: 20000,
    lots_total: 500,
    lots_funded: 20,
    goal_usd_cents: 10000000,
    raised_usd_cents: 400000,
    category: 'hydrosol',
    eu_approval_target: 'EFSA Botanical Substances List · en trámite',
    active: true,
    sort_order: 2,
    created_at: new Date().toISOString(),
    mvps: [
      {
        id: 'static-mvp-3',
        technology_id: 'static-hydrosol',
        name: 'Hidrosol de Cacao',
        description: 'Agua floral de cacao premium · Uso cosmético + alimentario · IaaS B2B',
        sku: 'MVP-HYD-100ML',
        size_label: '100mL',
        price_usd_cents: 3500,
        price_cop: 140000,
        stripe_price_id: null,
        stock: 150,
        image_url: null,
        active: true,
        created_at: new Date().toISOString(),
      },
    ],
  },
  {
    id: 'static-brew',
    slug: 'theobroma-brew',
    name: 'TheobromaBrew™',
    tagline: 'Fermentación fría y bebidas funcionales de mucílago',
    input_description: '20 kg baba de cacao liofilizada MucilageExtract™',
    process_steps: [
      { step: 1, label: 'Rehidratación',  icon: '🫙', detail: 'Rehidratación controlada 4°C — 12h' },
      { step: 2, label: 'Fermentación',   icon: '🦠', detail: 'Lactofermentación espontánea 48h con probióticos nativos' },
      { step: 3, label: 'Cold Brew',      icon: '☕', detail: 'Maceración en frío 72h · 0°C — extrae cafeína + teobromina' },
      { step: 4, label: 'Embotellado',    icon: '🍶', detail: 'Carbonatación natural + envasado en N₂ inerte' },
    ],
    output_description: '200 L bebida funcional · 400 botellas 500mL',
    lot_price_cop: 600000,
    lot_price_usd_cents: 15000,
    lots_total: 300,
    lots_funded: 0,
    goal_usd_cents: 5000000,
    raised_usd_cents: 0,
    category: 'beverage',
    eu_approval_target: 'EFSA Novel Food Authorization · en trámite',
    active: true,
    sort_order: 3,
    created_at: new Date().toISOString(),
    mvps: [
      {
        id: 'static-mvp-4',
        technology_id: 'static-brew',
        name: 'SUNRISE SHOT Fermentado',
        description: 'Bebida funcional · mucílago fermentado · probióticos nativos · 0% azúcar',
        sku: 'MVP-SUN-250ML',
        size_label: '250mL',
        price_usd_cents: 1200,
        price_cop: 48000,
        stripe_price_id: null,
        stock: 400,
        image_url: null,
        active: true,
        created_at: new Date().toISOString(),
      },
    ],
  },
]

interface FundData {
  technologies: Technology[]
  totalRaisedUsd: number
  totalGoalUsd: number
  loading: boolean
  error: string | null
}

export function useFundData(): FundData {
  const [technologies, setTechnologies] = useState<Technology[]>([])
  const [loading, setLoading] = useState(true)
  const [error]              = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('technologies')
      .select('*, mvps(*)')
      .eq('active', true)
      .order('sort_order')
      .then(({ data, error: err }) => {
        if (err) {
          // Table may not exist yet — show static data silently
          setTechnologies(STATIC_TECHNOLOGIES)
          setLoading(false)
          return
        }
        const rows = (data as Technology[]) ?? []
        // If migration ran but no seed, fall back to static
        setTechnologies(rows.length > 0 ? rows : STATIC_TECHNOLOGIES)
        setLoading(false)
      })
  }, [])

  const totalRaisedUsd = technologies.reduce((s, t) => s + t.raised_usd_cents, 0)
  const totalGoalUsd   = technologies.reduce((s, t) => s + t.goal_usd_cents, 0)

  return { technologies, totalRaisedUsd, totalGoalUsd, loading, error }
}
