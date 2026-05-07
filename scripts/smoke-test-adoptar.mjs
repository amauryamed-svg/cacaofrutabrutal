// Smoke test del flow de adopción para AtmosphereX (Universidad Distrital).
//
// Asume que el dev server ya está corriendo en localhost:3000 (ej. `npm run dev`).
// Si no está, arrancarlo en otra terminal antes de correr esto.
//
// Tests:
//   1. /app/ carga sin AuthGate (no redirect a /auth)
//   2. Tab nav visible en el landing público
//   3. Sección Web3 Transparency rendea con los 5 contratos
//   4. CTA "Adopta un árbol" navega a /app/auth?next=/adoptar
//   5. /app/adoptar directo (sin login) renderiza UI sin crash
//   6. Footer legal con NIT visible
//
// Output: friction-score 0-10 + issues found.

import { chromium } from 'playwright'

const BASE = process.env.BASE_URL || 'http://localhost:3000'
const VIEWPORT = { width: 390, height: 844 } // iPhone 12

const issues = []
const passed = []

function logOk(msg) { passed.push(msg); console.log(`  ✓ ${msg}`) }
function logIssue(level, msg) { issues.push({ level, msg }); console.log(`  ✗ [${level}] ${msg}`) }

console.log('🧪 Smoke test — adoption flow para AtmosphereX')
console.log(`   Base: ${BASE}`)
console.log(`   Viewport: ${VIEWPORT.width}x${VIEWPORT.height} (iPhone 12)\n`)

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({ viewport: VIEWPORT })
const page = await ctx.newPage()

const consoleErrors = []
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`))

try {
  // ── Test 1: /app/ carga sin AuthGate ──
  console.log('📍 Test 1: /app/ public landing')
  const t1Start = Date.now()
  const r1 = await page.goto(`${BASE}/app/`, { waitUntil: 'domcontentloaded', timeout: 15_000 })
  const t1Ms = Date.now() - t1Start
  if (r1?.status() !== 200) logIssue('CRITICAL', `expected 200, got ${r1?.status()}`)
  else logOk(`200 OK (${t1Ms}ms)`)

  await page.waitForTimeout(800) // settle for AuthContext.init etc.

  const url1 = page.url()
  if (url1.includes('/auth')) logIssue('CRITICAL', `Landing redirected to /auth (AuthGate not removed?). url=${url1}`)
  else logOk(`No auth redirect (url stays at ${url1.replace(BASE, '')})`)

  // ── Test 2: Tab nav visible ──
  console.log('\n📍 Test 2: Tab nav (Adoptar | Inversores)')
  const adoptarTab = await page.locator('a:has-text("Adoptar")').first()
  const inversoresTab = await page.locator('a:has-text("Inversores")').first()
  if (await adoptarTab.isVisible()) logOk('Tab "Adoptar" visible')
  else logIssue('HIGH', 'Tab "Adoptar" not found')
  if (await inversoresTab.isVisible()) logOk('Tab "Inversores" visible')
  else logIssue('HIGH', 'Tab "Inversores" not found')

  // ── Test 3: Web3 Transparency section ──
  console.log('\n📍 Test 3: Web3 Transparency · 5 contracts')
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2))
  await page.waitForTimeout(500)
  const txTitle = await page.locator('text=/Transparencia/i').first()
  if (await txTitle.isVisible({ timeout: 3000 }).catch(() => false)) logOk('Sección "Transparencia" visible')
  else logIssue('HIGH', 'Web3 Transparency title not found')

  const baseScanLinks = await page.locator('a[href*="basescan.org"]').count()
  if (baseScanLinks >= 5) logOk(`${baseScanLinks} BaseScan links (>= 5 expected)`)
  else logIssue('HIGH', `Only ${baseScanLinks} BaseScan links found, expected >= 5`)

  // ── Test 4: CTA flow ──
  console.log('\n📍 Test 4: CTA "ADOPTA UN ÁRBOL" → /auth')
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(300)
  const cta = await page.locator('button:has-text("ADOPTA")').first()
  if (await cta.isVisible({ timeout: 3000 }).catch(() => false)) {
    logOk('CTA visible')
    await cta.click()
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(800)
    const url4 = page.url()
    if (url4.includes('/adoptar')) logOk(`CTA navega a /adoptar (url=${url4.replace(BASE, '')})`)
    else logIssue('MEDIUM', `CTA navigation: ${url4.replace(BASE, '')} (expected /adoptar)`)
  } else logIssue('HIGH', 'CTA "ADOPTA UN ÁRBOL" not found')

  // ── Test 5: /app/adoptar directo ──
  console.log('\n📍 Test 5: /app/adoptar (direct, sin sesión)')
  const r5 = await page.goto(`${BASE}/app/adoptar`, { waitUntil: 'domcontentloaded', timeout: 15_000 })
  if (r5?.status() === 200) logOk('200 OK')
  else logIssue('HIGH', `expected 200, got ${r5?.status()}`)
  await page.waitForTimeout(800)
  const adoptarTitle = await page.locator('h1:has-text("Adopta un")').first()
  if (await adoptarTitle.isVisible({ timeout: 3000 }).catch(() => false)) logOk('"Adopta un árbol" hero visible (no crash)')
  else logIssue('HIGH', 'Adoptar hero not rendered')

  // ── Test 6: Footer legal ──
  console.log('\n📍 Test 6: Footer NIT')
  await page.goto(`${BASE}/app/`, { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(500)
  const footer = await page.locator('text=/NIT 901\\.213\\.846-7/').first()
  if (await footer.isVisible({ timeout: 3000 }).catch(() => false)) logOk('Footer NIT visible')
  else logIssue('LOW', 'Footer NIT not found')

  // ── Console errors ──
  console.log('\n📍 Console errors')
  if (consoleErrors.length === 0) logOk('No console errors')
  else {
    console.log(`  ⚠ ${consoleErrors.length} console errors:`)
    consoleErrors.slice(0, 5).forEach(e => console.log(`     - ${e.slice(0, 180)}`))
    issues.push({ level: 'LOW', msg: `${consoleErrors.length} console errors` })
  }

} catch (err) {
  logIssue('CRITICAL', `test runner crash: ${err.message}`)
} finally {
  await browser.close()
}

// ── Score ──
const critical = issues.filter(i => i.level === 'CRITICAL').length
const high = issues.filter(i => i.level === 'HIGH').length
const medium = issues.filter(i => i.level === 'MEDIUM').length
const low = issues.filter(i => i.level === 'LOW').length

const score = Math.max(0, 10 - critical * 5 - high * 2 - medium * 1 - Math.floor(low * 0.5))

console.log('\n' + '─'.repeat(60))
console.log('📊 RESULTS')
console.log(`   Passed: ${passed.length}`)
console.log(`   Issues: critical=${critical} high=${high} medium=${medium} low=${low}`)
console.log(`   Friction score: ${score}/10 ${score >= 8 ? '✅' : score >= 5 ? '⚠️' : '🔴'}`)
if (score < 8) {
  console.log('\n   Issues:')
  issues.forEach(i => console.log(`   [${i.level}] ${i.msg}`))
}
console.log('─'.repeat(60))

process.exit(critical > 0 ? 1 : 0)
