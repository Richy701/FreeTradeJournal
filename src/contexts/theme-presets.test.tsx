// @vitest-environment jsdom
// Light-mode readability: theme data colors tuned for dark surfaces (gold,
// pale cyan, lime) washed out to grey on white screens. resolveModeColors now
// darkens badly low-contrast colors in light mode (mirroring the dark-mode
// brighten safety net) unless a preset declares an explicit light override.
import { describe, it, expect } from 'vitest';
import { computeThemeVars, DEFAULT_CUSTOM_COLORS } from './theme-presets';
import { contrastRatio, hslStringToHex, hexToHslString } from '@/lib/theme-vars';

const lightHex = (preset: string, key: '--profit' | '--loss' | '--primary') =>
  hslStringToHex(computeThemeVars(preset, DEFAULT_CUSTOM_COLORS, 'light')[key]);

// Vars are stored as rounded "h s% l%" strings, so compare via the same round trip
const roundTrip = (hex: string) => hslStringToHex(hexToHslString(hex));

describe('light-mode theme colors', () => {
  it('darkens pale data colors to at least ~3:1 on white', () => {
    // Worst offenders before the fix (1.4–2.2:1 on white)
    const cases: [string, '--profit' | '--loss' | '--primary'][] = [
      ['monochrome', '--profit'],
      ['ice', '--profit'],
      ['ice', '--loss'],
      ['crimson', '--profit'],
      ['sunset', '--profit'],
      ['sage', '--profit'],
      ['rose', '--profit'],
    ];
    for (const [preset, key] of cases) {
      const hex = lightHex(preset, key);
      // HSL round-tripping loses ~1 unit of precision, hence 2.9 not 3
      expect(contrastRatio(hex, '#ffffff'), `${preset} ${key} (${hex})`)
        .toBeGreaterThanOrEqual(2.9);
    }
  });

  it('leaves established mid-tone colors untouched', () => {
    // Default green/red/blue keep their long-standing light-mode look
    expect(lightHex('default', '--profit')).toBe(roundTrip('#10b981'));
    expect(lightHex('default', '--loss')).toBe(roundTrip('#ef4444'));
    expect(lightHex('default', '--primary')).toBe(roundTrip('#3b82f6'));
  });

  it('respects explicit light overrides as design choices', () => {
    // Deep Yellow's grey loss and Mono's blacks are the theme, not a bug
    expect(lightHex('monochrome', '--loss')).toBe(roundTrip('#374151'));
    expect(lightHex('energy', '--profit')).toBe(roundTrip('#000000'));
  });
});
