/**
 * BrandIcon — typed <img> wrapper for static brand SVG assets in /public/brand/icons/.
 *
 * For icons that need dynamic color, use CauaIcons instead:
 *   - IconJaguarPod  (variety marks — takes podColor prop)
 *   - IconJaguar, IconCacaoTree, IconSocial, IconCacaoPod, IconFeather,
 *     IconCacaoCommerce, IconNewsletter, IconEconomiaCircular
 *
 * Duplicates note:
 *   'regenerative'         ≈ IconCacaoTree
 *   'eje-corazon'          ≈ IconCacaoPod
 *   'bioeconomy'           ≈ IconCacaoCommerce
 *   'economia-circular'    ≈ IconEconomiaCircular
 *   variedad-* icons       → use IconJaguarPod with VARIETY_COLORS[key] instead
 */

export type BrandIconName =
  | 'agroforestery'
  | 'balance'
  | 'bio-ai'
  | 'bioactive'
  | 'bioeconomy'
  | 'cacaocultor'
  | 'eje-cerebro'
  | 'eje-corazon'
  | 'embriogenesis'
  | 'enlightment'
  | 'good-habits'
  | 'inteligencia-cardiaca'
  | 'la-solucion'
  | 'nodo-austin'
  | 'nodo-bogota'
  | 'nodo-galicia'
  | 'pentamera-flor'
  | 'redefine-retail'
  | 'regenerative'
  | 'sistemico'
  | 'soberania-individual'
  | 'the-brutal-bean'
  | 'worldwide'
  | 'economia-circular'
  | 'variedad-trinitario'
  | 'variedad-criollo-san-vicente'
  | 'variedad-criollo-saravena'
  | 'variedad-criollo-arauquita'
  | 'variedad-hibrido-amelonado'

interface Props {
  name:       BrandIconName
  size?:      number
  alt?:       string
  style?:     React.CSSProperties
  className?: string
}

export default function BrandIcon({ name, size = 32, alt = '', style, className }: Props) {
  return (
    <img
      src={`/brand/icons/${name}.svg`}
      width={size}
      height={size}
      alt={alt}
      style={{ display: 'inline-block', ...style }}
      className={className}
      draggable={false}
    />
  )
}
