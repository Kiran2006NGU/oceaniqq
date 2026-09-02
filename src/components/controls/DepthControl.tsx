/**
 * DepthControl.tsx — Scientific Vertical Depth Level & Exaggeration Controller
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 *
 * Implements Concept 6:
 * - Dynamic derivation from available dataset depths
 * - Continuous smooth depth slider [0m - maxDepth]
 * - Precise numeric readout in meters
 * - Visual distinction between EXACT DATA LEVELS and INTERPOLATED LEVELS
 * - Quick-snap buttons to available dataset coordinates
 */

import { DEMO_DEPTHS } from '@/services/data/mockOceanData'

interface DepthControlProps {
  selectedDepthIndex: number
  onChange: (index: number) => void
  continuousDepth?: number
  onContinuousChange?: (depth: number) => void
  verticalExaggeration: number
  onExaggerationChange: (v: number) => void
  availableDepths?: number[]
}

const EXAGGERATION_OPTIONS = [1, 2, 5, 10] as const

export function DepthControl({
  selectedDepthIndex,
  onChange,
  continuousDepth,
  onContinuousChange,
  verticalExaggeration,
  onExaggerationChange,
  availableDepths = DEMO_DEPTHS,
}: DepthControlProps) {
  const currentDepth = continuousDepth !== undefined ? continuousDepth : (availableDepths[selectedDepthIndex] ?? 0)
  const maxDepth = availableDepths.length > 0 ? Math.max(...availableDepths) : 2000

  // Check if current depth matches an exact dataset depth level
  const exactIndex = availableDepths.findIndex((d) => Math.abs(d - currentDepth) < 0.5)
  const isExact = exactIndex !== -1

  // Handle smooth slider changes
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value)
    if (onContinuousChange) {
      onContinuousChange(val)
    }
    // Find closest index in availableDepths
    let closestIdx = 0
    let minDiff = Infinity
    availableDepths.forEach((d, i) => {
      const diff = Math.abs(d - val)
      if (diff < minDiff) {
        minDiff = diff
        closestIdx = i
      }
    })
    onChange(closestIdx)
  }

  // Handle discrete snap button click
  const handleSnap = (idx: number) => {
    const targetDepth = availableDepths[idx] ?? 0
    onChange(idx)
    if (onContinuousChange) {
      onContinuousChange(targetDepth)
    }
  }

  return (
    <div className="space-y-3.5 font-sans text-xs">
      {/* Header & Current Depth Readout */}
      <div className="flex items-start justify-between px-1">
        <div>
          <div className="text-[9px] uppercase tracking-wider text-slate-400 font-mono font-semibold">
            Depth Slicing Plane
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded font-semibold border ${
                isExact
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
              }`}
            >
              {isExact ? `● Exact Level (${availableDepths[exactIndex]}m)` : '∿ Interpolated Level'}
            </span>
          </div>
        </div>
        <div className="flex items-baseline gap-1 font-mono text-right">
          <span className="text-lg font-black text-cyan-300 tracking-tight">
            {Math.round(currentDepth)}
          </span>
          <span className="text-[10px] font-semibold text-slate-400">m</span>
        </div>
      </div>

      {/* Smooth Continuous Depth Slider with Dataset Ticks */}
      <div className="px-1 space-y-1.5">
        <div className="flex justify-between text-[9px] font-mono text-slate-500">
          <span>0m (Surface)</span>
          <span>{maxDepth}m</span>
        </div>
        <div className="relative flex items-center">
          <input
            type="range"
            min={0}
            max={maxDepth}
            step={1}
            value={currentDepth}
            onChange={handleSliderChange}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
          />
        </div>

        {/* Visual Tick Marks for Available Dataset Depths */}
        <div className="relative h-2 w-full">
          {availableDepths.map((d, i) => {
            const pct = maxDepth > 0 ? (d / maxDepth) * 100 : 0
            const isCurrent = isExact && exactIndex === i
            return (
              <div
                key={d}
                title={`Data Level: ${d}m`}
                onClick={() => handleSnap(i)}
                className="absolute top-0 -translate-x-1/2 cursor-pointer group"
                style={{ left: `${pct}%` }}
              >
                <div
                  className={`w-1 h-2 rounded-full transition-all ${
                    isCurrent
                      ? 'bg-cyan-300 scale-125'
                      : 'bg-slate-600 group-hover:bg-slate-300'
                  }`}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Available Depth Discrete Snap Pills */}
      <div className="space-y-1 px-1">
        <div className="text-[9px] uppercase tracking-wider text-slate-400 font-mono font-semibold">
          Dataset Depth Levels ({availableDepths.length})
        </div>
        <div className="grid grid-cols-3 gap-1 max-h-28 overflow-y-auto pr-0.5">
          {availableDepths.map((d, i) => {
            const isSelected = isExact && exactIndex === i
            return (
              <button
                key={d}
                onClick={() => handleSnap(i)}
                className={[
                  'px-1.5 py-1 rounded text-[10px] font-mono transition-all border text-center',
                  isSelected
                    ? 'bg-cyan-950/70 border-cyan-400/60 text-cyan-200 font-bold shadow-sm shadow-cyan-900/50'
                    : 'bg-white/2 border-white/5 text-slate-400 hover:bg-white/5 hover:text-slate-200',
                ].join(' ')}
              >
                {d === 0 ? '0m (SFC)' : `${d}m`}
              </button>
            )
          })}
        </div>
      </div>

      {/* Vertical Exaggeration */}
      <div className="pt-2 border-t border-white/5 space-y-1.5 px-1">
        <div className="text-[9px] uppercase tracking-wider text-slate-400 font-mono font-semibold">
          Vertical Scale Exaggeration
        </div>
        <div className="grid grid-cols-4 gap-1 font-mono">
          {EXAGGERATION_OPTIONS.map((v) => (
            <button
              key={v}
              onClick={() => onExaggerationChange(v)}
              className={[
                'py-1 rounded text-[10px] font-semibold border transition-all text-center',
                verticalExaggeration === v
                  ? 'bg-indigo-500/25 border-indigo-400/50 text-indigo-200'
                  : 'bg-white/2 border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/5',
              ].join(' ')}
            >
              {v}×
            </button>
          ))}
        </div>
      </div>

      {/* Inspect Level on Dedicated Page Button */}
      <div className="pt-2 border-t border-white/5 px-1">
        <a
          href={`/depth-inspector?depth=${Math.round(currentDepth)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-200 border border-cyan-500/30 text-[10px] font-mono font-bold transition-all"
        >
          <span>Inspect {Math.round(currentDepth)}m in Inspector</span>
          <span className="text-xs">↗</span>
        </a>
      </div>
    </div>
  )
}
