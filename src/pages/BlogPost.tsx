import { useEffect, useRef, useMemo } from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { useParams, useNavigate } from 'react-router-dom'
import { BRAND, FONTS } from '../utils/constants'
import { useLang } from '../context/LangContext'
import { useBlogPostBySlug } from '../hooks/useBlogPosts'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import AuthorChip from '../components/blog/AuthorChip'
import BlogTagPill from '../components/blog/BlogTagPill'

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { lang, setLang } = useLang()
  const { post, loading } = useBlogPostBySlug(slug || '')
  const { userId } = useAuth()
  const awardedRef = useRef<string | null>(null)

  // blog_read faucet: +0.2 beans per slug per UTC day (client-side dedup via token_events).
  useEffect(() => {
    if (!userId || !slug || !post || awardedRef.current === slug) return
    awardedRef.current = slug
    ;(async () => {
      const todayStart = new Date()
      todayStart.setUTCHours(0, 0, 0, 0)
      const { data: existing } = await supabase
        .from('token_events')
        .select('id')
        .eq('user_id', userId)
        .eq('event_type', 'blog_read')
        .eq('ref_id', slug)
        .gte('created_at', todayStart.toISOString())
        .limit(1)
      if (existing && existing.length > 0) return
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token
      if (!token) return
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/award-tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ event_type: 'blog_read', ref_id: slug }),
      }).catch(() => {})
    })()
  }, [userId, slug, post])

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
        paddingTop: 'calc(var(--nav-h, 60px) + 12px)',
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
        paddingTop: 'calc(var(--nav-h, 60px) + 12px)',
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

  const htmlBody = useMemo(() => {
    if (!body) return ''
    const raw = marked.parse(body) as string
    return DOMPurify.sanitize(raw, {
      ALLOWED_TAGS: ['h1','h2','h3','h4','p','ul','ol','li','strong','em','a','blockquote','code','pre','br','hr'],
      ALLOWED_ATTR: ['href','target','rel'],
    })
  }, [body])

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
      paddingTop: 'calc(var(--nav-h, 60px) + 12px)',
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
        <style>{`
          .blog-body { font-family: ${FONTS.body}; font-size: 16px; line-height: 1.8; color: ${BRAND.heirloom}; }
          .blog-body h1, .blog-body h2 { font-family: ${FONTS.display}; font-weight: 900; font-size: 28px; color: ${BRAND.heirloom}; margin: 32px 0 16px; line-height: 1.15; }
          .blog-body h3, .blog-body h4 { font-family: ${FONTS.display}; font-weight: 700; font-size: 20px; color: ${BRAND.heirloom}; margin: 24px 0 10px; }
          .blog-body p { margin: 0 0 16px; }
          .blog-body ul, .blog-body ol { margin: 0 0 16px; padding-left: 24px; }
          .blog-body li { margin-bottom: 6px; }
          .blog-body strong { font-weight: 700; color: ${BRAND.pod}; }
          .blog-body em { font-style: italic; color: ${BRAND.heirloom}cc; }
          .blog-body a { color: ${BRAND.pod}; text-decoration: underline; text-underline-offset: 3px; }
          .blog-body a:hover { color: ${BRAND.criollo}; }
          .blog-body blockquote { border-left: 3px solid ${BRAND.pod}; margin: 24px 0; padding: 12px 20px; background: ${BRAND.pod}11; font-style: italic; color: ${BRAND.heirloom}aa; }
          .blog-body code { font-family: ui-monospace, monospace; font-size: 13px; background: ${BRAND.amazon}22; padding: 2px 6px; border-radius: 4px; color: ${BRAND.pod}; }
          .blog-body pre { background: ${BRAND.amazon}22; padding: 16px; border-radius: 8px; overflow-x: auto; margin: 0 0 16px; }
          .blog-body pre code { background: none; padding: 0; }
          .blog-body hr { border: none; border-top: 1px solid ${BRAND.amazon}44; margin: 32px 0; }
        `}</style>
        <div
          className="blog-body"
          dangerouslySetInnerHTML={{ __html: htmlBody }}
        />
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
