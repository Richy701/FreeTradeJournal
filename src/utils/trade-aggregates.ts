// Sample-size-safe trade aggregation, extracted verbatim from the Coach FTJ
// chat memo (trading-coach.tsx) so AI Analysis and Coaching Tips can feed the
// model the same ranked, significance-flagged buckets instead of thin stats.
//
// Core rule (the anti-MGCJ6 guard from the 2026-06-23 bad-advice fix): groups
// are ranked by SAMPLE SIZE, never by raw dollar P&L, so a 2-trade symbol can
// never out-rank a 200-trade one, and sub-threshold buckets carry
// significant: false so prompts can label them "not significant".

export const SIGNIFICANCE_THRESHOLD = 25 // buckets/overall below this are flagged not statistically significant
export const MAX_BUCKETS = 6 // cap groups serialized into AI payloads (top N by trade count)
export const MIN_STRATEGY_TAGGED_RATIO = 0.2 // need >=20% of trades tagged before we show any strategy edge

import { isMistakeTag, tagKey, tagLabel } from '@/lib/tags'

// CSV/demo/legacy pnl can be NaN/undefined; coerce to a finite number once.
const safeNum = (v: unknown): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : 0

// Minimal structural view of a trade — callers pass their own Trade shapes.
export interface AggregatableTrade {
  pnl?: number
  riskReward?: number
  symbol?: string
  strategy?: string
  side?: string
  entryTime?: Date | null
  exitTime?: Date | null
  emotions?: string | null
  /** Custom tags. A leading "!" marks a mistake tag (see src/lib/tags.ts). */
  tags?: string[] | null
  /** Per-trade costs. Stored `pnl` is already net of all three. */
  commission?: number
  fees?: number
  swap?: number
}

// ─── Hold time ───────────────────────────────────────────────

/** Duration buckets in minutes; the last one is open-ended. */
export const HOLD_TIME_BUCKETS: { key: string; label: string; maxMinutes: number }[] = [
  { key: 'under-5m', label: 'Under 5m', maxMinutes: 5 },
  { key: '5-15m', label: '5 to 15m', maxMinutes: 15 },
  { key: '15-60m', label: '15m to 1h', maxMinutes: 60 },
  { key: '1-4h', label: '1 to 4h', maxMinutes: 240 },
  { key: '4h-1d', label: '4h to 1 day', maxMinutes: 1440 },
  { key: 'over-1d', label: 'Over 1 day', maxMinutes: Infinity },
]

// Trades held longer than this are treated as bad timestamps, not positions.
const MAX_HOLD_MINUTES = 60 * 24 * 90

export interface HoldTimeStats {
  /** Trades with a usable entry and exit time. */
  sampleCount: number
  winCount: number
  lossCount: number
  medianWinMinutes: number | null
  medianLossMinutes: number | null
  avgWinMinutes: number | null
  avgLossMinutes: number | null
  /** Non-empty buckets in duration order. */
  buckets: GroupStat[]
}

function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function holdMinutes(t: AggregatableTrade): number | null {
  if (!t.entryTime || !t.exitTime) return null
  const a = t.entryTime.getTime(), b = t.exitTime.getTime()
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null
  const mins = (b - a) / 60000
  // Zero means the export carried a date but no clock; nothing to learn from it.
  if (mins <= 0 || mins > MAX_HOLD_MINUTES) return null
  return mins
}

/**
 * How long winners are held versus losers, and results by hold-time bucket.
 * Medians lead: one swing trade among scalps would drag an average past any
 * useful reading. Trades without a real duration are left out and counted
 * against `sampleCount`.
 */
