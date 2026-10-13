import { describe, expect, it } from 'vitest'
import { runActivationRollout, RolloutActions } from '../scripts/rollout-support/activation-rollout'

function actions(fail: string[] = []) {
  const calls: string[] = []
  const names: (keyof RolloutActions)[] = ['closeGate', 'drainGate', 'publishTemplates', 'disable', 'replaceGraph', 'enable', 'verify', 'restore', 'openGate']
  const handlers = Object.fromEntries(names.map(name => [name, async () => {
    calls.push(name)
    if (fail.includes(name)) throw new Error(name)
  }])) as unknown as RolloutActions
  return { calls, handlers }
}

describe('activation rollout safety', () => {
  it('drains signup events before any provider writes and verifies before reopening', async () => {
    const { calls, handlers } = actions()
    await runActivationRollout(handlers)
    expect(calls).toEqual(['closeGate', 'drainGate', 'publishTemplates', 'disable', 'replaceGraph', 'enable', 'verify', 'openGate'])
  })
  it('makes no provider changes if signup handoffs do not drain', async () => {
    const { calls, handlers } = actions(['drainGate'])
    await expect(runActivationRollout(handlers)).rejects.toThrow('drainGate')
    expect(calls).toEqual(['closeGate', 'drainGate', 'openGate'])
  })
  it.each(['publishTemplates', 'disable', 'replaceGraph', 'enable', 'verify'])('restores before reopening after %s fails', async name => {
    const { calls, handlers } = actions([name])
    await expect(runActivationRollout(handlers)).rejects.toThrow(name)
    expect(calls.slice(-2)).toEqual(['restore', 'openGate'])
  })
  it('leaves enrollment paused if restoring fails', async () => {
    const { calls, handlers } = actions(['replaceGraph', 'restore'])
    await expect(runActivationRollout(handlers)).rejects.toThrow('gate remains paused')
    expect(calls).not.toContain('openGate')
  })
  it('does not reopen a gate it could not claim', async () => {
    const { calls, handlers } = actions(['closeGate'])
    await expect(runActivationRollout(handlers)).rejects.toThrow('closeGate')
    expect(calls).toEqual(['closeGate'])
  })
})
