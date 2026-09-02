/**
 * Mock Ocean Data Service — Deterministic demo dataset
 * SIH 26067 | Ocean Intelligence Platform
 *
 * ⚠️  DEMO / SIMULATED DATA
 * Values are procedurally generated for demonstration only.
 * Not affiliated with INCOIS, MoES, or any operational forecast system.
 *
 * Replace getOceanValue / getObservations / getProfileData with FastAPI
 * calls in Phase 3 without changing any downstream component.
 */

import type { OceanVariable, ObservationType } from '@/types/ocean'

// ─── Public Data Types ────────────────────────────────────────────────────────

export interface ModelTime {
  index: number
  label: string      // "12:00"
  isoString: string  // "2026-08-28T12:00:00Z"
  dateLabel: string  // "28 Aug 2026"
}

export interface MockObservation {
  id: string
  type: ObservationType
  platformId: string
  name: string
  platformName?: string
  latitude: number
  longitude: number
  timestamp: string
  currentDepth: number
  maxDepth?: number
  temperature: number
  salinity: number
  chlorophyll: number
  region: string
  isDemo: boolean
  qc_flag?: number
  qualityFlag?: number | string
  quality_status?: string
  dataSource?: string
  provenance?: import('@/types/ocean').ProvenanceInfo
}

export interface ProfilePoint {
  depth: number
  temperature: number
  salinity: number
  chlorophyll: number
}

export interface CurrentVector {
  lat: number
  lon: number
  u: number
  v: number
  magnitude: number
}

// ─── Constants ─────────────────────────────────────────────────────────────────

/** Depth levels available in the dashboard (metres) */
export const DEMO_DEPTHS: number[] = [0, 10, 25, 50, 100, 200, 500, 1000, 2000]

// ─── Time Steps ────────────────────────────────────────────────────────────────

const RAW_TIMES: ModelTime[] = [
  { index: 0, label: '00:00', isoString: '2026-08-28T00:00:00Z', dateLabel: '28 Aug 2026' },
  { index: 1, label: '06:00', isoString: '2026-08-28T06:00:00Z', dateLabel: '28 Aug 2026' },
  { index: 2, label: '12:00', isoString: '2026-08-28T12:00:00Z', dateLabel: '28 Aug 2026' },
  { index: 3, label: '18:00', isoString: '2026-08-28T18:00:00Z', dateLabel: '28 Aug 2026' },
  { index: 4, label: '00:00', isoString: '2026-08-29T00:00:00Z', dateLabel: '29 Aug 2026' },
]

export function getModelTimes(): ModelTime[] {
  return RAW_TIMES
}

// ─── Deterministic Field Generation ───────────────────────────────────────────

/** Sea-surface temperature (°C): latitudinal gradient + mesoscale waves + thermocline */
function computeTemperature(lat: number, lon: number, depth: number, t: number): number {
  const latFactor = Math.max(0, 1 - Math.abs(lat) / 35)
  const base = 5 + latFactor * 25

  const wave1 = 2.0 * Math.sin((lon * Math.PI) / 90 + t * 0.4)
  const wave2 = 1.2 * Math.cos((lat * Math.PI) / 30 + (lon * Math.PI) / 120)
  const wave3 = 0.8 * Math.sin((lat * Math.PI) / 20 + (lon * Math.PI) / 60 + t * 0.6)

  const depthCool =
    depth < 50 ? 0
    : depth < 300 ? -(depth - 50) * 0.055
    : -13.75 - (depth - 300) * 0.006

  return Math.max(-2, Math.min(34, base + wave1 + wave2 + wave3 + depthCool))
}

