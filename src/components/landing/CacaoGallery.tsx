import { useEffect, useRef } from 'react'

/**
 * Photo-real cacao lifecycle gallery — fixed backdrop driven by `--p`.
 *
 * Each photo holds its own scroll range and a Ken Burns transform (start →
 * end translate + scale). As `--p` enters a photo's range, the photo fades
 * in and its transform interpolates from `start` to `end`. Adjacent photos
 * crossfade through a 15% overlap window at each boundary.
 *
 * Replaces the deleted R3F scene. No three.js, no canvas, no shaders — just
 * `<img>` tags positioned absolutely and mutated each rAF.
 *
 * Asset paths point at /public/uploads/lifecycle/. Until the user drops the
 * full set there, the component degrades to whatever subset exists; missing
 * frames are skipped silently (broken-image events hide the slot).
 */

export interface KBPhoto {
  /** Absolute URL or root-relative path to the image. */
  src: string
  /** Decorative — `aria-hidden=true` is set on the gallery, so this is for
   *  search engines and dev tools rather than screen readers. */
  alt: string
  /** [start, end] of `--p` (0..1) where this photo is visible. */
  range: [number, number]
  /** Ken Burns start transform (applied at `range[0]`). */
  start: KBTransform
  /** Ken Burns end transform (applied at `range[1]`). */
  end: KBTransform
}

export interface KBTransform {
  /** Translate-X in % of container width. */
  x: number
  /** Translate-Y in % of container height. */
  y: number
  /** Uniform scale; ≥1 keeps the photo covering the viewport. */
  scale: number
}

/**
 * 7 photos mapped to the 7 chapters declared in `Landing.tsx`.
 * Path shape: /uploads/lifecycle/NN-slug.jpg — drop new frames there as
 * they become available. The component renders whatever it finds and skips
 * missing files.
 */
const PHOTOS: KBPhoto[] = [
  {
    src: '/uploads/lifecycle/01-seed-macro.jpg',
    alt: 'Cacao bean macro — origin',
    range: [0.00, 0.16],
    start: { x:  0, y:  0, scale: 1.06 },
    end:   { x: -1, y:  1, scale: 1.00 },
  },
  {
    src: '/uploads/lifecycle/02-sapling.jpg',
    alt: 'Cacao sapling at finca',
    range: [0.14, 0.30],
    start: { x:  1, y:  1, scale: 1.00 },
    end:   { x: -1, y: -1, scale: 1.06 },
  },
  {
    src: '/uploads/lifecycle/03-young-tree.jpg',
    alt: 'Young cacao tree',
    range: [0.28, 0.44],
    start: { x: -1, y:  0, scale: 1.05 },
    end:   { x:  1, y: -2, scale: 1.00 },
  },
  // The photo the user sent — adult tree with red mazorcas, lush canopy.
  // Save it to: public/uploads/lifecycle/04-adult-tree.jpg
  {
    src: '/uploads/lifecycle/04-adult-tree.jpg',
    alt: 'Adult cacao tree with mazorcas',
    range: [0.42, 0.60],
    start: { x:  0, y:  2, scale: 1.04 },
    end:   { x:  0, y: -2, scale: 1.00 },
  },
  {
    src: '/uploads/lifecycle/05-mazorca-closeup.jpg',
    alt: 'Red mazorca close-up against bark',
    range: [0.58, 0.74],
    start: { x:  2, y:  0, scale: 1.00 },
    end:   { x: -2, y:  1, scale: 1.06 },
  },
  {
    src: '/uploads/lifecycle/06-mazorca-opened.jpg',
    alt: 'Mazorca opened revealing beans in mucilage',
    range: [0.72, 0.88],
    start: { x:  0, y:  0, scale: 1.07 },
    end:   { x:  0, y:  0, scale: 1.00 },
  },
  // Existing archive photo — founder + drying beds. Use until a more
  // specific harvest/hands shot is provided.
  {
    src: '/uploads/founder-secaderos.jpg',
    alt: 'Founder at the drying beds',
    range: [0.86, 1.00],
    start: { x: -1, y:  0, scale: 1.00 },
    end:   { x:  1, y: -1, scale: 1.06 },
  },
]

