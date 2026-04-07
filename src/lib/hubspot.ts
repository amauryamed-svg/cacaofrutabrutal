/**
 * hubspot.ts — re-exports from hubspotTracking.ts for backwards compatibility.
 * New code should import directly from hubspotTracking.ts.
 */
export {
  loadHubSpotScript as loadHubSpot,
  hsTrackPage,
  hsTrackEvent as hsEvent,
  readConsent,
  trackLoggedInUser,
} from './hubspotTracking'

// Legacy identify helper used in AuthContext
export { trackLoggedInUser as hsIdentify } from './hubspotTracking'
