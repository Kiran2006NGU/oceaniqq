/**
 * SciencePage.tsx — Page 9: Science Communication & Public Outreach Portal
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 *
 * Implements the PS requirement:
 * - Public Outreach & Science Communication for students, policymakers, and researchers
 * - Interactive 3D educational explainers on ocean physics and instrument telemetry
 */

import { Link } from 'react-router-dom'
import {
  BookOpen,
  Sparkles,
  Radio,
  Waves,
  Globe,
  Layers,
  ArrowRight,
  ExternalLink,
  Compass,
  Lightbulb,
} from 'lucide-react'

const SCIENCE_TOPICS = [
  {
    id: 'argo-cycle',
    title: 'How Does an Argo Profiling Float Work?',
    tag: 'Autonomous Robotics',
    summary:
      'Argo floats drift passively at 1,000 meters depth for 9 days, dive to 2,000 meters, and then ascend while continuously measuring temperature, salinity, and pressure, transmitting data via satellite at the surface.',
    steps: [
      '1. Deployment & Descent to 1,000m parking depth',
      '2. Neutral buoyancy drift for 9–10 days with deep ocean currents',
      '3. Deep profiling dive down to 2,000 meters',
      '4. Upward ascent recording high-precision vertical CTD profiles',
      '5. Surface data broadcast via Iridium satellite communication',
    ],
    demoLink: '/dashboard',
    cta: 'View Argo Floats in 3D Explorer',
    color: 'border-cyan-500/30 text-cyan-300',
  },
  {
    id: 'monsoon-reversal',
    title: 'Monsoonal Current Reversal in the Indian Ocean',
    tag: 'Ocean Dynamics',
    summary:
      'Unlike the Atlantic and Pacific, the northern Indian Ocean is landlocked, causing surface currents to reverse completely twice a year with the Southwest Summer Monsoon and Northeast Winter Monsoon.',
    steps: [
      'Summer (SW Monsoon): Strong northeastward Somali Jet (> 2.5 m/s) and intense coastal upwelling',
      'Winter (NE Monsoon): Reversal to southward flow along the Indian coastline and East India Coastal Current (EICC)',
    ],
    demoLink: '/dashboard',
    cta: 'Explore 3D Current Vectors in 3D',
    color: 'border-purple-500/30 text-purple-300',
  },
  {
    id: 'salinity-contrast',
    title: 'The Great Salinity Contrast: Arabian Sea vs Bay of Bengal',
    tag: 'Thermohaline Physics',
    summary:
      'The Arabian Sea experiences intense evaporation, creating hypersaline surface water (> 36.5 PSU). In contrast, the Bay of Bengal receives massive freshwater discharge from the Ganges and Brahmaputra, creating a buoyant low-salinity barrier layer (< 32.5 PSU).',
    steps: [
      'Arabian Sea: Net evaporation exceeds precipitation → High salinity water mass (ASHSW)',
      'Bay of Bengal: Heavy river runoff + monsoonal rain → Thin, warm, low-salinity lens preventing vertical mixing',
    ],
    demoLink: '/dashboard',
    cta: 'Inspect Salinity Fields in 3D',
    color: 'border-amber-500/30 text-amber-300',
  },
  {
    id: 'depth-isosurface',
    title: 'Understanding 3D Depth Slices and Isosurfaces',
    tag: '3D Scientific Visualization',
    summary:
      'A Depth Slice cuts horizontally across the ocean at a specific depth (e.g. 100m). A 3D Isosurface reveals the continuous 3D contour where an ocean variable equals a constant value (e.g., the 28°C isothermal surface).',
    steps: [
      'Horizontal Depth Slice: Reveals spatial gradients at chosen depths (e.g. 50m, 100m, 500m)',
      '3D Isosurface (Marching Cubes): Visualizes the physical geometry of the thermocline / warm pool in 3D space',
    ],
    demoLink: '/dashboard',
    cta: 'Extract 3D Isosurface in 3D',
    color: 'border-emerald-500/30 text-emerald-300',
  },
]

export function SciencePage() {
  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[#010610] text-slate-100 font-sans selection:bg-cyan-500 selection:text-black">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="px-4 py-3 border-b border-white/10 bg-[#030d1a]/90 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-400/40">
              <BookOpen size={16} />
            </span>
            <h1 className="text-base font-bold text-white font-mono">Ocean Science & Public Outreach Portal</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-400/30">
              Interactive Educational Guides
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Explaining oceanographic dynamics, instrument engineering, and 3D digital twins for all audiences
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

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SCIENCE_TOPICS.map((topic) => (
            <div
              key={topic.id}
              className={`p-5 rounded-2xl bg-[#030d1a] border ${topic.color} shadow-xl flex flex-col justify-between space-y-4`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-cyan-300 font-bold">
                    {topic.tag}
                  </span>
                  <Lightbulb size={16} className="text-amber-400" />
                </div>

                <h3 className="text-base font-bold text-white mb-2 font-mono">{topic.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">{topic.summary}</p>

                {/* Key Points */}
                <div className="space-y-1 bg-black/30 p-3 rounded-xl border border-white/5 text-[11px] font-mono text-slate-300">
                  {topic.steps.map((step) => (
                    <div key={step} className="flex items-start gap-1.5">
                      <span className="text-cyan-400 font-bold">•</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <Link
                to={topic.demoLink}
                className="w-full py-2.5 px-4 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-400/40 font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all"
              >
                <span>{topic.cta}</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
