import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCocoaTrees } from '../hooks/useCocoaTrees'
import { BRAND, FONTS, GUARDIANS } from '../utils/constants'
import CauaButton from '../components/ui/CauaButton'
import CauaGotchi from '../components/dashboard/CauaGotchi'
import type { CacaoTree } from '../lib/database.types'
import {
  GROWTH_STAGES, PLANT_PROBLEMS, SPECIAL_ITEMS,
  getStageByDays, getHealthStatus, getNextCareTime, formatTimeUntil,
  CARE_INTERVAL_HOURS,
} from '../utils/growthSystem'

interface CareLogEntry {
  id: number
  time: Date
  emoji: string
  action: string
  message: string
  color: string
}

interface Inventory {
  nutrients: number
  pruning: number
  molasses: number
}

export default function TreeDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { trees } = useCocoaTrees()
  const [tree, setTree] = useState<CacaoTree | null>(null)
  const [loading, setLoading] = useState(true)

  // Game state
  const [health, setHealth] = useState(85)
  const [moisture, setMoisture] = useState(70)
  const [sunlight, setSunlight] = useState(60)
  const [currentProblem, setCurrentProblem] = useState<string | null>(null)
  const [careLog, setCareLog] = useState<CareLogEntry[]>([])
  const [inventory, setInventory] = useState<Inventory>({ nutrients: 1, pruning: 1, molasses: 0 })
  const [lastCareTime, setLastCareTime] = useState<Date | null>(null)
  const [activeEffect, setActiveEffect] = useState<string | null>(null)
  const [canCare, setCanCare] = useState(true)
  const [nextCareIn, setNextCareIn] = useState('')
  const [secretFound, setSecretFound] = useState(false)
  const [tapCount, setTapCount] = useState(0)
  const [lastTapTime, setLastTapTime] = useState(0)

  useEffect(() => {
    if (!id || !user) return
    const found = trees.find(t => t.id === id)
    if (found) { setTree(found); setLoading(false) }
    else setLoading(false)
  }, [id, trees, user])

  // Care countdown ticker
  useEffect(() => {
    if (!lastCareTime) return
    const tick = setInterval(() => {
      const next = getNextCareTime(lastCareTime)
      if (Date.now() >= next.getTime()) {
        setCanCare(true)
        setNextCareIn('¡Ahora!')
      } else {
        setCanCare(false)
        setNextCareIn(formatTimeUntil(next))
      }
    }, 15000)
    return () => clearInterval(tick)
  }, [lastCareTime])

  // Health degradation when neglected
  useEffect(() => {
    if (!lastCareTime) return
    const check = setInterval(() => {
      const hours = (Date.now() - lastCareTime.getTime()) / 3600000
      if (hours >= 6 && !currentProblem) {
        const problems = ['plague', 'drought', 'fungus']
        const prob = problems[Math.floor(Math.random() * problems.length)]
        setCurrentProblem(prob)
        const p = PLANT_PROBLEMS[prob]
        setHealth(h => Math.max(5, h - p.healthDamage))
        addLog(`${p.emoji}⚠️`, p.name, p.description, '#e74c3c')
      }
    }, 20000)
    return () => clearInterval(check)
  }, [lastCareTime, currentProblem])

  const addLog = useCallback((emoji: string, action: string, message: string, color: string) => {
    setCareLog(prev => [{ id: Date.now(), time: new Date(), emoji, action, message, color }, ...prev.slice(0, 9)])
  }, [])

  const triggerEffect = (name: string) => {
    setActiveEffect(name)
    setTimeout(() => setActiveEffect(null), 1400)
  }

  const doCare = (action: 'water' | 'sunlight' | 'nutrients' | 'pruning' | 'molasses') => {
    const isBasic = action === 'water' || action === 'sunlight'
    if (isBasic && !canCare) return
    if (action === 'nutrients' && inventory.nutrients <= 0) return
    if (action === 'pruning' && inventory.pruning <= 0) return
    if (action === 'molasses' && inventory.molasses <= 0) return

    triggerEffect(action)
    if (isBasic) { setLastCareTime(new Date()); setCanCare(false) }

    if (action === 'water') {
      setMoisture(m => Math.min(100, m + 25))
      setHealth(h => Math.min(100, h + 10))
      if (currentProblem === 'plague' || currentProblem === 'drought') {
        const prob = PLANT_PROBLEMS[currentProblem]
        setCurrentProblem(null)
        addLog('💧✅', 'Riego curativo', `¡${prob.name} curado con riego! Tu árbol respira. 😊`, '#3498db')
      } else {
        addLog('💧', 'Riego', 'Agua fresca del bosque absorbida. Tu árbol te lo agradece. 🌿', '#3498db')
      }
    } else if (action === 'sunlight') {
      setSunlight(s => Math.min(100, s + 20))
      setHealth(h => Math.min(100, h + 5))
      addLog('☀️', 'Exposición solar', 'Fotosíntesis activa — energía del trópico convertida en vida. ✨', '#f1c40f')
    } else if (action === 'nutrients') {
      setInventory(inv => ({ ...inv, nutrients: inv.nutrients - 1 }))
      setHealth(h => Math.min(100, h + 25))
      addLog('🌿', 'Nutrientes aplicados', 'Microorganismos amazónicos activados. Crecimiento acelerado. 🚀', '#91A63B')
    } else if (action === 'pruning') {
      setInventory(inv => ({ ...inv, pruning: inv.pruning - 1 }))
      setHealth(h => Math.min(100, h + 15))
      addLog('✂️', 'Poda científica', 'Corte estratégico para maximizar floración. Árbol más fuerte. 🌸', '#8D2679')
    } else if (action === 'molasses') {
      setInventory(inv => ({ ...inv, molasses: inv.molasses - 1 }))
      setHealth(h => Math.min(100, h + 30))
      if (currentProblem === 'fungus' || currentProblem === 'plague') {
        const prob = PLANT_PROBLEMS[currentProblem]
        setCurrentProblem(null)
        addLog('🍯✅', 'Melaza curativa', `SECRETO ANCESTRAL activado — ¡${prob.name} eliminado! 🎉`, '#F1A91E')
      } else {
        addLog('🍯', 'Melaza anti-hongo', 'Defensa ancestral fermentada aplicada. Árbol blindado. 🛡️', '#F1A91E')
      }
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
  const daysSince = (Date.now() - new Date(tree.adopted_at).getTime()) / 86400000
  const stage = getStageByDays(daysSince)
  const healthStatus = getHealthStatus(health)
  const progressPct = ((stage.id + 1) / GROWTH_STAGES.length) * 100
  const prob = currentProblem ? PLANT_PROBLEMS[currentProblem] : null

  return (
    <div style={{ background: BRAND.bgDeep, minHeight: '100vh', paddingBottom: '5rem' }}>

      {/* Header */}
      <div style={{
        padding: '1rem 1.25rem 0.75rem',
        borderBottom: `1px solid ${BRAND.bgCard}`,
        background: `${BRAND.bgDeep}EE`,
        position: 'sticky', top: 0, zIndex: 40,
        backdropFilter: 'blur(8px)',
      }}>
        <button onClick={() => navigate('/adoptar')} style={{
          background: 'transparent', border: 'none', color: BRAND.pod,
          cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, marginBottom: 6,
        }}>
          ← Volver
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{
              fontSize: 'clamp(1.1rem,4vw,1.5rem)', fontWeight: 900,
              fontFamily: FONTS.display, color: BRAND.heirloom,
              margin: 0, textTransform: 'uppercase',
            }}>
              {guardian.name} · <span style={{ color: BRAND.pod }}>{stage.name}</span>
            </h1>
            <div style={{ fontSize: '0.75rem', color: '#888', marginTop: 2 }}>
              Día {Math.floor(daysSince)} · {Math.round(daysSince * 10) / 10}/5 días · {stage.emoji}
            </div>
          </div>
          <div style={{
            background: BRAND.bgCard, border: `1px solid ${BRAND.amazon}66`,
            borderRadius: 8, padding: '4px 10px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 10, color: '#888', textTransform: 'uppercase' }}>Salud</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: healthStatus.color }}>
              {healthStatus.emoji} {health}%
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '1rem 1rem 0' }}>

        {/* Problem Alert */}
        {prob && (
          <div style={{
            background: '#2a0808', border: '2px solid #e74c3c',
            borderRadius: 12, padding: '0.75rem 1rem', marginBottom: '1rem',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{ fontSize: 28 }}>{prob.emoji}</div>
            <div>
              <div style={{ color: '#ff6b6b', fontWeight: 700, fontSize: '0.875rem' }}>{prob.name}</div>
              <div style={{ color: '#ccc', fontSize: '0.75rem', marginTop: 2 }}>{prob.description}</div>
            </div>
          </div>
        )}

        {/* Secret found flash */}
        {secretFound && (
          <div style={{
            background: 'linear-gradient(135deg, #583915, #F1A91E33)',
            border: '2px solid #F1A91E', borderRadius: 12,
            padding: '0.75rem 1rem', marginBottom: '1rem', textAlign: 'center',
          }}>
            <div style={{ fontSize: 24 }}>🍯✨</div>
            <div style={{ color: '#F1A91E', fontWeight: 700 }}>¡SECRETO DESCUBIERTO!</div>
            <div style={{ color: '#ccc', fontSize: '0.75rem' }}>Melaza Orgánica Anti-Hongo añadida al inventario</div>
          </div>
        )}

        {/* CauaGotchi */}
        <CauaGotchi
          health={health} moisture={moisture} sunlight={sunlight}
          stageText={stage.name} treeName={guardian.name}
          stageEmoji={stage.emoji} stageId={stage.id}
          problem={currentProblem}
        />

        {/* Stage Info */}
        <div style={{
          background: BRAND.bgCard, border: `1px solid ${BRAND.amazon}55`,
          borderRadius: 12, padding: '0.875rem 1rem', marginBottom: '1rem',
        }}>
          <div style={{ fontSize: '0.7rem', color: BRAND.pod, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
            Etapa {stage.id + 1}/8 — {stage.name}
          </div>
          <p style={{ color: '#ddd', fontSize: '0.8rem', lineHeight: 1.5, margin: '0 0 6px' }}>{stage.description}</p>
          <div style={{ color: BRAND.mazorca, fontSize: '0.75rem' }}>💡 {stage.careTip}</div>
        </div>

        {/* Next Care Countdown */}
        <div style={{
          background: canCare ? `${BRAND.pod}22` : BRAND.bgCard,
          border: `1px solid ${canCare ? BRAND.pod : BRAND.amazon + '55'}`,
          borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          transition: 'background 0.5s, border-color 0.5s',
        }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {canCare ? '⚡ Próximo cuidado' : `⏱ Próximo cuidado en`}
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: FONTS.display, color: canCare ? BRAND.pod : '#aaa' }}>
              {canCare ? '¡Listo para cuidar!' : (nextCareIn || `${CARE_INTERVAL_HOURS}h`)}
            </div>
          </div>
          <div style={{ fontSize: '0.7rem', color: '#666', textAlign: 'right' }}>
            Cada {CARE_INTERVAL_HOURS}h<br />5 días total
          </div>
        </div>

        {/* Tree Tap Zone */}
        <div
          onClick={handleTreeTap}
          style={{
            textAlign: 'center', cursor: 'pointer', marginBottom: '1rem',
            padding: '0.75rem',
            background: `${BRAND.amazon}22`,
            borderRadius: 12, border: `1px dashed ${BRAND.amazon}`,
            transition: 'transform 0.1s',
            userSelect: 'none',
          }}
        >
          <div style={{
            fontSize: activeEffect ? '4.5rem' : '4rem',
            transition: 'font-size 0.15s',
            filter: activeEffect ? `drop-shadow(0 0 16px ${BRAND.pod})` : 'none',
          }}>
            {stage.emoji}
          </div>
          <div style={{ fontSize: '0.65rem', color: '#555', marginTop: 4 }}>
            👆 toca 3 veces rápido para descubrir algo
          </div>

          {/* Active care visual particles */}
          {activeEffect === 'water' && (
            <div style={{ position: 'absolute', pointerEvents: 'none' }}>
              {'💧💧💧'.split('').map((e, i) => (
                <span key={i} style={{ fontSize: 20, animation: `fall 1s ease-in ${i * 0.1}s forwards`, position: 'relative', display: 'inline-block' }}>{e}</span>
              ))}
            </div>
          )}
        </div>

        {/* Basic Care Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: '0.75rem' }}>
          <CauaButton
            variant={activeEffect === 'water' ? 'primary' : 'secondary'}
            size="lg"
            onClick={() => doCare('water')}
            disabled={!canCare || activeEffect !== null}
            style={{ width: '100%' }}
          >
            {activeEffect === 'water' ? '💧 Regando...' : `💧 Regar${!canCare ? ' (' + (nextCareIn || '3h') + ')' : ''}`}
          </CauaButton>
          <CauaButton
            variant={activeEffect === 'sunlight' ? 'primary' : 'secondary'}
            size="lg"
            onClick={() => doCare('sunlight')}
            disabled={!canCare || activeEffect !== null}
            style={{ width: '100%' }}
          >
            {activeEffect === 'sunlight' ? '☀️ Soleando...' : '☀️ Sol'}
          </CauaButton>
        </div>

        {/* Special Items */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.7rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
            Items especiales
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {(Object.entries(SPECIAL_ITEMS) as [keyof Inventory, typeof SPECIAL_ITEMS[string]][]).map(([key, item]) => {
              const count = inventory[key as keyof Inventory]
              const isEmpty = count === 0
              return (
                <button
                  key={key}
                  onClick={() => doCare(key as 'nutrients' | 'pruning' | 'molasses')}
                  disabled={isEmpty || activeEffect !== null}
                  style={{
                    background: isEmpty ? `${BRAND.bgCard}88` : item.rarity === 'secret' ? `${BRAND.mazorca}22` : `${BRAND.pod}22`,
                    border: `1px solid ${isEmpty ? BRAND.amazon + '33' : item.rarity === 'secret' ? BRAND.mazorca + '88' : BRAND.pod + '66'}`,
                    borderRadius: 10, padding: '10px 8px',
                    cursor: isEmpty ? 'not-allowed' : 'pointer',
                    color: BRAND.heirloom, textAlign: 'center',
                    opacity: isEmpty ? 0.4 : 1,
                    transition: 'opacity 0.3s, transform 0.1s',
                  }}
                >
                  <div style={{ fontSize: 22, marginBottom: 4 }}>{item.emoji}</div>
                  <div style={{ fontSize: 9, fontWeight: 700, lineHeight: 1.2, marginBottom: 3, color: item.rarity === 'secret' ? BRAND.mazorca : BRAND.pod }}>
                    {item.name.toUpperCase()}
                  </div>
                  <div style={{ fontSize: 11, color: count > 0 ? BRAND.pod : '#555', fontWeight: 700 }}>
                    ×{count}
                  </div>
                  {item.rarity === 'secret' && count === 0 && (
                    <div style={{ fontSize: 8, color: '#555', marginTop: 2 }}>secreto</div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Growth Timeline */}
        <div style={{
          background: BRAND.bgCard, border: `1px solid ${BRAND.amazon}55`,
          borderRadius: 12, padding: '1rem', marginBottom: '1rem',
        }}>
          <div style={{ fontSize: '0.7rem', color: BRAND.pod, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
            Ciclo de vida — {stage.id + 1}/8 etapas
          </div>

          {/* Progress bar */}
          <div style={{ background: `${BRAND.amazon}44`, height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 12 }}>
            <div style={{
              background: `linear-gradient(90deg, ${BRAND.pod}, ${BRAND.mazorca})`,
              height: '100%', width: `${progressPct}%`,
              transition: 'width 1s ease-out',
            }} />
          </div>

          {/* Stage dots */}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {GROWTH_STAGES.map(s => (
              <div key={s.id} style={{ textAlign: 'center', flex: 1 }}>
                <div style={{
                  fontSize: s.id <= stage.id ? 16 : 12,
                  opacity: s.id <= stage.id ? 1 : 0.3,
                  transition: 'font-size 0.3s, opacity 0.3s',
                  filter: s.id === stage.id ? `drop-shadow(0 0 6px ${BRAND.pod})` : 'none',
                }}>
                  {s.emoji}
                </div>
                {s.id === stage.id && (
                  <div style={{ width: 4, height: 4, background: BRAND.pod, borderRadius: '50%', margin: '3px auto 0' }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Care Log */}
        {careLog.length > 0 && (
          <div style={{
            background: BRAND.bgCard, border: `1px solid ${BRAND.amazon}55`,
            borderRadius: 12, padding: '1rem',
          }}>
            <div style={{ fontSize: '0.7rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
              Registro de cuidados
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {careLog.map(entry => (
                <div key={entry.id} style={{
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                  paddingBottom: 8, borderBottom: `1px solid ${BRAND.amazon}33`,
                }}>
                  <div style={{ fontSize: 18, flexShrink: 0 }}>{entry.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: entry.color }}>{entry.action}</div>
                    <div style={{ fontSize: '0.7rem', color: '#aaa', lineHeight: 1.4 }}>{entry.message}</div>
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#555', flexShrink: 0 }}>
                    {entry.time.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {careLog.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '2rem 1rem',
            color: '#555', fontSize: '0.8rem',
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
            <div>Aún no has cuidado tu árbol.</div>
            <div style={{ color: BRAND.pod, marginTop: 4 }}>¡Empieza ahora — riégalo!</div>
          </div>
        )}

      </div>

      <style>{`
        @keyframes fall {
          0%   { transform: translateY(-20px); opacity: 0; }
          20%  { opacity: 1; }
          100% { transform: translateY(60px); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
