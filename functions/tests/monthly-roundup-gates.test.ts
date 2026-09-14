import { describe, expect, it, vi } from 'vitest'

vi.mock('firebase-admin', () => ({ auth: () => ({}), firestore: { FieldValue: { serverTimestamp: () => 0 } } }))
vi.mock('firebase-functions', () => ({
  runWith: () => ({
    https: { onCall: (handler: unknown) => handler },
    pubsub: { schedule: () => ({ onRun: (handler: unknown) => handler, timeZone: () => ({ onRun: (handler: unknown) => handler }) }) },
  }),
  https: { HttpsError: class extends Error { constructor(_code: string, message: string) { super(message) } } },
}))
import { createMonthlyRoundupFunctions } from '../src/monthly-roundup'

function harness(initial: Record<string, unknown>) {
  const state = { ...initial }
  const ref = { update: vi.fn(async (update: object) => Object.assign(state, update)) }
  const collection = {
    where: vi.fn(() => collection), limit: vi.fn(() => collection),
    get: vi.fn(async () => ({ empty: !['approved', 'sending'].includes(String(state.status)), docs: [{ ref }] })),
  }
  const db = {
    collection: vi.fn(() => collection),
    runTransaction: async (handler: (tx: unknown) => unknown) => handler({ get: async () => ({ data: () => state }), update: (_ref: unknown, update: object) => Object.assign(state, update) }),
  }
  const send = vi.fn()
  const assertAdmin = vi.fn((context: { auth?: unknown }) => { if (!context.auth) throw new Error('Admin only') })
  const functions = createMonthlyRoundupFunctions({ db, send, assertAdmin, unsubscribeUrl: () => '', from: '' } as never)
  return { state, send, collection, manage: functions.manageMonthlyRoundup as unknown as (data: object, context: object) => Promise<unknown>, worker: functions.sendApprovedRoundups as unknown as () => Promise<void> }
}

describe('monthly email send gates', () => {
  it('rejects management before touching draft data for an unauthenticated caller', async () => {
    const h = harness({ status: 'draft' })
    await expect(h.manage({ action: 'approve' }, {})).rejects.toThrow('Admin only')
    expect(h.collection.get).not.toHaveBeenCalled()
    expect(h.send).not.toHaveBeenCalled()
  })
  it('does not process drafts merely because the worker runs', async () => {
    const h = harness({ status: 'draft' })
    await h.worker()
    expect(h.send).not.toHaveBeenCalled()
  })
  it('pauses an approved job if its content revision changed', async () => {
    const h = harness({ status: 'approved', approvedAt: Date.now(), revision: 'new', approvedRevision: 'old' })
    await h.worker()
    expect(h.state.status).toBe('needs-review')
    expect(h.send).not.toHaveBeenCalled()
  })
  it('pauses old jobs instead of replaying uncertain deliveries', async () => {
    const h = harness({ status: 'approved', approvedAt: Date.now() - 24 * 60 * 60 * 1000, revision: 'a', approvedRevision: 'a' })
    await h.worker()
    expect(h.state.status).toBe('needs-review')
    expect(h.send).not.toHaveBeenCalled()
  })
})
