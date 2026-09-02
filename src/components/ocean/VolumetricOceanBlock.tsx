/**
 * VolumetricOceanBlock.tsx — 3D Volumetric Ocean Water Column (Digital Twin Extrusion)
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 *
 * Renders the 3D sub-surface water column block:
 * 1. Top face: High-resolution surface thermal heatmap with eddy structures.
 * 2. Vertical cross-section walls: Stratified thermocline gradient (0m to 1500m depth).
 * 3. Horizontal Depth Slice plane: Interactive slicing plane positioned at the user's selected depth.
 * 4. 3D Autonomous Glider & Sawtooth Profiling Trajectory.
 * 5. Bounding wireframe volume cage with depth ruler and click-to-measure raycast handlers.
 */

import { useMemo } from 'react'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import type { OceanVariable, ModelPointMeasurement } from '@/types/ocean'
import { createVolumetricTopHeatmap, createStratifiedWallTexture } from '@/utils/earthTextures'
import { Glider3DModel } from './Glider3DModel'
import { getMeasurementImmediate } from '@/utils/measurementCache'

interface VolumetricOceanBlockProps {
  selectedVariable: OceanVariable
  selectedDepth: number // 0 to 2000m
  maxDepth?: number
  verticalExaggeration?: number
  visibleModelVolume?: boolean
  visibleGliderPath?: boolean
  gliderId?: string
  regionName?: string
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
  onHoverModelPoint?: (m: ModelPointMeasurement, e: ThreeEvent<PointerEvent>) => void
  onUnhoverModelPoint?: () => void
  onClickModelPoint?: (m: ModelPointMeasurement) => void
}

const REGION_COORDS: Record<string, { lat: number; lon: number }> = {
  'Bay of Bengal': { lat: 14.5, lon: 87.5 },
  'Arabian Sea':   { lat: 15.2, lon: 64.8 },
  'Andaman Sea':   { lat: 10.5, lon: 94.2 },
  'Equatorial Indian Ocean': { lat: 0.0, lon: 80.0 },
}

