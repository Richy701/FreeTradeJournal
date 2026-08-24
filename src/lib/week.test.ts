import { describe, it, expect } from 'vitest'
import { startOfWeek, weekKey } from './week'

describe('startOfWeek', () => {
  it('returns the preceding Sunday at midnight local time', () => {
    const wed = new Date(2026, 7, 26, 15, 30) // Wed Aug 26 2026
    const start = startOfWeek(wed)
    expect(start.getDay()).toBe(0)
    expect(start.getDate()).toBe(23)
    expect(start.getHours()).toBe(0)
  })
  it('keeps a Sunday on the same day', () => {
    const sun = new Date(2026, 7, 23, 9)
    expect(startOfWeek(sun).getDate()).toBe(23)
  })
  it('groups Saturday and the next Sunday into different weeks', () => {
    expect(weekKey(new Date(2026, 7, 22))).not.toBe(weekKey(new Date(2026, 7, 23)))
    expect(weekKey(new Date(2026, 7, 23))).toBe(weekKey(new Date(2026, 7, 29)))
  })
})
