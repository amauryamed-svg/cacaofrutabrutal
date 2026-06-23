import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { BRAND, FONTS } from '../utils/constants'

const KNOWN_DOCS: Record<string, string> = {
  CHARTER:    'CHARTER.md',
  COMPLIANCE: 'COMPLIANCE.md',
  AUDIT:      'AUDIT.md',
  LEGAL:      'LEGAL.md',
  SECURITY:   'SECURITY.md',
  KYC:        'KYC.md',
  WEB3:       'WEB3.md',
}

export default function Docs() {
  const { slug = '' } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [raw, setRaw]       = useState<string | null>(null)
  const [error, setError]   = useState(false)

  const filename = KNOWN_DOCS[slug.toUpperCase()] ?? null

  useEffect(() => {
    if (!filename) { setError(true); return }
    fetch(`/docs/${filename}`)
      .then(r => { if (!r.ok) throw new Error(); return r.text() })
      .then(setRaw)
      .catch(() => setError(true))
  }, [filename])

  const html = useMemo(() => {
    if (!raw) return ''
    return DOMPurify.sanitize(marked.parse(raw) as string, {
      ALLOWED_TAGS: ['h1','h2','h3','h4','h5','h6','p','ul','ol','li','strong','em','a','blockquote','code','pre','br','hr','table','thead','tbody','tr','th','td'],
      ALLOWED_ATTR: ['href','target','rel'],
    })
  }, [raw])

  return (
    <div style={{ minHeight: '100vh', background: BRAND.bgDeep, color: BRAND.heirloom, padding: '32px 20px 80px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            fontFamily: FONTS.display, fontWeight: 700, fontSize: 11,
            color: `${BRAND.heirloom}66`, letterSpacing: '0.18em',
            textTransform: 'uppercase', marginBottom: 32, padding: 0,
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          ← Volver
        </button>

        {error && (
          <div style={{ fontFamily: FONTS.body, color: `${BRAND.heirloom}55`, fontSize: 14 }}>
            Documento no disponible.
          </div>
        )}

        {!error && !raw && (
          <div style={{ fontFamily: FONTS.body, color: `${BRAND.heirloom}44`, fontSize: 13 }}>
            Cargando…
          </div>
        )}

        {html && (
          <>
            <style>{`
              .docs-body h1, .docs-body h2, .docs-body h3 {
                font-family: ${FONTS.display}; font-weight: 900;
                color: ${BRAND.heirloom}; letter-spacing: 0.02em;
                text-transform: uppercase; margin: 32px 0 10px; line-height: 1.1;
              }
              .docs-body h1 { font-size: clamp(26px,5vw,38px); color: ${BRAND.pod}; }
              .docs-body h2 { font-size: clamp(18px,3vw,24px); }
              .docs-body h3 { font-size: 15px; color: ${BRAND.pod}cc; }
              .docs-body p, .docs-body li {
                font-family: ${FONTS.body}; font-size: 14px;
                color: ${BRAND.heirloom}cc; line-height: 1.7; margin: 8px 0;
              }
              .docs-body ul, .docs-body ol { padding-left: 22px; }
              .docs-body a { color: ${BRAND.pod}; }
              .docs-body strong { color: ${BRAND.heirloom}; font-weight: 700; }
              .docs-body code {
                font-family: 'Press Start 2P', monospace; font-size: 10px;
                background: ${BRAND.bgCard}; color: ${BRAND.mazorca};
                padding: 2px 6px; border-radius: 4px;
              }
              .docs-body pre {
                background: ${BRAND.bgCard}; border: 1px solid ${BRAND.amazon}55;
                border-radius: 8px; padding: 16px; overflow-x: auto; margin: 16px 0;
              }
              .docs-body pre code { background: none; padding: 0; }
              .docs-body blockquote {
                border-left: 3px solid ${BRAND.pod}; margin: 16px 0;
                padding: 10px 16px; background: ${BRAND.pod}08;
                font-style: italic; color: ${BRAND.heirloom}88;
              }
              .docs-body hr { border: none; border-top: 1px solid ${BRAND.amazon}44; margin: 28px 0; }
              .docs-body table { width: 100%; border-collapse: collapse; margin: 16px 0; }
              .docs-body th, .docs-body td {
                font-family: ${FONTS.body}; font-size: 12px; padding: 8px 12px;
                border: 1px solid ${BRAND.amazon}44; text-align: left;
                color: ${BRAND.heirloom}cc;
              }
              .docs-body th { background: ${BRAND.bgCard}; color: ${BRAND.pod}; font-weight: 700; }
            `}</style>
            <div className="docs-body" dangerouslySetInnerHTML={{ __html: html }} />
          </>
        )}
      </div>
    </div>
  )
}
