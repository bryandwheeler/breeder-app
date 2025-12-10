# Firebase Architecture Optimization - Implementation Plan

## Overview
This plan implements the optimized database architecture from `DATABASE_ARCHITECTURE.md` to handle 10,000+ breeders and 500,000+ dogs efficiently.

---

## Phase 1: Foundation (Week 1-2) ⭐ START HERE

### Step 1.1: Add Composite Indexes
**File**: `firestore.indexes.json`

**What**: Define all composite indexes needed for efficient queries

**Why**: Without these, queries will be slow and might fail at scale

**Priority**: 🔴 CRITICAL - Must be done first

### Step 1.2: Create Subcollection Utilities
**Files**:
- `src/lib/subcollections/dogSubcollections.ts`
- `src/lib/subcollections/litterSubcollections.ts`

**What**: Helper functions to read/write subcollections

**Why**: Centralized logic, easier to maintain

**Priority**: 🔴 CRITICAL

### Step 1.3: Update Type Definitions
**File**: `src/types/dog.ts`

**What**: Separate types for subcollection documents

**Why**: Type safety for new structure

**Priority**: 🟡 IMPORTANT

---

## Phase 2: Parallel Read/Write (Week 3-4)

### Step 2.1: Update Stores - Read from Both
**Files**: `src/store/dogStoreFirebase.ts`, etc.

**What**:
- Try subcollection first
- Fallback to nested array
- No breaking changes

**Why**: Zero downtime migration

**Priority**: 🔴 CRITICAL

### Step 2.2: Update UI Components - Write to Both
**Files**: All dog/litter edit components

**What**:
- Write to nested array (old)
- Write to subcollection (new)
- Both stay in sync

**Why**: Data consistency during migration

**Priority**: 🔴 CRITICAL

---

## Phase 3: Cloud Functions (Week 5-6)

### Step 3.1: Deploy Migration Functions
**Files**: `functions/src/migrations/`

**What**:
- Migrate existing data to subcollections
- Run in background
- Track progress

**Why**: Migrate 500k+ documents safely

**Priority**: 🔴 CRITICAL

### Step 3.2: Deploy Consistency Functions
**Files**: `functions/src/consistency/`

**What**:
- Update denormalized counts
- Maintain search indexes
- Sync changes

**Why**: Keep data consistent automatically

**Priority**: 🟡 IMPORTANT

---

## Phase 4: Cleanup (Week 7-8)

### Step 4.1: Remove Nested Array Writes
**What**: Stop writing to old nested arrays

**Why**: Reduce write costs

**Priority**: 🟢 NICE TO HAVE

### Step 4.2: Remove Nested Arrays from Schema
**What**: Clean up old data structure

**Why**: Reduce document size

**Priority**: 🟢 NICE TO HAVE (can defer)

---

## Detailed Implementation Steps

## STEP 1.1: Composite Indexes

### Create/Update: `firestore.indexes.json`

```json
{
  "indexes": [
    {
      "collectionGroup": "dogs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "sex", "order": "ASCENDING" },
        { "fieldPath": "isDeceased", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "dogs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "breed", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "litters",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "litters",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "dateOfBirth", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "puppies",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "puppies",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "litterId", "order": "ASCENDING" },
        { "fieldPath": "sex", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "heat_cycles",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "dogId", "order": "ASCENDING" },
        { "fieldPath": "startDate", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "breeding_records",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "dogId", "order": "ASCENDING" },
        { "fieldPath": "breedingDate", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

**Deploy**:
```bash
firebase deploy --only firestore:indexes
```

---

## STEP 1.2: Subcollection Utilities

### Create: `src/lib/subcollections/dogSubcollections.ts`

```typescript
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { HealthTest, ShotRecord, VetVisit, WeightEntry } from '@/types/dog';

// Health Tests
export async function addHealthTest(dogId: string, test: Omit<HealthTest, 'id'>) {
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
) {
  await updateDoc(doc(db, `dogs/${dogId}/health_tests/${testId}`), updates);
}

export async function deleteHealthTest(dogId: string, testId: string) {
  await deleteDoc(doc(db, `dogs/${dogId}/health_tests/${testId}`));
}

