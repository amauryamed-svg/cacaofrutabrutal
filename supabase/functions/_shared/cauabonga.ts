/**
 * CauaBonga — canonical game constants + yield/soil math.
 *
 * Single source of truth for the P2E farming-sim per ADR CB-006
 * (.octogent/tentacles/cauabonga/architecture.md §12). Both the React client
 * (preview yield in CauaBongaPlot.tsx) and the server (claim-cauabonga-harvest
 * Edge Function) read these constants and run the same yield formula.
 *
 * 🔒 PARITY LOCK with `supabase/functions/_shared/cauabonga.ts`. The two files
 * MUST be byte-identical below this header. CI parity test enforced via
 * `scripts/check-cauabonga-parity.sh` (TBD CB-006 follow-up). When you change
 * one, copy the change to the other in the same commit. Deno cross-imports
 * from `src/utils/` are not supported in this repo's Edge Function build, so
 * we keep two copies linked by convention + CI.
 *
 * Cross-references:
 *   - GDD: .octogent/tentacles/cauabonga/GDD.md (§5 guardianes · §6 plots ·
 *          §7 crops · §9 soil-health · §10 harvest+token flow)
 *   - Economy: .octogent/tentacles/cauabonga/economy.md (§2 faucets ·
 *          §4 regen vs traditional curves · §6 daily caps)
 *   - Architecture: .octogent/tentacles/cauabonga/architecture.md (§2 schema ·
 *          §3 Edge Functions · §6 anti-degeneracy)
 *
 * Style: pure functions, no React/DOM imports, no fetch — must be importable
 * by both the browser bundle and Deno (Edge Functions).
 */

// ─── Crop catalog (GDD §7 + economy.md §2.1, §3.1) ────────────────

export type CropSlug =
  | 'cacao_criollo'
  | 'cacao_trinitario'
  | 'cacao_forastero'
  | 'platano_dominico'
  | 'platano_harton'
  | 'cedro'
  | 'guayacan'
  | 'guanabana'
  | 'aguacate'
  | 'criollo_elite'

export interface CropSpec {
  slug:           CropSlug
  /** Display name (Spanish, brand-aligned). */
  label:          string
  /** Base mazorcas yielded per harvest, pre-multipliers (GDD §7). */
  baseYield:      number
  /** Grow time in minutes from plant → ready. Server-authoritative. */
  growMinutes:    number
  /** Regen-mode multiplier (1.00 = parity with traditional). */
  regenMult:      number
  /** Seed cost in mazorcas. `null` = drop-only (cannot be bought). */
  seedCost:       number | null
  /** XP level required to plant this crop (GDD §12). */
  unlockLevel:    number
  /** Optional companion bonus this crop CONFERS on neighbors (% additive). */
  conferCompanionPct?: number
  /** Crop family — used for companion-stack calculations. */
  family: 'cacao' | 'platano' | 'forestal' | 'frutal'
}