/** Salinity (PSU): Arabian Sea high, Bay of Bengal low, wave patterns */
function computeSalinity(lat: number, lon: number, depth: number, t: number): number {
  let sal = 35.0

  // Arabian Sea high salinity
  const aLat = Math.max(0, 1 - Math.abs(lat - 17) / 8)
  const aLon = Math.max(0, 1 - Math.abs(lon - 65) / 10)
  sal += 1.8 * aLat * aLon

  // Bay of Bengal freshwater
  const bLat = Math.max(0, 1 - Math.abs(lat - 12) / 8)
  const bLon = Math.max(0, 1 - Math.abs(lon - 88) / 10)
  sal -= 2.2 * bLat * bLon

  if (lat < -5) sal -= 0.3 * Math.max(0, (-lat - 5) / 20)

  sal += 0.4 * Math.sin((lon * Math.PI) / 90 + t * 0.3)
  sal += 0.2 * Math.cos((lat * Math.PI) / 40)
  if (depth > 100) sal += Math.min(0.5, (depth - 100) / 3000)

  return Math.max(30, Math.min(40, sal))
}

/** Chlorophyll-a (mg/m³): coastal upwelling, photic zone attenuation */
function computeChlorophyll(lat: number, lon: number, depth: number, t: number): number {
  let chl = 0.08

  // Arabian Sea upwelling
  const aC = Math.max(0, 1 - Math.sqrt(((lat - 15) ** 2) / 64 + ((lon - 60) ** 2) / 144))
  chl += 2.5 * aC

  // Bay of Bengal coastal
  const bC = Math.max(0, 1 - Math.sqrt(((lat - 13) ** 2) / 36 + ((lon - 84) ** 2) / 100))
  chl += 1.8 * bC

  // Southern IO bloom patch
  const sC = Math.max(0, 1 - Math.sqrt(((lat + 12) ** 2) / 49 + ((lon - 70) ** 2) / 196))
  chl += 1.2 * sC

  chl += 0.3 * Math.max(0, Math.sin((lon * Math.PI) / 60 + (lat * Math.PI) / 30 + t * 0.8))
  chl *= 0.8 + 0.4 * Math.max(0, Math.sin(t * 1.2))
  if (depth > 10) chl *= Math.exp(-(depth - 10) / 70)

  return Math.max(0.01, Math.min(5, chl))
}

/** Eastward current U (m/s) */
function computeCurrentU(lat: number, lon: number, depth: number, t: number): number {
  const sec = -0.45 * Math.max(0, Math.cos((lat * Math.PI) / 15))
  const monsoon = 0.3 * Math.sin((lon * Math.PI) / 60 + t * 0.5) * Math.cos((lat * Math.PI) / 30)
  const eddy = 0.25 * Math.sin((lon * Math.PI) / 45 + (lat * Math.PI) / 25 + t * 0.7)
  return Math.max(-2, Math.min(2, (sec + monsoon + eddy) * Math.exp(-depth / 350)))
}

/** Northward current V (m/s) */
function computeCurrentV(lat: number, lon: number, depth: number, t: number): number {
  const somaliLat = Math.max(0, 1 - Math.abs(lat - 7) / 10)
  const somaliLon = Math.max(0, 1 - Math.abs(lon - 48) / 8)
  const somali = 0.9 * somaliLat * somaliLon * Math.cos(t * 0.4)
  const merid = 0.2 * Math.sin((lon * Math.PI) / 60 + t * 0.6)
  const wave = 0.15 * Math.cos((lat * Math.PI) / 20 + (lon * Math.PI) / 40)
  return Math.max(-2, Math.min(2, (somali + merid + wave) * Math.exp(-depth / 350)))
}

/** Vertical current W (m/s) — very small */
function computeCurrentW(lat: number, _lon: number, _depth: number, t: number): number {
  return 0.002 * Math.sin((lat * Math.PI) / 20 + t)
}

// ─── Public API Functions ─────────────────────────────────────────────────────

/**
 * Get a simulated ocean variable value at (lat, lon, depth, time).
 * Phase 3: replace with apiFetch(API_ENDPOINTS.variables, { lat, lon, depth, variable, time })
 */
