import React, { createContext, useContext, useState, useEffect, useLayoutEffect, useMemo, useCallback } from 'react'

interface ThemePreset {
  name: string
  colors: {
    profit: string
    loss: string
    primary: string
    primaryButtonText?: string
  }
  // Optional: full CSS variable overrides for complete visual themes
  cssOverrides?: {
    light: Record<string, string>
    dark: Record<string, string>
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
      profit: '#10b981', // emerald-500 - vibrant but readable green
      loss: '#ec4899',   // pink-500 - bright but readable pink  
      primary: '#06b6d4' // cyan-500 - vibrant cyan
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
  
  // Deep Yellow & White theme - bold and striking
  monochrome: {
    name: 'Deep Yellow',
    colors: {
      profit: '#FFC000', // yellow for wins
      loss: '#374151',   // gray-700 for losses in light mode
      primary: '#FFC000' // yellow primary
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
      loss: '#dc2626',   // red-600 - crimson but brighter than red-800
      primary: '#dc2626' // red-600 - bold crimson
    }
  },

  energy: {
    name: 'Mono Black & White',
    colors: {
      profit: '#ffffff', // pure white for profits
      loss: '#000000',   // pure black for losses
      primary: '#6b7280' // gray-500 - neutral gray primary
    }
  },

  sage: {
    name: 'Sage',
    colors: {
      profit: '#84cc16', // lime-500 - fresh, growth-oriented
      loss: '#f59e0b',   // amber-500 - warm warning, not harsh
      primary: '#65a30d' // lime-600 - calming sage green
    }
  },

  // Clean minimal theme with blue accent
  clean: {
    name: 'Clean',
    colors: {
      profit: '#2ecc71',
      loss: '#e74c3c',
      primary: '#0073ff',
    },
    cssOverrides: {
      light: {
        '--background': '220 14% 96%',
        '--foreground': '0 0% 10%',
        '--card': '0 0% 100%',
        '--card-foreground': '0 0% 10%',
        '--popover': '0 0% 100%',
        '--popover-foreground': '0 0% 10%',
        '--primary': '213 100% 50%',
        '--primary-foreground': '0 0% 100%',
        '--secondary': '220 12% 93%',
        '--secondary-foreground': '0 0% 10%',
        '--muted': '220 12% 93%',
        '--muted-foreground': '0 0% 36%',
        '--accent': '213 100% 50%',
        '--accent-foreground': '0 0% 10%',
        '--destructive': '6 74% 57%',
        '--destructive-foreground': '0 0% 100%',
        '--border': '220 10% 86%',
        '--input': '220 10% 86%',
        '--ring': '228 100% 62%',
        '--chart-1': '213 100% 50%',
        '--chart-2': '145 63% 49%',
        '--chart-3': '6 74% 57%',
        '--chart-4': '220 12% 93%',
        '--chart-5': '220 10% 80%',
        '--sidebar-background': '220 14% 95%',
        '--sidebar-foreground': '0 0% 10%',
        '--sidebar-primary': '213 100% 50%',
        '--sidebar-primary-foreground': '0 0% 100%',
        '--sidebar-accent': '220 12% 91%',
        '--sidebar-accent-foreground': '0 0% 10%',
        '--sidebar-border': '220 10% 82%',
        '--sidebar-ring': '213 100% 50%',
        '--radius': '0.85rem',
      },
      dark: {
        '--background': '240 7% 3.5%',
        '--foreground': '0 0% 100%',
        '--card': '0 0% 10%',
        '--card-foreground': '0 0% 100%',
        '--popover': '0 0% 10%',
        '--popover-foreground': '0 0% 100%',
        '--primary': '213 100% 50%',
        '--primary-foreground': '0 0% 100%',
        '--secondary': '0 0% 10%',
        '--secondary-foreground': '0 0% 100%',
        '--muted': '240 4% 18%',
        '--muted-foreground': '240 2% 62%',
        '--accent': '213 100% 50%',
        '--accent-foreground': '0 0% 100%',
        '--destructive': '3 100% 61%',
        '--destructive-foreground': '0 0% 100%',
        '--border': '240 3% 23%',
        '--input': '240 3% 23%',
        '--ring': '213 100% 50%',
        '--chart-1': '213 100% 50%',
        '--chart-2': '145 63% 49%',
        '--chart-3': '3 100% 61%',
        '--chart-4': '0 0% 10%',
        '--chart-5': '240 3% 23%',
        '--sidebar-background': '240 7% 3.5%',
        '--sidebar-foreground': '0 0% 100%',
        '--sidebar-primary': '213 100% 50%',
        '--sidebar-primary-foreground': '0 0% 100%',
        '--sidebar-accent': '0 0% 10%',
        '--sidebar-accent-foreground': '0 0% 100%',
        '--sidebar-border': '240 3% 23%',
        '--sidebar-ring': '213 100% 50%',
        '--radius': '0.85rem',
      },
    },
  },

  // Deep burgundy/wine theme - complete visual redesign
  wine: {
    name: 'Wine',
    colors: {
      profit: '#10b981', // emerald-500 - clear positive
      loss: '#ef4444',   // red-500 - familiar loss color
      primary: '#b31938' // vivid wine red
    },
    cssOverrides: {
      light: {
        '--background': '350 15% 96%',
        '--foreground': '350 20% 12%',
        '--card': '0 0% 100%',
        '--card-foreground': '350 20% 12%',
        '--popover': '0 0% 100%',
        '--popover-foreground': '350 20% 12%',
        '--primary': '348 75% 40%',
        '--primary-foreground': '0 0% 100%',
        '--secondary': '348 12% 93%',
        '--secondary-foreground': '348 75% 40%',
        '--muted': '348 12% 93%',
        '--muted-foreground': '350 12% 38%',
        '--accent': '355 65% 45%',
        '--accent-foreground': '0 0% 100%',
        '--destructive': '348 80% 45%',
        '--destructive-foreground': '0 0% 100%',
        '--border': '350 10% 86%',
        '--input': '350 10% 86%',
        '--ring': '348 75% 40%',
        '--chart-1': '348 75% 40%',
        '--chart-2': '355 65% 50%',
        '--chart-3': '340 60% 32%',
        '--chart-4': '350 60% 62%',
        '--chart-5': '348 50% 75%',
        '--sidebar-background': '350 40% 16%',
        '--sidebar-foreground': '350 15% 98.5%',
        '--sidebar-primary': '348 75% 50%',
        '--sidebar-primary-foreground': '0 0% 100%',
        '--sidebar-accent': '350 35% 22%',
        '--sidebar-accent-foreground': '350 15% 98.5%',
        '--sidebar-border': '350 30% 22%',
        '--sidebar-ring': '348 75% 40%',
        '--radius': '0.75rem',
      },
      dark: {
        '--background': '355.4 76.5% 3.3%',
        '--foreground': '351.4 70.3% 96.1%',
        '--card': '354.3 67.7% 6.1%',
        '--card-foreground': '351.4 70.3% 96.1%',
        '--popover': '354.3 67.7% 6.1%',
        '--popover-foreground': '351.4 70.3% 96.1%',
        '--primary': '355.5 77.6% 56.3%',
        '--primary-foreground': '0 0% 100%',
        '--secondary': '356.5 71.8% 13.9%',
        '--secondary-foreground': '353.1 100% 93.1%',
        '--muted': '354.4 61.5% 10.2%',
        '--muted-foreground': '354.1 37.2% 73.1%',
        '--accent': '354.0 79.1% 44.9%',
        '--accent-foreground': '0 0% 100%',
        '--destructive': '349.2 100% 65.1%',
        '--destructive-foreground': '0 0% 100%',
        '--border': '354.0 53.6% 11.0%',
        '--input': '353.2 55.8% 18.6%',
        '--ring': '353.7 100% 59.0%',
        '--chart-1': '355.5 77.6% 56.3%',
        '--chart-2': '349.3 100% 78.0%',
        '--chart-3': '345.0 99.9% 25.1%',
        '--chart-4': '348.9 100% 85.1%',
        '--chart-5': '355.8 67.9% 20.8%',
        '--sidebar-background': '353.3 81.7% 2.2%',
        '--sidebar-foreground': '351.4 70.3% 96.1%',
        '--sidebar-primary': '355.5 77.6% 56.3%',
        '--sidebar-primary-foreground': '0 0% 100%',
        '--sidebar-accent': '354.3 67.7% 6.1%',
        '--sidebar-accent-foreground': '0 0% 100%',
        '--sidebar-border': '354.3 67.7% 6.1%',
        '--sidebar-ring': '355.5 77.6% 56.3%',
        '--radius': '0.75rem',
      }
    }
  }
}

interface ThemeContextType {
  currentTheme: string
  themeColors: ThemePreset['colors'] & { primaryButtonText: string }
  setTheme: (theme: string) => void
  availableThemes: Record<string, ThemePreset>
  alpha: (color: string, hexOpacity: string) => string
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemePresetsProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState('default')
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [pathname, setPathname] = useState(window.location.pathname)
  const [isDemo, setIsDemo] = useState(!!document.documentElement.dataset.demo)

