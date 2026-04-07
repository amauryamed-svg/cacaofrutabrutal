import { BRAND } from '../utils/constants'
import { useAuth } from '../context/AuthContext'
import HubspotLeadForm from '../components/ui/HubspotLeadForm'
import { useLang } from '../context/LangContext'
import { makeT } from '../utils/i18n'

export default function Dashboard() {
  const { profile } = useAuth()
  const { lang } = useLang()
  const T = makeT(lang)

  const METRICS = [
    { label: lang === 'es' ? 'Toneladas Desviadas'    : 'Tons Diverted',         value: '2.4', unit: 'ton',  icon: '♻️', color: BRAND.pod     },
    { label: lang === 'es' ? 'Familias Impactadas'    : 'Families Impacted',      value: '5',   unit: 'fam.', icon: '👨‍👩‍👧‍👦', color: BRAND.mazorca },
    { label: lang === 'es' ? 'Ingreso +% Agricultor'  : 'Farmer Income Increase', value: '+180',unit: '%',    icon: '📈', color: BRAND.heroic  },
    { label: lang === 'es' ? 'Biodiversidad Protegida': 'Protected Biodiversity', value: '12',  unit: 'ha',   icon: '🌳', color: BRAND.pod     },
  ]

  const TIMELINE = [
    { q: 'Q1 2026', title: lang === 'es' ? 'MVP + Validación' : 'MVP + Validation', status: 'active',   items: ['Landing + Marketplace', '100 pre-orders', 'BFFood Candidatura'] },
    { q: 'Q2 2026', title: lang === 'es' ? 'Producción'       : 'Production',        status: 'upcoming', items: ['600L Sunrise Shot', 'CAUA Labs apertura', lang === 'es' ? '5 guardianes activos' : '5 active guardians'] },
    { q: 'Q3 2026', title: lang === 'es' ? 'Escala'           : 'Scale',             status: 'upcoming', items: [lang === 'es' ? 'Canal B2B España' : 'Spain B2B Channel', 'Pop-Up Galicia', lang === 'es' ? 'Panel consumidores' : 'Consumer panel'] },
    { q: 'Q4 2026', title: lang === 'es' ? 'Ronda Semilla'    : 'Seed Round',        status: 'upcoming', items: ['$750K - $1.5M raise', lang === 'es' ? 'Equipo clave 3+' : 'Core team 3+', lang === 'es' ? 'Certificaciones EU' : 'EU Certifications'] },
    { q: '2027',    title: lang === 'es' ? 'Crecimiento'      : 'Growth',            status: 'future',   items: ['$500K revenue', lang === 'es' ? '8-10 guardianes' : '8-10 guardians', lang === 'es' ? 'Distribución EU' : 'EU Distribution'] },
    { q: '2028-29', title: lang === 'es' ? 'Consolidación'    : 'Consolidation',     status: 'future',   items: ['$1M+ revenue', lang === 'es' ? 'Licencias IP' : 'IP Licenses', lang === 'es' ? '5 países' : '5 countries'] },
  ]

  const DISTRIBUTION = [
    { label: lang === 'es' ? 'Agricultor (Guardián)'   : 'Farmer (Guardian)',        pct: 35, color: BRAND.pod      },
    { label: lang === 'es' ? 'Producción + R&D'        : 'Production + R&D',         pct: 25, color: BRAND.muisca   },
    { label: lang === 'es' ? 'Operaciones + Logística' : 'Operations + Logistics',   pct: 15, color: BRAND.mazorca  },
    { label: lang === 'es' ? 'Marketing + Comunidad'   : 'Marketing + Community',    pct: 10, color: BRAND.theobroma},
    { label: lang === 'es' ? 'Reinversión + Impacto'   : 'Reinvestment + Impact',    pct: 10, color: BRAND.criollo  },
    { label: 'Equipo CAUA',                                                           pct: 5,  color: BRAND.heroic   },
  ]

  return (
    <div style={{ background: '#040C06', minHeight: '100vh', paddingTop: 80 }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px' }}>

        <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic', color: BRAND.mazorca, fontSize: 12, letterSpacing: '0.2em', marginBottom: 8 }}>
          {T('dash_eyebrow')}
        </p>
        <h2 style={{
          fontFamily: "'Barlow Condensed', Impact, sans-serif", fontWeight: 900,
          fontSize: 'clamp(36px, 8vw, 56px)', color: BRAND.heirloom,
          textTransform: 'uppercase', margin: '0 0 32px', lineHeight: 0.95,
        }}>{T('dash_title').split(' ')[0]} <span style={{ color: BRAND.pod }}>{T('dash_title').split(' ')[1]}</span></h2>

        {/* Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 48 }}>
          {METRICS.map((m, i) => (
            <div key={i} style={{ background: '#132B1C', border: `1px solid ${BRAND.amazon}66`, borderRadius: 12, padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{m.icon}</div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 36, color: m.color }}>
                {m.value}<span style={{ fontSize: 14, color: `${BRAND.heirloom}55` }}> {m.unit}</span>
              </div>
              <div style={{ fontFamily: 'system-ui', color: `${BRAND.heirloom}77`, fontSize: 11, marginTop: 4 }}>{m.label}</div>
            </div>
          ))}
        </div>

        {/* Roadmap */}
        <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, color: BRAND.heirloom, fontSize: 16, letterSpacing: '0.1em', marginBottom: 24 }}>
          {T('dash_roadmap')}
        </h3>
        <div style={{ position: 'relative', marginBottom: 48 }}>
          <div style={{ position: 'absolute', left: 16, top: 0, bottom: 0, width: 2, background: `linear-gradient(${BRAND.pod}, ${BRAND.amazon}44)` }} />
          {TIMELINE.map((t, i) => (
            <div key={i} style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
              <div style={{
                width: 34, minWidth: 34, height: 34, borderRadius: '50%', zIndex: 2,
                background: t.status === 'active' ? BRAND.pod : '#132B1C',
                border: `2px solid ${t.status === 'active' ? BRAND.pod : BRAND.amazon}66`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {t.status === 'active' && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#040C06' }} />}
              </div>
              <div style={{
                background: t.status === 'active' ? `${BRAND.pod}11` : 'transparent',
                border: `1px solid ${t.status === 'active' ? BRAND.pod : BRAND.amazon}33`,
                borderRadius: 12, padding: 16, flex: 1,
              }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, color: t.status === 'active' ? BRAND.pod : BRAND.mazorca, fontSize: 11, letterSpacing: '0.12em' }}>
                    {t.q}
                  </span>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, color: BRAND.heirloom, fontSize: 16 }}>
                    {t.title}
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {t.items.map((item, j) => (
                    <span key={j} style={{
                      background: `${BRAND.amazon}44`, padding: '3px 10px', borderRadius: 999,
                      fontFamily: 'system-ui', fontSize: 10, color: `${BRAND.heirloom}88`,
                    }}>{item}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Value distribution */}
        <div style={{ background: '#132B1C', border: `1px solid ${BRAND.amazon}66`, borderRadius: 12, padding: 24, marginBottom: 40 }}>
          <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, color: BRAND.heirloom, fontSize: 14, letterSpacing: '0.1em', marginBottom: 16 }}>
            {T('dash_distrib')}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {DISTRIBUTION.map((row, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontFamily: 'system-ui', fontSize: 11, color: `${BRAND.heirloom}cc` }}>{row.label}</span>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 12, color: row.color }}>{row.pct}%</span>
                </div>
                <div style={{ height: 4, background: `${BRAND.amazon}44`, borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ width: `${row.pct}%`, height: '100%', borderRadius: 999, background: row.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Lead capture ── */}
        <div style={{ padding: '0 0 32px', maxWidth: 480, margin: '0 auto' }}>
          <HubspotLeadForm
            prefillEmail={profile?.email ?? ''}
            prefillRegion={profile?.region ?? 'OTHER'}
            prefillBehavior={{
              streak:    profile?.ritual_streak    ?? 0,
              orders:    profile?.completed_orders ?? 0,
              referrals: profile?.referral_count   ?? 0,
            }}
          />
        </div>

        {/* WhatsApp CTA */}
        <div style={{ textAlign: 'center', paddingBottom: 40 }}>
          <a href="https://wa.me/573102227848?text=Quiero%20saber%20m%C3%A1s%20sobre%20CAUA"
            target="_blank" rel="noopener noreferrer" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#25D366', color: '#fff', padding: '12px 24px',
              borderRadius: 999, textDecoration: 'none',
              fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
              fontSize: 13, letterSpacing: '0.08em',
            }}>
            {T('dash_whatsapp')}
          </a>
        </div>
      </div>
    </div>
  )
}
