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

    // Pro user with no local data - try to restore from Firestore
    async function restoreFromFirestore() {
      setIsRestoring(true);
      try {
        const db = await getFirebaseFirestore();
        const { doc, getDoc } = await import('firebase/firestore');

        const keys = ['trades', 'journalEntries', 'goals', 'accounts', 'riskRules', 'onboardingCompleted', 'onboarding'];
        let restoredAny = false;

        for (const key of keys) {
          const docRef = doc(db, 'users', user.uid, 'sync', key);
          const snapshot = await getDoc(docRef);

          if (snapshot.exists()) {
            const firestoreData = snapshot.data();
            if (firestoreData.data) {
              UserStorage.setItem(user.uid, key, firestoreData.data);
              restoredAny = true;
              console.log(`[AutoRestore] Restored ${key} from Firestore`);
            }
          }
        }

        if (restoredAny) {
          console.log('[AutoRestore] ✅ Data restored from Firestore');
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
