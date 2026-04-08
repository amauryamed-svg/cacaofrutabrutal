import { BRAND } from '../../utils/constants'
import CauaLogo from '../ui/CauaLogo'

export default function Footer() {
  return (
    <footer style={{
      background: '#040C06', borderTop: `1px solid ${BRAND.amazon}33`,
      padding: '32px 24px', textAlign: 'center',
    }}>
      <CauaLogo size={20} />

      <p style={{
        fontFamily: 'system-ui', color: `${BRAND.heirloom}33`,
        fontSize: 9, marginTop: 8,
      }}>
        © 2026 CAUA Corporation · WA'KA1 CORP · Todos los derechos reservados
      </p>
    </footer>
  )
}
