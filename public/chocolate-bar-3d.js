// Chocolate bar — Three.js 3D model, v2.0 "puffy emoji" style.
//
// Spec source: ChocolateBarEmoji3D v2 JSON the user provided. Notable
// upgrades over v1:
//   - RoundedBoxGeometry (from three/addons) for both base and segments
//     → puffy emoji silhouette, no sharp corners.
//   - MeshPhysicalMaterial with clearcoat for glossy reflections.
//   - 3-light rig (key + fill + rim) for emoji-style soft lighting.
//   - Smoothed torn bands (quadraticCurveTo) for foil + wrapper edges
//     → drip/blob shapes instead of zigzag triangles.
//   - ShadowMaterial floor plane → catches contact shadow without showing
//     a visible ground (bar appears to float over the page).
//   - Camera FOV 28° + distance 16 → low distortion, emoji-like flatness.
//
// Public landing flavor (vs the standalone viewer the user authored):
//   - Transparent canvas → the dark page bg shows through.
//   - No OrbitControls / HUD — multi-axis auto-motion only.
//   - Honors `prefers-reduced-motion`: paints one static frame.

// Bare specifiers — resolved by the <script type="importmap"> in
// investor-landing.html. Both `three` and `three/addons/` need to be in
// the map; otherwise RoundedBoxGeometry's internal `import 'three'` fails.
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'

const SPEC = {
  // Camera: spec said FOV 28 + dist 16, but that clipped the 11.5-tall bar
  // top/bottom in our embedded canvas (no OrbitControls to zoom out). Wider
  // FOV + further distance keeps the emoji-flat look but fits the whole bar.
  camera: { fov: 36, position: [3, 2.5, 24], lookAt: [0, -0.5, 0] },
  lights: [
    { type: 'AmbientLight',     color: '#ffffff', intensity: 0.55 },
    { type: 'DirectionalLight', name: 'key',  color: '#ffffff', intensity: 1.40, position: [ 4, 8,  6], castShadow: true },
    { type: 'DirectionalLight', name: 'fill', color: '#fff3e0', intensity: 0.60, position: [-5, 3,  4] },
    { type: 'DirectionalLight', name: 'rim',  color: '#fff0d8', intensity: 0.40, position: [ 0, 4, -8] },
  ],
  materials: {
    chocolate: {
      color: '#a56b44', roughness: 0.45, metalness: 0.0,
      clearcoat: 0.4, clearcoatRoughness: 0.3, reflectivity: 0.3,
    },
    chocolate_top: {
      color: '#b87a52', roughness: 0.40, metalness: 0.0,
      clearcoat: 0.5, clearcoatRoughness: 0.25, reflectivity: 0.35,
    },
    wrapper_red: {
      color: '#d8312e', roughness: 0.35, metalness: 0.0,
      clearcoat: 0.7, clearcoatRoughness: 0.15, reflectivity: 0.5,
    },
    foil_silver: {
      color: '#b5b5b5', roughness: 0.55, metalness: 0.6,
      clearcoat: 0.2, clearcoatRoughness: 0.4,
    },
  },
}

// Drip-style torn edges. Each peak is a [x,y]; we walk them right-to-left
// using quadraticCurveTo with a control point lifted above the midpoint —
// gives the soft blob/drip silhouette of a wrapper torn open by hand.
const FOIL_PEAKS = [
  [ 3.05, 0.90], [ 2.55, 1.95], [ 2.05, 0.85], [ 1.55, 1.85],
  [ 1.05, 0.75], [ 0.55, 2.05], [ 0.05, 0.85], [-0.45, 1.90],
  [-0.95, 0.80], [-1.45, 1.70], [-1.95, 0.85], [-2.45, 1.60],
  [-2.95, 0.85],
]
const WRAPPER_PEAKS = [
  [ 3.10, -0.10], [ 2.70, 0.60], [ 2.30, -0.20], [ 1.85, 0.70],
  [ 1.40, -0.15], [ 0.95, 0.75], [ 0.50, -0.10], [ 0.05, 0.65],
  [-0.40, -0.15], [-0.85, 0.55], [-1.30, -0.20], [-1.75, 0.50],
  [-2.20, -0.10], [-2.65, 0.40], [-3.10, -0.15],
]

