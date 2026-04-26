import { BRAND } from '../../utils/constants'
import {
  COLOMBIA_OUTLINE,
  DEPARTMENT_PATHS,
  TOWN_PINS,
  REGION_BIOME,
  TERRAIN_PATTERN_ID,
  type Region,
} from '../../utils/colombiaGeo'

interface Props {
  region?:        string
  size?:          number
  outlineColor?:  string
  fillColor?:     string
  /** Renderiza los 5 departamentos productores (modo CauaBonga world). */
  showAllDepts?:  boolean
  /** Overlay de patrón terreno (cordillera/sabana/paramo/piedemonte/montana) sobre el activo. */
  showTerrain?:   boolean
  /** Muestra el nombre del pueblo + ícono de bioma junto al pin. */
  showLabels?:    boolean
  /** Click en un departamento dispara este callback (CauaBonga world). */
  onRegionClick?: (region: Region) => void
  ariaLabel?:     string
}

const REGIONS: Region[] = ['Huila', 'Arauca', 'Cundinamarca', 'Meta', 'Santander']

/**
 * Mapa de Colombia con outline real (~42 puntos) y 5 departamentos productores.
 *
 * Performance: animaciones implementadas como CSS keyframes sobre `transform: scale()`
 * y `opacity` (compositor-only, no reflow). Sin SVG `filter` (feGaussianBlur causa repaint
 * en transformaciones del padre — bug reportado en cards swipeables).
 */
