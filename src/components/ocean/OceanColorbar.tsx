/**
 * OceanColorbar — Scientific colorbar with built-in editor popover
 * Sprint 2.1: Min/Max range, Log/Linear scale, Palette picker
 * SIH 26067 | OceanIQ Platform
 */

import { useState, useRef, useEffect } from 'react'
import { Settings2, X, RotateCcw } from 'lucide-react'
import type { OceanVariable } from '@/types/ocean'
import { VARIABLE_COLOR_CONFIGS } from '@/utils/oceanColorScale'

interface OceanColorbarProps {
  selectedVariable: OceanVariable
}

const PALETTE_OPTIONS = [
  { id: 'default', label: 'Auto',    description: 'Variable default' },
  { id: 'thermal', label: 'Thermal', description: 'Blue → Red' },
  { id: 'viridis', label: 'Viridis', description: 'Purple → Yellow' },
  { id: 'plasma',  label: 'Plasma',  description: 'Purple → Orange' },
  { id: 'cool',    label: 'Cool',    description: 'Cyan → Magenta' },
]

const PALETTE_GRADIENTS: Record<string, string> = {
  default: '',  // filled from config
  thermal: 'linear-gradient(to right, #0a1a47, #0f66ad, #1ab2bf, #7fd672, #fac018, #ec4b1a, #8c0d0d)',
  viridis: 'linear-gradient(to right, #440154, #31688e, #35b779, #fde725)',
  plasma:  'linear-gradient(to right, #0d0887, #7201a8, #bd3786, #ed7953, #fdca26)',
  cool:    'linear-gradient(to right, #00ffff, #8080ff, #ff00ff)',
}

