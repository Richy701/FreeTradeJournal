import { cachedFetch } from '@/utils/api-cache'
import { MARKET_DATA_ENABLED } from '@/config/market-data'

// Same-origin proxy (see api/finnhub) — API key is injected server-side.
const BASE_URL = '/api/finnhub'

const CACHE_TTL = 30 * 60 * 1000 // 30 minutes

export interface EconomicEvent {
  country: string
  event: string
  impact: 'low' | 'medium' | 'high'
  time: string
  actual: string
  estimate: string
  previous: string
}

function mapImpact(impact: string | number): 'low' | 'medium' | 'high' {
  if (typeof impact === 'string') {
    const lower = impact.toLowerCase()
    if (lower === 'high') return 'high'
    if (lower === 'medium') return 'medium'
    return 'low'
  }
  if (impact >= 3) return 'high'
  if (impact >= 2) return 'medium'
  return 'low'
}

export async function getEconomicCalendar(
  from: string,
  to: string
): Promise<EconomicEvent[]> {
  if (!MARKET_DATA_ENABLED) return []

  return cachedFetch<EconomicEvent[]>(
    `ftj-econ-cal-${from}-${to}`,
    `${BASE_URL}/calendar/economic?from=${from}&to=${to}`,
    CACHE_TTL,
    (raw: any) => {
      const events = raw?.economicCalendar || []
      return events
        .map((e: any) => ({
          country: e.country,
          event: e.event,
          impact: mapImpact(e.impact),
          time: e.time,
          actual: e.actual ?? '',
          estimate: e.estimate ?? '',
          previous: e.prev ?? '',
        }))
        .filter((e: EconomicEvent) => e.impact !== 'low')
    }
  )
}

export async function getUpcomingEvents(days: number = 7): Promise<EconomicEvent[]> {
  const now = new Date()
  const end = new Date(now)
  end.setDate(end.getDate() + days)

  const from = now.toISOString().slice(0, 10)
  const to = end.toISOString().slice(0, 10)

  return getEconomicCalendar(from, to)
}

export async function getEventsForDate(date: string): Promise<EconomicEvent[]> {
  return getEconomicCalendar(date, date)
}
