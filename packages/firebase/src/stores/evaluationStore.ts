// Puppy Evaluation Store - Zustand store for managing puppy evaluations
import { create } from 'zustand';
import { auth } from '../config/firebase';
import {
  PuppyEvaluation,
  EvaluationTestType,
} from '@breeder/types';
import {
  addEvaluation,
  getEvaluations,
  getEvaluation,
  getEvaluationsByType,
  updateEvaluation,
  deleteEvaluation,
  getLitterEvaluations,
  getLitterEvaluationsByType,
  getLatestEvaluations,
  getEvaluationCounts,
} from '../utils/subcollections/puppyEvaluationSubcollections';

type EvaluationStore = {
  // State
  evaluations: PuppyEvaluation[];
  currentEvaluation: PuppyEvaluation | null;
  loading: boolean;
  error: string | null;

  // CRUD operations
  addEvaluation: (
    litterId: string,
    puppyId: string,
    evaluation: Omit<PuppyEvaluation, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ) => Promise<string>;
  updateEvaluation: (
    litterId: string,
    puppyId: string,
    evaluationId: string,
    updates: Partial<PuppyEvaluation>
  ) => Promise<void>;
  deleteEvaluation: (
    litterId: string,
    puppyId: string,
    evaluationId: string
  ) => Promise<void>;

  // Fetch operations
  fetchPuppyEvaluations: (litterId: string, puppyId: string) => Promise<void>;
  fetchPuppyEvaluationsByType: (
    litterId: string,
    puppyId: string,
    testType: EvaluationTestType
  ) => Promise<void>;
  fetchLitterEvaluations: (litterId: string) => Promise<void>;
  fetchLitterEvaluationsByType: (
    litterId: string,
    testType: EvaluationTestType
  ) => Promise<void>;
  fetchEvaluation: (
    litterId: string,
    puppyId: string,
    evaluationId: string
  ) => Promise<PuppyEvaluation | null>;

  // Aggregation
  getEvaluationCounts: (
    litterId: string,
    puppyId: string
  ) => Promise<Record<EvaluationTestType, number>>;
  getLatestEvaluations: (
    litterId: string,
    puppyId: string
  ) => Promise<Partial<Record<EvaluationTestType, PuppyEvaluation>>>;

  // Filtering (client-side from loaded evaluations)
  getEvaluationsForPuppy: (puppyId: string) => PuppyEvaluation[];
  getEvaluationsByTestType: (testType: EvaluationTestType) => PuppyEvaluation[];
  getEvaluationCountForPuppy: (puppyId: string) => number;

  // Subscribe-like function
  subscribeToLitterEvaluations: (litterId: string) => () => void;

  // Utility
  setCurrentEvaluation: (evaluation: PuppyEvaluation | null) => void;
  clearEvaluations: () => void;
  clearError: () => void;
};

