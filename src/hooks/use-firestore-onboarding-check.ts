import { useEffect, useState } from 'react';
import { UserStorage } from '@/utils/user-storage';

/**
 * Checks Firestore for onboardingCompleted when localStorage is missing the flag.
 * Covers free users who cleared localStorage and Pro users whose restore failed.
 */
export function useFirestoreOnboardingCheck(userId: string | null, skipCheck: boolean) {
  const [checking, setChecking] = useState(() => {
    if (skipCheck || !userId) return false;
    // Only need async check if flag is missing locally
    const flag = UserStorage.getItem(userId, 'onboardingCompleted');
    return flag !== 'true';
  });
  const [completedInFirestore, setCompletedInFirestore] = useState(false);

  // Re-trigger check if skipCheck transitions from true→false (e.g. after auto-restore completes)
  useEffect(() => {
    if (skipCheck || !userId) return;
    const flag = UserStorage.getItem(userId, 'onboardingCompleted');
    if (flag !== 'true') {
      setChecking(true);
    }
  }, [skipCheck, userId]);

  useEffect(() => {
    if (!checking || !userId) return;

    let cancelled = false;

    async function check() {
      try {
        const { getFirebaseFirestore } = await import('@/lib/firebase-lazy');
        const db = await getFirebaseFirestore();
        const { doc, getDoc } = await import('firebase/firestore');
        const snap = await getDoc(doc(db, 'users', userId!));
        if (!cancelled && snap.exists() && snap.data()?.onboardingCompleted === true) {
          // Restore flag to localStorage so future checks are instant
          UserStorage.setItem(userId!, 'onboardingCompleted', 'true');
          setCompletedInFirestore(true);
        }
      } catch {
        // Firestore check failed — be conservative, don't re-onboard
        if (!cancelled) setCompletedInFirestore(true);
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    check();
    return () => { cancelled = true; };
  }, [checking, userId]);

  return { checking, completedInFirestore };
}
