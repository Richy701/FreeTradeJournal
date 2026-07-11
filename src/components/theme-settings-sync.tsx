import { useEffect, useRef } from 'react';
import { useThemePresets, DEFAULT_CUSTOM_COLORS } from '@/contexts/theme-presets';
import { useSettings } from '@/contexts/settings-context';

// Bridges the theme system (own localStorage keys, applied pre-paint) and the
// synced `settings` blob so a Pro user's color theme follows them across
// devices. ThemePresetsProvider sits above SettingsProvider in the tree, so
// this runs as a child component instead of inside either provider.
//
// Conflict rules: on mount the synced value wins (a fresh device adopts the
// cloud theme); after mount the user's action wins (changes push to settings).
export function ThemeSettingsSync() {
  const { currentTheme, setTheme, customColors, setCustomColors } = useThemePresets();
  const { settings, updateSettings, loading } = useSettings();
  const mountedRef = useRef(false);

  // Pull: apply a theme arriving from settings (initial load or sync pull).
  useEffect(() => {
    if (loading) return;
    const synced = settings.theme;
    if (!synced) return;
    if (synced.preset && synced.preset !== currentTheme) setTheme(synced.preset);
    if (synced.custom && JSON.stringify(synced.custom) !== JSON.stringify(customColors)) {
      setCustomColors(synced.custom);
    }
    // Intentionally NOT keyed on currentTheme/customColors: this effect only
    // reacts to the synced value changing, never to local edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.theme, loading]);

  // Push: mirror local theme changes into settings so they sync.
  useEffect(() => {
    if (loading) return;
    // Skip the mount run: pushing here would race the initial pull and let a
    // stale local default clobber the synced theme (markSettingsDirty makes
    // local edits authoritative). Only genuine changes after mount push.
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    const synced = settings.theme;
    const isUntouchedDefault =
      currentTheme === 'default' &&
      JSON.stringify(customColors) === JSON.stringify(DEFAULT_CUSTOM_COLORS);
    if (!synced && isUntouchedDefault) return;
    if (
      synced &&
      synced.preset === currentTheme &&
      JSON.stringify(synced.custom ?? null) === JSON.stringify(customColors)
    ) return;
    updateSettings({ theme: { preset: currentTheme, custom: customColors } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTheme, customColors, loading]);

  return null;
}
