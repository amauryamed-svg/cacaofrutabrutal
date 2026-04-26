// validate-3d.mjs — UI/UX Bar compliance check for public/investor-landing.html
// Covers: 3D boot, scroll-linked progress (--p), rail pin integrity, reduced-motion
// fallback, regression guard on retired 2D canvas. See docs/context/ui-ux-bar.md.
import { chromium } from 'playwright';

const url = process.argv[2] || 'http://localhost:3001/investor-landing.html';
const browser = await chromium.launch();

let failures = 0;
function assert(label, cond, detail = '') {
  const ok = !!cond;
  console.log(`  ${ok ? '✓' : '✗'} ${label}${detail ? ' — ' + detail : ''}`);
  if (!ok) failures++;
}

// ────────── PASS 1: normal motion ──────────
{
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', e => pageErrors.push(e.message));
  page.on('requestfailed', r => failedRequests.push(`${r.failure()?.errorText || '?'} ${r.url()}`));

  console.log(`\n═══ PASS 1 — normal motion @ ${url}`);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2500);

  const boot = await page.evaluate(() => {
    const canvas = document.getElementById('gl-canvas');
    return {
      canvasExists: !!canvas,
      canvasVisible: canvas && canvas.style.display !== 'none',
      hasTHREE: typeof window.THREE !== 'undefined',
      threeRev: window.THREE?.REVISION,
      rail: !!document.querySelector('#stages-rail'),
      railViewport: !!document.querySelector('#stages-rail .rail-viewport'),
      railTrack: !!document.querySelector('#stages-rail .rail-track'),
      stageCards: document.querySelectorAll('#stages-rail .stage-card').length,
      ancCanvasRetired: !document.getElementById('anc-canvas'),
      motionLoaded: !!document.querySelector('script[src="/investor-scroll.js"]'),
      pinrailCssLoaded: !!document.querySelector('link[href="/investor-pinrail.css"]'),
    };
  });

  assert('canvas #gl-canvas exists + visible', boot.canvasExists && boot.canvasVisible);
  assert('THREE global present', boot.hasTHREE, boot.threeRev ? `r${boot.threeRev}` : 'missing');
  assert('THREE revision ≥ 128', boot.threeRev >= 128, `r${boot.threeRev}`);
  assert('#stages-rail + .rail-viewport + .rail-track present', boot.rail && boot.railViewport && boot.railTrack);
  assert('rail has 4 stage cards', boot.stageCards === 4, `found ${boot.stageCards}`);
  assert('2D hilos canvas retired (#anc-canvas absent)', boot.ancCanvasRetired);
  assert('motion.dev script tag present', boot.motionLoaded);
  assert('investor-pinrail.css linked', boot.pinrailCssLoaded);

  // Scroll to trigger --p updates and rail pin; sample at positions
  console.log('  → scroll sweep');
  const samples = [];
  for (const frac of [0, 0.25, 0.5, 0.75, 0.99]) {
    await page.evaluate((f) => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo(0, Math.round(maxScroll * f));
    }, frac);
    await page.waitForTimeout(500);
    const p = await page.evaluate(() =>
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--p')) || 0
    );
    samples.push({ frac, p });
  }
  const pProgresses = samples.every((s, i, arr) => i === 0 || s.p >= arr[i - 1].p);
  assert('--p progresses monotonically with scroll', pProgresses, JSON.stringify(samples));
  const pAtEnd = samples[samples.length - 1].p;
  assert('--p reaches ≥ 0.80 near end of scroll', pAtEnd >= 0.80, `ended at --p=${pAtEnd}`);

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await page.screenshot({ path: '/tmp/validate-hero-top.png', fullPage: false });

  await page.evaluate(() => document.getElementById('stages-rail')?.scrollIntoView({ behavior: 'instant' }));
  await page.waitForTimeout(600);
  await page.screenshot({ path: '/tmp/validate-rail.png', fullPage: false });

  assert('no console errors', consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' | '));
  assert('no page errors', pageErrors.length === 0, pageErrors.slice(0, 2).join(' | '));
  assert(
    'no failed asset requests (excluding optional hero assets)',
    failedRequests.filter(r => !/agroforest\.glb|huila-sunrise|hero\.mp4|hero\.webm|hero-poster/.test(r)).length === 0,
    failedRequests.slice(0, 4).join(' | ')
  );

  await page.close();
}

// ────────── PASS 2: reduced-motion hard kill switch ──────────
{
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  console.log(`\n═══ PASS 2 — prefers-reduced-motion: reduce`);
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const rm = await page.evaluate(() => {
    const canvas = document.getElementById('gl-canvas');
    const rail = document.getElementById('stages-rail');
    const viewport = document.querySelector('#stages-rail .rail-viewport');
    return {
      canvasHidden: !canvas || canvas.style.display === 'none',
      railHeight: rail ? rail.offsetHeight : 0,
      viewportPosition: viewport ? getComputedStyle(viewport).position : 'n/a',
      pVar: getComputedStyle(document.documentElement).getPropertyValue('--p').trim(),
    };
  });

  assert('canvas hidden under reduced-motion', rm.canvasHidden);
  assert('rail collapsed to non-pinned (position != sticky)', rm.viewportPosition !== 'sticky', rm.viewportPosition);
  assert('rail height reasonable (not 400vh)', rm.railHeight < 900 * 4, `${rm.railHeight}px`);
  assert('--p set to fallback value', rm.pVar === '0.5', `--p="${rm.pVar}"`);
  await page.screenshot({ path: '/tmp/validate-reduced-motion.png', fullPage: false });

  await page.close();
}

await browser.close();

console.log(`\n${failures === 0 ? '✓ ALL CHECKS PASSED' : `✗ ${failures} CHECK(S) FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
