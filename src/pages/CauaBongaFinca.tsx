import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BRAND, FONTS, GUARDIANS } from '../utils/constants'
import { REGION_BIOME, type Region } from '../utils/colombiaGeo'
import { useCocoaTrees } from '../hooks/useCocoaTrees'
import { useCauaBongaWorld } from '../hooks/useCauaBongaWorld'
import ColombiaMap from '../components/ui/ColombiaMap'

export default function CauaBongaFinca() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const guardianId = Number(id)
  const guardian = GUARDIANS[guardianId]
  const { trees, loading: treesLoading } = useCocoaTrees()
  const { farms } = useCauaBongaWorld()

  const farm = farms.find(f => f.guardian_id === guardianId)

  if (Number.isNaN(guardianId) || !guardian) {
    return (
      <div style={{ background: BRAND.bgDeep, minHeight: '100vh', paddingTop: 120, textAlign: 'center', color: BRAND.heirloom }}>
        <p style={{ fontFamily: FONTS.body, fontSize: 14 }}>Finca no encontrada.</p>
        <button onClick={() => navigate('/caua-bonga')} style={backBtn}>
          ← Volver al mundo
        </button>
      </div>
    )
  }

  const region = guardian.region as Region
  const bio = REGION_BIOME[region]
  const myTrees = trees.filter(t => t.guardian_id === guardianId)

  return (
    <div style={{ background: BRAND.bgDeep, minHeight: '100vh', paddingTop: 80, paddingBottom: 80 }}>

      {/* Back */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '16px 20px 0' }}>
        <button onClick={() => navigate('/caua-bonga')} style={backBtn}>
          ← Volver al mundo
        </button>
      </div>

      {/* Hero — guardian header con mapa al lado */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '12px 20px 0' }}>
        <div style={{
          display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap',
          background: `linear-gradient(135deg, ${BRAND.amazon}88, ${BRAND.bgDark})`,
          border: `1px solid ${bio.accent}55`, borderRadius: 18, padding: 18,
        }}>
          <div style={{ flexShrink: 0 }}>
            <ColombiaMap region={region} size={120} showTerrain showLabels />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 9, letterSpacing: '0.25em', color: bio.accent, marginBottom: 4, textTransform: 'uppercase' }}>
              {bio.icon} {bio.biome} · {region}
            </div>
            <h1 style={{
              fontFamily: FONTS.display, fontWeight: 900, fontSize: 'clamp(28px,6vw,44px)',
              color: BRAND.heirloom, margin: 0, textTransform: 'uppercase', lineHeight: 0.95,
            }}>
              Finca de {guardian.emoji} {guardian.name}
            </h1>
            <div style={{ fontFamily: FONTS.body, fontSize: 12, color: `${BRAND.heirloom}88`, marginTop: 6 }}>
              📍 {guardian.town}, {guardian.region}
            </div>
            <div style={{ fontFamily: FONTS.body, fontSize: 11, color: BRAND.pod, marginTop: 4, fontWeight: 600 }}>
              {guardian.heritage}
            </div>
          </div>
        </div>
      </div>

      {/* NPC dialogue */}
      {farm && farm.npc_dialogue.length > 0 && (
        <div style={{ maxWidth: 720, margin: '20px auto 0', padding: '0 20px' }}>
          {farm.npc_dialogue.map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.18, duration: 0.35 }}
              style={{
                background: BRAND.bgCard,
                border: `1px solid ${bio.accent}33`,
                borderRadius: 14, padding: '12px 16px',
                fontFamily: FONTS.serif, fontStyle: 'italic',
                color: `${BRAND.heirloom}cc`, fontSize: 14, lineHeight: 1.55,
                marginBottom: 8, position: 'relative',
              }}
            >
              <span style={{ position: 'absolute', left: -6, top: 14, fontSize: 16 }}>{guardian.emoji}</span>
              <span style={{ marginLeft: 14 }}>"{line}"</span>
            </motion.div>
          ))}
        </div>
      )}

      {/* Mis árboles aquí */}
      <div style={{ maxWidth: 720, margin: '24px auto 0', padding: '0 20px' }}>
        <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 10, letterSpacing: '0.25em', color: `${BRAND.heirloom}55`, marginBottom: 12, textTransform: 'uppercase' }}>
          Mis árboles en esta finca
        </div>

        {treesLoading ? (
          <div style={{ color: `${BRAND.heirloom}44`, fontFamily: FONTS.body, fontSize: 12 }}>
            Cargando…
          </div>
        ) : myTrees.length === 0 ? (
          <div style={{
            background: BRAND.bgCard, border: `1px dashed ${BRAND.amazon}aa`,
            borderRadius: 14, padding: '24px 20px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🌱</div>
            <div style={{ fontFamily: FONTS.body, color: `${BRAND.heirloom}88`, fontSize: 13, marginBottom: 14, lineHeight: 1.5 }}>
              Aún no tienes árboles con {guardian.name}.
            </div>
            <button
              onClick={() => navigate(`/adoptar?guardian=${guardianId}`)}
              style={{
                display: 'inline-block', padding: '12px 22px', borderRadius: 999,
                background: `linear-gradient(135deg, ${bio.accent}, ${bio.accent}cc)`,
                color: BRAND.bgDeep, border: 'none', cursor: 'pointer',
                fontFamily: FONTS.display, fontWeight: 700, fontSize: 11, letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              Adopta un árbol con {guardian.name}
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
            {myTrees.map(t => (
              <button
                key={t.id}
                onClick={() => navigate(`/tree/${t.id}`)}
                style={{
                  background: BRAND.bgCard, border: `1px solid ${BRAND.pod}55`,
                  borderRadius: 14, padding: '14px 12px', cursor: 'pointer',
                  color: BRAND.heirloom, textAlign: 'left',
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 6 }}>🌳</div>
                <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 13, color: BRAND.heirloom }}>
                  {t.stage ?? 'Plántula'}
                </div>
                <div style={{ fontFamily: FONTS.body, fontSize: 10, color: `${BRAND.heirloom}66`, marginTop: 4 }}>
                  ❤️ {t.health ?? '—'}% · 💧 {t.moisture ?? '—'}% · ☀️ {t.sunlight ?? '—'}%
                </div>
                <div style={{ fontFamily: FONTS.body, fontSize: 9, color: BRAND.pod, marginTop: 4, fontWeight: 600 }}>
                  Cuidar →
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Future-features footer */}
      <div style={{ maxWidth: 560, margin: '32px auto 0', padding: '0 20px', textAlign: 'center' }}>
        <div style={{
          background: `${BRAND.bgDark}99`, border: `1px dashed ${BRAND.amazon}88`,
          borderRadius: 14, padding: '14px 18px',
          fontFamily: FONTS.body, fontSize: 11, color: `${BRAND.heirloom}55`, lineHeight: 1.6,
        }}>
          Próximamente desde esta finca: minijuego machete · cosecha baba · lecciones edutainment
        </div>
      </div>
    </div>
  )
}

const backBtn: React.CSSProperties = {
  background: 'transparent', border: `1px solid ${BRAND.amazon}aa`,
  borderRadius: 999, padding: '6px 14px', cursor: 'pointer',
  fontFamily: FONTS.display, fontWeight: 700, fontSize: 10, letterSpacing: '0.15em',
  color: `${BRAND.heirloom}88`, textTransform: 'uppercase',
}
