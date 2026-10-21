import { afterEach, describe, expect, it, vi } from 'vitest'
import { tradeInstant, zoneWindows } from './chart-hours-sessions'

// Local-time constructor so the midnight rule is tested against the same
// clock the component reads (getHours/getMinutes/getSeconds).
const at = (h: number, m = 0, s = 0) => new Date(2026, 7, 21, h, m, s)

describe('tradeInstant', () => {
  it('uses the entry time when it carries a real time of day', () => {
    expect(tradeInstant({ entryTime: at(9, 30), exitTime: at(10, 15) })).toEqual(at(9, 30))
  })

  it('treats a date-only timestamp (local midnight) as untimed', () => {
    expect(tradeInstant({ entryTime: at(0), exitTime: at(0) })).toBeNull()
  })

  it('falls back to the exit time when only the entry is date-only', () => {
    expect(tradeInstant({ entryTime: at(0), exitTime: at(14, 5) })).toEqual(at(14, 5))
  })

  it('keeps 00:01 — only exact midnight is treated as missing', () => {
    expect(tradeInstant({ entryTime: at(0, 1) })).toEqual(at(0, 1))
  })

  it('accepts ISO strings and rejects garbage', () => {
    const iso = at(16, 45).toISOString()
    expect(tradeInstant({ entryTime: iso })).toEqual(at(16, 45))
    expect(tradeInstant({ entryTime: 'not a date' })).toBeNull()
    expect(tradeInstant({})).toBeNull()
  })
})

describe('zoneWindows', () => {
  const RANGE = /^\d{1,2}(:\d{2})?(am|pm)–\d{1,2}(:\d{2})?(am|pm)(, .*)?$/
  afterEach(() => { vi.useRealTimers() })

  // zoneWindows samples "today", so the result depends on the date. The
  // NY-close to Sydney-open gap only exists while Sydney is on standard time.
  it('describes every zone as a local clock range in the southern winter', () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 5, 15, 12))
    const w = zoneWindows()
    for (const key of ['Asia', 'London', 'New York', 'Off-session']) {
      expect(w[key]).toMatch(RANGE)
    }
  })

  it('has no off-hours window while Sydney is on summer time', () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 11, 15, 12))
    const w = zoneWindows()
    for (const key of ['Asia', 'London', 'New York']) {
      expect(w[key]).toMatch(RANGE)
    }
    expect(w['Off-session']).toBeUndefined()
  })
})
