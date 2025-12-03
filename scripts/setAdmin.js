/**
 * Script to set a user as admin
 * Usage: node scripts/setAdmin.js <uid>
 *
 * Make sure to run this with the correct Firebase project:
 * firebase use expert-breeder-dev && node scripts/setAdmin.js <uid>
 * OR
 * firebase use expert-breeder && node scripts/setAdmin.js <uid>
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.development') });

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function setAdminRole(uid) {
  try {
    console.log(`Setting admin role for user: ${uid}`);
    console.log(`Using project: ${firebaseConfig.projectId}`);

    const userRef = doc(db, 'users', uid);

    // Check if user exists
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      console.error(`❌ User ${uid} does not exist!`);
      process.exit(1);
    }

    // Update role to admin
    await setDoc(userRef, { role: 'admin' }, { merge: true });

    console.log(`✅ Successfully set ${uid} as admin`);

    // Verify
    const updatedDoc = await getDoc(userRef);
    console.log('Updated user data:', updatedDoc.data());

    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting admin role:', error);
    process.exit(1);
  }
}

// Get UID from command line
const uid = process.argv[2];
if (!uid) {
  console.error('Usage: node scripts/setAdmin.js <uid>');
  process.exit(1);
}

setAdminRole(uid);
