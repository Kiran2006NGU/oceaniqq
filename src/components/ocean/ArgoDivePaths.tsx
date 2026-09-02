/**
 * ArgoDivePaths.tsx — 3D In-Situ Argo Floats with TubeGeometry Dive Paths
 * SIH 26067 | AQUA-VIS 3D Ocean Intelligence Platform
 *
 * Architectural Blueprint Implementation:
 * 1. Plots 50 Argo floats using spherical coordinates: THREE.Vector3().setFromSphericalCoords(R, phi, theta).
 * 2. Dive Paths: Rendered as THREE.TubeGeometry plunging downward into the ocean column.
 * 3. Orientation (Critical): Positions float mesh, calls mesh.lookAt(0, 0, 0) so local -Z axis points
 *    at Earth's core, and maps dive path depths inward along that local -Z axis.
 */

import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import { useFrame } from '@react-three/fiber'
import { GLOBE_RADIUS } from '@/utils/geoUtils'
import type { MockObservation, ModelTime } from '@/services/data/mockOceanData'

interface ArgoDivePathsProps {
  observations: MockObservation[]
  selectedId: string | null
  selectedTime?: ModelTime
  onSelect: (id: string) => void
  onHover?: (obs: MockObservation, e: ThreeEvent<PointerEvent>) => void
  onUnhover?: () => void
  visibleDiveTubes?: boolean
}

interface SingleFloatTubeProps {
  obs: MockObservation
  isSelected: boolean
  onSelect: (id: string) => void
  onHover?: (obs: MockObservation, e: ThreeEvent<PointerEvent>) => void
  onUnhover?: () => void
  visibleTube?: boolean
}

function SingleFloatTube({
  obs,
  isSelected,
  onSelect,
  onHover,
  onUnhover,
  visibleTube = true,
}: SingleFloatTubeProps) {
  const groupRef = useRef<THREE.Group | null>(null)
  const beaconRef = useRef<THREE.Mesh | null>(null)

  // 1. Calculate surface position in spherical coordinates
  const { position, tubeGeometry } = useMemo(() => {
    const latRad = (obs.latitude * Math.PI) / 180
    const lonRad = ((obs.longitude + 90) * Math.PI) / 180
    const phi = Math.PI / 2 - latRad
    const theta = lonRad

    // Surface position (R = GLOBE_RADIUS)
    const pos = new THREE.Vector3().setFromSphericalCoords(GLOBE_RADIUS + 0.015, phi, theta)

    // 2. Inward Dive Path: Plunges along local -Z axis toward Earth core
    // In local space after lookAt(0,0,0), -Z is pointing straight towards core!
    const maxDepthMeters = 2000.0
    // Scale 2000m to 3D units (e.g. 0.28 units max dive depth)
    const maxDiveLength = (maxDepthMeters / 2000.0) * 0.28

    // CatmullRomCurve plunging downward into the ocean toward Earth center (+Z in lookAt frame)
    const points: THREE.Vector3[] = [
      new THREE.Vector3(0, 0, 0), // Surface buoy
      new THREE.Vector3(0.006, 0.003, maxDiveLength * 0.25), // 500m
      new THREE.Vector3(-0.008, 0.006, maxDiveLength * 0.5), // 1000m drift
      new THREE.Vector3(0.004, -0.006, maxDiveLength * 0.75), // 1500m
      new THREE.Vector3(0, 0, maxDiveLength), // 2000m park depth
    ]

    const pathCurve = new THREE.CatmullRomCurve3(points)
    const geo = new THREE.TubeGeometry(pathCurve, 24, 0.0035, 8, false)

    return { position: pos, tubeGeometry: geo }
  }, [obs.latitude, obs.longitude])

  // Orient group toward Earth's core on mount/update
  useMemo(() => {
    // We create a temp group orientation helper
  }, [])

  // Beacon pulse animation
  useFrame(({ clock }) => {
    if (beaconRef.current) {
      const t = clock.getElapsedTime() + obs.latitude
      const scale = isSelected ? 1.0 + Math.sin(t * 5) * 0.35 : 1.0 + Math.sin(t * 2) * 0.15
      beaconRef.current.scale.set(scale, scale, scale)
    }
  })

  // Group positioning and core orientation
  const handleGroupRef = (el: THREE.Group | null) => {
    groupRef.current = el
    if (el) {
      el.position.copy(position)
      // CRITICAL: lookAt(0,0,0) aligns local -Z towards Earth center!
      el.lookAt(0, 0, 0)
    }
  }

  return (
    <group ref={handleGroupRef}>
      {/* ── Surface Buoy & Beacon ── */}
      <mesh
        onClick={(e) => {
          e.stopPropagation()
          onSelect(obs.id)
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          document.body.style.cursor = 'pointer'
          onHover?.(obs, e)
        }}
        onPointerOut={(e) => {
          e.stopPropagation()
          document.body.style.cursor = 'auto'
          onUnhover?.()
        }}
      >
        <sphereGeometry args={[0.016, 16, 16]} />
        <meshStandardMaterial
          color={isSelected ? '#38bdf8' : '#f59e0b'}
          emissive={isSelected ? '#0284c7' : '#d97706'}
          emissiveIntensity={0.6}
          roughness={0.2}
        />
      </mesh>

      {/* Pulsing Selection Beacon Ring */}
      {isSelected && (
        <mesh ref={beaconRef}>
          <ringGeometry args={[0.024, 0.032, 24]} />
          <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} transparent opacity={0.8} />
        </mesh>
      )}

      {/* Antenna Mast pointing upward (away from Earth core) */}
      <mesh position={[0, 0, -0.016]}>
        <cylinderGeometry args={[0.0015, 0.0015, 0.024, 6]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.8} />
      </mesh>

      {/* ── 3D TubeGeometry Dive Path Plunging Inward (+Z toward Earth core) ── */}
      {visibleTube && (
        <mesh geometry={tubeGeometry}>
          <meshStandardMaterial
            color={isSelected ? '#00f5d4' : '#06b6d4'}
            emissive={isSelected ? '#0891b2' : '#0284c7'}
            emissiveIntensity={0.5}
            transparent={true}
            opacity={isSelected ? 0.95 : 0.75}
            roughness={0.2}
          />
        </mesh>
      )}

      {/* Deep Sensor Pod at 2000m Park Depth */}
      {visibleTube && (
        <mesh position={[0, 0, 0.28]}>
          <sphereGeometry args={[0.007, 12, 12]} />
          <meshStandardMaterial color="#0284c7" emissive="#0369a1" emissiveIntensity={0.8} />
        </mesh>
      )}
    </group>
  )
}

export function ArgoDivePaths({
  observations,
  selectedId,
  onSelect,
  onHover,
  onUnhover,
  visibleDiveTubes = true,
}: ArgoDivePathsProps) {
  return (
    <group name="ArgoDivePathsRoot">
      {observations.map((obs) => (
        <SingleFloatTube
          key={obs.id}
          obs={obs}
          isSelected={obs.id === selectedId}
          onSelect={onSelect}
          onHover={onHover}
          onUnhover={onUnhover}
          visibleTube={visibleDiveTubes}
        />
      ))}
    </group>
  )
}
