import { describe, it, expect } from 'vitest'
import { computeRuleAdherence, MIN_ADHERENCE_DAYS, type RiskRule } from './risk-rules'

// Local constructors on both sides keep these tests timezone-independent:
// the fixtures and the day-grouping agree whatever TZ the runner uses.
const at = (day: number, hour: number) => new Date(2026, 6, day, hour, 0, 0)
const NOW = new Date(2026, 6, 20, 12, 0, 0)

const rule = (type: RiskRule['type'], value: number, enabled = true): RiskRule =>
  ({ id: type, type, value, enabled })

const trade = (day: number, hour: number, pnl: number) => ({ exitTime: at(day, hour), pnl })

describe('computeRuleAdherence', () => {
  it('splits days by whether the daily loss limit was crossed', () => {
    const trades = [
      trade(1, 10, -50),    // inside
      trade(2, 10, 200),    // inside
      trade(3, 10, -600),   // broken
      trade(4, 10, -100),   // inside
      trade(5, 10, -900),   // broken
      trade(6, 10, 300),    // inside
      trade(7, 10, -700),   // broken
    ]
    const stats = computeRuleAdherence([rule('maxLossPerDay', 500)], trades, NOW)

    expect(stats.followed.days).toBe(4)
    expect(stats.broken.days).toBe(3)
    expect(stats.comparable).toBe(true)
    expect(stats.broken.totalPnl).toBe(-2200)
    expect(stats.followed.totalPnl).toBe(350)
  })

  it('judges the running total within the day, not each trade alone', () => {
    // Three losses that only breach once added together.
    const trades = [trade(1, 9, -200), trade(1, 11, -200), trade(1, 14, -200)]
    const stats = computeRuleAdherence([rule('maxLossPerDay', 500)], trades, NOW)

    expect(stats.days).toHaveLength(1)
    expect(stats.days[0].pnl).toBe(-600)
    expect(stats.days[0].brokenRuleTypes).toEqual(['maxLossPerDay'])
  })

  it('still counts a day that hit the limit and then clawed back', () => {
    // The live monitor toasted at 10:00. The day ending at -300 does not undo that.
    const trades = [trade(1, 10, -600), trade(1, 14, 300)]
    const stats = computeRuleAdherence([rule('maxLossPerDay', 500)], trades, NOW)

    expect(stats.days[0].pnl).toBe(-300)
    expect(stats.days[0].brokenRuleTypes).toEqual(['maxLossPerDay'])
  })

  it('flags every fresh drawdown episode, not only the first in the account', () => {
    const trades = [
      trade(1, 10, 1000),   // peak 1000
      trade(2, 10, -700),   // dd 700, crosses 600
      trade(3, 10, 2000),   // new peak 2300, drawdown back to 0
      trade(4, 10, -1000),  // dd 1000 from the new peak, crosses again
    ]
    const stats = computeRuleAdherence([rule('maxDrawdown', 600)], trades, NOW)

    const brokenDates = stats.days
      .filter(d => d.brokenRuleTypes.includes('maxDrawdown'))
      .map(d => d.date.getDate())
    expect(brokenDates).toEqual([2, 4])
  })

  it('uses the tighter value when the same limit is set twice', () => {
    const trades = [trade(1, 10, -400)]
    const stats = computeRuleAdherence(
      [rule('maxLossPerDay', 500), { id: 'dup', type: 'maxLossPerDay', value: 300, enabled: true }],
      trades,
      NOW
    )

    expect(stats.days[0].brokenRuleTypes).toEqual(['maxLossPerDay'])
  })

  it('is not comparable when the followed side is the thin one', () => {
    const trades = [
      trade(1, 10, 100), trade(2, 10, 100),
      ...Array.from({ length: MIN_ADHERENCE_DAYS }, (_, i) => trade(10 + i, 10, -900)),
    ]
    const stats = computeRuleAdherence([rule('maxLossPerDay', 500)], trades, NOW)

    expect(stats.followed.days).toBe(2)
    expect(stats.comparable).toBe(false)
  })

  it('catches an oversized single trade on a day that finished green', () => {
    const trades = [trade(1, 9, -400), trade(1, 15, 900)]
    const stats = computeRuleAdherence(
      [rule('maxLossPerDay', 1000), rule('maxLossPerTrade', 300)],
      trades,
      NOW
    )

    expect(stats.days[0].pnl).toBe(500)
    expect(stats.days[0].brokenRuleTypes).toEqual(['maxLossPerTrade'])
  })

  it('blames the day drawdown crossed, not every day after it', () => {
    const trades = [
      trade(1, 10, 1000),   // peak 1000
      trade(2, 10, -300),   // dd 300
      trade(3, 10, -400),   // dd 700, crosses 600 here
      trade(4, 10, -100),   // dd 800, still under water but not a new crossing
      trade(5, 10, -100),   // dd 900, likewise
    ]
    const stats = computeRuleAdherence([rule('maxDrawdown', 600)], trades, NOW)

    const brokenDates = stats.days
      .filter(d => d.brokenRuleTypes.includes('maxDrawdown'))
      .map(d => d.date.getDate())
    expect(brokenDates).toEqual([3])
    expect(stats.broken.days).toBe(1)
    expect(stats.followed.days).toBe(4)
  })

  it('excludes today, which is still open', () => {
    const trades = [
      trade(18, 10, -100),
      trade(19, 10, -100),
      trade(20, 9, -5000), // today, and a breach
    ]
    const stats = computeRuleAdherence([rule('maxLossPerDay', 500)], trades, NOW)

    expect(stats.days).toHaveLength(2)
    expect(stats.broken.days).toBe(0)
  })

  it('ignores disabled limits and zero-valued ones', () => {
    const trades = [trade(1, 10, -900), trade(2, 10, -900)]
    const stats = computeRuleAdherence(
      [rule('maxLossPerDay', 500, false), rule('maxLossPerTrade', 0)],
      trades,
      NOW
    )

    expect(stats.broken.days).toBe(0)
    expect(stats.followed.days).toBe(2)
    expect(stats.comparable).toBe(false) // no active limits to compare against
  })

  it('reports win rate and average per day for each bucket', () => {
    const trades = [
      trade(1, 10, 100), trade(2, 10, 300), trade(3, 10, -50), trade(4, 10, 50),
      trade(5, 10, -600), trade(6, 10, -800), trade(7, 10, -1000),
    ]
    const stats = computeRuleAdherence([rule('maxLossPerDay', 500)], trades, NOW)

    expect(stats.followed.winRate).toBe(75)   // 3 of 4 green
    expect(stats.followed.avgPnl).toBe(100)   // 400 / 4
    expect(stats.broken.winRate).toBe(0)
    expect(stats.broken.avgPnl).toBe(-800)    // -2400 / 3
  })

  it('is not comparable until both buckets have enough days', () => {
    const trades = [
      trade(1, 10, 100), trade(2, 10, 100), trade(3, 10, 100), trade(4, 10, 100),
      ...Array.from({ length: MIN_ADHERENCE_DAYS - 1 }, (_, i) => trade(10 + i, 10, -900)),
    ]
    const stats = computeRuleAdherence([rule('maxLossPerDay', 500)], trades, NOW)

    expect(stats.broken.days).toBe(MIN_ADHERENCE_DAYS - 1)
    expect(stats.comparable).toBe(false)
  })

  it('survives trades with missing or unusable exit times', () => {
    const trades = [
      trade(1, 10, 100),
      { exitTime: undefined, pnl: -9999 },
      { exitTime: 'not a date', pnl: -9999 },
      trade(2, 10, -900),
    ]
    const stats = computeRuleAdherence([rule('maxLossPerDay', 500)], trades, NOW)

    expect(stats.days).toHaveLength(2)
    expect(stats.followed.totalPnl).toBe(100)
    expect(stats.broken.totalPnl).toBe(-900)
  })
})
