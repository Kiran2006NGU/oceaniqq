/**
 * IsosurfaceLayer.tsx — Interactive 3D Ocean Isosurface Extraction Layer
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 *
 * Implements Concept 7:
 * - 3D surface extraction representing scalar variable = isovalue (e.g. 26°C / 28°C Isotherm or 35 PSU Isohaline)
 * - Mapped to 3D Cartesian coordinates using centralized engine (latLonToVec3)
 * - Respects vertical exaggeration, depth stratification, and strict coastline land masking
 * - High-performance GPU-friendly geometry with smooth normal calculation and lighting
 * - Interactive 3D metadata tag with variable, unit, and isovalue
 */

import { useMemo } from 'react'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import { GLOBE_RADIUS, isLandCoordinate, latLonToVec3 } from '@/utils/geoUtils'
import type { OceanVariable } from '@/types/ocean'
import { valueToRGB, VARIABLE_COLOR_CONFIGS } from '@/utils/oceanColorScale'
import { getOceanValueSync } from '@/services/data/dataSource'

interface IsosurfaceLayerProps {
  selectedVariable?: OceanVariable
  isovalue?: number
  selectedTimeIndex?: number
  verticalExaggeration?: number
  opacity?: number
  wireframe?: boolean
  visible?: boolean
}

export function IsosurfaceLayer({
  selectedVariable = 'temperature',
  isovalue = 26.0,
  selectedTimeIndex = 2,
  verticalExaggeration = 1.0,
  opacity = 0.72,
  wireframe = false,
  visible = true,
}: IsosurfaceLayerProps) {
  const varConfig = VARIABLE_COLOR_CONFIGS[selectedVariable] ?? VARIABLE_COLOR_CONFIGS.temperature

  // ── 1. Extract 3D Isosurface Geometry across Indian Ocean Basin ────────────
  const { geometry, centerPoint, avgDepth } = useMemo(() => {
    if (!visible) return { geometry: null, centerPoint: null, avgDepth: 0 }

    // Spatial bounding box for Indian Ocean basin
    const minLat = -15
    const maxLat = 24
    const minLon = 45
    const maxLon = 98

    const latSteps = 45
    const lonSteps = 65

    const positions: number[] = []
    const normals: number[] = []
    const indices: number[] = []

    // 2D grid of vertex indices (-1 for land/invalid)
    const gridIndices: number[][] = []
    let validCount = 0
    let depthSum = 0

    let sampleX = 0
    let sampleY = 0
    let sampleZ = 0

    for (let i = 0; i <= latSteps; i++) {
      gridIndices[i] = []
      const lat = minLat + (i / latSteps) * (maxLat - minLat)

      for (let j = 0; j <= lonSteps; j++) {
        const lon = minLon + (j / lonSteps) * (maxLon - minLon)

        if (isLandCoordinate(lat, lon)) {
          gridIndices[i][j] = -1
          continue
        }

        // Find depth where field value == isovalue using bisection/profile scan
        // Scan depth levels from 0m down to 1000m
        let targetDepth = -1

        const valSurface = getOceanValueSync(lat, lon, 0, selectedVariable, selectedTimeIndex)
        const valDeep = getOceanValueSync(lat, lon, 1000, selectedVariable, selectedTimeIndex)

        const minV = Math.min(valSurface, valDeep)
        const maxV = Math.max(valSurface, valDeep)

        if (isovalue >= minV && isovalue <= maxV) {
          // Bisection search for precise isosurface depth
          let dLow = 0
          let dHigh = 1000
          for (let iter = 0; iter < 12; iter++) {
            const dMid = (dLow + dHigh) / 2
            const vMid = getOceanValueSync(lat, lon, dMid, selectedVariable, selectedTimeIndex)
            if (valSurface > valDeep) {
              if (vMid > isovalue) dLow = dMid
              else dHigh = dMid
            } else {
              if (vMid < isovalue) dLow = dMid
              else dHigh = dMid
            }
          }
          targetDepth = (dLow + dHigh) / 2
        } else if (Math.abs(valSurface - isovalue) < 1.0) {
          targetDepth = 5 // near surface
        }

        if (targetDepth < 0 || targetDepth > 1500) {
          gridIndices[i][j] = -1
          continue
        }

        // Convert (lat, lon, targetDepth) into 3D Cartesian position
        const depthScale = (targetDepth / 2000) * 0.24 * Math.min(2.5, 0.8 + (verticalExaggeration - 1) * 0.2)
        const r = GLOBE_RADIUS - depthScale
        const [x, y, z] = latLonToVec3(lat, lon, r)

        const vertexIndex = positions.length / 3
        positions.push(x, y, z)
        gridIndices[i][j] = vertexIndex

        validCount++
        depthSum += targetDepth

        if (validCount === Math.round((latSteps * lonSteps) / 4)) {
          sampleX = x
          sampleY = y
          sampleZ = z
        }
      }
    }

    // Build Triangles
    for (let i = 0; i < latSteps; i++) {
      for (let j = 0; j < lonSteps; j++) {
        const i00 = gridIndices[i][j]
        const i10 = gridIndices[i + 1][j]
        const i01 = gridIndices[i][j + 1]
        const i11 = gridIndices[i + 1][j + 1]

        if (i00 !== -1 && i10 !== -1 && i01 !== -1) {
          indices.push(i00, i10, i01)
        }
        if (i10 !== -1 && i11 !== -1 && i01 !== -1) {
          indices.push(i10, i11, i01)
        }
      }
    }

    if (positions.length === 0 || indices.length === 0) {
      return { geometry: null, centerPoint: null, avgDepth: 0 }
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geo.setIndex(indices)
    geo.computeVertexNormals()

    return {
      geometry: geo,
      centerPoint: [sampleX, sampleY, sampleZ] as [number, number, number],
      avgDepth: validCount > 0 ? depthSum / validCount : 0,
    }
  }, [selectedVariable, isovalue, selectedTimeIndex, verticalExaggeration, visible])

  // ── 2. Derive Color from Scientific Color Palette ─────────────────────────
  const surfaceColor = useMemo(() => {
    const [r, g, b] = valueToRGB(isovalue, selectedVariable)
    return new THREE.Color(r, g, b)
  }, [isovalue, selectedVariable])

  if (!visible || !geometry) return null

  return (
    <group name="IsosurfaceLayerRoot">
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color={surfaceColor}
          transparent={true}
          opacity={opacity}
          roughness={0.3}
          metalness={0.2}
          side={THREE.DoubleSide}
          wireframe={wireframe}
          depthWrite={false}
        />
      </mesh>

      {/* ── Floating 3D HUD Tag at the Isosurface ────────────────────────── */}
      {centerPoint && (
        <group position={centerPoint}>
          <Html center style={{ pointerEvents: 'none', userSelect: 'none' }}>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#020b18]/92 border border-purple-400/50 shadow-xl backdrop-blur-md whitespace-nowrap font-mono text-[10px]">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              <span className="font-bold text-purple-200">
                3D Isosurface: {isovalue.toFixed(1)} {varConfig.unit}
              </span>
              <span className="text-[9px] text-slate-400">
                (Mean Depth ~{Math.round(avgDepth)}m)
              </span>
            </div>
          </Html>
        </group>
      )}
    </group>
  )
}
