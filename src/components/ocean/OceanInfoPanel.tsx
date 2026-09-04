/**
 * OceanInfoPanel.tsx — Professional Scientific Oceanographic Inspector
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 *
 * Inspector modes:
 * 1. Observation Telemetry — In-situ platform metadata & physical readings
 * 2. Model Grid Node — Exact point query from NetCDF grid with CF attributes & actions
 * 3. General Model Status — Active variable, domain, and data provenance
 */

import { useState } from 'react'
import { Copy, Check, BarChart2, X, ExternalLink } from 'lucide-react'
import type { OceanVariable, ModelPointMeasurement } from '@/types/ocean'
import type { MockObservation, ModelTime } from '@/services/data/mockOceanData'
import { VARIABLE_COLOR_CONFIGS, valueToCSSColor } from '@/utils/oceanColorScale'
import { getOceanValue } from '@/services/data/mockOceanData'
import { getRegionName } from '@/utils/geoUtils'
import { DataProvenanceHUD } from './DataProvenanceHUD'

interface OceanInfoPanelProps {
  selectedVariable: OceanVariable
  selectedDepth: number
  selectedTimeIndex: number
  selectedTime: ModelTime
  selectedObservation: MockObservation | null
  selectedMeasurement?: ModelPointMeasurement | null
  onClearMeasurement?: () => void
  onOpenProfile?: () => void
  onOpenComparison?: () => void
}

const CF_STANDARD_NAMES: Record<OceanVariable, { standard: string; units: string }> = {
  temperature: { standard: 'sea_water_temperature', units: 'degC' },
  salinity: { standard: 'sea_water_salinity', units: '1e-3 (PSU)' },
  chlorophyll: { standard: 'mass_concentration_of_chlorophyll_a', units: 'mg m-3' },
  current_u: { standard: 'eastward_sea_water_velocity', units: 'm s-1' },
  current_v: { standard: 'northward_sea_water_velocity', units: 'm s-1' },
  current_w: { standard: 'upward_sea_water_velocity', units: 'm s-1' },
  current_velocity: { standard: 'magnitude_sea_water_velocity', units: 'm s-1' },
  sea_level: { standard: 'sea_surface_height_above_sea_level', units: 'cm' },
  oxygen: { standard: 'moles_of_oxygen_per_unit_mass_in_sea_water', units: 'µmol kg-1' },
  phytoplankton: { standard: 'mole_concentration_of_phytoplankton_expressed_as_carbon_in_sea_water', units: 'cell L-1' },
  sea_surface_height: { standard: 'sea_surface_height_above_geoid', units: 'cm' },
}

function ScientificRow({
  label,
  value,
  accent,
  isMono = true,
}: {
  label: string
  value: string | React.ReactNode
  accent?: string
  isMono?: boolean
}) {
  return (
    <div className="py-1.5 border-b border-white/5 last:border-0 flex items-baseline justify-between gap-2">
      <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono font-medium flex-shrink-0">
        {label}
      </span>
      <span
        className={`text-[11px] text-right truncate ${isMono ? 'font-mono' : 'font-sans'}`}
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </span>
    </div>
  )
}