export const CROPS: Record<CropSlug, CropSpec> = {
  cacao_criollo: {
    slug: 'cacao_criollo',
    label: 'Cacao Criollo',
    baseYield: 12, growMinutes: 480, regenMult: 1.30, seedCost: 25,
    unlockLevel: 1, family: 'cacao',
  },
  cacao_trinitario: {
    slug: 'cacao_trinitario',
    label: 'Cacao Trinitario',
    baseYield: 14, growMinutes: 360, regenMult: 1.25, seedCost: 35,
    unlockLevel: 1, family: 'cacao',
  },
  cacao_forastero: {
    slug: 'cacao_forastero',
    label: 'Cacao Forastero',
    baseYield: 10, growMinutes: 300, regenMult: 1.20, seedCost: 18,
    unlockLevel: 1, family: 'cacao',
  },
  platano_dominico: {
    slug: 'platano_dominico',
    label: 'Plátano Dominico',
    baseYield: 8, growMinutes: 240, regenMult: 1.15, seedCost: 12,
    unlockLevel: 2, family: 'platano',
    conferCompanionPct: 10,                                    // +10% nitrogen to adjacent cacao
  },
  platano_harton: {
    slug: 'platano_harton',
    label: 'Plátano Hartón',
    baseYield: 6, growMinutes: 180, regenMult: 1.10, seedCost: 10,
    unlockLevel: 2, family: 'platano',
    conferCompanionPct: 8,
  },
  cedro: {
    slug: 'cedro',
    label: 'Cedro forestal',
    baseYield: 40, growMinutes: 1440, regenMult: 1.50, seedCost: 60,
    unlockLevel: 5, family: 'forestal',
    conferCompanionPct: 20,                                    // +20% to cacao within 2 tiles
  },
  guayacan: {
    slug: 'guayacan',
    label: 'Guayacán',
    baseYield: 55, growMinutes: 1800, regenMult: 1.50, seedCost: 80,
    unlockLevel: 8, family: 'forestal',
    conferCompanionPct: 25,                                    // +25% to frutales within 2 tiles
  },
  guanabana: {
    slug: 'guanabana',
    label: 'Guanábana',
    baseYield: 25, growMinutes: 720, regenMult: 1.25, seedCost: 45,
    unlockLevel: 10, family: 'frutal',
    conferCompanionPct: 15,
  },
  aguacate: {
    slug: 'aguacate',
    label: 'Aguacate Hass',
    baseYield: 30, growMinutes: 960, regenMult: 1.20, seedCost: 55,
    unlockLevel: 10, family: 'frutal',
  },
  criollo_elite: {
    slug: 'criollo_elite',
    label: 'Criollo Élite',
    baseYield: 50, growMinutes: 720, regenMult: 1.40, seedCost: null,
    unlockLevel: 15, family: 'cacao', conferCompanionPct: 30,
  },
}

// ─── MVP crop subset (GDD §19) ─────────────────────────────────────
// Lucho's finca, regen mode only, 2 crops only.
export const MVP_CROPS: readonly CropSlug[] = ['cacao_criollo', 'platano_dominico'] as const

// ─── Soil-health yield multiplier (GDD §9, economy.md §4.1) ────────
// Tier table — 5 discrete bands. Server + client must agree exactly.

const SOIL_TIERS: ReadonlyArray<{ min: number; max: number; mult: number }> = [
  { min:   0, max:  10, mult: 0.30 },
  { min:  11, max:  30, mult: 0.60 },
  { min:  31, max:  60, mult: 1.00 },
  { min:  61, max:  85, mult: 1.20 },
  { min:  86, max: 100, mult: 1.40 },
]

export function soilMultiplier(soilHealth: number): number {
  const clamped = Math.max(0, Math.min(100, Math.round(soilHealth)))
  for (const tier of SOIL_TIERS) {
    if (clamped >= tier.min && clamped <= tier.max) return tier.mult
  }
  return 1.00
}

// ─── Soil delta per harvest (GDD §9, economy.md §4.2) ──────────────

export const SOIL_DELTAS = {
  /** Regen harvest with companion crop adjacent (cacao + platano/forestal). */
  regenHarvestCompanion: +2,
  /** Regen harvest, solo (no companion bonus). */
  regenHarvestSolo:      +1,
  /** Traditional (monoculture) harvest — soil degrades. */
  traditionalHarvest:    -3,
  /** Daily fallow recovery while tile sits in fallow state. */
  fallowDailyRecovery:   +1,
  /** Pest event hit (rare, GDD §16). */
  pestEvent:             -5,
  /** Mulch ring upgrade (GDD §6 tile upgrade). */
  mulchRingUpgrade:      +5,
  /** Soil restore via $CACAO burn (GDD §10 hard sink). */
  soilRestoreBurn:      +20,
} as const

// ─── Regen vs traditional rules (GDD §7) ───────────────────────────

export interface ModeRules {
  /** Hours of fallow required after harvest. */
  fallowHours:       number
  /** Care actions required to be eligible for harvest. */
  careActionsRequired: number
  /** XP multiplier on harvest. */
  xpMult:            number
  /** Eligible for rare seed drops? */
  eligibleForRareDrops: boolean
  /** Soil delta on harvest (signed). */
  harvestSoilDelta:  number
}

export const MODE_RULES: Record<'regen' | 'traditional', ModeRules> = {
  regen: {
    fallowHours: 24,
    careActionsRequired: 4,
    xpMult: 1.5,
    eligibleForRareDrops: true,
    harvestSoilDelta: SOIL_DELTAS.regenHarvestSolo,
  },
  traditional: {
    fallowHours: 0,
    careActionsRequired: 2,
    xpMult: 1.0,
    eligibleForRareDrops: false,
    harvestSoilDelta: SOIL_DELTAS.traditionalHarvest,
  },
}

