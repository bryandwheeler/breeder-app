/**
 * Migration Script: Copy data from Production to Development Firebase
 *
 * This script copies all data from your production Firestore database
 * to your development Firestore database using Firebase Admin SDK.
 *
 * Prerequisites:
 * 1. Download service account keys from Firebase Console:
 *    - Go to Project Settings > Service Accounts
 *    - Click "Generate New Private Key"
 *    - Save as scripts/serviceAccountKey-prod.json (production)
 *    - Do the same for dev project, save as scripts/serviceAccountKey-dev.json
 *
 * Usage: node scripts/migrate-data.js
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load service account keys
let prodServiceAccount, devServiceAccount;

try {
  prodServiceAccount = JSON.parse(
    readFileSync(join(__dirname, 'serviceAccountKey-prod.json'), 'utf-8')
  );
} catch (error) {
  console.error('\n❌ Error: Production service account key not found!');
  console.error('   Please download from Firebase Console:');
  console.error('   1. Go to https://console.firebase.google.com/project/expert-breeder/settings/serviceaccounts/adminsdk');
  console.error('   2. Click "Generate New Private Key"');
  console.error('   3. Save as scripts/serviceAccountKey-prod.json\n');
  process.exit(1);
}

try {
  devServiceAccount = JSON.parse(
    readFileSync(join(__dirname, 'serviceAccountKey-dev.json'), 'utf-8')
  );
} catch (error) {
  console.error('\n❌ Error: Development service account key not found!');
  console.error('   Please download from Firebase Console:');
  console.error('   1. Go to https://console.firebase.google.com/project/expert-breeder-dev/settings/serviceaccounts/adminsdk');
  console.error('   2. Click "Generate New Private Key"');
  console.error('   3. Save as scripts/serviceAccountKey-dev.json\n');
  process.exit(1);
}

// Initialize both Firebase Admin apps
const prodApp = admin.initializeApp({
  credential: admin.credential.cert(prodServiceAccount),
}, 'production');

const devApp = admin.initializeApp({
  credential: admin.credential.cert(devServiceAccount),
}, 'development');

const prodDb = prodApp.firestore();
const devDb = devApp.firestore();

// Collections to migrate
const COLLECTIONS = [
  'dogs',
  'litters',
  'breederProfiles',
  'customers',
  'inquiries',
  'waitlist',
  'careTemplates',
];

async function migrateCollection(collectionName) {
  console.log(`\n📦 Migrating collection: ${collectionName}`);

  try {
    // Get all documents from production
    const snapshot = await prodDb.collection(collectionName).get();

    if (snapshot.empty) {
      console.log(`   ⚠️  Collection ${collectionName} is empty, skipping...`);
      return { success: 0, failed: 0 };
    }

    console.log(`   Found ${snapshot.size} documents`);

    let successCount = 0;
    let failedCount = 0;

    // Use batched writes for better performance (max 500 per batch)
    const batches = [];
    let currentBatch = devDb.batch();
    let operationCount = 0;

    snapshot.docs.forEach((doc) => {
      const docData = doc.data();
      const docRef = devDb.collection(collectionName).doc(doc.id);

      currentBatch.set(docRef, docData);
      operationCount++;

      // Firestore batch limit is 500 operations
      if (operationCount === 500) {
        batches.push(currentBatch);
        currentBatch = devDb.batch();
        operationCount = 0;
      }
    });

    // Add the last batch if it has operations
    if (operationCount > 0) {
      batches.push(currentBatch);
    }

    // Commit all batches
    for (let i = 0; i < batches.length; i++) {
      try {
        await batches[i].commit();
        const docsInBatch = i === batches.length - 1 ? operationCount : 500;
        successCount += docsInBatch;
        console.log(`   ✅ Batch ${i + 1}/${batches.length} committed (${docsInBatch} docs)`);
      } catch (error) {
        failedCount += (i === batches.length - 1 ? operationCount : 500);
        console.error(`   ❌ Batch ${i + 1} failed:`, error.message);
      }
    }

    console.log(`   ✅ Migration complete: ${successCount} succeeded, ${failedCount} failed`);
    return { success: successCount, failed: failedCount };

  } catch (error) {
    console.error(`   ❌ Error migrating ${collectionName}:`, error.message);
    return { success: 0, failed: 0 };
  }
}

async function migrateAllData() {
  console.log('🚀 Starting data migration from Production to Development\n');
  console.log(`📍 Source: ${prodServiceAccount.project_id}`);
  console.log(`📍 Target: ${devServiceAccount.project_id}\n`);

  // Confirm before proceeding
  console.log('⚠️  WARNING: This will overwrite existing data in development database!');
  console.log('   Press Ctrl+C within 5 seconds to cancel...\n');

  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log('Starting migration...\n');

  const results = {
    totalSuccess: 0,
    totalFailed: 0,
    collections: {},
  };

  for (const collectionName of COLLECTIONS) {
    const result = await migrateCollection(collectionName);
    results.collections[collectionName] = result;
    results.totalSuccess += result.success;
    results.totalFailed += result.failed;
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 MIGRATION SUMMARY');
  console.log('='.repeat(60));

  for (const [collectionName, result] of Object.entries(results.collections)) {
    console.log(`${collectionName.padEnd(20)} | ✅ ${result.success} | ❌ ${result.failed}`);
  }

  console.log('='.repeat(60));
  console.log(`TOTAL: ${results.totalSuccess} documents migrated, ${results.totalFailed} failed`);
  console.log('='.repeat(60) + '\n');

  if (results.totalFailed > 0) {
    console.log('⚠️  Some documents failed to migrate. Check the logs above for details.\n');
    process.exit(1);
  } else {
    console.log('✅ Migration completed successfully!\n');
    process.exit(0);
  }
}

// Run migration
migrateAllData().catch((error) => {
  console.error('\n❌ Migration failed:', error);
  process.exit(1);
});
