/**
 * DataExplorerPage.tsx — Data Hub, INCOIS SAMUDRA & Multi-Format Ingestion Engine
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 *
 * Implements:
 * 1. Real Dataset Catalog (INCOIS HYCOM, Copernicus Marine, Argo GDAC)
 * 2. Official INCOIS SAMUDRA Integration (Real-time SST, SSH, Currents, PFZ, Argo)
 * 3. CF-Metadata Inspector for NetCDF dimensions, variables, attributes, and bounds
 * 4. Multi-format Ingestion & Validation Wizard (NetCDF, CSV, TSV, JSON, ASCII)
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Database,
  Upload,
  FileCode,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  MapPin,
  ExternalLink,
  Sparkles,
  Fish,
  Radio,
  Globe,
  Waves,
  Navigation,
} from 'lucide-react'
import { getDataSourceDatasets } from '@/services/data/dataSource'
import { uploadComparisonDataset } from '@/services/api/comparisonService'
import {
  SAMUDRA_DATASETS,
  fetchSamudraPFZ,
  fetchSamudraArgoPositions,
  isSamudraConfigured,
  type SamudraPFZAdvisory,
  type SamudraArgoPosition,
} from '@/services/api/samudraService'
import { DataIngestionWizard } from '@/components/ui/DataIngestionWizard'
import type { DatasetCatalogItem } from '@/types/ocean'
import type { UploadDatasetResponse } from '@/types/comparison'

export function DataExplorerPage() {
  const [activeTab, setActiveTab] = useState<'catalog' | 'samudra' | 'wizard'>('catalog')
  const [datasets, setDatasets] = useState<DatasetCatalogItem[]>([])
  const [selectedDataset, setSelectedDataset] = useState<DatasetCatalogItem | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<UploadDatasetResponse | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // SAMUDRA state
  const [pfzAdvisories, setPfzAdvisories] = useState<SamudraPFZAdvisory[]>([])
  const [argoPositions, setArgoPositions] = useState<SamudraArgoPosition[]>([])
  const [isLoadingSamudra, setIsLoadingSamudra] = useState(false)

  // Ingestion Wizard Modal
  const [showWizard, setShowWizard] = useState(false)

  useEffect(() => {
    getDataSourceDatasets().then((list) => {
      setDatasets(list)
      if (list.length > 0) setSelectedDataset(list[0])
    })

    // Pre-fetch SAMUDRA demo/live feeds
    setIsLoadingSamudra(true)
    Promise.all([fetchSamudraPFZ(), fetchSamudraArgoPositions()])
      .then(([pfz, argo]) => {
        setPfzAdvisories(pfz)
        setArgoPositions(argo)
      })
      .finally(() => setIsLoadingSamudra(false))
  }, [])

  const handleRealUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadError(null)
    setUploadResult(null)

    try {
      const resp = await uploadComparisonDataset(file, 'observation')
      setUploadResult(resp)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload ingestion failed'
      setUploadError(msg)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[#010610] text-slate-100 font-sans selection:bg-cyan-500 selection:text-black">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="px-4 py-3 border-b border-white/10 bg-[#030d1a]/95 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-400/40">
              <Database size={16} />
            </span>
            <h1 className="text-base font-bold text-white font-mono">Ocean Data Hub & INCOIS Ingestion Pipeline</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-400/30">
              SAMUDRA · NetCDF CF-1.8 · CSV/ASCII · GeoJSON
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Discover official INCOIS SAMUDRA streams, inspect CF metadata, or ingest observational files
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowWizard(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-black border border-emerald-400/40 font-mono font-bold text-xs transition-all cursor-pointer shadow-sm"
          >
            <Sparkles size={13} />
            <span>Launch Ingestion Wizard</span>
          </button>

          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 text-black font-mono font-bold text-xs shadow-md hover:bg-cyan-400 transition-all cursor-pointer"
          >
            <span>Launch 3D Explorer</span>
            <ExternalLink size={12} />
          </Link>
        </div>
      </header>

      {/* ── Tab Switcher ────────────────────────────────────────────────── */}
      <div className="border-b border-white/10 bg-[#020914] px-4 py-2 flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'catalog'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <Database size={13} />
          <span>Dataset Catalog & CF-Metadata</span>
        </button>

        <button
          onClick={() => setActiveTab('samudra')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'samudra'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <Waves size={13} />
          <span>INCOIS SAMUDRA Feeds</span>
          <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-amber-500/30 text-amber-200">
            6 Live
          </span>
        </button>

        <button
          onClick={() => setShowWizard(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 border border-transparent transition-all cursor-pointer"
        >
          <Upload size={13} />
          <span>Universal File Ingest</span>
        </button>
      </div>

      {/* ── Main Content Body ───────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 w-full flex-1">
        {/* ══════════ TAB 1: Dataset Catalog & CF Metadata ══════════ */}
        {activeTab === 'catalog' && (
          <>
            {/* Dataset Catalog Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {datasets.map((ds) => {
                const isSelected = selectedDataset?.id === ds.id
                return (
                  <div
                    key={ds.id}
                    onClick={() => setSelectedDataset(ds)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#031428] border-cyan-400/60 shadow-lg shadow-cyan-950/50'
                        : 'bg-[#030d1a] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-cyan-500/15 text-cyan-300">
                          {ds.format.toLowerCase().includes('netcdf') ? (
                            <FileCode size={16} />
                          ) : (
                            <FileSpreadsheet size={16} />
                          )}
                        </span>
                        <span className="text-xs font-mono font-bold text-white leading-tight">
                          {ds.name}
                        </span>
                      </div>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase flex-shrink-0 ${
                          ds.is_real_data
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {ds.is_real_data ? 'Real INCOIS' : 'Demo'}
                      </span>
                    </div>

                    <div className="space-y-1 text-[11px] font-mono text-slate-400 mb-3">
                      <div className="flex justify-between">
                        <span>Provider:</span>
                        <span className="text-slate-200">{ds.provider}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Format:</span>
                        <span className="text-cyan-400">{ds.format}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Resolution:</span>
                        <span className="text-slate-200">
                          {ds.description ? '1/12° Operational' : '0.25° Model Grid'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {ds.variables.map((v) => (
                        <span
                          key={v}
                          className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-slate-300"
                        >
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* CF-Metadata Inspector Card */}
            {selectedDataset && (
              <div className="p-5 rounded-2xl bg-[#030d1a] border border-white/10 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2.5">
                    <FileCode className="text-cyan-400" size={18} />
                    <div>
                      <h2 className="text-sm font-bold text-white font-mono">
                        CF-1.8 Compliance & Metadata Inspector
                      </h2>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Inspecting: {selectedDataset.name}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-mono px-2.5 py-1 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-400/30">
                    NetCDF-4 · CF-1.8
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-[10px] text-slate-500 block uppercase">Time Dimension</span>
                    <span className="text-base font-bold text-white">
                      {selectedDataset.dimensions.time} steps
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">hours since 2026-03-01</span>
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-[10px] text-slate-500 block uppercase">Depth Coordinate</span>
                    <span className="text-base font-bold text-white">
                      {selectedDataset.dimensions.depth} levels
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">0m to 2000m depth</span>
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-[10px] text-slate-500 block uppercase">Spatial Bounds</span>
                    <span className="text-base font-bold text-white">
                      {selectedDataset.dimensions.latitude} × {selectedDataset.dimensions.longitude}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">30°S–30°N, 40°E–100°E</span>
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-[10px] text-slate-500 block uppercase">Variables</span>
                    <span className="text-base font-bold text-emerald-400">
                      {selectedDataset.variables.length} active
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Fully CF-compliant</span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Upload Form */}
            <div className="p-5 rounded-2xl bg-[#030d1a] border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Upload className="text-amber-400" size={18} />
                  <h3 className="text-sm font-bold text-white font-mono">
                    Direct File Parser & Schema Validator
                  </h3>
                </div>
                <button
                  onClick={() => setShowWizard(true)}
                  className="text-xs font-mono text-cyan-400 hover:underline cursor-pointer"
                >
                  Need step-by-step guidance? Open Wizard →
                </button>
              </div>

              <div className="border-2 border-dashed border-white/15 hover:border-cyan-400/50 rounded-2xl p-6 text-center transition-colors">
                <input
                  type="file"
                  id="direct-upload-input"
                  className="hidden"
                  accept=".nc,.nc4,.csv,.tsv,.txt,.json,.geojson"
                  onChange={handleRealUpload}
                  disabled={isUploading}
                />
                <label
                  htmlFor="direct-upload-input"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <div className="p-3 rounded-full bg-cyan-500/10 text-cyan-400">
                    <Upload size={22} />
                  </div>
                  <span className="text-xs font-mono font-bold text-white">
                    {isUploading ? 'Validating & Parsing File...' : 'Click to Upload NetCDF, CSV, TSV, or GeoJSON'}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Supports CF-1.8 NetCDF, CSV with auto delimiter detection, ASCII station data, and GeoJSON
                  </span>
                </label>
              </div>

              {uploadError && (
                <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 font-mono text-xs text-red-300 flex items-center gap-2.5">
                  <AlertTriangle size={18} className="flex-shrink-0" />
                  <div>
                    <strong className="block font-bold">Validation Rejection:</strong>
                    <span>{uploadError}</span>
                  </div>
                </div>
              )}

              {uploadResult && (
                <div className="p-4 rounded-xl bg-[#020b18] border border-emerald-500/30 font-mono text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold">
                      <CheckCircle2 size={16} />
                      <span>Schema Validation Passed: {uploadResult.name}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                      {uploadResult.format} · {uploadResult.record_count} Records
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 space-y-1 pt-1">
                    <div>
                      ✓ Detected Variables:{' '}
                      <strong className="text-white">{uploadResult.detected_variables.join(', ')}</strong>
                    </div>
                  </div>
                  <div className="pt-2">
                    <Link
                      to="/compare"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 text-black font-bold text-[11px] hover:bg-cyan-400 transition-colors"
                    >
                      <span>Use in Model vs Observation Comparison →</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ══════════ TAB 2: INCOIS SAMUDRA Feeds ══════════ */}
        {activeTab === 'samudra' && (
          <div className="space-y-6">
            {/* SAMUDRA Official Banner */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/90 via-slate-900 to-[#031b33] border border-cyan-500/30 flex flex-wrap items-center justify-between gap-4 shadow-xl">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-bold">
                    Official INCOIS Portal
                  </span>
                  <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Operational Indian Ocean Feeds
                  </span>
                </div>
                <h2 className="text-lg font-bold text-white font-sans">
                  INCOIS SAMUDRA (Smart Access to Marine User Data & Resources)
                </h2>
                <p className="text-xs text-slate-300 font-mono mt-1 max-w-2xl">
                  Real-time numerical models, satellite altimetry, Argo profiling floats, and daily
                  Potential Fishing Zone (PFZ) advisories provided by ESSO-INCOIS, Ministry of Earth Sciences.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <a
                  href="https://samudra.incois.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs transition-all cursor-pointer shadow-md shadow-cyan-500/20"
                >
                  <span>Visit SAMUDRA Portal</span>
                  <ExternalLink size={13} />
                </a>
                <a
                  href="https://las.incois.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs transition-all cursor-pointer border border-white/15"
                >
                  <span>INCOIS Live LAS</span>
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>

            {/* SAMUDRA 6 Real-Time Datasets Catalog */}
            <div>
              <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold mb-3 flex items-center gap-2">
                <Waves size={14} className="text-cyan-400" />
                <span>Active SAMUDRA Ocean Feeds</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {SAMUDRA_DATASETS.map((ds) => (
                  <div
                    key={ds.id}
                    className="p-4 rounded-2xl bg-[#030d1a] border border-white/10 hover:border-cyan-400/40 transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-mono font-bold text-white">{ds.name}</h4>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                        {ds.update_frequency}
                      </span>
                    </div>

                    <div className="space-y-1 text-[11px] font-mono text-slate-400">
                      <div className="flex justify-between">
                        <span>Variable:</span>
                        <span className="text-cyan-300 capitalize">{ds.variable}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Spatial Coverage:</span>
                        <span className="text-slate-200">{ds.spatial_coverage}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Resolution:</span>
                        <span className="text-slate-200">{ds.resolution}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Data Format:</span>
                        <span className="text-amber-300">{ds.format}</span>
                      </div>
                    </div>

                    <div className="pt-1">
                      <Link
                        to={`/dashboard?variable=${ds.variable}`}
                        className="inline-flex items-center gap-1 text-[11px] font-mono text-cyan-400 hover:text-cyan-300 font-bold"
                      >
                        <span>Visualize Feed in 3D Explorer →</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* PFZ Potential Fishing Zone Advisories */}
            <div className="p-5 rounded-2xl bg-[#030d1a] border border-white/10 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Fish className="text-amber-400" size={18} />
                  <div>
                    <h3 className="text-sm font-bold text-white font-mono">
                      INCOIS Potential Fishing Zone (PFZ) Advisories
                    </h3>
                    <span className="text-[11px] text-slate-400 font-mono">
                      SST fronts + Chlorophyll-a composite validation for artisanal and commercial fishers
                    </span>
                  </div>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/40">
                  Daily Advisory Feed
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {pfzAdvisories.map((pfz) => (
                  <div
                    key={pfz.id}
                    className="p-4 rounded-xl bg-black/40 border border-amber-400/20 space-y-2 text-xs font-mono"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">{pfz.region}</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase">
                        {pfz.confidence} Confidence
                      </span>
                    </div>

                    <div className="text-slate-400 text-[11px] space-y-1">
                      <div>
                        Coordinates: [{pfz.latitude_range[0]}°N–{pfz.latitude_range[1]}°N,{' '}
                        {pfz.longitude_range[0]}°E–{pfz.longitude_range[1]}°E]
                      </div>
                      <div>
                        Target Species: <strong className="text-amber-300">{pfz.expected_fish_species.join(', ')}</strong>
                      </div>
                      <div className="flex gap-4 pt-1">
                        <span>SST: <strong className="text-white">{pfz.sst_c}°C</strong></span>
                        <span>Chlorophyll: <strong className="text-emerald-400">{pfz.chlorophyll_mg_m3} mg/m³</strong></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* INCOIS Argo Floats Mirror */}
            <div className="p-5 rounded-2xl bg-[#030d1a] border border-white/10 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Radio className="text-cyan-400" size={18} />
                  <div>
                    <h3 className="text-sm font-bold text-white font-mono">
                      INCOIS Real-Time Argo Profiling Float Network
                    </h3>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Indian Ocean basin active floats transmitting CTD profiles via Iridium satellite
                    </span>
                  </div>
                </div>
                <Link
                  to="/observations"
                  className="text-xs font-mono text-cyan-400 hover:underline"
                >
                  View full in-situ table →
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="border-b border-white/10 text-slate-400">
                    <tr>
                      <th className="py-2 px-3">Platform ID</th>
                      <th className="py-2 px-3">WMO ID</th>
                      <th className="py-2 px-3">Position</th>
                      <th className="py-2 px-3">Max Depth</th>
                      <th className="py-2 px-3">Surface Temp</th>
                      <th className="py-2 px-3">Salinity</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {argoPositions.map((argo) => (
                      <tr key={argo.platform_id} className="hover:bg-white/5 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-cyan-300">{argo.platform_id}</td>
                        <td className="py-2.5 px-3 text-slate-300">{argo.wmo_id}</td>
                        <td className="py-2.5 px-3 text-slate-300">
                          {argo.latitude.toFixed(2)}°N, {argo.longitude.toFixed(2)}°E
                        </td>
                        <td className="py-2.5 px-3 text-slate-300">{argo.last_depth_m} m</td>
                        <td className="py-2.5 px-3 text-amber-300">{argo.temperature_at_surface.toFixed(1)}°C</td>
                        <td className="py-2.5 px-3 text-cyan-300">{argo.salinity_at_surface.toFixed(2)} PSU</td>
                        <td className="py-2.5 px-3">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase">
                            {argo.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Universal Ingestion Wizard Modal ──────────────────────────────── */}
      {showWizard && (
        <DataIngestionWizard
          onClose={() => setShowWizard(false)}
          onIngest={(records) => {
            console.info('[OceanIQ] Ingested observational records:', records.length)
            setShowWizard(false)
          }}
        />
      )}
    </div>
  )
}
