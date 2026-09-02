/**
 * ModelObservationWorkspace.tsx — Focused Model vs Observation Comparison Workspace
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 *
 * Implements the full 5-step scientific validation workflow:
 * 1. Select Model Dataset (Existing pre-loaded or uploaded)
 * 2. Select Observation Dataset (Argo, Glider, CTD, or uploaded)
 * 3. Select Common Variable (Temperature, Salinity, Chlorophyll, Currents)
 * 4. Spatiotemporal matching with configurable tolerances
 * 5. Scientific results: Compact KPI panel, 🟢/🟡/🔴 status indicator, Profile & Residual charts,
 *    and synchronized 3D observation point inspector.
 */

import { useState, useEffect, useCallback } from 'react'
import {
  Scale,
  Upload,
  Activity,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Sliders,
  MapPin,
  Waves,
  Eye,
} from 'lucide-react'
import type { OceanVariable } from '@/types/ocean'
import type {
  ComparisonDatasetOption,
  ComparisonDatasetsCatalog,
  ComparisonResult,
  MatchedRecord,
} from '@/types/comparison'
import {
  getComparisonDatasets,
  getCommonVariables,
  executeComparison,
} from '@/services/api/comparisonService'
import { ComparisonUploadModal } from './ComparisonUploadModal'
import { ComparisonProfileChart } from './ComparisonProfileChart'
import { ResidualChart } from './ResidualChart'
import { OceanScene } from '@/components/ocean/OceanScene'
import { latLonToVec3, GLOBE_RADIUS } from '@/utils/geoUtils'
import type { CameraNavTarget } from '@/components/ocean/CameraController'

const VARIABLE_DEFINITIONS: { id: OceanVariable; label: string; icon: string; unit: string }[] = [
  { id: 'temperature', label: 'Temperature', icon: '🌡️', unit: '°C' },
  { id: 'salinity', label: 'Salinity', icon: '🧂', unit: 'PSU' },
  { id: 'chlorophyll', label: 'Chlorophyll-a', icon: '🌿', unit: 'mg m⁻³' },
  { id: 'current_velocity', label: 'Current Speed', icon: '🌊', unit: 'm/s' },
]

