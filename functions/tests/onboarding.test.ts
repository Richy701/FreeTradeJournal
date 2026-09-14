import { describe, expect, it, vi } from 'vitest'
import { createCompleteOnboardingHandler } from '../src/onboarding'

function setup() {
  const set = vi.fn().mockResolvedValue(undefined)
  const doc = vi.fn(() => ({ set }))
  const collection = vi.fn(() => ({ doc }))
  const handler = createCompleteOnboardingHandler({ collection } as never)
  return { handler, set, doc, collection }
}

describe('onboarding completion', () => {
  it('rejects anonymous requests before accessing user records', async () => {
    const h = setup()
    await expect(h.handler({}, {} as never)).rejects.toMatchObject({ code: 'unauthenticated' })
    expect(h.collection).not.toHaveBeenCalled()
  })
  it('allows a Free account and ignores attempts to edit another account or subscription', async () => {
    const h = setup()
    await expect(h.handler({ uid: 'other', isPro: true, onboardingCompleted: false }, { auth: { uid: 'caller', token: {} } } as never)).resolves.toEqual({ success: true })
    expect(h.collection).toHaveBeenCalledWith('users')
    expect(h.doc).toHaveBeenCalledWith('caller')
    expect(h.set).toHaveBeenCalledWith({ onboardingCompleted: true }, { merge: true })
  })
  it('does not report success when persistence fails', async () => {
    const h = setup()
    h.set.mockRejectedValueOnce(new Error('unavailable'))
    await expect(h.handler({}, { auth: { uid: 'caller' } } as never)).rejects.toThrow('unavailable')
  })
})
