/**
 * CelestialStarField.tsx — Refined Clustered Celestial Starfield
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 *
 * Renders a natural, realistic celestial starfield:
 * - Concentrated along a diagonal galactic band (Milky Way arc) rather than everywhere uniformly
 * - Clean cosmic voids leaving empty space for visual clarity
 * - Soft, anti-aliased circular point texture (no square artifacts)
 * - Automatically hidden in 'light' (Maritime Light) theme for clean daylight presentation
 */

import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useTheme } from '@/context/ThemeContext'

interface CelestialStarFieldProps {
  visible?: boolean
}

export function CelestialStarField({ visible = true }: CelestialStarFieldProps) {
  const { theme } = useTheme()
  const pointsRef = useRef<THREE.Points>(null)

  // In light/daylight mode, do not render stars
  const isEnabled = visible && theme !== 'light'

  // Soft circular star texture
  const starTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 32
    canvas.height = 32
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16)
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)')
    grad.addColorStop(0.2, 'rgba(210, 235, 255, 0.85)')
    grad.addColorStop(0.6, 'rgba(125, 185, 255, 0.25)')
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)')

    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 32, 32)
    const texture = new THREE.CanvasTexture(canvas)
    return texture
  }, [])

  // Generate clustered galactic band stars (concentrated in a scenic arc, not everywhere)
  const { positions, colors, sizes } = useMemo(() => {
    const count = 900 // Tasteful, balanced density
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const sizes = new Float32Array(count)

    // Galactic plane rotation matrix (tilted 35° diagonally across background)
    const tilt = THREE.MathUtils.degToRad(35)
    const cosT = Math.cos(tilt)
    const sinT = Math.sin(tilt)

    for (let i = 0; i < count; i++) {
      // 80% concentrated along a diagonal galactic band, 20% gentle ambient scatter
      const isBand = i < count * 0.8

      let theta: number
      let phi: number
      let radius: number

      if (isBand) {
        // Longitude along the celestial arc (clustered Milky Way band)
        theta = (Math.random() - 0.5) * Math.PI * 1.6
        // Latitude concentrated near band with Gaussian spread
        const u1 = Math.random()
        const u2 = Math.random()
        const gaussian = Math.sqrt(-2.0 * Math.log(u1 + 0.0001)) * Math.cos(2.0 * Math.PI * u2)
        phi = gaussian * 0.22 // Scenic band (~12-18 degrees)
        radius = 36 + Math.random() * 26 // Well within camera far plane (100) and outside Earth (2)
      } else {
        // Faint occasional background anchors (sparse, not everywhere)
        theta = Math.random() * Math.PI * 2
        phi = (Math.random() - 0.5) * Math.PI * 0.85
        radius = 42 + Math.random() * 22
      }

      // Convert spherical to Cartesian
      const x = radius * Math.cos(phi) * Math.cos(theta)
      const y = radius * Math.sin(phi)
      const z = radius * Math.cos(phi) * Math.sin(theta)

      // Apply tilt to align diagonally
      const yTilted = y * cosT - z * sinT
      const zTilted = y * sinT + z * cosT

      positions[i * 3] = x
      positions[i * 3 + 1] = yTilted
      positions[i * 3 + 2] = zTilted

      // Subtle varied natural star hues (white, pale blue, soft gold)
      const colorType = Math.random()
      if (colorType > 0.8) {
        // Soft golden/warm star
        colors[i * 3] = 1.0
        colors[i * 3 + 1] = 0.92
        colors[i * 3 + 2] = 0.78
      } else if (colorType > 0.35) {
        // Ice blue/cyan star
        colors[i * 3] = 0.75
        colors[i * 3 + 1] = 0.92
        colors[i * 3 + 2] = 1.0
      } else {
        // Crisp pure white
        colors[i * 3] = 0.96
        colors[i * 3 + 1] = 0.98
        colors[i * 3 + 2] = 1.0
      }

      // Varied size for celestial depth
      sizes[i] = isBand ? 1.4 + Math.random() * 1.8 : 0.8 + Math.random() * 1.0
    }

    return { positions, colors, sizes }
  }, [])

  // Slow, serene cosmic drift
  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.003
    }
  })

  if (!isEnabled) return null

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={1.6}
        sizeAttenuation={true}
        vertexColors={true}
        map={starTexture ?? undefined}
        transparent={true}
        opacity={0.82}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
