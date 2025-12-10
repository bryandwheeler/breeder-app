/**
 * Migration script: Move dog nested arrays to subcollections
 *
 * This script migrates:
 * - healthTests[]
 * - shotRecords[]
 * - vetVisits[]
 * - weightHistory[]
 * - medications[]
 * - dewormings[]
 *
 * From nested arrays on the dog document to subcollections.
 *
 * Run with: npx tsx scripts/migrateDogSubcollections.ts
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

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

const db = admin.firestore();

interface MigrationStats {
  dogsProcessed: number;
  healthTestsMigrated: number;
  shotRecordsMigrated: number;
  vetVisitsMigrated: number;
  weightEntriesMigrated: number;
  medicationsMigrated: number;
  dewormingsMigrated: number;
  errors: string[];
}

async function migrateDogSubcollections(dryRun = true): Promise<MigrationStats> {
  const stats: MigrationStats = {
    dogsProcessed: 0,
    healthTestsMigrated: 0,
    shotRecordsMigrated: 0,
    vetVisitsMigrated: 0,
    weightEntriesMigrated: 0,
    medicationsMigrated: 0,
    dewormingsMigrated: 0,
    errors: [],
  };

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Dog Subcollection Migration${dryRun ? ' (DRY RUN)' : ''}`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    // Get all dogs
    const dogsSnapshot = await db.collection('dogs').get();
    console.log(`Found ${dogsSnapshot.size} dogs to process\n`);

    for (const dogDoc of dogsSnapshot.docs) {
      const dogId = dogDoc.id;
      const dogData = dogDoc.data();

      console.log(`Processing dog: ${dogId} (${dogData.name || 'Unnamed'})`);

      let batch = db.batch();
      let batchCount = 0;
      const MAX_BATCH_SIZE = 500;

      // Migrate health tests
      if (dogData.healthTests && Array.isArray(dogData.healthTests) && dogData.healthTests.length > 0) {
        console.log(`  - Migrating ${dogData.healthTests.length} health tests`);
        for (const test of dogData.healthTests) {
          const subcollectionRef = db.collection(`dogs/${dogId}/health_tests`).doc();
          if (!dryRun) {
            batch.set(subcollectionRef, {
              ...test,
              createdAt: test.createdAt || admin.firestore.Timestamp.now(),
            });
            batchCount++;
          }
          stats.healthTestsMigrated++;

          if (batchCount >= MAX_BATCH_SIZE) {
            if (!dryRun) await batch.commit();
            batch = db.batch();
            batchCount = 0;
          }
        }
      }

      // Migrate shot records
      if (dogData.shotRecords && Array.isArray(dogData.shotRecords) && dogData.shotRecords.length > 0) {
        console.log(`  - Migrating ${dogData.shotRecords.length} shot records`);
        for (const shot of dogData.shotRecords) {
          const subcollectionRef = db.collection(`dogs/${dogId}/shot_records`).doc();
          if (!dryRun) {
            batch.set(subcollectionRef, {
              ...shot,
              createdAt: shot.createdAt || admin.firestore.Timestamp.now(),
            });
            batchCount++;
          }
          stats.shotRecordsMigrated++;

          if (batchCount >= MAX_BATCH_SIZE) {
            if (!dryRun) await batch.commit();
            batch = db.batch();
            batchCount = 0;
          }
        }
      }

      // Migrate vet visits
      if (dogData.vetVisits && Array.isArray(dogData.vetVisits) && dogData.vetVisits.length > 0) {
        console.log(`  - Migrating ${dogData.vetVisits.length} vet visits`);
        for (const visit of dogData.vetVisits) {
          const subcollectionRef = db.collection(`dogs/${dogId}/vet_visits`).doc();
          if (!dryRun) {
            batch.set(subcollectionRef, {
              ...visit,
              createdAt: visit.createdAt || admin.firestore.Timestamp.now(),
            });
            batchCount++;
          }
          stats.vetVisitsMigrated++;

          if (batchCount >= MAX_BATCH_SIZE) {
            if (!dryRun) await batch.commit();
            batch = db.batch();
            batchCount = 0;
          }
        }
      }

      // Migrate weight history
      if (dogData.weightHistory && Array.isArray(dogData.weightHistory) && dogData.weightHistory.length > 0) {
        console.log(`  - Migrating ${dogData.weightHistory.length} weight entries`);
        for (const entry of dogData.weightHistory) {
          const subcollectionRef = db.collection(`dogs/${dogId}/weight_history`).doc();
          if (!dryRun) {
            batch.set(subcollectionRef, entry);
            batchCount++;
          }
          stats.weightEntriesMigrated++;

          if (batchCount >= MAX_BATCH_SIZE) {
            if (!dryRun) await batch.commit();
            batch = db.batch();
            batchCount = 0;
          }
        }
      }

      // Migrate medications
      if (dogData.medications && Array.isArray(dogData.medications) && dogData.medications.length > 0) {
        console.log(`  - Migrating ${dogData.medications.length} medications`);
        for (const med of dogData.medications) {
          const subcollectionRef = db.collection(`dogs/${dogId}/medications`).doc();
          if (!dryRun) {
            batch.set(subcollectionRef, {
              ...med,
              createdAt: med.createdAt || admin.firestore.Timestamp.now(),
            });
            batchCount++;
          }
          stats.medicationsMigrated++;

          if (batchCount >= MAX_BATCH_SIZE) {
            if (!dryRun) await batch.commit();
            batch = db.batch();
            batchCount = 0;
          }
        }
      }

      // Migrate dewormings
      if (dogData.dewormings && Array.isArray(dogData.dewormings) && dogData.dewormings.length > 0) {
        console.log(`  - Migrating ${dogData.dewormings.length} dewormings`);
        for (const deworming of dogData.dewormings) {
          const subcollectionRef = db.collection(`dogs/${dogId}/dewormings`).doc();
          if (!dryRun) {
            batch.set(subcollectionRef, {
              ...deworming,
              createdAt: deworming.createdAt || admin.firestore.Timestamp.now(),
            });
            batchCount++;
          }
          stats.dewormingsMigrated++;

          if (batchCount >= MAX_BATCH_SIZE) {
            if (!dryRun) await batch.commit();
            batch = db.batch();
            batchCount = 0;
          }
        }
      }

      // Commit any remaining batch operations
      if (batchCount > 0 && !dryRun) {
        await batch.commit();
      }

      stats.dogsProcessed++;
      console.log(`  ✓ Dog ${dogId} processed\n`);
    }

    // Print summary
    console.log(`\n${'='.repeat(60)}`);
    console.log('Migration Summary');
    console.log(`${'='.repeat(60)}`);
    console.log(`Dogs processed: ${stats.dogsProcessed}`);
    console.log(`Health tests migrated: ${stats.healthTestsMigrated}`);
    console.log(`Shot records migrated: ${stats.shotRecordsMigrated}`);
    console.log(`Vet visits migrated: ${stats.vetVisitsMigrated}`);
    console.log(`Weight entries migrated: ${stats.weightEntriesMigrated}`);
    console.log(`Medications migrated: ${stats.medicationsMigrated}`);
    console.log(`Dewormings migrated: ${stats.dewormingsMigrated}`);
    console.log(`Errors: ${stats.errors.length}`);

    if (dryRun) {
      console.log(`\n⚠️  DRY RUN - No data was actually migrated`);
      console.log(`Run with --execute flag to perform actual migration`);
    } else {
      console.log(`\n✅ Migration completed successfully!`);
      console.log(`\nNext steps:`);
      console.log(`1. Verify data in Firebase console`);
      console.log(`2. Remove nested arrays from dog documents (run cleanup script)`);
    }

  } catch (error) {
    console.error('Migration failed:', error);
    stats.errors.push(error instanceof Error ? error.message : String(error));
    throw error;
  }

  return stats;
}

// Run migration
const isDryRun = !process.argv.includes('--execute');

migrateDogSubcollections(isDryRun)
  .then(() => {
    console.log('\nMigration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nMigration script failed:', error);
    process.exit(1);
  });
