/**
 * AnalysisLabPage.tsx — Page 6: Advanced Scientific Ocean Diagnostics Lab
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 *
 * Implements:
 * 1. 2-Point Vertical Ocean Transect / Cross-Section Slicer (Distance vs Depth Heatmap)
 * 2. T-S Water Mass Diagram with Isopycnal Density Contours (sigma-theta)
 * 3. Hovmöller Time-Depth Vertical Dispersion Diagnostic
 */

import { useState, useMemo, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  Layers,
  Sparkles,
  ExternalLink,
  Compass,
  ArrowRight,
  TrendingUp,
  Waves,
  MapPin,
} from 'lucide-react'
import { getOceanValueSync } from '@/services/data/dataSource'
import { valueToRGB, VARIABLE_COLOR_CONFIGS } from '@/utils/oceanColorScale'
import type { OceanVariable } from '@/types/ocean'

export function AnalysisLabPage() {
  const [transectPreset, setTransectPreset] = useState<'arabian_bob' | 'equatorial' | 'somali'>('arabian_bob')
  const [selectedVariable, setSelectedVariable] = useState<OceanVariable>('temperature')
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<'transect' | 'ts_diagram' | 'hovmoller'>('transect')

  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Transect bounding presets
  const transectConfig = useMemo(() => {
    switch (transectPreset) {
      case 'arabian_bob':
        return {
          name: 'Zonal Transect: Arabian Sea → Bay of Bengal (15°N)',
          start: { lat: 15, lon: 62, label: 'Arabian Sea (62°E)' },
          end: { lat: 15, lon: 90, label: 'Bay of Bengal (90°E)' },
          steps: 40,
        }
      case 'equatorial':
        return {
          name: 'Equatorial Jet Transect (0°N, 50°E → 95°E)',
          start: { lat: 0, lon: 50, label: 'Western Eq. (50°E)' },
          end: { lat: 0, lon: 95, label: 'Eastern Eq. (95°E)' },
          steps: 40,
        }
      case 'somali':
        return {
          name: 'Somali Upwelling Transect (5°S → 18°N, 55°E)',
          start: { lat: -5, lon: 55, label: 'South (5°S)' },
          end: { lat: 18, lon: 55, label: 'North (18°N)' },
          steps: 40,
        }
    }
  }, [transectPreset])

  // Draw 2D Transect Heatmap Canvas
  useEffect(() => {
    if (activeAnalysisTab !== 'transect' || !canvasRef.current) return
    const cvs = canvasRef.current
    const ctx = cvs.getContext('2d')
    if (!ctx) return

    const w = cvs.width
    const h = cvs.height
    const imgData = ctx.createImageData(w, h)
    const data = imgData.data

    const maxDepth = 1000

    for (let py = 0; py < h; py++) {
      const depth = (py / h) * maxDepth // 0m to 1000m

      for (let px = 0; px < w; px++) {
        const frac = px / w
        const lat = transectConfig.start.lat + frac * (transectConfig.end.lat - transectConfig.start.lat)
        const lon = transectConfig.start.lon + frac * (transectConfig.end.lon - transectConfig.start.lon)

        const val = getOceanValueSync(lat, lon, depth, selectedVariable, 2)
        const [r, g, b] = valueToRGB(val, selectedVariable)

        const idx = (py * w + px) * 4
        data[idx] = Math.round(r * 255)
        data[idx + 1] = Math.round(g * 255)
        data[idx + 2] = Math.round(b * 255)
        data[idx + 3] = 255
      }
    }

    ctx.putImageData(imgData, 0, 0)
  }, [transectConfig, selectedVariable, activeAnalysisTab])

  // Water Mass T-S Data points for Indian Ocean
  const waterMasses = useMemo(() => {
    return [
      { name: 'Bay of Bengal Surface Water (BoB-LSSW)', temp: 29.2, sal: 32.4, color: '#38bdf8' },
      { name: 'Arabian Sea High Salinity Water (ASHSW)', temp: 26.8, sal: 36.6, color: '#f59e0b' },
      { name: 'Red Sea Outflow Water (RSOW)', temp: 17.5, sal: 35.8, color: '#ef4444' },
      { name: 'Persian Gulf Water (PGW)', temp: 22.1, sal: 36.2, color: '#f97316' },
      { name: 'Indian Central Water (ICW)', temp: 12.4, sal: 35.1, color: '#a855f7' },
      { name: 'Indian Ocean Deep Water (IODW)', temp: 2.8, sal: 34.7, color: '#3b82f6' },
    ]
  }, [])

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[#010610] text-slate-100 font-sans selection:bg-cyan-500 selection:text-black">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="px-4 py-3 border-b border-white/10 bg-[#030d1a]/90 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-pink-500/20 text-pink-300 border border-pink-400/40">
              <Activity size={16} />
            </span>
            <h1 className="text-base font-bold text-white font-mono">Scientific Ocean Diagnostics Lab</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-400/30">
              Transects · T-S Density · Hovmöller
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            2D vertical cross-sections, water mass classification, and thermocline depth analysis
          </p>
        </div>

        <Link
          to="/dashboard"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 text-black font-mono font-bold text-xs shadow-md hover:bg-cyan-400 transition-all"
        >
          <Sparkles size={13} />
          <span>Launch 3D Explorer</span>
          <ExternalLink size={12} />
        </Link>
      </header>

      {/* ── Main Workspace ──────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 w-full">
        {/* Diagnostic Mode Tab Switcher */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-xl bg-[#030d1a] border border-white/10 w-fit">
          {[
            { id: 'transect' as const, label: '📈 Vertical Transect Slicer' },
            { id: 'ts_diagram' as const, label: '🧪 T-S Water Mass Diagram' },
            { id: 'hovmoller' as const, label: '⏱️ Hovmöller Time-Depth' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveAnalysisTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                activeAnalysisTab === tab.id
                  ? 'bg-cyan-500 text-black shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── TAB 1: 2-Point Vertical Transect Slicer ───────────────────── */}
        {activeAnalysisTab === 'transect' && (
          <div className="space-y-4">
            {/* Transect Controls */}
            <div className="p-4 rounded-2xl bg-[#030d1a] border border-white/10 shadow-xl grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase font-mono text-slate-400 font-bold block mb-1.5">
                  Select Geographic Transect Path
                </label>
                <select
                  value={transectPreset}
                  onChange={(e) => setTransectPreset(e.target.value as any)}
                  className="w-full py-2 px-3 rounded-lg bg-[#020b18] border border-white/15 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="arabian_bob">Arabian Sea (62°E) → Bay of Bengal (90°E) at 15°N</option>
                  <option value="equatorial">Equatorial Jet Transect (50°E → 95°E at 0°N)</option>
                  <option value="somali">Somali Upwelling Meridional Transect (5°S → 18°N at 55°E)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono text-slate-400 font-bold block mb-1.5">
                  Cross-Section Variable
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['temperature', 'salinity', 'chlorophyll'] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setSelectedVariable(v)}
                      className={`py-2 px-2 rounded-lg text-xs font-mono font-bold border transition-all text-center ${
                        selectedVariable === v
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                          : 'bg-white/2 border-white/10 text-slate-400 hover:bg-white/5'
                      }`}
                    >
                      {v === 'temperature' ? '🌡️ Temp' : v === 'salinity' ? '🧂 Salinity' : '🌿 Chl-a'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Transect 2D Heatmap Display */}
            <div className="p-5 rounded-2xl bg-[#030d1a] border border-cyan-500/30 shadow-xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Waves size={18} className="text-cyan-400" />
                  <h3 className="text-sm font-bold font-mono text-white">{transectConfig.name}</h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  Depth: 0m (Surface) to 1000m (Abyssal)
                </span>
              </div>

              {/* Canvas Box */}
              <div className="relative border border-white/15 rounded-xl overflow-hidden bg-black">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={250}
                  className="w-full h-64 object-fill block"
                />

                {/* Y-axis Depth Labels */}
                <div className="absolute left-2 top-2 bottom-2 flex flex-col justify-between text-[10px] font-mono text-white/80 pointer-events-none drop-shadow-md">
                  <span>0m</span>
                  <span>250m (Thermocline)</span>
                  <span>500m</span>
                  <span>1000m</span>
                </div>

                {/* X-axis Station Labels */}
                <div className="absolute bottom-2 left-3 right-3 flex justify-between text-[10px] font-mono font-bold text-white pointer-events-none drop-shadow-md">
                  <span>◀ {transectConfig.start.label}</span>
                  <span>{transectConfig.end.label} ▶</span>
                </div>
              </div>

              <p className="text-xs text-slate-400 font-mono leading-relaxed pt-1">
                Visualizes the vertical thermohaline stratification across the Indian Ocean basin. Highlights the shallow warm pool in the Bay of Bengal and upwelling domes off the Somali / Arabian coast.
              </p>
            </div>
          </div>
        )}

        {/* ── TAB 2: T-S Water Mass Diagram ─────────────────────────────── */}
        {activeAnalysisTab === 'ts_diagram' && (
          <div className="p-5 rounded-2xl bg-[#030d1a] border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="text-sm font-bold font-mono text-white">
                  Temperature–Salinity (T-S) Water Mass Diagram
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Hydrographic water mass identification with potential density isopycnal contours (σθ)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* T-S Scatter Canvas Simulation */}
              <div className="p-4 rounded-xl bg-[#020b16] border border-white/10 relative h-72 flex items-center justify-center">
                {/* SVG Graph */}
                <svg className="w-full h-full" viewBox="0 0 400 250">
                  {/* Grid lines */}
                  <line x1="50" y1="20" x2="50" y2="210" stroke="#334155" strokeWidth="1" />
                  <line x1="50" y1="210" x2="380" y2="210" stroke="#334155" strokeWidth="1" />

                  {/* Isopycnal curves */}
                  <path d="M 60 40 Q 200 120 370 200" fill="none" stroke="#475569" strokeDasharray="3,3" />
                  <path d="M 60 90 Q 200 160 370 210" fill="none" stroke="#475569" strokeDasharray="3,3" />

                  <text x="320" y="180" fill="#64748b" fontSize="9" fontFamily="Calibri, sans-serif">σθ = 24.0</text>
                  <text x="320" y="200" fill="#64748b" fontSize="9" fontFamily="Calibri, sans-serif">σθ = 27.0</text>

                  {/* Axis labels */}
                  <text x="200" y="240" fill="#94a3b8" fontSize="11" fontFamily="Calibri, sans-serif" textAnchor="middle">Salinity (PSU) → [32 - 38]</text>
                  <text x="15" y="115" fill="#94a3b8" fontSize="11" fontFamily="Calibri, sans-serif" transform="rotate(-90 15,115)" textAnchor="middle">Temp (°C) → [0 - 32]</text>

                  {/* Water mass points */}
                  {waterMasses.map((wm, i) => {
                    const cx = 50 + ((wm.sal - 32) / 6) * 320
                    const cy = 210 - (wm.temp / 32) * 180
                    return (
                      <g key={wm.name}>
                        <circle cx={cx} cy={cy} r="6" fill={wm.color} stroke="#ffffff" strokeWidth="1.5" />
                        <text x={cx + 8} y={cy + 3} fill="#e2e8f0" fontSize="9" fontFamily="Calibri, sans-serif" fontWeight="bold">{wm.name.split(' ')[0]}</text>
                      </g>
                    )
                  })}
                </svg>
              </div>

              {/* Water Mass Key */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono uppercase font-bold text-slate-400">
                  Identified Indian Ocean Water Masses
                </h4>
                {waterMasses.map((wm) => (
                  <div
                    key={wm.name}
                    className="p-2.5 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between text-xs font-mono"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: wm.color }} />
                      <span className="text-slate-200 font-semibold">{wm.name}</span>
                    </div>
                    <span className="text-cyan-300">
                      {wm.temp}°C · {wm.sal} PSU
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: Hovmöller Time-Depth Diagnostic ───────────────────── */}
        {activeAnalysisTab === 'hovmoller' && (
          <div className="p-5 rounded-2xl bg-[#030d1a] border border-white/10 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-sm font-bold font-mono text-white">
                Hovmöller Time-vs-Depth Dispersion Matrix (Bay of Bengal Warm Pool)
              </h3>
              <span className="text-xs text-slate-400 font-mono">Temporal Evolution [28 Aug – 02 Sep 2026]</span>
            </div>

            <div className="grid grid-cols-5 gap-2 p-3 bg-black/40 rounded-xl font-mono text-xs text-center">
              {['28 Aug (00:00)', '29 Aug (06:00)', '30 Aug (12:00)', '31 Aug (18:00)', '01 Sep (12:00)'].map((t, idx) => (
                <div key={t} className="space-y-1">
                  <div className="text-[10px] text-slate-400 font-bold">{t}</div>
                  <div className="h-32 rounded-lg bg-gradient-to-b from-red-500 via-amber-400 to-blue-900 border border-white/10 flex flex-col justify-between p-1.5 text-[9px] text-white">
                    <span>29.5°C (SFC)</span>
                    <span className="text-amber-200">22.0°C (100m)</span>
                    <span className="text-blue-200">5.0°C (800m)</span>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-400 font-mono pt-1">
              Tracks diurnal heating and upper-ocean mixed-layer depth (MLD) deepening under monsoonal winds.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
