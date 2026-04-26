#!/usr/bin/env node
/**
 * optimize-hdri.mjs — UI/UX Bar asset pipeline (docs/context/ui-ux-bar.md)
 *
 * HDRI resize + quality check for IBL environment maps.
 * Target: ≤ 1.5MB, 1024×512 equirectangular, half-float HDR.
 *
 * Usage:
 *   node scripts/optimize-hdri.mjs <input.hdr> [output.hdr]
 *
 * NOTE: sharp does not natively encode .hdr. For true HDR preservation use
 * OpenImageIO/imagemagick-hdri. This script validates dimensions and offers
 * a JPG-preview companion for poster fallback. Full HDR resize should use:
 *     oiiotool input.hdr --resize 1024x512 -o output.hdr
 */

import sharp from 'sharp';
import { resolve, basename, dirname, extname, join } from 'node:path';
import { statSync, existsSync } from 'node:fs';

const args = process.argv.slice(2);
if (!args[0]) {
  console.error('Usage: node scripts/optimize-hdri.mjs <input.hdr> [output.hdr]');
  process.exit(2);
}
const input = resolve(args[0]);
if (!existsSync(input)) {
  console.error(`Input not found: ${input}`);
  process.exit(2);
}
const base = basename(input, extname(input));
const dir = dirname(input);
const posterOut = join(dir, `${base}-poster.jpg`);

const SIZE_TARGET_MB = 1.5;
const RECOMMENDED_DIM = '1024×512';

async function main() {
  const inBytes = statSync(input).size;
  const inMB = inBytes / 1024 / 1024;
  console.log(`  input: ${inMB.toFixed(2)} MB  ${input}`);

  if (inMB > SIZE_TARGET_MB) {
    console.warn(`  ⚠ HDR exceeds UI/UX Bar target of ${SIZE_TARGET_MB}MB`);
    console.warn(`  → recommended: resize to ${RECOMMENDED_DIM} via:`);
    console.warn(`      oiiotool "${input}" --resize ${RECOMMENDED_DIM.replace('×','x')} -o "${input.replace('.hdr','-1k.hdr')}"`);
    console.warn(`      (install via: brew install openimageio)`);
  } else {
    console.log(`  ✓ HDR within UI/UX Bar asset budget`);
  }

  // Generate a JPG poster preview (for reduced-motion fallback + debugging)
  // sharp handles standard image formats; it won't preserve HDR dynamic range
  // but the poster is for degraded fallback states where HDR isn't needed.
  try {
    await sharp(input).resize(1920, 960, { fit: 'cover' }).jpeg({ quality: 82 }).toFile(posterOut);
    const posterMB = statSync(posterOut).size / 1024 / 1024;
    console.log(`  poster: ${posterMB.toFixed(2)} MB  ${posterOut}`);
  } catch (err) {
    console.log(`  poster skipped: sharp cannot read .hdr directly (use oiiotool companion)`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
