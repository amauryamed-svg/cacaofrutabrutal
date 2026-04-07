// HubSpot integration — Portal ID 51142173 (Caua Colombia SAS)
// Analytics only loads after user grants consent

declare global {
  interface Window {
    _hsq: Array<unknown[]>
    HubSpotConversations?: unknown
  }
}

const PORTAL_ID = '51142173'

// ── Load tracking script ──────────────────────────────────────────────────────
export function loadHubSpot() {
  if (document.getElementById('hs-script')) return
  window._hsq = window._hsq || []
  const s = document.createElement('script')
  s.id   = 'hs-script'
  s.src  = `//js.hs-scripts.com/${PORTAL_ID}.js`
  s.async = true
  s.defer = true
  document.head.appendChild(s)
}

// ── Identify contact ──────────────────────────────────────────────────────────
export function hsIdentify(email: string, props?: Record<string, string>) {
  window._hsq = window._hsq || []
  window._hsq.push(['identify', { email, ...props }])
  window._hsq.push(['trackPageView'])
}

// ── Track page view (call on every route change) ──────────────────────────────
export function hsTrackPage(path: string) {
  window._hsq = window._hsq || []
  window._hsq.push(['setPath', path])
  window._hsq.push(['trackPageView'])
}

// ── Track custom event ────────────────────────────────────────────────────────
export function hsEvent(name: string, props?: Record<string, string | number>) {
  window._hsq = window._hsq || []
  window._hsq.push(['trackCustomBehavioralEvent', { name, properties: props ?? {} }])
}

// ── Submit contact to HubSpot Forms API (no API key needed) ──────────────────
export async function hsSubmitContact(email: string, fields: Record<string, string> = {}) {
  const FORM_GUID = import.meta.env.VITE_HUBSPOT_FORM_GUID
  if (!FORM_GUID) return

  const body = {
    portalId: PORTAL_ID,
    formGuid: FORM_GUID,
    fields: [
      { name: 'email', value: email },
      ...Object.entries(fields).map(([name, value]) => ({ name, value })),
    ],
    context: {
      pageUri: window.location.href,
      pageName: document.title,
    },
  }

  await fetch(
    `https://api.hsforms.com/submissions/v3/integration/submit/${PORTAL_ID}/${FORM_GUID}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  ).catch(() => {/* silent fail — never block UX */})
}
