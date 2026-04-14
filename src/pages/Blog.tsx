import { useState } from 'react'
import { BRAND, FONTS } from '../utils/constants'
import { useLang } from '../context/LangContext'
import { useBlogPosts } from '../hooks/useBlogPosts'
import BlogHero from '../components/blog/BlogHero'
import BlogCard from '../components/blog/BlogCard'

export default function Blog() {
  const { lang: _lang } = useLang()
  const { posts, loading } = useBlogPosts()
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  // Extract all unique tags
  const allTags = Array.from(new Set(posts.flatMap(p => p.tags)))

  // Filter posts by tag
  const filtered = selectedTag
    ? posts.filter(p => p.tags.includes(selectedTag))
    : posts

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: BRAND.bgDeep,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          fontFamily: FONTS.body,
          fontSize: 14,
          color: `${BRAND.heirloom}66`,
        }}>
          Cargando blog…
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: BRAND.bgDeep,
      paddingTop: 80,
    }}>
      {/* Hero */}
      <BlogHero />

      {/* Tag filters */}
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: 'clamp(32px, 5vw, 48px) var(--space-page)',
      }}>
        <div style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          scrollbarWidth: 'none',
          marginBottom: 32,
          paddingBottom: 4,
        }}>
          {/* All button */}
          <button
            onClick={() => setSelectedTag(null)}
            style={{
              background: !selectedTag ? `${BRAND.pod}22` : 'transparent',
              border: `1px solid ${!selectedTag ? BRAND.pod : BRAND.amazon}44`,
              color: !selectedTag ? BRAND.pod : `${BRAND.heirloom}66`,
              padding: '6px 14px',
              borderRadius: 999,
              cursor: 'pointer',
              fontFamily: FONTS.display,
              fontWeight: 700,
              fontSize: 10,
              letterSpacing: '0.12em',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
          >
            TODOS
          </button>

          {/* Tag buttons */}
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              style={{
                background: selectedTag === tag ? `${BRAND.pod}22` : 'transparent',
                border: `1px solid ${selectedTag === tag ? BRAND.pod : BRAND.amazon}44`,
                color: selectedTag === tag ? BRAND.pod : `${BRAND.heirloom}66`,
                padding: '6px 14px',
                borderRadius: 999,
                cursor: 'pointer',
                fontFamily: FONTS.display,
                fontWeight: 700,
                fontSize: 10,
                letterSpacing: '0.12em',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
              }}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Posts grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(360px, 100%), 1fr))',
          gap: 20,
          marginBottom: 40,
        }}>
          {filtered.map(post => (
            <BlogCard
              key={post.id}
              slug={post.slug}
              title={post.title}
              subtitle={post.subtitle}
              coverEmoji={post.coverEmoji}
              authorName={post.authorName}
              authorRole={post.authorRole}
              tags={post.tags}
              publishedAt={post.publishedAt}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            fontFamily: FONTS.body,
            fontSize: 14,
            color: `${BRAND.heirloom}66`,
          }}>
            No hay posts con esta etiqueta.
          </div>
        )}
      </div>
    </div>
  )
}
