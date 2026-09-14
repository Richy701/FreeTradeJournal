import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useProStatus } from '@/contexts/pro-context';
import { hasCompletedOnboarding, hasExistingOnboardingData } from '@/utils/onboarding';
import { notifyDataChange } from '@/contexts/sync-context';

/**
 * Auto-restore data from Firestore for Pro users on new devices
 * Prevents them from going through onboarding and creating empty data
 */
export function useAutoRestore() {
  const { user } = useAuth();
  const { isPro, isLoading: isProLoading } = useProStatus();
  const userId = user?.uid ?? null;
  const identity = `${userId}:${isPro}`;
  const [result, setResult] = useState<{ identity: string; failed: boolean } | null>(null);

  useEffect(() => {
    if (!userId || isProLoading) return;
    let cancelled = false;
    const finish = (failed = false) => {
      if (!cancelled) setResult({ identity, failed });
    };
    if (!isPro) {
      finish();
      return;
    }

    // Check if user already has local data
    const hasLocalData = hasCompletedOnboarding(userId) || hasExistingOnboardingData(userId);
    if (hasLocalData) {
      finish();
      return;
    }

    // Pro user with no local data - try to restore via Cloud Function (bypasses content blockers)
    async function restoreFromFirestore() {
      let failed = false;
      try {
        const [{ getFirebaseAuth }, { getFunctions, httpsCallable }] = await Promise.all([
          import('@/lib/firebase-lazy'),
          import('firebase/functions'),
        ]);
        await getFirebaseAuth();
        const functions = getFunctions();
        const getSyncDataFn = httpsCallable(functions, 'getSyncData');

        const result = await getSyncDataFn({}) as { data: { data: Record<string, string> } };
        if (cancelled) return;
        const syncData = result.data.data;

        let restoredAny = false;

        for (const [key, value] of Object.entries(syncData)) {
          if (value) {
            const scopedKey = `user_${userId}_${key}`;
            localStorage.setItem(scopedKey, value);
            restoredAny = true;
            console.log(`[AutoRestore] Restored ${key} from Firestore`);
          }
        }

        if (restoredAny) {
          console.log('[AutoRestore] ✅ Data restored via Cloud Function');
          notifyDataChange();
        } else {
          console.log('[AutoRestore] No data found in Firestore (new user)');
        }
      } catch (error) {
        console.error('[AutoRestore] Failed to restore from Firestore:', error);
        failed = true;
      } finally {
        finish(failed);
      }
    }

    void restoreFromFirestore();
    return () => { cancelled = true; };
  }, [userId, identity, isPro, isProLoading]);

  const restoreComplete = !isProLoading && result?.identity === identity;
  return {
    isRestoring: !!userId && isPro && !isProLoading && !restoreComplete,
    restoreComplete,
    restoreFailed: restoreComplete && (result?.failed ?? false),
  };
}
