/**
 * ModelObservationComparison.tsx — Model vs In-Situ Observation Discrepancy Analysis
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 *
 * Compares in-situ observation profiles (Argo, Glider, CTD) against the numerical model
 * outputs at identical depth levels and spatial coordinates.
 * Computes residuals (Delta = Observation - Model) with scientific precision.
 */

import { useState, useMemo } from 'react'
import type { MockObservation } from '@/services/data/mockOceanData'
import type { OceanVariable } from '@/types/ocean'
import { getOceanValueSync } from '@/services/data/dataSource'
import { getProfileData } from '@/services/data/mockOceanData'

interface ModelObservationComparisonProps {
  observation: MockObservation
  selectedTimeIndex?: number
}

interface ComparisonRow {
  depth: number
  obsValue: number
  modelValue: number
  delta: number
  percentDiff: number
}

export function ModelObservationComparison({
  observation,
  selectedTimeIndex = 2,
}: ModelObservationComparisonProps) {
  const [variable, setVariable] = useState<OceanVariable>('temperature')

  const unit = variable === 'temperature' ? '°C' : variable === 'salinity' ? 'PSU' : 'mg/m³'

  const comparisonData: ComparisonRow[] = useMemo(() => {
    const profile = getProfileData(observation)
    if (!profile || profile.length === 0) return []

    return profile.map((p) => {
      const modelVal = getOceanValueSync(
        observation.latitude,
        observation.longitude,
        p.depth,
        variable,
        selectedTimeIndex
      )
      const obsVal =
        variable === 'temperature'
          ? p.temperature
          : variable === 'salinity'
          ? p.salinity
          : p.chlorophyll

      const delta = Math.round((obsVal - modelVal) * 100) / 100
      const percentDiff = modelVal !== 0 ? Math.round(((obsVal - modelVal) / modelVal) * 1000) / 10 : 0

      return {
        depth: p.depth,
        obsValue: Math.round(obsVal * 100) / 100,
        modelValue: Math.round(modelVal * 100) / 100,
        delta,
        percentDiff,
      }
    })
  }, [observation, variable, selectedTimeIndex])

  // Summary statistics
  const stats = useMemo(() => {
    if (comparisonData.length === 0) return null
    const deltas = comparisonData.map((d) => d.delta)
    const rmse = Math.sqrt(deltas.reduce((sum, d) => sum + d * d, 0) / deltas.length)
    const meanBias = deltas.reduce((sum, d) => sum + d, 0) / deltas.length
    const maxDelta = Math.max(...deltas.map((d) => Math.abs(d)))
    return {
      rmse: rmse.toFixed(2),
      meanBias: (meanBias >= 0 ? '+' : '') + meanBias.toFixed(2),
      maxDelta: maxDelta.toFixed(2),
    }
  }, [comparisonData])

  return (
    <div className="flex flex-col h-full text-slate-200 text-xs font-sans">
      {/* ── Variable Selector Switcher ── */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-[#040f1f]/80">
        <span className="text-[10px] font-mono uppercase text-slate-400">Comparison Variable:</span>
        <div className="flex items-center gap-1">
          {(['temperature', 'salinity', 'chlorophyll'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setVariable(v)}
              className={[
                'px-2 py-0.5 rounded text-[10px] font-mono transition-all',
                variable === v
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent',
              ].join(' ')}
            >
              {v === 'temperature' ? 'Temp' : v === 'salinity' ? 'Sal' : 'Chl-a'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Statistical Metrics Cards ── */}
      {stats && (
        <div className="grid grid-cols-3 gap-1.5 p-2 bg-[#020b17]/60 border-b border-white/5 text-[10px] font-mono">
          <div className="p-1.5 rounded bg-white/5 border border-white/5 text-center">
            <span className="text-slate-400 block text-[9px]">RMSE</span>
            <span className="text-cyan-300 font-bold">{stats.rmse} {unit}</span>
          </div>
          <div className="p-1.5 rounded bg-white/5 border border-white/5 text-center">
            <span className="text-slate-400 block text-[9px]">Mean Bias</span>
            <span className={Number(stats.meanBias) >= 0 ? 'text-emerald-300 font-bold' : 'text-amber-300 font-bold'}>
              {stats.meanBias} {unit}
            </span>
          </div>
          <div className="p-1.5 rounded bg-white/5 border border-white/5 text-center">
            <span className="text-slate-400 block text-[9px]">Max Residual</span>
            <span className="text-slate-200 font-bold">±{stats.maxDelta} {unit}</span>
          </div>
        </div>
      )}

      {/* ── Comparison Table ── */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <table className="w-full text-left font-mono text-[10px] border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-slate-400 bg-white/2 sticky top-0 backdrop-blur-sm">
              <th className="py-1 px-2.5">Depth</th>
              <th className="py-1 px-2 text-cyan-300">Model</th>
              <th className="py-1 px-2 text-emerald-300">In-Situ</th>
              <th className="py-1 px-2 text-right">Delta</th>
            </tr>
          </thead>
          <tbody>
            {comparisonData.map((row) => (
              <tr key={row.depth} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="py-1 px-2.5 text-slate-400">{row.depth} m</td>
                <td className="py-1 px-2 text-cyan-200 font-medium">{row.modelValue}</td>
                <td className="py-1 px-2 text-emerald-200 font-medium">{row.obsValue}</td>
                <td className="py-1 px-2 text-right">
                  <span
                    className={[
                      'px-1 py-0.2 rounded font-semibold',
                      row.delta === 0
                        ? 'text-slate-400'
                        : row.delta > 0
                        ? 'text-emerald-400 bg-emerald-500/10'
                        : 'text-amber-400 bg-amber-500/10',
                    ].join(' ')}
                  >
                    {row.delta > 0 ? `+${row.delta}` : row.delta}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Scientific Honesty Footer ── */}
      <div className="p-2 border-t border-white/10 bg-[#020914] text-[9px] text-slate-400 font-mono flex items-center justify-between">
        <span>Dataset: DEMO / SIMULATED</span>
        <span className="text-amber-400/80">Synthetic NetCDF Grid</span>
      </div>
    </div>
  )
}
