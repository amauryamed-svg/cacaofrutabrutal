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
  const { lang, setLang } = useLang()
  const T = makeT(lang)
  const { post, loading } = useBlogPostBySlug(slug || '')

  const title = lang === 'en' ? post?.titleEn || post?.title : post?.title
  const subtitle = lang === 'en' ? post?.subtitleEn || post?.subtitle : post?.subtitle
  const body = lang === 'en' ? post?.bodyMdEn || post?.bodyMd : post?.bodyMd
  const tags = lang === 'en' ? post?.tagsEn || post?.tags : post?.tags

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
      {/* Back button + language toggle */}
      <div style={{
        maxWidth: 680,
        margin: '0 auto',
        padding: 'clamp(20px, 5vw, 40px) var(--space-page)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
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
            padding: 0,
          }}
        >
          ← {lang === 'es' ? 'Volver al blog' : 'Back to blog'}
        </button>

        {/* Language toggle */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setLang('es')}
            style={{
              background: lang === 'es' ? BRAND.pod : 'transparent',
              border: `1px solid ${BRAND.pod}`,
              color: lang === 'es' ? BRAND.bgDeep : BRAND.pod,
              padding: '6px 12px',
              borderRadius: 999,
              fontFamily: FONTS.body,
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            ES
          </button>
          <button
            onClick={() => setLang('en')}
            style={{
              background: lang === 'en' ? BRAND.pod : 'transparent',
              border: `1px solid ${BRAND.pod}`,
              color: lang === 'en' ? BRAND.bgDeep : BRAND.pod,
              padding: '6px 12px',
              borderRadius: 999,
              fontFamily: FONTS.body,
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            EN
          </button>
        </div>
      </div>

      {/* Header */}
      <div style={{
        maxWidth: 680,
        margin: '0 auto',
        padding: '0 var(--space-page)',
      }}>

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
          {title}
        </h1>

        {/* Subtitle */}
        {subtitle && (
          <p style={{
            fontFamily: FONTS.serif,
            fontStyle: 'italic',
            fontSize: 18,
            color: `${BRAND.heirloom}77`,
            margin: '0 0 24px',
            lineHeight: 1.6,
          }}>
            {subtitle}
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
          <span>{Math.ceil((body || '').length / 200)} min {lang === 'es' ? 'de lectura' : 'read'}</span>
        </div>

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div style={{
            display: 'flex',
            gap: 6,
            flexWrap: 'wrap',
            marginBottom: 40,
          }}>
            {tags.map(tag => (
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
          {(body || '').split('\n').map((line, i) => {
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

      {/* CTA Section - Connected Resources */}
      <div style={{
        maxWidth: 680,
        margin: '80px auto 0',
        padding: '0 var(--space-page) 80px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}>
        {/* Linked Technology → Fund */}
        {post.linkedTech && (
          <button
            onClick={() => navigate('/fund')}
            style={{
              background: `linear-gradient(135deg, ${BRAND.criollo}22, ${BRAND.amazon}11)`,
              border: `1px solid ${BRAND.criollo}44`,
              borderRadius: 16,
              padding: '24px',
              cursor: 'pointer',
              transition: 'all 0.3s',
              textAlign: 'left',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = BRAND.criollo
              e.currentTarget.style.background = `linear-gradient(135deg, ${BRAND.criollo}33, ${BRAND.amazon}22)`
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = `${BRAND.criollo}44`
              e.currentTarget.style.background = `linear-gradient(135deg, ${BRAND.criollo}22, ${BRAND.amazon}11)`
            }}
          >
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              color: BRAND.pod,
              fontSize: 11,
              letterSpacing: '0.1em',
              marginBottom: 8,
              textTransform: 'uppercase',
            }}>🧬 {lang === 'es' ? 'Invertir en esta tecnología' : 'Invest in this technology'}</div>
            <div style={{
              fontFamily: FONTS.display,
              fontWeight: 700,
              color: BRAND.heirloom,
              fontSize: 18,
              marginBottom: 8,
            }}>FONDO · Crowdfunding</div>
            <div style={{
              fontFamily: FONTS.body,
              color: `${BRAND.heirloom}77`,
              fontSize: 13,
              lineHeight: 1.5,
            }}>
              {lang === 'es'
                ? 'Descubre cómo financiar la investigación y desarrollo de esta innovación biotecnológica.'
                : 'Learn how to fund the research and development of this biotechnology innovation.'}
            </div>
          </button>
        )}

        {/* Marketplace CTA */}
        <button
          onClick={() => navigate('/marketplace')}
          style={{
            background: `linear-gradient(135deg, ${BRAND.amazon}22, ${BRAND.theobroma}11)`,
            border: `1px solid ${BRAND.amazon}44`,
            borderRadius: 16,
            padding: '24px',
            cursor: 'pointer',
            transition: 'all 0.3s',
            textAlign: 'left',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = BRAND.amazon
            e.currentTarget.style.background = `linear-gradient(135deg, ${BRAND.amazon}33, ${BRAND.theobroma}22)`
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = `${BRAND.amazon}44`
            e.currentTarget.style.background = `linear-gradient(135deg, ${BRAND.amazon}22, ${BRAND.theobroma}11)`
          }}
        >
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            color: BRAND.criollo,
            fontSize: 11,
            letterSpacing: '0.1em',
            marginBottom: 8,
            textTransform: 'uppercase',
          }}>🫘 {lang === 'es' ? 'Probar estos bioactivos' : 'Try these bioactives'}</div>
          <div style={{
            fontFamily: FONTS.display,
            fontWeight: 700,
            color: BRAND.heirloom,
            fontSize: 18,
            marginBottom: 8,
          }}>MERCADO · Ediciones limitadas</div>
          <div style={{
            fontFamily: FONTS.body,
            color: `${BRAND.heirloom}77`,
            fontSize: 13,
            lineHeight: 1.5,
          }}>
            {lang === 'es'
              ? 'Explora nuestras ediciones limitadas de cacao y productos derivados.'
              : 'Explore our limited-edition cacao and derived products.'}
          </div>
        </button>

        {/* Impact CTA */}
        <button
          onClick={() => navigate('/impacto')}
          style={{
            background: `linear-gradient(135deg, ${BRAND.muisca}22, ${BRAND.heirloom}11)`,
            border: `1px solid ${BRAND.muisca}44`,
            borderRadius: 16,
            padding: '24px',
            cursor: 'pointer',
            transition: 'all 0.3s',
            textAlign: 'left',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = BRAND.muisca
            e.currentTarget.style.background = `linear-gradient(135deg, ${BRAND.muisca}33, ${BRAND.heirloom}22)`
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = `${BRAND.muisca}44`
            e.currentTarget.style.background = `linear-gradient(135deg, ${BRAND.muisca}22, ${BRAND.heirloom}11)`
          }}
        >
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            color: BRAND.muisca,
            fontSize: 11,
            letterSpacing: '0.1em',
            marginBottom: 8,
            textTransform: 'uppercase',
          }}>🌍 {lang === 'es' ? 'Ver el impacto' : 'See the impact'}</div>
          <div style={{
            fontFamily: FONTS.display,
            fontWeight: 700,
            color: BRAND.heirloom,
            fontSize: 18,
            marginBottom: 8,
          }}>IMPACTO · Triple enfoque</div>
          <div style={{
            fontFamily: FONTS.body,
            color: `${BRAND.heirloom}77`,
            fontSize: 13,
            lineHeight: 1.5,
          }}>
            {lang === 'es'
              ? 'Conoce el impacto real: social, ambiental y económico de CAUA.'
              : 'Discover the real impact: social, environmental, and economic outcomes.'}
          </div>
        </button>
      </div>

      {/* Footer spacing */}
      <div style={{ height: 40 }} />
    </div>
  )
}
