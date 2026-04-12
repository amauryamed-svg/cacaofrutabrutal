import { BRAND, FONTS } from '../../utils/constants'
import { IconJaguarPod } from '../ui/CauaIcons'
import { useLang } from '../../context/LangContext'
import { makeT } from '../../utils/i18n'

export default function BlogHero() {
  const { lang } = useLang()
  const T = makeT(lang)

  return (
    <div style={{
      background: `linear-gradient(135deg, ${BRAND.bgDeep}, ${BRAND.bgCard})`,
      borderBottom: `1px solid ${BRAND.amazon}44`,
      padding: 'clamp(40px, 10vw, 80px) var(--space-page)',
      textAlign: 'center',
    }}>
      {/* Jaguar SVG */}
      <div style={{ marginBottom: 24 }}>
        <IconJaguarPod size={120} podColor={BRAND.criollo} />
      </div>

      {/* Eyebrow */}
      <p style={{
        fontFamily: FONTS.serif,
        fontStyle: 'italic',
        fontSize: 12,
        letterSpacing: '0.25em',
        textTransform: 'uppercase',
        color: BRAND.mazorca,
        margin: '0 0 16px',
      }}>
        {T('blog_eyebrow')}
      </p>

      {/* Title */}
      <h1 style={{
        fontFamily: "'Barlow Condensed', Impact, sans-serif",
        fontWeight: 900,
        fontSize: 'clamp(48px, 10vw, 72px)',
        color: BRAND.heirloom,
        textTransform: 'uppercase',
        margin: '0 0 12px',
        lineHeight: 0.95,
      }}>
        {T('blog_title')}
      </h1>

      {/* Subtitle */}
      <p style={{
        fontFamily: FONTS.body,
        fontSize: 16,
        color: `${BRAND.heirloom}77`,
        margin: 0,
        maxWidth: 600,
        marginLeft: 'auto',
        marginRight: 'auto',
        lineHeight: 1.6,
      }}>
        Ciencia, territorio y salud. Las voces de nuestros fundadores y guardianes del cacao.
      </p>
    </div>
  )
}
