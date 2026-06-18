import { motion } from 'framer-motion'
import { BRAND, FONTS } from '../../utils/constants'
import { PLANT_PROBLEMS, SPECIAL_ITEMS } from '../../utils/growthSystem'
import CacaoPixelTree from './CacaoPixelTree'
import type { CSSProperties, ReactNode } from 'react'

/**
 * The unified Caua-Gotchi panel — one card, one tree, no device chrome.
 *
 * Center stage: a real cacao tree (`<LivingTree />`) growing through 8
 * stages, modulating with vitals (moisture wets the soil, sunlight
 * saturates leaves, low health wilts the canopy, problems tint the scene).
 *
 * Around the tree:
 *   - top:    stage label, tree name, life-cycle progress ring
 *   - sides:  3 stat orbs (HP, water, sun) — minimal, not bars
 *   - bottom: action button row (water, sun, nutrients, pruning, melaza)
 *   - bottom: harvest CTA when ready
 *
 * The parent (`TreeDetail`) owns game state and passes handlers down.
 */

export type CareAction = 'water' | 'sunlight' | 'nutrients' | 'pruning' | 'molasses'

export interface CauaGotchiProps {
  // Tree identity
  stageId: number
  stageName: string
  treeName: string

  // Cycle progress
  cycleProgress: number       // 0..1 of the 5h adoption cycle
  cycleRemaining: string      // formatted "2h 13m"

  // Vitals
  health: number              // 0..100
  moisture: number            // 0..100
  sunlight: number            // 0..100
  problem?: string | null

  // Care
  canCare: boolean
  nextCareIn: string
  inventory: { nutrients: number; pruning: number; molasses: number }
  activeAction: string | null
  onCare: (action: CareAction) => void

  // Hidden interaction (triple-tap easter egg)
  onTreeTap?: () => void

  // Harvest
  harvestReady: boolean
  harvested: boolean
  onHarvest: () => void
  harvestRewards: { beans: number; mazorcas: number }

  // Phase 1.5 — death is server-decided (vitals_critical_since > grace).
  isDead: boolean
  /** True cuando vitals están bajo umbral (cualquiera de health/moisture/sunlight).
   *  El banner naranja "VITALES CRÍTICOS" se muestra sin componente temporal. */
  inDanger: boolean
  /** Countdown formateado a la próxima cosecha (e.g. "2h 30m") o "¡Listo!". */
  nextHarvestLabel: string
}

