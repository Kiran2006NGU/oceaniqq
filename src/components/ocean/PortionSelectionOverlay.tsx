/**
 * PortionSelectionOverlay.tsx — Interactive 4-Sided Ocean Portion Selector on 3D Globe
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 *
 * Implements:
 * 1. Invisible raycast sphere capturing pointerDown -> pointerMove -> pointerUp.
 * 2. Real-time 4-sided curved boundary lines on the globe sphere surface.
 * 3. Semi-transparent cyan water-column highlight quad.
 * 4. Real-time coordinate tag displaying Lat/Lon bounds and dimensions.
 */

import { useState, useMemo, useCallback, useRef } from 'react'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { vec3ToLatLon, latLonToVec3, GLOBE_RADIUS } from '@/utils/geoUtils'

export interface SelectedPortionBounds {
  minLat: number
  maxLat: number
  minLon: number
  maxLon: number
  centerLat: number
  centerLon: number
  widthKm: number
  heightKm: number
}

interface PortionSelectionOverlayProps {
  isActive: boolean
  onSelectionComplete: (bounds: SelectedPortionBounds) => void
  onCancel: () => void
}

// Generate curved 3D line points on the sphere surface between 2 lat/lons
function createCurvedSphereEdge(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  steps = 16,
  radius = GLOBE_RADIUS + 0.02
): THREE.Vector3[] {
  const points: THREE.Vector3[] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const lat = lat1 + (lat2 - lat1) * t
    const lon = lon1 + (lon2 - lon1) * t
    const [x, y, z] = latLonToVec3(lat, lon, radius)
    points.push(new THREE.Vector3(x, y, z))
  }
  return points
}

// Approximate distance on Earth (km)
function calcKm(degLat: number, degLon: number, meanLat: number): { wKm: number; hKm: number } {
  const latKm = Math.round(Math.abs(degLat) * 111.0)
  const lonKm = Math.round(Math.abs(degLon) * 111.0 * Math.cos((meanLat * Math.PI) / 180))
  return { wKm: lonKm, hKm: latKm }
}

