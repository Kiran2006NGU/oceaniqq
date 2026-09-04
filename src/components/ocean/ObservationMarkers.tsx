/**
 * ObservationMarkers.tsx — Distinct 3D Symbols for In-Situ Platforms
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 *
 * Implements:
 * 1. Visually distinct 3D geometries for each platform:
 *    - ARGO: Spherical buoy with communication antenna.
 *    - GLIDER: AUV vehicle with swept wings and vertical tail.
 *    - CTD: Vertical mooring station / rosette sensor cage.
 * 2. Hover event handlers for scientific tooltips.
 * 3. Selection ring feedback and time-synchronization status (Active / Near Time / Historical).
 */

import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import { useFrame } from '@react-three/fiber'
import type { MockObservation, ModelTime } from '@/services/data/mockOceanData'
import { latLonToVec3, GLOBE_RADIUS } from '@/utils/geoUtils'

const MARKER_ALTITUDE = 0.035

interface ObservationMarkersProps {
  observations: MockObservation[]
  visibleArgo: boolean
  visibleGlider: boolean
  visibleCtd: boolean
  selectedId: string | null
  selectedTime?: ModelTime
  onSelect: (id: string | null) => void
  onHover?: (obs: MockObservation, e: ThreeEvent<PointerEvent>) => void
  onUnhover?: () => void
}

/** Determines observation time status relative to selected timeline timestamp */
function getObservationTimeStatus(obsTime: string, selectedIso?: string): 'active' | 'near' | 'historical' {
  if (!selectedIso) return 'active'
  try {
    const tObs = new Date(obsTime).getTime()
    const tSel = new Date(selectedIso).getTime()
    const diffHours = Math.abs(tObs - tSel) / (1000 * 60 * 60)
    if (diffHours <= 6) return 'active'
    if (diffHours <= 24) return 'near'
    return 'historical'
  } catch {
    return 'active'
  }
}

interface SingleMarkerProps {
  obs: MockObservation
  isSelected: boolean
  timeStatus: 'active' | 'near' | 'historical'
  onSelect: (id: string) => void
  onHover?: (obs: MockObservation, e: ThreeEvent<PointerEvent>) => void
  onUnhover?: () => void
}

