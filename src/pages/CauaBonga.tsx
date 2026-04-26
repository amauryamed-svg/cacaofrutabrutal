import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { BRAND, FONTS } from '../utils/constants'
import { REGION_BIOME, type Region } from '../utils/colombiaGeo'
import { useCauaBongaWorld, type BongaFarm } from '../hooks/useCauaBongaWorld'
import { useTokenBalance } from '../hooks/useTokenBalance'
import ColombiaMap from '../components/ui/ColombiaMap'

export default function CauaBonga() {
  const navigate = useNavigate()
  const { farms, loading } = useCauaBongaWorld()
  const { beans, mazorcas } = useTokenBalance()
  const [hovered, setHovered] = useState<BongaFarm | null>(null)

  const goToFinca = (id: number) => navigate(`/caua-bonga/finca/${id}`)
  const goByRegion = (region: Region) => {
    const f = farms.find(x => x.region === region)
    if (f) goToFinca(f.guardian_id)
  }

  return (
    <div style={{ background: BRAND.bgDeep, minHeight: '100vh', paddingTop: 80, paddingBottom: 80 }}>

      {/* Header */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px 0', textAlign: 'center', position: 'relative' }}>
        <p style={{ fontFamily: FONTS.serif, fontStyle: 'italic', color: BRAND.pod, fontSize: 13, letterSpacing: '0.25em', marginBottom: 10 }}>
          mundo cacao fruta brutal
        </p>
        <h1 style={{
          fontFamily: FONTS.display, fontWeight: 900,
          fontSize: 'clamp(40px,9vw,68px)', color: BRAND.heirloom,
          textTransform: 'uppercase', margin: '0 0 8px', lineHeight: 0.9, letterSpacing: '0.02em',
        }}>
          Caua<span style={{ color: BRAND.mazorca }}>Bonga</span>
        </h1>
        <p style={{ fontFamily: FONTS.body, color: `${BRAND.heirloom}66`, fontSize: 13, lineHeight: 1.6, maxWidth: 460, margin: '0 auto 8px' }}>
          5 fincas. 5 cacaocultores. Un ecosistema interconectado de variedades, biomas y saber campesino.
        </p>
        <p style={{ fontFamily: FONTS.body, color: `${BRAND.heirloom}33`, fontSize: 11, margin: 0 }}>
          Toca un departamento para visitar la finca de su guardián.
        </p>
      </div>

      {/* HUD — token balance top-right */}
      <div style={{
        position: 'fixed', top: 84, right: 16, zIndex: 50,
        background: `${BRAND.bgDark}cc`, backdropFilter: 'blur(8px)',
        border: `1px solid ${BRAND.pod}33`, borderRadius: 12,
        padding: '8px 14px', display: 'flex', gap: 14,
        fontFamily: FONTS.display, fontSize: 12, fontWeight: 700, letterSpacing: '0.06em',
      }}>
        <span style={{ color: BRAND.pod }}>🫘 {beans.toFixed(1)}</span>
        <span style={{ color: BRAND.mazorca }}>🌽 {mazorcas}</span>
      </div>

      {/* Map */}
      <div style={{ maxWidth: 560, margin: '24px auto 0', padding: '0 20px', position: 'relative' }}>
        <div style={{
          background: `radial-gradient(ellipse at 50% 40%, ${BRAND.amazon}88 0%, ${BRAND.bgDeep} 70%)`,
          borderRadius: 24,
          border: `1px solid ${BRAND.amazon}66`,
          padding: '24px 16px',
          position: 'relative',
        }}>
          <ColombiaMap
            size={Math.min(480, typeof window !== 'undefined' ? window.innerWidth - 80 : 480)}
            showAllDepts
            showTerrain
            showLabels
            outlineColor={BRAND.pod}
            onRegionClick={goByRegion}
            ariaLabel="Mundo CauaBonga — mapa de Colombia con las 5 fincas"
          />

          {/* Hover tooltip */}
          <AnimatePresence>
            {hovered && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.18 }}
                style={{
                  position: 'absolute', bottom: 16, left: 16, right: 16,
                  background: `${BRAND.bgDeep}f0`, backdropFilter: 'blur(8px)',
                  border: `1px solid ${REGION_BIOME[hovered.region].accent}88`,
                  borderRadius: 12, padding: '10px 14px',
                  fontFamily: FONTS.body, fontSize: 12, color: BRAND.heirloom, lineHeight: 1.5,
                }}
              >
                <strong style={{ color: REGION_BIOME[hovered.region].accent }}>
                  {hovered.guardianEmoji} {hovered.guardianName} · {hovered.region}
                </strong>
                <div style={{ marginTop: 4, color: `${BRAND.heirloom}aa` }}>
                  {hovered.npc_dialogue[0]}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Finca tiles row */}
      <div style={{ maxWidth: 720, margin: '32px auto 0', padding: '0 20px' }}>
        <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 10, letterSpacing: '0.25em', color: `${BRAND.heirloom}55`, marginBottom: 12, textAlign: 'center', textTransform: 'uppercase' }}>
          Las 5 fincas
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', color: `${BRAND.heirloom}44`, fontFamily: FONTS.body, fontSize: 12, padding: '24px 0' }}>
            Cargando fincas…
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: 10,
          }}>
            {farms.map(f => {
              const bio = REGION_BIOME[f.region]
              return (
                <button
                  key={f.guardian_id}
                  onClick={() => goToFinca(f.guardian_id)}
                  onMouseEnter={() => setHovered(f)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    background: `${BRAND.bgCard}`, border: `1px solid ${bio.accent}55`,
                    borderRadius: 14, padding: '14px 10px', cursor: 'pointer',
                    color: BRAND.heirloom, textAlign: 'center',
                    transition: 'transform 0.15s ease, border-color 0.15s ease',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  }}
                  onFocus={() => setHovered(f)}
                  onBlur={() => setHovered(null)}
                >
                  <div style={{ fontSize: 28 }}>{f.guardianEmoji}</div>
                  <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 12, letterSpacing: '0.06em', color: BRAND.heirloom }}>
                    {f.guardianName.toUpperCase()}
                  </div>
                  <div style={{ fontFamily: FONTS.body, fontSize: 9, color: `${BRAND.heirloom}66`, lineHeight: 1.3 }}>
                    {f.region}
                  </div>
                  <div style={{
                    fontFamily: FONTS.display, fontSize: 8, fontWeight: 700,
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: bio.accent, padding: '2px 6px',
                    background: `${bio.accent}18`, borderRadius: 4, marginTop: 2,
                  }}>
                    {bio.icon} {bio.biome}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Future-features footer */}
      <div style={{ maxWidth: 560, margin: '40px auto 0', padding: '0 20px', textAlign: 'center' }}>
        <div style={{
          background: `${BRAND.bgDark}99`, border: `1px dashed ${BRAND.amazon}88`,
          borderRadius: 14, padding: '16px 18px',
        }}>
          <div style={{ fontFamily: FONTS.display, fontSize: 9, fontWeight: 700, letterSpacing: '0.25em', color: BRAND.mazorca, marginBottom: 6 }}>
            PRÓXIMAMENTE
          </div>
          <div style={{ fontFamily: FONTS.body, fontSize: 11, color: `${BRAND.heirloom}66`, lineHeight: 1.6 }}>
            🥷 Minijuego machete (Fruit Ninja) · 🍯 Cosecha de baba/mucílago · 🎓 Aula CauaPokemon · 🔗 Intercambios entre fincas
          </div>
        </div>
      </div>
    </div>
  )
}
