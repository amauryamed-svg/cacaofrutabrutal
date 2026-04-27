#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdirSync, existsSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const templatePath = resolve(__dirname, 'og-template.html');

const args = new Map(
  process.argv.slice(2).flatMap((arg) => {
    const m = arg.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [[m[1], m[2] ?? 'true']] : [];
  })
);

const outputArg = args.get('output');
const outputs = outputArg
  ? [resolve(repoRoot, outputArg)]
  : [resolve(repoRoot, 'tmp/og-preview.png')];

// Build-environment guard: in CI / Vercel, Playwright is installed but Chromium
// browser binaries are not (npm install --ignore-scripts skips the download).
// Treat that as "skip silently" so the build continues using the committed
// public/og.png. Local dev gets full regeneration.
let chromium;
try {
  ({ chromium } = await import('@playwright/test'));
} catch {
  console.log('[og:preview] @playwright/test not installed — skipping');
  process.exit(0);
}

for (const out of outputs) mkdirSync(dirname(out), { recursive: true });

let browser;
try {
  browser = await chromium.launch();
} catch (err) {
  // Chromium binary missing (typical in Vercel build env)
  if (
    err instanceof Error &&
    (err.message.includes("doesn't exist") ||
      err.message.includes('not found') ||
      err.message.includes('Executable doesn'))
  ) {
    console.log('[og:preview] Chromium not installed — skipping (run `npx playwright install chromium` to enable)');
    // If we were asked to write public/og.png and it already exists, that's the canonical fallback.
    if (outputArg && existsSync(outputs[0])) {
      console.log(`[og:preview] using committed ${outputArg}`);
    }
    process.exit(0);
  }
  throw err;
}

try {
  const context = await browser.newContext({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await page.goto(`file://${templatePath}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);

  for (const out of outputs) {
    await page.screenshot({
      path: out,
      type: 'png',
      omitBackground: false,
      clip: { x: 0, y: 0, width: 1200, height: 630 },
    });
    console.log(`✓ ${out}`);
  }
} finally {
  await browser.close();
}
