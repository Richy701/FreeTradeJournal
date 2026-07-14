import { Link } from 'react-router-dom'
import { LockSimple } from '@phosphor-icons/react'
import { ALL_PERIODS, PERIOD_LABELS, useDashboardPeriod } from '@/contexts/dashboard-period'

// Period switcher for the dashboard analytics widgets. Locked ranges (free
// tier) link to pricing — the 30-day analytics window made visible.
export function DashboardPeriodPills() {
  const { period, setPeriod, allowedPeriods } = useDashboardPeriod()

  return (
    <div className="flex items-center bg-muted/50 rounded-lg p-0.5">
      {ALL_PERIODS.map((p) => {
        const locked = !allowedPeriods.includes(p)
        if (locked) {
          return (
            <Link
              key={p}
              to="/pricing"
              className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground/70 hover:text-foreground"
              title="Longer ranges are a Pro feature"
            >
              <LockSimple className="h-3 w-3" />
              {PERIOD_LABELS[p]}
            </Link>
          )
        }
        return (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium ${
              period === p
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            aria-pressed={period === p}
          >
            {PERIOD_LABELS[p]}
          </button>
        )
      })}
    </div>
  )
}
