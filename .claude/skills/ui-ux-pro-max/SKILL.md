# UI/UX Pro Max — Design Intelligence

Comprehensive design system guidance for professional web and mobile UI/UX. Covers 50+ design styles, 161 color palettes, 57 font pairings, 99 UX guidelines, and 25 chart types across 10 technology stacks.

## When to Use
Invoke for:
- UI structure and visual design decisions
- Interaction patterns and UX quality control
- New page design (landing, dashboards, mobile apps)
- Component creation or refactoring
- Color schemes, typography, spacing standards
- UI code review for accessibility and consistency
- Navigation and responsive behavior

Skip for: backend logic, API/database design, infrastructure, non-visual automation.

## Technology Stacks Covered
React · Next.js · Vue · Svelte · SwiftUI · React Native · Flutter · Tailwind · shadcn/ui · HTML/CSS

## 10 Priority Rule Categories

### CRITICAL
**1. Accessibility**
- Contrast minimum 4.5:1 (WCAG AA) for all text
- Alt text for all meaningful images
- Full keyboard navigation support
- ARIA labels on interactive elements without visible text
- Focus states visible (2-4px ring)

**2. Touch & Interaction**
- Minimum touch target: **44×44pt** (Apple) / **48×48dp** (Material)
- Minimum spacing between targets: 8px
- Tap feedback within 100ms
- No hover-only interactions (mobile users can't hover)

### HIGH
**3. Performance**
- Images: WebP/AVIF format, lazy loading
- Cumulative Layout Shift < 0.1
- No layout shift on load (reserve space for images/ads)

**4. Style Selection**
- Match design style to product type (brutalist for CAUA, not pastel SaaS)
- Consistent icon family throughout (no mixing SF Symbols + Font Awesome)
- SVG icons preferred over icon fonts

**5. Layout & Responsive**
- Mobile-first breakpoints: 375 → 480 → 768 → 1024 → 1280px
- No horizontal scrolling at any viewport
- Safe areas respected (iOS notch, home indicator)
- Grid: `minmax(min(X, 100%), 1fr)` pattern for responsive grids

**6. Navigation Patterns**
- Predictable back behavior (never break browser history)
- Bottom nav ≤ 5 items
- Deep linking support
- Breadcrumbs for hierarchical content

### MEDIUM
**7. Typography & Color**
- Base body text: 16px minimum, 1.5 line-height
- Semantic color tokens (not hardcoded values)
- Color conveys meaning only when paired with text/icon
- Heading hierarchy (h1 > h2 > h3) — never skip levels

**8. Animation**
- Micro-interactions: 150-300ms
- Page transitions: 200-400ms
- Always support `prefers-reduced-motion`
- Easing: ease-out for entrances, ease-in for exits

**9. Forms & Feedback**
- Visible labels (never placeholder-only)
- Error messages near the field that caused them
- Progressive disclosure (ask for info only when needed)
- Success/error states after every submission

### LOW
**10. Charts & Data**
- Color-blind-safe palettes (don't rely on red/green alone)
- Legend always visible
- Tooltips on hover/tap
- Table alternative for complex charts

## Key Standards (Memorize)
| Standard | Value |
|----------|-------|
| Text contrast | 4.5:1 minimum |
| Touch target | 44pt / 48dp minimum |
| Animation duration | 150-300ms (micro), 200-400ms (transitions) |
| Spacing unit | 4pt/8dp increments |
| Focus ring | 2-4px, clearly visible |
| Body font size | 16px base |
| Line height (body) | 1.5 minimum |

## Pre-Delivery Checklist
- [ ] No emoji substituting for vector icons
- [ ] All interaction states have visible feedback
- [ ] Light AND dark mode contrast both meet 4.5:1
- [ ] Safe areas respected on mobile
- [ ] All accessibility labels are descriptive
- [ ] Touch targets ≥ 44px on all interactive elements
- [ ] No hover-only information (mobile-accessible)
- [ ] Animation respects `prefers-reduced-motion`

## Source
- nextlevelbuilder/ui-ux-pro-max-skill
