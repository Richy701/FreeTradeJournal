import type { Icon } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { useThemePresets } from '@/contexts/theme-presets'
import { useDashboardPeriod } from '@/contexts/dashboard-period'

interface ChartEmptyStateProps {
  icon: Icon
  title: string
  description: string
  // True when the account has trades but none fall inside the selected
  // dashboard period — shows a "widen the range" action instead of
  // telling someone with 150 trades to start trading.
  hasDataOutsidePeriod?: boolean
}

export function ChartEmptyState({ icon: IconComponent, title, description, hasDataOutsidePeriod }: ChartEmptyStateProps) {
  const { themeColors, alpha } = useThemePresets()
  const { period, setPeriod, allowedPeriods } = useDashboardPeriod()

  const widest = allowedPeriods.includes('all') ? 'all' : '30d'
  const filtered = Boolean(hasDataOutsidePeriod) && period !== widest

  return (
    <div className="flex h-full flex-col items-center justify-center text-center px-6 gap-3">
      <div className="p-3 rounded-xl" style={{ backgroundColor: alpha(themeColors.primary, '12') }}>
        <IconComponent className="h-6 w-6" style={{ color: themeColors.primary }} aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">
          {filtered ? 'No trades in this period' : title}
        </p>
        <p className="text-xs text-muted-foreground max-w-[260px]">
          {filtered ? 'Nothing closed in the selected range.' : description}
        </p>
      </div>
      {filtered && (
        <Button variant="outline" size="sm" onClick={() => setPeriod(widest)}>
          {widest === 'all' ? 'Show all trades' : 'Show last 30 days'}
        </Button>
      )}
    </div>
  )
}
