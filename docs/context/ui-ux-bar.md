---
tags: [hot, ui-ux, non-negotiable, immersive]
---
# Caúa Immersive Experience Bar — UI/UX §7

> **Authoritative. Always loaded (🔥 HOT).** Every new page and every refactor must meet this bar. This file overrides per-page decisions.
> Companion to `docs/context/constraints.md` (CauaCore §8) and `docs/brand/REFERENCE.md`.

---

## Purpose

Caúa's promise is an **immersive cacao experience** — a website that feels like walking through an agroforestry system, not scrolling a deck. This bar enshrines the minimum level of polish, performance, motion fidelity, 3D asset discipline, and accessibility that every page ships with. A page that doesn't meet this bar is not shippable.

---

## 1. Performance budgets

| Metric | Desktop | Mobile | Enforcement |
|--------|---------|--------|-------------|
| LCP (Largest Contentful Paint) | ≤ 2.0s | ≤ 2.5s | Lighthouse CI |
| CLS (Cumulative Layout Shift) | ≤ 0.02 | ≤ 0.05 | Lighthouse CI |
| INP (Interaction to Next Paint) | ≤ 120ms | ≤ 180ms | Vercel Speed Insights |
| TBT (Total Blocking Time) | ≤ 150ms | ≤ 300ms | Lighthouse CI |
| JS transfer (gzipped) | ≤ 220 KB | ≤ 180 KB | `npm run build` size check |
| Page weight total | ≤ 12 MB | ≤ 8 MB | manual on-review |
| Runtime fps | 60 @ 1080p | 30 floor | `scripts/validate-3d.mjs` |
| `devicePixelRatio` cap | 2.0 | 1.25 | `renderer.setPixelRatio()` |

Any page that regresses these metrics must either (a) fix the regression before merge, or (b) add a documented exception to the design-system tentacle `NOTES.md` with a scheduled remediation date.

---

## 2. Asset pipeline contract

Every 3D / video asset passes through `scripts/optimize-*.mjs` **before commit**.

| Asset type | Target | Format | Pipeline |
|-----------|--------|--------|----------|
| GLB / GLTF | ≤ 3 MB | Draco + KTX2 textures | `scripts/optimize-gltf.mjs` |
| HDRI (IBL) | ≤ 1.5 MB | 1024×512 half-float | `scripts/optimize-hdri.mjs` |
| MP4 hero video | ≤ 6 MB | H.264 yuv420p, `-g 1` keyframe-per-frame | `scripts/optimize-video.mjs` |
| WebM alt | ≤ 4 MB | VP9 yuv420p, `-g 1` | `scripts/optimize-video.mjs` |
| Poster JPG | ≤ 200 KB | 1920 wide, q82 | `scripts/optimize-video.mjs` |
| PBR texture | ≤ 2 MB per map | KTX2 above 512px, WebP below | `scripts/optimize-gltf.mjs` |

Unoptimized assets never land in `main`. Pre-commit hook validates presence + size.

---

## 3. Motion fidelity

**Scroll primitive:** `motion.dev` vanilla flavor only in non-React pages (e.g. `public/investor-landing.html`). React SPA uses Framer Motion — but only where CauaGotchi sanctions it per CauaCore §8. **GSAP, ScrollTrigger, Lenis, Locomotive Scroll are banned.**

**Single source of scroll truth:** for any page with multiple scroll-driven effects (3D + rail + video scrub), one listener writes `--p` to `:root`, all consumers read it. Never duplicate scroll listeners.

**rAF throttling:** every scroll callback ends in `requestAnimationFrame`; zero layout reads (`getBoundingClientRect`, `offsetWidth`) inside animate callbacks.

**Easing vocabulary:**
- Micro-interactions: 150–300ms, `ease-out` on entrance, `ease-in` on exit
- Hero / big reveals: ≥ 600ms, editorial cubic `cubic-bezier(0.16, 1, 0.3, 1)`
- Never Material bounce, never overshoot > 3%

**Reduced-motion is a hard kill switch.** Never a graceful degradation. When `prefers-reduced-motion: reduce` is set:
- Scroll-scrubbed video → replaced by `<img>` poster
- Pin rail → collapses to vertical stack (no sticky, no horizontal scroll)
- 3D scene → canvas hidden, rendered as static poster JPG
- Zero console warnings, zero partial states

---

## 4. 3D policy