// Shot Records
export async function addShotRecord(dogId: string, shot: Omit<ShotRecord, 'id'>) {
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
) {
  await updateDoc(doc(db, `dogs/${dogId}/shot_records/${shotId}`), updates);
}

export async function deleteShotRecord(dogId: string, shotId: string) {
  await deleteDoc(doc(db, `dogs/${dogId}/shot_records/${shotId}`));
}

// Vet Visits
export async function addVetVisit(dogId: string, visit: Omit<VetVisit, 'id'>) {
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
) {
  await updateDoc(doc(db, `dogs/${dogId}/vet_visits/${visitId}`), updates);
}

export async function deleteVetVisit(dogId: string, visitId: string) {
  await deleteDoc(doc(db, `dogs/${dogId}/vet_visits/${visitId}`));
}

// Weight History
export async function addWeightEntry(dogId: string, entry: Omit<WeightEntry, 'id'>) {
  const ref = await addDoc(collection(db, `dogs/${dogId}/weight_history`), entry);
  return ref.id;
}

export async function getWeightHistory(dogId: string): Promise<WeightEntry[]> {
  const snapshot = await getDocs(
    query(collection(db, `dogs/${dogId}/weight_history`), orderBy('date', 'desc'))
  );
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WeightEntry));
}

export async function deleteWeightEntry(dogId: string, entryId: string) {
  await deleteDoc(doc(db, `dogs/${dogId}/weight_history/${entryId}`));
}
```

### Create: `src/lib/subcollections/litterSubcollections.ts`

```typescript
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Puppy, Expense } from '@/types/dog';

// Puppies
export async function addPuppy(
  litterId: string,
  userId: string,
  puppy: Omit<Puppy, 'id'>
): Promise<string> {
  const ref = await addDoc(collection(db, `litters/${litterId}/puppies`), {
    ...puppy,
    userId, // Denormalized for querying
    litterId, // Denormalized for querying
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  // Update litter counts
  await updateLitterCounts(litterId);

  return ref.id;
}

export async function getPuppies(litterId: string): Promise<Puppy[]> {
  const snapshot = await getDocs(collection(db, `litters/${litterId}/puppies`));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Puppy));
}

export async function updatePuppy(
  litterId: string,
  puppyId: string,
  updates: Partial<Puppy>
) {
  await updateDoc(doc(db, `litters/${litterId}/puppies/${puppyId}`), {
    ...updates,
    updatedAt: Timestamp.now(),
  });

  // Update litter counts if status changed
  if (updates.status || updates.sex) {
    await updateLitterCounts(litterId);
  }
}

export async function deletePuppy(litterId: string, puppyId: string) {
  await deleteDoc(doc(db, `litters/${litterId}/puppies/${puppyId}`));
  await updateLitterCounts(litterId);
}

// Helper: Update denormalized counts on litter
async function updateLitterCounts(litterId: string) {
  const puppies = await getPuppies(litterId);

  const counts = {
    puppyCount: puppies.length,
    maleCount: puppies.filter(p => p.sex === 'male').length,
    femaleCount: puppies.filter(p => p.sex === 'female').length,
    availableCount: puppies.filter(p => p.status === 'available').length,
    reservedCount: puppies.filter(p => p.status === 'reserved').length,
    soldCount: puppies.filter(p => p.status === 'sold').length,
  };

  await updateDoc(doc(db, `litters/${litterId}`), counts);
}

// Expenses
export async function addExpense(
  litterId: string,
  expense: Omit<Expense, 'id'>
): Promise<string> {
  const ref = await addDoc(collection(db, `litters/${litterId}/expenses`), {
    ...expense,
    createdAt: Timestamp.now(),
  });
  return ref.id;
}

export async function getExpenses(litterId: string): Promise<Expense[]> {
  const snapshot = await getDocs(
    query(collection(db, `litters/${litterId}/expenses`), orderBy('date', 'desc'))
  );
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
}

export async function updateExpense(
  litterId: string,
  expenseId: string,
  updates: Partial<Expense>
) {
  await updateDoc(doc(db, `litters/${litterId}/expenses/${expenseId}`), updates);
}

