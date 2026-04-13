import { useState } from 'react'
import CauaCard from '../ui/CauaCard'
import CauaButton from '../ui/CauaButton'
import { BRAND, FONTS, GUARDIANS } from '../../utils/constants'
import type { CacaoTree } from '../../lib/database.types'

const STAGE_EMOJI: Record<string, string> = {
  Semilla: '🌱',
  Plántula: '🌿',
  'Árbol Joven': '🌳',
  'Árbol Adulto': '🌲',
  Cosecha: '🫘',
}

export interface CacaoTreeCardProps {
  tree: CacaoTree
  onViewUpdate?: (treeId: string) => void
  isLoading?: boolean
}

export function CacaoTreeCard({
  tree,
  onViewUpdate,
  isLoading = false,
}: CacaoTreeCardProps) {
  const [showUpdates, setShowUpdates] = useState(false)
  const guardian = GUARDIANS[tree.guardian_id]
  const emoji = STAGE_EMOJI[tree.stage] || '🌱'
  const harvestDate = tree.predicted_harvest_at
    ? new Date(tree.predicted_harvest_at).toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'Calculando...'

  const adoptedDate = new Date(tree.adopted_at).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  return (
    <CauaCard
      glow="green"
      style={{
        background: '#132B1C',
        cursor: 'pointer',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      {/* Stage Visual */}
      <div className="flex items-center justify-between">
        <div
          style={{
            fontSize: '3rem',
            lineHeight: '1',
            animation: 'pulse 3s ease-in-out infinite',
          }}
        >
          {emoji}
        </div>
        <div
          style={{
            background: BRAND.pod,
            color: '#040C06',
            padding: '0.5rem 0.75rem',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '600',
            fontFamily: FONTS.display,
          }}
        >
          {tree.stage}
        </div>
      </div>

      {/* Guardian & Region */}
      <div className="border-t border-[#2D5016] pt-4">
        <div style={{ fontSize: '0.875rem', color: '#999', marginBottom: '0.25rem' }}>
          Guardián
        </div>
        <div
          style={{
            fontSize: '1rem',
            fontWeight: '700',
            fontFamily: FONTS.display,
            color: BRAND.heirloom,
            marginBottom: '0.5rem',
          }}
        >
          {guardian.name}
        </div>
        <div style={{ fontSize: '0.875rem', color: '#bbb' }}>
          {guardian.region}
        </div>
      </div>

      {/* CO2 Absorbed */}
      <div className="mt-4 flex items-baseline gap-2">
        <div
          style={{
            fontSize: '1.5rem',
            fontWeight: '900',
            color: BRAND.mazorca,
            fontFamily: FONTS.display,
          }}
        >
          {tree.co2_kg}
        </div>
        <div style={{ fontSize: '0.75rem', color: '#888' }}>kg CO₂ absorbido</div>
      </div>

      {/* Predicted Harvest */}
      <div className="mt-2">
        <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.25rem' }}>
          Cosecha predicha
        </div>
        <div style={{ fontSize: '0.875rem', color: '#ddd' }}>{harvestDate}</div>
      </div>

      {/* Adopted Date */}
      <div className="mt-2">
        <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.25rem' }}>
          Adoptado
        </div>
        <div style={{ fontSize: '0.75rem', color: '#aaa' }}>{adoptedDate}</div>
      </div>

      {/* Action Button */}
      <div className="mt-6 pt-4 border-t border-[#2D5016]">
        <CauaButton
          variant="secondary"
          size="sm"
          onClick={() => {
            setShowUpdates(!showUpdates)
            if (!showUpdates && onViewUpdate) {
              onViewUpdate(tree.id)
            }
          }}
          disabled={isLoading}
          style={{ width: '100%' }}
        >
          {showUpdates ? 'Cerrar' : 'Ver actualización'}
        </CauaButton>
      </div>

      {/* Updates Placeholder */}
      {showUpdates && (
        <div
          style={{
            background: '#0a1d13',
            padding: '1rem',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            color: '#bbb',
            marginTop: '1rem',
          }}
        >
          <div style={{ color: BRAND.pod, fontWeight: '600', marginBottom: '0.5rem' }}>
            Últimas actualizaciones
          </div>
          <div style={{ color: '#888', fontSize: '0.75rem' }}>
            Cargando... (integrado en la página principal)
          </div>
        </div>
      )}
    </CauaCard>
  )
}
