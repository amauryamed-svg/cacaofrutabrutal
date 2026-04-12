import { useTokenBalance } from '../../hooks/useTokenBalance'
import { BRAND, FONTS } from '../../utils/constants'

export default function TokenBalance() {
  const { beans, loading } = useTokenBalance()

  if (loading || beans === 0) return null

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '4px 12px',
      borderRadius: 999,
      background: `${BRAND.pod}18`,
      border: `1px solid ${BRAND.pod}44`,
      fontFamily: FONTS.display,
      fontWeight: 700,
      fontSize: 11,
      letterSpacing: '0.1em',
      color: BRAND.pod,
    }}>
      <span>🫘</span>
      <span>{beans.toFixed(1)}</span>
    </div>
  )
}
