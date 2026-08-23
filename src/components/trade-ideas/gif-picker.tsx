import { useEffect, useRef, useState } from 'react'
import { MagnifyingGlass, CircleNotch } from '@phosphor-icons/react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export interface PickedGif {
  url: string
  preview: string
  title: string
}

interface GifResult extends PickedGif {
  id: string
  width: number
  height: number
}

/**
 * GIF search backed by the same-origin /api/gifs proxy (GIPHY). Shows trending
 * GIFs until the user types. Picking one hands back the full-size URL; the
 * server only accepts the provider's CDN links, so nothing is uploaded.
 */
export function GifPicker({ onPick, onClose }: { onPick: (gif: PickedGif) => void; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GifResult[]>([])
  const [next, setNext] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestRef = useRef(0)

  const search = async (q: string, pos = '') => {
    const request = ++requestRef.current
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (pos) params.set('pos', pos)
      const res = await fetch(`/api/gifs?${params.toString()}`)
      if (request !== requestRef.current) return
      if (res.status === 503) {
        setError('GIF search is not set up yet.')
        setResults([])
        return
      }
      if (!res.ok) throw new Error(String(res.status))
      const data = (await res.json()) as { results: GifResult[]; next: string }
      if (request !== requestRef.current) return
      setResults(prev => (pos ? [...prev, ...data.results] : data.results))
      setNext(data.next || '')
    } catch {
      if (request === requestRef.current) setError('Could not load GIFs. Try again.')
    } finally {
      if (request === requestRef.current) setLoading(false)
    }
  }

  useEffect(() => {
    const t = setTimeout(() => { void search(query.trim()) }, query ? 300 : 0)
    return () => clearTimeout(t)
  }, [query])

  return (
    <div className="rounded-lg border p-3 space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search GIFs"
            className="h-9 pl-9"
            aria-label="Search GIFs"
            autoFocus
          />
        </div>
        <Button type="button" variant="ghost" size="sm" className="h-9 text-muted-foreground" onClick={onClose}>Close</Button>
      </div>

      {error ? (
        <p className="text-xs text-muted-foreground py-6 text-center">{error}</p>
      ) : (
        <div className="max-h-64 overflow-y-auto -mx-1 px-1">
          <div className="grid grid-cols-3 gap-1.5">
            {results.map(gif => (
              <button
                key={gif.id}
                type="button"
                onClick={() => onPick({ url: gif.url, preview: gif.preview, title: gif.title })}
                className="relative aspect-square overflow-hidden rounded-md border bg-muted/30 focus-visible:outline-2 focus-visible:outline-offset-1"
                aria-label={gif.title ? `Use GIF: ${gif.title}` : 'Use this GIF'}
              >
                <img src={gif.preview} alt="" loading="lazy" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
          {loading && (
            <div className="flex justify-center py-4" role="status" aria-label="Loading GIFs">
              <CircleNotch className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden="true" />
            </div>
          )}
          {!loading && results.length === 0 && (
            <p className="text-xs text-muted-foreground py-6 text-center">No GIFs for that.</p>
          )}
          {!loading && next && results.length > 0 && (
            <div className="flex justify-center pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => search(query.trim(), next)}>More</Button>
            </div>
          )}
        </div>
      )}
      <p className="text-[11px] text-muted-foreground text-right">Powered by GIPHY</p>
    </div>
  )
}
