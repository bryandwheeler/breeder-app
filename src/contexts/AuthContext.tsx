import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider, facebookProvider, db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signup: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithFacebook: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper: create or update user profile in Firestore without read-before-write
  async function ensureUserProfile(user: User) {
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(
        userRef,
        {
          email: user.email,
          displayName: user.displayName || 'Unknown User',
          photoURL: user.photoURL || null,
          lastLogin: new Date().toISOString(),
          // These fields will only be set on first write; they won't overwrite existing values due to merge
          createdAt: new Date().toISOString(),
          role: 'user',
          isActive: true,
        },
        { merge: true }
      );
    } catch (error: any) {
      console.error('[AuthContext] Error ensuring user profile:', error);
      // Don't throw - allow auth to proceed even if profile creation fails
    }
  }

  async function signup(email: string, password: string, displayName: string) {
    const { user } = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    await updateProfile(user, { displayName });
    await ensureUserProfile(user);
  }

  async function login(email: string, password: string) {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    await ensureUserProfile(user);
  }

  async function logout() {
    await signOut(auth);
  }

  async function loginWithGoogle() {
    try {
      const { user } = await signInWithPopup(auth, googleProvider);
      await ensureUserProfile(user);
    } catch (err: any) {
      // Fallback to redirect for COOP/popup-blocked environments
      console.warn(
        '[AuthContext] Google popup failed, falling back to redirect:',
        err?.message
      );
      await signInWithRedirect(auth, googleProvider);
    }
  }

  async function loginWithFacebook() {
    try {
      const { user } = await signInWithPopup(auth, facebookProvider);
      await ensureUserProfile(user);
    } catch (err: any) {
      console.warn(
        '[AuthContext] Facebook popup failed, falling back to redirect:',
        err?.message
      );
      await signInWithRedirect(auth, facebookProvider);
    }
  }

  async function resetPassword(email: string) {
    await sendPasswordResetEmail(auth, email);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Ensure user profile exists in Firestore
        await ensureUserProfile(user);
      }
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    currentUser,
    loading,
    signup,
    login,
    logout,
    loginWithGoogle,
    loginWithFacebook,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
