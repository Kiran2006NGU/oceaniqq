/**
 * CalmWaterVolumetricBlock.tsx — 3D Volumetric Water Column Box
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 *
 * Implements the 3D Volumetric Water Column as depicted in the reference design:
 * - Top Face: Calm water level surface data heatmap (red/orange/yellow/cyan).
 * - Vertical Cross-Sections: Stratified thermocline gradient (mixed layer -> thermocline -> abyssal).
 * - Depth Slicing / Clipping Plane: Horizontal plane positioned inside the cuboid.
 * - Bounding Wireframe Box with customizable visibility.
 * - Dynamic Transparency, Z-axis Rotation, and Animation support.
 */

import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import type { OceanVariable } from '@/types/ocean'

interface CalmWaterVolumetricBlockProps {
  variable: OceanVariable
  transparency: number
  zRotation: number
  isAnimating: boolean
  showBoundingBox: boolean
  yClippingFraction: number // 0 (surface) to 1 (full depth)
  portionName: string
  lat: number
  lon: number
}

// Generates the vibrant top surface calm water heatmap texture
function generateCalmSurfaceTexture(variable: OceanVariable, lat: number, lon: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')!

  // Base background
  ctx.fillStyle = '#0a1931'
  ctx.fillRect(0, 0, 512, 512)

  // Multi-stop radial/linear water surface pattern
  const grad = ctx.createLinearGradient(0, 0, 512, 512)
  if (variable === 'temperature') {
    grad.addColorStop(0.0, '#e63946') // Warm 30°C
    grad.addColorStop(0.25, '#f4a261') // 28°C
    grad.addColorStop(0.55, '#e9c46a') // 26°C
    grad.addColorStop(0.8, '#2a9d8f')  // 24°C
    grad.addColorStop(1.0, '#264653')  // 22°C
  } else if (variable === 'salinity') {
    grad.addColorStop(0.0, '#d946ef')
    grad.addColorStop(0.3, '#8b5cf6')
    grad.addColorStop(0.7, '#3b82f6')
    grad.addColorStop(1.0, '#1e3a8a')
  } else if (variable === 'current_velocity') {
    grad.addColorStop(0.0, '#ef4444')
    grad.addColorStop(0.3, '#f59e0b')
    grad.addColorStop(0.6, '#10b981')
    grad.addColorStop(1.0, '#0284c7')
  } else {
    grad.addColorStop(0.0, '#22c55e')
    grad.addColorStop(0.4, '#06b6d4')
    grad.addColorStop(1.0, '#0f172a')
  }
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 512, 512)

  // Add subtle calm water wave ripples & eddy contours
  ctx.lineWidth = 1.5
  for (let i = 0; i < 16; i++) {
    const cx = 150 + Math.sin(lat + i * 0.4) * 120
    const cy = 200 + Math.cos(lon + i * 0.5) * 120
    const r = 40 + i * 20
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.08 - i * 0.003})`
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.stroke()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.generateMipmaps = true
  return texture
}

// Generates the stratified thermocline wall texture matching the reference image
function generateStratifiedWallTexture(variable: OceanVariable): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 512
  const ctx = canvas.getContext('2d')!

  const grad = ctx.createLinearGradient(0, 0, 0, 512)
  if (variable === 'temperature') {
    // Exact colors from user picture: warm red/orange at top, lime green thermocline, cerulean blue, deep indigo at base
    grad.addColorStop(0.0, '#e63946')   // Surface Mixed Layer (30°C)
    grad.addColorStop(0.08, '#f77f00')  // 28°C
    grad.addColorStop(0.18, '#fcbf49')  // 25°C
    grad.addColorStop(0.28, '#80ed99')  // Thermocline transition (Green/Lime)
    grad.addColorStop(0.42, '#38bdf8')  // Upper Thermocline (Cerulean)
    grad.addColorStop(0.65, '#0284c7')  // Subsurface Water
    grad.addColorStop(0.85, '#1e3a8a')  // Deep Oceanic Layer
    grad.addColorStop(1.0, '#172554')   // Abyssal Floor (4°C)
  } else if (variable === 'salinity') {
    grad.addColorStop(0.0, '#f472b6')
    grad.addColorStop(0.2, '#c084fc')
    grad.addColorStop(0.5, '#60a5fa')
    grad.addColorStop(0.8, '#1e40af')
    grad.addColorStop(1.0, '#0f172a')
  } else {
    grad.addColorStop(0.0, '#ef4444')
    grad.addColorStop(0.2, '#f59e0b')
    grad.addColorStop(0.45, '#10b981')
    grad.addColorStop(0.75, '#0284c7')
    grad.addColorStop(1.0, '#020617')
  }

  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 256, 512)

  // Add subtle horizontal isopycnal depth lines
  for (let y = 32; y < 512; y += 48) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(256, y)
    ctx.stroke()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.generateMipmaps = true
  return texture
}

export function CalmWaterVolumetricBlock({
  variable,
  transparency,
  zRotation,
  isAnimating,
  showBoundingBox,
  yClippingFraction,
  lat,
  lon,
}: CalmWaterVolumetricBlockProps) {
  const groupRef = useRef<THREE.Group>(null)

  // Block dimensions
  const width = 3.6
  const length = 3.6
  const height = 2.4

  const topTexture = useMemo(() => generateCalmSurfaceTexture(variable, lat, lon), [variable, lat, lon])
  const wallTexture = useMemo(() => generateStratifiedWallTexture(variable), [variable])

  // Continuous animation frame hook
  useFrame((_, delta) => {
    if (groupRef.current) {
      if (isAnimating) {
        groupRef.current.rotation.y += delta * 0.4
      } else {
        groupRef.current.rotation.y = (zRotation * Math.PI) / 180
      }
    }
  })

  // Materials
  const topMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: topTexture,
        roughness: 0.25,
        metalness: 0.1,
        transparent: true,
        opacity: Math.max(0.2, transparency),
        side: THREE.DoubleSide,
      }),
    [topTexture, transparency]
  )

  const wallMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: wallTexture,
        roughness: 0.35,
        metalness: 0.1,
        transparent: true,
        opacity: Math.max(0.2, transparency),
        side: THREE.DoubleSide,
      }),
    [wallTexture, transparency]
  )

  const bottomMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#172554',
        roughness: 0.8,
        transparent: true,
        opacity: Math.max(0.3, transparency),
        side: THREE.DoubleSide,
      }),
    [transparency]
  )

  // Internal horizontal slice position (moves from top y=height/2 to bottom y=-height/2)
  const sliceY = height / 2 - yClippingFraction * height

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* ── Volumetric Cuboid ────────────────────────────────────────────── */}
      {/* Top surface face */}
      <mesh position={[0, height / 2, 0]} rotation={[-Math.PI / 2, 0, 0]} material={topMaterial}>
        <planeGeometry args={[width, length]} />
      </mesh>

      {/* 4 Vertical Stratification Wall Faces */}
      {/* North Wall */}
      <mesh position={[0, 0, length / 2]} material={wallMaterial}>
        <planeGeometry args={[width, height]} />
      </mesh>
      {/* South Wall */}
      <mesh position={[0, 0, -length / 2]} rotation={[0, Math.PI, 0]} material={wallMaterial}>
        <planeGeometry args={[width, height]} />
      </mesh>
      {/* East Wall */}
      <mesh position={[width / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]} material={wallMaterial}>
        <planeGeometry args={[length, height]} />
      </mesh>
      {/* West Wall */}
      <mesh position={[-width / 2, 0, 0]} rotation={[0, -Math.PI / 2, 0]} material={wallMaterial}>
        <planeGeometry args={[length, height]} />
      </mesh>

      {/* Bottom Abyssal Face */}
      <mesh position={[0, -height / 2, 0]} rotation={[Math.PI / 2, 0, 0]} material={bottomMaterial}>
        <planeGeometry args={[width, length]} />
      </mesh>

      {/* ── Active Horizontal Depth Slice Plane ──────────────────────────── */}
      {yClippingFraction > 0.05 && yClippingFraction < 0.95 && (
        <mesh position={[0, sliceY, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[width * 0.98, length * 0.98]} />
          <meshStandardMaterial
            color="#38bdf8"
            transparent
            opacity={0.65}
            side={THREE.DoubleSide}
            roughness={0.2}
          />
        </mesh>
      )}

      {/* ── Wireframe Bounding Box ────────────────────────────────────────── */}
      {showBoundingBox && (
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(width, height, length)]} />
          <lineBasicMaterial color="#38bdf8" linewidth={1.5} transparent opacity={0.7} />
        </lineSegments>
      )}

      {/* ── Subtle Studio Floor Shadow / Ambient Plane ────────────────────── */}
      <mesh position={[0, -height / 2 - 0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width * 2.2, length * 2.2]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.4} />
      </mesh>
    </group>
  )
}
