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
  
  // Monochrome theme - elegant and focused
  monochrome: {
    name: 'Monochrome',
    colors: {
      profit: '#374151', // gray-700 - subtle dark gray for profits
      loss: '#6b7280',   // gray-500 - medium gray for losses  
      primary: '#1f2937' // gray-800 - deep charcoal for primary
    }
  },

  // Professional themes from Webflow's 26 best color combinations
  navy: {
    name: 'Navy Dynamic',
    colors: {
      profit: '#A1D6E2', // light blue - refreshing success indicator
      loss: '#C5001A',   // bright red - clear loss signal
      primary: '#002C54' // dark navy blue - authoritative and professional
    }
  },

  teal: {
    name: 'Teal Modern',
    colors: {
      profit: '#1995AD', // teal blue - modern and trustworthy
      loss: '#C5001A',   // bright red for contrast
      primary: '#F1F1F2' // light gray - clean and sophisticated
    }
  },

  corporate: {
    name: 'Corporate Blue',
    colors: {
      profit: '#CADCFC', // light blue - calm and reliable
      loss: '#C5001A',   // bright red for visibility
      primary: '#00246B' // dark blue - authoritative and cultivated
    }
  },

  charcoal: {
    name: 'Charcoal Rust',
    colors: {
      profit: '#90AFC5', // sky blue - calming profit indicator
      loss: '#763626',   // deep rust - sophisticated warning color
      primary: '#2A3132' // dark charcoal - bold and modern
    }
  },

  energy: {
    name: 'Energy Burst',
    colors: {
      profit: '#FFBB00', // yellow-orange - high energy positive
      loss: '#FB6542',   // orange-red - vibrant loss indicator
      primary: '#375E97' // deep navy blue - grounding professional base
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

  useEffect(() => {
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('selected-theme')
    if (savedTheme && themePresets[savedTheme]) {
      setCurrentTheme(savedTheme)
    }
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

  const themeColors = themePresets[currentTheme].colors

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