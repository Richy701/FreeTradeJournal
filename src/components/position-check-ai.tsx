import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { useDemoData } from '@/hooks/use-demo-data'
import { useThemePresets } from '@/contexts/theme-presets'
import { requestAIAssist } from '@/services/ai-assist'
import type { Trade } from '@/types/trade'
import { Button } from '@/components/ui/button'
import { Brain, SpinnerGap } from '@phosphor-icons/react'

interface PositionCheckAiProps {
  /** Calculator inputs/outputs for the prompt; null while inputs are incomplete. */
  payload: Record<string, any> | null
  /** Selected instrument, used to slice the trader's own history. */
  instrument: string
}

function computeStats(trades: Trade[], instrument: string) {
  const closed = trades.filter(t => typeof t.pnl === 'number')
  if (closed.length === 0) return null

  const wins = closed.filter(t => t.pnl > 0)
  const losses = closed.filter(t => t.pnl < 0)
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)

  // Longest run of consecutive losers, in time order.
  const ordered = [...closed].sort(
    (a, b) => new Date(a.exitTime).getTime() - new Date(b.exitTime).getTime()
  )
  let maxLossStreak = 0
  let run = 0
  for (const t of ordered) {
    run = t.pnl < 0 ? run + 1 : 0
    if (run > maxLossStreak) maxLossStreak = run
  }

  const root = instrument.toUpperCase()
  const onInstrument = closed.filter(t => (t.symbol || '').toUpperCase().startsWith(root))

  return {
    tradeCount: closed.length,
    winRate: Math.round((wins.length / closed.length) * 100),
    avgWin: avg(wins.map(t => t.pnl)).toFixed(2),
    avgLoss: Math.abs(avg(losses.map(t => t.pnl))).toFixed(2),
    maxLossStreak,
    instrumentTradeCount: onInstrument.length,
    instrumentWinRate: onInstrument.length
      ? Math.round((onInstrument.filter(t => t.pnl > 0).length / onInstrument.length) * 100)
      : 0,
  }
}

export function PositionCheckAi({ payload, instrument }: PositionCheckAiProps) {
  const { user, isDemo } = useAuth()
  const { getTrades } = useDemoData()
  const { themeColors, alpha } = useThemePresets()
  const [result, setResult] = useState<string | null>(null)
  const [remaining, setRemaining] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const stats = useMemo(() => {
    if (!user || isDemo) return null
    try { return computeStats(getTrades() as Trade[], instrument) } catch { return null }
  }, [user, isDemo, getTrades, instrument])

  const runCheck = async () => {
    if (!payload) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await requestAIAssist({ type: 'position_check', payload: { ...payload, stats } })
      setResult(res.result)
      setRemaining(res.usage?.remaining ?? null)
    } catch (e: any) {
      setError(e?.code === 'functions/resource-exhausted'
        ? 'You have used all of today\'s checks. It resets tomorrow.'
        : 'The check did not run. Try again in a moment.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border bg-card/50 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Brain className="h-4 w-4" style={{ color: themeColors.primary }} />
        <span className="text-sm font-semibold text-foreground">AI risk check</span>
      </div>

      {!user || isDemo ? (
        <>
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">
            Checks this trade plan against your own results: whether the risk survives your real losing streaks, and whether the reward fits your actual win rate.
          </p>
          <Link to="/signup">
            <Button variant="outline" size="sm" className="w-full">Sign in to check against your trades</Button>
          </Link>
        </>
      ) : (
        <>
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">
            {stats && stats.tradeCount >= 5
              ? `Reviews this plan against your ${stats.tradeCount} logged trades: risk level, losing streaks, and whether the reward fits your ${stats.winRate}% win rate.`
              : 'Reviews the risk level and reward of this plan. Log at least 5 trades and it also checks the plan against your own results.'}
          </p>

          {result && (
            <div className="rounded-lg p-3 mb-3 text-sm leading-relaxed whitespace-pre-wrap" style={{ backgroundColor: alpha(themeColors.primary, '08') }}>
              {result}
            </div>
          )}
          {error && <p className="text-xs text-muted-foreground mb-3">{error}</p>}

          <Button
            onClick={runCheck}
            disabled={!payload || loading}
            variant="outline"
            size="sm"
            className="w-full gap-2"
          >
            {loading
              ? <><SpinnerGap className="h-4 w-4 animate-spin" /> Checking...</>
              : result ? 'Check again' : 'Check my sizing'}
          </Button>
          {remaining !== null && (
            <p className="text-[11px] text-muted-foreground mt-2 text-center">{remaining} checks left today</p>
          )}
        </>
      )}
    </div>
  )
}