export default function CauaGotchi({
  stageId, stageName, treeName,
  cycleProgress, cycleRemaining,
  health, moisture, sunlight, problem = null,
  canCare, nextCareIn, inventory, activeAction,
  onCare, onTreeTap,
  harvestReady, harvested, onHarvest, harvestRewards,
  isDead, inDanger, nextHarvestLabel,
}: CauaGotchiProps) {

  const prob = problem ? PLANT_PROBLEMS[problem] : null
  // Phase 1.5 — la cosecha es recurrente. `harvested` es solo "ya cosechó al
  // menos una vez", no bloquea acciones. Sólo isDead bloquea.
  const lockActions = isDead

  return (
    <div style={panelStyle(prob, isDead)}>

      {/* Top bar — stage label + LVL badge + tree name */}
      <div style={topBarStyle}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{
            padding: '3px 7px',
            background: `${BRAND.pod}22`, border: `1px solid ${BRAND.pod}66`,
            fontFamily: "'Press Start 2P', monospace", fontSize: 8,
            color: BRAND.pod, letterSpacing: '0.05em',
          }}>
            LVL {stageId + 1}
          </div>
          <div>
            <div style={eyebrowStyle}>STAGE {stageId + 1}/8</div>
            <div style={stageNameStyle}>{stageName}</div>
          </div>
        </div>
        <div style={treeNameStyle}>{treeName}</div>
      </div>

      {/* Hero — the LivingTree, with stat orbs floating at left/right */}
      <div style={heroWrapStyle}>
        <CycleRing progress={cycleProgress} remaining={cycleRemaining} ready={harvestReady} />

        <div style={treeFrameStyle} onClick={isDead ? undefined : onTreeTap} role={onTreeTap && !isDead ? 'button' : undefined} tabIndex={onTreeTap && !isDead ? 0 : undefined}>
          <CacaoPixelTree
            stage={stageId}
            health={health}
            moisture={moisture}
            sunlight={sunlight}
            problem={problem}
            isDead={isDead}
            careEffect={activeAction as 'water' | 'sunlight' | 'nutrients' | 'pruning' | 'molasses' | null}
          />

          {/* Death badge — overrides problem badge when dead */}
          {isDead && (
            <div style={{ ...problemBadgeStyle, background: '#000c', borderColor: '#e74c3c' }}>
              <span style={{ fontSize: 16 }}>💀</span>
              <span style={{ fontFamily: FONTS.display, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#ff6b6b' }}>
                MUERTO
              </span>
            </div>
          )}

          {/* Vitals warning — pulsing orange when any vital < threshold.
              Sin componente temporal: el árbol vive indefinido si el usuario
              recupera los vitals. Solo el cron de servidor decide muerte. */}
          {!isDead && inDanger && (
            <motion.div
              animate={{ opacity: [1, 0.55, 1] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
              style={{
                ...problemBadgeStyle,
                background: '#2a1a08cc',
                borderColor: '#F1A91E',
                top: 'auto', bottom: 10, left: 10, right: 'auto',
              }}
            >
              <span style={{ fontSize: 16 }}>⚠️</span>
              <span style={{ fontFamily: FONTS.display, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#F1A91E' }}>
                VITALES CRÍTICOS
              </span>
            </motion.div>
          )}

          {/* Problem badge — only when alive and a problem is active */}
          {prob && !isDead && (
            <motion.div
              animate={{ opacity: [1, 0.6, 1] }}
              transition={{ repeat: Infinity, duration: 1.4 }}
              style={problemBadgeStyle}
            >
              <span style={{ fontSize: 16 }}>{prob.emoji}</span>
              <span style={{ fontFamily: FONTS.display, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#ff6b6b' }}>
                {prob.name.toUpperCase()}
              </span>
            </motion.div>
          )}
        </div>

        {/* Pixel HP bars — right side vertical */}
        <div style={orbsColStyle}>
          <PixelBar icon="❤" value={health}   color="#e74c3c" label="HP" />
          <PixelBar icon="💧" value={moisture} color="#3498db" label="H2O" />
          <PixelBar icon="☀" value={sunlight}  color="#f1c84a" label="SOL" />
        </div>
      </div>

      {/* Action row — disabled when dead. Live actions otherwise. */}
      <div style={actionsWrapStyle}>
        <ActionButton
          label="REGAR"
          icon="💧"
          color="#3498db"
          disabled={lockActions || !canCare || activeAction !== null}
          active={activeAction === 'water'}
          cooldown={!canCare && !isDead ? nextCareIn : null}
          onClick={() => !isDead && onCare('water')}
        />
        <ActionButton
          label="SOL"
          icon="☀"
          color="#f1c84a"
          disabled={lockActions || !canCare || activeAction !== null}
          active={activeAction === 'sunlight'}
          cooldown={!canCare && !isDead ? nextCareIn : null}
          onClick={() => !isDead && onCare('sunlight')}
        />
      </div>

      {/* Special items — disabled when dead */}
      <div style={itemsRowStyle}>
        {(['nutrients', 'pruning', 'molasses'] as const).map((key) => {
          const item = SPECIAL_ITEMS[key]
          const count = inventory[key]
          const empty = count <= 0
          const action: CareAction = key
          return (
            <ItemPill
              key={key}
              emoji={item.emoji}
              label={item.name}
              count={count}
              rarity={item.rarity}
              disabled={lockActions || empty || activeAction !== null}
              active={activeAction === action}
              onClick={() => !isDead && onCare(action)}
            />
          )
        })}
      </div>

      {/* Stage care tip — overridden by death tip when dead */}
      <div style={tipStyle}>
        {isDead ? (
          <span style={{ color: '#e74c3c' }}>
            💀 Tu árbol murió. Los granos + mazorcas que no cosechaste se queman.
          </span>
        ) : (
          <>
            <span style={{ color: BRAND.pod }}>💡</span> {careTipFor(stageId, prob)}
          </>
        )}
      </div>

      {/* Daily-care reminder — always visible while alive. Phase 1.5: la
          cosecha es recurrente. El árbol vive mientras los vitals estén altos. */}
      {!isDead && (
        <div style={dailyReminderStyle}>
          🌱 Mantén los vitals altos para que tu árbol siga produciendo · Cada {`5h`} hay nueva cosecha
        </div>
      )}

      {/* Harvest CTA — siempre visible cuando está listo. Si ya cosechó pero
          aún no toca de nuevo, mostramos el countdown a la próxima cosecha. */}
      {harvestReady && !isDead && (
        <button onClick={onHarvest} style={harvestCtaStyle}>
          <div style={{ fontSize: 28 }}>🍫</div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 14, color: BRAND.bgDeep, letterSpacing: '0.1em' }}>
              COSECHA LISTA
            </div>
            <div style={{ fontFamily: FONTS.body, fontSize: 11, color: `${BRAND.bgDeep}cc`, marginTop: 2 }}>
              +{harvestRewards.beans} granos · +{harvestRewards.mazorcas} mazorcas · rebana las mazorcas
            </div>
          </div>
          <div style={{ fontFamily: FONTS.display, fontWeight: 800, color: BRAND.bgDeep, fontSize: 18 }}>▶</div>
        </button>
      )}

      {!harvestReady && harvested && !isDead && (
        <div style={harvestedNoteStyle}>
          <span style={{ fontSize: 18 }}>⏳</span>
          <span style={{ fontFamily: FONTS.display, fontSize: 11, color: BRAND.mazorca, letterSpacing: '0.12em', fontWeight: 700 }}>
            PRÓXIMA COSECHA · {nextHarvestLabel}
          </span>
        </div>
      )}

      {/* Dead screen — final state. NO refunds (Coinbase onramp policy). */}
      {isDead && (
        <div style={deadPanelStyle}>
          <div style={{ fontSize: 36, textAlign: 'center', marginBottom: 6 }}>💀</div>
          <div style={{
            fontFamily: FONTS.display, fontWeight: 900, fontSize: 18,
            color: '#e74c3c', letterSpacing: '0.08em', textAlign: 'center', marginBottom: 8,
            textTransform: 'uppercase',
          }}>
            Tu árbol murió
          </div>
          <p style={{
            fontFamily: FONTS.body, fontSize: 12, color: `${BRAND.heirloom}cc`,
            lineHeight: 1.55, textAlign: 'center', margin: '0 0 12px',
          }}>
            Sus vitales quedaron bajo umbral demasiado tiempo. Los granos + mazorcas que no cosechaste se <strong style={{ color: '#e74c3c' }}>queman</strong>.
            Como un Caua-Gotchi real — si no lo cuidas, se muere.
            <br /><span style={{ fontStyle: 'italic', color: `${BRAND.pod}aa` }}>Llévalo a Labranza · rebánalo con el machete · regenera el lineage.</span>
          </p>
          <p style={{
            fontFamily: FONTS.body, fontSize: 10, color: `${BRAND.heirloom}77`,
            lineHeight: 1.5, textAlign: 'center', margin: '0 0 10px',
            paddingTop: 10, borderTop: '1px solid #e74c3c33',
          }}>
            <strong style={{ color: `${BRAND.heirloom}aa` }}>Política de fondos:</strong> tu inversión inicial ya fue desplegada
            al momento de adopción en el esquema 60/30/10 (60% guardián · 30% R&D · 10% comunidad).
            <strong> No retenemos fondos en custodia</strong> — política compliant con Coinbase onramp.
            Los tokens son rewards de gameplay, no instrumento financiero.
          </p>
          <p style={{
            fontFamily: FONTS.body, fontSize: 11, color: `${BRAND.heirloom}88`,
            lineHeight: 1.5, textAlign: 'center', margin: 0,
          }}>
            Adopta otro árbol y cuídalo a diario. Cada 5 días de floración y maduración puedes redimir tokens.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────

function CycleRing({ progress, remaining, ready }: { progress: number; remaining: string; ready: boolean }) {
  const size = 56
  const r = 24
  const c = 2 * Math.PI * r
  const dashOff = c * (1 - progress)
  return (
    <div style={cycleRingWrapStyle}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`${BRAND.amazon}`} strokeWidth="3" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={ready ? BRAND.mazorca : BRAND.pod}
          strokeWidth="3" strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={dashOff}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.8s ease-out, stroke 0.4s' }}
        />
      </svg>
      <div style={cycleRingLabelStyle}>
        {ready ? '🍫' : remaining}
      </div>
    </div>
  )
}

function PixelBar({ icon, value, color, label }: { icon: string; value: number; color: string; label: string }) {
  const v = Math.max(0, Math.min(100, value))
  const isLow = v < 30
  const filled = Math.round(v / 10)
  const bar = '■'.repeat(filled) + '□'.repeat(10 - filled)
  const c = isLow ? '#e74c3c' : color
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-end' }}>
      <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: c, letterSpacing: '0.02em' }}>
        {icon} {label}
      </div>
      <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6, color: c, letterSpacing: '0.01em' }}>
        {bar}
      </div>
    </div>
  )
}

function ActionButton({
  label, icon, color, disabled, active, cooldown, onClick,
}: {
  label: string; icon: string; color: string;
  disabled: boolean; active: boolean; cooldown: string | null;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={actionBtnStyle(disabled, active, color)}
      onMouseDown={(e) => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(1px)' }}
      onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = '' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = '' }}
    >
      <div style={{ fontSize: 22 }}>{icon}</div>
      <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 12, letterSpacing: '0.12em' }}>{label}</div>
      {cooldown && (
        <div style={{ fontFamily: FONTS.body, fontSize: 9, color: `${BRAND.heirloom}99`, marginTop: 2 }}>
          ⏱ {cooldown}
        </div>
      )}
    </button>
  )
}

