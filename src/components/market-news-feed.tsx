import { useState } from 'react'
import { useThemePresets } from '@/contexts/theme-presets'
import { useMarketFeed, useSymbolNews } from '@/hooks/use-market-news'
import { Newspaper, CurrencyDollar, ChartLineUp } from '@phosphor-icons/react'
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
function FeedPost({ item, primary, isLast }: {
  item: NewsItem
  primary: string
  isLast: boolean
}) {
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
  { key: 'markets' as const, label: 'Markets', icon: ChartLineUp },
]

interface MarketNewsFeedProps {
  symbol?: string | null
  title?: string
  maxItems?: number
}

export function MarketNewsFeed({ symbol, title, maxItems = 6 }: MarketNewsFeedProps) {
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
      <div className="rounded-xl border bg-card/50 p-4 space-y-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-40" />
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    )
  }

  if (news.length === 0) {
    // A fetch failure shouldn't silently remove the card — say why it's empty.
    if (error) {
      return (
        <div className="rounded-xl border bg-card/50 p-4">
          <p className="text-sm text-muted-foreground">News is temporarily unavailable.</p>
        </div>
      )
    }
    // Symbol mode has no tabs to switch to, so an empty result hides the card.
    // Tab mode keeps the card so the tabs stay reachable.
    if (symbol) return null
  }

  return (
    <div className="rounded-xl border bg-card/50">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Newspaper className="h-4 w-4" style={{ color: themeColors.primary }} />
            <span className="text-sm font-semibold text-foreground">{displayTitle}</span>
          </div>
          {!symbol && (
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
      </div>

      {/* Scrollable post list */}
      <div className="relative border-t border-border/50">
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
              isLast={i === Math.min(showCount, news.length) - 1}
            />
          ))}
          {showCount < news.length && (
            <button
              onClick={() => setShowCount(c => c + 6)}
              className="w-full py-2.5 text-[11px] font-medium transition-colors hover:bg-muted/50"
              style={{ color: themeColors.primary }}
            >
              Show more
            </button>
          )}
        </div>

        {/* Bottom fade gradient to hint at scrollability */}
        {news.slice(0, showCount).length > 5 && showCount >= news.length && (
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card/80 to-transparent pointer-events-none rounded-b-xl" />
        )}
      </div>
    </div>
  )
}
