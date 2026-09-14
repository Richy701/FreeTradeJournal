import { describe, expect, it } from 'vitest'
import { approvalMatches, eligibleRecipient, makeRoundup, previousMonth, publicUrl, roundupCandidates } from '../src/monthly-roundup-data'
import type { ReleaseEntry } from '../src/monthly-roundup-data'

describe('monthly roundup selection', () => {
  it('uses the previous complete calendar month across year boundaries', () => {
    expect(previousMonth(new Date('2027-01-01T09:00:00Z'))).toBe('2026-12')
  })
  it('selects the requested month, deduplicates titles and respects editorial exclusions', () => {
    const entries: ReleaseEntry[] = [
      { version: '2', date: '2026-08-31', summary: '', items: [{ type: 'new', text: 'Import' }, { type: 'fixed', text: 'Fix' }, { type: 'new', text: 'Expired offer', roundup: false }] },
      { version: '1', date: '2026-08-01', summary: '', items: [{ type: 'new', text: 'Import' }, { type: 'fixed', text: 'Important fix', roundup: true }] },
      { version: '3', date: '2026-09-01', summary: '', items: [{ type: 'new', text: 'Next month' }] },
    ]
    expect(roundupCandidates(entries, '2026-08').map(item => item.text)).toEqual(['Import', 'Important fix'])
  })
  it('rejects arbitrary selections and external asset/link targets', () => {
    expect(() => makeRoundup('2026-08', [], ['unknown'])).toThrow()
    for (const url of ['https://elsewhere.test', '//elsewhere.test', '/\\elsewhere.test']) expect(() => publicUrl(url)).toThrow()
    expect(publicUrl('/trades')).toBe('https://www.freetradejournal.com/trades')
  })
})

describe('recipient and approval controls', () => {
  const user = { email: 'test@example.com', emailVerified: true, disabled: false }
  it('excludes opted-out, unknown, unverified and disabled accounts', () => {
    expect(eligibleRecipient(user, {})).toBe(true)
    expect(eligibleRecipient(user, undefined)).toBe(false)
    for (const state of [{ emailOptOut: true }, { signupThrottled: true }, { isTestAccount: true }]) expect(eligibleRecipient(user, state)).toBe(false)
    expect(eligibleRecipient({ ...user, emailVerified: false }, {})).toBe(false)
    expect(eligibleRecipient({ ...user, disabled: true }, {})).toBe(false)
  })
  it('binds approval to the exact draft and count, within 24 hours', () => {
    const draft = { status: 'draft', revision: 'a', recipientCount: 20, preparedAt: 1_000 }
    expect(approvalMatches(draft, 'a', 20, 2_000)).toBe(true)
    expect(approvalMatches(draft, 'b', 20, 2_000)).toBe(false)
    expect(approvalMatches(draft, 'a', 21, 2_000)).toBe(false)
    expect(approvalMatches(draft, 'a', 20, 86_401_000)).toBe(false)
    expect(approvalMatches({ ...draft, status: 'approved' }, 'a', 20, 2_000)).toBe(false)
    expect(approvalMatches({ ...draft, recipientCount: 0 }, 'a', 0, 2_000)).toBe(false)
  })
})
