import { BRAND, FONTS } from '../../utils/constants'
import { useTokenBalance } from '../../hooks/useTokenBalance'

/**
 * 3-step redemption preview shown in the Adopta `done` state. Replaces the
 * previously hardcoded `RedimeCacao10K · $10K COP` block at Adoptar.tsx
 * lines 400–454.
 *
 * Steps:
 *   1. AHORA — RedimeCacao10K · $10K COP gift card → Cacao Ceremony (Shopify)
 *   2. DÍA 30 — primera mazorca cosechable
 *   3. CUANDO LLEGUES A 1000 MAZORCAS — redime 1 $CACAO on-chain
 *
 * Step 3 swaps to "redime ahora →" once mazorcas_balance ≥ 1000.
 */
export default function RedemptionPreviewCard({ giftCode }: { giftCode?: string }) {
  const { mazorcas } = useTokenBalance()
  const onChainReady = mazorcas >= 1000
  const code = giftCode ?? 'RedimeCacao10K'

  return (
    <div
      role="region"
      aria-label="Pasos de redención"
      style={{
        display: 'flex', flexDirection: 'column', gap: 14,
        padding: 22,
        background: `${BRAND.bgCard}cc`,
        border: `1px solid ${BRAND.amazon}`,
        borderRadius: 14,
        fontFamily: FONTS.body,
        color: BRAND.heirloom,
      }}
    >
      <div
        style={{
          fontFamily: FONTS.display, fontWeight: 900,
          letterSpacing: '0.22em', textTransform: 'uppercase',
          fontSize: 11, color: `${BRAND.heirloom}99`, marginBottom: 4,
        }}
      >
        Tu camino hasta el chocolate
      </div>

      <Step
        emoji="🎁"
        when="ahora"
        title="Cacao Ceremony · gift card $10K COP"
        body={
          <>
            Código: <code
              style={{
                fontFamily: 'monospace', background: `${BRAND.amazon}aa`,
                padding: '2px 8px', borderRadius: 4, color: BRAND.mazorca,
                letterSpacing: '0.04em', fontSize: 12,
              }}
            >{code}</code>
          </>
        }
        active
        accent={BRAND.mazorca}
      />

      <Step
        emoji="🍫"
        when="día 30"
        title="Primera mazorca cosechable"
        body="Cuida tu árbol diario y cosecha en el harvest minigame."
        active={false}
        accent={BRAND.pod}
      />

      <Step
        emoji="⚗"
        when={onChainReady ? 'redime ahora →' : `${Math.round(mazorcas)} / 1000 mazorcas`}
        title="1000 mazorcas → 1 $CACAO on-chain"
        body={
          onChainReady
            ? 'Burn off-chain firmado EIP-712 → mint en Base Sepolia (mainnet post-audit).'
            : 'Acumula mazorcas con cuidados, cosechas, racha y quests.'
        }
        active={onChainReady}
        accent={BRAND.criollo}
      />
    </div>
  )
}

function Step({
  emoji,
  when,
  title,
  body,
  active,
  accent,
}: {
  emoji: string
  when: string
  title: string
  body: React.ReactNode
  active: boolean
  accent: string
}) {
  return (
    <div
      style={{
        display: 'flex', gap: 14, alignItems: 'flex-start',
        opacity: active ? 1 : 0.62,
      }}
    >
      <div
        style={{
          fontSize: 22, lineHeight: 1,
          width: 32, minWidth: 32, height: 32,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: 10,
          background: active ? `${accent}1a` : 'transparent',
          border: `1px solid ${accent}66`,
        }}
        aria-hidden="true"
      >
        {emoji}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: FONTS.display, fontWeight: 900,
            letterSpacing: '0.16em', textTransform: 'uppercase',
            fontSize: 11, color: accent, marginBottom: 4,
          }}
        >
          {when}
        </div>
        <div
          style={{
            fontFamily: FONTS.body, fontSize: 14, fontWeight: 600,
            color: BRAND.heirloom, marginBottom: 4,
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: 12, color: `${BRAND.heirloom}99`, lineHeight: 1.6 }}>
          {body}
        </div>
      </div>
    </div>
  )
}
