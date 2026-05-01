import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCocoaTrees, type CareAction } from '../hooks/useCocoaTrees'
import { supabase } from '../lib/supabase'
import { BRAND, FONTS, GUARDIANS, TOKEN_RATES } from '../utils/constants'
import CauaGotchi from '../components/dashboard/CauaGotchi'
import HarvestMinigameModal, { type HarvestMinigamePayload } from '../components/dashboard/HarvestMinigameModal'
import MintTreeButton from '../components/dashboard/MintTreeButton'
import type { CacaoTree } from '../lib/database.types'
import type { CSSProperties } from 'react'
import {
  PLANT_PROBLEMS,
  getStageByHours, getNextCareTime, formatTimeUntil,
  hoursSinceAdoption, getCycleProgress, isHarvestReady,
  ADOPTION_HOURS, CARE_INTERVAL_MIN,
  isTreeDead, isInDeathDanger, getHarvestCountdown,
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
  const [harvestModalOpen, setHarvestModalOpen] = useState(false)

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

  // ── Phase 1.5: muerte la decide el SERVIDOR ──────────────────────────
  // El cron evaluate-tree-vitals horario evalúa vitals y setea died_at
  // cuando vitals_critical_since supera VITAL_GRACE_HOURS. El cliente sólo
  // refleja `tree.died_at`. Sin client-side death detection.

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

  // Harvest action — opens the Fruit-Ninja minigame modal. The actual
  // server call (award-tokens) fires from `submitHarvest` once the user
  // either completes the minigame or chooses the instant-skip path.
  const doHarvest = () => {
    if (!tree || harvesting) return
    setHarvestModalOpen(true)
  }

  // Called by HarvestMinigameModal.onComplete with either the minigame
  // totals (mucilage + cacao_mass + optional combo bonus) or the instant
  // baseline (no resources, no bonus).
  const submitHarvest = async (payload: HarvestMinigamePayload) => {
    if (!tree || harvesting) return
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
            body: JSON.stringify({
              event_type:        'tree_harvest_share',
              ref_id:            tree.id,
              mucilage_g:        payload.mucilage_g,
              cacao_mass_g:      payload.cacao_mass_g,
              beans_override:    payload.beans,
              mazorcas_override: payload.mazorcas,
            }),
          },
        )
      }
      setHarvested(true)
      const subtitleBits = [
        `+${payload.beans.toFixed(1)} granos`,
        `+${payload.mazorcas.toFixed(1)} mazorcas`,
      ]
      if (payload.mucilage_g > 0)   subtitleBits.push(`+${payload.mucilage_g.toFixed(0)}g mucílago`)
      if (payload.cacao_mass_g > 0) subtitleBits.push(`+${payload.cacao_mass_g.toFixed(0)}g masa`)
      showAchievement({
        title: payload.combo_bonus ? '¡COSECHA PERFECTA!' : 'HARVEST CLAIMED',
        subtitle: subtitleBits.join(' · '),
        icon: '🍫',
      })
      // Post-harvest navigation — the modal asked the user where to go next.
      // We wait until after the server call so the user lands on a page that
      // already reflects the new balance (mazorcas in dashboard, redeem in
      // marketplace).
      if (payload.next_route === 'marketplace_redeem') {
        navigate('/marketplace#cacao-ceremony')
      } else if (payload.next_route === 'dashboard_impact') {
        navigate('/dashboard')
      }
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
  const harvestReady = isHarvestReady(tree)
  // PLANT_PROBLEMS lookup happens inside <CauaGotchi /> now; we just pass
  // the problem id through.
  void cycleTick

  // ── Death (Phase 1.5 — vital-based, server-decided) ────────────────
  // Sin timer absoluto. Sin "horas para morir". El cron horario marca
  // died_at cuando vitals_critical_since supera VITAL_GRACE_HOURS.
  const dead = isTreeDead(tree)
  const inDanger = !dead && isInDeathDanger(tree)
  // Próxima cosecha — feedback positivo, NO amenaza de muerte.
  const nextHarvestMs = getHarvestCountdown(tree)
  const nextHarvestLabel = nextHarvestMs <= 0
    ? '¡Listo a cosechar!'
    : formatTimeUntil(new Date(Date.now() + nextHarvestMs))

  return (
    <div style={{ background: BRAND.bgDeep, minHeight: '100vh', paddingBottom: '5rem', position: 'relative', overflow: 'hidden' }}>

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

      {/* ─── UNIFIED CAUA-GOTCHI PANEL ──────────────────────────────────
        Single card with the LivingTree as hero, vital orbs, action row,
        harvest CTA. All the game logic (combo, crit, problem, harvest,
        secret molasses) still lives here in TreeDetail; we just hand it
        down to the panel as props. */}
      <div style={pageWrapStyle}>
        {/* Page header — back link + tree name */}
        <div style={pageHeaderStyle}>
          <button onClick={() => navigate('/adoptar')} style={backBtnStyle}>
            ← Volver
          </button>
          <div style={comboPillStyle(combo, comboFlash)}>
            COMBO ×{combo}
          </div>
        </div>

        <CauaGotchi
          stageId={stage.id}
          stageName={stage.name}
          treeName={guardian.name}
          cycleProgress={cyclePct / 100}
          cycleRemaining={cycleRemaining}
          health={health}
          moisture={moisture}
          sunlight={sunlight}
          problem={currentProblem}
          canCare={canCare}
          nextCareIn={nextCareIn || `${CARE_INTERVAL_MIN}M`}
          inventory={inventory}
          activeAction={activeEffect}
          onCare={doCare}
          onTreeTap={handleTreeTap}
          harvestReady={harvestReady}
          harvested={harvested}
          onHarvest={doHarvest}
          harvestRewards={TOKEN_RATES.tree_harvest_share}
          isDead={dead}
          inDanger={inDanger}
          nextHarvestLabel={nextHarvestLabel}
        />

        {secretFound && (
          <div style={secretFoundStyle}>
            🍯✨ <strong style={{ color: BRAND.mazorca }}>Melaza Orgánica</strong> añadida — úsala desde el item secreto.
          </div>
        )}

        {/* NFT mint row */}
        <div style={{ marginTop: 16 }}>
          <MintTreeButton
            treeId={tree.id}
            alreadyMintedTokenId={tree.nft_token_id}
            alreadyMintedContract={tree.nft_contract}
          />
        </div>
      </div>

      {/* Fruit-Ninja harvest minigame — opened by COSECHA LISTA in CauaGotchi.
          The arena drops N mazorcas; each slice fills mucílago bottle + cacao
          tank. Skip link in modal footer falls back to instant harvest. */}
      <HarvestMinigameModal
        isOpen={harvestModalOpen}
        onClose={() => setHarvestModalOpen(false)}
        onComplete={(payload) => { void submitHarvest(payload) }}
        treeId={tree.id}
        guardianName={guardian.name}
        variety={tree.variety ?? '—'}
        region={tree.region ?? guardian.region}
      />

      <style>{`
        @keyframes caua-float-up {
          0%   { transform: translateY(0)     scale(0.8); opacity: 0; }
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
        @keyframes caua-harvest-pulse {
          0%, 100% { box-shadow: 0 0 32px ${BRAND.mazorca}55, inset 0 1px 0 #ffffff44; }
          50%      { box-shadow: 0 0 48px ${BRAND.mazorca}aa, inset 0 1px 0 #ffffff44; }
        }
      `}</style>
    </div>
  )
}


