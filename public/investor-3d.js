// Caúa Investor — hero 3D: divine descent → cacao tree → roots
// Scroll-driven vertical journey:
//   0.00 – 0.08  Sky / divine rays / stars         — pod appears high
//   0.08 – 0.30  Descent                            — pod falls with golden motes
//   0.30 – 0.55  Canopy + cauliflorous trunk pods
//   0.55 – 0.75  Trunk base, ground line crossed
//   0.75 – 1.00  Underground root system + mycorrhizae
(function () {
  const canvas = document.getElementById('gl-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 8, 10);

  // ── Utilities ──────────────────────────────────────────────────
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp01 = x => Math.max(0, Math.min(1, x));
  const smoothstep = (e0, e1, x) => {
    const t = clamp01((x - e0) / (e1 - e0));
    return t * t * (3 - 2 * t);
  };

  // ── Lights ─────────────────────────────────────────────────────
  scene.add(new THREE.AmbientLight(0x2a1810, 0.55));
  const sun = new THREE.DirectionalLight(0xFFC888, 1.7);   // warm divine sun
  sun.position.set(4, 14, 6);
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0x8D2679, 0.55);  // purple brand rim
  rim.position.set(-6, -2, -4);
  scene.add(rim);
  const fill = new THREE.PointLight(0xE89A5E, 1.0, 28);
  fill.position.set(0, 2, 5);
  scene.add(fill);
  // Subsoil glow — warm earth light for root phase
  const earthGlow = new THREE.PointLight(0xD86028, 0.9, 16);
  earthGlow.position.set(0, -12, 0);
  scene.add(earthGlow);

  // ── Criollo pod geometry (reusable) ────────────────────────────
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

    // Peduncle
    const ped = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.17, 0.55, 10),
      new THREE.MeshStandardMaterial({ color: 0x4A2A12, roughness: 0.95 })
    );
    ped.position.y = 2.48;
    group.add(ped);

    // Calyx ring
    const calyx = new THREE.Mesh(
      new THREE.TorusGeometry(0.40, 0.07, 6, 16),
      new THREE.MeshStandardMaterial({
        color: 0x5A1E08, emissive: 0x2A0600, emissiveIntensity: 0.25, roughness: 0.9,
      })
    );
    calyx.rotation.x = Math.PI / 2;
    calyx.position.y = 2.10;
    group.add(calyx);

    // Splayed sepals
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

  // ── Hero pod (divine descent) ──────────────────────────────────
  const heroPod = buildPod(1, 'hero');
  heroPod.rotation.z = 0.08;
  scene.add(heroPod);

  // Divine rays around the hero pod — volumetric warm cone
  const raysMat = new THREE.MeshBasicMaterial({
    color: 0xFFE0A0, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false,
  });
  const rays = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 4.2, 16, 32, 1, true), raysMat);
  scene.add(rays);

  // Secondary aura halo — softer, wider
  const auraMat = new THREE.MeshBasicMaterial({
    color: 0xFFC066, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const aura = new THREE.Mesh(new THREE.SphereGeometry(2.5, 24, 16), auraMat);
  scene.add(aura);

  // Golden motes falling alongside the descending pod
  const MOTE_COUNT = 140;
  const moteGeo = new THREE.BufferGeometry();
  const motePos = new Float32Array(MOTE_COUNT * 3);
  const moteSpeed = new Float32Array(MOTE_COUNT);
  for (let i = 0; i < MOTE_COUNT; i++) {
    const r = Math.sqrt(Math.random()) * 3.5;
    const a = Math.random() * Math.PI * 2;
    motePos[i * 3]     = Math.cos(a) * r;
    motePos[i * 3 + 1] = 6 + Math.random() * 12;
    motePos[i * 3 + 2] = Math.sin(a) * r;
    moteSpeed[i] = 0.012 + Math.random() * 0.025;
  }
  moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
  const motes = new THREE.Points(moteGeo, new THREE.PointsMaterial({
    color: 0xFFD28A, size: 0.11, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  }));
  scene.add(motes);

  // ── Cacao tree ─────────────────────────────────────────────────
  const tree = new THREE.Group();
  scene.add(tree);

  // Trunk — tall, barky, from y=+6 to y=-6
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
  const trunk = new THREE.Mesh(trunkGeo, new THREE.MeshStandardMaterial({
    color: 0x5A3620, emissive: 0x1A0A04, emissiveIntensity: 0.08,
    roughness: 0.95, metalness: 0,
  }));
  trunk.position.y = 0;
  tree.add(trunk);

  // Cauliflorous pods — cacao fruits grow DIRECTLY on the trunk
  const CAULI_LAYOUT = [
    { y:  4.5, a: 0.3, s: 0.28 },
    { y:  3.2, a: 2.1, s: 0.24 },
    { y:  2.0, a: 4.4, s: 0.30 },
    { y:  0.6, a: 1.2, s: 0.26 },
    { y: -0.8, a: 3.5, s: 0.28 },
    { y: -2.2, a: 5.6, s: 0.25 },
    { y: -3.6, a: 0.8, s: 0.30 },
    { y: -4.8, a: 2.9, s: 0.24 },
  ];
  for (const c of CAULI_LAYOUT) {
    const p = buildPod(c.s, 'low');
    const r = 0.68;
    p.position.set(Math.cos(c.a) * r, c.y, Math.sin(c.a) * r);
    p.rotation.y = c.a + Math.PI / 2;
    p.rotation.z = Math.cos(c.a) * 0.35;  // hang away from trunk
    p.rotation.x = Math.sin(c.a) * 0.35;
    tree.add(p);
  }

  // Branches — a few splayed from trunk top
  const BRANCHES = [
    { y: 5.0, a: 0.5, len: 3.2, tilt: 0.8 },
    { y: 5.3, a: 2.4, len: 2.8, tilt: 0.9 },
    { y: 4.8, a: 4.1, len: 3.0, tilt: 0.75 },
    { y: 5.5, a: 5.9, len: 2.6, tilt: 0.95 },
  ];
  const branchMat = new THREE.MeshStandardMaterial({
    color: 0x4A2C18, roughness: 0.95, metalness: 0,
  });
  for (const b of BRANCHES) {
    const br = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.22, b.len, 8),
      branchMat
    );
    br.position.set(Math.cos(b.a) * 0.45, b.y, Math.sin(b.a) * 0.45);
    // Rotate outward + upward
    br.rotation.z = -Math.cos(b.a) * b.tilt;
    br.rotation.x = Math.sin(b.a) * b.tilt;
    // Offset to its centre along its own length (after rotation, tricky — just place near attach pt)
    br.translateY(b.len / 2);
    tree.add(br);

    // Leaves at branch tips
    const tipX = Math.cos(b.a) * (0.45 + Math.sin(b.tilt) * b.len * 0.9);
    const tipY = b.y + Math.cos(b.tilt) * b.len * 0.9;
    const tipZ = Math.sin(b.a) * (0.45 + Math.sin(b.tilt) * b.len * 0.9);
    addLeafCluster(tipX, tipY, tipZ, 6);
  }

  // Leaf shape — oblanceolate, pointed, acute base (real cacao leaf)
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
  const LEAF_MAT = new THREE.MeshStandardMaterial({
    color: 0x2E5820, emissive: 0x0A1A08, emissiveIntensity: 0.18,
    roughness: 0.75, metalness: 0.02, side: THREE.DoubleSide,
  });
  const LEAF_MAT_YOUNG = new THREE.MeshStandardMaterial({
    color: 0x8A6820, emissive: 0x2A1A04, emissiveIntensity: 0.3,
    roughness: 0.8, side: THREE.DoubleSide,
  });
  function addLeafCluster(cx, cy, cz, count) {
    for (let i = 0; i < count; i++) {
      const leaf = new THREE.Mesh(LEAF_GEO, Math.random() < 0.15 ? LEAF_MAT_YOUNG : LEAF_MAT);
      const ang = Math.random() * Math.PI * 2;
      const rad = Math.random() * 0.8;
      leaf.position.set(cx + Math.cos(ang) * rad, cy + (Math.random() - 0.5) * 0.6, cz + Math.sin(ang) * rad);
      leaf.rotation.y = Math.random() * Math.PI * 2;
      leaf.rotation.z = (Math.random() - 0.5) * 0.9;
      leaf.rotation.x = -Math.PI / 2 + (Math.random() - 0.5) * 0.4;  // mostly horizontal
      leaf.scale.setScalar(0.55 + Math.random() * 0.45);
      tree.add(leaf);
    }
  }

  // Crown canopy — leaves clustered above branches
  addLeafCluster(0, 7.0, 0, 18);
  addLeafCluster(1.5, 6.2, 0.8, 8);
  addLeafCluster(-1.2, 6.4, -1.0, 8);
  addLeafCluster(0.3, 5.6, 1.8, 6);

  // ── Ground / soil ──────────────────────────────────────────────
  const groundGeo = new THREE.CircleGeometry(14, 48);
  // Displace for uneven soil
  const gpos = groundGeo.attributes.position;
  for (let i = 0; i < gpos.count; i++) {
    const x = gpos.getX(i), y = gpos.getY(i);
    gpos.setZ(i, Math.sin(x * 0.8) * 0.08 + Math.cos(y * 0.7) * 0.08);
  }
  groundGeo.computeVertexNormals();
  const ground = new THREE.Mesh(groundGeo, new THREE.MeshStandardMaterial({
    color: 0x2A1A0E, emissive: 0x0C0604, emissiveIntensity: 0.1,
    roughness: 1, metalness: 0,
  }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -6.05;
  scene.add(ground);

  // Subsoil darker plane (for layered effect when camera passes through)
  const subsoil = new THREE.Mesh(
    new THREE.CircleGeometry(18, 32),
    new THREE.MeshBasicMaterial({ color: 0x140A06, transparent: true, opacity: 0.85 })
  );
  subsoil.rotation.x = -Math.PI / 2;
  subsoil.position.y = -6.1;
  scene.add(subsoil);

  // ── Root system — recursive branching ─────────────────────────
  const rootMat = new THREE.MeshStandardMaterial({
    color: 0x3A2212, emissive: 0x0A0602, emissiveIntensity: 0.12,
    roughness: 0.95, metalness: 0,
  });
  const Y_UP = new THREE.Vector3(0, 1, 0);
  function growRoot(origin, dir, length, radius, depth) {
    const geo = new THREE.CylinderGeometry(radius * 0.35, radius, length, 6);
    const seg = new THREE.Mesh(geo, rootMat);
    const mid = origin.clone().add(dir.clone().multiplyScalar(length / 2));
    seg.position.copy(mid);
    seg.quaternion.setFromUnitVectors(Y_UP, dir.clone().normalize());
    scene.add(seg);
    if (depth <= 0 || radius < 0.05) return;

    const end = origin.clone().add(dir.clone().multiplyScalar(length));
    const kids = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < kids; i++) {
      const nd = dir.clone();
      nd.x += (Math.random() - 0.5) * 0.9;
      nd.z += (Math.random() - 0.5) * 0.9;
      nd.y -= 0.25 + Math.random() * 0.25;
      growRoot(end, nd.normalize(),
               length * (0.62 + Math.random() * 0.2),
               radius * 0.62, depth - 1);
    }
  }
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    growRoot(
      new THREE.Vector3(Math.cos(a) * 0.35, -6, Math.sin(a) * 0.35),
      new THREE.Vector3(Math.cos(a) * 0.5, -0.85, Math.sin(a) * 0.5).normalize(),
      2.2, 0.28, 4
    );
  }

  // Taproot — single deep central root
  growRoot(new THREE.Vector3(0, -6, 0), new THREE.Vector3(0.05, -1, 0.03).normalize(),
           3.0, 0.35, 5);

  // ── Mycorrhizae / underground bio-light ───────────────────────
  const mycoCount = 60;
  const mycoGroup = new THREE.Group();
  for (let i = 0; i < mycoCount; i++) {
    const hue = [0xFFE0A0, 0xF8B06A, 0xE89A5E, 0xD86028, 0xFFC888][Math.floor(Math.random() * 5)];
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(0.04 + Math.random() * 0.08, 6, 5),
      new THREE.MeshBasicMaterial({
        color: hue, transparent: true, opacity: 0.55,
        blending: THREE.AdditiveBlending, depthWrite: false,
      })
    );
    const r = Math.sqrt(Math.random()) * 6.5;
    const ang = Math.random() * Math.PI * 2;
    m.position.set(
      Math.cos(ang) * r,
      -7 - Math.random() * 10,
      Math.sin(ang) * r
    );
    m.userData = { phase: Math.random() * Math.PI * 2, freq: 1.5 + Math.random() * 1.8 };
    mycoGroup.add(m);
  }
  scene.add(mycoGroup);

  // ── Celestial droplets (high sky, fade during descent) ────────
  const MOLECULES = 6;
  const molecules = [];
  const DROP_COLORS = [0xE89A5E, 0xF8B06A, 0xFFD28A, 0xFFC888, 0xFFE0A0];
  for (let i = 0; i < MOLECULES; i++) {
    const mol = new THREE.Group();
    const orbitR = 4.5 + Math.random() * 4;
    const orbitA = (i / MOLECULES) * Math.PI * 2;
    const baseY  = 8 + Math.random() * 5;
    const color  = DROP_COLORS[Math.floor(Math.random() * DROP_COLORS.length)];

    const center = new THREE.Mesh(
      new THREE.SphereGeometry(0.24 + Math.random() * 0.1, 16, 12),
      new THREE.MeshStandardMaterial({
        color, emissive: color, emissiveIntensity: 0.55,
        roughness: 0.2, metalness: 0.1, transparent: true, opacity: 0.9,
      })
    );
    mol.add(center);
    for (let j = 0; j < 5; j++) {
      const r = 0.45 + Math.random() * 0.25;
      const th = (j / 5) * Math.PI * 2 + Math.random() * 0.3;
      const ph = 0.4 + Math.random() * (Math.PI - 0.8);
      const sc = DROP_COLORS[Math.floor(Math.random() * DROP_COLORS.length)];
      const sat = new THREE.Mesh(
        new THREE.SphereGeometry(0.08 + Math.random() * 0.08, 10, 8),
        new THREE.MeshStandardMaterial({
          color: sc, emissive: sc, emissiveIntensity: 0.4,
          roughness: 0.25, transparent: true, opacity: 0.75,
        })
      );
      sat.position.set(
        Math.sin(ph) * Math.cos(th) * r,
        Math.cos(ph) * r,
        Math.sin(ph) * Math.sin(th) * r
      );
      mol.add(sat);
    }
    mol.position.set(Math.cos(orbitA) * orbitR, baseY, Math.sin(orbitA) * orbitR - 2);
    mol.userData = {
      orbitA, orbitR, baseY,
      orbitSpeed: 0.0007 + Math.random() * 0.0009,
      bobPhase: Math.random() * Math.PI * 2,
      spinY: 0.003 + Math.random() * 0.003,
    };
    scene.add(mol);
    molecules.push(mol);
  }

  // ── Starfield (cosmic backdrop, densest at top) ───────────────
  const starGeo = new THREE.BufferGeometry();
  const STAR_COUNT = 420;
  const starPos = new Float32Array(STAR_COUNT * 3);
  for (let i = 0; i < STAR_COUNT; i++) {
    starPos[i * 3]     = (Math.random() - 0.5) * 80;
    starPos[i * 3 + 1] = 2 + Math.random() * 30;   // weighted up top
    starPos[i * 3 + 2] = -10 - Math.random() * 30;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({
    color: 0xF7F1EE, size: 0.05, transparent: true, opacity: 0.6,
  })));

  // ── Scroll handling ────────────────────────────────────────────
  let scrollY = 0;
  const getProgress = () => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    return maxScroll > 0 ? clamp01(scrollY / maxScroll) : 0;
  };
  window.addEventListener('scroll', () => { scrollY = window.scrollY || 0; }, { passive: true });
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight, false);
  });

  // Journey anchor points — camera Y by progress
  function cameraY(p) { return lerp(8, -16, p); }
  // Hero pod Y — high in sky → settles into cauliflorous position at trunk
  function heroPodY(p) {
    if (p < 0.06) return 14;
    if (p > 0.28) return 2.0;  // attached position (matches a trunk slot)
    const t = smoothstep(0.06, 0.28, p);
    return lerp(14, 2.0, t);
  }
  // Camera lookAt target: at top we look up (sky), at bottom look down (roots)
  function lookAtY(camY, p) {
    const offset = lerp(4.0, -3.5, p);
    return camY + offset;
  }

  // ── Main render loop ───────────────────────────────────────────
  let t = 0;
  (function loop() {
    requestAnimationFrame(loop);
    t += 0.004;
    const p = getProgress();

    // Camera descends through the journey
    const camY = cameraY(p);
    camera.position.set(
      Math.sin(t * 0.18) * 0.4,     // subtle lateral drift
      camY,
      10 + Math.sin(t * 0.12) * 0.3
    );
    camera.lookAt(0, lookAtY(camY, p), 0);

    // Hero pod descent + sway
    heroPod.position.y = heroPodY(p);
    heroPod.rotation.y += 0.004;
    const attached = smoothstep(0.20, 0.30, p);
    heroPod.rotation.x = Math.sin(t * 0.6) * 0.18 * (1 - attached * 0.6);
    heroPod.rotation.z = 0.08 + Math.sin(t * 0.9) * 0.06 * (1 - attached * 0.4);

    // Divine rays track the hero pod, fade in during descent, out after
    const raysActive = smoothstep(0.0, 0.10, p) * (1 - smoothstep(0.26, 0.42, p));
    rays.position.set(0, heroPod.position.y + 5, 0);
    rays.material.opacity = 0.22 * raysActive;
    aura.position.set(0, heroPod.position.y, 0);
    aura.material.opacity = 0.14 * raysActive;

    // Motes — falling around descending pod, then fade out
    const motePosAttr = motes.geometry.attributes.position;
    for (let i = 0; i < MOTE_COUNT; i++) {
      let y = motePosAttr.getY(i) - moteSpeed[i];
      if (y < heroPod.position.y - 3) y = heroPod.position.y + 8 + Math.random() * 4;
      motePosAttr.setY(i, y);
    }
    motePosAttr.needsUpdate = true;
    motes.material.opacity = 0.9 * (1 - smoothstep(0.28, 0.50, p));

    // Tree: gentle leaf sway
    tree.rotation.y = Math.sin(t * 0.25) * 0.025;

    // Mycorrhizae pulse — visible only underground
    const undergroundVisible = smoothstep(0.55, 0.80, p);
    mycoGroup.children.forEach(m => {
      const u = m.userData;
      m.material.opacity = (0.35 + 0.45 * Math.sin(t * u.freq + u.phase)) * undergroundVisible;
    });

    // Celestial droplets orbit + fade during descent (divine → gone in canopy)
    const celestialVisible = 1 - smoothstep(0.18, 0.40, p);
    for (const m of molecules) {
      const u = m.userData;
      u.orbitA += u.orbitSpeed;
      m.position.x = Math.cos(u.orbitA) * u.orbitR;
      m.position.z = Math.sin(u.orbitA) * u.orbitR - 2;
      m.position.y = u.baseY + Math.sin(t * 1.8 + u.bobPhase) * 0.35;
      m.rotation.y += u.spinY;
      m.visible = celestialVisible > 0.02;
      m.scale.setScalar(celestialVisible);
    }

    renderer.render(scene, camera);
  })();
})();
