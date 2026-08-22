// Day-scoped facts for the "Today" block in Coach FTJ.
//
// Coach FTJ reads the last N trades and talks about your trading in general.
// This answers a narrower question: how did today go against the limits you
// set, and is what happened today a pattern. Deliberately has no AI in it.
// Every number here is arithmetic over data already on the device, so it is
// instant, costs nothing, and cannot invent a figure.

import { computeRuleAdherence, currentDrawdown, localDayStart, type RiskRule } from './risk-rules'

interface ReviewTrade {
  pnl?: number
  exitTime?: Date | string
}

export interface LimitUsage {
  type: RiskRule['type']
  limit: number
  /** How much of the limit today used, in currency. */
  used: number
  /** Headroom left. Zero once crossed. */
  remaining: number
  crossed: boolean
  /** Finished close to the limit without crossing it. */
  nearMiss: boolean
}

export interface SessionReview {
  tradeCount: number
  pnl: number
  winCount: number
  lossCount: number
  /** Worst single trade today, as a positive number. Zero if nothing lost. */
  worstLoss: number
  /** One entry per enabled limit, worst-used first. */
  limits: LimitUsage[]
  /** The limit today came closest to. Undefined when no limits are set. */
  tightest?: LimitUsage
  /** Earlier days this calendar month that crossed a limit. Today excluded. */
  priorCrossedDays: number
  /** How many of those finished red. */
  priorCrossedDaysRed: number
}

/** Inside this fraction of a limit counts as a near miss worth mentioning. */
export const NEAR_MISS_RATIO = 0.8

export function buildSessionReview(
  rules: RiskRule[],
  trades: ReviewTrade[],
  now: Date = new Date()
): SessionReview | null {
  const todayStart = localDayStart(now).getTime()

  const todayTrades = trades.filter(t => {
    const ms = new Date(t.exitTime ?? 0).getTime()
    return Number.isFinite(ms) && ms > 0 && localDayStart(new Date(ms)).getTime() === todayStart
  })

  // Nothing traded today means there is no session to review. Coach FTJ's
  // existing tips still cover the "you have not traded in a while" case.
  if (todayTrades.length === 0) return null

  const pnls = todayTrades.map(t => t.pnl || 0)
  const pnl = pnls.reduce((s, p) => s + p, 0)
  const worstLoss = Math.abs(Math.min(0, ...pnls))
  const dayLoss = Math.abs(Math.min(0, pnl))

  const active = rules.filter(r => r.enabled && r.value > 0)

  // Drawdown is not a today number. It is how far equity sits below its last
  // peak after today's trades, the same measure the Goals track record uses.
  const drawdownNow = currentDrawdown(trades)

  const limits: LimitUsage[] = active.map(r => {
    const used =
      r.type === 'maxLossPerDay' ? dayLoss :
      r.type === 'maxLossPerTrade' ? worstLoss :
      drawdownNow
    const crossed = used > r.value
    return {
      type: r.type,
      limit: r.value,
      used,
      remaining: Math.max(0, r.value - used),
      crossed,
      nearMiss: !crossed && used >= r.value * NEAR_MISS_RATIO,
    }
  })

  // Worst-used first, so the tightest limit is limits[0].
  limits.sort((a, b) => (b.used / b.limit) - (a.used / a.limit))

  // Is today's near miss or breach a pattern this month? Reuse the same
  // replay the Goals page uses, so the two can never disagree.
  const history = computeRuleAdherence(rules, trades, now)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  const priorCrossed = history.days.filter(
    d => d.date.getTime() >= monthStart && d.brokenRuleTypes.length > 0
  )

  return {
    tradeCount: todayTrades.length,
    pnl,
    winCount: pnls.filter(p => p > 0).length,
    lossCount: pnls.filter(p => p < 0).length,
    worstLoss,
    limits,
    tightest: limits[0],
    priorCrossedDays: priorCrossed.length,
    priorCrossedDaysRed: priorCrossed.filter(d => d.pnl < 0).length,
  }
}

// ── Journal draft ──────────────────────────────────────────────────────────
// The blank box is where journalling dies, so a new entry on a day you traded
// opens with the day's numbers already written down. First person, because the
// trader is the author. Facts only: no questions, no headings, nothing that
// reads like a form and nothing left behind if they ignore it.

export interface JournalDraft {
  title: string
  content: string
}

function ordinal(n: number): string {
  const rem100 = n % 100
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`
  switch (n % 10) {
    case 1: return `${n}st`
    case 2: return `${n}nd`
    case 3: return `${n}rd`
    default: return `${n}th`
  }
}

export function buildJournalDraft(
  review: SessionReview,
  formatMoney: (value: number) => string,
  now: Date = new Date()
): JournalDraft {
  const signed = (v: number) => `${v < 0 ? '-' : '+'}${formatMoney(Math.abs(v))}`
  const lines: string[] = []

  lines.push(
    `${review.tradeCount} trade${review.tradeCount !== 1 ? 's' : ''} today for ${signed(review.pnl)}.`
  )

  // Only worth writing down when a limit actually came into play. On a
  // comfortable day this line would just be filler in someone's journal.
  const tightest = review.tightest
  if (tightest?.crossed) {
    lines.push(
      `Went past my ${LIMIT_NOUN[tightest.type]} of ${formatMoney(tightest.limit)}, reaching ${formatMoney(tightest.used)}.`
    )
  } else if (tightest?.nearMiss) {
    lines.push(
      `Came within ${formatMoney(tightest.remaining)} of my ${LIMIT_NOUN[tightest.type]} of ${formatMoney(tightest.limit)}.`
    )
  }

  const crossedToday = review.limits.some(l => l.crossed)
  if (crossedToday) {
    const total = review.priorCrossedDays + 1
    if (total > 1) {
      lines.push(`That is the ${ordinal(total)} day this month I have crossed a limit.`)
    }
  } else if (review.priorCrossedDays > 0) {
    lines.push(
      `I have crossed a limit on ${review.priorCrossedDays} other day${review.priorCrossedDays !== 1 ? 's' : ''} this month.`
    )
  }

  return {
    title: now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }),
    // Trailing blank line so the cursor lands under the facts, not inside them.
    content: `${lines.join('\n')}\n\n`,
  }
}

/** First-person wording for limit names. `getRuleLabel` is title case for UI. */
const LIMIT_NOUN: Record<RiskRule['type'], string> = {
  maxLossPerDay: 'max daily loss',
  maxLossPerTrade: 'max loss per trade',
  maxDrawdown: 'max drawdown',
}
