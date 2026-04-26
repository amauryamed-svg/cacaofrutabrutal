#!/usr/bin/env node
/**
 * build-placeholder-gltf.mjs
 *
 * Generates a procedural agroforestry GLB for Caúa's investor-landing 3D scene.
 * Not art-grade — meant to wire up Phase 2b (GLTFLoader) and replace when real Blender/Spline assets arrive.
 *
 * Scene: cacao trees (central trio) + banano flanks + mango back + ground disk.
 * Output: public/assets/3d/agroforest.glb
 */

import { Document, NodeIO } from '@gltf-transform/core';
import { dedup, prune, weld } from '@gltf-transform/functions';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '..', 'public', 'assets', '3d', 'agroforest.glb');
mkdirSync(dirname(OUT), { recursive: true });

// ── Brand palette (matches docs/brand/REFERENCE.md, baked into materials) ──
const PALETTE = {
  bark:       [0.22, 0.16, 0.10], // Santa Maria Brown-ish
  cacaoLeaf:  [0.29, 0.36, 0.14], // Leafy Green
  cacaoPod:   [0.68, 0.34, 0.16], // Theobroma Orange (ripe mazorca)
  bananoLeaf: [0.40, 0.55, 0.22], // lighter banana green
  bananoStem: [0.45, 0.48, 0.18], // pale greenish-yellow pseudostem
  mangoLeaf:  [0.23, 0.30, 0.12], // deeper olive
  mangoFruit: [0.85, 0.55, 0.20], // orangey mango
  ground:     [0.18, 0.12, 0.08], // rich volcanic soil
  stone:      [0.35, 0.32, 0.28], // occasional stones
};

// ── Primitive builders — all return { positions, normals, indices } ──
function cylinder(radius = 1, height = 1, segments = 16, taperRatio = 1) {
  const rTop = radius * taperRatio;
  const pos = []; const nor = []; const idx = [];
  // side
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const c = Math.cos(a), s = Math.sin(a);
    pos.push(rTop * c, height / 2, rTop * s);
    pos.push(radius * c, -height / 2, radius * s);
    nor.push(c, 0, s); nor.push(c, 0, s);
  }
  for (let i = 0; i < segments; i++) {
    const a = i * 2, b = a + 1, d = a + 2, e = a + 3;
    idx.push(a, b, d, b, e, d);
  }
  // caps
  const baseTop = pos.length / 3;
  pos.push(0, height / 2, 0); nor.push(0, 1, 0);
  const baseBot = pos.length / 3;
  pos.push(0, -height / 2, 0); nor.push(0, -1, 0);
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const next = ((i + 1) / segments) * Math.PI * 2;
    pos.push(rTop * Math.cos(a), height / 2, rTop * Math.sin(a)); nor.push(0, 1, 0);
    pos.push(rTop * Math.cos(next), height / 2, rTop * Math.sin(next)); nor.push(0, 1, 0);
    idx.push(baseTop, baseTop + 1 + i * 2, baseTop + 2 + i * 2);
    pos.push(radius * Math.cos(a), -height / 2, radius * Math.sin(a)); nor.push(0, -1, 0);
    pos.push(radius * Math.cos(next), -height / 2, radius * Math.sin(next)); nor.push(0, -1, 0);
    idx.push(baseBot, baseBot + 2 + i * 2 + segments * 2, baseBot + 1 + i * 2 + segments * 2);
  }
  return { positions: Float32Array.from(pos), normals: Float32Array.from(nor), indices: Uint16Array.from(idx) };
}

