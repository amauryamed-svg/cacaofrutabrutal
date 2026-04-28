import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCocoaTrees, type CareAction } from '../hooks/useCocoaTrees'
import { supabase } from '../lib/supabase'
import { BRAND, FONTS, GUARDIANS, TOKEN_RATES } from '../utils/constants'
import CauaGotchi from '../components/dashboard/CauaGotchi'
import MintTreeButton from '../components/dashboard/MintTreeButton'
import type { CacaoTree } from '../lib/database.types'
import {
  PLANT_PROBLEMS, SPECIAL_ITEMS,
  getStageByHours, getNextCareTime, formatTimeUntil,
  hoursSinceAdoption, getCycleProgress, isHarvestReady,
  ADOPTION_HOURS, CARE_INTERVAL_MIN,
} from '../utils/growthSystem'

interface Inventory {
  nutrients: number
  pruning: number
  molasses: number
}

// ── Retro game state ────────────────────────────────────────────────────
interface FloatNum { id: number; value: string; color: string; x: number }
interface Achievement { id: number; title: string; subtitle: string; icon: string }

// 8-bit-style palette mapped to brand. CRIT chance = 12%; combo timeout = 1500ms.
const CRIT_CHANCE = 0.12
const COMBO_TIMEOUT_MS = 1500
const PRESS_START_FONT = "'Press Start 2P', monospace"

