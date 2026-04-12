import { useState } from 'react'
import { BRAND, FONTS } from '../../utils/constants'
import SupplyChainFlow from './SupplyChainFlow'
import FundingProgress from './FundingProgress'
import MvpCard from './MvpCard'
import InvestModal from './InvestModal'
import type { Technology, Mvp, InvestMode, UserProfile } from '../../types/fund.types'

const CATEGORY_COLORS: Record<string, string> = {
  extract:    BRAND.pod,
  hydrosol:   BRAND.heroic,
  beverage:   BRAND.mazorca,
  ferment:    BRAND.criollo,
  ceremonial: BRAND.theobroma,
}

// Tags derived from pitch_growth.html — show business plan coherence
const TECH_TAGS: Record<string, string[]> = {
  'mucilage-extract': ['Novel Food EU', 'EFSA · en trámite', 'Criollo Élite', 'Liofilización', 'IaaS B2B', 'MucilageExtract™', 'Bioactivos'],
  'hydrosol':         ['EFSA Botanicals', 'Hidrosol Premium', 'Aceite Esencial', 'Híbridos', 'Trinitarios', 'IaaS B2B', 'Cosmética + Alimentos'],
  'theobroma-brew':   ['Novel Food EU', 'EFSA · en trámite', 'Lactofermentación', 'Probióticos', 'Cold Brew', 'Funcional', 'Sin Azúcar'],
}

// Product image per technology — will be wired once assets are available
const TECH_IMAGES: Record<string, string | null> = {
  'mucilage-extract': null,   // e.g. /brand/products/mucilage-extract.jpg
  'hydrosol':         null,
  'theobroma-brew':   null,
}

interface Props {
  tech: Technology
  user: string | null
  profile?: UserProfile | null
  lang: 'es' | 'en'
}

export default function TechnologyCard({ tech, user, profile, lang }: Props) {
  const [modal, setModal] = useState<{ mode: InvestMode; mvp?: Mvp } | null>(null)
  const accent = CATEGORY_COLORS[tech.category] ?? BRAND.pod
  const mvps   = (tech.mvps ?? []).filter(m => m.active)
  const tags   = TECH_TAGS[tech.slug] ?? []
  const imgSrc = TECH_IMAGES[tech.slug] ?? null

  const T = (es: string, en: string) => lang === 'es' ? es : en

  // Novel Food badge — always "en trámite", never "aprobado"
  const novelFoodBadge = tech.eu_approval_target
    ? tech.eu_approval_target.replace(/aprobad[oa]/gi, 'en trámite')
    : null

  return (
    <>
      <div style={{
        background: BRAND.bgCard,
        border: `1px solid ${BRAND.amazon}55`,
        borderRadius: 18, overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Accent stripe */}
        <div style={{ height: 3, background: `linear-gradient(90deg, ${accent}, ${accent}44)` }} />

        {/* Optional product image */}
        {imgSrc && (
          <div style={{ height: 160, overflow: 'hidden', position: 'relative' }}>
            <img
              src={imgSrc}
              alt={tech.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }}
            />
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, transparent 40%, ${BRAND.bgCard})` }} />
          </div>
        )}

        <div style={{ padding: '24px 24px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Title row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ flex: 1 }}>
              {/* Category + EU badges */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                <Badge label={tech.category.toUpperCase()} color={accent} />
                {novelFoodBadge && (
                  <Badge label={`🇪🇺 ${novelFoodBadge}`} color={BRAND.heroic} small />
                )}
              </div>
              <h3 style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 'clamp(22px,4vw,28px)', color: BRAND.heirloom, margin: 0, lineHeight: 1 }}>
                {tech.name}
              </h3>
              {tech.tagline && (
                <p style={{ fontFamily: FONTS.serif, fontStyle: 'italic', fontSize: 12, color: `${BRAND.heirloom}66`, margin: '6px 0 0', lineHeight: 1.4 }}>
                  {tech.tagline}
                </p>
              )}
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 18, color: accent }}>
                ${(tech.lot_price_usd_cents / 100).toFixed(0)}
              </div>
              <div style={{ fontFamily: FONTS.body, fontSize: 9, color: `${BRAND.heirloom}44` }}>
                {T('/ lote', '/ lot')}
              </div>
              <div style={{ fontFamily: FONTS.body, fontSize: 9, color: `${BRAND.heirloom}33`, marginTop: 2 }}>
                ≈ ${(tech.lot_price_cop / 1000).toFixed(0)}k COP
              </div>
            </div>
          </div>

          {/* Tags from pitch_growth */}
          {tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {tags.map(tag => (
                <span key={tag} style={{
                  fontFamily: FONTS.display, fontWeight: 700,
                  fontSize: 8, letterSpacing: '0.1em',
                  padding: '3px 8px', borderRadius: 999,
                  background: `${BRAND.amazon}18`,
                  border: `1px solid ${BRAND.amazon}44`,
                  color: `${BRAND.heirloom}88`,
                  whiteSpace: 'nowrap',
                }}>
                  {tag}
                </span>
              ))}
            </div>
          )}

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
            euTarget={novelFoodBadge}
            lang={lang}
          />

          {/* IaaS divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 1, background: `${BRAND.amazon}33` }} />
            <span style={{ fontFamily: FONTS.serif, fontStyle: 'italic', fontSize: 10, color: `${BRAND.heirloom}33` }}>
              {T('Ingrediente como Servicio · B2B EU', 'Ingredient as a Service · B2B EU')}
            </span>
            <div style={{ flex: 1, height: 1, background: `${BRAND.amazon}33` }} />
          </div>

          {/* MVPs */}
          {mvps.length > 0 && (
            <div>
              <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 9, letterSpacing: '0.2em', color: `${BRAND.heirloom}44`, marginBottom: 10 }}>
                MVPs · PAID PILOTS
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(220px, 100%), 1fr))', gap: 10 }}>
                {mvps.map(m => (
                  <MvpCard key={m.id} mvp={m} lang={lang} onPreBuy={mvp => setModal({ mode: 'mvp', mvp })} />
                ))}
              </div>
            </div>
          )}

          {/* Invest CTA */}
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
            {T('↗ INVERTIR EN LOTES', '↗ INVEST IN LOTS')}
          </button>
        </div>
      </div>

      {modal && (
        <InvestModal
          technology={tech}
          mvp={modal.mvp}
          mode={modal.mode}
          user={user}
          profile={profile}
          lang={lang}
          onClose={() => setModal(null)}
        />
      )}
    </>
  )
}

function Badge({ label, color, small }: { label: string; color: string; small?: boolean }) {
  return (
    <span style={{
      fontFamily: FONTS.display, fontWeight: 700,
      fontSize: small ? 7 : 8, letterSpacing: '0.1em',
      padding: small ? '2px 7px' : '3px 9px', borderRadius: 999,
      background: `${color}18`, color: `${color}cc`,
      border: `1px solid ${color}33`,
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  )
}
