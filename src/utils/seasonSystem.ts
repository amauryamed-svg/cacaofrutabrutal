/**
 * seasonSystem.ts — Colombian cacao seasonal calendar + XP progression.
 *
 * Colombia has two main cacao harvest cycles per year tied to the bimodal
 * rainfall regime of the Andean foothills. Four named seasons:
 *
 *   Floración     Jan-Mar  Flowers bloom on the trunk (cauliflory)
 *   Mitaca        Apr-Jun  Minor harvest — artisan premium lots
 *   Traviesa      Jul-Sep  Dry season — critical irrigation
 *   Cosecha Mayor Oct-Dec  Main harvest — full arena mode
 *
 * Each season unlocks a different care mini-game and modifies reward rates.
 */

export type CacaoSeason = 'floracion' | 'mitaca' | 'traviesa' | 'cosecha_mayor'
export type SeasonMiniGame = 'pollinate' | 'irrigate' | 'selective_pick' | 'machete_arena'

export interface SeasonData {
  id:            CacaoSeason
  name:          string
  nameEn:        string
  emoji:         string
  months:        number[]       // 1-based months in this season
  tagline:       string
  taglineEn:     string
  miniGame:      SeasonMiniGame
  miniGameLabel: string
  miniGameLabelEn: string
  // Gameplay effects
  droughtRisk:    boolean       // moisture drains 40% faster
  harvestBonus:   number        // multiplier on mazorca rewards
  careXPBonus:    number        // extra % XP per care action
  podMultiplier:  number        // how many pods appear on tree (relative)
  // Visual
  bgTint:        string         // RGBA overlay on tree frame
  accentColor:   string         // season's dominant color
  particleEmoji: string         // floating particle for season
}

export const SEASONS: Record<CacaoSeason, SeasonData> = {
  floracion: {
    id: 'floracion',
    name: 'Floración', nameEn: 'Flowering Season',
    emoji: '🌸',
    months: [1, 2, 3],
    tagline: 'Las flores brotan del tronco. Poliniza para asegurar la cosecha.',
    taglineEn: 'Flowers bloom from the trunk. Pollinate to secure the harvest.',
    miniGame: 'pollinate',
    miniGameLabel: '🌸 POLINIZAR',
    miniGameLabelEn: '🌸 POLLINATE',
    droughtRisk: false,
    harvestBonus: 1.4,
    careXPBonus: 20,
    podMultiplier: 0.5,
    bgTint: '#8D267920',
    accentColor: '#D060C0',
    particleEmoji: '🌸',
  },
  mitaca: {
    id: 'mitaca',
    name: 'Mitaca', nameEn: 'Minor Harvest',
    emoji: '🫘',
    months: [4, 5, 6],
    tagline: 'Cosecha menor. Pods premium — lotes de chocolate artesanal de temporada.',
    taglineEn: 'Minor harvest. Premium pods — seasonal artisan chocolate lots.',
    miniGame: 'selective_pick',
    miniGameLabel: '🫘 COSECHA SELECTIVA',
    miniGameLabelEn: '🫘 SELECTIVE PICK',
    droughtRisk: false,
    harvestBonus: 1.3,
    careXPBonus: 15,
    podMultiplier: 0.7,
    bgTint: '#D4901A20',
    accentColor: '#D4901A',
    particleEmoji: '🫘',
  },
  traviesa: {
    id: 'traviesa',
    name: 'Traviesa', nameEn: 'Dry Season',
    emoji: '☀️',
    months: [7, 8, 9],
    tagline: 'Sequía andina. Riego manual crítico. Sobrevive y gana XP 2×.',
    taglineEn: 'Andean drought. Critical irrigation. Survive and earn 2× XP.',
    miniGame: 'irrigate',
    miniGameLabel: '💧 IRRIGAR RAÍCES',
    miniGameLabelEn: '💧 IRRIGATE ROOTS',
    droughtRisk: true,
    harvestBonus: 0.9,
    careXPBonus: 30,
    podMultiplier: 0.4,
    bgTint: '#A0601020',
    accentColor: '#E08820',
    particleEmoji: '💧',
  },
  cosecha_mayor: {
    id: 'cosecha_mayor',
    name: 'Cosecha Mayor', nameEn: 'Main Harvest',
    emoji: '🌽',
    months: [10, 11, 12],
    tagline: 'La gran cosecha. Machete arena full. Mazorcas en su máximo potencial.',
    taglineEn: 'Main harvest. Full machete arena. Pods at maximum potential.',
    miniGame: 'machete_arena',
    miniGameLabel: '🍫 ARENA MACHETE',
    miniGameLabelEn: '🍫 MACHETE ARENA',
    droughtRisk: false,
    harvestBonus: 1.8,
    careXPBonus: 15,
    podMultiplier: 1.5,
    bgTint: '#91A63B20',
    accentColor: '#91A63B',
    particleEmoji: '🌽',
  },
}

