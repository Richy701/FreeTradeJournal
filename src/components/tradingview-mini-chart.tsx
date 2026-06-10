import { useEffect, useRef, memo } from 'react'
import { useIsDarkTheme } from '@/hooks/use-is-dark-theme'

const TV_SYMBOL_MAP: Record<string, string> = {
  'EURUSD': 'FX:EURUSD', 'GBPUSD': 'FX:GBPUSD', 'USDJPY': 'FX:USDJPY',
  'USDCHF': 'FX:USDCHF', 'AUDUSD': 'FX:AUDUSD', 'USDCAD': 'FX:USDCAD',
  'NZDUSD': 'FX:NZDUSD', 'EURJPY': 'FX:EURJPY', 'GBPJPY': 'FX:GBPJPY',
  'EURGBP': 'FX:EURGBP', 'EURAUD': 'FX:EURAUD', 'EURNZD': 'FX:EURNZD',
  'EURCHF': 'FX:EURCHF', 'GBPAUD': 'FX:GBPAUD', 'GBPCAD': 'FX:GBPCAD',
  'GBPCHF': 'FX:GBPCHF', 'GBPNZD': 'FX:GBPNZD', 'AUDJPY': 'FX:AUDJPY',
  'NZDJPY': 'FX:NZDJPY', 'CADJPY': 'FX:CADJPY', 'CHFJPY': 'FX:CHFJPY',
  'AUDCAD': 'FX:AUDCAD', 'AUDNZD': 'FX:AUDNZD',
  'ES': 'CME_MINI:ES1!', 'NQ': 'CME_MINI:NQ1!', 'YM': 'CBOT_MINI:YM1!',
  'RTY': 'CME_MINI:RTY1!', 'CL': 'NYMEX:CL1!', 'GC': 'COMEX:GC1!',
  'SI': 'COMEX:SI1!', 'ZB': 'CBOT:ZB1!', 'ZN': 'CBOT:ZN1!', 'ZF': 'CBOT:ZF1!',
  'SPX500': 'FOREXCOM:SPXUSD', 'NAS100': 'FOREXCOM:NSXUSD',
  'US30': 'FOREXCOM:DJI', 'GER40': 'PEPPERSTONE:GER40',
  'UK100': 'FOREXCOM:UKXGBP', 'JPN225': 'TVC:NI225', 'AUS200': 'PEPPERSTONE:AUS200',
}

interface TradingViewMiniChartProps {
  symbol: string
  width?: string | number
  height?: number
}

export const TradingViewMiniChart = memo(function TradingViewMiniChart({
  symbol,
  width = '100%',
  height = 220,
}: TradingViewMiniChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isDark = useIsDarkTheme()

  const tvSymbol = TV_SYMBOL_MAP[symbol] || symbol
  const theme = isDark ? 'dark' : 'light'

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.innerHTML = ''

    const widgetDiv = document.createElement('div')
    widgetDiv.className = 'tradingview-widget-container__widget'
    container.appendChild(widgetDiv)

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js'
    script.async = true
    script.textContent = JSON.stringify({
      symbol: tvSymbol,
      width: typeof width === 'number' ? String(width) : width,
      height: String(height),
      locale: 'en',
      dateRange: '1M',
      colorTheme: theme,
      isTransparent: true,
      autosize: typeof width === 'string' && width === '100%',
      largeChartUrl: '',
      noTimeScale: false,
    })
    container.appendChild(script)

    return () => { container.innerHTML = '' }
  }, [tvSymbol, width, height, theme])

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container rounded-lg overflow-hidden"
      style={{ width: typeof width === 'number' ? `${width}px` : width, height: `${height}px` }}
    />
  )
})
