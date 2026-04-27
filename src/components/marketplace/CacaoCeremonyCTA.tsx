import { Link } from 'react-router-dom'
import { BRAND, FONTS } from '../../utils/constants'

export type CacaoCeremonyCTAVariant = 'ritual' | 'impacto' | 'fondo' | 'adopta'

const COPY: Record<CacaoCeremonyCTAVariant, { eyebrow: string; pitch: string; cta: string }> = {
  ritual: {
    eyebrow: 'CIERRE DEL RITUAL',
    pitch:   'Tu wallet on-tree → tu Cacao Ceremony 250g de Cauaculture.co. Claim con descuento según árboles adoptados.',
    cta:     'Claim mi Cacao Ceremony →',
  },
  impacto: {
    eyebrow: 'IMPACTO ON-CHAIN OFF-CHAIN',
    pitch:   'Convierte tus mazorcas + árboles del wallet en Cacao Ceremony — tu inversión, en producto real, vía Cauaculture.co.',
    cta:     'Claim impacto → cacao real →',
  },
  fondo: {
    eyebrow: 'PERK INVERSIONISTA',
    pitch:   'Acceso anticipado al drop de Cacao Ceremony con descuento cruzado por wallet. Tu fondo, tu cacao.',
    cta:     'Claim Cacao Ceremony →',
  },
  adopta: {
    eyebrow: 'YIELD INMEDIATO',
    pitch:   'Cada árbol que adoptas mintea descuento cruzado en tu Cacao Ceremony en Cauaculture.co — 5/10/15/20%.',
    cta:     'Ver mi yield →',
  },
}

export default function CacaoCeremonyCTA({ variant }: { variant: CacaoCeremonyCTAVariant }) {
  const { eyebrow, pitch, cta } = COPY[variant]

  return (
    <Link
      to="/marketplace#cacao-ceremony"
      style={{
        display: 'block',
        textDecoration: 'none',
        background: 'linear-gradient(135deg, #132B1C 0%, #0A1810 100%)',
        border: `1px solid ${BRAND.mazorca}55`,
        borderRadius: 12,
        padding: 20,
        marginTop: 24,
        transition: 'border-color 160ms ease, transform 160ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = BRAND.mazorca
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = `${BRAND.mazorca}55`
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      <p style={{
        fontFamily: FONTS.serif, fontStyle: 'italic',
        color: BRAND.mazorca, fontSize: 11, letterSpacing: '0.25em',
        margin: 0,
      }}>
        {eyebrow}
      </p>
      <h3 style={{
        fontFamily: FONTS.display, fontWeight: 900,
        fontSize: 'clamp(20px, 3vw, 26px)', color: BRAND.heirloom,
        textTransform: 'uppercase', margin: '6px 0 10px', lineHeight: 1.05,
      }}>
        Cacao Ceremony · Cauaculture
      </h3>
      <p style={{
        fontFamily: FONTS.body, color: `${BRAND.heirloom}99`,
        fontSize: 13, lineHeight: 1.55, margin: '0 0 14px', maxWidth: 520,
      }}>
        {pitch}
      </p>
      <span style={{
        display: 'inline-block', padding: '10px 16px',
        background: BRAND.mazorca, color: BRAND.bgDeep,
        borderRadius: 6,
        fontFamily: FONTS.display, fontWeight: 800, fontSize: 12,
        letterSpacing: '0.12em', textTransform: 'uppercase',
      }}>
        {cta}
      </span>
    </Link>
  )
}
