/**
 * CAUA Design Tokens
 * Brutalist luxury system: high contrast, depth, precision, no pastels
 * All values use hex for backgrounds per CauaCore constraint
 */

// ─────────────────────────────────────────────────────────────────
// ELEVATION: 8-level shadow system for depth perception
// Follows brutalist principle: sharp, intentional, no diffusion
// ─────────────────────────────────────────────────────────────────

export const ELEVATION = {
  // Level 0: flat, no shadow
  none: 'none',

  // Level 1: subtle card hover, minimal lift
  sm: '0 2px 4px rgba(0,0,0,0.16)',

  // Level 2: default card state, modal underlay
  md: '0 4px 12px rgba(0,0,0,0.24)',

  // Level 3: interactive hover state, tooltips
  lg: '0 8px 24px rgba(0,0,0,0.32)',

  // Level 4: modal focus, dropdown active
  xl: '0 12px 32px rgba(0,0,0,0.40)',

  // Level 5: priority modal, alerts
  '2xl': '0 16px 40px rgba(0,0,0,0.48)',

  // Level 6: hero sections, full-screen overlays
  '3xl': '0 24px 56px rgba(0,0,0,0.56)',

  // Level 7: hero text emboss, critical focus states
  '4xl': '0 32px 72px rgba(0,0,0,0.64)',

  // Inset shadow: depth into surface
  inset: 'inset 0 2px 8px rgba(0,0,0,0.12)',
} as const

// ─────────────────────────────────────────────────────────────────
// TYPE SCALE: 4px base unit, designed for precision and hierarchy
// ─────────────────────────────────────────────────────────────────

export const TYPE_SCALE = {
  // Size (px) : line-height ratio
  xs: { size: 10, lineHeight: 1.4, weight: 400 },      // captions, labels
  sm: { size: 12, lineHeight: 1.5, weight: 400 },      // helper text, small labels
  base: { size: 14, lineHeight: 1.6, weight: 400 },    // body copy, input text
  lg: { size: 16, lineHeight: 1.7, weight: 400 },      // standard body, descriptions
  xl: { size: 18, lineHeight: 1.8, weight: 500 },      // subheadings, section intro
  '2xl': { size: 22, lineHeight: 1.9, weight: 600 },   // card titles, major section heads
  '3xl': { size: 28, lineHeight: 1.1, weight: 700 },   // page subsection heads
  '4xl': { size: 36, lineHeight: 1.05, weight: 900 },  // page section heads
  '5xl': { size: 48, lineHeight: 0.95, weight: 900 },  // hero subtitle
  '6xl': { size: 56, lineHeight: 0.9, weight: 900 },   // page hero
  '7xl': { size: 64, lineHeight: 0.85, weight: 900 },  // hero with emoji
} as const

// ─────────────────────────────────────────────────────────────────
// SPACING: 4px base unit, 12-increment scale
// ─────────────────────────────────────────────────────────────────

export const SPACING = {
  px: '1px',
  0: '0',
  1: '4px',      // xs gap, tight padding
  2: '8px',      // small gap, button padding vert
  3: '12px',     // card padding, section gap
  4: '16px',     // standard padding, list gap
  5: '20px',     // card section padding
  6: '24px',     // section padding, hero spacing
  7: '28px',     // page section gap
  8: '32px',     // major section padding
  9: '36px',     // large section gap
  10: '40px',    // page padding
  11: '44px',    // hero section gap
  12: '48px',    // hero padding
} as const

// ─────────────────────────────────────────────────────────────────
// MOTION: Easing curves and durations for animation
// Brutalist principle: purposeful, not decorative
// ─────────────────────────────────────────────────────────────────

export const MOTION = {
  // Easing functions
  easing: {
    // Entrance: slow start, fast exit (emphasize appearance)
    enter: 'cubic-bezier(0.16, 1, 0.3, 1)',

    // Exit: fast start, slow end (emphasize departure)
    exit: 'cubic-bezier(0.7, 0, 0.84, 0)',

    // Standard: balanced, feels natural
    standard: 'cubic-bezier(0.4, 0, 0.2, 1)',

    // Emphasis: snappy, draws attention
    emphasis: 'cubic-bezier(0.34, 1.56, 0.64, 1)',

    // Subtle: barely perceptible, background motion
    subtle: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  },

  // Duration in milliseconds
  duration: {
    instant: 150,    // very fast interactions (hover)
    fast: 200,       // UI feedback (button press, toast)
    normal: 300,     // standard transition (modal, card expand)
    slow: 500,       // hero entrance, page transition
    slowest: 800,    // ritual animation, complex reveal
  },
} as const

// ─────────────────────────────────────────────────────────────────
// STATE TOKENS: Interactive element states
// Maintains brutalist aesthetic: high contrast, clear feedback
// ─────────────────────────────────────────────────────────────────

export const STATE = {
  // Hover: increase elevation and opacity
  hover: {
    elevation: ELEVATION.lg,
    transform: 'translateY(-2px)',
    transition: `all ${MOTION.duration.instant}ms ${MOTION.easing.standard}`,
  },

  // Active: pressed, high contrast
  active: {
    elevation: ELEVATION.xl,
    transform: 'translateY(-4px)',
    transition: `all ${MOTION.duration.fast}ms ${MOTION.easing.emphasis}`,
  },

  // Disabled: desaturated, lower elevation
  disabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    pointerEvents: 'none',
  },

  // Focus: visible ring for accessibility, high contrast
  focus: {
    outline: 'none',
    boxShadow: '0 0 0 3px #040C06, 0 0 0 6px #91A63B',
    transition: `box-shadow ${MOTION.duration.instant}ms ${MOTION.easing.standard}`,
  },

  // Loading: reduced opacity, pointer disabled
  loading: {
    opacity: 0.6,
    pointerEvents: 'none',
  },

  // Error: high contrast red/alert state
  error: {
    borderColor: '#8C201D',
    backgroundColor: 'rgba(140, 32, 29, 0.08)',
  },

  // Success: high contrast green/positive state
  success: {
    borderColor: '#91A63B',
    backgroundColor: 'rgba(145, 166, 59, 0.08)',
  },
} as const

