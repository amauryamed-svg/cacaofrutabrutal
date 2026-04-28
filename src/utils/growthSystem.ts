export interface GrowthStage {
  id: number
  name: string
  emoji: string
  hoursThreshold: number   // hours after adoption to enter this stage (was dayThreshold; same numeric scale, new unit)
  description: string
  careTip: string
  problemRisk: string[]
  pixel: string[]  // 8-bit ascii art lines
}

export interface PlantProblem {
  id: string
  name: string
  emoji: string
  description: string
  healthDamage: number
  cure: string[]
}

export interface SpecialItem {
  id: string
  name: string
  emoji: string
  description: string
  healthBoost: number
  growthBoost: number
  rarity: 'common' | 'uncommon' | 'rare' | 'secret'
  cures?: string[]
}

/**
 * 8 etapas de crecimiento, espaciadas para un ciclo total de 5 horas (same-day care).
 * Thresholds en horas después de la adopción.
 */
export const GROWTH_STAGES: GrowthStage[] = [
  {
    id: 0, name: 'Siembra', emoji: '🌰', hoursThreshold: 0,
    description: 'La semilla de cacao descansa en tierra húmeda colombiana, esperando despertar.',
    careTip: 'Riega suavemente cada 30 minutos para activar la germinación.',
    problemRisk: ['plague'],
    pixel: ['  🌰  ', ' ≈≈≈≈≈', '░░░░░░', '██████'],
  },
  {
    id: 1, name: 'Germinación', emoji: '🌱', hoursThreshold: 0.6,
    description: 'La primera raíz blanca emerge buscando agua y nutrientes.',
    careTip: '¡Las plagas atacan semillas recién germinadas! Vigila de cerca.',
    problemRisk: ['plague', 'drought'],
    pixel: ['  🌱  ', '  ┃   ', ' ≈≈≈≈≈', '░░░░░░'],
  },
  {
    id: 2, name: 'Plántula', emoji: '🌿', hoursThreshold: 1.2,
    description: 'Dos cotiledones verdes asoman hacia la luz tropical del bosque.',
    careTip: 'Evita el hongo — aplica Melaza Orgánica si ves manchas oscuras.',
    problemRisk: ['fungus', 'plague'],
    pixel: [' 🍃🌿🍃', '  ┃   ', ' ≈≈≈≈≈', '░░░░░░'],
  },
  {
    id: 3, name: 'Crecimiento', emoji: '🌾', hoursThreshold: 2,
    description: 'Las primeras hojas verdaderas absorben la luz del sol amazónico.',
    careTip: 'La poda lateral estimula un crecimiento más fuerte y vigoroso.',
    problemRisk: ['plague', 'drought'],
    pixel: ['🍃🌾🍃', ' 🌾🌾 ', '  ┃┃  ', '░░░░░░'],
  },
  {
    id: 4, name: 'Desarrollo', emoji: '🌳', hoursThreshold: 2.8,
    description: 'El árbol joven establece su estructura principal y copa.',
    careTip: 'Los nutrientes del suelo son críticos para la estructura final.',
    problemRisk: ['fungus', 'drought'],
    pixel: ['🌳🌳🌳', '🌳🌳🌳', ' ┃┃┃  ', '░░░░░░'],
  },
  {
    id: 5, name: 'Floración', emoji: '🌸', hoursThreshold: 3.5,
    description: 'Pequeñas flores blancas brotan directamente del tronco del árbol.',
    careTip: '¡Protege las flores de las plagas — son el futuro del cacao!',
    problemRisk: ['plague'],
    pixel: ['🌸🌳🌸', '🌳🌸🌳', ' ┃┃┃  ', '░░░░░░'],
  },
  {
    id: 6, name: 'Formación', emoji: '🫘', hoursThreshold: 4,
    description: 'Las mazorcas de cacao toman forma en el tronco del árbol.',
    careTip: 'El hongo pod rot es la mayor amenaza — usa Melaza Orgánica.',
    problemRisk: ['fungus'],
    pixel: ['🌳🫘🌳', '🫘🌳🫘', ' ┃┃┃  ', '░░░░░░'],
  },
  {
    id: 7, name: 'Maduración', emoji: '🍫', hoursThreshold: 4.6,
    description: '¡Las mazorcas de oro están listas! Cosecha tu chocolate y canjea por mazorcas.',
    careTip: 'Pulsa RECOLECTAR para cosechar — recibes mazorcas canjeables por chocolate real.',
    problemRisk: [],
    pixel: ['🌳🍫🌳', '🫘🌳🫘', '🌟✨🌟', '░░░░░░'],
  },
]

