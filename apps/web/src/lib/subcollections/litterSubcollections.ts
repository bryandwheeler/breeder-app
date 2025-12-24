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
  collectionGroup,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@breeder/firebase';
import { Puppy, Expense } from '@breeder/types';

// ============================================================================
// PUPPIES
// ============================================================================

export async function addPuppy(
  litterId: string,
  userId: string,
  puppy: Omit<Puppy, 'id'>
): Promise<string> {
  const ref = await addDoc(collection(db, `litters/${litterId}/puppies`), {
    ...puppy,
    userId, // Denormalized for cross-litter queries
    litterId, // Denormalized for cross-litter queries
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  // Update denormalized counts on litter document
  await updateLitterCounts(litterId);

  return ref.id;
}

export async function getPuppies(litterId: string): Promise<Puppy[]> {
  const snapshot = await getDocs(collection(db, `litters/${litterId}/puppies`));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Puppy));
}

export async function getPuppy(litterId: string, puppyId: string): Promise<Puppy | null> {
  const puppies = await getPuppies(litterId);
  return puppies.find(p => p.id === puppyId) || null;
}

export async function updatePuppy(
  litterId: string,
  puppyId: string,
  updates: Partial<Puppy>
): Promise<void> {
  await updateDoc(doc(db, `litters/${litterId}/puppies/${puppyId}`), {
    ...updates,
    updatedAt: Timestamp.now(),
  });

  // Update litter counts if status or sex changed
  if (updates.status || updates.sex) {
    await updateLitterCounts(litterId);
  }
}

export async function deletePuppy(litterId: string, puppyId: string): Promise<void> {
  await deleteDoc(doc(db, `litters/${litterId}/puppies/${puppyId}`));
  await updateLitterCounts(litterId);
}

// ============================================================================
// LITTER COUNTS (Denormalization)
// ============================================================================

/**
 * Update denormalized counts on the litter document
 * Called automatically when puppies are added/updated/deleted
 */
async function updateLitterCounts(litterId: string): Promise<void> {
  const puppies = await getPuppies(litterId);

  const counts = {
    puppyCount: puppies.length,
    maleCount: puppies.filter(p => p.sex === 'male').length,
    femaleCount: puppies.filter(p => p.sex === 'female').length,
    availableCount: puppies.filter(p => p.status === 'available').length,
    reservedCount: puppies.filter(p => p.status === 'reserved').length,
    soldCount: puppies.filter(p => p.status === 'sold').length,
    keptCount: puppies.filter(p => p.status === 'kept').length,
  };

  await updateDoc(doc(db, `litters/${litterId}`), counts);
}

// ============================================================================
// CROSS-LITTER QUERIES
// ============================================================================

/**
 * Query all puppies across all litters for a user
 * Useful for finding available puppies, reserved puppies, etc.
 */
export async function getUserPuppies(
  userId: string,
  filters?: {
    status?: Puppy['status'];
    sex?: 'male' | 'female';
    litterId?: string;
  }
): Promise<Puppy[]> {
  // Build query with filters
  let q = query(
    collectionGroup(db, 'puppies'),
    where('userId', '==', userId)
  );

  if (filters?.status) {
    q = query(q, where('status', '==', filters.status));
  }

  if (filters?.sex) {
    q = query(q, where('sex', '==', filters.sex));
  }

  if (filters?.litterId) {
    q = query(q, where('litterId', '==', filters.litterId));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Puppy));
}

/**
 * Get all available puppies for a user (across all litters)
 */
export async function getAvailablePuppies(userId: string): Promise<Puppy[]> {
  return getUserPuppies(userId, { status: 'available' });
}

/**
 * Get all reserved puppies for a user (across all litters)
 */
export async function getReservedPuppies(userId: string): Promise<Puppy[]> {
  return getUserPuppies(userId, { status: 'reserved' });
}

/**
 * Get all sold puppies for a user (across all litters)
 */
export async function getSoldPuppies(userId: string): Promise<Puppy[]> {
  return getUserPuppies(userId, { status: 'sold' });
}

/**
 * Get puppies for a specific buyer
 */
