#!/usr/bin/env node
import { chromium } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdirSync } from 'node:fs';

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

for (const out of outputs) mkdirSync(dirname(out), { recursive: true });

const browser = await chromium.launch();
try {
  const context = await browser.newContext({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 2,
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
