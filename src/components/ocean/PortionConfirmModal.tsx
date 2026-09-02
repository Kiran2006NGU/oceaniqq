/**
 * PortionConfirmModal.tsx — Portion Confirmation & 3D Depth View Launcher
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 */

import { useState } from 'react'
import {
  Layers,
  ExternalLink,
  RotateCcw,
  Sliders,
  Check,
  Compass,
  Thermometer,
  Waves,
  Droplets,
  X,
} from 'lucide-react'
import type { SelectedPortionBounds } from './PortionSelectionOverlay'
import type { OceanVariable } from '@/types/ocean'

interface PortionConfirmModalProps {
  bounds: SelectedPortionBounds
  initialVariable: OceanVariable
  onClose: () => void
  onRedraw: () => void
}

export function PortionConfirmModal({
  bounds,
  initialVariable = 'temperature',
  onClose,
  onRedraw,
}: PortionConfirmModalProps) {
  const [variable, setVariable] = useState<OceanVariable>(initialVariable)
  const [maxDepth, setMaxDepth] = useState<number>(1500)
  const [portionTitle, setPortionTitle] = useState<string>(() => {
    if (bounds.centerLon > 78 && bounds.centerLat > 5) return 'Bay of Bengal Portion'
    if (bounds.centerLon <= 78 && bounds.centerLat > 5) return 'Arabian Sea Portion'
    if (bounds.centerLat <= 5) return 'Equatorial Indian Ocean Portion'
    return 'Custom Ocean Portion'
  })

  const depthViewUrl = `/depth-view?minLat=${bounds.minLat}&maxLat=${bounds.maxLat}&minLon=${bounds.minLon}&maxLon=${bounds.maxLon}&lat=${bounds.centerLat}&lon=${bounds.centerLon}&variable=${variable}&maxDepth=${maxDepth}&region=${encodeURIComponent(portionTitle)}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in font-mono text-xs">
      <div className="bg-[#050e1c] border border-cyan-400/50 rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4 text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center border border-cyan-400/40">
              <Layers size={18} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white">4-Sided Ocean Portion Selected</h3>
              <p className="text-[11px] text-slate-400">Ready to extrude into 3D Volumetric Depth View</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {/* Coordinates Summary */}
        <div className="p-3 rounded-xl bg-[#020712] border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-bold">Bounding Coordinates:</span>
            <span className="text-cyan-300 font-bold">
              {bounds.widthKm} km × {bounds.heightKm} km
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 pt-1">
            <div>
              <span className="text-slate-500 block text-[9px] uppercase">Latitude Range</span>
              <strong className="text-white">{bounds.minLat}°N to {bounds.maxLat}°N</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px] uppercase">Longitude Range</span>
              <strong className="text-white">{bounds.minLon}°E to {bounds.maxLon}°E</strong>
            </div>
          </div>
        </div>

        {/* Parameters */}
        <div className="space-y-3">
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Ocean Parameter to View
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'temperature' as OceanVariable, label: 'Temperature', icon: '🌡️' },
                { id: 'salinity' as OceanVariable, label: 'Salinity', icon: '🧂' },
                { id: 'current_velocity' as OceanVariable, label: 'Current Velocity', icon: '🌊' },
                { id: 'chlorophyll' as OceanVariable, label: 'Chlorophyll-a', icon: '🌿' },
              ].map((v) => (
                <button
                  key={v.id}
                  onClick={() => setVariable(v.id)}
                  className={`py-2 px-2.5 rounded-lg border text-left flex items-center gap-1.5 transition-all cursor-pointer ${
                    variable === v.id
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>{v.icon}</span>
                  <span className="truncate">{v.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-400 font-bold">Volumetric Column Depth</span>
              <span className="text-cyan-300 font-bold">0m – {maxDepth}m</span>
            </div>
            <input
              type="range"
              min={200}
              max={2500}
              step={100}
              value={maxDepth}
              onChange={(e) => setMaxDepth(parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
          <button
            onClick={onRedraw}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>Redraw Portion</span>
          </button>

          <a
            href={depthViewUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold shadow-lg shadow-cyan-500/30 transition-all cursor-pointer"
          >
            <span>Open 3D Depth View ↗</span>
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  )
}