export function computeHoldTimeStats(trades: AggregatableTrade[]): HoldTimeStats {
  const winMins: number[] = [], lossMins: number[] = []
  const accs = HOLD_TIME_BUCKETS.map(b => makeAcc(b.key))
  let sampleCount = 0
  for (const t of trades) {
    const mins = holdMinutes(t)
    if (mins === null) continue
    sampleCount++
    const pnl = safeNum(t.pnl)
    if (pnl > 0) winMins.push(mins)
    else if (pnl < 0) lossMins.push(mins)
    const idx = HOLD_TIME_BUCKETS.findIndex(b => mins < b.maxMinutes)
    pushTradeIntoAcc(accs[idx === -1 ? accs.length - 1 : idx], pnl, safeNum(t.riskReward))
  }
  const avg = (v: number[]) => v.length ? v.reduce((a, b) => a + b, 0) / v.length : null
  return {
    sampleCount,
    winCount: winMins.length,
    lossCount: lossMins.length,
    medianWinMinutes: median(winMins),
    medianLossMinutes: median(lossMins),
    avgWinMinutes: avg(winMins),
    avgLossMinutes: avg(lossMins),
    buckets: accs.filter(a => a.count > 0).map(finalizeAcc),
  }
}

// ─── Cost of trading ─────────────────────────────────────────

export interface CostStats {
  tradeCount: number
  /** Trades that recorded any commission, fee or swap. */
  tradesWithCosts: number
  /** Net + costs: what the trades made before the broker's cut. */
  grossPnl: number
  /** Commission + fees + swap, as a positive magnitude. */
  costs: number
  netPnl: number
  costPerTrade: number
  /** costs / gross P&L when gross is positive; null otherwise. */
  shareOfGrossProfit: number | null
  /** costs / |net P&L| when net is negative; null otherwise. */
  shareOfNetLoss: number | null
  /** Trades that were positive before costs and zero or negative after. */
  flippedByCosts: number
  /** Symbols ranked by total cost taken, most expensive first. */
  perSymbol: SymbolCost[]
}

export interface SymbolCost {
  symbol: string
  count: number
  costs: number
  costPerTrade: number
  netPnl: number
}

/**
 * What commissions, fees and swap did to the result. Stored `pnl` is net, so
 * gross is rebuilt as net + costs per trade. Swap can be a credit; costs are
 * summed signed and reported as the magnitude actually taken.
 */
export function computeCostStats(trades: AggregatableTrade[]): CostStats {
  let gross = 0, net = 0, costs = 0, withCosts = 0, flipped = 0
  const bySymbol = new Map<string, SymbolCost>()
  for (const t of trades) {
    const pnl = safeNum(t.pnl)
    const c = safeNum(t.commission) + safeNum(t.fees) + safeNum(t.swap)
    if (c !== 0) withCosts++
    const g = pnl + c
    gross += g
    net += pnl
    costs += c
    if (g > 0 && pnl <= 0) flipped++
    const key = t.symbol || 'Unknown'
    const sc = bySymbol.get(key) || { symbol: key, count: 0, costs: 0, costPerTrade: 0, netPnl: 0 }
    sc.count++; sc.costs += c; sc.netPnl += pnl
    bySymbol.set(key, sc)
  }
  const perSymbol = [...bySymbol.values()]
    .filter(sc => sc.costs > 0)
    .map(sc => ({ ...sc, costPerTrade: sc.costs / sc.count }))
    .sort((a, b) => b.costs - a.costs)
  return {
    tradeCount: trades.length,
    tradesWithCosts: withCosts,
    grossPnl: gross,
    costs,
    netPnl: net,
    costPerTrade: trades.length ? costs / trades.length : 0,
    shareOfGrossProfit: gross > 0 && costs > 0 ? costs / gross : null,
    shareOfNetLoss: net < 0 && costs > 0 ? costs / Math.abs(net) : null,
    flippedByCosts: flipped,
    perSymbol,
  }
}

/**
 * Trades carrying at least one mistake tag versus the rest. `avgPnl` is the
 * average per trade in money, so the gap between the two is what a mistake
 * costs on average; `taggedNetPnl` is the total left on the table.
 */
