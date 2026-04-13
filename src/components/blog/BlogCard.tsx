import { useNavigate } from 'react-router-dom'
import { BRAND, FONTS } from '../../utils/constants'
import AuthorChip from './AuthorChip'
import BlogTagPill from './BlogTagPill'
import { useLang } from '../../context/LangContext'
import { makeT } from '../../utils/i18n'

interface Props {
  slug: string
  title: string
  subtitle?: string
  coverEmoji: string
  authorName: string
  authorRole: string
  tags: string[]
  publishedAt: string
}

export default function BlogCard({
  slug, title, subtitle, coverEmoji, authorName, authorRole, tags, publishedAt,
}: Props) {
  const navigate = useNavigate()
  const { lang } = useLang()
  const T = makeT(lang)

  // Estimate read time (200 words/min)
  const readTime = Math.max(1, Math.ceil((title.length + (subtitle?.length || 0)) / 200))

  const publishDate = new Date(publishedAt)
  const dateStr = publishDate.toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <article
      onClick={() => navigate(`/blog/${slug}`)}
      style={{
        background: BRAND.bgCard,
        border: `1px solid ${BRAND.amazon}55`,
        borderRadius: 16,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.3s, box-shadow 0.3s',
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'
        ;(e.currentTarget as HTMLElement).style.boxShadow = `0 20px 48px rgba(0,0,0,0.4), 0 0 0 1px ${BRAND.pod}33`
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
        ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
      }}
    >
      {/* Cover band */}
      <div style={{
        height: 200,
        background: `linear-gradient(135deg, ${BRAND.bgDeep}, ${BRAND.bgDark})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 80,
        fontWeight: 'bold',
        position: 'relative',
      }}>
        {coverEmoji}
        {/* Gradient overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(180deg, transparent 0%, ${BRAND.bgDeep}66 100%)`,
          pointerEvents: 'none',
        }} />
      </div>

      {/* Content */}
      <div style={{
        padding: '24px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        flex: 1,
      }}>
        {/* Author chip */}
        <AuthorChip name={authorName} role={authorRole} />

        {/* Title */}
        <div>
          <h3 style={{
            fontFamily: FONTS.display,
            fontWeight: 900,
            fontSize: 'clamp(20px, 5vw, 28px)',
            color: BRAND.heirloom,
            margin: '0 0 6px',
            lineHeight: 1.1,
            letterSpacing: '0.02em',
          }}>
            {title}
          </h3>
          {subtitle && (
            <p style={{
              fontFamily: FONTS.serif,
              fontStyle: 'italic',
              fontSize: 13,
              color: `${BRAND.heirloom}77`,
              margin: 0,
              lineHeight: 1.5,
            }}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div style={{
            display: 'flex',
            gap: 6,
            flexWrap: 'wrap',
            marginTop: 6,
          }}>
            {tags.map(tag => (
              <BlogTagPill key={tag} tag={tag} />
            ))}
          </div>
        )}

        {/* Date + read time */}
        <div style={{
          marginTop: 'auto',
          paddingTop: 12,
          borderTop: `1px solid ${BRAND.amazon}44`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{
            fontFamily: FONTS.body,
            fontSize: 10,
            color: `${BRAND.heirloom}55`,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}>
            {dateStr}
          </span>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}>
            <span style={{
              fontFamily: FONTS.body,
              fontSize: 10,
              color: `${BRAND.heirloom}55`,
            }}>
              {readTime} {lang === 'es' ? 'min' : 'min'}
            </span>
            <span style={{ fontSize: 10 }}>📖</span>
          </div>
        </div>

        {/* CTA */}
        <div style={{
          marginTop: 12,
          padding: '10px 0',
          borderTop: `1px solid ${BRAND.amazon}44`,
          fontFamily: FONTS.display,
          fontWeight: 700,
          fontSize: 12,
          letterSpacing: '0.1em',
          color: BRAND.pod,
          textTransform: 'uppercase',
        }}>
          {T('blog_read')}
        </div>
      </div>
    </article>
  )
}
