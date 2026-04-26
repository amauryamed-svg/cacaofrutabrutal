# Handover — Investor Landing Pitch (2026-04-26)

Resumen de la sesión que rediseñó `public/investor-landing.html` y la escena 3D
para convertir el deck de inversores en un pitch dinámico estilo Fortified.

---

## North Star

- **Referencia:** Fortified (fortified bikes) — pitch scroll-driven, dinámico
- **Hook:** mazorca divina al cargar el header (visual fuerte que no requiere scroll)
- **Explosión narrativa:** al scrollear, la mazorca se descompone en semillas + flores + agroforestería
- **Cierre:** vista panorámica de finca cacaotera mature con cielo dusk
- Ver memoria: `project_investor_landing_north_star.md` + `feedback_no_static_text_on_3d.md`

---

## Narrativa scroll-driven (estado actual)

| Scroll | Fase | Escena |
|---|---|---|
| 0.00 – 0.18 | **Hook divino** | Hero mazorca a `(1.4, 5.6, 4.0)`, opacity 1 desde page load. Bloom 1.6 sostenido. Aura/rayos en baseline 0.55. Cámara cerca `(0, 5, 9)`. Burst en halo contenido. Sky `#2A1810`. |
| 0.18 – 0.32 | **Explosión** | Mazorca swell ×1.35 → collapse a 0. Burst pasa de halo a expansión radial 5→14. Bloom doble pico. Cámara comienza pull-back. |
| 0.32 – 0.55 | **Dispersal + emergence** | Semilla púrpura cae, germina. Grove fade-in. Sprout → cotiledones → plántula. Sky enfría a `#140A06`. |
| 0.55 – 0.80 | **Mature finca** | Tronco, ramas, canopy con wind sway, flores, mazorcas. Grove visible. Sky vira dawn → golden. |
| 0.80 – 1.00 | **Wide vista** | Cámara panorámica `(0, 8.5, 22)`. Sky dusk warm. Cierre. |

---

## Archivos clave

### `public/investor-landing.html` (1626+ líneas)
- Sección **08.4 Unit Economics** (reemplazó pin rail descartado): grid 6 cards con counters animados scroll-triggered estilo Fortified, pulse al completar
- 22 keys i18n `ue_*` en `T.es` + `T.en` (toggle EN/ES funcional)
- Carga bloom addons desde `unpkg.com/three@0.128.0/examples/js/postprocessing/*` (EffectComposer, RenderPass, ShaderPass, CopyShader, LuminosityHighPassShader, UnrealBloomPass)
- CSS UE inline en `<style>` con keyframes `ueNumPulse`

### `public/investor-3d.js` (~830 líneas)
- Three.js r128 puro vía CDN, procedural (no GLB cargado todavía)
- Reduced-motion + mobile (<768) + low-core (<4) gates per `docs/context/ui-ux-bar.md` §3-4
- Geometría reusable: `buildPodGeometry`, `buildPod`, `buildLeafGeometry`
- **Hero mazorca** top-level scene child (no scaleable group), full size desde p=0
- **Protagonist tree** en grupo `mature` con sub-grupos por etapa (seed buried, sprout, cotyledon, juvenile + mature trunk/branches/canopy/flowers/pods)
- **Grove**: 22 cacaos instanciados (InstancedMesh) + 3 mango + 4 banano procedurales como contexto finca
- **Burst particles**: 220 puntos con vertex colors (33% púrpura cosmic + 33% pink flower + 34% gold). Régimen dual: halo contenido → explosión radial
- **Sky palette**: 6 stops, lerping linear por scroll
- **Wind sway**: ~50 hojas canopy con `userData{baseRotZ, phase, freq, amp}`, oscilación per-leaf
- **Bloom**: `bloomBase = 1.6 * (1 - smoothstep(0.10, 0.40, p))` + segundo pico en explosión

### `public/investor-scroll.js` (~95 líneas)
- ESM, importa `motion@12` desde esm.sh
- Escribe `--p` (scroll global 0-1) en `:root` vía motion.dev `scroll()`
- Escribe `--pd` (proximidad a `#investment`) — actualmente sin uso en 3D pero wiring intacto
- Counters UE con `IntersectionObserver` (threshold 0.55) + `animate(0, target)` + `onComplete` añadiendo class `.ue-num-done` para pulse CSS