export interface MistakeImpact {
  taggedTrades: number
  cleanTrades: number
  taggedNetPnl: number
  taggedAvgPnl: number
  cleanAvgPnl: number
}

interface GroupAcc {
  key: string
  count: number
  wins: number
  losses: number
  netPnl: number
  sumWinPnl: number
  sumLossPnl: number // running NEGATIVE-or-zero sum of losing pnl
  rrSum: number // sum of PLANNED riskReward, only over trades with riskReward > 0
  rrCount: number // how many trades in this group have a planned R:R set
}

export interface GroupStat {
  key: string
  count: number
  winRate: number // 0..100
  netPnl: number
  avgPnl: number
  payoffRatio: number | null // avgWin / |avgLoss|, null when not computable
  avgPlannedRR: number | null // avg of riskReward>0 subset, null when none set
  rrSampleCount: number // how many trades had a planned R:R (honesty)
  significant: boolean // count >= SIGNIFICANCE_THRESHOLD
}

export interface TradeAggregates {
  hasEnoughData: boolean
  significanceThreshold: number
  avgWin: number
  avgLoss: number // positive magnitude
  payoffRatio: number | null
  avgPlannedRR: number | null
  rrSampleCount: number
  strategiesTagged: boolean
  perSymbol: GroupStat[]
  perStrategy: GroupStat[]
  perSide: GroupStat[]
  perWeekday: GroupStat[]
  perSession: GroupStat[]
  perEmotion: GroupStat[]
  /** Setup tags (mistake tags excluded), ranked by trade count, uncapped for tables. */
  perTag: GroupStat[]
  /** Mistake tags ("!" prefix), keyed without the marker, ranked by trade count. */
  perMistake: GroupStat[]
  /** Null until at least one trade carries a mistake tag. */
  mistakeImpact: MistakeImpact | null
  /** True when >= MIN_STRATEGY_TAGGED_RATIO of trades carry a setup tag. */
  tagsTagged: boolean
}

function makeAcc(key: string): GroupAcc {
  return { key, count: 0, wins: 0, losses: 0, netPnl: 0, sumWinPnl: 0, sumLossPnl: 0, rrSum: 0, rrCount: 0 }
}

function pushTradeIntoAcc(acc: GroupAcc, pnl: number, rr: number) {
  acc.count++
  acc.netPnl += pnl
  if (pnl > 0) { acc.wins++; acc.sumWinPnl += pnl }
  else if (pnl < 0) { acc.losses++; acc.sumLossPnl += pnl }
  // pnl === 0 counts toward count/netPnl but is neither win nor loss.
  if (Number.isFinite(rr) && rr > 0) { acc.rrSum += rr; acc.rrCount++ }
}

export function finalizeAcc(acc: GroupAcc): GroupStat {
  const avgWin = acc.wins > 0 ? acc.sumWinPnl / acc.wins : 0
  const avgLossAbs = acc.losses > 0 ? Math.abs(acc.sumLossPnl / acc.losses) : 0
  return {
    key: acc.key,
    count: acc.count,
    winRate: acc.count > 0 ? (acc.wins / acc.count) * 100 : 0,
    netPnl: acc.netPnl,
    avgPnl: acc.count > 0 ? acc.netPnl / acc.count : 0,
    // payoff ratio is only meaningful with at least one win AND one loss.
    payoffRatio: acc.wins > 0 && avgLossAbs > 0 ? avgWin / avgLossAbs : null,
    avgPlannedRR: acc.rrCount > 0 ? acc.rrSum / acc.rrCount : null,
    rrSampleCount: acc.rrCount,
    significant: acc.count >= SIGNIFICANCE_THRESHOLD,
  }
}