export async function getBuyerPuppies(buyerId: string): Promise<Puppy[]> {
  const q = query(
    collectionGroup(db, 'puppies'),
    where('buyerId', '==', buyerId)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Puppy));
}

// ============================================================================
// EXPENSES
// ============================================================================

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
): Promise<void> {
  await updateDoc(doc(db, `litters/${litterId}/expenses/${expenseId}`), updates);
}

export async function deleteExpense(litterId: string, expenseId: string): Promise<void> {
  await deleteDoc(doc(db, `litters/${litterId}/expenses/${expenseId}`));
}

/**
 * Get total expenses for a litter
 */
export async function getLitterTotalExpenses(litterId: string): Promise<number> {
  const expenses = await getExpenses(litterId);
  return expenses.reduce((total, expense) => total + (expense.amount || 0), 0);
}

/**
 * Get expenses by category
 */
export async function getExpensesByCategory(
  litterId: string,
  category: Expense['category']
): Promise<Expense[]> {
  const snapshot = await getDocs(
    query(
      collection(db, `litters/${litterId}/expenses`),
      where('category', '==', category),
      orderBy('date', 'desc')
    )
  );
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
}

// ============================================================================
// BATCH LOAD (For Performance)
// ============================================================================

/**
 * Load all subcollection data for a litter in parallel
 * This is more efficient than loading them one at a time
 */
export async function loadAllLitterSubcollections(litterId: string) {
  const [puppies, expenses] = await Promise.all([
    getPuppies(litterId).catch(() => [] as Puppy[]),
    getExpenses(litterId).catch(() => [] as Expense[]),
  ]);

  return {
    puppies,
    expenses,
    totalExpenses: expenses.reduce((total, e) => total + (e.amount || 0), 0),
  };
}

// ============================================================================
// PUPPY WEIGHT HISTORY (Subcollection of Puppy)
// ============================================================================

import { WeightEntry } from '@breeder/types';

export async function addPuppyWeight(
  litterId: string,
  puppyId: string,
  entry: Omit<WeightEntry, 'id'>
): Promise<string> {
  const ref = await addDoc(
    collection(db, `litters/${litterId}/puppies/${puppyId}/weight_history`),
    entry
  );
  return ref.id;
}

export async function getPuppyWeightHistory(
  litterId: string,
  puppyId: string
): Promise<WeightEntry[]> {
  const snapshot = await getDocs(
    query(
      collection(db, `litters/${litterId}/puppies/${puppyId}/weight_history`),
      orderBy('date', 'desc')
    )
  );
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WeightEntry));
}

export async function deletePuppyWeight(
  litterId: string,
  puppyId: string,
  entryId: string
): Promise<void> {
  await deleteDoc(
    doc(db, `litters/${litterId}/puppies/${puppyId}/weight_history/${entryId}`)
  );
}

// ============================================================================
// PUPPY SHOT RECORDS (Subcollection of Puppy)
// ============================================================================

import { ShotRecord } from '@breeder/types';

export async function addPuppyShot(
  litterId: string,
  puppyId: string,
  shot: Omit<ShotRecord, 'id'>
): Promise<string> {
  const ref = await addDoc(
    collection(db, `litters/${litterId}/puppies/${puppyId}/shot_records`),
    {
      ...shot,
      createdAt: Timestamp.now(),
    }
  );
  return ref.id;
}

export async function getPuppyShotRecords(
  litterId: string,
  puppyId: string
): Promise<ShotRecord[]> {
  const snapshot = await getDocs(
    query(
      collection(db, `litters/${litterId}/puppies/${puppyId}/shot_records`),
      orderBy('dateGiven', 'desc')
    )
  );
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShotRecord));
}

export async function updatePuppyShot(
  litterId: string,
  puppyId: string,
  shotId: string,
  updates: Partial<ShotRecord>
): Promise<void> {
  await updateDoc(
    doc(db, `litters/${litterId}/puppies/${puppyId}/shot_records/${shotId}`),
    updates
  );
}

export async function deletePuppyShot(
  litterId: string,
  puppyId: string,
  shotId: string
): Promise<void> {
  await deleteDoc(
    doc(db, `litters/${litterId}/puppies/${puppyId}/shot_records/${shotId}`)
  );
}
