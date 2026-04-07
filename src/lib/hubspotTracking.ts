/**
 * hubspotTracking.ts
 * First-party HubSpot tracking for CAUA Corporation.
 *
 * Rules (non-negotiable):
 * - NEVER infer gender, age, ethnicity, or sensitive attributes.
 * - NEVER use device fingerprinting for demographic inference.
 * - ONLY use declared (form input) or behavioral product data.
 * - All tracking gates on explicit analytics consent.
 *
 * Buyer persona is derived POST-HOC from behavioral clusters in HubSpot,
 * not assumed at tracking time.
 */

// ── Env vars ──────────────────────────────────────────────────────────────────
const PORTAL_ID = import.meta.env.VITE_HUBSPOT_PORTAL_ID as string ?? '51142173'
const FORM_GUID = import.meta.env.VITE_HUBSPOT_FORM_GUID as string ?? ''

// ── TypeScript types ──────────────────────────────────────────────────────────

/** Contact properties sent to HubSpot — no demographic fields. */
export interface HubSpotContactProps {
  email:                    string

  // Behavioral — derived from product interaction
  caua_streak:              string   // ritual streak count (string for HS compat)
  caua_orders:              string   // completed orders count
  caua_referrals:           string   // referral count
  caua_login_status:        'logged_in' | 'anonymous'
  caua_tracking_consent:    'analytics' | 'marketing' | 'both' | 'none'

  // Geographic — declared from Supabase profile (user-set, not inferred)
  caua_region:              'EU' | 'US' | 'CO' | 'OTHER'

  // Declared interest — set only when user explicitly interacts with a section
  // e.g. clicks "Agroforestería" filter or visits /ritual 3+ times
  caua_interest_organic?:     'true' | 'false'
  caua_interest_novel_foods?: 'true' | 'false'

  // Persona label — assigned by HubSpot workflow AFTER behavioral clustering,
  // never assumed at tracking time. Default provided as a starting suggestion.
  caua_persona_label?:      string
}

/** Consent state read from localStorage (set by CookieBanner). */
export interface ConsentState {
  analytics: boolean
  marketing: boolean
}

/** Result of trackLoggedInUser() */
export interface TrackingResult {
  identified: boolean
  formSent:   boolean
  reason?:    string
}

// ── Consent helpers ───────────────────────────────────────────────────────────

/** Read consent from localStorage — set by CookieBanner component. */
export function readConsent(): ConsentState {
  try {
    const raw = localStorage.getItem('caua_cookie_consent')
    if (!raw) return { analytics: false, marketing: false }
    return JSON.parse(raw) as ConsentState
  } catch {
    return { analytics: false, marketing: false }
  }
}

function consentLabel(c: ConsentState): HubSpotContactProps['caua_tracking_consent'] {
  if (c.analytics && c.marketing) return 'both'
  if (c.analytics) return 'analytics'
  if (c.marketing) return 'marketing'
  return 'none'
}

// ── HubSpot script loader ─────────────────────────────────────────────────────

/** Load HubSpot analytics script. Called only after analytics consent. */
export function loadHubSpotScript(): void {
  if (document.getElementById('hs-analytics-script')) return
  const s = document.createElement('script')
  s.id    = 'hs-analytics-script'
  s.src   = `//js.hs-scripts.com/${PORTAL_ID}.js`
  s.async = true
  s.defer = true
  document.head.appendChild(s)
}

// ── Core tracking functions ───────────────────────────────────────────────────

/** Push identity to HubSpot _hsq. Associates cookie with contact. */
function hsIdentify(props: HubSpotContactProps): void {
  window._hsq = window._hsq ?? []
  // HubSpot uses 'identify' to link the browser cookie to a contact.
  // After this call, all pageview events are attributed to this email.
  window._hsq.push(['identify', {
    email:                   props.email,
    caua_streak:             props.caua_streak,
    caua_orders:             props.caua_orders,
    caua_referrals:          props.caua_referrals,
    caua_login_status:       props.caua_login_status,
    caua_tracking_consent:   props.caua_tracking_consent,
    caua_region:             props.caua_region,
    ...(props.caua_interest_organic     && { caua_interest_organic:     props.caua_interest_organic }),
    ...(props.caua_interest_novel_foods && { caua_interest_novel_foods: props.caua_interest_novel_foods }),
    ...(props.caua_persona_label        && { caua_persona_label:        props.caua_persona_label }),
  }])
  // Force a pageview flush so the identity is submitted immediately.
  window._hsq.push(['trackPageView'])
}

