// Firebase configuration and initialization
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  FacebookAuthProvider,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

// Define environment variable interface
interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
}

// Extend ImportMeta interface
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Firebase configuration - will be populated by Vite at build time
const firebaseConfig = {
  apiKey: (import.meta as unknown as ImportMeta).env?.VITE_FIREBASE_API_KEY || '',
  authDomain: (import.meta as unknown as ImportMeta).env?.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: (import.meta as unknown as ImportMeta).env?.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: (import.meta as unknown as ImportMeta).env?.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: (import.meta as unknown as ImportMeta).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: (import.meta as unknown as ImportMeta).env?.VITE_FIREBASE_APP_ID || '',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
// Auth persistence is LOCAL by default in Firebase v9+
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Auth providers
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();

export default app;