export default function TreeDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { trees, careForTree } = useCocoaTrees()
  const [tree, setTree] = useState<CacaoTree | null>(null)
  const [loading, setLoading] = useState(true)

  // Game state
  const [health, setHealth] = useState(85)
  const [moisture, setMoisture] = useState(70)
  const [sunlight, setSunlight] = useState(60)
  const [currentProblem, setCurrentProblem] = useState<string | null>(null)
  const [inventory, setInventory] = useState<Inventory>({ nutrients: 1, pruning: 1, molasses: 0 })
  const [lastCareTime, setLastCareTime] = useState<Date | null>(null)
  const [activeEffect, setActiveEffect] = useState<string | null>(null)
  const [canCare, setCanCare] = useState(true)
  const [nextCareIn, setNextCareIn] = useState('')
  const [secretFound, setSecretFound] = useState(false)
  const [tapCount, setTapCount] = useState(0)
  const [lastTapTime, setLastTapTime] = useState(0)
  const [harvested, setHarvested] = useState(false)
  const [harvesting, setHarvesting] = useState(false)
  const [cycleTick, setCycleTick] = useState(0)  // forces re-render every second for live countdown

  // Retro game layer — floating damage/heal numbers, combo counter, achievement toasts
  const [floats, setFloats] = useState<FloatNum[]>([])
  const [combo, setCombo] = useState(0)
  const [comboFlash, setComboFlash] = useState(false)
  const [achievement, setAchievement] = useState<Achievement | null>(null)
  const lastComboAt = useRef<number>(0)
  const comboResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const initializedTree = useRef<string | null>(null)

  // Inject Press Start 2P (retro pixel font) once on mount
  useEffect(() => {
    const id = 'press-start-2p-font'
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap'
    document.head.appendChild(link)
  }, [])

  // Combo decay — clear after timeout if no new action
  const bumpCombo = useCallback(() => {
    const now = Date.now()
    const within = now - lastComboAt.current < COMBO_TIMEOUT_MS
    const next = within ? combo + 1 : 1
    setCombo(next)
    setComboFlash(true)
    setTimeout(() => setComboFlash(false), 350)
    lastComboAt.current = now
    if (comboResetTimer.current) clearTimeout(comboResetTimer.current)
    comboResetTimer.current = setTimeout(() => setCombo(0), COMBO_TIMEOUT_MS + 100)
    return next
  }, [combo])

  const emitFloat = useCallback((value: string, color: string) => {
    const id = Date.now() + Math.random()
    setFloats(f => [...f, { id, value, color, x: 30 + Math.random() * 40 }])
    setTimeout(() => setFloats(f => f.filter(x => x.id !== id)), 1200)
  }, [])

  const showAchievement = useCallback((a: Omit<Achievement, 'id'>) => {
    setAchievement({ ...a, id: Date.now() })
    setTimeout(() => setAchievement(null), 2800)
  }, [])

  useEffect(() => {
    if (!id || !user) return
    const found = trees.find(t => t.id === id)
    if (found) { setTree(found); setLoading(false) }
    else setLoading(false)
  }, [id, trees, user])

  // Seed local game state from DB exactly once per tree
  useEffect(() => {
    if (!tree || initializedTree.current === tree.id) return
    initializedTree.current = tree.id
    setHealth(tree.health ?? 80)
    setMoisture(tree.moisture ?? 70)
    setSunlight(tree.sunlight ?? 60)
    const last = tree.last_update_at ? new Date(tree.last_update_at) : null
    if (last) {
      setLastCareTime(last)
      const next = getNextCareTime(last)
      if (Date.now() >= next.getTime()) {
        setCanCare(true)
      } else {
        setCanCare(false)
        setNextCareIn(formatTimeUntil(next))
      }
    }
  }, [tree])

  // Live cycle ticker — 1s granularity for the 5h cycle's progress bar + countdown
  useEffect(() => {
    const t = setInterval(() => setCycleTick(n => n + 1), 1000)
    return () => clearInterval(t)
  }, [])

  // Care countdown — derived each tick from lastCareTime
  useEffect(() => {
    if (!lastCareTime) { setCanCare(true); setNextCareIn(''); return }
    const next = getNextCareTime(lastCareTime)
    if (Date.now() >= next.getTime()) {
      setCanCare(true)
      setNextCareIn('¡Ahora!')
    } else {
      setCanCare(false)
      setNextCareIn(formatTimeUntil(next))
    }
  }, [lastCareTime, cycleTick])

  // Health degradation when neglected — scaled to 5h cycle (problem fires after 1h without care)
  useEffect(() => {
    if (!lastCareTime) return
    const check = setInterval(() => {
      const hours = (Date.now() - lastCareTime.getTime()) / 3600000
      if (hours >= 1 && !currentProblem) {
        const problems = ['plague', 'drought', 'fungus']
        const prob = problems[Math.floor(Math.random() * problems.length)]
        setCurrentProblem(prob)
        const p = PLANT_PROBLEMS[prob]
        setHealth(h => Math.max(5, h - p.healthDamage))
      }
    }, 20000)
    return () => clearInterval(check)
  }, [lastCareTime, currentProblem])

  const triggerEffect = (name: string) => {
    setActiveEffect(name)
    setTimeout(() => setActiveEffect(null), 1400)
  }

  const CARE_DELTAS: Record<CareAction, { health: number; moisture: number; sunlight: number }> = {
    water:     { health: 5,  moisture: 20, sunlight:  0 },
    sunlight:  { health: 5,  moisture: -5, sunlight: 25 },
    nutrients: { health: 25, moisture: 10, sunlight:  0 },
    pruning:   { health: 15, moisture:  0, sunlight: 20 },
    molasses:  { health: 30, moisture:  5, sunlight:  0 },
  }

  const doCare = (action: CareAction) => {
    const isBasic = action === 'water' || action === 'sunlight'
    if (isBasic && !canCare) return
    if (action === 'nutrients' && inventory.nutrients <= 0) return
    if (action === 'pruning'   && inventory.pruning   <= 0) return
    if (action === 'molasses'  && inventory.molasses  <= 0) return

    // ── Retro game variable reward: 12% crit chance doubles HP gain
    const isCrit = Math.random() < CRIT_CHANCE

    const baseDelta = CARE_DELTAS[action]
    const critMultiplier = isCrit ? 2 : 1
    const d = {
      health: baseDelta.health * critMultiplier,
      moisture: baseDelta.moisture,
      sunlight: baseDelta.sunlight,
    }

    const clamp = (v: number) => Math.max(0, Math.min(100, v))
    const newHealth   = clamp(health   + d.health)
    const newMoisture = clamp(moisture + d.moisture)
    const newSunlight = clamp(sunlight + d.sunlight)

    triggerEffect(action)
    if (isBasic) { setLastCareTime(new Date()); setCanCare(false) }

    // Combo + floating numbers
    const nextCombo = bumpCombo()
    if (d.health > 0) emitFloat(`+${d.health} HP${isCrit ? ' CRIT!' : ''}`, isCrit ? '#F1A91E' : '#91A63B')
    if (d.moisture > 0) emitFloat(`+${d.moisture} 💧`, '#3498db')
    if (d.sunlight > 0) emitFloat(`+${d.sunlight} ☀`, '#f1c40f')

    // Achievement triggers (variable rewards — Hunt + Self mastery)
    if (nextCombo === 3) showAchievement({ title: '3X COMBO', subtitle: 'Care chain unlocked', icon: '🔥' })
    if (nextCombo === 5) showAchievement({ title: 'PERFECT FLOW', subtitle: '+50% growth bonus', icon: '⚡' })
    if (newHealth === 100 && health < 100) showAchievement({ title: 'FULL HEAL', subtitle: 'Tree at peak vitality', icon: '💚' })
    if (isCrit) showAchievement({ title: 'CRITICAL HIT', subtitle: 'x2 healing burst', icon: '✨' })

    setHealth(newHealth)
    setMoisture(newMoisture)
    setSunlight(newSunlight)

    if (action === 'nutrients') setInventory(inv => ({ ...inv, nutrients: inv.nutrients - 1 }))
    if (action === 'pruning')   setInventory(inv => ({ ...inv, pruning:   inv.pruning   - 1 }))
    if (action === 'molasses')  setInventory(inv => ({ ...inv, molasses:  inv.molasses  - 1 }))

    // Curative side-effects: water clears plague/drought, molasses clears fungus/plague.
    // Notifications are surfaced via floating numbers + achievement toasts (no log card).
    if (action === 'water' && (currentProblem === 'plague' || currentProblem === 'drought')) {
      setCurrentProblem(null)
      showAchievement({ title: 'CURED', subtitle: `${PLANT_PROBLEMS[currentProblem].name} cleared`, icon: '💧' })
    } else if (action === 'molasses' && (currentProblem === 'fungus' || currentProblem === 'plague')) {
      setCurrentProblem(null)
      showAchievement({ title: 'ANCIENT SECRET', subtitle: `${PLANT_PROBLEMS[currentProblem].name} eliminated`, icon: '🍯' })
    }

    // Persist to DB (fire-and-forget)
    if (tree) {
      careForTree(tree.id, action, { health, moisture, sunlight, co2_kg: tree.co2_kg ?? 0 })
        .catch(() => {})
    }
  }

  // Harvest action — fires at stage 7 (Maduración 🍫). Awards mazorcas via existing
  // tree_harvest_share token event; user can later canjear by chocolate in Marketplace.
  const doHarvest = async () => {
    if (!tree || harvested || harvesting) return
    setHarvesting(true)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData?.session?.access_token
      if (accessToken) {
        await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/award-tokens`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
            body: JSON.stringify({ event_type: 'tree_harvest_share', ref_id: tree.id }),
          },
        )
      }
      setHarvested(true)
      const reward = TOKEN_RATES.tree_harvest_share
      showAchievement({
        title: 'HARVEST CLAIMED',
        subtitle: `+${reward.beans} granos · +${reward.mazorcas} mazorcas`,
        icon: '🍫',
      })
    } catch {
      // best-effort; user can retry
    } finally {
      setHarvesting(false)
    }
  }

  // Triple-tap tree emoji to find secret molasses
  const handleTreeTap = () => {
    const now = Date.now()
    const newCount = now - lastTapTime < 600 ? tapCount + 1 : 1
    setTapCount(newCount)
    setLastTapTime(now)
    if (newCount >= 3) {
      setInventory(inv => ({ ...inv, molasses: inv.molasses + 1 }))
      setSecretFound(true)
      setTapCount(0)
      setTimeout(() => setSecretFound(false), 3500)
    }
  }

  if (!user) return null
  if (loading) {
    return (
      <div style={{ background: BRAND.bgDeep, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: BRAND.heirloom }}>Cargando árbol...</div>
      </div>
    )
  }
  if (!tree) {
    return (
      <div style={{ background: BRAND.bgDeep, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: BRAND.heirloom, textAlign: 'center' }}>
          Árbol no encontrado
          <br />
          <button onClick={() => navigate('/adoptar')} style={{ color: BRAND.pod, background: 'none', border: 'none', cursor: 'pointer', marginTop: 12 }}>← Volver</button>
        </div>
      </div>
    )
  }

  const guardian = GUARDIANS[tree.guardian_id]
  const hoursSince = hoursSinceAdoption(tree.adopted_at)
  const stage = getStageByHours(hoursSince)
  const cyclePct = getCycleProgress(tree.adopted_at) * 100
  const cycleRemaining = formatTimeUntil(new Date(new Date(tree.adopted_at).getTime() + ADOPTION_HOURS * 3600000))
  const harvestReady = isHarvestReady(tree.adopted_at)
  const prob = currentProblem ? PLANT_PROBLEMS[currentProblem] : null
  // cycleTick is consumed via the live ticker effect; reference here keeps re-renders in sync
  void cycleTick

  return (
    <div style={{ background: BRAND.bgDeep, minHeight: '100vh', paddingBottom: '5rem', position: 'relative', overflow: 'hidden' }}>

      {/* CRT scanline overlay — fixed, low-opacity, decorative */}
      <div aria-hidden="true" style={crtScanlineStyle} />

      {/* Floating damage / heal numbers — emit on doCare, fade up */}
      <div aria-hidden="true" style={floatLayerStyle}>
        {floats.map(f => (
          <div key={f.id} style={{
            position: 'absolute', left: `${f.x}%`, bottom: 0,
            color: f.color, fontFamily: PRESS_START_FONT, fontSize: 11,
            textShadow: `2px 2px 0 #000, 0 0 12px ${f.color}88`,
            animation: 'caua-float-up 1.2s cubic-bezier(.16,1,.3,1) forwards',
            pointerEvents: 'none', whiteSpace: 'nowrap',
          }}>
            {f.value}
          </div>
        ))}
      </div>

      {/* Achievement toast — Variable reward (Self mastery) */}
      {achievement && (
        <div style={achievementToastStyle} role="status" aria-live="polite">
          <div style={{ fontSize: 22 }}>{achievement.icon}</div>
          <div>
            <div style={{ fontFamily: PRESS_START_FONT, fontSize: 9, color: BRAND.mazorca, letterSpacing: '0.06em' }}>
              ACHIEVEMENT
            </div>
            <div style={{ fontFamily: PRESS_START_FONT, fontSize: 11, color: BRAND.heirloom, marginTop: 2 }}>
              {achievement.title}
            </div>
            <div style={{ fontFamily: FONTS.body, fontSize: 10, color: `${BRAND.heirloom}99`, marginTop: 2 }}>
              {achievement.subtitle}
            </div>
          </div>
        </div>
      )}

      {/* ─── CAUA-GOTCHI HANDHELD DEVICE ─────────────────────────────────
        Plastic shell, brand strap, LED, embedded screen, hardware keypad.
        The whole care loop happens here — touch = press a button. */}
      <div style={deviceOuterStyle}>
        <div style={deviceShellStyle}>

          {/* Top strap: back · brand · LED status */}
          <div style={deviceStrapStyle}>
            <button onClick={() => navigate('/adoptar')} style={strapBackBtnStyle} aria-label="Exit to adoption list">
              ◀
            </button>
            <div style={brandPlateStyle}>
              <div style={brandPlateInnerStyle}>CAUA‑GOTCHI</div>
              <div style={brandPlateModelStyle}>MODEL: CACAO V.1</div>
            </div>
            <div style={ledStackStyle}>
              <div style={ledStyle(canCare ? '#2ecc71' : `${BRAND.heirloom}22`, canCare)} title={canCare ? 'Ready' : 'Cooldown'} />
              <div style={ledStyle(prob ? '#e74c3c' : `${BRAND.heirloom}22`, !!prob)} title={prob ? 'Alert' : 'OK'} />
              <div style={ledStyle(harvestReady ? BRAND.mazorca : `${BRAND.heirloom}22`, harvestReady)} title={harvestReady ? 'Harvest ready' : 'Growing'} />
            </div>
          </div>

          {/* Speaker grille — purely decorative plastic detail */}
          <div style={speakerGrilleStyle} aria-hidden="true">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: '#0a0a0a' }} />
            ))}
          </div>

          {/* Mini status row — quest + combo as tiny on-device readout */}
          <div style={deviceStatusRowStyle}>
            <div style={{ fontFamily: PRESS_START_FONT, fontSize: 7, color: BRAND.mazorca, letterSpacing: '0.1em' }}>
              ⚔ {harvestReady ? 'HARVEST READY!' : `${cycleRemaining} LEFT`}
            </div>
            <div style={{
              fontFamily: PRESS_START_FONT, fontSize: 9,
              color: combo > 0 ? BRAND.mazorca : `${BRAND.heirloom}33`,
              textShadow: combo >= 3 ? `0 0 10px ${BRAND.mazorca}aa` : 'none',
              transform: comboFlash ? 'scale(1.25)' : 'scale(1)',
              transition: 'transform 0.18s cubic-bezier(.16,1,.3,1)',
            }}>
              COMBO x{combo}
            </div>
          </div>

          {/* Embedded screen — the existing CauaGotchi component, styled as the device's CRT */}
          <div style={deviceScreenMountStyle}>
            <CauaGotchi
              health={health} moisture={moisture} sunlight={sunlight}
              stageText={stage.name} treeName={guardian.name}
              stageEmoji={stage.emoji} stageId={stage.id}
              problem={currentProblem}
            />
          </div>

          {/* Hardware keypad — A (WATER) · B (SUN) · MENU (handleTreeTap easter egg) */}
          <div style={keypadStyle}>
            <DeviceButton
              label="WATER"
              hotkey="A"
              icon="💧"
              color="#3498db"
              disabled={!canCare || activeEffect !== null}
              active={activeEffect === 'water'}
              onClick={() => doCare('water')}
              cooldown={!canCare ? (nextCareIn || `${CARE_INTERVAL_MIN}M`) : null}
            />
            <DeviceButton
              label="SUN"
              hotkey="B"
              icon="☀️"
              color="#f1c40f"
              disabled={!canCare || activeEffect !== null}
              active={activeEffect === 'sunlight'}
              onClick={() => doCare('sunlight')}
              cooldown={!canCare ? (nextCareIn || `${CARE_INTERVAL_MIN}M`) : null}
            />
            <DeviceButton
              label="MENU"
              hotkey="✺"
              icon="🍯"
              color={BRAND.mazorca}
              disabled={false}
              active={false}
              onClick={handleTreeTap}
              cooldown={null}
            />
          </div>

          {/* Special items inventory — compact slot row */}
          <div style={itemsRowStyle}>
            {(Object.entries(SPECIAL_ITEMS) as [keyof Inventory, typeof SPECIAL_ITEMS[string]][]).map(([key, item]) => {
              const count = inventory[key as keyof Inventory]
              const isEmpty = count === 0
              return (
                <button
                  key={key}
                  onClick={() => doCare(key as 'nutrients' | 'pruning' | 'molasses')}
                  disabled={isEmpty || activeEffect !== null}
                  style={itemSlotStyle(isEmpty, item.rarity === 'secret')}
                  title={`${item.name} ×${count}`}
                >
                  <div style={{ fontSize: 18 }}>{item.emoji}</div>
                  <div style={{
                    fontFamily: PRESS_START_FONT, fontSize: 7,
                    color: count > 0 ? (item.rarity === 'secret' ? BRAND.mazorca : BRAND.pod) : `${BRAND.heirloom}33`,
                    marginTop: 2,
                  }}>
                    ×{count}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Stage info ticker — brief care tip rotating into view */}
          <div style={stageTickerStyle}>
            <span style={stageTickerLabelStyle}>STAGE {stage.id + 1}/8 · {stage.name.toUpperCase()}</span>
            <span style={stageTickerTipStyle}>💡 {stage.careTip}</span>
          </div>

          {/* Conditional state strips inside the device — alerts override below the keypad */}
          {prob && (
            <div style={alertStripStyle}>
              <span style={{ fontSize: 16 }}>{prob.emoji}</span>
              <div>
                <div style={{ fontFamily: PRESS_START_FONT, fontSize: 8, color: '#ff6b6b', letterSpacing: '0.08em' }}>
                  ⚠ {prob.name.toUpperCase()}
                </div>
                <div style={{ fontFamily: FONTS.body, fontSize: 11, color: '#ccc', marginTop: 2 }}>
                  {prob.description}
                </div>
              </div>
            </div>
          )}
          {secretFound && (
            <div style={{ ...alertStripStyle, borderColor: BRAND.mazorca, background: `${BRAND.mazorca}15` }}>
              <span style={{ fontSize: 16 }}>🍯✨</span>
              <div>
                <div style={{ fontFamily: PRESS_START_FONT, fontSize: 8, color: BRAND.mazorca, letterSpacing: '0.08em' }}>
                  SECRET UNLOCKED
                </div>
                <div style={{ fontFamily: FONTS.body, fontSize: 11, color: `${BRAND.heirloom}cc`, marginTop: 2 }}>
                  Melaza Orgánica added · use it via 🍯 button
                </div>
              </div>
            </div>
          )}
          {harvestReady && !harvested && (
            <button onClick={doHarvest} disabled={harvesting} style={harvestStripStyle}>
              <span style={{ fontSize: 22 }}>🍫</span>
              <span style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontFamily: PRESS_START_FONT, fontSize: 9, color: BRAND.bgDeep, letterSpacing: '0.08em' }}>
                  {harvesting ? 'HARVESTING…' : 'CLAIM HARVEST'}
                </div>
                <div style={{ fontFamily: FONTS.body, fontSize: 10, color: `${BRAND.bgDeep}cc`, marginTop: 2 }}>
                  +{TOKEN_RATES.tree_harvest_share.beans} granos · +{TOKEN_RATES.tree_harvest_share.mazorcas} mazorcas
                </div>
              </span>
              <span style={{ fontFamily: PRESS_START_FONT, fontSize: 10, color: BRAND.bgDeep }}>▶</span>
            </button>
          )}
          {harvested && (
            <button onClick={() => navigate('/dashboard')} style={postHarvestStripStyle}>
              <span style={{ fontSize: 16 }}>🍫✨</span>
              <span style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontFamily: PRESS_START_FONT, fontSize: 8, color: BRAND.mazorca, letterSpacing: '0.08em' }}>
                  HARVESTED · CLAIM CHOCOLATE
                </div>
              </span>
              <span style={{ fontFamily: PRESS_START_FONT, fontSize: 9, color: BRAND.mazorca }}>▶</span>
            </button>
          )}

          {/* NFT mint mini-row — only shown if KYC + wallet linked OR already minted */}
          <div style={nftMiniRowStyle}>
            <MintTreeButton
              treeId={tree.id}
              alreadyMintedTokenId={tree.nft_token_id}
              alreadyMintedContract={tree.nft_contract}
            />
          </div>

          {/* Bottom plate — brand mark + cycle progress as a tiny battery-style indicator */}
          <div style={deviceBottomPlateStyle}>
            <div style={brandSubMarkStyle}>CACAO FRUTA BRUTAL</div>
            <div style={batteryWrapStyle} title={`${Math.round(cyclePct)}% growth cycle`}>
              <div style={batteryFillStyle(cyclePct)} />
              <div style={batteryNubStyle} />
            </div>
          </div>
        </div>
      </div>


      <style>{`
        @keyframes fall {
          0%   { transform: translateY(-20px); opacity: 0; }
          20%  { opacity: 1; }
          100% { transform: translateY(60px); opacity: 0; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-8px); }
        }
        @keyframes caua-float-up {
          0%   { transform: translateY(0)    scale(0.8); opacity: 0; }
          15%  { transform: translateY(-12px) scale(1.1); opacity: 1; }
          100% { transform: translateY(-90px) scale(1);   opacity: 0; }
        }
        @keyframes caua-toast-in {
          0%   { transform: translateX(120%); opacity: 0; }
          15%  { transform: translateX(-6%);  opacity: 1; }
          25%  { transform: translateX(0);    opacity: 1; }
          85%  { transform: translateX(0);    opacity: 1; }
          100% { transform: translateX(120%); opacity: 0; }
        }
        @keyframes caua-scanline {
          0%   { background-position: 0 0; }
          100% { background-position: 0 4px; }
        }
        @keyframes caua-crit-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(241,169,30,0); }
          50%      { box-shadow: 0 0 28px 4px rgba(241,169,30,.6); }
        }
      `}</style>
    </div>
  )
}


