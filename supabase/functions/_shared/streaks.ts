// _shared/streaks.ts — pure helpers for streak math + multipliers used by
// award-tokens and recompute-level. No DB calls; just numeric math.

/**
 * Streak multiplier: 1 + min(streak_days, 30) × 0.01
 * → +1% per day, capped at +30% at 30 days.
 */
export function streakMultiplier(streakDays: number): number {
  const days = Math.max(0, Math.min(30, streakDays | 0))
  return 1 + days * 0.01
}

/**
 * Sunrise multiplier: ×1.25 if it's between 5am and 8am Bogotá time.
 * Used for "first care of the day" bonus.
 */
export function sunriseMultiplier(now: Date): number {
  // Bogotá is UTC-5 (no DST).
  const hourBogota = (now.getUTCHours() - 5 + 24) % 24
  return hourBogota >= 5 && hourBogota < 8 ? 1.25 : 1.0
}

/**
 * Level multiplier: L1=1.0, L2=1.05, L3=1.10, L4=1.15
 */
export function levelMultiplier(level: number): number {
  switch (level) {
    case 4:  return 1.15
    case 3:  return 1.10
    case 2:  return 1.05
    default: return 1.0
  }
}

/**
 * Title and level for a given XP total. Thresholds:
 *   L1 Aprendiz   0–99
 *   L2 Cuidador   100–499
 *   L3 Guardian   500–1999
 *   L4 Maestro    2000+
 */
export function levelFromXp(xp: number): { level: number; title: string } {
  if (xp >= 2000) return { level: 4, title: 'Maestro' }
  if (xp >= 500)  return { level: 3, title: 'Guardian' }
  if (xp >= 100)  return { level: 2, title: 'Cuidador' }
  return { level: 1, title: 'Aprendiz' }
}

/**
 * Combined multiplier for an award. Multiplies all applicable bonuses.
 * Caller decides which bonuses to apply (e.g. sunrise only on first care).
 */
export function combinedMultiplier(opts: {
  streakDays?: number
  sunrise?: boolean
  iotVerified?: boolean
  level?: number
  guardianDiversity?: boolean // adopted all 5 guardians
}): number {
  let m = 1.0
  if (opts.streakDays !== undefined)  m *= streakMultiplier(opts.streakDays)
  if (opts.sunrise)                   m *= 1.25
  if (opts.iotVerified)               m *= 1.5
  if (opts.level !== undefined)       m *= levelMultiplier(opts.level)
  if (opts.guardianDiversity)         m *= 1.10
  return m
}

/**
 * Mazorca rarity from a harvest score.
 * Score = mucilage_g + cacao_mass_g + (combo ? 200 : 0) + (sunrise ? 50 : 0)
 */
export function mazorcaRarity(score: number): 'common' | 'rare' | 'epic' | 'legendary' {
  if (score >= 500) return 'legendary'
  if (score >= 300) return 'epic'
  if (score >= 100) return 'rare'
  return 'common'
}
