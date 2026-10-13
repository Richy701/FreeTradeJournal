import { describe, expect, it } from 'vitest'
import { weeklyDigestStats } from '../src/weekly-digest-data'

const start = Date.parse('2026-10-05T08:00:00Z')
const end = Date.parse('2026-10-12T08:00:00Z')
const trades = [{ date: '2026-10-06', pnl: 100, accountId: 'usd' }, { date: '2026-10-07', pnl: -20, accountId: 'gbp' }, { date: '2026-10-08', pnl: -10, accountId: 'gbp' }]
const accounts = JSON.stringify([{ id: 'usd', currency: 'USD' }, { id: 'gbp', currency: 'GBP' }])
describe('weekly digest accuracy', () => {
  it('keeps totals and best trades separate by currency, including an all-loss currency', () => {
    const result = weeklyDigestStats(JSON.stringify(trades), null, accounts, start, end)
    expect(result).toEqual({ tradeCount: 3, winRate: 33, pnl: 'GBP −30.00 · USD +100.00', bestTrade: 'GBP −10.00 · USD +100.00', multipleCurrencies: true })
  })
  it('distinguishes genuinely empty data from missing or corrupt data', () => {
    expect(weeklyDigestStats('[]', null, null, start, end).tradeCount).toBe(0)
    for (const value of [null, '', '{}', 'invalid']) expect(() => weeklyDigestStats(value, null, null, start, end)).toThrow()
    expect(() => weeklyDigestStats(JSON.stringify(trades), null, 'invalid', start, end)).toThrow()
    expect(() => weeklyDigestStats(JSON.stringify(trades), null, null, start, end)).toThrow('currency unavailable')
  })
  it('does not include future trades in the current recap', () => {
    expect(weeklyDigestStats(JSON.stringify([{ date: '2026-10-13', pnl: 500 }]), null, null, start, end).tradeCount).toBe(0)
  })
  it('does not merge currencies sharing the yen symbol', () => {
    const result = weeklyDigestStats(JSON.stringify(trades.slice(0, 2)), null, JSON.stringify([{ id: 'usd', currency: 'JPY' }, { id: 'gbp', currency: 'CNY' }]), start, end)
    expect(result.pnl).toBe('CNY −20.00 · JPY +100.00')
    expect(result.multipleCurrencies).toBe(true)
  })
})
