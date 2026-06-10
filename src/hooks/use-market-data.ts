import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchQuotes, type MarketQuote } from '@/services/market-data'

const REFRESH_INTERVAL = 5 * 60 * 1000 // 5 minutes

export function useMarketData(symbols: string[]) {
  const [quotes, setQuotes] = useState<MarketQuote[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const symbolsKey = [...symbols].sort().join(',')
  const mountedRef = useRef(true)

  const refresh = useCallback(async () => {
    if (symbols.length === 0) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchQuotes(symbols)
      if (mountedRef.current) setQuotes(data)
    } catch (e) {
      if (mountedRef.current) setError('Failed to load market data')
    } finally {
      if (mountedRef.current) setIsLoading(false)
    }
  }, [symbolsKey])

  useEffect(() => {
    mountedRef.current = true
    refresh()
    const interval = setInterval(refresh, REFRESH_INTERVAL)
    return () => {
      mountedRef.current = false
      clearInterval(interval)
    }
  }, [refresh])

  return { quotes, isLoading, error, refresh }
}
