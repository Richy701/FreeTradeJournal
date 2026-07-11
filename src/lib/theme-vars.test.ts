import { describe, it, expect } from 'vitest'
import {
  hexToHslString,
  hslStringToHex,
  contrastRatio,
  contrastText,
  deriveChartVars,
  deriveSurfaceVars,
} from './theme-vars'
import { computeThemeVars, DEFAULT_CUSTOM_COLORS } from '@/contexts/theme-presets'

describe('color conversions', () => {
  it('converts hex to HSL triplet strings', () => {
    expect(hexToHslString('#ffffff')).toBe('0 0% 100%')
    expect(hexToHslString('#000000')).toBe('0 0% 0%')
    expect(hexToHslString('#10b981')).toBe('160 84% 39%') // emerald-500
    expect(hexToHslString('#ef4444')).toBe('0 84% 60%') // red-500
  })

  it('round-trips HSL strings back to hex within rounding error', () => {
    for (const hex of ['#10b981', '#ef4444', '#3b82f6', '#f59e0b']) {
      const roundTripped = hslStringToHex(hexToHslString(hex))
      // Channel drift from % rounding should stay tiny
      const drift = [1, 3, 5].map(i =>
        Math.abs(parseInt(hex.slice(i, i + 2), 16) - parseInt(roundTripped.slice(i, i + 2), 16))
      )
      expect(Math.max(...drift)).toBeLessThanOrEqual(4)
    }
  })

  it('computes WCAG contrast ratios', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0)
    expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 1)
    // Order should not matter
    expect(contrastRatio('#10b981', '#0a0a0a')).toBeCloseTo(contrastRatio('#0a0a0a', '#10b981'), 5)
  })

  it('picks readable button text for light and dark fills', () => {
    expect(contrastText('#ffc000')).toBe('#000000')
    expect(contrastText('#1e3a8a')).toBe('#ffffff')
  })
})

describe('deriveChartVars', () => {
  it('produces all five chart variables anchored to the theme colors', () => {
    const vars = deriveChartVars('#3b82f6', '#10b981', '#ef4444', true)
    expect(Object.keys(vars).sort()).toEqual(['--chart-1', '--chart-2', '--chart-3', '--chart-4', '--chart-5'])
    expect(vars['--chart-1']).toBe(hexToHslString('#3b82f6'))
    expect(vars['--chart-2']).toBe(hexToHslString('#10b981'))
    expect(vars['--chart-3']).toBe(hexToHslString('#ef4444'))
  })
})

describe('deriveSurfaceVars', () => {
  it('generates light surfaces with a light background and dark text', () => {
    const vars = deriveSurfaceVars('#dbe7f0', 'light')
    expect(vars['--background']).toMatch(/9[0-9](\.5)?%$/)
    expect(vars['--foreground']).toMatch(/8%$/)
    expect(vars['--sidebar-background']).toBeDefined()
  })

  it('generates dark surfaces with a near-black background and light text', () => {
    const vars = deriveSurfaceVars('#1d2b4a', 'dark')
    expect(vars['--background']).toMatch(/4\.5%$/)
    expect(vars['--foreground']).toMatch(/97%$/)
  })

  it('caps saturation so vivid tints still give usable surfaces', () => {
    const vars = deriveSurfaceVars('#ff0000', 'dark') // 100% saturation pick
    const sat = parseInt(vars['--background'].split(' ')[1], 10)
    expect(sat).toBeLessThanOrEqual(50)
  })
})

describe('computeThemeVars', () => {
  it('accent presets set primary/accent/ring plus data + chart variables', () => {
    const vars = computeThemeVars('ocean', DEFAULT_CUSTOM_COLORS, 'light')
    expect(vars['--primary']).toBe(hexToHslString('#0ea5e9'))
    expect(vars['--accent']).toBe(vars['--primary'])
    expect(vars['--ring']).toBe(vars['--primary'])
    expect(vars['--profit']).toBe(hexToHslString('#06b6d4'))
    expect(vars['--loss']).toBe(hexToHslString('#f97316'))
    expect(vars['--chart-1']).toBeDefined()
    expect(vars['--chart-5']).toBeDefined()
    // Accent presets must NOT touch surfaces
    expect(vars['--background']).toBeUndefined()
  })

  it('full themes keep their hand-tuned overrides including chart palettes', () => {
    const vars = computeThemeVars('forest', DEFAULT_CUSTOM_COLORS, 'dark')
    expect(vars['--background']).toBe('155 35% 4%')
    expect(vars['--chart-1']).toBe('160 84% 45%') // from cssOverrides, not derived
    expect(vars['--profit']).toBeDefined()
    expect(vars['--loss']).toBeDefined()
  })

  it('per-mode preset colors replace the old dark-mode special cases', () => {
    const dark = computeThemeVars('energy', DEFAULT_CUSTOM_COLORS, 'dark')
    const light = computeThemeVars('energy', DEFAULT_CUSTOM_COLORS, 'light')
    expect(dark['--profit']).toBe(hexToHslString('#f1f5f9'))
    expect(light['--profit']).toBe(hexToHslString('#000000'))
  })

  it('custom theme honours Theme Studio fields: dark variants, surfaces, radius', () => {
    const custom = {
      ...DEFAULT_CUSTOM_COLORS,
      dark: { primary: '#a78bfa' },
      surfaceDark: '#1d2b4a',
      radius: 0.6,
    }
    const dark = computeThemeVars('custom', custom, 'dark')
    expect(dark['--primary']).toBe(hexToHslString('#a78bfa'))
    expect(dark['--background']).toBe(deriveSurfaceVars('#1d2b4a', 'dark')['--background'])
    expect(dark['--radius']).toBe('0.6rem')

    const light = computeThemeVars('custom', custom, 'light')
    expect(light['--primary']).toBe(hexToHslString(DEFAULT_CUSTOM_COLORS.primary))
    expect(light['--background']).toBeUndefined() // no light surface tint set
  })

  it('brightens dark custom picks in dark mode only when no explicit dark variant exists', () => {
    const dimPurple = { ...DEFAULT_CUSTOM_COLORS, primary: '#3b1d6e' }
    const adjusted = computeThemeVars('custom', dimPurple, 'dark')
    expect(adjusted['--primary']).not.toBe(hexToHslString('#3b1d6e'))

    const pinned = { ...dimPurple, dark: { primary: '#3b1d6e' } }
    const respected = computeThemeVars('custom', pinned, 'dark')
    expect(respected['--primary']).toBe(hexToHslString('#3b1d6e'))
  })
})
