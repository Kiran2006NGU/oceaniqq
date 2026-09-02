/**
 * LayerControls — checkboxes to show/hide visualization layers
 * SIH 26067 | Ocean Intelligence Platform
 */

import { Globe, Radio, Activity, Navigation, Layers } from 'lucide-react'
import type { VisibleLayers } from '@/hooks/useDashboardState'

interface LayerControlsProps {
  visibleLayers: VisibleLayers
  onToggle: (layer: keyof VisibleLayers) => void
}

const LAYER_OPTIONS: {
  key: keyof VisibleLayers
  label: string
  sublabel: string
  icon: React.ReactNode
  color: string
}[] = [
  { key: 'oceanModel',    label: 'Ocean Model',     sublabel: 'SST / field',   icon: <Globe size={12} />,       color: '#00b4d8' },
  { key: 'argo',          label: 'Argo Floats',     sublabel: '5 platforms',   icon: <Radio size={12} />,       color: '#22d3ee' },
  { key: 'glider',        label: 'Gliders',         sublabel: '3 platforms',   icon: <Activity size={12} />,    color: '#22d3a0' },
  { key: 'ctd',           label: 'CTD Stations',    sublabel: '4 stations',    icon: <Radio size={12} />,       color: '#f59e0b' },
  { key: 'currentVectors',label: 'Currents',        sublabel: 'U/V vectors',   icon: <Navigation size={12} />, color: '#a78bfa' },
  { key: 'depthSlice',    label: 'Depth Slice',     sublabel: 'Horizontal',    icon: <Layers size={12} />,      color: '#38bdf8' },
  { key: 'isosurface',    label: '3D Isosurface',   sublabel: 'Isotherm/Isohaline', icon: <Layers size={12} />, color: '#c084fc' },
]

export function LayerControls({ visibleLayers, onToggle }: LayerControlsProps) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-widest text-ocean-500 font-bold px-3 pt-3 pb-2 border-t border-white/5">
        Layers
      </div>
      <div className="px-2 space-y-0.5">
        {LAYER_OPTIONS.map((opt) => {
          const isOn = visibleLayers[opt.key]
          return (
            <button
              key={opt.key}
              onClick={() => onToggle(opt.key)}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-ocean-800/40 transition-all group"
            >
              {/* Custom checkbox */}
              <div
                className={[
                  'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all',
                  isOn
                    ? 'border-transparent'
                    : 'border-ocean-600 bg-transparent',
                ].join(' ')}
                style={isOn ? { background: `${opt.color}44`, borderColor: opt.color } : undefined}
              >
                {isOn && (
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M1 4L3 6L7 2" stroke={opt.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>

              {/* Icon */}
              <span
                className="flex-shrink-0 transition-colors"
                style={{ color: isOn ? opt.color : '#4a6c8a' }}
              >
                {opt.icon}
              </span>

              {/* Labels */}
              <div className="min-w-0 text-left">
                <div
                  className={`text-xs leading-tight transition-colors ${
                    isOn ? 'text-ocean-200' : 'text-ocean-500'
                  }`}
                >
                  {opt.label}
                </div>
                <div className="text-[10px] text-ocean-600">{opt.sublabel}</div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
