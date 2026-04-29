// Investor landing — photo-real cacao lifecycle gallery (vanilla JS).
//
// Vanilla port of src/components/landing/CacaoGallery.tsx so the public
// investor landing and the SPA `/app/` home share the same visual language.
//
// Reads `--p` from `:root` (written by `investor-scroll.js`) every rAF and
// drives Ken Burns transforms + crossfade between 7 photos.
//
// The HTML provides 7 <img> children inside #cacao-gallery, in order. Their
// `src` paths must match PHOTOS[i].src below. Missing files are silently
// hidden (broken-image events).

(function () {
  'use strict'
  if (typeof window === 'undefined') return

  // 7 photos × Ken Burns config. Mirror of CacaoGallery.tsx PHOTOS[].
  // Adjust ranges/transforms in lock-step with the React component (see
  // docs/3d-scene-spec.md) to keep both sites synchronized.
  const PHOTOS = [
    { range: [0.00, 0.16], start: { x:  0, y:  0, scale: 1.06 }, end: { x: -1, y:  1, scale: 1.00 } },
    { range: [0.14, 0.30], start: { x:  1, y:  1, scale: 1.00 }, end: { x: -1, y: -1, scale: 1.06 } },
    { range: [0.28, 0.44], start: { x: -1, y:  0, scale: 1.05 }, end: { x:  1, y: -2, scale: 1.00 } },
    { range: [0.42, 0.60], start: { x:  0, y:  2, scale: 1.04 }, end: { x:  0, y: -2, scale: 1.00 } },
    { range: [0.58, 0.74], start: { x:  2, y:  0, scale: 1.00 }, end: { x: -2, y:  1, scale: 1.06 } },
    { range: [0.72, 0.88], start: { x:  0, y:  0, scale: 1.07 }, end: { x:  0, y:  0, scale: 1.00 } },
    { range: [0.86, 1.00], start: { x: -1, y:  0, scale: 1.00 }, end: { x:  1, y: -1, scale: 1.06 } },
  ]
  const FADE_BAND = 0.04

  function clamp01(t) { return Math.max(0, Math.min(1, t)) }
  function lerp(a, b, t) { return a + (b - a) * t }

  function init() {
    const wrap = document.getElementById('cacao-gallery')
    if (!wrap) return
    const imgs = Array.from(wrap.querySelectorAll('img'))
    if (imgs.length === 0) return

    const dead = new Set()

    // Hide broken frames silently — neighbors carry the section.
    imgs.forEach((img, i) => {
      img.addEventListener('error', () => {
        img.style.display = 'none'
        dead.add(i)
      })
    })

    // Reduced motion → paint a single still frame (#4 adult tree) and stop.
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) {
      const still = imgs[Math.min(3, imgs.length - 1)]
      if (still) {
        still.style.opacity = '1'
        still.style.transform = 'translate3d(0,0,0) scale(1.02)'
      }
      return
    }

    let raf = 0
    function tick() {
      const root = document.documentElement
      const raw  = getComputedStyle(root).getPropertyValue('--p').trim()
      const p    = raw === '' ? 0 : parseFloat(raw)
      const pp   = isNaN(p) ? 0 : clamp01(p)

      for (let i = 0; i < imgs.length; i++) {
        if (dead.has(i)) continue
        const img = imgs[i]
        const photo = PHOTOS[i]
        if (!photo) continue
        const span = photo.range[1] - photo.range[0]
        const local = (pp - photo.range[0]) / span

        const fadeT = FADE_BAND / span
        const opacity = clamp01(Math.min(local / fadeT, (1 - local) / fadeT, 1))
        img.style.opacity = String(opacity)

        const t = clamp01(local)
        const x = lerp(photo.start.x, photo.end.x, t)
        const y = lerp(photo.start.y, photo.end.y, t)
        const s = lerp(photo.start.scale, photo.end.scale, t)
        img.style.transform = 'translate3d(' + x + '%,' + y + '%,0) scale(' + s + ')'

        img.style.willChange = opacity > 0.01 ? 'transform, opacity' : 'auto'
      }

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
  }

  // Hero intro video handoff — was in the deleted investor-3d.js. Without
  // this, the video plays once, holds on its last frame and blocks the page.
  // Dismiss when: the clip ends, errors, or the user scrolls past --p > 0.04.
  function wireHeroVideoDismiss() {
    const video = document.getElementById('hero-intro-video')
    if (!video) return
    let dismissed = false
    function dismiss() {
      if (dismissed) return
      dismissed = true
      video.classList.add('fade-out')
      setTimeout(function () {
        try { video.pause(); video.remove() } catch (_) {}
      }, 1300)
    }
    video.addEventListener('ended', dismiss)
    video.addEventListener('error', dismiss)
    function watchScroll() {
      if (dismissed) return
      const raw = getComputedStyle(document.documentElement).getPropertyValue('--p').trim()
      const p = raw === '' ? 0 : parseFloat(raw)
      if (!isNaN(p) && p > 0.04) { dismiss(); return }
      requestAnimationFrame(watchScroll)
    }
    requestAnimationFrame(watchScroll)
    // Safety net: if the clip is longer than expected and the user never
    // scrolls, force-dismiss after 6s so the page is never stuck behind it.
    setTimeout(dismiss, 6000)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      init()
      wireHeroVideoDismiss()
    }, { once: true })
  } else {
    init()
    wireHeroVideoDismiss()
  }
})()