export function OceanColorbar({ selectedVariable }: OceanColorbarProps) {
  const cfg = VARIABLE_COLOR_CONFIGS[selectedVariable]

  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [minVal, setMinVal] = useState(cfg.min)
  const [maxVal, setMaxVal] = useState(cfg.max)
  const [isLog, setIsLog] = useState(false)
  const [palette, setPalette] = useState<string>('default')
  const editorRef = useRef<HTMLDivElement>(null)

  // Reset on variable change
  useEffect(() => {
    setMinVal(cfg.min)
    setMaxVal(cfg.max)
    setIsLog(false)
    setPalette('default')
  }, [selectedVariable, cfg.min, cfg.max])

  // Close on outside click
  useEffect(() => {
    if (!isEditorOpen) return
    const handler = (e: MouseEvent) => {
      if (editorRef.current && !editorRef.current.contains(e.target as Node)) {
        setIsEditorOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isEditorOpen])

  const handleReset = () => {
    setMinVal(cfg.min)
    setMaxVal(cfg.max)
    setIsLog(false)
    setPalette('default')
  }

  const gradient = palette === 'default' ? cfg.cssGradient : PALETTE_GRADIENTS[palette]
  const isModified = minVal !== cfg.min || maxVal !== cfg.max || isLog || palette !== 'default'

  const formatVal = (v: number) => {
    if (Math.abs(v) >= 1000 || (Math.abs(v) < 0.01 && v !== 0)) return v.toExponential(1)
    return v % 1 === 0 ? String(v) : v.toFixed(1)
  }

  // Tick values
  const ticks = [minVal, minVal + (maxVal - minVal) * 0.25, minVal + (maxVal - minVal) * 0.5, minVal + (maxVal - minVal) * 0.75, maxVal]

  return (
    <div className="relative flex items-center gap-2" ref={editorRef}>

      {/* Main Colorbar Display */}
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-mono font-semibold text-cyan-300 whitespace-nowrap">
          {cfg.shortLabel}
        </span>
        <span className="text-[10px] font-mono text-slate-500">{formatVal(minVal)}</span>

        <div className="relative w-32 sm:w-48 h-4 rounded overflow-hidden">
          <div className="absolute inset-0 rounded" style={{ background: gradient }} />
          {[0.25, 0.5, 0.75].map((f) => (
            <div key={f} className="absolute top-0 bottom-0 w-px bg-white/20" style={{ left: `${f * 100}%` }} />
          ))}
          {isLog && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[8px] font-mono text-white/60 bg-black/30 px-1 rounded">LOG</span>
            </div>
          )}
        </div>

        <span className="text-[10px] font-mono text-slate-500">{formatVal(maxVal)}</span>
        <span className="text-[10px] text-slate-600">{cfg.unit}</span>

        {isModified && (
          <span className="text-[8px] px-1 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono">
            CUSTOM
          </span>
        )}
      </div>

      {/* Settings Toggle Button */}
      <button
        onClick={() => setIsEditorOpen(o => !o)}
        title="Colorbar Settings"
        className={`p-1.5 rounded-lg border transition-all ${
          isEditorOpen
            ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300'
            : 'bg-white/5 border-white/10 text-slate-500 hover:text-white hover:bg-white/10'
        }`}
      >
        <Settings2 size={13} />
      </button>

      {/* ── Colorbar Editor Popover ──────────────────────────────── */}
      {isEditorOpen && (
        <div className="absolute bottom-full right-0 mb-2 w-72 rounded-xl bg-[#030d1a]/98 backdrop-blur-md border border-white/15 shadow-2xl z-50 overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/8">
            <span className="text-[11px] font-bold uppercase tracking-wide text-cyan-400 font-mono">Colorbar Settings</span>
            <div className="flex items-center gap-1">
              {isModified && (
                <button
                  onClick={handleReset}
                  title="Reset to defaults"
                  className="flex items-center gap-1 text-[10px] font-mono text-slate-400 hover:text-amber-300 px-1.5 py-0.5 rounded hover:bg-amber-500/10 transition-colors"
                >
                  <RotateCcw size={11} />
                  Reset
                </button>
              )}
              <button onClick={() => setIsEditorOpen(false)} className="text-slate-400 hover:text-white p-0.5">
                <X size={13} />
              </button>
            </div>
          </div>

          <div className="p-3 space-y-4">

            {/* Preview gradient */}
            <div>
              <div className="h-6 rounded-lg overflow-hidden mb-1.5" style={{ background: gradient }} />
              <div className="flex justify-between text-[9px] font-mono text-slate-500 px-0.5">
                {ticks.map((v, i) => <span key={i}>{formatVal(v)}</span>)}
              </div>
            </div>

            {/* Min / Max Range */}
            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-400 mb-2 uppercase tracking-wide">
                Value Range ({cfg.unit})
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[9px] font-mono text-slate-500 block mb-0.5">Min</span>
                  <input
                    type="number"
                    value={minVal}
                    onChange={(e) => setMinVal(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#020b16] border border-white/15 rounded-lg px-2 py-1.5 text-[11px] font-mono text-slate-200 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20 transition-colors"
                  />
                </div>
                <div>
                  <span className="text-[9px] font-mono text-slate-500 block mb-0.5">Max</span>
                  <input
                    type="number"
                    value={maxVal}
                    onChange={(e) => setMaxVal(parseFloat(e.target.value) || 1)}
                    className="w-full bg-[#020b16] border border-white/15 rounded-lg px-2 py-1.5 text-[11px] font-mono text-slate-200 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Scale type */}
            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-400 mb-2 uppercase tracking-wide">Scale</label>
              <div className="flex gap-1 p-1 bg-[#020b16] rounded-lg border border-white/10">
                {[{ v: false, label: 'Linear' }, { v: true, label: 'Logarithmic' }].map(({ v, label }) => (
                  <button
                    key={label}
                    onClick={() => setIsLog(v)}
                    className={`flex-1 py-1.5 rounded-md text-[10px] font-mono font-semibold transition-all ${
                      isLog === v
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                        : 'text-slate-500 hover:text-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {isLog && maxVal <= 0 && (
                <p className="text-[9px] text-amber-400 mt-1 font-mono">⚠ Log scale requires positive values</p>
              )}
            </div>

            {/* Palette picker */}
            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-400 mb-2 uppercase tracking-wide">Color Palette</label>
              <div className="space-y-1">
                {PALETTE_OPTIONS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPalette(p.id)}
                    className={`w-full flex items-center gap-2 p-2 rounded-lg border transition-all text-left ${
                      palette === p.id
                        ? 'border-cyan-400/50 bg-cyan-500/10'
                        : 'border-white/8 hover:border-white/20 hover:bg-white/5'
                    }`}
                  >
                    <div
                      className="w-12 h-4 rounded flex-shrink-0"
                      style={{
                        background: p.id === 'default' ? cfg.cssGradient : PALETTE_GRADIENTS[p.id]
                      }}
                    />
                    <div>
                      <span className={`text-[11px] font-mono font-semibold block ${palette === p.id ? 'text-cyan-300' : 'text-slate-300'}`}>
                        {p.label}
                      </span>
                      <span className="text-[9px] font-mono text-slate-600">{p.description}</span>
                    </div>
                    {palette === p.id && (
                      <span className="ml-auto text-cyan-400 text-[10px]">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
