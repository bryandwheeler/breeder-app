import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import {
  User,
  AuthCredential,
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
  linkWithCredential,
  GoogleAuthProvider,
  FacebookAuthProvider,
} from 'firebase/auth';
import { auth, googleProvider, facebookProvider, db } from '@breeder/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { logUserLogin, logUserSignup } from '@/lib/auditLog';

interface PendingLink {
  credential: AuthCredential;
  email: string;
  providerName: string;
}

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  redirectError: string | null;
  pendingLink: PendingLink | null;
  clearPendingLink: () => void;
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
  const [redirectError, setRedirectError] = useState<string | null>(null);
  const [pendingLink, setPendingLink] = useState<PendingLink | null>(null);

  function clearPendingLink() {
    setPendingLink(null);
  }

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

    // If there's a pending OAuth credential, link it to this account
    if (pendingLink?.credential) {
      try {
        await linkWithCredential(user, pendingLink.credential);
        console.log(`[AuthContext] Successfully linked ${pendingLink.providerName} provider`);
      } catch (linkErr: any) {
        // provider-already-linked is fine — means it was already connected
        if (linkErr?.code !== 'auth/provider-already-linked') {
          console.warn('[AuthContext] Failed to link provider:', linkErr?.message);
        }
      } finally {
        setPendingLink(null);
      }
    }

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
      if (err?.code === 'auth/account-exists-with-different-credential') {
        const oauthCredential = GoogleAuthProvider.credentialFromError(err);
        const email = err.customData?.email;
        if (oauthCredential && email) {
          setPendingLink({ credential: oauthCredential, email, providerName: 'Google' });
        }
        throw err;
      }
      // Only fall back to redirect when the popup was actually blocked/prevented
      const popupErrors = [
        'auth/popup-blocked',
        'auth/popup-closed-by-user',
        'auth/cancelled-popup-request',
      ];
      if (popupErrors.includes(err?.code) || err?.message?.includes('Cross-Origin-Opener-Policy')) {
        console.warn('[AuthContext] Google popup blocked, falling back to redirect');
        await signInWithRedirect(auth, googleProvider);
      } else {
        // Real auth error — surface it to the user
        throw err;
      }
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
      if (err?.code === 'auth/account-exists-with-different-credential') {
        const oauthCredential = FacebookAuthProvider.credentialFromError(err);
        const email = err.customData?.email;
        if (oauthCredential && email) {
          setPendingLink({ credential: oauthCredential, email, providerName: 'Facebook' });
        }
        throw err;
      }
      const popupErrors = [
        'auth/popup-blocked',
        'auth/popup-closed-by-user',
        'auth/cancelled-popup-request',
      ];
      if (popupErrors.includes(err?.code) || err?.message?.includes('Cross-Origin-Opener-Policy')) {
        console.warn('[AuthContext] Facebook popup blocked, falling back to redirect');
        await signInWithRedirect(auth, facebookProvider);
      } else {
        throw err;
      }
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
          if (error?.code === 'auth/account-exists-with-different-credential') {
            // Try to extract credential for linking after email/password sign-in
            const googleCred = GoogleAuthProvider.credentialFromError(error);
            const fbCred = FacebookAuthProvider.credentialFromError(error);
            const oauthCredential = googleCred || fbCred;
            const email = error.customData?.email;
            if (oauthCredential && email) {
              setPendingLink({
                credential: oauthCredential,
                email,
                providerName: googleCred ? 'Google' : 'Facebook',
              });
            }
            setRedirectError('An account already exists with this email. Please sign in with your email and password to link your account.');
          } else {
            setRedirectError(error?.message || 'Sign-in failed. Please try again.');
          }
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
    redirectError,
    pendingLink,
    clearPendingLink,
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
