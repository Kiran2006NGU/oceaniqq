/**
 * apiOceanData.ts — API-backed ocean data functions
 * SIH 26067 | Ocean Intelligence Platform
 *
 * These functions call the FastAPI backend. Each mirrors the signature of
 * the mock function it replaces so callers don't need to change.
 */

import { apiFetch } from '@/services/api/client'
import type { OceanVariable, ProvenanceInfo, DatasetCatalogItem } from '@/types/ocean'
import type { ModelTime, MockObservation, ProfilePoint, CurrentVector } from './mockOceanData'

// ─── Backend Response Types ───────────────────────────────────────────────────

export interface ApiModelTimeStep {
  index: number
  iso_string: string
  label: string
  date_label: string
}

export interface ApiTimesResponse {
  dataset_id: string
  times: ApiModelTimeStep[]
}

export interface ApiDepthsResponse {
  dataset_id: string
  depths: number[]
  units: string
}

export interface ApiVariableInfo {
  id: string
  display_name: string
  unit: string
  min_value: number
  max_value: number
  description: string
  standard_name?: string
  colormap: string
}

export interface ApiOceanFieldResponse {
  dataset: string
  variable: string
  unit: string
  depth: number
  time: string
  latitudes: number[]
  longitudes: number[]
  values: (number | null)[]
  nlat: number
  nlon: number
  valid_min: number
  valid_max: number
  provenance?: ProvenanceInfo
}

export interface ApiOceanValueResponse {
  latitude: number
  longitude: number
  depth: number
  variable: string
  value: number | null
  unit: string
  time: string
  dataset: string
  nearest_lat?: number
  nearest_lon?: number
  provenance?: ProvenanceInfo
}

export interface ApiOceanProfileResponse {
  latitude: number
  longitude: number
  variable: string
  unit: string
  time: string
  dataset: string
  profile: Array<{ depth: number; value: number | null }>
  provenance?: ProvenanceInfo
}

export interface ApiObservation {
  id: string
  type: string
  platform_id: string
  latitude: number
  longitude: number
  timestamp: string
  current_depth: number
  temperature: number
  salinity: number
  chlorophyll: number
  region: string
  is_demo: boolean
  qc_flag?: number
  quality_status?: string
  provenance?: ProvenanceInfo
}

export interface ApiObservationProfile {
  observation_id: string
  latitude: number
  longitude: number
  variable_units: Record<string, string>
  profile: Array<{
    depth: number
    temperature?: number | null
    salinity?: number | null
    chlorophyll?: number | null
  }>
  is_demo: boolean
  provenance?: ProvenanceInfo
}

// ─── Default dataset ───────────────────────────────────────────────────────────

export const DEFAULT_DATASET = 'demo-ocean'

// ─── API functions ────────────────────────────────────────────────────────────

/** Fetch list of available real and demo datasets */
export async function apiGetDatasets(): Promise<DatasetCatalogItem[]> {
  try {
    return await apiFetch<DatasetCatalogItem[]>('/api/v1/ocean/datasets')
  } catch {
    return [
      {
        id: 'demo-ocean',
        name: 'Demo Indian Ocean Model (Synthetic)',
        provider: 'OceanIQ Demo Pipeline',
        format: 'NetCDF',
        variables: ['temperature', 'salinity', 'chlorophyll', 'current_u', 'current_v'],
        dimensions: { time: 5, depth: 9, latitude: 30, longitude: 40 },
        is_demo: true,
        is_real_data: false,
        status: 'DEMO',
      },
      {
        id: 'incois-hycom-real',
        name: 'INCOIS HYCOM Indian Ocean Model',
        provider: 'INCOIS',
        format: 'NetCDF-4',
        variables: ['temperature', 'salinity', 'current_u', 'current_v', 'current_velocity'],
        dimensions: { time: 5, depth: 9, latitude: 35, longitude: 45 },
        is_demo: false,
        is_real_data: true,
        status: 'LOCAL_REAL_DATA',
      },
    ]
  }
}

/** Fetch available model timestamps and convert to ModelTime format */
export async function apiGetModelTimes(datasetId = DEFAULT_DATASET): Promise<ModelTime[]> {
  const res = await apiFetch<ApiTimesResponse>('/api/v1/ocean/times', {
    params: { dataset_id: datasetId },
  })
  return res.times.map((t) => ({
    index: t.index,
    label: t.label,
    isoString: t.iso_string,
    dateLabel: t.date_label,
  }))
}

/** Fetch available depth levels */
export async function apiGetDepths(datasetId = DEFAULT_DATASET): Promise<number[]> {
  const res = await apiFetch<ApiDepthsResponse>('/api/v1/ocean/depths', {
    params: { dataset_id: datasetId },
  })
  return res.depths
}

