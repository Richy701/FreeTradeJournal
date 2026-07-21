import React, { createContext, useContext, useState, useEffect, useLayoutEffect, useMemo, useCallback } from 'react'
import {
  hexToHslString,
  perceivedLuma,
  contrastText,
  deriveChartVars,
  deriveSurfaceVars,
} from '@/lib/theme-vars'

interface ModeColors {
  profit: string
  loss: string
  primary: string
}

interface ThemePreset {
  name: string
  colors: ModeColors & { primaryButtonText?: string }
  // Optional per-mode color overrides. Declared here (instead of special-cased
  // in code) so each preset owns how it reads in light vs dark mode.
  dark?: Partial<ModeColors>
  light?: Partial<ModeColors>
  // Optional: full CSS variable overrides for complete visual themes
  cssOverrides?: {
    light: Record<string, string>
    dark: Record<string, string>
  }
  // Optional: representative colors for the Settings swatch (overrides the
  // profit/accent/loss bars). Use for full themes whose identity is the
  // background/surfaces rather than the profit/loss colors.
  swatch?: string[]
}

// User-defined custom theme. The three base colors are the free tier (as it
// has always been); the optional fields are the Pro Theme Studio — per-mode
// color variants, surface tints that generate a full theme, and corner radius.
export interface CustomThemeConfig {
  primary: string
  profit: string
  loss: string
  dark?: Partial<ModeColors>
  surfaceLight?: string
  surfaceDark?: string
  radius?: number
}

