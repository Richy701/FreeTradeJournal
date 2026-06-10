import { useState, useEffect, useRef } from 'react'
import { getMarketNews, getSymbolNews, type NewsItem } from '@/services/market-news'

export function useMarketNews(category: 'general' | 'forex' | 'crypto' = 'general') {
  const [news, setNews] = useState<NewsItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    setIsLoading(true)
    getMarketNews(category)
      .then(data => { if (mountedRef.current) setNews(data) })
      .catch(() => {})
      .finally(() => { if (mountedRef.current) setIsLoading(false) })

    return () => { mountedRef.current = false }
  }, [category])

  return { news, isLoading }
}

export function useSymbolNews(symbol: string | null) {
  const [news, setNews] = useState<NewsItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    if (!symbol) { setNews([]); return }

    setIsLoading(true)
    getSymbolNews(symbol)
      .then(data => { if (mountedRef.current) setNews(data) })
      .catch(() => {})
      .finally(() => { if (mountedRef.current) setIsLoading(false) })

    return () => { mountedRef.current = false }
  }, [symbol])

  return { news, isLoading }
}
