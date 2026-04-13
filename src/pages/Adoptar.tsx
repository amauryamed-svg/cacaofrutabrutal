import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useCocoaTrees } from '../hooks/useCocoaTrees'
import { CacaoTreeCard } from '../components/dashboard/CacaoTreeCard'
import TokenReward from '../components/ritual/TokenReward'
import CauaButton from '../components/ui/CauaButton'
import CauaCard from '../components/ui/CauaCard'
import { BRAND, FONTS, GUARDIANS, TOKEN_RATES } from '../utils/constants'

type AdoptarPhase = 'browse' | 'selecting-guardian' | 'confirming' | 'adopted'

interface AdoptarState {
  phase: AdoptarPhase
  selectedGuardian: number | null
  selectedVariety: string | null
  tokenReward: { beans: number; mazorcas: number } | null
}

export default function Adoptar() {
  const { user } = useAuth()
  const { trees, loading: treesLoading, adoptTree } = useCocoaTrees()
  const [state, setState] = useState<AdoptarState>({
    phase: 'browse',
    selectedGuardian: null,
    selectedVariety: null,
    tokenReward: null,
  })
  const [isAdopting, setIsAdopting] = useState(false)


  const startAdoption = () => {
    setState(prev => ({ ...prev, phase: 'selecting-guardian' }))
  }

  const selectGuardian = (guardianId: number) => {
    setState(prev => ({
      ...prev,
      selectedGuardian: guardianId,
      phase: 'confirming',
    }))
  }

  const selectVariety = (variety: string) => {
    setState(prev => ({
      ...prev,
      selectedVariety: variety,
    }))
  }

  const confirmAdoption = async () => {
    if (state.selectedGuardian === null || !state.selectedVariety) return

    setIsAdopting(true)
    try {
      const guardian = GUARDIANS[state.selectedGuardian]
      await adoptTree(state.selectedGuardian, state.selectedVariety, guardian.region)

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
        })
      }, 3000)
    } catch (err) {
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
              fontSize: 'clamp(2rem, 8vw, 4rem)',
              fontWeight: '900',
              fontFamily: FONTS.display,
              color: BRAND.heirloom,
              lineHeight: '1.1',
              marginBottom: '1rem',
            }}
          >
            Apadrina un{' '}
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

            {/* Guardian Selector */}
            {state.phase === 'selecting-guardian' && (
              <div className="mb-12">
                <h2
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    fontFamily: FONTS.display,
                    color: BRAND.heirloom,
                    marginBottom: '2rem',
                  }}
                >
                  Elige tu Guardián
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                  {GUARDIANS.map((guardian, idx) => (
                    <button
                      key={idx}
                      onClick={() => selectGuardian(idx)}
                      style={{
                        background: BRAND.bgCard,
                        border: `2px solid ${
                          state.selectedGuardian === idx ? BRAND.pod : 'transparent'
                        }`,
                        borderRadius: '0.75rem',
                        padding: '1rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => {
                        if (state.selectedGuardian !== idx) {
                          (e.currentTarget as HTMLElement).style.borderColor =
                            BRAND.pod
                        }
                        ;(e.currentTarget as HTMLElement).style.background = '#1A3520'
                      }}
                      onMouseLeave={e => {
                        if (state.selectedGuardian !== idx) {
                          (e.currentTarget as HTMLElement).style.borderColor = 'transparent'
                        }
                        ;(e.currentTarget as HTMLElement).style.background = BRAND.bgCard
                      }}
                    >
                      <div
                        style={{
                          fontSize: '1.25rem',
                          fontWeight: '700',
                          fontFamily: FONTS.display,
                          color: BRAND.heirloom,
                          marginBottom: '0.5rem',
                        }}
                      >
                        {guardian.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#999', marginBottom: '0.5rem' }}>
                        {guardian.region}
                      </div>
                      <div
                        style={{
                          fontSize: '0.675rem',
                          color: BRAND.pod,
                          fontWeight: '600',
                        }}
                      >
                        {guardian.power}
                      </div>
                    </button>
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
              onClick={e => e.stopPropagation()}
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
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    marginBottom: '2rem',
                  }}
                >
                  <div style={{ fontSize: '0.875rem', color: '#999', marginBottom: '0.5rem' }}>
                    Guardián
                  </div>
                  <div
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: '700',
                      fontFamily: FONTS.display,
                      color: BRAND.heirloom,
                    }}
                  >
                    {GUARDIANS[state.selectedGuardian].name}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#bbb', marginTop: '0.5rem' }}>
                    {GUARDIANS[state.selectedGuardian].region}
                  </div>
                </div>

                {/* Variety Selector */}
                <div className="mb-6">
                  <div
                    style={{
                      fontSize: '0.875rem',
                      color: '#999',
                      marginBottom: '1rem',
                      fontWeight: '600',
                    }}
                  >
                    Elige la Variedad
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {['Criollo', 'Trinitario', 'Forastero', 'Nacional'].map(variety => (
                      <CauaButton
                        key={variety}
                        variant={state.selectedVariety === variety ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={() => selectVariety(variety)}
                        style={{ width: '100%' }}
                      >
                        {variety}
                      </CauaButton>
                    ))}
                  </div>
                </div>

                {/* Confirm Button */}
                <CauaButton
                  variant="primary"
                  size="lg"
                  onClick={confirmAdoption}
                  disabled={!state.selectedVariety || isAdopting}
                  style={{ width: '100%' }}
                >
                  {isAdopting ? 'Adoptando...' : 'Confirmar Adopción'}
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
