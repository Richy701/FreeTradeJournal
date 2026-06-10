import { useState } from 'react'
import { useThemePresets } from '@/contexts/theme-presets'
import { useMarketNews, useSymbolNews } from '@/hooks/use-market-news'
import { Newspaper, ArrowSquareOut, Globe, CurrencyDollar, Lightning } from '@phosphor-icons/react'
import { Skeleton } from '@/components/ui/skeleton'
import type { NewsItem } from '@/services/market-news'
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

function isLikelyLogo(url: string): boolean {
  const lower = url.toLowerCase()
  return lower.includes('logo') || lower.includes('favicon') || lower.includes('icon')
    || lower.includes('brand') || lower.includes('default') || lower.includes('placeholder')
}

function NewsCard({ item, alpha, themeColors, isLast }: {
  item: NewsItem
  alpha: (color: string, opacity: string) => string
  themeColors: any
  isLast: boolean
}) {
  const [imgState, setImgState] = useState<'loading' | 'good' | 'hidden'>(() =>
    item.image && !isLikelyLogo(item.image) ? 'loading' : 'hidden'
  )

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50 ${
        !isLast ? 'border-b border-border/50' : ''
      }`}
    >
      {imgState !== 'hidden' && (
        <div className="shrink-0 w-20 h-14 rounded-lg overflow-hidden bg-muted">
          <img
            src={item.image}
            alt=""
            className={`w-full h-full object-cover ${imgState === 'loading' ? 'opacity-0' : 'opacity-100'} transition-opacity`}
            loading="lazy"
            onLoad={(e) => {
              const img = e.currentTarget
              if (img.naturalWidth < 200 || img.naturalHeight < 100 || img.naturalWidth === img.naturalHeight) {
                setImgState('hidden')
              } else {
                setImgState('good')
              }
            }}
            onError={() => setImgState('hidden')}
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground leading-snug line-clamp-2 group-hover:underline">
          {item.headline}
        </p>
        <div className="flex items-center gap-1.5 mt-1.5">
          <span
            className="text-[10px] font-semibold"
            style={{ color: themeColors.primary }}
          >
            {item.source}
          </span>
          <span className="text-[10px] text-muted-foreground/50 select-none">·</span>
          <span className="text-[10px] text-muted-foreground">{formatAge(item.datetime)}</span>
        </div>
      </div>
      <ArrowSquareOut
        className="h-3.5 w-3.5 shrink-0 mt-0.5 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors"
      />
    </a>
  )
}

const CATEGORIES = [
  { key: 'general' as const, label: 'General', icon: Globe },
  { key: 'forex' as const, label: 'Forex', icon: CurrencyDollar },
  { key: 'crypto' as const, label: 'Crypto', icon: Lightning },
]

interface MarketNewsFeedProps {
  symbol?: string | null
  title?: string
  maxItems?: number
}

export function MarketNewsFeed({ symbol, title, maxItems = 5 }: MarketNewsFeedProps) {
  const { themeColors, alpha } = useThemePresets()
  const [category, setCategory] = useState<'general' | 'forex' | 'crypto'>('general')
  const [showCount, setShowCount] = useState(maxItems)

  const symbolResult = useSymbolNews(symbol ?? null)
  const generalResult = useMarketNews(symbol ? 'general' : category)

  const { news, isLoading } = symbol ? symbolResult : generalResult
  const displayTitle = title || (symbol ? `${symbol} News` : 'Market News')

  if (!MARKET_DATA_ENABLED) return null

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card/50 p-4 space-y-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
      </div>
    )
  }

  if (news.length === 0) return null

  return (
    <div className="rounded-xl border bg-card/50">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Newspaper className="h-4 w-4" style={{ color: themeColors.primary }} />
            <span className="text-sm font-semibold text-foreground">{displayTitle}</span>
          </div>
          <span className="text-[11px] text-muted-foreground">{news.length} articles</span>
        </div>

        {/* Category tabs — segmented control */}
        {!symbol && (
          <div className="flex gap-0.5 rounded-lg bg-muted p-1">
            {CATEGORIES.map(cat => {
              const isActive = category === cat.key
              const Icon = cat.icon
              return (
                <button
                  key={cat.key}
                  onClick={() => { setCategory(cat.key); setShowCount(maxItems) }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors"
                  style={isActive ? {
                    backgroundColor: alpha(themeColors.primary, '12'),
                    color: themeColors.primary,
                  } : {
                    color: 'hsl(var(--muted-foreground))',
                  }}
                >
                  <Icon className="h-3 w-3" weight={isActive ? 'bold' : 'regular'} />
                  {cat.label}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Scrollable news list */}
      <div className="relative">
        <div className="max-h-[420px] overflow-y-auto modern-scrollbar">
          {news.slice(0, showCount).map((item, i) => (
            <NewsCard
              key={item.id}
              item={item}
              alpha={alpha}
              themeColors={themeColors}
              isLast={i === Math.min(showCount, news.length) - 1}
            />
          ))}
          {showCount < news.length && (
            <button
              onClick={() => setShowCount(c => c + 5)}
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
