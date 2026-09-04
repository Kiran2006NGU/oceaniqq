/**
 * ChatbotContext.tsx — Global AI Copilot Context Provider
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 */

import { createContext, useContext, useState, type ReactNode } from 'react'
import { GlobalChatbot } from '@/components/ai/GlobalChatbot'
import { Bot, Sparkles } from 'lucide-react'

interface ChatbotContextValue {
  isOpen: boolean
  openChatbot: () => void
  closeChatbot: () => void
  toggleChatbot: () => void
}

const ChatbotContext = createContext<ChatbotContextValue | null>(null)

export function ChatbotProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const openChatbot = () => setIsOpen(true)
  const closeChatbot = () => setIsOpen(false)
  const toggleChatbot = () => setIsOpen((prev) => !prev)

  return (
    <ChatbotContext.Provider value={{ isOpen, openChatbot, closeChatbot, toggleChatbot }}>
      {children}

      {/* ── Global Floating AI Copilot Launcher Button (Bottom-Right) ── */}
      <button
        onClick={toggleChatbot}
        aria-label="Toggle OceanIQ AI Copilot"
        title="Open OceanIQ AI Copilot (Natural Language Site Operator)"
        className="fixed bottom-5 right-5 z-40 group flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 via-cyan-400 to-blue-500 text-black font-mono font-bold text-xs shadow-2xl shadow-cyan-500/40 hover:scale-105 hover:shadow-cyan-400/60 active:scale-95 transition-all cursor-pointer border border-white/30"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-black"></span>
        </span>
        <Bot size={17} className="group-hover:rotate-12 transition-transform" />
        <span className="font-sans font-extrabold tracking-wide">AI Copilot</span>
        <span className="p-0.5 rounded bg-black/20 text-black">
          <Sparkles size={11} />
        </span>
      </button>

      {/* ── Global Autonomous AI Copilot Modal ── */}
      <GlobalChatbot
        isOpen={isOpen}
        onClose={closeChatbot}
      />
    </ChatbotContext.Provider>
  )
}

export function useChatbot() {
  const ctx = useContext(ChatbotContext)
  if (!ctx) {
    throw new Error('useChatbot must be used within a ChatbotProvider')
  }
  return ctx
}
