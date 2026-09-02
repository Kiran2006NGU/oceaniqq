/**
 * GlobeTerrain.tsx — High-Fidelity 3D Geographic Earth Representation
 * Route / Component: src/components/maps/GlobeTerrain.tsx
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 *
 * Implements:
 * 1. Open, non-proprietary high-detail procedural Earth canvas texture focusing on the Indian Ocean basin.
 * 2. Recognizable Indian subcontinent, Arabian Sea, Bay of Bengal, Sri Lanka, Maldives, Andaman & Nicobar, Lakshadweep, Madagascar, Sumatra.
 * 3. Coastal bathymetric shelf glow and deep ocean abyssal gradient.
 * 4. Latitude / Longitude graticule grid lines for geographic context.
 * 5. Atmospheric scattering Fresnel rim glow mesh.
 */

import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { createSatelliteEarthTexture } from '@/utils/earthTextures'
import { GLOBE_RADIUS } from '@/utils/geoUtils'

interface GlobeTerrainProps {
  showGraticule?: boolean
  showAtmosphere?: boolean
  globeRadius?: number
  roughness?: number
  metalness?: number
}

export function GlobeTerrain({
  showGraticule = true,
  showAtmosphere = true,
  globeRadius = GLOBE_RADIUS,
  roughness = 0.55,
  metalness = 0.12,
}: GlobeTerrainProps) {
  const meshRef = useRef<THREE.Mesh | null>(null)

  // 1. High-resolution canvas texture for Indian Ocean & global landmasses
  const earthTexture = useMemo(() => {
    return createSatelliteEarthTexture(2048, 1024)
  }, [])

  // 2. High-segment sphere geometry
  const sphereGeometry = useMemo(() => {
    const geo = new THREE.SphereGeometry(globeRadius, 72, 48)
    geo.computeVertexNormals()
    return geo
  }, [globeRadius])

  // 3. Geographic Lat/Lon graticule lines (Equator, 10°N, 20°N, 30°N, 60°E, 80°E, 90°E)
  const graticuleLines = useMemo(() => {
    if (!showGraticule) return null

    const lines: THREE.Line[] = []
    const lineMaterial = new THREE.LineBasicMaterial({
      color: '#38bdf8',
      transparent: true,
      opacity: 0.16,
    })

    // Parallels (Latitudes: -20, -10, 0 (Equator), 10, 20, 30)
    const latitudes = [-20, -10, 0, 10, 20, 30]
    for (const lat of latitudes) {
      const phi = ((90 - lat) * Math.PI) / 180
      const r = (globeRadius + 0.003) * Math.sin(phi)
      const y = (globeRadius + 0.003) * Math.cos(phi)

      const points: THREE.Vector3[] = []
      const segments = 64
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2
        points.push(new THREE.Vector3(r * Math.cos(theta), y, r * Math.sin(theta)))
      }
      const geo = new THREE.BufferGeometry().setFromPoints(points)
      lines.push(new THREE.Line(geo, lineMaterial))
    }

    // Meridians (Longitudes: 40E, 60E, 80E, 90E, 100E)
    const longitudes = [40, 60, 80, 90, 100]
    for (const lon of longitudes) {
      const points: THREE.Vector3[] = []
      const segments = 48
      for (let i = 0; i <= segments; i++) {
        const lat = -60 + (i / segments) * 120 // from -60 to +60
        const phi = ((90 - lat) * Math.PI) / 180
        const theta = ((lon + 90) * Math.PI) / 180
        const r = globeRadius + 0.003
        points.push(
          new THREE.Vector3(
            -r * Math.sin(phi) * Math.cos(theta),
            r * Math.cos(phi),
            r * Math.sin(phi) * Math.sin(theta)
          )
        )
      }
      const geo = new THREE.BufferGeometry().setFromPoints(points)
      lines.push(new THREE.Line(geo, lineMaterial))
    }

    return lines
  }, [showGraticule, globeRadius])

  return (
    <group>
      {/* ── Main Terrain Sphere ────────────────────────────────────────────── */}
      <mesh
        ref={meshRef}
        geometry={sphereGeometry}
        receiveShadow
        castShadow
      >
        <meshStandardMaterial
          map={earthTexture}
          roughness={roughness}
          metalness={metalness}
        />
      </mesh>

      {/* ── Lat/Lon Graticule Lines ───────────────────────────────────────── */}
      {graticuleLines && (
        <group>
          {graticuleLines.map((line, idx) => (
            <primitive key={idx} object={line} />
          ))}
        </group>
      )}

      {/* ── Atmospheric Rim Glow Mesh ─────────────────────────────────────── */}
      {showAtmosphere && (
        <mesh scale={[1.016, 1.016, 1.016]}>
          <sphereGeometry args={[globeRadius, 48, 48]} />
          <meshBasicMaterial
            color="#38bdf8"
            transparent
            opacity={0.14}
            side={THREE.BackSide}
          />
        </mesh>
      )}
    </group>
  )
}