export const DEFAULT_CUSTOM_COLORS: CustomThemeConfig = {
  profit: '#10b981',
  loss: '#ef4444',
  primary: '#8b5cf6',
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
    },
    dark: {
      loss: '#f8fafc', // slate-50 - clean white for losses in dark mode
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
    name: 'Mono',
    colors: {
      profit: '#1a1a1a', // near-black for profits (light mode)
      loss: '#9ca3af',   // medium gray for losses (light mode)
      primary: '#374151' // gray-700 - dark charcoal primary
    },
    light: {
      profit: '#000000', // black profits visible in light mode
      loss: '#000000',   // black losses visible in light mode
      primary: '#374151' // darker gray primary for light mode
    },
    dark: {
      profit: '#f1f5f9', // slate-100 - bright for dark backgrounds
      loss: '#6b7280',   // gray-500 - muted but visible
      primary: '#d1d5db' // gray-300 - light charcoal primary
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
        '--background': '210 20% 97%',
        '--foreground': '0 0% 10%',
        '--card': '0 0% 100%',
        '--card-foreground': '0 0% 10%',
        '--popover': '0 0% 100%',
        '--popover-foreground': '0 0% 10%',
        '--primary': '213 100% 50%',
        '--primary-foreground': '0 0% 100%',
        '--secondary': '210 12% 93%',
        '--secondary-foreground': '0 0% 10%',
        '--muted': '210 12% 93%',
        '--muted-foreground': '0 0% 36%',
        '--accent': '213 100% 50%',
        '--accent-foreground': '0 0% 10%',
        '--destructive': '6 74% 57%',
        '--destructive-foreground': '0 0% 100%',
        '--border': '210 8% 88%',
        '--input': '210 8% 88%',
        '--ring': '228 100% 62%',
        '--chart-1': '213 100% 50%',
        '--chart-2': '145 63% 49%',
        '--chart-3': '6 74% 57%',
        '--chart-4': '210 12% 93%',
        '--chart-5': '210 8% 80%',
        '--sidebar-background': '210 16% 95%',
        '--sidebar-foreground': '0 0% 10%',
        '--sidebar-primary': '213 100% 50%',
        '--sidebar-primary-foreground': '0 0% 100%',
        '--sidebar-accent': '210 10% 91%',
        '--sidebar-accent-foreground': '0 0% 10%',
        '--sidebar-border': '210 8% 84%',
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
    dark: {
      primary: '#e82149' // brighter wine for dark surfaces
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
        '--radius': '0.85rem',
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
        '--radius': '0.85rem',
      }
    }
  },

  navy: {
    name: 'Navy Gold',
    colors: {
      profit: '#f59e0b', // gold = up
      loss: '#8b97ac',   // muted slate = down — no red, stays on the navy palette
      primary: '#f59e0b' // gold accent on navy
    },
    dark: {
      profit: '#fbbf24', // amber-400 - bright gold on navy
      loss: '#8ea2cc',   // navy-tinted slate - "down" without red or neutral grey
    },
    light: {
      profit: '#c2820a', // amber-700 - gold readable on light background
      loss: '#465980',   // navy-slate - "down" tone that stays on the navy palette
    },
    swatch: ['#0e1c3a', '#1f3057', '#f59e0b'], // deep navy, navy, gold
    cssOverrides: {
      light: {
        '--background': '217 44% 95%',
        '--foreground': '222 47% 12%',
        '--card': '0 0% 100%',
        '--card-foreground': '222 47% 12%',
        '--popover': '0 0% 100%',
        '--popover-foreground': '222 47% 12%',
        '--primary': '40 94% 47%',
        '--primary-foreground': '222 60% 12%',
        '--secondary': '217 40% 89%',
        '--secondary-foreground': '222 47% 18%',
        '--muted': '217 38% 90%',
        '--muted-foreground': '219 30% 36%',
        '--accent': '217 44% 87%',
        '--accent-foreground': '222 47% 18%',
        '--destructive': '0 76% 50%',
        '--destructive-foreground': '0 0% 100%',
        '--border': '216 34% 83%',
        '--input': '216 34% 83%',
        '--ring': '40 94% 47%',
        '--chart-1': '38 92% 48%',
        '--chart-2': '24 88% 50%',
        '--chart-3': '210 80% 48%',
        '--chart-4': '192 80% 42%',
        '--chart-5': '250 55% 58%',
        '--sidebar-background': '223 50% 11%',
        '--sidebar-foreground': '214 30% 92%',
        '--sidebar-primary': '42 96% 60%',
        '--sidebar-primary-foreground': '222 60% 12%',
        '--sidebar-accent': '221 38% 21%',
        '--sidebar-accent-foreground': '214 32% 96%',
        '--sidebar-border': '221 35% 18%',
        '--sidebar-ring': '42 96% 60%',
        '--radius': '0.85rem',
      },
      dark: {
        '--background': '221 56% 10%',
        '--foreground': '213 40% 96%',
        '--card': '220 48% 14%',
        '--card-foreground': '213 40% 96%',
        '--popover': '220 48% 14%',
        '--popover-foreground': '213 40% 96%',
        '--primary': '42 96% 58%',
        '--primary-foreground': '222 60% 12%',
        '--secondary': '220 40% 17%',
        '--secondary-foreground': '213 40% 96%',
        '--muted': '220 35% 15%',
        '--muted-foreground': '214 25% 68%',
        '--accent': '220 42% 18%',
        '--accent-foreground': '213 40% 96%',
        '--destructive': '0 76% 50%',
        '--destructive-foreground': '0 0% 100%',
        '--border': '218 38% 24%',
        '--input': '218 38% 24%',
        '--ring': '42 96% 58%',
        '--chart-1': '42 96% 58%',
        '--chart-2': '28 90% 56%',
        '--chart-3': '210 85% 62%',
        '--chart-4': '192 85% 55%',
        '--chart-5': '250 70% 72%',
        '--sidebar-background': '223 60% 8%',
        '--sidebar-foreground': '213 30% 90%',
        '--sidebar-primary': '42 96% 58%',
        '--sidebar-primary-foreground': '222 60% 12%',
        '--sidebar-accent': '220 45% 16%',
        '--sidebar-accent-foreground': '213 30% 92%',
        '--sidebar-border': '220 40% 14%',
        '--sidebar-ring': '42 96% 58%',
        '--radius': '0.85rem',
      }
    }
  },

  // Deep emerald full theme - calm, growth-focused
  forest: {
    name: 'Forest',
    colors: {
      profit: '#34d399', // emerald-400
      loss: '#fb923c',   // orange-400 - warm "down" that stays off harsh red
      primary: '#10b981' // emerald-500
    },
    light: {
      profit: '#059669', // emerald-600 - readable on light surfaces
      loss: '#ea580c',   // orange-600
      primary: '#047857' // emerald-700
    },
    swatch: ['#07150e', '#0e2418', '#10b981'],
    cssOverrides: {
      light: {
        '--background': '150 25% 96.5%',
        '--foreground': '158 30% 8%',
        '--card': '0 0% 100%',
        '--card-foreground': '158 30% 8%',
        '--popover': '0 0% 100%',
        '--popover-foreground': '158 30% 8%',
        '--primary': '161 84% 28%',
        '--primary-foreground': '0 0% 100%',
        '--secondary': '150 18% 92%',
        '--secondary-foreground': '158 30% 12%',
        '--muted': '150 18% 92%',
        '--muted-foreground': '155 12% 36%',
        '--accent': '152 24% 88%',
        '--accent-foreground': '158 30% 12%',
        '--destructive': '0 76% 50%',
        '--destructive-foreground': '0 0% 100%',
        '--border': '150 15% 85%',
        '--input': '150 15% 85%',
        '--ring': '161 84% 28%',
        '--chart-1': '161 84% 28%',
        '--chart-2': '160 84% 39%',
        '--chart-3': '25 90% 48%',
        '--chart-4': '84 65% 38%',
        '--chart-5': '190 55% 38%',
        '--sidebar-background': '158 35% 12%',
        '--sidebar-foreground': '150 15% 95%',
        '--sidebar-primary': '160 70% 45%',
        '--sidebar-primary-foreground': '160 90% 6%',
        '--sidebar-accent': '157 30% 18%',
        '--sidebar-accent-foreground': '150 15% 95%',
        '--sidebar-border': '157 30% 17%',
        '--sidebar-ring': '160 70% 45%',
        '--radius': '0.85rem',
      },
      dark: {
        '--background': '155 35% 4%',
        '--foreground': '150 20% 96%',
        '--card': '155 28% 7%',
        '--card-foreground': '150 20% 96%',
        '--popover': '155 28% 7%',
        '--popover-foreground': '150 20% 96%',
        '--primary': '160 84% 45%',
        '--primary-foreground': '160 90% 6%',
        '--secondary': '155 22% 12%',
        '--secondary-foreground': '150 20% 96%',
        '--muted': '155 20% 11%',
        '--muted-foreground': '152 12% 60%',
        '--accent': '155 25% 13%',
        '--accent-foreground': '150 20% 96%',
        '--destructive': '0 76% 55%',
        '--destructive-foreground': '0 0% 100%',
        '--border': '155 20% 15%',
        '--input': '155 20% 15%',
        '--ring': '160 84% 45%',
        '--chart-1': '160 84% 45%',
        '--chart-2': '158 64% 52%',
        '--chart-3': '27 96% 61%',
        '--chart-4': '84 60% 55%',
        '--chart-5': '190 50% 55%',
        '--sidebar-background': '158 40% 3%',
        '--sidebar-foreground': '150 15% 90%',
        '--sidebar-primary': '160 84% 45%',
        '--sidebar-primary-foreground': '160 90% 6%',
        '--sidebar-accent': '155 28% 9%',
        '--sidebar-accent-foreground': '150 15% 92%',
        '--sidebar-border': '155 25% 10%',
        '--sidebar-ring': '160 84% 45%',
        '--radius': '0.85rem',
      }
    }
  },

  // Clean neutral full theme - quiet slate surfaces, steel accent
  graphite: {
    name: 'Graphite',
    colors: {
      profit: '#10b981', // emerald-500 - classic data colors on neutral surfaces
      loss: '#ef4444',   // red-500
      primary: '#64748b' // slate-500
    },
    dark: {
      primary: '#cbd5e1' // slate-300 - steel accent on dark graphite
    },
    light: {
      primary: '#475569' // slate-600
    },
    swatch: ['#111318', '#1f232b', '#94a3b8'],
    cssOverrides: {
      light: {
        '--background': '220 15% 97%',
        '--foreground': '222 15% 10%',
        '--card': '0 0% 100%',
        '--card-foreground': '222 15% 10%',
        '--popover': '0 0% 100%',
        '--popover-foreground': '222 15% 10%',
        '--primary': '217 20% 30%',
        '--primary-foreground': '0 0% 100%',
        '--secondary': '220 12% 92.5%',
        '--secondary-foreground': '222 15% 14%',
        '--muted': '220 12% 92.5%',
        '--muted-foreground': '220 8% 40%',
        '--accent': '220 12% 90%',
        '--accent-foreground': '222 15% 12%',
        '--destructive': '0 76% 50%',
        '--destructive-foreground': '0 0% 100%',
        '--border': '220 10% 86%',
        '--input': '220 10% 86%',
        '--ring': '217 20% 30%',
        '--chart-1': '217 25% 35%',
        '--chart-2': '160 84% 32%',
        '--chart-3': '0 72% 45%',
        '--chart-4': '217 15% 55%',
        '--chart-5': '217 10% 70%',
        '--sidebar-background': '220 12% 94%',
        '--sidebar-foreground': '222 12% 22%',
        '--sidebar-primary': '217 20% 30%',
        '--sidebar-primary-foreground': '0 0% 100%',
        '--sidebar-accent': '220 10% 89%',
        '--sidebar-accent-foreground': '222 12% 14%',
        '--sidebar-border': '220 10% 84%',
        '--sidebar-ring': '217 20% 30%',
        '--radius': '0.65rem',
      },
      dark: {
        '--background': '220 8% 5%',
        '--foreground': '220 10% 96%',
        '--card': '220 8% 8.5%',
        '--card-foreground': '220 10% 96%',
        '--popover': '220 8% 8.5%',
        '--popover-foreground': '220 10% 96%',
        '--primary': '215 18% 78%',
        '--primary-foreground': '220 20% 8%',
        '--secondary': '220 7% 14%',
        '--secondary-foreground': '220 10% 96%',
        '--muted': '220 6% 13%',
        '--muted-foreground': '218 8% 62%',
        '--accent': '220 8% 15%',
        '--accent-foreground': '220 10% 96%',
        '--destructive': '0 76% 55%',
        '--destructive-foreground': '0 0% 100%',
        '--border': '220 7% 17%',
        '--input': '220 7% 17%',
        '--ring': '215 18% 78%',
        '--chart-1': '215 20% 75%',
        '--chart-2': '160 60% 50%',
        '--chart-3': '0 72% 60%',
        '--chart-4': '215 15% 55%',
        '--chart-5': '215 10% 40%',
        '--sidebar-background': '220 9% 3.5%',
        '--sidebar-foreground': '220 8% 88%',
        '--sidebar-primary': '215 18% 78%',
        '--sidebar-primary-foreground': '220 20% 8%',
        '--sidebar-accent': '220 8% 11%',
        '--sidebar-accent-foreground': '220 8% 92%',
        '--sidebar-border': '220 7% 12%',
        '--sidebar-ring': '215 18% 78%',
        '--radius': '0.65rem',
      }
    }
  },

  // Green-on-black trader terminal full theme
  terminal: {
    name: 'Terminal',
    colors: {
      profit: '#4ade80', // green-400
      loss: '#f87171',   // red-400
      primary: '#22c55e' // green-500
    },
    light: {
      profit: '#15803d', // green-700
      loss: '#dc2626',   // red-600
      primary: '#16a34a' // green-600
    },
    swatch: ['#020402', '#0a120a', '#22c55e'],
    cssOverrides: {
      light: {
        '--background': '120 12% 96.5%',
        '--foreground': '140 25% 8%',
        '--card': '0 0% 100%',
        '--card-foreground': '140 25% 8%',
        '--popover': '0 0% 100%',
        '--popover-foreground': '140 25% 8%',
        '--primary': '142 70% 28%',
        '--primary-foreground': '0 0% 100%',
        '--secondary': '130 10% 92%',
        '--secondary-foreground': '140 25% 12%',
        '--muted': '130 10% 92%',
        '--muted-foreground': '135 8% 38%',
        '--accent': '135 12% 89%',
        '--accent-foreground': '140 25% 10%',
        '--destructive': '0 76% 45%',
        '--destructive-foreground': '0 0% 100%',
        '--border': '130 10% 85%',
        '--input': '130 10% 85%',
        '--ring': '142 70% 28%',
        '--chart-1': '142 70% 28%',
        '--chart-2': '142 71% 38%',
        '--chart-3': '0 74% 48%',
        '--chart-4': '84 60% 35%',
        '--chart-5': '170 55% 32%',
        '--sidebar-background': '140 15% 6%',
        '--sidebar-foreground': '140 15% 88%',
        '--sidebar-primary': '142 71% 45%',
        '--sidebar-primary-foreground': '144 80% 5%',
        '--sidebar-accent': '140 12% 11%',
        '--sidebar-accent-foreground': '140 15% 92%',
        '--sidebar-border': '140 12% 12%',
        '--sidebar-ring': '142 71% 45%',
        '--radius': '0.45rem',
      },
      dark: {
        '--background': '140 15% 2.5%',
        '--foreground': '140 25% 92%',
        '--card': '140 12% 5%',
        '--card-foreground': '140 25% 92%',
        '--popover': '140 12% 5%',
        '--popover-foreground': '140 25% 92%',
        '--primary': '142 71% 45%',
        '--primary-foreground': '144 80% 5%',
        '--secondary': '140 10% 10%',
        '--secondary-foreground': '140 25% 92%',
        '--muted': '140 8% 9%',
        '--muted-foreground': '140 12% 55%',
        '--accent': '140 12% 11%',
        '--accent-foreground': '140 25% 94%',
        '--destructive': '0 80% 58%',
        '--destructive-foreground': '0 0% 100%',
        '--border': '140 12% 12%',
        '--input': '140 12% 12%',
        '--ring': '142 71% 45%',
        '--chart-1': '142 71% 45%',
        '--chart-2': '142 69% 58%',
        '--chart-3': '0 91% 71%',
        '--chart-4': '84 70% 55%',
        '--chart-5': '170 60% 45%',
        '--sidebar-background': '140 18% 1.8%',
        '--sidebar-foreground': '140 15% 85%',
        '--sidebar-primary': '142 71% 45%',
        '--sidebar-primary-foreground': '144 80% 5%',
        '--sidebar-accent': '140 12% 7%',
        '--sidebar-accent-foreground': '140 15% 90%',
        '--sidebar-border': '140 12% 8%',
        '--sidebar-ring': '142 71% 45%',
        '--radius': '0.45rem',
      }
    }
  },

  // Deep violet full theme
  midnight: {
    name: 'Midnight',
    colors: {
      profit: '#34d399', // emerald-400
      loss: '#fb7185',   // rose-400
      primary: '#8b5cf6' // violet-500
    },
    light: {
      profit: '#059669', // emerald-600
      loss: '#e11d48',   // rose-600
      primary: '#7c3aed' // violet-600
    },
    swatch: ['#0b0716', '#1b1230', '#8b5cf6'],
    cssOverrides: {
      light: {
        '--background': '255 30% 96.5%',
        '--foreground': '258 30% 10%',
        '--card': '0 0% 100%',
        '--card-foreground': '258 30% 10%',
        '--popover': '0 0% 100%',
        '--popover-foreground': '258 30% 10%',
        '--primary': '262 75% 48%',
        '--primary-foreground': '0 0% 100%',
        '--secondary': '256 22% 92%',
        '--secondary-foreground': '258 30% 14%',
        '--muted': '256 22% 92%',
        '--muted-foreground': '257 12% 40%',
        '--accent': '256 26% 89%',
        '--accent-foreground': '258 30% 12%',
        '--destructive': '347 77% 45%',
        '--destructive-foreground': '0 0% 100%',
        '--border': '256 18% 86%',
        '--input': '256 18% 86%',
        '--ring': '262 75% 48%',
        '--chart-1': '262 75% 48%',
        '--chart-2': '160 84% 32%',
        '--chart-3': '347 77% 50%',
        '--chart-4': '290 60% 45%',
        '--chart-5': '220 70% 50%',
        '--sidebar-background': '259 35% 13%',
        '--sidebar-foreground': '255 20% 95%',
        '--sidebar-primary': '258 85% 70%',
        '--sidebar-primary-foreground': '259 40% 10%',
        '--sidebar-accent': '258 30% 19%',
        '--sidebar-accent-foreground': '255 20% 95%',
        '--sidebar-border': '258 30% 18%',
        '--sidebar-ring': '258 85% 70%',
        '--radius': '0.85rem',
      },
      dark: {
        '--background': '258 35% 4.5%',
        '--foreground': '255 30% 96%',
        '--card': '258 30% 7.5%',
        '--card-foreground': '255 30% 96%',
        '--popover': '258 30% 7.5%',
        '--popover-foreground': '255 30% 96%',
        '--primary': '258 88% 66%',
        '--primary-foreground': '0 0% 100%',
        '--secondary': '258 22% 14%',
        '--secondary-foreground': '255 30% 96%',
        '--muted': '258 20% 12%',
        '--muted-foreground': '256 15% 64%',
        '--accent': '258 25% 15%',
        '--accent-foreground': '255 30% 96%',
        '--destructive': '350 84% 60%',
        '--destructive-foreground': '0 0% 100%',
        '--border': '258 22% 16%',
        '--input': '258 22% 16%',
        '--ring': '258 88% 66%',
        '--chart-1': '258 88% 66%',
        '--chart-2': '158 64% 52%',
        '--chart-3': '351 95% 71%',
        '--chart-4': '290 70% 65%',
        '--chart-5': '220 70% 65%',
        '--sidebar-background': '260 40% 3%',
        '--sidebar-foreground': '255 20% 90%',
        '--sidebar-primary': '258 88% 66%',
        '--sidebar-primary-foreground': '0 0% 100%',
        '--sidebar-accent': '258 28% 10%',
        '--sidebar-accent-foreground': '255 20% 93%',
        '--sidebar-border': '258 25% 11%',
        '--sidebar-ring': '258 88% 66%',
        '--radius': '0.85rem',
      }
    }
  },

  // User-defined custom theme — always last
  custom: {
    name: 'Custom',
    colors: {
      profit: DEFAULT_CUSTOM_COLORS.profit,
      loss: DEFAULT_CUSTOM_COLORS.loss,
      primary: DEFAULT_CUSTOM_COLORS.primary,
    },
  },
}

