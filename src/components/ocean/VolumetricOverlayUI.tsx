/**
 * VolumetricOverlayUI.tsx — Digital Twin UI Controls matching Reference Design
 * SIH 26067 | Ocean Intelligence Platform
 *
 * Renders:
 * 1. Top-Right Floating Layer & Depth Slice Panel
 * 2. Bottom-Right Dual Colormap Legends (Ocean Model vs In-Situ Glider)
 * 3. Bottom Timeline Scrubber with key telemetry milestones
 * 4. Left Floating Quick Action Tools
 */

import { useState } from 'react'
import { Play, Pause, Layers, Eye, RefreshCw, Compass, Box } from 'lucide-react'
import type { OceanVariable } from '@/types/ocean'

interface VolumetricOverlayUIProps {
  selectedVariable: OceanVariable
  selectedDepth: number
  onDepthChange: (depth: number) => void
  visibleModelVolume: boolean
  onToggleModelVolume: () => void
  visibleGliderPath: boolean
  onToggleGliderPath: () => void
  isPlaying: boolean
  onTogglePlay: () => void
  globeMode: 'satellite' | 'heatmap'
  onToggleGlobeMode: () => void
  selectedRegion: string
  onSelectRegion: (region: string) => void
}

export function VolumetricOverlayUI({
  selectedVariable,
  selectedDepth,
  onDepthChange,
  visibleModelVolume,
  onToggleModelVolume,
  visibleGliderPath,
  onToggleGliderPath,
  isPlaying,
  onTogglePlay,
  globeMode,
  onToggleGlobeMode,
  selectedRegion,
  onSelectRegion,
}: VolumetricOverlayUIProps) {
  const [isLayerExpanded, setIsLayerExpanded] = useState(true)

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden select-none">
      {/* ── Left Floating Toolbar ────────────────────────────────────────── */}
      <div className="pointer-events-auto absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2.5">
        <button
          onClick={onToggleGlobeMode}
          title={globeMode === 'satellite' ? 'Switch to Ocean Model Heatmap' : 'Switch to Google Earth Satellite'}
          className={[
            'p-2.5 rounded-full backdrop-blur-md border transition-all duration-200 shadow-xl',
            globeMode === 'satellite'
              ? 'bg-[#0f2137]/80 text-cyan-300 border-cyan-500/40 hover:bg-[#163354]'
              : 'bg-black/60 text-slate-300 border-white/10 hover:bg-black/80',
          ].join(' ')}
        >
          <Compass size={18} />
        </button>

        <button
          onClick={onToggleModelVolume}
          title="Toggle 3D Volumetric Water Column"
          className={[
            'p-2.5 rounded-full backdrop-blur-md border transition-all duration-200 shadow-xl',
            visibleModelVolume
              ? 'bg-[#0f2137]/80 text-amber-300 border-amber-500/40 hover:bg-[#163354]'
              : 'bg-black/60 text-slate-300 border-white/10 hover:bg-black/80',
          ].join(' ')}
        >
          <Box size={18} />
        </button>

        <button
          onClick={onToggleGliderPath}
          title="Toggle Glider Trajectory Path"
          className={[
            'p-2.5 rounded-full backdrop-blur-md border transition-all duration-200 shadow-xl',
            visibleGliderPath
              ? 'bg-[#0f2137]/80 text-emerald-300 border-emerald-500/40 hover:bg-[#163354]'
              : 'bg-black/60 text-slate-300 border-white/10 hover:bg-black/80',
          ].join(' ')}
        >
          <Eye size={18} />
        </button>

        <button
          onClick={() => window.dispatchEvent(new CustomEvent('ocean:reset-camera'))}
          title="Reset Camera View"
          className="p-2.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-slate-300 hover:text-white hover:bg-black/80 transition-all shadow-xl"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* ── Top-Right Floating Layer & Depth Slice Panel ─────────────────── */}
      <div className="pointer-events-auto absolute right-4 top-4 w-72 rounded-xl bg-[#0a1626]/85 backdrop-blur-md border border-white/12 shadow-2xl p-3.5 text-slate-200 transition-all">
        {/* Header */}
        <div
          onClick={() => setIsLayerExpanded((p) => !p)}
          className="flex items-center justify-between cursor-pointer pb-2 border-b border-white/10"
        >
          <div className="flex items-center gap-2">
            <Layers size={14} className="text-cyan-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-100">
              Layer
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {isLayerExpanded ? '▲' : '▼'}
          </span>
        </div>

        {isLayerExpanded && (
          <div className="mt-3 space-y-3">
            {/* Region focus selector */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400 font-medium">Focus Region</span>
              <select
                value={selectedRegion}
                onChange={(e) => onSelectRegion(e.target.value)}
                className="bg-[#030d1a] text-cyan-300 text-xs px-2 py-1 rounded border border-white/10 focus:outline-none focus:border-cyan-500"
              >
                <option value="Bay of Bengal">Bay of Bengal</option>
                <option value="Arabian Sea">Arabian Sea</option>
                <option value="Andaman Sea">Andaman Sea</option>
                <option value="Equatorial Indian Ocean">Equatorial IO</option>
              </select>
            </div>

            {/* Ocean Model Toggle */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-br from-red-500 to-amber-400" />
                <span className="text-xs font-medium text-slate-200">
                  Ocean Model: {selectedVariable.charAt(0).toUpperCase() + selectedVariable.slice(1)}
                </span>
              </div>
              <button
                onClick={onToggleModelVolume}
                className={[
                  'px-2 py-0.5 rounded text-[10px] font-mono transition-all',
                  visibleModelVolume
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-white/5 text-slate-400 border border-white/10',
                ].join(' ')}
              >
                volume
              </button>
            </div>

            {/* In-Situ Observations Toggle */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-xs font-medium text-slate-200">
                  In-Situ Observations: Glider
                </span>
              </div>
              <button
                onClick={onToggleGliderPath}
                className={[
                  'px-2 py-0.5 rounded text-[10px] font-mono transition-all',
                  visibleGliderPath
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-white/5 text-slate-400 border border-white/10',
                ].join(' ')}
              >
                path
              </button>
            </div>

            {/* Depth Slice Slider */}
            <div className="pt-2 border-t border-white/10">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-slate-300">Depth Slice (m)</span>
                <span className="text-xs font-mono font-bold text-cyan-300">
                  {selectedDepth} m
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1000"
                step="10"
                value={selectedDepth}
                onChange={(e) => onDepthChange(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[9px] font-mono text-slate-400 mt-1">
                <span>0m (Surface)</span>
                <span>250m</span>
                <span>500m</span>
                <span>1000m</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom-Right Dual Colormaps (Matching Reference Screenshot) ──── */}
      <div className="pointer-events-auto absolute right-4 bottom-20 flex items-end gap-3 rounded-lg bg-[#0a1626]/85 backdrop-blur-md border border-white/10 p-2.5 shadow-2xl">
        {/* Model Colormap */}
        <div className="flex flex-col items-center">
          <span className="text-[9px] font-mono text-slate-300 uppercase mb-1">Model</span>
          <div className="w-4 h-24 rounded bg-gradient-to-t from-[#0284c7] via-[#eab308] to-[#dc2626] border border-white/20" />
          <div className="flex justify-between w-full text-[8px] font-mono text-slate-400 mt-1">
            <span>2°C</span>
            <span>30°C</span>
          </div>
        </div>

        {/* Glider In-Situ Colormap */}
        <div className="flex flex-col items-center">
          <span className="text-[9px] font-mono text-slate-300 uppercase mb-1">Glider</span>
          <div className="w-4 h-24 rounded bg-gradient-to-t from-[#1e3a8a] via-[#38bdf8] to-[#f43f5e] border border-white/20" />
          <div className="flex flex-col justify-between h-24 text-[8px] font-mono text-slate-300 ml-1">
            <span>5.0</span>
            <span>4.0</span>
            <span>0.5</span>
          </div>
        </div>

        {/* Path Indicator */}
        <div className="flex flex-col items-center ml-1">
          <span className="text-[9px] font-mono text-slate-300 uppercase mb-1">Path</span>
          <div className="w-2.5 h-24 rounded-full bg-gradient-to-t from-blue-500 via-emerald-400 to-rose-500" />
        </div>
      </div>

      {/* ── Bottom Timeline & Telemetry Scrubbing Bar ────────────────────── */}
      <div className="pointer-events-auto absolute left-4 right-4 bottom-3 rounded-xl bg-[#0a1626]/90 backdrop-blur-lg border border-white/12 px-4 py-2.5 shadow-2xl flex items-center gap-4">
        {/* Play/Pause button */}
        <button
          onClick={onTogglePlay}
          className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 hover:bg-cyan-500/30 transition-all shadow-md flex-shrink-0"
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
        </button>

        {/* Time label */}
        <div className="flex-shrink-0 font-mono text-xs text-slate-200">
          <span className="text-slate-400">Time:</span> <strong>24–28 Oct 2026</strong>
        </div>

        {/* Interactive Scrubbing Bar with Milestones */}
        <div className="flex-1 relative flex flex-col justify-center">
          {/* Milestone Labels Above Track */}
          <div className="flex justify-between text-[9px] font-mono text-slate-300 mb-1">
            <div className="flex flex-col items-start">
              <span className="font-semibold text-cyan-300">Model updates</span>
              <span className="text-[8px] text-slate-400">24-8 Oct</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-semibold text-amber-300">Key updates</span>
              <span className="text-[8px] text-slate-400">Temp: 5.2°C</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-semibold text-emerald-300">Glider acquisition</span>
              <span className="text-[8px] text-slate-400">Salinity: 34.9 PSU</span>
            </div>
          </div>

          {/* Progress bar line with milestone nodes */}
          <div className="relative w-full h-1.5 bg-slate-700/80 rounded-full overflow-visible">
            <div className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-cyan-500 via-amber-400 to-emerald-400 rounded-full w-[65%]" />
            {/* Scrubber thumb */}
            <div className="absolute left-[65%] top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-lg border-2 border-cyan-400 cursor-pointer" />
          </div>
        </div>
      </div>
    </div>
  )
}
