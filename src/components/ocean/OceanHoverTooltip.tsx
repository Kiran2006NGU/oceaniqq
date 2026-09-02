/**
 * OceanHoverTooltip.tsx — Scientific Measurement & Observation Hover HUD
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 *
 * Displays rich scientific metadata when hovering over:
 * 1. Observation markers (Argo float, Glider vehicle, CTD station).
 * 2. Ocean Model surface or Depth Slice grid point.
 */

import type { MockObservation } from '@/services/data/mockOceanData'
import type { ModelPointMeasurement } from '@/types/ocean'

export interface HoverState {
  type: 'observation' | 'model' | null
  observation?: MockObservation | null
  measurement?: ModelPointMeasurement | null
  screenX?: number
  screenY?: number
}

interface OceanHoverTooltipProps {
  hoverState: HoverState
}

export function OceanHoverTooltip({ hoverState }: OceanHoverTooltipProps) {
  if (!hoverState.type) return null

  // 1. Observation marker tooltip
  if (hoverState.type === 'observation' && hoverState.observation) {
    const obs = hoverState.observation
    const latStr = `${Math.abs(obs.latitude).toFixed(2)}° ${obs.latitude >= 0 ? 'N' : 'S'}`
    const lonStr = `${Math.abs(obs.longitude).toFixed(2)}° ${obs.longitude >= 0 ? 'E' : 'W'}`

    return (
      <div
        className="fixed pointer-events-none z-50 transition-transform duration-75 ease-out"
        style={{
          left: `${(hoverState.screenX ?? 100) + 14}px`,
          top: `${(hoverState.screenY ?? 100) + 14}px`,
        }}
      >
        <div className="bg-[#020b18]/95 backdrop-blur-md border border-cyan-500/40 rounded-lg p-2.5 shadow-2xl shadow-cyan-950/80 min-w-[210px] text-slate-100 font-sans text-xs">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5 mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-white font-mono">{obs.id}</span>
            </div>
            <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30">
              {obs.type.toUpperCase()}
            </span>
          </div>

          {/* Coordinates & Region */}
          <div className="text-[11px] text-slate-300 space-y-0.5 font-mono mb-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Position:</span>
              <span className="text-slate-200">{latStr}, {lonStr}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Depth:</span>
              <span className="text-cyan-300 font-semibold">{obs.currentDepth} m</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Region:</span>
              <span className="text-slate-300 truncate max-w-[110px]">{obs.region}</span>
            </div>
          </div>

          {/* In-situ readings grid */}
          <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-white/10 text-[10px] font-mono">
            <div className="bg-white/5 p-1 rounded">
              <span className="text-slate-400 block text-[9px]">Temperature</span>
              <span className="text-amber-300 font-semibold">{obs.temperature.toFixed(1)} °C</span>
            </div>
            <div className="bg-white/5 p-1 rounded">
              <span className="text-slate-400 block text-[9px]">Salinity</span>
              <span className="text-cyan-300 font-semibold">{obs.salinity.toFixed(1)} PSU</span>
            </div>
          </div>

          {/* Timestamp */}
          <div className="mt-1.5 text-[9px] text-slate-400 font-mono flex items-center justify-between">
            <span>Time:</span>
            <span className="text-slate-300">{obs.timestamp}</span>
          </div>

          <div className="mt-1 text-[8px] text-cyan-400/80 font-mono text-center pt-1 border-t border-white/5">
            Click marker to open vertical CTD profile
          </div>
        </div>
      </div>
    )
  }

  // 2. Model point query tooltip
  if (hoverState.type === 'model' && hoverState.measurement) {
    const m = hoverState.measurement
    const latStr = `${Math.abs(m.latitude).toFixed(2)}° ${m.latitude >= 0 ? 'N' : 'S'}`
    const lonStr = `${Math.abs(m.longitude).toFixed(2)}° ${m.longitude >= 0 ? 'E' : 'W'}`

    return (
      <div
        className="fixed pointer-events-none z-50 transition-transform duration-75 ease-out"
        style={{
          left: `${(hoverState.screenX ?? 100) + 14}px`,
          top: `${(hoverState.screenY ?? 100) + 14}px`,
        }}
      >
        <div className="bg-[#020b18]/95 backdrop-blur-md border border-cyan-500/40 rounded-lg p-2.5 shadow-2xl shadow-cyan-950/80 min-w-[200px] text-slate-100 font-sans text-xs">
          <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1 mb-1.5">
            <span className="font-bold text-cyan-300 uppercase tracking-wide text-[10px] font-mono">
              Model Grid Inspection
            </span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
              NetCDF
            </span>
          </div>

          <div className="my-1.5 p-1.5 rounded bg-cyan-950/40 border border-cyan-500/20">
            <span className="text-[10px] text-slate-400 block uppercase font-mono">
              {m.variable.replace('_', ' ')}
            </span>
            <div className="text-sm font-bold text-white font-mono flex items-baseline gap-1">
              <span className="text-cyan-300 text-base">{m.value}</span>
              <span className="text-xs text-slate-300">{m.unit}</span>
            </div>
          </div>

          <div className="text-[10px] text-slate-300 space-y-0.5 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Coords:</span>
              <span className="text-slate-200">{latStr}, {lonStr}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Depth Level:</span>
              <span className="text-cyan-300 font-semibold">{m.depth} m</span>
            </div>
            <div className="flex justify-between text-[9px] text-slate-400">
              <span>Grid:</span>
              <span>Nearest model grid point</span>
            </div>
          </div>

          <div className="mt-1.5 text-[8px] text-cyan-400/80 font-mono text-center pt-1 border-t border-white/5">
            Click to lock measurement on sidebar
          </div>
        </div>
      </div>
    )
  }

  return null
}
