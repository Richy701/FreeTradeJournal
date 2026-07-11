import { useMemo } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Moon, Sun, Warning, ArrowCounterClockwise } from '@phosphor-icons/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useThemePresets, computeThemeVars, type CustomThemeConfig } from '@/contexts/theme-presets';
import { contrastRatio, hslStringToHex } from '@/lib/theme-vars';

// Advanced controls for the Custom theme (Pro "Theme Studio"): separate
// dark-mode colors, surface tints that generate a full theme, and corner
// style — with a live light/dark preview and contrast warnings. The basic
// three color pickers above this stay free; this only edits the optional
// fields of CustomThemeConfig.

// App-default surfaces used in previews when no surface tint is set
export const PREVIEW_DEFAULTS: Record<'light' | 'dark', Record<string, string>> = {
  light: {
    '--background': '40 20% 97%',
    '--card': '0 0% 100%',
    '--foreground': '30 10% 8%',
    '--muted-foreground': '35 8% 40%',
    '--border': '40 12% 87%',
    '--radius': '0.85rem',
  },
  dark: {
    '--background': '0 0% 1.2%',
    '--card': '0 0% 3.5%',
    '--foreground': '210 40% 98%',
    '--muted-foreground': '35 8% 55%',
    '--border': '35 10% 16%',
    '--radius': '0.85rem',
  },
};

const RADIUS_OPTIONS = [
  { label: 'Sharp', value: 0.3 },
  { label: 'Compact', value: 0.6 },
  { label: 'Default', value: undefined },
  { label: 'Soft', value: 1.1 },
] as const;

