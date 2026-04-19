import { chromium } from '@playwright/test';
import { resolve } from 'path';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1200, height: 630 });

const htmlPath = resolve(projectRoot, 'public/og-catacion.html');
const fileUrl = 'file:///' + htmlPath.split('\\').join('/');
await page.goto(fileUrl);
await page.waitForTimeout(600);

const buf = await page.screenshot({
  type: 'png',
  clip: { x: 0, y: 0, width: 1200, height: 630 }
});

const outPath = resolve(projectRoot, 'public/og.png');
writeFileSync(outPath, buf);
await browser.close();
console.log('Done:', outPath, '—', buf.length, 'bytes');