export const useEvaluationStore = create<EvaluationStore>()((set, get) => ({
  evaluations: [],
  currentEvaluation: null,
  loading: false,
  error: null,

  // ============================================================================
  // CRUD Operations
  // ============================================================================

  addEvaluation: async (litterId, puppyId, evaluation) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to add evaluations');

    set({ loading: true, error: null });
    try {
      const id = await addEvaluation(litterId, puppyId, user.uid, evaluation as Omit<PuppyEvaluation, 'id'>);

      // Add to local state
      const newEvaluation = {
        ...evaluation,
        id,
        userId: user.uid,
        litterId,
        puppyId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as PuppyEvaluation;

      set(state => ({
        evaluations: [newEvaluation, ...state.evaluations],
        loading: false,
      }));

      return id;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add evaluation';
      set({ error: message, loading: false });
      throw error;
    }
  },

  updateEvaluation: async (litterId, puppyId, evaluationId, updates) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to update evaluations');

    set({ loading: true, error: null });
    try {
      await updateEvaluation(litterId, puppyId, evaluationId, updates);

      // Update local state
      set(state => {
        const updatedEvaluations = state.evaluations.map(e =>
          e.id === evaluationId
            ? { ...e, ...updates, updatedAt: new Date().toISOString() } as PuppyEvaluation
            : e
        );
        const updatedCurrent = state.currentEvaluation?.id === evaluationId
          ? { ...state.currentEvaluation, ...updates, updatedAt: new Date().toISOString() } as PuppyEvaluation
          : state.currentEvaluation;
        return {
          evaluations: updatedEvaluations,
          currentEvaluation: updatedCurrent,
          loading: false,
        };
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update evaluation';
      set({ error: message, loading: false });
      throw error;
    }
  },

  deleteEvaluation: async (litterId, puppyId, evaluationId) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to delete evaluations');

    set({ loading: true, error: null });
    try {
      await deleteEvaluation(litterId, puppyId, evaluationId);

      // Remove from local state
      set(state => ({
        evaluations: state.evaluations.filter(e => e.id !== evaluationId),
        currentEvaluation: state.currentEvaluation?.id === evaluationId ? null : state.currentEvaluation,
        loading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete evaluation';
      set({ error: message, loading: false });
      throw error;
    }
  },

  // ============================================================================
  // Fetch Operations
  // ============================================================================

  fetchPuppyEvaluations: async (litterId, puppyId) => {
    set({ loading: true, error: null });
    try {
      const evaluations = await getEvaluations(litterId, puppyId);
      set({ evaluations, loading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch evaluations';
      set({ error: message, loading: false });
      throw error;
    }
  },

  fetchPuppyEvaluationsByType: async (litterId, puppyId, testType) => {
    set({ loading: true, error: null });
    try {
      const evaluations = await getEvaluationsByType(litterId, puppyId, testType);
      set({ evaluations, loading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch evaluations';
      set({ error: message, loading: false });
      throw error;
    }
  },

  fetchLitterEvaluations: async (litterId) => {
    set({ loading: true, error: null });
    try {
      const evaluations = await getLitterEvaluations(litterId);
      set({ evaluations, loading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch litter evaluations';
      set({ error: message, loading: false });
      throw error;
    }
  },

  fetchLitterEvaluationsByType: async (litterId, testType) => {
    set({ loading: true, error: null });
    try {
      const evaluations = await getLitterEvaluationsByType(litterId, testType);
      set({ evaluations, loading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch litter evaluations';
      set({ error: message, loading: false });
      throw error;
    }
  },

  fetchEvaluation: async (litterId, puppyId, evaluationId) => {
    set({ loading: true, error: null });
    try {
      const evaluation = await getEvaluation(litterId, puppyId, evaluationId);
      set({ currentEvaluation: evaluation, loading: false });
      return evaluation;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch evaluation';
      set({ error: message, loading: false });
      throw error;
    }
  },

  // ============================================================================
  // Aggregation
  // ============================================================================

  getEvaluationCounts: async (litterId, puppyId) => {
    try {
      return await getEvaluationCounts(litterId, puppyId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get evaluation counts';
      set({ error: message });
      throw error;
    }
  },

  getLatestEvaluations: async (litterId, puppyId) => {
    try {
      return await getLatestEvaluations(litterId, puppyId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get latest evaluations';
      set({ error: message });
      throw error;
    }
  },

  // ============================================================================
  // Client-side Filtering
  // ============================================================================

  getEvaluationsForPuppy: (puppyId) => {
    return get().evaluations.filter(e => e.puppyId === puppyId);
  },

  getEvaluationsByTestType: (testType) => {
    return get().evaluations.filter(e => e.testType === testType);
  },

  getEvaluationCountForPuppy: (puppyId) => {
    return get().evaluations.filter(e => e.puppyId === puppyId).length;
  },

  // Subscribe-like function that fetches litter evaluations (not real-time)
  subscribeToLitterEvaluations: (litterId: string) => {
    const store = get();
    // Fetch evaluations on "subscribe"
    store.fetchLitterEvaluations(litterId).catch(console.error);
    // Return unsubscribe function (no-op since not real-time)
    return () => {};
  },

  // ============================================================================
  // Utility
  // ============================================================================

  setCurrentEvaluation: (evaluation) => {
    set({ currentEvaluation: evaluation });
  },

  clearEvaluations: () => {
    set({ evaluations: [], currentEvaluation: null, error: null });
  },

  clearError: () => {
    set({ error: null });
  },
}));
