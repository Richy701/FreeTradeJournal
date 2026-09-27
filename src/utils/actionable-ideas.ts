// Actionable Ideas for the Trade Insights page. Every idea is anchored to a
// loss figure (`impact`, money over the window) so the list can be ranked by
// what is at stake, and each one is one fact plus one concrete change. Rules
// only fire with a real sample behind them; nothing here praises.
import { computeCostStats, computeHoldTimeStats } from './trade-aggregates'

export interface IdeaTrade {
  id: string
  symbol: string
  side: string
  pnl: number
  entryTime: Date
  exitTime: Date
  strategy?: string
  commission?: number
  fees?: number
  swap?: number
}

export interface ActionableIdea {
  /** Stable per finding (rule + subject) so a dismissal survives recomputation. */
  id: string
  title: string
  /** The numbers behind it. */
  evidence: string
  /** One concrete change. */
  action: string
  /** Money at stake over the window, always >= 0. */
  impact: number
}

/** Smallest group an idea may be built on. */
export const MIN_IDEA_TRADES = 3
/** Below this the idea is noise, whatever the sample. */
const MIN_IMPACT = 20
/** A re-entry this soon after a loss counts as reactive. */
export const AFTER_LOSS_MINUTES = 15

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

interface Group { key: string; count: number; wins: number; pnl: number }
function groupBy(trades: IdeaTrade[], keyOf: (t: IdeaTrade) => string | null): Group[] {
  const map = new Map<string, Group>()
  for (const t of trades) {
    const key = keyOf(t)
    if (!key) continue
    const g = map.get(key) || { key, count: 0, wins: 0, pnl: 0 }
    g.count++; if (t.pnl > 0) g.wins++; g.pnl += t.pnl
    map.set(key, g)
  }
  return [...map.values()]
}
const winRate = (g: Group) => Math.round((g.wins / g.count) * 100)
const localDay = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`

export function fmtHold(mins: number): string {
  if (mins < 60) return `${Math.round(mins)}m`
  if (mins < 1440) { const h = Math.floor(mins / 60); const m = Math.round(mins % 60); return m ? `${h}h ${String(m).padStart(2, '0')}m` : `${h}h` }
  const d = Math.floor(mins / 1440); const h = Math.round((mins % 1440) / 60)
  return h ? `${d}d ${h}h` : `${d}d`
}

/**
 * `fmt` renders money without a sign; the engine adds words, never symbols.
 * Returns ideas sorted by impact, largest first.
 */
export function buildActionableIdeas(trades: IdeaTrade[], fmt: (n: number) => string): ActionableIdea[] {
  const ideas: ActionableIdea[] = []
  if (trades.length < 5) return ideas
  const money = (n: number) => fmt(Math.abs(n))

  // Losers held longer than winners
  const hold = computeHoldTimeStats(trades)
  if (hold.winCount >= MIN_IDEA_TRADES && hold.lossCount >= MIN_IDEA_TRADES
    && hold.medianWinMinutes !== null && hold.medianLossMinutes !== null
    && hold.medianLossMinutes > hold.medianWinMinutes * 1.5) {
    const winPace = hold.medianWinMinutes
    const overrun = trades.filter(t => t.pnl < 0 && (t.exitTime.getTime() - t.entryTime.getTime()) / 60000 > winPace)
    const impact = Math.abs(overrun.reduce((s, t) => s + t.pnl, 0))
    if (impact >= MIN_IMPACT) {
      const ratio = hold.medianLossMinutes / winPace
      ideas.push({
        id: 'hold:losers',
        title: 'Losses run longer than wins',
        evidence: `A typical loser is held ${fmtHold(hold.medianLossMinutes)} against ${fmtHold(winPace)} for a winner, ${ratio >= 1.95 ? `${Math.round(ratio)}x` : `${ratio.toFixed(1)}x`} as long. Losses held past ${fmtHold(winPace)} cost ${money(impact)}.`,
        action: `Decide the exit before you enter and let the first ${fmtHold(winPace)} settle it.`,
        impact,
      })
    }
  }

  // Trades that only paid the broker
  const costs = computeCostStats(trades)
  if (costs.flippedByCosts >= 2) {
    const flipped = trades.filter(t => {
      const c = (t.commission || 0) + (t.fees || 0) + (t.swap || 0)
      return t.pnl + c > 0 && t.pnl <= 0
    })
    const impact = flipped.reduce((s, t) => s + (t.commission || 0) + (t.fees || 0) + (t.swap || 0), 0)
    const dear = costs.perSymbol[0]
    if (impact >= MIN_IMPACT) {
      ideas.push({
        id: 'costs:flipped',
        title: 'Some trades only paid fees',
        evidence: `${plural(costs.flippedByCosts, 'trade')} made money before costs and lost after them. ${dear ? `On ${dear.symbol} the costs run ${money(dear.costPerTrade)} a trade.` : `Costs average ${money(costs.costPerTrade)} a trade.`}`,
        action: `A target smaller than the costs is not a trade. Widen the target or trade fewer contracts.`,
        impact,
      })
    }
  }

  // The trade straight after a loss
  const byExit = [...trades].sort((a, b) => a.exitTime.getTime() - b.exitTime.getTime())
  const reactive = new Set<string>()
  for (const t of trades) {
    const entry = t.entryTime.getTime()
    const prior = byExit.filter(p => p.id !== t.id && p.pnl < 0 && p.exitTime.getTime() <= entry && entry - p.exitTime.getTime() <= AFTER_LOSS_MINUTES * 60000)
    if (prior.length) reactive.add(t.id)
  }
  if (reactive.size >= MIN_IDEA_TRADES && reactive.size < trades.length) {
    const quick = trades.filter(t => reactive.has(t.id))
    const rest = trades.filter(t => !reactive.has(t.id))
    const quickWr = Math.round((quick.filter(t => t.pnl > 0).length / quick.length) * 100)
    const restWr = Math.round((rest.filter(t => t.pnl > 0).length / rest.length) * 100)
    const net = quick.reduce((s, t) => s + t.pnl, 0)
    if (net < 0 && Math.abs(net) >= MIN_IMPACT && quickWr < restWr) {
      ideas.push({
        id: 'behaviour:after-loss',
        title: 'The trade after a loss is the weak one',
        evidence: `${plural(quick.length, 'trade')} went in within ${AFTER_LOSS_MINUTES} minutes of a loss. They win ${quickWr}% against ${restWr}% for the rest and cost ${money(net)}.`,
        action: `After a loss, wait ${AFTER_LOSS_MINUTES} minutes before the next order.`,
        impact: Math.abs(net),
      })
    }
  }

  // Heavy days
  const days = groupBy(trades, t => localDay(t.exitTime))
  if (days.length >= 4) {
    const counts = days.map(d => d.count).sort((a, b) => a - b)
    const median = counts[Math.floor(counts.length / 2)]
    const cap = Math.max(4, median * 2)
    const heavy = days.filter(d => d.count >= cap)
    const light = days.filter(d => d.count < cap)
    const heavyNet = heavy.reduce((s, d) => s + d.pnl, 0)
    const lightNet = light.reduce((s, d) => s + d.pnl, 0)
    if (heavy.length >= 2 && heavyNet < 0 && Math.abs(heavyNet) >= MIN_IMPACT && lightNet > heavyNet) {
      ideas.push({
        id: 'behaviour:overtrading',
        title: 'Busy days lose',
        evidence: `${plural(heavy.length, 'day')} with ${cap} or more trades lost ${money(heavyNet)}. The other ${plural(light.length, 'day')} ${lightNet >= 0 ? `made ${money(lightNet)}` : `lost ${money(lightNet)}`}.`,
        action: `Cap yourself at ${cap - 1} trades a day and stop when you get there.`,
        impact: Math.abs(heavyNet),
      })
    }
  }

  // Worst weekday
  const weekdays = groupBy(trades, t => WEEKDAYS[t.exitTime.getDay()])
  const worstDay = weekdays.filter(g => g.count >= MIN_IDEA_TRADES && g.pnl < 0).sort((a, b) => a.pnl - b.pnl)[0]
  if (worstDay && Math.abs(worstDay.pnl) >= MIN_IMPACT) {
    const others = weekdays.filter(g => g.key !== worstDay.key)
    const othersNet = others.reduce((s, g) => s + g.pnl, 0)
    const allGreen = others.length > 0 && others.every(g => g.pnl > 0)
    ideas.push({
      id: `weekday:${worstDay.key}`,
      title: `${worstDay.key}s cost you`,
      evidence: `${worstDay.key}s lost ${money(worstDay.pnl)} across ${plural(worstDay.count, 'trade')} at a ${winRate(worstDay)}% win rate. ${allGreen ? 'Every other day is green.' : `The other days made ${othersNet >= 0 ? money(othersNet) : `a loss of ${money(othersNet)}`} together.`}`,
      action: `Skip ${worstDay.key}s for two weeks and compare.`,
      impact: Math.abs(worstDay.pnl),
    })
  }

  // Worst symbol against the best
  const symbols = groupBy(trades, t => t.symbol || null).filter(g => g.count >= MIN_IDEA_TRADES)
  const worstSym = symbols.filter(g => g.pnl < 0).sort((a, b) => a.pnl - b.pnl)[0]
  const bestSym = symbols.filter(g => g.pnl > 0).sort((a, b) => b.pnl - a.pnl)[0]
  if (worstSym && Math.abs(worstSym.pnl) >= MIN_IMPACT) {
    ideas.push({
      id: `symbol:${worstSym.key}`,
      title: `${worstSym.key} is costing you`,
      evidence: `${worstSym.key} lost ${money(worstSym.pnl)} across ${plural(worstSym.count, 'trade')}, ${winRate(worstSym)}% win rate${bestSym ? `, while ${bestSym.key} made ${money(bestSym.pnl)}` : ''}.`,
      action: `Drop ${worstSym.key} for two weeks or halve the size on it.`,
      impact: Math.abs(worstSym.pnl),
    })
  }

  // Losing strategy against a winning one
  const strategies = groupBy(trades, t => t.strategy?.trim() || null).filter(g => g.count >= MIN_IDEA_TRADES)
  const worstStrat = strategies.filter(g => g.pnl < 0).sort((a, b) => a.pnl - b.pnl)[0]
  const bestStrat = strategies.filter(g => g.pnl > 0).sort((a, b) => b.pnl - a.pnl)[0]
  if (worstStrat && Math.abs(worstStrat.pnl) >= MIN_IMPACT) {
    ideas.push({
      id: `strategy:${worstStrat.key}`,
      title: `"${worstStrat.key}" is not paying`,
      evidence: `"${worstStrat.key}" lost ${money(worstStrat.pnl)} across ${plural(worstStrat.count, 'trade')} at a ${winRate(worstStrat)}% win rate${bestStrat ? `, while "${bestStrat.key}" made ${money(bestStrat.pnl)}` : ''}.`,
      action: `Stop taking "${worstStrat.key}" setups for a month${bestStrat ? ` and put that attention on "${bestStrat.key}"` : ''}.`,
      impact: Math.abs(worstStrat.pnl),
    })
  }

  // Worst hour of the day
  const hours = groupBy(trades, t => `${String(t.entryTime.getHours()).padStart(2, '0')}:00`).filter(g => g.count >= MIN_IDEA_TRADES)
  const worstHour = hours.filter(g => g.pnl < 0).sort((a, b) => a.pnl - b.pnl)[0]
  const bestHour = hours.filter(g => g.pnl > 0).sort((a, b) => b.pnl - a.pnl)[0]
  if (worstHour && Math.abs(worstHour.pnl) >= MIN_IMPACT) {
    ideas.push({
      id: `hour:${worstHour.key}`,
      title: `Trades around ${worstHour.key} lose`,
      evidence: `Entries in the ${worstHour.key} hour lost ${money(worstHour.pnl)} across ${plural(worstHour.count, 'trade')}, ${winRate(worstHour)}% win rate${bestHour ? `. Your best hour is ${bestHour.key} at ${money(bestHour.pnl)}` : ''}.`,
      action: `Stay flat in the ${worstHour.key} hour for two weeks.`,
      impact: Math.abs(worstHour.pnl),
    })
  }

  // One side losing while the other wins
  const sides = groupBy(trades, t => (t.side === 'long' || t.side === 'short' ? t.side : null))
  if (sides.length === 2 && sides.every(g => g.count >= MIN_IDEA_TRADES)) {
    const [a, b] = sides
    const worse = a.pnl < b.pnl ? a : b
    const better = worse === a ? b : a
    if (worse.pnl < 0 && better.pnl > 0 && Math.abs(worse.pnl) >= MIN_IMPACT) {
      const name = (g: Group) => (g.key === 'long' ? 'Longs' : 'Shorts')
      ideas.push({
        id: `side:${worse.key}`,
        title: `${name(worse)} lose, ${name(better).toLowerCase()} win`,
        evidence: `${name(worse)} lost ${money(worse.pnl)} at ${winRate(worse)}% while ${name(better).toLowerCase()} made ${money(better.pnl)} at ${winRate(better)}%.`,
        action: `Only take ${name(better).toLowerCase()} for the next 20 trades.`,
        impact: Math.abs(worse.pnl),
      })
    }
  }

  // Winners smaller than losers
  const wins = trades.filter(t => t.pnl > 0), losses = trades.filter(t => t.pnl < 0)
  if (wins.length >= MIN_IDEA_TRADES && losses.length >= MIN_IDEA_TRADES) {
    const avgWin = wins.reduce((s, t) => s + t.pnl, 0) / wins.length
    const avgLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0) / losses.length)
    if (avgWin < avgLoss * 0.8) {
      const impact = (avgLoss - avgWin) * wins.length
      if (impact >= MIN_IMPACT) {
        ideas.push({
          id: 'payoff:small-wins',
          title: 'Winners are smaller than losers',
          evidence: `An average win is ${money(avgWin)}, an average loss ${money(avgLoss)}. Winners the size of your losers would have added ${money(impact)}.`,
          action: `Set the target at least as far as the stop, and do not take the trade if it does not fit.`,
          impact,
        })
      }
    }
  }

  return ideas.sort((a, b) => b.impact - a.impact)
}
