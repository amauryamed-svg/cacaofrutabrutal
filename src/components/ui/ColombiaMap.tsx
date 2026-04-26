import { BRAND } from '../../utils/constants'

type Region = 'Huila' | 'Arauca' | 'Cundinamarca' | 'Meta' | 'Santander'

interface Props {
  region:      string
  size?:       number
  outlineColor?: string
  fillColor?:  string
}

const COLOMBIA_OUTLINE =
  'M 28,16 L 44,10 L 60,8 L 76,10 L 86,14 L 94,6 L 96,18 L 86,22 L 90,30 L 96,36 L 88,44 L 94,50 L 92,60 L 98,70 L 94,82 L 88,94 L 84,110 L 72,124 L 60,122 L 46,116 L 34,108 L 26,96 L 18,86 L 10,74 L 6,60 L 10,48 L 14,36 L 16,26 L 22,20 Z'

const DEPARTMENTS: Record<Region, { path: string; defaultColor: string }> = {
  Huila: {
    path: 'M 38,76 L 50,72 L 56,82 L 54,94 L 44,96 L 36,88 Z',
    defaultColor: '#8D2679',
  },
  Arauca: {
    path: 'M 70,32 L 88,28 L 92,36 L 86,42 L 72,40 Z',
    defaultColor: '#E8742C',
  },
  Cundinamarca: {
    path: 'M 44,54 L 56,50 L 62,60 L 58,68 L 48,68 L 42,62 Z',
    defaultColor: '#8D2679',
  },
  Meta: {
    path: 'M 58,58 L 82,54 L 90,66 L 86,80 L 68,80 L 60,70 Z',
    defaultColor: '#E8742C',
  },
  Santander: {
    path: 'M 42,28 L 58,26 L 62,38 L 52,44 L 42,40 Z',
    defaultColor: '#8D2679',
  },
}

export default function ColombiaMap({
  region,
  size = 96,
  outlineColor = BRAND.pod,
  fillColor,
}: Props) {
  const dept = DEPARTMENTS[region as Region]
  const accent = fillColor ?? dept?.defaultColor ?? BRAND.criollo

  return (
    <svg
      width={size}
      height={size * 1.3}
      viewBox="0 0 100 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={`Mapa Colombia — ${region}`}
      role="img"
      style={{ display: 'block' }}
    >
      {/* Colombia outline — green brutalist sketch */}
      <path
        d={COLOMBIA_OUTLINE}
        fill={`${outlineColor}14`}
        stroke={outlineColor}
        strokeWidth="1.8"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Department fill — purple or orange */}
      {dept && (
        <>
          <path
            d={dept.path}
            fill={accent}
            opacity="0.92"
            stroke={accent}
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          {/* Glow halo */}
          <path
            d={dept.path}
            fill="none"
            stroke={accent}
            strokeWidth="4"
            strokeLinejoin="round"
            opacity="0.25"
          />
        </>
      )}
    </svg>
  )
}
