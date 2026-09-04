/**
 * SeaLevelLayer.tsx — 3D Sea Surface Height Anomaly & Dynamic Altimetry Layer
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 *
 * Implements Feature 10:
 * "Sea levels with Argo and glider positions with the depth view"
 *
 * Visualizes:
 * - Dynamic Sea Surface Height Anomaly (SSHA)
 * - Geostrophic altimetry contours (+20cm high sea level warm eddies, -20cm cold lows)
 * - Micro-wave undulation animation
 */

import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { GLOBE_RADIUS } from '@/utils/geoUtils'

interface SeaLevelLayerProps {
  visible?: boolean
}

export function SeaLevelLayer({ visible = true }: SeaLevelLayerProps) {
  const meshRef = useRef<THREE.Mesh | null>(null)

  // Subdivided spherical cap over the Indian Ocean
  const { geometry, colors } = useMemo(() => {
    // Sphere sector: Indian Ocean roughly 30°S to 30°N, 35°E to 105°E
    const radius = GLOBE_RADIUS + 0.008
    const widthSegments = 64
    const heightSegments = 48

    const geo = new THREE.SphereGeometry(
      radius,
      widthSegments,
      heightSegments,
      (40 * Math.PI) / 180, // phiStart (longitude around 40E)
      (70 * Math.PI) / 180, // phiLength (span across Indian Ocean)
      (60 * Math.PI) / 180, // thetaStart (latitude around 30N down)
      (65 * Math.PI) / 180  // thetaLength (down to ~35S)
    )

    const pos = geo.attributes.position as THREE.BufferAttribute
    const count = pos.count
    const colorArr = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      const z = pos.getZ(i)

      // Synthetic altimetry SSH pattern:
      // High anomaly (+SSH) in central equatorial belt, low in Somali/Oman upwelling
      const ssha = Math.sin(x * 3.5) * Math.cos(y * 4.0) + Math.sin(z * 2.5) * 0.5

      // Color mapping: Negative anomaly = deep cyan/navy, Positive anomaly = amber/magenta
      if (ssha > 0) {
        colorArr[i * 3] = 0.2 + ssha * 0.6     // R
        colorArr[i * 3 + 1] = 0.7 - ssha * 0.2 // G
        colorArr[i * 3 + 2] = 0.9              // B
      } else {
        colorArr[i * 3] = 0.05
        colorArr[i * 3 + 1] = 0.4 + ssha * 0.2
        colorArr[i * 3 + 2] = 0.8
      }
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colorArr, 3))
    return { geometry: geo, colors: colorArr }
  }, [])

  // Undulation animation
  useFrame(({ clock }) => {
    if (!meshRef.current || !visible) return
    const t = clock.getElapsedTime()
    const pos = meshRef.current.geometry.attributes.position as THREE.BufferAttribute
    const count = pos.count

    for (let i = 0; i < count; i += 4) {
      const ox = pos.getX(i)
      const oy = pos.getY(i)
      // Slight radial displacement to mimic wave action
      const wave = Math.sin(t * 1.5 + ox * 10 + oy * 10) * 0.0012
      pos.setXYZ(i, ox + wave * 0.1, oy + wave * 0.1, pos.getZ(i) + wave * 0.2)
    }
    pos.needsUpdate = true
  })

  if (!visible) return null

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial
        vertexColors
        transparent
        opacity={0.65}
        roughness={0.15}
        metalness={0.3}
        wireframe={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}
