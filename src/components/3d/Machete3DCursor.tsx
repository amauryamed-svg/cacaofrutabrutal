import { useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import {
  buildBladeShape, buildBladeEdgeShape, buildHandleShape,
  MACHETE_REST_ANGLE, MACHETE_SCALE,
  type CursorRef,
} from './Machete3DCursor.helpers'

/**
 * Machete3DCursor — shared 3D machete cursor for Fruit-Ninja-style arenas.
 *
 * Originally lived inline in `LabranzaMachete.tsx`. Extracted so the upcoming
 * harvest minigame (and others) can import the same model without code drift.
 *
 * Geometry + materials follow the user's "puffy emoji" spec:
 *   - blade: ExtrudeGeometry from a Bezier shape, blue-grey clearcoated PBR
 *   - blade edge highlight: lighter bevel band along the top profile
 *   - handle: capsule wood (warm brown, subtle clearcoat)
 *   - 2 metal rivets through the handle
 *
 * Position + rotation are driven by a `CursorRef` (a React ref) so the host
 * arena can update them on every pointer move without triggering React
 * re-renders — `useFrame` reads the ref directly.
 */

// ─── Inner machete model (consumed by overlay) ─────────────────────────────

interface Machete3DProps {
  cursorRef: React.RefObject<CursorRef>
  /** Current arena width in px (drives px↔world conversion) */
  arenaWidth: number
  /** Arena height in px */
  arenaHeight: number
}

function Machete3D({ cursorRef, arenaWidth, arenaHeight }: Machete3DProps) {
  const { camera, size } = useThree()
  const rootRef = useRef<THREE.Group>(null)
  const lerped = useRef({ x: 0, y: 0, angle: MACHETE_REST_ANGLE, alpha: 0 })

  const bladeGeom = useMemo(() => new THREE.ExtrudeGeometry(buildBladeShape(), {
    depth: 0.28, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.06,
    bevelSegments: 4, curveSegments: 48,
  }), [])
  const bladeEdgeGeom = useMemo(() => new THREE.ExtrudeGeometry(buildBladeEdgeShape(), {
    depth: 0.30, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.03,
    bevelSegments: 3, curveSegments: 32,
  }), [])
  const handleGeom = useMemo(() => new THREE.ExtrudeGeometry(buildHandleShape(), {
    depth: 0.55, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.10,
    bevelSegments: 6, curveSegments: 32,
  }), [])

  function pxToWorld(px: number, py: number) {
    const cam = camera as THREE.PerspectiveCamera
    const visibleHeight = 2 * Math.tan((cam.fov * Math.PI / 180) / 2) * cam.position.z
    const visibleWidth  = visibleHeight * (size.width / Math.max(1, size.height))
    const wx = (px / Math.max(1, arenaWidth) - 0.5) * visibleWidth
    const wy = (0.5 - py / Math.max(1, arenaHeight)) * visibleHeight
    return { wx, wy }
  }

  useFrame((_, dt) => {
    if (!rootRef.current) return
    const c = cursorRef.current
    const t = performance.now()
    const targetVisible = c.visible && t < c.visibleUntil

    const { wx, wy } = pxToWorld(c.x, c.y)
    const lerpRate = 1 - Math.pow(0.0001, dt)
    lerped.current.x = THREE.MathUtils.lerp(lerped.current.x, wx, lerpRate)
    lerped.current.y = THREE.MathUtils.lerp(lerped.current.y, wy, lerpRate)
    const targetAngle = c.swipeAngle - Math.PI / 4 + MACHETE_REST_ANGLE
    const da = ((targetAngle - lerped.current.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI
    lerped.current.angle += da * lerpRate
    const alphaTarget = targetVisible ? 1 : 0
    lerped.current.alpha = THREE.MathUtils.lerp(lerped.current.alpha, alphaTarget, 1 - Math.pow(0.001, dt))

    rootRef.current.position.set(lerped.current.x, lerped.current.y, 0)
    rootRef.current.rotation.set(0, 0, lerped.current.angle)
    rootRef.current.scale.setScalar(MACHETE_SCALE * 0.04 * (0.6 + 0.4 * lerped.current.alpha))
    rootRef.current.visible = lerped.current.alpha > 0.02
  })

  return (
    <group ref={rootRef}>
      <mesh geometry={bladeGeom} position={[1.5, 0, 0]} castShadow receiveShadow>
        <meshPhysicalMaterial
          color="#9da3c4"
          roughness={0.35}
          metalness={0.5}
          clearcoat={0.6}
          clearcoatRoughness={0.2}
          reflectivity={0.7}
        />
      </mesh>
      <mesh geometry={bladeEdgeGeom} position={[1.5, 0, 0.005]}>
        <meshPhysicalMaterial
          color="#b8bdd6"
          roughness={0.25}
          metalness={0.6}
          clearcoat={0.7}
          clearcoatRoughness={0.15}
        />
      </mesh>
      <mesh geometry={handleGeom} position={[-4.5, 0, -0.135]} castShadow receiveShadow>
        <meshPhysicalMaterial
          color="#8b5a3c"
          roughness={0.65}
          metalness={0}
          clearcoat={0.3}
          clearcoatRoughness={0.4}
          reflectivity={0.2}
        />
      </mesh>
      <mesh position={[-7.0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.18, 0.85, 24]} />
        <meshPhysicalMaterial color="#c4c8d4" roughness={0.3} metalness={0.85} clearcoat={0.4} clearcoatRoughness={0.2} />
      </mesh>
      <mesh position={[-4.7, 0, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.18, 0.85, 24]} />
        <meshPhysicalMaterial color="#c4c8d4" roughness={0.3} metalness={0.85} clearcoat={0.4} clearcoatRoughness={0.2} />
      </mesh>
    </group>
  )
}

// ─── Drop-in overlay (Canvas + lights + Machete3D) ──────────────────────────

interface OverlayProps {
  cursorRef: React.RefObject<CursorRef>
  arenaWidth: number
  arenaHeight: number
}

/**
 * Drop-in 3D overlay — absolutely positioned, no pointer events. Use over any
 * arena to add the floating machete cursor without re-implementing the Canvas
 * setup. The arena handles its own pointer events and writes to cursorRef.
 */
export default function Machete3DCursor({ cursorRef, arenaWidth, arenaHeight }: OverlayProps) {
  return (
    <Canvas
      shadows="percentage"
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      camera={{ position: [0, 0, 50], fov: 28, near: 0.1, far: 200 }}
    >
      <ambientLight intensity={0.55} />
      <directionalLight
        position={[4, 8, 6]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0008}
      />
      <directionalLight position={[-5, 3, 4]} intensity={0.5} color="#e8eef5" />
      <directionalLight position={[0, 4, -8]} intensity={0.45} />
      <Machete3D cursorRef={cursorRef} arenaWidth={arenaWidth} arenaHeight={arenaHeight} />
    </Canvas>
  )
}
