/**
 * ThemeContext.tsx — Global Multi-Theme Engine
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 *
 * Supported Themes:
 * - 'dark': Deep Ocean Dark (default scientific dark mode)
 * - 'light': Maritime Research Light (clean daylight academic mode)
 * - 'tactical': Satellite High-Contrast (command center obsidian & amber)
 */

import React, { createContext, useContext, useEffect, useState } from 'react'

export type ThemeMode = 'dark' | 'light' | 'tactical'

interface ThemeContextValue {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
  cycleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

const THEME_STORAGE_KEY = 'oceaniq_theme_mode'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY)
      if (stored === 'dark' || stored === 'light' || stored === 'tactical') {
        return stored
      }
    } catch {
      // Fallback if localStorage unavailable
    }
    return 'dark'
  })

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', theme)
    if (theme === 'light') {
      root.classList.remove('dark')
      root.classList.add('light')
    } else {
      root.classList.remove('light')
      root.classList.add('dark')
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // Ignore write failures
    }
  }, [theme])

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme)
  }

  const cycleTheme = () => {
    setThemeState((prev) => {
      if (prev === 'dark') return 'light'
      if (prev === 'light') return 'tactical'
      return 'dark'
    })
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
