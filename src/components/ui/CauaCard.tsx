import { BRAND } from '../../utils/constants'
import type { CSSProperties, ReactNode } from 'react'

type Glow = 'green' | 'gold' | 'purple' | 'none'

const GLOWS: Record<Glow, string> = {
  green:  `0 0 40px rgba(145,166,59,0.15)`,
  gold:   `0 0 40px rgba(241,169,30,0.15)`,
  purple: `0 0 40px rgba(141,38,121,0.2)`,
  none:   'none',
}

interface Props {
  children: ReactNode
  glow?: Glow
  style?: CSSProperties
  onClick?: () => void
}

export default function CauaCard({ children, glow = 'none', style, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      style={{
        background: '#132B1C',
        border: `1px solid ${BRAND.amazon}66`,
        borderRadius: 12,
        boxShadow: GLOWS[glow],
        overflow: 'hidden',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
