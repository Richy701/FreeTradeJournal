import { useEffect, useRef, useState } from 'react'
import { useThemePresets } from '@/contexts/theme-presets'
import { useIsDarkTheme } from '@/hooks/use-is-dark-theme'
import { CalendarBlank } from '@phosphor-icons/react'

// Economic calendar via TradingView's free embed widget. No API key required —
// Finnhub's /calendar/economic endpoint is premium-only and 403s on the free tier.
export function EconomicCalendarWidget() {
  const { themeColors } = useThemePresets()
  const containerRef = useRef<HTMLDivElement>(null)
  const isDark = useIsDarkTheme()
  const theme = isDark ? 'dark' : 'light'
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    setFailed(false)
    container.innerHTML = ''

    const widgetDiv = document.createElement('div')
    widgetDiv.className = 'tradingview-widget-container__widget'
    container.appendChild(widgetDiv)

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-events.js'
    script.async = true
    script.textContent = JSON.stringify({
      colorTheme: theme,
      isTransparent: false, // transparent lets the iframe's white doc bg show through → washed out
      width: '100%',
      height: '440',
      locale: 'en',
      importanceFilter: '0,1', // medium + high impact only
      countryFilter: 'us,eu,gb,jp,ch,au,ca,nz,cn',
    })
    // An ad/privacy blocker can block the embed script or its chunks. Show a
    // fallback rather than a blank box if it errors or never renders an iframe.
    script.onerror = () => setFailed(true)
    container.appendChild(script)

    const timer = window.setTimeout(() => {
      if (!container.querySelector('iframe')) setFailed(true)
    }, 6000)

    return () => {
      window.clearTimeout(timer)
      container.innerHTML = ''
    }
  }, [theme])

  return (
    <div className="rounded-xl border bg-card/50 overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <CalendarBlank className="h-4 w-4" style={{ color: themeColors.primary }} />
          <span className="text-sm font-semibold text-foreground">Economic Calendar</span>
        </div>
        <span className="text-[11px] text-muted-foreground">Medium &amp; high impact</span>
      </div>
      <div className="border-t border-border/50">
        <div className="relative" style={{ height: 440 }}>
          <div
            ref={containerRef}
            className="tradingview-widget-container"
            style={{ height: 440 }}
          />
          {failed && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-card/50 text-center px-4">
              <span className="text-sm text-muted-foreground">Economic calendar unavailable</span>
              <span className="text-xs text-muted-foreground">An ad or privacy blocker may be blocking TradingView.</span>
              <a
                href="https://www.tradingview.com/economic-calendar/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs underline text-muted-foreground hover:text-foreground mt-1"
              >
                Open on TradingView
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
