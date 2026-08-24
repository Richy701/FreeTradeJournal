import { describe, expect, it } from 'vitest'
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
  it('describes every zone as a local clock range', () => {
    const w = zoneWindows()
    for (const key of ['Asia', 'London', 'New York', 'Off-session']) {
      expect(w[key]).toMatch(/^\d{1,2}(:\d{2})?(am|pm)–\d{1,2}(:\d{2})?(am|pm)(, .*)?$/)
    }
  })
})