function ItemPill({
  emoji, label, count, rarity, disabled, active, onClick,
}: {
  emoji: string; label: string; count: number; rarity: string;
  disabled: boolean; active: boolean; onClick: () => void;
}) {
  const accent = rarity === 'secret' ? BRAND.mazorca : BRAND.pod
  return (
    <button onClick={onClick} disabled={disabled} title={`${label} ×${count}`}
      style={itemPillStyle(disabled, active, accent)}
    >
      <span style={{ fontSize: 16 }}>{emoji}</span>
      <span style={{ fontFamily: FONTS.display, fontSize: 10, fontWeight: 700, color: disabled ? `${BRAND.heirloom}33` : accent, letterSpacing: '0.06em' }}>
        ×{count}
      </span>
    </button>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────

function careTipFor(stageId: number, prob: { description: string } | null): ReactNode {
  if (prob) return prob.description
  switch (stageId) {
    case 0: return 'Riega para activar la germinación.'
    case 1: return 'Vigila — las plagas atacan brotes recién nacidos.'
    case 2: return 'Si ves manchas oscuras, usa Melaza Orgánica.'
    case 3: return 'La poda lateral estimula crecimiento vigoroso.'
    case 4: return 'Aplica nutrientes — la estructura final depende del suelo.'
    case 5: return 'Las flores son el futuro del cacao. Protégelas.'
    case 6: return 'Las mazorcas se forman. El hongo es la mayor amenaza.'
    case 7: return 'Cosecha lista — pulsa para canjear chocolate real.'
    default: return ''
  }
}

// ─── Styles ───────────────────────────────────────────────────────────

const panelStyle = (prob: { name: string } | null, isDead: boolean): CSSProperties => ({
  background: isDead
    ? 'linear-gradient(160deg, #1a0a0a 0%, #040c06 100%)'
    : 'linear-gradient(160deg, #0e1e15 0%, #040c06 100%)',
  border: `1px solid ${isDead ? '#e74c3c88' : prob ? '#e74c3c66' : `${BRAND.amazon}aa`}`,
  borderRadius: 20,
  padding: 'clamp(16px, 3vw, 24px)',
  boxShadow: isDead
    ? `0 0 40px #e74c3c33, inset 0 1px 0 ${BRAND.heirloom}11`
    : prob
    ? `0 0 32px #e74c3c22, inset 0 1px 0 ${BRAND.heirloom}11`
    : `0 16px 48px #00000088, inset 0 1px 0 ${BRAND.heirloom}11`,
  position: 'relative',
  overflow: 'hidden',
  transition: 'border-color 0.5s, box-shadow 0.5s',
})

const dailyReminderStyle: CSSProperties = {
  marginTop: 8,
  padding: '8px 12px',
  background: `${BRAND.pod}10`,
  border: `1px solid ${BRAND.pod}33`,
  borderRadius: 10,
  fontFamily: FONTS.body, fontSize: 10, color: `${BRAND.heirloom}99`,
  textAlign: 'center', lineHeight: 1.55,
}

const deadPanelStyle: CSSProperties = {
  marginTop: 14,
  padding: '18px 16px',
  background: '#2a0a0a',
  border: '1px solid #e74c3c66',
  borderRadius: 14,
  boxShadow: 'inset 0 0 40px #00000066',
}

const topBarStyle: CSSProperties = {
  display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
  marginBottom: 14, gap: 12,
}
const eyebrowStyle: CSSProperties = {
  fontFamily: FONTS.display, fontSize: 9, fontWeight: 700,
  color: BRAND.pod, letterSpacing: '0.22em', marginBottom: 4,
}
const stageNameStyle: CSSProperties = {
  fontFamily: FONTS.display, fontSize: 24, fontWeight: 900,
  color: BRAND.heirloom, letterSpacing: '0.04em', textTransform: 'uppercase',
  lineHeight: 1,
}
const treeNameStyle: CSSProperties = {
  fontFamily: FONTS.serif, fontStyle: 'italic',
  color: BRAND.mazorca, fontSize: 13, letterSpacing: '0.1em',
  textAlign: 'right',
}

const heroWrapStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'auto 1fr auto',
  alignItems: 'center',
  gap: 'clamp(8px, 2vw, 14px)',
  marginBottom: 16,
  position: 'relative',
}

const cycleRingWrapStyle: CSSProperties = {
  position: 'relative', width: 56, height: 56,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}
const cycleRingLabelStyle: CSSProperties = {
  position: 'absolute', inset: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: FONTS.display, fontSize: 10, fontWeight: 700,
  color: BRAND.heirloom, letterSpacing: '0.04em',
  pointerEvents: 'none',
}

const treeFrameStyle: CSSProperties = {
  background: 'radial-gradient(ellipse at 50% 100%, #1f3a26 0%, #040C06 70%)',
  // Pixel grid overlay simulating LCD screen texture
  backgroundImage: `
    radial-gradient(ellipse at 50% 100%, #1f3a26 0%, #040C06 70%),
    repeating-linear-gradient(0deg, transparent, transparent 3px, #00000011 3px, #00000011 4px),
    repeating-linear-gradient(90deg, transparent, transparent 3px, #00000011 3px, #00000011 4px)
  `,
  border: `3px solid ${BRAND.amazon}`,
  boxShadow: `inset 0 0 24px ${BRAND.bgDeep}cc, 0 0 0 1px ${BRAND.pod}22`,
  borderRadius: 4,
  padding: 'clamp(8px, 2vw, 14px)',
  cursor: 'pointer',
  minHeight: 280,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  position: 'relative',
  // LivingTree's SVG has `overflow: visible` (intentional, lets canopy +
  // root flair paint past the viewBox). Clip on the frame so flair stays
  // contained within the rounded card and doesn't bleed onto siblings.
  overflow: 'hidden',
  imageRendering: 'pixelated',
}

const problemBadgeStyle: CSSProperties = {
  position: 'absolute', top: 10, left: 10,
  display: 'inline-flex', alignItems: 'center', gap: 6,
  background: '#2a0a0acc', backdropFilter: 'blur(6px)',
  border: '1px solid #e74c3c66',
  padding: '5px 10px', borderRadius: 999,
}

const orbsColStyle: CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start',
  flexShrink: 0,
}


