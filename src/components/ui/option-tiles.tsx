import type { Icon } from '@phosphor-icons/react'
import { useThemePresets } from '@/contexts/theme-presets'
import { cn } from '@/lib/utils'

export interface TileOption<V extends string> {
  value: V
  label: string
  icon?: Icon
  /** Optional one-line plain-English description under the label. */
  description?: string
}

interface OptionTilesProps<V extends string> {
  options: Array<TileOption<V>>
  value: V | undefined
  onChange: (value: V) => void
  /** Tailwind grid classes controlling the tile layout. */
  columnsClassName?: string
  /** 'row' renders icon+label+description on one horizontal tile. */
  layout?: 'stacked' | 'row'
}

/**
 * Tap-to-select tiles for small option sets — replaces dropdowns where every
 * choice should be visible and one tap away (the Goals & Risk form pattern).
 */
export function OptionTiles<V extends string>({
  options,
  value,
  onChange,
  columnsClassName = 'grid-cols-2 sm:grid-cols-4',
  layout = 'stacked',
}: OptionTilesProps<V>) {
  const { themeColors, alpha } = useThemePresets()

  if (layout === 'row') {
    return (
      <div className="space-y-2">
        {options.map(opt => {
          const selected = value === opt.value
          const OptIcon = opt.icon
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(opt.value)}
              className="w-full rounded-lg border px-3 py-2.5 flex items-center gap-3 text-left transition-colors"
              style={selected
                ? { borderColor: themeColors.primary, backgroundColor: alpha(themeColors.primary, '08') }
                : { borderColor: 'hsl(var(--border))' }}
            >
              {OptIcon && (
                <OptIcon
                  className="h-4 w-4 shrink-0"
                  style={{ color: selected ? themeColors.primary : 'hsl(var(--muted-foreground))' }}
                />
              )}
              <span className="min-w-0">
                <span className="block text-sm font-medium" style={selected ? { color: themeColors.primary } : undefined}>
                  {opt.label}
                </span>
                {opt.description && (
                  <span className="block text-xs text-muted-foreground">{opt.description}</span>
                )}
              </span>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className={cn('grid gap-2', columnsClassName)}>
      {options.map(opt => {
        const selected = value === opt.value
        const OptIcon = opt.icon
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(opt.value)}
            className="rounded-lg border px-2 py-2.5 flex flex-col items-center gap-1.5 text-xs font-medium transition-colors"
            style={selected
              ? { borderColor: themeColors.primary, backgroundColor: alpha(themeColors.primary, '10'), color: themeColors.primary }
              : { borderColor: 'hsl(var(--border))' }}
          >
            {OptIcon && <OptIcon className="h-4 w-4" />}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

interface QuickChipsProps {
  chips: Array<{ value: number; label: string }>
  selectedValue?: number
  onSelect: (value: number) => void
}

/** Quick-pick value chips shown under an input (the Goals & Risk pattern). */
export function QuickChips({ chips, selectedValue, onSelect }: QuickChipsProps) {
  const { themeColors, alpha } = useThemePresets()
  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map(chip => {
        const selected = selectedValue === chip.value
        return (
          <button
            key={chip.label}
            type="button"
            onClick={() => onSelect(chip.value)}
            className="rounded-full border px-2.5 py-1 text-xs tabular-nums transition-colors"
            style={selected
              ? { borderColor: themeColors.primary, backgroundColor: alpha(themeColors.primary, '10'), color: themeColors.primary }
              : { borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}
          >
            {chip.label}
          </button>
        )
      })}
    </div>
  )
}
