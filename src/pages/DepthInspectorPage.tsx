/**
 * DepthInspectorPage.tsx — Ocean Level & Stratification Inspector
 * Route: /depth-inspector
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 */

import { useSearchParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Layers, Waves, ExternalLink, BarChart2 } from 'lucide-react'
import { DEMO_DEPTHS, getOceanValue } from '@/services/data/mockOceanData'
import { VARIABLE_COLOR_CONFIGS, valueToCSSColor } from '@/utils/oceanColorScale'
import type { OceanVariable } from '@/types/ocean'

export function DepthInspectorPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const depth = parseInt(searchParams.get('depth') || '50', 10)
  const variable = (searchParams.get('variable') || 'temperature') as OceanVariable

  const cfg = VARIABLE_COLOR_CONFIGS[variable] || VARIABLE_COLOR_CONFIGS['temperature']

  // Sample data at this depth
  const bayOfBengalVal = getOceanValue(14.5, 87.5, depth, variable, 2)
  const arabianSeaVal = getOceanValue(15.0, 65.0, depth, variable, 2)
  const andamanVal = getOceanValue(10.2, 94.1, depth, variable, 2)

  const handleDepthChange = (newDepth: number) => {
    setSearchParams({ depth: newDepth.toString(), variable })
  }

  const handleVariableChange = (newVar: OceanVariable) => {
    setSearchParams({ depth: depth.toString(), variable: newVar })
  }

  return (
    <div className="min-h-full bg-[#020b18] text-slate-100 p-6 space-y-6 font-sans">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2 font-mono">
              <Layers className="text-cyan-400" size={20} />
              Ocean Depth Level Inspector ({depth} m)
            </h1>
            <p className="text-xs text-slate-400">
              Subsurface stratification, thermocline gradients, and multi-region parameter analysis.
            </p>
          </div>
        </div>

        {/* Quick Action to open Dashboard in 3D */}
        <button
          onClick={() => navigate(`/dashboard?depth=${depth}&variable=${variable}`)}
          className="flex items-center gap-2 py-2 px-3 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 border border-cyan-500/40 text-xs font-mono font-bold transition-all"
        >
          <ExternalLink size={14} />
          <span>View 3D Volume on Dashboard</span>
        </button>
      </div>

      {/* Control Selector Bar */}
      <div className="p-4 rounded-xl bg-[#051426] border border-cyan-500/30 flex flex-wrap items-center justify-between gap-4">
        {/* Depth Level Selector Pills */}
        <div className="space-y-1">
          <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">Select Depth Layer</span>
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            {DEMO_DEPTHS.map((d) => (
              <button
                key={d}
                onClick={() => handleDepthChange(d)}
                className={`py-1 px-3 rounded-lg text-xs font-mono transition-all ${
                  d === depth
                    ? 'bg-cyan-500 text-black font-bold shadow-lg shadow-cyan-500/30'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                }`}
              >
                {d === 0 ? 'Surface (0m)' : `${d} m`}
              </button>
            ))}
          </div>
        </div>

        {/* Variable Selector */}
        <div className="space-y-1">
          <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">Select Ocean Variable</span>
          <div className="flex items-center gap-2">
            {(['temperature', 'salinity', 'chlorophyll', 'current_velocity'] as OceanVariable[]).map((v) => (
              <button
                key={v}
                onClick={() => handleVariableChange(v)}
                className={`py-1 px-3 rounded-lg text-xs font-mono transition-all ${
                  v === variable
                    ? 'bg-cyan-950 text-cyan-200 border border-cyan-400 font-bold'
                    : 'bg-white/5 hover:bg-white/10 text-slate-400 border border-white/10'
                }`}
              >
                {v.replace('_', ' ').toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Region Comparison Cards */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-bold font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-2">
            <BarChart2 size={16} />
            Regional Values at {depth}m Depth
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Bay of Bengal Card */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 space-y-2">
              <span className="text-xs font-bold text-white font-mono block">Bay of Bengal</span>
              <div className="text-2xl font-bold font-mono" style={{ color: valueToCSSColor(bayOfBengalVal, variable) }}>
                {bayOfBengalVal.toFixed(2)} <span className="text-xs text-slate-400 font-normal">{cfg.unit}</span>
              </div>
              <p className="text-[11px] text-slate-400">
                {depth < 50 ? 'Mixed surface layer with warm tropical influence.' : 'Sub-thermocline layer exhibiting strong stratification.'}
              </p>
            </div>

            {/* Arabian Sea Card */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 space-y-2">
              <span className="text-xs font-bold text-white font-mono block">Arabian Sea</span>
              <div className="text-2xl font-bold font-mono" style={{ color: valueToCSSColor(arabianSeaVal, variable) }}>
                {arabianSeaVal.toFixed(2)} <span className="text-xs text-slate-400 font-normal">{cfg.unit}</span>
              </div>
              <p className="text-[11px] text-slate-400">
                {variable === 'salinity' ? 'High salinity core due to intense evaporation.' : 'High velocity mesoscale eddy turbulence.'}
              </p>
            </div>

            {/* Andaman Sea Card */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 space-y-2">
              <span className="text-xs font-bold text-white font-mono block">Andaman Sea</span>
              <div className="text-2xl font-bold font-mono" style={{ color: valueToCSSColor(andamanVal, variable) }}>
                {andamanVal.toFixed(2)} <span className="text-xs text-slate-400 font-normal">{cfg.unit}</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Influenced by fresh river runoff and internal solitary wave activity.
              </p>
            </div>
          </div>

          {/* Depth Stratification Physics Card */}
          <div className="p-5 rounded-xl bg-[#030d1a] border border-white/10 space-y-3">
            <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
              Physical Characteristics of the {depth}m Horizon
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-2.5 rounded bg-black/40 border border-white/5">
                <span className="text-slate-400 text-[10px] block uppercase">Hydrostatic Pressure</span>
                <span className="text-cyan-300 font-bold">{(depth * 0.1007).toFixed(1)} bar</span>
              </div>
              <div className="p-2.5 rounded bg-black/40 border border-white/5">
                <span className="text-slate-400 text-[10px] block uppercase">Light Penetration (PAR)</span>
                <span className="text-emerald-300 font-bold">{depth <= 25 ? '85% (Euphotic)' : depth <= 100 ? '12% (Mesopelagic)' : '0.1% (Aphotic)'}</span>
              </div>
              <div className="p-2.5 rounded bg-black/40 border border-white/5">
                <span className="text-slate-400 text-[10px] block uppercase">Density (Sigma-t)</span>
                <span className="text-slate-200 font-bold">{(22.4 + depth * 0.003).toFixed(2)} kg/m³</span>
              </div>
              <div className="p-2.5 rounded bg-black/40 border border-white/5">
                <span className="text-slate-400 text-[10px] block uppercase">Thermocline Gradient</span>
                <span className="text-amber-300 font-bold">{depth >= 50 && depth <= 200 ? 'High (-0.08°C/m)' : 'Low (-0.01°C/m)'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Active Sensors & Advisories Panel */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-2">
            <Waves size={16} />
            Sensors Active at {depth}m
          </h2>

          <div className="p-4 rounded-xl bg-[#030d1a] border border-white/10 space-y-3 font-mono text-xs">
            <div className="p-3 rounded bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between">
              <div>
                <span className="font-bold text-white block">Argo Float 2901542</span>
                <span className="text-[10px] text-slate-400">Deep CTD Profile (0 - 2000m)</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] border border-cyan-500/30">
                ACTIVE
              </span>
            </div>

            <div className="p-3 rounded bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between">
              <div>
                <span className="font-bold text-white block">Sawtooth Glider SG-152</span>
                <span className="text-[10px] text-slate-400">Currently at {depth}m pitch angle</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] border border-emerald-500/30">
                PROFILING
              </span>
            </div>

            <div className="p-3 rounded bg-amber-950/40 border border-amber-500/30 flex items-center justify-between">
              <div>
                <span className="font-bold text-white block">INCOIS CTD Station CS-04</span>
                <span className="text-[10px] text-slate-400">Bay of Bengal Transect</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] border border-amber-500/30">
                RECORDED
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