export function getCurrentSeason(): CacaoSeason {
  const month = new Date().getMonth() + 1
  for (const [id, data] of Object.entries(SEASONS)) {
    if (data.months.includes(month)) return id as CacaoSeason
  }
  return 'cosecha_mayor'
}

export function getSeasonData(season?: CacaoSeason): SeasonData {
  return SEASONS[season ?? getCurrentSeason()]
}

// Days until next season transition (useful for countdown)
export function daysToSeasonEnd(): number {
  const now    = new Date()
  const season = getCurrentSeason()
  const data   = SEASONS[season]
  const lastSeasonMonth = data.months[data.months.length - 1]
  // Days remaining in last month of season
  const endDate = new Date(now.getFullYear(), lastSeasonMonth, 0)  // last day of last month
  return Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / 86400000))
}

// ── XP System ──────────────────────────────────────────────────────────────────
// XP is computed in-session from care actions. Persistence: caller decides (Supabase vs local).

export const XP_PER_ACTION: Record<string, number> = {
  water:     12,
  sunlight:   8,
  nutrients: 22,
  pruning:   18,
  molasses:  28,
  pollinate: 40,   // seasonal bonus action
  irrigate:  35,
  harvest:   50,
}

export function calcXPEarned(action: string, season: CacaoSeason, health: number): number {
  const base    = XP_PER_ACTION[action] ?? 10
  const bonus   = base * (SEASONS[season].careXPBonus / 100)
  const danger  = health < 40 ? 8 : 0   // bonus for saving a struggling tree
  return Math.round(base + bonus + danger)
}

// Level thresholds (cumulative XP needed)
const LEVEL_XP = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200, 4000]

export function calcLevel(totalXP: number): {
  level: number
  progress: number   // 0..1 within current level
  xpToNext: number
  xpInLevel: number
} {
  let level = 1
  for (let i = 1; i < LEVEL_XP.length; i++) {
    if (totalXP >= LEVEL_XP[i]) level = i + 1
    else break
  }
  const floorIdx  = Math.min(level - 1, LEVEL_XP.length - 1)
  const ceilIdx   = Math.min(level, LEVEL_XP.length - 1)
  const xpFloor   = LEVEL_XP[floorIdx]
  const xpCeil    = LEVEL_XP[ceilIdx]
  const inLevel   = totalXP - xpFloor
  const levelSpan = xpCeil - xpFloor
  return {
    level,
    progress: levelSpan > 0 ? inLevel / levelSpan : 1,
    xpToNext: Math.max(0, xpCeil - totalXP),
    xpInLevel: inLevel,
  }
}

export function levelToMultiplier(level: number): number {
  if (level >= 20) return 3.0
  if (level >= 10) return 2.0
  if (level >= 5)  return 1.5
  if (level >= 3)  return 1.25
  return 1.0
}

export function levelTitle(level: number, es = true): string {
  const titles: [number, string, string][] = [
    [1,  'Sembrador',    'Planter'   ],
    [3,  'Cultivador',   'Cultivator'],
    [5,  'Guardián',     'Guardian'  ],
    [10, 'Maestro',      'Master'    ],
    [20, 'Gran Cacaotero','Grand Cacaotero'],
  ]
  for (let i = titles.length - 1; i >= 0; i--) {
    if (level >= titles[i][0]) return es ? titles[i][1] : titles[i][2]
  }
  return es ? 'Sembrador' : 'Planter'
}
