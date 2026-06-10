import { useState, useEffect, useRef } from 'react'
import { getUpcomingEvents, getEventsForDate, type EconomicEvent } from '@/services/economic-calendar'

export function useUpcomingEvents(days: number = 7) {
  const [events, setEvents] = useState<EconomicEvent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    setIsLoading(true)
    getUpcomingEvents(days)
      .then(data => { if (mountedRef.current) setEvents(data) })
      .catch(() => {})
      .finally(() => { if (mountedRef.current) setIsLoading(false) })

    return () => { mountedRef.current = false }
  }, [days])

  return { events, isLoading }
}

export function useDayEvents(date: string | null) {
  const [events, setEvents] = useState<EconomicEvent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    if (!date) { setEvents([]); return }

    setIsLoading(true)
    getEventsForDate(date)
      .then(data => { if (mountedRef.current) setEvents(data) })
      .catch(() => {})
      .finally(() => { if (mountedRef.current) setIsLoading(false) })

    return () => { mountedRef.current = false }
  }, [date])

  return { events, isLoading }
}