export function VolumetricOceanBlock({
  selectedVariable = 'temperature',
  selectedDepth = 50,
  maxDepth = 1500,
  verticalExaggeration = 1.0,
  visibleModelVolume = true,
  visibleGliderPath = true,
  gliderId = 'SG-152',
  regionName = 'Bay of Bengal',
  position = [0.42, 0.42, 1.88],
  rotation = [0.15, -0.28, 0.05],
  scale = 1.0,
  onHoverModelPoint,
  onUnhoverModelPoint,
  onClickModelPoint,
}: VolumetricOceanBlockProps) {
  const yFactor = Math.min(2.5, 0.8 + (verticalExaggeration - 1) * 0.2)

  // Dimensions of the 3D volumetric cuboid
  const width = 1.35
  const length = 1.35
  const height = 0.85 * yFactor

  // Center coords of active region
  const coords = REGION_COORDS[regionName] ?? REGION_COORDS['Bay of Bengal']

  // Textures for top face and vertical walls
  const topTexture = useMemo(
    () => createVolumetricTopHeatmap(selectedVariable),
    [selectedVariable]
  )

  const wallTexture = useMemo(
    () => createStratifiedWallTexture(selectedVariable),
    [selectedVariable]
  )

  // Relative Y offset for the horizontal depth slice plane:
  // 0m -> top of block (y = 0)
  // 1500m -> bottom of block (y = -height)
  const depthFraction = Math.min(1, Math.max(0, selectedDepth / maxDepth))
  const sliceY = 0 - depthFraction * height

  // ── Materials for the cuboid faces ──────────────────────────────────────────
  const topMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: topTexture,
        roughness: 0.35,
        metalness: 0.1,
        transparent: true,
        opacity: 0.94,
        side: THREE.DoubleSide,
      }),
    [topTexture]
  )

  const wallMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: wallTexture,
        roughness: 0.4,
        metalness: 0.05,
        transparent: true,
        opacity: 0.92,
        side: THREE.DoubleSide,
      }),
    [wallTexture]
  )

  const bottomMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#021329',
        roughness: 0.8,
        metalness: 0.2,
      }),
    []
  )

  // ── Horizontal Depth Slice Plane Material & Texture ────────────────────────
  const sliceTexture = useMemo(
    () => createVolumetricTopHeatmap(selectedVariable, 384, 384),
    [selectedVariable]
  )

  function handleSliceClick(e: ThreeEvent<MouseEvent>) {
    e.stopPropagation()
    const m = getMeasurementImmediate(coords.lat, coords.lon, selectedDepth, selectedVariable, 2)
    onClickModelPoint?.(m)
  }

  function handleSlicePointerOver(e: ThreeEvent<PointerEvent>) {
    e.stopPropagation()
    document.body.style.cursor = 'crosshair'
    const m = getMeasurementImmediate(coords.lat, coords.lon, selectedDepth, selectedVariable, 2)
    onHoverModelPoint?.(m, e)
  }

  function handleSlicePointerOut(e: ThreeEvent<PointerEvent>) {
    e.stopPropagation()
    document.body.style.cursor = 'auto'
    onUnhoverModelPoint?.()
  }

  return (
    <group position={position} rotation={rotation} scale={[scale, scale, scale]}>
      {visibleModelVolume && (
        <>
          {/* ── Top Face: Surface Heatmap ──────────────────────────────────── */}
          <mesh
            position={[0, 0, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            material={topMaterial}
            onClick={handleSliceClick}
            onPointerOver={handleSlicePointerOver}
            onPointerOut={handleSlicePointerOut}
          >
            <planeGeometry args={[width, length]} />
          </mesh>

          {/* ── Vertical Cross-Section Walls ───────────────────────────────── */}
          {/* Front Wall (+Z) */}
          <mesh position={[0, -height / 2, length / 2]} material={wallMaterial}>
            <planeGeometry args={[width, height]} />
          </mesh>

          {/* Back Wall (-Z) */}
          <mesh position={[0, -height / 2, -length / 2]} rotation={[0, Math.PI, 0]} material={wallMaterial}>
            <planeGeometry args={[width, height]} />
          </mesh>

          {/* Right Wall (+X) */}
          <mesh position={[width / 2, -height / 2, 0]} rotation={[0, Math.PI / 2, 0]} material={wallMaterial}>
            <planeGeometry args={[length, height]} />
          </mesh>

          {/* Left Wall (-X) */}
          <mesh position={[-width / 2, -height / 2, 0]} rotation={[0, -Math.PI / 2, 0]} material={wallMaterial}>
            <planeGeometry args={[length, height]} />
          </mesh>

          {/* ── Bottom Abyssal Seabed Face ─────────────────────────────────── */}
          <mesh position={[0, -height, 0]} rotation={[Math.PI / 2, 0, 0]} material={bottomMaterial}>
            <planeGeometry args={[width, length]} />
          </mesh>

          {/* ── 3D Volume Bounding Wireframe Box ───────────────────────────── */}
          <mesh position={[0, -height / 2, 0]}>
            <boxGeometry args={[width * 1.002, height * 1.002, length * 1.002]} />
            <meshBasicMaterial
              color="#38bdf8"
              wireframe
              transparent
              opacity={0.35}
            />
          </mesh>

          {/* ── Horizontal Depth Slice Plane (Cutting through volume) ──────── */}
          <group
            position={[0.15, sliceY, 0.15]}
            rotation={[-Math.PI / 2, 0, 0]}
            onClick={handleSliceClick}
            onPointerOver={handleSlicePointerOver}
            onPointerOut={handleSlicePointerOut}
          >
            {/* Slice Heatmap Surface (Extends slightly outward as in reference pic) */}
            <mesh>
              <planeGeometry args={[width * 1.25, length * 1.15]} />
              <meshStandardMaterial
                map={sliceTexture}
                transparent
                opacity={0.88}
                roughness={0.3}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* Glowing border frame around the active depth slice */}
            <mesh>
              <ringGeometry args={[width * 0.58, width * 0.59, 4]} />
              <meshBasicMaterial color="#38bdf8" transparent opacity={0.7} />
            </mesh>
          </group>

          {/* Region identification tag on top corner of the volumetric block */}
          <group position={[-width / 2, 0.05, -length / 2]}>
            <Html style={{ pointerEvents: 'none', userSelect: 'none' }}>
              <div className="px-2 py-0.5 rounded bg-[#020b18]/90 border border-cyan-500/40 text-[9px] font-mono text-cyan-300 shadow-lg whitespace-nowrap">
                📦 {regionName} Column (0 – {maxDepth}m) | Vertical: {verticalExaggeration}×
              </div>
            </Html>
          </group>
        </>
      )}

      {/* ── 3D Glider Vehicle & Profiling Trajectory Inside the Volume ─────── */}
      <group position={[0, 0, 0]}>
        <Glider3DModel
          gliderId={gliderId}
          temperature={selectedVariable === 'temperature' ? 5.2 : 28.4}
          salinity={34.9}
          timestamp="14:30 UTC"
          currentDepth={selectedDepth}
          verticalExaggeration={verticalExaggeration}
          visiblePath={visibleGliderPath}
          scale={0.9}
        />
      </group>
    </group>
  )
}
