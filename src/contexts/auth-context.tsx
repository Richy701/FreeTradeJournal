import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User, Auth } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase-lazy';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<User>;
  signIn: (email: string, password: string) => Promise<User>;
  signInWithGoogle: () => Promise<User>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
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

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const initAuth = async () => {
      try {
        // Defer auth initialization slightly to allow page to render first
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const authInstance = await getFirebaseAuth();
        setAuth(authInstance);
        
        const { onAuthStateChanged } = await import('firebase/auth');
        unsubscribe = onAuthStateChanged(authInstance, (user) => {
          setUser(user);
          setLoading(false);
        });
      } catch (error) {
        console.error('Failed to initialize Firebase Auth:', error);
        setLoading(false);
      }
    };

    initAuth();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const signUp = async (email: string, password: string, displayName?: string): Promise<User> => {
    if (!auth) throw new Error('Auth not initialized');
    
    const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    if (displayName && userCredential.user) {
      await updateProfile(userCredential.user, {
        displayName: displayName
      });
      await userCredential.user.reload();
      setUser({ ...userCredential.user });
    }
    
    return userCredential.user;
  };

  const signIn = async (email: string, password: string): Promise<User> => {
    if (!auth) throw new Error('Auth not initialized');
    
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  };

  const signInWithGoogle = async (): Promise<User> => {
    if (!auth) throw new Error('Auth not initialized');
    
    const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    return userCredential.user;
  };

  const logout = async (): Promise<void> => {
    if (!auth) throw new Error('Auth not initialized');
    
    const { signOut } = await import('firebase/auth');
    await signOut(auth);
  };

  const resetPassword = async (email: string): Promise<void> => {
    if (!auth) throw new Error('Auth not initialized');
    
    const { sendPasswordResetEmail } = await import('firebase/auth');
    await sendPasswordResetEmail(auth, email);
  };

  const value: AuthContextType = {
    user,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    logout,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}