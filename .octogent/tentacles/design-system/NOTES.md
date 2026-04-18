# NOTES — design-system

## Architectural Decisions

**[2026-04-18] Inline styles are the primary styling approach — Tailwind is for utilities only**
All brand colors, backgrounds, and typography are applied via inline style objects referencing `BRAND` and `FONTS` constants. Tailwind is used for layout utilities (flex, grid, gap, padding, responsive breakpoints, transitions). This decision was made to avoid Tailwind's JIT compilation breaking on dynamic color values and to keep brand tokens in one place (`constants.ts`).

**[2026-04-18] The entire app IS dark mode — there is no light mode**
`BRAND.bgDeep = #040C06` is the page background for the entire application. There is no light mode variant. Do not add light mode support without explicit product direction. Do not add CSS that conditionally switches backgrounds based on `prefers-color-scheme`.

**[2026-04-18] GrainOverlay must never be removed**
The SVG grain filter in `GrainOverlay.tsx` is a deliberate brand element — it gives the app the "brutalist luxury" texture feel. It is applied at the root layout level. Never conditionally render it, never add a z-index above it, and never hide it on specific pages.

**[2026-04-18] Framer Motion is restricted to CauaGotchi.tsx**
Framer Motion was added specifically for the sprite breathing animation in `CauaGotchi.tsx`. Adding Framer Motion to other components increases bundle size significantly (the package is ~80KB gzipped). Use CSS `@keyframes` from `App.css` for all other animations.

**[2026-04-18] Never use Tailwind color classes for brand colors**
Tailwind classes like `bg-gray-900` or `text-amber-400` do not map to our BRAND hex values. Using them creates color inconsistency that is difficult to audit. The only acceptable pattern is:
```tsx
// CORRECT:
style={{ background: BRAND.bgDeep, color: BRAND.heirloom }}
// WRONG:
className="bg-gray-950 text-amber-50"
```

## Known Risks

- Several components duplicate the progress bar pattern (CauaGotchi, AdminCRM, FundingProgress). Until `CauaProgressBar` is extracted, changes to the retro style must be made in multiple places.
- `CauaModal` does not exist as a shared component. `InvestModal.tsx` and the admin edit panel have incompatible styling. New modals should wait for the shared component.
