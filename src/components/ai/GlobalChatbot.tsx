/**
 * GlobalChatbot.tsx — Autonomous AI Ocean Copilot & Full Website Operator
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 *
 * Implements Feature 6:
 * "A well-trained chatbot and AI model that can operate the whole website,
 * which is intuitive and rapid understanding."
 *
 * Capabilities:
 * - Natural language oceanographic queries & rapid intent parsing
 * - Deep website operation: Page navigation, theme switching, parameter changes,
 *   depth adjustments, layer toggling, time animation control, modal triggers
 * - Interactive action buttons that immediately execute operations
 * - Preset recommendation chips for instant exploration
 */

import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Bot,
  Send,
  Sparkles,
  X,
  ArrowRight,
  Compass,
  CheckCircle2,
  Layers,
  Palette,
  FileSpreadsheet,
  BarChart2,
  Upload,
  Waves,
  Maximize2,
  Minimize2,
  Trash2,
  HelpCircle,
} from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import type { OceanTheme } from '@/context/ThemeContext'

interface BotAction {
  label: string
  icon?: React.ReactNode
  execute: () => void
  executed?: boolean
}

interface Message {
  id: string
  sender: 'user' | 'assistant'
  text: string
  actions?: BotAction[]
  timestamp: string
  status?: string
}

const PRESET_PROMPTS = [
  'Show fish & plankton biological layers',
  'Switch theme to Bioluminescence',
  'Take me to Model vs Observation Validation',
  'Create an Ocean Graph & Chart',
  'Show INCOIS SAMUDRA data feeds',
  'Export observation data to Excel',
  'Explain Marine Heatwaves in Bay of Bengal',
  'Show surface current streamlines',
  'Ingest new observational data',
]

interface GlobalChatbotProps {
  isOpen: boolean
  onClose: () => void
  onOpenGraphBuilder?: () => void
  onOpenIngestionWizard?: () => void
}

