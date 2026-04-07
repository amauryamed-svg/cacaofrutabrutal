/**
 * Luxury Botanical Brutalism tarot card illustrations.
 * Each element has its own botanical motif rendered in SVG.
 * Buyer persona derived from first-party behavioral data — no demographic assumptions.
 */

import type { ReactElement } from 'react'
import type { TarotCard } from '../../types'
import { ELEMENT_COLORS } from '../../utils/constants'

const ROMAN = ['0','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX','XXI']

// Element botanical motifs as SVG paths
function TierraMotif({ color }: { color: string }): ReactElement {
  return (
    <g>
      {/* Cacao pod with roots */}
      <ellipse cx="80" cy="72" rx="28" ry="40" fill="none" stroke={color} strokeWidth="0.8" opacity="0.5"/>
      <ellipse cx="80" cy="72" rx="20" ry="30" fill={color} opacity="0.07"/>
      {/* Pod ribs */}
      {[-12,-6,0,6,12].map((x,i) => (
        <ellipse key={i} cx={80+x} cy="72" rx="4" ry="30" fill="none" stroke={color} strokeWidth="0.4" opacity="0.3"/>
      ))}
      {/* Roots */}
      <path d="M 68 112 Q 55 128 50 145" stroke={color} strokeWidth="0.8" fill="none" opacity="0.4"/>
      <path d="M 80 112 Q 80 130 80 148" stroke={color} strokeWidth="0.8" fill="none" opacity="0.4"/>
      <path d="M 92 112 Q 105 128 110 145" stroke={color} strokeWidth="0.8" fill="none" opacity="0.4"/>
      {/* Cacao seeds */}
      {[[70,65],[80,58],[90,65],[74,78],[86,78]].map(([x,y],i) => (
        <ellipse key={i} cx={x} cy={y} rx="4" ry="5.5" fill={color} opacity="0.35"/>
      ))}
      {/* Leaf */}
      <path d="M 80 32 C 68 42 62 56 80 62 C 98 56 92 42 80 32 Z" fill="#1C3B26" stroke={color} strokeWidth="0.7" opacity="0.8"/>
      <line x1="80" y1="32" x2="80" y2="62" stroke={color} strokeWidth="0.5" opacity="0.5"/>
    </g>
  )
}

function FuegoMotif({ color }: { color: string }): ReactElement {
  return (
    <g>
      {/* Cacao flower */}
      {[0,1,2,3,4].map(i => {
        const angle = (i/5)*Math.PI*2 - Math.PI/2
        const px = 80 + Math.cos(angle)*30
        const py = 80 + Math.sin(angle)*30
        return (
          <ellipse key={i} cx={(80+px)/2} cy={(80+py)/2} rx="8" ry="18"
            transform={`rotate(${(angle*180/Math.PI)+90} ${(80+px)/2} ${(80+py)/2})`}
            fill={color} opacity="0.18" stroke={color} strokeWidth="0.6"/>
        )
      })}
      {/* Inner stamens */}
      {[...Array(8)].map((_,i) => {
        const angle = (i/8)*Math.PI*2
        return (
          <line key={i} x1="80" y1="80"
            x2={80+Math.cos(angle)*16} y2={80+Math.sin(angle)*16}
            stroke={color} strokeWidth="0.7" opacity="0.6"/>
        )
      })}
      <circle cx="80" cy="80" r="7" fill={color} opacity="0.4"/>
      <circle cx="80" cy="80" r="3" fill={color} opacity="0.8"/>
      {/* Flame tips */}
      {[0,1,2,3,4].map(i => {
        const angle = (i/5)*Math.PI*2 - Math.PI/2
        const px = 80 + Math.cos(angle)*48
        const py = 80 + Math.sin(angle)*48
        return <circle key={i} cx={px} cy={py} r="2" fill={color} opacity="0.5"/>
      })}
    </g>
  )
}

