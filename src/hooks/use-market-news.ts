import { useState, useEffect, useRef } from 'react'
import { getMarketFeed, getSymbolNews, type NewsItem, type FeedTab } from '@/services/market-news'

export function useMarketFeed(tab: FeedTab) {
  const [news, setNews] = useState<NewsItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    setIsLoading(true)
    setError(false)
    getMarketFeed(tab)
      .then(data => { if (mountedRef.current) setNews(data) })
      .catch(() => { if (mountedRef.current) setError(true) })
      .finally(() => { if (mountedRef.current) setIsLoading(false) })

    return () => { mountedRef.current = false }
  }, [tab])

  return { news, isLoading, error }
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