export async function deleteExpense(litterId: string, expenseId: string) {
  await deleteDoc(doc(db, `litters/${litterId}/expenses/${expenseId}`));
}

// Query all puppies across litters for a user
export async function getUserPuppies(
  userId: string,
  filters?: {
    status?: Puppy['status'];
    sex?: 'male' | 'female';
  }
): Promise<Puppy[]> {
  let q = query(
    collection(db, 'litters').withConverter(null as any), // Use collectionGroup
    where('userId', '==', userId)
  );

  if (filters?.status) {
    q = query(q, where('status', '==', filters.status));
  }

  if (filters?.sex) {
    q = query(q, where('sex', '==', filters.sex));
  }

  // Note: This requires collectionGroup query
  // We'll implement this properly with the index
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Puppy));
}
```

---

## STEP 1.3: Update Type Definitions

### Modify: `src/types/dog.ts`

Add new types at the bottom:

```typescript
// Subcollection document types (with metadata)
export interface HealthTestDocument extends HealthTest {
  createdAt: string;
}

export interface ShotRecordDocument extends ShotRecord {
  createdAt: string;
}

export interface VetVisitDocument extends VetVisit {
  createdAt: string;
}

export interface PuppyDocument extends Puppy {
  userId: string; // Denormalized from litter
  litterId: string; // Denormalized for queries
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseDocument extends Expense {
  createdAt: string;
}

// Litter with denormalized counts (no nested puppies)
export interface LitterDocument extends Omit<Litter, 'puppies'> {
  // Denormalized counts
  puppyCount: number;
  maleCount: number;
  femaleCount: number;
  availableCount: number;
  reservedCount: number;
  soldCount: number;
}
```

---

## STEP 2: Update Stores to Read from Subcollections

### Example: Update `src/store/dogStoreFirebase.ts`

Add this helper function:

```typescript
import {
  getHealthTests,
  getShotRecords,
  getVetVisits,
  getWeightHistory,
} from '@/lib/subcollections/dogSubcollections';

// Helper to load dog with subcollections
async function loadDogWithSubcollections(dogId: string, dogData: any): Promise<Dog> {
  // Try to load from subcollections first
  const [healthTests, shotRecords, vetVisits, weightHistory] = await Promise.all([
    getHealthTests(dogId).catch(() => dogData.healthTests || []),
    getShotRecords(dogId).catch(() => dogData.shotRecords || []),
    getVetVisits(dogId).catch(() => dogData.vetVisits || []),
    getWeightHistory(dogId).catch(() => dogData.weightHistory || []),
  ]);

  return {
    ...dogData,
    id: dogId,
    healthTests,
    shotRecords,
    vetVisits,
    weightHistory,
  } as Dog;
}
```

Update the subscription:

```typescript
subscribeToUserData: (targetUid) => {
  const user = auth.currentUser;
  const uid = targetUid || user?.uid;

  if (!uid) {
    set({ dogs: [], litters: [], loading: false });
    return () => {};
  }

  set({ loading: true });

  const dogsQuery = query(collection(db, 'dogs'), where('userId', '==', uid));
  const littersQuery = query(collection(db, 'litters'), where('userId', '==', uid));

  const unsubDogs = onSnapshot(dogsQuery, async (snapshot) => {
    const dogsData = await Promise.all(
      snapshot.docs.map(doc => loadDogWithSubcollections(doc.id, doc.data()))
    );
    set({ dogs: dogsData, loading: false });
  });

  const unsubLitters = onSnapshot(littersQuery, async (snapshot) => {
    const littersData = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const litterData = doc.data();
        const litterId = doc.id;

        // Load puppies from subcollection
        const puppies = await getPuppies(litterId).catch(() => litterData.puppies || []);

        return {
          ...litterData,
          id: litterId,
          puppies,
        } as Litter;
      })
    );
    set({ litters: littersData });
  });

  return () => {
    unsubDogs();
    unsubLitters();
  };
},
```

---

## STEP 3: Migration Scripts

### Create: `scripts/migrateToSubcollections.ts`

```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  // Your config
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateDogs() {
  console.log('Starting dog migration...');
  const dogsSnapshot = await getDocs(collection(db, 'dogs'));

  let count = 0;
  for (const dogDoc of dogsSnapshot.docs) {
    const dogData = dogDoc.data();
    const dogId = dogDoc.id;

    // Migrate health tests
    if (dogData.healthTests && Array.isArray(dogData.healthTests)) {
      for (const test of dogData.healthTests) {
        await setDoc(doc(db, `dogs/${dogId}/health_tests/${test.id}`), {
          ...test,
          createdAt: new Date().toISOString(),
        });
      }
    }

    // Migrate shot records
    if (dogData.shotRecords && Array.isArray(dogData.shotRecords)) {
      for (const shot of dogData.shotRecords) {
        await setDoc(doc(db, `dogs/${dogId}/shot_records/${shot.id}`), {
          ...shot,
          createdAt: new Date().toISOString(),
        });
      }
    }

    // Similar for other subcollections...

    count++;
    if (count % 10 === 0) {
      console.log(`Migrated ${count} dogs...`);
    }
  }

  console.log(`Migration complete! Migrated ${count} dogs.`);
}