### Borrados
- `public/investor-pinrail.css` — pin rail descartado, dead asset removed

---

## Stack y constraints (no negociables)

- **Three.js r128** vía CDN cloudflare (no upgrade a r16x decidido aún — bloquea HDRI/IBL moderno)
- **motion.dev v12** vanilla vía esm.sh (Framer Motion sigue restringido a CauaGotchi por regla design-system 2026-04-18)
- **GSAP / Lenis / Locomotive prohibidos** (CauaCore §8 + ui-ux-bar §3)
- **Reduced-motion = hard kill switch** (no graceful degradation)
- **Backgrounds: hex literals only** (ui-ux-bar §6) — el legacy del HTML tiene `--gold/--olive/--mazorca` como CSS vars (deuda preexistente)
- **`--mazorca` en HTML está mal**: define `#91A63B` (Pod Green) cuando debería ser `#F1A91E` (Mazorca Yellow). No corregido.

---

## Items abiertos / deferidos

| Item | Razón | Donde |
|---|---|---|
| Locale-aware number formatting (EN comma) | UE counters en `Intl.NumberFormat('es-CO')` siempre | `investor-scroll.js` |
| HDRI/IBL + GLB loading | Requiere subir Three.js a r16x — decisión stack pendiente | `investor-3d.js` + HTML preloads |
| Hero mazorca LOD | Mesh ~27k vert, gated visibility actualmente suficiente | `investor-3d.js` |
| `--mazorca` token fix `#91A63B` → `#F1A91E` | Inconsistencia con docs/brand/REFERENCE.md | `investor-landing.html:20` |
| Re-anchor a sección 09 (si user vuelve) | `--pd` sigue escribiéndose sin uso | `investor-scroll.js` |
| Scripts asset pipeline | Existen pero no integrados en pre-commit hook | `scripts/optimize-{gltf,hdri,video}.mjs` |

---

## Memorias relevantes (Claude auto-memory)

- `project_investor_landing_north_star.md` — Fortified como referencia, dynamic + animated UE + 3D territorio
- `feedback_no_static_text_on_3d.md` — texto estático sobre 3D = rechazado, todo debe animar
- `feedback_validate_before_deploy.md` — dev server + smoke test antes de cualquier commit/push
- `project_octogent_scaffold.md` — 8 tentacles + SRS/PRD baseline

---

## Verificación

```bash
npm run dev                              # Vite arranca en :3000 o :3001
curl -sS -o /dev/null -w "%{http_code}\n" http://localhost:3001/investor-landing.html
```

Smoke test manual:
1. Hard-reload `/investor-landing.html` (Cmd+Shift+R)
2. **Page load (sin scroll)**: hero mazorca grande y luminosa a la derecha del H1
3. **Scroll lento**: a ~p=0.20 la mazorca explota en partículas tri-color
4. **Mid scroll**: árbol crece, finca emerge, wind sway en canopy
5. **Scroll completo**: vista panorámica con cielo golden
6. **Toggle EN**: nav button → todos los textos UE deben swappear
7. **Reduced motion** (System Settings → Accessibility): canvas oculto, UE muestra valores finales sin animación

---

## Próximos frentes posibles

Polish que no se ha tocado:
- **Volumetric mist** stages 5-6 (depth atmosférico)
- **Pollinators** orbitando flores durante floración
- **DOF blur** simulado del grove durante closeups
- **Sparkline mini-charts** en UE cards
- **Color grading LUT** vía ShaderPass adicional
- **Sound design**: ya hay drum circle ceremonial en HTML (`window.__soundOn`), no integrado al narrative

Decisiones pendientes:
- ¿Three.js r128 → r16x? (desbloquea HDRI, addons modernos, módulos ES)
- ¿GLB de finca real o seguimos procedural? (`agroforest.glb` es placeholder de `build-placeholder-gltf.mjs`)
- ¿Sound on por default en hero?
- ¿Mobile experience? (actualmente 3D oculto < 768px por ui-ux-bar §4)
