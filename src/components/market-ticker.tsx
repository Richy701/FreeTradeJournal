import { useMemo } from 'react'
import { useThemePresets } from '@/contexts/theme-presets'
import { useDemoData } from '@/hooks/use-demo-data'
import { useMarketData } from '@/hooks/use-market-data'
import { useUserStorage } from '@/utils/user-storage'
import { resolveDisplaySymbol } from '@/services/market-data'
import { MARKET_DATA_ENABLED } from '@/config/market-data'
import { TrendUp, TrendDown } from '@phosphor-icons/react'
import { Skeleton } from '@/components/ui/skeleton'

const MARKET_DEFAULTS: Record<string, string[]> = {
  forex:   ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'NZDUSD'],
  futures: ['ES', 'NQ', 'GC', 'CL', 'YM', 'SI'],
  indices: ['SPX', 'NDX', 'DJI', 'VIX', 'RUT', 'DAX'],
}
const MIXED_DEFAULTS = ['EURUSD', 'GBPUSD', 'USDJPY', 'GC', 'ES', 'NQ']
const MAX_SYMBOLS = 6

export function MarketTicker() {
  const { themeColors, alpha } = useThemePresets()
  const { getTrades } = useDemoData()
  const userStorage = useUserStorage()

  const topSymbols = useMemo(() => {
    const trades = getTrades()

    // Determine which market defaults to use
    let defaults = MIXED_DEFAULTS

    if (trades && trades.length > 0) {
      // Derive primary market from trade history
      const marketCounts: Record<string, number> = {}
      for (const t of trades) {
        const m = (t as any).market
        if (m) marketCounts[m] = (marketCounts[m] || 0) + 1
      }
      const primary = Object.entries(marketCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
      if (primary && MARKET_DEFAULTS[primary]) {
        defaults = MARKET_DEFAULTS[primary]
      }
    } else {
      // No trades -- check stored preference
      const stored = userStorage.getItem('preferredMarket')
      if (stored && MARKET_DEFAULTS[stored]) {
        defaults = MARKET_DEFAULTS[stored]
      }
      return defaults
    }

    // Build symbol list from most-traded symbols, padded with market-specific defaults
    const freq: Record<string, number> = {}
    for (const t of trades!) {
      const sym = (t as any).symbol
      if (sym) freq[sym] = (freq[sym] || 0) + 1
    }

    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1])

    const seen = new Set<string>()
    const fromTrades: string[] = []
    for (const [symbol] of sorted) {
      const display = resolveDisplaySymbol(symbol)
      if (!seen.has(display) && fromTrades.length < MAX_SYMBOLS) {
        seen.add(display)
        fromTrades.push(symbol)
      }
    }

    if (fromTrades.length < MAX_SYMBOLS) {
      for (const sym of defaults) {
        const display = resolveDisplaySymbol(sym)
        if (!seen.has(display) && fromTrades.length < MAX_SYMBOLS) {
          seen.add(display)
          fromTrades.push(sym)
        }
      }
    }

    return fromTrades
  }, [getTrades, userStorage])

  const { quotes, isLoading } = useMarketData(topSymbols)

  if (!MARKET_DATA_ENABLED) return null

  if (isLoading && quotes.length === 0) {
    return (
      <div className="flex items-center gap-4 py-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-5 w-28 rounded" />
        ))}
      </div>
    )
  }

  if (quotes.length === 0) return null

  return (
    <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1">
      {quotes.map((q) => {
        const isUp = q.change >= 0
        const color = isUp ? themeColors.profit : themeColors.loss

        return (
          <div
            key={q.symbol}
            className="shrink-0 flex items-center gap-2 px-2.5 py-1 rounded-md transition-colors hover:bg-muted/50"
          >
            <span className="text-[11px] font-medium text-muted-foreground tracking-wide">
              {q.symbol}
            </span>
            {!q.isProxy && (
              <span className="text-[11px] font-semibold text-foreground tabular-nums font-mono">
                {q.price < 10
                  ? q.price.toFixed(4)
                  : q.price < 1000
                    ? q.price.toFixed(2)
                    : q.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}
              </span>
            )}
            <span
              className="flex items-center gap-0.5 text-[11px] font-semibold tabular-nums font-mono px-1.5 py-0.5 rounded"
              style={{
                color,
                backgroundColor: alpha(color, '10'),
              }}
            >
              {isUp ? (
                <TrendUp className="h-3 w-3" weight="bold" />
              ) : (
                <TrendDown className="h-3 w-3" weight="bold" />
              )}
              {isUp ? '+' : ''}
              {q.changePercent.toFixed(2)}%
            </span>
          </div>
        )
      })}
    </div>
  )
}
