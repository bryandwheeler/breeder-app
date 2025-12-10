/**
 * Migration Script: Rename Firestore Collections from snake_case to camelCase
 *
 * This script renames Firestore collections to follow camelCase naming convention.
 *
 * ⚠️  WARNING: This is a HIGH-RISK operation!
 * - Creates a complete backup before starting
 * - Cannot be automatically rolled back
 * - Requires application downtime
 * - May take significant time for large collections
 *
 * Collections to migrate:
 * - breeder_profiles   → breederProfiles
 * - breeding_records   → breedingRecords
 * - heat_cycles        → heatCycles
 * - stud_jobs          → studJobs
 * - customer_segments  → customerSegments
 *
 * Usage:
 *   npx tsx scripts/migrateCollections.ts --dry-run    # Preview changes
 *   npx tsx scripts/migrateCollections.ts --backup     # Create backup only
 *   npx tsx scripts/migrateCollections.ts --execute    # Execute migration
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env.production or .env.development
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: path.join(process.cwd(), envFile) });

// Initialize Firebase Admin SDK
// For local development, set GOOGLE_APPLICATION_CREDENTIALS environment variable
// to point to your service account key JSON file, or use gcloud auth
if (getApps().length === 0) {
  initializeApp({
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  });
}

const db = getFirestore();

/**
 * Collection rename mappings
 */
const COLLECTION_MIGRATIONS = [
  { from: 'breeder_profiles', to: 'breederProfiles' },
  { from: 'breeding_records', to: 'breedingRecords' },
  { from: 'heat_cycles', to: 'heatCycles' },
  { from: 'stud_jobs', to: 'studJobs' },
  { from: 'customer_segments', to: 'customerSegments' },
];

interface MigrationStats {
  collection: string;
  documentsCount: number;
  documentsCopied: number;
  documentsDeleted: number;
  errors: string[];
  startTime: Date;
  endTime?: Date;
  durationMs?: number;
}

/**
 * Create a backup of a collection to a JSON file
 */
async function backupCollection(collectionName: string): Promise<string> {
  console.log(`📦 Backing up collection: ${collectionName}`);

  try {
    const snapshot = await db.collection(collectionName).get();

    if (snapshot.empty) {
      console.log(`  ⚠️  Collection is empty, skipping backup`);
      return '';
    }

    const data: any[] = [];
    snapshot.docs.forEach((doc) => {
      data.push({
        id: doc.id,
        data: doc.data(),
      });
    });

    // Create backups directory
    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = path.join(
      backupDir,
      `${collectionName}_${timestamp}.json`
    );

    // Write backup file
    fs.writeFileSync(filename, JSON.stringify(data, null, 2));

    console.log(`  ✅ Backed up ${data.length} documents to: ${filename}`);
    return filename;
  } catch (error) {
    console.error(`  ❌ Backup failed: ${error}`);
    throw error;
  }
}

/**
 * Copy all documents from one collection to another
 */
async function copyCollection(
  fromCollection: string,
  toCollection: string,
  dryRun: boolean = true
): Promise<MigrationStats> {
  const stats: MigrationStats = {
    collection: `${fromCollection} → ${toCollection}`,
    documentsCount: 0,
    documentsCopied: 0,
    documentsDeleted: 0,
    errors: [],
    startTime: new Date(),
  };

  console.log(`\n🔄 Migrating: ${fromCollection} → ${toCollection}`);

  try {
    // Get all documents from source collection
    const snapshot = await db.collection(fromCollection).get();
    stats.documentsCount = snapshot.size;

    if (snapshot.empty) {
      console.log(`  ⚠️  Source collection is empty, nothing to migrate`);
      stats.endTime = new Date();
      stats.durationMs = stats.endTime.getTime() - stats.startTime.getTime();
      return stats;
    }

    console.log(`  📊 Found ${stats.documentsCount} documents to migrate`);

    if (dryRun) {
      console.log(`  ℹ️  DRY RUN - would copy ${stats.documentsCount} documents`);
      stats.documentsCopied = stats.documentsCount;
      stats.endTime = new Date();
      stats.durationMs = stats.endTime.getTime() - stats.startTime.getTime();
      return stats;
    }

    // Copy documents in batches (Firestore limit is 500 per batch)
    const batchSize = 500;
    const documents = snapshot.docs;

    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = db.batch();
      const batchDocs = documents.slice(i, Math.min(i + batchSize, documents.length));

      batchDocs.forEach((docSnap) => {
        const newDocRef = db.collection(toCollection).doc(docSnap.id);
        batch.set(newDocRef, docSnap.data());
      });

      await batch.commit();
      stats.documentsCopied += batchDocs.length;

      console.log(
        `  ✅ Copied batch ${Math.floor(i / batchSize) + 1}: ${stats.documentsCopied}/${stats.documentsCount} documents`
      );
    }

    console.log(`  ✅ Successfully copied ${stats.documentsCopied} documents`);
  } catch (error) {
    const errorMsg = `Error copying collection: ${error}`;
    stats.errors.push(errorMsg);
    console.error(`  ❌ ${errorMsg}`);
    throw error;
  }

  stats.endTime = new Date();
  stats.durationMs = stats.endTime.getTime() - stats.startTime.getTime();
  return stats;
}

