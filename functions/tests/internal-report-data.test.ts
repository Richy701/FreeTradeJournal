import { describe, expect, it } from 'vitest'
import { activationCohorts, activityTiming } from '../src/internal-report-data'

const time = (value: string) => Date.parse(value + 'T00:00:00Z')

describe('activation observation windows', () => {
  it('counts only first trades inside seven days of signup', () => {
    const created = time('2026-08-03')
    const rows = activationCohorts([
      { created, firstTradeAt: time('2026-08-09') },
      { created, firstTradeAt: time('2026-08-10') },
      { created, firstTradeAt: created - 1 },
      { created, throttled: true },
    ], time('2026-08-17'))
    expect(rows[0]).toMatchObject({ signups: 3, activated: 1, mature: true, rate: 33 })
  })
  it('waits until the whole signup cohort has had seven days', () => {
    const members = [{ created: time('2026-08-03'), firstTradeAt: time('2026-08-04') }]
    expect(activationCohorts(members, time('2026-08-16'))[0].rate).toBeNull()
    expect(activationCohorts(members, time('2026-08-17'))[0].rate).toBe(100)
  })
  it('ignores future signups and does not count future activation', () => {
    expect(activationCohorts([{ created: time('2026-08-20') }], time('2026-08-17'))).toEqual([])
    expect(activationCohorts([{ created: time('2026-08-17'), firstTradeAt: time('2026-08-18') }], time('2026-08-17'))[0].activated).toBe(0)
  })
})

describe('activity timing', () => {
  it('keeps absent and invalid activity unknown', () => {
    expect(activityTiming(undefined, undefined)).toEqual({ busiestDay: null, busiestHour: null })
    expect(activityTiming(8, 24)).toEqual({ busiestDay: null, busiestHour: null })
  })
  it('preserves midnight and independent weekday/hour results', () => {
    expect(activityTiming(7, 0)).toEqual({ busiestDay: 'Sunday', busiestHour: '00:00 to 01:00 UTC' })
  })
})
