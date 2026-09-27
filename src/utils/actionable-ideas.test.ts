import { describe, it, expect } from 'vitest'
import { buildActionableIdeas, AFTER_LOSS_MINUTES, fmtHold, type IdeaTrade } from './actionable-ideas'

const fmt = (n: number) => `$${n.toFixed(0)}`
let seq = 0
// Weekday base so day-of-week rules do not see weekend groups by accident.
const base = new Date(2026, 8, 14, 9, 0) // Monday
const at = (dayOffset: number, hour: number, minute = 0) => new Date(2026, 8, 14 + dayOffset, hour, minute)
const mk = (over: Partial<IdeaTrade> & { held?: number }): IdeaTrade => {
  seq++
  const entry = over.entryTime ?? at(seq % 5, 9 + (seq % 4))
  const held = over.held ?? 30
  return { id: `t${seq}`, symbol: 'MES', side: 'long', pnl: 10, entryTime: entry, exitTime: new Date(entry.getTime() + held * 60000), ...over }
}
const ids = (t: IdeaTrade[]) => buildActionableIdeas(t, fmt).map(i => i.id)

describe('buildActionableIdeas', () => {
  it('returns nothing under five trades and never praises', () => {
    expect(buildActionableIdeas([mk({}), mk({}), mk({})], fmt)).toEqual([])
    const allGood = Array.from({ length: 10 }, () => mk({ pnl: 50, held: 20 }))
    expect(ids(allGood)).toEqual([])
  })

  it('flags losers held longer than winners and sizes it by the losses that overran', () => {
    const t = [
      ...Array.from({ length: 4 }, () => mk({ pnl: 40, held: 20 })),
      ...Array.from({ length: 4 }, () => mk({ pnl: -50, held: 90 })),
    ]
    const idea = buildActionableIdeas(t, fmt).find(i => i.id === 'hold:losers')!
    expect(idea.impact).toBe(200)
    expect(idea.evidence).toContain('1h 30m')
    expect(idea.evidence).toContain('20m')
  })

  it('flags trades that were only paying fees', () => {
    const t = [
      ...Array.from({ length: 3 }, () => mk({ pnl: -4, commission: 2.5, fees: 7.1 })), // gross +5.6 each
      ...Array.from({ length: 3 }, () => mk({ pnl: 30, commission: 2.5, fees: 7.1 })),
    ]
    const idea = buildActionableIdeas(t, fmt).find(i => i.id === 'costs:flipped')!
    expect(idea.impact).toBeCloseTo(28.8, 5)
    expect(idea.evidence).toMatch(/^3 trades made money before costs/)
  })

  it('flags the reactive trade after a loss only when it does worse', () => {
    const t: IdeaTrade[] = []
    for (let d = 0; d < 4; d++) {
      const loss = mk({ pnl: -30, entryTime: at(d, 9), held: 10 })                       // exits 09:10
      const quick = mk({ pnl: -25, entryTime: at(d, 9, 10 + AFTER_LOSS_MINUTES - 5), held: 10 }) // within window
      const calm = mk({ pnl: 40, entryTime: at(d, 13), held: 10 })
      t.push(loss, quick, calm)
    }
    const idea = buildActionableIdeas(t, fmt).find(i => i.id === 'behaviour:after-loss')!
    expect(idea.impact).toBe(100)
    expect(idea.evidence).toContain('4 trades went in within 15 minutes of a loss')
  })

  it('flags heavy days that lose against light days that win', () => {
    const t: IdeaTrade[] = []
    for (let d = 0; d < 5; d++) t.push(mk({ pnl: 30, entryTime: at(d, 10) }))                      // 1 trade/day, green
    for (let d = 7; d < 9; d++) for (let k = 0; k < 5; k++) t.push(mk({ pnl: -12, entryTime: at(d, 11 + k) })) // two heavy red days
    const idea = buildActionableIdeas(t, fmt).find(i => i.id === 'behaviour:overtrading')!
    expect(idea.impact).toBe(120)
    expect(idea.action).toContain('Cap yourself at')
  })

  it('names the losing weekday, symbol, strategy, hour and side with the winning counterpart', () => {
    const t = [
      ...Array.from({ length: 4 }, () => mk({ pnl: -40, symbol: 'MGC', strategy: 'Reversal', side: 'short', entryTime: at(4, 15) })), // Friday 15:00
      ...Array.from({ length: 6 }, (_, i) => mk({ pnl: 50, symbol: 'MES', strategy: 'Trend', side: 'long', entryTime: at(i % 4, 9) })),
    ]
    const ideas = buildActionableIdeas(t, fmt)
    const byId = Object.fromEntries(ideas.map(i => [i.id, i]))
    expect(byId['weekday:Friday'].evidence).toContain('Every other day is green')
    expect(byId['symbol:MGC'].evidence).toContain('while MES made $300')
    expect(byId['strategy:Reversal'].action).toContain('"Trend"')
    expect(byId['hour:15:00'].evidence).toContain('best hour is 09:00')
    expect(byId['side:short'].title).toBe('Shorts lose, longs win')
    expect(ideas.every(i => i.impact === 160)).toBe(true)
  })

  it('needs three trades in a group before it speaks', () => {
    const t = [
      mk({ pnl: -500, symbol: 'MGC', entryTime: at(4, 15) }),  // one bad Friday MGC trade
      ...Array.from({ length: 6 }, (_, i) => mk({ pnl: 20, entryTime: at(i % 4, 9) })),
    ]
    const found = ids(t)
    expect(found).not.toContain('symbol:MGC')
    expect(found).not.toContain('weekday:Friday')
  })

  it('ranks by money at stake, largest first', () => {
    const t = [
      ...Array.from({ length: 3 }, () => mk({ pnl: -30, symbol: 'MGC', entryTime: at(0, 9) })),       // symbol 90
      ...Array.from({ length: 3 }, () => mk({ pnl: -100, symbol: 'MNQ', entryTime: at(1, 9) })),      // symbol 300, Tuesday 300
      ...Array.from({ length: 6 }, (_, i) => mk({ pnl: 80, symbol: 'MES', entryTime: at(2 + (i % 2), 13) })),
    ]
    const ideas = buildActionableIdeas(t, fmt)
    expect(ideas[0].impact).toBeGreaterThanOrEqual(ideas[ideas.length - 1].impact)
    expect(ideas.find(i => i.id === 'symbol:MNQ')!.impact).toBe(300)
    expect(ideas.find(i => i.id === 'symbol:MGC')).toBeUndefined() // only the worst symbol is named
  })

  it('formats hold times the way a trader says them', () => {
    expect(fmtHold(12)).toBe('12m')
    expect(fmtHold(65)).toBe('1h 05m')
    expect(fmtHold(1500)).toBe('1d 1h')
  })
})
