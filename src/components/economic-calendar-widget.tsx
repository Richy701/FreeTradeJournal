import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useEffect, useRef, useState } from 'react'
import { useIsDarkTheme } from '@/hooks/use-is-dark-theme'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CalendarBlank, ArrowUpRight } from '@phosphor-icons/react'

// Economic calendar via TradingView's free embed widget. No API key required —
// Finnhub's /calendar/economic endpoint is premium-only and 403s on the free tier.
export function EconomicCalendarWidget() {
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
    <Card className="overflow-hidden shadow-none">
      <CardHeader className="gap-3 space-y-0 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <CalendarBlank className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            Economic Calendar
          </CardTitle>
          <Button asChild variant="ghost" size="sm" className="h-8 shrink-0 gap-1 px-2 text-xs">
            <a href="https://www.tradingview.com/economic-calendar/" target="_blank" rel="noopener noreferrer" aria-label="Open full economic calendar on TradingView">
              <span className="hidden sm:inline">Full calendar</span><ArrowUpRight className="h-4 w-4" />
            </a>
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Showing</span>
          <Badge variant="secondary" className="rounded-md font-normal">Medium impact</Badge>
          <Badge variant="secondary" className="rounded-md font-normal">High impact</Badge>
        </div>
      </CardHeader>
      <CardContent className="border-t p-0 sm:p-0">
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
      </CardContent>
    </Card>
  )
}
