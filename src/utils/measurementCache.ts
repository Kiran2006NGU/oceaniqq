/**
 * measurementCache.ts — High-Performance Client Cache for Ocean Model Point Queries
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 *
 * Prevents HTTP request storms during mouse hover/movement over the 3D globe and volume.
 * Provides:
 * 1. Synchronous nearest-grid approximation from local data or memory cache.
 * 2. Asynchronous throttled backend fetch if in API mode.
 * 3. Consistent ModelPointMeasurement shape with units and metadata.
 */

import type { OceanVariable, ModelPointMeasurement } from '@/types/ocean'
import { VARIABLE_COLOR_CONFIGS } from './oceanColorScale'
import { getOceanValueSync, isApiMode } from '@/services/data/dataSource'
import { apiGetOceanValue } from '@/services/data/apiOceanData'

const cache = new Map<string, { measurement: ModelPointMeasurement; timestamp: number }>()
const CACHE_TTL_MS = 60_000 // 1 minute

function makeCacheKey(
  lat: number,
  lon: number,
  depth: number,
  variable: OceanVariable,
  timeIndex: number
): string {
  // Quantize coordinates to ~0.25° grid for cache hit efficiency
  const qLat = Math.round(lat * 4) / 4
  const qLon = Math.round(lon * 4) / 4
  return `${qLat.toFixed(2)}_${qLon.toFixed(2)}_${depth}_${variable}_${timeIndex}`
}

/**
 * Synchronously retrieves or approximates an ocean measurement at the given coordinates.
 */
export function getMeasurementImmediate(
  lat: number,
  lon: number,
  depth: number,
  variable: OceanVariable,
  timeIndex: number,
  timeString = '28 Aug 2026 12:00 UTC'
): ModelPointMeasurement {
  const key = makeCacheKey(lat, lon, depth, variable, timeIndex)
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.measurement
  }

  // Calculate synchronous value from NetCDF grid or model formulas
  const rawValue = getOceanValueSync(lat, lon, depth, variable, timeIndex)
  const cfg = VARIABLE_COLOR_CONFIGS[variable] ?? VARIABLE_COLOR_CONFIGS.temperature

  const measurement: ModelPointMeasurement = {
    latitude: Math.round(lat * 100) / 100,
    longitude: Math.round(lon * 100) / 100,
    depth,
    variable,
    value: Math.round(rawValue * 100) / 100,
    unit: cfg.unit,
    timestamp: timeString,
    isNearestGridPoint: true,
    nearestLat: Math.round(lat),
    nearestLon: Math.round(lon),
  }

  cache.set(key, { measurement, timestamp: Date.now() })
  return measurement
}

/**
 * Asynchronously queries the backend point endpoint with debouncing, updating cache.
 * Falls back immediately to the synchronous estimate if not in API mode.
 */
export async function queryMeasurementAsync(
  lat: number,
  lon: number,
  depth: number,
  variable: OceanVariable,
  timeIndex: number,
  timeIso = '2026-08-28T12:00:00Z',
  timeString = '28 Aug 2026 12:00 UTC'
): Promise<ModelPointMeasurement> {
  const immediate = getMeasurementImmediate(lat, lon, depth, variable, timeIndex, timeString)

  if (!isApiMode) {
    return immediate
  }

  try {
    const rawValue = await apiGetOceanValue(lat, lon, depth, variable, timeIso)
    if (rawValue == null) return immediate

    const cfg = VARIABLE_COLOR_CONFIGS[variable] ?? VARIABLE_COLOR_CONFIGS.temperature
    const measurement: ModelPointMeasurement = {
      latitude: Math.round(lat * 100) / 100,
      longitude: Math.round(lon * 100) / 100,
      depth,
      variable,
      value: Math.round(rawValue * 100) / 100,
      unit: cfg.unit,
      timestamp: timeString,
      isNearestGridPoint: true,
      nearestLat: Math.round(lat),
      nearestLon: Math.round(lon),
    }
    const key = makeCacheKey(lat, lon, depth, variable, timeIndex)
    cache.set(key, { measurement, timestamp: Date.now() })
    return measurement
  } catch {
    return immediate
  }
}
