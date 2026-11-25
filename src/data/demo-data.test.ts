import { describe, expect, it } from 'vitest'
import { DEMO_ACCOUNT, DEMO_ACCOUNT_ID, DEMO_TRADES, DEMO_STATS, DEMO_JOURNAL_ENTRIES, DEMO_TRADING_RISK_RULES } from './demo-data'
import { DEMO_TRADE_IDEAS } from './demo-trade-ideas'
import { DEMO_AI_TRADE_COUNT, getDemoAIResponse } from '@/lib/demo-ai'
import { calculateGrossPnl } from '@/lib/pnl'

describe('example journal', () => {
  it('reconciles prices, position size, fees and account balance', () => {
    for (const trade of DEMO_TRADES) {
      const gross = calculateGrossPnl({ symbol: trade.symbol, market: 'forex', side: trade.side, entryPrice: trade.entryPrice, exitPrice: trade.exitPrice, quantity: trade.lotSize })
      expect(trade.pnl).toBeCloseTo(gross - trade.commission, 1)
      expect(trade.accountId).toBe(DEMO_ACCOUNT_ID)
      expect([0, 6]).not.toContain(new Date(trade.date).getDay())
    }
    const net = DEMO_TRADES.reduce((sum, trade) => sum + trade.pnl, 0)
    expect(DEMO_STATS.netProfit).toBeCloseTo(net, 2)
    expect(DEMO_ACCOUNT.currentBalance).toBeCloseTo(DEMO_ACCOUNT.startingBalance + net, 2)
    expect(DEMO_STATS.winningTrades + DEMO_STATS.losingTrades).toBe(DEMO_TRADES.length)
  })

  // The demo should read as an established, profitable trader, not a hype
  // reel: real losing weeks, real mistakes, and the patterns the journal notes
  // and prewritten coach text describe. If a change to the generator breaks
  // one of these, re-run the seed search rather than loosening the check.
  it('looks like an established trader with believable results', () => {
    expect(DEMO_TRADES.length).toBeGreaterThanOrEqual(100)
    expect(DEMO_STATS.winRate).toBeGreaterThanOrEqual(48)
    expect(DEMO_STATS.winRate).toBeLessThanOrEqual(58)
    expect(DEMO_STATS.profitFactor).toBeGreaterThanOrEqual(1.5)
    expect(DEMO_STATS.profitFactor).toBeLessThanOrEqual(2.2)
    expect(DEMO_STATS.netProfit).toBeGreaterThan(8000)
    expect(DEMO_STATS.netProfit).toBeLessThan(15000)
    expect(new Set(DEMO_TRADES.map(t => t.symbol)).size).toBeGreaterThanOrEqual(5)
  })

  it('has the patterns the journal and coach text talk about', () => {
    const bySymbol = new Map<string, number>()
    for (const t of DEMO_TRADES) bySymbol.set(t.symbol, (bySymbol.get(t.symbol) ?? 0) + t.pnl)
    const ranked = [...bySymbol].sort((a, b) => b[1] - a[1])
    expect(ranked[0][0]).toBe('XAUUSD')
    expect(bySymbol.get('GBPUSD')!).toBeLessThan(0)
    const late = DEMO_TRADES.filter(t => t.entryTime.getHours() * 60 + t.entryTime.getMinutes() >= 16 * 60 + 10)
    expect(late.reduce((sum, t) => sum + t.pnl, 0)).toBeLessThan(0)
    expect(DEMO_TRADES.some(t => t.tags?.includes('!revenge'))).toBe(true)
    // Some days cross the daily loss limit, so the Risk section has something to show.
    const dailyLimit = DEMO_TRADING_RISK_RULES.find(r => r.type === 'maxLossPerDay')!.value
    const byDay = new Map<string, number>()
    for (const t of DEMO_TRADES) byDay.set(t.exitTime.toDateString(), (byDay.get(t.exitTime.toDateString()) ?? 0) + t.pnl)
    expect([...byDay.values()].some(v => v < -dailyLimit)).toBe(true)
  })

  it('links reflections and published outcomes to actual example trades', () => {
    expect(DEMO_JOURNAL_ENTRIES.length).toBeGreaterThanOrEqual(8)
    // One note per trade: two entries on the same trade looked like a copy-paste.
    expect(new Set(DEMO_JOURNAL_ENTRIES.map(e => e.tradeId)).size).toBe(DEMO_JOURNAL_ENTRIES.length)
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
    expect(analysis).toContain(DEMO_STATS.netProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
    expect(analysis).toContain(`${DEMO_TRADES.length} trades`)
  })
})
