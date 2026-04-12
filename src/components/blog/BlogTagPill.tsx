import { BRAND, FONTS } from '../../utils/constants'

interface Props {
  tag: string
}

export default function BlogTagPill({ tag }: Props) {
  return (
    <span style={{
      background: `${BRAND.amazon}66`,
      border: `1px solid ${BRAND.amazon}`,
      padding: '4px 12px',
      borderRadius: 999,
      fontFamily: FONTS.body,
      fontSize: 11,
      color: `${BRAND.heirloom}99`,
      letterSpacing: '0.05em',
      whiteSpace: 'nowrap',
    }}>
      {tag}
    </span>
  )
}
