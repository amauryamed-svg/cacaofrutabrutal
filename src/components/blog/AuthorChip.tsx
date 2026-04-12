import { BRAND, FONTS } from '../../utils/constants'

interface Props {
  name: string
  role: string
  bio?: string
}

export default function AuthorChip({ name, role, bio }: Props) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 12,
    }}>
      {/* Avatar circle */}
      <div style={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${BRAND.criollo}, ${BRAND.theobroma})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 14,
        fontWeight: 700,
        color: BRAND.heirloom,
        flexShrink: 0,
      }}>
        {initials}
      </div>

      {/* Name + role */}
      <div>
        <div style={{
          fontFamily: FONTS.display,
          fontWeight: 700,
          fontSize: 13,
          color: BRAND.heirloom,
          letterSpacing: '0.05em',
        }}>
          {name}
        </div>
        <div style={{
          fontFamily: FONTS.body,
          fontSize: 11,
          color: `${BRAND.heirloom}66`,
          marginTop: 2,
        }}>
          {role}
        </div>
      </div>
    </div>
  )
}
