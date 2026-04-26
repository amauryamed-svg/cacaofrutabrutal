import { useEffect, useState } from 'react'
import { BRAND, FONTS } from '../../utils/constants'
import { IconJaguarPod } from '../ui/CauaIcons'
import { useLang } from '../../context/LangContext'
import { makeT } from '../../utils/i18n'

export default function BlogHero() {
  const { lang } = useLang()
  const T = makeT(lang)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { const id = setTimeout(() => setMounted(true), 60); return () => clearTimeout(id) }, [])

  return (
    <div style={{
      background: `linear-gradient(135deg, ${BRAND.bgDeep}, ${BRAND.bgCard})`,
      borderBottom: `1px solid ${BRAND.amazon}44`,
      padding: 'clamp(40px, 10vw, 80px) var(--space-page)',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes blogHeroFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50%      { transform: translateY(-10px) rotate(1.2deg); }
        }
        @keyframes blogHeroGlowPulse {
          0%, 100% { opacity: 0.35; transform: translate(-50%,-50%) scale(1);   }
          50%      { opacity: 0.60; transform: translate(-50%,-50%) scale(1.15); }
        }
        @keyframes blogHeroOrbit {
          from { transform: rotate(0deg)   translateX(140px) rotate(0deg);   }
          to   { transform: rotate(360deg) translateX(140px) rotate(-360deg); }
        }
        @keyframes blogHeroShimmer {
          0%   { background-position:   0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position:   0% 50%; }
        }
      `}</style>

      {/* Animated radial glow behind jaguar */}
      <div style={{
        position: 'absolute',
        top: '38%',
        left: '50%',
        width: 520,
        height: 520,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${BRAND.pod}26 0%, ${BRAND.mazorca}10 40%, transparent 70%)`,
        animation: 'blogHeroGlowPulse 5.5s ease-in-out infinite',
        pointerEvents: 'none',
        filter: 'blur(20px)',
      }} />

      {/* Orbiting dot — subtle */}
      <div style={{
        position: 'absolute',
        top: '40%',
        left: '50%',
        width: 0,
        height: 0,
        pointerEvents: 'none',
      }}>
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          background: BRAND.pod,
          boxShadow: `0 0 12px ${BRAND.pod}`,
          animation: 'blogHeroOrbit 14s linear infinite',
          opacity: 0.6,
        }} />
      </div>

      {/* Jaguar SVG — floats */}
      <div style={{
        marginBottom: 24,
        position: 'relative',
        animation: 'blogHeroFloat 6s ease-in-out infinite',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'scale(1)' : 'scale(0.9)',
        transition: 'opacity 0.9s cubic-bezier(0.16,1,0.3,1), transform 0.9s cubic-bezier(0.16,1,0.3,1)',
      }}>
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
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 0.9s cubic-bezier(0.16,1,0.3,1) 0.15s, transform 0.9s cubic-bezier(0.16,1,0.3,1) 0.15s',
      }}>
        {T('blog_eyebrow')}
      </p>

      {/* Title — shimmer */}
      <h1 style={{
        fontFamily: "'Barlow Condensed', Impact, sans-serif",
        fontWeight: 900,
        fontSize: 'clamp(48px, 10vw, 72px)',
        textTransform: 'uppercase',
        margin: '0 0 12px',
        lineHeight: 0.95,
        backgroundImage: `linear-gradient(90deg, ${BRAND.heirloom} 0%, ${BRAND.pod} 45%, ${BRAND.heirloom} 55%, ${BRAND.heirloom} 100%)`,
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
        animation: 'blogHeroShimmer 8s ease-in-out infinite',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(18px)',
        transition: 'opacity 1s cubic-bezier(0.16,1,0.3,1) 0.25s, transform 1s cubic-bezier(0.16,1,0.3,1) 0.25s',
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
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 1s cubic-bezier(0.16,1,0.3,1) 0.4s, transform 1s cubic-bezier(0.16,1,0.3,1) 0.4s',
      }}>
        Ciencia, territorio y salud. Las voces de nuestros fundadores y guardianes del cacao.
      </p>
    </div>
  )
}
