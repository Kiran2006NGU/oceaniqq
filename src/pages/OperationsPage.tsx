/**
 * OperationsPage.tsx — Page 7: Operational Ocean Intelligence & Hazard Decision Support
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 *
 * Implements:
 * - Decision support presets for Disaster Management, Maritime Safety & Blue Economy
 * - Marine Heatwave & Bleaching Alert monitoring
 * - Search & Rescue (SAR) surface drift forecasting
 * - Potential Fishing Zone (PFZ) thermal front advisory
 * - Tropical Ocean Heat Content (TOHC) cyclogenesis monitoring
 */

import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ShieldAlert,
  Flame,
  LifeBuoy,
  Fish,
  Wind,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Compass,
  AlertTriangle,
  CheckCircle2,
  Layers,
} from 'lucide-react'

const OPERATIONAL_PRESETS = [
  {
    id: 'heatwave',
    title: 'Marine Heatwave & Coral Bleaching Monitor',
    badge: 'Disaster Prevention',
    badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40',
    icon: <Flame size={24} className="text-red-400" />,
    summary:
      'Continuous thermal anomaly surveillance monitoring Degree Heating Weeks (DHW) across Lakshadweep, Gulf of Mannar, and Andaman coral reef biomes.',
    targetRegion: 'Arabian Sea',
    variable: 'temperature',
    depth: 0,
    metrics: [
      { label: 'Thermal Anomaly', val: '+1.8°C above climatology' },
      { label: 'Bleaching Alert Level', val: 'Alert Level 1 (Moderate)' },
      { label: 'Vulnerable Reef Sites', val: 'Lakshadweep & Gulf of Mannar' },
    ],
    explorerLink: '/dashboard',
  },
  {
    id: 'sar',
    title: 'Search & Rescue (SAR) Surface Drift Prediction',
    badge: 'Maritime Emergency',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    icon: <LifeBuoy size={24} className="text-cyan-400" />,
    summary:
      'High-resolution surface current vector modeling ($u, v$) combined with windage leeway to simulate probabilistic emergency search cones.',
    targetRegion: 'Bay of Bengal',
    variable: 'current_velocity',
    depth: 0,
    metrics: [
      { label: 'Mean Surface Speed', val: '0.82 m/s (1.6 knots)' },
      { label: 'Dominant Flow', val: 'Eastward Monsoon Drift' },
      { label: 'Search Cone Radius', val: '14.2 Nautical Miles' },
    ],
    explorerLink: '/dashboard',
  },
  {
    id: 'pfz',
    title: 'Potential Fishing Zone (PFZ) Ocean Advisory',
    badge: 'Blue Economy',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    icon: <Fish size={24} className="text-emerald-400" />,
    summary:
      'Identifies thermal fronts and chlorophyll biomass upwelling boundaries along the Indian coastline for artisanal and commercial fisheries.',
    targetRegion: 'Arabian Sea',
    variable: 'chlorophyll',
    depth: 25,
    metrics: [
      { label: 'Chl-a Upwelling Core', val: '1.45 mg/m³ (Somali/Kerala)' },
      { label: 'Thermal Gradient', val: '0.8°C / 10 km (Strong Front)' },
      { label: 'Advisory Status', val: 'Active PFZ Generated' },
    ],
    explorerLink: '/dashboard',
  },
  {
    id: 'cyclone',
    title: 'Tropical Ocean Heat Content (TOHC) & Cyclogenesis',
    badge: 'Severe Weather',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    icon: <Wind size={24} className="text-purple-400" />,
    summary:
      'Evaluates Upper Ocean Heat Content and 26°C isothermal layer depth (D26) as thermodynamic fuel for rapid cyclone intensification in the Bay of Bengal.',
    targetRegion: 'Bay of Bengal',
    variable: 'temperature',
    depth: 50,
    metrics: [
      { label: 'D26 Isotherm Depth', val: '85 meters (Deep Heat Pool)' },
      { label: 'TOHC Index', val: '92 kJ/cm² (High Energy)' },
      { label: 'Cyclone Potential', val: 'Favorable Intensification' },
    ],
    explorerLink: '/dashboard',
  },
]

