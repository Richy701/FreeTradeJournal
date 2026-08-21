import { describe, it, expect } from 'vitest'
import { buildSessionReview, buildJournalDraft } from './session-review'
import type { RiskRule } from './risk-rules'

// Local constructors on both sides keep these timezone-independent.
const at = (day: number, hour: number) => new Date(2026, 6, day, hour, 0, 0)
const NOW = new Date(2026, 6, 20, 17, 0, 0)
const trade = (day: number, hour: number, pnl: number) => ({ exitTime: at(day, hour), pnl })
const rule = (type: RiskRule['type'], value: number, enabled = true): RiskRule =>
  ({ id: type, type, value, enabled })

describe('buildSessionReview', () => {
  it('returns nothing when today has no trades', () => {
    const review = buildSessionReview([rule('maxLossPerDay', 500)], [trade(19, 10, -100)], NOW)
    expect(review).toBeNull()
  })

  it('counts only today, not yesterday', () => {
    const trades = [trade(19, 10, -400), trade(20, 9, -50), trade(20, 14, 120)]
    const review = buildSessionReview([rule('maxLossPerDay', 500)], trades, NOW)!

    expect(review.tradeCount).toBe(2)
    expect(review.pnl).toBe(70)
    expect(review.winCount).toBe(1)
    expect(review.lossCount).toBe(1)
    expect(review.worstLoss).toBe(50)
  })

  it('reports headroom left on the daily limit', () => {
    const trades = [trade(20, 9, -300), trade(20, 11, -170)]
    const review = buildSessionReview([rule('maxLossPerDay', 500)], trades, NOW)!

    const daily = review.limits.find(l => l.type === 'maxLossPerDay')!
    expect(daily.used).toBe(470)
    expect(daily.remaining).toBe(30)
    expect(daily.crossed).toBe(false)
    expect(daily.nearMiss).toBe(true)
  })

  it('does not call a comfortable day a near miss', () => {
    const trades = [trade(20, 9, -100)]
    const review = buildSessionReview([rule('maxLossPerDay', 500)], trades, NOW)!

    expect(review.limits[0].nearMiss).toBe(false)
    expect(review.limits[0].crossed).toBe(false)
    expect(review.limits[0].remaining).toBe(400)
  })

  it('flags a crossed limit and leaves no headroom', () => {
    const trades = [trade(20, 9, -800)]
    const review = buildSessionReview([rule('maxLossPerDay', 500)], trades, NOW)!

    const daily = review.limits.find(l => l.type === 'maxLossPerDay')!
    expect(daily.crossed).toBe(true)
    expect(daily.remaining).toBe(0)
    expect(daily.nearMiss).toBe(false)
  })

  it('puts the tightest limit first', () => {
    // Day loss 200 of 1000 (20%), worst trade 180 of 200 (90%).
    const trades = [trade(20, 9, -180), trade(20, 12, -20)]
    const review = buildSessionReview(
      [rule('maxLossPerDay', 1000), rule('maxLossPerTrade', 200)],
      trades,
      NOW
    )!

    expect(review.tightest!.type).toBe('maxLossPerTrade')
    expect(review.tightest!.nearMiss).toBe(true)
  })

  it('catches an oversized trade on a day that finished green', () => {
    const trades = [trade(20, 9, -260), trade(20, 15, 500)]
    const review = buildSessionReview(
      [rule('maxLossPerDay', 500), rule('maxLossPerTrade', 250)],
      trades,
      NOW
    )!

    expect(review.pnl).toBe(240)
    expect(review.limits.find(l => l.type === 'maxLossPerTrade')!.crossed).toBe(true)
  })

  it('counts earlier days this month that crossed, and how many ended red', () => {
    const trades = [
      trade(3, 10, -900),           // crossed, red
      trade(8, 10, -700),           // crossed, red
      trade(12, 9, -600),           // crossed on the day...
      trade(12, 15, 1200),          // ...but the day finished green
      trade(15, 10, -100),          // clean
      trade(20, 10, -450),          // today
    ]
    const review = buildSessionReview(
      [rule('maxLossPerDay', 500), rule('maxLossPerTrade', 500)],
      trades,
      NOW
    )!

    expect(review.priorCrossedDays).toBe(3)
    expect(review.priorCrossedDaysRed).toBe(2)
  })

  it('ignores days from last month', () => {
    const trades = [
      { exitTime: new Date(2026, 5, 10, 10, 0), pnl: -900 }, // June, crossed
      trade(20, 10, -100),                                    // today
    ]
    const review = buildSessionReview([rule('maxLossPerDay', 500)], trades, NOW)!

    expect(review.priorCrossedDays).toBe(0)
  })

  it('works with no limits set at all', () => {
    const review = buildSessionReview([], [trade(20, 10, -100)], NOW)!

    expect(review.tradeCount).toBe(1)
    expect(review.limits).toEqual([])
    expect(review.tightest).toBeUndefined()
  })

  it('ignores disabled limits', () => {
    const review = buildSessionReview(
      [rule('maxLossPerDay', 100, false)],
      [trade(20, 10, -900)],
      NOW
    )!

    expect(review.limits).toEqual([])
  })
})

