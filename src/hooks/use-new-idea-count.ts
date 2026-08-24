// Unread count for the Trade Ideas sidebar item: published ideas posted since
// the user last opened the feed. Opening the feed stamps "now" and zeroes the
// count; the next navigation away refetches. Nothing shows until the user has
// opened the feed at least once, so first-timers see the Beta tag instead.

import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { useUserStorage } from '@/utils/user-storage'
import { fetchNewIdeaCount } from '@/lib/trade-ideas'

const LAST_SEEN_KEY = 'tradeIdeasLastSeenAt'
const FEED_PATH = '/trade-ideas'
/** Shown as "9+" beyond this. */
export const NEW_IDEA_COUNT_CAP = 9

export function useNewIdeaCount(): number {
  const { user, isDemo } = useAuth()
  const userStorage = useUserStorage()
  const { pathname } = useLocation()
  const [count, setCount] = useState(0)
  // True until the first fetch, and again after every visit to the feed.
  const staleRef = useRef(true)

  useEffect(() => {
    if (!user || isDemo) return
    if (pathname.startsWith(FEED_PATH)) {
      void userStorage.setItem(LAST_SEEN_KEY, new Date().toISOString(), true)
      staleRef.current = true
      setCount(0)
      return
    }
    if (!staleRef.current) return
    const lastSeen = userStorage.getItem(LAST_SEEN_KEY)
    if (!lastSeen) return
    staleRef.current = false
    let cancelled = false
    fetchNewIdeaCount(new Date(lastSeen), NEW_IDEA_COUNT_CAP)
      .then(n => { if (!cancelled) setCount(n) })
      .catch(err => console.error('Trade ideas: new-idea count failed', err))
    return () => { cancelled = true }
  }, [user, isDemo, pathname, userStorage])

  return count
}