const actionsWrapStyle: CSSProperties = {
  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8,
}
const actionBtnStyle = (disabled: boolean, active: boolean, color: string): CSSProperties => ({
  background: active ? `${color}22` : `${BRAND.amazon}66`,
  border: `2px solid ${disabled ? `${BRAND.amazon}44` : active ? color : `${color}88`}`,
  borderRadius: 0,
  padding: '12px 8px',
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.55 : 1,
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
  color: disabled ? `${BRAND.heirloom}66` : BRAND.heirloom,
  transition: 'transform 0.08s, background 0.2s, border-color 0.2s',
  boxShadow: active ? `0 0 8px ${color}55` : 'none',
})

const itemsRowStyle: CSSProperties = {
  display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 12,
}
const itemPillStyle = (disabled: boolean, active: boolean, accent: string): CSSProperties => ({
  background: active ? `${accent}22` : 'transparent',
  border: `1px solid ${disabled ? `${BRAND.amazon}44` : `${accent}55`}`,
  borderRadius: 999, padding: '6px 10px',
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.55 : 1,
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  transition: 'all 0.2s',
})

const tipStyle: CSSProperties = {
  fontFamily: FONTS.body, fontSize: 11, color: `${BRAND.heirloom}88`,
  textAlign: 'center', padding: '6px 0', lineHeight: 1.5,
  borderTop: `1px solid ${BRAND.amazon}33`,
  paddingTop: 12,
}

const harvestCtaStyle: CSSProperties = {
  width: '100%', marginTop: 14,
  padding: '14px 16px', borderRadius: 14, border: 'none',
  background: `linear-gradient(135deg, ${BRAND.mazorca}, #d49018)`,
  cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: 12,
  boxShadow: `0 0 32px ${BRAND.mazorca}55, inset 0 1px 0 #ffffff44`,
  animation: 'caua-harvest-pulse 2s ease-in-out infinite',
}
const harvestedNoteStyle: CSSProperties = {
  marginTop: 14,
  padding: '10px 14px', borderRadius: 999,
  background: `${BRAND.mazorca}22`, border: `1px solid ${BRAND.mazorca}66`,
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
}
