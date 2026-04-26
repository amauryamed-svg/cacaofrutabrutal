/**
 * Colombia geo data — outline real (~42 puntos) + departamentos productores.
 *
 * ViewBox 100x130. Mapeo: x = 6 + (lon + 78) × 8 ; y = 4 + (12 − lat) × 7.625
 * Cubre lat [12.5°N, -4.5°N] y lon [-79°W, -67°W] — Colombia continental + Guajira + Amazon panhandle.
 *
 * Coordenadas derivadas de puntos clave reales:
 * Cabo Tiburón (NW), Punta Gallinas (N tip), Pto Carreño (E tip),
 * Leticia (S tip), Cabo Manglares (W tip).
 */

import { BRAND } from './constants'

export type Region = 'Huila' | 'Arauca' | 'Cundinamarca' | 'Meta' | 'Santander'
export type Biome = 'cordillera' | 'sabana' | 'paramo' | 'piedemonte' | 'montana'

/**
 * Outline de Colombia continental, 42 puntos en sentido horario desde NW (Cabo Tiburón).
 * Captura: gulf de Urabá, Cartagena/Barranquilla, Sierra Nevada indent, Guajira completa,
 * Maracaibo border, Cordillera Oriental, Llanos eastern bulge (Pto Carreño), Vichada coast,
 * Vaupés/Apaporis, Amazon panhandle a Leticia tip, Putumayo, Ecuador border, Pacific S→N.
 */
export const COLOMBIA_OUTLINE = [
  'M 9,32',          // Cabo Tiburón (NW Panama border)
  'L 11,30',         // Acandí
  'L 14,32 L 17,30', // Gulf de Urabá (curve)
  'L 19,26',         // Necoclí
  'L 22,22',         // Tolú / Coveñas
  'L 26,17',         // Cartagena
  'L 28,14',         // Bolívar coast
  'L 30,11',         // Bocas Magdalena (Barranquilla)
  'L 33,10',         // Ciénaga
  'L 35,9',          // Santa Marta foot
  'L 38,12',         // Sierra Nevada de Santa Marta indent
  'L 42,10',         // Dibulla
  'L 45,7',          // Riohacha
  'L 48,4',          // Manaure
  'L 51,1',          // Cabo de la Vela
  'L 55,0',          // Punta Gallinas (extreme N tip)
  'L 58,3',          // Bahía Honda
  'L 59,7',          // Cabo Falso (E end Guajira)
  'L 56,11',         // Castilletes (border with VE)
  'L 53,17',         // Cesar/Maracaibo border
  'L 50,24',         // Norte Santander / Cesar
  'L 48,32',         // Cúcuta / Norte Santander
  'L 51,38',         // Boyacá VE corner
  'L 60,42',         // Saravena / Arauca W
  'L 68,42',         // Arauca city
  'L 78,46',         // Vichada N (Casanare/Vichada)
  'L 90,50',         // Puerto Carreño (extreme E tip)
  'L 88,60',         // Vichada coast S
  'L 84,66',         // Inírida W
  'L 90,72',         // Inírida S/Brazil border
  'L 88,82',         // Vaupés N (Pico Cucuy area)
  'L 80,90',         // Vaupés Brazil border (Apaporis bend)
  'L 74,98',         // Apaporis river
  'L 70,106',        // Caquetá / Brazilian border
  'L 67,114',        // Putumayo / Amazon
  'L 68,123',        // Amazon to Leticia
  'L 64,126',        // Leticia (extreme S tip)
  'L 56,118',        // Putumayo S (Peru border)
  'L 44,110',        // Putumayo W (San Miguel)
  'L 32,102',        // Ecuador border (Ipiales)
  'L 22,94',         // Tumaco zone
  'L 14,86',         // Cabo Manglares (extreme W)
  'L 11,76',         // Pacific Nariño
  'L 12,66',         // Buenaventura zone
  'L 14,56',         // Bahía Solano
  'L 11,46',         // Pacific Chocó middle
  'L 9,38',          // Cabo Marzo
  'Z',
].join(' ')

/**
 * Polígonos departamentales (8-12 puntos cada uno) — formas más fieles a la realidad.
 * Cada uno se renderiza con su biome accent + terrain pattern overlay.
 */
export const DEPARTMENT_PATHS: Record<Region, string> = {
  // Huila — valle del Magdalena entre Cordilleras Central y Oriental, narrow N-S
  Huila:        'M 22,68 L 26,64 L 30,64 L 34,68 L 38,74 L 38,80 L 34,84 L 28,84 L 22,80 L 19,74 Z',
  // Arauca — llanura oriental fronteriza con Venezuela
  Arauca:       'M 50,38 L 58,36 L 70,38 L 76,42 L 74,46 L 64,46 L 56,46 L 50,44 Z',
  // Cundinamarca — central Andina, Bogotá D.C. en el centro, irregular
  Cundinamarca: 'M 28,52 L 36,48 L 44,50 L 48,54 L 48,60 L 44,64 L 38,66 L 32,64 L 28,58 Z',
  // Meta — gran llanura oriental, bordeando Cundinamarca al W
  Meta:         'M 38,58 L 50,54 L 64,54 L 72,58 L 72,68 L 66,76 L 54,80 L 44,76 L 38,68 L 36,62 Z',
  // Santander — Cordillera Oriental N, montañoso
  Santander:    'M 36,34 L 44,32 L 50,34 L 54,40 L 52,46 L 46,50 L 40,50 L 34,46 L 32,40 Z',
}

/** Coordenadas del pueblo de cada guardián (centro del marker pin). */
export const TOWN_PINS: Record<Region, { x: number; y: number; town: string }> = {
  Huila:        { x: 28, y: 76, town: 'Hobo' },
  Arauca:       { x: 56, y: 42, town: 'Saravena' },
  Cundinamarca: { x: 36, y: 60, town: 'Arbeláez' },
  Meta:         { x: 44, y: 64, town: 'Guamal' },
  Santander:    { x: 42, y: 44, town: 'Landázuri' },
}

/** Bioma + ícono representativo + paleta para overlay de terreno por finca. */
export const REGION_BIOME: Record<Region, {
  biome: Biome
  accent: string
  icon: string
  iconLabel: string
}> = {
  Huila:        { biome: 'cordillera', accent: BRAND.criollo,   icon: '🌲', iconLabel: 'Cedro Rosado · agroforestería' },
  Arauca:       { biome: 'sabana',     accent: BRAND.theobroma, icon: '🥭', iconLabel: 'Sabana inundable · Mango Tommy' },
  Cundinamarca: { biome: 'paramo',     accent: BRAND.criollo,   icon: '🌬️', iconLabel: 'Páramo Sumapaz · vientos del Magdalena' },
  Meta:         { biome: 'piedemonte', accent: BRAND.theobroma, icon: '🌴', iconLabel: 'Piedemonte llanero · Guamo' },
  Santander:    { biome: 'montana',    accent: BRAND.criollo,   icon: '⛰️', iconLabel: 'Montaña santandereana · fincas atomizadas' },
}

/** Pattern IDs por bioma — referenciados por <fill="url(#terrain-...)" />. */
export const TERRAIN_PATTERN_ID: Record<Biome, string> = {
  cordillera: 'terrain-cordillera',
  sabana:     'terrain-sabana',
  paramo:     'terrain-paramo',
  piedemonte: 'terrain-piedemonte',
  montana:    'terrain-montana',
}