function AguaMotif({ color }: { color: string }): ReactElement {
  return (
    <g>
      {/* Fermentation ripples */}
      {[20,32,44,56,68].map((r,i) => (
        <ellipse key={i} cx="80" cy="85" rx={r} ry={r*0.55}
          fill="none" stroke={color} strokeWidth="0.6" opacity={0.7-i*0.12}/>
      ))}
      {/* Cacao beans floating */}
      {[[60,70],[80,60],[100,68],[68,92],[92,88]].map(([cx,cy],i) => (
        <g key={i}>
          <ellipse cx={cx} cy={cy} rx="5" ry="7"
            transform={`rotate(${i*20} ${cx} ${cy})`}
            fill={color} opacity="0.25" stroke={color} strokeWidth="0.6"/>
        </g>
      ))}
      {/* Bubble trails */}
      {[[65,108],[80,115],[95,105]].map(([x,y],i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="3" fill="none" stroke={color} strokeWidth="0.5" opacity="0.5"/>
          <circle cx={x} cy={y-12} r="2" fill="none" stroke={color} strokeWidth="0.4" opacity="0.4"/>
          <circle cx={x+2} cy={y-22} r="1.2" fill="none" stroke={color} strokeWidth="0.3" opacity="0.3"/>
        </g>
      ))}
      {/* Moon */}
      <path d="M 80 32 A 18 18 0 1 1 80 68 A 10 10 0 1 0 80 32 Z" fill={color} opacity="0.3"/>
    </g>
  )
}

function AireMotif({ color }: { color: string }): ReactElement {
  return (
    <g>
      {/* Pollen / spore particles */}
      {[[45,45],[90,38],[115,65],[50,90],[100,85],[70,115],[95,118],[55,118]].map(([cx,cy],i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r={2+i%3} fill={color} opacity="0.3"/>
          {[0,1,2,3].map(j => {
            const a = (j/4)*Math.PI*2
            return <line key={j} x1={cx} y1={cy}
              x2={cx+Math.cos(a)*(4+i%3)} y2={cy+Math.sin(a)*(4+i%3)}
              stroke={color} strokeWidth="0.4" opacity="0.4"/>
          })}
        </g>
      ))}
      {/* Connecting wind curves */}
      <path d="M 40 60 Q 80 45 120 65 Q 80 85 40 70" fill="none" stroke={color} strokeWidth="0.7" strokeOpacity="0.3"/>
      <path d="M 45 90 Q 80 75 115 95 Q 80 110 45 100" fill="none" stroke={color} strokeWidth="0.7" strokeOpacity="0.2"/>
      {/* Central cacao leaf with veins */}
      <path d="M 80 55 C 60 70 58 95 80 105 C 102 95 100 70 80 55 Z" fill={color} opacity="0.12" stroke={color} strokeWidth="0.7"/>
      <line x1="80" y1="55" x2="80" y2="105" stroke={color} strokeWidth="0.5" opacity="0.4"/>
      {[0,1,2].map(i => (
        <g key={i}>
          <line x1="80" y1={65+i*12} x2={70-i*2} y2={60+i*12} stroke={color} strokeWidth="0.3" opacity="0.35"/>
          <line x1="80" y1={65+i*12} x2={90+i*2} y2={60+i*12} stroke={color} strokeWidth="0.3" opacity="0.35"/>
        </g>
      ))}
    </g>
  )
}

const MOTIFS: Record<string, (props: { color: string }) => ReactElement> = {
  Tierra: TierraMotif,
  Fuego:  FuegoMotif,
  Agua:   AguaMotif,
  Aire:   AireMotif,
}

interface Props { card: TarotCard; revealed?: boolean }

