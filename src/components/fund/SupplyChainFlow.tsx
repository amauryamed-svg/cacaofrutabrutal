import { BRAND, FONTS } from '../../utils/constants'
import type { ProcessStep } from '../../types/fund.types'

interface Props {
  inputDescription: string
  steps: ProcessStep[]
  outputDescription: string
  lang: 'es' | 'en'
}

export default function SupplyChainFlow({ inputDescription, steps, outputDescription, lang }: Props) {
  const inputLabel  = lang === 'es' ? 'ENTRADA' : 'INPUT'
  const outputLabel = lang === 'es' ? 'SALIDA'  : 'OUTPUT'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Input */}
      <div style={{
        padding: '10px 16px', borderRadius: 10,
        background: `${BRAND.pod}12`,
        border: `1px solid ${BRAND.pod}33`,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 18 }}>🫘</span>
        <div>
          <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 9, letterSpacing: '0.2em', color: BRAND.pod, marginBottom: 2 }}>{inputLabel}</div>
          <div style={{ fontFamily: FONTS.body, fontSize: 11, color: `${BRAND.heirloom}88`, lineHeight: 1.4 }}>{inputDescription}</div>
        </div>
      </div>

      {/* Process steps — horizontal scroll on mobile */}
      <div style={{ overflowX: 'auto', scrollbarWidth: 'none' }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', minWidth: 'max-content', padding: '4px 0' }}>
          {steps.map((s, i) => (
            <div key={s.step} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                padding: '8px 12px', borderRadius: 8,
                background: BRAND.bgCard,
                border: `1px solid ${BRAND.amazon}55`,
                minWidth: 80,
              }}
                title={s.detail}
              >
                <span style={{ fontSize: 16 }}>{s.icon}</span>
                <span style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 8, letterSpacing: '0.1em', color: `${BRAND.heirloom}88`, textAlign: 'center', lineHeight: 1.3 }}>{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <span style={{ color: `${BRAND.amazon}88`, fontSize: 12, flexShrink: 0 }}>→</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Output */}
      <div style={{
        padding: '10px 16px', borderRadius: 10,
        background: `${BRAND.mazorca}10`,
        border: `1px solid ${BRAND.mazorca}33`,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 18 }}>✨</span>
        <div>
          <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 9, letterSpacing: '0.2em', color: BRAND.mazorca, marginBottom: 2 }}>{outputLabel}</div>
          <div style={{ fontFamily: FONTS.body, fontSize: 11, color: `${BRAND.heirloom}88`, lineHeight: 1.4 }}>{outputDescription}</div>
        </div>
      </div>
    </div>
  )
}
