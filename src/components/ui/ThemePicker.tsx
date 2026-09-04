/**
 * ThemePicker.tsx — 6-Theme Visual Switcher Dropdown
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 *
 * Renders a grid of 6 theme swatches with preview colors.
 * Replaces the simple cycle button in the Navbar.
 */

import { useRef, useEffect, useState } from 'react'
import { Palette, Check } from 'lucide-react'
import { useTheme, THEME_META } from '@/context/ThemeContext'

export function ThemePicker() {
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)

  const current = THEME_META.find((t) => t.id === theme) ?? THEME_META[0]

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      {/* Trigger Button */}
      <button
        id="theme-picker-btn"
        onClick={() => setOpen((v) => !v)}
        title={`Theme: ${current.label} — click to switch`}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-mono font-bold text-slate-200 hover:text-white transition-all cursor-pointer shadow-sm"
        aria-label="Open Theme Picker"
      >
        <Palette size={14} className="text-cyan-300 shrink-0" />
        <span className="hidden sm:inline" style={{ color: current.accent }}>
          {current.icon} {current.label}
        </span>
        <span className="sm:hidden">{current.icon}</span>
      </button>

      {/* Dropdown Grid */}
      {open && (
        <div
          className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#030d1a] border border-white/15 shadow-2xl z-50 p-3 animate-fade-in font-mono"
          role="listbox"
          aria-label="Select theme"
        >
          <p className="text-[10px] uppercase font-bold text-slate-400 mb-2 px-1">
            🎨 Choose Platform Theme
          </p>
          <div className="grid grid-cols-2 gap-2">
            {THEME_META.map((t) => {
              const isActive = theme === t.id
              return (
                <button
                  key={t.id}
                  role="option"
                  aria-selected={isActive}
                  onClick={() => {
                    setTheme(t.id)
                    setOpen(false)
                  }}
                  className={`theme-swatch relative flex flex-col items-start gap-1 p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                    isActive
                      ? 'border-cyan-400/60 bg-white/8 shadow-inner'
                      : 'border-white/8 bg-white/3 hover:border-white/20 hover:bg-white/7'
                  }`}
                  style={
                    {
                      '--swatch-glow': `${t.accent}55`,
                    } as React.CSSProperties
                  }
                >
                  {/* Color swatch bar */}
                  <div
                    className="w-full h-5 rounded-lg flex items-center justify-end pr-1"
                    style={{ backgroundColor: t.bg, border: `1px solid ${t.accent}44` }}
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: t.accent, boxShadow: `0 0 6px ${t.accent}` }}
                    />
                  </div>
                  {/* Label */}
                  <div className="flex items-center justify-between w-full">
                    <div>
                      <div className="text-[11px] font-bold text-white leading-tight">
                        {t.icon} {t.label}
                      </div>
                      <div className="text-[9px] text-slate-400 leading-tight mt-0.5">
                        {t.description}
                      </div>
                    </div>
                    {isActive && (
                      <Check size={13} strokeWidth={3} className="text-cyan-400 shrink-0" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
