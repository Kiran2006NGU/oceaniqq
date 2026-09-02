/**
 * OceanAssistantModal.tsx — Natural Language AQUA-VIS AI Ocean Assistant
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 */

import { useState } from 'react'
import { Bot, Send, Sparkles, X, ArrowRight } from 'lucide-react'
import type { OceanVariable } from '@/types/ocean'

interface AssistantAction {
  label: string
  targetVariable?: OceanVariable
  targetDepth?: number
  targetRegion?: string
  globeMode?: 'heatmap' | 'satellite'
}

interface Message {
  id: string
  sender: 'user' | 'assistant'
  text: string
  actions?: AssistantAction[]
  timestamp: string
}

interface OceanAssistantModalProps {
  isOpen: boolean
  onClose: () => void
  onExecuteAction: (action: AssistantAction) => void
}

const SAMPLE_PROMPTS = [
  'Show areas where sea temperature is above 30°C',
  'Where are the strongest currents today?',
  'Focus on Marine Heatwave in Bay of Bengal',
  'Show 50m salinity stratification in Arabian Sea',
]

export function OceanAssistantModal({ isOpen, onClose, onExecuteAction }: OceanAssistantModalProps) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      sender: 'assistant',
      text: 'Hello! I am AQUA-VIS AI, your Indian Ocean 3D Intelligence Assistant. Ask me anything about ocean parameters, active anomalies, or region forecasts.',
      timestamp: 'Just now',
    },
  ])

  if (!isOpen) return null

  const handleSend = (textToSend?: string) => {
    const query = textToSend || input
    if (!query.trim()) return

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    let responseText = "Analyzing numerical model output and in-situ buoy network..."
    let actions: AssistantAction[] = []

    const q = query.toLowerCase()

    if (q.includes('temperature') || q.includes('30°c') || q.includes('warm') || q.includes('heatwave')) {
      responseText = "Found 1 critical anomaly: Marine Heatwave detected in the Bay of Bengal (+2.85°C anomaly). Sea surface temperatures exceed 30.2°C near the Andaman archipelago."
      actions = [
        {
          label: 'Set Variable: Surface Temperature (0m)',
          targetVariable: 'temperature',
          targetDepth: 0,
          targetRegion: 'Bay of Bengal',
          globeMode: 'heatmap',
        },
      ]
    } else if (q.includes('current') || q.includes('strongest') || q.includes('velocity') || q.includes('speed')) {
      responseText = "Surface velocity vectors indicate a strong eastward jet in the Central Arabian Sea reaching speeds over 1.92 m/s."
      actions = [
        {
          label: 'Show Surface Current Velocity & Vectors',
          targetVariable: 'current_velocity',
          targetDepth: 0,
          targetRegion: 'Arabian Sea',
          globeMode: 'heatmap',
        },
      ]
    } else if (q.includes('salinity') || q.includes('50m') || q.includes('stratification')) {
      responseText = "Displaying 50m depth salinity layer. High salinity (>36.2 PSU) observed in the Arabian Sea due to net evaporation, while Bay of Bengal shows lower values (<33.5 PSU)."
      actions = [
        {
          label: 'Inspect 50m Salinity Layer',
          targetVariable: 'salinity',
          targetDepth: 50,
          targetRegion: 'Arabian Sea',
          globeMode: 'heatmap',
        },
      ]
    } else {
      responseText = `Query processed for "${query}". I have highlighted the relevant region and configured the 3D viewport.`
      actions = [
        {
          label: 'Focus Bay of Bengal Overview',
          targetRegion: 'Bay of Bengal',
          targetVariable: 'temperature',
          targetDepth: 0,
        },
      ]
    }

    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      sender: 'assistant',
      text: responseText,
      actions,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMsg, aiMsg])
    setInput('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in-up">
      <div className="w-full max-w-xl bg-[#050f1f] border border-cyan-500/40 rounded-xl shadow-2xl overflow-hidden flex flex-col h-[520px]">
        {/* Header */}
        <div className="p-3.5 px-4 bg-gradient-to-r from-cyan-950/80 via-slate-900 to-slate-900 border-b border-cyan-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
              <Bot size={18} />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                AQUA-VIS AI Ocean Assistant
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">NLP API</span>
              </h3>
              <p className="text-[11px] text-slate-400">Natural-language query & 3D viewport control</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Message History */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 font-sans text-xs">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] p-3 rounded-xl space-y-2 ${
                  m.sender === 'user'
                    ? 'bg-cyan-600 text-white rounded-br-none'
                    : 'bg-slate-900/90 border border-cyan-500/30 text-slate-200 rounded-bl-none shadow-lg'
                }`}
              >
                <p className="leading-relaxed">{m.text}</p>

                {/* AI Action Buttons */}
                {m.actions && m.actions.length > 0 && (
                  <div className="pt-2 border-t border-white/10 space-y-1">
                    {m.actions.map((act, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          onExecuteAction(act)
                          onClose()
                        }}
                        className="w-full text-left py-1.5 px-2.5 rounded bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-200 border border-cyan-500/40 font-mono text-[10px] font-bold flex items-center justify-between group transition-colors"
                      >
                        <span>🚀 {act.label}</span>
                        <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <span className="text-[9px] text-slate-500 mt-1 px-1 font-mono">{m.timestamp}</span>
            </div>
          ))}
        </div>

        {/* Sample Prompt Pills */}
        <div className="p-2 px-3 bg-black/40 border-t border-white/5 flex gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none">
          {SAMPLE_PROMPTS.map((p, i) => (
            <button
              key={i}
              onClick={() => handleSend(p)}
              className="text-[10px] py-1 px-2.5 rounded-full bg-white/5 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-200 border border-white/10 hover:border-cyan-500/40 flex items-center gap-1 transition-colors flex-shrink-0"
            >
              <Sparkles size={10} className="text-cyan-400" />
              <span>{p}</span>
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-slate-950 border-t border-cyan-500/30 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask AI e.g. 'Show areas with sea temperature above 30°C'..."
            className="flex-1 bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
          <button
            onClick={() => handleSend()}
            className="p-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition-colors"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
