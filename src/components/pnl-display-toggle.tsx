import { useSettings } from '@/contexts/settings-context'
import { usePnlDisplay } from '@/hooks/use-pnl-display'
import { SegmentedControl } from '@/components/ui/segmented-control'

// Money / percent switcher for P&L displays. Shares the outline variant with
// DashboardPeriodPills so the two controls read as one family.
export function PnlDisplayToggle({ className, itemClassName }: { className?: string; itemClassName?: string }) {
  const { mode, setMode } = usePnlDisplay()
  const { getCurrencySymbol } = useSettings()

  return (
    <SegmentedControl
      variant="outline"
      value={mode}
      onChange={setMode}
      className={className}
      itemClassName={itemClassName}
      aria-label="P&L display mode"
      options={[
        { value: 'currency', label: getCurrencySymbol(), title: 'Show P&L as money' },
        { value: 'percent', label: '%', title: 'Show P&L as percent of account balance' },
      ]}
    />
  )
}