interface ThemeContextType {
  currentTheme: string
  themeColors: ThemePreset['colors'] & { primaryButtonText: string }
  setTheme: (theme: string) => void
  availableThemes: Record<string, ThemePreset>
  alpha: (color: string, hexOpacity: string) => string
  setCustomColors: (colors: Partial<CustomThemeConfig>) => void
  customColors: CustomThemeConfig
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

// Resolve the three data colors (primary/profit/loss) for a preset in a given
// mode: base colors, then the preset's declared per-mode overrides, then a
// dark-mode brightness safety net for colors without an explicit override
// (matters mainly for user-picked custom colors that vanish on dark surfaces).
function resolveModeColors(
  presetKey: string,
  custom: CustomThemeConfig,
  mode: 'light' | 'dark'
): ModeColors {
  const preset = themePresets[presetKey]
  const base: ModeColors = presetKey === 'custom'
    ? { primary: custom.primary, profit: custom.profit, loss: custom.loss }
    : { primary: preset.colors.primary, profit: preset.colors.profit, loss: preset.colors.loss }

  const override = presetKey === 'custom'
    ? (mode === 'dark' ? custom.dark : undefined)
    : (mode === 'dark' ? preset.dark : preset.light)

  const colors: ModeColors = { ...base }
  const explicit: Partial<Record<keyof ModeColors, boolean>> = {}
  if (override) {
    for (const key of ['primary', 'profit', 'loss'] as const) {
      if (override[key]) {
        colors[key] = override[key]!
        explicit[key] = true
      }
    }
  }

  if (mode === 'dark') {
    const brightness = (hex: string) => perceivedLuma(hex) * 255

    if (!explicit.loss && brightness(colors.loss) < 100) {
      if (colors.loss.startsWith('#1f') || colors.loss.startsWith('#0f')) {
        colors.loss = '#ef4444' // red-500
      }
    }

    const brighten = (hex: string, factor: number) => {
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      const ch = (v: number) => Math.min(255, Math.round(v * factor)).toString(16).padStart(2, '0')
      return `#${ch(r)}${ch(g)}${ch(b)}`
    }

    if (!explicit.profit && brightness(colors.profit) < 80) {
      colors.profit = brighten(colors.profit, 1.5)
    }
    if (!explicit.primary && brightness(colors.primary) < 80) {
      colors.primary = brighten(colors.primary, 1.3)
    }
  }

  return colors
}

// Compute the full CSS-variable set for a preset in one mode. Used to apply
// the theme live, to cache {light, dark} sets in localStorage so the
// index.html pre-paint script can apply them before React mounts (FOUC fix),
// and by the Theme Studio to render live previews of draft custom themes.
export function computeThemeVars(
  presetKey: string,
  custom: CustomThemeConfig,
  mode: 'light' | 'dark'
): Record<string, string> {
  const preset = themePresets[presetKey]
  const vars: Record<string, string> = {}
  const colors = resolveModeColors(presetKey, custom, mode)

  if (preset.cssOverrides) {
    Object.assign(vars, preset.cssOverrides[mode])
  } else {
    // Custom theme's Pro surface tint generates a full theme like the
    // built-in cssOverrides themes do
    if (presetKey === 'custom') {
      const tint = mode === 'dark' ? custom.surfaceDark : custom.surfaceLight
      if (tint) Object.assign(vars, deriveSurfaceVars(tint, mode))
      if (custom.radius != null) vars['--radius'] = `${custom.radius}rem`
    }
    const primaryHsl = hexToHslString(colors.primary)
    vars['--primary'] = primaryHsl
    vars['--accent'] = primaryHsl
    vars['--ring'] = primaryHsl
    vars['--primary-foreground'] = perceivedLuma(colors.primary) > 0.55 ? '0 0% 0%' : '0 0% 100%'
  }

  vars['--profit'] = hexToHslString(colors.profit)
  vars['--loss'] = hexToHslString(colors.loss)

  const charts = deriveChartVars(colors.primary, colors.profit, colors.loss, mode === 'dark')
  for (const [prop, value] of Object.entries(charts)) {
    if (!vars[prop]) vars[prop] = value
  }

  return vars
}

const THEME_VARS_CACHE_KEY = 'theme-vars-cache'

declare global {
  interface Window {
    // CSS custom property names applied by the index.html pre-paint script,
    // so the provider knows what to clean up before its first apply
    __ftjThemeVars?: string[]
  }
}

export function ThemePresetsProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState('default')
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [pathname, setPathname] = useState(window.location.pathname)
  const [isDemo, setIsDemo] = useState(!!document.documentElement.dataset.demo)

