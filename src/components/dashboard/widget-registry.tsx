import { lazy, Suspense, type ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { DataTable } from '@/components/data-table'
import { DashboardPeriodPills } from '@/components/dashboard/period-pills'
import { PnlDisplayToggle } from '@/components/pnl-display-toggle'
import { CalendarHeatmap } from '@/components/calendar-heatmap'
import { TradingCoach } from '@/components/trading-coach'
import { DemoCtaCard } from '@/components/demo-cta-card'
import { ProUpgradeCard } from '@/components/pro-upgrade-card'
import { Brain, CloudArrowUp } from '@phosphor-icons/react'

const MarketTicker = lazy(() => import('@/components/market-ticker').then(m => ({ default: m.MarketTicker })))
const SectionCards = lazy(() => import('@/components/section-cards').then(m => ({ default: m.SectionCards })))
const ChartAreaInteractive = lazy(() => import('@/components/chart-area-interactive').then(m => ({ default: m.ChartAreaInteractive })))
const ChartRadarDefault = lazy(() => import('@/components/chart-radar-default').then(m => ({ default: m.ChartRadarDefault })))
const EconomicCalendarWidget = lazy(() => import('@/components/economic-calendar-widget').then(m => ({ default: m.EconomicCalendarWidget })))
const MarketNewsFeed = lazy(() => import('@/components/market-news-feed').then(m => ({ default: m.MarketNewsFeed })))
const MarketSessions = lazy(() => import('@/components/market-sessions').then(m => ({ default: m.MarketSessions })))
const ChartHoursSessions = lazy(() => import('@/components/chart-hours-sessions').then(m => ({ default: m.ChartHoursSessions })))

export interface WidgetRenderCtx {
  tradeCount: number
  isDemo: boolean
}

export interface DashboardWidget {
  id: string
  label: string
  removable: boolean
  // Contextual nudges (upsells, demo prompt) are part of the render flow but are
  // NOT user-configurable, so they never appear in the Customize panel. Defaults to true.
  configurable?: boolean
  render: (ctx: WidgetRenderCtx) => ReactNode
}

export const DASHBOARD_WIDGETS: DashboardWidget[] = [
  {
    id: 'market-prices',
    label: 'Market prices',
    removable: true,
    // Period pills share this row (ticker left, pills right) so they don't
    // float alone; Dashboard renders a standalone fallback when this widget
    // is hidden.
    render: ({ tradeCount }) => (
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
        <div className="min-w-0 flex-1">
          <Suspense fallback={null}>
            <MarketTicker />
          </Suspense>
        </div>
        {tradeCount > 0 && (
          <div className="flex justify-end gap-2 lg:shrink-0">
            <DashboardPeriodPills />
            <PnlDisplayToggle />
          </div>
        )}
      </div>
    ),
  },
  {
    id: 'metrics',
    label: 'Key metrics',
    removable: false,
    render: () => (
      <Suspense fallback={<div className="grid gap-4 sm:gap-6 lg:grid-cols-2 2xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>}>
        <SectionCards />
      </Suspense>
    ),
  },
  {
    id: 'coach',
    label: 'Coach FTJ',
    removable: true,
    render: () => <TradingCoach />,
  },
  {
    id: 'equity',
    label: 'Equity curve',
    removable: true,
    render: () => (
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <ChartAreaInteractive />
      </Suspense>
    ),
  },
  {
    id: 'pro-ai',
    label: 'AI insights upsell',
    removable: true,
    configurable: false,
    render: ({ tradeCount }) =>
      tradeCount >= 5 ? (
        <ProUpgradeCard
          icon={Brain}
          title={`You have ${tradeCount} trades — unlock AI insights`}
          description="Pro's AI coach analyses your patterns, detects weaknesses, and gives you a personalised action plan to improve."
          cta="Upgrade to Pro"
          dismissKey="dashboard-ai"
        />
      ) : null,
  },
  {
    id: 'market-row',
    label: 'Market info',
    removable: true,
    render: () => (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Suspense fallback={<Skeleton className="h-40 w-full" />}>
          <EconomicCalendarWidget />
        </Suspense>
        <Suspense fallback={<Skeleton className="h-40 w-full" />}>
          <MarketNewsFeed />
        </Suspense>
      </div>
    ),
  },
  {
    id: 'sessions',
    label: 'Market sessions',
    removable: true,
    render: () => (
      <Suspense fallback={<Skeleton className="h-32 w-full" />}>
        <MarketSessions />
      </Suspense>
    ),
  },
  {
    id: 'recent-trades',
    label: 'Recent trades',
    removable: true,
    render: () => <DataTable />,
  },
  {
    id: 'radar',
    label: 'Pairs performance',
    removable: true,
    render: () => (
      <Suspense fallback={<Skeleton className="h-[450px] w-full" />}>
        <ChartRadarDefault />
      </Suspense>
    ),
  },
  {
    id: 'hours-sessions',
    label: 'Time of day & sessions',
    removable: true,
    render: () => (
      <Suspense fallback={<Skeleton className="h-[450px] w-full" />}>
        <ChartHoursSessions />
      </Suspense>
    ),
  },
  {
    id: 'calendar',
    label: 'Trading calendar',
    removable: true,
    render: () => <CalendarHeatmap />,
  },
  {
    id: 'pro-sync',
    label: 'Cloud sync upsell',
    removable: true,
    configurable: false,
    render: ({ tradeCount }) =>
      tradeCount >= 10 ? (
        <ProUpgradeCard
          icon={CloudArrowUp}
          title="Your trades live only in this browser"
          description="Switch device or clear data and it's gone. Pro syncs your journal across all devices automatically."
          cta="Enable cloud sync"
          dismissKey="dashboard-sync"
        />
      ) : null,
  },
  {
    id: 'demo-cta',
    label: 'Demo sign-up prompt',
    removable: false,
    configurable: false,
    render: ({ isDemo }) => (isDemo ? <DemoCtaCard /> : null),
  },
]

// Configurable widgets only — contextual nudges (upsells, demo prompt) are never
// user-orderable. Shared by the Customize sheet and the on-dashboard rearrange mode.
export const CONFIGURABLE_WIDGETS = DASHBOARD_WIDGETS.filter(w => w.configurable !== false)
const CONFIGURABLE_BY_ID = new Map(CONFIGURABLE_WIDGETS.map(w => [w.id, w]))

// Full ordered id list (visible + hidden) over configurable widgets, de-staled.
// Reordering must be written against this list, not just the visible ones, or a
// hidden widget loses its slot the first time you drag something on the dashboard.
export function deriveOrderedWidgetIds(savedOrder: string[] = []): string[] {
  const ord = savedOrder.filter(id => CONFIGURABLE_BY_ID.has(id))
  const seen = new Set(ord)
  for (const w of CONFIGURABLE_WIDGETS) if (!seen.has(w.id)) ord.push(w.id)
  return ord
}

// Pure layout resolver — crash-proof against stale/missing ids.
// Only configurable widgets honour the user's saved order/visibility. The
// non-configurable contextual nudges (upsells, demo prompt) always render
// (each self-gates inside its render) and stay pinned after the content.
export function resolveDashboardLayout(
  saved: { hidden: string[]; order: string[] } | undefined
): DashboardWidget[] {
  const configurable = CONFIGURABLE_WIDGETS
  const cfgById = CONFIGURABLE_BY_ID
  const order = saved?.order ?? []
  const hidden = new Set(saved?.hidden ?? [])
  // 1) saved order, keep only configurable ids that still exist
  const ordered = order.filter(id => cfgById.has(id)).map(id => cfgById.get(id)!)
  // 2) append any configurable widgets not in saved order (new widgets default-visible)
  const seen = new Set(ordered.map(w => w.id))
  for (const w of configurable) if (!seen.has(w.id)) ordered.push(w)
  // 3) drop hidden, but NEVER drop removable:false (safety net)
  const visible = ordered.filter(w => w.removable === false || !hidden.has(w.id))
  // 4) pin the non-configurable nudges after the content, in registry order
  const nonConfigurable = DASHBOARD_WIDGETS.filter(w => w.configurable === false)
  return [...visible, ...nonConfigurable]
}