export default function ColombiaMap({
  region,
  size = 96,
  outlineColor = BRAND.pod,
  fillColor,
  showAllDepts = false,
  showTerrain  = false,
  showLabels   = false,
  onRegionClick,
  ariaLabel,
}: Props) {
  const activeRegion = REGIONS.includes(region as Region) ? (region as Region) : undefined
  const accent = fillColor ?? (activeRegion ? REGION_BIOME[activeRegion].accent : BRAND.criollo)

  return (
    <svg
      width={size}
      height={size * 1.3}
      viewBox="0 0 100 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={ariaLabel ?? `Mapa Colombia${activeRegion ? ` — ${activeRegion}` : ''}`}
      role="img"
      style={{ display: 'block' }}
    >
      <defs>
        {/* Cordillera — líneas onduladas (Huila) */}
        <pattern id={TERRAIN_PATTERN_ID.cordillera} x="0" y="0" width="6" height="8" patternUnits="userSpaceOnUse">
          <path d="M 0,4 Q 1.5,1 3,4 T 6,4" stroke={BRAND.heirloom} strokeWidth="0.4" fill="none" opacity="0.55" />
        </pattern>
        {/* Sabana — punteado (Arauca) */}
        <pattern id={TERRAIN_PATTERN_ID.sabana} x="0" y="0" width="5" height="5" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.55" fill={BRAND.heirloom} opacity="0.55" />
          <circle cx="3.5" cy="3.5" r="0.45" fill={BRAND.heirloom} opacity="0.4" />
        </pattern>
        {/* Páramo — triángulos = picos (Cundinamarca) */}
        <pattern id={TERRAIN_PATTERN_ID.paramo} x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
          <path d="M 1,5 L 3,1.5 L 5,5 Z" fill={BRAND.heirloom} opacity="0.5" />
        </pattern>
        {/* Piedemonte — diagonales (Meta) */}
        <pattern id={TERRAIN_PATTERN_ID.piedemonte} x="0" y="0" width="5" height="5" patternUnits="userSpaceOnUse">
          <path d="M 0,5 L 5,0" stroke={BRAND.heirloom} strokeWidth="0.4" opacity="0.5" />
        </pattern>
        {/* Montaña — cuadrícula = fincas atomizadas (Santander) */}
        <pattern id={TERRAIN_PATTERN_ID.montana} x="0" y="0" width="5" height="5" patternUnits="userSpaceOnUse">
          <path d="M 0,2.5 L 5,2.5 M 2.5,0 L 2.5,5" stroke={BRAND.heirloom} strokeWidth="0.3" opacity="0.45" />
        </pattern>

        <style>{`
          @keyframes cfb-map-pulse  { 0%,100% { opacity: 0.78 } 50% { opacity: 1 } }
          @keyframes cfb-pin-pulse  { 0%,100% { transform: scale(1);   opacity: 0.45 }
                                      50%     { transform: scale(1.6); opacity: 0.05 } }
          .cfb-map-active { animation: cfb-map-pulse 2.4s ease-in-out infinite; }
          .cfb-pin-halo   { animation: cfb-pin-pulse 1.6s ease-out      infinite;
                            transform-origin: center; transform-box: fill-box; }
        `}</style>
      </defs>

      {/* Outline de Colombia */}
      <path
        d={COLOMBIA_OUTLINE}
        fill={`${outlineColor}10`}
        stroke={outlineColor}
        strokeWidth="1.4"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Río Magdalena estilizado — corre N-S por el valle interandino */}
      <path
        d="M 35,16 Q 33,30 32,46 Q 30,62 30,76 Q 32,90 38,108"
        stroke={`${BRAND.muisca}88`}
        strokeWidth="0.7"
        strokeDasharray="2,2"
        fill="none"
        opacity="0.55"
      />

      {/* Departamentos en sordina (solo modo world) */}
      {showAllDepts && REGIONS.filter(r => r !== activeRegion).map(r => (
        <path
          key={r}
          d={DEPARTMENT_PATHS[r]}
          fill={`${REGION_BIOME[r].accent}55`}
          stroke={`${REGION_BIOME[r].accent}aa`}
          strokeWidth="0.8"
          strokeLinejoin="round"
          style={{ cursor: onRegionClick ? 'pointer' : 'default' }}
          onClick={onRegionClick ? () => onRegionClick(r) : undefined}
        />
      ))}

      {/* Departamento activo — fill sólido + soft outer halo + terrain pattern overlay */}
      {activeRegion && (
        <g style={{ cursor: onRegionClick ? 'pointer' : 'default' }}
           onClick={onRegionClick ? () => onRegionClick(activeRegion) : undefined}>
          {/* Soft outer halo (replaces feGaussianBlur — same look, zero repaint cost) */}
          <path
            d={DEPARTMENT_PATHS[activeRegion]}
            fill="none"
            stroke={accent}
            strokeWidth="3"
            strokeOpacity="0.25"
            strokeLinejoin="round"
          />
          {/* Solid fill with CSS opacity pulse */}
          <path
            className="cfb-map-active"
            d={DEPARTMENT_PATHS[activeRegion]}
            fill={accent}
            stroke={accent}
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          {showTerrain && (
            <path
              d={DEPARTMENT_PATHS[activeRegion]}
              fill={`url(#${TERRAIN_PATTERN_ID[REGION_BIOME[activeRegion].biome]})`}
              stroke="none"
            />
          )}
        </g>
      )}

      {/* Town pins */}
      {(showAllDepts ? REGIONS : (activeRegion ? [activeRegion] : [])).map(r => {
        const pin = TOWN_PINS[r]
        const isActive = r === activeRegion
        return (
          <g key={`pin-${r}`}>
            {isActive && (
              <circle
                className="cfb-pin-halo"
                cx={pin.x} cy={pin.y} r={3}
                fill={REGION_BIOME[r].accent}
              />
            )}
            <circle cx={pin.x} cy={pin.y} r={1.6} fill={BRAND.heirloom} stroke={BRAND.bgDeep} strokeWidth="0.4" />
            {showLabels && (
              <text
                x={pin.x + 3}
                y={pin.y + 1.2}
                fontSize="3.2"
                fontFamily="'Barlow Condensed', Impact, sans-serif"
                fontWeight="700"
                fill={isActive ? BRAND.heirloom : `${BRAND.heirloom}88`}
                style={{ letterSpacing: '0.05em' }}
              >
                {pin.town.toUpperCase()}
              </text>
            )}
          </g>
        )
      })}

      {/* Bioma badge del activo, esquina inferior derecha */}
      {activeRegion && showTerrain && (
        <g transform="translate(70, 116)">
          <rect x="0" y="0" width="28" height="10" rx="2"
            fill={`${BRAND.bgDeep}cc`} stroke={`${REGION_BIOME[activeRegion].accent}88`} strokeWidth="0.4" />
          <text x="2.5" y="6.8" fontSize="3.2" fontFamily="'Barlow Condensed', Impact, sans-serif"
            fontWeight="700" fill={BRAND.heirloom} style={{ letterSpacing: '0.08em' }}>
            {REGION_BIOME[activeRegion].icon} {REGION_BIOME[activeRegion].biome.toUpperCase()}
          </text>
        </g>
      )}
    </svg>
  )
}
