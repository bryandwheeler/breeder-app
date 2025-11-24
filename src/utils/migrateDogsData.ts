import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Migration utility to add new health tracking fields to existing dogs
 * Run this once to update all dogs in the database
 */
export async function migrateDogsData(userId: string) {
  console.log('Starting dog data migration...');

  try {
    // Query only the current user's dogs
    const dogsRef = collection(db, 'dogs');
    const q = query(dogsRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);

    let updated = 0;
    let skipped = 0;

    for (const dogDoc of snapshot.docs) {
      const dogData = dogDoc.data();

      // Check if migration is needed
      const needsMigration =
        dogData.weightHistory === undefined ||
        dogData.medications === undefined ||
        dogData.dewormings === undefined ||
        dogData.vetVisits === undefined;

      if (needsMigration) {
        const updates: any = {};

        if (dogData.weightHistory === undefined) {
          updates.weightHistory = [];
        }
        if (dogData.medications === undefined) {
          updates.medications = [];
        }
        if (dogData.dewormings === undefined) {
          updates.dewormings = [];
        }
        if (dogData.vetVisits === undefined) {
          updates.vetVisits = [];
        }

        await updateDoc(doc(db, 'dogs', dogDoc.id), updates);
        updated++;
        console.log(`✓ Updated dog: ${dogData.name}`);
      } else {
        skipped++;
      }
    }

    console.log(`\n✅ Migration complete!`);
    console.log(`   Updated: ${updated} dogs`);
    console.log(`   Skipped: ${skipped} dogs (already migrated)`);

    return { updated, skipped };
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}
