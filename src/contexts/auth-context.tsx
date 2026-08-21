import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { trackActivity } from '@/lib/track-activity';
import type { User, Auth } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase-lazy';
import { DEMO_USER } from '@/data/demo-data';
import { UserStorage } from '@/utils/user-storage';
import { setAICacheUser } from '@/utils/ai-cache';
import { seedDemoStorage, clearDemoStorage } from '@/services/demo-service';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  /** True when a signed-in session existed on this device the last time we
   *  looked. Firebase keeps the real session in IndexedDB, which can't be read
   *  synchronously, so this is the cheap hint that lets pages that render
   *  before auth resolves (the landing page, ProGate) hold back for a returning
   *  user instead of painting the logged-out/free version for a frame. */
  hadSession: boolean;
  isDemo: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<User>;
  signIn: (email: string, password: string) => Promise<User>;
  signInWithGoogle: () => Promise<{ user: User; isNewUser: boolean }>;
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

const SESSION_HINT_KEY = 'ftj-had-session';

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hadSession] = useState<boolean>(() => {
    try { return localStorage.getItem(SESSION_HINT_KEY) === '1'; } catch { return false; }
  });
  const [auth, setAuth] = useState<Auth | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  // In-flight (or finished) auth init. Memoizing the PROMISE — not a boolean —
  // means a caller who arrives mid-init awaits the same init and gets the real
  // instance. The old `authInitialized` boolean guard returned the stale null
  // `auth` state to anyone who called during the in-flight window, which is
  // what made the first "Sign in with Google" click throw 'Auth not
  // initialized' (silently, as easy-to-miss red text) whenever the click beat
  // the idle-callback init. Second click worked because init had finished.
  const initPromiseRef = useRef<Promise<Auth | null> | null>(null);
  // The uid whose post-auth processing (encryption init + setUser) has
  // completed, plus resolvers for sign-in calls waiting on it. signInWithPopup
  // resolves BEFORE the onAuthStateChanged listener runs, and the listener
  // additionally awaits UserStorage.initEncryption (deliberately, so nothing
  // reads encrypted storage early). Navigating on the raw credential therefore
  // hit ProtectedRoute while `user` was still null → bounced back to /login →
  // the deterministic "always sign in twice" bug. Sign-in now resolves only
  // once the guard would actually pass.
  const readyUidRef = useRef<string | null>(null);
  const userReadyResolvers = useRef(new Map<string, Array<() => void>>());

  const waitForUserReady = (uid: string): Promise<void> => {
    if (readyUidRef.current === uid) return Promise.resolve();
    return new Promise((resolve) => {
      const list = userReadyResolvers.current.get(uid) || [];
      list.push(resolve);
      userReadyResolvers.current.set(uid, list);
      // Never hang the sign-in button on a misbehaving listener — after 5s,
      // fall through to the old (bounce-prone) behavior rather than a stuck UI.
      setTimeout(resolve, 5000);
    });
  };

  // Keep the AI response cache scoped to the current user (or demo). Set during
  // render so the scope is current before any child AI component reads it.
  setAICacheUser(user?.uid ?? null);

  const initAuth = (): Promise<Auth | null> => {
    initPromiseRef.current ||= (async () => {
      try {
        const authInstance = await getFirebaseAuth();
        setAuth(authInstance);

        const { onAuthStateChanged } = await import('firebase/auth');
        onAuthStateChanged(authInstance, async (user) => {
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
          // Release the pre-paint hold from theme-init.js now that we know
          // whether to stay on the landing page or redirect.
          try { document.documentElement.removeAttribute('data-auth-hold'); } catch { /* no DOM */ }
          // Server-side "still active" marker (users/{uid}.lastActiveAt, deduped
          // per day on the server) — the client is the only thing that knows.
          if (user) trackActivity('session_seen', undefined, { onceKey: 'session_seen' });
          // Keep the session hint in step with the real session (a sign-out
          // also lands here with user === null and clears it).
          try {
            if (user) localStorage.setItem(SESSION_HINT_KEY, '1');
            else localStorage.removeItem(SESSION_HINT_KEY);
          } catch { /* storage unavailable */ }
          // Release any sign-in call awaiting this uid (see waitForUserReady).
          readyUidRef.current = user?.uid ?? null;
          if (user) {
            const waiters = userReadyResolvers.current.get(user.uid);
            if (waiters) {
              userReadyResolvers.current.delete(user.uid);
              waiters.forEach((resolve) => resolve());
            }
          }
        });

        return authInstance;
      } catch (error) {
        console.error('Failed to initialize Firebase Auth:', error);
        setLoading(false);
        // Clear the memo so the next sign-in attempt retries the init instead
        // of being permanently stuck with a cached failure until reload.
        initPromiseRef.current = null;
        return null;
      }
    })();
    return initPromiseRef.current;
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

    await waitForUserReady(userCredential.user.uid);
    return userCredential.user;
  };

  const signIn = async (email: string, password: string): Promise<User> => {
    const authInstance = auth || await initAuth();
    if (!authInstance) throw new Error('Auth not initialized');

    const { signInWithEmailAndPassword } = await import('firebase/auth');
    const userCredential = await signInWithEmailAndPassword(authInstance, email, password);
    clearDemoState();
    await waitForUserReady(userCredential.user.uid);
    return userCredential.user;
  };

  const signInWithGoogle = async (): Promise<{ user: User; isNewUser: boolean }> => {
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

    await waitForUserReady(userCredential.user.uid);
    return { user: userCredential.user, isNewUser: !!additionalInfo?.isNewUser };
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
    hadSession,
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
  }), [user, loading, hadSession, isDemo, signUp, signIn, signInWithGoogle, logout, resetPassword, verifyPasswordResetCode, confirmPasswordReset, applyActionCode, refreshUser, enterDemoMode, exitDemoMode]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}