function makeSmoothedTornShape(halfWidth, bottomY, peaks, bulge = 0.18) {
  const shape = new THREE.Shape()
  shape.moveTo(-halfWidth, bottomY)
  shape.lineTo( halfWidth, bottomY)
  // Walk peaks (assume peaks[] is right-to-left already).
  shape.lineTo(peaks[0][0], peaks[0][1])
  for (let i = 1; i < peaks.length; i++) {
    const a = peaks[i - 1]
    const b = peaks[i]
    // Control point: midpoint X, Y lifted above the average for a soft arc.
    const cx = (a[0] + b[0]) / 2
    const cy = ((a[1] + b[1]) / 2) + bulge
    shape.quadraticCurveTo(cx, cy, b[0], b[1])
  }
  shape.lineTo(-halfWidth, bottomY)
  return shape
}

export function mountChocolateBar(container) {
  if (!container) return null

  const w0 = container.clientWidth  || 420
  const h0 = container.clientHeight || 600
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches

  // Renderer — alpha for transparent bg over the dark page + the radial glow.
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(w0, h0)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type    = THREE.PCFSoftShadowMap
  renderer.outputColorSpace  = THREE.SRGBColorSpace
  renderer.toneMapping       = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.setClearColor(0x000000, 0)
  container.appendChild(renderer.domElement)

  const scene = new THREE.Scene()

  const camera = new THREE.PerspectiveCamera(SPEC.camera.fov, w0 / h0, 0.1, 100)
  camera.position.set(...SPEC.camera.position)
  camera.lookAt(...SPEC.camera.lookAt)

  // Lights — 3 directional (key/fill/rim) + ambient.
  for (const L of SPEC.lights) {
    let light
    if (L.type === 'AmbientLight') {
      light = new THREE.AmbientLight(L.color, L.intensity)
    } else if (L.type === 'DirectionalLight') {
      light = new THREE.DirectionalLight(L.color, L.intensity)
      light.position.set(...L.position)
      if (L.castShadow) {
        light.castShadow = true
        light.shadow.mapSize.width  = 2048
        light.shadow.mapSize.height = 2048
        light.shadow.camera.near    = 0.5
        light.shadow.camera.far     = 30
        light.shadow.camera.left    = -10
        light.shadow.camera.right   = 10
        light.shadow.camera.top     = 10
        light.shadow.camera.bottom  = -10
        light.shadow.bias           = -0.0008
        light.shadow.radius         = 6
      }
    }
    if (light) scene.add(light)
  }

  // Materials — MeshPhysicalMaterial for clearcoat support (glossy emoji).
  const M = {}
  for (const [k, def] of Object.entries(SPEC.materials)) {
    const mat = new THREE.MeshPhysicalMaterial(def)
    if (k === 'wrapper_red' || k === 'foil_silver') mat.side = THREE.DoubleSide
    M[k] = mat
  }

  // Bar group — translated -0.5 in Y per spec, plus tiny initial rotation
  // for emoji-style 3/4 framing.
  const barGroup = new THREE.Group()
  barGroup.position.set(0, -0.5, 0)
  barGroup.rotation.y = -0.08
  scene.add(barGroup)

  // Base — RoundedBoxGeometry (puffy silhouette).
  const baseGeo = new RoundedBoxGeometry(6.0, 11.5, 1.4, 6, 0.45)
  const barBase = new THREE.Mesh(baseGeo, M.chocolate)
  barBase.castShadow    = true
  barBase.receiveShadow = true
  barGroup.add(barBase)

  // 6 raised segments — 3 cols × 2 rows on the upper half of the bar.
  const segGeo = new RoundedBoxGeometry(1.55, 1.55, 0.55, 5, 0.28)
  const segPositions = [
    [-1.85, 3.5, 0.85], [0, 3.5, 0.85], [1.85, 3.5, 0.85],
    [-1.85, 1.6, 0.85], [0, 1.6, 0.85], [1.85, 1.6, 0.85],
  ]
  for (const [x, y, z] of segPositions) {
    const seg = new THREE.Mesh(segGeo, M.chocolate_top)
    seg.position.set(x, y, z)
    seg.castShadow    = true
    seg.receiveShadow = true
    barGroup.add(seg)
  }

  // Inner silver foil — peaks asoman donde se rasgó el papel.
  const foilGeo = new THREE.ExtrudeGeometry(
    makeSmoothedTornShape(3.15, -6.0, FOIL_PEAKS, 0.30),
    { depth: 0.12, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 3, curveSegments: 24 },
  )
  const foilFront = new THREE.Mesh(foilGeo, M.foil_silver)
  foilFront.position.z = 0.78
  foilFront.receiveShadow = true
  barGroup.add(foilFront)

  const foilBack = new THREE.Mesh(foilGeo, M.foil_silver)
  foilBack.position.z = -0.78
  foilBack.rotation.y = Math.PI
  foilBack.receiveShadow = true
  barGroup.add(foilBack)

  // Red wrapper — drips más bajos que el foil → wrapper "debajo" del foil.
  const wrapperGeo = new THREE.ExtrudeGeometry(
    makeSmoothedTornShape(3.35, -6.2, WRAPPER_PEAKS, 0.18),
    { depth: 0.18, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 4, curveSegments: 32 },
  )
  const wrapperFront = new THREE.Mesh(wrapperGeo, M.wrapper_red)
  wrapperFront.position.z = 0.82
  wrapperFront.castShadow    = true
  wrapperFront.receiveShadow = true
  barGroup.add(wrapperFront)

  const wrapperBack = new THREE.Mesh(wrapperGeo, M.wrapper_red)
  wrapperBack.position.z = -0.82
  wrapperBack.rotation.y = Math.PI
  wrapperBack.castShadow = true
  barGroup.add(wrapperBack)

  // Shadow-only floor — invisible plane that catches the contact shadow so
  // the bar doesn't float disconnected. ShadowMaterial draws nothing else.
  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    new THREE.ShadowMaterial({ opacity: 0.18 }),
  )
  shadowPlane.rotation.x = -Math.PI / 2
  shadowPlane.position.y = -6.5
  shadowPlane.receiveShadow = true
  scene.add(shadowPlane)

  // Reduced motion → paint one frame, skip the rAF loop.
  if (reduceMotion) {
    renderer.render(scene, camera)
  } else {
    // Multi-axis choreography for the "fully 3D viewing experience":
    //   Y rotation: continuous (~12 s/turn)              ─ shows every face
    //   X oscillation: ±0.18 rad over 7 s                 ─ tilts up/down
    //   Y bob:        ±0.35 units over 5 s                ─ float
    //   Z bob:        ±0.18 units over 6 s                ─ depth pulse
    //   Tone exposure ramp                                ─ ambient breathing
    let raf = 0
    let t = 0
    const baseY = -0.5
    const tick = () => {
      t += 0.016
      barGroup.rotation.y += 0.009
      barGroup.rotation.x = Math.sin(t * 0.9)  * 0.18
      barGroup.position.y = baseY + Math.sin(t * 1.25) * 0.35
      barGroup.position.z =          Math.sin(t * 1.05) * 0.18
      renderer.toneMappingExposure = 1.05 + Math.sin(t * 1.6) * 0.06
      renderer.render(scene, camera)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    // Pause when tab is hidden so we don't burn cycles.
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) cancelAnimationFrame(raf)
      else raf = requestAnimationFrame(tick)
    })
  }

  // Resize handler.
  const onResize = () => {
    const w = container.clientWidth, h = container.clientHeight
    if (w === 0 || h === 0) return
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
  }
  const ro = new ResizeObserver(onResize)
  ro.observe(container)
  window.addEventListener('resize', onResize, { passive: true })

  return { renderer, scene, camera, barGroup }
}
