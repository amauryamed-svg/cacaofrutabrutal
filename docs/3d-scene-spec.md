# Lifecycle Gallery Spec — CAUA Home

> The home (`src/pages/Landing.tsx`, served at `/app/`) and the public investor
> landing (`public/investor-landing.html`, served at `/`) share a *visual
> language* — photo-real cacao, dark brutalist, clean. The SPA implements that
> language as a scroll-driven photo gallery. The public landing keeps its
> existing Three.js scene for now.
>
> Inspired by https://www.capsul-in-pro.com/home-compost-capsule/ — single
> subject, clean transitions, typography-led.
>
> Replaces the previous R3F scene (`src/components/landing/scene/`, deleted
> 2026-04-29) with a photographic Ken Burns crossfade gallery.

---

## Scroll contract — `--p` and `--pd`

Two CSS custom properties on `:root`, written every animation frame by
[`src/hooks/useScrollProgress.ts`](../src/hooks/useScrollProgress.ts).

| Var   | Range | Meaning                                                          |
| ----- | ----- | ---------------------------------------------------------------- |
| `--p` | 0..1  | Global page scroll progress (`scrollY / (scrollHeight - innerH)`)|
| `--pd`| 0..1  | Cubic-eased proximity to `#join` (CTA section)                   |

**Reduced motion:** writer emits constants `--p=0.5`, `--pd=1`. Gallery paints
the canonical adult-tree photo and never animates again.

---

## The 7 photos

Each photo holds a `--p` range plus a Ken Burns transform (start → end). As
the page scrolls, the active photo's transform interpolates from `start` to
`end`, and a 4% crossfade band at each edge blends with the neighbor.

Drop files at `/public/uploads/lifecycle/NN-slug.jpg`. Missing frames are
silently hidden — the gallery degrades to whatever subset exists.

| #  | Range          | File                                       | Concept                                          |
| -- | -------------- | ------------------------------------------ | ------------------------------------------------ |
| 1  | 0.00 – 0.16    | `01-seed-macro.jpg`                        | Cacao bean macro — origin, dark, intimate        |
| 2  | 0.14 – 0.30    | `02-sapling.jpg`                           | Cacao sapling at finca — first leaves            |
| 3  | 0.28 – 0.44    | `03-young-tree.jpg`                        | Young tree (1–2 m), no fruit yet                 |
| 4  | 0.42 – 0.60    | `04-adult-tree.jpg`                        | **Adult tree with red mazorcas** (your photo)    |
| 5  | 0.58 – 0.74    | `05-mazorca-closeup.jpg`                   | Red mazorca close-up against bark                |
| 6  | 0.72 – 0.88    | `06-mazorca-opened.jpg`                    | Mazorca opened, beans in mucilage                |
| 7  | 0.86 – 1.00    | `founder-secaderos.jpg` *(existing)*       | Founder + drying beds — harvest beat             |

Ranges are mapped to the 7 chapters in `Landing.tsx` (Hero, Tagline,
Guardianes, Biotech, Regeneration, Impact, Únete CTA).

---

## Photo specs (for whoever shoots / sources)

| Property | Value |
| --- | --- |
| Format | `.jpg` (sRGB, quality ~80, mozjpeg progressive). Avoid HEIC. |
| Dimensions | 2400 × 1600 px minimum (16:9 friendly). Bigger fine — Vite serves as-is. |
| Color | No heavy filters. Slightly warmer than neutral OK; we apply a dark scrim on top. |
| Composition | Subject roughly centered or following a stable focal point — the Ken Burns transform shifts ±2% so don't crop too tight. |
| Aspect | Cover-fits the viewport. Shoot with both desktop (16:9) and mobile (9:16) framing in mind — central 50% must work in both. |
| Mood | Lush, real, photographic. The user-supplied adult-tree photo (red mazorcas, mossy trunk, leaf litter floor) is the visual reference. |

---

## Performance notes

- Each `<img>` is positioned absolute, layered. Only the active photo (and one
  neighbor during crossfade) consumes a compositor layer thanks to
  `will-change` toggling tied to opacity.
- Photos use `loading="eager"` because they're the hero — first paint matters
  more than bandwidth here. If first-paint hurts on slow connections, switch
  the off-screen photos to `loading="lazy"`.
- No three.js, no canvas, no shaders. The previous R3F chunk (~358 KB gz) is
  gone.
- Gallery component is a single ~150-line file, ships in the main `index-*.js`
  chunk. No code-split needed.

---

## Bundle delta (after migration)

```
Before:
  CauaScene-*.js    1.17 MB  /  358 KB gz   (three + drei + postprocessing)
  index-*.js        1.17 MB  /  347 KB gz

After:
  index-*.js        ~1.17 MB /  ~347 KB gz   (CacaoGallery is ~3 KB gz)
```

Net saving on `/app/` first paint: **~358 KB gz**. The R3F deps remain in
`package.json`; nothing imports them so Vite tree-shakes them out of the
build. A follow-up cleanup commit can remove them from `package.json` and
`node_modules`.

---

## Validation checklist

```bash
npm run dev
```

- `http://localhost:3000/app/?scrollDebug=1` — overlay shows `--p` 0→1, `--pd`
  peaks at the `#join` section.
- Scroll top → bottom: photos crossfade in order 1 → 7 with subtle Ken Burns
  pan/zoom on the active one.
- Missing photos (404) are silently hidden; copy still works because the
  gradient base + scrim guarantee legibility.
- DevTools "Rendering" → emulate `prefers-reduced-motion: reduce` — gallery
  paints the adult-tree photo (or the closest available) once, no rAF.
- Mobile emulation iPhone SE — same gallery, photos scale to cover, copy
  legible thanks to the top/bottom scrim.
- Production build: `npm run build` → confirm there is no `CauaScene-*.js`
  chunk and no `WebGLRenderer` reference anywhere in `dist/assets/`.

---

## Adding a new photo / changing a beat

1. Drop the file in `/public/uploads/lifecycle/`.
2. Update the `PHOTOS` array in
   [`src/components/landing/CacaoGallery.tsx`](../src/components/landing/CacaoGallery.tsx) — add or edit the entry.
3. Update the table above so future-you (and other contributors) know the
   intended order.
4. Adjacent ranges should overlap by ~0.04 (the `FADE_BAND`) for a clean
   crossfade. Don't set `range` to a span shorter than `0.08` — the photo
   wouldn't fully reach `opacity: 1` between the two fade bands.
