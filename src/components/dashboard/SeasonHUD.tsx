/**
 * SeasonHUD — season banner + XP progression bar.
 *
 * Shows above the tree in CauaGotchi:
 *   [🌸 FLORACIÓN] ─────── [LVL 4 · GUARDIÁN] [████░░ 340/450 XP]
 *   tagline text
 *   [🌸 POLINIZAR] button (season mini-game CTA)
 */

import type { CSSProperties } from 'react'
import { FONTS } from '../../utils/constants'
import {
  getSeasonData,
  calcLevel,
  levelTitle,
  levelToMultiplier,
  daysToSeasonEnd,
  type CacaoSeason,
} from '../../utils/seasonSystem'

interface Props {
  season?: CacaoSeason
  totalXP: number
  onMiniGame: () => void
  lang?: 'es' | 'en'
  compact?: boolean   // minimal version for narrow screens
}

export default function SeasonHUD({
  season, totalXP, onMiniGame, lang = 'es', compact = false,
}: Props) {
  const es   = lang === 'es'
  const data = getSeasonData(season)
  const lv   = calcLevel(totalXP)
  const mult = levelToMultiplier(lv.level)
  const days = daysToSeasonEnd()

  return (
    <div style={wrapStyle(data.accentColor)}>
      {/* Row 1 — season badge + XP bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        {/* Season badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
          <span style={{ fontSize: 18 }}>{data.emoji}</span>
          <div>
            <div style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 7, letterSpacing: '0.14em',
              color: data.accentColor,
              lineHeight: 1.4,
            }}>
              {es ? data.name.toUpperCase() : data.nameEn.toUpperCase()}
            </div>
            <div style={{
              fontFamily: FONTS.display, fontSize: 9,
              color: '#F7F1EE44', letterSpacing: '0.1em',
            }}>
              {days}d restantes
            </div>
          </div>
        </div>

        {/* XP bar + level */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 140, justifyContent: 'flex-end' }}>
          {/* Level badge */}
          <div style={{
            padding: '2px 7px',
            background: '#F7F1EE12',
            border: `1px solid ${data.accentColor}55`,
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 6, color: data.accentColor,
            letterSpacing: '0.1em', whiteSpace: 'nowrap',
          }}>
            LVL {lv.level}
          </div>

          {/* XP progress bar */}
          <div style={{ flex: 1, maxWidth: 100 }}>
            <div style={{
              height: 6,
              background: '#F7F1EE12',
              border: `1px solid ${data.accentColor}33`,
              borderRadius: 1,
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${Math.round(lv.progress * 100)}%`,
                background: `linear-gradient(90deg, ${data.accentColor}88, ${data.accentColor})`,
                transition: 'width 0.6s ease',
                boxShadow: `0 0 4px ${data.accentColor}`,
              }} />
            </div>
            <div style={{
              fontFamily: FONTS.display, fontSize: 8,
              color: '#F7F1EE44', letterSpacing: '0.06em',
              marginTop: 2,
            }}>
              {lv.xpToNext} XP → LVL {lv.level + 1}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2 — tagline + multiplier */}
      {!compact && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 10, marginTop: 8, flexWrap: 'wrap',
        }}>
          <p style={{
            fontFamily: FONTS.body, fontSize: 10,
            color: '#F7F1EE66', lineHeight: 1.5, margin: 0, flex: 1,
            maxWidth: 260,
          }}>
            {es ? data.tagline : data.taglineEn}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            {/* Harvest multiplier */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                fontFamily: "'Press Start 2P', monospace", fontSize: 6,
                color: '#F7F1EE44', letterSpacing: '0.1em',
              }}>
                YIELD MULT
              </div>
              <div style={{
                fontFamily: "'Press Start 2P', monospace", fontSize: 10,
                color: data.accentColor,
                textShadow: `0 0 8px ${data.accentColor}`,
              }}>
                {(mult * data.harvestBonus).toFixed(1)}×
              </div>
            </div>

            {/* Level title */}
            <div style={{
              fontFamily: FONTS.display, fontSize: 9, fontWeight: 700,
              color: `${data.accentColor}cc`, letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}>
              {levelTitle(lv.level, es)}
            </div>
          </div>
        </div>
      )}

      {/* Row 3 — season mini-game CTA */}
      <button
        onClick={onMiniGame}
        style={miniGameBtnStyle(data.accentColor)}
      >
        <span style={{ fontSize: 14 }}>{data.emoji}</span>
        <span style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 7, letterSpacing: '0.12em',
          color: data.accentColor,
        }}>
          {es ? data.miniGameLabel : data.miniGameLabelEn}
        </span>
        <span style={{
          fontFamily: FONTS.display, fontSize: 9,
          color: `${data.accentColor}88`,
          marginLeft: 'auto',
        }}>
          +{Math.round(40 * (1 + getSeasonData(season).careXPBonus / 100))} XP →
        </span>
      </button>
    </div>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const wrapStyle = (accent: string): CSSProperties => ({
  background: `linear-gradient(160deg, ${accent}18, #040C0600)`,
  border: `1px solid ${accent}33`,
  borderRadius: 10,
  padding: 'clamp(10px, 2vw, 14px)',
  marginBottom: 12,
  display: 'flex',
  flexDirection: 'column',
  gap: 0,
})

const miniGameBtnStyle = (accent: string): CSSProperties => ({
  marginTop: 10,
  display: 'flex', alignItems: 'center', gap: 8,
  width: '100%',
  padding: '9px 12px',
  background: `${accent}12`,
  border: `1px solid ${accent}55`,
  borderRadius: 6,
  cursor: 'pointer',
  transition: 'background 0.2s, box-shadow 0.2s',
  boxShadow: `0 0 10px ${accent}22`,
})
