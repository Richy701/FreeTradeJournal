import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

export async function getFirebaseAuth(): Promise<Auth> {
  if (authInstance) return authInstance;

  const { initializeApp } = await import('firebase/app');
  const { getAuth, connectAuthEmulator } = await import('firebase/auth');

  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
  };

  const app = initializeApp(firebaseConfig);
  authInstance = getAuth(app);

  // Connect to emulators in development
  if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
    try {
      if (!(authInstance as any)._delegate.config.emulator) {
        connectAuthEmulator(authInstance, 'http://localhost:9099');
      }
    } catch (error) {
      // Firebase auth emulator already connected or not available
    }
  }

  return authInstance;
}

export async function getFirebaseFirestore(): Promise<Firestore> {
  if (dbInstance) return dbInstance;

  const { initializeApp } = await import('firebase/app');
  const { getFirestore, connectFirestoreEmulator } = await import('firebase/firestore');

  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
  };

  const app = initializeApp(firebaseConfig);
  dbInstance = getFirestore(app);

  if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
    try {
      if (!(dbInstance as any)._delegate._databaseId.projectId.includes('demo-')) {
        connectFirestoreEmulator(dbInstance, 'localhost', 8080);
      }
    } catch (error) {
      // Firebase firestore emulator already connected or not available
    }
  }

  return dbInstance;
}