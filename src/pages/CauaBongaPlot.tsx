import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BRAND, FONTS, GUARDIANS } from '../utils/constants'
import { CROPS, MVP_CROPS, soilMultiplier, computeYield, type CropSlug } from '../utils/cauabonga'
import { useCauaBongaPlot, type TileRow, type CareAction } from '../hooks/useCauaBongaPlot'
import { useTokenBalance } from '../hooks/useTokenBalance'
import CacaoCeremonyCTA from '../components/marketplace/CacaoCeremonyCTA'

/**
 * CauaBongaPlot — MVP per-plot view (3×3 inner grid of Lucho's finca).
 *
 * Per GDD §19 MVP cut: regen mode only, 2 crops (Cacao Criollo, Plátano
 * Dominico), manual harvest, off-chain plot only. Subsequent versions:
 * traditional mode, full 5×5 grid via XP unlocks, all 10 crops, daily quests,
 * leaderboards, on-chain PlotNFT mint.
 */

const MVP_TILE_COUNT = 9                    // 3×3 inner

export default function CauaBongaPlot() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const guardianId = Number(id)
  const guardian = GUARDIANS[guardianId]

  const { plot, tiles, loading, error, ensurePlot, plantTile, harvestTile, careTile } = useCauaBongaPlot(guardianId)
  const { beans, mazorcas } = useTokenBalance()
  const [selectedCrop, setSelectedCrop] = useState<CropSlug>('cacao_criollo')
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [pending, setPending] = useState<string | null>(null)        // tile id mid-action

  // Render only the inner 3×3 (tile_idx 6,7,8,11,12,13,16,17,18 in a 5×5 grid).
  // 5×5 indices: row*5 + col, inner = rows 1..3, cols 1..3.
  const innerIdxs = useMemo<number[]>(() => {
    const idxs: number[] = []
    for (let r = 1; r <= 3; r++) for (let c = 1; c <= 3; c++) idxs.push(r * 5 + c)
    return idxs
  }, [])

  const tilesByIdx = useMemo<Record<number, TileRow>>(() => {
    const map: Record<number, TileRow> = {}
    for (const t of tiles) map[t.tile_idx] = t
    return map
  }, [tiles])

  if (Number.isNaN(guardianId) || !guardian) {
    return <PlotShell title="Finca no encontrada" navigate={navigate} guardianId={guardianId} />
  }

  // ── Empty state — no plot yet, offer mint
  if (!loading && !plot) {
    return (
      <PlotShell title={`Parcela en la finca de ${guardian.name}`} navigate={navigate} guardianId={guardianId}>
        <div style={{
          background: BRAND.bgCard, border: `1px dashed ${BRAND.amazon}aa`,
          borderRadius: 18, padding: '32px 22px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>🌱</div>
          <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 16, color: BRAND.heirloom, marginBottom: 8, letterSpacing: '0.04em' }}>
            Aún no tienes parcela aquí.
          </div>
          <div style={{ fontFamily: FONTS.body, fontSize: 13, color: `${BRAND.heirloom}aa`, marginBottom: 18, lineHeight: 1.55, maxWidth: 340, margin: '0 auto 18px' }}>
            Tu primera parcela en la finca de {guardian.name} es gratis. 9 tiles iniciales · 5×5 al subir nivel · siembras Cacao Criollo y Plátano Dominico en modo regenerativo.
          </div>
          <button
            onClick={async () => {
              setPending('mint')
              await ensurePlot()
              setPending(null)
            }}
            disabled={pending === 'mint'}
            style={primaryBtn(pending === 'mint')}
          >
            {pending === 'mint' ? 'Sembrando…' : 'Reclamar mi parcela'}
          </button>
          {error && <div style={errorStyle}>{error}</div>}
        </div>
      </PlotShell>
    )
  }

  // ── Loading
  if (loading || !plot) {
    return (
      <PlotShell title="Cargando parcela…" navigate={navigate} guardianId={guardianId}>
        <div style={{ color: `${BRAND.heirloom}66`, fontFamily: FONTS.body, fontSize: 12, textAlign: 'center', padding: 40 }}>
          🌿 Despertando la tierra…
        </div>
      </PlotShell>
    )
  }

  return (
    <PlotShell title={`Parcela · ${guardian.emoji} ${guardian.name}`} navigate={navigate} guardianId={guardianId}>

      {/* Token HUD — single source of truth via useTokenBalance, polls every 5s */}
      <div style={{
        display: 'flex', gap: 10, marginBottom: 14, justifyContent: 'flex-end', flexWrap: 'wrap',
      }}>
        <BalancePill label="mazorcas" value={Math.floor(mazorcas)} accent={BRAND.mazorca} icon="🫘" />
        <BalancePill label="beans"    value={beans.toFixed(1)}      accent={BRAND.pod}     icon="🌱" />
      </div>

      {/* Plot stats bar */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10,
        marginBottom: 16,
      }}>
        <Stat label="Soil promedio" value={`${Math.round(plot.avg_soil_health)}%`} accent={soilMultiplier(plot.avg_soil_health) >= 1.4 ? '#A1D464' : BRAND.pod} />
        <Stat label="Cosechas totales" value={String(plot.total_harvests)} accent={BRAND.heirloom} />
        <Stat label="Racha regen" value={`${plot.regen_streak_days}d`} accent={BRAND.pod} />
        <Stat label="Tier" value={`★ ${plot.soil_tier}`} accent={BRAND.heirloom} />
      </div>

      {/* Crop selector — MVP: 2 crops */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {MVP_CROPS.map(slug => {
          const crop = CROPS[slug]
          const active = selectedCrop === slug
          return (
            <button
              key={slug}
              onClick={() => setSelectedCrop(slug)}
              style={{
                background: active ? BRAND.pod : BRAND.bgCard,
                color: active ? BRAND.bgDeep : BRAND.heirloom,
                border: `1px solid ${active ? BRAND.pod : BRAND.amazon + 'aa'}`,
                borderRadius: 10,
                padding: '8px 14px',
                cursor: 'pointer',
                fontFamily: FONTS.display, fontWeight: 700, fontSize: 11,
                letterSpacing: '0.08em', textTransform: 'uppercase',
              }}
            >
              {crop.label} · {crop.seedCost} mz
            </button>
          )
        })}
      </div>

      {/* 3×3 grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
        background: BRAND.bgDark, padding: 8, borderRadius: 14,
        border: `1px solid ${BRAND.amazon}55`,
      }}>
        {innerIdxs.slice(0, MVP_TILE_COUNT).map(idx => {
          const tile = tilesByIdx[idx]
          const isPending = tile && pending === tile.id
          return (
            <Tile
              key={idx}
              tile={tile}
              tileIdx={idx}
              isPending={!!isPending}
              onPlant={async () => {
                if (!tile) return
                setPending(tile.id)
                setActionMessage(null)
                const res = await plantTile(idx, selectedCrop, 'regen')
                setPending(null)
                if (res.ok) {
                  setActionMessage(`Sembrado · -${res.seed_cost} mz · listo en ${formatRemaining(res.ready_at)}`)
                } else {
                  setActionMessage(`No se pudo sembrar: ${res.error}`)
                }
              }}
              onHarvest={async () => {
                if (!tile) return
                setPending(tile.id)
                setActionMessage(null)
                const res = await harvestTile(tile)
                setPending(null)
                if (res.ok) {
                  setActionMessage(`+${res.yield_mz ?? 0} mazorcas · soil ahora ${res.soil_after}`)
                } else {
                  setActionMessage(`No se pudo cosechar: ${res.error}`)
                }
              }}
              onCare={async (action) => {
                if (!tile) return
                setPending(tile.id)
                setActionMessage(null)
                const res = await careTile(tile, action)
                setPending(null)
                if (res.ok) {
                  setActionMessage(`${careLabel(action)} ✓ · soil ahora ${res.soil_after}% · listo en ${formatRemaining(res.ready_at)}`)
                } else {
                  setActionMessage(`${careLabel(action)} bloqueado: ${res.error}`)
                }
              }}
            />
          )
        })}
      </div>

      {actionMessage && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          style={{
            marginTop: 14, padding: '10px 14px', borderRadius: 10,
            background: BRAND.bgCard, border: `1px solid ${BRAND.pod}55`,
            color: BRAND.heirloom, fontFamily: FONTS.body, fontSize: 13, textAlign: 'center',
          }}
        >
          {actionMessage}
        </motion.div>
      )}

      {error && <div style={errorStyle}>{error}</div>}

      {/* Yield preview — single source of truth (CB-006) */}
      <YieldPreview cropSlug={selectedCrop} avgSoilHealth={plot.avg_soil_health} guardianId={guardianId} />

      {/* Mazorca sink — visible only once user has earned at least 1 mz */}
      {Math.floor(mazorcas) >= 1 && (
        <div style={{ marginTop: 18 }}>
          <CacaoCeremonyCTA variant="impacto" />
        </div>
      )}
    </PlotShell>
  )
}

