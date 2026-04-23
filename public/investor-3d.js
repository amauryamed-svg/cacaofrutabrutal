// Caúa Investor — hero 3D pod
// Low-poly facetted cacao pod with visible wireframe, slow rotation,
// warm gold material + inner glow + amber particle orbit + starfield.
(function () {
  const canvas = document.getElementById('gl-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 0, 10);

  // Lights — warm olive key + purple rim + fill
  scene.add(new THREE.AmbientLight(0x14180c, 0.55));
  const key = new THREE.DirectionalLight(0xbfd166, 1.6);
  key.position.set(4, 7, 6);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x6622aa, 0.6);
  rim.position.set(-6, -2, -4);
  scene.add(rim);
  const fill = new THREE.PointLight(0xcfe070, 1.1, 20);
  fill.position.set(0, 0, 5);
  scene.add(fill);

  // Cacao pod — bold low-poly body, chunky facets, olive dominant
  const podGeo = new THREE.IcosahedronGeometry(2.6, 1);
  const podMat = new THREE.MeshStandardMaterial({
    color: 0x91A63B,
    emissive: 0x1f2a0a,
    emissiveIntensity: 0.85,
    flatShading: true,
    roughness: 0.5,
    metalness: 0.22,
    transparent: true,
    opacity: 0.95,
  });
  const pod = new THREE.Mesh(podGeo, podMat);
  pod.scale.set(0.9, 1.4, 0.9);
  scene.add(pod);

  // Wireframe overlay — makes facets unmistakable and "mystical"
  const wireGeo = new THREE.IcosahedronGeometry(2.61, 1);
  const wireMat = new THREE.LineBasicMaterial({
    color: 0xB8D04A,
    transparent: true,
    opacity: 0.5,
  });
  const wire = new THREE.LineSegments(new THREE.WireframeGeometry(wireGeo), wireMat);
  wire.scale.copy(pod.scale);
  scene.add(wire);

  // Inner brighter core — soft olive glow from within
  const coreGeo = new THREE.IcosahedronGeometry(1.9, 0);
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0xD0E066,
    transparent: true,
    opacity: 0.22,
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.scale.copy(pod.scale);
  scene.add(core);

  // Mucilage droplets — molecular fractals (center atom + satellites, orbit the pod)
  const MOLECULE_COUNT = 7;
  const SATELLITES_PER_MOLECULE = 6;
  const parts = [];
  const DROP_COLORS = [0x91A63B, 0xB8D04A, 0x8D2679, 0xE8742C, 0xCFE070];

  for (let i = 0; i < MOLECULE_COUNT; i++) {
    const molecule = new THREE.Group();
    const orbitRadius = 4 + Math.random() * 5;
    const orbitAngle  = (i / MOLECULE_COUNT) * Math.PI * 2 + Math.random() * 0.6;
    const orbitY      = (Math.random() - 0.5) * 7;

    // Central droplet — larger, glossy, olive-dominant
    const centerColor = DROP_COLORS[Math.floor(Math.random() * 2)];
    const centerGeo = new THREE.SphereGeometry(0.22 + Math.random() * 0.1, 18, 14);
    const centerMat = new THREE.MeshStandardMaterial({
      color: centerColor,
      emissive: centerColor,
      emissiveIntensity: 0.55,
      roughness: 0.18,
      metalness: 0.12,
      transparent: true,
      opacity: 0.9,
    });
    const center = new THREE.Mesh(centerGeo, centerMat);
    center.scale.set(1, 1.15, 1); // slight teardrop elongation
    molecule.add(center);

    // Satellite droplets — suspended in 3D, form fractal halo around center
    const satOffsets = [];
    for (let j = 0; j < SATELLITES_PER_MOLECULE; j++) {
      const r = 0.48 + Math.random() * 0.28;
      const theta = (j / SATELLITES_PER_MOLECULE) * Math.PI * 2 + Math.random() * 0.25;
      const phi   = 0.4 + Math.random() * (Math.PI - 0.8);
      const size  = 0.08 + Math.random() * 0.1;
      const color = DROP_COLORS[Math.floor(Math.random() * DROP_COLORS.length)];

      const satGeo = new THREE.SphereGeometry(size, 12, 10);
      const satMat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.4,
        roughness: 0.22,
        metalness: 0.1,
        transparent: true,
        opacity: 0.72 + Math.random() * 0.2,
      });
      const sat = new THREE.Mesh(satGeo, satMat);
      const sx = Math.sin(phi) * Math.cos(theta) * r;
      const sy = Math.cos(phi) * r;
      const sz = Math.sin(phi) * Math.sin(theta) * r;
      sat.position.set(sx, sy, sz);
      sat.scale.set(1, 1.12, 1);
      molecule.add(sat);
      satOffsets.push({ sx, sy, sz, phase: Math.random() * Math.PI * 2 });

      // Sub-satellites — one level of fractal recursion on ~45% of satellites
      if (Math.random() < 0.45) {
        const subCount = 2 + Math.floor(Math.random() * 2);
        for (let k = 0; k < subCount; k++) {
          const subR = 0.14 + Math.random() * 0.1;
          const subTheta = (k / subCount) * Math.PI * 2 + Math.random() * 0.4;
          const subSize  = 0.035 + Math.random() * 0.04;
          const subColor = DROP_COLORS[Math.floor(Math.random() * DROP_COLORS.length)];
          const subGeo = new THREE.SphereGeometry(subSize, 8, 6);
          const subMat = new THREE.MeshStandardMaterial({
            color: subColor,
            emissive: subColor,
            emissiveIntensity: 0.3,
            roughness: 0.3,
            metalness: 0.05,
            transparent: true,
            opacity: 0.55 + Math.random() * 0.25,
          });
          const sub = new THREE.Mesh(subGeo, subMat);
          sub.position.set(
            sx + Math.cos(subTheta) * subR,
            sy + Math.sin(subTheta) * subR * 0.6,
            sz + Math.sin(subTheta) * subR,
          );
          molecule.add(sub);
        }
      }
    }

    molecule.position.set(
      Math.cos(orbitAngle) * orbitRadius,
      orbitY,
      Math.sin(orbitAngle) * orbitRadius - 2,
    );
    molecule.userData = {
      orbitAngle,
      orbitRadius,
      orbitSpeed: 0.0006 + Math.random() * 0.0009,
      baseY: orbitY,
      bobPhase: Math.random() * Math.PI * 2,
      spinY: 0.002 + Math.random() * 0.004,
      spinX: (Math.random() - 0.5) * 0.003,
    };
    scene.add(molecule);
    parts.push(molecule);
  }

  // Starfield — deeper distance
  const starGeo = new THREE.BufferGeometry();
  const starCount = 320;
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    starPos[i * 3]     = (Math.random() - 0.5) * 70;
    starPos[i * 3 + 1] = (Math.random() - 0.5) * 45;
    starPos[i * 3 + 2] = -15 - Math.random() * 25;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const starMat = new THREE.PointsMaterial({ color: 0xF7F1EE, size: 0.05, transparent: true, opacity: 0.55 });
  scene.add(new THREE.Points(starGeo, starMat));

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight, false);
  });

  let scrollY = 0;
  window.addEventListener('scroll', () => { scrollY = window.scrollY || 0; }, { passive: true });

  let t = 0;
  (function loop() {
    requestAnimationFrame(loop);
    t += 0.004;
    pod.rotation.y  += 0.004;
    pod.rotation.x   = Math.sin(t * 0.6) * 0.22;
    wire.rotation.copy(pod.rotation);
    core.rotation.y -= 0.0025;
    core.rotation.x  = pod.rotation.x * 0.6;

    // Pod drifts down as page scrolls
    const sp = Math.min(scrollY / (window.innerHeight || 800), 1.4);
    pod.position.y  = -sp * 1.3;
    wire.position.y = pod.position.y;
    core.position.y = pod.position.y;

    // Pulsing inner glow
    const pulse = 0.18 + Math.sin(t * 2.2) * 0.08;
    core.material.opacity = pulse;

    // Molecular droplets orbit around the pod and spin on their own axes
    for (const m of parts) {
      const u = m.userData;
      u.orbitAngle += u.orbitSpeed;
      m.position.x = Math.cos(u.orbitAngle) * u.orbitRadius;
      m.position.z = Math.sin(u.orbitAngle) * u.orbitRadius - 2;
      m.position.y = u.baseY + Math.sin(t * 1.8 + u.bobPhase) * 0.35;
      m.rotation.y += u.spinY;
      m.rotation.x += u.spinX;
    }

    renderer.render(scene, camera);
  })();
})();