// ─── Plot grid (GDD §6) ────────────────────────────────────────────

export const PLOT_GRID_SIZE = 5                                // 5×5 = 25 tiles total
export const PLOT_TILE_COUNT_TIERS = [9, 13, 17, 21, 25] as const  // unlock tiers
export const PLOT_TILE_COUNT_LEVELS = [1, 5, 10, 15, 20, 25] as const  // XP gates

export function tileCountForLevel(level: number): number {
  if (level >= 25) return 25
  if (level >= 20) return 21
  if (level >= 15) return 17
  if (level >= 10) return 13
  return 9
}

// ─── Guardian regional modifiers (GDD §5) ──────────────────────────
// guardian_id matches src/utils/constants.ts:99 GUARDIANS array order.

export interface GuardianModifier {
  guardianId: 0 | 1 | 2 | 3 | 4
  name:       string
  /** Mode of bonus: 'shadeCanopy' | 'rareDropChance' | 'altitudePremium' | 'biodiversityStack' | 'trazabilidadVerified' */
  kind:       'shadeCanopy' | 'rareDropChance' | 'altitudePremium' | 'biodiversityStack' | 'trazabilidadVerified'
  /** Free-form parameters (interpreted by computeRegionalModifier). */
  params:     Record<string, number>
}

export const GUARDIAN_MODIFIERS: ReadonlyArray<GuardianModifier> = [
  {
    guardianId: 0, name: 'Lucho', kind: 'shadeCanopy',
    params: { cacaoBonusPctIfForestalNeighbor: 20 },
  },
  {
    guardianId: 1, name: 'Marta', kind: 'rareDropChance',
    params: { dropPctPerRegenHarvest: 1, dropYieldMultiplier: 5 },
  },
  {
    guardianId: 2, name: 'Rafael', kind: 'altitudePremium',
    params: { yieldMultiplier: 1.50, growTimeMultiplier: 1.30, pestDamageMultiplier: 0.50 },
  },
  {
    guardianId: 3, name: 'Fernando', kind: 'biodiversityStack',
    params: { perUniqueCompanionPct: 4, maxStackPct: 24 },
  },
  {
    guardianId: 4, name: 'Ricardo', kind: 'trazabilidadVerified',
    params: { verifiedBatchBonusPct: 25, requiredCareStreakDays: 7 },
  },
]

// ─── Daily emission caps (economy.md §6) ───────────────────────────

export const DAILY_CAPS = {
  /** Hard ceiling on mazorcas any user can earn in 24h, all sources combined. */
  hardCeilingMz:        200,
  /** Cap on harvest-only emission within 24h. */
  harvestCapMz:         120,
  /** Cap on quest reward emission within 24h. */
  questCapMz:           120,
  /** Cap on plot mints per user per 24h (Charter §10 rate-limit). */
  plotMintsPerDay:      1,
  /** Cap on $CACAO redemptions per user per 30 days. */
  cacaoRedemptionsPerMonth: 1,
} as const

// ─── Anti-grind diminishing returns (architecture.md §6) ───────────
// Yield is multiplied by `diminishingMult` based on harvest count in last 24h.

const DIMINISHING_TIERS: ReadonlyArray<{ harvestsBefore: number; mult: number }> = [
  { harvestsBefore:  0, mult: 1.00 },
  { harvestsBefore:  6, mult: 0.85 },
  { harvestsBefore: 12, mult: 0.65 },
  { harvestsBefore: 20, mult: 0.40 },
]

export function diminishingMultiplier(harvestsInLast24h: number): number {
  const n = Math.max(0, Math.floor(harvestsInLast24h))
  let mult = 1.00
  for (const tier of DIMINISHING_TIERS) {
    if (n >= tier.harvestsBefore) mult = tier.mult
  }
  return mult
}

// ─── Yield computation — THE FORMULA ───────────────────────────────
// economy.md §2.1:
//   harvest_mazorcas = base_yield × regen_mult × soil_mult × companion_mult
//                    × regional_mod × streak_bonus × diminishing_mult

