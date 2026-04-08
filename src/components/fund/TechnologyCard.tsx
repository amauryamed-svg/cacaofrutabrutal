import { useState } from 'react'
import { BRAND, FONTS } from '../../utils/constants'
import SupplyChainFlow from './SupplyChainFlow'
import FundingProgress from './FundingProgress'
import MvpCard from './MvpCard'
import InvestModal from './InvestModal'
import type { Technology, Mvp, InvestMode } from '../../types/fund.types'

const CATEGORY_COLORS: Record<string, string> = {
  extract:     BRAND.pod,
  hydrosol:    BRAND.heroic,
  beverage:    BRAND.mazorca,
  ferment:     BRAND.criollo,
  ceremonial:  BRAND.theobroma,
}

interface Props {
  tech: Technology
  user: string | null
  lang: 'es' | 'en'
}

export default function TechnologyCard({ tech, user, lang }: Props) {
  const [modal, setModal] = useState<{ mode: InvestMode; mvp?: Mvp } | null>(null)
  const accent = CATEGORY_COLORS[tech.category] ?? BRAND.pod
  const mvps = (tech.mvps ?? []).filter(m => m.active)

  return (
    <>
      <div style={{
        background: BRAND.bgCard,
        border: `1px solid ${BRAND.amazon}55`,
        borderRadius: 18, overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header stripe */}
        <div style={{ height: 3, background: `linear-gradient(90deg, ${accent}, ${accent}44)` }} />

        <div style={{ padding: '24px 24px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Title row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{
                  fontFamily: FONTS.display, fontWeight: 700, fontSize: 8,
                  letterSpacing: '0.15em', textTransform: 'uppercase',
                  padding: '3px 9px', borderRadius: 999,
                  background: `${accent}18`, color: accent,
                  border: `1px solid ${accent}33`,
                }}>{tech.category.toUpperCase()}</span>
                {tech.eu_approval_target && (
                  <span style={{
                    fontFamily: FONTS.display, fontWeight: 700, fontSize: 8,
                    letterSpacing: '0.1em', padding: '3px 9px', borderRadius: 999,
                    background: `${BRAND.heroic}10`, color: `${BRAND.heroic}cc`,
                    border: `1px solid ${BRAND.heroic}22`,
                  }}>🇪🇺 EU</span>
                )}
              </div>
              <h3 style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 'clamp(22px,4vw,28px)', color: BRAND.heirloom, margin: 0, lineHeight: 1 }}>{tech.name}</h3>
              {tech.tagline && (
                <p style={{ fontFamily: FONTS.serif, fontStyle: 'italic', fontSize: 12, color: `${BRAND.heirloom}66`, margin: '6px 0 0', lineHeight: 1.4 }}>{tech.tagline}</p>
              )}
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 18, color: accent }}>
                ${(tech.lot_price_usd_cents / 100).toFixed(0)}
              </div>
              <div style={{ fontFamily: FONTS.body, fontSize: 9, color: `${BRAND.heirloom}44` }}>
                {lang === 'es' ? '/ lote' : '/ lot'}
              </div>
            </div>
          </div>

          {/* Supply chain */}
          <SupplyChainFlow
            inputDescription={tech.input_description}
            steps={tech.process_steps}
            outputDescription={tech.output_description}
            lang={lang}
          />

          {/* Funding progress */}
          <FundingProgress
            lotsFunded={tech.lots_funded}
            lotsTotal={tech.lots_total}
            raisedUsdCents={tech.raised_usd_cents}
            goalUsdCents={tech.goal_usd_cents}
            euTarget={tech.eu_approval_target}
            lang={lang}
          />

          {/* IaaS tag */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 1, background: `${BRAND.amazon}33` }} />
            <span style={{ fontFamily: FONTS.serif, fontStyle: 'italic', fontSize: 10, color: `${BRAND.heirloom}33` }}>
              {lang === 'es' ? 'Ingrediente como Servicio' : 'Ingredient as a Service'}
            </span>
            <div style={{ flex: 1, height: 1, background: `${BRAND.amazon}33` }} />
          </div>

          {/* MVPs */}
          {mvps.length > 0 && (
            <div>
              <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 9, letterSpacing: '0.2em', color: `${BRAND.heirloom}44`, marginBottom: 10 }}>
                {lang === 'es' ? 'MVPs · PAID PILOTS' : 'MVPs · PAID PILOTS'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(220px, 100%), 1fr))', gap: 10 }}>
                {mvps.map(m => (
                  <MvpCard key={m.id} mvp={m} lang={lang} onPreBuy={mvp => setModal({ mode: 'mvp', mvp })} />
                ))}
              </div>
            </div>
          )}

          {/* Invest in lots CTA */}
          <button
            onClick={() => setModal({ mode: 'lot' })}
            style={{
              padding: '14px', borderRadius: 999, cursor: 'pointer',
              background: `linear-gradient(135deg, ${accent}22, ${accent}0a)`,
              border: `1px solid ${accent}44`, color: accent,
              fontFamily: FONTS.display, fontWeight: 700,
              fontSize: 11, letterSpacing: '0.12em',
              transition: 'all 0.25s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = `${accent}28` }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = `linear-gradient(135deg, ${accent}22, ${accent}0a)` }}
          >
            {lang === 'es' ? '↗ INVERTIR EN LOTES' : '↗ INVEST IN LOTS'}
          </button>
        </div>
      </div>

      {modal && (
        <InvestModal
          technology={tech}
          mvp={modal.mvp}
          mode={modal.mode}
          user={user}
          lang={lang}
          onClose={() => setModal(null)}
        />
      )}
    </>
  )
}
