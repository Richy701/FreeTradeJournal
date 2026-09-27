import { describe, it, expect } from 'vitest'
import { buildChartData, buildSummaryStats, type ParsedTrade } from './use-trade-ideas'

let seq = 0
// Mon-Fri only: weekend trades would create day-of-week groups of their own.
const at = (dayOffset: number, hour: number) => new Date(2026, 8, 14 + dayOffset, hour, 0)
const mk = (over: Partial<ParsedTrade>): ParsedTrade => {
  const entry = over.entryTime ?? at(seq % 5, 9 + (seq % 3))
  seq++
  return { id: `t${seq}`, symbol: 'MES', side: 'long', pnl: 10, entryTime: entry, exitTime: new Date(entry.getTime() + 30 * 60000), ...over }
}
const run = (trades: ParsedTrade[]) => {
  const charts = buildChartData(trades)
  return { charts, summary: buildSummaryStats(charts, trades) }
}

describe('insight minimum samples', () => {
  it('does not build the summary around a symbol with fewer than the minimum trades', () => {
    const trades = [
      mk({ symbol: 'MGC', pnl: 900 }),                                  // one lucky trade
      ...Array.from({ length: 6 }, (_, i) => mk({ symbol: 'MES', pnl: i % 2 ? 20 : -10 })),
    ]
    expect(run(trades).summary.bestSymbol).toBe('MES')
  })

  it('never scores a steady loser as consistent', () => {
    const trades = Array.from({ length: 10 }, (_, i) => mk({ pnl: -25, entryTime: at(i % 5, 10) }))
    const { summary } = run(trades)
    const consistency = summary.traderProfile.find(p => p.metric === 'Consistency')!.value
    expect(consistency).toBeLessThan(40)
  })

  it('keeps a single-day account at the middle rather than a high default', () => {
    const trades = Array.from({ length: 6 }, () => mk({ pnl: 15, entryTime: at(0, 10) }))
    const { summary } = run(trades)
    expect(summary.traderProfile.find(p => p.metric === 'Consistency')!.value).toBe(50)
  })
})
