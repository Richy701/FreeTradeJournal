import type { Icon } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
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
  const { period, setPeriod, allowedPeriods } = useDashboardPeriod()

  const widest = allowedPeriods.includes('all') ? 'all' : '30d'
  const filtered = Boolean(hasDataOutsidePeriod) && period !== widest

  return (
    <div className="flex min-h-44 h-full w-full flex-col items-center justify-center text-center px-6 py-6 gap-3">
      <div className="text-muted-foreground">
        <IconComponent className="h-6 w-6"  aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">
          {filtered ? 'No trades in this period' : title}
        </p>
        <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
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
