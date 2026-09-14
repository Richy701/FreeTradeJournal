import * as functions from 'firebase-functions'

// Available to Free and Pro users. Never accept a uid or user fields from input.
export function createCompleteOnboardingHandler(db: FirebaseFirestore.Firestore) {
  return async (_data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be signed in.')
    }
    await db.collection('users').doc(context.auth.uid).set(
      { onboardingCompleted: true },
      { merge: true },
    )
    return { success: true }
  }
}
