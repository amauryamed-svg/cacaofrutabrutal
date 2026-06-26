/**
 * Botanical luxury SVG illustrations for each CAUA product.
 * Swap `imageSrc` prop for real product photos when available.
 * Maintains brand aesthetic when no photo is provided.
 */

import type { ReactElement } from 'react'
import { BRAND } from '../../utils/constants'

interface Props {
  productId: number
  imageSrc?: string   // real photo URL — swap when available
  height?: number
}

const ILLUSTRATIONS: Record<number, () => ReactElement> = {

  // SUNRISE SHOT — mucílago droplets + cacao pod cross-section
  1: () => (
    <svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <defs>
        <radialGradient id="sun1" cx="50%" cy="60%" r="60%">
          <stop offset="0%" stopColor="#F1A91E" stopOpacity="0.25"/>
          <stop offset="100%" stopColor="#040C06" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="drop1" cx="40%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#91A63B" stopOpacity="0.9"/>
          <stop offset="100%" stopColor="#1C3B26" stopOpacity="0.6"/>
        </radialGradient>
      </defs>
      <rect width="320" height="200" fill="#0F2218"/>
      <ellipse cx="160" cy="200" rx="120" ry="60" fill="url(#sun1)"/>
      {/* Cacao pod outline */}
      <ellipse cx="160" cy="95" rx="48" ry="68" fill="none" stroke="#91A63B" strokeWidth="0.8" strokeOpacity="0.4"/>
      <ellipse cx="160" cy="95" rx="36" ry="54" fill="none" stroke="#91A63B" strokeWidth="0.5" strokeOpacity="0.25"/>
      {/* Pod ribs */}
      {[-20,-10,0,10,20].map((x,i) => (
        <ellipse key={i} cx={160+x} cy="95" rx="6" ry="54" fill="none" stroke="#F1A91E" strokeWidth="0.4" strokeOpacity="0.2"/>
      ))}
      {/* Mucílago droplets */}
      {[[145,55],[168,42],[155,72],[178,62],[138,78]].map(([cx,cy],i) => (
        <g key={i}>
          <ellipse cx={cx} cy={cy} rx="4.5" ry="6.5" fill="url(#drop1)" opacity="0.85"/>
          <ellipse cx={cx-1.5} cy={cy-2} rx="1.2" ry="1.8" fill="#F7F1EE" opacity="0.4"/>
        </g>
      ))}
      {/* Sunrise rays */}
      {[...Array(8)].map((_,i) => (
        <line key={i} x1="160" y1="200"
          x2={160 + Math.cos((i/8)*Math.PI)*150}
          y2={200 - Math.sin((i/8)*Math.PI)*80}
          stroke="#F1A91E" strokeWidth="0.4" strokeOpacity="0.12"/>
      ))}
      <text x="160" y="185" textAnchor="middle" fontFamily="'Barlow Condensed',sans-serif"
        fontWeight="700" fontSize="9" fill="#91A63B" letterSpacing="3" opacity="0.7">MUCÍLAGO · 20%</text>
    </svg>
  ),

  // SUNSET SHOT — doble concentración, tonos profundos
  2: () => (
    <svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <defs>
        <radialGradient id="sun2" cx="50%" cy="70%" r="70%">
          <stop offset="0%" stopColor="#DB5527" stopOpacity="0.3"/>
          <stop offset="60%" stopColor="#8D2679" stopOpacity="0.1"/>
          <stop offset="100%" stopColor="#040C06" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="core2" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#DB5527" stopOpacity="0.8"/>
          <stop offset="100%" stopColor="#583915" stopOpacity="0.4"/>
        </radialGradient>
      </defs>
      <rect width="320" height="200" fill="#0A1A10"/>
      <ellipse cx="160" cy="200" rx="140" ry="70" fill="url(#sun2)"/>
      {/* Double helix / DNA structure — biotech */}
      {[...Array(12)].map((_,i) => {
        const t = i/11; const y = 30 + t*140
        const x1 = 140 + Math.sin(t*Math.PI*3)*30
        const x2 = 180 - Math.sin(t*Math.PI*3)*30
        return <g key={i}>
          <circle cx={x1} cy={y} r="3.5" fill="#DB5527" opacity={0.5+t*0.4}/>
          <circle cx={x2} cy={y} r="3.5" fill="#8D2679" opacity={0.5+t*0.4}/>
          {i<11 && <line x1={x1} y1={y} x2={x2} y2={y} stroke="#F1A91E" strokeWidth="0.6" strokeOpacity="0.3"/>}
        </g>
      })}
      {/* Vertical spines */}
      <path d={`M${140} 30 Q${140-30} 95 ${140} 170 Q${140+30} 95 ${140} 30`} fill="none" stroke="#DB5527" strokeWidth="0.8" strokeOpacity="0.25"/>
      <path d={`M${180} 30 Q${180+30} 95 ${180} 170 Q${180-30} 95 ${180} 30`} fill="none" stroke="#8D2679" strokeWidth="0.8" strokeOpacity="0.25"/>
      <text x="160" y="190" textAnchor="middle" fontFamily="'Barlow Condensed',sans-serif"
        fontWeight="700" fontSize="9" fill="#DB5527" letterSpacing="3" opacity="0.7">CONCENTRACIÓN · 2X</text>
    </svg>
  ),

  // CACAO CEREMONIAL — bloque ceremonial, criollo, huila
  3: () => (
    <svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <defs>
        <radialGradient id="glow3" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F1A91E" stopOpacity="0.2"/>
          <stop offset="100%" stopColor="#040C06" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id="block3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#583915"/>
          <stop offset="50%" stopColor="#7A4E1F"/>
          <stop offset="100%" stopColor="#3D2510"/>
        </linearGradient>
      </defs>
      <rect width="320" height="200" fill="#0D1A0F"/>
      <ellipse cx="160" cy="100" rx="100" ry="80" fill="url(#glow3)"/>
      {/* Ceremonial cacao block */}
      <rect x="105" y="68" width="110" height="72" rx="4" fill="url(#block3)"/>
      <rect x="105" y="68" width="110" height="72" rx="4" fill="none" stroke="#F1A91E" strokeWidth="0.8" strokeOpacity="0.5"/>
      {/* Score lines */}
      {[1,2,3].map(i => (
        <line key={i} x1={105+i*27.5} y1="68" x2={105+i*27.5} y2="140" stroke="#F1A91E" strokeWidth="0.5" strokeOpacity="0.3"/>
      ))}
      {[1].map(i => (
        <line key={i} x1="105" y1={68+i*36} x2="215" y2={68+i*36} stroke="#F1A91E" strokeWidth="0.5" strokeOpacity="0.3"/>
      ))}
      {/* Botanical leaf accent */}
      <path d="M 160 40 C 148 50 140 62 160 68 C 180 62 172 50 160 40 Z" fill="#1C3B26" stroke="#91A63B" strokeWidth="0.8" opacity="0.8"/>
      <line x1="160" y1="40" x2="160" y2="68" stroke="#91A63B" strokeWidth="0.5" strokeOpacity="0.6"/>
      {/* Embossed CAUA text */}
      <text x="160" y="109" textAnchor="middle" fontFamily="'Barlow Condensed',sans-serif"
        fontWeight="900" fontSize="16" fill="#F1A91E" letterSpacing="4" opacity="0.6">CAUA</text>
      <text x="160" y="125" textAnchor="middle" fontFamily="'Barlow Condensed',sans-serif"
        fontWeight="400" fontSize="7" fill="#F7F1EE" letterSpacing="2" opacity="0.4">CRIOLLO · HUILA · 250g</text>
      <text x="160" y="185" textAnchor="middle" fontFamily="'Barlow Condensed',sans-serif"
        fontWeight="700" fontSize="9" fill="#F1A91E" letterSpacing="3" opacity="0.6">FINE FLAVOR · CEREMONIAL</text>
    </svg>
  ),

  // EDICIÓN GUARDIÁN — 5 orígenes, colección limitada
  4: () => (
    <svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <defs>
        <radialGradient id="glow4" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#8D2679" stopOpacity="0.25"/>
          <stop offset="100%" stopColor="#040C06" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <rect width="320" height="200" fill="#0A0E12"/>
      <ellipse cx="160" cy="100" rx="110" ry="90" fill="url(#glow4)"/>
      {/* 5 vials arranged in pentagon */}
      {[0,1,2,3,4].map(i => {
        const angle = (i/5)*Math.PI*2 - Math.PI/2
        const cx = 160 + Math.cos(angle)*52
        const cy = 100 + Math.sin(angle)*42
        const colors = ['#91A63B','#F1A91E','#DB5527','#00A3CD','#8D2679']
        return <g key={i}>
          <rect x={cx-7} y={cy-22} width="14" height="38" rx="7" fill={colors[i]} opacity="0.15"/>
          <rect x={cx-7} y={cy-22} width="14" height="38" rx="7" fill="none" stroke={colors[i]} strokeWidth="1.2" opacity="0.8"/>
          <rect x={cx-4} y={cy-18} width="8" height="20" rx="4" fill={colors[i]} opacity="0.4"/>
          <rect x={cx-7} y={cy-26} width="14" height="6" rx="3" fill={colors[i]} opacity="0.6"/>
          <circle cx={cx} cy={cy-29} r="2" fill={colors[i]} opacity="0.5"/>
        </g>
      })}
      {/* Pentagon connector lines */}
      {[0,1,2,3,4].map(i => {
        const a1 = (i/5)*Math.PI*2 - Math.PI/2
        const a2 = ((i+1)/5)*Math.PI*2 - Math.PI/2
        return <line key={i}
          x1={160+Math.cos(a1)*52} y1={100+Math.sin(a1)*42}
          x2={160+Math.cos(a2)*52} y2={100+Math.sin(a2)*42}
          stroke="#F7F1EE" strokeWidth="0.4" strokeOpacity="0.15"/>
      })}
      <text x="160" y="104" textAnchor="middle" fontFamily="'Barlow Condensed',sans-serif"
        fontWeight="900" fontSize="11" fill="#F7F1EE" letterSpacing="2" opacity="0.5">5 ORÍGENES</text>
      <text x="160" y="186" textAnchor="middle" fontFamily="'Barlow Condensed',sans-serif"
        fontWeight="700" fontSize="9" fill="#8D2679" letterSpacing="3" opacity="0.8">EDICIÓN NUMERADA · LIMITADA</text>
    </svg>
  ),

  // CÍRCULO SUMAPAZ — suscripción, comunidad, wreath botánico
  5: () => (
    <svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <defs>
        <radialGradient id="glow5" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="#91A63B" stopOpacity="0.2"/>
          <stop offset="100%" stopColor="#040C06" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <rect width="320" height="200" fill="#0D1A0F"/>
      <ellipse cx="160" cy="100" rx="100" ry="80" fill="url(#glow5)"/>
      {/* Botanical wreath */}
      {[...Array(16)].map((_,i) => {
        const angle = (i/16)*Math.PI*2
        const r = 62, cx = 160+Math.cos(angle)*r, cy = 100+Math.sin(angle)*r
        const lx = cx + Math.cos(angle)*12, ly = cy + Math.sin(angle)*12
        const isLeaf = i%2===0
        return <g key={i}>
          {isLeaf
            ? <ellipse cx={(cx+lx)/2} cy={(cy+ly)/2}
                rx="8" ry="4"
                transform={`rotate(${(angle*180/Math.PI)+90} ${(cx+lx)/2} ${(cy+ly)/2})`}
                fill="#1C3B26" stroke="#91A63B" strokeWidth="0.8" opacity="0.9"/>
            : <circle cx={cx} cy={cy} r="3" fill="#F1A91E" opacity="0.5"/>
          }
        </g>
      })}
      {/* Center circle */}
      <circle cx="160" cy="100" r="32" fill="#132B1C" stroke="#91A63B" strokeWidth="1" strokeOpacity="0.5"/>
      <text x="160" y="96" textAnchor="middle" fontFamily="'Barlow Condensed',sans-serif"
        fontWeight="900" fontSize="11" fill="#91A63B" letterSpacing="1">CÍRCULO</text>
      <text x="160" y="110" textAnchor="middle" fontFamily="'Playfair Display',serif"
        fontSize="8" fill="#F1A91E" fontStyle="italic" opacity="0.8">SUMAPAZ</text>
      <text x="160" y="185" textAnchor="middle" fontFamily="'Barlow Condensed',sans-serif"
        fontWeight="700" fontSize="9" fill="#91A63B" letterSpacing="3" opacity="0.7">COMUNIDAD · MENSUAL</text>
    </svg>
  ),

  // COLD BREW CACAO — fermentado en frío, probióticos
  6: () => (
    <svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <defs>
        <linearGradient id="glass6" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#004E64" stopOpacity="0.6"/>
          <stop offset="100%" stopColor="#1C3B26" stopOpacity="0.9"/>
        </linearGradient>
        <radialGradient id="glow6" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#00A3CD" stopOpacity="0.2"/>
          <stop offset="100%" stopColor="#040C06" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <rect width="320" height="200" fill="#050F14"/>
      <ellipse cx="160" cy="80" rx="90" ry="70" fill="url(#glow6)"/>
      {/* Glass vessel */}
      <path d="M 138 38 L 130 155 Q 130 162 160 162 Q 190 162 190 155 L 182 38 Z"
        fill="url(#glass6)" stroke="#00A3CD" strokeWidth="0.8" strokeOpacity="0.5"/>
      {/* Ice crystals */}
      {[[148,58],[170,52],[160,75],[152,90]].map(([x,y],i) => (
        <g key={i} opacity="0.5">
          <line x1={x} y1={y-6} x2={x} y2={y+6} stroke="#F7F1EE" strokeWidth="0.8"/>
          <line x1={x-5} y1={y-3} x2={x+5} y2={y+3} stroke="#F7F1EE" strokeWidth="0.8"/>
          <line x1={x-5} y1={y+3} x2={x+5} y2={y-3} stroke="#F7F1EE" strokeWidth="0.8"/>
        </g>
      ))}
      {/* Cacao beans sinking */}
      {[[155,108],[165,120],[148,132],[172,138]].map(([cx,cy],i) => (
        <ellipse key={i} cx={cx} cy={cy} rx="6" ry="4"
          transform={`rotate(${i*25} ${cx} ${cy})`}
          fill="#583915" stroke="#7A4E1F" strokeWidth="0.5" opacity="0.7"/>
      ))}
      {/* Bubbles */}
      {[[145,88],[160,72],[172,95],[153,115]].map(([cx,cy],i) => (
        <circle key={i} cx={cx} cy={cy} r={1.5+i*0.5} fill="none" stroke="#00A3CD" strokeWidth="0.5" opacity="0.4"/>
      ))}
      {/* Glass shine */}
      <path d="M 140 50 Q 138 90 140 130" stroke="#F7F1EE" strokeWidth="1.5" fill="none" opacity="0.1"/>
      <text x="160" y="185" textAnchor="middle" fontFamily="'Barlow Condensed',sans-serif"
        fontWeight="700" fontSize="9" fill="#00A3CD" letterSpacing="3" opacity="0.7">FERMENTADO EN FRÍO</text>
    </svg>
  ),

  // HIDROSOL™ — spray botánico, cosmético + alimentario
  7: () => (
    <svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <defs>
        <linearGradient id="bottle7" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#91A63B" stopOpacity="0.8"/>
          <stop offset="100%" stopColor="#1C3B26" stopOpacity="0.6"/>
        </linearGradient>
        <radialGradient id="glow7" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#91A63B" stopOpacity="0.15"/>
          <stop offset="100%" stopColor="#040C06" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <rect width="320" height="200" fill="#0D1A0F"/>
      <ellipse cx="160" cy="100" rx="110" ry="80" fill="url(#glow7)"/>
      {/* Spray bottle — main vessel */}
      <path d="M 135 55 L 130 165 Q 130 172 160 172 Q 190 172 190 165 L 185 55 Z"
        fill="url(#bottle7)" stroke="#91A63B" strokeWidth="0.8" strokeOpacity="0.6"/>
      {/* Pump cap */}
      <rect x="150" y="35" width="20" height="20" rx="3" fill="#1C3B26" stroke="#91A63B" strokeWidth="1" opacity="0.9"/>
      <rect x="152" y="33" width="16" height="4" rx="2" fill="#91A63B" opacity="0.7"/>
      {/* Mist spray — animated particles */}
      {[[180,42],[195,52],[210,55],[185,30],[202,40],[175,48]].map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r={1.5-i*0.2} fill="#91A63B" opacity={0.6-i*0.08}/>
      ))}
      {/* Botanical leaves inside bottle */}
      {[0,1,2].map(i => {
        const y = 80 + i*25
        return <g key={i}>
          <ellipse cx={145-i*3} cy={y} rx="6" ry="10"
            transform={`rotate(${20+i*15} ${145-i*3} ${y})`}
            fill="#91A63B" opacity={0.3-i*0.05}/>
          <line x1={145-i*3} y1={y-10} x2={145-i*3} y2={y+10}
            stroke="#91A63B" strokeWidth="0.4" opacity="0.4"/>
        </g>
      })}
      {/* Liquid level indicator */}
      <path d="M 132 130 Q 160 128 188 130" fill="none" stroke="#91A63B" strokeWidth="0.8" opacity="0.4"/>
      <text x="160" y="185" textAnchor="middle" fontFamily="'Barlow Condensed',sans-serif"
        fontWeight="700" fontSize="9" fill="#91A63B" letterSpacing="3" opacity="0.7">HIDROSOL™ · SPRAY</text>
    </svg>
  ),

  // ACEITE ESENCIAL — aromaterapia, 5mL concentrado
  8: () => (
    <svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <defs>
        <linearGradient id="oil8" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F1A91E" stopOpacity="0.9"/>
          <stop offset="100%" stopColor="#DB5527" stopOpacity="0.7"/>
        </linearGradient>
        <radialGradient id="glow8" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="#F1A91E" stopOpacity="0.12"/>
          <stop offset="100%" stopColor="#040C06" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <rect width="320" height="200" fill="#0A0E12"/>
      <ellipse cx="160" cy="100" rx="100" ry="80" fill="url(#glow8)"/>
      {/* Bottle — small amber vial */}
      <path d="M 150 48 L 145 168 Q 145 175 160 175 Q 175 175 175 168 L 170 48 Z"
        fill="url(#oil8)" stroke="#F1A91E" strokeWidth="0.8" strokeOpacity="0.8"/>
      {/* Cork/Cap */}
      <ellipse cx="160" cy="46" rx="11" ry="4" fill="#7A4E1F" stroke="#F1A91E" strokeWidth="0.8" opacity="0.9"/>
      <rect x="156" y="42" width="8" height="4" rx="1" fill="#583915" opacity="0.8"/>
      {/* Oil shine inside bottle */}
      <path d="M 148 60 Q 148 120 150 165" fill="none" stroke="#F7F1EE" strokeWidth="1" opacity="0.15"/>
      {/* Aromatherapy wisps — rising essential oil vapors */}
      {[0,1,2,3].map(i => (
        <path key={i}
          d={`M ${160 + i*8} ${40} Q ${160 + i*15} ${20} ${160 + i*20} ${0}`}
          fill="none" stroke="#F1A91E" strokeWidth="0.6" opacity={0.5 - i*0.1}
          strokeLinecap="round"/>
      ))}
      {/* Botanical droplets floating */}
      {[[140,110],[180,95],[145,135],[175,125]].map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r="1.5" fill="#F1A91E" opacity={0.4-i*0.08}/>
      ))}
      {/* Refinement line */}
      <path d="M 147 145 Q 160 143 173 145" fill="none" stroke="#F1A91E" strokeWidth="0.6" opacity="0.3"/>
      <text x="160" y="185" textAnchor="middle" fontFamily="'Barlow Condensed',sans-serif"
        fontWeight="700" fontSize="9" fill="#F1A91E" letterSpacing="3" opacity="0.7">ESENCIAL · CONCENTRADO</text>
    </svg>
  ),

  // NIBS CAÚA × ZURYCH — white-coated nibs scattered, co-brand badge
  9: () => (
    <svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <defs>
        <radialGradient id="nibglow" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="#F7F1EE" stopOpacity="0.12"/>
          <stop offset="100%" stopColor="#040C06" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="nibwhite" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95"/>
          <stop offset="100%" stopColor="#C8C0BC" stopOpacity="0.85"/>
        </radialGradient>
        <radialGradient id="nibdark" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#3A2218"/>
          <stop offset="100%" stopColor="#1A0E0A"/>
        </radialGradient>
      </defs>
      <rect width="320" height="200" fill="#0A1A0E"/>
      {/* Background glow */}
      <ellipse cx="160" cy="100" rx="130" ry="80" fill="url(#nibglow)"/>
      {/* Scattered white-coated nibs — various angles */}
      {[
        [72,  60,  22, 8, 32],
        [128, 45,  18, 7, -15],
        [190, 55,  20, 8, 45],
        [248, 70,  22, 8, -30],
        [55,  115, 20, 7, 20],
        [110, 130, 24, 9, -45],
        [168, 110, 22, 8, 60],
        [228, 125, 20, 7, -20],
        [92,  160, 18, 7, 35],
        [152, 165, 22, 8, -10],
        [210, 158, 20, 7, 50],
        [275, 110, 18, 7, -40],
      ].map(([cx, cy, rx, ry, deg], i) => (
        <g key={i} transform={`rotate(${deg} ${cx} ${cy})`}>
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="url(#nibwhite)" opacity="0.92"/>
          <ellipse cx={cx} cy={cy} rx={rx * 0.55} ry={ry * 0.55} fill="url(#nibdark)" opacity="0.45"/>
          <ellipse cx={cx - rx * 0.3} cy={cy - ry * 0.3} rx={rx * 0.18} ry={ry * 0.22} fill="white" opacity="0.5"/>
        </g>
      ))}
      {/* Co-brand strip */}
      <rect x="0" y="170" width="320" height="30" fill="#040C0699"/>
      <text x="160" y="188" textAnchor="middle" fontFamily="'Barlow Condensed',sans-serif"
        fontWeight="900" fontSize="10" fill="#F7F1EE" letterSpacing="4" opacity="0.85">
        CAÚA & CO · LOTE 200 KG · ALIMENTEC 2026
      </text>
      {/* 200 KG badge */}
      <rect x="228" y="10" width="80" height="30" rx="2" fill="#87AA2722" stroke="#87AA2766" strokeWidth="1"/>
      <text x="268" y="28" textAnchor="middle" fontFamily="'Barlow Condensed',sans-serif"
        fontWeight="900" fontSize="11" fill="#87AA27" letterSpacing="2">200 KG</text>
      {/* SUBASTA badge */}
      <rect x="10" y="10" width="72" height="22" rx="2" fill="#F1A91E22" stroke="#F1A91E66" strokeWidth="1"/>
      <text x="46" y="24" textAnchor="middle" fontFamily="'Barlow Condensed',sans-serif"
        fontWeight="700" fontSize="9" fill="#F1A91E" letterSpacing="2">SUBASTA</text>
    </svg>
  ),

  // NIBS CAÚA × ZURYCH OSCURO — dark 72% cacao-coated nibs, criollo glow
  10: () => (
    <svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <defs>
        <radialGradient id="darkglow" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="#881C79" stopOpacity="0.18"/>
          <stop offset="100%" stopColor="#040C06" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="nibdarkcoat" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#3D1F10"/>
          <stop offset="100%" stopColor="#1A0C05"/>
        </radialGradient>
        <radialGradient id="nibdarkshine" cx="25%" cy="25%" r="60%">
          <stop offset="0%" stopColor="#6B3320" stopOpacity="0.9"/>
          <stop offset="100%" stopColor="#2A1008" stopOpacity="0.7"/>
        </radialGradient>
      </defs>
      <rect width="320" height="200" fill="#080A06"/>
      <ellipse cx="160" cy="100" rx="140" ry="85" fill="url(#darkglow)"/>
      {[
        [68,  58,  22, 8, 28],
        [124, 42,  18, 7, -18],
        [185, 52,  21, 8, 42],
        [245, 68,  22, 8, -28],
        [52,  118, 20, 7, 22],
        [108, 132, 24, 9, -42],
        [165, 108, 22, 8, 58],
        [225, 122, 20, 7, -18],
        [90,  162, 18, 7, 32],
        [150, 168, 22, 8, -12],
        [208, 155, 20, 7, 48],
        [272, 108, 19, 7, -38],
      ].map(([cx, cy, rx, ry, deg], i) => (
        <g key={i} transform={`rotate(${deg} ${cx} ${cy})`}>
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="url(#nibdarkcoat)" opacity="0.95"/>
          <ellipse cx={cx} cy={cy} rx={rx * 0.6} ry={ry * 0.6} fill="url(#nibdarkshine)" opacity="0.5"/>
          <ellipse cx={cx - rx * 0.28} cy={cy - ry * 0.28} rx={rx * 0.16} ry={ry * 0.2} fill="#8B5030" opacity="0.35"/>
        </g>
      ))}
      {[[80,80],[150,65],[220,88],[95,145],[175,148],[255,130]].map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r="1.8" fill="#881C79" opacity={0.35 - i * 0.04}/>
      ))}
      <rect x="0" y="170" width="320" height="30" fill="#04060499"/>
      <text x="160" y="188" textAnchor="middle" fontFamily="'Barlow Condensed',sans-serif"
        fontWeight="900" fontSize="10" fill="#F7F1EE" letterSpacing="4" opacity="0.85">
        CAÚA & CO · LOTE 200 KG · ALIMENTEC 2026
      </text>
      <rect x="228" y="10" width="80" height="30" rx="2" fill="#881C7922" stroke="#881C7966" strokeWidth="1"/>
      <text x="268" y="28" textAnchor="middle" fontFamily="'Barlow Condensed',sans-serif"
        fontWeight="900" fontSize="11" fill="#881C79" letterSpacing="2">200 KG</text>
      <rect x="10" y="10" width="72" height="22" rx="2" fill="#F1A91E22" stroke="#F1A91E66" strokeWidth="1"/>
      <text x="46" y="24" textAnchor="middle" fontFamily="'Barlow Condensed',sans-serif"
        fontWeight="700" fontSize="9" fill="#F1A91E" letterSpacing="2">72% CACAO</text>
    </svg>
  ),
}

export default function ProductIllustration({ productId, imageSrc, height = 160 }: Props) {
  if (imageSrc) {
    return (
      <div style={{ height, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src={imageSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    )
  }
  const Illustration = ILLUSTRATIONS[productId]
  return (
    <div style={{ height, overflow: 'hidden', borderBottom: `1px solid ${BRAND.amazon}33` }}>
      {Illustration ? <Illustration /> : <div style={{ height, background: '#0F2218' }} />}
    </div>
  )
}
