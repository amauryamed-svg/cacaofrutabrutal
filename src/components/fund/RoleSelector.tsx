import { BRAND, FONTS, ROLE_CONFIG } from '../../utils/constants'
import type { CauaRole } from '../../types/fund.types'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

interface Props {
  selected: CauaRole
  onSelect: (r: CauaRole) => void
  lang: 'es' | 'en'
}

const ROLES = Object.entries(ROLE_CONFIG) as [CauaRole, typeof ROLE_CONFIG[CauaRole]][]

export default function RoleSelector({ selected, onSelect, lang }: Props) {
  const { profile } = useAuth()

  const handleSelect = async (role: CauaRole) => {
    onSelect(role)
    if (profile?.user_id) {
      await supabase
        .from('user_profiles')
        .update({ caua_role: role })
        .eq('user_id', profile.user_id)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 9, letterSpacing: '0.2em', color: `${BRAND.heirloom}55`, textTransform: 'uppercase' }}>
        {lang === 'es' ? 'TU ROL EN EL ECOSISTEMA' : 'YOUR ROLE IN THE ECOSYSTEM'}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {ROLES.map(([role, cfg]) => {
          const active = selected === role
          return (
            <button
              key={role}
              onClick={() => handleSelect(role)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 999, cursor: 'pointer',
                background: active ? `${cfg.color}20` : 'transparent',
                border: `1px solid ${active ? cfg.color : BRAND.amazon + '55'}`,
                color: active ? cfg.color : `${BRAND.heirloom}66`,
                fontFamily: FONTS.display, fontWeight: 700,
                fontSize: 10, letterSpacing: '0.1em',
                transition: 'all 0.25s',
              }}
            >
              <span style={{ fontSize: 13 }}>{cfg.icon}</span>
              {lang === 'es' ? cfg.labelEs.toUpperCase() : cfg.label.toUpperCase()}
            </button>
          )
        })}
      </div>
    </div>
  )
}
