import { useMemo } from 'react'
import { useThemePresets } from '@/contexts/theme-presets'
import { useDemoData } from '@/hooks/use-demo-data'
import { useMarketData } from '@/hooks/use-market-data'
import { useMacroData } from '@/hooks/use-macro-data'
import { useSettings } from '@/contexts/settings-context'
import { useUserStorage } from '@/utils/user-storage'
import { resolveDisplaySymbol } from '@/services/market-data'
import type { MacroIndicator } from '@/services/macro-data'
import { MARKET_DATA_ENABLED } from '@/config/market-data'
import { TrendUp, TrendDown } from '@phosphor-icons/react'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'

function formatMacro(ind: MacroIndicator): string {
  const sign = ind.unit === 'pp' && ind.value > 0 ? '+' : ''
  return `${sign}${ind.value.toFixed(2)}%`
}

// Macro direction is shown neutrally — for these series "up" is not inherently
// good or bad, so we avoid the profit/loss coloring used for price changes.
function MacroArrow({ change, up, down }: { change: number; up: string; down: string }) {
  if (Math.abs(change) < 0.005) return null
  return change > 0
    ? <TrendUp className="h-3 w-3" weight="bold" style={{ color: up }} />
    : <TrendDown className="h-3 w-3" weight="bold" style={{ color: down }} />
}

// Same outline Badge as the dashboard stat chips, so both rows read as one system.
const PILL = 'gap-1.5 rounded-md px-2.5 py-1 text-sm font-normal text-muted-foreground'

const MARKET_DEFAULTS: Record<string, string[]> = {
  forex:   ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'NZDUSD'],
  futures: ['ES', 'NQ', 'GC', 'CL', 'YM', 'SI'],
  indices: ['SPX', 'NDX', 'DJI', 'VIX', 'RUT', 'DAX'],
}
const MIXED_DEFAULTS = ['EURUSD', 'GBPUSD', 'USDJPY', 'GC', 'ES', 'NQ']
const MAX_SYMBOLS = 6

export function MarketTicker() {
  const { themeColors } = useThemePresets()
  const { getTrades } = useDemoData()
  const userStorage = useUserStorage()
  const { settings } = useSettings()

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

  const { quotes, isLoading, error } = useMarketData(settings.showMarketPrices ? topSymbols : [])
  const { indicators } = useMacroData(settings.showMacroSnapshot)

  // An empty marker lets the dashboard hide this widget's row entirely.
  if (!MARKET_DATA_ENABLED) return <span data-widget-empty hidden />

  if (isLoading && quotes.length === 0 && indicators.length === 0) {
    return (
      <div className="flex items-center gap-2 py-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-32 rounded-lg" />
        ))}
      </div>
    )
  }

  if (quotes.length === 0 && indicators.length === 0) {
    // A fetch failure shouldn't silently collapse the strip — say why it's empty.
    if (error) {
      return (
        <p className="py-1 text-[11px] text-muted-foreground">
          Market data is temporarily unavailable.
        </p>
      )
    }
    return <span data-widget-empty hidden />
  }

  return (
    // Wraps onto extra lines rather than scrolling sideways (this row has the full width now).
    <div className="flex flex-wrap items-stretch gap-1.5 py-1">
      {quotes.map((q) => {
        const isUp = q.change >= 0
        const color = isUp ? themeColors.profit : themeColors.loss
        return (
          <Badge key={q.symbol} variant="outline" className={PILL}>
            <span className="uppercase tracking-wide">{q.symbol}</span>
            {!q.isProxy && (
              <span className="font-semibold tabular-nums text-foreground">
                {q.price < 10
                  ? q.price.toFixed(4)
                  : q.price < 1000
                    ? q.price.toFixed(2)
                    : q.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}
              </span>
            )}
            <span className="flex items-center gap-0.5 font-semibold tabular-nums" style={{ color }}>
              {isUp ? <TrendUp className="h-3 w-3" weight="bold" /> : <TrendDown className="h-3 w-3" weight="bold" />}
              {isUp ? '+' : ''}
              {q.changePercent.toFixed(2)}%
            </span>
          </Badge>
        )
      })}

      {indicators.map((ind) => (
        <Badge key={ind.id} variant="outline" className={PILL} title={`As of ${ind.date}`}>
          <span className="uppercase tracking-wide">{ind.label}</span>
          <span className="font-semibold tabular-nums text-foreground">{formatMacro(ind)}</span>
          <MacroArrow change={ind.change} up={themeColors.profit} down={themeColors.loss} />
        </Badge>
      ))}
    </div>
  )
}
