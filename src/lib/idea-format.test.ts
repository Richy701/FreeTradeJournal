import { describe, it, expect } from 'vitest'
import { formatIdeaPrice, formatOutcomePnl, parseLevel } from './idea-format'
import { formatRelativeTime } from './relative-time'
import { plannedRewardRatio, profileHitRate } from '@/types/trade-ideas'

describe('plannedRewardRatio', () => {
  it('computes reward over risk for longs and shorts', () => {
    expect(plannedRewardRatio({ entry: 100, stop: 90, target: 120 })).toBe(2)
    expect(plannedRewardRatio({ entry: 19240, stop: 19290, target: 19120 })).toBeCloseTo(2.4)
  })
  it('is null without both levels or with zero risk', () => {
    expect(plannedRewardRatio({ entry: 100, stop: null, target: 120 })).toBeNull()
    expect(plannedRewardRatio({ entry: 100, stop: 90, target: null })).toBeNull()
    expect(plannedRewardRatio({ entry: 100, stop: 100, target: 120 })).toBeNull()
  })
})

describe('profileHitRate', () => {
  it('counts breakeven in the denominator only', () => {
    expect(profileHitRate({ handle: 'x', avatarEmoji: null, avatarColor: '#3b82f6', role: null, ideaCount: 5, winCount: 2, lossCount: 1, breakevenCount: 1 })).toEqual({ rate: 0.5, decided: 4 })
  })
  it('is null with no linked outcomes', () => {
    expect(profileHitRate({ handle: 'x', avatarEmoji: null, avatarColor: '#3b82f6', role: null, ideaCount: 3, winCount: 0, lossCount: 0, breakevenCount: 0 })).toBeNull()
  })
})

describe('formatOutcomePnl', () => {
  it('signs and rounds by size', () => {
    expect(formatOutcomePnl(1840, 'USD')).toBe('+$1,840')
    expect(formatOutcomePnl(-620.5, 'USD')).toBe('-$620.50')
    expect(formatOutcomePnl(0, 'USD')).toBe('$0.00')
  })
  it('falls back on an unknown currency code', () => {
    expect(formatOutcomePnl(12, 'ZZZZ')).toBe('+12')
  })
})

describe('formatIdeaPrice', () => {
  it('keeps forex precision and groups thousands', () => {
    expect(formatIdeaPrice(1.1045)).toBe('1.1045')
    expect(formatIdeaPrice(19240)).toBe('19,240')
  })
})

describe('formatRelativeTime', () => {
  const now = new Date('2026-08-23T12:00:00Z')
  it('steps through minutes, hours and days', () => {
    expect(formatRelativeTime(new Date('2026-08-23T11:59:40Z'), now)).toBe('just now')
    expect(formatRelativeTime(new Date('2026-08-23T11:15:00Z'), now)).toBe('45m ago')
    expect(formatRelativeTime(new Date('2026-08-23T09:00:00Z'), now)).toBe('3h ago')
    expect(formatRelativeTime(new Date('2026-08-21T12:00:00Z'), now)).toBe('2d ago')
  })
  it('switches to a date after a week', () => {
    expect(formatRelativeTime(new Date('2026-08-10T12:00:00Z'), now)).toMatch(/Aug 10/)
  })
})

describe('parseLevel', () => {
  it('treats a lone comma as the decimal point', () => {
    expect(parseLevel('1,1045')).toBe(1.1045)
    expect(parseLevel('24350,25')).toBe(24350.25)
  })
  it('strips thousands separators when a dot is present, commas repeat, or the comma is followed by 3 digits', () => {
    expect(parseLevel('19,240.50')).toBe(19240.5)
    expect(parseLevel('1,234,567')).toBe(1234567)
    expect(parseLevel('19,240')).toBe(19240)
    expect(parseLevel('5,425')).toBe(5425)
  })
  it('returns null for empty and NaN for junk', () => {
    expect(parseLevel('  ')).toBeNull()
    expect(Number.isNaN(parseLevel('abc') as number)).toBe(true)
  })
})
