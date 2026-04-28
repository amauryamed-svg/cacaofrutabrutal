// Caúa Investor — scroll-driven narrative
//   0.00 – 0.15  Mature cacao tree, branches full of green pods.
//                Light shafts pierce the canopy and pollen drifts in the beams.
//   0.15 – 0.25  ONE pod (the hero) ripens fast: green → orange, emissive boosts.
//   0.25 – 0.32  The hero pod detaches and falls in a parabola.
//   0.32 – 0.40  Lands on the ground and starts spinning, accelerating.
//   0.40 – 0.50  The spin becomes IMPLOSION: pod scales down, sky → black,
//                glints + light shafts get sucked into the vortex.
//   0.50 – 0.65  REVERSE growth: mature tree de-grows toward juvenile.
//   0.65 – 0.85  Juvenile → cotyledons → sprout.
//   0.85 – 1.00  Sprout → seed → ETHERIC ROOTS radiating purple+gold lines.
(async function () {
  const canvas = document.getElementById('gl-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  // Fetch the procedural tree spec. If it fails (or the builder didn't load),
  // we fall back to the legacy in-file tree generation later.
  let cacaoSpec = null;
  try {
    const r = await fetch('/cacao-tree-spec.json', { cache: 'force-cache' });
    if (r.ok) cacaoSpec = await r.json();
  } catch (_) { /* offline / dev — fall back below */ }

  // UI/UX Bar §3 — reduced-motion hard kill switch
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lowCore = (navigator.hardwareConcurrency || 4) < 4;
  if (reduceMotion || lowCore) { canvas.style.display = 'none'; return; }

  const isMobile = window.innerWidth < 768;
  const dprCap = isMobile ? 1.25 : 2;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, dprCap));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x081208);
  const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 8, 14);

  const bloomReady = !!(THREE.EffectComposer && THREE.RenderPass && THREE.UnrealBloomPass);
  let composer = null;
  let bloomPass = null;
  if (bloomReady) {
    composer = new THREE.EffectComposer(renderer);
    composer.setSize(window.innerWidth, window.innerHeight);
    composer.addPass(new THREE.RenderPass(scene, camera));
    bloomPass = new THREE.UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.0,    // strength — animated per frame
      0.55,   // radius
      0.62    // threshold
    );
    composer.addPass(bloomPass);
  }

  // Sky palette — kept dark throughout so copy reads cleanly. Only the implosion
  // climax + root realm get a touch of color; the rest sits near-black.
  const SKY_STOPS = [
    { p: 0.00, c: new THREE.Color(0x040804) },  // near-black, faint green hint
    { p: 0.10, c: new THREE.Color(0x060C06) },  // canopy ambient (still dark)
    { p: 0.20, c: new THREE.Color(0x0A0805) },  // warmth bleeds in as pod ripens
    { p: 0.32, c: new THREE.Color(0x080604) },  // dimming as pod falls
    { p: 0.40, c: new THREE.Color(0x040305) },  // pre-implosion charge
    { p: 0.48, c: new THREE.Color(0x000000) },  // VOID at peak implosion
    { p: 0.55, c: new THREE.Color(0x020104) },  // post-implosion subterranean dark
    { p: 0.70, c: new THREE.Color(0x05040A) },  // deep purple-black underground
    { p: 0.85, c: new THREE.Color(0x080612) },  // root realm, faint purple
    { p: 1.00, c: new THREE.Color(0x0E0820) },  // ethereal underground glow (capped)
  ];
  function updateSky(p) {
    let i = 1;
    while (i < SKY_STOPS.length && p > SKY_STOPS[i].p) i++;
    if (i >= SKY_STOPS.length) i = SKY_STOPS.length - 1;
    const a = SKY_STOPS[i - 1], b = SKY_STOPS[i];
    const t = clamp01((p - a.p) / (b.p - a.p));
    scene.background.copy(a.c).lerp(b.c, t);
  }

  // ── Utilities ──────────────────────────────────────────────────
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp01 = x => Math.max(0, Math.min(1, x));
  const smoothstep = (e0, e1, x) => {
    const t = clamp01((x - e0) / (e1 - e0));
    return t * t * (3 - 2 * t);
  };
  // Color lerp helper — mutates target Color in place.
  const COL_TMP_A = new THREE.Color();
  const COL_TMP_B = new THREE.Color();
  function colorLerp(out, hexA, hexB, t) {
    COL_TMP_A.setHex(hexA);
    COL_TMP_B.setHex(hexB);
    out.copy(COL_TMP_A).lerp(COL_TMP_B, t);
  }

  // ── Round flare texture (radial gradient) ──
  function makeFlareTexture() {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0.00, 'rgba(255,255,255,1)');
    g.addColorStop(0.20, 'rgba(255,238,200,0.85)');
    g.addColorStop(0.50, 'rgba(255,180,90,0.25)');
    g.addColorStop(1.00, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(c);
    tex.minFilter = THREE.LinearFilter;
    return tex;
  }
  const flareTex = makeFlareTexture();

  // ── Light shaft texture (vertical gradient) — used on plane shafts coming through canopy ──
  function makeShaftTexture() {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 256;
    const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0.00, 'rgba(255,235,180,0.78)');
    g.addColorStop(0.45, 'rgba(255,210,130,0.42)');
    g.addColorStop(1.00, 'rgba(255,180,90,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 256);
    const tex = new THREE.CanvasTexture(c);
    tex.minFilter = THREE.LinearFilter;
    return tex;
  }
  const shaftTex = makeShaftTexture();

  // ── Firefly texture — bright lime-green core with soft yellow-green halo ──
  function makeFireflyTexture() {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 64;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0.00, 'rgba(255, 255, 220, 1.00)');  // hot white core
    g.addColorStop(0.18, 'rgba(220, 255, 140, 0.85)');  // lime
    g.addColorStop(0.45, 'rgba(160, 220,  80, 0.30)');  // green halo
    g.addColorStop(0.78, 'rgba(120, 180,  50, 0.08)');
    g.addColorStop(1.00, 'rgba(120, 180,  50, 0.00)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(c);
    tex.minFilter = THREE.LinearFilter;
    return tex;
  }
  const sparkleTex = makeFireflyTexture();

  // ── Lights — DARKER overall so text reads cleanly over the bg.
  // Implosion lights still flash bright for the climax (handled in loop), but the
  // ambient/sun/rim/fill levels are kept low so the scene sits as moody backdrop.
  scene.add(new THREE.AmbientLight(0x0F1A0C, 0.32));
  const sun = new THREE.DirectionalLight(0xFFE5B0, 0.75);
  sun.position.set(6, 18, 5);
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0x4A6028, 0.32);
  rim.position.set(-8, 4, -6);
  scene.add(rim);
  const fill = new THREE.PointLight(0xE89A5E, 0.42, 32);
  fill.position.set(0, 4, 6);
  scene.add(fill);
  // Two roaming warm spot lights — drift through canopy giving dappled feel (dimmer)
  const roam1 = new THREE.PointLight(0xFFC880, 0.45, 14);
  roam1.position.set(2.5, 7, 3);
  scene.add(roam1);
  const roam2 = new THREE.PointLight(0xC85838, 0.30, 14);
  roam2.position.set(-2.8, 5.5, 2);
  scene.add(roam2);
  // Implosion light — anchored at hero-pod landing position, pulses during the implosion beat
  const implosionLight = new THREE.PointLight(0xFFC066, 0.0, 24);
  implosionLight.position.set(0, 1.4, 2.5);
  scene.add(implosionLight);
  // Secondary purple flare during implosion peak
  const implosionPurple = new THREE.PointLight(0x8D2679, 0.0, 18);
  implosionPurple.position.set(0, 1.4, 2.5);
  scene.add(implosionPurple);
  // Root-realm light — purple, only after implosion
  const rootLight = new THREE.PointLight(0x8D2679, 0.0, 14);
  rootLight.position.set(0, -1, 0);
  scene.add(rootLight);

  // ── Criollo pod geometry (reused) ──
  function profileR(v) {
    if (v <= 0.08) return 0.22 + 0.56 * Math.pow(v / 0.08, 0.55);
    if (v <= 0.38) return 0.78 + 0.24 * Math.sin(((v - 0.08) / 0.30) * Math.PI / 2);
    if (v <= 0.78) return 1.02 - 0.44 * ((v - 0.38) / 0.40);
    const t = (v - 0.78) / 0.22;
    return 0.58 * Math.pow(Math.max(0, 1 - t), 1.35);
  }
  function wartNoise(theta, v) {
    const a = Math.sin(theta * 19.0 + v * 41.0);
    const b = Math.cos(v * 29.0 + theta * 7.0);
    const c = Math.sin(theta * 11.3 - v * 17.7);
    return 0.028 * a * b + 0.018 * c * c;
  }
  function buildPodGeometry(segments, stacks) {
    const positions = [], indices = [];
    const H = 4.4;
    for (let j = 0; j <= stacks; j++) {
      const v = j / stacks;
      const y = 2.2 - H * v;
      const silhouette = profileR(v);
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        const ridgeWeight = Math.min(1, Math.sin(Math.PI * Math.min(v / 0.92, 1)) * 1.15);
        const ridgeMod = 1 + ridgeWeight * (0.085 * Math.cos(10 * theta) + 0.042 * Math.cos(5 * theta));
        const wart = 1 + wartNoise(theta, v) * (v > 0.05 && v < 0.95 ? 1 : 0.2);
        const r = silhouette * ridgeMod * wart;
        positions.push(r * Math.cos(theta), y, r * Math.sin(theta));
      }
    }
    for (let j = 0; j < stacks; j++) {
      for (let i = 0; i < segments; i++) {
        const a = j * (segments + 1) + i;
        const b = a + segments + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setIndex(indices);
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.computeVertexNormals();
    return geo;
  }
  // Pod color states
  const POD_GREEN_HEX     = 0x4A7028;  // immature green
  const POD_ORANGE_HEX    = 0xE8721C;  // ripe orange
  const POD_GREEN_EM_HEX  = 0x152008;
  const POD_ORANGE_EM_HEX = 0x6A2A06;

  function buildPod(scale, detail, hex) {
    const group = new THREE.Group();
    const [segs, stacks] = detail === 'hero' ? [80, 120] : [40, 64];
    const body = new THREE.Mesh(
      buildPodGeometry(segs, stacks),
      new THREE.MeshStandardMaterial({
        color: hex || POD_GREEN_HEX,
        emissive: POD_GREEN_EM_HEX,
        emissiveIntensity: 0.25,
        roughness: 0.6, metalness: 0.06,
      })
    );
    group.add(body);
    const ped = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.17, 0.55, 10),
      new THREE.MeshStandardMaterial({ color: 0x4A2A12, roughness: 0.95 })
    );
    ped.position.y = 2.48;
    group.add(ped);
    const calyx = new THREE.Mesh(
      new THREE.TorusGeometry(0.40, 0.07, 6, 16),
      new THREE.MeshStandardMaterial({
        color: 0x5A1E08, emissive: 0x2A0600, emissiveIntensity: 0.20, roughness: 0.9,
      })
    );
    calyx.rotation.x = Math.PI / 2;
    calyx.position.y = 2.10;
    group.add(calyx);
    group.scale.setScalar(scale);
    group.userData.body = body;  // expose for ripening color swap
    return group;
  }

  // ── Leaf geometry (shared) ──
  function buildLeafGeometry() {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.bezierCurveTo(0.20, 0.35, 0.45, 1.6, 0.18, 3.2);
    shape.bezierCurveTo(0.10, 3.55, 0, 3.65, 0, 3.7);
    shape.bezierCurveTo(0, 3.65, -0.10, 3.55, -0.18, 3.2);
    shape.bezierCurveTo(-0.45, 1.6, -0.20, 0.35, 0, 0);
    return new THREE.ShapeGeometry(shape, 14);
  }
  const LEAF_GEO = buildLeafGeometry();

  // ── Ground ──
  const groundGeo = new THREE.CircleGeometry(44, 96);
  const gpos = groundGeo.attributes.position;
  for (let i = 0; i < gpos.count; i++) {
    const x = gpos.getX(i), y = gpos.getY(i);
    const h = Math.sin(x * 0.18) * 0.45
            + Math.cos(y * 0.15) * 0.38
            + Math.sin(x * 0.5 + y * 0.3) * 0.12
            + Math.cos(x * 0.06) * 0.6;
    gpos.setZ(i, h);
  }
  groundGeo.computeVertexNormals();
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x2A1A0E, emissive: 0x0C0604, emissiveIntensity: 0.1,
    roughness: 1, metalness: 0, transparent: true, opacity: 1,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.05;
  scene.add(ground);

  // ── Light shafts (haces de luz) — vertical-ish planes pierce the canopy ──
  const lightShafts = new THREE.Group();
  const lightShaftMats = [];
  const SHAFT_DEFS = [
    { x: -4.5, z:  2.0, tilt:  0.42, scale: 1.10 },
    { x: -2.4, z:  3.2, tilt:  0.28, scale: 0.92 },
    { x: -0.5, z:  2.8, tilt:  0.10, scale: 1.05 },
    { x:  1.6, z:  2.6, tilt: -0.14, scale: 0.95 },
    { x:  3.0, z:  1.8, tilt: -0.28, scale: 1.20 },
    { x:  4.4, z:  0.6, tilt: -0.40, scale: 1.05 },
    { x: -3.0, z: -1.2, tilt:  0.18, scale: 0.88 },
    { x:  0.0, z: -1.8, tilt:  0.06, scale: 0.85 },
    { x:  2.6, z: -2.4, tilt: -0.22, scale: 0.95 },
  ];
  for (const def of SHAFT_DEFS) {
    const mat = new THREE.MeshBasicMaterial({
      map: shaftTex, color: 0xFFE5B0,
      transparent: true, opacity: 0.0,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    });
    const shaft = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 16), mat);
    shaft.position.set(def.x, 6, def.z);
    shaft.rotation.z = def.tilt;
    shaft.rotation.y = Math.atan2(def.x, def.z) * 0.5;
    shaft.scale.setScalar(def.scale);
    shaft.userData.base = { x: def.x, z: def.z, tilt: def.tilt };
    lightShafts.add(shaft);
    lightShaftMats.push(mat);
  }
  scene.add(lightShafts);

  // ── Fireflies (luciérnagas) — wandering lime-green sprites with personal blink cycles ──
  // Replaces the prior butterfly system. Each firefly drifts on a slow Lissajous-ish path
  // and has its own "blink" — a fast on/off envelope (sharp peak, long off) layered on a
  // slow base envelope. During the implosion (p ≥ 0.40) they curve toward HERO_LAND_POS.
  const glints = [];
  const FIREFLY_HUES = [0xC8FF7E, 0xA8FF60, 0xD8FF8E, 0xB8F070, 0xE0FFA0];
  const FIREFLY_DEFS = [
    { cx:  2.4, cy: 5.0, cz:  2.6, ax: 1.6, ay: 1.2, az: 0.9, freq: 0.20, phase: 0.0, scale: 0.34, blinkRate: 1.10, blinkPhase: 0.0 },
    { cx: -2.1, cy: 5.6, cz:  3.0, ax: 1.4, ay: 1.0, az: 1.1, freq: 0.24, phase: 1.6, scale: 0.30, blinkRate: 1.35, blinkPhase: 2.1 },
    { cx:  3.4, cy: 7.2, cz: -0.5, ax: 1.0, ay: 0.9, az: 1.4, freq: 0.18, phase: 3.1, scale: 0.40, blinkRate: 0.90, blinkPhase: 4.4 },
    { cx: -3.0, cy: 6.4, cz: -1.6, ax: 1.2, ay: 1.1, az: 1.0, freq: 0.22, phase: 4.5, scale: 0.28, blinkRate: 1.50, blinkPhase: 1.0 },
    { cx:  0.6, cy: 8.0, cz:  2.2, ax: 1.8, ay: 0.8, az: 0.9, freq: 0.16, phase: 5.8, scale: 0.36, blinkRate: 0.80, blinkPhase: 5.2 },
    { cx: -0.8, cy: 7.6, cz:  0.8, ax: 1.4, ay: 0.9, az: 1.2, freq: 0.26, phase: 2.4, scale: 0.30, blinkRate: 1.20, blinkPhase: 3.6 },
    { cx:  1.8, cy: 4.6, cz:  3.4, ax: 0.9, ay: 0.7, az: 0.8, freq: 0.30, phase: 0.8, scale: 0.26, blinkRate: 1.65, blinkPhase: 0.5 },
    { cx: -1.6, cy: 4.2, cz:  3.0, ax: 1.1, ay: 0.8, az: 0.7, freq: 0.28, phase: 3.7, scale: 0.28, blinkRate: 1.05, blinkPhase: 4.9 },
    { cx:  2.8, cy: 6.4, cz:  1.0, ax: 0.7, ay: 0.6, az: 0.6, freq: 0.34, phase: 5.1, scale: 0.24, blinkRate: 1.80, blinkPhase: 2.7 },
    { cx: -2.6, cy: 6.8, cz:  1.2, ax: 0.8, ay: 0.7, az: 0.7, freq: 0.32, phase: 1.2, scale: 0.26, blinkRate: 1.25, blinkPhase: 0.9 },
    { cx:  0.0, cy: 3.6, cz:  4.0, ax: 1.6, ay: 0.5, az: 0.6, freq: 0.20, phase: 2.8, scale: 0.32, blinkRate: 1.00, blinkPhase: 5.7 },
    { cx:  1.2, cy: 3.2, cz: -2.5, ax: 0.7, ay: 0.4, az: 1.1, freq: 0.36, phase: 4.0, scale: 0.22, blinkRate: 1.45, blinkPhase: 3.1 },
    { cx: -1.0, cy: 8.4, cz: -0.4, ax: 0.9, ay: 0.5, az: 0.8, freq: 0.24, phase: 0.4, scale: 0.30, blinkRate: 0.95, blinkPhase: 1.8 },
    { cx:  3.6, cy: 5.6, cz:  1.8, ax: 0.6, ay: 0.7, az: 0.5, freq: 0.40, phase: 5.6, scale: 0.22, blinkRate: 1.55, blinkPhase: 4.2 },
  ];
  for (let i = 0; i < FIREFLY_DEFS.length; i++) {
    const def = FIREFLY_DEFS[i];
    const hue = FIREFLY_HUES[i % FIREFLY_HUES.length];
    const mat = new THREE.SpriteMaterial({
      map: sparkleTex,
      color: hue,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.position.set(def.cx, def.cy, def.cz);
    sprite.scale.setScalar(def.scale);
    sprite.userData = { def, mat };
    scene.add(sprite);
    glints.push(sprite);
  }

  // ── Protagonist tree — hierarchical stage-gated sub-groups (used for REVERSE growth) ──
  const protagonist = new THREE.Group();
  scene.add(protagonist);

  // Stage 5 (final reverse): buried purple seed
  const seedBuriedMat = new THREE.MeshStandardMaterial({
    color: 0x8D2679, emissive: 0x5A1650, emissiveIntensity: 0.65,
    roughness: 0.45, metalness: 0.15, transparent: true, opacity: 0,
  });
  const seedBuried = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), seedBuriedMat);
  seedBuried.position.y = -0.05;
  protagonist.add(seedBuried);

  // Stage 4: sprout
  const sproutMat = new THREE.MeshStandardMaterial({
    color: 0x8A6820, emissive: 0x2A1A04, emissiveIntensity: 0.25,
    roughness: 0.7, transparent: true, opacity: 0,
  });
  const sprout = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.4, 6), sproutMat);
  sprout.position.y = 0.18;
  protagonist.add(sprout);

  // Stage 3: cotyledons
  const cotyledonMat = new THREE.MeshStandardMaterial({
    color: 0x6B8A28, emissive: 0x1A2A08, emissiveIntensity: 0.22,
    roughness: 0.8, side: THREE.DoubleSide, transparent: true, opacity: 0,
  });
  const cotyledonGroup = new THREE.Group();
  for (let i = 0; i < 2; i++) {
    const cot = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.55), cotyledonMat);
    cot.position.set(i === 0 ? -0.12 : 0.12, 0.4, 0);
    cot.rotation.z = i === 0 ? 0.55 : -0.55;
    cot.rotation.x = -Math.PI / 8;
    cotyledonGroup.add(cot);
  }
  protagonist.add(cotyledonGroup);

  // Stage 2: juvenile (stem + 4 small leaves)
  const juvenileMat = new THREE.MeshStandardMaterial({
    color: 0x4A3820, roughness: 0.9, transparent: true, opacity: 0,
  });
  const juvLeafMat = new THREE.MeshStandardMaterial({
    color: 0x8A6820, emissive: 0x2A1A04, emissiveIntensity: 0.3,
    roughness: 0.8, side: THREE.DoubleSide, transparent: true, opacity: 0,
  });
  const juvenileGroup = new THREE.Group();
  const juvStem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.08, 1.8, 6), juvenileMat);
  juvStem.position.y = 0.9;
  juvenileGroup.add(juvStem);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const leaf = new THREE.Mesh(LEAF_GEO, juvLeafMat);
    leaf.scale.setScalar(0.22);
    leaf.position.set(Math.cos(a) * 0.1, 0.85 + (i * 0.22), Math.sin(a) * 0.1);
    leaf.rotation.x = -Math.PI / 2;
    leaf.rotation.z = a;
    juvenileGroup.add(leaf);
  }
  protagonist.add(juvenileGroup);

  // Stage 1 (opening): MATURE tree — full size, visible from p=0
  // Two paths:
  //   (a) JSON-driven (preferred): cacao-tree-spec.json + window.CauaCacaoBuilder
  //   (b) Legacy in-file generation, kept as fallback if either is missing
  const mature = new THREE.Group();
  protagonist.add(mature);
  const useSpec = !!(cacaoSpec && window.CauaCacaoBuilder);
  let canopyLeaves = [];
  let podMaterials = [];
  let specPods = [];   // populated only on the spec path; carries { material, phase } for the loop
  const TRUNK_H = 12;  // legacy hero-pod attachment math depends on this; keep visible to both paths

  if (useSpec) {
    const tree = window.CauaCacaoBuilder.buildFromSpec(THREE, cacaoSpec, { archetype: 'mature', seed: 1 });
    // Builder uses metric units; scale up to match the legacy ~12-unit canopy
    const targetH = TRUNK_H;
    const specH = cacaoSpec.trunk.height_m;
    const sceneScale = targetH / specH;
    tree.scale.setScalar(sceneScale);
    mature.add(tree);
    canopyLeaves = tree.userData.leaves || [];
    specPods = tree.userData.pods || [];
    podMaterials = specPods.map(p => p.material);
    // eslint-disable-next-line no-console
    console.info(`[caua-3d] spec path active — ${specPods.length} pods, ${canopyLeaves.length} leaves, scale ${sceneScale.toFixed(2)}x`);
  } else {
    // eslint-disable-next-line no-console
    console.info('[caua-3d] legacy path (no spec or no builder)');
    const trunkGeo = new THREE.CylinderGeometry(0.55, 0.85, TRUNK_H, 20, 48);
    const tpos = trunkGeo.attributes.position;
    for (let i = 0; i < tpos.count; i++) {
      const x = tpos.getX(i), y = tpos.getY(i), z = tpos.getZ(i);
      const bark = Math.sin(y * 5.1) * 0.04 + Math.cos(y * 11 + x * 3.2) * 0.025
                 + Math.sin(y * 19 + z * 4.3) * 0.015;
      const ang = Math.atan2(z, x);
      const r0 = Math.sqrt(x * x + z * z);
      const nr = r0 + bark;
      tpos.setX(i, Math.cos(ang) * nr);
      tpos.setZ(i, Math.sin(ang) * nr);
    }
    trunkGeo.computeVertexNormals();
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x5A3620, emissive: 0x1A0A04, emissiveIntensity: 0.08,
      roughness: 0.95, metalness: 0, transparent: true, opacity: 1,
    });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = TRUNK_H / 2;
    mature.add(trunk);

    const branchMat = new THREE.MeshStandardMaterial({
      color: 0x4A2C18, roughness: 0.95, metalness: 0, transparent: true, opacity: 1,
    });
    const BRANCHES = [
      { y: TRUNK_H * 0.72, a: 0.5, len: 3.2, tilt: 0.8 },
      { y: TRUNK_H * 0.76, a: 2.4, len: 2.8, tilt: 0.9 },
      { y: TRUNK_H * 0.68, a: 4.1, len: 3.0, tilt: 0.75 },
      { y: TRUNK_H * 0.80, a: 5.9, len: 2.6, tilt: 0.95 },
    ];
    for (const b of BRANCHES) {
      const br = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.22, b.len, 8), branchMat);
      br.position.set(Math.cos(b.a) * 0.45, b.y, Math.sin(b.a) * 0.45);
      br.rotation.z = -Math.cos(b.a) * b.tilt;
      br.rotation.x = Math.sin(b.a) * b.tilt;
      br.translateY(b.len / 2);
      mature.add(br);
    }

    const canopyMat = new THREE.MeshStandardMaterial({
      color: 0x2E5820, emissive: 0x0A1A08, emissiveIntensity: 0.20,
      roughness: 0.75, metalness: 0.02, side: THREE.DoubleSide,
      transparent: true, opacity: 1,
    });
    function addCanopyCluster(cx, cy, cz, count) {
      for (let i = 0; i < count; i++) {
        const leaf = new THREE.Mesh(LEAF_GEO, canopyMat);
        const ang = Math.random() * Math.PI * 2;
        const rad = Math.random() * 0.8;
        leaf.position.set(cx + Math.cos(ang) * rad, cy + (Math.random() - 0.5) * 0.6, cz + Math.sin(ang) * rad);
        leaf.rotation.y = Math.random() * Math.PI * 2;
        const baseRotZ = (Math.random() - 0.5) * 0.9;
        leaf.rotation.z = baseRotZ;
        leaf.rotation.x = -Math.PI / 2 + (Math.random() - 0.5) * 0.4;
        leaf.scale.setScalar(0.55 + Math.random() * 0.45);
        leaf.userData = {
          baseRotZ,
          phase: Math.random() * Math.PI * 2,
          freq: 0.55 + Math.random() * 0.45,
          amp: 0.06 + Math.random() * 0.04,
        };
        canopyLeaves.push(leaf);
        mature.add(leaf);
      }
    }
    addCanopyCluster(0, TRUNK_H * 0.96, 0, 22);
    addCanopyCluster(1.5, TRUNK_H * 0.88, 0.8, 10);
    addCanopyCluster(-1.2, TRUNK_H * 0.85, -1.0, 10);
    addCanopyCluster(0.3, TRUNK_H * 0.78, 1.8, 8);
    for (const b of BRANCHES) {
      const tipX = Math.cos(b.a) * (0.45 + Math.sin(b.tilt) * b.len * 0.9);
      const tipY = b.y + Math.cos(b.tilt) * b.len * 0.9;
      const tipZ = Math.sin(b.a) * (0.45 + Math.sin(b.tilt) * b.len * 0.9);
      addCanopyCluster(tipX, tipY, tipZ, 8);
    }

    const podsGroup = new THREE.Group();
    const PODS_LAYOUT = [
      { y: TRUNK_H * 0.38, a: 0.3, s: 0.32 },
      { y: TRUNK_H * 0.27, a: 2.1, s: 0.28 },
      { y: TRUNK_H * 0.20, a: 4.4, s: 0.34 },
      { y: TRUNK_H * 0.10, a: 1.2, s: 0.30 },
      { y: TRUNK_H * 0.50, a: 3.5, s: 0.32 },
      { y: TRUNK_H * 0.60, a: 5.6, s: 0.28 },
      { y: TRUNK_H * 0.32, a: 5.0, s: 0.26 },
      { y: TRUNK_H * 0.45, a: 1.8, s: 0.30 },
    ];
    for (const c of PODS_LAYOUT) {
      const p = buildPod(c.s, 'low', POD_GREEN_HEX);
      const r = 0.68;
      p.position.set(Math.cos(c.a) * r, c.y, Math.sin(c.a) * r);
      p.rotation.y = c.a + Math.PI / 2;
      p.rotation.z = Math.cos(c.a) * 0.35;
      p.rotation.x = Math.sin(c.a) * 0.35;
      p.traverse(m => {
        if (m.material) {
          m.material = m.material.clone();
          m.material.transparent = true;
          m.material.opacity = 1;
          podMaterials.push(m.material);
        }
      });
      podsGroup.add(p);
    }
    mature.add(podsGroup);
  }

  // ── HERO POD — the one that ripens, falls, spins, implodes ──
  // Starts on a front-facing branch, visible from p=0. Has its own state machine.
  // Larger than other pods so the implosion is dramatic and clearly visible.
  const HERO_BRANCH_POS = { x: 1.2, y: TRUNK_H * 0.42, z: 1.0 };
  const heroPod = buildPod(0.62, 'hero', POD_GREEN_HEX);
  heroPod.position.set(HERO_BRANCH_POS.x, HERO_BRANCH_POS.y, HERO_BRANCH_POS.z);
  heroPod.rotation.z = -0.35;
  heroPod.rotation.x = 0.15;
  // Independent material so we can ripen color + emissive without affecting other pods
  const heroPodBody = heroPod.userData.body;
  heroPodBody.material = heroPodBody.material.clone();
  const heroPodMat = heroPodBody.material;
  heroPodMat.transparent = true;
  heroPodMat.opacity = 1;
  // Clone the rest of the meshes' materials too so heroPod is fully independent
  heroPod.traverse(m => {
    if (m.material && m !== heroPodBody) {
      m.material = m.material.clone();
      m.material.transparent = true;
      m.material.opacity = 1;
    }
  });
  scene.add(heroPod);

  // ── Logo bean — the magenta tilde from the Caúa logo, born into 3D.
  //    0.00-0.04 lives camera-anchored at the top-left of the viewport (mirrors the SVG bean),
  //    0.04-0.12 detaches and dives in a parabolic arc toward the hero pod,
  //    0.12-0.15 merges into the pod and fades out — "the logo seed becomes the cacao seed". ──
  const logoBeanCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.18,  0.04, 0),
    new THREE.Vector3(-0.05,  0.16, 0),
    new THREE.Vector3( 0.12,  0.10, 0),
    new THREE.Vector3( 0.18, -0.06, 0),
  ]);
  const logoBeanGeo = new THREE.TubeGeometry(logoBeanCurve, 36, 0.07, 16, false);
  const logoBeanMat = new THREE.MeshStandardMaterial({
    color: 0x911F70,            // matches .caua-bean SVG fill
    emissive: 0x911F70,
    emissiveIntensity: 0.55,
    roughness: 0.32,
    metalness: 0.08,
    transparent: true,
    opacity: 0,
  });
  const logoBean = new THREE.Mesh(logoBeanGeo, logoBeanMat);
  logoBean.userData.mat = logoBeanMat;
  scene.add(logoBean);
  // Reusable scratch vector to avoid per-frame GC
  const _logoBeanV = new THREE.Vector3();

  // ── Impact particles (when heroPod lands) ──
  const IMPACT_COUNT = 80;
  const impactGeo = new THREE.BufferGeometry();
  const impactPos = new Float32Array(IMPACT_COUNT * 3);
  const impactDir = new Float32Array(IMPACT_COUNT * 3);
  const impactCols = new Float32Array(IMPACT_COUNT * 3);
  for (let i = 0; i < IMPACT_COUNT; i++) {
    const a = Math.random() * Math.PI * 2;
    const tilt = Math.random() * 0.5 + 0.05;
    impactDir[i * 3]     = Math.cos(a) * Math.cos(tilt);
    impactDir[i * 3 + 1] = Math.sin(tilt) * 0.8;
    impactDir[i * 3 + 2] = Math.sin(a) * Math.cos(tilt);
    impactPos[i * 3]     = 0;
    impactPos[i * 3 + 1] = 0;
    impactPos[i * 3 + 2] = 0;
    // Mostly orange/gold, some purple flecks
    if (Math.random() < 0.7) {
      impactCols[i * 3] = 1.00; impactCols[i * 3 + 1] = 0.65; impactCols[i * 3 + 2] = 0.20;
    } else {
      impactCols[i * 3] = 0.62; impactCols[i * 3 + 1] = 0.22; impactCols[i * 3 + 2] = 0.55;
    }
  }
  impactGeo.setAttribute('position', new THREE.BufferAttribute(impactPos, 3));
  impactGeo.setAttribute('color', new THREE.BufferAttribute(impactCols, 3));
  const impactPoints = new THREE.Points(impactGeo, new THREE.PointsMaterial({
    map: flareTex, vertexColors: true, size: 0.32, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true, alphaTest: 0.01,
  }));
  scene.add(impactPoints);

  // Ground impact ring — flat torus that expands radially at landing
  const impactRing = new THREE.Mesh(
    new THREE.RingGeometry(0.6, 0.85, 64),
    new THREE.MeshBasicMaterial({
      color: 0xFFC066, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    })
  );
  impactRing.rotation.x = -Math.PI / 2;
  impactRing.position.set(0, 0.05, 2.5);
  scene.add(impactRing);

  // Lens flare sprites at the implosion epicenter — layered halos that flash at peak
  const lensFlare = new THREE.Group();
  const lensFlareMats = [];
  const flareLayerConfigs = [
    { size: 14, color: 0xFFE5B0, peak: 0.30 },
    { size: 9.5, color: 0xFFD080, peak: 0.45 },
    { size: 5.5, color: 0xFFC060, peak: 0.65 },
    { size: 2.6, color: 0xFFFFFF, peak: 0.95 },
  ];
  for (const cfg of flareLayerConfigs) {
    const m = new THREE.SpriteMaterial({
      map: flareTex, color: cfg.color, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const s = new THREE.Sprite(m);
    s.scale.set(cfg.size, cfg.size, 1);
    s.userData.peak = cfg.peak;
    lensFlare.add(s);
    lensFlareMats.push(m);
  }
  lensFlare.position.set(0, 1.4, 2.5);
  scene.add(lensFlare);

  // ── Implosion vortex sparkles (sucked-in particles around heroPod during 0.40-0.50) ──
  const VORTEX_COUNT = 120;
  const vortexGeo = new THREE.BufferGeometry();
  const vortexPos = new Float32Array(VORTEX_COUNT * 3);
  const vortexCols = new Float32Array(VORTEX_COUNT * 3);
  const vortexParams = [];
  for (let i = 0; i < VORTEX_COUNT; i++) {
    vortexParams.push({
      r: 1.0 + Math.random() * 3.5,
      tiltX: (Math.random() - 0.5) * 0.6,
      tiltZ: (Math.random() - 0.5) * 0.6,
      phase: Math.random() * Math.PI * 2,
      speed: 1.0 + Math.random() * 1.4,
    });
    vortexPos[i * 3] = 0; vortexPos[i * 3 + 1] = 0.5; vortexPos[i * 3 + 2] = 2.5;
    if (Math.random() < 0.5) {
      vortexCols[i * 3] = 1.00; vortexCols[i * 3 + 1] = 0.75; vortexCols[i * 3 + 2] = 0.30;
    } else {
      vortexCols[i * 3] = 0.85; vortexCols[i * 3 + 1] = 0.45; vortexCols[i * 3 + 2] = 0.85;
    }
  }
  vortexGeo.setAttribute('position', new THREE.BufferAttribute(vortexPos, 3));
  vortexGeo.setAttribute('color', new THREE.BufferAttribute(vortexCols, 3));
  const vortexPoints = new THREE.Points(vortexGeo, new THREE.PointsMaterial({
    map: flareTex, vertexColors: true, size: 0.42, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true, alphaTest: 0.01,
  }));
  scene.add(vortexPoints);

  // ── ETHERIC ROOTS — line segments radiating from origin downward + outward ──
  const ROOT_COUNT = 14;
  const ROOT_SEGS = 28;
  const rootsGroup = new THREE.Group();
  const rootMaterials = [];
  for (let r = 0; r < ROOT_COUNT; r++) {
    const angle = (r / ROOT_COUNT) * Math.PI * 2 + Math.random() * 0.2;
    // Each root: a curve descending from origin with a slight zigzag / branching
    const curve = [];
    let cx = 0, cy = 0, cz = 0;
    for (let s = 0; s <= ROOT_SEGS; s++) {
      const t = s / ROOT_SEGS;
      const radial = Math.pow(t, 0.7) * (3 + Math.random() * 2);
      const drop = Math.pow(t, 0.85) * (4 + Math.random() * 1.5);
      const wobble = Math.sin(t * 8 + r * 1.7) * 0.18 * t;
      cx = Math.cos(angle) * radial + wobble;
      cy = -drop;
      cz = Math.sin(angle) * radial + wobble * 0.6;
      curve.push(cx, cy, cz);
    }
    const positions = [];
    for (let s = 0; s < ROOT_SEGS; s++) {
      const i0 = s * 3, i1 = (s + 1) * 3;
      positions.push(curve[i0], curve[i0 + 1], curve[i0 + 2]);
      positions.push(curve[i1], curve[i1 + 1], curve[i1 + 2]);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    // Alternate purple / gold roots
    const isPurple = r % 2 === 0;
    const mat = new THREE.LineBasicMaterial({
      color: isPurple ? 0x8D2679 : 0x91A63B,
      transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const lines = new THREE.LineSegments(geo, mat);
    rootsGroup.add(lines);
    rootMaterials.push(mat);
  }
  scene.add(rootsGroup);

  // Subtle starfield (visible during void / implosion / underground beats)
  const starGeo = new THREE.BufferGeometry();
  const STAR_COUNT = 320;
  const starPosArr = new Float32Array(STAR_COUNT * 3);
  for (let i = 0; i < STAR_COUNT; i++) {
    starPosArr[i * 3]     = (Math.random() - 0.5) * 80;
    starPosArr[i * 3 + 1] = -10 + Math.random() * 35;
    starPosArr[i * 3 + 2] = -10 - Math.random() * 30;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPosArr, 3));
  const starMat = new THREE.PointsMaterial({
    color: 0xC8A8E8, size: 0.05, transparent: true, opacity: 0.0,
  });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  // ── Scroll / resize / IntersectionObserver ──
  const getProgress = () => {
    const pVar = getComputedStyle(document.documentElement).getPropertyValue('--p').trim();
    if (pVar) return clamp01(parseFloat(pVar) || 0);
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    return maxScroll > 0 ? clamp01(window.scrollY / maxScroll) : 0;
  };
  const getPd = () => {
    const v = getComputedStyle(document.documentElement).getPropertyValue('--pd').trim();
    return v ? clamp01(parseFloat(v) || 0) : 0;
  };

  // Hero intro video handoff
  const heroVideo = document.getElementById('hero-intro-video');
  let videoDismissed = false;
  const dismissHeroVideo = () => {
    if (videoDismissed || !heroVideo) return;
    videoDismissed = true;
    heroVideo.classList.add('fade-out');
    setTimeout(() => { try { heroVideo.pause(); heroVideo.remove(); } catch (_) {} }, 1300);
  };
  if (heroVideo) {
    heroVideo.addEventListener('ended', dismissHeroVideo);
    heroVideo.addEventListener('error', dismissHeroVideo);
    const earlyDismissCheck = () => {
      if (videoDismissed) return;
      if (getProgress() > 0.04) dismissHeroVideo();
      else requestAnimationFrame(earlyDismissCheck);
    };
    requestAnimationFrame(earlyDismissCheck);
  }

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    if (composer) {
      composer.setSize(window.innerWidth, window.innerHeight);
      if (bloomPass && bloomPass.resolution) {
        bloomPass.resolution.set(window.innerWidth, window.innerHeight);
      }
    }
  });
  let running = true;
  new IntersectionObserver((entries) => {
    const wasRunning = running;
    running = entries[0].isIntersecting;
    if (!wasRunning && running) loop();
  }, { threshold: 0 }).observe(canvas);

  // ── Camera paths — opens on canopy + tree, descends as pod falls, pulls out for reverse growth ──
  function cameraY(p) {
    if (p < 0.25) return lerp(8.0, 7.0, p / 0.25);            // canopy view, slight settle
    if (p < 0.40) return lerp(7.0, 3.5, (p - 0.25) / 0.15);   // descends following the falling pod
    if (p < 0.50) return lerp(3.5, 2.4, (p - 0.40) / 0.10);   // close on the spinning fruit
    if (p < 0.65) return lerp(2.4, 5.0, (p - 0.50) / 0.15);   // pulls back for reverse growth
    if (p < 0.85) return lerp(5.0, 3.5, (p - 0.65) / 0.20);   // closes on shrinking plant
    return lerp(3.5, 2.0, (p - 0.85) / 0.15);                 // intimate close on seed → roots
  }
  function cameraZ(p) {
    if (p < 0.25) return lerp(14.0, 12.0, p / 0.25);
    if (p < 0.40) return lerp(12.0, 8.0, (p - 0.25) / 0.15);
    if (p < 0.50) return lerp(8.0, 5.5, (p - 0.40) / 0.10);
    if (p < 0.65) return lerp(5.5, 11.0, (p - 0.50) / 0.15);
    if (p < 0.85) return lerp(11.0, 7.0, (p - 0.65) / 0.20);
    return lerp(7.0, 5.0, (p - 0.85) / 0.15);
  }
  function lookAtTarget(p) {
    if (p < 0.20) {
      // Look at the hero pod where it hangs on the branch
      const t = smoothstep(0, 0.20, p);
      return {
        x: lerp(0, HERO_BRANCH_POS.x * 0.5, t),
        y: lerp(7.0, HERO_BRANCH_POS.y, t),
        z: lerp(0, HERO_BRANCH_POS.z * 0.5, t),
      };
    }
    if (p < 0.50) {
      // Track the falling/spinning hero pod, dipping toward the ground
      const t = smoothstep(0.20, 0.50, p);
      return {
        x: lerp(HERO_BRANCH_POS.x * 0.5, 0, t),
        y: lerp(HERO_BRANCH_POS.y, 0.6, t),
        z: lerp(HERO_BRANCH_POS.z * 0.5, 2.5, t),
      };
    }
    // Reverse growth + roots — origin-locked, descends slightly
    const t = smoothstep(0.50, 1.0, p);
    return { x: 0, y: lerp(2.5, -0.4, t), z: 0 };
  }

  // ── Hero pod trajectory helpers ──
  // Hangs at HERO_BRANCH_POS during 0.00-0.25, falls to landing pos by 0.32,
  // then HOVERS above the ground while spinning + imploding (so it doesn't get lost in the ground).
  // Land y=1.4 keeps the pod elevated, fully visible against sky during the climax.
  const HERO_LAND_POS = { x: 0, y: 1.4, z: 2.5 };
  function heroPodPosition(p, t) {
    if (p < 0.25) {
      // Hanging — gentle wind sway
      return {
        x: HERO_BRANCH_POS.x + Math.sin(t * 0.6) * 0.04,
        y: HERO_BRANCH_POS.y + Math.cos(t * 0.5) * 0.02,
        z: HERO_BRANCH_POS.z,
      };
    }
    if (p < 0.32) {
      // Falling — parabolic ease (gravity-like)
      const u = smoothstep(0.25, 0.32, p);
      const arc = u * u;
      return {
        x: lerp(HERO_BRANCH_POS.x, HERO_LAND_POS.x, u),
        y: lerp(HERO_BRANCH_POS.y, HERO_LAND_POS.y, arc),
        z: lerp(HERO_BRANCH_POS.z, HERO_LAND_POS.z, u),
      };
    }
    // Landed — fixed at landing position with tiny vertical bob during spin
    const bob = Math.sin(t * 4) * 0.04 * smoothstep(0.32, 0.36, p) * (1 - smoothstep(0.42, 0.50, p));
    return { x: HERO_LAND_POS.x, y: HERO_LAND_POS.y + bob, z: HERO_LAND_POS.z };
  }

  // ── Render loop ──
  let t = 0;
  function loop() {
    if (!running) return;
    requestAnimationFrame(loop);
    t += 0.004;
    const p = getProgress();
    const pd = getPd();
    updateSky(p);

    // Camera
    const camY = cameraY(p);
    const camZ = cameraZ(p);
    const camX = Math.sin(t * 0.18) * 0.4;
    camera.position.set(camX, camY, camZ + Math.sin(t * 0.12) * 0.25);
    const la = lookAtTarget(p);
    camera.lookAt(la.x, la.y, la.z);
    // Force matrix flush — logoBean depends on camera.matrixWorld this frame
    camera.updateMatrixWorld(true);

    // ── Logo bean — the magenta tilde from the Caúa logo, born into 3D ──
    //    Phase 1 (p<0.04): camera-anchored at top-left of viewport, breathing pulse.
    //    Phase 2 (0.04<p<0.12): detaches, parabolic arc toward the hero pod, spinning.
    //    Phase 3 (0.12<p<0.15): merges into the pod and fades out. Hidden afterward.
    if (p < 0.15) {
      logoBean.visible = true;
      // Top-left camera-anchored position (computed each frame so it tracks camera sway)
      const aspect = window.innerWidth / window.innerHeight;
      const fov = camera.fov * Math.PI / 180;
      const dist = 4.5;
      const halfH = Math.tan(fov / 2) * dist;
      const halfW = halfH * aspect;
      _logoBeanV.set(-halfW * 0.78, halfH * 0.84, -dist);
      _logoBeanV.applyMatrix4(camera.matrixWorld);

      if (p < 0.04) {
        // Phase 1 — anchored at the logo screen position
        logoBean.position.copy(_logoBeanV);
        logoBean.quaternion.copy(camera.quaternion);
        // Tilt the bean a touch so it reads as the SVG comma when face-on
        logoBean.rotateZ(0.55 + Math.sin(t * 0.8) * 0.18);
        logoBean.rotateY(0.25 + Math.sin(t * 0.6) * 0.10);
        const fadeIn = smoothstep(0, 0.02, p);
        const breath = 1 + 0.08 * Math.sin(t * 4.5);
        logoBean.scale.setScalar(0.85 * (0.6 + fadeIn * 0.4) * breath);
        logoBeanMat.opacity = fadeIn * 0.95;
        logoBeanMat.emissiveIntensity = 0.45 + 0.45 * (0.5 + 0.5 * Math.sin(t * 3.2));
      } else if (p < 0.12) {
        // Phase 2 — detach + parabolic dive toward the hero pod
        const seg = smoothstep(0.04, 0.12, p);
        const arc = Math.sin(seg * Math.PI) * 1.4;  // peak of arc mid-flight
        logoBean.position.set(
          lerp(_logoBeanV.x, HERO_BRANCH_POS.x, seg),
          lerp(_logoBeanV.y, HERO_BRANCH_POS.y, seg) + arc,
          lerp(_logoBeanV.z, HERO_BRANCH_POS.z, seg)
        );
        // Tumble during flight (independent of camera quaternion now)
        logoBean.rotation.x = t * 1.6;
        logoBean.rotation.y = t * 2.1;
        logoBean.rotation.z = 0.55 + t * 1.2;
        const swell = 1 + seg * 1.4;
        logoBean.scale.setScalar(0.85 * swell);
        logoBeanMat.opacity = 0.95;
        logoBeanMat.emissiveIntensity = 0.6 + seg * 0.6;
      } else {
        // Phase 3 — merge into the pod
        const merge = smoothstep(0.12, 0.15, p);
        logoBean.position.set(HERO_BRANCH_POS.x, HERO_BRANCH_POS.y, HERO_BRANCH_POS.z);
        logoBean.rotation.x = t * 2.4;
        logoBean.rotation.y = t * 3.1;
        logoBean.scale.setScalar(0.85 * (2.4 - merge * 2.2));
        logoBeanMat.opacity = 0.95 * (1 - merge);
        logoBeanMat.emissiveIntensity = 1.2 * (1 - merge);
      }
    } else if (logoBean.visible) {
      logoBean.visible = false;
    }

    // ── Mature tree visibility — present 0.00-0.50, fades during reverse growth 0.50-0.65 ──
    const matureAlpha = 1 - smoothstep(0.48, 0.62, p);
    // Path-agnostic: walk the mature subtree and fade every material the same way.
    mature.traverse(obj => {
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => { m.transparent = true; m.opacity = matureAlpha; });
        else { obj.material.transparent = true; obj.material.opacity = matureAlpha; }
      }
    });
    mature.visible = matureAlpha > 0.02;

    // Drive ripening color cycle on spec-built pods (legacy path skips — pods stay green).
    // Phase offsets are baked into pod.phase so pods ripen out-of-sync, mimicking the canopy.
    if (useSpec && specPods.length) {
      const cycleSpeed = 1 / cacaoSpec.pods.ripening_cycle.duration_seconds;
      const cycleT = (t * cycleSpeed) % 1;
      for (let i = 0; i < specPods.length; i++) {
        const pod = specPods[i];
        const r = window.CauaCacaoBuilder.ripeningColor(THREE, cacaoSpec, cycleT + pod.phase);
        pod.material.color.copy(r.color);
        pod.material.emissive.copy(r.color).multiplyScalar(r.emissive);
        pod.material.emissiveIntensity = r.emissive;
        pod.material.roughness = 1 - r.gloss * 0.6;
      }
    }

    // Mature scale — slight implosion suction effect 0.40-0.50
    const matureSuck = 1 - smoothstep(0.42, 0.50, p) * 0.25;
    mature.scale.setScalar(matureSuck);

    // Canopy leaf flutter (only while visible)
    if (matureAlpha > 0.02) {
      for (let i = 0; i < canopyLeaves.length; i++) {
        const u = canopyLeaves[i].userData;
        canopyLeaves[i].rotation.z = u.baseRotZ + Math.sin(t * u.freq + u.phase) * u.amp;
      }
    }

    // ── Light shafts — heightened: stronger peak, per-shaft flicker, breath, sway ──
    const shaftBase = (1 - smoothstep(0.42, 0.50, p));
    const shaftIntensity = 0.55 + smoothstep(0.18, 0.34, p) * 0.55;  // brighter peak (was 0.42 + 0.40)
    for (let i = 0; i < lightShafts.children.length; i++) {
      const s = lightShafts.children[i];
      const m = lightShaftMats[i];
      // Per-shaft flicker — three-octave sine for organic shimmer
      const flicker =
        0.86 +
        0.10 * Math.sin(t * 2.3 + i * 1.7) +
        0.06 * Math.sin(t * 4.1 + i * 0.9) +
        0.04 * Math.sin(t * 7.7 + i * 2.4);
      m.opacity = shaftBase * shaftIntensity * flicker;
      // Suction — shafts tilt and translate toward the impact point during implosion
      const suck = smoothstep(0.40, 0.50, p);
      const targetX = lerp(s.userData.base.x, HERO_LAND_POS.x, suck * 0.85);
      const targetZ = lerp(s.userData.base.z, HERO_LAND_POS.z, suck * 0.85);
      s.position.x = targetX + Math.sin(t * 0.4 + i) * 0.10;
      s.position.z = targetZ + Math.cos(t * 0.35 + i * 1.3) * 0.08;
      // Breathing scale + subtle horizontal sway
      const breathe = 1 + 0.06 * Math.sin(t * 0.9 + i * 0.6);
      s.scale.x = breathe;
      s.scale.y = (1 + suck * 0.4) * (1 + 0.04 * Math.sin(t * 1.4 + i));
      s.rotation.z = s.userData.base.tilt !== undefined
        ? s.userData.base.tilt + Math.sin(t * 0.5 + i * 0.8) * 0.04
        : Math.sin(t * 0.5 + i * 0.8) * 0.04;
    }

    // ── Fireflies — wandering with personal blink cycles, sucked into the vortex on implosion ──
    // Real fireflies blink: short bright flash, long dark gap. We model that as
    //   blink(t) = max(0, sin(rate * t + phase))^6
    // The ^6 makes the wave spike sharply — the firefly is "off" most of the time.
    const fireflyBase = (1 - smoothstep(0.42, 0.52, p));
    const fadeIn = smoothstep(0, 0.06, p);
    for (let gi = 0; gi < glints.length; gi++) {
      const f = glints[gi];
      const def = f.userData.def;
      const m = f.userData.mat;
      // Slow Lissajous wander
      const orbit = t * def.freq + def.phase;
      const px = def.cx + Math.sin(orbit)         * def.ax
                       + Math.sin(t * 0.32 + def.phase * 1.7) * 0.25;
      const py = def.cy + Math.sin(orbit * 0.6 + 0.6) * def.ay
                       + Math.sin(t * 0.45 + def.phase) * 0.22;
      const pz = def.cz + Math.cos(orbit * 1.1)   * def.az
                       + Math.cos(t * 0.28 + def.phase * 0.8) * 0.20;
      const suck = smoothstep(0.40, 0.50, p);
      f.position.x = lerp(px, HERO_LAND_POS.x, suck * 0.95);
      f.position.y = lerp(py, HERO_LAND_POS.y, suck * 0.95);
      f.position.z = lerp(pz, HERO_LAND_POS.z, suck * 0.95);
      // Asymmetric blink — sharp on, long off
      const wave = Math.sin(t * def.blinkRate + def.blinkPhase);
      const blink = wave > 0 ? Math.pow(wave, 6) : 0;
      // A subtle ambient floor (0.06) so they're not fully invisible between blinks
      const intensity = 0.06 + blink * 0.95;
      m.opacity = fireflyBase * fadeIn * intensity;
      // Scale slightly larger at the peak of a blink (light bloom illusion)
      const bloom = 1 + blink * 0.6;
      const shrink = 1 - suck * 0.6;
      f.scale.setScalar(def.scale * bloom * shrink);
    }

    // ── HERO POD — ripens, falls, spins, implodes ──
    // Visible 0.00-0.50 (then fully imploded)
    const heroPodAlpha = 1 - smoothstep(0.46, 0.50, p);
    heroPod.traverse(m => {
      if (m.material && m.material.opacity !== undefined) m.material.opacity = heroPodAlpha;
    });
    heroPod.visible = heroPodAlpha > 0.02;

    // Color ripening — green → orange across 0.15-0.25
    const ripen = smoothstep(0.15, 0.25, p);
    colorLerp(heroPodMat.color, POD_GREEN_HEX, POD_ORANGE_HEX, ripen);
    colorLerp(heroPodMat.emissive, POD_GREEN_EM_HEX, POD_ORANGE_EM_HEX, ripen);
    heroPodMat.emissiveIntensity = 0.25 + ripen * 0.6 + smoothstep(0.40, 0.48, p) * 0.8;

    // Position — branch hold → fall → land
    const hp = heroPodPosition(p, t);
    heroPod.position.set(hp.x, hp.y, hp.z);

    // Rotation — gentle while hanging, tumbling during fall, accelerating spin on land,
    // extreme spin during implosion
    if (p < 0.25) {
      heroPod.rotation.x = 0.15 + Math.sin(t * 0.5) * 0.04;
      heroPod.rotation.y = Math.sin(t * 0.3) * 0.12;
      heroPod.rotation.z = -0.35 + Math.cos(t * 0.45) * 0.03;
    } else if (p < 0.32) {
      const fall = smoothstep(0.25, 0.32, p);
      heroPod.rotation.x = 0.15 + fall * Math.PI * 1.5;
      heroPod.rotation.y = fall * Math.PI * 0.8;
      heroPod.rotation.z = -0.35 + fall * 0.5;
    } else {
      // Spin acceleration: starts gentle, ramps to vortex
      const spinPhase = smoothstep(0.32, 0.40, p);
      const vortexPhase = smoothstep(0.40, 0.50, p);
      const spinSpeed = 4 + spinPhase * 18 + Math.pow(vortexPhase, 1.3) * 80;
      heroPod.rotation.y = (p - 0.32) * spinSpeed * 5;
      heroPod.rotation.x = 0.15 + Math.sin(t * 2) * 0.08 - vortexPhase * 0.4;
      heroPod.rotation.z = -0.35 + vortexPhase * 0.6;
    }

    // Scale dramatic arc:
    //   landing micro-swell (1 → 1.18)
    //   pre-implosion EXPANSION (1.18 → 1.55) — pod swells, charged with energy
    //   implosion COLLAPSE (1.55 → 0) — sharp shrink to nothing
    const landSwell = 1 + smoothstep(0.32, 0.36, p) * 0.18;
    const preImplosionSwell = 1 + smoothstep(0.36, 0.43, p) * 0.32 * (1 - smoothstep(0.45, 0.50, p));
    const implosionShrink = 1 - smoothstep(0.45, 0.50, p);
    heroPod.scale.setScalar(0.62 * landSwell * preImplosionSwell * implosionShrink);

    // ── Impact particles — burst at landing, fade through implosion ──
    const impactBurst = smoothstep(0.32, 0.36, p);
    const impactDecay = 1 - smoothstep(0.40, 0.50, p);
    impactPoints.material.opacity = impactBurst * impactDecay;
    if (impactPoints.material.opacity > 0.02) {
      const ip = impactPoints.geometry.attributes.position;
      const radius = impactBurst * 3.0 * (1 - smoothstep(0.40, 0.50, p) * 0.8);
      for (let i = 0; i < IMPACT_COUNT; i++) {
        const dx = impactDir[i * 3];
        const dy = impactDir[i * 3 + 1];
        const dz = impactDir[i * 3 + 2];
        const r = radius * (1 + (i % 5) * 0.08);
        ip.setXYZ(i,
          HERO_LAND_POS.x + dx * r,
          HERO_LAND_POS.y + dy * r * 0.6,
          HERO_LAND_POS.z + dz * r);
      }
      ip.needsUpdate = true;
    }

    // ── Ground impact ring — expands radially at landing, fades through implosion ──
    const ringExpand = smoothstep(0.32, 0.42, p);
    const ringFade = 1 - smoothstep(0.44, 0.52, p);
    impactRing.material.opacity = ringExpand * ringFade * 0.85;
    impactRing.scale.setScalar(0.4 + ringExpand * 6.0);

    // ── Lens flare — peaks during implosion, layered halos ──
    const lensFlareIntensity =
      smoothstep(0.40, 0.46, p) * (1 - smoothstep(0.48, 0.55, p)) * 1.4 +
      smoothstep(0.34, 0.38, p) * (1 - smoothstep(0.40, 0.46, p)) * 0.5;  // mini-flare at landing
    for (let i = 0; i < lensFlareMats.length; i++) {
      const m = lensFlareMats[i];
      m.opacity = lensFlare.children[i].userData.peak * lensFlareIntensity;
    }
    lensFlare.rotation.z = t * 0.4;

    // ── Implosion vortex sparkles — spiral around heroPod during 0.40-0.50 ──
    const vortexAlpha = smoothstep(0.38, 0.42, p) * (1 - smoothstep(0.48, 0.52, p));
    vortexPoints.material.opacity = vortexAlpha;
    if (vortexAlpha > 0.02) {
      const vp = vortexPoints.geometry.attributes.position;
      const vortexProg = smoothstep(0.40, 0.50, p);
      const baseAngle = p * 12 + Math.pow(vortexProg, 1.1) * Math.PI * 5;
      const radiusScale = 1 - vortexProg * 0.92;
      for (let i = 0; i < VORTEX_COUNT; i++) {
        const o = vortexParams[i];
        const angle = o.phase + baseAngle * o.speed;
        const r = o.r * radiusScale;
        const ox = Math.cos(angle) * r;
        const oz = Math.sin(angle) * r;
        const oy = ox * o.tiltX + oz * o.tiltZ;
        vp.setXYZ(i,
          HERO_LAND_POS.x + ox,
          HERO_LAND_POS.y + oy,
          HERO_LAND_POS.z + oz);
      }
      vp.needsUpdate = true;
    }

    // Implosion lights — gold pulse + purple secondary flare for dramatic peak
    implosionLight.intensity = smoothstep(0.34, 0.46, p) * (1 - smoothstep(0.48, 0.55, p)) * 5.5;
    implosionPurple.intensity = smoothstep(0.40, 0.46, p) * (1 - smoothstep(0.48, 0.54, p)) * 3.5;

    // Roaming canopy lights — drift through scene during 0.00-0.40 (canopy + ripen + fall),
    // then converge on landing site during implosion 0.40-0.50.
    const roamPhase = t * 0.5;
    const roamSuck = smoothstep(0.40, 0.50, p);
    const roamFade = 1 - smoothstep(0.44, 0.55, p);
    const r1x = lerp(2.5 + Math.sin(roamPhase) * 1.6, HERO_LAND_POS.x, roamSuck);
    const r1y = lerp(7 + Math.cos(roamPhase * 0.7) * 1.0, HERO_LAND_POS.y, roamSuck);
    const r1z = lerp(3 + Math.cos(roamPhase) * 1.4, HERO_LAND_POS.z, roamSuck);
    roam1.position.set(r1x, r1y, r1z);
    roam1.intensity = (0.42 + Math.sin(t * 1.2) * 0.10) * roamFade + roamSuck * 1.0;
    const r2x = lerp(-2.8 + Math.cos(roamPhase * 0.8) * 1.4, HERO_LAND_POS.x, roamSuck);
    const r2y = lerp(5.5 + Math.sin(roamPhase * 0.6) * 0.8, HERO_LAND_POS.y, roamSuck);
    const r2z = lerp(2 + Math.sin(roamPhase * 1.1) * 1.6, HERO_LAND_POS.z, roamSuck);
    roam2.position.set(r2x, r2y, r2z);
    roam2.intensity = (0.28 + Math.cos(t * 1.5) * 0.08) * roamFade + roamSuck * 0.7;

    // ── Reverse growth stages: mature(done) → juvenile → cotyledons → sprout → seed ──
    // Juvenile: 0.50-0.68 (peaks ~0.58, fades to make room for cotyledons)
    const juvAlpha = smoothstep(0.50, 0.58, p) * (1 - smoothstep(0.66, 0.72, p));
    juvenileMat.opacity = juvAlpha;
    juvLeafMat.opacity = juvAlpha;
    const juvScale = lerp(1.4, 0.6, smoothstep(0.50, 0.72, p));
    juvenileGroup.scale.setScalar(juvScale);

    // Cotyledons: 0.66-0.82
    const cotAlpha = smoothstep(0.66, 0.72, p) * (1 - smoothstep(0.80, 0.86, p));
    cotyledonMat.opacity = cotAlpha;
    const cotScale = lerp(1.2, 0.6, smoothstep(0.66, 0.86, p));
    cotyledonGroup.scale.setScalar(cotScale);

    // Sprout: 0.78-0.90
    const sprAlpha = smoothstep(0.78, 0.84, p) * (1 - smoothstep(0.88, 0.94, p));
    sproutMat.opacity = sprAlpha;
    const sprScale = lerp(1.1, 0.4, smoothstep(0.78, 0.94, p));
    sprout.scale.setScalar(sprScale);

    // Seed (final): 0.86-1.00
    const seedAlpha = smoothstep(0.86, 0.92, p);
    seedBuriedMat.opacity = seedAlpha;
    seedBuried.position.y = lerp(0.18, -0.12, smoothstep(0.92, 1.0, p));
    seedBuried.scale.setScalar(1 + Math.sin(t * 1.6) * 0.08 * seedAlpha);

    // ── ETHERIC ROOTS — radiate from origin during 0.85-1.00 ──
    const rootAlpha = smoothstep(0.85, 0.95, p);
    for (let i = 0; i < rootMaterials.length; i++) {
      // Per-root pulse + stagger
      const stagger = (i % 5) * 0.02;
      const pulse = 0.7 + Math.sin(t * 1.3 + i * 0.4) * 0.3;
      rootMaterials[i].opacity = rootAlpha * pulse * (0.8 + (i % 3) * 0.08);
    }
    rootsGroup.visible = rootAlpha > 0.02;
    rootLight.intensity = rootAlpha * 1.4;

    // Stars — visible during void (0.45-0.60) and underground (0.85-1.0)
    const voidStars = smoothstep(0.45, 0.50, p) * (1 - smoothstep(0.58, 0.66, p)) * 0.8;
    const undergroundStars = smoothstep(0.82, 0.92, p) * 0.5;
    starMat.opacity = Math.max(voidStars, undergroundStars);

    // Render
    if (composer && bloomPass) {
      // Bloom narrative: subtle through opening, builds during ripening, peaks at implosion, holds for roots
      const bloomBase = 0.20 + smoothstep(0.15, 0.25, p) * 0.25;
      const bloomImplosion = smoothstep(0.40, 0.48, p) * (1 - smoothstep(0.50, 0.58, p)) * 1.0;
      const bloomRoots = smoothstep(0.85, 0.95, p) * 0.55;
      bloomPass.strength = Math.max(
        bloomBase * (1 - smoothstep(0.30, 0.45, p)),
        bloomImplosion,
        bloomRoots
      );
      composer.render();
    } else {
      renderer.render(scene, camera);
    }
  }
  loop();
})();
