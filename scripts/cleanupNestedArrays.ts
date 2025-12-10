/**
 * Cleanup script: Remove nested arrays after migration to subcollections
 *
 * This script removes the old nested array fields from documents after
 * verifying that data has been successfully migrated to subcollections.
 *
 * IMPORTANT: Only run this after:
 * 1. Running migration scripts
 * 2. Verifying data in Firebase console
 * 3. Testing the app with subcollection data
 *
 * Run with: npx tsx scripts/cleanupNestedArrays.ts
 */

import admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin SDK
const serviceAccountPath = process.env.FIREBASE_ADMIN_KEY_PATH ||
  path.join(__dirname, '..', 'firebase-admin-key.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error(`❌ Service account key not found at: ${serviceAccountPath}`);
  console.error(`Please set FIREBASE_ADMIN_KEY_PATH environment variable or ensure firebase-admin-key.json exists.`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

// Check if admin app is already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

const db = admin.firestore();

interface CleanupStats {
  dogsProcessed: number;
  littersProcessed: number;
  fieldsRemoved: number;
  errors: string[];
}

async function verifySubcollectionExists(
  parentPath: string,
  subcollectionName: string
): Promise<boolean> {
  const subcollectionRef = db.collection(`${parentPath}/${subcollectionName}`);
  const snapshot = await subcollectionRef.get();
  return !snapshot.empty;
}

async function cleanupNestedArrays(dryRun = true): Promise<CleanupStats> {
  const stats: CleanupStats = {
    dogsProcessed: 0,
    littersProcessed: 0,
    fieldsRemoved: 0,
    errors: [],
  };

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Nested Array Cleanup${dryRun ? ' (DRY RUN)' : ''}`);
  console.log(`${'='.repeat(60)}\n`);

  console.log('⚠️  WARNING: This will permanently remove nested array fields!');
  console.log('Make sure you have:');
  console.log('  1. Successfully run migration scripts');
  console.log('  2. Verified data in Firebase console');
  console.log('  3. Tested the app with subcollection data\n');

  try {
    // Cleanup dogs
    console.log('Cleaning up dog documents...\n');
    const dogsSnapshot = await db.collection('dogs').get();

    for (const dogDoc of dogsSnapshot.docs) {
      const dogId = dogDoc.id;
      const dogData = dogDoc.data();
      const updates: Record<string, any> = {};

      console.log(`Processing dog: ${dogId} (${dogData.name || 'Unnamed'})`);

      // Check each nested array and verify subcollection exists
      const fieldsToRemove = [
        { field: 'healthTests', subcollection: 'health_tests' },
        { field: 'shotRecords', subcollection: 'shot_records' },
        { field: 'vetVisits', subcollection: 'vet_visits' },
        { field: 'weightHistory', subcollection: 'weight_history' },
        { field: 'medications', subcollection: 'medications' },
        { field: 'dewormings', subcollection: 'dewormings' },
      ];

      for (const { field, subcollection } of fieldsToRemove) {
        if (dogData[field] && Array.isArray(dogData[field])) {
          const hasSubcollection = await verifySubcollectionExists(
            `dogs/${dogId}`,
            subcollection
          );

          if (hasSubcollection || dogData[field].length === 0) {
            console.log(`  - Removing ${field} (${dogData[field].length} items)`);
            updates[field] = admin.firestore.FieldValue.delete();
            stats.fieldsRemoved++;
          } else {
            console.log(
              `  ⚠️  Skipping ${field} - no subcollection found (${dogData[field].length} items)`
            );
            stats.errors.push(
              `Dog ${dogId}: ${field} has data but no subcollection`
            );
          }
        }
      }

      if (Object.keys(updates).length > 0 && !dryRun) {
        await db.collection('dogs').doc(dogId).update(updates);
      }

      stats.dogsProcessed++;
      console.log(`  ✓ Dog ${dogId} processed\n`);
    }

    // Cleanup litters
    console.log('\nCleaning up litter documents...\n');
    const littersSnapshot = await db.collection('litters').get();

    for (const litterDoc of littersSnapshot.docs) {
      const litterId = litterDoc.id;
      const litterData = litterDoc.data();
      const updates: Record<string, any> = {};

      console.log(`Processing litter: ${litterId} (${litterData.litterName || 'Unnamed'})`);

      // Check each nested array and verify subcollection exists
      const fieldsToRemove = [
        { field: 'puppies', subcollection: 'puppies' },
        { field: 'expenses', subcollection: 'expenses' },
      ];

      for (const { field, subcollection } of fieldsToRemove) {
        if (litterData[field] && Array.isArray(litterData[field])) {
          const hasSubcollection = await verifySubcollectionExists(
            `litters/${litterId}`,
            subcollection
          );

          if (hasSubcollection || litterData[field].length === 0) {
            console.log(`  - Removing ${field} (${litterData[field].length} items)`);
            updates[field] = admin.firestore.FieldValue.delete();
            stats.fieldsRemoved++;
          } else {
            console.log(
              `  ⚠️  Skipping ${field} - no subcollection found (${litterData[field].length} items)`
            );
            stats.errors.push(
              `Litter ${litterId}: ${field} has data but no subcollection`
            );
          }
        }
      }

      if (Object.keys(updates).length > 0 && !dryRun) {
        await db.collection('litters').doc(litterId).update(updates);
      }

      stats.littersProcessed++;
      console.log(`  ✓ Litter ${litterId} processed\n`);
    }

    // Print summary
    console.log(`\n${'='.repeat(60)}`);
    console.log('Cleanup Summary');
    console.log(`${'='.repeat(60)}`);
    console.log(`Dogs processed: ${stats.dogsProcessed}`);
    console.log(`Litters processed: ${stats.littersProcessed}`);
    console.log(`Fields removed: ${stats.fieldsRemoved}`);
    console.log(`Errors/Warnings: ${stats.errors.length}`);

    if (stats.errors.length > 0) {
      console.log('\nErrors/Warnings:');
      stats.errors.forEach((error) => console.log(`  - ${error}`));
    }

    if (dryRun) {
      console.log(`\n⚠️  DRY RUN - No fields were actually removed`);
      console.log(`Run with --execute flag to perform actual cleanup`);
    } else {
      console.log(`\n✅ Cleanup completed successfully!`);
      console.log(`\nYour database is now using subcollections exclusively.`);
    }
  } catch (error) {
    console.error('Cleanup failed:', error);
    stats.errors.push(error instanceof Error ? error.message : String(error));
    throw error;
  }

  return stats;
}

// Run cleanup
const isDryRun = !process.argv.includes('--execute');

cleanupNestedArrays(isDryRun)
  .then(() => {
    console.log('\nCleanup script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nCleanup script failed:', error);
    process.exit(1);
  });
