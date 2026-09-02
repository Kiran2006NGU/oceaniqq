/**
 * AnomalyDetectionPanel.tsx — AI-based Ocean Anomaly & Threat Detection System
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 */

import { useState } from 'react'
import { Flame, Wind, Droplets, ArrowRight, ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react'
import type { OceanVariable } from '@/types/ocean'

export interface OceanAnomaly {
  id: string
  title: string
  category: 'heatwave' | 'current' | 'salinity' | 'bleaching'
  region: string
  lat: number
  lon: number
  depth: number
  variable: OceanVariable
  severity: 'CRITICAL' | 'WARNING' | 'ADVISORY'
  anomalyValue: string
  baseline: string
  description: string
  timestamp: string
}

export const MOCK_ANOMALIES: OceanAnomaly[] = [
  {
    id: 'anom-01',
    title: 'Marine Heatwave & Coral Stress',
    category: 'heatwave',
    region: 'Bay of Bengal',
    lat: 14.5,
    lon: 87.5,
    depth: 0,
    variable: 'temperature',
    severity: 'CRITICAL',
    anomalyValue: '+2.85 °C',
    baseline: '27.40 °C (10-Yr Mean)',
    description: 'Sea Surface Temperature anomaly exceeds 99th percentile for August. Extreme risk of coral bleaching in Andaman reef systems.',
    timestamp: '2026-08-28 12:00 UTC',
  },
  {
    id: 'anom-02',
    title: 'Abnormal Surface Velocity Jet',
    category: 'current',
    region: 'Arabian Sea',
    lat: 15.0,
    lon: 65.0,
    depth: 10,
    variable: 'current_velocity',
    severity: 'WARNING',
    anomalyValue: '1.92 m/s',
    baseline: '0.85 m/s (Seasonal Avg)',
    description: 'Somali current extension exhibiting unusual eastward jet acceleration. Potential hazard for small fishing vessels.',
    timestamp: '2026-08-28 12:00 UTC',
  },
  {
    id: 'anom-03',
    title: 'Halocline Fresh Water Influx',
    category: 'salinity',
    region: 'Andaman Sea',
    lat: 10.2,
    lon: 94.1,
    depth: 25,
    variable: 'salinity',
    severity: 'ADVISORY',
    anomalyValue: '-1.85 PSU',
    baseline: '33.20 PSU',
    description: 'Strong riverine runoff plume inducing sharp vertical density gradient at 25m depth.',
    timestamp: '2026-08-28 06:00 UTC',
  },
]

interface AnomalyDetectionPanelProps {
  onSelectAnomaly: (anomaly: OceanAnomaly) => void
  onClose?: () => void
}

export function AnomalyDetectionPanel({ onSelectAnomaly }: AnomalyDetectionPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>('anom-01')

  const getCategoryIcon = (cat: OceanAnomaly['category']) => {
    switch (cat) {
      case 'heatwave':
      case 'bleaching':
        return <Flame size={14} className="text-red-400" />
      case 'current':
        return <Wind size={14} className="text-cyan-400" />
      case 'salinity':
        return <Droplets size={14} className="text-emerald-400" />
    }
  }

  const getSeverityBadge = (severity: OceanAnomaly['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse">CRITICAL</span>
      case 'WARNING':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">WARNING</span>
      case 'ADVISORY':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">ADVISORY</span>
    }
  }

  return (
    <div className="space-y-3 font-sans text-xs">
      {/* Header Info */}
      <div className="p-3 rounded bg-red-950/20 border border-red-500/30 flex items-start gap-2.5">
        <ShieldAlert size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-red-200 text-xs flex items-center gap-2">
            AI Automated Threat Monitor
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Real-time ML baseline comparison model detecting statistical deviations across temperature, salinity, and current fields.
          </p>
        </div>
      </div>

      {/* List of Anomalies */}
      <div className="space-y-2">
        {MOCK_ANOMALIES.map((anom) => {
          const isExpanded = expandedId === anom.id
          return (
            <div
              key={anom.id}
              className={`rounded border transition-all ${
                isExpanded
                  ? 'bg-slate-900/90 border-cyan-500/50 shadow-lg shadow-cyan-950/30'
                  : 'bg-slate-900/50 border-white/10 hover:border-white/20'
              }`}
            >
              {/* Card Title Row */}
              <div
                onClick={() => setExpandedId(isExpanded ? null : anom.id)}
                className="p-2.5 flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center gap-2">
                  {getCategoryIcon(anom.category)}
                  <span className="font-semibold text-white text-xs">{anom.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  {getSeverityBadge(anom.severity)}
                  {isExpanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-2.5 pb-3 pt-1 border-t border-white/5 space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                    <div className="p-1.5 rounded bg-black/40 border border-white/5">
                      <span className="text-slate-400 block text-[9px] uppercase">Anomaly Deviation</span>
                      <span className="text-red-400 font-bold text-xs">{anom.anomalyValue}</span>
                    </div>
                    <div className="p-1.5 rounded bg-black/40 border border-white/5">
                      <span className="text-slate-400 block text-[9px] uppercase">Baseline Mean</span>
                      <span className="text-slate-300 font-bold text-xs">{anom.baseline}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed font-sans">{anom.description}</p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
                    <span>Region: <strong className="text-cyan-300">{anom.region}</strong></span>
                    <span>{anom.timestamp}</span>
                  </div>

                  {/* Trigger Action */}
                  <button
                    onClick={() => onSelectAnomaly(anom)}
                    className="w-full mt-2 py-1.5 px-3 rounded bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 border border-cyan-500/40 text-[11px] font-mono font-bold flex items-center justify-center gap-2 transition-all group"
                  >
                    <span>Focus 3D View & Analyze</span>
                    <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