// ── CAUA-GOTCHI handheld device ──────────────────────────────────────

function DeviceButton({ label, hotkey, icon, color, disabled, active, onClick, cooldown }: {
  label: string; hotkey: string; icon: string; color: string;
  disabled: boolean; active: boolean; onClick: () => void; cooldown: string | null
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        position: 'relative',
        background: active ? color : disabled ? '#1a1a1a' : '#2a2a2a',
        border: `2px solid ${disabled ? '#444' : color}`,
        borderRadius: 16,
        padding: '14px 10px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        textAlign: 'center',
        boxShadow: active
          ? `0 0 18px ${color}aa, inset 0 -3px 0 ${BRAND.bgDeep}, inset 0 1px 0 #ffffff22`
          : `inset 0 -3px 0 #000000cc, inset 0 1px 0 #ffffff15`,
        transition: 'transform 0.08s, background 0.2s, box-shadow 0.2s',
      }}
      onMouseDown={(e) => { if (!disabled) {
        e.currentTarget.style.transform = 'translateY(2px)'
      } }}
      onMouseUp={(e) => { e.currentTarget.style.transform = 'none' }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'none' }}
    >
      <div style={{
        position: 'absolute', top: 4, right: 6,
        fontFamily: PRESS_START_FONT, fontSize: 8,
        color: disabled ? '#555' : color,
        border: `1px solid ${disabled ? '#444' : color}`,
        padding: '1px 4px',
        borderRadius: 3,
      }}>
        {hotkey}
      </div>
      <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
      <div style={{
        fontFamily: PRESS_START_FONT, fontSize: 9,
        color: active ? BRAND.bgDeep : BRAND.heirloom,
        letterSpacing: '0.06em',
      }}>
        {label}
      </div>
      {cooldown && (
        <div style={{
          fontFamily: PRESS_START_FONT, fontSize: 6,
          color: `${BRAND.heirloom}77`, marginTop: 3,
          letterSpacing: '0.04em',
        }}>
          CD {cooldown}
        </div>
      )}
    </button>
  )
}

