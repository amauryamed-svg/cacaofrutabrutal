#!/usr/bin/env node
/**
 * optimize-gltf.mjs — UI/UX Bar asset pipeline (docs/context/ui-ux-bar.md)
 *
 * Usage:
 *   node scripts/optimize-gltf.mjs <input.glb> [output.glb]
 *
 * Pipeline: dedup → weld → simplify(0.75) → prune → resample → draco → textureCompress
 * Target: ≤ 3MB per GLB, Draco mandatory, KTX2 textures mandatory above 512px.
 */

import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';
import {
  dedup, weld, simplify, prune, resample, draco, textureCompress,
} from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import { resolve, basename, dirname, extname, join } from 'node:path';
import { statSync } from 'node:fs';

const args = process.argv.slice(2);
if (!args[0]) {
  console.error('Usage: node scripts/optimize-gltf.mjs <input.glb> [output.glb]');
  process.exit(2);
}
const input = resolve(args[0]);
const output = args[1]
  ? resolve(args[1])
  : join(dirname(input), basename(input, extname(input)) + '.opt.glb');

const SIZE_TARGET_MB = 3;

async function main() {
  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({
      'draco3d.decoder': await draco3d.createDecoderModule(),
      'draco3d.encoder': await draco3d.createEncoderModule(),
    });

  const doc = await io.read(input);
  const beforeBytes = statSync(input).size;

  await doc.transform(
    dedup(),
    weld(),
    simplify({ simplifier: MeshoptSimplifier, ratio: 0.75, error: 0.001 }),
    resample(),
    prune({ keepLeaves: false }),
    draco({ method: 'edgebreaker', quantizePosition: 14, quantizeNormal: 10, quantizeColor: 8, quantizeTexcoord: 12 }),
    textureCompress({ targetFormat: 'webp', resize: [2048, 2048] })
  );

  await io.write(output, doc);
  const afterBytes = statSync(output).size;
  const afterMB = afterBytes / 1024 / 1024;

  console.log(`  in:  ${(beforeBytes / 1024 / 1024).toFixed(2)} MB  ${input}`);
  console.log(`  out: ${afterMB.toFixed(2)} MB  ${output}`);
  console.log(`  reduction: ${((1 - afterBytes / beforeBytes) * 100).toFixed(1)}%`);
  if (afterMB > SIZE_TARGET_MB) {
    console.warn(`  ⚠ exceeds UI/UX Bar target of ${SIZE_TARGET_MB}MB — consider reducing mesh density or texture resolution`);
    process.exit(1);
  }
  console.log(`  ✓ within UI/UX Bar asset budget`);
}

main().catch(err => { console.error(err); process.exit(1); });
