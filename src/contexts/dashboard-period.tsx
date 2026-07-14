import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { useSettings } from '@/contexts/settings-context'
import { useAuth } from '@/contexts/auth-context'
import { useProStatus } from '@/contexts/pro-context'

export type DashboardPeriod = '7d' | '30d' | '90d' | 'ytd' | 'all'

export const ALL_PERIODS: DashboardPeriod[] = ['7d', '30d', '90d', 'ytd', 'all']
// Free analytics are already capped to a trailing 30-day window server of
// truth: analytics-window.ts). Longer ranges are Pro, and the pills make that
// limit visible instead of silent.
export const FREE_PERIODS: DashboardPeriod[] = ['7d', '30d']

export const PERIOD_LABELS: Record<DashboardPeriod, string> = {
  '7d': '7D',
  '30d': '30D',
  '90d': '90D',
  ytd: 'YTD',
  all: 'All',
}

export function periodStart(period: DashboardPeriod, now: Date = new Date()): Date | null {
  switch (period) {
    case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    case '90d': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    case 'ytd': return new Date(now.getFullYear(), 0, 1)
    case 'all': return null
  }
}

export function filterTradesByPeriod(trades: any[], period: DashboardPeriod): any[] {
  const start = periodStart(period)
  if (!start) return trades
  return trades.filter((t: any) => new Date(t.exitTime) >= start)
}

interface DashboardPeriodContextType {
  period: DashboardPeriod
  setPeriod: (p: DashboardPeriod) => void
  allowedPeriods: DashboardPeriod[]
}

// Default keeps components usable outside the provider (and in tests):
// unfiltered, setter is a no-op, everything allowed.
const DashboardPeriodContext = createContext<DashboardPeriodContextType>({
  period: 'all',
  setPeriod: () => {},
  allowedPeriods: ALL_PERIODS,
})

export function useDashboardPeriod() {
  return useContext(DashboardPeriodContext)
}

export function DashboardPeriodProvider({ children }: { children: ReactNode }) {
  const { settings, updateSettings } = useSettings()
  const { isDemo } = useAuth()
  const { isPro, isLoading: isProLoading } = useProStatus()

  // While pro status resolves, err on the entitled side — same policy as
  // getAnalyticsTrades, so an entitled user never sees locked pills flash.
  const entitled = isPro || isProLoading
  const allowedPeriods = entitled ? ALL_PERIODS : FREE_PERIODS

  // Session choice wins; otherwise the persisted setting; otherwise the
  // widest range the tier allows (matches pre-feature behaviour).
  const [localPeriod, setLocalPeriod] = useState<DashboardPeriod | null>(null)
  const stored = settings.dashboardPeriod as DashboardPeriod | undefined
  let period = localPeriod ?? (stored && ALL_PERIODS.includes(stored) ? stored : entitled ? 'all' : '30d')
  if (!allowedPeriods.includes(period)) period = entitled ? 'all' : '30d'

  const setPeriod = useCallback((p: DashboardPeriod) => {
    setLocalPeriod(p)
    // Demo is read-only (updateSettings would toast a sign-up prompt), so the
    // choice stays session-local there.
    if (!isDemo) updateSettings({ dashboardPeriod: p })
  }, [isDemo, updateSettings])

  return (
    <DashboardPeriodContext.Provider value={{ period, setPeriod, allowedPeriods }}>
      {children}
    </DashboardPeriodContext.Provider>
  )
}
