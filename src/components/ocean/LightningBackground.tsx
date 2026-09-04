/**
 * LightningBackground.tsx — Atmospheric & Space Electric Lightning Storm Behind Globe
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 *
 * Implements:
 * - Dynamic electric discharge arcs and branching lightning bolts behind Earth
 * - Ionized plasma nebula glow with animated cyan/violet flashes
 * - High-speed electric spark particle field simulating atmospheric ionization
 */

import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

interface LightningBackgroundProps {
  visible?: boolean
}

// Generates a jagged lightning bolt from start to end with randomized branch offsets
function createLightningBranch(
  start: THREE.Vector3,
  end: THREE.Vector3,
  segments = 14,
  jaggedness = 0.25
): THREE.Vector3[] {
  const points: THREE.Vector3[] = [start.clone()]
  const dir = new THREE.Vector3().subVectors(end, start)
  const len = dir.length()
  dir.normalize()

  for (let i = 1; i < segments; i++) {
    const fraction = i / segments
    const current = new THREE.Vector3().addVectors(
      start,
      dir.clone().multiplyScalar(len * fraction)
    )

    // Random perpendicular displacement
    const perp = new THREE.Vector3(
      (Math.random() - 0.5) * jaggedness,
      (Math.random() - 0.5) * jaggedness,
      (Math.random() - 0.5) * (jaggedness * 0.5)
    )
    current.add(perp)
    points.push(current)
  }

  points.push(end.clone())
  return points
}

export function LightningBackground({ visible = true }: LightningBackgroundProps) {
  const linesRef = useRef<THREE.LineSegments | null>(null)
  const flashGlowRef = useRef<THREE.Mesh | null>(null)
  const sparksRef = useRef<THREE.Points | null>(null)

  // ── 1. Lightning Discharge Bolts ──────────────────────────────────────────
  const { linePositions, lineColors } = useMemo(() => {
    const totalBolts = 8
    const totalSegmentsPerBolt = 16
    const lineCoords: number[] = []
    const lineCol: number[] = []

    for (let b = 0; b < totalBolts; b++) {
      // Spawn bolts in an arc behind the globe (-Z space, R roughly 2.8 to 4.2)
      const angle = (b / totalBolts) * Math.PI * 2 + (Math.random() - 0.5) * 0.4
      const r1 = 2.4 + Math.random() * 0.6
      const r2 = 3.6 + Math.random() * 1.2
      const zOffset = -1.2 - Math.random() * 1.5

      const start = new THREE.Vector3(
        Math.cos(angle) * r1,
        Math.sin(angle) * r1,
        zOffset
      )
      const end = new THREE.Vector3(
        Math.cos(angle + 0.35) * r2,
        Math.sin(angle + 0.35) * r2,
        zOffset - 0.4
      )

      const pts = createLightningBranch(start, end, totalSegmentsPerBolt, 0.22)

      // Add as pair of segments
      for (let p = 0; p < pts.length - 1; p++) {
        lineCoords.push(pts[p].x, pts[p].y, pts[p].z)
        lineCoords.push(pts[p + 1].x, pts[p + 1].y, pts[p + 1].z)

        // Electric cyan to violet gradient
        const isCore = Math.random() > 0.4
        lineCol.push(
          isCore ? 0.7 : 0.2, // R
          isCore ? 0.95 : 0.7, // G
          1.0                  // B
        )
        lineCol.push(
          isCore ? 0.8 : 0.3,
          isCore ? 0.98 : 0.8,
          1.0
        )
      }
    }

    const pos = new Float32Array(lineCoords)
    const col = new Float32Array(lineCol)
    return { linePositions: pos, lineColors: col }
  }, [])

  const lineGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(lineColors, 3))
    return geo
  }, [linePositions, lineColors])

  // ── 2. Ionized Spark Swarm ────────────────────────────────────────────────
  const sparkGeo = useMemo(() => {
    const count = 300
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const r = 2.2 + Math.random() * 3.0
      pos[i * 3] = Math.cos(angle) * r
      pos[i * 3 + 1] = Math.sin(angle) * r
      pos[i * 3 + 2] = -1.0 - Math.random() * 2.5

      col[i * 3] = 0.3 + Math.random() * 0.6
      col[i * 3 + 1] = 0.8 + Math.random() * 0.2
      col[i * 3 + 2] = 1.0
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
    return geo
  }, [])

  // ── 3. Animation Loop: Flash bursts and random jitter ──────────────────────
  useFrame(({ clock }) => {
    if (!visible) return
    const t = clock.getElapsedTime()

    // Flash strike effect: high frequency burst with randomized calm intervals
    const strikeTrigger = Math.sin(t * 7.5) * Math.cos(t * 13.2)
    const isFlashing = strikeTrigger > 0.45

    if (linesRef.current) {
      const mat = linesRef.current.material as THREE.LineBasicMaterial
      if (isFlashing) {
        mat.opacity = 0.75 + Math.random() * 0.25
        // Micro-jitter lines slightly during discharge
        linesRef.current.rotation.z = Math.sin(t * 20) * 0.02
      } else {
        mat.opacity = 0.12 + Math.sin(t * 2) * 0.08
      }
    }

    if (flashGlowRef.current) {
      const mat = flashGlowRef.current.material as THREE.MeshBasicMaterial
      if (isFlashing) {
        mat.opacity = 0.35 + Math.random() * 0.2
      } else {
        mat.opacity = 0.06 + Math.sin(t * 1.5) * 0.04
      }
    }

    if (sparksRef.current) {
      sparksRef.current.rotation.z = t * 0.03
    }
  })

  if (!visible) return null

  return (
    <group position={[0, 0, -0.6]}>
      {/* ── Atmospheric Plasma Flash Glow Disk behind Globe ── */}
      <mesh ref={flashGlowRef} position={[0, 0, -1.8]}>
        <planeGeometry args={[9.5, 9.5]} />
        <meshBasicMaterial
          color="#0ea5e9"
          transparent
          opacity={0.12}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* ── Secondary Violet Deep Aurora Halo ── */}
      <mesh position={[0, 0, -1.9]}>
        <ringGeometry args={[2.0, 5.0, 32]} />
        <meshBasicMaterial
          color="#8b5cf6"
          transparent
          opacity={0.08}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ── Electric Lightning Discharge Arcs ── */}
      <lineSegments ref={linesRef} geometry={lineGeometry}>
        <lineBasicMaterial
          vertexColors
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>

      {/* ── Floating Ionized Atmospheric Sparks ── */}
      <points ref={sparksRef} geometry={sparkGeo}>
        <pointsMaterial
          size={0.032}
          vertexColors
          transparent
          opacity={0.65}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  )
}
