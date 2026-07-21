import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User, Auth } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase-lazy';
import { DEMO_USER } from '@/data/demo-data';
import { UserStorage } from '@/utils/user-storage';
import { setAICacheUser } from '@/utils/ai-cache';
import { seedDemoStorage, clearDemoStorage } from '@/services/demo-service';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isDemo: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<User>;
  signIn: (email: string, password: string) => Promise<User>;
  signInWithGoogle: () => Promise<User>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  verifyPasswordResetCode: (oobCode: string) => Promise<string>;
  confirmPasswordReset: (oobCode: string, newPassword: string) => Promise<void>;
  applyActionCode: (oobCode: string) => Promise<void>;
  refreshUser: () => Promise<User | null>;
  enterDemoMode: () => void;
  exitDemoMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [auth, setAuth] = useState<Auth | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [isDemo, setIsDemo] = useState(false);

  // Keep the AI response cache scoped to the current user (or demo). Set during
  // render so the scope is current before any child AI component reads it.
  setAICacheUser(user?.uid ?? null);

  const initAuth = async () => {
    if (authInitialized) return auth;
    setAuthInitialized(true);
    
    try {
      const authInstance = await getFirebaseAuth();
      setAuth(authInstance);
      
      const { onAuthStateChanged } = await import('firebase/auth');
      const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
        if (user) {
          // Derive encryption key and decrypt cached data before any reads/writes
          await UserStorage.initEncryption(user.uid);
          // Migrate existing unscoped data to user-scoped data
          if (!UserStorage.hasUserData(user.uid)) {
            UserStorage.migrateUserData(user.uid);
          }
        }
        setUser(user);
        setLoading(false);
      });
      
      return authInstance;
    } catch (error) {
      console.error('Failed to initialize Firebase Auth:', error);
      setLoading(false);
      return null;
    }
  };

  useEffect(() => {
    // Defer auth init so it doesn't block initial render / LCP
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => initAuth());
    } else {
      setTimeout(() => initAuth(), 0);
    }
  }, []);

  // Defense-in-depth: real auth must always clear demo state, even when the
  // caller forgot to exitDemoMode() first (typed URL, browser back, future
  // signup links). A stranded isDemo=true blocks every save via demoGuard and
  // makes logout skip the real signOut.
  const clearDemoState = () => {
    if (!isDemo) return;
    clearDemoStorage();
    setIsDemo(false);
    delete document.documentElement.dataset.demo;
  };

  const signUp = async (email: string, password: string, displayName?: string): Promise<User> => {
    const authInstance = auth || await initAuth();
    if (!authInstance) throw new Error('Auth not initialized');

    const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
    const userCredential = await createUserWithEmailAndPassword(authInstance, email, password);
    clearDemoState();

    if (displayName && userCredential.user) {
      await updateProfile(userCredential.user, {
        displayName: displayName
      });
      await userCredential.user.reload();
      setUser({ ...userCredential.user });
    }

    // Send branded verification email via Cloud Function
    try {
      const { getFunctions, httpsCallable } = await import('firebase/functions');
      const fns = getFunctions();
      const sendVerification = httpsCallable(fns, 'sendEmailVerificationLink');
      await sendVerification();
    } catch (err) {
      console.error('Failed to send verification email:', err);
    }

    // Record referral if one exists
    try {
      const { getStoredReferral, clearStoredReferral } = await import('@/hooks/use-referral-tracker');
      const referrerUid = getStoredReferral();
      if (referrerUid && referrerUid !== userCredential.user.uid) {
        const { httpsCallable } = await import('firebase/functions');
        const { getFirebaseFunctions } = await import('@/lib/firebase-lazy');
        const fns = await getFirebaseFunctions();
        const recordRef = httpsCallable(fns, 'recordReferral');
        await recordRef({ referrerUid });
        clearStoredReferral();
      }
    } catch (err) {
      console.error('Failed to record referral:', err);
    }

    return userCredential.user;
  };

  const signIn = async (email: string, password: string): Promise<User> => {
    const authInstance = auth || await initAuth();
    if (!authInstance) throw new Error('Auth not initialized');

    const { signInWithEmailAndPassword } = await import('firebase/auth');
    const userCredential = await signInWithEmailAndPassword(authInstance, email, password);
    clearDemoState();
    return userCredential.user;
  };

  const signInWithGoogle = async (): Promise<User> => {
    const authInstance = auth || await initAuth();
    if (!authInstance) throw new Error('Auth not initialized');

    const { GoogleAuthProvider, signInWithPopup, getAdditionalUserInfo } = await import('firebase/auth');
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(authInstance, provider);
    clearDemoState();

    const additionalInfo = getAdditionalUserInfo(userCredential);
    if (additionalInfo?.isNewUser) {
      try {
        const { getStoredReferral, clearStoredReferral } = await import('@/hooks/use-referral-tracker');
        const referrerUid = getStoredReferral();
        if (referrerUid && referrerUid !== userCredential.user.uid) {
          const { httpsCallable } = await import('firebase/functions');
          const { getFirebaseFunctions } = await import('@/lib/firebase-lazy');
          const fns = await getFirebaseFunctions();
          const recordRef = httpsCallable(fns, 'recordReferral');
          await recordRef({ referrerUid });
          clearStoredReferral();
        }
      } catch (err) {
        console.error('Failed to record referral:', err);
      }
    }

    return userCredential.user;
  };

  const logout = async (): Promise<void> => {
    if (isDemo) {
      clearDemoStorage();
      setUser(null);
      setIsDemo(false);
      delete document.documentElement.dataset.demo;
      return;
    }
    
    const authInstance = auth || await initAuth();
    if (!authInstance) throw new Error('Auth not initialized');

    // Drop the previous user's decrypted cache + derived key from memory —
    // reads are uid-scoped so nothing leaks, but plaintext shouldn't linger.
    const prevUid = user?.uid;
    const { signOut } = await import('firebase/auth');
    await signOut(authInstance);
    if (prevUid) {
      const { UserStorage } = await import('@/utils/user-storage');
      UserStorage.clearMemoryCache(prevUid);
    }
  };
  
  const enterDemoMode = () => {
    // Start every demo session from a clean, freshly-seeded sandbox so prior
    // edits never carry over. Seeding writes synchronously to localStorage
    // (demo-user has no encryption key), so reads on the next render are ready.
    clearDemoStorage();
    void seedDemoStorage();
    setUser(DEMO_USER as any);
    setIsDemo(true);
    setLoading(false);
    document.documentElement.dataset.demo = 'true';
  };

  const exitDemoMode = () => {
    clearDemoStorage();
    setUser(null);
    setIsDemo(false);
    delete document.documentElement.dataset.demo;
  };

  const resetPassword = async (email: string): Promise<void> => {
    const { getFunctions, httpsCallable } = await import('firebase/functions');
    const { getApp } = await import('firebase/app');
    const fns = getFunctions(getApp());
    const sendPasswordResetLink = httpsCallable(fns, 'sendPasswordResetLink');
    await sendPasswordResetLink({ email });
  };

  const verifyPasswordResetCode = async (oobCode: string): Promise<string> => {
    const authInstance = auth || await initAuth();
    if (!authInstance) throw new Error('Auth not initialized');

    const { verifyPasswordResetCode: firebaseVerify } = await import('firebase/auth');
    return firebaseVerify(authInstance, oobCode);
  };

  const confirmPasswordReset = async (oobCode: string, newPassword: string): Promise<void> => {
    const authInstance = auth || await initAuth();
    if (!authInstance) throw new Error('Auth not initialized');

    const { confirmPasswordReset: firebaseConfirm } = await import('firebase/auth');
    await firebaseConfirm(authInstance, oobCode, newPassword);
  };

  const applyActionCode = async (oobCode: string): Promise<void> => {
    const authInstance = auth || await initAuth();
    if (!authInstance) throw new Error('Auth not initialized');

    const { applyActionCode: firebaseApply } = await import('firebase/auth');
    await firebaseApply(authInstance, oobCode);
  };

  // Reload the live Firebase user and push it into context state. The context
  // can hold a stale snapshot (e.g. the post-signup spread copy above) whose
  // emailVerified never updates — reload() mutates auth.currentUser only, so
  // guards like ProtectedRoute keep reading the old value and bounce verified
  // users back to /verify-email in a redirect loop.
  const refreshUser = async (): Promise<User | null> => {
    const authInstance = auth || await initAuth();
    const live = authInstance?.currentUser ?? null;
    if (!live) return null;
    await live.reload();
    setUser(live);
    return live;
  };

  const value: AuthContextType = useMemo(() => ({
    user,
    loading,
    isDemo,
    signUp,
    signIn,
    signInWithGoogle,
    logout,
    resetPassword,
    verifyPasswordResetCode,
    confirmPasswordReset,
    applyActionCode,
    refreshUser,
    enterDemoMode,
    exitDemoMode
  }), [user, loading, isDemo, signUp, signIn, signInWithGoogle, logout, resetPassword, verifyPasswordResetCode, confirmPasswordReset, applyActionCode, refreshUser, enterDemoMode, exitDemoMode]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}