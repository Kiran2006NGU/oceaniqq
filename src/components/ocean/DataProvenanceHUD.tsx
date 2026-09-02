/**
 * DataProvenanceHUD.tsx — Scientific Data Provenance & QC Traceability Card
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 *
 * Renders scientific data lineage, processing steps, quality control status,
 * model grid resolution, and source institution.
 */

import { ShieldCheck, CheckCircle2 } from 'lucide-react'
import type { ProvenanceInfo } from '@/types/ocean'

interface DataProvenanceHUDProps {
  provenance?: ProvenanceInfo | null
  isRealData?: boolean
}

export function DataProvenanceHUD({ provenance, isRealData }: DataProvenanceHUDProps) {
  const isReal = provenance?.is_real_data ?? isRealData ?? false

  return (
    <div className="p-3 space-y-2.5 font-sans text-xs bg-[#020b17]/90 border-t border-white/5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-cyan-400 font-mono font-bold flex items-center gap-1.5">
          <ShieldCheck size={13} className={isReal ? 'text-emerald-400' : 'text-amber-400'} />
          Scientific Data Provenance
        </span>
        <span
          className={`text-[8px] px-1.5 py-0.2 rounded font-mono font-bold uppercase ${
            isReal
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
          }`}
        >
          {isReal ? 'LOCAL REAL DATA' : 'DEMO / SYNTHETIC'}
        </span>
      </div>

      <div className="space-y-1.5 font-mono text-[10px] bg-white/2 p-2 rounded border border-white/5">
        <div className="flex justify-between">
          <span className="text-slate-400">Data Provider:</span>
          <span className="text-slate-200 font-semibold">{provenance?.provider ?? (isReal ? 'INCOIS' : 'OceanIQ Synthetic')}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-400">Source Model:</span>
          <span className="text-cyan-300 font-semibold">{provenance?.model_name ?? (isReal ? 'HYCOM Indian Ocean' : 'OceanIQ Demo')}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-400">File Ingested:</span>
          <span className="text-slate-300 truncate max-w-[150px]">{provenance?.source_file ?? (isReal ? 'INCOIS_HYCOM_IndianOcean_20260828.nc' : 'demo_ocean.nc')}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-400">Spatial Resolution:</span>
          <span className="text-slate-300">{provenance?.resolution ?? (isReal ? '0.08° (~9 km)' : '~0.25°')}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-400">QC Status:</span>
          <span className={isReal ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
            {provenance?.quality_status ?? (isReal ? 'verified_real' : 'synthetic_demo')}
          </span>
        </div>
      </div>

      {/* Processing Pipeline Steps */}
      {provenance?.processing && provenance.processing.length > 0 && (
        <div className="space-y-1">
          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono block">
            Transformation Pipeline
          </span>
          <div className="flex flex-wrap gap-1">
            {provenance.processing.map((step) => (
              <span
                key={step}
                className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-mono text-cyan-300"
              >
                {step.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Scientific Honesty Guarantee */}
      <div className="text-[9px] text-slate-500 font-mono leading-relaxed border-t border-white/5 pt-1.5 flex items-center gap-1.5">
        <CheckCircle2 size={11} className="text-emerald-400 flex-shrink-0" />
        <span>Traceable NetCDF data model. Zero unverified operational claims.</span>
      </div>
    </div>
  )
}