export function getOceanValue(
  lat: number,
  lon: number,
  depth: number,
  variable: OceanVariable,
  timeIndex: number
): number {
  const t = timeIndex * (Math.PI / 2)
  switch (variable) {
    case 'temperature':  return computeTemperature(lat, lon, depth, t)
    case 'salinity':     return computeSalinity(lat, lon, depth, t)
    case 'chlorophyll':  return computeChlorophyll(lat, lon, depth, t)
    case 'current_u':    return computeCurrentU(lat, lon, depth, t)
    case 'current_v':    return computeCurrentV(lat, lon, depth, t)
    case 'current_w':    return computeCurrentW(lat, lon, depth, t)
    case 'current_velocity': {
      const u = computeCurrentU(lat, lon, depth, t)
      const v = computeCurrentV(lat, lon, depth, t)
      return Math.sqrt(u * u + v * v)
    }
  }
}

/**
 * Get a depth profile for an observation location.
 * Phase 3: replace with apiFetch(API_ENDPOINTS.profile, { lat, lon })
 */
export function getProfileData(obs: MockObservation): ProfilePoint[] {
  const depths = [0, 10, 25, 50, 75, 100, 150, 200, 300, 400, 500, 750, 1000, 1500, 2000]
  const t = 2 * (Math.PI / 2) // 12:00 UTC
  return depths.map((depth) => ({
    depth,
    temperature: computeTemperature(obs.latitude, obs.longitude, depth, t),
    salinity:    computeSalinity(obs.latitude, obs.longitude, depth, t),
    chlorophyll: Math.max(0.01, computeChlorophyll(obs.latitude, obs.longitude, depth, t)),
  }))
}

/**
 * Get current vector grid for a given depth and time step.
 * Phase 3: replace with apiFetch(API_ENDPOINTS.variables, { variable: 'current_u/v', depth, time })
 */
export function getCurrentVectors(
  depth: number,
  timeIndex: number,
  gridSize = 14
): CurrentVector[] {
  const t = timeIndex * (Math.PI / 2)
  const vectors: CurrentVector[] = []

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      // Indian Ocean domain: lat -25→30°, lon 40→105°
      const lat = -25 + (i / (gridSize - 1)) * 55
      const lon = 40 + (j / (gridSize - 1)) * 65
      const u = computeCurrentU(lat, lon, depth, t)
      const v = computeCurrentV(lat, lon, depth, t)
      vectors.push({ lat, lon, u, v, magnitude: Math.sqrt(u * u + v * v) })
    }
  }
  return vectors
}

// ─── Demo Observations ────────────────────────────────────────────────────────

