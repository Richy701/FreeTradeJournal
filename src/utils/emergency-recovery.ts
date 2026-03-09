/**
 * Emergency data recovery utilities
 * Use in browser console to check and restore data from Firestore
 */

import { getFirebaseFirestore } from '@/lib/firebase-lazy';

export async function checkFirestoreData(userId: string) {
  try {
    const db = await getFirebaseFirestore();
    const { doc, getDoc } = await import('firebase/firestore');

    const keys = ['trades', 'journalEntries', 'goals', 'accounts', 'riskRules', 'onboardingCompleted', 'onboarding'];
    const data: Record<string, any> = {};

    console.log('🔍 Checking Firestore for user:', userId);

    for (const key of keys) {
      const docRef = doc(db, 'users', userId, 'sync', key);
      const snapshot = await getDoc(docRef);

      if (snapshot.exists()) {
        const firestoreData = snapshot.data();
        data[key] = firestoreData.data;
        console.log(`✅ ${key}:`, firestoreData.data?.substring(0, 100));
      } else {
        console.log(`❌ ${key}: not found`);
      }
    }

    return data;
  } catch (error) {
    console.error('❌ Error checking Firestore:', error);
    return null;
  }
}

export async function restoreFromFirestore(userId: string) {
  try {
    const data = await checkFirestoreData(userId);
    if (!data) {
      console.error('❌ No data found in Firestore');
      return false;
    }

    const { UserStorage } = await import('./user-storage');

    let restored = 0;
    for (const [key, value] of Object.entries(data)) {
      if (value) {
        UserStorage.setItem(userId, key, value);
        console.log(`✅ Restored ${key}`);
        restored++;
      }
    }

    console.log(`✅ Restored ${restored} items from Firestore`);
    console.log('🔄 Refresh the page to see your data');
    return true;
  } catch (error) {
    console.error('❌ Error restoring data:', error);
    return false;
  }
}

// Make available globally for console access
if (typeof window !== 'undefined') {
  (window as any).emergencyRecovery = {
    checkFirestoreData,
    restoreFromFirestore,
  };
}
