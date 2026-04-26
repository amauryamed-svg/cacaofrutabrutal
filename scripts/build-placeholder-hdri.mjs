#!/usr/bin/env node
/**
 * build-placeholder-hdri.mjs
 *
 * Generates a procedural equirectangular sunrise sky as 2048×1024 JPG.
 * Not true HDR, but Three.js's PMREMGenerator accepts LDR equirectangular
 * textures for scene.environment (acceptable fallback until a real .hdr arrives).
 *
 * Output: public/assets/3d/hdri/huila-sunrise-1k.jpg
 *
 * Real upgrade path (when a real HDRI is available):
 *   1. Download from Poly Haven (polyhaven.com/hdris/outdoor-jungle-morning)
 *   2. Drop .hdr into public/assets/3d/hdri/
 *   3. Run scripts/optimize-hdri.mjs
 *   4. Update investor-3d.js RGBELoader path to the .hdr
 */

import sharp from 'sharp';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '..', 'public', 'assets', '3d', 'hdri', 'huila-sunrise-1k.jpg');
mkdirSync(dirname(OUT), { recursive: true });

const W = 2048;
const H = 1024;

// Generate pixel buffer — equirectangular maps angular coords to (u,v):
//   u = longitude / 2π  (azimuth 0..1)
//   v = (π/2 - latitude) / π  (0=zenith, 1=nadir)
function sunriseColor(u, v) {
  // Top hemisphere = sky, bottom hemisphere = warm horizon + olive canopy glow
  const lat = (1 - v) * Math.PI - Math.PI / 2; // -π/2..π/2
  const azimuth = u * Math.PI * 2;              // 0..2π

  // Sun azimuth at u=0.25 (east), elevation ~10° above horizon
  const sunAz = 0.5 * Math.PI;                  // east quadrant
  const angFromSun = Math.acos(
    Math.sin(lat) * Math.sin(10 / 180 * Math.PI) +
    Math.cos(lat) * Math.cos(10 / 180 * Math.PI) * Math.cos(azimuth - sunAz)
  );

  // Sky gradient — warm sunrise: deep purple zenith → coral → amber → warm horizon
  const vSky = Math.max(0, Math.sin(lat)); // 0 horizon, 1 zenith
  let r, g, b;
  if (lat >= -0.05) {
    // Sky
    const zenith   = [0.15, 0.10, 0.22];    // deep violet (Cosmic Criollo dilute)
    const mid      = [0.80, 0.42, 0.28];    // Theobroma coral
    const horizon  = [0.92, 0.68, 0.35];    // golden Mazorca
    const t = Math.pow(vSky, 0.7);
    r = lerp(lerp(horizon[0], mid[0], Math.min(1, t * 2)), zenith[0], Math.max(0, t * 2 - 1));
    g = lerp(lerp(horizon[1], mid[1], Math.min(1, t * 2)), zenith[1], Math.max(0, t * 2 - 1));
    b = lerp(lerp(horizon[2], mid[2], Math.min(1, t * 2)), zenith[2], Math.max(0, t * 2 - 1));

    // Sun disk — bright, warm halo
    const sunIntensity = Math.exp(-angFromSun * 8);
    const sunHalo = Math.exp(-angFromSun * 2.2) * 0.25;
    r += sunIntensity * 1.5 + sunHalo * 0.9;
    g += sunIntensity * 1.2 + sunHalo * 0.55;
    b += sunIntensity * 0.6 + sunHalo * 0.2;
  } else {
    // Ground / canopy hemisphere — olive-tinged dark to suggest forest floor
    const t = Math.min(1, -lat / (Math.PI / 2));
    r = lerp(0.18, 0.08, t);
    g = lerp(0.22, 0.12, t);
    b = lerp(0.12, 0.05, t);
    // Occasional "gap" brightness to simulate canopy breaks (low-freq noise)
    const gap = Math.sin(azimuth * 5) * Math.cos(lat * 8) * 0.04;
    r += gap; g += gap * 1.1; b += gap * 0.7;
  }
  return [clamp(r), clamp(g), clamp(b)];
}

function lerp(a, b, t) { return a + (b - a) * Math.max(0, Math.min(1, t)); }
function clamp(x) { return Math.max(0, Math.min(1, x)); }

const pixels = Buffer.alloc(W * H * 3);
for (let y = 0; y < H; y++) {
  const v = y / H;
  for (let x = 0; x < W; x++) {
    const u = x / W;
    const [r, g, b] = sunriseColor(u, v);
    const i = (y * W + x) * 3;
    pixels[i]     = Math.round(r * 255);
    pixels[i + 1] = Math.round(g * 255);
    pixels[i + 2] = Math.round(b * 255);
  }
}

await sharp(pixels, { raw: { width: W, height: H, channels: 3 } })
  .jpeg({ quality: 88 })
  .toFile(OUT);

const { statSync } = await import('node:fs');
const sizeKB = statSync(OUT).size / 1024;
console.log(`✓ huila-sunrise-1k.jpg → ${OUT}`);
console.log(`  size: ${sizeKB.toFixed(1)} KB · ${W}×${H} equirectangular`);
console.log(`  usage: RGBELoader cannot read .jpg — use TextureLoader + EquirectangularReflectionMapping`);