export const PLANT_PROBLEMS: Record<string, PlantProblem> = {
  plague: {
    id: 'plague', name: 'Ataque de Plagas', emoji: '🐛',
    description: 'Las plagas atacaron por falta de riego. ¡Riega o aplica Melaza!',
    healthDamage: 15, cure: ['water', 'molasses'],
  },
  fungus: {
    id: 'fungus', name: 'Hongo Destructivo', emoji: '🍄',
    description: 'La humedad sin cuidado generó hongo. Usa la Melaza Orgánica Secreta.',
    healthDamage: 25, cure: ['molasses'],
  },
  drought: {
    id: 'drought', name: 'Sequía Crítica', emoji: '🏜️',
    description: 'Tu árbol se está muriendo de sed. ¡Riega ahora mismo!',
    healthDamage: 20, cure: ['water'],
  },
}

export const SPECIAL_ITEMS: Record<string, SpecialItem> = {
  nutrients: {
    id: 'nutrients', name: 'Nutrientes del Bosque', emoji: '🌿',
    description: 'Mezcla de microorganismos del suelo amazónico. Salud +25, crecimiento +10.',
    healthBoost: 25, growthBoost: 10, rarity: 'rare',
  },
  pruning: {
    id: 'pruning', name: 'Poda Científica', emoji: '✂️',
    description: 'Corte estratégico para maximizar floración. Salud +15, crecimiento +20.',
    healthBoost: 15, growthBoost: 20, rarity: 'uncommon',
  },
  molasses: {
    id: 'molasses', name: 'Melaza Anti-Hongo', emoji: '🍯',
    description: 'SECRETO ANCESTRAL: Melaza fermentada de caña. Cura hongos y plagas al instante.',
    healthBoost: 30, growthBoost: 5, rarity: 'secret',
    cures: ['fungus', 'plague'],
  },
}

/** Ciclo total de adopción: 5 horas (same-day care). */
export const ADOPTION_HOURS = 5

/** Cooldown entre cuidados básicos: 30 minutos. Permite ~10 acciones por ciclo. */
export const CARE_INTERVAL_MIN = 30
export const CARE_INTERVAL_MS  = CARE_INTERVAL_MIN * 60 * 1000

/** Threshold para que el árbol esté listo a cosechar (hours). Coincide con stage 7 Maduración. */
export const HARVEST_HOURS_THRESHOLD = 4.6

export function getStageByHours(hoursSince: number): GrowthStage {
  const sorted = [...GROWTH_STAGES].sort((a, b) => b.hoursThreshold - a.hoursThreshold)
  return sorted.find(s => hoursSince >= s.hoursThreshold) ?? GROWTH_STAGES[0]
}

export function getHealthStatus(health: number): { label: string; emoji: string; color: string } {
  if (health >= 80) return { label: 'Excelente', emoji: '😊', color: '#91A63B' }
  if (health >= 60) return { label: 'Bueno',     emoji: '🙂', color: '#F1A91E' }
  if (health >= 40) return { label: 'Alerta',    emoji: '😟', color: '#DB5527' }
  if (health >= 20) return { label: 'Crítico',   emoji: '😰', color: '#8C201D' }
  return { label: 'Muriendo', emoji: '💀', color: '#8C201D' }
}

