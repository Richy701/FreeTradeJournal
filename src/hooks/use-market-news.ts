import { useState, useEffect, useRef } from 'react'
import { getMarketNews, getSymbolNews, type NewsItem } from '@/services/market-news'

export function useMarketNews(category: 'general' | 'forex' | 'crypto' = 'general') {
  const [news, setNews] = useState<NewsItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(false)
  // Distinguishes "fetch finished with no articles" from the initial empty
  // state, so callers can react to a genuinely empty category.
  const [hasLoaded, setHasLoaded] = useState(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    setIsLoading(true)
    setError(false)
    setHasLoaded(false)
    getMarketNews(category)
      .then(data => { if (mountedRef.current) setNews(data) })
      .catch(() => { if (mountedRef.current) setError(true) })
      .finally(() => {
        if (mountedRef.current) {
          setIsLoading(false)
          setHasLoaded(true)
        }
      })

    return () => { mountedRef.current = false }
  }, [category])

  return { news, isLoading, error, hasLoaded }
}

export function useSymbolNews(symbol: string | null) {
  const [news, setNews] = useState<NewsItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    if (!symbol) { setNews([]); return }

    setIsLoading(true)
    setError(false)
    getSymbolNews(symbol)
      .then(data => { if (mountedRef.current) setNews(data) })
      .catch(() => { if (mountedRef.current) setError(true) })
      .finally(() => { if (mountedRef.current) setIsLoading(false) })

    return () => { mountedRef.current = false }
  }, [symbol])

  return { news, isLoading, error }
}
