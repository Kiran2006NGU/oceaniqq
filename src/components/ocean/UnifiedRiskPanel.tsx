/**
 * UnifiedRiskPanel.tsx — Unified Multi-Hazard Ocean Risk & Location Intelligence
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 */

import { useState } from 'react'
import { AlertOctagon, Waves, Wind, Thermometer, ShieldAlert, MapPin, Search, Anchor } from 'lucide-react'

export interface CoastalLocation {
  name: string
  lat: number
  lon: number
  state: string
  waveHeight: string
  windSpeed: string
  sst: string
  overallRisk: 'HIGH' | 'MODERATE' | 'LOW'
  activeAdvisories: string[]
  nearbyBuoy: string
}

export const POPULAR_LOCATIONS: CoastalLocation[] = [
  {
    name: 'Puri Coast',
    lat: 19.8,
    lon: 85.8,
    state: 'Odisha',
    waveHeight: '3.4 m',
    windSpeed: '28 knots',
    sst: '29.8 °C',
    overallRisk: 'HIGH',
    activeAdvisories: ['High Wave Warning', 'Small Craft Advisory'],
    nearbyBuoy: 'INCOIS Moored Buoy BD08',
  },
  {
    name: 'Visakhapatnam Port',
    lat: 17.68,
    lon: 83.21,
    state: 'Andhra Pradesh',
    waveHeight: '2.1 m',
    windSpeed: '18 knots',
    sst: '29.2 °C',
    overallRisk: 'MODERATE',
    activeAdvisories: ['Swell Surge Alert'],
    nearbyBuoy: 'Argo Float 2901542',
  },
  {
    name: 'Port Blair Harbour',
    lat: 11.62,
    lon: 92.72,
    state: 'Andaman & Nicobar',
    waveHeight: '3.9 m',
    windSpeed: '32 knots',
    sst: '30.6 °C',
    overallRisk: 'HIGH',
    activeAdvisories: ['Marine Heatwave Alert', 'Coral Bleaching Level 2'],
    nearbyBuoy: 'Glider SG-152',
  },
  {
    name: 'Kochi Harbour',
    lat: 9.93,
    lon: 76.26,
    state: 'Kerala',
    waveHeight: '1.4 m',
    windSpeed: '12 knots',
    sst: '28.4 °C',
    overallRisk: 'LOW',
    activeAdvisories: ['Normal Sea Conditions'],
    nearbyBuoy: 'INCOIS Buoy AD06',
  },
]

interface UnifiedRiskPanelProps {
  onSelectLocation: (loc: CoastalLocation) => void
}

export function UnifiedRiskPanel({ onSelectLocation }: UnifiedRiskPanelProps) {
  const [selectedLoc, setSelectedLoc] = useState<CoastalLocation>(POPULAR_LOCATIONS[0])
  const [search, setSearch] = useState('')

  const handleSelect = (loc: CoastalLocation) => {
    setSelectedLoc(loc)
    onSelectLocation(loc)
  }

  const filteredLocs = POPULAR_LOCATIONS.filter(
    (l) => l.name.toLowerCase().includes(search.toLowerCase()) || l.state.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-3 font-sans text-xs">
      {/* Risk Overview Card */}
      <div className="p-3 rounded bg-[#051426] border border-cyan-500/30 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold uppercase text-cyan-400 flex items-center gap-1.5">
            <ShieldAlert size={14} className="text-amber-400" />
            Unified Multi-Hazard Index
          </span>
          <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-mono font-bold text-[9px] border border-red-500/40 animate-pulse">
            HIGH RISK (74/100)
          </span>
        </div>

        {/* Breakdown Matrix */}
        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
          <div className="p-2 rounded bg-black/40 border border-white/5 space-y-1">
            <div className="flex items-center gap-1 text-slate-400">
              <Waves size={12} className="text-cyan-400" />
              <span>High Waves</span>
            </div>
            <div className="font-bold text-red-400 text-xs">3.9m Max</div>
          </div>
          <div className="p-2 rounded bg-black/40 border border-white/5 space-y-1">
            <div className="flex items-center gap-1 text-slate-400">
              <Wind size={12} className="text-sky-400" />
              <span>Storm Surge</span>
            </div>
            <div className="font-bold text-amber-400 text-xs">MODERATE</div>
          </div>
          <div className="p-2 rounded bg-black/40 border border-white/5 space-y-1">
            <div className="flex items-center gap-1 text-slate-400">
              <Thermometer size={12} className="text-red-400" />
              <span>Heat Stress</span>
            </div>
            <div className="font-bold text-red-400 text-xs">SEVERE (+2.8°C)</div>
          </div>
          <div className="p-2 rounded bg-black/40 border border-white/5 space-y-1">
            <div className="flex items-center gap-1 text-slate-400">
              <AlertOctagon size={12} className="text-emerald-400" />
              <span>Tsunami Threat</span>
            </div>
            <div className="font-bold text-emerald-400 text-xs">NO THREAT</div>
          </div>
        </div>
      </div>

      {/* Location Intelligence Search */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold uppercase text-slate-300">
            Location Intelligence
          </span>
          <span className="text-[9px] text-slate-500 font-mono">INCOIS Coastal Feeds</span>
        </div>

        <div className="flex items-center gap-2 bg-[#020b17] border border-white/10 rounded px-2.5 py-1 text-xs">
          <Search size={12} className="text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search port or coast (e.g. Puri, Port Blair)..."
            className="bg-transparent text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none w-full font-mono"
          />
        </div>

        {/* Location Pills */}
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {filteredLocs.map((loc) => {
            const isSelected = selectedLoc.name === loc.name
            return (
              <div
                key={loc.name}
                onClick={() => handleSelect(loc)}
                className={`p-2 rounded border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-cyan-950/60 border-cyan-500/50 text-white'
                    : 'bg-slate-900/40 border-white/5 hover:border-white/15 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs flex items-center gap-1.5">
                    <MapPin size={12} className={isSelected ? 'text-cyan-400' : 'text-slate-400'} />
                    {loc.name}
                    <span className="text-[9px] text-slate-400 font-normal">({loc.state})</span>
                  </span>
                  <span
                    className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                      loc.overallRisk === 'HIGH'
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : loc.overallRisk === 'MODERATE'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {loc.overallRisk}
                  </span>
                </div>

                {isSelected && (
                  <div className="mt-2 pt-2 border-t border-white/10 space-y-1 text-[10px] font-mono">
                    <div className="grid grid-cols-3 gap-1">
                      <div>
                        <span className="text-slate-400 text-[8px] block uppercase">Waves</span>
                        <span className="text-cyan-300 font-bold">{loc.waveHeight}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[8px] block uppercase">Wind</span>
                        <span className="text-slate-200 font-bold">{loc.windSpeed}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[8px] block uppercase">SST</span>
                        <span className="text-red-300 font-bold">{loc.sst}</span>
                      </div>
                    </div>
                    <div className="pt-1 flex items-center gap-1 text-slate-400 text-[9px]">
                      <Anchor size={10} className="text-cyan-400" />
                      <span>Nearby Sensor: {loc.nearbyBuoy}</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
