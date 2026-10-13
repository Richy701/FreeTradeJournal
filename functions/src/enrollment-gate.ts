import * as admin from 'firebase-admin'
import { randomUUID } from 'crypto'

// Server-only document (no client rule grants access). A rollout closes this
// gate and waits for every claimed handoff to finish before disabling Resend.
export const ENROLLMENT_GATE = 'ops/emailActivationRollout'

export async function claimSignupEnrollment(db: FirebaseFirestore.Firestore, uid: string): Promise<string | null> {
  const gate = db.doc(ENROLLMENT_GATE)
  const claim = randomUUID()
  return db.runTransaction(async tx => {
    const state = (await tx.get(gate)).data()
    if (state?.paused === true) {
      tx.set(db.doc(`users/${uid}`), { resendEnrollmentStatus: 'rollout_fallback' }, { merge: true })
      return null
    }
    tx.set(gate, { handoffs: { [claim]: { uid, startedAt: admin.firestore.FieldValue.serverTimestamp() } } }, { merge: true })
    return claim
  })
}

export async function releaseSignupEnrollment(db: FirebaseFirestore.Firestore, claim: string): Promise<void> {
  await db.doc(ENROLLMENT_GATE).update(new admin.firestore.FieldPath('handoffs', claim), admin.firestore.FieldValue.delete())
}
