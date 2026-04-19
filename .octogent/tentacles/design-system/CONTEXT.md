# Tentacle: design-system

## Domain
Visual language — BRAND palette, typography, component library, brutalist luxury aesthetic.

## What This Domain Owns
- `/src/utils/constants.ts` — BRAND object, FONTS, ROLE_CONFIG, all design tokens
- `/src/design/tokens.ts` — Design tokens file
- `/src/components/ui/` — 14 shared UI components
- `/src/App.css` — Global CSS keyframe animations
- `/src/index.css` — Base styles + Tailwind imports
- `/caua-brand/REFERENCE.md` — Brand guidelines reference
- `/caua-brand/SKILL.md` — Brand system documentation

## The Non-Negotiable Rules (CauaCore §8)

1. **Backgrounds MUST use hex constants** — Always use `BRAND.bgDeep` (= `#040C06`) or inline hex strings. Never `var(--color-xxx)`, `bg-gray-900`, or any CSS custom property for backgrounds.
2. **Never pastel gradients** — Any gradient must use BRAND hex values at high contrast. A gradient from `#040C06` to `#1C3B26` is acceptable. A gradient from `#F7F1EE` to `#FFDDD5` is not.
3. **GrainOverlay is always present** — The `GrainOverlay` component renders an SVG noise filter over the entire app. Never remove it. Never conditionally render it.
4. **Framer Motion only for CauaGotchi** — Import Framer Motion only in `CauaGotchi.tsx`. Use CSS keyframes (`App.css`) for all other animations.

## BRAND Palette (from src/utils/constants.ts)

```ts
export const BRAND = {
  heirloom:   '#F7F1EE',  // Cream — primary text, body copy
  amazon:     '#1C3B26',  // Dark green — borders, secondary backgrounds
  pod:        '#91A63B',  // Green — primary accent, health bar, CTA buttons
  mazorca:    '#F1A91E',  // Amber — moisture, secondary accent, warnings
  criollo:    '#8D2679',  // Purple — ritual/tarot, mystical elements
  theobroma:  '#DB5527',  // Red-brown — products, CTAs on dark backgrounds
  muisca:     '#004E64',  // Teal — technology, science, B2B elements
  heroic:     '#00A3CD',  // Cyan — investor role, premium elements
  bgDeep:     '#040C06',  // Almost black — primary page background
  bgCard:     '#132B1C',  // Dark green — card backgrounds
}
```

## Typography Stack

```ts
export const FONTS = {
  display:  'Barlow Condensed, Impact, sans-serif',  // Headings, labels, bold statements
  body:     'DM Sans, sans-serif',                   // Body text, UI text
  serif:    'Cormorant Garamond, Georgia, serif',    // Quotes, taglines, editorial
  mono:     'Space Mono, Courier New, monospace',   // Code, technical info, CauaGotchi
}
```

Loaded from Google Fonts in `/index.html`.

## Component Inventory (src/components/ui/)

| Component | Purpose | Status |
|-----------|---------|--------|
| `CauaButton.tsx` | Primary/secondary button variants | Done |
| `CauaCard.tsx` | Card container with BRAND styling | Done |
| `CauaLogo.tsx` | Logo with color + size variants | Done |
| `CauaIcons.tsx` | Icon library (SVG) | Done |
| `BrandIcon.tsx` | Single brand icon component | Done |
| `GrainOverlay.tsx` | SVG noise filter overlay | Done — never remove |
| `AuthGate.tsx` | Protected route wrapper (redirects to /auth) | Done |
| `TokenBalance.tsx` | Beans + mazorcas balance display | Done |
| `LanguageToggle.tsx` | ES/EN language toggle (LangContext) | Done |
| `CookieBanner.tsx` | GDPR/CCPA cookie consent UI | Done |
| `HubspotLeadForm.tsx` | HubSpot embedded lead form | Done |
| `DevErrorMonitor.tsx` | Dev-only error monitoring overlay | Done |
| `ProductIllustration.tsx` | SVG product illustrations | Done |
| `SwipeableTreeCard.tsx` | Guardian card swipe carousel | Done |

## Role Color Mapping (ROLE_CONFIG in constants.ts)

| Role | Color | Purpose |
|------|-------|---------|
| investor | `BRAND.heroic` = #00A3CD | Premium/financial |
| founder | `BRAND.theobroma` = #DB5527 | Origin/creation |
| farmer | `BRAND.pod` = #91A63B | Nature/earth |
| nativo | `BRAND.mazorca` = #F1A91E | Community/warmth |
| creyente | `BRAND.heirloom` = #F7F1EE | Default/newcomer |

## Animation System

CSS keyframes defined in `src/App.css`:
- `animate-fade-in-up` — Elements slide up and fade in on mount
- `animate-pulse-glow` — Pulsing glow effect (used for CTA highlights)
- `float` — Gentle floating/hovering motion (used for product cards)

Framer Motion (CauaGotchi only):
- Breathing pulse on sprite: `{ scale: [1, 1.02, 1], transition: { repeat: Infinity, duration: 2 } }`

## Styling Approach

1. **Primary**: Inline style objects (`style={{ background: BRAND.bgDeep, color: BRAND.heirloom }}`)
2. **Utilities**: Tailwind classes for spacing, flex, grid, transitions (`className="flex gap-4 transition-all"`)
3. **Never**: Tailwind `bg-xxx` or `text-xxx` color classes for brand colors (they don't use our BRAND hex values)

## Missing Components (to build)

These patterns are currently duplicated across the codebase and need extraction:

| Component to Build | Currently duplicated in |
|-------------------|------------------------|
| `CauaTokenChip` | TokenBalance, Ritual, Dashboard |
| `CauaProgressBar` | CauaGotchi, AdminCRM, FundingProgress |
| `CauaModal` | InvestModal, EditUserPanel (AdminCRM) |
| `CauaStageCard` | Adoptar, TreeDetail |
| `CauaBadge` | AdminCRM user table, NavBar role indicator |
