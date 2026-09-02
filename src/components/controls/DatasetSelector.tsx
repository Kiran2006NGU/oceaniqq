/**
 * DatasetSelector.tsx — Scientific Ocean Dataset & Model Selector
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 *
 * Allows instant switching between:
 * 1. Demo Indian Ocean Model (Synthetic)
 * 2. INCOIS HYCOM Ocean Model (Local Real NetCDF)
 */

import { useState, useRef, useEffect } from 'react'
import { Database, ChevronDown, Check, ShieldCheck } from 'lucide-react'
import type { DatasetCatalogItem } from '@/types/ocean'

interface DatasetSelectorProps {
  selectedDatasetId: string
  datasets: DatasetCatalogItem[]
  onSelectDataset: (id: string) => void
}

export function DatasetSelector({
  selectedDatasetId,
  datasets,
  onSelectDataset,
}: DatasetSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const currentDataset =
    datasets.find((d) => d.id === selectedDatasetId) ?? {
      id: 'demo-ocean',
      name: 'Demo Indian Ocean Model (Synthetic)',
      provider: 'OceanIQ Demo Pipeline',
      format: 'NetCDF',
      variables: [],
      dimensions: {},
      is_demo: true,
      is_real_data: false,
      status: 'DEMO' as const,
    }

  return (
    <div ref={menuRef} className="relative font-sans text-xs">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className={[
          'flex items-center gap-2 px-2.5 py-1 rounded border transition-all',
          currentDataset.is_real_data
            ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200 hover:bg-emerald-900/40'
            : 'bg-amber-950/40 border-amber-500/40 text-amber-200 hover:bg-amber-900/30',
        ].join(' ')}
        title="Switch active ocean model dataset"
        aria-label="Select Ocean Dataset"
      >
        <Database size={12} className={currentDataset.is_real_data ? 'text-emerald-400' : 'text-amber-400'} />
        <div className="flex flex-col text-left">
          <span className="text-[10px] font-bold font-mono tracking-wide leading-tight flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                currentDataset.is_real_data ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            {currentDataset.is_real_data ? 'LOCAL REAL DATA' : 'DEMO DATA'}
          </span>
          <span className="text-[9px] text-slate-300 truncate max-w-[140px] font-sans">
            {currentDataset.provider}
          </span>
        </div>
        <ChevronDown size={12} className="text-slate-400 ml-0.5" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 rounded-lg bg-[#030d1a] border border-cyan-500/30 shadow-2xl z-50 overflow-hidden font-sans">
          <div className="px-3 py-1.5 border-b border-white/10 bg-[#051426] flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>AVAILABLE DATASETS</span>
            <span className="text-cyan-400">{datasets.length || 2} Sources</span>
          </div>

          <div className="p-1 space-y-1">
            {datasets.map((d) => {
              const isSelected = selectedDatasetId === d.id
              return (
                <button
                  key={d.id}
                  onClick={() => {
                    onSelectDataset(d.id)
                    setIsOpen(false)
                  }}
                  className={[
                    'w-full text-left p-2 rounded flex items-start justify-between gap-2 border transition-all',
                    isSelected
                      ? d.is_real_data
                        ? 'bg-emerald-950/60 border-emerald-400/50 text-white'
                        : 'bg-amber-950/50 border-amber-400/50 text-white'
                      : 'bg-white/2 border-transparent text-slate-300 hover:bg-white/5 hover:text-white',
                  ].join(' ')}
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[8px] px-1 py-0.2 rounded font-mono font-bold uppercase ${
                          d.is_real_data
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {d.is_real_data ? 'REAL DATA' : 'DEMO'}
                      </span>
                      <span className="text-[11px] font-bold font-mono truncate text-slate-200">
                        {d.provider}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">{d.name}</div>
                    <div className="text-[9px] text-slate-500 font-mono">Format: {d.format}</div>
                  </div>

                  {isSelected && <Check size={14} className={d.is_real_data ? 'text-emerald-400 flex-shrink-0' : 'text-amber-400 flex-shrink-0'} />}
                </button>
              )
            })}
          </div>

          <div className="p-2 border-t border-white/10 bg-[#020814] text-[9px] text-slate-400 font-mono flex items-center gap-1.5">
            <ShieldCheck size={11} className="text-cyan-400 flex-shrink-0" />
            <span>Zero false operational claims. Real data shows authentic INCOIS metadata.</span>
          </div>
        </div>
      )}
    </div>
  )
}