- **WebGL is gated.** Skip render if `innerWidth < 768 || navigator.hardwareConcurrency < 4 || prefers-reduced-motion`.
- **LOD required** for any mesh > 20k triangles. Use `THREE.LOD` with 3 tiers.
- **IntersectionObserver pauses** the render loop when canvas scrolls offscreen — CPU / battery savings.
- **HDRI-based IBL mandatory** for brand-coherent lighting. Tone-mapped ACES filmic, exposure 1.0.
- **Scene graph hygiene:** procedural baseline stays as fallback (zero regression if GLB fails to load).
- **DRACO decoder** either bundled at `public/assets/3d/draco/` or loaded from Google's gstatic CDN — never inlined.

---

## 5. Accessibility (WCAG 2.1 AA minimum)

From UI/UX Pro Max skill (`.claude/skills/ui-ux-pro-max/`):

- **Contrast** ≥ 4.5:1 on all text. Glass cards over live 3D must test legibility with `backdrop-filter` OFF (fallback ensures contrast).
- **Touch targets** ≥ 44pt / 48dp on all interactive elements (cards, CTAs, nav, rail stages).
- **Focus ring** 2–4px visible (use `outline: 2px solid #E89A5E` — Theobroma Orange works on both light and dark glass).
- **Keyboard nav:** every interactive element reachable via Tab in logical order. Pin rails expose `aria-roledescription="carousel"` + skip link.
- **No hover-only interactions.** Any info shown on hover has a tap/focus equivalent.
- **Alt text** on every meaningful image. Decorative `<img>` uses `alt=""`.
- **Animations respect `prefers-reduced-motion`** — see §3.

---

## 6. Design coherence (locks CauaCore §8)

- **Backgrounds: hex literals only** — never `var(--color)` for brand colors. Translucency uses `rgba(R,G,B,alpha)` with the RGB components hardcoded.
- **Grain overlay permanent** — opacity 0.035, z-index 9999, `pointer-events: none` on every full page. Never removed for "clean look" reasons.
- **Typography:**
  - `FONTS.display` = Barlow Condensed for headlines (uppercase, weight 900, letterSpacing −0.02em to 0.15em)
  - `FONTS.body` = DM Sans for body (weight 400/500, lineHeight 1.6–1.75)
  - `FONTS.serif` = Cormorant Garamond for editorial/poetic moments only
- **Color:** Pod Green `#91A63B` primary CTA, Mazorca Yellow `#F1A91E` accent, Cosmic Criollo `#8D2679` for purple moments, Amazon Green `#1C3B26` for bg depth. Full palette in `src/design/tokens.ts` and `docs/brand/REFERENCE.md`.

---

## 7. Acceptance tests (append to `docs/archive/SRS.md §7`)

**AC-11 — Scroll-scrubbed video fidelity.** Given a hero section with scroll-scrubbed video. When scrolling through the section, then `video.currentTime` tracks `window.scrollYProgress` within ±1 frame at 60fps sustained. When `prefers-reduced-motion: reduce` is set, then the `<video>` element is replaced by the poster `<img>` with zero console errors.

**AC-12 — Rail pin integrity.** Given a pinned horizontal rail (`#stages-rail`) with 4 stages over 400vh. When the user scrolls into the section, then the viewport remains sticky until all 4 stages advance. No layout shift on entry or exit (CLS delta < 0.01). When viewport < 600px, stages remain readable without horizontal overflow.

**AC-13 — Reduced-motion fallback.** Given `prefers-reduced-motion: reduce` is set. When the page loads, then the WebGL canvas is hidden (`display: none`), the `<video>` hero is replaced by `<img>` poster, the pin rail collapses to a vertical stack. Zero console warnings, zero partial states.

**AC-14 — Asset budget enforcement.** Given a PR that adds assets to `public/assets/3d/`. When CI runs, then pages fail the build if total transfer > 12 MB desktop / 8 MB mobile per `docs/context/ui-ux-bar.md §1`.

---

## 8. Delivery checklist (before merge)

- [ ] All text contrast ≥ 4.5:1 (tested with glass backdrop OFF)
- [ ] Touch targets ≥ 44pt on mobile
- [ ] Focus ring visible on every interactive element
- [ ] `prefers-reduced-motion` renders clean static page (no partial animations)
- [ ] Alt text on every image; decorative = `alt=""`
- [ ] 3D assets passed through `optimize-*.mjs` before commit
- [ ] No hover-only interactions
- [ ] Lighthouse: LCP ≤ 2.5s, CLS ≤ 0.05 (mobile)
- [ ] No emoji as primary iconography (SVG botanical line art per `docs/brand/REFERENCE.md §Iconography`)
- [ ] Grain overlay still present after refactor
- [ ] All backgrounds use hex + rgba literals (no `var(--color)`)

---

*v1.0 · 2026-04-24 · Ratified with `public/investor-landing.html` immersive upgrade. Maintained by design-system + infra-devops tentacles.*
