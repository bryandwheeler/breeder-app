import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  collectionGroup,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import {
  PuppyEvaluation,
  VolhardEvaluation,
  APETEvaluation,
  FlinksEvaluation,
  EvaluationTestType,
} from '@breeder/types';

// ============================================================================
// PUPPY EVALUATIONS
// Path: litters/{litterId}/puppies/{puppyId}/evaluations/{evaluationId}
// ============================================================================

/**
 * Add a new evaluation for a puppy
 */
export async function addEvaluation(
  litterId: string,
  puppyId: string,
  userId: string,
  evaluation: Omit<PuppyEvaluation, 'id'>
): Promise<string> {
  const ref = await addDoc(
    collection(db, `litters/${litterId}/puppies/${puppyId}/evaluations`),
    {
      ...evaluation,
      userId,
      litterId,
      puppyId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }
  );
  return ref.id;
}

/**
 * Get all evaluations for a specific puppy
 */
export async function getEvaluations(
  litterId: string,
  puppyId: string
): Promise<PuppyEvaluation[]> {
  const snapshot = await getDocs(
    query(
      collection(db, `litters/${litterId}/puppies/${puppyId}/evaluations`),
      orderBy('evaluationDate', 'desc')
    )
  );
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PuppyEvaluation));
}

/**
 * Get evaluations filtered by test type
 */
export async function getEvaluationsByType(
  litterId: string,
  puppyId: string,
  testType: EvaluationTestType
): Promise<PuppyEvaluation[]> {
  const snapshot = await getDocs(
    query(
      collection(db, `litters/${litterId}/puppies/${puppyId}/evaluations`),
      where('testType', '==', testType),
      orderBy('evaluationDate', 'desc')
    )
  );
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PuppyEvaluation));
}

/**
 * Get a single evaluation by ID
 */
export async function getEvaluation(
  litterId: string,
  puppyId: string,
  evaluationId: string
): Promise<PuppyEvaluation | null> {
  const docRef = doc(db, `litters/${litterId}/puppies/${puppyId}/evaluations/${evaluationId}`);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as PuppyEvaluation;
}

/**
 * Update an existing evaluation
 */
export async function updateEvaluation(
  litterId: string,
  puppyId: string,
  evaluationId: string,
  updates: Partial<PuppyEvaluation>
): Promise<void> {
  await updateDoc(
    doc(db, `litters/${litterId}/puppies/${puppyId}/evaluations/${evaluationId}`),
    {
      ...updates,
      updatedAt: Timestamp.now(),
    }
  );
}

/**
 * Delete an evaluation
 */
export async function deleteEvaluation(
  litterId: string,
  puppyId: string,
  evaluationId: string
): Promise<void> {
  await deleteDoc(
    doc(db, `litters/${litterId}/puppies/${puppyId}/evaluations/${evaluationId}`)
  );
}

// ============================================================================
// CROSS-PUPPY QUERIES (Within a Litter)
// ============================================================================

/**
 * Get all evaluations for all puppies in a litter
 * Useful for litter-wide comparison reports
 */
export async function getLitterEvaluations(
  litterId: string
): Promise<PuppyEvaluation[]> {
  const q = query(
    collectionGroup(db, 'evaluations'),
    where('litterId', '==', litterId),
    orderBy('evaluationDate', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PuppyEvaluation));
}

/**
 * Get all evaluations of a specific type for a litter
 */
export async function getLitterEvaluationsByType(
  litterId: string,
  testType: EvaluationTestType
): Promise<PuppyEvaluation[]> {
  const q = query(
    collectionGroup(db, 'evaluations'),
    where('litterId', '==', litterId),
    where('testType', '==', testType),
    orderBy('evaluationDate', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PuppyEvaluation));
}

// ============================================================================
// CROSS-LITTER QUERIES (For a User)
// ============================================================================

/**
 * Get all evaluations across all litters for a user
 */
export async function getUserEvaluations(
  userId: string,
  testType?: EvaluationTestType
): Promise<PuppyEvaluation[]> {
  let q = query(
    collectionGroup(db, 'evaluations'),
    where('userId', '==', userId),
    orderBy('evaluationDate', 'desc')
  );

  if (testType) {
    q = query(
      collectionGroup(db, 'evaluations'),
      where('userId', '==', userId),
      where('testType', '==', testType),
      orderBy('evaluationDate', 'desc')
    );
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PuppyEvaluation));
}

/**
 * Get recent evaluations for a user (for dashboard)
 */
export async function getRecentUserEvaluations(
  userId: string,
  limit: number = 10
): Promise<PuppyEvaluation[]> {
  const evaluations = await getUserEvaluations(userId);
  return evaluations.slice(0, limit);
}

// ============================================================================
// AGGREGATION HELPERS
// ============================================================================

/**
 * Count evaluations by type for a puppy
 */
export async function getEvaluationCounts(
  litterId: string,
  puppyId: string
): Promise<Record<EvaluationTestType, number>> {
  const evaluations = await getEvaluations(litterId, puppyId);

  return {
    volhard: evaluations.filter(e => e.testType === 'volhard').length,
    apet: evaluations.filter(e => e.testType === 'apet').length,
    flinks: evaluations.filter(e => e.testType === 'flinks').length,
  };
}

/**
 * Get the most recent evaluation of each type for a puppy
 */
export async function getLatestEvaluations(
  litterId: string,
  puppyId: string
): Promise<Partial<Record<EvaluationTestType, PuppyEvaluation>>> {
  const evaluations = await getEvaluations(litterId, puppyId);

  const latest: Partial<Record<EvaluationTestType, PuppyEvaluation>> = {};

  for (const eval_ of evaluations) {
    if (!latest[eval_.testType]) {
      latest[eval_.testType] = eval_;
    }
  }

  return latest;
}

/**
 * Check if a puppy has been evaluated with a specific test
 */
export async function hasEvaluation(
  litterId: string,
  puppyId: string,
  testType: EvaluationTestType
): Promise<boolean> {
  const evaluations = await getEvaluationsByType(litterId, puppyId, testType);
  return evaluations.length > 0;
}