function SingleMarker({
  obs,
  isSelected,
  timeStatus,
  onSelect,
  onHover,
  onUnhover,
}: SingleMarkerProps) {
  const groupRef = useRef<THREE.Group | null>(null)
  const ringRef = useRef<THREE.Mesh | null>(null)

  const [x, y, z] = useMemo(() => {
    return latLonToVec3(obs.latitude, obs.longitude, GLOBE_RADIUS + MARKER_ALTITUDE)
  }, [obs.latitude, obs.longitude])

  // Subtle pulsing animation for selected marker
  useFrame(({ clock }) => {
    if (isSelected && ringRef.current) {
      const t = clock.getElapsedTime()
      const s = 1 + Math.sin(t * 4) * 0.2
      ringRef.current.scale.set(s, s, s)
    }
  })

  const opacity = timeStatus === 'active' ? 1.0 : timeStatus === 'near' ? 0.75 : 0.45
  const scaleMultiplier = isSelected ? 1.4 : 1.0

  function handleClick(e: ThreeEvent<MouseEvent>) {
    e.stopPropagation()
    onSelect(obs.id)
  }

  function handlePointerOver(e: ThreeEvent<PointerEvent>) {
    e.stopPropagation()
    document.body.style.cursor = 'pointer'
    onHover?.(obs, e)
  }

  function handlePointerOut(e: ThreeEvent<PointerEvent>) {
    e.stopPropagation()
    document.body.style.cursor = 'auto'
    onUnhover?.()
  }

  return (
    <group
      ref={groupRef}
      position={[x, y, z]}
      scale={[scaleMultiplier, scaleMultiplier, scaleMultiplier]}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* ── 1. ARGO FLOAT: Spherical buoy body with top antenna ─────────── */}
      {obs.type === 'argo' && (
        <group>
          {/* Buoy sphere */}
          <mesh>
            <sphereGeometry args={[0.045, 16, 16]} />
            <meshStandardMaterial
              color="#00b4d8"
              emissive="#0077b6"
              emissiveIntensity={isSelected ? 0.9 : 0.4}
              transparent
              opacity={opacity}
              roughness={0.2}
            />
          </mesh>
          {/* Top communication antenna stalk */}
          <mesh position={[0, 0.04, 0]}>
            <cylinderGeometry args={[0.003, 0.003, 0.05, 8]} />
            <meshStandardMaterial color="#38bdf8" />
          </mesh>
          {/* Antenna beacon tip */}
          <mesh position={[0, 0.065, 0]}>
            <sphereGeometry args={[0.008, 8, 8]} />
            <meshBasicMaterial color="#67e8f9" />
          </mesh>
        </group>
      )}

      {/* ── 2. GLIDER: AUV vehicle with swept wings & tail ──────────────── */}
      {obs.type === 'glider' && (
        <group rotation={[0.2, 0.4, 0]}>
          {/* Fuselage cylinder */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.02, 0.02, 0.09, 12]} />
            <meshStandardMaterial
              color="#22d3a0"
              emissive="#059669"
              emissiveIntensity={isSelected ? 0.9 : 0.4}
              transparent
              opacity={opacity}
              roughness={0.3}
            />
          </mesh>
          {/* Nose cone */}
          <mesh position={[0.05, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <coneGeometry args={[0.02, 0.025, 12]} />
            <meshStandardMaterial color="#f59e0b" />
          </mesh>
          {/* Swept wings */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.025, 0.004, 0.11]} />
            <meshStandardMaterial color="#d97706" />
          </mesh>
          {/* Vertical stabilizer */}
          <mesh position={[-0.04, 0.02, 0]}>
            <boxGeometry args={[0.02, 0.025, 0.003]} />
            <meshStandardMaterial color="#d97706" />
          </mesh>
        </group>
      )}

      {/* ── 3. CTD / MOORING STATION: Rosette sensor cage & station pin ─── */}
      {obs.type === 'ctd' && (
        <group>
          {/* Base mooring anchor disc */}
          <mesh position={[0, -0.015, 0]}>
            <cylinderGeometry args={[0.035, 0.04, 0.015, 12]} />
            <meshStandardMaterial color="#b45309" roughness={0.4} />
          </mesh>
          {/* Vertical sensor cage frame */}
          <mesh position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 0.055, 8]} />
            <meshStandardMaterial
              color="#f59e0b"
              emissive="#d97706"
              emissiveIntensity={isSelected ? 0.9 : 0.4}
              transparent
              opacity={opacity}
              wireframe={false}
            />
          </mesh>
          {/* Top station beacon */}
          <mesh position={[0, 0.055, 0]}>
            <octahedronGeometry args={[0.016]} />
            <meshBasicMaterial color="#fbbf24" />
          </mesh>
        </group>
      )}

      {/* ── 4. MOORED OMNI BUOY: Large conical hull, met tower & radar ── */}
      {obs.type === 'omni_buoy' && (
        <group>
          {/* Conical yellow floating hull */}
          <mesh position={[0, -0.01, 0]}>
            <cylinderGeometry args={[0.045, 0.025, 0.035, 16]} />
            <meshStandardMaterial color="#eab308" emissive="#ca8a04" emissiveIntensity={0.5} roughness={0.3} />
          </mesh>
          {/* Meteorological lattice tower */}
          <mesh position={[0, 0.035, 0]}>
            <cylinderGeometry args={[0.015, 0.025, 0.06, 4]} />
            <meshStandardMaterial color="#f8fafc" wireframe={false} metalness={0.7} />
          </mesh>
          {/* Top weather sensor / anemometer */}
          <mesh position={[0, 0.075, 0]}>
            <sphereGeometry args={[0.012, 8, 8]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
        </group>
      )}

      {/* ── 5. COASTAL WAVE RIDER BUOY: Spherical high-vis buoy & whip antenna ── */}
      {obs.type === 'wave_rider' && (
        <group>
          {/* Sphere body */}
          <mesh>
            <sphereGeometry args={[0.038, 16, 16]} />
            <meshStandardMaterial color="#ef4444" emissive="#b91c1c" emissiveIntensity={0.6} roughness={0.2} />
          </mesh>
          {/* Equatorial bumper ring */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.038, 0.006, 8, 24]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          {/* Top antenna */}
          <mesh position={[0, 0.04, 0]}>
            <cylinderGeometry args={[0.002, 0.002, 0.045, 6]} />
            <meshStandardMaterial color="#f8fafc" />
          </mesh>
        </group>
      )}

      {/* ── 6. TSUNAMI WARNING BUOY: Deep ocean BPR buoy with satcom dome ── */}
      {obs.type === 'tsunami_buoy' && (
        <group>
          {/* Hexagonal reinforced hull */}
          <mesh position={[0, -0.012, 0]}>
            <cylinderGeometry args={[0.05, 0.04, 0.04, 6]} />
            <meshStandardMaterial color="#f97316" emissive="#c2410c" emissiveIntensity={0.6} roughness={0.2} />
          </mesh>
          {/* Satcom dome */}
          <mesh position={[0, 0.025, 0]}>
            <sphereGeometry args={[0.025, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#ffffff" roughness={0.1} />
          </mesh>
          {/* Flashing alert beacon */}
          <mesh position={[0, 0.055, 0]}>
            <sphereGeometry args={[0.009, 8, 8]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
        </group>
      )}

      {/* ── Selection Ring & Target Indicator ───────────────────────────── */}
      {isSelected && (
        <group>
          <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.08, 0.095, 32]} />
            <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.11, 0.115, 32]} />
            <meshBasicMaterial color="#f59e0b" transparent opacity={0.6} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}
    </group>
  )
}

export function ObservationMarkers({
  observations,
  visibleArgo,
  visibleGlider,
  visibleCtd,
  selectedId,
  selectedTime,
  onSelect,
  onHover,
  onUnhover,
}: ObservationMarkersProps) {
  const filtered = useMemo(() => {
    return observations.filter((obs) => {
      if (obs.type === 'argo' && !visibleArgo) return false
      if (obs.type === 'glider' && !visibleGlider) return false
      if (obs.type === 'ctd' && !visibleCtd) return false
      return true
    })
  }, [observations, visibleArgo, visibleGlider, visibleCtd])

  return (
    <group>
      {filtered.map((obs) => {
        const timeStatus = getObservationTimeStatus(obs.timestamp, selectedTime?.isoString)
        return (
          <SingleMarker
            key={obs.id}
            obs={obs}
            isSelected={selectedId === obs.id}
            timeStatus={timeStatus}
            onSelect={onSelect}
            onHover={onHover}
            onUnhover={onUnhover}
          />
        )
      })}
    </group>
  )
}
