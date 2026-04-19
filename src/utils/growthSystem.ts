export interface GrowthStage {
  id: number
  name: string
  emoji: string
  dayThreshold: number
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

export const GROWTH_STAGES: GrowthStage[] = [
  {
    id: 0, name: 'Siembra', emoji: '🌰', dayThreshold: 0,
    description: 'La semilla de cacao descansa en tierra húmeda colombiana, esperando despertar.',
    careTip: 'Riega suavemente cada 3 horas para activar la germinación.',
    problemRisk: ['plague'],
    pixel: ['  🌰  ', ' ≈≈≈≈≈', '░░░░░░', '██████'],
  },
  {
    id: 1, name: 'Germinación', emoji: '🌱', dayThreshold: 0.6,
    description: 'La primera raíz blanca emerge buscando agua y nutrientes.',
    careTip: '¡Las plagas atacan semillas recién germinadas! Vigila de cerca.',
    problemRisk: ['plague', 'drought'],
    pixel: ['  🌱  ', '  ┃   ', ' ≈≈≈≈≈', '░░░░░░'],
  },
  {
    id: 2, name: 'Plántula', emoji: '🌿', dayThreshold: 1.2,
    description: 'Dos cotiledones verdes asoman hacia la luz tropical del bosque.',
    careTip: 'Evita el hongo — aplica Melaza Orgánica si ves manchas oscuras.',
    problemRisk: ['fungus', 'plague'],
    pixel: [' 🍃🌿🍃', '  ┃   ', ' ≈≈≈≈≈', '░░░░░░'],
  },
  {
    id: 3, name: 'Crecimiento', emoji: '🌾', dayThreshold: 2,
    description: 'Las primeras hojas verdaderas absorben la luz del sol amazónico.',
    careTip: 'La poda lateral estimula un crecimiento más fuerte y vigoroso.',
    problemRisk: ['plague', 'drought'],
    pixel: ['🍃🌾🍃', ' 🌾🌾 ', '  ┃┃  ', '░░░░░░'],
  },
  {
    id: 4, name: 'Desarrollo', emoji: '🌳', dayThreshold: 2.8,
    description: 'El árbol joven establece su estructura principal y copa.',
    careTip: 'Los nutrientes del suelo son críticos para la estructura final.',
    problemRisk: ['fungus', 'drought'],
    pixel: ['🌳🌳🌳', '🌳🌳🌳', ' ┃┃┃  ', '░░░░░░'],
  },
  {
    id: 5, name: 'Floración', emoji: '🌸', dayThreshold: 3.5,
    description: 'Pequeñas flores blancas brotan directamente del tronco del árbol.',
    careTip: '¡Protege las flores de las plagas — son el futuro del cacao!',
    problemRisk: ['plague'],
    pixel: ['🌸🌳🌸', '🌳🌸🌳', ' ┃┃┃  ', '░░░░░░'],
  },
  {
    id: 6, name: 'Formación', emoji: '🫘', dayThreshold: 4,
    description: 'Las mazorcas de cacao toman forma en el tronco del árbol.',
    careTip: 'El hongo pod rot es la mayor amenaza — usa Melaza Orgánica.',
    problemRisk: ['fungus'],
    pixel: ['🌳🫘🌳', '🫘🌳🫘', ' ┃┃┃  ', '░░░░░░'],
  },
  {
    id: 7, name: 'Maduración', emoji: '🍫', dayThreshold: 4.6,
    description: '¡Las mazorcas de oro están listas! El cacao de mayor calidad del mundo.',
    careTip: 'Cosecha cuidadosa — cada mazorca es trabajo de años de cuidado.',
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

export const CARE_INTERVAL_HOURS = 3
export const ADOPTION_DAYS = 5

export function getStageByDays(daysSince: number): GrowthStage {
  const sorted = [...GROWTH_STAGES].sort((a, b) => b.dayThreshold - a.dayThreshold)
  return sorted.find(s => daysSince >= s.dayThreshold) ?? GROWTH_STAGES[0]
}

export function getHealthStatus(health: number): { label: string; emoji: string; color: string } {
  if (health >= 80) return { label: 'Excelente', emoji: '😊', color: '#91A63B' }
  if (health >= 60) return { label: 'Bueno', emoji: '🙂', color: '#F1A91E' }
  if (health >= 40) return { label: 'Alerta', emoji: '😟', color: '#DB5527' }
  if (health >= 20) return { label: 'Crítico', emoji: '😰', color: '#8C201D' }
  return { label: 'Muriendo', emoji: '💀', color: '#8C201D' }
}

export function formatTimeUntil(targetDate: Date): string {
  const diff = targetDate.getTime() - Date.now()
  if (diff <= 0) return '¡Ahora!'
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export function getNextCareTime(lastCaredAt: Date): Date {
  const next = new Date(lastCaredAt)
  next.setHours(next.getHours() + CARE_INTERVAL_HOURS)
  return next
}