function ColorSwatchPicker({
  label,
  value,
  placeholder,
  onChange,
  onClear,
}: {
  label: string;
  value?: string;
  // Shown (and used as the swatch) when no explicit value is set
  placeholder: string;
  onChange: (hex: string) => void;
  onClear?: () => void;
}) {
  const effective = value ?? placeholder;
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-1.5">
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2.5 flex-1 min-w-0 rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="h-5 w-5 rounded-md border shrink-0" style={{ backgroundColor: effective }} />
              <span className={`text-xs text-muted-foreground flex-1 text-left truncate ${value ? 'uppercase' : ''}`}>
                {value ?? 'Same as base'}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3 space-y-3" align="start">
            <HexColorPicker color={effective} onChange={onChange} />
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md border shrink-0" style={{ backgroundColor: effective }} />
              <Input
                value={effective}
                maxLength={7}
                className="h-8 font-mono text-sm uppercase"
                onChange={(e) => {
                  let v = e.target.value;
                  if (!v.startsWith('#')) v = '#' + v;
                  if (/^#[0-9a-fA-F]{0,6}$/.test(v) && v.length === 7) onChange(v.toLowerCase());
                }}
              />
            </div>
          </PopoverContent>
        </Popover>
        {value && onClear && (
          <button
            type="button"
            onClick={onClear}
            aria-label={`Reset ${label}`}
            className="p-2 rounded-lg border border-border/40 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
          >
            <ArrowCounterClockwise className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}

// Mini stat-card mock rendered entirely from a computed variable set — shared
// by the Theme Studio's live preview and the full-theme cards in the Settings
// picker, so every theme previews in the same visual language.
export function ThemeMiniPreview({
  vars,
  fallback,
  style,
}: {
  vars: Record<string, string>;
  // Surface values to use when the variable set doesn't define them (custom
  // themes without a surface tint fall back to the app defaults)
  fallback?: Record<string, string>;
  // Extra styles merged onto the root (e.g. a selection ring in the picker)
  style?: React.CSSProperties;
}) {
  const v = (key: string, def = '0 0% 50%') => vars[key] ?? fallback?.[key] ?? def;
  const hsl = (key: string, def?: string) => `hsl(${v(key, def)})`;
  const radius = v('--radius', '0.85rem');
  const primary = hslStringToHex(v('--primary'));
  const profit = hslStringToHex(v('--profit'));
  const loss = hslStringToHex(v('--loss'));

  return (
    <div
      className="border overflow-hidden p-2.5 space-y-2 transition-shadow"
      style={{ backgroundColor: hsl('--background'), borderColor: hsl('--border'), borderRadius: radius, ...style }}
    >
      <div
        className="border p-2 space-y-1"
        style={{ backgroundColor: hsl('--card'), borderColor: hsl('--border'), borderRadius: `calc(${radius} - 2px)` }}
      >
        <p className="text-[9px]" style={{ color: hsl('--muted-foreground') }}>Today's P&amp;L</p>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs font-bold tabular-nums" style={{ color: profit }}>+$1,240.50</span>
          <span className="text-[10px] font-medium tabular-nums" style={{ color: loss }}>-$318.20</span>
        </div>
        <svg viewBox="0 0 96 20" preserveAspectRatio="none" className="w-full h-4" aria-hidden="true">
          <path
            d="M0 16 L14 12 L28 14 L42 7 L56 9 L70 4 L84 6 L96 2"
            fill="none"
            stroke={primary}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div className="flex items-center gap-1.5">
        <span
          className="px-2 py-1 text-[9px] font-semibold"
          style={{
            backgroundColor: primary,
            color: hsl('--primary-foreground', '0 0% 100%'),
            borderRadius: `calc(${radius} - 2px)`,
          }}
        >
          Add Trade
        </span>
        <span
          className="px-2 py-1 text-[9px] font-medium border"
          style={{ color: hsl('--foreground'), borderColor: hsl('--border'), borderRadius: `calc(${radius} - 2px)` }}
        >
          Import
        </span>
      </div>
    </div>
  );
}

function ThemePreviewPanel({
  mode,
  vars,
}: {
  mode: 'light' | 'dark';
  vars: Record<string, string>;
}) {
  const ModeIcon = mode === 'dark' ? Moon : Sun;
  return (
    <div className="flex-1 min-w-0 space-y-1.5">
      <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        <ModeIcon className="h-3 w-3" aria-hidden="true" /> {mode}
      </p>
      <ThemeMiniPreview vars={vars} fallback={PREVIEW_DEFAULTS[mode]} />
    </div>
  );
}

export function ThemeStudio() {
  const { customColors, setCustomColors } = useThemePresets();

  const previews = useMemo(() => ({
    light: computeThemeVars('custom', customColors, 'light'),
    dark: computeThemeVars('custom', customColors, 'dark'),
  }), [customColors]);

  // Effective data colors per mode for the preview + warnings
  const modeColors = (mode: 'light' | 'dark') => ({
    primary: hslStringToHex(previews[mode]['--primary']),
    profit: hslStringToHex(previews[mode]['--profit']),
    loss: hslStringToHex(previews[mode]['--loss']),
  });

  const warnings = useMemo(() => {
    const found: string[] = [];
    (['light', 'dark'] as const).forEach((mode) => {
      const bg = hslStringToHex(previews[mode]['--background'] ?? PREVIEW_DEFAULTS[mode]['--background']);
      const colors = modeColors(mode);
      (['profit', 'loss', 'primary'] as const).forEach((key) => {
        if (contrastRatio(colors[key], bg) < 2.2) {
          const label = key === 'primary' ? 'Accent' : key === 'profit' ? 'Profit' : 'Loss';
          found.push(`${label} is hard to read on the ${mode} background`);
        }
      });
    });
    return found;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previews]);

  const setDarkColor = (key: 'primary' | 'profit' | 'loss', hex?: string) => {
    const dark = { ...customColors.dark };
    if (hex) dark[key] = hex;
    else delete dark[key];
    setCustomColors({ dark: Object.keys(dark).length ? dark : undefined });
  };

  const patch = (updates: Partial<CustomThemeConfig>) => setCustomColors(updates);

  return (
    <div className="space-y-5">
      {/* Dark mode color variants */}
      <div className="space-y-3">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dark mode colors</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Use different shades when the app is in dark mode — brighter tones usually read better on dark surfaces.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {([
            { key: 'primary' as const, label: 'Accent (dark)' },
            { key: 'profit' as const, label: 'Profit (dark)' },
            { key: 'loss' as const, label: 'Loss (dark)' },
          ]).map(({ key, label }) => (
            <ColorSwatchPicker
              key={key}
              label={label}
              value={customColors.dark?.[key]}
              placeholder={customColors[key]}
              onChange={(hex) => setDarkColor(key, hex)}
              onClear={() => setDarkColor(key, undefined)}
            />
          ))}
        </div>
      </div>

      {/* Surface tints */}
      <div className="space-y-3">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Surfaces</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tint the backgrounds, cards, and sidebar to build a complete theme — like Wine or Navy Gold, but yours.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ColorSwatchPicker
            label="Light mode surface"
            value={customColors.surfaceLight}
            placeholder="#f5f4f0"
            onChange={(hex) => patch({ surfaceLight: hex })}
            onClear={() => patch({ surfaceLight: undefined })}
          />
          <ColorSwatchPicker
            label="Dark mode surface"
            value={customColors.surfaceDark}
            placeholder="#0a0a0a"
            onChange={(hex) => patch({ surfaceDark: hex })}
            onClear={() => patch({ surfaceDark: undefined })}
          />
        </div>
      </div>

      {/* Corner style */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Corner style</p>
        <div className="flex flex-wrap gap-2">
          {RADIUS_OPTIONS.map(({ label, value }) => {
            const isActive = customColors.radius === value || (value === undefined && customColors.radius === undefined);
            return (
              <button
                key={label}
                type="button"
                onClick={() => patch({ radius: value })}
                aria-pressed={isActive}
                className={`px-3 py-2 text-xs border transition-all ${
                  isActive
                    ? 'font-semibold border-primary/60 bg-primary/10 text-foreground'
                    : 'border-border/40 text-muted-foreground hover:border-border hover:bg-muted/40'
                }`}
                style={{ borderRadius: `${value ?? 0.85}rem` }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Live preview */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Preview</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <ThemePreviewPanel mode="light" vars={previews.light} />
          <ThemePreviewPanel mode="dark" vars={previews.dark} />
        </div>
        {warnings.length > 0 && (
          <div className="space-y-1 pt-1">
            {warnings.map((warning) => (
              <p key={warning} className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                <Warning className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {warning}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