// ─── Sub-components ────────────────────────────────────────────────

function Tile({ tile, tileIdx, isPending, onPlant, onHarvest, onCare }: {
  tile: TileRow | undefined
  tileIdx: number
  isPending: boolean
  onPlant: () => void
  onHarvest: () => void
  onCare: (action: CareAction) => void
}) {
  if (!tile) {
    return (
      <div style={{ ...tileBase, opacity: 0.4 }}>
        <div style={{ fontSize: 10, color: `${BRAND.heirloom}55`, fontFamily: FONTS.body }}>
          tile {tileIdx}
        </div>
        <div style={{ fontSize: 9, color: `${BRAND.heirloom}33`, marginTop: 4 }}>—</div>
      </div>
    )
  }

  const crop = tile.crop_slug ? CROPS[tile.crop_slug] : null
  const now = Date.now()
  const readyAt = tile.ready_at ? new Date(tile.ready_at).getTime() : null
  const isReady = tile.state === 'ready' || (tile.state === 'growing' && readyAt !== null && readyAt <= now)
  const remaining = readyAt ? Math.max(0, readyAt - now) : null
  const remainingMin = remaining !== null ? Math.ceil(remaining / 60_000) : null

  // ── EMPTY: tap to plant
  if (tile.state === 'empty') {
    return (
      <button onClick={onPlant} disabled={isPending} style={tileBtn(isPending)}>
        <div style={{ fontSize: 28, opacity: 0.4 }}>🌱</div>
        <div style={tileLabel}>Sembrar</div>
      </button>
    )
  }

  // ── READY: tap to harvest
  if (isReady) {
    return (
      <button onClick={onHarvest} disabled={isPending} style={{
        ...tileBtn(isPending),
        background: `linear-gradient(160deg, ${BRAND.pod}55, ${BRAND.bgDark})`,
        border: `1.5px solid ${BRAND.pod}`,
        animation: 'cb-pulse 1.4s ease-in-out infinite',
      }}>
        <div style={{ fontSize: 28 }}>{crop?.family === 'platano' ? '🍌' : '🍫'}</div>
        <div style={{ ...tileLabel, color: BRAND.pod, fontWeight: 800 }}>Cosechar</div>
      </button>
    )
  }

  // ── GROWING — show 4 care buttons
  if (tile.state === 'growing') {
    return (
      <div style={tileBase}>
        <div style={{ fontSize: 20, opacity: 0.7 }}>{crop?.family === 'platano' ? '🌿' : '🌱'}</div>
        <div style={{ ...tileLabel, marginTop: 2 }}>{crop?.label}</div>
        <div style={{ fontSize: 9, color: `${BRAND.heirloom}77`, marginTop: 2, fontFamily: FONTS.body }}>
          {remainingMin !== null ? (remainingMin >= 60 ? `${Math.floor(remainingMin / 60)}h ${remainingMin % 60}m` : `${remainingMin}m`) : '...'}
        </div>
        <div style={{ display: 'flex', gap: 3, marginTop: 5 }}>
          <CareBtn icon="💧" onClick={() => onCare('water')}    disabled={isPending} title="Regar" />
          <CareBtn icon="☀️" onClick={() => onCare('sun')}      disabled={isPending} title="Sol" />
          <CareBtn icon="🌾" onClick={() => onCare('nutrient')} disabled={isPending} title="Nutriente" />
          <CareBtn icon="✂️" onClick={() => onCare('pruning')}  disabled={isPending} title="Podar" />
        </div>
      </div>
    )
  }

  // ── FALLOW
  if (tile.state === 'fallow') {
    const fallowMs = tile.fallow_until ? new Date(tile.fallow_until).getTime() - now : 0
    return (
      <div style={{ ...tileBase, opacity: 0.65 }}>
        <div style={{ fontSize: 22 }}>🌾</div>
        <div style={tileLabel}>Barbecho</div>
        <div style={{ fontSize: 9, color: `${BRAND.heirloom}55`, marginTop: 3 }}>
          {fallowMs > 0 ? `${Math.ceil(fallowMs / 3_600_000)}h` : 'listo'}
        </div>
      </div>
    )
  }

  return (
    <div style={{ ...tileBase, opacity: 0.4 }}>
      <div style={{ fontSize: 14 }}>—</div>
      <div style={tileLabel}>{tile.state}</div>
    </div>
  )
}

