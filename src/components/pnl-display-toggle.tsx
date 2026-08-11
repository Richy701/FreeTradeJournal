import { useSettings } from '@/contexts/settings-context'
import { usePnlDisplay } from '@/hooks/use-pnl-display'

// Money / percent switcher for P&L displays. Styled after DashboardPeriodPills
// so the two controls read as one family.
export function PnlDisplayToggle() {
  const { mode, setMode } = usePnlDisplay()
  const { getCurrencySymbol } = useSettings()

  const segment = (active: boolean) =>
    `px-3 py-1.5 rounded-md border text-xs font-medium ${
      active
        ? 'bg-muted border-border/60 text-foreground shadow-sm'
        : 'border-transparent text-muted-foreground hover:text-foreground'
    }`

  return (
    <div className="flex items-center rounded-lg border border-border/60 bg-muted/30 p-0.5" role="group" aria-label="P&L display mode">
      <button
        onClick={() => setMode('currency')}
        className={segment(mode === 'currency')}
        aria-pressed={mode === 'currency'}
        title="Show P&L as money"
      >
        {getCurrencySymbol()}
      </button>
      <button
        onClick={() => setMode('percent')}
        className={segment(mode === 'percent')}
        aria-pressed={mode === 'percent'}
        title="Show P&L as percent of account balance"
      >
        %
      </button>
    </div>
  )
}
