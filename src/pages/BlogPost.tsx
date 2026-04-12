import { useParams, useNavigate } from 'react-router-dom'
import { BRAND, FONTS } from '../utils/constants'
import { useLang } from '../context/LangContext'
import { makeT } from '../utils/i18n'
import { useBlogPostBySlug } from '../hooks/useBlogPosts'
import AuthorChip from '../components/blog/AuthorChip'
import BlogTagPill from '../components/blog/BlogTagPill'

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { lang } = useLang()
  const T = makeT(lang)
  const { post, loading } = useBlogPostBySlug(slug || '')

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: BRAND.bgDeep,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 80,
      }}>
        <div style={{
          fontFamily: FONTS.body,
          fontSize: 14,
          color: `${BRAND.heirloom}66`,
        }}>
          Cargando…
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div style={{
        minHeight: '100vh',
        background: BRAND.bgDeep,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 80,
      }}>
        <div style={{
          textAlign: 'center',
          fontFamily: FONTS.body,
          fontSize: 14,
          color: `${BRAND.heirloom}66`,
        }}>
          Post no encontrado
        </div>
      </div>
    )
  }

  const publishDate = new Date(post.publishedAt)
  const dateStr = publishDate.toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div style={{
      minHeight: '100vh',
      background: BRAND.bgDeep,
      paddingTop: 80,
    }}>
      {/* Back button + header */}
      <div style={{
        maxWidth: 680,
        margin: '0 auto',
        padding: 'clamp(20px, 5vw, 40px) var(--space-page)',
      }}>
        <button
          onClick={() => navigate('/blog')}
          style={{
            background: 'none',
            border: 'none',
            color: BRAND.pod,
            cursor: 'pointer',
            fontFamily: FONTS.body,
            fontSize: 12,
            marginBottom: 24,
            padding: 0,
          }}
        >
          ← Volver al blog
        </button>

        {/* Cover emoji */}
        <div style={{
          fontSize: 80,
          marginBottom: 24,
        }}>
          {post.coverEmoji}
        </div>

        {/* Title */}
        <h1 style={{
          fontFamily: FONTS.display,
          fontWeight: 900,
          fontSize: 'clamp(32px, 8vw, 56px)',
          color: BRAND.heirloom,
          margin: '0 0 16px',
          lineHeight: 1.1,
          letterSpacing: '0.02em',
        }}>
          {post.title}
        </h1>

        {/* Subtitle */}
        {post.subtitle && (
          <p style={{
            fontFamily: FONTS.serif,
            fontStyle: 'italic',
            fontSize: 18,
            color: `${BRAND.heirloom}77`,
            margin: '0 0 24px',
            lineHeight: 1.6,
          }}>
            {post.subtitle}
          </p>
        )}

        {/* Author chip */}
        <AuthorChip name={post.authorName} role={post.authorRole} bio={post.authorBio} />

        {/* Meta */}
        <div style={{
          display: 'flex',
          gap: 16,
          alignItems: 'center',
          marginBottom: 32,
          paddingBottom: 24,
          borderBottom: `1px solid ${BRAND.amazon}44`,
          fontFamily: FONTS.body,
          fontSize: 11,
          color: `${BRAND.heirloom}55`,
        }}>
          <span>{dateStr}</span>
          <span>·</span>
          <span>{Math.ceil(post.bodyMd.length / 200)} min de lectura</span>
        </div>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div style={{
            display: 'flex',
            gap: 6,
            flexWrap: 'wrap',
            marginBottom: 40,
          }}>
            {post.tags.map(tag => (
              <BlogTagPill key={tag} tag={tag} />
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <article style={{
        maxWidth: 680,
        margin: '0 auto',
        padding: '0 var(--space-page) clamp(40px, 10vw, 80px)',
      }}>
        {/* Render markdown as HTML — simple conversion */}
        <div style={{
          fontFamily: FONTS.body,
          fontSize: 16,
          lineHeight: 1.8,
          color: BRAND.heirloom,
        }}>
          {post.bodyMd.split('\n').map((line, i) => {
            if (line.startsWith('# ')) {
              return (
                <h2
                  key={i}
                  style={{
                    fontFamily: FONTS.display,
                    fontWeight: 900,
                    fontSize: 28,
                    margin: '32px 0 16px',
                    color: BRAND.heirloom,
                  }}
                >
                  {line.replace('# ', '')}
                </h2>
              )
            }
            if (line.startsWith('## ')) {
              return (
                <h3
                  key={i}
                  style={{
                    fontFamily: FONTS.display,
                    fontWeight: 700,
                    fontSize: 22,
                    margin: '24px 0 12px',
                    color: BRAND.heirloom,
                  }}
                >
                  {line.replace('## ', '')}
                </h3>
              )
            }
            if (line.startsWith('- ')) {
              return (
                <li key={i} style={{ marginLeft: 20, marginBottom: 8 }}>
                  {line.replace('- ', '')}
                </li>
              )
            }
            if (line.trim() === '') {
              return <p key={i} style={{ height: 8 }} />
            }
            return (
              <p key={i} style={{ margin: '0 0 16px' }}>
                {line}
              </p>
            )
          })}
        </div>
      </article>

      {/* Footer spacing */}
      <div style={{ height: 80 }} />
    </div>
  )
}