/** ⚠️ DEMO DATA — Not live Argo / INCOIS observations */
const DEMO_OBSERVATIONS: MockObservation[] = [
  // Argo floats
  { id: 'ARGO_6902880', name: 'Argo Float 6902880', type: 'argo', platformId: 'WMO-6902880',  latitude:  14.23, longitude:  65.47, timestamp: '2026-08-28T06:00:00Z', currentDepth:    8.5, temperature: 29.1, salinity: 36.2, chlorophyll: 0.18, region: 'Arabian Sea',            isDemo: true, qualityFlag: 'good' },
  { id: 'ARGO_5904682', name: 'Argo Float 5904682', type: 'argo', platformId: 'WMO-5904682',  latitude:  10.87, longitude:  85.31, timestamp: '2026-08-28T06:00:00Z', currentDepth: 1500.0, temperature:  3.4, salinity: 34.8, chlorophyll: 0.02, region: 'Bay of Bengal',            isDemo: true, qualityFlag: 'good' },
  { id: 'ARGO_6902571', name: 'Argo Float 6902571', type: 'argo', platformId: 'WMO-6902571',  latitude:  -8.52, longitude:  72.38, timestamp: '2026-08-28T00:00:00Z', currentDepth:  200.0, temperature: 18.7, salinity: 35.1, chlorophyll: 0.08, region: 'Central Indian Ocean',     isDemo: true, qualityFlag: 'good' },
  { id: 'ARGO_6900574', name: 'Argo Float 6900574', type: 'argo', platformId: 'WMO-6900574',  latitude:  18.35, longitude:  58.72, timestamp: '2026-08-28T12:00:00Z', currentDepth:   50.0, temperature: 27.5, salinity: 36.8, chlorophyll: 0.35, region: 'Arabian Sea North',         isDemo: true, qualityFlag: 'good' },
  { id: 'ARGO_1902230', name: 'Argo Float 1902230', type: 'argo', platformId: 'WMO-1902230',  latitude: -15.18, longitude:  80.07, timestamp: '2026-08-28T18:00:00Z', currentDepth: 1000.0, temperature:  8.3, salinity: 34.6, chlorophyll: 0.04, region: 'Southern Indian Ocean',     isDemo: true, qualityFlag: 'good' },
  // Ocean Gliders
  { id: 'GLIDER_IN001', name: 'Glider INCOIS-01', type: 'glider', platformId: 'INCOIS-GL-01', latitude:  16.42, longitude:  68.17, timestamp: '2026-08-28T09:00:00Z', currentDepth:  320.0, temperature: 14.2, salinity: 36.4, chlorophyll: 0.11, region: 'Arabian Sea',           isDemo: true, qualityFlag: 'good' },
  { id: 'GLIDER_IN002', name: 'Glider INCOIS-02', type: 'glider', platformId: 'INCOIS-GL-02', latitude:  12.05, longitude:  88.52, timestamp: '2026-08-28T09:00:00Z', currentDepth:  180.0, temperature: 21.8, salinity: 33.4, chlorophyll: 0.42, region: 'Bay of Bengal',           isDemo: true, qualityFlag: 'good' },
  { id: 'GLIDER_IN003', name: 'Glider INCOIS-03', type: 'glider', platformId: 'INCOIS-GL-03', latitude:  -5.28, longitude:  67.81, timestamp: '2026-08-28T03:00:00Z', currentDepth:  450.0, temperature: 11.4, salinity: 35.0, chlorophyll: 0.06, region: 'Central Indian Ocean',    isDemo: true, qualityFlag: 'good' },
  // CTD Stations
  { id: 'CTD_LKDSW01',  name: 'CTD Station Lakdiva', type: 'ctd',    platformId: 'CTD-LAKDIVA-01', latitude:  8.47, longitude:  77.52, timestamp: '2026-08-27T20:00:00Z', currentDepth:   0.0, temperature: 28.9, salinity: 34.7, chlorophyll: 0.52, region: 'Laccadive Sea',          isDemo: true, qualityFlag: 'good' },
  { id: 'CTD_ARBS02',   name: 'CTD Station Arabian Sea', type: 'ctd',    platformId: 'CTD-ARABS-02',   latitude: 20.12, longitude:  62.28, timestamp: '2026-08-27T14:00:00Z', currentDepth:   0.0, temperature: 26.3, salinity: 36.9, chlorophyll: 0.29, region: 'Arabian Sea North',      isDemo: true, qualityFlag: 'good' },
  { id: 'CTD_SIO03',    name: 'CTD Station South Indian Ocean', type: 'ctd',    platformId: 'CTD-SIO-03',     latitude:-18.73, longitude:  65.24, timestamp: '2026-08-27T08:00:00Z', currentDepth:   0.0, temperature: 22.1, salinity: 34.8, chlorophyll: 0.15, region: 'Southern Indian Ocean',  isDemo: true, qualityFlag: 'good' },
  { id: 'CTD_ANDM04',   name: 'CTD Station Andaman Sea', type: 'ctd',    platformId: 'CTD-ANDAMAN-04', latitude:  6.18, longitude:  93.12, timestamp: '2026-08-27T12:00:00Z', currentDepth:   0.0, temperature: 29.5, salinity: 32.8, chlorophyll: 0.83, region: 'Andaman Sea',            isDemo: true, qualityFlag: 'good' },
]

/**
 * Get all demo observation platforms.
 * Phase 3: replace with apiFetch(API_ENDPOINTS.observations, filters)
 */
export function getObservations(): MockObservation[] {
  return DEMO_OBSERVATIONS
}
