/**
 * SelectionTarget.tsx — 3D Pulsing Crosshair / Target Marker
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 *
 * Renders a 3D target crosshair on the exact geographic location (Lat, Lon, Depth)
 * clicked on the ocean model / depth slice.
 */

import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { latLonToVec3, GLOBE_RADIUS } from '@/utils/geoUtils'
import type { ModelPointMeasurement } from '@/types/ocean'

interface SelectionTargetProps {
  measurement: ModelPointMeasurement | null
  onClose?: () => void
}

export function SelectionTarget({ measurement, onClose }: SelectionTargetProps) {
  const ringRef = useRef<THREE.Mesh | null>(null)

  useFrame(({ clock }) => {
    if (!ringRef.current) return
    const t = clock.getElapsedTime()
    const scale = 1 + Math.sin(t * 3) * 0.15
    ringRef.current.scale.set(scale, scale, scale)
  })

  if (!measurement) return null

  // Calculate 3D position slightly above globe
  const [x, y, z] = latLonToVec3(
    measurement.latitude,
    measurement.longitude,
    GLOBE_RADIUS + 0.04
  )

  const latStr = `${Math.abs(measurement.latitude).toFixed(2)}° ${measurement.latitude >= 0 ? 'N' : 'S'}`
  const lonStr = `${Math.abs(measurement.longitude).toFixed(2)}° ${measurement.longitude >= 0 ? 'E' : 'W'}`

  return (
    <group position={[x, y, z]}>
      {/* Center glowing dot */}
      <mesh>
        <sphereGeometry args={[0.02, 16, 16]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>

      {/* Pulsing selection ring */}
      <mesh ref={ringRef}>
        <ringGeometry args={[0.04, 0.048, 32]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.85} side={THREE.DoubleSide} />
      </mesh>

      {/* Outer crosshair tick marks */}
      <mesh rotation={[0, 0, Math.PI / 4]}>
        <ringGeometry args={[0.065, 0.07, 4]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.9} side={THREE.DoubleSide} />
      </mesh>

      {/* 3D Coordinate / Value Tag */}
      <Html
        position={[0.05, 0.08, 0]}
        center
        style={{ pointerEvents: 'auto', userSelect: 'none' }}
      >
        <div className="px-2 py-1 rounded bg-[#020b18]/95 border border-cyan-400/50 shadow-xl text-[10px] font-mono text-slate-100 whitespace-nowrap flex items-center gap-2">
          <div>
            <div className="flex items-center gap-1.5 font-bold text-cyan-300">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>{measurement.variable.toUpperCase()}: {measurement.value} {measurement.unit}</span>
            </div>
            <div className="text-[9px] text-slate-400">
              {latStr}, {lonStr} | {measurement.depth}m
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-red-400 p-0.5 hover:bg-white/10 rounded transition-colors"
              title="Deselect point"
            >
              ✕
            </button>
          )}
        </div>
      </Html>
    </group>
  )
}
