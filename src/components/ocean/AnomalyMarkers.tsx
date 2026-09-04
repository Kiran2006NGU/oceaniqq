/**
 * AnomalyMarkers.tsx — 3D Pulsating Aura Markers for AI Detected Threats
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 */

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import type { Mesh } from 'three'
import { MOCK_ANOMALIES, type OceanAnomaly } from '../ai/AnomalyDetectionPanel'
import { latLonToVec3, GLOBE_RADIUS } from '@/utils/geoUtils'

interface AnomalyMarkersProps {
  onSelectAnomaly: (anomaly: OceanAnomaly) => void
}

function SingleAnomalyRing({
  anomaly,
  onSelect,
}: {
  anomaly: OceanAnomaly
  onSelect: (anom: OceanAnomaly) => void
}) {
  const meshRef = useRef<Mesh>(null!)
  const [x, y, z] = latLonToVec3(anomaly.lat, anomaly.lon, GLOBE_RADIUS + 0.03)

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const s = 1 + 0.3 * Math.sin(clock.getElapsedTime() * 4)
      meshRef.current.scale.set(s, s, s)
    }
  })

  return (
    <group position={[x, y, z]}>
      {/* Outer Pulsing Mesh Ring */}
      <mesh ref={meshRef}>
        <ringGeometry args={[0.04, 0.07, 32]} />
        <meshBasicMaterial
          color={anomaly.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b'}
          transparent
          opacity={0.7}
          side={2} // DoubleSide
        />
      </mesh>

      {/* HTML Tag */}
      <Html center zIndexRange={[12, 0]} style={{ pointerEvents: 'auto', userSelect: 'none' }}>
        <button
          onClick={() => onSelect(anomaly)}
          className="group flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-950/80 hover:bg-red-900 border border-red-500/60 shadow-lg text-[9px] font-mono font-bold text-red-200 backdrop-blur-sm transition-all hover:scale-105"
        >
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          <span>⚠️ {anomaly.region} ({anomaly.anomalyValue})</span>
        </button>
      </Html>
    </group>
  )
}

export function AnomalyMarkers({ onSelectAnomaly }: AnomalyMarkersProps) {
  return (
    <group name="AnomalyMarkersGroup">
      {MOCK_ANOMALIES.map((anom) => (
        <SingleAnomalyRing key={anom.id} anomaly={anom} onSelect={onSelectAnomaly} />
      ))}
    </group>
  )
}