export function OceanInfoPanel({
  selectedVariable,
  selectedDepth,
  selectedTimeIndex,
  selectedTime,
  selectedObservation,
  selectedMeasurement,
  onClearMeasurement,
  onOpenProfile,
  onOpenComparison,
}: OceanInfoPanelProps) {
  const [copied, setCopied] = useState(false)
  const cfg = VARIABLE_COLOR_CONFIGS[selectedVariable]

  // Representative point calculation
  const sampleLat = 14.5
  const sampleLon = 87.5
  const sampleValue = getOceanValue(sampleLat, sampleLon, selectedDepth, selectedVariable, selectedTimeIndex)
  const sampleColor = valueToCSSColor(sampleValue, selectedVariable)
  const region = getRegionName(sampleLat, sampleLon)

  function handleCopyCoords(lat: number, lon: number) {
    const text = `${lat.toFixed(4)}, ${lon.toFixed(4)}`
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto font-sans text-xs divide-y divide-white/5">
      {/* ── 1. Model Point Grid Measurement (if user clicked ocean point) ── */}
      {selectedMeasurement ? (
        <div className="p-3 space-y-2.5 bg-cyan-950/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-cyan-400 font-mono font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Model Grid Node Query
            </span>
            <button
              onClick={onClearMeasurement}
              className="text-slate-400 hover:text-white p-0.5"
              title="Clear Point Selection"
              aria-label="Clear Point Selection"
            >
              <X size={12} />
            </button>
          </div>

          {/* Primary Value Readout Card */}
          <div className="p-2.5 rounded bg-[#020b17] border border-cyan-500/30 space-y-1">
            <span className="text-[9px] uppercase text-slate-400 font-mono block">
              {selectedMeasurement.variable.replace('_', ' ')}
            </span>
            <div className="flex items-baseline gap-1.5">
              <span
                className="text-xl font-bold font-mono"
                style={{
                  color: valueToCSSColor(
                    selectedMeasurement.value,
                    selectedMeasurement.variable as OceanVariable
                  ),
                }}
              >
                {selectedMeasurement.value}
              </span>
              <span className="text-xs text-slate-300 font-mono">{selectedMeasurement.unit}</span>
            </div>
          </div>

          {/* Coordinates & Node Metadata */}
          <div className="space-y-0.5">
            <ScientificRow
              label="Latitude"
              value={`${Math.abs(selectedMeasurement.latitude).toFixed(3)}° ${selectedMeasurement.latitude >= 0 ? 'N' : 'S'}`}
            />
            <ScientificRow
              label="Longitude"
              value={`${Math.abs(selectedMeasurement.longitude).toFixed(3)}° ${selectedMeasurement.longitude >= 0 ? 'E' : 'W'}`}
            />
            <ScientificRow label="Depth Layer" value={`${selectedMeasurement.depth} m`} />
            <ScientificRow label="Timestamp" value={selectedMeasurement.timestamp} />
            <ScientificRow
              label="CF Standard Name"
              value={CF_STANDARD_NAMES[selectedMeasurement.variable as OceanVariable]?.standard ?? 'sea_water_property'}
            />
            <ScientificRow label="Grid Resolution" value="~0.25° × 0.25°" />
            <ScientificRow label="Data Mode" value="DEMO / SIMULATED" accent="#f59e0b" />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex gap-1.5">
            <button
              onClick={() => handleCopyCoords(selectedMeasurement.latitude, selectedMeasurement.longitude)}
              className="flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-[10px] font-mono transition-colors"
            >
              {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
              <span>{copied ? 'Copied' : 'Copy Coords'}</span>
            </button>
            {onOpenProfile && (
              <button
                onClick={onOpenProfile}
                className="flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 border border-cyan-500/40 text-[10px] font-mono transition-colors"
              >
                <BarChart2 size={11} />
                <span>View Profile</span>
              </button>
            )}
          </div>
        </div>
      ) : null}

      {/* ── 2. In-Situ Observation Platform Telemetry (if marker selected) ── */}
      {selectedObservation ? (
        <div className="p-3 space-y-2.5 bg-emerald-950/15">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-mono font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              In-Situ Platform Telemetry
            </span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
              {selectedObservation.type.toUpperCase()}
            </span>
          </div>

          <div className="p-2.5 rounded bg-[#020b17] border border-emerald-500/30 space-y-1">
            <span className="text-[9px] uppercase text-slate-400 font-mono block">Platform ID</span>
            <div className="text-sm font-bold text-white font-mono">{selectedObservation.id}</div>
            <div className="text-[10px] text-slate-400 font-mono">WMO Ref: {selectedObservation.platformId}</div>
          </div>

          <div className="space-y-0.5">
            <ScientificRow
              label="Position"
              value={`${Math.abs(selectedObservation.latitude).toFixed(2)}°N, ${Math.abs(selectedObservation.longitude).toFixed(2)}°E`}
            />
            <ScientificRow label="Operating Depth" value={`${selectedObservation.currentDepth} m`} />
            <ScientificRow
              label="Temperature"
              value={`${selectedObservation.temperature.toFixed(2)} °C`}
              accent="#f97316"
            />
            <ScientificRow
              label="Salinity"
              value={`${selectedObservation.salinity.toFixed(2)} PSU`}
              accent="#06b6d4"
            />
            <ScientificRow
              label="Chlorophyll-a"
              value={`${selectedObservation.chlorophyll.toFixed(3)} mg/m³`}
              accent="#10b981"
            />
            <ScientificRow label="Geographic Region" value={selectedObservation.region} />
            <ScientificRow label="Observation Time" value={selectedObservation.timestamp.replace('T', ' ').replace('Z', ' UTC')} />
          </div>

          {/* ── Model vs Observation Comparison ── */}
          {(() => {
             const hasObs = ['temperature', 'salinity', 'chlorophyll'].includes(selectedVariable)
             if (!hasObs) return null

             const modelVal = getOceanValue(selectedObservation.latitude, selectedObservation.longitude, selectedObservation.currentDepth, selectedVariable, selectedTimeIndex)
             
             let obsVal = selectedObservation.temperature
             if (selectedVariable === 'salinity') obsVal = selectedObservation.salinity
             else if (selectedVariable === 'chlorophyll') obsVal = selectedObservation.chlorophyll
             
             const diff = modelVal - obsVal
             const absDiff = Math.abs(diff)
             
             let status = 'Low'
             let textColor = 'text-emerald-400'
             let bgClass = 'bg-emerald-400/10 border-emerald-500/30'
             let circleClass = 'bg-emerald-400'
             
             if (selectedVariable === 'temperature') {
                if (absDiff > 1.0) { status = 'High'; textColor = 'text-red-400'; bgClass = 'bg-red-400/10 border-red-500/30'; circleClass = 'bg-red-400'; }
                else if (absDiff > 0.5) { status = 'Moderate'; textColor = 'text-amber-400'; bgClass = 'bg-amber-400/10 border-amber-500/30'; circleClass = 'bg-amber-400'; }
             } else if (selectedVariable === 'salinity') {
                if (absDiff > 0.5) { status = 'High'; textColor = 'text-red-400'; bgClass = 'bg-red-400/10 border-red-500/30'; circleClass = 'bg-red-400'; }
                else if (absDiff > 0.2) { status = 'Moderate'; textColor = 'text-amber-400'; bgClass = 'bg-amber-400/10 border-amber-500/30'; circleClass = 'bg-amber-400'; }
             } else if (selectedVariable === 'chlorophyll') {
                if (absDiff > 0.3) { status = 'High'; textColor = 'text-red-400'; bgClass = 'bg-red-400/10 border-red-500/30'; circleClass = 'bg-red-400'; }
                else if (absDiff > 0.1) { status = 'Moderate'; textColor = 'text-amber-400'; bgClass = 'bg-amber-400/10 border-amber-500/30'; circleClass = 'bg-amber-400'; }
             }
             
             return (
               <div className="p-2.5 mt-2 rounded bg-[#020b17]/80 border border-emerald-500/20 space-y-1.5">
                  <span className="text-[9px] uppercase tracking-wider text-slate-300 font-mono font-bold flex items-center gap-1.5 mb-2">
                    Model Comparison ({selectedVariable})
                  </span>
                  <ScientificRow label="Observed (In-Situ)" value={`${obsVal.toFixed(2)}`} accent="#10b981" />
                  <ScientificRow label="Model Forecast" value={`${modelVal.toFixed(2)}`} accent="#38bdf8" />
                  <ScientificRow 
                     label="Difference" 
                     value={`${diff > 0 ? '+' : ''}${diff.toFixed(2)}`} 
                     accent={diff > 0 ? '#f87171' : '#38bdf8'} 
                  />
                  
                  <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between">
                     <span className="text-[9px] uppercase text-slate-400 font-mono">Accuracy Status</span>
                     <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border ${bgClass}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${circleClass} animate-pulse`} />
                        <span className={`text-[10px] uppercase font-mono font-bold ${textColor}`}>{status} Variance</span>
                     </div>
                  </div>
               </div>
             )
          })()}

          {/* Platform Actions */}
          <div className="pt-2 flex gap-1.5">
            {onOpenComparison && (
              <button
                onClick={onOpenComparison}
                className="w-full flex items-center justify-center gap-1.5 py-1 px-2 rounded bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/40 text-[10px] font-mono transition-colors"
              >
                <ExternalLink size={11} />
                <span>Compare vs Numerical Model</span>
              </button>
            )}
          </div>
        </div>
      ) : null}

      {/* ── 3. General Ocean Model Status ── */}
      <div className="p-3 space-y-2.5">
        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono font-semibold block">
          Numerical Ocean Model Status
        </span>

        <div className="space-y-0.5">
          <ScientificRow label="Selected Variable" value={cfg.label} isMono={false} />
          <ScientificRow
            label="Sample Value"
            value={`${sampleValue.toFixed(2)} ${cfg.unit}`}
            accent={sampleColor}
          />
          <ScientificRow label="Active Depth" value={`${selectedDepth} m`} />
          <ScientificRow label="Model Time" value={`${selectedTime.dateLabel} ${selectedTime.label} UTC`} />
          <ScientificRow label="Domain Area" value={region} isMono={false} />
          <ScientificRow
            label="Data Mode"
            value={selectedMeasurement?.provenance?.is_real_data ? 'LOCAL REAL DATA' : 'SIMULATED / DEMO'}
            accent={selectedMeasurement?.provenance?.is_real_data ? '#10b981' : '#f59e0b'}
          />
        </div>
      </div>

      {/* ── 4. Data Provenance & Traceability HUD ── */}
      <DataProvenanceHUD
        provenance={selectedMeasurement?.provenance || selectedObservation?.provenance}
        isRealData={selectedMeasurement?.provenance?.is_real_data}
      />
    </div>
  )
}
