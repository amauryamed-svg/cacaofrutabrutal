import { BRAND, FONTS } from '../../utils/constants'

interface Props {
  lotsFunded: number
  lotsTotal: number
  raisedUsdCents: number
  goalUsdCents: number
  euTarget: string | null
  lang: 'es' | 'en'
}

function fmtUsd(cents: number): string {
  return '$' + (cents / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })
}

export default function FundingProgress({ lotsFunded, lotsTotal, raisedUsdCents, goalUsdCents, euTarget, lang }: Props) {
  const pct = Math.min(100, goalUsdCents > 0 ? Math.round((raisedUsdCents / goalUsdCents) * 100) : 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Progress bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 28, color: BRAND.pod }}>{pct}%</span>
            <span style={{ fontFamily: FONTS.body, fontSize: 11, color: `${BRAND.heirloom}55` }}>
              {lang === 'es' ? 'financiado' : 'funded'}
            </span>
          </div>
          <span style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 11, color: `${BRAND.heirloom}66` }}>
            {fmtUsd(raisedUsdCents)} / {fmtUsd(goalUsdCents)}
          </span>
        </div>

        <div style={{ height: 6, background: `${BRAND.amazon}44`, borderRadius: 999, overflow: 'hidden' }}>
          <div style={{
            width: `${pct}%`, height: '100%', borderRadius: 999,
            background: `linear-gradient(90deg, ${BRAND.pod}, ${BRAND.mazorca})`,
            transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)',
          }} />
        </div>
      </div>

      {/* Lots + EU badge row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 20, color: BRAND.heirloom }}>{lotsFunded}</div>
            <div style={{ fontFamily: FONTS.body, fontSize: 9, color: `${BRAND.heirloom}55`, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {lang === 'es' ? 'lotes' : 'lots'}
            </div>
          </div>
          <div style={{ width: 1, background: `${BRAND.amazon}55`, margin: '4px 0' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 20, color: BRAND.heirloom }}>{lotsTotal - lotsFunded}</div>
            <div style={{ fontFamily: FONTS.body, fontSize: 9, color: `${BRAND.heirloom}55`, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {lang === 'es' ? 'disponibles' : 'available'}
            </div>
          </div>
        </div>

        {euTarget && (
          <div style={{
            padding: '4px 10px', borderRadius: 999,
            border: `1px solid ${BRAND.heroic}33`,
            background: `${BRAND.heroic}0a`,
            fontFamily: FONTS.display, fontWeight: 700,
            fontSize: 7, letterSpacing: '0.08em', color: `${BRAND.heroic}cc`,
            maxWidth: 200, lineHeight: 1.3, textAlign: 'right',
          }}>
            🇪🇺 {euTarget}
          </div>
        )}
      </div>
    </div>
  )
}