/** Track a route change. Call on every React Router navigation. */
export function hsTrackPage(path: string): void {
  const consent = readConsent()
  if (!consent.analytics) return
  window._hsq = window._hsq ?? []
  window._hsq.push(['setPath', path])
  window._hsq.push(['trackPageView'])
}

/** Track a named product behavior event. No demographic data. */
export function hsTrackEvent(
  eventName: string,
  properties?: Record<string, string | number>
): void {
  const consent = readConsent()
  if (!consent.analytics) return
  window._hsq = window._hsq ?? []
  window._hsq.push(['trackCustomBehavioralEvent', {
    name: eventName,
    properties: properties ?? {},
  }])
}

// ── Forms API submission ──────────────────────────────────────────────────────

/**
 * Submit a contact to HubSpot Forms API (no secret key required — public endpoint).
 * This creates/updates a contact and links the hutk browser cookie.
 *
 * @param props   Contact properties (no demographic fields)
 * @param hutk    HubSpot cookie value (document.cookie 'hubspotutk') for session linking
 */
export async function hsSubmitForm(
  props: HubSpotContactProps,
  hutk?: string
): Promise<boolean> {
  if (!FORM_GUID) {
    console.warn('[CAUA HubSpot] VITE_HUBSPOT_FORM_GUID not set — form not submitted')
    return false
  }

  const fields = Object.entries(props)
    .filter(([k]) => k !== 'email')
    .map(([name, value]) => ({ name, value: String(value) }))

  const payload = {
    portalId: PORTAL_ID,
    formGuid:  FORM_GUID,
    fields: [
      { name: 'email', value: props.email },
      ...fields,
    ],
    context: {
      hutk:     hutk ?? getHutkCookie(),
      pageUri:  window.location.href,
      pageName: document.title,
    },
  }

  try {
    const res = await fetch(
      `https://api.hsforms.com/submissions/v3/integration/submit/${PORTAL_ID}/${FORM_GUID}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
    )
    return res.ok
  } catch {
    // Never block UX on tracking failure
    return false
  }
}

/** Read HubSpot's own browser cookie (hutk) for session continuity. */
function getHutkCookie(): string | undefined {
  return document.cookie
    .split('; ')
    .find(c => c.startsWith('hubspotutk='))
    ?.split('=')[1]
}

// ── Main tracking orchestrator ────────────────────────────────────────────────

/**
 * trackLoggedInUser()
 *
 * Call this immediately after a user authenticates.
 * Gates all actions on explicit consent — never runs silently.
 *
 * @param email   User's email from Supabase Auth
 * @param profile Supabase user_profiles row (contains behavioral counters)
 * @param declaredInterests  Set by user interaction — NOT inferred
 */
export async function trackLoggedInUser(
  email: string,
  profile: {
    region:           'EU' | 'US' | 'CO' | 'OTHER'
    ritual_streak:    number
    completed_orders: number
    referral_count:   number
  },
  declaredInterests?: {
    organic?:    boolean   // user clicked organic/agroforestry content
    novelFoods?: boolean   // user clicked novel foods / functional content
  }
): Promise<TrackingResult> {
  const consent = readConsent()

  // Gate: no analytics consent → do nothing
  if (!consent.analytics) {
    return { identified: false, formSent: false, reason: 'no_analytics_consent' }
  }

  // Ensure script is loaded
  loadHubSpotScript()

  const props: HubSpotContactProps = {
    email,
    caua_region:            profile.region,
    caua_streak:            String(profile.ritual_streak),
    caua_orders:            String(profile.completed_orders),
    caua_referrals:         String(profile.referral_count),
    caua_login_status:      'logged_in',
    caua_tracking_consent:  consentLabel(consent),

    // Declared interests — only set when user explicitly interacted
    // Connect to real interaction events (e.g. filter clicks, section visits)
    ...(declaredInterests?.organic    !== undefined && {
      caua_interest_organic:    declaredInterests.organic    ? 'true' : 'false'
    }),
    ...(declaredInterests?.novelFoods !== undefined && {
      caua_interest_novel_foods: declaredInterests.novelFoods ? 'true' : 'false'
    }),

    // Persona label — default suggestion; overridden by HubSpot workflow
    // after behavioral clustering. Do NOT hardcode demographic assumptions here.
    caua_persona_label: 'conscious_global_organic_novel_foods',
  }

  // 1 — Identify in HubSpot (links browser cookie to contact)
  hsIdentify(props)

  // 2 — Submit via Forms API (creates/updates contact in CRM)
  const formSent = await hsSubmitForm(props)

  return { identified: true, formSent, reason: formSent ? undefined : 'form_guid_missing' }
}

// ── Global type augmentation ──────────────────────────────────────────────────
declare global {
  interface Window {
    _hsq: Array<unknown[]>
  }
}
