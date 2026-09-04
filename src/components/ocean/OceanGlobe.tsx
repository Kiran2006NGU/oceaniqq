/**
 * OceanGlobe — 3D sphere with per-vertex ocean data colouring
 * SIH 26067 | Ocean Intelligence Platform
 *
 * Phase 3: Fetches a 2D field grid once per (variable/depth/time) change,
 * then maps each vertex to its nearest grid cell for colour.
 * Falls back to synchronous mock data if API is unavailable or in mock mode.
 *
 * The geometry is created once. Only the 'color' BufferAttribute changes.
 */

import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { OceanVariable } from '@/types/ocean'
import { getOceanValueSync, getDataSourceOceanField, isApiMode } from '@/services/data/dataSource'
import { valueToRGB } from '@/utils/oceanColorScale'
import { vec3ToLatLon } from '@/utils/geoUtils'
import type { ApiOceanFieldResponse } from '@/services/data/apiOceanData'
import type { ModelTime } from '@/services/data/mockOceanData'

export const GLOBE_RADIUS = 2.0
const WIDTH_SEGS = 96   // higher resolution for cleaner rendering
const HEIGHT_SEGS = 48

interface OceanGlobeProps {
  selectedVariable: OceanVariable
  selectedDepth: number
  selectedTimeIndex: number
  selectedTime?: ModelTime
}

/** Nearest-neighbour index lookup in a sorted 1-D array */
function nearestIdx(arr: number[], val: number): number {
  let best = 0
  let bestDist = Math.abs(arr[0] - val)
  for (let i = 1; i < arr.length; i++) {
    const d = Math.abs(arr[i] - val)
    if (d < bestDist) { bestDist = d; best = i }
  }
  return best
}

/** Apply a field grid to the geometry colour buffer */
function applyFieldToGeometry(
  geometry: THREE.SphereGeometry,
  vertexLatLons: [number, number][],
  field: ApiOceanFieldResponse,
  variable: OceanVariable,
): void {
  const { latitudes, longitudes, values, nlon } = field
  const n = vertexLatLons.length
  const colors = new Float32Array(n * 3)

  for (let i = 0; i < n; i++) {
    const [lat, lon] = vertexLatLons[i]
    const li = nearestIdx(latitudes, lat)
    const lj = nearestIdx(longitudes, lon)
    const val = values[li * nlon + lj] ?? 0
    const [r, g, b] = valueToRGB(val, variable)
    colors[i * 3]     = r
    colors[i * 3 + 1] = g
    colors[i * 3 + 2] = b
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
}

/** Apply mock values directly to the geometry colour buffer */
function applyMockToGeometry(
  geometry: THREE.SphereGeometry,
  vertexLatLons: [number, number][],
  variable: OceanVariable,
  depth: number,
  timeIndex: number,
): void {
  const n = vertexLatLons.length
  const colors = new Float32Array(n * 3)

  for (let i = 0; i < n; i++) {
    const [lat, lon] = vertexLatLons[i]
    const value = getOceanValueSync(lat, lon, depth, variable, timeIndex)
    const [r, g, b] = valueToRGB(value, variable)
    colors[i * 3]     = r
    colors[i * 3 + 1] = g
    colors[i * 3 + 2] = b
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
}

export function OceanGlobe({ selectedVariable, selectedDepth, selectedTimeIndex, selectedTime }: OceanGlobeProps) {
  // ── Create geometry once ──────────────────────────────────────────────────
  const geometry = useMemo(() => {
    const geo = new THREE.SphereGeometry(GLOBE_RADIUS, WIDTH_SEGS, HEIGHT_SEGS)
    geo.computeVertexNormals()
    return geo
  }, [])

  // Pre-compute lat/lon for every vertex (expensive, do once)
  const vertexLatLons = useMemo(() => {
    const pos = geometry.attributes.position as THREE.BufferAttribute
    const n = pos.count
    const arr: [number, number][] = new Array(n)
    for (let i = 0; i < n; i++) {
      arr[i] = vec3ToLatLon(pos.getX(i), pos.getY(i), pos.getZ(i))
    }
    return arr
  }, [geometry])

  // Keep a ref to track if the effect is still current
  const abortRef = useRef(false)

  // ── Dispose geometry on unmount ───────────────────────────────────────────
  useEffect(() => () => geometry.dispose(), [geometry])

  // ── Recompute vertex colours when state changes ───────────────────────────
  useEffect(() => {
    abortRef.current = false

    // ISO timestamp for API — use selectedTime if provided, else derive from index
    const timeIso = selectedTime?.isoString
      ?? `2026-08-28T${String(selectedTimeIndex * 6).padStart(2, '0')}:00:00Z`

    if (isApiMode) {
      // Async path: fetch the 2-D field, then colour vertices
      getDataSourceOceanField(selectedVariable, selectedDepth, timeIso)
        .then((field) => {
          if (abortRef.current) return
          if (field) {
            applyFieldToGeometry(geometry, vertexLatLons, field, selectedVariable)
          } else {
            // API returned null → fall back to mock
            applyMockToGeometry(geometry, vertexLatLons, selectedVariable, selectedDepth, selectedTimeIndex)
          }
          // Force re-render by marking color attribute as needing update
          const colorAttr = geometry.attributes.color
          if (colorAttr) colorAttr.needsUpdate = true
        })
        .catch(() => {
          if (abortRef.current) return
          applyMockToGeometry(geometry, vertexLatLons, selectedVariable, selectedDepth, selectedTimeIndex)
          const colorAttr = geometry.attributes.color
          if (colorAttr) colorAttr.needsUpdate = true
        })
    } else {
      // Synchronous mock path
      applyMockToGeometry(geometry, vertexLatLons, selectedVariable, selectedDepth, selectedTimeIndex)
      const colorAttr = geometry.attributes.color
      if (colorAttr) colorAttr.needsUpdate = true
    }

    return () => { abortRef.current = true }
  }, [selectedVariable, selectedDepth, selectedTimeIndex, selectedTime, vertexLatLons, geometry])

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial
        vertexColors
        roughness={0.45}
        metalness={0.08}
        emissive="#030d1a"
        emissiveIntensity={0.12}
      />
    </mesh>
  )
}

