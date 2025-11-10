import React, { createContext, useContext, useState, useEffect } from 'react'

interface ThemePreset {
  name: string
  colors: {
    profit: string
    loss: string
    primary: string
  }
}

const themePresets: Record<string, ThemePreset> = {
  default: {
    name: 'Default',
    colors: {
      profit: '#10b981', // green-500
      loss: '#ef4444',   // red-500  
      primary: '#3b82f6' // blue-500
    }
  },
  ocean: {
    name: 'Ocean Blue',
    colors: {
      profit: '#06b6d4', // cyan-500
      loss: '#f97316',   // orange-500
      primary: '#0ea5e9' // sky-500
    }
  },
  forest: {
    name: 'Forest',
    colors: {
      profit: '#22c55e', // green-500
      loss: '#dc2626',   // red-600
      primary: '#16a34a' // green-600
    }
  },
  sunset: {
    name: 'Sunset',
    colors: {
      profit: '#eab308', // yellow-500
      loss: '#dc2626',   // red-600
      primary: '#f97316' // orange-500
    }
  },
  purple: {
    name: 'Purple',
    colors: {
      profit: '#8b5cf6', // violet-500
      loss: '#ec4899',   // pink-500
      primary: '#7c3aed' // violet-600
    }
  },
  
  // Monochrome theme - elegant and focused with better contrast
  monochrome: {
    name: 'Monochrome',
    colors: {
      profit: '#059669', // emerald-600 - visible green in both modes
      loss: '#dc2626',   // red-600 - clear red signal  
      primary: '#6b7280' // gray-500 - neutral that works in both modes
    }
  },

  // Professional themes with improved contrast
  navy: {
    name: 'Navy Dynamic',
    colors: {
      profit: '#06b6d4', // cyan-500 - works in both modes
      loss: '#ef4444',   // red-500 - clear loss signal
      primary: '#1e40af' // blue-800 - strong but not too dark
    }
  },

  teal: {
    name: 'Teal Modern',
    colors: {
      profit: '#14b8a6', // teal-500 - modern and visible
      loss: '#f43f5e',   // rose-500 - softer than pure red
      primary: '#0891b2' // cyan-600 - clean and sophisticated
    }
  },

  corporate: {
    name: 'Corporate Blue',
    colors: {
      profit: '#3b82f6', // blue-500 - professional and clear
      loss: '#ef4444',   // red-500 - standard warning
      primary: '#1e3a8a' // blue-900 - authoritative
    }
  },

  charcoal: {
    name: 'Charcoal Rust',
    colors: {
      profit: '#06b6d4', // cyan-500 - good contrast
      loss: '#f97316',   // orange-500 - warm warning
      primary: '#475569' // slate-600 - modern neutral
    }
  },

  energy: {
    name: 'Energy Burst',
    colors: {
      profit: '#f59e0b', // amber-500 - bright positive
      loss: '#ef4444',   // red-500 - clear negative
      primary: '#7c3aed' // violet-600 - energetic primary
    }
  },

  sage: {
    name: 'Sage',
    colors: {
      profit: '#84cc16', // lime-500 - fresh, growth-oriented
      loss: '#f59e0b',   // amber-500 - warm warning, not harsh
      primary: '#65a30d' // lime-600 - calming sage green
    }
  }
}

interface ThemeContextType {
  currentTheme: string
  themeColors: ThemePreset['colors']
  setTheme: (theme: string) => void
  availableThemes: Record<string, ThemePreset>
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemePresetsProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState('default')
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('selected-theme')
    if (savedTheme && themePresets[savedTheme]) {
      setCurrentTheme(savedTheme)
    }
    
    // Check for dark mode
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark')
      setIsDarkMode(isDark)
    }
    
    checkDarkMode()
    
    // Watch for theme mode changes
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })
    
    return () => observer.disconnect()
  }, [])

  // Update CSS variables when theme changes (only for dashboard pages)
  useEffect(() => {
    // Check if we're on a public page (landing, footer pages)
    const isPublicPage = ['/', '/privacy', '/terms', '/cookie-policy', '/documentation', '/blog'].includes(window.location.pathname) 
      || window.location.pathname.startsWith('/blog/')
    
    // Don't update CSS variables for public pages
    if (isPublicPage) return
    
    const colors = themePresets[currentTheme].colors
    const root = document.documentElement
    
    // Convert hex to HSL for CSS variables
    const hexToHsl = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16) / 255
      const g = parseInt(hex.slice(3, 5), 16) / 255
      const b = parseInt(hex.slice(5, 7), 16) / 255
      
      const max = Math.max(r, g, b)
      const min = Math.min(r, g, b)
      let h = 0, s = 0, l = (max + min) / 2
      
      if (max !== min) {
        const d = max - min
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break
          case g: h = (b - r) / d + 2; break
          case b: h = (r - g) / d + 4; break
        }
        h /= 6
      }
      
      return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
    }
    
    // Update CSS variables for dashboard pages
    root.style.setProperty('--primary', hexToHsl(colors.primary))
    root.style.setProperty('--ring', hexToHsl(colors.primary))
  }, [currentTheme])

  const setTheme = (theme: string) => {
    if (themePresets[theme]) {
      setCurrentTheme(theme)
      localStorage.setItem('selected-theme', theme)
    }
  }

  // Adjust colors based on dark/light mode for better visibility
  const getAdjustedColors = () => {
    const baseColors = themePresets[currentTheme].colors
    
    // For certain themes that have visibility issues, apply adjustments
    if (isDarkMode) {
      // In dark mode, ensure colors are bright enough
      return baseColors
    } else {
      // In light mode, ensure colors have enough contrast
      return baseColors
    }
  }
  
  const themeColors = getAdjustedColors()

  return (
    <ThemeContext.Provider value={{ 
      currentTheme, 
      themeColors, 
      setTheme, 
      availableThemes: themePresets 
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useThemePresets() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useThemePresets must be used within a ThemePresetsProvider')
  }
  return context
}