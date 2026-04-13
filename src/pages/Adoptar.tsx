import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useCocoaTrees } from '../hooks/useCocoaTrees'
import { CacaoTreeCard } from '../components/dashboard/CacaoTreeCard'
import TokenReward from '../components/ritual/TokenReward'
import CauaButton from '../components/ui/CauaButton'
import CauaCard from '../components/ui/CauaCard'
import SwipeableTreeCard from '../components/ui/SwipeableTreeCard'
import { BRAND, FONTS, GUARDIANS, TOKEN_RATES } from '../utils/constants'

type AdoptarPhase = 'browse' | 'selecting-guardian' | 'confirming' | 'adopted'

interface AdoptarState {
  phase: AdoptarPhase
  selectedGuardian: number | null
  selectedVariety: string | null
  tokenReward: { beans: number; mazorcas: number } | null
  cardsLeft: number[]
}

export default function Adoptar() {
  const { user } = useAuth()
  const { trees, loading: treesLoading, adoptTree } = useCocoaTrees()
  const [state, setState] = useState<AdoptarState>({
    phase: 'browse',
    selectedGuardian: null,
    selectedVariety: null,
    tokenReward: null,
    cardsLeft: GUARDIANS.map((_, i) => i) // indices of GUARDIANS
  })
  const [isAdopting, setIsAdopting] = useState(false)


  const startAdoption = () => {
    setState(prev => ({ ...prev, phase: 'selecting-guardian', cardsLeft: GUARDIANS.map((_, i) => i) }))
  }

  const selectGuardian = (guardianId: number) => {
    setState(prev => ({
      ...prev,
      selectedGuardian: guardianId,
      phase: 'confirming',
    }))
  }

  const handleSwipeLeft = () => {
    setState(prev => {
      const newCards = [...prev.cardsLeft]
      newCards.pop() // remove top card
      if (newCards.length === 0) {
        // they rejected all, loop back
        return { ...prev, cardsLeft: GUARDIANS.map((_, i) => i) }
      }
      return { ...prev, cardsLeft: newCards }
    })
  }

  const handleSwipeRight = (guardianId: number) => {
    selectGuardian(guardianId)
  }


  const confirmAdoption = async () => {
    if (state.selectedGuardian === null) return

    setIsAdopting(true)
    try {
      const guardian = GUARDIANS[state.selectedGuardian]
      
      // Auto-map guardian's descriptive variety to DB Enum
      const displayVar = guardian.varieties[0]
      let dbEnum = 'Criollo'
      if (displayVar.includes('Trinitario')) dbEnum = 'Trinitario'
      if (displayVar.includes('Forastero')) dbEnum = 'Forastero'
      if (displayVar.includes('Nacional')) dbEnum = 'Nacional'
      
      await adoptTree(state.selectedGuardian, dbEnum, guardian.region)

      // Show token reward animation
      const reward = TOKEN_RATES.tree_adoption
      setState(prev => ({
        ...prev,
        phase: 'adopted',
        tokenReward: reward,
      }))

      // Reset after animation
      setTimeout(() => {
        setState({
          phase: 'browse',
          selectedGuardian: null,
          selectedVariety: null,
          tokenReward: null,
          cardsLeft: GUARDIANS.map((_, i) => i)
        })
      }, 3000)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      alert(`No se pudo adoptar el árbol: ${msg}\n\nRevisa si ya corriste las migraciones de Base de Datos en Supabase.`)
      setState(prev => ({ ...prev, phase: 'browse' }))
    } finally {
      setIsAdopting(false)
    }
  }

  if (!user) {
    return <div>Cargando...</div>
  }

  return (
    <div style={{ background: BRAND.bgDeep, minHeight: '100vh', paddingBottom: '4rem' }}>
      {/* Hero Section */}
      <div className="px-4 py-12 md:py-16 border-b" style={{ borderColor: BRAND.bgCard }}>
        <div className="max-w-3xl mx-auto">
          <div
            style={{
              color: BRAND.mazorca,
              fontSize: '0.875rem',
              fontWeight: '600',
              letterSpacing: '0.1em',
              marginBottom: '1rem',
            }}
          >
            CACAO FRUTA BRUTAL
          </div>
          <h1
            style={{
              fontSize: 'clamp(2.5rem, 8vw, 4.5rem)',
              fontWeight: '900',
              fontFamily: FONTS.display,
              color: BRAND.heirloom,
              lineHeight: '1',
              marginBottom: '1rem',
              letterSpacing: '0.02em',
              textTransform: 'uppercase'
            }}
          >
            Apadrina tu <br/>
            <span style={{ color: BRAND.pod }}>árbol digital</span>
          </h1>
          <p style={{ color: '#999', fontSize: '1.125rem', lineHeight: '1.6' }}>
            Conecta con un Guardián del Cacao Criollo colombiano. Observa tu árbol crecer,
            absorber CO₂, y predecir su cosecha usando datos climáticos reales.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* My Trees Grid */}
        {!treesLoading && trees.length > 0 && (
          <div className="mb-16">
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                fontFamily: FONTS.display,
                color: BRAND.heirloom,
                marginBottom: '2rem',
              }}
            >
              Mis Árboles ({trees.length})
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {trees.map(tree => (
                <CacaoTreeCard key={tree.id} tree={tree} />
              ))}
            </div>
            <div className="mt-8 pt-8 border-t" style={{ borderColor: BRAND.bgCard }}>
              <CauaButton
                variant="primary"
                size="lg"
                onClick={startAdoption}
                style={{ width: '100%' }}
              >
                Adoptar Otro Árbol
              </CauaButton>
            </div>
          </div>
        )}

        {/* Empty State or Browse Phase */}
        {(state.phase === 'browse' || (treesLoading === false && trees.length === 0)) && (
          <>
            {trees.length === 0 && (
              <div
                style={{
                  background: BRAND.bgCard,
                  border: `2px solid ${BRAND.pod}`,
                  borderRadius: '1rem',
                  padding: '3rem 2rem',
                  textAlign: 'center',
                  marginBottom: '3rem',
                }}
              >
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌱</div>
                <h3
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    fontFamily: FONTS.display,
                    color: BRAND.heirloom,
                    marginBottom: '0.5rem',
                  }}
                >
                  Sin árboles aún
                </h3>
                <p style={{ color: '#999', marginBottom: '2rem' }}>
                  Empieza tu viaje ahora adoptando tu primer árbol de cacao.
                </p>
                <CauaButton
                  variant="primary"
                  size="lg"
                  onClick={startAdoption}
                  style={{ width: '100%' }}
                >
                  Adoptar Mi Primer Árbol
                </CauaButton>
              </div>
            )}

            {/* Guardian Selector (Tinder-like Swiper) */}
            {state.phase === 'selecting-guardian' && (
              <div className="mb-12 relative" style={{ height: 600, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h2
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    fontFamily: FONTS.display,
                    color: BRAND.heirloom,
                    marginBottom: '1rem',
                  }}
                >
                  Desliza para Adoptar
                </h2>
                <p style={{ color: '#999', marginBottom: '2rem' }}>Dcha: Adoptar · Izq: Pasar</p>
                <div style={{ position: 'relative', width: '100%', maxWidth: 380, height: 520 }}>
                  {state.cardsLeft.map((idx, zIndex) => (
                    <SwipeableTreeCard
                      key={idx}
                      guardian={GUARDIANS[idx]}
                      imageIndex={idx}
                      onSwipeLeft={() => handleSwipeLeft()}
                      onSwipeRight={() => handleSwipeRight(idx)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Confirmation Phase */}
        {state.phase === 'confirming' && state.selectedGuardian !== null && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(4, 12, 6, 0.92)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 50,
              padding: '1rem',
            }}
            onClick={(e: React.MouseEvent) => {
              if (e.target === e.currentTarget) {
                setState(prev => ({ ...prev, phase: 'selecting-guardian' }))
              }
            }}
          >
            <CauaCard
              style={{ maxWidth: '500px', width: '100%' }}
            >
              <div className="p-6">
                <h2
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    fontFamily: FONTS.display,
                    color: BRAND.heirloom,
                    marginBottom: '2rem',
                  }}
                >
                  Confirma tu Adopción
                </h2>

                {/* Guardian Summary */}
                <div
                  style={{
                    background: BRAND.bgCard,
                    padding: '1.5rem',
                    borderRadius: '0.75rem',
                    marginBottom: '2rem',
                    border: `1px solid ${BRAND.amazon}44`
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: BRAND.pod, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    GUARDIÁN DEL TERRITORIO
                  </div>
                  <div
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: '900',
                      fontFamily: FONTS.display,
                      color: BRAND.heirloom,
                    }}
                  >
                    {GUARDIANS[state.selectedGuardian].name}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: `${BRAND.heirloom}88`, marginTop: '0.5rem' }}>
                    📍 {GUARDIANS[state.selectedGuardian].town}, {GUARDIANS[state.selectedGuardian].region}
                  </div>
                </div>

                {/* Genetics Auto Display */}
                <div className="mb-8" style={{ borderBottom: `1px solid ${BRAND.amazon}44`, paddingBottom: '1rem' }}>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: BRAND.mazorca,
                      marginBottom: '0.5rem',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em'
                    }}
                  >
                    Clase Genética del Árbol
                  </div>
                  <div style={{ fontFamily: FONTS.body, color: BRAND.heirloom, fontSize: '1.125rem' }}>
                    🧬 {GUARDIANS[state.selectedGuardian].varieties[0]}
                  </div>
                </div>

                {/* Confirm Button */}
                <CauaButton
                  variant="primary"
                  size="lg"
                  onClick={confirmAdoption}
                  disabled={isAdopting}
                  style={{ width: '100%', marginBottom: '0.5rem' }}
                >
                  {isAdopting ? 'Sincronizando Adopción...' : 'CONFIRMAR ADOPCIÓN'}
                </CauaButton>

                <CauaButton
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    setState(prev => ({ ...prev, phase: 'selecting-guardian' }))
                  }
                  style={{ width: '100%', marginTop: '0.5rem' }}
                >
                  Atrás
                </CauaButton>
              </div>
            </CauaCard>
          </div>
        )}

        {/* Token Reward Overlay */}
        {state.phase === 'adopted' && state.tokenReward && (
          <TokenReward
            beans={state.tokenReward.beans}
            mazorcas={state.tokenReward.mazorcas}
          />
        )}
      </div>
    </div>
  )
}
