import { BRAND } from '../../utils/constants'
import type { CSSProperties, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'accent' | 'ghost'
type Size    = 'sm' | 'md' | 'lg'

const VARIANTS: Record<Variant, CSSProperties> = {
  primary:   { background: `linear-gradient(135deg, ${BRAND.pod}, ${BRAND.amazon})`, color: BRAND.heirloom, border: 'none' },
  secondary: { background: 'transparent', color: BRAND.mazorca, border: `1px solid ${BRAND.mazorca}66` },
  accent:    { background: BRAND.mazorca, color: BRAND.bgDeep, border: 'none' },
  ghost:     { background: 'transparent', color: `${BRAND.heirloom}88`, border: `1px solid ${BRAND.amazon}66` },
}

const SIZES: Record<Size, CSSProperties> = {
  sm: { padding: '6px 14px',  fontSize: 11 },
  md: { padding: '10px 20px', fontSize: 12 },
  lg: { padding: '14px 32px', fontSize: 14 },
}

interface Props {
  children: ReactNode
  variant?: Variant
  size?: Size
  onClick?: () => void
  style?: CSSProperties
  disabled?: boolean
  type?: 'button' | 'submit'
}

export default function CauaButton({
  children, variant = 'primary', size = 'md',
  onClick, style, disabled, type = 'button',
}: Props) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...VARIANTS[variant],
        ...SIZES[size],
        borderRadius: 999, cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
        letterSpacing: '0.12em', transition: 'all 0.3s',
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  )
}
