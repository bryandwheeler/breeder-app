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
  getRedirectResult,
  sendPasswordResetEmail,
  updateProfile,
  getAdditionalUserInfo,
} from 'firebase/auth';
import { auth, googleProvider, facebookProvider, db } from '@breeder/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { logUserLogin, logUserSignup } from '@/lib/auditLog';

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

  // Decide whether to use redirect instead of popup (mobile, Safari, COOP, iframed)
  function shouldUseRedirect(): boolean {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return false;
    }
    const ua = navigator.userAgent;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(ua);
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
    const coopBlocked = (window as any).crossOriginIsolated === true;
    const inIframe = window.self !== window.top;
    return isMobile || isSafari || coopBlocked || inIframe;
  }

  // Helper: create or update user profile in Firestore without read-before-write
  async function ensureUserProfile(user: User, isNewUser: boolean = false) {
    try {
      const userRef = doc(db, 'users', user.uid);
      const base = {
        email: user.email,
        displayName: user.displayName || 'Unknown User',
        photoURL: user.photoURL || null,
        lastLogin: new Date().toISOString(),
        isActive: true,
      } as Record<string, any>;

      // Only set defaults when this is the very first creation
      if (isNewUser) {
        base.createdAt = new Date().toISOString();
        base.role = 'user';
      }

      await setDoc(userRef, base, { merge: true });
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
    await ensureUserProfile(user, true);

    // Log the signup
    await logUserSignup(user.uid, email, displayName);
  }

  async function login(email: string, password: string) {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    await ensureUserProfile(user, false);

    // Log the login
    await logUserLogin(
      user.uid,
      user.email || email,
      user.displayName || 'Unknown User'
    );
  }

  async function logout() {
    await signOut(auth);
  }

  async function loginWithGoogle() {
    try {
      if (shouldUseRedirect()) {
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      const credential = await signInWithPopup(auth, googleProvider);
      const isNew = !!getAdditionalUserInfo(credential)?.isNewUser;
      await ensureUserProfile(credential.user, isNew);

      // Log the login (signup is logged in ensureUserProfile for new users)
      if (!isNew) {
        await logUserLogin(
          credential.user.uid,
          credential.user.email || 'unknown',
          credential.user.displayName || 'Unknown User'
        );
      } else {
        await logUserSignup(
          credential.user.uid,
          credential.user.email || 'unknown',
          credential.user.displayName || 'Unknown User'
        );
      }
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
      if (shouldUseRedirect()) {
        await signInWithRedirect(auth, facebookProvider);
        return;
      }
      const credential = await signInWithPopup(auth, facebookProvider);
      const isNew = !!getAdditionalUserInfo(credential)?.isNewUser;
      await ensureUserProfile(credential.user, isNew);

      // Log the login (signup is logged separately for new users)
      if (!isNew) {
        await logUserLogin(
          credential.user.uid,
          credential.user.email || 'unknown',
          credential.user.displayName || 'Unknown User'
        );
      } else {
        await logUserSignup(
          credential.user.uid,
          credential.user.email || 'unknown',
          credential.user.displayName || 'Unknown User'
        );
      }
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
    // Complete redirect-based sign-in if one occurred
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          const isNew = !!getAdditionalUserInfo(result)?.isNewUser;
          await ensureUserProfile(result.user, isNew);
        }
      })
      .catch((error) => {
        // Non-fatal: log for diagnostics only
        if (error) {
          console.warn('[AuthContext] Redirect sign-in failed:', error);
        }
      });

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Ensure user profile exists in Firestore
        await ensureUserProfile(user, false);
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
