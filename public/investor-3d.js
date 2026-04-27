// Caúa Investor — scroll-driven narrative
//   0.00 – 0.10  Sustained — divine mazorca glows, halo pulses, sky warm
//   0.10 – 0.13  Charge-up — micro-swell, emissive over-charges (last gasp)
//   0.13 – 0.21  VORTEX collapse — accelerated spin, scale → 0, sky → black, light absorbed
//   0.21 – 0.225 VOID — total darkness, particles at zero radius, bloom = 0
//   0.225 – 0.32 EXPLOSION — radial burst unleash, bloom flash, sky re-warms, camera rips back
//   0.32 – 0.55  Finca emerges — grove fades in, sprout grows
//   0.55 – 0.80  Tree maturation — trunk, branches, canopy
//   0.80 – 1.00  Mature ecosystem — flowers + pods + golden hour
// Finca grove (instanced cacaos + banano + mango) is background context through stages 1-8,
// fades for the divine closeup.
(function () {
  const canvas = document.getElementById('gl-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  // UI/UX Bar §3 — reduced-motion hard kill switch
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Skip on truly low-core hosts (rare); always render for mobile/desktop with motion enabled.
  // The original ui-ux-bar §4 mobile gate hid the canvas on < 768px viewports — relaxed because
  // the divine mazorca header hook needs to be visible on every device.
  const lowCore = (navigator.hardwareConcurrency || 4) < 4;
  if (reduceMotion || lowCore) { canvas.style.display = 'none'; return; }

  const isMobile = window.innerWidth < 768;
  const dprCap = isMobile ? 1.25 : 2;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, dprCap));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0A0518);   // cosmic void — overwritten per frame by updateSky()
  const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 10, 12);

  // Post-processing for the divine reveal — UnrealBloomPass driven by --pd.
  // Falls back to plain renderer.render if addons failed to load (graceful degradation).
  const bloomReady = !!(THREE.EffectComposer && THREE.RenderPass && THREE.UnrealBloomPass);
  let composer = null;
  let bloomPass = null;
  if (bloomReady) {
    composer = new THREE.EffectComposer(renderer);
    composer.setSize(window.innerWidth, window.innerHeight);
    composer.addPass(new THREE.RenderPass(scene, camera));
    bloomPass = new THREE.UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.0,    // strength — animated per frame from pd
      0.55,   // radius
      0.62    // threshold — only bright (emissive / additive) pixels bloom
    );
    composer.addPass(bloomPass);
  }

  // Sky palette — dark-space-first arc.
  //   Mazorca arrives from the cosmic void → light gathers → vortex collapses → BLACK void → explosion flash → warm dawn.
  // Most stops kept dark (#000–#0A) so captions read clearly; warm tones reserved for the climactic moments.
  const SKY_STOPS = [
    { p: 0.00, c: new THREE.Color(0x000000) },  // pure cosmic void — mazorca arrives from here
    { p: 0.05, c: new THREE.Color(0x040203) },  // still deep dark, faint approach
    { p: 0.10, c: new THREE.Color(0x0A0506) },  // light gathers around mazorca (very subtle)
    { p: 0.16, c: new THREE.Color(0x100806) },  // building, but still mostly black
    { p: 0.21, c: new THREE.Color(0x000000) },  // VOID — total darkness swallows everything
    { p: 0.225, c: new THREE.Color(0x000000) }, // hold the void for a beat
    { p: 0.28, c: new THREE.Color(0x140A06) },  // explosion ignites — warmth returns
    { p: 0.40, c: new THREE.Color(0x0E0704) },  // settles dark again after the burst dissipates
    { p: 0.55, c: new THREE.Color(0x130A06) },  // dawn earth as finca emerges (still dark)
    { p: 0.80, c: new THREE.Color(0x1E1208) },  // golden hour, restrained
    { p: 1.00, c: new THREE.Color(0x251610) },  // dusk warm, capped
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

  // ── Round flare texture — radial gradient on a CanvasTexture, used for sparkles + lens flares ──
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

  // ── Lights — reduced to keep dark space readable behind copy ──
  scene.add(new THREE.AmbientLight(0x140A06, 0.30));            // was 0x2a1810 / 0.55
  const sun = new THREE.DirectionalLight(0xFFC888, 0.85);       // was 1.55
  sun.position.set(4, 14, 6);
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0x8D2679, 0.35);       // was 0.55
  rim.position.set(-6, -2, -4);
  scene.add(rim);
  const fill = new THREE.PointLight(0xE89A5E, 0.55, 28);        // was 0.95
  fill.position.set(0, 2, 5);
  scene.add(fill);
  const earthGlow = new THREE.PointLight(0xD86028, 0.4, 14);    // was 0.6
  earthGlow.position.set(0, 2, 2);
  scene.add(earthGlow);
  // Seed halo — moves with the descending purple seed, extinguishes post-germination
  const seedLight = new THREE.PointLight(0x8D2679, 0.0, 12);
  seedLight.position.set(0, 14, 0);
  scene.add(seedLight);

  // ── Criollo pod geometry (reused for stage-8 pods + hero divine mazorca) ──
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
  function buildPod(scale, detail) {
    const group = new THREE.Group();
    const [segs, stacks] = detail === 'hero' ? [96, 140] : [40, 64];
    const body = new THREE.Mesh(
      buildPodGeometry(segs, stacks),
      new THREE.MeshStandardMaterial({
        color: 0xC24820, emissive: 0x3A1208, emissiveIntensity: 0.28,
        roughness: 0.58, metalness: 0.08,
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
        color: 0x5A1E08, emissive: 0x2A0600, emissiveIntensity: 0.25, roughness: 0.9,
      })
    );
    calyx.rotation.x = Math.PI / 2;
    calyx.position.y = 2.10;
    group.add(calyx);
    for (let i = 0; i < 5; i++) {
      const sepal = new THREE.Mesh(
        new THREE.ConeGeometry(0.08, 0.28, 5),
        new THREE.MeshStandardMaterial({ color: 0x3A0F04, roughness: 0.95 })
      );
      const a = (i / 5) * Math.PI * 2;
      sepal.position.set(Math.cos(a) * 0.40, 2.15, Math.sin(a) * 0.40);
      sepal.rotation.z = Math.cos(a) * 0.6;
      sepal.rotation.x = Math.sin(a) * 0.6;
      group.add(sepal);
    }
    group.scale.setScalar(scale);
    return group;
  }

  // ── Leaf geometry + shared materials (reused across growth stages) ──
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

  // ── Ground — expanded for finca context ───────────────────────
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
  const ground = new THREE.Mesh(groundGeo, new THREE.MeshStandardMaterial({
    color: 0x2A1A0E, emissive: 0x0C0604, emissiveIntensity: 0.1,
    roughness: 1, metalness: 0,
  }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.05;
  scene.add(ground);

  // ── Finca grove (instanced background cacaos + shade trees) ────
  const grove = new THREE.Group();
  const bgTrunkGeo = new THREE.CylinderGeometry(0.24, 0.42, 8, 8, 4);
  (function displaceBgTrunk() {
    const p = bgTrunkGeo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const ang = Math.atan2(z, x);
      const r0 = Math.sqrt(x * x + z * z);
      const nr = r0 + Math.sin(y * 4.5) * 0.035 + Math.cos(y * 11 + ang * 3) * 0.02;
      p.setX(i, Math.cos(ang) * nr);
      p.setZ(i, Math.sin(ang) * nr);
    }
    bgTrunkGeo.computeVertexNormals();
  })();
  const bgTrunkMat = new THREE.MeshStandardMaterial({
    color: 0x4A2D1A, emissive: 0x120804, emissiveIntensity: 0.06, roughness: 0.95,
  });
  const bgCanopyGeo = new THREE.IcosahedronGeometry(1.7, 1);
  (function displaceBgCanopy() {
    const p = bgCanopyGeo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const d = 1 + (Math.sin(x * 2.8) + Math.cos(y * 2.2) + Math.sin(z * 3.4)) * 0.085;
      p.setXYZ(i, x * d, y * d, z * d);
    }
    bgCanopyGeo.computeVertexNormals();
  })();
  const bgCanopyMat = new THREE.MeshStandardMaterial({
    color: 0x1E3E14, emissive: 0x051005, emissiveIntensity: 0.14,
    roughness: 0.82, metalness: 0,
  });

  const BG_TREES = [];
  for (let row = 0; row < 4; row++) {
    const z = -12 - row * 6;
    const count = 4 + row;
    for (let i = 0; i < count; i++) {
      const x = -((count - 1) * 2.6) / 2 + i * 2.6 + (Math.sin(row * 7 + i * 3) * 0.5);
      BG_TREES.push({
        x, z,
        yJit: Math.sin(row * 11 + i * 5) * 0.25,
        scale: 0.85 + ((row * 3 + i) % 5) * 0.09,
      });
    }
  }
  const bgTrunks = new THREE.InstancedMesh(bgTrunkGeo, bgTrunkMat, BG_TREES.length);
  const bgCanopies = new THREE.InstancedMesh(bgCanopyGeo, bgCanopyMat, BG_TREES.length);
  const _dummy = new THREE.Object3D();
  BG_TREES.forEach((t, idx) => {
    _dummy.position.set(t.x, t.yJit + 2.4, t.z);
    _dummy.rotation.y = (idx * 0.73) % (Math.PI * 2);
    _dummy.scale.setScalar(t.scale);
    _dummy.updateMatrix();
    bgTrunks.setMatrixAt(idx, _dummy.matrix);

    _dummy.position.set(t.x, t.yJit + 6.4, t.z);
    _dummy.rotation.y = (idx * 1.31) % (Math.PI * 2);
    _dummy.scale.setScalar(t.scale * (0.92 + ((idx * 5) % 7) * 0.04));
    _dummy.updateMatrix();
    bgCanopies.setMatrixAt(idx, _dummy.matrix);
  });
  grove.add(bgTrunks, bgCanopies);

  function buildMango(scale) {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.34, 5.0, 8),
      new THREE.MeshStandardMaterial({ color: 0x3A2414, roughness: 0.95 })
    );
    trunk.position.y = 2.5;
    g.add(trunk);
    const canopyGeo = new THREE.SphereGeometry(2.2, 14, 10);
    const cp = canopyGeo.attributes.position;
    for (let i = 0; i < cp.count; i++) {
      const x = cp.getX(i), y = cp.getY(i), z = cp.getZ(i);
      const d = 1 + (Math.sin(x * 2) + Math.cos(y * 1.5) + Math.sin(z * 2.3)) * 0.09;
      cp.setXYZ(i, x * d, y * d, z * d);
    }
    canopyGeo.computeVertexNormals();
    const canopy = new THREE.Mesh(canopyGeo, new THREE.MeshStandardMaterial({
      color: 0x1A3010, emissive: 0x041208, emissiveIntensity: 0.16, roughness: 0.85,
    }));
    canopy.position.y = 6.2;
    g.add(canopy);
    g.scale.setScalar(scale);
    return g;
  }
  function buildBanana(scale) {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.24, 4.0, 8),
      new THREE.MeshStandardMaterial({ color: 0x4A3820, roughness: 0.9 })
    );
    trunk.position.y = 2.0;
    g.add(trunk);
    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x2E5820, emissive: 0x0A1A08, emissiveIntensity: 0.2,
      roughness: 0.8, side: THREE.DoubleSide,
    });
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 3.0), leafMat);
      leaf.position.set(Math.cos(a) * 0.3, 4.2 + Math.sin(i) * 0.25, Math.sin(a) * 0.3);
      leaf.rotation.y = a;
      leaf.rotation.z = 0.4 + Math.sin(i * 1.7) * 0.18;
      g.add(leaf);
    }
    g.scale.setScalar(scale);
    return g;
  }
  const SHADE_POS = [
    { type: 'mango',  x: -8,   z: -10, s: 1.1 },
    { type: 'mango',  x:  9,   z: -14, s: 1.0 },
    { type: 'mango',  x: -10,  z: -22, s: 1.25 },
    { type: 'banana', x: -3.5, z:  -8, s: 0.95 },
    { type: 'banana', x:  5,   z: -11, s: 1.05 },
    { type: 'banana', x:  11,  z: -24, s: 1.15 },
    { type: 'banana', x: -14,  z: -17, s: 1.0 },
  ];
  SHADE_POS.forEach((p) => {
    const m = p.type === 'mango' ? buildMango(p.s) : buildBanana(p.s);
    m.position.set(p.x, 0, p.z);
    m.rotation.y = (p.x * 0.3 + p.z * 0.17);
    grove.add(m);
  });
  scene.add(grove);

  const groveMaterials = [];
  grove.traverse((c) => {
    if ((c.isMesh || c.isInstancedMesh) && c.material) {
      c.material.transparent = true;
      if (!groveMaterials.includes(c.material)) groveMaterials.push(c.material);
    }
  });

  // ── Protagonist tree — hierarchical stage-gated sub-groups ─────
  const protagonist = new THREE.Group();
  scene.add(protagonist);

  // Stage 1-2: buried purple seed (visible during landing + early germination)
  const seedBuriedMat = new THREE.MeshStandardMaterial({
    color: 0x8D2679, emissive: 0x5A1650, emissiveIntensity: 0.55,
    roughness: 0.45, metalness: 0.15, transparent: true, opacity: 0,
  });
  const seedBuried = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), seedBuriedMat);
  seedBuried.position.y = -0.05;
  protagonist.add(seedBuried);

  // Stage 2-3: sprout tip
  const sproutMat = new THREE.MeshStandardMaterial({
    color: 0x8A6820, emissive: 0x2A1A04, emissiveIntensity: 0.25,
    roughness: 0.7, transparent: true, opacity: 0,
  });
  const sprout = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.4, 6), sproutMat);
  sprout.position.y = 0.18;
  protagonist.add(sprout);

  // Stage 3-4: cotyledons (two first leaves)
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

  // Stage 4-5: juvenile (stem + 4 small leaves)
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

  // Stages 5-8: mature tree — grouped so it scales as a unit
  const mature = new THREE.Group();
  protagonist.add(mature);

  const TRUNK_H = 12;
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
    roughness: 0.95, metalness: 0, transparent: true, opacity: 0,
  });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = TRUNK_H / 2;
  mature.add(trunk);

  // Branches
  const branchMat = new THREE.MeshStandardMaterial({
    color: 0x4A2C18, roughness: 0.95, metalness: 0, transparent: true, opacity: 0,
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

  // Canopy leaves
  const canopyMat = new THREE.MeshStandardMaterial({
    color: 0x2E5820, emissive: 0x0A1A08, emissiveIntensity: 0.18,
    roughness: 0.75, metalness: 0.02, side: THREE.DoubleSide,
    transparent: true, opacity: 0,
  });
  const canopyLeaves = [];
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
  addCanopyCluster(0, TRUNK_H * 0.96, 0, 18);
  addCanopyCluster(1.5, TRUNK_H * 0.88, 0.8, 8);
  addCanopyCluster(-1.2, TRUNK_H * 0.85, -1.0, 8);
  addCanopyCluster(0.3, TRUNK_H * 0.78, 1.8, 6);
  for (const b of BRANCHES) {
    const tipX = Math.cos(b.a) * (0.45 + Math.sin(b.tilt) * b.len * 0.9);
    const tipY = b.y + Math.cos(b.tilt) * b.len * 0.9;
    const tipZ = Math.sin(b.a) * (0.45 + Math.sin(b.tilt) * b.len * 0.9);
    addCanopyCluster(tipX, tipY, tipZ, 6);
  }

  // Flowers (cauliflory — small pink-white emissive spheres on trunk + branches)
  const flowerMat = new THREE.MeshStandardMaterial({
    color: 0xF8D8D0, emissive: 0xD86878, emissiveIntensity: 0.4,
    roughness: 0.5, transparent: true, opacity: 0,
  });
  const flowersGroup = new THREE.Group();
  for (let i = 0; i < 22; i++) {
    const ang = (i / 22) * Math.PI * 2 + Math.random() * 0.2;
    const y = 1.8 + Math.random() * (TRUNK_H * 0.65);
    const flower = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), flowerMat);
    flower.position.set(Math.cos(ang) * 0.68, y, Math.sin(ang) * 0.68);
    flowersGroup.add(flower);
  }
  mature.add(flowersGroup);

  // Pods — 6 cauliflorous pods spawn from the most prominent flower positions
  const podsGroup = new THREE.Group();
  const CAULI_LAYOUT = [
    { y: TRUNK_H * 0.38, a: 0.3, s: 0.26 },
    { y: TRUNK_H * 0.27, a: 2.1, s: 0.22 },
    { y: TRUNK_H * 0.20, a: 4.4, s: 0.28 },
    { y: TRUNK_H * 0.10, a: 1.2, s: 0.25 },
    { y: TRUNK_H * 0.50, a: 3.5, s: 0.27 },
    { y: TRUNK_H * 0.60, a: 5.6, s: 0.24 },
  ];
  const podMaterials = [];
  for (const c of CAULI_LAYOUT) {
    const p = buildPod(c.s, 'low');
    const r = 0.68;
    p.position.set(Math.cos(c.a) * r, c.y, Math.sin(c.a) * r);
    p.rotation.y = c.a + Math.PI / 2;
    p.rotation.z = Math.cos(c.a) * 0.35;
    p.rotation.x = Math.sin(c.a) * 0.35;
    p.traverse(m => {
      if (m.material) {
        m.material = m.material.clone();
        m.material.transparent = true;
        m.material.opacity = 0;
        podMaterials.push(m.material);
      }
    });
    podsGroup.add(p);
  }
  mature.add(podsGroup);

  // Hero mazorca — header hook visual. Lives at top-level scene (independent of `mature`
  // group scale) so it's full-size + prominent the moment the page loads.
  // Forward + slightly right of center so it sits to the right of the H1 in section 01.
  const HERO_POS = { x: 1.4, y: 5.6, z: 4.0 };
  const heroMazorca = buildPod(1.0, 'hero');
  heroMazorca.position.set(HERO_POS.x, HERO_POS.y, HERO_POS.z);
  heroMazorca.rotation.y = 1.2;
  heroMazorca.rotation.z = 0.2;
  const heroMazorcaMats = [];
  heroMazorca.traverse(m => {
    if (m.material) {
      m.material = m.material.clone();
      m.material.transparent = true;
      m.material.opacity = 1;        // visible from page load
      heroMazorcaMats.push(m.material);
    }
  });
  scene.add(heroMazorca);

  // ── Divine reveal FX (round flares + aura + radial burst + orbiting sparkles) ─────────────
  // Note: flares/aura/sparkles live OUTSIDE `mature` so they aren't scaled during growth.
  // ROUND flares replace the old cylinder (which read as a square shaft) — Sprite billboards
  // with a radial-gradient texture always face the camera and look like soft light bursts.
  const divineRays = new THREE.Group();
  const divineRayMats = [];
  // 5 stacked sprites of varying sizes give a layered "lens flare" feel without clipping
  const flareConfigs = [
    { size: 9.5, color: 0xFFE0A0, opacity: 0 },  // outermost soft halo
    { size: 6.5, color: 0xFFD080, opacity: 0 },  // mid warm
    { size: 4.0, color: 0xFFC060, opacity: 0 },  // inner bright
    { size: 2.4, color: 0xFFEFC0, opacity: 0 },  // hot core
    { size: 1.4, color: 0xFFFFFF, opacity: 0 },  // hottest pinpoint
  ];
  for (const cfg of flareConfigs) {
    const m = new THREE.SpriteMaterial({
      map: flareTex, color: cfg.color, transparent: true, opacity: cfg.opacity,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const s = new THREE.Sprite(m);
    s.scale.set(cfg.size, cfg.size, 1);
    divineRays.add(s);
    divineRayMats.push(m);
  }
  divineRays.position.set(HERO_POS.x, HERO_POS.y, HERO_POS.z);
  scene.add(divineRays);

  // ── Orbiting sparkles — destellos around the mazorca that gather + spiral into the vortex ──
  // Each sparkle has fixed orbit params (radius, axis-tilt, phase, speed). Position is computed
  // each frame from --p (scroll), not t (time), so motion is tightly coupled to scroll.
  const SPARKLE_COUNT = 60;
  const sparkleGeo = new THREE.BufferGeometry();
  const sparklePos = new Float32Array(SPARKLE_COUNT * 3);
  const sparkleColors = new Float32Array(SPARKLE_COUNT * 3);
  // Per-sparkle orbit params: [baseRadius, axisTiltX, axisTiltZ, phaseOffset, speedMultiplier]
  const sparkleOrbits = [];
  for (let i = 0; i < SPARKLE_COUNT; i++) {
    sparkleOrbits.push({
      r: 1.6 + Math.random() * 2.2,                    // 1.6 – 3.8 base radius
      tiltX: (Math.random() - 0.5) * 0.9,              // tilt of orbit plane
      tiltZ: (Math.random() - 0.5) * 0.9,
      phase: Math.random() * Math.PI * 2,              // starting angle
      speed: 1.0 + Math.random() * 1.6,                // 1× – 2.6× spin multiplier
    });
    sparklePos[i * 3]     = HERO_POS.x;
    sparklePos[i * 3 + 1] = HERO_POS.y;
    sparklePos[i * 3 + 2] = HERO_POS.z;
    // Color split: 70% warm gold, 20% pink, 10% Cosmic Criollo purple
    const r = Math.random();
    if (r < 0.70) {
      sparkleColors[i * 3]     = 1.00; sparkleColors[i * 3 + 1] = 0.88; sparkleColors[i * 3 + 2] = 0.62;
    } else if (r < 0.90) {
      sparkleColors[i * 3]     = 0.97; sparkleColors[i * 3 + 1] = 0.78; sparkleColors[i * 3 + 2] = 0.74;
    } else {
      sparkleColors[i * 3]     = 0.62; sparkleColors[i * 3 + 1] = 0.22; sparkleColors[i * 3 + 2] = 0.55;
    }
  }
  sparkleGeo.setAttribute('position', new THREE.BufferAttribute(sparklePos, 3));
  sparkleGeo.setAttribute('color', new THREE.BufferAttribute(sparkleColors, 3));
  const sparkles = new THREE.Points(sparkleGeo, new THREE.PointsMaterial({
    map: flareTex, vertexColors: true, size: 0.55, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true, alphaTest: 0.01,
  }));
  scene.add(sparkles);

  const divineAura = new THREE.Mesh(
    new THREE.SphereGeometry(2.9, 24, 16),
    new THREE.MeshBasicMaterial({
      color: 0xFFC066, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false,
    })
  );
  divineAura.position.set(HERO_POS.x, HERO_POS.y, HERO_POS.z);
  scene.add(divineAura);

  // Radial starburst particles
  const BURST_COUNT = 220;
  const burstGeo = new THREE.BufferGeometry();
  const burstPos = new Float32Array(BURST_COUNT * 3);
  const burstDir = new Float32Array(BURST_COUNT * 3);
  const burstColors = new Float32Array(BURST_COUNT * 3);
  for (let i = 0; i < BURST_COUNT; i++) {
    const a = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    burstDir[i * 3]     = Math.sin(ph) * Math.cos(a);
    burstDir[i * 3 + 1] = Math.cos(ph);
    burstDir[i * 3 + 2] = Math.sin(ph) * Math.sin(a);
    burstPos[i * 3]     = HERO_POS.x;
    burstPos[i * 3 + 1] = HERO_POS.y;
    burstPos[i * 3 + 2] = HERO_POS.z;
    // Tri-color split: ~33% purple seeds (Cosmic Criollo), ~33% pink flowers, ~34% gold sparks
    const r = Math.random();
    if (r < 0.33) {                        // Cosmic Criollo seed #8D2679
      burstColors[i * 3]     = 0.55;
      burstColors[i * 3 + 1] = 0.15;
      burstColors[i * 3 + 2] = 0.47;
    } else if (r < 0.66) {                 // Pink cacao flower #F8D8D0
      burstColors[i * 3]     = 0.97;
      burstColors[i * 3 + 1] = 0.85;
      burstColors[i * 3 + 2] = 0.82;
    } else {                                // Gold spark #FFE8C0
      burstColors[i * 3]     = 1.00;
      burstColors[i * 3 + 1] = 0.91;
      burstColors[i * 3 + 2] = 0.75;
    }
  }
  burstGeo.setAttribute('position', new THREE.BufferAttribute(burstPos, 3));
  burstGeo.setAttribute('color', new THREE.BufferAttribute(burstColors, 3));
  const burst = new THREE.Points(burstGeo, new THREE.PointsMaterial({
    map: flareTex, vertexColors: true, size: 0.18, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true, alphaTest: 0.01,
  }));
  scene.add(burst);

  // ── Hero seed — Cosmic Criollo purple, descending from the heavens ──
  const heroSeedMat = new THREE.MeshStandardMaterial({
    color: 0x8D2679, emissive: 0x5A1650, emissiveIntensity: 0.9,
    roughness: 0.35, metalness: 0.15, transparent: true, opacity: 0,
  });
  const heroSeed = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 14), heroSeedMat);
  heroSeed.position.set(0, 14, 0);
  scene.add(heroSeed);

  const TRAIL_COUNT = 80;
  const trailGeo = new THREE.BufferGeometry();
  const trailPos = new Float32Array(TRAIL_COUNT * 3);
  for (let i = 0; i < TRAIL_COUNT; i++) {
    const r = Math.sqrt(Math.random()) * 0.8;
    const a = Math.random() * Math.PI * 2;
    trailPos[i * 3]     = Math.cos(a) * r;
    trailPos[i * 3 + 1] = 14 + Math.random() * 6;
    trailPos[i * 3 + 2] = Math.sin(a) * r;
  }
  trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3));
  const trail = new THREE.Points(trailGeo, new THREE.PointsMaterial({
    color: 0xC888D8, size: 0.09, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  }));
  scene.add(trail);

  // ── Starfield (cosmic backdrop) ────────────────────────────────
  const starGeo = new THREE.BufferGeometry();
  const STAR_COUNT = 420;
  const starPosArr = new Float32Array(STAR_COUNT * 3);
  for (let i = 0; i < STAR_COUNT; i++) {
    starPosArr[i * 3]     = (Math.random() - 0.5) * 80;
    starPosArr[i * 3 + 1] = 2 + Math.random() * 30;
    starPosArr[i * 3 + 2] = -10 - Math.random() * 30;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPosArr, 3));
  scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({
    color: 0xF7F1EE, size: 0.05, transparent: true, opacity: 0.6,
  })));

  // ── Scroll / resize / IntersectionObserver ─────────────────────
  const getProgress = () => {
    const pVar = getComputedStyle(document.documentElement).getPropertyValue('--p').trim();
    if (pVar) return clamp01(parseFloat(pVar) || 0);
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    return maxScroll > 0 ? clamp01(window.scrollY / maxScroll) : 0;
  };
  // --pd = proximity to section #investment (written by investor-scroll.js).
  // Drives the divine reveal so the mazorca climax anchors to section 09 copy.
  const getPd = () => {
    const v = getComputedStyle(document.documentElement).getPropertyValue('--pd').trim();
    return v ? clamp01(parseFloat(v) || 0) : 0;
  };
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

  // ── Camera paths — narrative: close on hero mazorca (header hook) → pull back to finca vista
  function cameraY(p) {
    if (p < 0.18) return 5.0;                                          // sustained close on mazorca
    if (p < 0.32) return lerp(5.0, 4.4, (p - 0.18) / 0.14);            // slight settle during explosion
    if (p < 0.55) return lerp(4.4, 4.0, (p - 0.32) / 0.23);            // ground-level for emerging finca
    if (p < 0.80) return lerp(4.0, 6.0, (p - 0.55) / 0.25);            // rises for ecosystem context
    return lerp(6.0, 8.5, (p - 0.80) / 0.20);                          // wide vista
  }
  function cameraZ(p) {
    if (p < 0.10) return 9.0;                                          // close to mazorca (sustained)
    if (p < 0.21) return lerp(9.0, 6.2, smoothstep(0.10, 0.21, p));    // PUSHES IN during vortex (suction)
    if (p < 0.225) return 6.2;                                         // void hold — frozen close
    if (p < 0.32) return lerp(6.2, 14.0, smoothstep(0.225, 0.32, p));  // RIPS BACK hard at explosion
    if (p < 0.55) return lerp(14.0, 15.0, (p - 0.32) / 0.23);          // emerging finca
    if (p < 0.80) return lerp(15.0, 18.0, (p - 0.55) / 0.25);          // wider
    return lerp(18.0, 22.0, (p - 0.80) / 0.20);                        // panoramic
  }
  function lookAtTarget(p) {
    // Phase 1: lock on hero mazorca
    if (p < 0.20) return { x: HERO_POS.x, y: HERO_POS.y, z: HERO_POS.z };
    // Phase 2: explosion — drift from mazorca toward origin (where the tree will grow)
    if (p < 0.40) {
      const t = smoothstep(0.20, 0.40, p);
      return {
        x: lerp(HERO_POS.x, 0, t),
        y: lerp(HERO_POS.y, 4.5, t),
        z: lerp(HERO_POS.z, 0, t),
      };
    }
    // Phase 3+: tree at origin, then high vista
    const h = lerp(4.5, 5.5, smoothstep(0.40, 0.85, p));
    return { x: 0, y: h, z: 0 };
  }

  // ── Render loop ────────────────────────────────────────────────
  let t = 0;
  function loop() {
    if (!running) return;
    requestAnimationFrame(loop);
    t += 0.004;
    const p = getProgress();
    const pd = getPd();
    updateSky(p);

    // Camera — base path from p with subtle idle drift
    const camY = cameraY(p);
    const camZ = cameraZ(p);
    const camX = Math.sin(t * 0.18) * 0.4;
    camera.position.set(camX, camY, camZ + Math.sin(t * 0.12) * 0.25);
    const la = lookAtTarget(p);
    camera.lookAt(la.x, la.y, la.z);

    // ── Old "seed descent" repurposed: seed only appears AFTER explosion as part of dispersal ──
    // Visible from p=0.20 (explosion) through p=0.40 (lands), then fades as germination starts.
    const seedFalling = smoothstep(0.20, 0.28, p) * (1 - smoothstep(0.36, 0.44, p));
    heroSeedMat.opacity = seedFalling;
    const seedY = lerp(8, 0, smoothstep(0.22, 0.40, p));
    heroSeed.position.set(Math.sin(t * 0.6) * 0.4, seedY, Math.cos(t * 0.5) * 0.3);
    heroSeed.rotation.y = t * 2;
    heroSeed.rotation.x = t * 1.3;
    seedLight.position.copy(heroSeed.position);
    seedLight.intensity = seedFalling * 1.3;

    trail.material.opacity = seedFalling * 0.55;
    if (seedFalling > 0.02) {
      const tp = trail.geometry.attributes.position;
      for (let i = 0; i < TRAIL_COUNT; i++) {
        let ty = tp.getY(i) - 0.05;
        if (ty < heroSeed.position.y - 5) ty = heroSeed.position.y + Math.random() * 3;
        tp.setY(i, ty);
      }
      tp.needsUpdate = true;
    }

    // Growth phases compressed into 0.30 → 0.85 (post-explosion, the finca emerges fast)
    const s1Alpha = smoothstep(0.28, 0.34, p) * (1 - smoothstep(0.38, 0.44, p));
    seedBuriedMat.opacity = s1Alpha;

    const s2Alpha = smoothstep(0.32, 0.38, p) * (1 - smoothstep(0.46, 0.52, p));
    const s2Scale = 0.5 + smoothstep(0.32, 0.42, p) * 1.6;
    sproutMat.opacity = s2Alpha;
    sprout.scale.setScalar(s2Scale);

    const s3Alpha = smoothstep(0.38, 0.44, p) * (1 - smoothstep(0.52, 0.58, p));
    const s3Scale = 0.4 + smoothstep(0.38, 0.48, p) * 1.5;
    cotyledonMat.opacity = s3Alpha;
    cotyledonGroup.scale.setScalar(s3Scale);

    const s4Alpha = smoothstep(0.44, 0.50, p) * (1 - smoothstep(0.58, 0.64, p));
    const s4Scale = 0.4 + smoothstep(0.44, 0.54, p) * 1.3;
    juvenileMat.opacity = s4Alpha;
    juvLeafMat.opacity = s4Alpha;
    juvenileGroup.scale.setScalar(s4Scale);

    // Mature tree — scales from sprout (0.15) to full (1.0) over 0.45 → 0.65
    const matureScale = 0.15 + smoothstep(0.45, 0.65, p) * 0.85;
    mature.scale.setScalar(matureScale);

    trunkMat.opacity = smoothstep(0.48, 0.58, p);
    branchMat.opacity = smoothstep(0.55, 0.66, p);

    canopyMat.opacity = smoothstep(0.58, 0.70, p);
    if (canopyMat.opacity > 0.02) {
      for (let i = 0; i < canopyLeaves.length; i++) {
        const u = canopyLeaves[i].userData;
        canopyLeaves[i].rotation.z = u.baseRotZ + Math.sin(t * u.freq + u.phase) * u.amp;
      }
    }

    // Flowers (mid-late) and pods (late) — keep visible to the end as part of mature ecosystem
    const flAlpha = smoothstep(0.62, 0.72, p) * (1 - smoothstep(0.78, 0.88, p));
    flowerMat.opacity = flAlpha;
    flowersGroup.scale.setScalar(1 + Math.sin(t * 3.5) * 0.08);

    const podsAlpha = smoothstep(0.72, 0.82, p);
    for (const mat of podMaterials) mat.opacity = podsAlpha;

    // ── Header hook: hero mazorca arrives from cosmic void → orbits gather → vortex → explosion ──
    // Phase timing (drives every other element below):
    //   0.00–0.05  cosmic void — mazorca is far back in z, barely visible (arriving)
    //   0.05–0.10  arrival — mazorca settles into HERO_POS, sparkles begin to gather
    //   0.10–0.13  charge-up (micro-swell, emissive over-charges)
    //   0.13–0.21  VORTEX — accelerated spin, scale → 0, sparkles spiral in, light absorbed
    //   0.21–0.225 VOID — mazorca invisible, total black
    //   0.225+     EXPLOSION — radial burst unleashes
    const arrivalProg = smoothstep(0.00, 0.08, p);                         // 0 → 1 across approach
    const vortexProg = smoothstep(0.10, 0.21, p);                          // 0 → 1 across collapse
    const explosionProg = smoothstep(0.225, 0.32, p);                      // 0 → 1 across burst
    const heroMicroSwell = 1 + smoothstep(0.10, 0.13, p) * 0.07;
    const heroCollapse = 1 - smoothstep(0.13, 0.21, p);
    const heroScale = Math.max(0, heroMicroSwell * heroCollapse) * arrivalProg;
    heroMazorca.scale.setScalar(heroScale);
    heroMazorca.visible = heroScale > 0.01;
    // Cosmic z-arrival: mazorca eases from HERO_POS.z - 14 (deep space) to HERO_POS.z by p=0.08
    const zApproach = lerp(HERO_POS.z - 14, HERO_POS.z, arrivalProg);
    heroMazorca.position.set(HERO_POS.x, HERO_POS.y, zApproach);
    for (const mat of heroMazorcaMats) {
      mat.opacity = heroScale;
      if (mat.emissiveIntensity !== undefined && mat.color && mat.color.getHex && mat.color.getHex() === 0xC24820) {
        // Soft idle glow until charge-up phase, then over-charges into the vortex
        const emissiveBoost = 1 + smoothstep(0.10, 0.18, p) * 1.6;
        mat.emissiveIntensity = (0.45 + Math.sin(t * 2.4) * 0.18) * heroScale * emissiveBoost;
      }
    }
    // Rotation tightly coupled to scroll (--p) so motion = scroll. Time only adds tiny idle drift.
    //   Idle:  ~1.5 turns across the full landing scroll (p ∈ [0,1] → +9.4 rad)
    //   Vortex burst: extra +13 rad concentrated in the 0.10–0.21 collapse window
    heroMazorca.rotation.y = 1.2 + p * 9.4 + Math.pow(vortexProg, 1.3) * 13 + t * 0.04;
    heroMazorca.rotation.x = Math.sin(t * 0.5) * 0.05 + vortexProg * 0.5;
    heroMazorca.rotation.z = vortexProg * 0.35;

    // ── Round flare sprites — gather around mazorca → collapse with vortex → flash at explosion ──
    // Build up gradually during arrival (no flash on page load), peak just before vortex, fade through it.
    const flareGather = smoothstep(0.04, 0.12, p) * (1 - smoothstep(0.13, 0.21, p));
    const flareFlash = smoothstep(0.225, 0.255, p) * (1 - smoothstep(0.30, 0.44, p));
    const flareActive = Math.max(flareGather, flareFlash * 1.2);
    // Per-flare opacity tiers — outer halos dimmer, hot core brightest
    const flareOpacityCurve = [0.18, 0.26, 0.38, 0.55, 0.85];
    for (let i = 0; i < divineRayMats.length; i++) {
      divineRayMats[i].opacity = flareOpacityCurve[i] * flareActive;
    }
    // Lens flare follows the mazorca's z-arrival so it doesn't float in front of empty space
    divineRays.position.set(HERO_POS.x, HERO_POS.y, zApproach);
    // Subtle scroll-coupled rotation for the flare group (parallax feel)
    divineRays.rotation.z = p * 1.2 + Math.pow(vortexProg, 1.5) * 1.6;

    divineAura.position.set(HERO_POS.x, HERO_POS.y, zApproach);
    divineAura.material.opacity = 0.18 * flareActive * (1 + Math.sin(t * 2.0) * 0.25);
    const auraScale = (1 + Math.sin(t * 1.4) * 0.05) * (1 - vortexProg * 0.85) + flareFlash * 0.6;
    divineAura.scale.setScalar(Math.max(0.05, auraScale));

    // ── Orbiting sparkles — destellos around mazorca, then spiral into the vortex on scroll ──
    // Visible only during arrival → vortex (not during void or explosion — burst takes over).
    const sparkleAlpha = smoothstep(0.04, 0.12, p) * (1 - smoothstep(0.18, 0.215, p));
    sparkles.material.opacity = sparkleAlpha;
    if (sparkleAlpha > 0.02) {
      const sp = sparkles.geometry.attributes.position;
      // Orbit angle is driven primarily by scroll progress (p) — moves with scroll, not time.
      // Time contribution is tiny (subtle twinkle/drift only).
      // Vortex adds extra revolutions (~3 full turns concentrated in the collapse window).
      const baseOrbitAngle = p * 14;                                        // ~2.2 rev across full scroll
      const vortexExtra = Math.pow(vortexProg, 1.1) * Math.PI * 6;          // ~3 turns during collapse
      // Radius scaling: full base radius during gather → collapses to 0.15 by void
      const radiusScale = (1 - vortexProg * 0.93);
      for (let i = 0; i < SPARKLE_COUNT; i++) {
        const o = sparkleOrbits[i];
        const angle = o.phase + baseOrbitAngle * o.speed + vortexExtra;
        const r = o.r * radiusScale + 0.03 * Math.sin(t * 1.5 + o.phase);   // tiny twinkle
        // Compute orbit on XZ plane, then tilt by tiltX/tiltZ
        const ox = Math.cos(angle) * r;
        const oz = Math.sin(angle) * r;
        const oy = ox * o.tiltX + oz * o.tiltZ;                             // tilt projection
        sp.setXYZ(i, HERO_POS.x + ox, HERO_POS.y + oy, zApproach + oz);
      }
      sp.needsUpdate = true;
    }

    // ── Burst particles — EXPLOSION ONLY (sparkles cover the gather/spiral phase before void) ──
    const burstFlash = smoothstep(0.225, 0.252, p);                       // sharp ignition
    const burstDecay = 1 - smoothstep(0.34, 0.52, p);                     // fades out
    const burstAlpha = burstFlash * burstDecay;
    burst.material.opacity = burstAlpha;
    if (burstAlpha > 0.02) {
      const bp = burst.geometry.attributes.position;
      const radHaloMax = 5;
      const radExplodeMax = 17;                                         // bigger blast than before
      // Vortex swirl angle — accumulates during vortex, leaves residual rotation through explosion
      const swirlAngle = Math.pow(vortexProg, 1.2) * Math.PI * 3.6 + explosionProg * 1.4;
      const cosS = Math.cos(swirlAngle), sinS = Math.sin(swirlAngle);
      for (let i = 0; i < BURST_COUNT; i++) {
        const dx = burstDir[i * 3];
        const dy = burstDir[i * 3 + 1];
        const dz = burstDir[i * 3 + 2];
        // Halo regime — pulsing in/out (visible only pre-vortex)
        const pulsePhase = (t * 0.6 + i * 0.013) % 2;
        const haloRad = pulsePhase < 1 ? pulsePhase * radHaloMax : (2 - pulsePhase) * radHaloMax;
        // Suction radius — halo collapses to a near-point during vortex
        const suckRad = haloRad * (1 - vortexProg) + 0.12 * vortexProg;
        // Explosion radius — radial outward, accelerated, per-particle stagger
        const explodeRad = radExplodeMax * Math.pow(explosionProg, 0.65) * (1 + (i % 7) * 0.05);
        let rad;
        if (p < 0.21) {
          rad = suckRad;                                                // pulling in
        } else if (p < 0.225) {
          rad = 0.12 * (1 - smoothstep(0.21, 0.225, p));                // collapse to perfect zero
        } else {
          rad = explodeRad;                                             // unleash
        }
        // Apply swirl: rotate dir vector around Y axis (cluster spirals as it contracts/explodes)
        const dxR = dx * cosS - dz * sinS;
        const dzR = dx * sinS + dz * cosS;
        bp.setXYZ(i, HERO_POS.x + dxR * rad, HERO_POS.y + dy * rad, HERO_POS.z + dzR * rad);
      }
      bp.needsUpdate = true;
    }

    // ── Grove — invisible at start (cosmic void), fades in as the explosion seeds the finca ──
    const groveAlpha = smoothstep(0.30, 0.55, p);
    for (let i = 0; i < groveMaterials.length; i++) groveMaterials[i].opacity = groveAlpha;
    grove.visible = groveAlpha > 0.02;

    // Render — composer (with bloom) when available, else plain renderer
    if (composer && bloomPass) {
      // Bloom narrative: dark cosmic start → soft gather glow → light absorbed by vortex → near-zero in void → explosion flash → decay
      // Capped low overall so captions read; only the explosion gets a bright moment.
      const bloomGather = 0.55 * smoothstep(0.04, 0.13, p) * (1 - smoothstep(0.13, 0.21, p));
      const bloomFlash  = 1.2  * smoothstep(0.225, 0.250, p) * (1 - smoothstep(0.30, 0.46, p));
      bloomPass.strength = Math.max(bloomGather, bloomFlash);
      composer.render();
    } else {
      renderer.render(scene, camera);
    }
  }
  loop();
})();
