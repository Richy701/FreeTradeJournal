import { useEffect, useState } from 'react';
import { UserStorage } from '@/utils/user-storage';

/** Wait for the current user's remote completion check before deciding a route. */
export function useFirestoreOnboardingCheck(userId: string | null, skipCheck: boolean) {
  const needsCheck = !skipCheck && !!userId && UserStorage.getItem(userId, 'onboardingCompleted') !== 'true';
  const [result, setResult] = useState<{ userId: string; completed: boolean } | null>(null);

  useEffect(() => {
    if (!needsCheck || !userId) {
      setResult(null);
      return;
    }
    let cancelled = false;
    const checkedUserId = userId;
    async function check() {
      let completed = false;
      try {
        const { getFirebaseFirestore } = await import('@/lib/firebase-lazy');
        const db = await getFirebaseFirestore();
        const { doc, getDoc } = await import('firebase/firestore');
        const snap = await getDoc(doc(db, 'users', checkedUserId));
        completed = snap.exists() && snap.data()?.onboardingCompleted === true;
        if (!cancelled && completed) UserStorage.setItem(checkedUserId, 'onboardingCompleted', 'true');
      } catch {
        // Preserve the existing conservative policy on a failed remote lookup.
        // Do not persist this as proof that onboarding actually completed.
        completed = true;
      }
      if (!cancelled) setResult({ userId: checkedUserId, completed });
    }
    void check();
    return () => { cancelled = true; };
  }, [needsCheck, userId]);

  const currentResult = result?.userId === userId ? result : null;
  return {
    checking: needsCheck && !currentResult,
    completedInFirestore: currentResult?.completed ?? false,
  };
}
