import { lazy, Suspense, type ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { DataTable } from '@/components/data-table'
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
    render: () => (
      <Suspense fallback={null}>
        <MarketTicker />
      </Suspense>
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
          cta="Try free for 14 days"
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

// Pure layout resolver — crash-proof against stale/missing ids.
// Only configurable widgets honour the user's saved order/visibility. The
// non-configurable contextual nudges (upsells, demo prompt) always render
// (each self-gates inside its render) and stay pinned after the content.
export function resolveDashboardLayout(
  saved: { hidden: string[]; order: string[] } | undefined
): DashboardWidget[] {
  const configurable = DASHBOARD_WIDGETS.filter(w => w.configurable !== false)
  const cfgById = new Map(configurable.map(w => [w.id, w]))
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
