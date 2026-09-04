/**
 * ExportPanel.tsx — Floating Export Options Panel
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 *
 * Provides export options: Excel (.xlsx), CSV, JSON, and graph builder trigger.
 * Drop this panel anywhere — pass the data array and export label.
 */

import { useState } from 'react'
import { Download, FileSpreadsheet, FileText, BarChart2, X, ChevronDown } from 'lucide-react'
import type { MockObservation } from '@/services/data/mockOceanData'
import {
  exportObservationsToExcel,
  exportObservationsToCSV,
  exportArrayToExcel,
} from '@/utils/excelExport'

interface ExportPanelProps {
  observations?: MockObservation[]
  genericData?: Record<string, unknown>[]
  genericFilename?: string
  label?: string
  onOpenGraphBuilder?: () => void
}

export function ExportPanel({
  observations,
  genericData,
  genericFilename = 'OceanIQ_Export',
  label = 'Export Data',
  onOpenGraphBuilder,
}: ExportPanelProps) {
  const [open, setOpen] = useState(false)
  const [exporting, setExporting] = useState(false)

  const handleExcel = async () => {
    setExporting(true)
    try {
      if (observations) {
        exportObservationsToExcel(observations)
      } else if (genericData) {
        exportArrayToExcel(genericData, `${genericFilename}.xlsx`)
      }
    } finally {
      setExporting(false)
      setOpen(false)
    }
  }

  const handleCSV = () => {
    if (observations) exportObservationsToCSV(observations)
    else if (genericData) {
      import('file-saver').then(({ saveAs }) => {
        import('xlsx').then((XLSX) => {
          const ws = XLSX.utils.json_to_sheet(genericData!)
          const csv = XLSX.utils.sheet_to_csv(ws)
          saveAs(new Blob([csv], { type: 'text/csv' }), `${genericFilename}.csv`)
        })
      })
    }
    setOpen(false)
  }

  const handleJSON = () => {
    const data = observations ?? genericData ?? []
    import('file-saver').then(({ saveAs }) => {
      saveAs(
        new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
        `${genericFilename}.json`,
      )
    })
    setOpen(false)
  }

  const count = observations?.length ?? genericData?.length ?? 0

  return (
    <div className="relative">
      <button
        id="export-panel-btn"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/30 text-emerald-300 text-xs font-mono font-bold transition-all cursor-pointer shadow-sm"
        title={`Export ${count} records`}
      >
        <Download size={13} />
        <span>{label}</span>
        <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-52 rounded-2xl bg-[#0e1726] border border-white/15 shadow-2xl p-2 z-50 animate-fade-in font-mono text-xs">
          <div className="flex items-center justify-between px-2 py-1 mb-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Export {count} Records</span>
            <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-white cursor-pointer">
              <X size={12} />
            </button>
          </div>

          {/* Excel */}
          <button
            onClick={handleExcel}
            disabled={exporting}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/8 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <FileSpreadsheet size={14} className="text-emerald-400 shrink-0" />
            <div className="text-left">
              <div className="font-bold text-[11px]">Export as Excel (.xlsx)</div>
              <div className="text-[9px] text-slate-500">Multi-sheet with metadata</div>
            </div>
          </button>

          {/* CSV */}
          <button
            onClick={handleCSV}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/8 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <FileText size={14} className="text-amber-400 shrink-0" />
            <div className="text-left">
              <div className="font-bold text-[11px]">Export as CSV</div>
              <div className="text-[9px] text-slate-500">Plain text, universal</div>
            </div>
          </button>

          {/* JSON */}
          <button
            onClick={handleJSON}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/8 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <FileText size={14} className="text-blue-400 shrink-0" />
            <div className="text-left">
              <div className="font-bold text-[11px]">Export as JSON</div>
              <div className="text-[9px] text-slate-500">Raw structured data</div>
            </div>
          </button>

          {/* Graph Builder */}
          {onOpenGraphBuilder && (
            <>
              <div className="border-t border-white/8 my-1" />
              <button
                onClick={() => { onOpenGraphBuilder(); setOpen(false) }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-cyan-500/10 text-cyan-300 transition-colors cursor-pointer"
              >
                <BarChart2 size={14} className="text-cyan-400 shrink-0" />
                <div className="text-left">
                  <div className="font-bold text-[11px]">Create Graph</div>
                  <div className="text-[9px] text-slate-500">Interactive chart builder</div>
                </div>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
