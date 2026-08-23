// State for the Trade Ideas feed page: paginated ideas for one scope, the
// viewer's own handle profile, their moderation state, and which ideas they
// have liked. Likes update optimistically; post, delete and outcome changes
// refetch what they touch.

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import {
  fetchIdeaFeed,
  fetchIdeaModeration,
  fetchIdeaProfile,
  fetchLikedIdeaIds,
  type IdeaFeedPage,
} from '@/lib/trade-ideas'
import type { CommunityIdea, IdeaModeration, IdeaProfile } from '@/types/trade-ideas'

export type IdeaFeedScope = 'latest' | 'mine'

/** `undefined` = still loading, `null` = no handle yet, `'error'` = could not load. */
export type IdeaProfileState = IdeaProfile | null | undefined | 'error'

export function useIdeaFeed(scope: IdeaFeedScope) {
  const { user } = useAuth()
  const uid = user?.uid ?? null

  const [ideas, setIdeas] = useState<CommunityIdea[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const cursorRef = useRef<IdeaFeedPage['cursor']>(null)
  // Bumped by every fresh load so in-flight pages from an older scope or an
  // older refresh are dropped instead of merged.
  const requestRef = useRef(0)

  const [profile, setProfileState] = useState<IdeaProfileState>(undefined)
  const [moderation, setModeration] = useState<IdeaModeration | null>(null)
  const [likedIds, setLikedIds] = useState<Set<string>>(() => new Set())

  const load = useCallback(async () => {
    if (!uid) return
    const request = ++requestRef.current
    setLoading(true)
    setError(null)
    cursorRef.current = null
    try {
      const page = await fetchIdeaFeed(scope === 'mine' ? { kind: 'mine', uid } : { kind: 'latest' }, null)
      if (request !== requestRef.current) return
      setIdeas(page.ideas)
      cursorRef.current = page.cursor
      setDone(page.done)
    } catch (err) {
      if (request !== requestRef.current) return
      console.error('Trade ideas: feed load failed', err)
      setError('Could not load ideas right now.')
    } finally {
      if (request === requestRef.current) setLoading(false)
    }
  }, [scope, uid])

  /** Returns false when the page could not be fetched; the list is left as it was. */
  const loadMore = useCallback(async (): Promise<boolean> => {
    if (!uid || done || loadingMore || loading) return true
    const request = requestRef.current
    setLoadingMore(true)
    try {
      const page = await fetchIdeaFeed(scope === 'mine' ? { kind: 'mine', uid } : { kind: 'latest' }, cursorRef.current)
      if (request !== requestRef.current) return true
      setIdeas(prev => {
        const seen = new Set(prev.map(i => i.id))
        return [...prev, ...page.ideas.filter(i => !seen.has(i.id))]
      })
      cursorRef.current = page.cursor
      setDone(page.done)
      return true
    } catch (err) {
      console.error('Trade ideas: load more failed', err)
      return false
    } finally {
      if (request === requestRef.current) setLoadingMore(false)
    }
  }, [scope, uid, done, loadingMore, loading])

  const refreshProfile = useCallback(async () => {
    if (!uid) return
    try {
      const [p, m] = await Promise.all([fetchIdeaProfile(uid), fetchIdeaModeration(uid).catch(() => null)])
      setProfileState(p)
      setModeration(m)
    } catch (err) {
      console.error('Trade ideas: profile load failed', err)
      // Keep whatever we already had; only flag an error if nothing loaded yet.
      setProfileState(prev => (prev === undefined ? 'error' : prev))
    }
  }, [uid])

  const setProfile = useCallback((next: IdeaProfile | null) => setProfileState(next), [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!uid) return
    void refreshProfile()
    fetchLikedIdeaIds(uid)
      .then(setLikedIds)
      .catch(err => console.error('Trade ideas: liked ids failed', err))
  }, [uid, refreshProfile])

  /** Set liked state and adjust the count by a delta relative to whatever is currently shown. */
  const adjustLike = useCallback((ideaId: string, liked: boolean, delta: number) => {
    setLikedIds(prev => {
      const next = new Set(prev)
      if (liked) next.add(ideaId)
      else next.delete(ideaId)
      return next
    })
    setIdeas(prev => prev.map(i => (i.id === ideaId ? { ...i, likeCount: Math.max(0, i.likeCount + delta) } : i)))
  }, [])

  /** Set liked state and the exact count the server returned. */
  const settleLike = useCallback((ideaId: string, liked: boolean, likeCount: number) => {
    setLikedIds(prev => {
      const next = new Set(prev)
      if (liked) next.add(ideaId)
      else next.delete(ideaId)
      return next
    })
    setIdeas(prev => prev.map(i => (i.id === ideaId ? { ...i, likeCount } : i)))
  }, [])

  const replaceIdea = useCallback((ideaId: string, patch: Partial<CommunityIdea>) => {
    setIdeas(prev => prev.map(i => (i.id === ideaId ? { ...i, ...patch } : i)))
  }, [])

  const patchAll = useCallback((predicate: (idea: CommunityIdea) => boolean, patch: Partial<CommunityIdea>) => {
    setIdeas(prev => prev.map(i => (predicate(i) ? { ...i, ...patch } : i)))
  }, [])

  const removeIdea = useCallback((ideaId: string) => {
    setIdeas(prev => prev.filter(i => i.id !== ideaId))
  }, [])

  return {
    ideas,
    loading,
    loadingMore,
    error,
    done,
    reload: load,
    loadMore,
    profile,
    setProfile,
    refreshProfile,
    moderation,
    likedIds,
    adjustLike,
    settleLike,
    replaceIdea,
    patchAll,
    removeIdea,
  }
}