function sphere(radius = 1, segments = 16, rings = 12) {
  const pos = []; const nor = []; const idx = [];
  for (let r = 0; r <= rings; r++) {
    const theta = (r / rings) * Math.PI;
    const sinT = Math.sin(theta), cosT = Math.cos(theta);
    for (let s = 0; s <= segments; s++) {
      const phi = (s / segments) * Math.PI * 2;
      const x = sinT * Math.cos(phi), y = cosT, z = sinT * Math.sin(phi);
      pos.push(radius * x, radius * y, radius * z);
      nor.push(x, y, z);
    }
  }
  for (let r = 0; r < rings; r++) {
    for (let s = 0; s < segments; s++) {
      const a = r * (segments + 1) + s;
      const b = a + segments + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  return { positions: Float32Array.from(pos), normals: Float32Array.from(nor), indices: Uint16Array.from(idx) };
}

// Elongated leaf plane — flat oval billboard with gentle curve
function leafPlane(w = 0.4, h = 1.6) {
  const segs = 10;
  const pos = []; const nor = []; const idx = [];
  for (let j = 0; j <= segs; j++) {
    const t = j / segs;
    // oval profile + droop curve
    const y = t * h - h / 2;
    const droop = Math.sin(t * Math.PI) * 0.15;
    const curveZ = droop;
    const widthAtY = w * Math.sin(t * Math.PI);
    pos.push(-widthAtY, y, curveZ);
    pos.push( widthAtY, y, curveZ);
    nor.push(0, 0, 1); nor.push(0, 0, 1);
  }
  for (let j = 0; j < segs; j++) {
    const a = j * 2, b = a + 1, c = a + 2, d = a + 3;
    idx.push(a, b, c, b, d, c);
  }
  return { positions: Float32Array.from(pos), normals: Float32Array.from(nor), indices: Uint16Array.from(idx) };
}

// ── Build document ──────────────────────────────────────────────
const doc = new Document();
const buffer = doc.createBuffer();
const scene = doc.createScene('Agroforest');

// Material factory
const materials = {};
function mat(name, rgb, roughness = 0.85, metallic = 0) {
  if (materials[name]) return materials[name];
  const m = doc.createMaterial(name)
    .setBaseColorFactor([...rgb, 1])
    .setRoughnessFactor(roughness)
    .setMetallicFactor(metallic);
  materials[name] = m;
  return m;
}

function meshFromGeo(name, geo, material) {
  const pPrim = doc.createPrimitive()
    .setMaterial(material)
    .setAttribute('POSITION', doc.createAccessor().setArray(geo.positions).setType('VEC3').setBuffer(buffer))
    .setAttribute('NORMAL',   doc.createAccessor().setArray(geo.normals).setType('VEC3').setBuffer(buffer))
    .setIndices(doc.createAccessor().setArray(geo.indices).setType('SCALAR').setBuffer(buffer));
  return doc.createMesh(name).addPrimitive(pPrim);
}

function node(name, mesh, position = [0, 0, 0], rotation = [0, 0, 0, 1], scale = [1, 1, 1]) {
  return doc.createNode(name).setMesh(mesh).setTranslation(position).setRotation(rotation).setScale(scale);
}

// Quaternion from axis-angle (axis y, angle radians)
function rotY(rad) {
  const h = rad / 2;
  return [0, Math.sin(h), 0, Math.cos(h)];
}

// ── Build agroforestry tree types ───────────────────────────────
function buildCacaoTree(id, pos, scaleFactor = 1) {
  const group = doc.createNode(`cacao-${id}`).setTranslation(pos).setScale([scaleFactor, scaleFactor, scaleFactor]);
  // Trunk — slender cylinder with taper
  const trunkGeo = cylinder(0.14, 4.0, 12, 0.75);
  const trunk = meshFromGeo(`cacao-${id}-trunk`, trunkGeo, mat('bark', PALETTE.bark, 0.92));
  group.addChild(node(`cacao-${id}-trunk-node`, trunk, [0, 2.0, 0]));
  // Canopy — 3 overlapping spheres (layered foliage)
  const canopyMat = mat('cacaoLeaf', PALETTE.cacaoLeaf, 0.8);
  const canopyGeo = sphere(1.2, 16, 12);
  const canopyA = meshFromGeo(`cacao-${id}-canopy`, canopyGeo, canopyMat);
  group.addChild(node(`cacao-${id}-canopy-a`, canopyA, [0, 4.2, 0], rotY(0), [1.1, 0.9, 1.1]));
  group.addChild(node(`cacao-${id}-canopy-b`, canopyA, [0.7, 4.0, 0.4], rotY(0.6), [0.9, 0.8, 0.9]));
  group.addChild(node(`cacao-${id}-canopy-c`, canopyA, [-0.6, 4.1, -0.3], rotY(-0.9), [0.85, 0.75, 0.85]));
  // Cauliflorous pods on trunk (small ellipsoids)
  const podMat = mat('cacaoPod', PALETTE.cacaoPod, 0.6);
  const podGeo = sphere(0.2, 10, 8);
  const podMesh = meshFromGeo(`cacao-${id}-pod`, podGeo, podMat);
  for (let i = 0; i < 5; i++) {
    const y = 1.2 + i * 0.55;
    const theta = (i / 5) * Math.PI * 2 + (id * 0.7);
    const r = 0.18;
    group.addChild(node(`cacao-${id}-pod-${i}`, podMesh,
      [r * Math.cos(theta), y, r * Math.sin(theta)],
      rotY(0), [0.7, 1.4, 0.7]
    ));
  }
  return group;
}

function buildBanano(id, pos, scaleFactor = 1) {
  const group = doc.createNode(`banano-${id}`).setTranslation(pos).setScale([scaleFactor, scaleFactor, scaleFactor]);
  // Pseudostem — tall slim cylinder
  const stemGeo = cylinder(0.12, 3.5, 10, 0.85);
  const stem = meshFromGeo(`banano-${id}-stem`, stemGeo, mat('bananoStem', PALETTE.bananoStem, 0.88));
  group.addChild(node(`banano-${id}-stem-node`, stem, [0, 1.75, 0]));
  // Leaves — 6 elongated planes radiating from top
  const leafMat = mat('bananoLeaf', PALETTE.bananoLeaf, 0.7);
  const leafGeo = leafPlane(0.55, 2.6);
  const leafMesh = meshFromGeo(`banano-${id}-leaf`, leafGeo, leafMat);
  for (let i = 0; i < 6; i++) {
    const theta = (i / 6) * Math.PI * 2;
    const tiltQuat = rotY(theta);
    group.addChild(node(`banano-${id}-leaf-${i}`, leafMesh,
      [0, 3.5, 0], tiltQuat, [1, 1, 1]
    ));
  }
  return group;
}

function buildMango(id, pos, scaleFactor = 1) {
  const group = doc.createNode(`mango-${id}`).setTranslation(pos).setScale([scaleFactor, scaleFactor, scaleFactor]);
  // Thicker trunk
  const trunkGeo = cylinder(0.32, 5.0, 14, 0.7);
  const trunk = meshFromGeo(`mango-${id}-trunk`, trunkGeo, mat('bark', PALETTE.bark, 0.95));
  group.addChild(node(`mango-${id}-trunk-node`, trunk, [0, 2.5, 0]));
  // Big canopy — 4 layered spheres
  const canopyMat = mat('mangoLeaf', PALETTE.mangoLeaf, 0.82);
  const canopyGeo = sphere(1.8, 16, 12);
  const canopyMesh = meshFromGeo(`mango-${id}-canopy`, canopyGeo, canopyMat);
  group.addChild(node(`mango-${id}-canopy-a`, canopyMesh, [0, 5.5, 0]));
  group.addChild(node(`mango-${id}-canopy-b`, canopyMesh, [1.1, 5.3, 0.3], rotY(0.4), [0.9, 0.9, 0.9]));
  group.addChild(node(`mango-${id}-canopy-c`, canopyMesh, [-0.9, 5.2, -0.5], rotY(-0.6), [0.85, 0.85, 0.85]));
  group.addChild(node(`mango-${id}-canopy-d`, canopyMesh, [0.2, 6.0, -0.4], rotY(1.1), [0.8, 0.7, 0.8]));
  // Mango fruits — a few spheres scattered in canopy
  const fruitMat = mat('mangoFruit', PALETTE.mangoFruit, 0.45);
  const fruitGeo = sphere(0.18, 10, 8);
  const fruitMesh = meshFromGeo(`mango-${id}-fruit`, fruitGeo, fruitMat);
  for (let i = 0; i < 7; i++) {
    const theta = (i / 7) * Math.PI * 2;
    group.addChild(node(`mango-${id}-fruit-${i}`, fruitMesh,
      [Math.cos(theta) * 1.3, 5.2 + Math.sin(theta) * 0.6, Math.sin(theta) * 1.3 - 0.2],
      rotY(0), [0.9, 1.3, 0.9]
    ));
  }
  return group;
}

// Ground disk
const groundGeo = cylinder(14, 0.2, 32, 1);
const groundMesh = meshFromGeo('ground', groundGeo, mat('ground', PALETTE.ground, 0.98));
scene.addChild(doc.createNode('ground-node').setMesh(groundMesh).setTranslation([0, -0.1, 0]));

// ── Place the ecosystem ────────────────────────────────────────
// Central cacao trio
scene.addChild(buildCacaoTree(0, [0, 0, 0], 1.0));
scene.addChild(buildCacaoTree(1, [-2.8, 0, -1.6], 0.92));
scene.addChild(buildCacaoTree(2, [2.6, 0, -1.4], 0.95));
// Banana flanks
scene.addChild(buildBanano(0, [-4.2, 0, 1.8], 1.05));
scene.addChild(buildBanano(1, [4.6, 0, 1.6], 0.95));
scene.addChild(buildBanano(2, [-5.6, 0, -2.8], 1.0));
// Mango shade trees in back
scene.addChild(buildMango(0, [0, 0, -6.2], 1.1));
scene.addChild(buildMango(1, [-5.0, 0, -5.5], 1.0));
scene.addChild(buildMango(2, [5.4, 0, -5.0], 1.05));

// ── Optimize + write ───────────────────────────────────────────
await doc.transform(dedup(), weld(), prune());

const io = new NodeIO();
await io.write(OUT, doc);

const { statSync } = await import('node:fs');
const sizeKB = statSync(OUT).size / 1024;
console.log(`✓ agroforest.glb → ${OUT}`);
console.log(`  size: ${sizeKB.toFixed(1)} KB`);
console.log(`  nodes: ${doc.getRoot().listNodes().length}`);
console.log(`  meshes: ${doc.getRoot().listMeshes().length}`);
console.log(`  materials: ${doc.getRoot().listMaterials().length}`);