/**
 * Delete all documents from a collection
 * DANGEROUS: Only call after successful copy and verification
 */
async function deleteCollection(
  collectionName: string,
  dryRun: boolean = true
): Promise<number> {
  console.log(`\n🗑️  Deleting old collection: ${collectionName}`);

  if (dryRun) {
    const snapshot = await db.collection(collectionName).get();
    console.log(`  ℹ️  DRY RUN - would delete ${snapshot.size} documents`);
    return snapshot.size;
  }

  try {
    const snapshot = await db.collection(collectionName).get();
    const batchSize = 500;
    const documents = snapshot.docs;
    let deletedCount = 0;

    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = db.batch();
      const batchDocs = documents.slice(i, Math.min(i + batchSize, documents.length));

      batchDocs.forEach((docSnap) => {
        batch.delete(db.collection(collectionName).doc(docSnap.id));
      });

      await batch.commit();
      deletedCount += batchDocs.length;

      console.log(
        `  ✅ Deleted batch ${Math.floor(i / batchSize) + 1}: ${deletedCount}/${documents.length} documents`
      );
    }

    console.log(`  ✅ Successfully deleted ${deletedCount} documents`);
    return deletedCount;
  } catch (error) {
    console.error(`  ❌ Error deleting collection: ${error}`);
    throw error;
  }
}

/**
 * Verify that source and destination collections have the same document count
 */
async function verifyMigration(
  fromCollection: string,
  toCollection: string
): Promise<boolean> {
  console.log(`\n🔍 Verifying migration: ${fromCollection} → ${toCollection}`);

  try {
    const [fromSnapshot, toSnapshot] = await Promise.all([
      db.collection(fromCollection).get(),
      db.collection(toCollection).get(),
    ]);

    const fromCount = fromSnapshot.size;
    const toCount = toSnapshot.size;

    console.log(`  📊 Source: ${fromCount} documents`);
    console.log(`  📊 Destination: ${toCount} documents`);

    if (fromCount === toCount) {
      console.log(`  ✅ Verification passed! Counts match.`);
      return true;
    } else {
      console.error(
        `  ❌ Verification failed! Count mismatch: ${fromCount} → ${toCount}`
      );
      return false;
    }
  } catch (error) {
    console.error(`  ❌ Verification error: ${error}`);
    return false;
  }
}

/**
 * Main migration orchestration
 */
