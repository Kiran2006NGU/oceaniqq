/**
 * ProvidersPage.tsx — Page 8: Extensible Data Providers & Sensor Plugin Architecture
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 *
 * Implements Concept 18:
 * - Extensible DataProvider Plugin Architecture
 * - Connected data streams (INCOIS, Copernicus Marine, Argo GDAC, Glider)
 * - Plug-and-play future sensor slots (HF Radar, Moorings, ADCP, INSAT-3D, ML Emulators)
 * - Provider capability discovery matrix
 */

import { Link } from 'react-router-dom'
import {
  Network,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  PlusCircle,
  Cpu,
  Radio,
  Satellite,
  Activity,
  Waves,
} from 'lucide-react'

const ACTIVE_PROVIDERS = [
  {
    id: 'incois-samudra',
    name: 'INCOIS SAMUDRA Portal & REST API',
    org: 'ESSO — Indian National Centre for Ocean Information Services (INCOIS)',
    type: 'Operational Ocean Forecast & Advisory Engine',
    format: 'JSON REST API / GeoTIFF / NetCDF-4',
    status: 'CONNECTED',
    variables: ['Real-time SST', 'Sea Surface Height (SSH)', 'Current Vectors', 'PFZ Advisories', 'Argo GDAC'],
    coverage: 'Indian Ocean Basin & Indian Exclusive Economic Zone (EEZ)',
    capabilities: ['Real-time SST Feeds', 'SSH Anomaly Grids', 'PFZ Species Hotspots', 'Argo Float Mirror'],
  },
  {
    id: 'incois-las',
    name: 'INCOIS Live LAS Provider',
    org: 'Indian National Centre for Ocean Information Services (INCOIS)',
    type: 'Numerical Ocean Model',
    format: 'NetCDF-4 / OPeNDAP / CF-1.8',
    status: 'CONNECTED',
    variables: ['Temperature', 'Salinity', 'Currents (u, v)', 'Sea Surface Height'],
    coverage: 'Indian Ocean Basin (40°E–100°E, 30°S–30°N)',
    capabilities: ['3D Scalar Fields', 'Current Vectors', 'Depth Slices', 'Time Animation'],
  },
  {
    id: 'copernicus',
    name: 'Copernicus Marine Service (GLOBAL_MULTIYEAR_PHY_001_030)',
    org: 'Mercator Ocean International / European Union',
    type: 'Global Ocean Reanalysis',
    format: 'NetCDF / WMS / WCS',
    status: 'CONNECTED',
    variables: ['Temperature', 'Salinity', 'Chlorophyll-a', 'Current Velocity'],
    coverage: 'Global Oceans (0.25° Equirectangular Grid)',
    capabilities: ['3D Scalar Fields', 'Depth Slices', 'Isosurface Extraction'],
  },
  {
    id: 'argo-gdac',
    name: 'Argo Global Data Assembly Centre (GDAC)',
    org: 'International Argo Program / Ifremer',
    type: 'In-Situ Profiling Floats',
    format: 'NetCDF / ASCII Delimited',
    status: 'CONNECTED',
    variables: ['Temperature Profiles', 'Salinity Profiles', 'Pressure'],
    coverage: '4,000+ Active Floats Worldwide (0–2000m)',
    capabilities: ['Observation Markers', 'Vertical CTD Profiles', 'Model Residuals'],
  },
  {
    id: 'glider-network',
    name: 'Autonomous Underwater Glider Facility',
    org: 'Ocean Glider Initiative / INCOIS Facility',
    type: 'Autonomous Sawtooth Telemetry',
    format: 'ASCII / CSV / NetCDF',
    status: 'CONNECTED',
    variables: ['High-Res Temperature', 'Salinity', 'Dissolved O₂', 'Turbidity'],
    coverage: 'Coastal & Deep Basin Sawtooth Missions',
    capabilities: ['3D Sawtooth Paths', 'High-Res Transects', 'Telemetry Stream'],
  },
]

