import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@breeder/firebase';
import { HealthTest, ShotRecord, VetVisit, WeightEntry, Medication, Deworming } from '@breeder/types';

// ============================================================================
// HEALTH TESTS
// ============================================================================

export async function addHealthTest(dogId: string, test: Omit<HealthTest, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, `dogs/${dogId}/health_tests`), {
    ...test,
    createdAt: Timestamp.now(),
  });
  return ref.id;
}

export async function getHealthTests(dogId: string): Promise<HealthTest[]> {
  const snapshot = await getDocs(
    query(collection(db, `dogs/${dogId}/health_tests`), orderBy('date', 'desc'))
  );
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HealthTest));
}

export async function updateHealthTest(
  dogId: string,
  testId: string,
  updates: Partial<HealthTest>
): Promise<void> {
  await updateDoc(doc(db, `dogs/${dogId}/health_tests/${testId}`), updates);
}

export async function deleteHealthTest(dogId: string, testId: string): Promise<void> {
  await deleteDoc(doc(db, `dogs/${dogId}/health_tests/${testId}`));
}

// ============================================================================
// SHOT RECORDS
// ============================================================================

export async function addShotRecord(dogId: string, shot: Omit<ShotRecord, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, `dogs/${dogId}/shot_records`), {
    ...shot,
    createdAt: Timestamp.now(),
  });
  return ref.id;
}

export async function getShotRecords(dogId: string): Promise<ShotRecord[]> {
  const snapshot = await getDocs(
    query(collection(db, `dogs/${dogId}/shot_records`), orderBy('dateGiven', 'desc'))
  );
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShotRecord));
}

export async function updateShotRecord(
  dogId: string,
  shotId: string,
  updates: Partial<ShotRecord>
): Promise<void> {
  await updateDoc(doc(db, `dogs/${dogId}/shot_records/${shotId}`), updates);
}

export async function deleteShotRecord(dogId: string, shotId: string): Promise<void> {
  await deleteDoc(doc(db, `dogs/${dogId}/shot_records/${shotId}`));
}

// ============================================================================
// VET VISITS
// ============================================================================

export async function addVetVisit(dogId: string, visit: Omit<VetVisit, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, `dogs/${dogId}/vet_visits`), {
    ...visit,
    createdAt: Timestamp.now(),
  });
  return ref.id;
}

export async function getVetVisits(dogId: string): Promise<VetVisit[]> {
  const snapshot = await getDocs(
    query(collection(db, `dogs/${dogId}/vet_visits`), orderBy('date', 'desc'))
  );
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VetVisit));
}

export async function updateVetVisit(
  dogId: string,
  visitId: string,
  updates: Partial<VetVisit>
): Promise<void> {
  await updateDoc(doc(db, `dogs/${dogId}/vet_visits/${visitId}`), updates);
}

export async function deleteVetVisit(dogId: string, visitId: string): Promise<void> {
  await deleteDoc(doc(db, `dogs/${dogId}/vet_visits/${visitId}`));
}

// ============================================================================
// WEIGHT HISTORY
// ============================================================================

export async function addWeightEntry(dogId: string, entry: Omit<WeightEntry, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, `dogs/${dogId}/weight_history`), entry);
  return ref.id;
}

export async function getWeightHistory(dogId: string): Promise<WeightEntry[]> {
  const snapshot = await getDocs(
    query(collection(db, `dogs/${dogId}/weight_history`), orderBy('date', 'desc'))
  );
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WeightEntry));
}

export async function updateWeightEntry(
  dogId: string,
  entryId: string,
  updates: Partial<WeightEntry>
): Promise<void> {
  await updateDoc(doc(db, `dogs/${dogId}/weight_history/${entryId}`), updates);
}

export async function deleteWeightEntry(dogId: string, entryId: string): Promise<void> {
  await deleteDoc(doc(db, `dogs/${dogId}/weight_history/${entryId}`));
}

// ============================================================================
// MEDICATIONS
// ============================================================================

export async function addMedication(dogId: string, medication: Omit<Medication, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, `dogs/${dogId}/medications`), {
    ...medication,
    createdAt: Timestamp.now(),
  });
  return ref.id;
}

export async function getMedications(dogId: string): Promise<Medication[]> {
  const snapshot = await getDocs(
    query(collection(db, `dogs/${dogId}/medications`), orderBy('startDate', 'desc'))
  );
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Medication));
}

export async function updateMedication(
  dogId: string,
  medicationId: string,
  updates: Partial<Medication>
): Promise<void> {
  await updateDoc(doc(db, `dogs/${dogId}/medications/${medicationId}`), updates);
}

export async function deleteMedication(dogId: string, medicationId: string): Promise<void> {
  await deleteDoc(doc(db, `dogs/${dogId}/medications/${medicationId}`));
}

// ============================================================================
// DEWORMINGS
// ============================================================================

export async function addDeworming(dogId: string, deworming: Omit<Deworming, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, `dogs/${dogId}/dewormings`), {
    ...deworming,
    createdAt: Timestamp.now(),
  });
  return ref.id;
}

export async function getDewormings(dogId: string): Promise<Deworming[]> {
  const snapshot = await getDocs(
    query(collection(db, `dogs/${dogId}/dewormings`), orderBy('date', 'desc'))
  );
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Deworming));
}

export async function updateDeworming(
  dogId: string,
  dewormingId: string,
  updates: Partial<Deworming>
): Promise<void> {
  await updateDoc(doc(db, `dogs/${dogId}/dewormings/${dewormingId}`), updates);
}

export async function deleteDeworming(dogId: string, dewormingId: string): Promise<void> {
  await deleteDoc(doc(db, `dogs/${dogId}/dewormings/${dewormingId}`));
}

// ============================================================================
// BATCH LOAD (For Performance)
// ============================================================================

/**
 * Load all subcollection data for a dog in parallel
 * This is more efficient than loading them one at a time
 */
export async function loadAllDogSubcollections(dogId: string) {
  const [healthTests, shotRecords, vetVisits, weightHistory, medications, dewormings] = await Promise.all([
    getHealthTests(dogId).catch(() => [] as HealthTest[]),
    getShotRecords(dogId).catch(() => [] as ShotRecord[]),
    getVetVisits(dogId).catch(() => [] as VetVisit[]),
    getWeightHistory(dogId).catch(() => [] as WeightEntry[]),
    getMedications(dogId).catch(() => [] as Medication[]),
    getDewormings(dogId).catch(() => [] as Deworming[]),
  ]);

  return {
    healthTests,
    shotRecords,
    vetVisits,
    weightHistory,
    medications,
    dewormings,
  };
}
