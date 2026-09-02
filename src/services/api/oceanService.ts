/**
 * Ocean data service — dataset and observation API calls
 * SIH 26067 | Ocean Intelligence Platform
 *
 * TODO: Implement API methods when FastAPI backend is ready
 */
import { API_ENDPOINTS } from '@/config'
import type { DatasetMetadata, OceanObservation, PaginatedResponse } from '@/types/ocean'
import { apiFetch } from './client'

/**
 * fetchDatasets — retrieve available dataset catalog from backend
 */
export async function fetchDatasets(): Promise<DatasetMetadata[]> {
  const response = await apiFetch<{ data: DatasetMetadata[] }>(API_ENDPOINTS.datasets)
  return response.data
}

/**
 * fetchObservations — retrieve paginated observations with optional filters
 */
export async function fetchObservations(filters?: {
  type?: string
  minLat?: number
  maxLat?: number
  minLon?: number
  maxLon?: number
  startTime?: string
  endTime?: string
  limit?: number
  offset?: number
}): Promise<PaginatedResponse<OceanObservation>> {
  return apiFetch<PaginatedResponse<OceanObservation>>(API_ENDPOINTS.observations, {
    params: filters as Record<string, string | number | boolean>,
  })
}