export function ModelObservationWorkspace() {
  // ── Catalog State ───────────────────────────────────────────────────────────
  const [catalog, setCatalog] = useState<ComparisonDatasetsCatalog>({ models: [], observations: [] })
  const [selectedModelId, setSelectedModelId] = useState<string>('incois-hycom-real')
  const [selectedObsId, setSelectedObsId] = useState<string>('argo-incois-gdac')
  const [availableVariables, setAvailableVariables] = useState<string[]>(['temperature', 'salinity', 'chlorophyll'])
  const [selectedVariable, setSelectedVariable] = useState<OceanVariable>('temperature')

  // ── Matching Tolerances ─────────────────────────────────────────────────────
  const [showTolerances, setShowTolerances] = useState(false)
  const [spatialTol, setSpatialTol] = useState<number>(0.5) // degrees
  const [depthTol, setDepthTol] = useState<number>(25.0)   // metres
  const [timeTol, setTimeTol] = useState<number>(48.0)     // hours

  // ── Upload Modal State ──────────────────────────────────────────────────────
  const [uploadModalType, setUploadModalType] = useState<'model' | 'observation' | null>(null)

  // ── Comparison Results State ────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(false)
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null)
  const [selectedMatchPoint, setSelectedMatchPoint] = useState<MatchedRecord | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // ── 3D Scene Mini Viewport State ────────────────────────────────────────────
  const [show3DViewport, setShow3DViewport] = useState(true)
  const [navTarget, setNavTarget] = useState<CameraNavTarget | null>(null)

  // 1. Initial Load: Datasets & Default Compare
  useEffect(() => {
    let cancelled = false
    getComparisonDatasets().then((data) => {
      if (cancelled) return
      setCatalog(data)
      if (data.models.length > 0) setSelectedModelId(data.models[0].id)
      if (data.observations.length > 0) setSelectedObsId(data.observations[0].id)
    })
    return () => {
      cancelled = true
    }
  }, [])

  // 2. Fetch Common Variables on Dataset Switch
  useEffect(() => {
    if (!selectedModelId || !selectedObsId) return
    let cancelled = false
    getCommonVariables(selectedModelId, selectedObsId).then((res) => {
      if (cancelled) return
      setAvailableVariables(res.common_variables)
      if (!res.common_variables.includes(selectedVariable)) {
        setSelectedVariable((res.default_variable as OceanVariable) || 'temperature')
      }
    })
    return () => {
      cancelled = true
    }
  }, [selectedModelId, selectedObsId, selectedVariable])

  // 3. Trigger Comparison Action
  const handleRunComparison = useCallback(async () => {
    if (!selectedModelId || !selectedObsId || !selectedVariable) return

    setIsLoading(true)
    setErrorMessage(null)

    try {
      const result = await executeComparison({
        model_dataset_id: selectedModelId,
        observation_dataset_id: selectedObsId,
        variable: selectedVariable,
        spatial_tolerance_deg: spatialTol,
        depth_tolerance_m: depthTol,
        time_tolerance_hours: timeTol,
      })

      setComparisonResult(result)
      if (result.matched_records && result.matched_records.length > 0) {
        setSelectedMatchPoint(result.matched_records[0])
      } else {
        setSelectedMatchPoint(null)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Comparison calculation failed'
      setErrorMessage(msg)
    } finally {
      setIsLoading(false)
    }
  }, [selectedModelId, selectedObsId, selectedVariable, spatialTol, depthTol, timeTol])

  // Auto-run initial comparison when datasets are ready
  useEffect(() => {
    if (selectedModelId && selectedObsId && !comparisonResult && !isLoading) {
      handleRunComparison()
    }
  }, [selectedModelId, selectedObsId, comparisonResult, isLoading, handleRunComparison])

  // 4. Handle Uploaded Dataset Ingestion
  const handleDatasetUploaded = (newDs: ComparisonDatasetOption) => {
    if (uploadModalType === 'model') {
      setCatalog((prev) => ({ ...prev, models: [newDs, ...prev.models] }))
      setSelectedModelId(newDs.id)
    } else {
      setCatalog((prev) => ({ ...prev, observations: [newDs, ...prev.observations] }))
      setSelectedObsId(newDs.id)
    }
    setUploadModalType(null)
  }

  // 5. Highlight & Focus Observation on 3D Viewport
  const handleSelectPoint = (pt: MatchedRecord) => {
    setSelectedMatchPoint(pt)
    const [x, y, z] = latLonToVec3(pt.latitude, pt.longitude, GLOBE_RADIUS + 0.9)
    const [tx, ty, tz] = latLonToVec3(pt.latitude, pt.longitude, GLOBE_RADIUS)
    setNavTarget({ position: [x, y, z], target: [tx, ty, tz] })
  }

  const activeVarDef = VARIABLE_DEFINITIONS.find((v) => v.id === selectedVariable) || VARIABLE_DEFINITIONS[0]
  const unit = comparisonResult?.unit || activeVarDef.unit

  // Current selected model & observation meta
  const currentModel = catalog.models.find((m) => m.id === selectedModelId)
  const currentObs = catalog.observations.find((o) => o.id === selectedObsId)

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[#010610] text-slate-100 font-sans selection:bg-cyan-500 selection:text-black">
      {/* ── Top Command Bar ────────────────────────────────────────────── */}
      <header className="px-4 py-3 border-b border-white/10 bg-[#030d1a]/90 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
            <Scale size={18} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white font-mono">Model vs Observation Comparison</h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                Spatiotemporal Validation Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Residual discrepancy quantification (Model − Observation) matching NetCDF models with in-situ profiles
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShow3DViewport((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs border transition-all ${
              show3DViewport
                ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Eye size={13} />
            <span>{show3DViewport ? '3D Sync: ON' : '3D Sync: OFF'}</span>
          </button>
        </div>
      </header>

      {/* ── Main Workspace Body ────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 w-full">
        {/* ── STEP WORKFLOW PANEL ───────────────────────────────────────── */}
        <div className="p-5 rounded-2xl bg-[#030d1a] border border-white/10 shadow-2xl space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* STEP 1: Select Model Dataset */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase font-mono text-slate-400 font-bold flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[9px] font-bold">1</span>
                  Select Model Dataset
                </label>
                <button
                  onClick={() => setUploadModalType('model')}
                  className="text-[10px] font-mono text-cyan-300 hover:text-cyan-200 flex items-center gap-1 underline"
                >
                  <Upload size={10} />
                  <span>Upload Model File</span>
                </button>
              </div>
              <select
                value={selectedModelId}
                onChange={(e) => setSelectedModelId(e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl bg-[#020b18] border border-white/15 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
              >
                {catalog.models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.format}) {m.is_uploaded ? '· [Uploaded]' : ''}
                  </option>
                ))}
              </select>
              {currentModel && (
                <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
                  <span>Provider: {currentModel.provider}</span>
                  <span className="text-cyan-400">{currentModel.format}</span>
                </div>
              )}
            </div>

            {/* STEP 2: Select Observation Dataset */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase font-mono text-slate-400 font-bold flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[9px] font-bold">2</span>
                  Select Observation Dataset
                </label>
                <button
                  onClick={() => setUploadModalType('observation')}
                  className="text-[10px] font-mono text-emerald-300 hover:text-emerald-200 flex items-center gap-1 underline"
                >
                  <Upload size={10} />
                  <span>Upload Observation File</span>
                </button>
              </div>
              <select
                value={selectedObsId}
                onChange={(e) => setSelectedObsId(e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl bg-[#020b18] border border-white/15 text-xs font-mono text-white focus:outline-none focus:border-emerald-400"
              >
                {catalog.observations.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} ({o.format}) {o.is_uploaded ? '· [Uploaded]' : ''}
                  </option>
                ))}
              </select>
              {currentObs && (
                <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
                  <span>Source: {currentObs.provider}</span>
                  <span className="text-emerald-400">{currentObs.format}</span>
                </div>
              )}
            </div>

            {/* STEP 3: Select Target Variable */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-mono text-slate-400 font-bold flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center text-[9px] font-bold">3</span>
                Select Variable
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {VARIABLE_DEFINITIONS.filter((v) =>
                  availableVariables.length === 0 || availableVariables.includes(v.id) || v.id === 'temperature'
                ).map((v) => {
                  const isSelected = selectedVariable === v.id
                  return (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariable(v.id)}
                      className={`py-2 px-2.5 rounded-lg text-xs font-mono font-bold border transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-md'
                          : 'bg-black/30 border-white/10 text-slate-400 hover:bg-white/5 hover:text-slate-200'
                      }`}
                    >
                      <span className="flex items-center gap-1">
                        <span>{v.icon}</span>
                        <span className="truncate">{v.label}</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-normal">{v.unit}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Action Row & Matching Tolerances Toggle */}
          <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => setShowTolerances((s) => !s)}
              className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors"
            >
              <Sliders size={13} className="text-cyan-400" />
              <span>Matching Tolerances</span>
              <span className="text-[10px] text-slate-500">(±{spatialTol}°, ±{depthTol}m, ±{timeTol}h)</span>
              {showTolerances ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>

            {/* STEP 4: Compare Button */}
            <button
              onClick={handleRunComparison}
              disabled={isLoading || !selectedModelId || !selectedObsId}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-black font-mono font-bold text-xs shadow-lg shadow-cyan-950/60 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Matching Spatiotemporal Grid...</span>
                </>
              ) : (
                <>
                  <Scale size={14} />
                  <span>Execute Model vs Observation Comparison</span>
                </>
              )}
            </button>
          </div>

          {/* Collapsible Tolerance Configuration */}
          {showTolerances && (
            <div className="p-4 rounded-xl bg-black/40 border border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs animate-fade-in">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Spatial Radius (Δdeg)</span>
                  <span className="text-cyan-300 font-bold">±{spatialTol}° (~{(spatialTol * 111).toFixed(0)} km)</span>
                </div>
                <input
                  type="range"
                  min={0.05}
                  max={2.0}
                  step={0.05}
                  value={spatialTol}
                  onChange={(e) => setSpatialTol(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Depth Window (Δdepth)</span>
                  <span className="text-cyan-300 font-bold">±{depthTol} m</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={100}
                  step={5}
                  value={depthTol}
                  onChange={(e) => setDepthTol(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Time Window (Δtime)</span>
                  <span className="text-cyan-300 font-bold">±{timeTol} h</span>
                </div>
                <input
                  type="range"
                  min={6}
                  max={168}
                  step={6}
                  value={timeTol}
                  onChange={(e) => setTimeTol(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>
            </div>
          )}
        </div>

        {/* Error Notice if any */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-300 font-mono text-xs flex items-center gap-3 animate-fade-in">
            <AlertTriangle size={18} className="flex-shrink-0" />
            <div>
              <strong className="block font-bold">Comparison Incompatibility Error:</strong>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* ── STEP 5: COMPARISON RESULTS SECTION ──────────────────────── */}
        {comparisonResult && comparisonResult.matched && (
          <div className="space-y-6 animate-fade-in">
            {/* Top Row: Compact KPI Panel & Status Indicator */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* 1. Model Prediction */}
              <div className="p-4 rounded-2xl bg-[#030d1a] border border-cyan-500/30 shadow-lg">
                <div className="text-[10px] font-mono text-cyan-400 uppercase font-bold mb-1">
                  Model Prediction (M)
                </div>
                <div className="flex items-baseline gap-1 font-mono">
                  <span className="text-3xl font-black text-white">
                    {selectedMatchPoint ? selectedMatchPoint.model_value : comparisonResult.metrics.mean_model_value ?? '--'}
                  </span>
                  <span className="text-xs text-slate-400">{unit}</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-1 truncate">
                  {selectedMatchPoint ? `At Depth: ${selectedMatchPoint.depth}m` : 'Mean across column'}
                </div>
              </div>

              {/* 2. Observed Ground Truth */}
              <div className="p-4 rounded-2xl bg-[#030d1a] border border-emerald-500/30 shadow-lg">
                <div className="text-[10px] font-mono text-emerald-400 uppercase font-bold mb-1">
                  Observed In-Situ (O)
                </div>
                <div className="flex items-baseline gap-1 font-mono">
                  <span className="text-3xl font-black text-white">
                    {selectedMatchPoint ? selectedMatchPoint.obs_value : comparisonResult.metrics.mean_obs_value ?? '--'}
                  </span>
                  <span className="text-xs text-slate-400">{unit}</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-1 truncate">
                  {selectedMatchPoint ? `${selectedMatchPoint.platform_id}` : 'In-situ ground truth'}
                </div>
              </div>

              {/* 3. Residual (Model - Observed) */}
              <div
                className={`p-4 rounded-2xl bg-[#030d1a] border shadow-lg ${
                  (selectedMatchPoint ? selectedMatchPoint.residual : comparisonResult.metrics.mean_bias ?? 0) >= 0
                    ? 'border-cyan-500/30'
                    : 'border-amber-500/30'
                }`}
              >
                <div className="text-[10px] font-mono text-slate-400 uppercase font-bold mb-1">
                  Residual (Model − Obs)
                </div>
                <div className="flex items-baseline gap-1 font-mono">
                  <span
                    className={`text-3xl font-black ${
                      (selectedMatchPoint ? selectedMatchPoint.residual : comparisonResult.metrics.mean_bias ?? 0) >= 0
                        ? 'text-cyan-300'
                        : 'text-amber-300'
                    }`}
                  >
                    {selectedMatchPoint
                      ? selectedMatchPoint.residual > 0
                        ? `+${selectedMatchPoint.residual}`
                        : selectedMatchPoint.residual
                      : comparisonResult.metrics.mean_bias !== null
                      ? comparisonResult.metrics.mean_bias > 0
                        ? `+${comparisonResult.metrics.mean_bias}`
                        : comparisonResult.metrics.mean_bias
                      : '--'}
                  </span>
                  <span className="text-xs text-slate-400">{unit}</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-1">
                  Abs Error: {selectedMatchPoint ? selectedMatchPoint.absolute_error : comparisonResult.metrics.mae ?? '--'} {unit}
                </div>
              </div>

              {/* 4. Column Statistical Metrics */}
              <div className="p-4 rounded-2xl bg-[#030d1a] border border-purple-500/30 shadow-lg">
                <div className="text-[10px] font-mono text-purple-400 uppercase font-bold mb-1">
                  Column Verification
                </div>
                <div className="flex items-baseline justify-between font-mono mt-1">
                  <div>
                    <span className="text-[9px] text-slate-400 block">MAE</span>
                    <span className="text-lg font-bold text-white">
                      {comparisonResult.metrics.mae ?? '--'} {unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block">RMSE</span>
                    <span className="text-lg font-bold text-white">
                      {comparisonResult.metrics.rmse ?? '--'} {unit}
                    </span>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-1 flex justify-between">
                  <span>Matched: {comparisonResult.metrics.matched_count}</span>
                  {comparisonResult.metrics.correlation !== null && (
                    <span>r = {comparisonResult.metrics.correlation}</span>
                  )}
                </div>
              </div>

              {/* 5. Scientific Accuracy Status Indicator */}
              <div
                className={`p-4 rounded-2xl bg-[#030d1a] border shadow-lg flex flex-col justify-between ${
                  comparisonResult.status.color === 'emerald'
                    ? 'border-emerald-500/40 bg-emerald-950/20'
                    : comparisonResult.status.color === 'amber'
                    ? 'border-amber-500/40 bg-amber-950/20'
                    : 'border-red-500/40 bg-red-950/20'
                }`}
              >
                <div>
                  <div className="text-[10px] font-mono uppercase font-bold text-slate-400 mb-1">
                    Accuracy Classification
                  </div>
                  <div className="flex items-center gap-2 font-mono mt-1">
                    <span className="text-2xl">{comparisonResult.status.icon}</span>
                    <span
                      className={`text-sm font-black uppercase ${
                        comparisonResult.status.color === 'emerald'
                          ? 'text-emerald-300'
                          : comparisonResult.status.color === 'amber'
                          ? 'text-amber-300'
                          : 'text-red-300'
                      }`}
                    >
                      {comparisonResult.status.status}
                    </span>
                  </div>
                </div>
                <div className="text-[9px] text-slate-400 font-mono mt-2 leading-tight">
                  Application-defined threshold (MAE &le;{' '}
                  {comparisonResult.status.thresholds?.good_max ?? 0.5} {unit})
                </div>
              </div>
            </div>

            {/* Visualizations Grid: Profile Chart + Residual Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Profile Comparison Chart */}
              <div className="p-5 rounded-2xl bg-[#030d1a] border border-white/10 shadow-xl flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                  <div className="flex items-center gap-2">
                    <Activity size={18} className="text-cyan-400" />
                    <h2 className="text-sm font-bold font-mono text-white">
                      Paired Vertical Profile: Model Curve vs In-Situ Points
                    </h2>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    Depth 0m to {comparisonResult.profile_series[comparisonResult.profile_series.length - 1]?.depth || 1000}m
                  </span>
                </div>
                <div className="flex-1 bg-[#020b18] p-3 rounded-xl border border-white/5">
                  <ComparisonProfileChart
                    data={comparisonResult.profile_series}
                    variable={selectedVariable}
                    unit={unit}
                    modelName={currentModel?.name || 'Model'}
                    obsName={currentObs?.name || 'In-Situ'}
                  />
                </div>
              </div>

              {/* Residual Diverging Chart */}
              <div className="p-5 rounded-2xl bg-[#030d1a] border border-white/10 shadow-xl flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                  <div className="flex items-center gap-2">
                    <Waves size={18} className="text-amber-400" />
                    <h2 className="text-sm font-bold font-mono text-white">
                      Residual Discrepancy (Model − Observed) vs Depth
                    </h2>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    Zero-centered Diverging Scale
                  </span>
                </div>
                <div className="flex-1 bg-[#020b18] p-3 rounded-xl border border-white/5">
                  <ResidualChart
                    data={comparisonResult.residual_series}
                    variable={selectedVariable}
                    unit={unit}
                  />
                </div>
              </div>
            </div>

            {/* Matched Points Table & 3D Spatial Synchronization */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Matched Records Table */}
              <div className="lg:col-span-2 p-5 rounded-2xl bg-[#030d1a] border border-white/10 shadow-xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-emerald-400" />
                    <h3 className="text-xs font-bold font-mono text-white">
                      Matched Observation Stations & Depth Points ({comparisonResult.matched_records.length} records)
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">Click any row to synchronize with 3D Globe</span>
                </div>

                <div className="overflow-x-auto max-h-72 overflow-y-auto">
                  <table className="w-full text-left font-mono text-[11px] border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400 bg-white/2 sticky top-0 backdrop-blur-md">
                        <th className="py-2 px-3">Match ID</th>
                        <th className="py-2 px-2">Platform</th>
                        <th className="py-2 px-2">Coords (Lat, Lon)</th>
                        <th className="py-2 px-2">Depth</th>
                        <th className="py-2 px-2 text-cyan-300">Model</th>
                        <th className="py-2 px-2 text-emerald-300">Observed</th>
                        <th className="py-2 px-3 text-right">Residual</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonResult.matched_records.map((row) => {
                        const isSelected = selectedMatchPoint?.match_id === row.match_id
                        return (
                          <tr
                            key={row.match_id}
                            onClick={() => handleSelectPoint(row)}
                            className={`border-b border-white/5 cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-cyan-950/60 text-white font-bold border-cyan-400/40'
                                : 'hover:bg-white/5 text-slate-300'
                            }`}
                          >
                            <td className="py-1.5 px-3 text-cyan-400">{row.match_id}</td>
                            <td className="py-1.5 px-2">{row.platform_id}</td>
                            <td className="py-1.5 px-2 text-slate-400">
                              {row.latitude.toFixed(2)}°N, {row.longitude.toFixed(2)}°E
                            </td>
                            <td className="py-1.5 px-2 text-slate-400">{row.depth} m</td>
                            <td className="py-1.5 px-2 text-cyan-200">{row.model_value} {unit}</td>
                            <td className="py-1.5 px-2 text-emerald-200">{row.obs_value} {unit}</td>
                            <td className="py-1.5 px-3 text-right">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  row.residual === 0
                                    ? 'text-slate-400 bg-white/5'
                                    : row.residual > 0
                                    ? 'text-cyan-300 bg-cyan-500/15'
                                    : 'text-amber-300 bg-amber-500/15'
                                }`}
                              >
                                {row.residual > 0 ? `+${row.residual}` : row.residual}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right 1 Col: Synchronized 3D Observation Viewer */}
              {show3DViewport && (
                <div className="p-5 rounded-2xl bg-[#030d1a] border border-cyan-500/30 shadow-xl flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                      <h3 className="text-xs font-bold font-mono text-white">3D Spatial Inspection</h3>
                    </div>
                    {selectedMatchPoint && (
                      <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded-full">
                        {selectedMatchPoint.depth}m Depth
                      </span>
                    )}
                  </div>

                  {/* Embedded 3D Scene Viewport */}
                  <div className="h-48 w-full rounded-xl overflow-hidden relative border border-white/10 bg-black">
                    <OceanScene
                      selectedVariable={selectedVariable}
                      selectedDepth={selectedMatchPoint ? selectedMatchPoint.depth : 0}
                      selectedTimeIndex={2}
                      selectedTime={{ index: 2, label: '12:00', isoString: '2026-08-28T12:00:00Z', dateLabel: '28 Aug 2026' }}
                      selectedObservationId={selectedMatchPoint?.platform_id || null}
                      observations={[
                        {
                          id: selectedMatchPoint?.platform_id || 'ARGO-2903334',
                          name: selectedMatchPoint?.platform_id || 'Argo Float',
                          type: 'argo',
                          platformId: selectedMatchPoint?.platform_id || 'WMO-2903334',
                          latitude: selectedMatchPoint ? selectedMatchPoint.latitude : 14.12,
                          longitude: selectedMatchPoint ? selectedMatchPoint.longitude : 68.45,
                          timestamp: selectedMatchPoint?.timestamp || '2026-08-28T06:00:00Z',
                          currentDepth: selectedMatchPoint ? selectedMatchPoint.depth : 5.0,
                          temperature: selectedMatchPoint?.obs_value || 28.84,
                          salinity: 36.12,
                          chlorophyll: 0.22,
                          region: 'Arabian Sea',
                          isDemo: false,
                          qc_flag: 1,
                        },
                      ]}
                      visibleLayers={{
                        oceanModel: true,
                        argo: true,
                        glider: true,
                        ctd: true,
                        depthSlice: true,
                        isosurface: false,
                        currentVectors: false,
                      }}
                      autoRotate={false}
                      navTarget={navTarget}
                      onNavComplete={() => setNavTarget(null)}
                      onSelectObservation={() => {}}
                    />
                  </div>

                  {/* Selected Telemetry Card */}
                  {selectedMatchPoint ? (
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5 font-mono text-[10px] space-y-1">
                      <div className="flex justify-between text-slate-400">
                        <span>Platform:</span>
                        <strong className="text-white">{selectedMatchPoint.platform_id}</strong>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Coordinates:</span>
                        <strong className="text-cyan-300">
                          {selectedMatchPoint.latitude.toFixed(2)}°N, {selectedMatchPoint.longitude.toFixed(2)}°E
                        </strong>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Model Prediction:</span>
                        <strong className="text-cyan-300">{selectedMatchPoint.model_value} {unit}</strong>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Observed Value:</span>
                        <strong className="text-emerald-300">{selectedMatchPoint.obs_value} {unit}</strong>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-white/10">
                        <span>Residual (M − O):</span>
                        <strong className={selectedMatchPoint.residual >= 0 ? 'text-cyan-400' : 'text-amber-400'}>
                          {selectedMatchPoint.residual > 0 ? `+${selectedMatchPoint.residual}` : selectedMatchPoint.residual} {unit}
                        </strong>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-3 text-[10px] font-mono text-slate-500">
                      Select a matched observation row to inspect in 3D.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty / Unmatched State */}
        {comparisonResult && !comparisonResult.matched && (
          <div className="p-10 rounded-2xl bg-[#030d1a] border border-amber-500/30 text-center space-y-3 font-mono animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-400 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-sm font-bold text-white">No Matching Observations Found</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              {comparisonResult.message || 'No observations matched within current spatial, depth, and temporal tolerances.'}
            </p>
            <div className="pt-2">
              <button
                onClick={() => {
                  setSpatialTol(1.0)
                  setDepthTol(50.0)
                  setTimeTol(72.0)
                  setShowTolerances(true)
                }}
                className="px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 text-xs font-bold hover:bg-cyan-500/30 transition-all"
              >
                Expand Matching Tolerances (±1.0°, ±50m, ±72h)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Multi-Format Upload Modal ──────────────────────────────────── */}
      {uploadModalType && (
        <ComparisonUploadModal
          isOpen={true}
          onClose={() => setUploadModalType(null)}
          datasetType={uploadModalType}
          onDatasetUploaded={handleDatasetUploaded}
        />
      )}
    </div>
  )
}
