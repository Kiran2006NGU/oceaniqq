/**
 * useDashboardState — central state hook for the Ocean Dashboard
 * SIH 26067 | Ocean Intelligence Platform
 *
 * Supports dynamic dataset switching:
 * - 'demo-ocean' (Synthetic demo)
 * - 'incois-hycom-real' (Local Real INCOIS NetCDF)
 * Auto-refreshes temporal bounds, depth levels, and in-situ observations.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { OceanVariable, DatasetCatalogItem } from '@/types/ocean'
import {
  DEMO_DEPTHS,
  getModelTimes,
  getObservations,
  type MockObservation,
  type ModelTime,
} from '@/services/data/mockOceanData'
import {
  getDataSourceDatasets,
  getDataSourceTimes,
  getDataSourceDepths,
  getDataSourceObservations,
  isApiMode,
} from '@/services/data/dataSource'
import { DEFAULT_DATASET } from '@/services/data/apiOceanData'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VisibleLayers {
  oceanModel: boolean
  argo: boolean
  glider: boolean
  ctd: boolean
  currentVectors: boolean
  depthSlice: boolean
  isosurface: boolean
}

export interface DashboardState {
  // Primary selection
  selectedVariable: OceanVariable
  selectedDepthIndex: number
  selectedDepth: number
  continuousDepth: number
  selectedTimeIndex: number
  selectedTime: ModelTime
  selectedObservationId: string | null
  selectedObservation: MockObservation | null

  // Datasets
  selectedDatasetId: string
  datasets: DatasetCatalogItem[]
  activeDataset: DatasetCatalogItem | null

  // Layers
  visibleLayers: VisibleLayers

  // View settings
  verticalExaggeration: number
  isPlaying: boolean
  autoRotate: boolean

  // Reference data
  modelTimes: ModelTime[]
  observations: MockObservation[]
  availableDepths: number[]

  // Data source info
  dataSourceMode: 'mock' | 'api'
  isLoadingBackend: boolean

  // Actions
  setSelectedVariable: (v: OceanVariable) => void
  setSelectedDepthIndex: (i: number) => void
  setContinuousDepth: (d: number) => void
  setSelectedTimeIndex: (i: number) => void
  setSelectedObservationId: (id: string | null) => void
  setSelectedDatasetId: (id: string) => void
  toggleLayer: (layer: keyof VisibleLayers) => void
  setVerticalExaggeration: (v: number) => void
  togglePlay: () => void
  toggleAutoRotate: () => void
  stepTime: (dir: 1 | -1) => void
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDashboardState(): DashboardState {
  const [selectedVariable, setSelectedVariable] = useState<OceanVariable>('temperature')
  const [selectedDepthIndex, setSelectedDepthIndex] = useState(0)
  const [continuousDepth, setContinuousDepth] = useState(0)
  const [selectedTimeIndex, setSelectedTimeIndex] = useState(2) // default 12:00 UTC
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>(DEFAULT_DATASET)
  const [datasets, setDatasets] = useState<DatasetCatalogItem[]>([])

  // Hydrate selectedObservationId from the ?observation= URL param on first render
  const [searchParams] = useSearchParams()
  const [selectedObservationId, setSelectedObservationId] = useState<string | null>(
    () => searchParams.get('observation')
  )
  const [visibleLayers, setVisibleLayers] = useState<VisibleLayers>({
    oceanModel: true,
    argo: true,
    glider: true,
    ctd: true,
    currentVectors: true,
    depthSlice: true,
    isosurface: false,
  })
  const [verticalExaggeration, setVerticalExaggeration] = useState(1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [autoRotate, setAutoRotate] = useState(false)

  // ── Async data from API / mock ─────────────────────────────────────────────
  const [modelTimes, setModelTimes] = useState<ModelTime[]>(getModelTimes())
  const [observations, setObservations] = useState<MockObservation[]>(getObservations())
  const [availableDepths, setAvailableDepths] = useState<number[]>([...DEMO_DEPTHS])
  const [isLoadingBackend, setIsLoadingBackend] = useState(isApiMode)

  // Load catalog on mount
  useEffect(() => {
    getDataSourceDatasets().then((list) => {
      setDatasets(list)
    })
  }, [])

  // Load dataset-specific data when selectedDatasetId changes
  useEffect(() => {
    let cancelled = false
    setIsLoadingBackend(true)

    const isReal = selectedDatasetId.includes('incois') || selectedDatasetId.includes('real')

    Promise.all([
      getDataSourceTimes(selectedDatasetId),
      getDataSourceDepths(selectedDatasetId),
      getDataSourceObservations(isReal ? true : undefined),
    ])
      .then(([times, depths, obs]) => {
        if (cancelled) return
        setModelTimes(times)
        setAvailableDepths(depths)
        setObservations(obs)
        // Reset depth index if out of range
        setSelectedDepthIndex((curr) => {
          const newIdx = curr >= depths.length ? 0 : curr
          setContinuousDepth(depths[newIdx] ?? 0)
          return newIdx
        })
        setSelectedTimeIndex((curr) => (curr >= times.length ? 0 : curr))
      })
      .catch((err) => {
        console.warn(`[OceanIQ] Dataset '${selectedDatasetId}' load failed:`, err)
      })
      .finally(() => {
        if (!cancelled) setIsLoadingBackend(false)
      })

    return () => { cancelled = true }
  }, [selectedDatasetId])

  // ── Auto-play timer ────────────────────────────────────────────────────────
  const timeIndexRef = useRef(selectedTimeIndex)
  timeIndexRef.current = selectedTimeIndex

  useEffect(() => {
    if (!isPlaying) return
    const id = setInterval(() => {
      const next = (timeIndexRef.current + 1) % modelTimes.length
      setSelectedTimeIndex(next)
    }, 1500)
    return () => clearInterval(id)
  }, [isPlaying, modelTimes.length])

  // ── Callbacks ──────────────────────────────────────────────────────────────
  const toggleLayer = useCallback((layer: keyof VisibleLayers) => {
    setVisibleLayers((prev) => ({ ...prev, [layer]: !prev[layer] }))
  }, [])

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev)
  }, [])

  const toggleAutoRotate = useCallback(() => {
    setAutoRotate((prev) => !prev)
  }, [])

  const stepTime = useCallback(
    (dir: 1 | -1) => {
      setSelectedTimeIndex((prev) => {
        const next = prev + dir
        if (next < 0) return modelTimes.length - 1
        if (next >= modelTimes.length) return 0
        return next
      })
    },
    [modelTimes.length]
  )

  const selectedDepth = availableDepths[selectedDepthIndex] ?? 0
  const selectedTime = modelTimes[selectedTimeIndex] ?? modelTimes[0]

  const selectedObservation =
    observations.find((o) => o.id === selectedObservationId) ?? null

  const activeDataset =
    datasets.find((d) => d.id === selectedDatasetId) ?? null

  return {
    selectedVariable,
    selectedDepthIndex,
    selectedDepth,
    continuousDepth,
    selectedTimeIndex,
    selectedTime,
    selectedObservationId,
    selectedObservation,
    selectedDatasetId,
    datasets,
    activeDataset,
    visibleLayers,
    verticalExaggeration,
    isPlaying,
    autoRotate,
    modelTimes,
    observations,
    availableDepths,
    dataSourceMode: isApiMode ? 'api' : 'mock',
    isLoadingBackend,
    setSelectedVariable,
    setSelectedDepthIndex,
    setContinuousDepth,
    setSelectedTimeIndex,
    setSelectedObservationId,
    setSelectedDatasetId,
    toggleLayer,
    setVerticalExaggeration,
    togglePlay,
    toggleAutoRotate,
    stepTime,
  }
}
