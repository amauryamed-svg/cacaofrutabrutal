import { BRAND } from '../../utils/constants'

export default function CauaLogo({ size = 32 }: { size?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: `linear-gradient(135deg, ${BRAND.pod}, ${BRAND.amazon})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.5, fontWeight: 900, color: BRAND.heirloom,
        fontFamily: "'Barlow Condensed', Impact, sans-serif",
      }}>C</div>
      <span style={{
        fontFamily: "'Barlow Condensed', Impact, sans-serif",
        fontWeight: 900, fontSize: size * 0.7, letterSpacing: '0.15em',
        color: BRAND.heirloom, textTransform: 'uppercase',
      }}>CAUA</span>
    </div>
  )
}
