/**
 * Verification Script: Check migration status
 *
 * This script checks which collections exist and their document counts
 * to verify migrations completed successfully.
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.production or .env.development
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: path.join(process.cwd(), envFile) });

// Initialize Firebase Admin SDK
if (getApps().length === 0) {
  initializeApp({
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  });
}

const db = getFirestore();

interface CollectionInfo {
  name: string;
  exists: boolean;
  count: number;
  sampleDoc?: any;
}

async function checkCollection(name: string): Promise<CollectionInfo> {
  try {
    const snapshot = await db.collection(name).limit(1).get();
    const countSnapshot = await db.collection(name).count().get();

    return {
      name,
      exists: !snapshot.empty || countSnapshot.data().count > 0,
      count: countSnapshot.data().count,
      sampleDoc: snapshot.empty ? null : snapshot.docs[0].data(),
    };
  } catch (error) {
    return {
      name,
      exists: false,
      count: 0,
    };
  }
}

async function verifyMigrations() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 Migration Verification Report');
  console.log('='.repeat(80));
  console.log(`📅 ${new Date().toLocaleString()}\n`);

  // Check old snake_case collections
  console.log('📂 OLD Collections (snake_case) - Should be EMPTY or DELETED:');
  console.log('-'.repeat(80));

  const oldCollections = [
    'breeder_profiles',
    'breeding_records',
    'heat_cycles',
    'stud_jobs',
    'customer_segments',
  ];

  for (const collectionName of oldCollections) {
    const info = await checkCollection(collectionName);
    const status = info.count === 0 ? '✅' : '⚠️';
    console.log(`${status} ${collectionName.padEnd(20)} - ${info.count} documents`);
  }

  // Check new camelCase collections
  console.log('\n📂 NEW Collections (camelCase) - Should have DATA:');
  console.log('-'.repeat(80));

  const newCollections = [
    'breederProfiles',
    'breedingRecords',
    'heatCycles',
    'studJobs',
    'customerSegments',
  ];

  for (const collectionName of newCollections) {
    const info = await checkCollection(collectionName);
    const status = info.count > 0 ? '✅' : '⚠️';
    console.log(`${status} ${collectionName.padEnd(20)} - ${info.count} documents`);
  }

  // Check for string literal values in a sample document
  console.log('\n📊 String Literal Checks:');
  console.log('-'.repeat(80));

  // Check dogs collection for kebab-case status values
  const dogsSnapshot = await db.collection('dogs').limit(5).get();
  if (!dogsSnapshot.empty) {
    let foundSnakeCase = false;
    let foundKebabCase = false;

    dogsSnapshot.docs.forEach(doc => {
      const data = doc.data();

      // Check registration.status
      if (data.registration?.status) {
        if (data.registration.status.includes('_')) {
          foundSnakeCase = true;
          console.log(`⚠️  Found snake_case in dogs/${doc.id}/registration/status: "${data.registration.status}"`);
        } else if (data.registration.status.includes('-')) {
          foundKebabCase = true;
        }
      }
    });

    if (!foundSnakeCase && foundKebabCase) {
      console.log('✅ Dogs collection uses kebab-case status values');
    } else if (!foundSnakeCase && !foundKebabCase) {
      console.log('ℹ️  No status values found in sample dogs');
    }
  } else {
    console.log('ℹ️  No documents in dogs collection');
  }

  // Check breeding records for method field
  const breedingSnapshot = await db.collection('breedingRecords').limit(5).get();
  if (!breedingSnapshot.empty) {
    let foundSnakeCase = false;
    let foundKebabCase = false;

    breedingSnapshot.docs.forEach(doc => {
      const data = doc.data();

      if (data.method) {
        if (data.method.includes('_')) {
          foundSnakeCase = true;
          console.log(`⚠️  Found snake_case in breedingRecords/${doc.id}/method: "${data.method}"`);
        } else if (data.method === 'surgical-ai') {
          foundKebabCase = true;
        }
      }
    });

    if (!foundSnakeCase && foundKebabCase) {
      console.log('✅ Breeding records use kebab-case method values');
    } else if (!foundSnakeCase && !foundKebabCase) {
      console.log('ℹ️  No method values found in sample breeding records');
    }
  } else {
    console.log('ℹ️  No documents in breedingRecords collection');
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ Verification Complete!');
  console.log('='.repeat(80) + '\n');
}

verifyMigrations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Verification failed:', error);
    process.exit(1);
  });