async function runMigration(mode: 'dry-run' | 'backup' | 'execute') {
  console.log('\n' + '='.repeat(80));
  console.log('🚀 Firestore Collection Migration');
  console.log('='.repeat(80));
  console.log(`📝 Mode: ${mode.toUpperCase()}`);
  console.log(`🕐 Started: ${new Date().toLocaleString()}`);

  const allStats: MigrationStats[] = [];
  const backupFiles: string[] = [];

  try {
    // Step 1: Create backups
    console.log('\n' + '='.repeat(80));
    console.log('📦 STEP 1: Creating Backups');
    console.log('='.repeat(80));

    for (const migration of COLLECTION_MIGRATIONS) {
      const backupFile = await backupCollection(migration.from);
      if (backupFile) {
        backupFiles.push(backupFile);
      }
    }

    if (mode === 'backup') {
      console.log('\n✅ Backup completed successfully!');
      console.log(`📁 Backup files: ${backupFiles.length}`);
      backupFiles.forEach((file) => console.log(`   - ${file}`));
      return;
    }

    // Step 2: Copy collections
    console.log('\n' + '='.repeat(80));
    console.log('🔄 STEP 2: Copying Collections');
    console.log('='.repeat(80));

    for (const migration of COLLECTION_MIGRATIONS) {
      const stats = await copyCollection(
        migration.from,
        migration.to,
        mode === 'dry-run'
      );
      allStats.push(stats);

      // Verify if executing
      if (mode === 'execute' && stats.errors.length === 0) {
        const verified = await verifyMigration(migration.from, migration.to);
        if (!verified) {
          throw new Error(
            `Verification failed for ${migration.from} → ${migration.to}`
          );
        }
      }
    }

    // Step 3: Delete old collections (only in execute mode)
    if (mode === 'execute') {
      console.log('\n' + '='.repeat(80));
      console.log('🗑️  STEP 3: Deleting Old Collections');
      console.log('='.repeat(80));
      console.log('⚠️  This will permanently delete the old collections!');
      console.log('⚠️  Make sure you have verified the backups!');

      for (const migration of COLLECTION_MIGRATIONS) {
        const deletedCount = await deleteCollection(migration.from, false);
        const stat = allStats.find((s) => s.collection.startsWith(migration.from));
        if (stat) {
          stat.documentsDeleted = deletedCount;
        }
      }
    }

    // Print summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 Migration Summary');
    console.log('='.repeat(80));

    let totalDocs = 0;
    let totalCopied = 0;
    let totalDeleted = 0;
    let totalErrors = 0;

    allStats.forEach((stat) => {
      console.log(`\n${stat.collection}:`);
      console.log(`  Total Documents:    ${stat.documentsCount}`);
      console.log(`  Documents Copied:   ${stat.documentsCopied}`);
      console.log(`  Documents Deleted:  ${stat.documentsDeleted}`);
      console.log(`  Errors:             ${stat.errors.length}`);
      console.log(`  Duration:           ${stat.durationMs}ms`);

      totalDocs += stat.documentsCount;
      totalCopied += stat.documentsCopied;
      totalDeleted += stat.documentsDeleted;
      totalErrors += stat.errors.length;

      if (stat.errors.length > 0) {
        stat.errors.forEach((err) => console.log(`    ❌ ${err}`));
      }
    });

    console.log('\n' + '-'.repeat(80));
    console.log(`Total Documents:      ${totalDocs}`);
    console.log(`Total Copied:         ${totalCopied}`);
    console.log(`Total Deleted:        ${totalDeleted}`);
    console.log(`Total Errors:         ${totalErrors}`);

    console.log('\n📁 Backup Files:');
    backupFiles.forEach((file) => console.log(`  - ${file}`));

    if (mode === 'dry-run') {
      console.log('\n⚠️  This was a DRY RUN - no changes were made');
      console.log('   Run with --execute to apply changes');
    } else if (mode === 'execute') {
      console.log('\n✅ Migration completed successfully!');
      console.log('\n⚠️  IMPORTANT: Update your application code to use new collection names!');
      console.log('   See NAMING_CONVENTIONS.md for details');
    }

    console.log('\n🕐 Completed: ' + new Date().toLocaleString());
    console.log('='.repeat(80) + '\n');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('\n🔄 ROLLBACK INSTRUCTIONS:');
    console.error('1. Stop the migration immediately');
    console.error('2. Restore from backups:');
    backupFiles.forEach((file) => {
      console.error(`   - Use backup: ${file}`);
    });
    console.error('3. Contact your database administrator');
    throw error;
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Firestore Collection Migration Script

Renames collections from snake_case to camelCase.

⚠️  WARNING: HIGH-RISK OPERATION
- Requires application downtime
- Creates backups before migration
- Cannot be automatically rolled back

Usage:
  npx tsx scripts/migrateCollections.ts [MODE]

Modes:
  --dry-run     Preview changes without modifying database (default)
  --backup      Create backups only, no migration
  --execute     Execute the full migration (DANGEROUS!)
  --help, -h    Show this help message

Examples:
  # Preview the migration
  npx tsx scripts/migrateCollections.ts --dry-run

  # Create backups only
  npx tsx scripts/migrateCollections.ts --backup

  # Execute the migration (use with caution!)
  npx tsx scripts/migrateCollections.ts --execute

Collections to be migrated:
  breeder_profiles   → breederProfiles
  breeding_records   → breedingRecords
  heat_cycles        → heatCycles
  stud_jobs          → studJobs
  customer_segments  → customerSegments
  `);
  process.exit(0);
}

// Determine mode
let mode: 'dry-run' | 'backup' | 'execute' = 'dry-run';
if (args.includes('--execute')) {
  mode = 'execute';
} else if (args.includes('--backup')) {
  mode = 'backup';
}

// Confirm execution mode
if (mode === 'execute') {
  console.log('\n⚠️  WARNING: You are about to execute a LIVE MIGRATION!');
  console.log('This will permanently modify your Firestore database.');
  console.log('\nPress Ctrl+C now to cancel, or wait 5 seconds to continue...\n');

  setTimeout(() => {
    runMigration(mode)
      .then(() => process.exit(0))
      .catch((error) => {
        console.error('Migration failed:', error);
        process.exit(1);
      });
  }, 5000);
} else {
  runMigration(mode)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}
