import { Link } from 'react-router-dom'
import { Palette, Sun, Moon, Monitor, Check, ArrowRight } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useTheme } from '@/components/theme-provider'
import { useThemePresets, computeThemeVars } from '@/contexts/theme-presets'

const MODES = [
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
  { value: 'system', label: 'System', Icon: Monitor },
] as const

// Top-bar shortcut to the same mode + palette choices as Settings > Appearance.
// Theme Studio and the full previews stay in Settings, linked at the bottom.
export function ThemeQuickPicker({ className = 'h-9 w-9' }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const { currentTheme, setTheme: setColorTheme, availableThemes, customColors } = useThemePresets()
  const mode: 'light' | 'dark' = theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme

  const entries = Object.entries(availableThemes)
  const accents = entries.filter(([key, preset]) => !preset.cssOverrides && key !== 'custom')
  const full = entries.filter(([, preset]) => !!preset.cssOverrides)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Theme"
          className={`${className} bg-background/10 hover:bg-background/20 border border-border/20 text-foreground hover:text-foreground`}
        >
          <Palette className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[19rem] p-0">
        <div className="space-y-4 p-4">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Mode</p>
            <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Mode">
              {MODES.map(({ value, label, Icon }) => {
                const active = theme === value
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTheme(value)}
                    aria-pressed={active}
                    className={`flex items-center justify-center gap-1.5 rounded-md border px-2 py-1.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      active ? 'border-primary/40 bg-primary/10 font-semibold text-foreground' : 'border-border/60 text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    }`}
                  >
                    <Icon aria-hidden="true" className={`h-3.5 w-3.5 ${active ? 'text-primary' : ''}`} />
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Accent colors</p>
            <div className="grid grid-cols-4 gap-1.5">
              {[...accents, ['custom', { name: 'Custom', colors: customColors }] as const].map(([key, preset]) => {
                const active = currentTheme === key
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setColorTheme(key)}
                    aria-pressed={active}
                    title={preset.name}
                    className={`group flex min-w-0 flex-col items-center gap-1 rounded-md border p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      active ? 'border-foreground' : 'border-transparent hover:bg-muted/50'
                    }`}
                  >
                    <span className="flex -space-x-1" aria-hidden="true">
                      {[preset.colors.primary, preset.colors.profit, preset.colors.loss].map((c, i) => (
                        <span key={i} className="h-3.5 w-3.5 rounded-full border border-black/10" style={{ backgroundColor: c }} />
                      ))}
                    </span>
                    <span className={`w-full truncate text-center text-[10px] ${active ? 'font-semibold text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>
                      {preset.name}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Full themes</p>
            <div className="grid grid-cols-3 gap-1.5">
              {full.map(([key, preset]) => {
                const active = currentTheme === key
                const v = computeThemeVars(key, customColors, mode)
                const hsl = (name: string, fallback: string) => (v[name] ? `hsl(${v[name]})` : fallback)
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setColorTheme(key)}
                    aria-pressed={active}
                    className={`group flex min-w-0 flex-col gap-1 rounded-md border p-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      active ? 'border-foreground' : 'border-transparent hover:bg-muted/50'
                    }`}
                  >
                    <span className="flex h-7 overflow-hidden rounded border border-border/60" aria-hidden="true">
                      <span className="w-1/3" style={{ backgroundColor: hsl('--sidebar-background', 'transparent') }} />
                      <span className="flex flex-1 items-center justify-center" style={{ backgroundColor: hsl('--background', 'transparent') }}>
                        <span className="h-2 w-5 rounded-sm" style={{ backgroundColor: preset.colors.primary }} />
                      </span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className={`truncate text-[10px] ${active ? 'font-semibold text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>
                        {preset.name}
                      </span>
                      {active && <Check className="ml-auto h-3 w-3 shrink-0" aria-hidden="true" />}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
        <Link
          to="/settings?tab=appearance"
          className="flex items-center justify-between border-t border-border/60 px-4 py-2.5 text-xs text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
        >
          More in Settings
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </PopoverContent>
    </Popover>
  )
}
