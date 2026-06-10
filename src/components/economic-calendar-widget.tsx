import { useEffect, useRef, useState } from 'react'
import { useThemePresets } from '@/contexts/theme-presets'
import { CalendarBlank } from '@phosphor-icons/react'

// Economic calendar via TradingView's free embed widget. No API key required —
// Finnhub's /calendar/economic endpoint is premium-only and 403s on the free tier.
export function EconomicCalendarWidget() {
  const { themeColors } = useThemePresets()
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'))

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'))
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  const theme = isDark ? 'dark' : 'light'

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.innerHTML = ''

    const widgetDiv = document.createElement('div')
    widgetDiv.className = 'tradingview-widget-container__widget'
    container.appendChild(widgetDiv)

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-events.js'
    script.async = true
    script.textContent = JSON.stringify({
      colorTheme: theme,
      isTransparent: true,
      width: '100%',
      height: '440',
      locale: 'en',
      importanceFilter: '0,1', // medium + high impact only
      countryFilter: 'us,eu,gb,jp,ch,au,ca,nz,cn',
    })
    container.appendChild(script)

    return () => { container.innerHTML = '' }
  }, [theme])

  return (
    <div className="rounded-xl border bg-card/50 overflow-hidden">
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        <CalendarBlank className="h-4 w-4" style={{ color: themeColors.primary }} />
        <span className="text-sm font-semibold text-foreground">Economic Calendar</span>
      </div>
      <div className="px-2 pb-3">
        <div
          ref={containerRef}
          className="tradingview-widget-container"
          style={{ height: 440 }}
        />
      </div>
    </div>
  )
}