  // Custom theme colors state — initialise from localStorage or defaults
  const [customColors, setCustomColorsState] = useState<CustomThemeConfig>(() => {
    try {
      const saved = localStorage.getItem('custom-theme-colors')
      if (saved) {
        const parsed = JSON.parse(saved)
        return { ...DEFAULT_CUSTOM_COLORS, ...parsed }
      }
    } catch { /* ignore */ }
    return { ...DEFAULT_CUSTOM_COLORS }
  })

  // Keep the mutable custom preset in sync with state
  useEffect(() => {
    themePresets.custom.colors = {
      primary: customColors.primary,
      profit: customColors.profit,
      loss: customColors.loss,
    }
    localStorage.setItem('custom-theme-colors', JSON.stringify(customColors))
  }, [customColors])

  const setCustomColors = useCallback((partial: Partial<CustomThemeConfig>) => {
    setCustomColorsState(prev => {
      const next = { ...prev, ...partial }
      // Keep the same object when values are unchanged — a fresh identity here
      // re-triggers ThemeSettingsSync's effects and can ping-pong settings
      // writes into the sync engine forever.
      return JSON.stringify(next) === JSON.stringify(prev) ? prev : next
    })
  }, [])

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

  // Track which CSS properties we've set via overrides so we can clean them
  // up. Seeded with whatever the index.html pre-paint script applied, so the
  // first cleanup removes those too (e.g. when demo mode is detected).
  const appliedOverridesRef = React.useRef<string[]>(window.__ftjThemeVars ?? [])

