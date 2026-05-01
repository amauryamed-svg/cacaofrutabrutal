import * as THREE from 'three'

/**
 * Helpers + constants for Machete3DCursor — split out of the .tsx so HMR
 * (react-refresh/only-export-components) doesn't get confused by mixed
 * component + non-component exports.
 */

// Baseline tilt per spec.transform_root.rotation — gives the machete that
// slightly-cocked emoji feel.
export const MACHETE_REST_ANGLE = 0.05

// World-units scale; `0.04 *` gets the ~12-unit-wide model down to a
// sensible cursor-sized footprint.
export const MACHETE_SCALE = 8

/** Cursor ref shape — host arena writes; Machete3D reads in useFrame. */
export type CursorRef = {
  x: number             // px from arena left
  y: number             // px from arena top
  visible: boolean      // currently dragging or recently active
  visibleUntil: number  // ms timestamp; machete fades after this
  swipeAngle: number    // radians, atan2(dy, dx) of the most recent swipe
}

/** Factory — fresh cursor ref shape. */
export function makeCursorRef(): CursorRef {
  return { x: 0, y: 0, visible: false, visibleUntil: 0, swipeAngle: 0 }
}

// ─── Geometry shapes (per spec) ─────────────────────────────────────────────

/** Blade Shape per spec.objects[0].geometry.shape.points */
export function buildBladeShape(): THREE.Shape {
  const s = new THREE.Shape()
  s.moveTo(-4.5, -0.55)
  s.lineTo(-4.5, 0.55)
  s.quadraticCurveTo(-3.5, 0.95, -1.0, 1.15)
  s.quadraticCurveTo(1.5, 1.35, 3.8, 1.55)
  s.quadraticCurveTo(4.6, 1.55, 5.0, 1.0)
  s.quadraticCurveTo(5.3, 0.4, 5.0, -0.2)
  s.quadraticCurveTo(4.0, -0.7, 0.0, -0.65)
  s.lineTo(-4.5, -0.55)
  return s
}

/** Handle "capsule" Shape per spec.objects[2].geometry.shape.points */
export function buildHandleShape(): THREE.Shape {
  const s = new THREE.Shape()
  s.moveTo(-3.2, 0)
  s.quadraticCurveTo(-3.5, 0.85, -2.6, 0.95)
  s.lineTo(-0.3, 0.95)
  s.quadraticCurveTo(0.1, 0.95, 0.2, 0.7)
  s.lineTo(0.2, -0.7)
  s.quadraticCurveTo(0.1, -0.95, -0.3, -0.95)
  s.lineTo(-2.6, -0.95)
  s.quadraticCurveTo(-3.5, -0.85, -3.2, 0)
  return s
}

/** Lighter bevel band along the blade's top profile. */
export function buildBladeEdgeShape(): THREE.Shape {
  const s = new THREE.Shape()
  s.moveTo(-4.4, 0.55)
  s.quadraticCurveTo(-3.5, 0.95, -1.0, 1.15)
  s.quadraticCurveTo(1.5, 1.35, 3.8, 1.55)
  s.quadraticCurveTo(4.6, 1.55, 5.0, 1.0)
  s.lineTo(5.0, 1.0)
  s.quadraticCurveTo(4.5, 1.18, 3.7, 1.37)
  s.quadraticCurveTo(1.5, 1.17, -1.0, 0.97)
  s.quadraticCurveTo(-3.5, 0.77, -4.4, 0.45)
  s.lineTo(-4.4, 0.55)
  return s
}
