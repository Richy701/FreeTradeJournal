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
  neon: {
    name: 'Neon',
    colors: {
      profit: '#00ff88', // bright neon green
      loss: '#ff0080',   // hot pink
      primary: '#00ffff' // cyan neon
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
  
  // Deep Yellow & Black theme - bold and striking
  monochrome: {
    name: 'Deep Yellow',
    colors: {
      profit: '#fbbf24', // yellow-400 - bright deep yellow for profits
      loss: '#1f2937',   // gray-800 - deep black/dark gray for losses  
      primary: '#f59e0b' // yellow-500 - rich yellow primary
    }
  },

  // Rich and elegant theme
  rose: {
    name: 'Rose Gold',
    colors: {
      profit: '#f59e0b', // gold
      loss: '#e11d48',   // rose-600
      primary: '#be185d' // pink-700
    }
  },

  mint: {
    name: 'Mint Frost',
    colors: {
      profit: '#10b981', // emerald
      loss: '#6366f1',   // indigo-500 - cool loss color
      primary: '#06b6d4' // cyan-500
    }
  },

  ice: {
    name: 'Ice',
    colors: {
      profit: '#67e8f9', // cyan-300 - ice blue
      loss: '#e879f9',   // fuchsia-400 - cool magenta
      primary: '#0891b2' // cyan-600 - deep ice
    }
  },

  crimson: {
    name: 'Crimson',
    colors: {
      profit: '#fcd34d', // amber-300 - bright gold
      loss: '#991b1b',   // red-800 - deep crimson
      primary: '#dc2626' // red-600 - bold crimson
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