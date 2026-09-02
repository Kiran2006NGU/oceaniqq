/**
 * Navbar.tsx — Clean Scientific Navigation Bar
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 *
 * Includes:
 * - Streamlined 5 primary scientific workspaces
 * - "More" resource dropdown for Data Hub, Diagnostics, Providers, and Docs
 * - 1-Click Multi-Theme Switcher (🌙 Dark / ☀️ Light / 🛰️ Tactical)
 * - 1-Click User Role Switcher (👤 Citizen / 🔬 Scientist / 🛡️ Operator)
 */

import { useState, useRef, useEffect } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { APP_CONFIG, PRIMARY_NAV_ITEMS, SECONDARY_NAV_ITEMS } from '@/config'
import { useTheme } from '@/context/ThemeContext'
import { useUserRole } from '@/context/UserRoleContext'
import { cn } from '@/utils/cn'
import {
  Waves,
  Globe,
  Radio,
  Scale,
  ShieldAlert,
  Cpu,
  Database,
  Activity,
  Network,
  BookOpen,
  Compass,
  ChevronDown,
  Moon,
  Sun,
  Crosshair,
  Menu,
  X,
} from 'lucide-react'

const ICON_MAP: Record<string, React.ReactNode> = {
  globe: <Globe size={14} />,
  radio: <Radio size={14} />,
  scale: <Scale size={14} />,
  'shield-alert': <ShieldAlert size={14} />,
  cpu: <Cpu size={14} />,
  database: <Database size={14} />,
  activity: <Activity size={14} />,
  network: <Network size={14} />,
  'book-open': <BookOpen size={14} />,
  compass: <Compass size={14} />,
}

export function Navbar() {
  const { theme, cycleTheme } = useTheme()
  const { roleInfo, cycleRole } = useUserRole()

  const [moreOpen, setMoreOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement | null>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setMoreOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#030d1a]/95 backdrop-blur-md shadow-md flex-shrink-0">
      <nav className="mx-auto flex h-13 max-w-screen-2xl items-center justify-between px-3 lg:px-5">
        {/* Brand */}
        <Link
          to="/"
          className="flex items-center gap-2.5 text-white no-underline group flex-shrink-0"
          aria-label="OceanIQ Home"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-400/40 text-cyan-300 shadow-sm shadow-cyan-950/50 group-hover:scale-105 transition-all">
            <Waves className="h-4.5 w-4.5" aria-hidden />
          </span>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-wide text-white font-sans">{APP_CONFIG.shortName}</span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 font-semibold">
                INCOIS 3D
              </span>
            </div>
            <span className="text-[9px] text-slate-400 font-mono hidden sm:inline -mt-0.5">
              Digital Twin Workstation
            </span>
          </div>
        </Link>

        {/* Primary Desktop Navigation Links */}
        <div className="hidden lg:flex items-center gap-1">
          {PRIMARY_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-mono font-medium transition-all border',
                  isActive
                    ? 'bg-cyan-950/80 border-cyan-400/50 text-cyan-200 font-bold shadow-sm shadow-cyan-900/40'
                    : 'border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200 hover:border-white/5'
                )
              }
            >
              <span className="opacity-80">{ICON_MAP[item.icon] ?? null}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}

          {/* Secondary "More Tools" Dropdown */}
          <div className="relative" ref={moreRef}>
            <button
              onClick={() => setMoreOpen((v) => !v)}
              className={cn(
                'flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-mono font-medium transition-all border border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200',
                moreOpen && 'bg-white/5 text-white border-white/10'
              )}
            >
              <span>More</span>
              <ChevronDown size={12} className={cn('transition-transform', moreOpen && 'rotate-180')} />
            </button>

            {moreOpen && (
              <div className="absolute right-0 mt-1.5 w-48 rounded-xl bg-[#030d1a] border border-white/15 shadow-2xl p-1.5 z-50 animate-fade-in font-mono text-xs">
                {SECONDARY_NAV_ITEMS.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMoreOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <span className="text-cyan-400">{ICON_MAP[item.icon] ?? null}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Tools: Role Switcher + Theme Switcher + Mobile Toggle */}
        <div className="flex items-center gap-2">
          {/* User Role Switcher */}
          <button
            onClick={cycleRole}
            title={`Active Role: ${roleInfo.label} — ${roleInfo.description} (Click to switch)`}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 transition-all cursor-pointer"
          >
            <span>{roleInfo.icon}</span>
            <span className="hidden sm:inline font-bold text-cyan-300">{roleInfo.badge}</span>
          </button>

          {/* Theme Mode Switcher (Prominent & Intuitive) */}
          <button
            onClick={cycleTheme}
            title={`Active Theme: ${
              theme === 'dark' ? 'Deep Ocean Dark' : theme === 'light' ? 'Maritime Research Light' : 'Satellite Tactical'
            } (Click to toggle)`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-mono font-bold text-slate-200 hover:text-white transition-all cursor-pointer shadow-sm"
            aria-label="Toggle Theme Mode"
          >
            {theme === 'dark' && (
              <>
                <Moon size={14} className="text-cyan-300" />
                <span className="hidden sm:inline text-cyan-200">Dark</span>
              </>
            )}
            {theme === 'light' && (
              <>
                <Sun size={14} className="text-amber-500" />
                <span className="hidden sm:inline text-slate-800">Light</span>
              </>
            )}
            {theme === 'tactical' && (
              <>
                <Crosshair size={14} className="text-emerald-400" />
                <span className="hidden sm:inline text-emerald-300">Tactical</span>
              </>
            )}
          </button>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="lg:hidden p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white cursor-pointer"
            aria-label="Toggle Mobile Menu"
          >
            {mobileOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-white/10 bg-[#030d1a] p-3 space-y-1 font-mono text-xs animate-fade-in">
          {[...PRIMARY_NAV_ITEMS, ...SECONDARY_NAV_ITEMS].map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors',
                  isActive
                    ? 'bg-cyan-950/80 text-cyan-300 font-bold border border-cyan-400/40'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                )
              }
            >
              <span className="text-cyan-400">{ICON_MAP[item.icon] ?? null}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      )}
    </header>
  )
}