async function migrateLitters() {
  console.log('Starting litter migration...');
  const littersSnapshot = await getDocs(collection(db, 'litters'));

  let count = 0;
  for (const litterDoc of littersSnapshot.docs) {
    const litterData = litterDoc.data();
    const litterId = litterDoc.id;

    // Migrate puppies
    if (litterData.puppies && Array.isArray(litterData.puppies)) {
      for (const puppy of litterData.puppies) {
        await setDoc(doc(db, `litters/${litterId}/puppies/${puppy.id}`), {
          ...puppy,
          userId: litterData.userId,
          litterId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      // Update counts
      const counts = {
        puppyCount: litterData.puppies.length,
        maleCount: litterData.puppies.filter((p: any) => p.sex === 'male').length,
        femaleCount: litterData.puppies.filter((p: any) => p.sex === 'female').length,
        availableCount: litterData.puppies.filter((p: any) => p.status === 'available').length,
        reservedCount: litterData.puppies.filter((p: any) => p.status === 'reserved').length,
        soldCount: litterData.puppies.filter((p: any) => p.status === 'sold').length,
      };

      await setDoc(doc(db, `litters/${litterId}`), counts, { merge: true });
    }

    count++;
    if (count % 10 === 0) {
      console.log(`Migrated ${count} litters...`);
    }
  }

  console.log(`Migration complete! Migrated ${count} litters.`);
}

// Run migrations
migrateDogs()
  .then(() => migrateLitters())
  .then(() => {
    console.log('All migrations complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
```

---

## Testing Checklist

### Before Migration
- [ ] Backup Firestore database
- [ ] Deploy indexes
- [ ] Test subcollection helpers with sample data
- [ ] Verify read performance

### During Migration
- [ ] Run migration script on test environment
- [ ] Verify data in Firebase Console
- [ ] Check that app still works
- [ ] Monitor error logs

### After Migration
- [ ] Verify all queries work
- [ ] Check performance metrics
- [ ] Monitor costs
- [ ] Remove old nested arrays (later)

---

## Rollback Plan

If issues occur:

1. **Code rollback**: Revert to reading from nested arrays
2. **Data rollback**: Restore from backup (if needed)
3. **Index rollback**: Old queries still work during transition

---

## Performance Monitoring

Track these metrics:

```typescript
// Add to Firebase Performance Monitoring
import { trace } from '@/lib/firebase';

const t = trace('load_dog_with_subcollections');
t.start();
// ... load data
t.stop();
```

Monitor:
- Query latency
- Document reads
- Subcollection load times
- User-reported issues

---

## Next Steps After Phase 1

1. **Add Algolia** for global search
2. **BigQuery export** for analytics
3. **Cloud Functions** for automated maintenance
4. **Caching layer** if needed

---

## Questions or Issues?

See:
- `DATABASE_ARCHITECTURE.md` for full architecture
- `HYBRID_DATABASE_ANALYSIS.md` for why Firebase-only
- Firebase docs: https://firebase.google.com/docs/firestore