const FUTURE_PLUGIN_SLOTS = [
  {
    id: 'hf-radar',
    title: 'Coastal High-Frequency (HF) Radar Network',
    desc: 'Real-time surface current velocity mapping along Indian coastlines with 15-minute sampling rates.',
    icon: <Radio size={18} className="text-cyan-400" />,
    type: 'Surface Radar',
  },
  {
    id: 'adcp',
    title: 'Acoustic Doppler Current Profiler (ADCP)',
    desc: 'Moored acoustic current velocity soundings measuring full water column velocity shears.',
    icon: <Waves size={18} className="text-emerald-400" />,
    type: 'Acoustic Mooring',
  },
  {
    id: 'satellite-insat',
    title: 'ISRO INSAT-3D & Oceansat Satellite Products',
    desc: 'High-resolution thermal infrared SST and ocean color optical radiometry feeds.',
    icon: <Satellite size={18} className="text-purple-400" />,
    type: 'Satellite Radiometry',
  },
  {
    id: 'ml-emulator',
    title: 'Deep Learning Ocean State Surrogate Models',
    desc: 'Physics-informed neural networks (PINNs) delivering instantaneous sub-kilometer inference.',
    icon: <Cpu size={18} className="text-pink-400" />,
    type: 'AI / ML Emulator',
  },
]

export function ProvidersPage() {
  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[#010610] text-slate-100 font-sans selection:bg-cyan-500 selection:text-black">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="px-4 py-3 border-b border-white/10 bg-[#030d1a]/90 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-400/40">
              <Network size={16} />
            </span>
            <h1 className="text-base font-bold text-white font-mono">Data Providers & Plugin Architecture</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              Concept 18 · OGC & CF Standardized
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Modular provider contract decoupling acquisition, normalization, API transport, and 3D rendering
          </p>
        </div>

        <Link
          to="/data"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 text-black font-mono font-bold text-xs shadow-md hover:bg-cyan-400 transition-all"
        >
          <Sparkles size={13} />
          <span>Browse Data Hub</span>
          <ExternalLink size={12} />
        </Link>
      </header>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-8 w-full">
        {/* Section 1: Active Connected Providers */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 size={18} className="text-emerald-400" />
            <h2 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
              Connected Live Data Providers ({ACTIVE_PROVIDERS.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ACTIVE_PROVIDERS.map((p) => (
              <div
                key={p.id}
                className="p-5 rounded-2xl bg-[#030d1a] border border-white/10 hover:border-cyan-400/40 transition-all shadow-xl space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white font-mono">{p.name}</h3>
                    <div className="text-xs text-slate-400 font-mono">{p.org}</div>
                  </div>
                  <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-bold">
                    ● {p.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-black/30 p-2.5 rounded-xl border border-white/5">
                  <div>
                    <span className="text-[9px] text-slate-500 block uppercase">DATA TYPE</span>
                    <span className="text-slate-200">{p.type}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 block uppercase">PROTOCOL / FORMAT</span>
                    <span className="text-cyan-300">{p.format}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-mono block mb-1">Supported Capabilities:</span>
                  <div className="flex flex-wrap gap-1">
                    {p.capabilities.map((c) => (
                      <span
                        key={c}
                        className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-cyan-200"
                      >
                        ✓ {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Extensible Future Plugin Slots */}
        <div className="pt-4 border-t border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <PlusCircle size={18} className="text-purple-400" />
            <h2 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
              Plug-and-Play Future Sensor Slots (Concept 18 Architecture)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FUTURE_PLUGIN_SLOTS.map((s) => (
              <div
                key={s.id}
                className="p-4 rounded-xl bg-[#020b18] border border-dashed border-white/20 hover:border-purple-400/60 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-lg bg-white/5 border border-white/10">{s.icon}</div>
                    <span className="text-[8px] font-mono uppercase px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-400/30">
                      Plugin Ready
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-white mb-1.5 font-mono">{s.title}</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-mono">{s.desc}</p>
                </div>

                <div className="mt-4 pt-2 border-t border-white/5 text-[10px] font-mono text-slate-500 flex items-center justify-between">
                  <span>Interface: IDataProvider</span>
                  <span className="text-purple-300">Ready</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
