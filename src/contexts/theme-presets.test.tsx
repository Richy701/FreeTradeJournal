// @vitest-environment jsdom
// Light-mode theme colors: no automatic darkening (it turned golds and
// yellows mustard/brown on white). Light mode shows each theme's real colors
// unless a preset declares an explicit light override.
import { describe, it, expect } from 'vitest';
import { computeThemeVars, DEFAULT_CUSTOM_COLORS } from './theme-presets';
import { hslStringToHex, hexToHslString } from '@/lib/theme-vars';

const lightHex = (preset: string, key: '--profit' | '--loss' | '--primary') =>
  hslStringToHex(computeThemeVars(preset, DEFAULT_CUSTOM_COLORS, 'light')[key]);

// Vars are stored as rounded "h s% l%" strings, so compare via the same round trip
const roundTrip = (hex: string) => hslStringToHex(hexToHslString(hex));

describe('light-mode theme colors', () => {
  it('keeps bright theme colors as-is in light mode', () => {
    // These were auto-darkened to mustard/brown before; they now match dark mode
    expect(lightHex('rose', '--profit')).toBe(roundTrip('#f59e0b'));
    expect(lightHex('sunset', '--profit')).toBe(roundTrip('#eab308'));
    expect(lightHex('sage', '--profit')).toBe(roundTrip('#84cc16'));
    expect(lightHex('clean', '--profit')).toBe(roundTrip('#2ecc71'));
    // Hand-set darker light-mode golds removed too
    expect(lightHex('navy', '--profit')).toBe(roundTrip('#fbbf24'));
    expect(lightHex('monochrome', '--profit')).toBe(roundTrip('#FFC000'));
    expect(lightHex('crimson', '--profit')).toBe(roundTrip('#fcd34d'));
    // Every other preset's light-mode colors match its dark-mode ones
    expect(lightHex('ice', '--profit')).toBe(roundTrip('#67e8f9'));
    expect(lightHex('forest', '--profit')).toBe(roundTrip('#34d399'));
    expect(lightHex('terminal', '--profit')).toBe(roundTrip('#4ade80'));
    expect(lightHex('midnight', '--loss')).toBe(roundTrip('#fb7185'));
    const navyLight = computeThemeVars('navy', DEFAULT_CUSTOM_COLORS, 'light');
    const navyDark = computeThemeVars('navy', DEFAULT_CUSTOM_COLORS, 'dark');
    expect(navyLight['--primary']).toBe(navyDark['--primary']);
  });

  it('leaves established mid-tone colors untouched', () => {
    // Default green/red/blue keep their long-standing light-mode look
    expect(lightHex('default', '--profit')).toBe(roundTrip('#10b981'));
    expect(lightHex('default', '--loss')).toBe(roundTrip('#ef4444'));
    expect(lightHex('default', '--primary')).toBe(roundTrip('#3b82f6'));
  });

  it('never darkens user-picked custom colors in light mode', () => {
    // A custom gold (2.17:1 on white) used to be darkened twice to brown
    const custom = { ...DEFAULT_CUSTOM_COLORS, profit: '#e9a23b', primary: '#e9a23b', loss: '#fcd34d' };
    const vars = computeThemeVars('custom', custom, 'light');
    expect(hslStringToHex(vars['--profit'])).toBe(roundTrip('#e9a23b'));
    expect(hslStringToHex(vars['--primary'])).toBe(roundTrip('#e9a23b'));
    expect(hslStringToHex(vars['--loss'])).toBe(roundTrip('#fcd34d'));
  });

  it('respects explicit light overrides as design choices', () => {
    // Deep Yellow's grey loss and Mono's blacks are the theme, not a bug
    expect(lightHex('monochrome', '--loss')).toBe(roundTrip('#374151'));
    expect(lightHex('energy', '--profit')).toBe(roundTrip('#000000'));
  });
});
