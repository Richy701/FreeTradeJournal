import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useState } from 'react'
import { useThemePresets } from '@/contexts/theme-presets'
import { useMarketFeed, useSymbolNews } from '@/hooks/use-market-news'
import { Newspaper, CurrencyDollar, ChartLineUp, ArrowUpRight } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import type { NewsItem, FeedTab } from '@/services/market-news'
import { MARKET_DATA_ENABLED } from '@/config/market-data'

function formatAge(timestamp: number): string {
  const diffMs = Date.now() - timestamp * 1000
  const mins = Math.floor(diffMs / (1000 * 60))
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return '1d ago'
  return `${days}d ago`
}

// Social-style post row: byline first, then the headline as the post body.
function FeedPost({ item, primary, isLast, dashboard = false }: {
  item: NewsItem
  primary: string
  isLast: boolean
  dashboard?: boolean
}) {
  if (dashboard) return (
    <a href={item.url} target="_blank" rel="noopener noreferrer"
      className={`group flex items-start gap-3 px-4 py-3.5 no-underline transition-colors hover:bg-muted/40 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-5 ${!isLast ? 'border-b border-border/50' : ''}`}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-relaxed text-foreground line-clamp-3">{item.headline}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
          <span className="font-medium">{item.source}</span>
          {item.author && item.author !== item.source && <span>{item.author}</span>}
          <span aria-hidden="true">·</span><span>{formatAge(item.datetime)}</span>
        </div>
      </div>
      <ArrowUpRight className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-foreground" aria-hidden="true" />
    </a>
  )
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group block px-4 py-3 transition-colors hover:bg-muted/50 ${
        !isLast ? 'border-b border-border/50' : ''
      }`}
    >
      <div className="flex items-baseline gap-1.5 min-w-0">
        <span className="text-[11px] font-semibold truncate" style={{ color: primary }}>
          {item.author || item.source}
        </span>
        {item.author && (
          <span className="text-[11px] text-muted-foreground shrink-0">{item.source}</span>
        )}
        <span className="text-[11px] text-muted-foreground shrink-0 select-none">·</span>
        <span className="text-[11px] text-muted-foreground shrink-0">{formatAge(item.datetime)}</span>
      </div>
      <p className="mt-1 text-[13px] text-foreground leading-snug line-clamp-3 group-hover:underline">
        {item.headline}
      </p>
    </a>
  )
}

const TABS = [
  { key: 'forex' as const, label: 'Forex', icon: CurrencyDollar },
  { key: 'markets' as const, label: 'Markets', icon: ChartLineUp, ArrowUpRight },
]

interface MarketNewsFeedProps {
  symbol?: string | null
  title?: string
  maxItems?: number
  dashboard?: boolean
}

export function MarketNewsFeed({ symbol, title, maxItems = 6, dashboard = false }: MarketNewsFeedProps) {
  const { themeColors, alpha } = useThemePresets()
  const [tab, setTab] = useState<FeedTab>('forex')
  const [showCount, setShowCount] = useState(maxItems)

  const symbolResult = useSymbolNews(symbol ?? null)
  const feedResult = useMarketFeed(tab)

  const { news, isLoading, error } = symbol ? symbolResult : feedResult
  const displayTitle = title || (symbol ? `${symbol} News` : 'Market Feed')

  if (!MARKET_DATA_ENABLED) return null

  if (isLoading) {
    return (
      <Card className="bg-card/50 shadow-none p-4 space-y-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-40" />
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full" />)}
      </Card>
    )
  }

  if (news.length === 0) {
    // A fetch failure shouldn't silently remove the card — say why it's empty.
    if (error) {
      return (
        <Card className="bg-card/50 shadow-none p-4">
          <p className="text-sm text-muted-foreground">News is temporarily unavailable.</p>
        </Card>
      )
    }
    // Symbol mode has no tabs to switch to, so an empty result hides the card.
    // Tab mode keeps the card so the tabs stay reachable.
    if (symbol) return null
  }

  return (
    <Card className={dashboard ? "shadow-none overflow-hidden" : "bg-card/50 shadow-none"}>
      {/* Header */}
      <CardHeader className={dashboard ? "gap-3 space-y-0 p-4 sm:p-5" : "p-4 pb-2 sm:p-4 sm:pb-2 space-y-3"}>
        <div className={dashboard ? "flex flex-wrap items-center justify-between gap-3" : "flex items-center justify-between"}>
          <div className="flex items-center gap-2">
            <Newspaper className="h-4 w-4" style={{ color: themeColors.primary }} />
            <CardTitle className={dashboard ? "text-lg font-semibold" : "text-sm font-semibold"}>{displayTitle}</CardTitle>
          </div>
          {!symbol && !dashboard && (
            <div className="flex gap-0.5 rounded-lg bg-muted p-1">
              {TABS.map(t => {
                const isActive = tab === t.key
                const Icon = t.icon
                return (
                  <button
                    key={t.key}
                    onClick={() => { setTab(t.key); setShowCount(maxItems) }}
                    className="flex items-center justify-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-medium transition-colors"
                    style={isActive ? {
                      backgroundColor: alpha(themeColors.primary, '12'),
                      color: themeColors.primary,
                    } : {
                      color: 'hsl(var(--muted-foreground))',
                    }}
                  >
                    <Icon className="h-3 w-3" weight={isActive ? 'bold' : 'regular'} />
                    {t.label}
                  </button>
                )
              })}
            </div>
          )}
        </div>
        {dashboard && !symbol && (
          <Tabs value={tab} onValueChange={value => { setTab(value as FeedTab); setShowCount(maxItems) }}>
            <TabsList className="h-8">
              {TABS.map(({ key, label, icon: Icon }) => (
                <TabsTrigger key={key} value={key} className="gap-1.5 px-3 py-1 text-xs"><Icon className="h-3.5 w-3.5" />{label}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}
      </CardHeader>

      {/* Scrollable post list */}
      <CardContent className="relative border-t border-border/50 p-0 sm:p-0">
        <div className="max-h-[420px] overflow-y-auto modern-scrollbar">
          {news.length === 0 && (
            <p className="px-4 py-6 text-sm text-muted-foreground text-center">
              No posts in this feed right now.
            </p>
          )}
          {news.slice(0, showCount).map((item, i) => (
            <FeedPost
              key={item.id}
              item={item}
              primary={themeColors.primary}
              dashboard={dashboard}
              isLast={i === Math.min(showCount, news.length) - 1}
            />
          ))}
          {showCount < news.length && (dashboard ? (
            <div className="border-t px-4 py-2 sm:px-5">
              <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setShowCount(c => c + 6)}>Show more headlines</Button>
            </div>
          ) : (
            <button
              onClick={() => setShowCount(c => c + 6)}
              className="w-full py-2.5 text-[11px] font-medium transition-colors hover:bg-muted/50"
              style={{ color: themeColors.primary }}
            >
              Show more
            </button>
          ))}
        </div>

        {/* Bottom fade gradient to hint at scrollability */}
        {news.slice(0, showCount).length > 5 && showCount >= news.length && (
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card/80 to-transparent pointer-events-none rounded-b-xl" />
        )}
      </CardContent>
    </Card>
  )
}
