import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { LinkSimple, CircleNotch, MagnifyingGlass } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useThemePresets } from '@/contexts/theme-presets'
import { useAccounts } from '@/contexts/account-context'
import { useDemoGuard } from '@/hooks/use-demo-guard'
import { useUserStorage } from '@/utils/user-storage'
import { belongsToAccount } from '@/lib/account-scope'
import { setIdeaOutcome, callableMessage } from '@/lib/trade-ideas'
import { formatOutcomePnl } from '@/lib/idea-format'
import type { CommunityIdea, IdeaOutcome, IdeaResult } from '@/types/trade-ideas'
import { IdeaPreviewCard } from './idea-preview-card'

interface StoredTrade {
  id: string
  symbol: string
  side: 'long' | 'short'
  entryPrice?: number
  exitPrice?: number
  pnl?: number
  exitTime?: string | Date
  accountId?: string
}

interface LinkTradeDialogProps {
  idea: CommunityIdea | null
  onOpenChange: (open: boolean) => void
  onLinked: (ideaId: string, outcome: IdeaOutcome | null) => void
}

function normalizeSymbol(s: string): string {
  return s.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

export function LinkTradeDialog({ idea, onOpenChange, onLinked }: LinkTradeDialogProps) {
  const { themeColors, alpha } = useThemePresets()
  const { accounts } = useAccounts()
  const demoGuard = useDemoGuard()
  const userStorage = useUserStorage()
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const open = idea !== null

  // Every account's closed trades: an idea can be taken in any of them.
  const trades = useMemo<StoredTrade[]>(() => {
    if (!open) return []
    try {
      const raw = userStorage.getItem('trades')
      const parsed: StoredTrade[] = raw ? JSON.parse(raw) : []
      return parsed
        .filter(t => t && Number.isFinite(t.pnl) && t.exitTime && !Number.isNaN(new Date(t.exitTime as string).getTime()))
        .sort((a, b) => new Date(b.exitTime as string).getTime() - new Date(a.exitTime as string).getTime())
    } catch {
      return []
    }
  }, [open, userStorage])

  useEffect(() => {
    if (!idea) return
    setSearch('')
    setError(null)
    setSelectedId(idea.outcome?.tradeId ?? null)
  }, [idea])

  const ideaSymbol = idea ? normalizeSymbol(idea.symbol) : ''
  const filtered = useMemo(() => {
    const q = normalizeSymbol(search)
    const pool = q ? trades.filter(t => normalizeSymbol(t.symbol).includes(q)) : trades
    // Same-symbol trades first; everything else after so a differently-named
    // contract (NQ vs NQZ6) can still be picked.
    const same = pool.filter(t => normalizeSymbol(t.symbol).includes(ideaSymbol) || ideaSymbol.includes(normalizeSymbol(t.symbol)))
    const rest = pool.filter(t => !same.includes(t))
    return [...same, ...rest].slice(0, 40)
  }, [trades, search, ideaSymbol])

  const accountFor = (t: StoredTrade) => accounts.find(a => belongsToAccount(t, a.id)) ?? accounts[0]
  const currencyFor = (t: StoredTrade): string => accountFor(t)?.currency || 'USD'

  const save = async (trade: StoredTrade | null) => {
    if (!idea) return
    if (demoGuard('link a trade')) return
    setSaving(true)
    setError(null)
    try {
      let outcome: IdeaOutcome | null = null
      if (trade) {
        const pnl = trade.pnl ?? 0
        const result: IdeaResult = pnl > 0 ? 'win' : pnl < 0 ? 'loss' : 'breakeven'
        outcome = {
          result,
          pnl,
          currency: currencyFor(trade),
          closedAt: new Date(trade.exitTime as string).toISOString(),
          tradeId: trade.id,
        }
      }
      await setIdeaOutcome(idea.id, outcome)
      toast.success(outcome ? 'Trade linked' : 'Trade unlinked')
      onLinked(idea.id, outcome)
      onOpenChange(false)
    } catch (err) {
      setError(callableMessage(err, 'Could not link that trade.'))
    } finally {
      setSaving(false)
    }
  }

  const selected = filtered.find(t => t.id === selectedId) ?? trades.find(t => t.id === selectedId) ?? null
  const showAccount = accounts.length > 1
  const previewOutcome: IdeaOutcome | null = selected
    ? {
        result: (selected.pnl ?? 0) > 0 ? 'win' : (selected.pnl ?? 0) < 0 ? 'loss' : 'breakeven',
        pnl: selected.pnl ?? 0,
        currency: currencyFor(selected),
        closedAt: new Date(selected.exitTime as string).toISOString(),
        tradeId: selected.id,
      }
    : idea?.outcome ?? null

  return (
    <Dialog open={open} onOpenChange={v => { if (!saving) onOpenChange(v) }}>
      <DialogContent className="max-w-lg p-0 overflow-hidden gap-0">
        <div className="px-6 pt-5 pb-4 border-b flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: alpha(themeColors.primary, '15') }}>
            <LinkSimple className="h-5 w-5" style={{ color: themeColors.primary }} aria-hidden="true" />
          </div>
          <DialogHeader className="p-0 space-y-0.5 text-left">
            <DialogTitle className="text-base">Link a trade</DialogTitle>
            <DialogDescription className="text-xs">
              {idea ? `Pick the trade you took on this ${idea.symbol} idea. Its result shows on the feed as your own, linked from your Trade Log.` : ''}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 py-4 space-y-3">
          {idea && (
            <IdeaPreviewCard
              caption={selected ? 'With this trade linked' : 'Your idea'}
              preview={{
                avatar: idea,
                handle: idea.handle,
                market: idea.market,
                symbol: idea.symbol,
                direction: idea.direction,
                entry: idea.entry,
                stop: idea.stop,
                target: idea.target,
                outcome: previewOutcome,
                when: 'posted',
              }}
            />
          )}
          {trades.length === 0 ? (
            <div className="rounded-lg border border-dashed px-4 py-8 text-center space-y-2">
              <p className="text-sm font-medium">No closed trades yet</p>
              <p className="text-xs text-muted-foreground">Log the trade in your Trade Log first, then come back and link it.</p>
              <Button asChild size="sm" variant="outline"><Link to="/trades">Open Trade Log</Link></Button>
            </div>
          ) : (
            <>
              <div className="relative">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by symbol"
                  className="h-9 pl-9"
                  aria-label="Search trades by symbol"
                />
              </div>
              <div className="max-h-[38vh] overflow-y-auto -mx-1 px-1 space-y-1" role="group" aria-label="Your closed trades">
                {filtered.length === 0 && (
                  <p className="px-3 py-6 text-center text-sm text-muted-foreground">No trades match.</p>
                )}
                {filtered.map(t => {
                  const active = t.id === selectedId
                  const pnl = t.pnl ?? 0
                  const pnlColor = pnl > 0 ? themeColors.profit : pnl < 0 ? themeColors.loss : undefined
                  const exit = new Date(t.exitTime as string)
                  const account = accountFor(t)
                  return (
                    <button
                      key={t.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setSelectedId(active ? null : t.id)}
                      className="w-full flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors hover:bg-muted/40"
                      style={{
                        borderColor: active ? themeColors.primary : 'hsl(var(--border))',
                        backgroundColor: active ? alpha(themeColors.primary, '10') : undefined,
                      }}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate">
                          {t.symbol} <span className="font-normal text-muted-foreground">{t.side === 'short' ? 'Short' : 'Long'}</span>
                        </p>
                        <p className="text-xs text-muted-foreground tabular-nums truncate">
                          {new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(exit)}
                          {typeof t.entryPrice === 'number' && typeof t.exitPrice === 'number' && ` · ${t.entryPrice} → ${t.exitPrice}`}
                          {showAccount && account?.name && ` · ${account.name}`}
                        </p>
                      </div>
                      <span className="text-sm font-semibold tabular-nums shrink-0" style={pnlColor ? { color: pnlColor } : undefined}>
                        {formatOutcomePnl(pnl, currencyFor(t))}
                      </span>
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {error && (
            <p className="text-xs rounded-md border px-3 py-2" role="alert" style={{ color: themeColors.loss, borderColor: alpha(themeColors.loss, '40') }}>
              {error}
            </p>
          )}

          <div className="flex items-center justify-between gap-2 pt-1">
            {idea?.outcome ? (
              <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => save(null)} disabled={saving}>
                Unlink
              </Button>
            ) : <span />}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
              <Button
                onClick={() => save(selected)}
                disabled={saving || !selected || selected.id === idea?.outcome?.tradeId}
                style={{ backgroundColor: themeColors.primary, color: themeColors.primaryButtonText }}
              >
                {saving && <CircleNotch className="h-4 w-4 animate-spin" aria-hidden="true" />}
                Link trade
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
