/**
 * ObservationsPage.tsx — Page 3: In-Situ Observation Explorer
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 *
 * Implements Concepts 9, 10, 11, 12:
 * - Unified Observation Model for Argo Floats, Gliders, CTD Casts, and BGC platforms
 * - Dynamic platform filtering, geospatial sorting, and status inspection
 * - Responsive vertical profile charts (Temperature, Salinity, Chlorophyll vs Depth)
 * - Deep linking to 3D Explorer (/dashboard) and Model Validation (/compare)
 */

import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Radio,
  Activity,
  Compass,
  Layers,
  Sparkles,
  ExternalLink,
  Search,
  Filter,
  BarChart2,
  Calendar,
  Waves,
  Scale,
  X,
} from 'lucide-react'
import { getObservations, type MockObservation } from '@/services/data/mockOceanData'
import { ObservationProfile } from '@/components/charts/ObservationProfile'
import { ExportPanel } from '@/components/ui/ExportPanel'
import { GraphBuilder } from '@/components/charts/GraphBuilder'

type PlatformFilter = 'all' | 'argo' | 'glider' | 'ctd' | 'bgc'

export function ObservationsPage() {
  const navigate = useNavigate()
  const [selectedType, setSelectedType] = useState<PlatformFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedObs, setSelectedObs] = useState<MockObservation | null>(null)
  const [showGraphBuilder, setShowGraphBuilder] = useState(false)

  const allObservations = useMemo(() => getObservations(), [])

  // Filter observations
  const filtered = useMemo(() => {
    return allObservations.filter((obs) => {
      const matchType = selectedType === 'all' || obs.type === selectedType
      const matchSearch =
        obs.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        obs.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (obs.platformName && obs.platformName.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchType && matchSearch
    })
  }, [allObservations, selectedType, searchQuery])

  // Count stats
  const stats = useMemo(() => {
    return {
      total: allObservations.length,
      argo: allObservations.filter((o) => o.type === 'argo').length,
      glider: allObservations.filter((o) => o.type === 'glider').length,
      ctd: allObservations.filter((o) => o.type === 'ctd').length,
      bgc: allObservations.filter((o) => o.type === 'bgc').length,
    }
  }, [allObservations])

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#010610] text-slate-100 font-sans selection:bg-cyan-500 selection:text-black">
      {/* ── Header Bar ──────────────────────────────────────────────────── */}
      <header className="px-4 py-3 border-b border-white/10 bg-[#030d1a]/90 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
              <Radio size={16} />
            </span>
            <h1 className="text-base font-bold text-white font-mono">In-Situ Observation Explorer</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-400/30">
              {filtered.length} Platforms Active
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Argo Profiling Floats · Underwater Autonomous Gliders · Shipborne CTD Casts · BGC Sensors
          </p>
        </div>

        {/* Search & Export Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Platform ID or WMO..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg bg-[#020b18] border border-white/10 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 w-48 sm:w-64"
            />
          </div>
          <ExportPanel
            observations={filtered}
            label={`Export (${filtered.length})`}
            onOpenGraphBuilder={() => setShowGraphBuilder(true)}
          />
        </div>
      </header>

      {/* Graph Builder Modal */}
      {showGraphBuilder && (
        <GraphBuilder
          observations={filtered}
          onClose={() => setShowGraphBuilder(false)}
        />
      )}

      {/* ── Main Content Split View ─────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left: Platform Filters & Catalog List */}
        <aside className="w-full md:w-[460px] lg:w-[500px] flex-shrink-0 border-r border-white/10 bg-[#020914] flex flex-col overflow-hidden">
          {/* Platform Type Filter Buttons */}
          <div className="p-2 border-b border-white/10 grid grid-cols-5 gap-1 font-mono text-xs flex-shrink-0">
            {[
              { id: 'all' as const, label: 'All', count: stats.total, color: 'text-white' },
              { id: 'argo' as const, label: 'Argo', count: stats.argo, color: 'text-cyan-300' },
              { id: 'glider' as const, label: 'Glider', count: stats.glider, color: 'text-emerald-300' },
              { id: 'ctd' as const, label: 'CTD', count: stats.ctd, color: 'text-amber-300' },
              { id: 'bgc' as const, label: 'BGC', count: stats.bgc, color: 'text-purple-300' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedType(f.id)}
                className={`py-1.5 px-1 rounded-lg text-center transition-all border ${
                  selectedType === f.id
                    ? 'bg-cyan-950/80 border-cyan-400/50 text-cyan-200 font-bold shadow-sm'
                    : 'bg-white/2 border-white/5 text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                <div className={`text-[11px] font-bold ${f.color}`}>{f.label}</div>
                <div className="text-[9px] text-slate-500">{f.count}</div>
              </button>
            ))}
          </div>

          {/* Platform List Cards */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
            {filtered.map((obs) => {
              const isSelected = selectedObs?.id === obs.id
              const isArgo = obs.type === 'argo'
              const isGlider = obs.type === 'glider'
              const isCtd = obs.type === 'ctd'

              return (
                <div
                  key={obs.id}
                  onClick={() => setSelectedObs(obs)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-950/60 border-cyan-400/60 shadow-lg shadow-cyan-950/50'
                      : 'bg-[#030d1a]/80 border-white/8 hover:border-white/20 hover:bg-[#041224]'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`p-1 rounded text-xs ${
                          isArgo
                            ? 'bg-cyan-500/20 text-cyan-300'
                            : isGlider
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : isCtd
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-purple-500/20 text-purple-300'
                        }`}
                      >
                        {isArgo ? <Radio size={13} /> : isGlider ? <Activity size={13} /> : <Waves size={13} />}
                      </span>
                      <div>
                        <span className="text-xs font-bold text-white font-mono">{obs.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono ml-2">ID: {obs.id}</span>
                      </div>
                    </div>

                    <span
                      className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded border font-semibold ${
                        obs.qualityFlag === 'good'
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      QC: {obs.qualityFlag}
                    </span>
                  </div>

                  {/* Coordinates & Depth */}
                  <div className="grid grid-cols-3 gap-1 text-[10px] font-mono text-slate-300 bg-black/25 p-1.5 rounded-lg mb-2">
                    <div>
                      <span className="text-slate-500 block text-[8px]">LAT/LON</span>
                      {obs.latitude.toFixed(2)}°N, {obs.longitude.toFixed(2)}°E
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[8px]">CURRENT DEPTH</span>
                      <span className="text-cyan-300 font-bold">{Math.round(obs.currentDepth)}m</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[8px]">MAX DIVE</span>
                      {obs.maxDepth}m
                    </div>
                  </div>

                  {/* Measured Values */}
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-200">🌡️ {obs.temperature.toFixed(2)}°C</span>
                      <span className="text-slate-300">🧂 {obs.salinity.toFixed(2)} PSU</span>
                      {obs.chlorophyll !== undefined && (
                        <span className="text-emerald-300">🌿 {obs.chlorophyll.toFixed(2)}</span>
                      )}
                    </div>

                    <span className="text-[9px] text-slate-400 flex items-center gap-1">
                      <Calendar size={10} />
                      {obs.timestamp.split(' ')[0]}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </aside>

        {/* Right: Inspection & Vertical CTD Profile View */}
        <main className="flex-1 flex flex-col bg-[#010610] overflow-y-auto p-4 md:p-6">
          {selectedObs ? (
            <div className="max-w-3xl space-y-5 animate-fade-in">
              {/* Platform Header Card */}
              <div className="p-4 rounded-2xl bg-[#030d1a] border border-cyan-500/30 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black font-mono text-white">{selectedObs.name}</span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                        {selectedObs.type.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">
                      Platform WMO: {selectedObs.id} · Source: {selectedObs.dataSource ?? 'INCOIS / GDAC'}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/dashboard?observation=${selectedObs.id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 text-black font-mono font-bold text-xs shadow-md hover:bg-cyan-400 transition-all"
                    >
                      <Sparkles size={13} />
                      <span>Fly in 3D</span>
                      <ExternalLink size={12} />
                    </Link>

                    <Link
                      to={`/compare?observation=${selectedObs.id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-400/40 font-mono font-bold text-xs transition-all"
                    >
                      <Scale size={13} />
                      <span>Validate Model</span>
                    </Link>
                  </div>
                </div>

                {/* Telemetry Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 text-xs font-mono">
                  <div className="p-2 rounded-lg bg-black/30 border border-white/5">
                    <span className="text-[10px] text-slate-500 block">GEOGRAPHIC POSITION</span>
                    <span className="font-bold text-white">
                      {selectedObs.latitude.toFixed(3)}°N, {selectedObs.longitude.toFixed(3)}°E
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-black/30 border border-white/5">
                    <span className="text-[10px] text-slate-500 block">SAMPLING TIMESTAMP</span>
                    <span className="font-bold text-cyan-300">{selectedObs.timestamp}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-black/30 border border-white/5">
                    <span className="text-[10px] text-slate-500 block">CURRENT SAMPLING DEPTH</span>
                    <span className="font-bold text-white">{selectedObs.currentDepth} m</span>
                  </div>
                  <div className="p-2 rounded-lg bg-black/30 border border-white/5">
                    <span className="text-[10px] text-slate-500 block">MAXIMUM PROFILE DEPTH</span>
                    <span className="font-bold text-white">{selectedObs.maxDepth} m</span>
                  </div>
                </div>
              </div>

              {/* Vertical Profile Chart Component */}
              <div className="p-4 rounded-2xl bg-[#030d1a] border border-white/10 shadow-xl">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <BarChart2 size={16} className="text-cyan-400" />
                    <h2 className="text-sm font-bold font-mono text-white">Vertical CTD Ocean Profile</h2>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Depth-Resolved Water Column Telemetry (0–{selectedObs.maxDepth}m)
                  </span>
                </div>

                <div className="bg-[#020b16] p-3 rounded-xl border border-white/5">
                  <ObservationProfile observation={selectedObs} />
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 max-w-md mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 flex items-center justify-center mb-4 shadow-lg shadow-cyan-950/40">
                <Radio size={28} />
              </div>
              <h3 className="text-base font-bold text-white mb-2 font-mono">Select an Observation Platform</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-mono">
                Click any active Argo float, glider trajectory, or CTD station from the left catalog to inspect depth-resolved vertical profiles and launch 3D co-visualization.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
