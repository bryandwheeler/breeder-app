/**
 * Migration Script: Convert snake_case string literals to kebab-case
 *
 * This script migrates all Firestore documents that use the old snake_case
 * string literal values to the new kebab-case standard.
 *
 * IMPORTANT: Run this script during a maintenance window with a database backup!
 *
 * Usage:
 *   npx tsx scripts/migrateStringLiterals.ts --dry-run    # Preview changes
 *   npx tsx scripts/migrateStringLiterals.ts --execute    # Execute migration
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.development
dotenv.config({ path: path.join(process.cwd(), '.env.development') });

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
 * Mapping of old snake_case values to new kebab-case values
 */
const STRING_LITERAL_MIGRATIONS: Record<string, string> = {
  // Reminder types
  'vet_visit': 'vet-visit',
  'heat_expected': 'heat-expected',
  'due_date': 'due-date',

  // Breeding methods
  'surgical_ai': 'surgical-ai',

  // Contract types
  'breeding_rights': 'breeding-rights',
  'co_ownership': 'co-ownership',

  // Registration/General statuses
  'not_started': 'not-started',
  'in_progress': 'in-progress',

  // Ownership/Residence
  'co_owner': 'co-owner',

  // Certificate types
  'litter_certificate': 'litter-certificate',
};

/**
 * Collections and their fields that contain string literals to migrate
 */
interface MigrationTarget {
  collection: string;
  fields: string[];
  nestedFields?: { path: string; field: string }[];
}

const MIGRATION_TARGETS: MigrationTarget[] = [
  {
    collection: 'dogs',
    fields: ['status'],
    nestedFields: [
      { path: 'registration', field: 'status' },
    ],
  },
  {
    collection: 'litters',
    fields: ['status'],
    nestedFields: [
      { path: 'registration', field: 'status' },
    ],
  },
  {
    collection: 'users',
    fields: [],
    nestedFields: [
      { path: 'reminders', field: 'type' },
    ],
  },
  {
    collection: 'breeding_records',  // Legacy name
    fields: ['method'],
  },
  {
    collection: 'breedingRecords',   // New name
    fields: ['method'],
  },
  {
    collection: 'stud_jobs',         // Legacy name
    fields: ['method'],
    nestedFields: [
      { path: 'breeding', field: 'method' },
    ],
  },
  {
    collection: 'studJobs',          // New name
    fields: ['method'],
    nestedFields: [
      { path: 'breeding', field: 'method' },
    ],
  },
];

interface MigrationStats {
  documentsScanned: number;
  documentsUpdated: number;
  fieldsUpdated: number;
  errors: string[];
}

/**
 * Recursively update nested object fields
 */
function updateNestedField(obj: any, path: string, field: string): boolean {
  const parts = path.split('.');
  let current = obj;

  for (const part of parts) {
    if (!current[part]) return false;
    current = current[part];
  }

  if (Array.isArray(current)) {
    let updated = false;
    current.forEach((item) => {
      if (item[field] && STRING_LITERAL_MIGRATIONS[item[field]]) {
        item[field] = STRING_LITERAL_MIGRATIONS[item[field]];
        updated = true;
      }
    });
    return updated;
  } else if (current[field] && STRING_LITERAL_MIGRATIONS[current[field]]) {
    current[field] = STRING_LITERAL_MIGRATIONS[current[field]];
    return true;
  }

  return false;
}

/**
 * Migrate string literals in a single collection
 */
