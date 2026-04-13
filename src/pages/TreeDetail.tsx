import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCocoaTrees } from '../hooks/useCocoaTrees'
import { BRAND, FONTS, GUARDIANS } from '../utils/constants'
import CauaButton from '../components/ui/CauaButton'
import type { CacaoTree } from '../lib/database.types'

const STAGE_EMOJI: Record<string, string> = {
  Semilla: '🌱',
  Plántula: '🌿',
  'Árbol Joven': '🌳',
  'Árbol Adulto': '🌲',
  Cosecha: '🫘',
}

const STAGE_ORDER = ['Semilla', 'Plántula', 'Árbol Joven', 'Árbol Adulto', 'Cosecha']

export default function TreeDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { trees } = useCocoaTrees()
  const [tree, setTree] = useState<CacaoTree | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeEffect, setActiveEffect] = useState<'water' | 'sunlight' | 'nutrients' | null>(null)

  useEffect(() => {
    if (!id || !user) return

    const foundTree = trees.find(t => t.id === id)
    if (foundTree) {
      setTree(foundTree)
      setLoading(false)
    } else {
      setLoading(false)
    }
  }, [id, trees, user])

  if (!user || !tree) {
    return (
      <div style={{ background: BRAND.bgDeep, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: BRAND.heirloom, textAlign: 'center' }}>
          {loading ? 'Cargando árbol...' : 'Árbol no encontrado'}
        </div>
      </div>
    )
  }

  const guardian = GUARDIANS[tree.guardian_id]
  const emoji = STAGE_EMOJI[tree.stage] || '🌱'
  const stageIndex = STAGE_ORDER.indexOf(tree.stage)
  const progressPercent = ((stageIndex + 1) / STAGE_ORDER.length) * 100

  const ageInDays = Math.floor(
    (new Date().getTime() - new Date(tree.adopted_at).getTime()) / (1000 * 60 * 60 * 24)
  )

  const handleCareAction = (action: 'water' | 'sunlight' | 'nutrients') => {
    setActiveEffect(action)
    setTimeout(() => setActiveEffect(null), 1500)
  }

  return (
    <div style={{ background: BRAND.bgDeep, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header — Sticky Hero */}
      <div
        className="px-4 py-4 border-b sticky top-0 z-40"
        style={{
          background: BRAND.bgDeep,
          borderColor: BRAND.bgCard,
          backdropFilter: 'blur(8px)',
          backgroundColor: `${BRAND.bgDeep}E8`,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
          <button
            onClick={() => navigate('/adoptar')}
            style={{
              background: 'transparent',
              border: 'none',
              color: BRAND.pod,
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '600',
            }}
          >
            ← Volver
          </button>
        </div>

        <h1 style={{
          fontSize: 'clamp(1.25rem, 4vw, 1.75rem)',
          fontWeight: '900',
          fontFamily: FONTS.display,
          color: BRAND.heirloom,
          margin: 0,
          lineHeight: '1.2',
          textTransform: 'uppercase',
          letterSpacing: '0.02em',
        }}>
          {guardian.name}'s <br/>
          <span style={{ color: BRAND.pod }}>Árbol de Cacao</span>
        </h1>
      </div>

      {/* Game Scene Container */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', position: 'relative' }}>

        {/* Scene Background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse 800px 600px at 50% 30%, ${BRAND.pod}08, transparent)`,
            pointerEvents: 'none',
          }}
        />

        {/* Tree Scene */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: 400,
            maxWidth: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '2rem',
          }}
        >
          {/* Stage Badge */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              background: BRAND.pod,
              color: '#040C06',
              padding: '0.5rem 0.75rem',
              borderRadius: '0.5rem',
              fontSize: '0.75rem',
              fontWeight: '600',
              fontFamily: FONTS.display,
              textTransform: 'uppercase',
            }}
          >
            {tree.stage}
          </div>

          {/* Sun Rays Overlay */}
          {activeEffect === 'sunlight' && (
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    top: -50,
                    right: 30 + i * 15,
                    width: 60,
                    height: 180,
                    background: `linear-gradient(180deg, ${BRAND.mazorca}80, transparent)`,
                    clipPath: 'polygon(0 0, 100% 40%, 100% 100%, 0 100%)',
                    animation: `sun-ray 1.5s ease-out forwards`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Water Drops Overlay */}
          {activeEffect === 'water' && (
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: `${20 + i * 15}%`,
                    top: -40,
                    fontSize: '1.5rem',
                    animation: `water-drop 1.5s ease-in forwards`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                >
                  💧
                </div>
              ))}
            </div>
          )}

          {/* Nutrient Particles Overlay */}
          {activeEffect === 'nutrients' && (
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: `${25 + i * 15}%`,
                    bottom: -20,
                    width: 10,
                    height: 10,
                    background: BRAND.pod,
                    borderRadius: '50%',
                    animation: `nutrient-rise 1.5s ease-out forwards`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Main Tree Emoji */}
          <div
            style={{
              fontSize: 'clamp(6rem, 20vw, 10rem)',
              lineHeight: '1',
              animation: 'gentle-sway 3s ease-in-out infinite',
              transformOrigin: 'bottom',
              zIndex: 10,
            }}
          >
            {emoji}
          </div>
        </div>

        {/* Compact Stats Bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1rem',
            width: '100%',
            maxWidth: 500,
            marginBottom: '2rem',
          }}
        >
          <div style={{ textAlign: 'center', background: BRAND.bgCard, padding: '1rem', borderRadius: '0.5rem', border: `1px solid ${BRAND.amazon}44` }}>
            <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.25rem', textTransform: 'uppercase' }}>CO₂</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '900', fontFamily: FONTS.display, color: BRAND.mazorca }}>
              {tree.co2_kg}
            </div>
            <div style={{ fontSize: '0.625rem', color: '#666' }}>kg</div>
          </div>

          <div style={{ textAlign: 'center', background: BRAND.bgCard, padding: '1rem', borderRadius: '0.5rem', border: `1px solid ${BRAND.amazon}44` }}>
            <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Días</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '900', fontFamily: FONTS.display, color: BRAND.pod }}>
              {ageInDays}
            </div>
            <div style={{ fontSize: '0.625rem', color: '#666' }}>vivo</div>
          </div>

          <div style={{ textAlign: 'center', background: BRAND.bgCard, padding: '1rem', borderRadius: '0.5rem', border: `1px solid ${BRAND.amazon}44` }}>
            <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Región</div>
            <div style={{ fontSize: '0.875rem', fontWeight: '700', fontFamily: FONTS.display, color: BRAND.heirloom }}>
              {guardian.region.split(' ')[0]}
            </div>
            <div style={{ fontSize: '0.625rem', color: '#666' }}>📍</div>
          </div>
        </div>

        {/* Care Action Buttons */}
        <div className="grid gap-2 md:grid-cols-3 w-full max-w-md">
          <CauaButton
            variant={activeEffect === 'water' ? 'primary' : 'secondary'}
            size="lg"
            onClick={() => handleCareAction('water')}
            disabled={activeEffect !== null}
            style={{ width: '100%' }}
          >
            {activeEffect === 'water' ? '💧 Regando...' : '💧 Regar'}
          </CauaButton>
          <CauaButton
            variant={activeEffect === 'sunlight' ? 'primary' : 'secondary'}
            size="lg"
            onClick={() => handleCareAction('sunlight')}
            disabled={activeEffect !== null}
            style={{ width: '100%' }}
          >
            {activeEffect === 'sunlight' ? '☀️ Soleando...' : '☀️ Sol'}
          </CauaButton>
          <CauaButton
            variant={activeEffect === 'nutrients' ? 'primary' : 'secondary'}
            size="lg"
            onClick={() => handleCareAction('nutrients')}
            disabled={activeEffect !== null}
            style={{ width: '100%' }}
          >
            {activeEffect === 'nutrients' ? '🌱 Nutriendo...' : '🌱 Nutrientes'}
          </CauaButton>
        </div>
      </div>

      {/* Variety Benefits Card */}
      <div style={{ maxWidth: 500, width: '100%', margin: '0 auto', padding: '0 1rem 2rem' }}>
        <div style={{ background: `${BRAND.pod}11`, border: `1px solid ${BRAND.pod}44`, borderRadius: '0.75rem', padding: '1rem' }}>
          <div style={{ fontSize: '0.75rem', color: BRAND.pod, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
            🧬 {tree.variety} — Fine Flavor del 1% mundial
          </div>
          <p style={{ fontSize: '0.875rem', color: '#ddd', lineHeight: '1.5', margin: '0 0 0.75rem' }}>
            {guardian.variety_benefit}
          </p>
          <div style={{ fontSize: '0.75rem', color: '#888' }}>
            {guardian.heritage}
          </div>
        </div>
      </div>

      {/* Growth Progress Bar (fixed at bottom) */}
      <div style={{ padding: '1rem', background: BRAND.bgCard, borderTop: `1px solid ${BRAND.amazon}44` }}>
        <div style={{ maxWidth: 500, margin: '0 auto' }}>
          <div style={{ marginBottom: '0.5rem', color: '#999', fontSize: '0.75rem' }}>Progreso de crecimiento</div>
          <div
            style={{
              background: `${BRAND.amazon}44`,
              height: '0.5rem',
              borderRadius: '0.25rem',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                background: `linear-gradient(90deg, ${BRAND.pod}, ${BRAND.mazorca})`,
                height: '100%',
                width: `${progressPercent}%`,
                transition: 'width 0.6s ease-out',
              }}
            />
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes gentle-sway {
          0%, 100% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(1deg) scale(1.02); }
        }
        @keyframes water-drop {
          0%   { transform: translateY(-40px); opacity: 0; }
          20%  { opacity: 1; }
          100% { transform: translateY(280px); opacity: 0; }
        }
        @keyframes sun-ray {
          0%   { opacity: 0; transform: scale(0.6); }
          50%  { opacity: 0.5; }
          100% { opacity: 0; transform: scale(1.3); }
        }
        @keyframes nutrient-rise {
          0%   { transform: translateY(0) scale(1); opacity: 0; }
          20%  { opacity: 1; }
          100% { transform: translateY(-180px) scale(0.3); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