function YieldPreview({ cropSlug, avgSoilHealth, guardianId }: {
  cropSlug: CropSlug
  avgSoilHealth: number
  guardianId: number
}) {
  const breakdown = computeYield({
    cropSlug, mode: 'regen',
    soilHealth: Math.round(avgSoilHealth),
    companionBonusPct: 0, guardianId, harvestsInLast24h: 0,
  })
  const crop = CROPS[cropSlug]

  return (
    <div style={{
      marginTop: 18, padding: '14px 16px', borderRadius: 12,
      background: BRAND.bgCard, border: `1px dashed ${BRAND.amazon}88`,
    }}>
      <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 9, letterSpacing: '0.25em',
                    color: `${BRAND.heirloom}88`, textTransform: 'uppercase', marginBottom: 8 }}>
        Cosecha estimada · {crop.label}
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'baseline' }}>
        <div style={{ fontSize: 24, fontFamily: FONTS.display, fontWeight: 900, color: BRAND.pod }}>
          {breakdown.yieldMz} <span style={{ fontSize: 11, color: `${BRAND.heirloom}aa`, fontWeight: 600 }}>mazorcas</span>
        </div>
        <div style={{ fontSize: 10, color: `${BRAND.heirloom}88`, fontFamily: FONTS.body }}>
          {crop.baseYield} × {breakdown.regenMult.toFixed(2)} regen × {breakdown.soilMult.toFixed(2)} soil = {breakdown.yieldMz}
        </div>
      </div>
      <div style={{ fontSize: 10, color: `${BRAND.heirloom}55`, marginTop: 6, fontFamily: FONTS.body }}>
        Crece en {Math.round(crop.growMinutes / 60)}h · cuesta {crop.seedCost} mz · barbecho 24h post-cosecha
      </div>
    </div>
  )
}

