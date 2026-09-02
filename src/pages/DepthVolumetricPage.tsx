/**
 * DepthVolumetricPage.tsx — 3D Volumetric Water Column & Depth View Workstation
 * Route: /depth-view and /depth-inspector
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 *
 * Faithfully replicates the reference visual design:
 * • Top Center: "Calm Water Level Data Visualization." + Prominent "+" Portion Selector
 * • Central 3D Volumetric Water-Column Block floating over studio plane with OrbitControls
 * • Bottom-Left Stacked Scientific Colormaps (Temperature, Velocity Magnitude, Salinity)
 * • Right Control Panel: "Unified Oceanographic Data Analysis" (Data Source, Clipping, Sliders, Bounding Box, Animation)
 */

import { useState, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import {
  Plus,
  Play,
  Pause,
  ArrowLeft,
  Sliders,
  Check,
  X,
  Compass,
  Layers,
  Thermometer,
  Waves,
  Droplets,
  RotateCw,
  Globe,
} from 'lucide-react'
import type { OceanVariable } from '@/types/ocean'
import { CalmWaterVolumetricBlock } from '@/components/ocean/CalmWaterVolumetricBlock'

interface PortionPreset {
  id: string
  name: string
  lat: number
  lon: number
  defaultVariable: OceanVariable
  depthRange: string
  description: string
}

const PORTION_PRESETS: PortionPreset[] = [
  {
    id: 'bob',
    name: 'Bay of Bengal (Central Basin)',
    lat: 14.5,
    lon: 87.5,
    defaultVariable: 'temperature',
    depthRange: '0 - 1500m',
    description: 'Monsoon freshwater barrier layer, cyclone heat potential, and steep thermocline stratification.',
  },
  {
    id: 'as',
    name: 'Arabian Sea (Somali Upwelling)',
    lat: 15.2,
    lon: 64.8,
    defaultVariable: 'current_velocity',
    depthRange: '0 - 2000m',
    description: 'High-salinity water mass, intense wind-driven upwelling, and sub-surface oxygen minimum zone.',
  },
  {
    id: 'eio',
    name: 'Equatorial Indian Ocean',
    lat: 0.0,
    lon: 80.0,
    defaultVariable: 'temperature',
    depthRange: '0 - 1800m',
    description: 'Indo-Pacific warm pool core, semi-annual Wyrtki jet velocity, and equatorial undercurrent.',
  },
  {
    id: 'lak',
    name: 'Lakshadweep / Maldives Ridge',
    lat: 10.0,
    lon: 72.5,
    defaultVariable: 'salinity',
    depthRange: '0 - 1200m',
    description: 'Coral atoll thermal stress zone, mini-warm pool eddy dynamics, and halocline barrier.',
  },
  {
    id: 'and',
    name: 'Andaman Sea Basin',
    lat: 10.5,
    lon: 94.2,
    defaultVariable: 'chlorophyll',
    depthRange: '0 - 1600m',
    description: 'High-amplitude internal solitary waves, deep pycnocline displacement, and nutrient up-thrust.',
  },
]

export function DepthVolumetricPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  // URL / Initial state
  const minLatParam = searchParams.get('minLat')
  const maxLatParam = searchParams.get('maxLat')
  const minLonParam = searchParams.get('minLon')
  const maxLonParam = searchParams.get('maxLon')

  const initialRegion = searchParams.get('region') || (minLatParam ? '4-Sided Portion' : 'Bay of Bengal (Central Basin)')
  const initialVar = (searchParams.get('variable') as OceanVariable) || 'temperature'
  const initialLat = parseFloat(searchParams.get('lat') || (minLatParam && maxLatParam ? String((+minLatParam + +maxLatParam) / 2) : '14.5'))
  const initialLon = parseFloat(searchParams.get('lon') || (minLonParam && maxLonParam ? String((+minLonParam + +maxLonParam) / 2) : '87.5'))

  // Portion State
  const [portionName, setPortionName] = useState(initialRegion)
  const [lat, setLat] = useState(initialLat)
  const [lon, setLon] = useState(initialLon)
  const [isPortionModalOpen, setIsPortionModalOpen] = useState(false)

  // Right Panel: Unified Oceanographic Data Analysis Controls
  const [dataSource, setDataSource] = useState<string>('Temperature (Calm State)')
  const [colorbarOption, setColorbarOption] = useState<string>('Temperature (Surface Plane)')
  const [yAxisClipping, setYAxisClipping] = useState<string>('Multi-Axis')
  const [tempOption, setTempOption] = useState<string>('default')
  const [velocityOption, setVelocityOption] = useState<string>('jet')

  // Sliders (exact match with picture)
  const [minValue, setMinValue] = useState<number>(0)
  const [maxValue, setMaxValue] = useState<number>(0.95)
  const [stepSize, setStepSize] = useState<number>(0.4)
  const [transparency, setTransparency] = useState<number>(0.8)
  const [zRotation, setZRotation] = useState<number>(88)

  // Checkboxes
  const [terrainVisibility, setTerrainVisibility] = useState<boolean>(false)
  const [boundingBox, setBoundingBox] = useState<boolean>(true)

  // Animation
  const [isAnimating, setIsAnimating] = useState<boolean>(false)

  // Active variable determined from Data Source
  const activeVariable: OceanVariable = useMemo(() => {
    if (dataSource.includes('Salinity')) return 'salinity'
    if (dataSource.includes('Velocity')) return 'current_velocity'
    if (dataSource.includes('Chlorophyll')) return 'chlorophyll'
    return 'temperature'
  }, [dataSource])

  // Portion select handler
  const handleSelectPreset = (preset: PortionPreset) => {
    setPortionName(preset.name)
    setLat(preset.lat)
    setLon(preset.lon)
    if (preset.defaultVariable === 'temperature') setDataSource('Temperature (Calm State)')
    if (preset.defaultVariable === 'salinity') setDataSource('Salinity (Halocline)')
    if (preset.defaultVariable === 'current_velocity') setDataSource('Velocity (Current Jet)')
    setIsPortionModalOpen(false)
  }

  return (
    <div className="relative w-full h-full min-h-screen bg-gradient-to-b from-[#1c222c] via-[#141820] to-[#0c0f15] text-slate-100 select-none overflow-hidden font-sans">
      {/* ── TOP HEADER & TITLE ─────────────────────────────────────────── */}
      <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 py-3 pointer-events-none">
        {/* Left: Back & Breadcrumb */}
        <div className="flex items-center gap-2.5 pointer-events-auto">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/60 hover:bg-black/80 border border-white/10 text-xs font-mono text-slate-300 hover:text-white transition-all cursor-pointer shadow-lg backdrop-blur-md"
          >
            <ArrowLeft size={13} />
            <span>3D Explorer</span>
          </button>
        </div>

        {/* Center: Reference Title + Current Portion */}
        <div className="flex flex-col items-center text-center pointer-events-auto">
          <h1 className="text-sm sm:text-base font-bold text-slate-200 tracking-wide drop-shadow-md">
            Calm Water Level Data Visualization.
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] text-cyan-300 font-mono font-medium">
              Portion: <strong className="text-white">{portionName}</strong>
              {minLatParam && maxLatParam ? (
                <span className="ml-1 text-slate-300">
                  [{minLatParam}°N - {maxLatParam}°N, {minLonParam}°E - {maxLonParam}°E]
                </span>
              ) : (
                <span className="ml-1 text-slate-300">
                  ({lat.toFixed(1)}°N, {lon.toFixed(1)}°E)
                </span>
              )}
            </span>
            {/* The Prominent "+" Button */}
            <button
              onClick={() => setIsPortionModalOpen(true)}
              title="Click to Choose Any Ocean Portion with Parameters or Drag on Globe"
              className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black text-[11px] font-mono font-bold shadow-md transition-all cursor-pointer animate-pulse"
            >
              <Plus size={13} strokeWidth={3} />
              <span>Change Portion</span>
            </button>
          </div>
        </div>

        {/* Right empty spacer for symmetry */}
        <div className="w-24 hidden sm:block"></div>
      </header>

      {/* ── CENTRAL 3D VOLUMETRIC VIEWPORT ─────────────────────────────── */}
      <div className="absolute inset-0 z-0">
        <Canvas
          camera={{ position: [5.2, 3.8, 5.2], fov: 42 }}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        >
          {/* Studio Lights */}
          <ambientLight intensity={1.2} />
          <directionalLight position={[6, 8, 5]} intensity={1.8} castShadow />
          <directionalLight position={[-6, -4, -4]} intensity={0.6} color="#38bdf8" />
          <pointLight position={[0, 4, 0]} intensity={1.2} color="#ffffff" />

          {/* 3D Volumetric Water Column Block */}
          <CalmWaterVolumetricBlock
            variable={activeVariable}
            transparency={transparency}
            zRotation={zRotation}
            isAnimating={isAnimating}
            showBoundingBox={boundingBox}
            yClippingFraction={stepSize}
            portionName={portionName}
            lat={lat}
            lon={lon}
          />

          {/* Orbit Controls */}
          <OrbitControls
            enableDamping
            dampingFactor={0.06}
            minDistance={3.0}
            maxDistance={14.0}
            maxPolarAngle={Math.PI / 2 + 0.15}
          />
        </Canvas>
      </div>

      {/* ── BOTTOM-LEFT COLORBAR LEGENDS (Matching Picture) ─────────────── */}
      <div className="absolute bottom-5 left-5 z-10 flex flex-col gap-3.5 bg-black/60 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 shadow-2xl max-w-sm pointer-events-auto">
        {/* 1. Temperature Legend */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
            <div className="flex items-center gap-1.5">
              <Thermometer size={13} className="text-red-400" />
              <span>Temperature (°C)</span>
            </div>
            <span className="text-[10px] text-slate-400">°C</span>
          </div>
          <div className="h-3 w-72 rounded-sm bg-gradient-to-r from-[#001040] via-[#00c0f0] via-[#00e050] via-[#fac018] to-[#e63946] border border-white/20 shadow-inner" />
          <div className="flex justify-between text-[9px] font-mono text-slate-400 px-0.5">
            <span>1.276</span>
            <span>7.354</span>
            <span>13.432</span>
            <span>19.51</span>
            <span>25.588</span>
            <span>31.668</span>
          </div>
        </div>

        {/* 2. Velocity Magnitude Legend */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
            <div className="flex items-center gap-1.5">
              <Waves size={13} className="text-cyan-400" />
              <span>Velocity Magnitude (m/s)</span>
            </div>
            <span className="text-[10px] text-slate-400">m/s</span>
          </div>
          <div className="h-3 w-72 rounded-sm bg-gradient-to-r from-[#051838] via-[#06b6d4] via-[#22c55e] via-[#eab308] to-[#ef4444] border border-white/20 shadow-inner" />
          <div className="flex justify-between text-[9px] font-mono text-slate-400 px-0.5">
            <span>0</span>
            <span>0.106</span>
            <span>0.212</span>
            <span>0.416</span>
            <span>0.424</span>
            <span>1</span>
          </div>
        </div>

        {/* 3. Salinity Legend */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
            <div className="flex items-center gap-1.5">
              <Droplets size={13} className="text-blue-300" />
              <span>Salinity</span>
            </div>
            <span className="text-[10px] text-slate-400">e</span>
          </div>
          <div className="h-3 w-72 rounded-sm bg-gradient-to-r from-[#020b18] via-[#1e3a8a] via-[#38bdf8] to-[#ffffff] border border-white/20 shadow-inner" />
          <div className="flex justify-between text-[9px] font-mono text-slate-400 px-0.5">
            <span>0</span>
            <span>0.2</span>
            <span>0.4</span>
            <span>0.6</span>
            <span>0.8</span>
            <span>1</span>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL: UNIFIED OCEANOGRAPHIC DATA ANALYSIS (Matching Picture) ─ */}
      <aside className="absolute top-4 right-4 z-10 w-72 max-h-[calc(100vh-32px)] overflow-y-auto bg-[#10141c]/92 backdrop-blur-md border border-white/12 rounded-2xl p-4 shadow-2xl space-y-3.5 font-mono text-xs pointer-events-auto">
        <h2 className="text-xs font-bold text-slate-200 border-b border-white/10 pb-2">
          Unified Oceanographic Data Analysis
        </h2>

        {/* Data Source */}
        <div className="space-y-1">
          <label className="text-[11px] text-slate-400 block">Data Source</label>
          <select
            value={dataSource}
            onChange={(e) => setDataSource(e.target.value)}
            className="w-full bg-[#181f2c] border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:border-cyan-400 outline-none"
          >
            <option value="Temperature (Calm State)">Temperature (Calm State)</option>
            <option value="Salinity (Halocline)">Salinity (Halocline)</option>
            <option value="Velocity (Current Jet)">Velocity (Current Jet)</option>
            <option value="Chlorophyll (Phytoplankton)">Chlorophyll (Phytoplankton)</option>
          </select>
        </div>

        {/* Colorbar */}
        <div className="space-y-1">
          <label className="text-[11px] text-slate-400 block">Colorbar</label>
          <select
            value={colorbarOption}
            onChange={(e) => setColorbarOption(e.target.value)}
            className="w-full bg-[#181f2c] border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:border-cyan-400 outline-none"
          >
            <option value="Temperature (Surface Plane)">Temperature (Surface Plane)</option>
            <option value="Multi-Axis Continuous">Multi-Axis Continuous</option>
            <option value="Jet Colormap">Jet Colormap</option>
            <option value="Turbo High-Contrast">Turbo High-Contrast</option>
          </select>
        </div>

        {/* Y-Axis Clipping */}
        <div className="space-y-1">
          <label className="text-[11px] text-slate-400 block">Y-Axis Clipping</label>
          <select
            value={yAxisClipping}
            onChange={(e) => setYAxisClipping(e.target.value)}
            className="w-full bg-[#181f2c] border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:border-cyan-400 outline-none"
          >
            <option value="Multi-Axis">Multi-Axis</option>
            <option value="Surface Mixed Layer">Surface Mixed Layer</option>
            <option value="Thermocline Core">Thermocline Core</option>
            <option value="Full Water Column">Full Water Column</option>
          </select>
        </div>

        {/* Temperature preset */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-slate-400">Temperature</span>
          <select
            value={tempOption}
            onChange={(e) => setTempOption(e.target.value)}
            className="bg-[#181f2c] border border-white/15 rounded-md px-2 py-1 text-[11px] text-slate-200 outline-none w-28"
          >
            <option value="default">default</option>
            <option value="thermal">thermal</option>
            <option value="cool">cool</option>
          </select>
        </div>

        {/* Velocity preset */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-400">Velocity</span>
          <select
            value={velocityOption}
            onChange={(e) => setVelocityOption(e.target.value)}
            className="bg-[#181f2c] border border-white/15 rounded-md px-2 py-1 text-[11px] text-slate-200 outline-none w-28"
          >
            <option value="jet">jet</option>
            <option value="viridis">viridis</option>
            <option value="plasma">plasma</option>
          </select>
        </div>

        <div className="border-t border-white/10 pt-2 space-y-3">
          {/* Minimum Value Slider */}
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-400">Minimum Value</span>
              <span className="text-cyan-300">{minValue}</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={minValue}
              onChange={(e) => setMinValue(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Maximum Value Slider */}
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-400">Maximum Value</span>
              <span className="text-cyan-300">{maxValue}</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={maxValue}
              onChange={(e) => setMaxValue(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Step Size Slider */}
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-400">Step Size</span>
              <span className="text-cyan-300">{stepSize}</span>
            </div>
            <input
              type="range"
              min={0.05}
              max={0.95}
              step={0.05}
              value={stepSize}
              onChange={(e) => setStepSize(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Transparency Slider */}
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-400">Transparency</span>
              <span className="text-cyan-300">{transparency}</span>
            </div>
            <input
              type="range"
              min={0.1}
              max={1.0}
              step={0.05}
              value={transparency}
              onChange={(e) => setTransparency(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Z-axis Rotation Slider */}
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-400">Z-axis Rotation</span>
              <span className="text-cyan-300">{zRotation}°</span>
            </div>
            <input
              type="range"
              min={0}
              max={360}
              step={2}
              value={zRotation}
              onChange={(e) => setZRotation(parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        </div>

        {/* Checkboxes */}
        <div className="border-t border-white/10 pt-2.5 space-y-2">
          <label className="flex items-center justify-between text-[11px] text-slate-300 cursor-pointer">
            <span>Terrain Visibility</span>
            <input
              type="checkbox"
              checked={terrainVisibility}
              onChange={(e) => setTerrainVisibility(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-800 border-white/20 text-cyan-500 focus:ring-0 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between text-[11px] text-slate-300 cursor-pointer">
            <span>Bounding Box</span>
            <input
              type="checkbox"
              checked={boundingBox}
              onChange={(e) => setBoundingBox(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-800 border-white/20 text-cyan-500 focus:ring-0 cursor-pointer"
            />
          </label>
        </div>

        {/* Animation Play Button */}
        <div className="border-t border-white/10 pt-2.5 flex items-center justify-between">
          <span className="text-[11px] text-slate-300">Animation</span>
          <button
            onClick={() => setIsAnimating((a) => !a)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
              isAnimating
                ? 'bg-cyan-500 text-black border-cyan-400 shadow-md shadow-cyan-500/30'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/15'
            }`}
            title={isAnimating ? 'Pause Rotation Animation' : 'Play 360° Rotation Animation'}
          >
            {isAnimating ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
          </button>
        </div>
      </aside>

      {/* ── THE PROMINENT "+" OCEAN PORTION SELECTOR MODAL ────────────────── */}
      {isPortionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-mono">
          <div className="bg-[#0b1019] border border-cyan-500/40 rounded-2xl shadow-2xl max-w-xl w-full p-5 space-y-4 text-xs">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center border border-cyan-400/40">
                  <Plus size={16} strokeWidth={3} />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white">Select Ocean Portion for 3D Depth View</h3>
                  <p className="text-[11px] text-slate-400">
                    Choose any geographic region or enter custom coordinates with depth parameters
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPortionModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Direct Interactive 3D Globe Drag Launcher */}
            <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-400/50 flex items-center justify-between gap-3">
              <div>
                <span className="font-bold text-white text-xs block flex items-center gap-1.5">
                  <Globe size={14} className="text-cyan-400" />
                  <span>Interactive 4-Sided Drag on Globe</span>
                </span>
                <span className="text-[10px] text-cyan-200">
                  Switch to the full 3D globe to drag and select any custom rectangular portion
                </span>
              </div>
              <button
                onClick={() => navigate('/dashboard?selectPortion=true')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs shadow-md transition-all cursor-pointer whitespace-nowrap"
              >
                <span>Pick on Globe ↗</span>
              </button>
            </div>

            {/* Presets List */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Recommended Indian Ocean Portions:
              </span>
              <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
                {PORTION_PRESETS.map((p) => {
                  const isSelected = portionName === p.name
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleSelectPreset(p)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                        isSelected
                          ? 'bg-cyan-950/60 border-cyan-400 text-cyan-100 shadow-md shadow-cyan-950/40'
                          : 'bg-white/5 border-white/10 hover:border-white/25 text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs text-white mb-0.5 flex items-center gap-1.5">
                          <span>{p.name}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-cyan-300">
                            {p.depthRange}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-relaxed font-sans">{p.description}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 flex-shrink-0">
                        {p.lat}°N, {p.lon}°E
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Custom Coordinates Extrusion */}
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Or Specify Custom Portion Coordinates:
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Latitude (°N/S)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="-35"
                    max="30"
                    value={lat}
                    onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#141b26] border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Longitude (°E)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="40"
                    max="110"
                    value={lon}
                    onChange={(e) => setLon(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#141b26] border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button
                onClick={() => setIsPortionModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setPortionName(`Custom (${lat.toFixed(1)}°N, ${lon.toFixed(1)}°E)`)
                  setIsPortionModalOpen(false)
                }}
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Check size={14} />
                <span>Render 3D Depth Block</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