/** "1h 23m" / "12m" / "45s" / "¡Ahora!" — works with any positive ms-difference. */
export function formatTimeUntil(targetDate: Date): string {
  const diff = targetDate.getTime() - Date.now()
  if (diff <= 0) return '¡Ahora!'
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000)   / 1000)
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

/** Próximo momento permitido para cuidar (lastCaredAt + 30min). */
export function getNextCareTime(lastCaredAt: Date): Date {
  return new Date(lastCaredAt.getTime() + CARE_INTERVAL_MS)
}

/** Horas transcurridas desde la fecha de adopción. */
export function hoursSinceAdoption(adoptedAt: Date | string): number {
  const t = typeof adoptedAt === 'string' ? new Date(adoptedAt) : adoptedAt
  return (Date.now() - t.getTime()) / 3600000
}

/** Progreso del ciclo 0..1 (capped at 1 cuando el árbol llegó a maduración). */
export function getCycleProgress(adoptedAt: Date | string): number {
  return Math.min(1, hoursSinceAdoption(adoptedAt) / ADOPTION_HOURS)
}

/** True cuando el árbol está listo para cosechar (stage Maduración). */
export function isHarvestReady(adoptedAt: Date | string): boolean {
  return hoursSinceAdoption(adoptedAt) >= HARVEST_HOURS_THRESHOLD
}

// ─── ERC-721 metadata helpers ───────────────────────────────────────────
// Used by the tree-metadata Edge Function to compose the dynamic tokenURI.
// Mirror in supabase/functions/tree-metadata/index.ts — keep both in sync.

export interface TreeForMetadata {
  guardian_id: number
  region: string
  variety: string
  health: number | null
  moisture: number | null
  sunlight: number | null
  co2_kg: number | null
  adopted_at: string | Date
}

export interface MetadataAttribute {
  trait_type: string
  value: string | number
  max_value?: number
}

const GUARDIAN_NAMES = [
  'Lucho · Huila',
  'Marta · Arauca',
  'Rafael · Cundinamarca',
  'Fernando · Meta',
  'Ricardo · Santander',
] as const

/**
 * Compute a rarity score from current vitals + stage progression.
 * Higher health + further-along stage = rarer = more valuable on secondary market.
 * The exact formula is part of the gameplay reward loop and may be tuned in Phase 4.
 */
export function getRarityScore(tree: TreeForMetadata): number {
  const stage = getStageByHours(hoursSinceAdoption(tree.adopted_at))
  return Math.round(
    (tree.health ?? 80) * 2
    + (tree.moisture ?? 70)
    + (tree.sunlight ?? 60)
    + stage.id * 50
  )
}

/**
 * Build the OpenSea-compatible attributes[] array for an ERC-721 tokenURI.
 * Stable shape across the game loop — every care action regenerates this and
 * emits ERC-4906 MetadataUpdate so marketplaces refresh.
 */
export function getMetadataAttributes(tree: TreeForMetadata): MetadataAttribute[] {
  const stage = getStageByHours(hoursSinceAdoption(tree.adopted_at))
  const guardian = GUARDIAN_NAMES[tree.guardian_id] ?? `Guardian ${tree.guardian_id}`
  return [
    { trait_type: 'Stage',                value: stage.name },
    { trait_type: 'Variety',              value: tree.variety },
    { trait_type: 'Guardian',             value: guardian },
    { trait_type: 'Region',               value: tree.region },
    { trait_type: 'Health',               value: tree.health ?? 0,   max_value: 100 },
    { trait_type: 'Moisture',             value: tree.moisture ?? 0, max_value: 100 },
    { trait_type: 'Sunlight',             value: tree.sunlight ?? 0, max_value: 100 },
    { trait_type: 'CO₂ sequestered (kg)', value: Number(tree.co2_kg ?? 0) },
    { trait_type: 'Rarity score',         value: getRarityScore(tree) },
  ]
}
