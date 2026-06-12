import { useState, useEffect, useRef } from 'react'
import { fetchMacroSnapshot, type MacroIndicator } from '@/services/macro-data'

const REFRESH_INTERVAL = 6 * 60 * 60 * 1000 // 6h — macro data updates daily at most

export function useMacroData(enabled = true) {
  const [indicators, setIndicators] = useState<MacroIndicator[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true

    if (!enabled) {
      setIndicators([])
      setIsLoading(false)
      return () => { mountedRef.current = false }
    }

    const refresh = async () => {
      try {
        const data = await fetchMacroSnapshot()
        if (mountedRef.current) setIndicators(data)
      } finally {
        if (mountedRef.current) setIsLoading(false)
      }
    }

    refresh()
    const interval = setInterval(refresh, REFRESH_INTERVAL)
    return () => {
      mountedRef.current = false
      clearInterval(interval)
    }
  }, [enabled])

  return { indicators, isLoading }
}
