import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, RoundedBox } from '@react-three/drei'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

/**
 * ChocolateBar3D — photorealistic isometric chocolate bar (4×3 segments, pyramid valleys).
 *
 * Replaces the flat 🍫 emoji where it was carrying the most visual weight on the
 * post-login home (Dashboard "Redeem chocolate" CTA) and on the harvest/forge
 * celebration screens. Real PBR (clearcoat + sheen + ior), studio HDR
 * environment for proper specular reflections, ACES Filmic tonemap, soft
 * shadow on a hidden plane.
 *
 * Geometry per segment is a custom 13-vertex BufferGeometry — base + outer top
 * frame + inner top frame + valley center — so the depression is a real pyramid
 * carved into each pillow, not a normal-map fake.
 *
 * The Canvas is small (default 64–96 px) so the cost of all 12 segments + slab
 * + 4 lights + soft shadow is negligible on modern devices.
 */

const SEG_SIZE = 2.4
const SEG_HEIGHT = 1.2
const VALLEY_DEPTH = 0.5
const EDGE_INSET_RATIO = 0.15
const GAP = 0.25
const COLS = 4
const ROWS = 3

/**
 * 13-vertex pillow segment with a pyramid depression.
 * Vertex indices:
 *   0–3   base corners (y=0)
 *   4–7   top outer corners (y=height)
 *   8–11  top inner frame corners (y=height, inset)
 *   12    valley center (y=height − valleyDepth)
 *
 * Triangle windings are picked so all surface normals point outward:
 * bottom -Y, four side walls outward, top frame +Y, valley slopes face up
 * into the viewer's eye.
 */
function buildPillowGeometry(
  size: number,
  height: number,
  valleyDepth: number,
  edgeInsetRatio: number,
): THREE.BufferGeometry {
  const half = size / 2
  const inset = size * edgeInsetRatio
  const halfInset = half - inset
  const valleyY = height - valleyDepth

  const positions = new Float32Array([
    // 0–3: base corners
    -half, 0, -half,
     half, 0, -half,
     half, 0,  half,
    -half, 0,  half,
    // 4–7: top outer corners
    -half, height, -half,
     half, height, -half,
     half, height,  half,
    -half, height,  half,
    // 8–11: top inner frame corners
    -halfInset, height, -halfInset,
     halfInset, height, -halfInset,
     halfInset, height,  halfInset,
    -halfInset, height,  halfInset,
    // 12: valley center
    0, valleyY, 0,
  ])

  const indices = new Uint16Array([
    // bottom (-Y)
    0, 1, 2,  0, 2, 3,
    // -Z wall
    0, 4, 5,  0, 5, 1,
    // +X wall
    1, 5, 6,  1, 6, 2,
    // +Z wall
    2, 6, 7,  2, 7, 3,
    // -X wall
    3, 7, 4,  3, 4, 0,
    // top frame (+Y) — back / right / front / left strips
    4, 8, 9,   4, 9, 5,
    5, 9, 10,  5, 10, 6,
    6, 10, 11, 6, 11, 7,
    7, 11, 8,  7, 8, 4,
    // valley slopes — inner ring → center
    8, 11, 12,
    11, 10, 12,
    10, 9, 12,
    9, 8, 12,
  ])

  const geom = new THREE.BufferGeometry()
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geom.setIndex(new THREE.BufferAttribute(indices, 1))
  geom.computeVertexNormals()
  return geom
}

function ChocolateBarMesh({ autoRotate }: { autoRotate: boolean }) {
  const groupRef = useRef<THREE.Group>(null)

  // Single shared geometry instance for all 12 pillow segments — saves GPU
  // memory and lets the renderer batch where possible.
  const segmentGeom = useMemo(
    () => buildPillowGeometry(SEG_SIZE, SEG_HEIGHT, VALLEY_DEPTH, EDGE_INSET_RATIO),
    [],
  )

  const segmentPositions = useMemo<[number, number, number][]>(() => {
    const out: [number, number, number][] = []
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = (c - (COLS - 1) / 2) * (SEG_SIZE + GAP)
        const z = (r - (ROWS - 1) / 2) * (SEG_SIZE + GAP)
        out.push([x, 0, z])
      }
    }
    return out
  }, [])

  useFrame((_, dt) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += dt * 0.22
    }
  })

  return (
    <group ref={groupRef}>
      {/* Base slab — slightly darker, recessed under the pillows. */}
      <RoundedBox
        args={[11.5, 0.8, 8.5]}
        radius={0.2}
        smoothness={4}
        position={[0, -0.4, 0]}
        castShadow
        receiveShadow
      >
        <meshPhysicalMaterial
          color="#5e3520"
          roughness={0.62}
          metalness={0}
          clearcoat={0.35}
          clearcoatRoughness={0.4}
          ior={1.5}
          envMapIntensity={0.7}
        />
      </RoundedBox>

      {/* 4×3 grid of pillow segments. */}
      {segmentPositions.map((pos, i) => (
        <mesh
          key={i}
          geometry={segmentGeom}
          position={pos}
          castShadow
          receiveShadow
        >
          <meshPhysicalMaterial
            color="#8b5430"
            roughness={0.58}
            metalness={0}
            clearcoat={0.45}
            clearcoatRoughness={0.35}
            reflectivity={0.45}
            sheen={0.15}
            sheenColor="#3d2114"
            ior={1.5}
            envMapIntensity={0.7}
          />
        </mesh>
      ))}
    </group>
  )
}

interface ChocolateBar3DProps {
  /** Pixel size of the canvas (square). */
  size?: number
  /** Slow Y-axis spin so the bar feels alive. Disable on result screens that
   *  benefit from a static glamour shot. */
  autoRotate?: boolean
  className?: string
  style?: React.CSSProperties
}

export default function ChocolateBar3D({
  size = 80,
  autoRotate = true,
  className,
  style,
}: ChocolateBar3DProps) {
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        display: 'inline-block',
        lineHeight: 0,
        ...style,
      }}
      aria-hidden="true"
    >
      <Canvas
        shadows
        gl={{
          antialias: true,
          alpha: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          outputColorSpace: THREE.SRGBColorSpace,
          toneMappingExposure: 1.0,
        }}
        camera={{ position: [16, 13, 16], fov: 22, near: 0.1, far: 100 }}
        dpr={[1, 2]}
      >
        {/* Lights — key/fill/rim plus a small specular kicker for the top bevels. */}
        <ambientLight color="#fff5e8" intensity={0.25} />
        <directionalLight
          color="#fff8ee"
          intensity={1.6}
          position={[8, 12, 6]}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-bias={-0.0005}
          shadow-normalBias={0.02}
          shadow-camera-left={-15}
          shadow-camera-right={15}
          shadow-camera-top={15}
          shadow-camera-bottom={-15}
          shadow-camera-near={0.1}
          shadow-camera-far={50}
        />
        <directionalLight color="#dde6f0" intensity={0.5} position={[-6, 4, 8]} />
        <directionalLight color="#fff0d8" intensity={0.7} position={[-3, 5, -8]} />
        <pointLight color="#fff5e0" intensity={0.4} position={[4, 6, 5]} distance={20} decay={1.5} />

        {/* HDR studio environment — drives the clearcoat highlights and bevel
            reflections that make the chocolate look tempered. */}
        <Environment preset="studio" environmentIntensity={0.8} />

        <ChocolateBarMesh autoRotate={autoRotate} />

        {/* Hidden floor that only catches the soft drop-shadow. */}
        <mesh position={[0, -0.81, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[60, 60]} />
          <shadowMaterial opacity={0.28} />
        </mesh>
      </Canvas>
    </div>
  )
}