// ── Styles ──────────────────────────────────────────────────────────

const pageWrapStyle: CSSProperties = {
  position: 'relative', zIndex: 2,
  padding: 'calc(var(--nav-h, 60px) + 16px) clamp(12px, 3vw, 24px) 80px',
  display: 'flex', flexDirection: 'column', gap: 12,
  maxWidth: 480, margin: '0 auto',
}
const pageHeaderStyle: CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
}
const backBtnStyle: CSSProperties = {
  background: 'transparent', border: `1px solid ${BRAND.amazon}aa`,
  color: BRAND.heirloom, padding: '6px 14px', borderRadius: 999,
  fontFamily: FONTS.display, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
  cursor: 'pointer',
}
const comboPillStyle = (combo: number, flash: boolean): CSSProperties => ({
  fontFamily: PRESS_START_FONT, fontSize: 11,
  color: combo > 0 ? BRAND.mazorca : `${BRAND.heirloom}33`,
  textShadow: combo >= 3 ? `0 0 10px ${BRAND.mazorca}aa` : 'none',
  transform: flash ? 'scale(1.25)' : 'scale(1)',
  transition: 'transform 0.18s cubic-bezier(.16,1,.3,1)',
  letterSpacing: '0.1em',
})
const secretFoundStyle: CSSProperties = {
  marginTop: 8,
  padding: '10px 14px', borderRadius: 12,
  background: `${BRAND.mazorca}18`, border: `1px solid ${BRAND.mazorca}66`,
  fontFamily: FONTS.body, fontSize: 12, color: `${BRAND.heirloom}cc`,
  display: 'flex', alignItems: 'center', gap: 8, lineHeight: 1.5,
}

// ── Page-level overlays (floating damage/heal numbers, achievement toast) ──

const floatLayerStyle: CSSProperties = {
  position: 'fixed', left: 0, right: 0, bottom: '40%',
  height: 0, zIndex: 50, pointerEvents: 'none',
}
const achievementToastStyle: CSSProperties = {
  position: 'fixed',
  top: 'calc(var(--nav-h, 60px) + 12px)',
  right: 'clamp(8px, 2vw, 16px)',
  left: 'auto',
  zIndex: 60,
  background: BRAND.bgDark,
  border: `2px solid ${BRAND.mazorca}`,
  padding: '12px 16px',
  display: 'flex', alignItems: 'center', gap: 12,
  boxShadow: `0 0 28px ${BRAND.mazorca}44, inset 0 0 0 2px ${BRAND.bgDeep}`,
  animation: 'caua-toast-in 2.8s cubic-bezier(.16,1,.3,1) forwards',
  maxWidth: 'min(280px, calc(100vw - 24px))',
}
