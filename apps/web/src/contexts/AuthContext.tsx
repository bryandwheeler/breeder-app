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

  // Decide whether to use redirect instead of popup
  // NOTE: We now prefer popup on most devices because redirect has sessionStorage issues on iOS
  // Only use redirect for Safari (which blocks popups) and iframes
  function shouldUseRedirect(): boolean {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return false;
    }
    const ua = navigator.userAgent;
    // Only Safari (not Chrome on iOS) truly needs redirect
    const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(ua);
    const coopBlocked = (window as any).crossOriginIsolated === true;
    const inIframe = window.self !== window.top;
    // Don't force redirect on mobile Chrome - it has sessionStorage issues
    return isSafari || coopBlocked || inIframe;
  }

  // Helper: create or update user profile in Firestore without read-before-write
  async function ensureUserProfile(user: User, isNewUser: boolean = false) {
    try {
      const userRef = doc(db, 'users', user.uid);
      const now = new Date().toISOString();
      const base = {
        email: user.email,
        displayName: user.displayName || 'Unknown User',
        photoURL: user.photoURL || null,
        lastLogin: now,
        isActive: true,
      } as Record<string, any>;

      // Only set defaults when this is the very first creation
      if (isNewUser) {
        base.createdAt = now;
        base.role = 'user';
      }

      // Use setDoc with merge - if the document doesn't exist, it creates it
      // If it exists, it merges the new data
      await setDoc(userRef, base, { merge: true });

      // If this is NOT a new user (login flow), we still need to ensure
      // createdAt and role exist in case the profile was never properly created
      // We do this separately to avoid overwriting existing values
      if (!isNewUser) {
        const { getDoc } = await import('firebase/firestore');
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          // If essential fields are missing, add them
          if (!data.createdAt || !data.role) {
            await setDoc(userRef, {
              createdAt: data.createdAt || now,
              role: data.role || 'user',
            }, { merge: true });
          }
        }
      }
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

          // Log the login/signup
          if (isNew) {
            await logUserSignup(
              result.user.uid,
              result.user.email || 'unknown',
              result.user.displayName || 'Unknown User'
            );
          } else {
            await logUserLogin(
              result.user.uid,
              result.user.email || 'unknown',
              result.user.displayName || 'Unknown User'
            );
          }

          // Redirect to home after successful OAuth redirect login
          // This handles the case where user returns from Google/Facebook
          if (window.location.pathname === '/login' || window.location.pathname === '/signup') {
            window.location.replace('/');
          }
        }
      })
      .catch((error) => {
        // Handle the "missing initial state" error gracefully
        // This happens on iOS when sessionStorage is cleared/blocked
        if (error?.code === 'auth/missing-initial-state' ||
            error?.message?.includes('missing initial state')) {
          console.warn('[AuthContext] OAuth redirect state lost (common on iOS). User may need to sign in again.');
          // Don't show error to user - they'll just see the login page
        } else if (error) {
          console.warn('[AuthContext] Redirect sign-in failed:', error);
        }
      });

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('[AuthContext] onAuthStateChanged fired:', {
        hasUser: !!user,
        email: user?.email,
        uid: user?.uid?.substring(0, 8)
      });
      if (user) {
        // Ensure user profile exists in Firestore
        await ensureUserProfile(user, false);
      }
      setCurrentUser(user);
      setLoading(false);
      console.log('[AuthContext] State updated: loading=false, hasUser=', !!user);
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
