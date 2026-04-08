import { BRAND, FONTS } from '../../utils/constants'
import RoleSelector from './RoleSelector'
import type { CauaRole } from '../../types/fund.types'

interface Props {
  totalRaisedCents: number
  totalGoalCents: number
  selectedRole: CauaRole
  onRoleChange: (r: CauaRole) => void
  lang: 'es' | 'en'
}

export default function FundHero({ totalRaisedCents, totalGoalCents, selectedRole, onRoleChange, lang }: Props) {
  const pct      = Math.min(100, totalGoalCents > 0 ? Math.round((totalRaisedCents / totalGoalCents) * 100) : 0)
  const fmtK     = (c: number) => '$' + Math.round(c / 100 / 1000) + 'K'

  return (
    <div style={{ padding: 'clamp(80px,12vw,100px) var(--space-page) clamp(48px,8vw,60px)', position: 'relative', overflow: 'hidden' }}>
      {/* Radial glow */}
      <div style={{
        position: 'absolute', top: '40%', left: '50%',
        transform: 'translate(-50%,-50%)',
        width: 700, height: 500,
        background: `radial-gradient(ellipse, ${BRAND.pod}0a 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 2, maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }}>
        {/* Eyebrow */}
        <p style={{ fontFamily: FONTS.serif, fontStyle: 'italic', color: BRAND.mazorca, fontSize: 13, letterSpacing: '0.25em', margin: 0 }}>
          {lang === 'es' ? 'Crowdfunding · Biotecnología · Lotes' : 'Crowdfunding · Biotechnology · Lots'}
        </p>

        {/* Title + desc */}
        <div>
          <h1 style={{
            fontFamily: FONTS.display, fontWeight: 900,
            fontSize: 'clamp(40px,10vw,100px)', lineHeight: 0.88,
            letterSpacing: '-0.01em', color: BRAND.heirloom,
            textTransform: 'uppercase', margin: '0 0 16px',
          }}>
            {lang === 'es' ? 'FINANCIA' : 'FUND'}<br />
            <span style={{ color: BRAND.pod }}>{lang === 'es' ? 'LA CIENCIA' : 'THE SCIENCE'}</span>
          </h1>
          <p style={{ fontFamily: FONTS.body, color: `${BRAND.heirloom}70`, fontSize: 14, maxWidth: 520, lineHeight: 1.75, margin: 0 }}>
            {lang === 'es'
              ? '$250K para la aprobación Novel Food EU del mucílago de cacao criollo colombiano. Ingrediente como Servicio para la industria de bebidas funcionales.'
              : '$250K for EU Novel Food approval of Colombian criollo cacao mucilage. Ingredient as a Service for the functional beverage industry.'}
          </p>
        </div>

        {/* Global campaign progress */}
        <div style={{
          background: BRAND.bgCard,
          border: `1px solid ${BRAND.amazon}55`,
          borderRadius: 16, padding: '20px 24px',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(140px,45%),1fr))', gap: 16,
        }}>
          <StatBox label={lang === 'es' ? 'RECAUDADO' : 'RAISED'} value={fmtK(totalRaisedCents)} color={BRAND.pod} />
          <StatBox label={lang === 'es' ? 'META' : 'GOAL'} value={fmtK(totalGoalCents)} color={`${BRAND.heirloom}55`} />
          <StatBox label={lang === 'es' ? 'FINANCIADO' : 'FUNDED'} value={`${pct}%`} color={BRAND.mazorca} />
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6 }}>
            <div style={{ height: 8, background: `${BRAND.amazon}44`, borderRadius: 999, overflow: 'hidden' }}>
              <div style={{
                width: `${pct}%`, height: '100%', borderRadius: 999,
                background: `linear-gradient(90deg, ${BRAND.pod}, ${BRAND.mazorca})`,
              }} />
            </div>
            <div style={{ fontFamily: FONTS.body, fontSize: 9, color: `${BRAND.heirloom}33`, letterSpacing: '0.1em' }}>
              {lang === 'es' ? 'CAMPAÑA TOTAL' : 'TOTAL CAMPAIGN'}
            </div>
          </div>
        </div>

        {/* Role selector */}
        <RoleSelector selected={selectedRole} onSelect={onRoleChange} lang={lang} />
      </div>
    </div>
  )
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 28, color }}>{value}</div>
      <div style={{ fontFamily: FONTS.body, fontSize: 9, color: `${BRAND.heirloom}44`, letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 2 }}>{label}</div>
    </div>
  )
}