function PlotShell({ title, children, navigate, guardianId }: {
  title: string
  children?: React.ReactNode
  navigate: (path: string) => void
  guardianId: number
}) {
  return (
    <div style={{ background: BRAND.bgDeep, minHeight: '100vh', paddingTop: 80, paddingBottom: 80 }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '16px 20px 0' }}>
        <button onClick={() => navigate(`/caua-bonga/finca/${guardianId}`)} style={backBtn}>
          ← Volver a la finca
        </button>
      </div>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '14px 20px 0' }}>
        <h1 style={{
          fontFamily: FONTS.display, fontWeight: 900, fontSize: 'clamp(22px,5vw,32px)',
          color: BRAND.heirloom, margin: 0, marginBottom: 18, textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          {title}
        </h1>
        {children}
      </div>
      <style>{`
        @keyframes cb-pulse {
          0%,100% { transform: scale(1);     box-shadow: 0 0 0 0   ${BRAND.pod}55; }
          50%     { transform: scale(1.02);  box-shadow: 0 0 0 8px ${BRAND.pod}00; }
        }
      `}</style>
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div style={{
      background: BRAND.bgCard, borderRadius: 10, padding: '10px 12px',
      border: `1px solid ${accent}44`,
    }}>
      <div style={{
        fontFamily: FONTS.display, fontWeight: 700, fontSize: 9, letterSpacing: '0.18em',
        color: `${BRAND.heirloom}66`, textTransform: 'uppercase', marginBottom: 4,
      }}>
        {label}
      </div>
      <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 16, color: accent }}>
        {value}
      </div>
    </div>
  )
}