/** Crossfade window — the band on each side of a photo's range during which
 *  it fades in/out. Pairs of adjacent ranges overlap by 2× this value (each
 *  contributes one fade band). 0.04 = 4% of total scroll on each side. */
const FADE_BAND = 0.04

export default function CacaoGallery() {
  const wrapRef  = useRef<HTMLDivElement>(null)
  const imgsRef  = useRef<(HTMLImageElement | null)[]>([])
  const seenRef  = useRef<Set<number>>(new Set())   // which photos errored

  useEffect(() => {
    // Reduced motion: paint a single still frame (the adult-tree photo, the
    // canonical "this is what a cacao tree looks like" anchor) and skip rAF.
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) {
      const stillIdx = Math.min(3, PHOTOS.length - 1) // photo 4 (0-indexed)
      const img = imgsRef.current[stillIdx]
      if (img) {
        img.style.opacity = '1'
        img.style.transform = 'translate3d(0,0,0) scale(1.02)'
      }
      return
    }

    let raf = 0
    const tick = () => {
      const root = document.documentElement
      const raw  = getComputedStyle(root).getPropertyValue('--p').trim()
      const p    = raw === '' ? 0 : parseFloat(raw)
      const pp   = Number.isNaN(p) ? 0 : Math.max(0, Math.min(1, p))

      for (let i = 0; i < PHOTOS.length; i++) {
        const img = imgsRef.current[i]
        if (!img || seenRef.current.has(i)) continue
        const photo = PHOTOS[i]
        const [from, to] = photo.range
        const span = to - from
        const local = (pp - from) / span               // -∞ .. +∞ relative to range

        // Visibility envelope — trapezoid: 0 outside [from, to], with linear
        // fade-in/out of width FADE_BAND/span at each edge.
        const fadeT = FADE_BAND / span
        const opacity = clamp01(Math.min(local / fadeT, (1 - local) / fadeT, 1))
        img.style.opacity = String(opacity)

        // Ken Burns transform — clamped local progress drives the lerp.
        const t = clamp01(local)
        const x = lerp(photo.start.x, photo.end.x, t)
        const y = lerp(photo.start.y, photo.end.y, t)
        const s = lerp(photo.start.scale, photo.end.scale, t)
        img.style.transform = `translate3d(${x}%, ${y}%, 0) scale(${s})`

        // Don't promote layers that aren't visible.
        img.style.willChange = opacity > 0.01 ? 'transform, opacity' : 'auto'
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        overflow: 'hidden',
        background: '#040C06',
        pointerEvents: 'none',
      }}
    >
      {PHOTOS.map((photo, i) => (
        <img
          key={photo.src}
          ref={el => { imgsRef.current[i] = el }}
          src={photo.src}
          alt={photo.alt}
          loading="eager"
          decoding="async"
          onError={() => {
            // Silently hide missing frames — let neighbors carry the section.
            const img = imgsRef.current[i]
            if (img) img.style.display = 'none'
            seenRef.current.add(i)
          }}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            opacity: 0,
            transform: 'scale(1)',
          }}
        />
      ))}

      {/* Legibility scrim — keeps copy readable on bright/busy frames.
          Slightly heavier at top (where wordmark sits) and bottom (CTAs). */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background:
          'linear-gradient(180deg, rgba(4,12,6,0.65) 0%, rgba(4,12,6,0.30) 28%, rgba(4,12,6,0.30) 70%, rgba(4,12,6,0.75) 100%)',
        pointerEvents: 'none',
      }} />
    </div>
  )
}

function clamp01(t: number): number { return Math.max(0, Math.min(1, t)) }
function lerp(a: number, b: number, t: number): number { return a + (b - a) * t }
