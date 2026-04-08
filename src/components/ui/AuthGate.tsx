/**
 * AuthGate — wraps protected routes.
 * If the user is not authenticated, shows a branded benefits wall
 * and redirects to /auth for registration/login.
 * Public routes (/  /auth) are excluded in App.tsx.
 */
import { useNavigate } from 'react-router-dom'
import { BRAND, FONTS } from '../../utils/constants'
import { useAuth } from '../../context/AuthContext'
import CauaLogo from './CauaLogo'

interface Props {
  children: React.ReactNode
}

const BENEFITS = [
  {
    icon: '🫘',
    title: 'Acceso al Crowdfunding',
    titleEn: 'Crowdfunding Access',
    desc: 'Invierte en MucilageExtract™, HydroSol™ y TheobromaBrew™ desde $15 USD · Pagos en COP, USD, EUR o Crypto.',
    descEn: 'Invest in MucilageExtract™, HydroSol™ and TheobromaBrew™ from $15 USD · Pay in COP, USD, EUR or Crypto.',
  },
  {
    icon: '📊',
    title: 'Seguimiento de Lotes',
    titleEn: 'Lot Tracking',
    desc: 'Visualiza tus inversiones, el progreso de producción y la cadena de suministro vivo en tiempo real.',
    descEn: 'Track your investments, production progress and the living supply chain in real time.',
  },
  {
    icon: '🌿',
    title: 'Ritual del Cacao',
    titleEn: 'Cacao Ritual',
    desc: 'Accede al ritual diario de cacao ceremonial. Construye tu streak y desbloquea beneficios exclusivos.',
    descEn: 'Access the daily ceremonial cacao ritual. Build your streak and unlock exclusive benefits.',
  },
  {
    icon: '🏪',
    title: 'Marketplace Exclusivo',
    titleEn: 'Exclusive Marketplace',
    desc: 'Pre-compra MVPs antes del lanzamiento. Acceso anticipado a Baba de Cacao, Hidrosol y SUNRISE SHOT.',
    descEn: 'Pre-buy MVPs before launch. Early access to Baba de Cacao, Hydrosol and SUNRISE SHOT.',
  },
  {
    icon: '🌍',
    title: 'Comunidad Global',
    titleEn: 'Global Community',
    desc: 'Únete a inversores, científicos y agricultores en Colombia, EU y Norteamérica que regeneran la cadena del cacao.',
    descEn: 'Join investors, scientists and farmers in Colombia, EU and North America regenerating the cacao supply chain.',
  },
  {
    icon: '📈',
    title: 'Dashboard IaaS',
    titleEn: 'IaaS Dashboard',
    desc: 'Métricas en vivo: litros producidos, lotes financiados, impacto regenerativo y retornos estimados.',
    descEn: 'Live metrics: liters produced, funded lots, regenerative impact and estimated returns.',
  },
]

export default function AuthGate({ children }: Props) {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  // While Supabase is resolving the session, show nothing to avoid flicker
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: BRAND.bgDeep, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: FONTS.body, fontSize: 12, color: `${BRAND.heirloom}33`, letterSpacing: '0.2em' }}>
          ···
        </div>
      </div>
    )
  }

  if (user) return <>{children}</>

  // ── Benefits wall ──────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: BRAND.bgDeep, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Hero */}
      <div style={{
        width: '100%', maxWidth: 640,
        padding: 'clamp(32px, 6vw, 72px) var(--space-page) 0',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center',
      }}>
        <div style={{ marginBottom: 24 }}>
          <CauaLogo size={28} variant="white" />
        </div>

        <p style={{
          fontFamily: FONTS.serif, fontStyle: 'italic',
          fontSize: 13, color: BRAND.mazorca,
          letterSpacing: '0.2em', marginBottom: 16,
        }}>
          El ecosistema del cacao regenerativo
        </p>

        <h1 style={{
          fontFamily: FONTS.display, fontWeight: 900,
          fontSize: 'clamp(28px, 7vw, 52px)', color: BRAND.heirloom,
          textTransform: 'uppercase', lineHeight: 0.92,
          marginBottom: 20,
        }}>
          ACCEDE AL<br />
          <span style={{ color: BRAND.pod }}>CÍRCULO</span>
        </h1>

        <p style={{ fontFamily: FONTS.body, fontSize: 14, color: `${BRAND.heirloom}77`, lineHeight: 1.7, marginBottom: 32, maxWidth: 480 }}>
          Regístrate para invertir en biotecnologías de cacao, seguir la cadena de suministro vivo y ser parte de la revolución regenerativa.
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 48 }}>
          <button
            onClick={() => navigate('/auth')}
            style={{
              padding: '14px 32px', borderRadius: 999, border: 'none', cursor: 'pointer',
              background: `linear-gradient(135deg, ${BRAND.pod}, ${BRAND.amazon})`,
              color: '#040C06', fontFamily: FONTS.display, fontWeight: 700,
              fontSize: 11, letterSpacing: '0.12em',
            }}
          >
            CREAR CUENTA GRATIS
          </button>
          <button
            onClick={() => navigate('/auth?mode=login')}
            style={{
              padding: '14px 28px', borderRadius: 999, cursor: 'pointer',
              background: 'transparent',
              border: `1px solid ${BRAND.amazon}55`,
              color: `${BRAND.heirloom}88`, fontFamily: FONTS.display, fontWeight: 700,
              fontSize: 11, letterSpacing: '0.1em',
            }}
          >
            INICIAR SESIÓN
          </button>
        </div>
      </div>

      {/* Benefits grid */}
      <div style={{
        width: '100%', maxWidth: 900,
        padding: '0 var(--space-page) clamp(40px, 8vw, 80px)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px, 100%), 1fr))',
        gap: 12,
      }}>
        {BENEFITS.map((b, i) => (
          <div key={i} style={{
            background: BRAND.bgCard,
            border: `1px solid ${BRAND.amazon}44`,
            borderRadius: 14, padding: '18px 20px',
          }}>
            <div style={{ fontSize: 24, marginBottom: 10 }}>{b.icon}</div>
            <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 12, color: BRAND.pod, letterSpacing: '0.06em', marginBottom: 6 }}>
              {b.title}
            </div>
            <div style={{ fontFamily: FONTS.body, fontSize: 11, color: `${BRAND.heirloom}66`, lineHeight: 1.6 }}>
              {b.desc}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom CTA strip */}
      <div style={{
        width: '100%', background: BRAND.bgDark,
        borderTop: `1px solid ${BRAND.amazon}33`,
        padding: '20px var(--space-page)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
        flexWrap: 'wrap',
      }}>
        <span style={{ fontFamily: FONTS.body, fontSize: 12, color: `${BRAND.heirloom}55` }}>
          ¿Ya tienes una cuenta?
        </span>
        <button
          onClick={() => navigate('/auth?mode=login')}
          style={{
            padding: '8px 20px', borderRadius: 999, cursor: 'pointer',
            border: `1px solid ${BRAND.pod}55`,
            background: 'transparent', color: BRAND.pod,
            fontFamily: FONTS.display, fontWeight: 700,
            fontSize: 10, letterSpacing: '0.1em',
          }}
        >
          INICIAR SESIÓN →
        </button>
      </div>
    </div>
  )
}