export function computeTradeAggregates(trades: AggregatableTrade[]): TradeAggregates {
  const symbolMap = new Map<string, GroupAcc>()
  const strategyMap = new Map<string, GroupAcc>()
  const sideMap = new Map<string, GroupAcc>()
  const weekdayMap = new Map<string, GroupAcc>()
  const sessionMap = new Map<string, GroupAcc>()
  const emotionMap = new Map<string, GroupAcc>()
  const tagMap = new Map<string, GroupAcc>()
  const mistakeMap = new Map<string, GroupAcc>()
  const mistakeTagged = makeAcc('mistake')
  const clean = makeAcc('clean')

  let strategiesTaggedCount = 0 // trades with a real (non-empty) strategy
  let tagsTaggedCount = 0 // trades with at least one setup tag
  let sumWinPnl = 0, winCount = 0
  let sumLossPnl = 0, lossCount = 0 // sumLossPnl kept negative
  let rrSum = 0, rrCount = 0

  for (const t of trades) {
    const pnl = safeNum(t.pnl)
    const rr = safeNum(t.riskReward) // 0 == "not computed"; only rr > 0 is counted

    if (pnl > 0) { sumWinPnl += pnl; winCount++ }
    else if (pnl < 0) { sumLossPnl += pnl; lossCount++ }
    if (rr > 0) { rrSum += rr; rrCount++ }

    const symKey = (t.symbol || 'Unknown').trim() || 'Unknown'
    if (!symbolMap.has(symKey)) symbolMap.set(symKey, makeAcc(symKey))
    pushTradeIntoAcc(symbolMap.get(symKey)!, pnl, rr)

    const rawStrat = (t.strategy || '').trim()
    const stratKey = rawStrat || 'Untagged'
    if (rawStrat) strategiesTaggedCount++
    if (!strategyMap.has(stratKey)) strategyMap.set(stratKey, makeAcc(stratKey))
    pushTradeIntoAcc(strategyMap.get(stratKey)!, pnl, rr)

    // Do NOT coerce a missing side to 'long'.
    const sideKey = t.side === 'short' ? 'short' : t.side === 'long' ? 'long' : 'unknown'
    if (!sideMap.has(sideKey)) sideMap.set(sideKey, makeAcc(sideKey))
    pushTradeIntoAcc(sideMap.get(sideKey)!, pnl, rr)

    // Time dimensions use the trade's local clock — session/weekday patterns
    // only mean something in the trader's own timezone.
    const when = t.exitTime instanceof Date && !isNaN(t.exitTime.getTime()) ? t.exitTime
      : t.entryTime instanceof Date && !isNaN(t.entryTime.getTime()) ? t.entryTime : null
    if (when) {
      const dayKey = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][when.getDay()]
      if (!weekdayMap.has(dayKey)) weekdayMap.set(dayKey, makeAcc(dayKey))
      pushTradeIntoAcc(weekdayMap.get(dayKey)!, pnl, rr)

      const h = when.getHours()
      const sessKey = h < 6 ? 'overnight (00-06)' : h < 12 ? 'morning (06-12)' : h < 18 ? 'afternoon (12-18)' : 'evening (18-24)'
      if (!sessionMap.has(sessKey)) sessionMap.set(sessKey, makeAcc(sessKey))
      pushTradeIntoAcc(sessionMap.get(sessKey)!, pnl, rr)
    }

    // A trade can carry several emotions — it counts once per emotion tag
    if (typeof t.emotions === 'string' && t.emotions.trim()) {
      for (const raw of t.emotions.split(',')) {
        const emoKey = raw.trim().toLowerCase()
        if (!emoKey) continue
        if (!emotionMap.has(emoKey)) emotionMap.set(emoKey, makeAcc(emoKey))
        pushTradeIntoAcc(emotionMap.get(emoKey)!, pnl, rr)
      }
    }

    // Tags: one trade counts once per tag, grouped case-insensitively (the
    // first spelling seen is the label). Mistake tags go to their own table,
    // and the trade as a whole lands in the mistake-vs-clean comparison.
    let hasSetupTag = false
    let hasMistakeTag = false
    if (Array.isArray(t.tags)) {
      const seen = new Set<string>()
      for (const raw of t.tags) {
        if (typeof raw !== 'string') continue
        const key = tagKey(raw)
        if (!key) continue
        const mistake = isMistakeTag(raw)
        const mapKey = `${mistake ? '!' : ''}${key}`
        if (seen.has(mapKey)) continue
        seen.add(mapKey)
        const map = mistake ? mistakeMap : tagMap
        if (!map.has(key)) map.set(key, makeAcc(tagLabel(raw)))
        pushTradeIntoAcc(map.get(key)!, pnl, rr)
        if (mistake) hasMistakeTag = true
        else hasSetupTag = true
      }
    }
    if (hasSetupTag) tagsTaggedCount++
    pushTradeIntoAcc(hasMistakeTag ? mistakeTagged : clean, pnl, rr)
  }

  // Rank by SAMPLE SIZE (trade count), never by raw dollar P&L.
  const byCount = (a: GroupStat, b: GroupStat) => b.count - a.count

  const perSymbol = Array.from(symbolMap.values())
    .map(finalizeAcc).sort(byCount).slice(0, MAX_BUCKETS)

  // Exclude 'Untagged' so the model cannot invent a "best strategy" from untagged trades.
  const perStrategy = Array.from(strategyMap.values())
    .map(finalizeAcc).filter(g => g.key !== 'Untagged').sort(byCount).slice(0, MAX_BUCKETS)

  // Keep long/short; drop 'unknown' from any long-vs-short claim.
  const perSide = Array.from(sideMap.values())
    .map(finalizeAcc).filter(g => g.key !== 'unknown').sort(byCount)

  const perWeekday = Array.from(weekdayMap.values()).map(finalizeAcc).sort(byCount)
  const perSession = Array.from(sessionMap.values()).map(finalizeAcc).sort(byCount)
  const perEmotion = Array.from(emotionMap.values()).map(finalizeAcc).sort(byCount).slice(0, MAX_BUCKETS)

  const perTag = Array.from(tagMap.values()).map(finalizeAcc).sort(byCount)
  const perMistake = Array.from(mistakeMap.values()).map(finalizeAcc).sort(byCount)
  const mistakeImpact: MistakeImpact | null = mistakeTagged.count > 0
    ? {
        taggedTrades: mistakeTagged.count,
        cleanTrades: clean.count,
        taggedNetPnl: mistakeTagged.netPnl,
        taggedAvgPnl: mistakeTagged.netPnl / mistakeTagged.count,
        cleanAvgPnl: clean.count > 0 ? clean.netPnl / clean.count : 0,
      }
    : null

  const avgWin = winCount > 0 ? sumWinPnl / winCount : 0
  const avgLossAbs = lossCount > 0 ? Math.abs(sumLossPnl / lossCount) : 0

  // Only surface strategy claims when enough trades are actually tagged.
  const strategiesTagged = trades.length > 0 &&
    strategiesTaggedCount / trades.length >= MIN_STRATEGY_TAGGED_RATIO
  const tagsTagged = trades.length > 0 &&
    tagsTaggedCount / trades.length >= MIN_STRATEGY_TAGGED_RATIO

  return {
    hasEnoughData: trades.length >= SIGNIFICANCE_THRESHOLD,
    significanceThreshold: SIGNIFICANCE_THRESHOLD,
    avgWin,
    avgLoss: avgLossAbs, // positive magnitude
    payoffRatio: winCount > 0 && avgLossAbs > 0 ? avgWin / avgLossAbs : null,
    avgPlannedRR: rrCount > 0 ? rrSum / rrCount : null,
    rrSampleCount: rrCount,
    strategiesTagged,
    perSymbol,
    perStrategy,
    perSide,
    perWeekday,
    perSession,
    perEmotion,
    perTag,
    perMistake,
    mistakeImpact,
    tagsTagged,
  }
}