// ─── Styles ────────────────────────────────────────────────────────

const tileBase: React.CSSProperties = {
  aspectRatio: '1 / 1',
  background: BRAND.bgCard,
  border: `1px solid ${BRAND.amazon}55`,
  borderRadius: 10,
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  padding: 6, color: BRAND.heirloom, textAlign: 'center',
}

function tileBtn(isPending: boolean): React.CSSProperties {
  return {
    ...tileBase,
    cursor: isPending ? 'wait' : 'pointer',
    opacity: isPending ? 0.5 : 1,
    transition: 'transform 120ms ease, box-shadow 120ms ease',
  }
}

const tileLabel: React.CSSProperties = {
  fontFamily: FONTS.body, fontSize: 9, color: `${BRAND.heirloom}99`,
  marginTop: 4, letterSpacing: '0.04em',
}

const backBtn: React.CSSProperties = {
  background: 'transparent', border: `1px solid ${BRAND.amazon}aa`,
  borderRadius: 999, padding: '6px 14px', cursor: 'pointer',
  fontFamily: FONTS.display, fontWeight: 700, fontSize: 10, letterSpacing: '0.15em',
  color: `${BRAND.heirloom}88`, textTransform: 'uppercase',
}

function primaryBtn(disabled: boolean): React.CSSProperties {
  return {
    background: disabled ? BRAND.bgCard : `linear-gradient(135deg, ${BRAND.pod}, ${BRAND.pod}cc)`,
    color: disabled ? `${BRAND.heirloom}66` : BRAND.bgDeep,
    border: 'none', borderRadius: 999, padding: '12px 26px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: FONTS.display, fontWeight: 800, fontSize: 12,
    letterSpacing: '0.12em', textTransform: 'uppercase',
  }
}

const errorStyle: React.CSSProperties = {
  marginTop: 12, color: '#E47966',
  fontFamily: FONTS.body, fontSize: 11, textAlign: 'center',
}

function CareBtn({ icon, onClick, disabled, title }: {
  icon: string
  onClick: () => void
  disabled: boolean
  title: string
}) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick() }}
      disabled={disabled}
      title={title}
      aria-label={title}
      style={{
        background: BRAND.bgDeep,
        border: `1px solid ${BRAND.amazon}aa`,
        borderRadius: 6,
        padding: '3px 5px',
        fontSize: 11,
        cursor: disabled ? 'wait' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        lineHeight: 1,
      }}
    >
      {icon}
    </button>
  )
}

function BalancePill({ label, value, accent, icon }: {
  label: string
  value: number | string
  accent: string
  icon: string
}) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      background: BRAND.bgCard, border: `1px solid ${accent}55`,
      borderRadius: 999, padding: '6px 14px',
    }}>
      <span style={{ fontSize: 14 }}>{icon}</span>
      <span style={{
        fontFamily: FONTS.display, fontWeight: 800, fontSize: 13,
        color: accent, letterSpacing: '0.04em',
      }}>{value}</span>
      <span style={{
        fontFamily: FONTS.display, fontWeight: 600, fontSize: 9,
        color: `${BRAND.heirloom}77`, letterSpacing: '0.18em',
        textTransform: 'uppercase',
      }}>{label}</span>
    </div>
  )
}

function careLabel(action: CareAction): string {
  switch (action) {
    case 'water':    return 'Riego'
    case 'sun':      return 'Sol'
    case 'nutrient': return 'Nutriente'
    case 'pruning':  return 'Poda'
  }
}

function formatRemaining(readyAt: string | undefined): string {
  if (!readyAt) return '—'
  const ms = new Date(readyAt).getTime() - Date.now()
  if (ms <= 0) return 'listo'
  const min = Math.ceil(ms / 60_000)
  return min >= 60 ? `${Math.floor(min / 60)}h ${min % 60}m` : `${min}m`
}