const deviceOuterStyle: React.CSSProperties = {
  position: 'relative',
  zIndex: 2,
  padding: 'clamp(20px, 4vw, 32px) clamp(12px, 3vw, 24px) 80px',
  display: 'flex', justifyContent: 'center',
}
const deviceShellStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 440,
  background: 'linear-gradient(160deg, #1a2a1f 0%, #0d1a12 50%, #1a2a1f 100%)',
  border: `2px solid ${BRAND.amazon}`,
  borderRadius: 36,
  padding: 14,
  boxShadow: [
    'inset 0 2px 0 #ffffff18',
    'inset 0 -3px 0 #00000099',
    '0 24px 60px #000000bb',
    `0 0 0 1px ${BRAND.amazon}`,
  ].join(', '),
  position: 'relative',
}
const deviceStrapStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'auto 1fr auto',
  alignItems: 'center',
  gap: 10,
  padding: '8px 12px',
  background: '#0a0f0c',
  border: `1px solid ${BRAND.amazon}`,
  borderRadius: 22,
  marginBottom: 10,
  boxShadow: 'inset 0 1px 0 #ffffff10, inset 0 -2px 0 #00000088',
}
const strapBackBtnStyle: React.CSSProperties = {
  background: '#1f2a23',
  border: `1px solid ${BRAND.amazon}`,
  color: BRAND.heirloom,
  width: 32, height: 32,
  borderRadius: 8,
  fontFamily: PRESS_START_FONT, fontSize: 10,
  cursor: 'pointer',
  boxShadow: 'inset 0 1px 0 #ffffff15, inset 0 -2px 0 #000000aa',
}
const brandPlateStyle: React.CSSProperties = {
  textAlign: 'center',
  background: '#000',
  border: `1px solid ${BRAND.amazon}`,
  borderRadius: 6,
  padding: '5px 8px',
}
const brandPlateInnerStyle: React.CSSProperties = {
  fontFamily: PRESS_START_FONT, fontSize: 11,
  color: BRAND.mazorca,
  letterSpacing: '0.08em',
  textShadow: `0 0 8px ${BRAND.mazorca}66`,
}
const brandPlateModelStyle: React.CSSProperties = {
  fontFamily: PRESS_START_FONT, fontSize: 6,
  color: `${BRAND.heirloom}55`,
  marginTop: 3,
  letterSpacing: '0.1em',
}
const ledStackStyle: React.CSSProperties = {
  display: 'flex', gap: 5,
}
function ledStyle(color: string, lit: boolean): React.CSSProperties {
  return {
    width: 8, height: 8, borderRadius: '50%',
    background: color,
    border: `1px solid ${BRAND.bgDeep}`,
    boxShadow: lit ? `0 0 8px ${color}, 0 0 2px #ffffff66 inset` : 'inset 0 -1px 0 #00000088',
  }
}
const speakerGrilleStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(12, 1fr)',
  gap: 4,
  padding: '6px 14px',
  background: '#050805',
  borderTop: `1px solid ${BRAND.amazon}`,
  borderBottom: `1px solid ${BRAND.amazon}`,
  marginBottom: 8,
}
const deviceStatusRowStyle: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '6px 12px',
  background: '#000',
  border: `1px solid ${BRAND.amazon}`,
  borderRadius: 6,
  marginBottom: 8,
}
const deviceScreenMountStyle: React.CSSProperties = {
  background: '#000',
  border: `1px solid ${BRAND.amazon}`,
  padding: 6,
  borderRadius: 8,
  marginBottom: 12,
  boxShadow: 'inset 0 0 22px #000, inset 0 1px 0 #ffffff10',
}
const keypadStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr',
  gap: 8,
  padding: '10px 4px',
  marginBottom: 8,
}
const itemsRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr',
  gap: 6,
  padding: '6px 4px',
  marginBottom: 8,
}
function itemSlotStyle(empty: boolean, secret: boolean): React.CSSProperties {
  const accent = secret ? BRAND.mazorca : BRAND.pod
  return {
    background: empty ? '#0a0a0a' : `${accent}11`,
    border: `1px solid ${empty ? '#333' : `${accent}66`}`,
    borderRadius: 8,
    padding: '6px 4px',
    cursor: empty ? 'not-allowed' : 'pointer',
    opacity: empty ? 0.4 : 1,
    boxShadow: 'inset 0 1px 0 #ffffff10, inset 0 -2px 0 #00000088',
  }
}
const stageTickerStyle: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  gap: 8, flexWrap: 'wrap',
  padding: '6px 12px',
  background: '#0a1410',
  border: `1px solid ${BRAND.amazon}55`,
  borderRadius: 6,
  marginBottom: 8,
}
const stageTickerLabelStyle: React.CSSProperties = {
  fontFamily: PRESS_START_FONT, fontSize: 7,
  color: BRAND.pod, letterSpacing: '0.1em',
}
const stageTickerTipStyle: React.CSSProperties = {
  fontFamily: FONTS.body, fontSize: 11,
  color: `${BRAND.heirloom}99`,
}
const alertStripStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '8px 12px',
  background: '#2a0808',
  border: '1px solid #e74c3c66',
  borderRadius: 6,
  marginBottom: 8,
}
const harvestStripStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10,
  width: '100%',
  padding: '10px 14px',
  background: `linear-gradient(135deg, ${BRAND.mazorca}, #d49018)`,
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  marginBottom: 8,
  boxShadow: `0 0 20px ${BRAND.mazorca}66, inset 0 1px 0 #ffffff44, inset 0 -3px 0 #00000044`,
}
const postHarvestStripStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10,
  width: '100%',
  padding: '8px 12px',
  background: `${BRAND.mazorca}22`,
  border: `1px solid ${BRAND.mazorca}66`,
  borderRadius: 6,
  cursor: 'pointer',
  marginBottom: 8,
}
const nftMiniRowStyle: React.CSSProperties = {
  marginBottom: 8,
}
const deviceBottomPlateStyle: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '8px 14px',
  background: '#0a0f0c',
  border: `1px solid ${BRAND.amazon}`,
  borderRadius: 22,
  boxShadow: 'inset 0 1px 0 #ffffff10, inset 0 -2px 0 #00000088',
  marginTop: 4,
}
const brandSubMarkStyle: React.CSSProperties = {
  fontFamily: PRESS_START_FONT, fontSize: 6,
  color: `${BRAND.heirloom}44`,
  letterSpacing: '0.16em',
}
const batteryWrapStyle: React.CSSProperties = {
  position: 'relative',
  width: 36, height: 14,
  border: `1px solid ${BRAND.heirloom}55`,
  borderRadius: 2,
  padding: 1,
}
function batteryFillStyle(pct: number): React.CSSProperties {
  return {
    width: `${pct}%`, height: '100%',
    background: pct > 60 ? BRAND.pod : pct > 25 ? BRAND.mazorca : '#e74c3c',
    transition: 'width 1s',
  }
}
const batteryNubStyle: React.CSSProperties = {
  position: 'absolute',
  right: -4, top: 3,
  width: 3, height: 6,
  background: `${BRAND.heirloom}55`,
  borderRadius: '0 1px 1px 0',
}

// ── Page-level overlays (CRT scanlines, floating damage/heal numbers, achievement toast) ──

const crtScanlineStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none',
  backgroundImage: `repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 1px, transparent 1px, transparent 4px)`,
  mixBlendMode: 'multiply',
  opacity: 0.55,
}
const floatLayerStyle: React.CSSProperties = {
  position: 'fixed', left: 0, right: 0, bottom: '40%',
  height: 0, zIndex: 50, pointerEvents: 'none',
}
const achievementToastStyle: React.CSSProperties = {
  position: 'fixed', top: 86, right: 16, zIndex: 60,
  background: BRAND.bgDark,
  border: `2px solid ${BRAND.mazorca}`,
  padding: '12px 16px',
  display: 'flex', alignItems: 'center', gap: 12,
  boxShadow: `0 0 28px ${BRAND.mazorca}44, inset 0 0 0 2px ${BRAND.bgDeep}`,
  animation: 'caua-toast-in 2.8s cubic-bezier(.16,1,.3,1) forwards',
  maxWidth: 280,
}
