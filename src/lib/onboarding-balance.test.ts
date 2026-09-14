import { describe, expect, it } from 'vitest'
import { parseOnboardingBalance } from './onboarding-balance'

describe('onboarding starting balance', () => {
  it.each(['0', '0.00', ' 0 '])('preserves zero entered as %s', value => {
    expect(parseOnboardingBalance(value)).toBe(0)
  })
  it.each(['', ' ', '12oops', 'Infinity', 'NaN', '1e999', '0x10'])('rejects invalid input %s without inventing a balance', value => {
    expect(parseOnboardingBalance(value)).toBeNull()
  })
  it('preserves finite decimal balances, including an overdrawn account', () => {
    expect(parseOnboardingBalance('1234.56')).toBe(1234.56)
    expect(parseOnboardingBalance('-25.50')).toBe(-25.5)
  })
})
