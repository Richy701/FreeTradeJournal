import { describe, expect, it } from 'vitest'
import { withTipKeys } from './trading-coach'

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