  // Update CSS variables when theme changes — useLayoutEffect to sync with inline styles
  useLayoutEffect(() => {
    const root = document.documentElement

    // Clean up all previously applied CSS overrides
    const cleanupOverrides = () => {
      for (const prop of appliedOverridesRef.current) {
        root.style.removeProperty(prop)
      }
      appliedOverridesRef.current = []
    }

    // Theme presets apply only on app routes — every public/marketing page
    // (including future ones) stays brand-amber without a list to keep in
    // sync. Mirrored in public/theme-init.js for the pre-paint pass.
    const appPaths = ['/dashboard', '/coach', '/trades', '/goals', '/journal', '/ideas', '/settings', '/profile', '/prop-tracker']
    const isAppPage = appPaths.some(p => pathname === p || pathname.startsWith(p + '/'))
    const isInDemo = isDemo || !!document.documentElement.dataset.demo

    if (!isAppPage || isInDemo) {
      // Reset to CSS-defined defaults (remove inline overrides)
      cleanupOverrides()
      root.style.removeProperty('--primary')
      root.style.removeProperty('--accent')
      root.style.removeProperty('--ring')
      root.style.removeProperty('--primary-foreground')
      return
    }

    const vars = computeThemeVars(currentTheme, customColors, isDarkMode ? 'dark' : 'light')

    cleanupOverrides()
    const appliedProps: string[] = []
    for (const [prop, value] of Object.entries(vars)) {
      root.style.setProperty(prop, value)
      appliedProps.push(prop)
    }
    appliedOverridesRef.current = appliedProps

    // Cache both modes for the index.html pre-paint script (FOUC prevention)
    try {
      localStorage.setItem(THEME_VARS_CACHE_KEY, JSON.stringify({
        light: computeThemeVars(currentTheme, customColors, 'light'),
        dark: computeThemeVars(currentTheme, customColors, 'dark'),
      }))
    } catch { /* storage full/unavailable — theme still applies live */ }
  }, [currentTheme, isDarkMode, pathname, isDemo, customColors])

  const setTheme = useCallback((theme: string) => {
    if (themePresets[theme]) {
      setCurrentTheme(theme)
      localStorage.setItem('selected-theme', theme)
    }
  }, [])

  const themeColors = useMemo(() => {
    const adjustedColors = resolveModeColors(currentTheme, customColors, isDarkMode ? 'dark' : 'light')
    return {
      ...adjustedColors,
      primaryButtonText: contrastText(adjustedColors.primary),
    }
  }, [currentTheme, isDarkMode, customColors])

  const alpha = useCallback((color: string, hexOpacity: string): string => {
    if (isDarkMode) return color + hexOpacity;
    const val = parseInt(hexOpacity, 16);
    if (val >= 0x80) return color + hexOpacity;
    const boosted = Math.min(0xa0, Math.max(0x30, Math.round(val * 3.5)));
    return color + boosted.toString(16).padStart(2, '0');
  }, [isDarkMode]);

  const contextValue = useMemo(() => ({
    currentTheme,
    themeColors,
    setTheme,
    availableThemes: themePresets,
    alpha,
    setCustomColors,
    customColors,
  }), [currentTheme, themeColors, setTheme, alpha, setCustomColors, customColors])

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
