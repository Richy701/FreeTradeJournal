import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useProStatus } from '@/contexts/pro-context';
import { getFirebaseFirestore } from '@/lib/firebase-lazy';
import { UserStorage } from '@/utils/user-storage';

/**
 * Auto-restore data from Firestore for Pro users on new devices
 * Prevents them from going through onboarding and creating empty data
 */
export function useAutoRestore() {
  const { user } = useAuth();
  const { isPro, isLoading: isProLoading } = useProStatus();
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreComplete, setRestoreComplete] = useState(false);

  useEffect(() => {
    if (!user || isProLoading) return;
    if (!isPro) {
      setRestoreComplete(true);
      return;
    }

    // Check if user already has local data
    const hasLocalData = UserStorage.hasUserData(user.uid);
    if (hasLocalData) {
      setRestoreComplete(true);
      return;
    }

    // Pro user with no local data - try to restore via Cloud Function (bypasses content blockers)
    const userId = user.uid; // Capture for use in async function
    async function restoreFromFirestore() {
      setIsRestoring(true);
      try {
        const { getFirebaseAuth } = await import('@/lib/firebase-lazy');
        const auth = await getFirebaseAuth();
        const { getFunctions, httpsCallable } = await import('firebase/functions');
        const functions = getFunctions();
        const getSyncDataFn = httpsCallable(functions, 'getSyncData');

        const result = await getSyncDataFn({}) as { data: { data: Record<string, string> } };
        const syncData = result.data.data;

        let restoredAny = false;

        for (const [key, value] of Object.entries(syncData)) {
          if (value) {
            UserStorage.setItem(userId, key, value);
            restoredAny = true;
            console.log(`[AutoRestore] Restored ${key} from Firestore`);
          }
        }

        if (restoredAny) {
          console.log('[AutoRestore] ✅ Data restored via Cloud Function');
        } else {
          console.log('[AutoRestore] No data found in Firestore (new user)');
        }
      } catch (error) {
        console.error('[AutoRestore] Failed to restore from Firestore:', error);
      } finally {
        setIsRestoring(false);
        setRestoreComplete(true);
      }
    }

    restoreFromFirestore();
  }, [user, isPro, isProLoading]);

  return { isRestoring, restoreComplete };
}
