import { BRAND } from '../../utils/constants'
import { useLang } from '../../context/LangContext'

export default function LanguageToggle() {
  const { lang, setLang } = useLang()

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center',
      background: '#0A1A0C', borderRadius: 999,
      border: `1px solid ${BRAND.amazon}55`,
      padding: 3, gap: 2,
    }}>
      {(['es', 'en'] as const).map(l => (
        <button
          key={l}
          onClick={() => setLang(l)}
          style={{
            padding: '4px 10px', borderRadius: 999, border: 'none',
            cursor: 'pointer', transition: 'all 0.25s',
            background:    lang === l ? BRAND.pod         : 'transparent',
            color:         lang === l ? '#040C06'         : `${BRAND.heirloom}66`,
            fontFamily:    "'Barlow Condensed', sans-serif",
            fontWeight:    700,
            fontSize:      10,
            letterSpacing: '0.1em',
          }}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
