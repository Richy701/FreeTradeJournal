// Pure color helpers shared by the theme system: the ThemePresetsProvider uses
// them to compute CSS variables, and the same computed set is cached in
// localStorage ('theme-vars-cache') so the pre-paint script in index.html can
// apply the user's theme before React mounts (no flash of the default theme).

export interface HslParts { h: number; s: number; l: number }

export function hexToHslParts(hex: string): HslParts {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2

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

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

export function hslPartsToString({ h, s, l }: HslParts): string {
  return `${h} ${s}% ${l}%`
}

export function hexToHslString(hex: string): string {
  return hslPartsToString(hexToHslParts(hex))
}

// Simple perceived-luma (0..1) used for picking black/white button text.
// Kept as the historical formula so existing themes keep their text colors.
export function perceivedLuma(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

export function contrastText(hex: string): '#000000' | '#ffffff' {
  return perceivedLuma(hex) > 0.55 ? '#000000' : '#ffffff'
}

// WCAG relative luminance + contrast ratio, used by the Theme Studio to warn
// about unreadable color picks.
function wcagChannel(v: number): number {
  const c = v / 255
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

export function wcagLuminance(hex: string): number {
  const r = wcagChannel(parseInt(hex.slice(1, 3), 16))
  const g = wcagChannel(parseInt(hex.slice(3, 5), 16))
  const b = wcagChannel(parseInt(hex.slice(5, 7), 16))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

// Parse an "h s% l%" CSS variable value back to hex, so computed theme
// variables can be contrast-checked and rendered in previews.
export function hslStringToHex(hsl: string): string {
  const [h, s, l] = hsl.split(' ').map(part => parseFloat(part))
  const sat = s / 100
  const lig = l / 100
  const c = (1 - Math.abs(2 * lig - 1)) * sat
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = lig - c / 2
  let r = 0, g = 0, b = 0
  if (h < 60) { r = c; g = x }
  else if (h < 120) { r = x; g = c }
  else if (h < 180) { g = c; b = x }
  else if (h < 240) { g = x; b = c }
  else if (h < 300) { r = x; b = c }
  else { r = c; b = x }
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

export function contrastRatio(hexA: string, hexB: string): number {
  const la = wcagLuminance(hexA)
  const lb = wcagLuminance(hexB)
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

// Chart palette derived from a theme's three data colors, so charts follow the
// selected theme instead of falling back to undefined --chart-N variables.
// chart-4/5 are a lighter tint and a muted wash of the accent — a safe
// monochromatic ramp that works for any hue.
export function deriveChartVars(
  primaryHex: string,
  profitHex: string,
  lossHex: string,
  isDark: boolean
): Record<string, string> {
  const p = hexToHslParts(primaryHex)
  return {
    '--chart-1': hslPartsToString(p),
    '--chart-2': hexToHslString(profitHex),
    '--chart-3': hexToHslString(lossHex),
    '--chart-4': hslPartsToString({
      h: p.h,
      s: Math.min(p.s, 90),
      l: clamp(p.l + (isDark ? 16 : -16), 8, 88),
    }),
    '--chart-5': hslPartsToString({
      h: p.h,
      s: Math.round(p.s * 0.45),
      l: isDark ? 66 : 46,
    }),
  }
}

// Full surface set (backgrounds, cards, sidebar, borders) derived from a single
// tint color — how the Theme Studio lets users build Wine/Navy-style full
// themes without hand-tuning 30 variables. Saturation is capped so a vivid
// pick still yields usable surfaces.
export function deriveSurfaceVars(tintHex: string, mode: 'light' | 'dark'): Record<string, string> {
  const { h, s } = hexToHslParts(tintHex)

  if (mode === 'light') {
    const sat = Math.min(s, 45)
    const fg = `${h} ${Math.min(s, 15)}% 8%`
    return {
      '--background': `${h} ${sat}% 96.5%`,
      '--foreground': fg,
      '--card': `${h} ${Math.round(sat * 0.3)}% 99.5%`,
      '--card-foreground': fg,
      '--popover': `${h} ${Math.round(sat * 0.3)}% 99.5%`,
      '--popover-foreground': fg,
      '--secondary': `${h} ${Math.round(sat * 0.7)}% 93%`,
      '--secondary-foreground': `${h} 12% 12%`,
      '--muted': `${h} ${Math.round(sat * 0.7)}% 93%`,
      '--muted-foreground': `${h} 10% 38%`,
      '--border': `${h} ${Math.round(sat * 0.5)}% 87%`,
      '--input': `${h} ${Math.round(sat * 0.5)}% 87%`,
      '--sidebar-background': `${h} ${Math.round(sat * 0.8)}% 94.5%`,
      '--sidebar-foreground': `${h} 10% 20%`,
      '--sidebar-accent': `${h} ${Math.round(sat * 0.6)}% 90%`,
      '--sidebar-accent-foreground': `${h} 10% 12%`,
      '--sidebar-border': `${h} ${Math.round(sat * 0.5)}% 84%`,
    }
  }

  const sat = Math.min(s, 50)
  const fg = `${h} 25% 97%`
  return {
    '--background': `${h} ${sat}% 4.5%`,
    '--foreground': fg,
    '--card': `${h} ${Math.round(sat * 0.9)}% 7.5%`,
    '--card-foreground': fg,
    '--popover': `${h} ${Math.round(sat * 0.9)}% 7.5%`,
    '--popover-foreground': fg,
    '--secondary': `${h} ${Math.round(sat * 0.7)}% 13%`,
    '--secondary-foreground': fg,
    '--muted': `${h} ${Math.round(sat * 0.6)}% 12%`,
    '--muted-foreground': `${h} 12% 62%`,
    '--border': `${h} ${Math.round(sat * 0.6)}% 16%`,
    '--input': `${h} ${Math.round(sat * 0.6)}% 16%`,
    '--sidebar-background': `${h} ${sat}% 6%`,
    '--sidebar-foreground': `${h} 15% 92%`,
    '--sidebar-accent': `${h} ${Math.round(sat * 0.8)}% 12%`,
    '--sidebar-accent-foreground': `${h} 15% 95%`,
    '--sidebar-border': `${h} ${Math.round(sat * 0.7)}% 13%`,
  }
}
