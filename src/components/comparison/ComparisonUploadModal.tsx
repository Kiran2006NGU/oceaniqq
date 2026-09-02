/**
 * ComparisonUploadModal.tsx — Multi-Format Dataset Upload Modal
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 *
 * Supports drag-and-drop ingestion of:
 * - NetCDF (.nc, .nc4) via Python xarray
 * - Delimited text (.csv, .tsv, .txt) with automatic delimiter detection
 * - JSON / GeoJSON (.json, .geojson)
 */

import { useState, useRef } from 'react'
import {
  Upload,
  X,
  FileCode,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import { uploadComparisonDataset } from '@/services/api/comparisonService'
import type { ComparisonDatasetOption, UploadDatasetResponse } from '@/types/comparison'

interface ComparisonUploadModalProps {
  isOpen: boolean
  onClose: () => void
  datasetType: 'model' | 'observation'
  onDatasetUploaded: (dataset: ComparisonDatasetOption) => void
}

export function ComparisonUploadModal({
  isOpen,
  onClose,
  datasetType,
  onDatasetUploaded,
}: ComparisonUploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [customName, setCustomName] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadResult, setUploadResult] = useState<UploadDatasetResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile)
    if (!customName) {
      setCustomName(selectedFile.name.replace(/\.[^/.]+$/, ''))
    }
    setUploadStatus('idle')
    setErrorMessage(null)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleUploadSubmit = async () => {
    if (!file) return

    setUploadStatus('uploading')
    setUploadProgress(20)
    setErrorMessage(null)

    // Simulate progress animation for UX feedback
    const progressTimer = setInterval(() => {
      setUploadProgress((p) => (p < 85 ? p + 15 : p))
    }, 200)

    try {
      const res = await uploadComparisonDataset(file, datasetType, customName.trim() || undefined)
      clearInterval(progressTimer)
      setUploadProgress(100)
      setUploadStatus('success')
      setUploadResult(res)

      // Notify parent workspace
      const newOption: ComparisonDatasetOption = {
        id: res.dataset_id,
        name: res.name,
        provider: 'User Upload',
        format: res.format,
        variables: res.detected_variables,
        is_real_data: true,
        is_uploaded: true,
        record_count: res.record_count,
        description: `Uploaded ${res.format} dataset with ${res.record_count} records`,
      }
      onDatasetUploaded(newOption)
    } catch (err: unknown) {
      clearInterval(progressTimer)
      setUploadStatus('error')
      const msg = err instanceof Error ? err.message : 'Upload failed'
      setErrorMessage(msg)
    }
  }

  const resetModal = () => {
    setFile(null)
    setCustomName('')
    setUploadStatus('idle')
    setUploadResult(null)
    setErrorMessage(null)
    onClose()
  }

  const getFormatIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase()
    if (ext === 'nc' || ext === 'nc4') return <FileCode size={20} className="text-cyan-400" />
    if (ext === 'csv' || ext === 'tsv') return <FileSpreadsheet size={20} className="text-emerald-400" />
    return <FileText size={20} className="text-amber-400" />
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-sans">
      <div className="w-full max-w-lg bg-[#030e1f] border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#051426]">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
              <Upload size={18} />
            </span>
            <div>
              <h3 className="text-sm font-bold font-mono text-white">
                Upload {datasetType === 'model' ? 'Numerical Model File' : 'In-Situ Observation File'}
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Supports NetCDF (.nc), CSV (.csv), TSV (.tsv), Text (.txt), and JSON (.json)
              </p>
            </div>
          </div>
          <button
            onClick={resetModal}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
              isDragging
                ? 'border-cyan-400 bg-cyan-950/40'
                : file
                ? 'border-emerald-500/50 bg-emerald-950/20'
                : 'border-white/15 bg-black/30 hover:border-cyan-400/50 hover:bg-white/2'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".nc,.nc4,.csv,.tsv,.txt,.json,.geojson"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFileSelect(e.target.files[0])
              }}
              className="hidden"
            />

            {file ? (
              <div className="flex items-center gap-3">
                {getFormatIcon(file.name)}
                <div className="text-left">
                  <span className="text-xs font-mono font-bold text-white block">{file.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB · Click or drag to replace
                  </span>
                </div>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 flex items-center justify-center shadow-lg">
                  <Upload size={22} />
                </div>
                <span className="text-xs font-mono font-bold text-white">
                  Drag & drop file here, or <span className="text-cyan-400 underline">browse</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  NetCDF CF-1.8 grids, Argo/Glider profiles, or delimited tables
                </span>
              </>
            )}
          </div>

          {/* Custom Name */}
          <div>
            <label className="text-[10px] font-mono text-slate-400 font-bold uppercase block mb-1">
              Dataset Display Label (Optional)
            </label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="e.g. Argo Float 2903334 Profile or Local Model"
              className="w-full py-2 px-3 rounded-lg bg-black/40 border border-white/15 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Supported Format Pills */}
          <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-1.5 font-mono text-[10px]">
            <div className="text-slate-400 font-bold">Auto-Detected Fields:</div>
            <div className="flex flex-wrap gap-1">
              <span className="px-2 py-0.5 rounded bg-white/5 text-cyan-300 border border-white/10">latitude / lat</span>
              <span className="px-2 py-0.5 rounded bg-white/5 text-cyan-300 border border-white/10">longitude / lon</span>
              <span className="px-2 py-0.5 rounded bg-white/5 text-cyan-300 border border-white/10">depth / level</span>
              <span className="px-2 py-0.5 rounded bg-white/5 text-cyan-300 border border-white/10">time / date</span>
              <span className="px-2 py-0.5 rounded bg-white/5 text-emerald-300 border border-white/10">temperature (temp)</span>
              <span className="px-2 py-0.5 rounded bg-white/5 text-emerald-300 border border-white/10">salinity (sal)</span>
              <span className="px-2 py-0.5 rounded bg-white/5 text-emerald-300 border border-white/10">chlorophyll (chl)</span>
            </div>
          </div>

          {/* Uploading Progress */}
          {uploadStatus === 'uploading' && (
            <div className="space-y-2 p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 font-mono">
              <div className="flex items-center justify-between text-xs text-cyan-300">
                <span className="flex items-center gap-1.5">
                  <Loader2 size={13} className="animate-spin" />
                  Parsing & Validating Schema...
                </span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-400 transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Success Summary */}
          {uploadStatus === 'success' && uploadResult && (
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-2 font-mono animate-fade-in">
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                <CheckCircle2 size={16} />
                <span>Dataset Ingestion & Validation Succeeded!</span>
              </div>
              <div className="text-[11px] text-slate-300 pl-6 space-y-0.5">
                <div>✓ Format: <strong className="text-white">{uploadResult.format}</strong></div>
                <div>✓ Records Normalized: <strong className="text-white">{uploadResult.record_count}</strong></div>
                <div>✓ Detected Variables: <strong className="text-cyan-300">{uploadResult.detected_variables.join(', ')}</strong></div>
              </div>
            </div>
          )}

          {/* Error Notice */}
          {uploadStatus === 'error' && errorMessage && (
            <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/40 space-y-1 font-mono text-xs text-red-300 animate-fade-in">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle size={16} />
                <span>Ingestion Validation Error</span>
              </div>
              <div className="text-[11px] text-red-200/90 pl-6 leading-relaxed">
                {errorMessage}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-white/10 bg-[#051426]">
          <button
            onClick={resetModal}
            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-mono text-xs transition-colors"
          >
            {uploadStatus === 'success' ? 'Close' : 'Cancel'}
          </button>
          {uploadStatus !== 'success' && (
            <button
              onClick={handleUploadSubmit}
              disabled={!file || uploadStatus === 'uploading'}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-mono font-bold text-xs transition-all shadow-lg shadow-cyan-950/40"
            >
              <Upload size={14} />
              <span>Parse & Ingest</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
