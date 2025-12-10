/**
 * Migration script: Move litter nested arrays to subcollections
 *
 * This script migrates:
 * - puppies[]
 * - expenses[]
 *
 * From nested arrays on the litter document to subcollections.
 * Also updates litter documents with denormalized counts.
 *
 * Run with: npx tsx scripts/migrateLitterSubcollections.ts
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

interface MigrationStats {
  littersProcessed: number;
  puppiesMigrated: number;
  expensesMigrated: number;
  countsUpdated: number;
  errors: string[];
}

async function migrateLitterSubcollections(dryRun = true): Promise<MigrationStats> {
  const stats: MigrationStats = {
    littersProcessed: 0,
    puppiesMigrated: 0,
    expensesMigrated: 0,
    countsUpdated: 0,
    errors: [],
  };

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Litter Subcollection Migration${dryRun ? ' (DRY RUN)' : ''}`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    // Get all litters
    const littersSnapshot = await db.collection('litters').get();
    console.log(`Found ${littersSnapshot.size} litters to process\n`);

    for (const litterDoc of littersSnapshot.docs) {
      const litterId = litterDoc.id;
      const litterData = litterDoc.data();

      console.log(`Processing litter: ${litterId} (${litterData.litterName || 'Unnamed'})`);

      let batch = db.batch();
      let batchCount = 0;
      const MAX_BATCH_SIZE = 500;

      // Track counts for denormalization
      let puppyCount = 0;
      let maleCount = 0;
      let femaleCount = 0;
      let availableCount = 0;
      let reservedCount = 0;
      let soldCount = 0;
      let keptCount = 0;

      // Migrate puppies
      if (litterData.puppies && Array.isArray(litterData.puppies) && litterData.puppies.length > 0) {
        console.log(`  - Migrating ${litterData.puppies.length} puppies`);
        for (const puppy of litterData.puppies) {
          const subcollectionRef = db.collection(`litters/${litterId}/puppies`).doc();
          if (!dryRun) {
            batch.set(subcollectionRef, {
              ...puppy,
              userId: litterData.userId, // Denormalized for cross-litter queries
              litterId: litterId, // Denormalized for cross-litter queries
              createdAt: puppy.createdAt || admin.firestore.Timestamp.now(),
              updatedAt: puppy.updatedAt || admin.firestore.Timestamp.now(),
            });
            batchCount++;
          }
          stats.puppiesMigrated++;

          // Count for denormalization
          puppyCount++;
          if (puppy.sex === 'male') maleCount++;
          if (puppy.sex === 'female') femaleCount++;
          if (puppy.status === 'available') availableCount++;
          if (puppy.status === 'reserved') reservedCount++;
          if (puppy.status === 'sold') soldCount++;
          if (puppy.status === 'kept') keptCount++;

          if (batchCount >= MAX_BATCH_SIZE) {
            if (!dryRun) await batch.commit();
            batch = db.batch();
            batchCount = 0;
          }
        }
      }

      // Migrate expenses
      if (litterData.expenses && Array.isArray(litterData.expenses) && litterData.expenses.length > 0) {
        console.log(`  - Migrating ${litterData.expenses.length} expenses`);
        for (const expense of litterData.expenses) {
          const subcollectionRef = db.collection(`litters/${litterId}/expenses`).doc();
          if (!dryRun) {
            batch.set(subcollectionRef, {
              ...expense,
              createdAt: expense.createdAt || admin.firestore.Timestamp.now(),
            });
            batchCount++;
          }
          stats.expensesMigrated++;

          if (batchCount >= MAX_BATCH_SIZE) {
            if (!dryRun) await batch.commit();
            batch = db.batch();
            batchCount = 0;
          }
        }
      }

      // Update litter document with denormalized counts
      if (puppyCount > 0 && !dryRun) {
        const litterRef = db.collection('litters').doc(litterId);
        batch.update(litterRef, {
          puppyCount,
          maleCount,
          femaleCount,
          availableCount,
          reservedCount,
          soldCount,
          keptCount,
        });
        batchCount++;
        stats.countsUpdated++;
      }

      // Commit any remaining batch operations
      if (batchCount > 0 && !dryRun) {
        await batch.commit();
      }

      if (puppyCount > 0) {
        console.log(`  - Updated counts: ${puppyCount} puppies (${maleCount}M/${femaleCount}F)`);
      }

      stats.littersProcessed++;
      console.log(`  ✓ Litter ${litterId} processed\n`);
    }

    // Print summary
    console.log(`\n${'='.repeat(60)}`);
    console.log('Migration Summary');
    console.log(`${'='.repeat(60)}`);
    console.log(`Litters processed: ${stats.littersProcessed}`);
    console.log(`Puppies migrated: ${stats.puppiesMigrated}`);
    console.log(`Expenses migrated: ${stats.expensesMigrated}`);
    console.log(`Litter counts updated: ${stats.countsUpdated}`);
    console.log(`Errors: ${stats.errors.length}`);

    if (dryRun) {
      console.log(`\n⚠️  DRY RUN - No data was actually migrated`);
      console.log(`Run with --execute flag to perform actual migration`);
    } else {
      console.log(`\n✅ Migration completed successfully!`);
      console.log(`\nNext steps:`);
      console.log(`1. Verify data in Firebase console`);
      console.log(`2. Test puppy queries using collection groups`);
      console.log(`3. Remove nested arrays from litter documents (run cleanup script)`);
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

migrateLitterSubcollections(isDryRun)
  .then(() => {
    console.log('\nMigration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nMigration script failed:', error);
    process.exit(1);
  });
