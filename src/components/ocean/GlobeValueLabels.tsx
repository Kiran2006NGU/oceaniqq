/**
 * GlobeValueLabels.tsx — 3D Floating Numerical Parameter Badges on Globe
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 *
 * Implements Feature 5:
 * "Globe showing all parameters with numbers of animations according to the parameters"
 *
 * Displays live, reactive numeric badges at major Indian Ocean observation stations:
 * - Central Arabian Sea
 * - Northern Bay of Bengal
 * - Equatorial Indian Ocean
 * - Sri Lanka Dome
 * - Somali Upwelling Basin
 * - Andaman Sea
 */

import { useMemo } from 'react'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import { GLOBE_RADIUS } from '@/utils/geoUtils'
import type { OceanVariable } from '@/types/ocean'
import { getOceanValueSync } from '@/services/data/dataSource'

interface GlobeValueLabelsProps {
  selectedVariable: OceanVariable
  selectedDepth: number
  selectedTimeIso: string
  visible?: boolean
}

interface StationTarget {
  id: string
  name: string
  lat: number
  lon: number
}

const OCEAN_STATIONS: StationTarget[] = [
  { id: 'st-as', name: 'Arabian Sea Center', lat: 15.5, lon: 65.0 },
  { id: 'st-bob', name: 'Bay of Bengal Basin', lat: 16.0, lon: 88.5 },
  { id: 'st-eq', name: 'Equatorial Ocean Station', lat: 0.0, lon: 78.0 },
  { id: 'st-sld', name: 'Sri Lanka Dome', lat: 7.2, lon: 83.0 },
  { id: 'st-som', name: 'Somali Current Basin', lat: 9.0, lon: 52.5 },
  { id: 'st-and', name: 'Andaman Archipelagic Station', lat: 11.8, lon: 93.2 },
]

function latLonToVec3(lat: number, lon: number, altitude = 0.03): THREE.Vector3 {
  const latRad = (lat * Math.PI) / 180
  const lonRad = ((lon + 90) * Math.PI) / 180
  const phi = Math.PI / 2 - latRad
  const theta = lonRad
  const r = GLOBE_RADIUS + altitude
  return new THREE.Vector3().setFromSphericalCoords(r, phi, theta)
}

function getUnitForVariable(variable: OceanVariable): string {
  switch (variable) {
    case 'temperature': return '°C'
    case 'salinity': return 'PSU'
    case 'current_velocity':
    case 'current_u':
    case 'current_v': return 'm/s'
    case 'sea_level':
    case 'sea_surface_height': return 'cm'
    case 'chlorophyll':
    case 'phytoplankton': return 'mg/m³'
    default: return ''
  }
}

function getColorForVariable(variable: OceanVariable): string {
  switch (variable) {
    case 'temperature': return '#f97316'
    case 'salinity': return '#38bdf8'
    case 'current_velocity': return '#818cf8'
    case 'sea_level': return '#06b6d4'
    case 'chlorophyll': return '#10b981'
    default: return '#a855f7'
  }
}

export function GlobeValueLabels({
  selectedVariable,
  selectedDepth,
  selectedTimeIso,
  visible = true,
}: GlobeValueLabelsProps) {
  const unit = getUnitForVariable(selectedVariable)
  const accentColor = getColorForVariable(selectedVariable)

  const stationsWithValues = useMemo(() => {
    return OCEAN_STATIONS.map((station) => {
      const val = getOceanValueSync(
        selectedVariable,
        station.lat,
        station.lon,
        selectedDepth,
        selectedTimeIso
      )
      const pos = latLonToVec3(station.lat, station.lon, 0.032)
      return {
        ...station,
        value: typeof val === 'number' ? val.toFixed(2) : '--',
        pos,
      }
    })
  }, [selectedVariable, selectedDepth, selectedTimeIso])

  if (!visible) return null

  return (
    <group>
      {stationsWithValues.map((st) => (
        <group key={st.id} position={st.pos}>
          {/* Subtle anchor pin dot */}
          <mesh>
            <sphereGeometry args={[0.012, 12, 12]} />
            <meshStandardMaterial
              color={accentColor}
              emissive={accentColor}
              emissiveIntensity={0.8}
            />
          </mesh>

          {/* Glowing pulse ring */}
          <mesh>
            <ringGeometry args={[0.018, 0.026, 16]} />
            <meshBasicMaterial
              color={accentColor}
              side={THREE.DoubleSide}
              transparent
              opacity={0.6}
            />
          </mesh>

          {/* Floating Numerical HUD Badge */}
          <Html distanceFactor={4.2} center zIndexRange={[12, 0]}>
            <div
              className="pointer-events-none select-none flex flex-col items-center px-2 py-1 rounded-lg bg-black/85 backdrop-blur-md border shadow-xl transition-all duration-300 transform -translate-y-6"
              style={{ borderColor: `${accentColor}80`, boxShadow: `0 0 12px ${accentColor}33` }}
            >
              <div className="flex items-center gap-1 font-mono leading-none">
                <span className="text-xs font-black tracking-tight" style={{ color: accentColor }}>
                  {st.value}
                </span>
                <span className="text-[9px] text-slate-300 font-semibold">{unit}</span>
              </div>
              <span className="text-[8px] font-mono text-slate-400 whitespace-nowrap mt-0.5">
                {st.name}
              </span>
            </div>
          </Html>
        </group>
      ))}
    </group>
  )
}
