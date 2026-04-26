// Single scroll source for investor-landing.html.
// Writes progress to :root as --p so investor-3d.js reads off one listener.
// Also runs Fortified-style scroll-triggered counters for the Unit Economics section.
// motion v12 loaded via esm.sh (public/ assets bypass Vite transform — direct CDN URL is simplest)
import { scroll, animate } from "https://esm.sh/motion@12";

// Hard kill switch honors docs/context/ui-ux-bar.md — reduced-motion means no scrubbing, no counter tween.
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

// Global scroll progress — investor-3d.js reads this via getComputedStyle(--p)
if (!reduceMotion) {
  scroll((p) => {
    document.documentElement.style.setProperty("--p", p.toFixed(4));
  });
} else {
  document.documentElement.style.setProperty("--p", "0.5");
}

// Section 09 (#investment) proximity — writes --pd (0..1) to :root.
// Drives the divine mazorca reveal in investor-3d.js so the climax is anchored
// to "Building the first functional cacao platform" rather than a raw page %.
if (!reduceMotion) {
  const investment = document.getElementById("investment");
  if (investment) {
    let pdTicking = false;
    const updatePd = () => {
      const r = investment.getBoundingClientRect();
      const vh = window.innerHeight;
      const secCenter = r.top + r.height / 2;
      const normDist = Math.abs(secCenter - vh / 2) / (vh * 0.9);
      const raw = Math.max(0, Math.min(1, 1 - normDist));
      const eased = 1 - Math.pow(1 - raw, 3);
      document.documentElement.style.setProperty("--pd", eased.toFixed(3));
      pdTicking = false;
    };
    addEventListener("scroll", () => {
      if (!pdTicking) { requestAnimationFrame(updatePd); pdTicking = true; }
    }, { passive: true });
    addEventListener("resize", updatePd, { passive: true });
    updatePd();
  }
} else {
  document.documentElement.style.setProperty("--pd", "1");
}

// Unit Economics — scroll-triggered counters (Fortified pattern).
// Each .ue-num reads data-target (number) + optional data-decimals (int, default 0).
const counters = document.querySelectorAll(".ue-num[data-target]");
counters.forEach((el) => {
  const target = parseFloat(el.dataset.target);
  const decimals = parseInt(el.dataset.decimals || "0", 10);
  const formatter = new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  const render = (v) => { el.textContent = formatter.format(v); };
  if (reduceMotion) { render(target); return; }
  render(0);
  new IntersectionObserver(
    (entries, obs) => {
      if (entries[0].isIntersecting) {
        animate(0, target, {
          duration: 1.6,
          ease: [0.16, 1, 0.3, 1],
          onUpdate: render,
          onComplete: () => {
            el.classList.add("ue-num-done");
            setTimeout(() => el.classList.remove("ue-num-done"), 700);
          },
        });
        obs.disconnect();
      }
    },
    { threshold: 0.55 }
  ).observe(el);
});
