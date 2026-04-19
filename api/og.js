import { ImageResponse } from '@vercel/og'

export const config = { runtime: 'edge' }

const TIEMPOS = [
  { n: '1', label: 'Árbol al Fruto — Mazorca viva de Arauca',        color: '#5b8a3c' },
  { n: '2', label: 'Origen Regenerativo — Trazabilidad total',       color: '#F1A91E' },
  { n: '3', label: 'Mucílago Molecular — Superalimento ancestral',   color: '#8D2679' },
  { n: '4', label: 'Refinación Artesanal — Hobo, Huila · 100% Licor', color: '#A0522D' },
  { n: '5', label: 'Chocolate Ritual — Preparación ceremonial',      color: '#4a7c59' },
]

const FEATURES = [
  { icon: '⏱', text: '1 a 3 horas según experiencia elegida' },
  { icon: '👥', text: '2 a 50+ participantes · precio por escala' },
  { icon: '✦',  text: 'Upgrade Ceremonial Grade Hobo Huila disponible' },
  { icon: '📩', text: 'Cotización instantánea en tu correo' },
]

const REACT_ELEMENT = Symbol.for('react.element')

function el(type, { key, ref, ...props } = {}, ...children) {
  const ch = children.length === 0 ? undefined : children.length === 1 ? children[0] : children
  return {
    $$typeof: REACT_ELEMENT,
    type,
    key: key != null ? String(key) : null,
    ref: ref || null,
    props: ch !== undefined ? { ...props, children: ch } : props,
    _owner: null,
  }
}

export default function handler() {
  const left = el('div', {
    style: {
      width: '580px', display: 'flex', flexDirection: 'column',
      justifyContent: 'space-between', padding: '60px 56px',
      background: 'linear-gradient(160deg, #1C3B26 0%, #0A1A0C 55%, #040C06 100%)',
      borderRight: '1px solid #335533',
    },
  },
    /* top block */
    el('div', { style: { display: 'flex', flexDirection: 'column' } },
      /* brand row */
      el('div', { style: { display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '36px' } },
        el('div', { style: { width: '52px', height: '52px', background: '#F1A91E', borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px' } }, '🫘'),
        el('div', { style: { display: 'flex', flexDirection: 'column', gap: '2px' } },
          el('div', { style: { fontSize: '13px', fontWeight: 900, color: '#F7F1EE', letterSpacing: '0.18em' } }, 'CAUA COLOMBIA'),
          el('div', { style: { fontSize: '10px', color: '#91A63B', letterSpacing: '0.1em' } }, 'Biotecnología Ancestral del Cacao'),
        ),
      ),
      /* title */
      el('div', { style: { display: 'flex', flexDirection: 'column', marginBottom: '24px' } },
        el('div', { style: { fontSize: '50px', fontWeight: 900, color: '#F7F1EE', lineHeight: '1', letterSpacing: '-1px' } }, 'CATACIÓN'),
        el('div', { style: { fontSize: '50px', fontWeight: 900, color: '#F1A91E', lineHeight: '1', letterSpacing: '-1px' } }, 'CINCO TIEMPOS'),
        el('div', { style: { fontSize: '50px', fontWeight: 900, color: '#F7F1EE', lineHeight: '1', letterSpacing: '-1px' } }, 'DE CACAO'),
      ),
      el('div', { style: { fontSize: '14px', color: '#91A63B', fontStyle: 'italic', marginBottom: '30px', lineHeight: '1.5' } },
        'Experiencia Sensorial Inmersiva · Guiada por Cacaotier'),
      /* tiempos */
      el('div', { style: { display: 'flex', flexDirection: 'column', gap: '10px' } },
        ...TIEMPOS.map(t =>
          el('div', { key: t.n, style: { display: 'flex', alignItems: 'center', gap: '12px' } },
            el('div', { style: { width: '22px', height: '22px', borderRadius: '50%', background: t.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '10px', fontWeight: 900, color: '#040C06', flexShrink: 0 } }, t.n),
            el('div', { style: { fontSize: '12px', color: '#F7F1EEcc' } }, t.label),
          )
        )
      ),
    ),
    /* footer */
    el('div', { style: { fontSize: '10px', color: '#91A63B', opacity: '0.6' } },
      'NIT 901213846-7 · amaury@cauaculture.co · +57 310 222 7848'),
  )

  const right = el('div', {
    style: {
      flex: 1, display: 'flex', flexDirection: 'column',
      justifyContent: 'center', padding: '52px', gap: '20px',
      background: '#0A1A0C',
    },
  },
    /* badge */
    el('div', { style: { display: 'flex', width: 'fit-content',
      background: 'rgba(241,169,30,0.12)', border: '1px solid rgba(241,169,30,0.35)',
      borderRadius: '4px', padding: '5px 14px',
      fontSize: '10px', fontWeight: 700, color: '#F1A91E', letterSpacing: '0.16em' } },
      'COTIZACIÓN PERSONALIZADA'),
    /* price */
    el('div', { style: { display: 'flex', flexDirection: 'column', gap: '4px' } },
      el('div', { style: { fontSize: '11px', color: '#91A63B', letterSpacing: '0.12em' } }, 'DESDE'),
      el('div', { style: { fontSize: '58px', fontWeight: 900, color: '#F1A91E', lineHeight: '1' } }, '$65.000'),
      el('div', { style: { fontSize: '13px', color: '#F7F1EEaa' } }, 'por persona · ajustable por grupo'),
    ),
    /* divider */
    el('div', { style: { height: '1px', background: '#1C3B26' } }),
    /* features */
    el('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px' } },
      ...FEATURES.map(f =>
        el('div', { key: f.text, style: { display: 'flex', alignItems: 'center', gap: '12px' } },
          el('div', { style: { fontSize: '18px', width: '26px', textAlign: 'center' } }, f.icon),
          el('div', { style: { fontSize: '13px', color: '#F7F1EEcc' } }, f.text),
        )
      )
    ),
    /* CTA */
    el('div', { style: { background: '#F1A91E', borderRadius: '8px', padding: '15px 24px',
      textAlign: 'center', fontSize: '13px', fontWeight: 800, color: '#040C06',
      letterSpacing: '0.05em', marginTop: '4px' } },
      'Configura tu experiencia — Recibe Tu Coti'),
    /* url */
    el('div', { style: { fontSize: '11px', color: '#91A63Baa', textAlign: 'center' } },
      'cacaofrutabrutal.com/caua-coti'),
  )

  return new ImageResponse(
    el('div', {
      style: { width: '1200px', height: '630px', display: 'flex',
        fontFamily: 'sans-serif', background: '#040C06' },
    }, left, right),
    { width: 1200, height: 630 },
  )
}