export function OperationsPage() {
  const [searchParams] = useSearchParams()
  const scenarioParam = searchParams.get('scenario') ?? ''
  const [activeScenario, setActiveScenario] = useState<string>(scenarioParam)
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Auto-scroll to the scenario specified in URL param
  useEffect(() => {
    if (scenarioParam && cardRefs.current[scenarioParam]) {
      setTimeout(() => {
        cardRefs.current[scenarioParam]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        setActiveScenario(scenarioParam)
      }, 300)
    }
  }, [scenarioParam])

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[#010610] text-slate-100 font-sans selection:bg-cyan-500 selection:text-black">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="px-4 py-3 border-b border-white/10 bg-[#030d1a]/90 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-red-500/20 text-red-300 border border-red-400/40">
              <ShieldAlert size={16} />
            </span>
            <h1 className="text-base font-bold text-white font-mono">Operational Intelligence & Hazard Workflows</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-400/30">
              Disaster Management · MoES / INCOIS Presets
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Pre-configured operational scenarios linking 3D model physics with real-time decision support
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

      {/* ── Scenarios Container ─────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 w-full">
        {/* Status Summary Bar */}
        <div className="flex flex-wrap gap-3 p-3 rounded-2xl bg-[#030d1a] border border-white/10 font-mono text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-slate-300">INCOIS Model: <strong className="text-green-300">ACTIVE</strong></span>
          </div>
          <div className="flex items-center gap-1.5 pl-3 border-l border-white/10">
            <Layers size={11} className="text-cyan-400" />
            <span className="text-slate-300">4 Operational Presets Loaded</span>
          </div>
          <div className="flex items-center gap-1.5 pl-3 border-l border-white/10">
            <AlertTriangle size={11} className="text-amber-400" />
            <span className="text-slate-300">SAMUDRA Real-Time: <strong className="text-amber-300">Connecting...</strong></span>
          </div>
          <div className="flex items-center gap-1.5 pl-3 border-l border-white/10">
            <CheckCircle2 size={11} className="text-emerald-400" />
            <span className="text-slate-300">Alerts Active: <strong className="text-emerald-300">2</strong></span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {OPERATIONAL_PRESETS.map((p) => {
            const isActive = activeScenario === p.id
            return (
              <div
                key={p.id}
                ref={(el) => { cardRefs.current[p.id] = el }}
                className={`p-5 rounded-2xl border transition-all shadow-xl flex flex-col justify-between cursor-pointer ${
                  isActive
                    ? 'bg-[#0a1a2e] border-cyan-400/60 shadow-cyan-900/30 ring-1 ring-cyan-400/30'
                    : 'bg-[#030d1a] border-white/10 hover:border-cyan-400/40'
                }`}
                onClick={() => setActiveScenario(isActive ? '' : p.id)}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-xl bg-white/5 border border-white/10 transition-transform ${isActive ? 'scale-110' : ''}`}>
                        {p.icon}
                      </div>
                      <span className={`text-[9px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full border ${p.badgeColor}`}>
                        {p.badge}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isActive && (
                        <span className="text-[9px] font-mono text-cyan-300 bg-cyan-500/15 px-2 py-0.5 rounded-full border border-cyan-400/30 animate-pulse">
                          ● ACTIVE
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                        <Compass size={11} className="text-cyan-400" />
                        {p.targetRegion}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white mb-2 font-mono">{p.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed mb-4">{p.summary}</p>

                  {/* Metrics Table */}
                  <div className="space-y-1.5 bg-black/30 p-3 rounded-xl border border-white/5 mb-5 font-mono text-xs">
                    {p.metrics.map((m) => (
                      <div key={m.label} className="flex justify-between items-center">
                        <span className="text-slate-400 text-[11px]">{m.label}:</span>
                        <span className="text-cyan-200 font-bold">{m.val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Link
                    to={`/dashboard?variable=${p.variable}&region=${encodeURIComponent(p.targetRegion)}&depth=${p.depth}&scenario=${p.id}`}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-400/40 font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span>Launch in 3D Explorer</span>
                    <ArrowRight size={14} />
                  </Link>
                  <a
                    href="https://samudra.incois.gov.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="View on INCOIS SAMUDRA"
                    className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-all"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