export default function TarotCardArt({ card, revealed = true }: Props) {
  const color      = ELEMENT_COLORS[card.element]
  const Motif      = MOTIFS[card.element]
  const roman      = ROMAN[card.id] || String(card.id)

  if (!revealed) {
    return (
      <svg viewBox="0 0 160 240" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
        <rect width="160" height="240" rx="12" fill="#0A1A10"/>
        <rect x="6" y="6" width="148" height="228" rx="10" fill="none" stroke="#91A63B" strokeWidth="0.6" strokeOpacity="0.4"/>
        {/* Back pattern — botanical grid */}
        {[...Array(6)].map((_,r) =>
          [...Array(4)].map((_,c) => (
            <ellipse key={`${r}-${c}`} cx={22+c*40} cy={22+r*40} rx="8" ry="12"
              fill="none" stroke="#1C3B26" strokeWidth="0.5" opacity="0.8"/>
          ))
        )}
        <rect x="50" y="95" width="60" height="50" rx="4" fill="#091508" stroke="#91A63B" strokeWidth="0.5" strokeOpacity="0.3"/>
        <text x="80" y="117" textAnchor="middle" fontFamily="'Barlow Condensed',sans-serif"
          fontWeight="900" fontSize="14" fill="#91A63B" letterSpacing="3" opacity="0.5">CAUA</text>
        <text x="80" y="134" textAnchor="middle" fontFamily="'Playfair Display',serif"
          fontSize="7" fill="#F1A91E" fontStyle="italic" opacity="0.4">Ritual del Cacao</text>
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 160 240" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <defs>
        <radialGradient id={`bg-${card.id}`} cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor={color} stopOpacity="0.2"/>
          <stop offset="100%" stopColor="#040C06" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id={`glow-${card.id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.12"/>
          <stop offset="100%" stopColor="#040C06" stopOpacity="0"/>
        </radialGradient>
      </defs>

      {/* Card background */}
      <rect width="160" height="240" rx="12" fill="#0D1A10"/>
      <rect width="160" height="240" rx="12" fill={`url(#bg-${card.id})`}/>

      {/* Outer ornate border */}
      <rect x="5" y="5" width="150" height="230" rx="10" fill="none"
        stroke={color} strokeWidth="0.8" strokeOpacity="0.6"/>
      <rect x="9" y="9" width="142" height="222" rx="8" fill="none"
        stroke={color} strokeWidth="0.3" strokeOpacity="0.3"/>

      {/* Corner ornaments */}
      {[[14,14],[146,14],[14,226],[146,226]].map(([x,y],i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="3" fill={color} opacity="0.4"/>
          <circle cx={x} cy={y} r="5" fill="none" stroke={color} strokeWidth="0.5" opacity="0.3"/>
        </g>
      ))}

      {/* Top — arcana number + element */}
      <text x="80" y="24" textAnchor="middle" fontFamily="'Barlow Condensed',sans-serif"
        fontWeight="700" fontSize="8" fill={color} letterSpacing="3" opacity="0.7">
        {card.element.toUpperCase()} · {roman}
      </text>

      {/* Illustration area */}
      <g transform="translate(16, 30) scale(0.9)">
        <Motif color={color} />
      </g>

      {/* Divider line */}
      <line x1="18" y1="162" x2="142" y2="162" stroke={color} strokeWidth="0.5" strokeOpacity="0.4"/>

      {/* Card name */}
      <text x="80" y="176" textAnchor="middle" fontFamily="'Barlow Condensed',sans-serif"
        fontWeight="900" fontSize="12" fill="#F7F1EE" letterSpacing="1.5"
        style={{ textTransform: 'uppercase' }}>
        {card.name.length > 14 ? card.name.split(' ').slice(0,2).join(' ') : card.name}
      </text>
      {card.name.split(' ').length > 2 && (
        <text x="80" y="188" textAnchor="middle" fontFamily="'Barlow Condensed',sans-serif"
          fontWeight="900" fontSize="12" fill="#F7F1EE" letterSpacing="1.5">
          {card.name.split(' ').slice(2).join(' ')}
        </text>
      )}

      {/* Element glyph */}
      <text x="80" y="218" textAnchor="middle" fontFamily="'Playfair Display',serif"
        fontSize="7" fontStyle="italic" fill={color} opacity="0.7" letterSpacing="1">
        {card.element === 'Tierra' ? '◈ Tierra' : card.element === 'Fuego' ? '◆ Fuego' : card.element === 'Agua' ? '◉ Agua' : '◇ Aire'}
      </text>

      {/* Bottom CAUA mark */}
      <text x="80" y="230" textAnchor="middle" fontFamily="'Barlow Condensed',sans-serif"
        fontWeight="700" fontSize="6" fill="#F7F1EE" letterSpacing="3" opacity="0.25">CAUA</text>
    </svg>
  )
}
