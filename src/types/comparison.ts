/**
 * comparison.ts — TypeScript Types for Model vs Observation Validation
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 */

import type { OceanVariable } from './ocean'

export interface ComparisonDatasetOption {
  id: string
  name: string
  provider: string
  format: string
  variables: string[]
  is_real_data?: boolean
  is_uploaded?: boolean
  record_count?: number
  count?: number
  description?: string
}

export interface ComparisonDatasetsCatalog {
  models: ComparisonDatasetOption[]
  observations: ComparisonDatasetOption[]
}

export interface UploadDatasetResponse {
  dataset_id: string
  name: string
  dataset_type: 'model' | 'observation'
  format: string
  record_count: number
  detected_variables: string[]
  spatial_bounds?: {
    lat_min?: number
    lat_max?: number
    lon_min?: number
    lon_max?: number
  }
  depth_range?: {
    min: number
    max: number
  }
  preview_records?: Record<string, unknown>[]
  is_valid: boolean
  errors: string[]
  warnings: string[]
}

export interface AccuracyStatus {
  status: 'GOOD' | 'MODERATE' | 'POOR' | 'UNKNOWN'
  label: string
  icon: string
  color: 'emerald' | 'amber' | 'red' | 'slate'
  description: string
  thresholds?: {
    good_max: number
    moderate_max: number
  }
  is_application_defined?: boolean
}

export interface ComparisonMetrics {
  matched_count: number
  mean_bias: number | null
  mae: number | null
  rmse: number | null
  correlation: number | null
  min_residual?: number | null
  max_residual?: number | null
  mean_model_value?: number | null
  mean_obs_value?: number | null
}

export interface MatchedRecord {
  match_id: string
  platform_id: string
  latitude: number
  longitude: number
  depth: number
  timestamp: string
  model_value: number
  obs_value: number
  residual: number
  absolute_error: number
  unit: string
  qc_flag?: number
  source?: string
}

export interface ProfilePointPair {
  depth: number
  model_value: number
  obs_value: number
  residual: number
  count?: number
}

export interface ResidualPoint {
  id: string
  depth: number
  latitude: number
  longitude: number
  timestamp: string
  residual: number
  absolute_error: number
  model_value: number
  obs_value: number
}

export interface ComparisonResult {
  matched: boolean
  model_dataset_id: string
  observation_dataset_id: string
  variable: OceanVariable | string
  unit: string
  metrics: ComparisonMetrics
  status: AccuracyStatus
  sample_point?: MatchedRecord | null
  matched_records: MatchedRecord[]
  total_matched_count?: number
  profile_series: ProfilePointPair[]
  residual_series: ResidualPoint[]
  matching_parameters?: {
    spatial_tolerance_deg: number
    depth_tolerance_m: number
    time_tolerance_hours: number
  }
  message?: string
}

export interface CommonVariablesResponse {
  model_id: string
  obs_id: string
  common_variables: string[]
  default_variable: string
}

export interface AccuracyThresholdsMap {
  [variable: string]: {
    good_max: number
    moderate_max: number
  }
}
