/**
 * Restore Script: Restore collections from backup JSON files
 *
 * This script restores Firestore collections from the backup files
 * created during migration.
 *
 * Usage:
 *   npx tsx scripts/restoreFromBackup.ts --to-new-names    # Restore to camelCase names
 *   npx tsx scripts/restoreFromBackup.ts --to-old-names    # Restore to snake_case names
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.development') });

// Initialize Firebase Admin SDK
if (getApps().length === 0) {
  initializeApp({
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  });
}

const db = getFirestore();

interface BackupDocument {
  id: string;
  data: any;
}

const COLLECTION_MAPPING: Record<string, string> = {
  'breeder_profiles': 'breederProfiles',
  'breeding_records': 'breedingRecords',
  'heat_cycles': 'heatCycles',
  'stud_jobs': 'studJobs',
  'customer_segments': 'customerSegments',
};

async function findLatestBackup(oldName: string): Promise<string | null> {
  const backupDir = path.join(process.cwd(), 'backups');

  if (!fs.existsSync(backupDir)) {
    console.error(`Backup directory not found: ${backupDir}`);
    return null;
  }

  const files = fs.readdirSync(backupDir);
  const matchingFiles = files.filter(f => f.startsWith(oldName) && f.endsWith('.json'));

  if (matchingFiles.length === 0) {
    console.log(`  ℹ️  No backup found for ${oldName}`);
    return null;
  }

  // Sort by filename (which includes timestamp) and get the latest
  matchingFiles.sort().reverse();
  return path.join(backupDir, matchingFiles[0]);
}

async function restoreCollection(
  backupFile: string,
  targetCollection: string
): Promise<number> {
  console.log(`\n📥 Restoring: ${path.basename(backupFile)} → ${targetCollection}`);

  try {
    // Read backup file
    const backupData: BackupDocument[] = JSON.parse(
      fs.readFileSync(backupFile, 'utf-8')
    );

    console.log(`  📊 Found ${backupData.length} documents to restore`);

    if (backupData.length === 0) {
      console.log(`  ⚠️  Backup file is empty, nothing to restore`);
      return 0;
    }

    // Restore documents in batches
    const batchSize = 500;
    let restoredCount = 0;

    for (let i = 0; i < backupData.length; i += batchSize) {
      const batch = db.batch();
      const batchDocs = backupData.slice(i, Math.min(i + batchSize, backupData.length));

      batchDocs.forEach((doc) => {
        const docRef = db.collection(targetCollection).doc(doc.id);
        batch.set(docRef, doc.data);
      });

      await batch.commit();
      restoredCount += batchDocs.length;

      console.log(
        `  ✅ Restored batch ${Math.floor(i / batchSize) + 1}: ${restoredCount}/${backupData.length} documents`
      );
    }

    console.log(`  ✅ Successfully restored ${restoredCount} documents`);
    return restoredCount;
  } catch (error) {
    console.error(`  ❌ Error restoring collection: ${error}`);
    throw error;
  }
}

async function runRestore(useNewNames: boolean) {
  console.log('\n' + '='.repeat(80));
  console.log('📦 Firestore Collection Restore');
  console.log('='.repeat(80));
  console.log(`📝 Target: ${useNewNames ? 'camelCase names' : 'snake_case names'}`);
  console.log(`🕐 Started: ${new Date().toLocaleString()}\n`);

  let totalRestored = 0;

  for (const [oldName, newName] of Object.entries(COLLECTION_MAPPING)) {
    const backupFile = await findLatestBackup(oldName);

    if (!backupFile) {
      continue;
    }

    const targetCollection = useNewNames ? newName : oldName;
    const count = await restoreCollection(backupFile, targetCollection);
    totalRestored += count;
  }

  console.log('\n' + '='.repeat(80));
  console.log('📊 Restore Summary');
  console.log('='.repeat(80));
  console.log(`Total Documents Restored: ${totalRestored}`);
  console.log(`Target Naming: ${useNewNames ? 'camelCase' : 'snake_case'}`);
  console.log('\n✅ Restore completed successfully!');
  console.log('🕐 Completed: ' + new Date().toLocaleString());
  console.log('='.repeat(80) + '\n');
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Firestore Collection Restore Script

Restores collections from backup JSON files.

Usage:
  npx tsx scripts/restoreFromBackup.ts [OPTIONS]

Options:
  --to-new-names   Restore to camelCase collection names (recommended)
  --to-old-names   Restore to snake_case collection names
  --help, -h       Show this help message

Examples:
  # Restore to new camelCase names
  npx tsx scripts/restoreFromBackup.ts --to-new-names

  # Restore to old snake_case names
  npx tsx scripts/restoreFromBackup.ts --to-old-names
  `);
  process.exit(0);
}

const useNewNames = args.includes('--to-new-names');
const useOldNames = args.includes('--to-old-names');

if (!useNewNames && !useOldNames) {
  console.error('\n❌ Error: You must specify either --to-new-names or --to-old-names\n');
  console.log('Run with --help for usage information');
  process.exit(1);
}

runRestore(useNewNames)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Restore failed:', error);
    process.exit(1);
  });
