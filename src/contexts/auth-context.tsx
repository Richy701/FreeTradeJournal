import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User, Auth } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase-lazy';
import { DEMO_USER } from '@/data/demo-data';
import { UserStorage } from '@/utils/user-storage';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isDemo: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<User>;
  signIn: (email: string, password: string) => Promise<User>;
  signInWithGoogle: () => Promise<User>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
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

  const initAuth = async () => {
    if (authInitialized) return auth;
    setAuthInitialized(true);
    
    try {
      const authInstance = await getFirebaseAuth();
      setAuth(authInstance);
      
      const { onAuthStateChanged } = await import('firebase/auth');
      const unsubscribe = onAuthStateChanged(authInstance, (user) => {
        if (user) {
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
    // Initialize auth for all pages
    initAuth();
  }, []);

  const signUp = async (email: string, password: string, displayName?: string): Promise<User> => {
    const authInstance = auth || await initAuth();
    if (!authInstance) throw new Error('Auth not initialized');
    
    const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
    const userCredential = await createUserWithEmailAndPassword(authInstance, email, password);
    
    if (displayName && userCredential.user) {
      await updateProfile(userCredential.user, {
        displayName: displayName
      });
      await userCredential.user.reload();
      setUser({ ...userCredential.user });
    }
    
    // Send welcome email
    try {
      const { EmailService } = await import('@/lib/resend');
      const firstName = displayName?.split(' ')[0] || 'Trader';
      await EmailService.sendWelcomeEmail({
        firstName,
        email: userCredential.user.email || email,
      });
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      // Don't fail signup if email fails
    }
    
    return userCredential.user;
  };

  const signIn = async (email: string, password: string): Promise<User> => {
    const authInstance = auth || await initAuth();
    if (!authInstance) throw new Error('Auth not initialized');
    
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    const userCredential = await signInWithEmailAndPassword(authInstance, email, password);
    return userCredential.user;
  };

  const signInWithGoogle = async (): Promise<User> => {
    const authInstance = auth || await initAuth();
    if (!authInstance) throw new Error('Auth not initialized');
    
    const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(authInstance, provider);
    return userCredential.user;
  };

  const logout = async (): Promise<void> => {
    if (isDemo) {
      setUser(null);
      setIsDemo(false);
      return;
    }
    
    const authInstance = auth || await initAuth();
    if (!authInstance) throw new Error('Auth not initialized');
    
    const { signOut } = await import('firebase/auth');
    await signOut(authInstance);
  };
  
  const enterDemoMode = () => {
    setUser(DEMO_USER as any);
    setIsDemo(true);
    setLoading(false);
  };
  
  const exitDemoMode = () => {
    setUser(null);
    setIsDemo(false);
  };

  const resetPassword = async (email: string): Promise<void> => {
    const authInstance = auth || await initAuth();
    if (!authInstance) throw new Error('Auth not initialized');
    
    const { sendPasswordResetEmail } = await import('firebase/auth');
    await sendPasswordResetEmail(authInstance, email);
  };

  const value: AuthContextType = {
    user,
    loading,
    isDemo,
    signUp,
    signIn,
    signInWithGoogle,
    logout,
    resetPassword,
    enterDemoMode,
    exitDemoMode
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}