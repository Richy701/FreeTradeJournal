import { describe, expect, it, vi } from 'vitest'
import * as admin from 'firebase-admin'
import { claimSignupEnrollment, releaseSignupEnrollment, ENROLLMENT_GATE } from '../src/enrollment-gate'

function database(state?: Record<string, unknown>) {
  const update = vi.fn().mockResolvedValue(undefined)
  const tx = { get: vi.fn().mockResolvedValue({ data: () => state }), set: vi.fn() }
  const db = {
    doc: (path: string) => ({ path, update }),
    runTransaction: (callback: (transaction: typeof tx) => unknown) => callback(tx),
  } as unknown as FirebaseFirestore.Firestore
  return { db, tx, update }
}

describe('signup enrollment gate', () => {
  it('leaves a paused signup eligible for local reminders without claiming a hosted handoff', async () => {
    const { db, tx } = database({ paused: true })
    expect(await claimSignupEnrollment(db, 'user')).toBeNull()
    expect(tx.set).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ path: 'users/user' }), { resendEnrollmentStatus: 'rollout_fallback' }, { merge: true })
  })
  it('claims an open gate transactionally, using distinct claims for overlapping invocations', async () => {
    const { db, tx } = database()
    const first = await claimSignupEnrollment(db, 'user')
    const second = await claimSignupEnrollment(db, 'user')
    expect(first).toBeTruthy()
    expect(second).not.toBe(first)
    expect(tx.get).toHaveBeenCalledWith(expect.objectContaining({ path: ENROLLMENT_GATE }))
    expect(tx.set).toHaveBeenCalledWith(expect.objectContaining({ path: ENROLLMENT_GATE }), {
      handoffs: { [first!]: { uid: 'user', startedAt: expect.anything() } },
    }, { merge: true })
  })
  it('releases only its own claim, preserving other pending signups and the pause flag', async () => {
    const { db, update } = database()
    await releaseSignupEnrollment(db, 'claim')
    expect(update).toHaveBeenCalledTimes(1)
    expect(update.mock.calls[0][0].isEqual(new admin.firestore.FieldPath('handoffs', 'claim'))).toBe(true)
    expect(update.mock.calls[0][1]).toEqual(admin.firestore.FieldValue.delete())
  })
})
