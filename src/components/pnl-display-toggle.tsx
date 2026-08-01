import { useSettings } from '@/contexts/settings-context'
import { usePnlDisplay } from '@/hooks/use-pnl-display'

// Money / percent switcher for P&L displays. Styled after DashboardPeriodPills
// so the two controls read as one family.
export function PnlDisplayToggle() {
  const { mode, setMode } = usePnlDisplay()
  const { getCurrencySymbol } = useSettings()

  return (
    <div className="flex items-center bg-muted/50 rounded-lg p-0.5" role="group" aria-label="P&L display mode">
      <button
        onClick={() => setMode('currency')}
        className={`px-3 py-1.5 rounded-md text-xs font-medium ${
          mode === 'currency'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        aria-pressed={mode === 'currency'}
        title="Show P&L as money"
      >
        {getCurrencySymbol()}
      </button>
      <button
        onClick={() => setMode('percent')}
        className={`px-3 py-1.5 rounded-md text-xs font-medium ${
          mode === 'percent'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        aria-pressed={mode === 'percent'}
        title="Show P&L as percent of account balance"
      >
        %
      </button>
    </div>
  )
}