async function migrateCollection(
  target: MigrationTarget,
  dryRun: boolean = true
): Promise<MigrationStats> {
  const stats: MigrationStats = {
    documentsScanned: 0,
    documentsUpdated: 0,
    fieldsUpdated: 0,
    errors: [],
  };

  console.log(`\n📂 Migrating collection: ${target.collection}`);

  try {
    const snapshot = await db.collection(target.collection).get();
    stats.documentsScanned = snapshot.size;

    if (snapshot.empty) {
      console.log(`  ⚠️  Collection is empty`);
      return stats;
    }

    const batch = db.batch();
    let batchCount = 0;

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const updates: any = {};
      let hasUpdates = false;

      // Check regular fields
      for (const field of target.fields) {
        if (data[field] && STRING_LITERAL_MIGRATIONS[data[field]]) {
          updates[field] = STRING_LITERAL_MIGRATIONS[data[field]];
          hasUpdates = true;
          stats.fieldsUpdated++;

          if (dryRun) {
            console.log(
              `  🔄 ${docSnap.id}.${field}: "${data[field]}" → "${updates[field]}"`
            );
          }
        }
      }

      // Check nested fields
      if (target.nestedFields) {
        for (const nested of target.nestedFields) {
          const dataCopy = { ...data };
          if (updateNestedField(dataCopy, nested.path, nested.field)) {
            updates[nested.path] = dataCopy[nested.path];
            hasUpdates = true;
            stats.fieldsUpdated++;

            if (dryRun) {
              console.log(
                `  🔄 ${docSnap.id}.${nested.path}.${nested.field}: updated`
              );
            }
          }
        }
      }

      // Apply updates
      if (hasUpdates) {
        stats.documentsUpdated++;

        if (!dryRun) {
          batch.update(db.collection(target.collection).doc(docSnap.id), updates);
          batchCount++;

          // Firestore batch limit is 500 operations
          if (batchCount >= 500) {
            await batch.commit();
            console.log(`  ✅ Committed batch of ${batchCount} updates`);
            batchCount = 0;
          }
        }
      }
    }

    // Commit remaining updates
    if (!dryRun && batchCount > 0) {
      await batch.commit();
      console.log(`  ✅ Committed final batch of ${batchCount} updates`);
    }

    console.log(
      `  📊 Scanned: ${stats.documentsScanned}, Updated: ${stats.documentsUpdated}, Fields: ${stats.fieldsUpdated}`
    );
  } catch (error) {
    const errorMsg = `Error migrating ${target.collection}: ${error}`;
    stats.errors.push(errorMsg);
    console.error(`  ❌ ${errorMsg}`);
  }

  return stats;
}

/**
 * Main migration function
 */
async function runMigration(dryRun: boolean = true) {
  console.log('\n🚀 Starting String Literal Migration');
  console.log(`📝 Mode: ${dryRun ? 'DRY RUN (no changes)' : 'EXECUTE (writing to database)'}`);
  console.log('\n📋 Migrations to apply:');
  Object.entries(STRING_LITERAL_MIGRATIONS).forEach(([old, new_]) => {
    console.log(`  "${old}" → "${new_}"`);
  });

  const totalStats: MigrationStats = {
    documentsScanned: 0,
    documentsUpdated: 0,
    fieldsUpdated: 0,
    errors: [],
  };

  for (const target of MIGRATION_TARGETS) {
    const stats = await migrateCollection(target, dryRun);
    totalStats.documentsScanned += stats.documentsScanned;
    totalStats.documentsUpdated += stats.documentsUpdated;
    totalStats.fieldsUpdated += stats.fieldsUpdated;
    totalStats.errors.push(...stats.errors);
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Migration Summary');
  console.log('='.repeat(60));
  console.log(`Documents Scanned:  ${totalStats.documentsScanned}`);
  console.log(`Documents Updated:  ${totalStats.documentsUpdated}`);
  console.log(`Fields Updated:     ${totalStats.fieldsUpdated}`);
  console.log(`Errors:             ${totalStats.errors.length}`);

  if (totalStats.errors.length > 0) {
    console.log('\n❌ Errors encountered:');
    totalStats.errors.forEach((error) => console.log(`  - ${error}`));
  }

  if (dryRun) {
    console.log(
      '\n⚠️  This was a DRY RUN - no changes were made to the database'
    );
    console.log('   Run with --execute flag to apply changes');
  } else {
    console.log('\n✅ Migration completed successfully!');
  }

  console.log('='.repeat(60) + '\n');
}

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = !args.includes('--execute');

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
String Literal Migration Script

Migrates snake_case string literals to kebab-case in Firestore.

Usage:
  npx tsx scripts/migrateStringLiterals.ts [OPTIONS]

Options:
  --dry-run     Preview changes without modifying database (default)
  --execute     Execute the migration and update the database
  --help, -h    Show this help message

Examples:
  # Preview changes
  npx tsx scripts/migrateStringLiterals.ts

  # Execute migration
  npx tsx scripts/migrateStringLiterals.ts --execute
  `);
  process.exit(0);
}

// Run the migration
runMigration(isDryRun)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
