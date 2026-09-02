/**
 * Ocean Intelligence Platform — TypeScript Domain Types
 * SIH 26067 | INCOIS / MoES
 */

// ─── Ocean Variables ────────────────────────────────────────────────────────

export type OceanVariable =
  | 'temperature'
  | 'salinity'
  | 'chlorophyll'
  | 'current_u'
  | 'current_v'
  | 'current_w'
  | 'current_velocity'

export interface OceanVariableConfig {
  id: OceanVariable
  label: string
  unit: string
  colormap: string
  minValue: number
  maxValue: number
  description: string
}

export interface ProvenanceInfo {
  provider: string
  dataset_id: string
  source_file: string
  model_name?: string
  institution?: string
  resolution?: string
  processing: string[]
  quality_status: string
  is_real_data: boolean
}

export interface ModelPointMeasurement {
  latitude: number
  longitude: number
  depth: number
  variable: OceanVariable
  value: number
  unit: string
  timestamp: string
  isNearestGridPoint?: boolean
  nearestLat?: number
  nearestLon?: number
  provenance?: ProvenanceInfo
}

// ─── Observation Types ───────────────────────────────────────────────────────

export type ObservationType = 'argo' | 'glider' | 'ctd' | 'bgc' | 'adcp'

export interface ObservationTypeConfig {
  id: ObservationType
  label: string
  description: string
  icon: string
  color: string
}

// ─── Dataset Metadata & Provenance ──────────────────────────────────────────

export interface SpatialBounds {
  minLat: number
  maxLat: number
  minLon: number
  maxLon: number
}

export interface TimeRange {
  start: string // ISO 8601
  end: string // ISO 8601
}

export interface DepthRange {
  minDepth: number // metres (positive down)
  maxDepth: number
}

export type DataFormat = 'netcdf' | 'csv' | 'json' | 'hdf5' | 'grib2'

export interface DatasetCatalogItem {
  id: string
  name: string
  provider: string
  format: string
  variables: string[]
  dimensions: Record<string, number>
  description?: string
  is_demo: boolean
  is_real_data: boolean
  status: 'DEMO' | 'LOCAL_REAL_DATA' | 'REMOTE'
}

export interface DatasetMetadata {
  id: string
  name: string
  source: string
  variable: OceanVariable
  unit: string
  timeRange: TimeRange
  depthRange: DepthRange
  spatialBounds: SpatialBounds
  format: DataFormat
  resolution?: string // e.g. "1/12°"
  description?: string
  lastUpdated?: string // ISO 8601
  provenance?: ProvenanceInfo
}

// ─── Ocean Observation ───────────────────────────────────────────────────────

export interface OceanObservation {
  id: string
  type: ObservationType
  latitude: number // decimal degrees
  longitude: number // decimal degrees
  timestamp: string // ISO 8601
  depth: number // metres (positive down)
  temperature?: number // °C
  salinity?: number // PSU
  chlorophyll?: number // mg m⁻³
  currentU?: number // m/s eastward
  currentV?: number // m/s northward
  currentW?: number // m/s upward
  quality?: 'good' | 'suspect' | 'bad' | 'missing'
  qc_flag?: number
  quality_status?: string
  platformId?: string
  metadata?: Record<string, unknown>
  provenance?: ProvenanceInfo
}

// ─── Visualization State ─────────────────────────────────────────────────────

export interface VisualizationState {
  activeVariable: OceanVariable
  activeDataset: string | null
  selectedDepth: number
  selectedTimestamp: string | null
  showObservations: boolean
  observationFilters: ObservationType[]
  colormap: string
  opacity: number
}

// ─── API Response wrappers ───────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T
  status: 'success' | 'error'
  message?: string
  timestamp: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// ─── Chart / time-series ─────────────────────────────────────────────────────

export interface TimeSeriesPoint {
  timestamp: string
  value: number
  depth?: number
  quality?: string
}

export interface DepthProfile {
  depth: number
  temperature?: number
  salinity?: number
  chlorophyll?: number
}