/** Fetch variable catalogue */
export async function apiGetVariables(datasetId = DEFAULT_DATASET): Promise<ApiVariableInfo[]> {
  return apiFetch<ApiVariableInfo[]>('/api/v1/ocean/variables', {
    params: { dataset_id: datasetId },
  })
}

/**
 * Fetch a complete 2-D field (lat x lon) for a variable at a given depth/time.
 */
export async function apiGetOceanField(
  variable: OceanVariable,
  depth: number,
  timeIso: string,
  datasetId = DEFAULT_DATASET,
): Promise<ApiOceanFieldResponse> {
  return apiFetch<ApiOceanFieldResponse>('/api/v1/ocean/field', {
    params: {
      dataset_id: datasetId,
      variable,
      time: timeIso,
      depth,
    },
  })
}

/**
 * Fetch a single point value (nearest-neighbour).
 */
export async function apiGetOceanValue(
  lat: number,
  lon: number,
  depth: number,
  variable: OceanVariable,
  timeIso: string,
  datasetId = DEFAULT_DATASET,
): Promise<number | null> {
  const res = await apiFetch<ApiOceanValueResponse>('/api/v1/ocean/value', {
    params: {
      dataset_id: datasetId,
      variable,
      latitude: lat,
      longitude: lon,
      depth,
      time: timeIso,
    },
  })
  return res.value
}

/**
 * Fetch a depth profile at a single point.
 */
export async function apiGetOceanProfile(
  lat: number,
  lon: number,
  variable: OceanVariable,
  timeIso: string,
  datasetId = DEFAULT_DATASET,
): Promise<ProfilePoint[]> {
  const res = await apiFetch<ApiOceanProfileResponse>('/api/v1/ocean/profile', {
    params: {
      dataset_id: datasetId,
      variable,
      latitude: lat,
      longitude: lon,
      time: timeIso,
    },
  })
  return res.profile.map((p) => ({
    depth: p.depth,
    temperature: variable === 'temperature' ? (p.value ?? 0) : 0,
    salinity: variable === 'salinity' ? (p.value ?? 0) : 0,
    chlorophyll: variable === 'chlorophyll' ? (p.value ?? 0) : 0,
  }))
}

/**
 * Fetch in-situ observations with optional real-data filter.
 */
export async function apiGetObservations(isRealData?: boolean): Promise<MockObservation[]> {
  const res = await apiFetch<ApiObservation[]>('/api/v1/observations', {
    params: isRealData !== undefined ? { is_real_data: isRealData } : undefined,
  })
  return res.map((obs) => ({
    id: obs.id,
    name: obs.platform_id || obs.id,
    type: obs.type as 'argo' | 'glider' | 'ctd',
    platformId: obs.platform_id,
    latitude: obs.latitude,
    longitude: obs.longitude,
    timestamp: obs.timestamp,
    currentDepth: obs.current_depth,
    temperature: obs.temperature,
    salinity: obs.salinity,
    chlorophyll: obs.chlorophyll,
    region: obs.region,
    isDemo: obs.is_demo,
    qc_flag: obs.qc_flag,
    qualityFlag: obs.qc_flag === 1 ? 'good' : 'suspect',
  }))
}

/**
 * Fetch an observation profile.
 */
export async function apiGetObservationProfile(obsId: string): Promise<ProfilePoint[]> {
  const res = await apiFetch<ApiObservationProfile>(`/api/v1/observations/${obsId}/profile`)
  return res.profile.map((p) => ({
    depth: p.depth,
    temperature: p.temperature ?? 0,
    salinity: p.salinity ?? 0,
    chlorophyll: p.chlorophyll ?? 0,
  }))
}

/**
 * Get current vector grid for a given depth and time step.
 */
export async function apiGetCurrentVectors(
  depth: number,
  timeIso: string,
  datasetId = DEFAULT_DATASET,
): Promise<CurrentVector[]> {
  try {
    const [uField, vField] = await Promise.all([
      apiGetOceanField('current_u', depth, timeIso, datasetId),
      apiGetOceanField('current_v', depth, timeIso, datasetId),
    ])

    const vectors: CurrentVector[] = []
    const step = 2 // subsample for visual clarity
    for (let i = 0; i < uField.nlat; i += step) {
      for (let j = 0; j < uField.nlon; j += step) {
        const idx = i * uField.nlon + j
        const u = uField.values[idx]
        const v = vField.values[idx]
        if (u != null && v != null) {
          vectors.push({
            lat: uField.latitudes[i],
            lon: uField.longitudes[j],
            u,
            v,
            magnitude: Math.sqrt(u * u + v * v),
          })
        }
      }
    }
    return vectors
  } catch (err) {
    console.warn('[OceanIQ] apiGetCurrentVectors failed, returning empty:', err)
    return []
  }
}
