// Firestore-powered stud job store
import { create } from 'zustand';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '@breeder/firebase';
import { StudJob } from '@breeder/types';
import { FIRESTORE_COLLECTIONS } from '@breeder/types';

type Store = {
  studJobs: StudJob[];
  loading: boolean;

  // Stud Job methods
  addStudJob: (
    job: Omit<StudJob, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>;
  updateStudJob: (id: string, updates: Partial<StudJob>) => Promise<void>;
  deleteStudJob: (id: string) => Promise<void>;
  getStudJobsForStud: (studId: string) => StudJob[];
  getAllStudJobs: () => StudJob[];
  getPendingStudJobs: () => StudJob[];
  getConfirmedStudJobs: () => StudJob[];
  getInProgressStudJobs: () => StudJob[];
  getCompletedStudJobs: () => StudJob[];

  // Subscription
  subscribeToStudJobs: () => () => void;
};

export const useStudJobStore = create<Store>()((set, get) => ({
  studJobs: [],
  loading: false,

  addStudJob: async (job) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to add stud jobs');

    const studJobsRef = collection(db, FIRESTORE_COLLECTIONS.STUD_JOBS);

    const newJob = {
      ...job,
      userId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await addDoc(studJobsRef, newJob);
  },

  updateStudJob: async (id, updates) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to update stud jobs');

    const jobRef = doc(db, FIRESTORE_COLLECTIONS.STUD_JOBS, id);
    await updateDoc(jobRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },

  deleteStudJob: async (id) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to delete stud jobs');

    const jobRef = doc(db, FIRESTORE_COLLECTIONS.STUD_JOBS, id);
    await deleteDoc(jobRef);
  },

  getStudJobsForStud: (studId) => {
    return get()
      .studJobs.filter((job) => job.studId === studId)
      .sort(
        (a, b) =>
          new Date(b.scheduledDate || b.createdAt || '').getTime() -
          new Date(a.scheduledDate || a.createdAt || '').getTime()
      );
  },

  getAllStudJobs: () => {
    return get().studJobs.sort(
      (a, b) =>
        new Date(b.scheduledDate || b.createdAt || '').getTime() -
        new Date(a.scheduledDate || a.createdAt || '').getTime()
    );
  },

  getPendingStudJobs: () => {
    return get()
      .studJobs.filter((job) => job.status === 'pending')
      .sort(
        (a, b) =>
          new Date(a.scheduledDate || a.createdAt || '').getTime() -
          new Date(b.scheduledDate || b.createdAt || '').getTime()
      );
  },

  getConfirmedStudJobs: () => {
    return get()
      .studJobs.filter((job) => job.status === 'confirmed')
      .sort(
        (a, b) =>
          new Date(a.scheduledDate || a.createdAt || '').getTime() -
          new Date(b.scheduledDate || b.createdAt || '').getTime()
      );
  },

  getInProgressStudJobs: () => {
    return get()
      .studJobs.filter((job) => job.status === 'in_progress')
      .sort(
        (a, b) =>
          new Date(a.scheduledDate || a.createdAt || '').getTime() -
          new Date(b.scheduledDate || b.createdAt || '').getTime()
      );
  },

  getCompletedStudJobs: () => {
    return get()
      .studJobs.filter((job) => job.status === 'completed')
      .sort(
        (a, b) =>
          new Date(b.actualDate || b.scheduledDate || b.createdAt || '').getTime() -
          new Date(a.actualDate || a.scheduledDate || a.createdAt || '').getTime()
      );
  },

  subscribeToStudJobs: () => {
    const user = auth.currentUser;
    if (!user) return () => {};

    set({ loading: true });

    // Subscribe to stud jobs
    const studJobsQuery = query(
      collection(db, FIRESTORE_COLLECTIONS.STUD_JOBS),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      studJobsQuery,
      (snapshot) => {
        const studJobs: StudJob[] = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as StudJob)
        );
        set({ studJobs, loading: false });
      },
      (error) => {
        console.error('Error subscribing to stud jobs:', error);
        set({ loading: false });
      }
    );

    return unsubscribe;
  },
}));
