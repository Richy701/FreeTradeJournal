import { useState } from 'react'
import { useThemePresets } from '@/contexts/theme-presets'
import { useUpcomingEvents } from '@/hooks/use-economic-calendar'
import { MARKET_DATA_ENABLED } from '@/config/market-data'
import { CalendarBlank, Lightning, Clock } from '@phosphor-icons/react'
import { Skeleton } from '@/components/ui/skeleton'

const CURRENCY_FILTERS = ['All', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF'] as const
type CurrencyFilter = typeof CURRENCY_FILTERS[number]

function parseEventTime(timeStr: string): Date {
  const cleaned = timeStr.includes('T') ? timeStr : timeStr.replace(' ', 'T') + 'Z'
  return new Date(cleaned)
}

function getTimeLabel(date: Date): string {
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()

  if (diffMs < 0) return 'Released'
  if (diffMs < 60 * 1000) return 'Imminent'

  const mins = Math.floor(diffMs / (1000 * 60))
  const hours = Math.floor(mins / 60)

  if (hours < 1) return `${mins}m`
  if (hours < 24) return `${hours}h ${mins % 60}m`

  const days = Math.floor(hours / 24)
  if (days === 1) return 'Tomorrow'
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function getDateGroup(date: Date): string {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const eventDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.round((eventDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays <= 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

const FLAG_MAP: Record<string, string> = {
  US: 'USD', CA: 'CAD', GB: 'GBP', EU: 'EUR', JP: 'JPY',
  AU: 'AUD', NZ: 'NZD', CH: 'CHF', CN: 'CNY', DE: 'EUR', FR: 'EUR',
}

interface EconomicEvent {
  country: string
  event: string
  impact: 'low' | 'medium' | 'high'
  time: string
  actual: string
  estimate: string
  previous: string
}

function EventRow({ event, alpha, themeColors }: {
  event: EconomicEvent
  alpha: (color: string, opacity: string) => string
  themeColors: any
}) {
  const currency = FLAG_MAP[event.country] || event.country
  const date = parseEventTime(event.time)
  const isPassed = date.getTime() < Date.now()
  const isImminent = !isPassed && (date.getTime() - Date.now()) < 30 * 60 * 1000
  const timeFormatted = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })

  const isHighImpact = event.impact === 'high' && !isPassed

  return (
    <div
      className={`flex items-center gap-0 rounded-lg px-3 py-2 transition-all ${
        isPassed ? 'opacity-50' : ''
      }`}
      style={isHighImpact ? {
        backgroundColor: alpha(themeColors.primary, '08'),
      } : isImminent ? {
        backgroundColor: alpha(themeColors.primary, '05'),
      } : undefined}
    >
      {/* Time — fixed width, monospace */}
      <div className="shrink-0 w-[72px]">
        <span className="text-[11px] font-mono text-muted-foreground tabular-nums">
          {timeFormatted}
        </span>
      </div>

      {/* Thin vertical separator */}
      <div className="shrink-0 w-px self-stretch bg-border/50 mx-2" />

      {/* Currency code — plain text, primary colored */}
      <div className="shrink-0 w-[38px]">
        <span
          className="text-[11px] font-semibold"
          style={{ color: themeColors.primary }}
        >
          {currency}
        </span>
      </div>

      {/* Event name + data */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-foreground truncate">
            {event.event}
          </span>
          {isImminent && (
            <span
              className="flex items-center gap-1 text-[10px] font-medium shrink-0 animate-pulse"
              style={{ color: themeColors.primary }}
            >
              <Clock className="h-3 w-3" weight="bold" />
              {getTimeLabel(date)}
            </span>
          )}
        </div>
        {/* Actual / Est / Prev inline */}
        {(event.actual || event.estimate || event.previous) && (
          <div className="flex items-center gap-3 mt-0.5">
            {event.actual && (
              <span className="text-[10px]">
                <span className="text-muted-foreground/60">Act </span>
                <span className="font-semibold text-foreground">{event.actual}</span>
              </span>
            )}
            {event.estimate && (
              <span className="text-[10px]">
                <span className="text-muted-foreground/60">Est </span>
                <span className="font-medium text-muted-foreground">{event.estimate}</span>
              </span>
            )}
            {event.previous && (
              <span className="text-[10px]">
                <span className="text-muted-foreground/60">Prev </span>
                <span className="font-medium text-muted-foreground">{event.previous}</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Impact label */}
      <div className="shrink-0 ml-2">
        {event.impact === 'high' ? (
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
            style={{ backgroundColor: alpha(themeColors.primary, '12'), color: themeColors.primary }}
          >
            {event.impact}
          </span>
        ) : (
          <span
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: event.impact === 'low' ? 'hsl(var(--muted-foreground))' : 'hsl(var(--secondary-foreground))' }}
          >
            {event.impact}
          </span>
        )}
      </div>

      {/* Countdown / Released */}
      <div className="shrink-0 w-[52px] text-right ml-2">
        {!isPassed && !isImminent && (
          <span className="text-[10px] text-muted-foreground font-mono tabular-nums">
            {getTimeLabel(date)}
          </span>
        )}
        {isPassed && (
          <span className="text-[10px] text-muted-foreground/50">
            Released
          </span>
        )}
      </div>
    </div>
  )
}

export function EconomicCalendarWidget() {
  const { themeColors, alpha } = useThemePresets()
  const { events, isLoading } = useUpcomingEvents(3)
  const [currencyFilter, setCurrencyFilter] = useState<CurrencyFilter>('All')
  const [highOnly, setHighOnly] = useState(false)

  if (!MARKET_DATA_ENABLED) return null

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card/50 p-4 space-y-3">
        <Skeleton className="h-5 w-40" />
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
      </div>
    )
  }

  const IMPACT_ORDER = { high: 0, medium: 1, low: 2 } as const
  const upcoming = events
    .filter(e => {
      try { return parseEventTime(e.time).getTime() > Date.now() - 2 * 60 * 60 * 1000 } catch { return false }
    })
    .filter(e => {
      if (currencyFilter !== 'All') {
        const currency = FLAG_MAP[e.country] || e.country
        if (currency !== currencyFilter) return false
      }
      if (highOnly && e.impact !== 'high') return false
      return true
    })
    .sort((a, b) => {
      const timeDiff = parseEventTime(a.time).getTime() - parseEventTime(b.time).getTime()
      if (Math.abs(timeDiff) > 5 * 60 * 1000) return timeDiff
      return IMPACT_ORDER[a.impact] - IMPACT_ORDER[b.impact]
    })

  const allEvents = events.filter(e => {
    try { return parseEventTime(e.time).getTime() > Date.now() - 2 * 60 * 60 * 1000 } catch { return false }
  })
  if (allEvents.length === 0) return null
  const highImpactCount = allEvents.filter(e => e.impact === 'high').length

  // Group by date
  const grouped = new Map<string, EconomicEvent[]>()
  for (const event of upcoming) {
    try {
      const group = getDateGroup(parseEventTime(event.time))
      if (!grouped.has(group)) grouped.set(group, [])
      grouped.get(group)!.push(event)
    } catch { /* skip bad dates */ }
  }

  return (
    <div className="rounded-xl border bg-card/50 relative">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <CalendarBlank className="h-4 w-4" style={{ color: themeColors.primary }} />
          <span className="text-sm font-semibold text-foreground">Economic Calendar</span>
        </div>
        <div className="flex items-center gap-2">
          {highImpactCount > 0 && (
            <span
              className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: alpha(themeColors.primary, '10'), color: themeColors.primary }}
            >
              <Lightning className="h-3 w-3" weight="fill" />
              {highImpactCount} high impact
            </span>
          )}
          <span className="text-[11px] text-muted-foreground">{upcoming.length} events</span>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 pb-2 flex flex-wrap items-center gap-2">
        <div className="flex gap-1 overflow-x-auto">
          {CURRENCY_FILTERS.map(c => (
            <button
              key={c}
              onClick={() => setCurrencyFilter(c)}
              className="text-[11px] font-medium px-2 py-1 rounded-md transition-colors whitespace-nowrap"
              style={currencyFilter === c
                ? { backgroundColor: alpha(themeColors.primary, '12'), color: themeColors.primary }
                : { color: 'hsl(var(--muted-foreground))' }
              }
            >
              {c}
            </button>
          ))}
        </div>
        <button
          onClick={() => setHighOnly(h => !h)}
          className="text-[11px] font-medium px-2 py-1 rounded-md transition-colors flex items-center gap-1 ml-auto"
          style={highOnly
            ? { backgroundColor: alpha(themeColors.primary, '12'), color: themeColors.primary }
            : { color: 'hsl(var(--muted-foreground))' }
          }
        >
          <Lightning className="h-3 w-3" weight={highOnly ? 'fill' : 'regular'} />
          High only
        </button>
      </div>

      {/* Scrollable event list */}
      <div className="px-2 pb-4 max-h-[420px] overflow-y-auto scrollbar-thin">
        {upcoming.length === 0 && (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">No events match your filters</p>
          </div>
        )}
        {[...grouped.entries()].map(([group, groupEvents]) => (
          <div key={group}>
            <div className="px-3 py-1.5 sticky top-0 bg-card/95 backdrop-blur-sm z-10">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                {group}
              </span>
            </div>
            <div className="space-y-px">
              {groupEvents.map((event, i) => (
                <EventRow
                  key={`${event.event}-${event.time}-${i}`}
                  event={event}
                  alpha={alpha}
                  themeColors={themeColors}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom fade gradient to hint at scrollability */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card/80 to-transparent pointer-events-none rounded-b-xl" />
    </div>
  )
}
