import { describe, expect, it } from 'vitest'
import { getLoopCrashContext, installLoopCrashContext, isUpdateLoopError, noteComponentStack } from './loop-crash-context'

describe('loop crash context', () => {
  it('recognises the update-loop error in dev and minified form', () => {
    expect(isUpdateLoopError('Maximum update depth exceeded. This can happen when…')).toBe(true)
    expect(isUpdateLoopError('Minified React error #185; visit https://react.dev/errors/185')).toBe(true)
    expect(isUpdateLoopError('Failed to fetch')).toBe(false)
    expect(isUpdateLoopError(undefined)).toBe(false)
  })

  it('summarises recent activity by event and storage key, never values', () => {
    installLoopCrashContext()
    for (let i = 0; i < 3; i++) window.dispatchEvent(new StorageEvent('storage', { key: 'trades', newValue: 'secret-trade-data' }))
    window.dispatchEvent(new Event('tradesUpdated'))
    noteComponentStack('\n    at Dashboard\n    at App')

    const context = getLoopCrashContext()
    expect(context.loop_recent_activity['storage:trades']).toBe(3)
    expect(context.loop_recent_activity.tradesUpdated).toBe(1)
    expect(context.loop_component_stack).toContain('at Dashboard')
    expect(JSON.stringify(context)).not.toContain('secret-trade-data')
  })
})
