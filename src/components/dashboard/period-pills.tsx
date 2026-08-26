import { Link } from 'react-router-dom'
import { trackGateHit } from '@/lib/track-activity'
import { LockSimple } from '@phosphor-icons/react'
import { ALL_PERIODS, PERIOD_LABELS, useDashboardPeriod } from '@/contexts/dashboard-period'
import { segmentedItemClass, segmentedRootClass } from '@/components/ui/segmented-control'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

// Period switcher for the dashboard analytics widgets. Locked ranges (free
// tier) link to pricing — the 30-day analytics window made visible.
export function DashboardPeriodPills() {
  const { period, setPeriod, allowedPeriods } = useDashboardPeriod()

  return (
    <TooltipProvider delayDuration={300}>
    <div className={segmentedRootClass('outline')} role="group" aria-label="Analytics period">
      {ALL_PERIODS.map((p) => {
        const locked = !allowedPeriods.includes(p)
        if (locked) {
          return (
            <Tooltip key={p}>
              <TooltipTrigger asChild>
                <Link
                  to="/pricing"
                  className={segmentedItemClass(false, 'outline', 'flex items-center gap-1 text-muted-foreground/70')}
                  onClick={() => trackGateHit('period_pills', { period: p })}
                >
                  <LockSimple className="h-3 w-3" />
                  {PERIOD_LABELS[p]}
                </Link>
              </TooltipTrigger>
              <TooltipContent>Longer ranges are a Pro feature</TooltipContent>
            </Tooltip>
          )
        }
        return (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={segmentedItemClass(period === p, 'outline')}
            aria-pressed={period === p}
          >
            {PERIOD_LABELS[p]}
          </button>
        )
      })}
    </div>
    </TooltipProvider>
  )
}