  // Track route changes for SPA navigation
  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname)
    window.addEventListener('popstate', onPopState)

    // Patch pushState/replaceState to detect React Router navigations
    const origPush = history.pushState.bind(history)
    const origReplace = history.replaceState.bind(history)
    history.pushState = (...args) => { origPush(...args); setPathname(window.location.pathname) }
    history.replaceState = (...args) => { origReplace(...args); setPathname(window.location.pathname) }

    return () => {
      window.removeEventListener('popstate', onPopState)
      history.pushState = origPush
      history.replaceState = origReplace
    }
  }, [])

  useEffect(() => {
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('selected-theme')
    if (savedTheme && themePresets[savedTheme]) {
      setCurrentTheme(savedTheme)
    }
    
    // Check for dark mode and demo mode
    const checkAttributes = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'))
      setIsDemo(!!document.documentElement.dataset.demo)
    }

    checkAttributes()

    // Watch for theme mode and demo mode changes
    const observer = new MutationObserver(checkAttributes)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-demo']
    })
    
    return () => observer.disconnect()
  }, [])

  // Track which CSS properties we've set via overrides so we can clean them up
  const appliedOverridesRef = React.useRef<string[]>([])

  // Update CSS variables when theme changes — useLayoutEffect to sync with inline styles
  useLayoutEffect(() => {
    const preset = themePresets[currentTheme]
    const colors = preset.colors
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

    // Clean up all previously applied CSS overrides
    const cleanupOverrides = () => {
      for (const prop of appliedOverridesRef.current) {
        root.style.removeProperty(prop)
      }
      appliedOverridesRef.current = []
    }

    // On public pages or in demo mode, reset CSS variables to amber/gold defaults
    const publicPaths = ['/', '/privacy', '/terms', '/cookies', '/documentation']
    const isPublicPage = publicPaths.some(p => pathname === p)
    const isInDemo = isDemo || !!document.documentElement.dataset.demo

    if (isPublicPage || isInDemo) {
      // Reset to CSS-defined defaults (remove inline overrides)
      cleanupOverrides()
      root.style.removeProperty('--primary')
      root.style.removeProperty('--ring')
      root.style.removeProperty('--primary-foreground')
      return
    }

    // If theme has full CSS overrides, apply them all
    if (preset.cssOverrides) {
      cleanupOverrides()
      const overrides = isDarkMode ? preset.cssOverrides.dark : preset.cssOverrides.light
      const appliedProps: string[] = []
      for (const [prop, value] of Object.entries(overrides)) {
        root.style.setProperty(prop, value)
        appliedProps.push(prop)
      }
      appliedOverridesRef.current = appliedProps
      return
    }

    // Standard theme: clean up any previous full overrides, then set primary/ring
    cleanupOverrides()

    // Update CSS variables for dashboard pages
    root.style.setProperty('--primary', hexToHsl(colors.primary))
    root.style.setProperty('--ring', hexToHsl(colors.primary))
    // Set primary-foreground for contrast (buttons, badges)
    const r = parseInt(colors.primary.slice(1, 3), 16)
    const g = parseInt(colors.primary.slice(3, 5), 16)
    const b = parseInt(colors.primary.slice(5, 7), 16)
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    root.style.setProperty('--primary-foreground', lum > 0.55 ? '0 0% 0%' : '0 0% 100%')
  }, [currentTheme, isDarkMode, pathname, isDemo])

  const setTheme = useCallback((theme: string) => {
    if (themePresets[theme]) {
      setCurrentTheme(theme)
      localStorage.setItem('selected-theme', theme)
    }
  }, [])

  // Adjust colors based on dark/light mode for better visibility
  const getAdjustedColors = () => {
    const baseColors = themePresets[currentTheme].colors
    
    // For certain themes that have visibility issues, apply adjustments
    if (isDarkMode) {
      // In dark mode, ensure colors are bright enough and visible
      if (currentTheme === 'monochrome') {
        // Deep Yellow theme - yellow and white aesthetic
        return {
          ...baseColors,
          loss: '#f8fafc', // slate-50 - clean white for losses in dark mode
          profit: baseColors.profit, // keep same yellow color
          primary: baseColors.primary // keep same yellow primary
        }
      }
      
      if (currentTheme === 'energy') {
        // Mono Black & White theme adjustments for dark mode
        return {
          ...baseColors,
          profit: '#f8fafc', // white profits visible in dark mode
          loss: '#ffffff',   // white losses visible in dark mode 
          primary: '#9ca3af' // lighter gray primary for dark mode
        }
      }
      
      // Check for other themes that might have dark colors that become invisible
      const adjustedColors = { ...baseColors }
      
      // Convert colors to RGB to check brightness
      const hexToRgb = (hex: string) => {
        const r = parseInt(hex.slice(1, 3), 16)
        const g = parseInt(hex.slice(3, 5), 16)
        const b = parseInt(hex.slice(5, 7), 16)
        return { r, g, b }
      }
      
      const getBrightness = (hex: string) => {
        const { r, g, b } = hexToRgb(hex)
        return (r * 299 + g * 587 + b * 114) / 1000
      }
      
      // If any color is too dark (brightness < 100), make it brighter
      if (getBrightness(adjustedColors.loss) < 100) {
        // Make loss color brighter for dark mode
        if (adjustedColors.loss.startsWith('#1f') || adjustedColors.loss.startsWith('#0f')) {
          adjustedColors.loss = '#ef4444' // red-500
        }
      }
      
      if (getBrightness(adjustedColors.profit) < 80) {
        // Ensure profit color is visible
        adjustedColors.profit = adjustedColors.profit.replace('#', '#').substring(0, 7)
        if (getBrightness(adjustedColors.profit) < 80) {
          const { r, g, b } = hexToRgb(adjustedColors.profit)
          const factor = 1.5
          adjustedColors.profit = `#${Math.min(255, Math.round(r * factor)).toString(16).padStart(2, '0')}${Math.min(255, Math.round(g * factor)).toString(16).padStart(2, '0')}${Math.min(255, Math.round(b * factor)).toString(16).padStart(2, '0')}`
        }
      }
      
      if (getBrightness(adjustedColors.primary) < 80) {
        // Ensure primary color is visible
        const { r, g, b } = hexToRgb(adjustedColors.primary)
        const factor = 1.3
        adjustedColors.primary = `#${Math.min(255, Math.round(r * factor)).toString(16).padStart(2, '0')}${Math.min(255, Math.round(g * factor)).toString(16).padStart(2, '0')}${Math.min(255, Math.round(b * factor)).toString(16).padStart(2, '0')}`
      }
      
      return adjustedColors
    } else {
      // In light mode, keep colors consistent with dark mode but ensure readability
      if (currentTheme === 'energy') {
        // Mono Black & White theme adjustments for light mode
        return {
          ...baseColors,
          profit: '#000000', // black profits visible in light mode
          loss: '#000000',   // black losses visible in light mode
          primary: '#374151' // darker gray primary for light mode
        }
      }
      
      return baseColors
    }
  }
  
  // Compute contrast-aware button text color from primary
  const getContrastText = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    // W3C relative luminance formula
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance > 0.55 ? '#000000' : '#ffffff'
  }

  const themeColors = useMemo(() => {
    const adjustedColors = getAdjustedColors()
    return {
      ...adjustedColors,
      primaryButtonText: getContrastText(adjustedColors.primary),
    }
  }, [currentTheme, isDarkMode])

  const alpha = useCallback((color: string, hexOpacity: string): string => {
    if (isDarkMode) return color + hexOpacity;
    const val = parseInt(hexOpacity, 16);
    // High values (>50%) are intentionally strong — pass through
    if (val >= 0x80) return color + hexOpacity;
    // Light mode needs a stronger boost: white backgrounds wash out low alpha.
    // 2.5x multiplier + 10% floor so nothing is invisible.
    const boosted = Math.min(0x80, Math.max(0x25, Math.round(val * 2.5)));
    return color + boosted.toString(16).padStart(2, '0');
  }, [isDarkMode]);

  const contextValue = useMemo(() => ({
    currentTheme,
    themeColors,
    setTheme,
    availableThemes: themePresets,
    alpha,
  }), [currentTheme, themeColors, setTheme, alpha])

  return (
    <ThemeContext.Provider value={contextValue}>
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