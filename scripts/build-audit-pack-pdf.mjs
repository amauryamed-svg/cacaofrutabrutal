// Build the Universidad Distrital audit-pack PDF.
// Combines 01-onboarding-auditor.md + 02-nda-confidencialidad.md into a single
// styled PDF ready to email. Uses Playwright (project dep) + marked from CDN.

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const PACK = path.join(ROOT, 'docs', 'audit-pack')

const onboardingMd = await fs.readFile(path.join(PACK, '01-onboarding-auditor.md'), 'utf-8')
const ndaMd        = await fs.readFile(path.join(PACK, '02-nda-confidencialidad.md'), 'utf-8')

// Embed Caua logo (white version for dark cover) as base64 data URL — keeps PDF self-contained
const logoPath = path.resolve(ROOT, 'public', 'caua-logo-white.png')
const logoBuf = await fs.readFile(logoPath)
const logoDataUrl = `data:image/png;base64,${logoBuf.toString('base64')}`

const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Audit Pack — Universidad Distrital · CAUA COLOMBIA SAS</title>
  <script src="https://cdn.jsdelivr.net/npm/marked@12.0.0/marked.min.js"></script>
  <style>
    @page { size: A4; margin: 22mm 18mm 22mm 18mm; }
    @media print {
      .page-break { page-break-before: always; }
      .cover, h1, h2 { page-break-after: avoid; }
      table, pre { page-break-inside: avoid; }
    }

    * { box-sizing: border-box; }
    html, body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      font-size: 10.5pt;
      line-height: 1.55;
      color: #1a1a1a;
      margin: 0;
      padding: 0;
    }

    /* Cover */
    .cover {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 0 16mm;
      background: linear-gradient(135deg, #1C3B26 0%, #040C06 100%);
      color: #F7F1EE;
    }
    .cover-logo {
      width: 100pt;
      height: auto;
      margin-bottom: 28pt;
      opacity: 0.95;
    }
    .cover-eyebrow {
      font-family: Georgia, serif;
      font-style: italic;
      font-size: 12pt;
      color: #91A63B;
      letter-spacing: 0.18em;
      margin-bottom: 14pt;
    }
    .cover-title {
      font-family: 'Helvetica Neue', sans-serif;
      font-weight: 900;
      font-size: 36pt;
      line-height: 0.95;
      letter-spacing: -0.01em;
      margin: 0 0 16pt;
      text-transform: uppercase;
    }
    .cover-title em { font-style: normal; color: #F1A91E; }
    .cover-sub {
      font-size: 13pt;
      max-width: 480pt;
      color: #F7F1EEcc;
      margin-bottom: 32pt;
    }
    .cover-meta {
      display: grid;
      grid-template-columns: 130pt 1fr;
      row-gap: 6pt;
      font-size: 10pt;
      max-width: 480pt;
    }
    .cover-meta dt {
      font-weight: 700;
      color: #91A63B;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      font-size: 8.5pt;
    }
    .cover-meta dd { margin: 0; color: #F7F1EE; }
    .cover-footer {
      position: absolute;
      bottom: 22mm;
      font-size: 8pt;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #F7F1EE88;
    }

    /* Body */
    .doc {
      padding: 0;
      max-width: 100%;
    }
    .doc h1 {
      font-size: 20pt;
      margin: 0 0 14pt;
      padding-bottom: 8pt;
      border-bottom: 2pt solid #1C3B26;
      color: #1C3B26;
      font-weight: 800;
      letter-spacing: -0.01em;
    }
    .doc h2 {
      font-size: 14pt;
      margin: 22pt 0 10pt;
      color: #1C3B26;
      font-weight: 800;
      border-left: 4pt solid #91A63B;
      padding-left: 8pt;
    }
    .doc h3 {
      font-size: 11.5pt;
      margin: 16pt 0 8pt;
      color: #1C3B26;
      font-weight: 700;
    }
    .doc h4 {
      font-size: 10.5pt;
      margin: 12pt 0 6pt;
      color: #1C3B26;
      font-weight: 700;
    }
    .doc p { margin: 6pt 0; }
    .doc ul, .doc ol { margin: 6pt 0; padding-left: 18pt; }
    .doc li { margin: 2pt 0; }
    .doc strong { color: #1C3B26; font-weight: 700; }
    .doc em { font-style: italic; }
    .doc code {
      font-family: 'SF Mono', Monaco, Consolas, monospace;
      font-size: 9pt;
      background: #F7F1EE;
      padding: 1pt 4pt;
      border-radius: 2pt;
      color: #8D2679;
    }
    .doc pre {
      background: #F7F1EE;
      border: 1pt solid #1C3B2622;
      border-radius: 4pt;
      padding: 8pt;
      font-family: 'SF Mono', Monaco, Consolas, monospace;
      font-size: 8.5pt;
      line-height: 1.35;
      overflow-x: auto;
      white-space: pre-wrap;
    }
    .doc pre code { background: none; padding: 0; color: #1a1a1a; }
    .doc blockquote {
      margin: 10pt 0;
      padding: 6pt 12pt;
      border-left: 3pt solid #F1A91E;
      background: #F1A91E11;
      font-style: italic;
      color: #1a1a1aaa;
    }
    .doc hr {
      border: 0;
      border-top: 1pt dashed #1C3B2655;
      margin: 18pt 0;
    }
    .doc a { color: #004E64; text-decoration: underline; }

    /* Tables */
    .doc table {
      width: 100%;
      border-collapse: collapse;
      margin: 10pt 0;
      font-size: 9pt;
    }
    .doc th {
      background: #1C3B26;
      color: #F7F1EE;
      text-align: left;
      padding: 6pt 8pt;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      font-size: 8pt;
    }
    .doc td {
      padding: 6pt 8pt;
      border-bottom: 0.5pt solid #1C3B2622;
      vertical-align: top;
    }
    .doc tr:nth-child(even) td { background: #F7F1EE55; }

    /* Section dividers */
    .section-divider {
      page-break-before: always;
      padding-top: 16pt;
    }
    .section-divider::before {
      content: '';
      display: block;
      width: 60pt;
      height: 3pt;
      background: #91A63B;
      margin-bottom: 14pt;
    }
  </style>
</head>
<body>

<!-- COVER -->
<section class="cover">
  <img class="cover-logo" src="${logoDataUrl}" alt="Caua">
  <div class="cover-eyebrow">Pack de invitación a colaborar · onboarding</div>
  <h1 class="cover-title">Auditoría externa<br>CAUA COLOMBIA SAS /<br><em>CacaoFrutaBrutal</em></h1>
  <p class="cover-sub">
    Universidad Distrital Francisco José de Caldas · Responsable: Andrés Gallardo
  </p>
  <dl class="cover-meta">
    <dt>Razón social</dt><dd>CAUA COLOMBIA SAS · NIT 901.213.846-7</dd>
    <dt>Documento 1 / 2</dt><dd>Onboarding del auditor</dd>
    <dt>Documento 2 / 2</dt><dd>Acuerdo de Confidencialidad (NDA)</dd>
    <dt>Ventana</dt><dd>60 días corridos, renovable</dd>
    <dt>Soporte</dt><dd>amauryamed@gmail.com (CTO directo)</dd>
    <dt>Versión</dt><dd>${new Date().toISOString().slice(0, 10)}</dd>
  </dl>
  <div class="cover-footer">CAUA COLOMBIA SAS · NIT 901.213.846-7 · Bogotá D.C. · Colombia</div>
</section>

<!-- ONBOARDING -->
<section class="doc section-divider" id="onboarding">
  <div id="onboarding-content"></div>
</section>

<!-- NDA -->
<section class="doc section-divider" id="nda">
  <div id="nda-content"></div>
</section>

<script>
  const onboarding = ${JSON.stringify(onboardingMd)};
  const nda = ${JSON.stringify(ndaMd)};
  marked.setOptions({ gfm: true, breaks: false });
  document.getElementById('onboarding-content').innerHTML = marked.parse(onboarding);
  document.getElementById('nda-content').innerHTML = marked.parse(nda);
</script>

</body>
</html>`

const tmpHtmlPath = path.join(PACK, '_audit-pack.html')
await fs.writeFile(tmpHtmlPath, html, 'utf-8')

const browser = await chromium.launch()
const ctx = await browser.newContext()
const page = await ctx.newPage()
await page.goto('file://' + tmpHtmlPath, { waitUntil: 'networkidle' })
await page.waitForFunction(() => {
  const a = document.getElementById('onboarding-content')
  const b = document.getElementById('nda-content')
  return a && b && a.innerHTML.length > 100 && b.innerHTML.length > 100
}, { timeout: 10_000 })

const pdfPath = path.join(PACK, 'audit-pack-caua-colombia-sas-unidistrital.pdf')
await page.pdf({
  path: pdfPath,
  format: 'A4',
  margin: { top: '22mm', bottom: '22mm', left: '18mm', right: '18mm' },
  printBackground: true,
  preferCSSPageSize: true,
})

await browser.close()
await fs.unlink(tmpHtmlPath).catch(() => {})

const stat = await fs.stat(pdfPath)
console.log('✓ PDF generated:', path.relative(ROOT, pdfPath))
console.log('  size:', (stat.size / 1024).toFixed(1), 'KB')
