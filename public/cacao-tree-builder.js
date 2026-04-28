// Caúa cacao tree procedural builder.
// Reads /cacao-tree-spec.json and generates a Three.js Group with trunk, branches,
// cauliflory + branch pods, and lanceolate leaves. The animation loop in
// /investor-3d.js drives each pod's ripening by calling ripeningColor(THREE, spec, t).
//
// Loads as a plain global before /investor-3d.js. No bundler, no ES modules.
//   window.CauaCacaoBuilder = { buildFromSpec, ripeningColor }
//
// Phase 2 (Slice A+B). Slices C–E (corridor, walk-cut-fall loop, peasant SVG)
// are deferred to follow-up commits.

(function () {
  // ─── Math + color utilities ─────────────────────────────────────────
  const lerp = (a, b, t) => a + (b - a) * t;

  function seededRand(seed) {
    let s = seed | 0;
    return function () {
      s = (s * 9301 + 49297) | 0;
      s = (s ^ (s >>> 16)) | 0;
      const v = (s & 0x7fffffff) / 0x7fffffff;
      return v;
    };
  }

  // Interpolate the spec's ripening keyframes at normalized t ∈ [0,1].
  // Returns a fresh THREE.Color each call so callers can mutate freely.
  function ripeningColor(THREE, spec, tRaw) {
    const keyframes = spec.pods.ripening_cycle.keyframes;
    let t = tRaw - Math.floor(tRaw); // wrap into [0,1]
    if (t < 0) t += 1;
    // Find the segment
    for (let i = 0; i < keyframes.length - 1; i++) {
      const a = keyframes[i];
      const b = keyframes[i + 1];
      if (t >= a.t && t <= b.t) {
        const span = b.t - a.t || 1;
        const u = (t - a.t) / span;
        const cA = new THREE.Color(a.color);
        const cB = new THREE.Color(b.color);
        cA.lerp(cB, u);
        const emissive = lerp(a.emissive, b.emissive, u);
        const gloss = lerp(a.gloss, b.gloss, u);
        return { color: cA, emissive, gloss, name: u < 0.5 ? a.name : b.name };
      }
    }
    // Edge case: t > last keyframe → last value
    const last = keyframes[keyframes.length - 1];
    return { color: new THREE.Color(last.color), emissive: last.emissive, gloss: last.gloss, name: last.name };
  }

  // ─── Trunk ──────────────────────────────────────────────────────────
  // Cylindrical trunk with vertex-painted moss + lichen patches per spec.bark.
  // Uses MeshStandardMaterial with vertexColors so we don't need a texture.
  function buildTrunk(THREE, spec, archScale, rng) {
    const cfg = spec.trunk;
    const h = cfg.height_m * archScale.height;
    const segR = cfg.segments.radial;
    const segV = cfg.segments.vertical;
    const geo = new THREE.CylinderGeometry(cfg.tip_radius_m, cfg.base_radius_m, h, segR, segV);

    // Bark displacement — three octaves of sine for organic ridges
    const pos = geo.attributes.position;
    const tmp = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      tmp.fromBufferAttribute(pos, i);
      const ang = Math.atan2(tmp.z, tmp.x);
      const r = Math.sqrt(tmp.x * tmp.x + tmp.z * tmp.z);
      const bark =
        Math.sin(tmp.y * cfg.bark.scale_y * 80) * 0.012 +
        Math.cos(tmp.y * 11 + ang * cfg.bark.scale_x * 16) * 0.008 +
        Math.sin(tmp.y * 19 + ang * 9.3) * 0.005;
      const nr = r + bark * cfg.bark.noise_scale;
      pos.setX(i, Math.cos(ang) * nr);
      pos.setZ(i, Math.sin(ang) * nr);
    }
    geo.computeVertexNormals();

    // Vertex colors — base bark + moss patches near base + lichen highlights up top
    const colors = new Float32Array(pos.count * 3);
    const cBark = new THREE.Color(cfg.bark.base_color);
    const cMoss = new THREE.Color(cfg.bark.moss_overlay_color);
    const cLichen = new THREE.Color(cfg.bark.lichen_patch_color);
    const cWet = new THREE.Color(cfg.bark.wet_streak_color);
    const tmpCol = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      tmp.fromBufferAttribute(pos, i);
      const yNorm = (tmp.y + h / 2) / h; // 0 at base → 1 at top
      const ang = Math.atan2(tmp.z, tmp.x);
      // Moss is denser near the base (yNorm < 0.6) and wraps the shaded side.
      // We want this VERY visible — the moss is the visual signature of the tree.
      const mossField =
        Math.max(0, 1 - yNorm * 1.4) *                 // generous base falloff
        (0.55 + 0.45 * Math.sin(ang * 1.8 + tmp.y * 1.1)) *  // angular pattern
        cfg.bark.moss_coverage;
      // Wet streak — narrow vertical stripes
      const streakField =
        Math.max(0, 0.85 - Math.abs(Math.sin(ang * 3 + 0.6))) *
        Math.max(0, 1 - yNorm) * 0.5;
      // Lichen — bright pale patches; multi-octave noise above mid trunk
      const noise = Math.sin(tmp.y * 4.5 + ang * 7.1) + Math.cos(tmp.y * 9.2 + ang * 3.4) * 0.6;
      const lichenField =
        Math.max(0, noise - 0.4) *
        Math.max(0, yNorm - 0.15) * 1.3;

      tmpCol.copy(cBark);
      tmpCol.lerp(cMoss, Math.min(1, mossField));
      tmpCol.lerp(cWet, Math.min(0.7, streakField));
      tmpCol.lerp(cLichen, Math.min(0.85, lichenField));
      colors[i * 3] = tmpCol.r;
      colors[i * 3 + 1] = tmpCol.g;
      colors[i * 3 + 2] = tmpCol.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: cfg.bark.roughness,
      metalness: 0,
      transparent: true,
      opacity: 1,
    });

    const trunk = new THREE.Mesh(geo, mat);
    trunk.position.y = h / 2;

    // Lean from spec — small tilt
    trunk.rotation.x = cfg.lean.x * (rng() - 0.5);
    trunk.rotation.z = cfg.lean.z * (rng() - 0.5);

    return { mesh: trunk, height: h };
  }

  // ─── Branches ───────────────────────────────────────────────────────
  // Returns an array of branch descriptors: { tipX, tipY, tipZ, group, kind, length }.
  function buildBranches(THREE, spec, trunkHeight, rng) {
    const cfg = spec.branches;
    const branchMat = new THREE.MeshStandardMaterial({
      color: spec.trunk.bark.base_color, // reuse trunk bark base
      roughness: 0.92,
      metalness: 0,
      transparent: true,
      opacity: 1,
    });

    const group = new THREE.Group();
    const branches = [];
    const primaryCount = Math.round(lerp(cfg.primary.count_range[0], cfg.primary.count_range[1], rng()));

    for (let i = 0; i < primaryCount; i++) {
      const baseAzimuth = (i / primaryCount) * Math.PI * 2 + (rng() - 0.5) * cfg.primary.azimuth_jitter;
      const splitH = lerp(cfg.primary.split_height_range_m[0], cfg.primary.split_height_range_m[1], rng())
                   + trunkHeight * 0.5; // shift to upper trunk
      const len = lerp(cfg.primary.length_range_m[0], cfg.primary.length_range_m[1], rng()) * 1.6;
      const elev = lerp(cfg.primary.elevation_range[0], cfg.primary.elevation_range[1], rng());
      const tilt = Math.PI / 2 - elev; // 0 = horizontal, π/2 = vertical

      const r0 = 0.10;
      const r1 = r0 * cfg.primary.taper;
      const branchGeo = new THREE.CylinderGeometry(r1, r0, len, 7);
      const br = new THREE.Mesh(branchGeo, branchMat);
      br.position.set(Math.cos(baseAzimuth) * 0.15, splitH, Math.sin(baseAzimuth) * 0.15);
      br.rotation.z = -Math.cos(baseAzimuth) * tilt;
      br.rotation.x = Math.sin(baseAzimuth) * tilt;
      br.translateY(len / 2);
      group.add(br);

      const tipX = Math.cos(baseAzimuth) * (0.15 + Math.sin(tilt) * len * 0.9);
      const tipY = splitH + Math.cos(tilt) * len * 0.9;
      const tipZ = Math.sin(baseAzimuth) * (0.15 + Math.sin(tilt) * len * 0.9);
      branches.push({ kind: 'primary', azimuth: baseAzimuth, tipX, tipY, tipZ, length: len });

      // Secondary branches off this primary — origin at branch midpoint, splayed
      const midX = Math.cos(baseAzimuth) * (0.15 + Math.sin(tilt) * len * 0.55);
      const midY = splitH + Math.cos(tilt) * len * 0.55;
      const midZ = Math.sin(baseAzimuth) * (0.15 + Math.sin(tilt) * len * 0.55);
      const secCount = Math.round(lerp(cfg.secondary.count_per_primary[0], cfg.secondary.count_per_primary[1], rng()));
      for (let s = 0; s < secCount; s++) {
        const sAz = baseAzimuth + (rng() - 0.5) * 1.2;
        const sLen = lerp(cfg.secondary.length_range_m[0], cfg.secondary.length_range_m[1], rng()) * 1.4;
        const sElev = lerp(cfg.secondary.elevation_range[0], cfg.secondary.elevation_range[1], rng());
        const sTilt = Math.PI / 2 - (elev + sElev);
        const sR0 = 0.05;
        const sGeo = new THREE.CylinderGeometry(sR0 * 0.5, sR0, sLen, 6);
        const sBr = new THREE.Mesh(sGeo, branchMat);
        sBr.position.set(midX, midY, midZ);
        sBr.rotation.z = -Math.cos(sAz) * sTilt;
        sBr.rotation.x = Math.sin(sAz) * sTilt;
        sBr.translateY(sLen / 2);
        group.add(sBr);
        const stx = midX + Math.cos(sAz) * Math.sin(sTilt) * sLen * 0.9;
        const sty = midY + Math.cos(sTilt) * sLen * 0.9;
        const stz = midZ + Math.sin(sAz) * Math.sin(sTilt) * sLen * 0.9;
        branches.push({ kind: 'secondary', azimuth: sAz, tipX: stx, tipY: sty, tipZ: stz, length: sLen });
      }
    }

    return { group, branches, branchMat };
  }

  // ─── Pod (ridged) ───────────────────────────────────────────────────
  // A capsule-ish surface with N longitudinal ridges, narrow tip taper.
  function buildRidgedPodGeometry(THREE, spec, scale) {
    const cfg = spec.pods.shape;
    const ridges = cfg.ridges;
    const ridgeDepth = cfg.ridge_depth;
    const tipTaper = cfg.tip_taper;
    const segments = 24;
    const stacks = 18;
    const length = cfg.length_m * scale;
    const width = cfg.width_m * scale;

    const positions = [];
    const indices = [];
    for (let s = 0; s <= stacks; s++) {
      const v = s / stacks; // 0 → 1 along length
      const yNorm = v * 2 - 1;
      // Pod profile — narrow at ends, fattest at 0.55
      const profile = Math.pow(Math.sin(v * Math.PI), 0.85);
      const tipFactor = v < 0.85 ? 1 : 1 - (v - 0.85) / 0.15 * tipTaper;
      const y = yNorm * length * 0.5;
      for (let r = 0; r <= segments; r++) {
        const u = r / segments;
        const theta = u * Math.PI * 2;
        // Ridge wave around theta, modulated by axial position so ridges fade at tips
        const ridgeMul = 1 + Math.cos(theta * ridges) * ridgeDepth * (0.6 + 0.4 * profile);
        const radius = profile * width * 0.5 * tipFactor * ridgeMul;
        positions.push(Math.cos(theta) * radius, y, Math.sin(theta) * radius);
      }
    }
    for (let s = 0; s < stacks; s++) {
      for (let r = 0; r < segments; r++) {
        const a = s * (segments + 1) + r;
        const b = a + segments + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }

  // Build a pod mesh with material driven by ripening keyframes (initialized at t=0).
  // Group origin is the stem-to-attachment point: stem extends UP into the trunk/branch,
  // pod hangs DOWN below the origin with full extent below. Caller positions the group
  // at the trunk surface or branch tip; no rotation needed for natural orientation.
  function buildPod(THREE, spec, scale, phase, variant) {
    const geo = buildRidgedPodGeometry(THREE, spec, scale);
    const start = ripeningColor(THREE, spec, phase);
    const mat = new THREE.MeshStandardMaterial({
      color: start.color.clone(),
      emissive: new THREE.Color(start.color).multiplyScalar(start.emissive),
      emissiveIntensity: start.emissive,
      roughness: 1 - start.gloss * 0.6,
      metalness: 0.05,
      transparent: true,
      opacity: 1,
    });
    const stemMat = new THREE.MeshStandardMaterial({
      color: 0x3a2a18, roughness: 0.95,
    });
    const podLen = spec.pods.shape.length_m * scale;
    const stemLen = spec.pods.shape.stem_length_m * scale;
    const stemGeo = new THREE.CylinderGeometry(0.012 * scale, 0.018 * scale, stemLen, 6);
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.y = stemLen * 0.5;          // stem extends UP from origin
    const podMesh = new THREE.Mesh(geo, mat);
    podMesh.position.y = -podLen * 0.5;        // pod hangs BELOW origin
    const group = new THREE.Group();
    group.add(podMesh);
    group.add(stem);
    group.userData = { material: mat, phase, variant };
    return group;
  }

  // ─── Leaf (lanceolate, two-sided, translucent) ──────────────────────
  function buildLeafGeometry(THREE) {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.bezierCurveTo(0.06, 0.06, 0.10, 0.18, 0.07, 0.42);
    shape.bezierCurveTo(0.04, 0.55, 0.01, 0.62, 0, 0.62);
    shape.bezierCurveTo(-0.01, 0.62, -0.04, 0.55, -0.07, 0.42);
    shape.bezierCurveTo(-0.10, 0.18, -0.06, 0.06, 0, 0);
    return new THREE.ShapeGeometry(shape, 6);
  }

  function buildLeafMaterial(THREE, spec) {
    // Pick a color from the weighted palette (default to mature_green for the base mat)
    const palette = spec.leaves.color_palette;
    const color = new THREE.Color(palette[0].color);
    return new THREE.MeshStandardMaterial({
      color,
      roughness: 0.78,
      metalness: 0.02,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 1 - spec.leaves.translucency * 0.15, // slightly hint at translucency
      emissive: new THREE.Color(palette[0].color).multiplyScalar(0.18),
      emissiveIntensity: 0.18,
    });
  }

  function pickWeighted(palette, rng) {
    const sum = palette.reduce((acc, p) => acc + p.weight, 0);
    let pick = rng() * sum;
    for (const p of palette) {
      pick -= p.weight;
      if (pick <= 0) return p;
    }
    return palette[palette.length - 1];
  }

  // ─── Public API ─────────────────────────────────────────────────────
  function buildFromSpec(THREE, spec, opts) {
    opts = opts || {};
    const archetype = opts.archetype || 'mature';
    const seed = opts.seed != null ? opts.seed : 1;
    const rng = seededRand(seed);

    // Archetype scale modifiers
    const archScale =
      archetype === 'young'  ? { height: 0.55, podDensity: 0.20, leafDensity: 0.55 } :
      archetype === 'medium' ? { height: 0.78, podDensity: 0.55, leafDensity: 0.78 } :
      archetype === 'old'    ? { height: 1.10, podDensity: 0.95, leafDensity: 0.85 } :
                               { height: 1.00, podDensity: 1.00, leafDensity: 1.00 };

    const root = new THREE.Group();
    root.userData = { pods: [], spec, archetype };

    // 1. Trunk
    const { mesh: trunkMesh, height: trunkHeight } = buildTrunk(THREE, spec, archScale, rng);
    root.add(trunkMesh);

    // 2. Branches
    const { group: branchGroup, branches } = buildBranches(THREE, spec, trunkHeight, rng);
    root.add(branchGroup);

    // 3. Cauliflory pods on the trunk (the visual signature)
    if (spec.branches.trunk_pods_origin.enabled) {
      const cfg = spec.branches.trunk_pods_origin;
      const count = Math.round(
        lerp(cfg.count_range[0], cfg.count_range[1], rng()) * archScale.podDensity
      );
      const variants = spec.pods.variants;
      for (let i = 0; i < count; i++) {
        const variant = pickWeighted(variants, rng);
        const phase = rng() * spec.pods.ripening_cycle.phase_offset_jitter;
        const heightT = lerp(cfg.height_range_m[0], cfg.height_range_m[1], rng()) / spec.trunk.height_m;
        const azimuth = rng() * Math.PI * 2;
        const radius = (spec.trunk.base_radius_m + spec.trunk.tip_radius_m) * 0.5 * 0.95;
        const yPos = heightT * trunkHeight;
        const podScale = 1.5 + rng() * 0.3;
        const pod = buildPod(THREE, spec, podScale, phase, variant.name);
        pod.position.set(Math.cos(azimuth) * radius, yPos, Math.sin(azimuth) * radius);
        // Hang downward — tip pointing -Y, stem at +Y
        pod.rotation.x = Math.PI; // flip
        // Tilt outward following the trunk surface normal
        pod.rotation.z = Math.cos(azimuth) * 0.55;
        pod.rotation.x += Math.sin(azimuth) * 0.55;
        root.add(pod);
        root.userData.pods.push({
          group: pod,
          material: pod.userData.material,
          phase,
          variant: variant.name,
          attachment: 'trunk',
        });
      }
    }

    // 4. Branch pods (secondary branches mostly)
    const branchPodDensity = spec.pods.density_per_branch_kind;
    for (const br of branches) {
      const density = branchPodDensity[br.kind === 'primary' ? 'primary_branches' : 'secondary_branches'] || 0;
      const odds = density * archScale.podDensity * 0.5;
      if (rng() > odds) continue;
      const variant = pickWeighted(spec.pods.variants, rng);
      const phase = rng() * spec.pods.ripening_cycle.phase_offset_jitter;
      const podScale = 1.4 + rng() * 0.25;
      const pod = buildPod(THREE, spec, podScale, phase, variant.name);
      pod.position.set(br.tipX, br.tipY, br.tipZ);
      pod.rotation.x = Math.PI; // hang down
      pod.rotation.z = Math.cos(br.azimuth) * 0.4;
      root.add(pod);
      root.userData.pods.push({
        group: pod,
        material: pod.userData.material,
        phase,
        variant: variant.name,
        attachment: br.kind,
      });
    }

    // 5. Leaves — clustered around branch tips
    const leafGeo = buildLeafGeometry(THREE);
    const leafCount = Math.round(spec.leaves.cluster_count_per_secondary[1] * archScale.leafDensity);
    root.userData.leaves = [];
    const palette = spec.leaves.color_palette;
    for (const br of branches) {
      const clusters = Math.round(lerp(spec.leaves.cluster_count_per_secondary[0], spec.leaves.cluster_count_per_secondary[1], rng())
        * archScale.leafDensity);
      for (let c = 0; c < clusters; c++) {
        const leavesInCluster = Math.round(lerp(spec.leaves.leaves_per_cluster[0], spec.leaves.leaves_per_cluster[1], rng()));
        const cAng = rng() * Math.PI * 2;
        const cRad = rng() * 0.7;
        const cx = br.tipX + Math.cos(cAng) * cRad;
        const cy = br.tipY + (rng() - 0.5) * 0.8;
        const cz = br.tipZ + Math.sin(cAng) * cRad;
        for (let l = 0; l < leavesInCluster; l++) {
          const variant = pickWeighted(palette, rng);
          const mat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(variant.color),
            roughness: 0.78,
            metalness: 0.02,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 1,
            emissive: new THREE.Color(variant.color).multiplyScalar(0.16),
            emissiveIntensity: 0.16,
          });
          const leaf = new THREE.Mesh(leafGeo, mat);
          const sz = lerp(spec.leaves.size_range_m[0], spec.leaves.size_range_m[1], rng());
          leaf.scale.setScalar(sz * 5); // visual scale for the scene
          leaf.position.set(
            cx + (rng() - 0.5) * 0.7,
            cy + (rng() - 0.5) * 0.7,
            cz + (rng() - 0.5) * 0.7
          );
          leaf.rotation.y = rng() * Math.PI * 2;
          const baseRotZ = (rng() - 0.5) * 0.9;
          leaf.rotation.z = baseRotZ;
          leaf.rotation.x = -Math.PI / 2 + (rng() - 0.5) * 0.4;
          const userData = {
            baseRotZ,
            phase: rng() * Math.PI * 2,
            freq: spec.leaves.wind.frequency_hz * (0.7 + rng() * 0.6),
            amp: spec.leaves.wind.amplitude * (0.7 + rng() * 0.6),
          };
          leaf.userData = userData;
          root.userData.leaves.push(leaf);
          root.add(leaf);
        }
      }
    }
    void leafCount; // reserved if we want a global cap later
    void buildLeafMaterial; // exported helper currently unused; kept for future use

    return root;
  }

  // ─── Export ─────────────────────────────────────────────────────────
  window.CauaCacaoBuilder = {
    buildFromSpec,
    ripeningColor,
  };
})();
