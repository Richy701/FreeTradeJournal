import { describe, expect, it } from 'vitest'
import { activationWorkflow, firstTradeReviewEligible } from '../src/onboarding-emails'

const now = Date.parse('2026-10-13T12:00:00Z')
const user = { email: 'trader@example.com', firstTradeLoggedAt: { toMillis: () => now - 86400000 } }
describe('first-trade follow-up eligibility', () => {
  it('waits a day and never catches up old or future activations', () => {
    expect(firstTradeReviewEligible(user, now)).toBe(true)
    for (const age of [-1, 0, 86399999, 172800000, 864000000, NaN]) {
      expect(firstTradeReviewEligible({ ...user, firstTradeLoggedAt: { toMillis: () => now - age } }, now)).toBe(false)
    }
  })
  it('suppresses opted-out, throttled, already-sent and unactivated users', () => {
    for (const overrides of [{ emailOptOut: true }, { signupThrottled: true }, { firstTradeReviewSentAt: now }, { email: '' }, { firstTradeLoggedAt: undefined }]) {
      expect(firstTradeReviewEligible({ ...user, ...overrides }, now)).toBe(false)
    }
  })
})
describe('staged activation workflow', () => {
  it('sends only two reminders and exits if a trade event arrives at either wait', () => {
    const flow = activationWorkflow('entry-template', 'support-template')
    expect(flow.steps.filter(step => step.type === 'send_email')).toHaveLength(2)
    for (const key of ['wait_entry', 'wait_support']) {
      expect(flow.connections.filter(edge => edge.from === key).map(edge => edge.type)).toEqual(['timeout'])
    }
    for (const key of ['entry', 'support']) {
      expect(flow.connections.filter(edge => edge.to === key).map(edge => edge.type)).toEqual(['condition_met'])
    }
  })
})