export function PortionSelectionOverlay({
  isActive,
  onSelectionComplete,
}: PortionSelectionOverlayProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [startPoint, setStartPoint] = useState<{ lat: number; lon: number } | null>(null)
  const [currentPoint, setCurrentPoint] = useState<{ lat: number; lon: number } | null>(null)

  // Extract pointer intersection onto sphere
  const getLatLonFromEvent = useCallback((e: ThreeEvent<PointerEvent>): { lat: number; lon: number } => {
    const p = e.point
    const [lat, lon] = vec3ToLatLon(p.x, p.y, p.z)
    return { lat, lon }
  }, [])

  const handlePointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (!isActive) return
      e.stopPropagation()
      const pt = getLatLonFromEvent(e)
      setStartPoint(pt)
      setCurrentPoint(pt)
      setIsDragging(true)
    },
    [isActive, getLatLonFromEvent]
  )

  const handlePointerMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (!isActive || !isDragging || !startPoint) return
      e.stopPropagation()
      const pt = getLatLonFromEvent(e)
      setCurrentPoint(pt)
    },
    [isActive, isDragging, startPoint, getLatLonFromEvent]
  )

  const handlePointerUp = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (!isActive || !isDragging || !startPoint || !currentPoint) return
      e.stopPropagation()
      setIsDragging(false)

      const minLat = Math.min(startPoint.lat, currentPoint.lat)
      const maxLat = Math.max(startPoint.lat, currentPoint.lat)
      const minLon = Math.min(startPoint.lon, currentPoint.lon)
      const maxLon = Math.max(startPoint.lon, currentPoint.lon)

      const dLat = maxLat - minLat
      const dLon = maxLon - minLon

      // Require a minimum bounding box (at least 0.4° span)
      if (dLat >= 0.4 && dLon >= 0.4) {
        const centerLat = (minLat + maxLat) / 2
        const centerLon = (minLon + maxLon) / 2
        const { wKm, hKm } = calcKm(dLat, dLon, centerLat)

        onSelectionComplete({
          minLat: parseFloat(minLat.toFixed(2)),
          maxLat: parseFloat(maxLat.toFixed(2)),
          minLon: parseFloat(minLon.toFixed(2)),
          maxLon: parseFloat(maxLon.toFixed(2)),
          centerLat: parseFloat(centerLat.toFixed(2)),
          centerLon: parseFloat(centerLon.toFixed(2)),
          widthKm: wKm,
          heightKm: hKm,
        })
      }
    },
    [isActive, isDragging, startPoint, currentPoint, onSelectionComplete]
  )

  // Compute 4-sided bounding shape curves
  const shapeLines = useMemo(() => {
    if (!startPoint || !currentPoint) return null

    const minLat = Math.min(startPoint.lat, currentPoint.lat)
    const maxLat = Math.max(startPoint.lat, currentPoint.lat)
    const minLon = Math.min(startPoint.lon, currentPoint.lon)
    const maxLon = Math.max(startPoint.lon, currentPoint.lon)

    // 4 curved edges
    const north = createCurvedSphereEdge(maxLat, minLon, maxLat, maxLon)
    const east = createCurvedSphereEdge(maxLat, maxLon, minLat, maxLon)
    const south = createCurvedSphereEdge(minLat, maxLon, minLat, minLon)
    const west = createCurvedSphereEdge(minLat, minLon, maxLat, minLon)

    const allPoints = [...north, ...east, ...south, ...west]
    const geom = new THREE.BufferGeometry().setFromPoints(allPoints)

    // Center 3D position for label
    const centerLat = (minLat + maxLat) / 2
    const centerLon = (minLon + maxLon) / 2
    const [cx, cy, cz] = latLonToVec3(centerLat, centerLon, GLOBE_RADIUS + 0.08)

    const { wKm, hKm } = calcKm(maxLat - minLat, maxLon - minLon, centerLat)

    return {
      geometry: geom,
      center: [cx, cy, cz] as [number, number, number],
      minLat,
      maxLat,
      minLon,
      maxLon,
      wKm,
      hKm,
    }
  }, [startPoint, currentPoint])

  if (!isActive) return null

  return (
    <group>
      {/* ── Invisible Interactive Raycast Sphere (Covers globe) ────── */}
      <mesh
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <sphereGeometry args={[GLOBE_RADIUS + 0.03, 48, 48]} />
        <meshBasicMaterial transparent opacity={0.0} depthWrite={false} />
      </mesh>

      {/* ── 4-Sided Bounding Box Lines ──────────────────────────────── */}
      {shapeLines && (
        <group>
          {/* Glowing cyan boundary lines */}
          <lineLoop geometry={shapeLines.geometry}>
            <lineBasicMaterial color="#00ffff" linewidth={3} transparent opacity={0.95} />
          </lineLoop>

          {/* 4 Corner Markers */}
          {[
            [shapeLines.maxLat, shapeLines.minLon],
            [shapeLines.maxLat, shapeLines.maxLon],
            [shapeLines.minLat, shapeLines.maxLon],
            [shapeLines.minLat, shapeLines.minLon],
          ].map(([cLat, cLon], idx) => {
            const [x, y, z] = latLonToVec3(cLat, cLon, GLOBE_RADIUS + 0.035)
            return (
              <mesh key={idx} position={[x, y, z]}>
                <sphereGeometry args={[0.02, 12, 12]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
            )
          })}

          {/* Center Dimensions & Coordinates Tag */}
          <Html position={shapeLines.center} center style={{ pointerEvents: 'none' }}>
            <div className="px-2.5 py-1.5 rounded-xl bg-black/90 border border-cyan-400/80 shadow-2xl font-mono text-[10px] text-cyan-200 whitespace-nowrap backdrop-blur-md">
              <div className="font-bold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span>Selected Ocean Portion</span>
              </div>
              <div className="text-slate-300 mt-0.5">
                Lat: {shapeLines.minLat.toFixed(1)}° to {shapeLines.maxLat.toFixed(1)}°N
              </div>
              <div className="text-slate-300">
                Lon: {shapeLines.minLon.toFixed(1)}° to {shapeLines.maxLon.toFixed(1)}°E
              </div>
              <div className="text-cyan-400 font-semibold border-t border-white/15 pt-0.5 mt-0.5">
                Span: {shapeLines.wKm} km × {shapeLines.hKm} km
              </div>
            </div>
          </Html>
        </group>
      )}
    </group>
  )
}