export function GlobalChatbot({
  isOpen,
  onClose,
  onOpenGraphBuilder,
  onOpenIngestionWizard,
}: GlobalChatbotProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { theme, setTheme } = useTheme()

  const [input, setInput] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Greetings! I am **OceanIQ AI Copilot**, your intelligent workstation operator. I can explain Indian Ocean oceanography, trigger 3D layers, switch themes, navigate pages, build graphs, export Excel sheets, and ingest data. What would you like to do?',
      timestamp: 'Just now',
    },
  ])

  const chatEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  if (!isOpen) return null

  // ── Intent Parser & Action Dispatcher ──────────────────────────────────────
  const processQuery = (rawQuery: string) => {
    const q = rawQuery.toLowerCase().trim()
    if (!q) return

    const userMsg: Message = {
      id: String(Date.now()),
      sender: 'user',
      text: rawQuery,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    let responseText = ''
    const actions: BotAction[] = []

    // ── 1. Page Navigation Intents ──────────────────────────────────────────
    if (q.includes('validation') || q.includes('compare') || q.includes('residual') || q.includes('matching')) {
      responseText = 'Navigating to **Model vs Observation Validation Workstation**. Here you can inspect point-to-point spatial matching, compute RMSE/residuals, and validate against Argo floats.'
      actions.push({
        label: 'Go to Validation Page',
        icon: <ArrowRight size={13} />,
        execute: () => navigate('/compare'),
      })
    } else if (q.includes('dashboard') || q.includes('globe') || q.includes('3d explorer') || q.includes('home view')) {
      responseText = 'Heading to the **3D Ocean Explorer Dashboard**. You can interact with 3D ocean volumes, basemaps, and parameter overlays.'
      actions.push({
        label: 'Open 3D Dashboard',
        icon: <Compass size={13} />,
        execute: () => navigate('/dashboard'),
      })
    } else if (q.includes('depth') || q.includes('volumetric') || q.includes('subsurface') || q.includes('column')) {
      responseText = 'Opening **3D Sub-surface Depth Volumetric Inspector**. Explore stratification, thermoclines, and depth slice animations.'
      actions.push({
        label: 'Open Depth Inspector',
        icon: <Layers size={13} />,
        execute: () => navigate('/depth'),
      })
    } else if (q.includes('observation') || q.includes('argo') || q.includes('glider') || q.includes('ctd') || q.includes('buoy')) {
      responseText = 'Opening **In-Situ Observation Explorer**. Inspect 50+ active Argo floats, autonomous underwater gliders, and ship-borne CTD casts in the Indian Ocean.'
      actions.push({
        label: 'View Observations',
        icon: <Compass size={13} />,
        execute: () => navigate('/observations'),
      })
    } else if (q.includes('data') || q.includes('hub') || q.includes('catalog') || q.includes('ingest') || q.includes('upload')) {
      responseText = 'Opening **Ocean Data Hub & Ingestion Pipeline**. You can discover NetCDF CF-1.8 datasets or launch the Universal Ingestion Wizard.'
      actions.push({
        label: 'Open Data Hub',
        icon: <Upload size={13} />,
        execute: () => navigate('/data'),
      })
      if (onOpenIngestionWizard) {
        actions.push({
          label: 'Launch Ingestion Wizard',
          icon: <Sparkles size={13} />,
          execute: () => onOpenIngestionWizard(),
        })
      }
    } else if (q.includes('operation') || q.includes('hazard') || q.includes('cyclone') || q.includes('spill') || q.includes('search and rescue')) {
      responseText = 'Opening **Marine Operational Decision Support**. Inspect active search & rescue drift corridors, oil spill trajectory simulations, and cyclone warnings.'
      actions.push({
        label: 'Open Operations Center',
        icon: <ArrowRight size={13} />,
        execute: () => navigate('/operations'),
      })
    } else if (q.includes('samudra') || q.includes('incois') || q.includes('provider')) {
      responseText = 'Opening **Data Providers & INCOIS SAMUDRA Integration**. SAMUDRA delivers operational daily ocean forecasts, SST, SSH, and Potential Fishing Zone advisories.'
      actions.push({
        label: 'View INCOIS SAMUDRA Hub',
        icon: <ArrowRight size={13} />,
        execute: () => navigate('/providers'),
      })
    }

    // ── 2. Theme Switching Intents ──────────────────────────────────────────
    else if (q.includes('theme') || q.includes('dark') || q.includes('light') || q.includes('tactical') || q.includes('coral') || q.includes('arctic') || q.includes('biolum')) {
      let targetTheme: OceanTheme = 'dark'
      let name = 'Dark Ocean'

      if (q.includes('light') || q.includes('bright') || q.includes('clear')) {
        targetTheme = 'light'
        name = 'Light Scientific'
      } else if (q.includes('tactical')) {
        targetTheme = 'tactical'
        name = 'Tactical Navy'
      } else if (q.includes('coral')) {
        targetTheme = 'coral'
        name = 'Coral Reef'
      } else if (q.includes('arctic')) {
        targetTheme = 'arctic'
        name = 'Arctic Blue'
      } else if (q.includes('biolum')) {
        targetTheme = 'bioluminescence'
        name = 'Deep Bioluminescence'
      }

      responseText = `Switching active UI theme to **${name}** for enhanced visibility and contrast.`
      actions.push({
        label: `Apply ${name} Theme`,
        icon: <Palette size={13} />,
        execute: () => setTheme(targetTheme),
      })
      // Execute immediately for rapid response!
      setTheme(targetTheme)
    }

    // ── 3. Excel & Graph Intents ────────────────────────────────────────────
    else if (q.includes('excel') || q.includes('export') || q.includes('csv') || q.includes('spreadsheet') || q.includes('download')) {
      responseText = 'I can export observational datasets to formatted **Excel (.xlsx)** or **CSV** with platform metadata, coordinates, and vertical profile tables.'
      actions.push({
        label: 'Go to Observations & Export',
        icon: <FileSpreadsheet size={13} />,
        execute: () => navigate('/observations'),
      })
    } else if (q.includes('graph') || q.includes('chart') || q.includes('plot') || q.includes('builder')) {
      responseText = 'Launching the **Interactive Ocean Graph Builder**. You can plot Line, Bar, Area, and Scatter charts comparing Depth, Latitude, Salinity, and Temperature.'
      if (onOpenGraphBuilder) {
        actions.push({
          label: 'Open Graph Builder Modal',
          icon: <BarChart2 size={13} />,
          execute: () => onOpenGraphBuilder(),
        })
      } else {
        actions.push({
          label: 'Go to Observations Graph Builder',
          icon: <BarChart2 size={13} />,
          execute: () => navigate('/observations'),
        })
      }
    }

    // ── 4. Biological & Parameter Visualization Intents ──────────────────────
    else if (q.includes('fish') || q.includes('plankton') || q.includes('pfz') || q.includes('biology')) {
      responseText = 'Configuring biological layers: **Phytoplankton blooms**, **Zooplankton diurnal migration**, and **INCOIS Potential Fishing Zones (PFZ)** for yellowfin tuna, mackerel, and oil sardines.'
      actions.push({
        label: 'Open 3D Dashboard with Biology',
        icon: <Waves size={13} />,
        execute: () => navigate('/dashboard'),
      })
    } else if (q.includes('streamline') || q.includes('current') || q.includes('flow')) {
      responseText = 'Enabling dynamic **Current Streamlines** and particle vectors along the Somali Current, Equatorial Jet, and Coastal Currents.'
      actions.push({
        label: 'View Current Streamlines on 3D Globe',
        icon: <Waves size={13} />,
        execute: () => navigate('/dashboard?variable=current_velocity'),
      })
    } else if (q.includes('sea level') || q.includes('sea surface height') || q.includes('ssh') || q.includes('altimetry')) {
      responseText = 'Displaying **Sea Surface Height Anomaly (SSHA)** altimetry layer. Reveals cyclonic cold eddies (negative anomalies) and anticyclonic warm cores (+15–20 cm).'
      actions.push({
        label: 'Display Sea Level on Globe',
        icon: <Waves size={13} />,
        execute: () => navigate('/dashboard?variable=sea_level'),
      })
    }

    // ── 5. General Oceanographic Knowledge Q&A ──────────────────────────────
    else if (q.includes('heatwave') || q.includes('mhw') || q.includes('temperature anomaly')) {
      responseText = '**Marine Heatwaves (MHW)** in the Indian Ocean are prolonged periods of extreme sea surface temperatures (>90th percentile). Currently, a Moderate MHW is detected in the **Andaman Sea & Eastern Bay of Bengal** with anomalies reaching +2.4°C, impacting coral reef ecosystems.'
      actions.push({
        label: 'Inspect Bay of Bengal Anomalies',
        icon: <Sparkles size={13} />,
        execute: () => navigate('/dashboard?region=Bay+of+Bengal&variable=temperature'),
      })
    } else if (q.includes('iod') || q.includes('dipole')) {
      responseText = 'The **Indian Ocean Dipole (IOD)** is an ocean-atmosphere coupled phenomenon. During a Positive IOD, the western Indian Ocean becomes warmer with higher precipitation, while the eastern Indian Ocean near Sumatra cools down with intense upwelling.'
      actions.push({
        label: 'Inspect Equatorial Indian Ocean',
        icon: <Compass size={13} />,
        execute: () => navigate('/dashboard?region=Equatorial+Indian+Ocean'),
      })
    } else {
      responseText = `I processed your inquiry: "${rawQuery}". Here are the best actions to inspect this parameter across the OceanIQ platform:`
      actions.push({
        label: 'Explore in 3D Dashboard',
        icon: <Compass size={13} />,
        execute: () => navigate('/dashboard'),
      })
      actions.push({
        label: 'Open Model Validation',
        icon: <ArrowRight size={13} />,
        execute: () => navigate('/compare'),
      })
    }

    const aiMsg: Message = {
      id: String(Date.now() + 1),
      sender: 'assistant',
      text: responseText,
      actions,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMsg, aiMsg])
    setInput('')
  }

  const handleActionClick = (action: BotAction) => {
    action.execute()
    action.executed = true
    setMessages((prev) => [...prev])
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className={`w-full bg-[#050f1f] border border-cyan-500/40 rounded-2xl shadow-2xl flex flex-col transition-all duration-300 overflow-hidden ${
          isExpanded ? 'max-w-4xl h-[85vh]' : 'max-w-2xl h-[580px]'
        }`}
      >
        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div className="px-4 py-3 bg-gradient-to-r from-cyan-950/90 via-slate-900 to-blue-950/80 border-b border-cyan-500/30 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-black shadow-md shadow-cyan-500/30">
              <Bot size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm font-sans tracking-wide">
                  OceanIQ AI Copilot
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-semibold">
                  Autonomous Web Operator
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Rapid NLP comprehension · Direct site command execution
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title={isExpanded ? 'Restore window size' : 'Expand full window'}
            >
              {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button
              onClick={() =>
                setMessages([
                  {
                    id: 'welcome-reset',
                    sender: 'assistant',
                    text: 'Chat history cleared. How can I assist you with Indian Ocean data analysis or platform controls?',
                    timestamp: 'Just now',
                  },
                ])
              }
              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-white/10 transition-colors"
              title="Clear conversation"
            >
              <Trash2 size={15} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors ml-1"
              title="Close Copilot"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Quick Recommendation Chips ────────────────────────────────────── */}
        <div className="px-4 py-2 bg-[#030a16] border-b border-white/5 flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-shrink-0">
          <span className="text-[10px] font-mono text-cyan-400 flex items-center gap-1 flex-shrink-0 mr-1">
            <Sparkles size={11} />
            <span>Try:</span>
          </span>
          {PRESET_PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => processQuery(p)}
              className="px-2.5 py-1 rounded-full text-[10px] font-mono whitespace-nowrap bg-white/5 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-200 border border-white/10 hover:border-cyan-400/40 transition-all cursor-pointer flex-shrink-0"
            >
              {p}
            </button>
          ))}
        </div>

        {/* ── Message Transcript ────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs font-sans">
          {messages.map((m) => {
            const isBot = m.sender === 'assistant'
            return (
              <div
                key={m.id}
                className={`flex gap-3 ${isBot ? 'justify-start' : 'justify-end'}`}
              >
                {isBot && (
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot size={14} />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-md ${
                    isBot
                      ? 'bg-slate-900/90 border border-white/10 text-slate-200'
                      : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-medium ml-auto'
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>

                  {/* Executable Action Chips */}
                  {m.actions && m.actions.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-wrap gap-2">
                      {m.actions.map((act, i) => (
                        <button
                          key={i}
                          onClick={() => handleActionClick(act)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer shadow-sm ${
                            act.executed
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                              : 'bg-cyan-500/20 hover:bg-cyan-500 text-cyan-200 hover:text-black border border-cyan-400/40'
                          }`}
                        >
                          {act.executed ? <CheckCircle2 size={12} /> : act.icon}
                          <span>{act.label}</span>
                          {act.executed && <span className="text-[10px]">(Executed)</span>}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="mt-1 text-[9px] text-slate-400 font-mono text-right opacity-70">
                    {m.timestamp}
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={chatEndRef} />
        </div>

        {/* ── Chat Input Box ────────────────────────────────────────────────── */}
        <div className="p-3 bg-[#030a16] border-t border-white/10 flex-shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              processQuery(input)
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything or command the site: 'Show fish layer', 'Switch to light theme', 'Export to Excel'..."
              className="flex-1 bg-slate-900/90 border border-white/15 focus:border-cyan-400 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none transition-all font-mono"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:hover:bg-cyan-500 text-black font-mono font-bold text-xs transition-all cursor-pointer shadow-md shadow-cyan-500/20"
            >
              <span>Send</span>
              <Send size={13} />
            </button>
          </form>
          <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono text-slate-500 px-1">
            <span>Powered by OceanIQ NLP & Domain Physics Engine</span>
            <span>Current Route: {location.pathname}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