describe('buildJournalDraft', () => {
  const money = (v: number) => `$${v.toFixed(0)}`
  const draftFor = (rules: RiskRule[], trades: Array<{ exitTime: Date; pnl: number }>) =>
    buildJournalDraft(buildSessionReview(rules, trades, NOW)!, money, NOW)

  it('opens with the day and result', () => {
    const d = draftFor([], [trade(20, 9, -80), trade(20, 11, -50)])
    expect(d.content.split('\n')[0]).toBe('2 trades today for -$130.')
  })

  it('says nothing about limits on a comfortable day', () => {
    const d = draftFor([rule('maxLossPerDay', 500)], [trade(20, 9, -50)])
    expect(d.content).toBe('1 trade today for -$50.\n\n')
  })

  it('writes the near miss in first person', () => {
    const d = draftFor([rule('maxLossPerDay', 150)], [trade(20, 9, -130)])
    expect(d.content).toContain('Came within $20 of my max daily loss of $150.')
  })

  it('writes a crossed limit and counts it against the month', () => {
    const trades = [
      trade(4, 10, -900),   // crossed, earlier this month
      trade(11, 10, -900),  // crossed, earlier this month
      trade(20, 10, -700),  // today, crossed
    ]
    const d = draftFor([rule('maxLossPerDay', 500)], trades)
    expect(d.content).toContain('Went past my max daily loss of $500, reaching $700.')
    expect(d.content).toContain('That is the 3rd day this month I have crossed a limit.')
  })

  it('does not count the month when today is the first crossing', () => {
    const d = draftFor([rule('maxLossPerDay', 500)], [trade(20, 10, -700)])
    expect(d.content).not.toContain('day this month')
  })

  it('mentions earlier crossings when today only came close', () => {
    const trades = [trade(4, 10, -900), trade(20, 10, -130)]
    const d = draftFor([rule('maxLossPerDay', 150)], trades)
    expect(d.content).toContain('I have crossed a limit on 1 other day this month.')
  })

  it('ends with a blank line so the cursor lands below the facts', () => {
    const d = draftFor([rule('maxLossPerDay', 500)], [trade(20, 9, -50)])
    expect(d.content.endsWith('\n\n')).toBe(true)
  })

  it('handles 11th, 12th and 13th correctly', () => {
    const trades = [
      ...Array.from({ length: 12 }, (_, i) => trade(i + 1, 10, -900)),
      trade(20, 10, -900),
    ]
    const d = draftFor([rule('maxLossPerDay', 500)], trades)
    expect(d.content).toContain('the 13th day this month')
  })

  it('titles the entry with the date', () => {
    const d = draftFor([], [trade(20, 9, -50)])
    expect(d.title).toContain('20')
  })
})
