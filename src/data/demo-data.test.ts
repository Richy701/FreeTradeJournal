import { describe, expect, it } from 'vitest'
import { DEMO_ACCOUNT, DEMO_ACCOUNT_ID, DEMO_TRADES, DEMO_STATS, DEMO_JOURNAL_ENTRIES } from './demo-data'
import { DEMO_TRADE_IDEAS } from './demo-trade-ideas'
import { DEMO_AI_TRADE_COUNT, getDemoAIResponse } from '@/lib/demo-ai'

describe('practice journal examples', () => {
  it('reconciles prices, position size, fees and account balance', () => {
    for (const trade of DEMO_TRADES) {
      const gross = (trade.exitPrice - trade.entryPrice) * trade.quantity * (trade.side === 'long' ? 1 : -1)
      expect(trade.pnl).toBeCloseTo(gross - trade.commission, 2)
      expect(trade.accountId).toBe(DEMO_ACCOUNT_ID)
      expect([0, 6]).not.toContain(new Date(trade.date).getDay())
    }
    const net = DEMO_TRADES.reduce((sum, trade) => sum + trade.pnl, 0)
    expect(DEMO_STATS.netProfit).toBeCloseTo(net, 2)
    expect(DEMO_ACCOUNT.currentBalance).toBeCloseTo(DEMO_ACCOUNT.startingBalance + net, 2)
    expect(DEMO_STATS.winningTrades + DEMO_STATS.losingTrades).toBe(DEMO_TRADES.length)
  })
  it('links reflections and published outcomes to actual example trades', () => {
    for (const entry of DEMO_JOURNAL_ENTRIES) {
      expect(DEMO_TRADES.some(trade => trade.id === entry.tradeId)).toBe(true)
      expect(entry.accountId).toBe(DEMO_ACCOUNT_ID)
    }
    for (const idea of DEMO_TRADE_IDEAS) {
      const trade = DEMO_TRADES.find(trade => trade.id === idea.outcome?.tradeId)!
      expect(trade).toBeDefined()
      expect(idea.symbol).toBe(trade.symbol)
      expect(idea.outcome?.pnl).toBe(trade.pnl)
    }
  })
  it('labels prewritten coaching and uses the current example totals', () => {
    expect(DEMO_AI_TRADE_COUNT).toBe(DEMO_TRADES.length)
    const analysis = getDemoAIResponse('analysis', null)
    expect(analysis).toContain('prewritten')
    expect(analysis).toContain(`${DEMO_STATS.netProfit.toFixed(2)}`)
    expect(analysis).toContain(`${DEMO_TRADES.length} trades`)
  })
})
