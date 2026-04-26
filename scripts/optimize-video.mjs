#!/usr/bin/env node
/**
 * optimize-video.mjs — UI/UX Bar asset pipeline (docs/context/ui-ux-bar.md)
 *
 * Scroll-scrubbed video encoder: every frame a keyframe (-g 1) so rAF scrubbing
 * under motion.dev's scroll() is smooth. Targets H.264/MP4 + VP9/WebM + JPG poster.
 *
 * Usage:
 *   node scripts/optimize-video.mjs <input.mov|mp4|webm>
 *
 * Targets (UI/UX Bar):
 *   MP4  ≤ 6 MB  (H.264, yuv420p, -g 1 keyframe-per-frame, faststart)
 *   WebM ≤ 4 MB  (VP9, yuv420p, -g 1)
 *   Poster ≤ 200 KB (JPG, frame 0, 1920 wide)
 *
 * Requires: ffmpeg on host (brew install ffmpeg).
 */

import { spawnSync } from 'node:child_process';
import { resolve, basename, dirname, extname, join } from 'node:path';
import { statSync, existsSync } from 'node:fs';

const args = process.argv.slice(2);
if (!args[0]) {
  console.error('Usage: node scripts/optimize-video.mjs <input>');
  process.exit(2);
}
const input = resolve(args[0]);
if (!existsSync(input)) {
  console.error(`Input not found: ${input}`);
  process.exit(2);
}

// Check ffmpeg availability
const ffmpegCheck = spawnSync('ffmpeg', ['-version'], { encoding: 'utf8' });
if (ffmpegCheck.error || ffmpegCheck.status !== 0) {
  console.error('✗ ffmpeg not found. Install: brew install ffmpeg');
  process.exit(1);
}

const base = basename(input, extname(input));
const dir = dirname(input);
const mp4Out = join(dir, `${base}.mp4`);
const webmOut = join(dir, `${base}.webm`);
const posterOut = join(dir, `${base}-poster.jpg`);

const TARGETS = { mp4: 6, webm: 4, poster: 0.2 };

function run(args) {
  const r = spawnSync('ffmpeg', args, { stdio: 'inherit' });
  if (r.status !== 0) { console.error('✗ ffmpeg failed'); process.exit(1); }
}

function sizeMB(path) {
  return statSync(path).size / 1024 / 1024;
}

console.log('→ encoding MP4 (H.264, keyframe-per-frame for scroll scrubbing)...');
run([
  '-y', '-i', input,
  '-c:v', 'libx264',
  '-preset', 'slow',
  '-crf', '28',
  '-g', '1',                          // keyframe every frame
  '-pix_fmt', 'yuv420p',
  '-movflags', '+faststart',
  '-vf', 'scale=1920:-2',
  '-an',                              // drop audio
  mp4Out,
]);

console.log('→ encoding WebM (VP9, keyframe-per-frame)...');
run([
  '-y', '-i', input,
  '-c:v', 'libvpx-vp9',
  '-b:v', '0',
  '-crf', '32',
  '-g', '1',
  '-pix_fmt', 'yuv420p',
  '-vf', 'scale=1920:-2',
  '-an',
  webmOut,
]);

console.log('→ extracting poster frame (frame 0)...');
run([
  '-y', '-i', input,
  '-vframes', '1',
  '-vf', 'scale=1920:-2',
  '-q:v', '3',
  posterOut,
]);

// Report vs targets
console.log('\n=== UI/UX Bar compliance ===');
for (const [label, target, path] of [
  ['MP4',    TARGETS.mp4,    mp4Out],
  ['WebM',   TARGETS.webm,   webmOut],
  ['Poster', TARGETS.poster, posterOut],
]) {
  const mb = sizeMB(path);
  const ok = mb <= target;
  console.log(`  ${ok ? '✓' : '⚠'} ${label.padEnd(7)} ${mb.toFixed(2)} MB / target ${target} MB  ${path}`);
}