// ─────────────────────────────────────────────────────────────────
// BORDER RADIUS: Intentional hierarchy
// Brutalist: sharp corners for UI clarity, rounded for warmth
// ─────────────────────────────────────────────────────────────────

export const RADIUS = {
  none: '0',
  sm: '4px',      // subtle inputs, small components
  md: '8px',      // standard cards, buttons
  lg: '12px',     // large cards, modals
  xl: '16px',     // featured sections
  pill: '999px',  // buttons, badges (full round)
} as const

// ─────────────────────────────────────────────────────────────────
// SEMANTIC COLORS: Purpose-driven color application
// Links to brand palette in constants.ts, adds semantic layer
// ─────────────────────────────────────────────────────────────────

export const SEMANTIC = {
  background: {
    primary: '#040C06',      // page background
    secondary: '#0F2218',    // section background
    tertiary: '#132B1C',     // card background
  },

  text: {
    primary: '#F7F1EE',      // main content (heirloom)
    secondary: '#F7F1EE99',  // dimmed text (heirloom @ 60%)
    tertiary: '#F7F1EE55',   // disabled text (heirloom @ 33%)
  },

  border: {
    default: '#1C3B2666',    // amazon @ 40%
    active: '#91A63B',       // pod (primary accent)
    muted: '#1C3B2633',      // amazon @ 20%
  },

  interactive: {
    primary: '#91A63B',      // pod — primary actions
    secondary: '#8D2679',    // criollo — secondary actions
    tertiary: '#DB5527',     // theobroma — tertiary actions
    accent: '#00A3CD',       // heroic — highlights
  },

  feedback: {
    error: '#8C201D',        // radioRed — destructive
    warning: '#F1A91E',      // mazorca — caution
    success: '#91A63B',      // pod — confirmations
    info: '#004E64',         // muisca — information
  },
} as const

// ─────────────────────────────────────────────────────────────────
// COMPONENT DEFAULTS: Pre-composed tokens for common patterns
// ─────────────────────────────────────────────────────────────────

export const COMPONENT_TOKENS = {
  button: {
    primary: {
      padding: `${SPACING[2]} ${SPACING[4]}`,
      borderRadius: RADIUS.md,
      fontSize: TYPE_SCALE.sm.size,
      fontWeight: 700,
      elevation: ELEVATION.md,
      transition: `all ${MOTION.duration.fast}ms ${MOTION.easing.standard}`,
    },
    secondary: {
      padding: `${SPACING[2]} ${SPACING[4]}`,
      borderRadius: RADIUS.md,
      fontSize: TYPE_SCALE.sm.size,
      fontWeight: 600,
      elevation: ELEVATION.sm,
      transition: `all ${MOTION.duration.fast}ms ${MOTION.easing.standard}`,
    },
  },

  card: {
    padding: SPACING[6],
    borderRadius: RADIUS.lg,
    elevation: ELEVATION.md,
    backgroundColor: '#132B1C',
    border: `1px solid ${SEMANTIC.border.default}`,
    transition: `all ${MOTION.duration.normal}ms ${MOTION.easing.standard}`,
  },

  input: {
    padding: `${SPACING[2]} ${SPACING[3]}`,
    borderRadius: RADIUS.md,
    fontSize: TYPE_SCALE.base.size,
    border: `1px solid ${SEMANTIC.border.default}`,
    backgroundColor: '#0F2218',
    color: SEMANTIC.text.primary,
    transition: `all ${MOTION.duration.instant}ms ${MOTION.easing.standard}`,
  },

  modal: {
    borderRadius: RADIUS.lg,
    elevation: ELEVATION['4xl'],
    backgroundColor: '#0F2218',
    backdropFilter: 'blur(8px)',
  },
} as const

// ─────────────────────────────────────────────────────────────────
// UTILITY HELPER: Create inline style object with tokens
// Used in React components for clean application of design tokens
// ─────────────────────────────────────────────────────────────────

export function withElevation(level: keyof typeof ELEVATION) {
  return {
    boxShadow: ELEVATION[level],
  }
}

export function withMotion(duration: keyof typeof MOTION.duration, easing: keyof typeof MOTION.easing) {
  return {
    transition: `all ${MOTION.duration[duration]}ms ${MOTION.easing[easing]}`,
  }
}

export function withState(state: keyof typeof STATE) {
  return STATE[state]
}

// ─────────────────────────────────────────────────────────────────
// SCALE HELPER: Return type-safe spacing values
// ─────────────────────────────────────────────────────────────────

export function getSpacing(value: keyof typeof SPACING) {
  return SPACING[value]
}

export function getTypeScale(level: keyof typeof TYPE_SCALE) {
  const scale = TYPE_SCALE[level]
  return {
    fontSize: `${scale.size}px`,
    lineHeight: scale.lineHeight,
    fontWeight: scale.weight,
  }
}
