import { describe, expect, it } from 'vitest'
import { withTipKeys, relativeSizes } from './trading-coach'

describe('withTipKeys', () => {
  const a = { title: 'Stop Revenge Trades', message: 'Pause after every loss.' }
  const b = { title: 'Control Daily Overtrading', message: 'Stop at 10 trades.' }

  it('keys a tip by its wording, not its position', () => {
    const [first] = withTipKeys([a, b])
    const [, second] = withTipKeys([b, a])
    expect(first.key).toBe(second.key)
    expect(first.key).toMatch(/^ai-/)
  })

  it('gives different tips different keys', () => {
    const [x, y] = withTipKeys([a, b])
    expect(x.key).not.toBe(y.key)
  })

  it('suffixes exact duplicates so both can be hidden', () => {
    const [x, y] = withTipKeys([a, { ...a }])
    expect(y.key).toBe(`${x.key}-1`)
  })

  it('re-keys tips that still carry positional keys from an older cache', () => {
    const [t] = withTipKeys([{ ...a, key: 'ai-tip-0' }])
    expect(t.key).not.toBe('ai-tip-0')
  })
})

describe('relativeSizes', () => {
  it('compares each trade with the usual size for its own symbol', () => {
    // Usual sizes: gold 0.4 lots, EURUSD 1.5 lots. Neither is oversized.
    const sizes = relativeSizes([
      { symbol: 'XAUUSD', lotSize: 0.4 }, { symbol: 'EURUSD', lotSize: 1.5 },
      { symbol: 'XAUUSD', lotSize: 0.4 }, { symbol: 'EURUSD', lotSize: 1.5 },
    ])
    expect(sizes).toEqual([1, 1, 1, 1])
  })

  it('still spots a genuinely doubled position', () => {
    const sizes = relativeSizes([
      { symbol: 'EURUSD', lotSize: 1 }, { symbol: 'EURUSD', lotSize: 1 }, { symbol: 'EURUSD', lotSize: 2 },
    ])
    expect(sizes[2]).toBe(2)
  })

  it('returns 0 when the size is unknown', () => {
    expect(relativeSizes([{ symbol: 'EURUSD' }])).toEqual([0])
  })
})