export interface YieldInputs {
  cropSlug:           CropSlug
  mode:               'regen' | 'traditional'
  soilHealth:         number             // 0-100 at harvest time
  /** Snapshot at plant time so yield is deterministic if neighbors change. */
  companionBonusPct:  number             // additive %, server-authoritative
  guardianId:         number             // 0-4
  /** Number of completed harvests by this user in the trailing 24h window. */
  harvestsInLast24h:  number
  /** True if the player has hit Marta's rare-drop or other streak bonus. */
  streakBonusPct?:    number             // additive %, default 0
  /** True if the regional modifier applies on this tile (server validates). */
  regionalModApplies?: boolean
}

export interface YieldBreakdown {
  cropSlug:         CropSlug
  mode:             'regen' | 'traditional'
  baseYield:        number
  regenMult:        number
  soilMult:         number
  companionMult:    number
  regionalMod:      number
  streakBonus:      number
  diminishingMult:  number
  yieldMz:          number               // final, rounded down to nearest mazorca
}

export function computeYield(inputs: YieldInputs): YieldBreakdown {
  const crop = CROPS[inputs.cropSlug]
  if (!crop) throw new Error(`unknown_crop:${inputs.cropSlug}`)

  const baseYield     = crop.baseYield
  const regenMult     = inputs.mode === 'regen' ? crop.regenMult : 1.00
  const soilMult      = soilMultiplier(inputs.soilHealth)
  const companionMult = 1 + Math.max(0, inputs.companionBonusPct) / 100
  const regionalMod   = inputs.regionalModApplies
    ? regionalMultiplierFor(inputs.guardianId, inputs.cropSlug)
    : 1.00
  const streakBonus     = 1 + Math.max(0, inputs.streakBonusPct ?? 0) / 100
  const diminishingMult = diminishingMultiplier(inputs.harvestsInLast24h)

  const raw = baseYield
            * regenMult
            * soilMult
            * companionMult
            * regionalMod
            * streakBonus
            * diminishingMult

  return {
    cropSlug:        inputs.cropSlug,
    mode:            inputs.mode,
    baseYield,
    regenMult,
    soilMult,
    companionMult,
    regionalMod,
    streakBonus,
    diminishingMult,
    yieldMz:         Math.floor(raw),
  }
}

function regionalMultiplierFor(guardianId: number, cropSlug: CropSlug): number {
  const mod = GUARDIAN_MODIFIERS[guardianId]
  if (!mod) return 1.00
  switch (mod.kind) {
    case 'shadeCanopy':
      // +20% on cacao tiles when a forestal neighbor exists.
      // Caller passes regionalModApplies=true only after server checks the neighbor.
      return CROPS[cropSlug].family === 'cacao'
        ? 1 + (mod.params.cacaoBonusPctIfForestalNeighbor ?? 0) / 100
        : 1.00
    case 'altitudePremium':
      return mod.params.yieldMultiplier ?? 1.00
    case 'trazabilidadVerified':
      return 1 + (mod.params.verifiedBatchBonusPct ?? 0) / 100
    case 'biodiversityStack':
      // companion stack handled in companionBonusPct upstream — no double-dip.
      return 1.00
    case 'rareDropChance':
      // Rare drop is on TOP of the standard yield, applied separately by the server.
      return 1.00
    default:
      return 1.00
  }
}

// ─── Soil delta computation ────────────────────────────────────────

export interface SoilDeltaInputs {
  mode:                'regen' | 'traditional'
  hasAdjacentCompanion: boolean             // for regen-companion bonus
}

export function computeSoilDelta(inputs: SoilDeltaInputs): {
  delta: number
  reason:
    | 'regen_harvest_companion'
    | 'regen_harvest_solo'
    | 'traditional_harvest'
} {
  if (inputs.mode === 'traditional') {
    return { delta: SOIL_DELTAS.traditionalHarvest, reason: 'traditional_harvest' }
  }
  return inputs.hasAdjacentCompanion
    ? { delta: SOIL_DELTAS.regenHarvestCompanion, reason: 'regen_harvest_companion' }
    : { delta: SOIL_DELTAS.regenHarvestSolo,      reason: 'regen_harvest_solo' }
}

// ─── Care action cooldowns (GDD §8) ────────────────────────────────

export const CARE_COOLDOWNS_MINUTES = {
  water: 30,
  sun:   30,
  /** Once per growth cycle. */
  nutrient: -1,
  /** Once per growth cycle. */
  pruning:  -1,
} as const
