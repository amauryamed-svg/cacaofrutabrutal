# Frontend Design Skill

Enables creation of **distinctive, production-grade frontend interfaces** that prioritize design quality and avoid generic aesthetics.

## Core Principle

Before coding, establish a bold aesthetic direction by considering:
- **Purpose** — What is this interface for?
- **Tone** — What emotion should it evoke?
- **Constraints** — What platform, stack, and brand?
- **Differentiation** — What makes this NOT look AI-generated?

"Choose a clear conceptual direction and execute it with precision."

## What to Avoid

Common AI-generated design pitfalls:
- Overused font families (Inter, Roboto everywhere)
- Cliched color schemes (blue/white SaaS defaults)
- Predictable layouts (hero → features → CTA)
- Generic component patterns (cards with drop shadows on white)
- Rounded-everything aesthetic
- Pastel gradients

## Design Execution

### Visual Excellence
- **Typography** — Distinctive typefaces over generic fonts. Font pairing matters.
- **Color** — Cohesive themes using CSS variables. System-based, not random.
- **Motion** — Intentional animations that reinforce meaning (not decoration)
- **Composition** — Unexpected spatial layouts, asymmetry, negative space
- **Atmosphere** — Radial glows, grain overlays, contextual visual details

### Code Complexity Rule
Match code complexity to aesthetic vision:
- Maximalist design → elaborate animations, layered effects, rich interactions
- Minimalist design → precision in spacing, typography, and whitespace
- Never add complexity without design purpose

## CAUA Brand Application
For this project specifically:
- **Never** pastel gradients — brutalist luxury only
- Backgrounds: hex values only, no CSS custom properties in JS
- Typography: Barlow Condensed (display), DM Sans (body), Cormorant Garamond (serif)
- Dark backgrounds (#040C06, #0D1A10, #132B1C) are the default surface
- Pod Green (#3D8B37) is the primary accent
- Motion: `cubic-bezier(0.16, 1, 0.3, 1)` spring curve preferred

## Design Checklist

- [ ] Aesthetic direction defined before writing code?
- [ ] Typography creates clear hierarchy (size + weight + color)?
- [ ] Color palette is systematic (not random)?
- [ ] Spacing uses a consistent scale (4/8/16/24/32/48px)?
- [ ] Motion is intentional and adds meaning?
- [ ] Layout breaks expected patterns in at least one dimension?
- [ ] Interface could not be mistaken for a generic template?

## Source
- anthropics/claude-code/plugins/frontend-design
- wondelai/skills + nextlevelbuilder/ui-ux-pro-max-skill
