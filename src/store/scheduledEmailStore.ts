// Scheduled Email Store
import { create } from 'zustand';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ScheduledEmail } from '@/types/workflow';

interface ScheduledEmailStore {
  scheduledEmails: ScheduledEmail[];
  loading: boolean;
  error: string | null;

  // Actions
  loadScheduledEmails: (userId: string) => Promise<void>;
  subscribeToScheduledEmails: (userId: string) => () => void;
  scheduleEmail: (email: Omit<ScheduledEmail, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  cancelScheduledEmail: (id: string) => Promise<void>;
  updateScheduledEmail: (id: string, updates: Partial<ScheduledEmail>) => Promise<void>;
  getScheduledEmailById: (id: string) => ScheduledEmail | null;
  getPendingEmails: (userId: string) => Promise<ScheduledEmail[]>;
}

export const useScheduledEmailStore = create<ScheduledEmailStore>((set, get) => ({
  scheduledEmails: [],
  loading: false,
  error: null,

  loadScheduledEmails: async (userId) => {
    set({ loading: true, error: null });

    try {
      const q = query(
        collection(db, 'scheduledEmails'),
        where('userId', '==', userId),
        orderBy('scheduledFor', 'asc')
      );

      const snapshot = await getDocs(q);
      const emails = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ScheduledEmail[];

      set({ scheduledEmails: emails, loading: false });
    } catch (error) {
      console.error('Error loading scheduled emails:', error);
      set({ error: 'Failed to load scheduled emails', loading: false });
    }
  },

  subscribeToScheduledEmails: (userId) => {
    set({ loading: true, error: null });

    const q = query(
      collection(db, 'scheduledEmails'),
      where('userId', '==', userId),
      orderBy('scheduledFor', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const emails = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ScheduledEmail[];

        set({ scheduledEmails: emails, loading: false });
      },
      (error) => {
        console.error('Error subscribing to scheduled emails:', error);
        set({ error: 'Failed to load scheduled emails', loading: false });
      }
    );

    return unsubscribe;
  },

  scheduleEmail: async (emailData) => {
    set({ loading: true, error: null });

    try {
      const docRef = doc(collection(db, 'scheduledEmails'));

      const email: ScheduledEmail = {
        ...emailData,
        id: docRef.id,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(docRef, email);

      set((state) => ({
        scheduledEmails: [...state.scheduledEmails, email].sort(
          (a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime()
        ),
        loading: false,
      }));

      return docRef.id;
    } catch (error) {
      console.error('Error scheduling email:', error);
      set({ error: 'Failed to schedule email', loading: false });
      throw error;
    }
  },

  cancelScheduledEmail: async (id) => {
    set({ loading: true, error: null });

    try {
      // Update status to cancelled instead of deleting
      const docRef = doc(db, 'scheduledEmails', id);
      await setDoc(
        docRef,
        {
          status: 'cancelled',
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      set((state) => ({
        scheduledEmails: state.scheduledEmails.map((email) =>
          email.id === id
            ? { ...email, status: 'cancelled' as const, updatedAt: new Date().toISOString() }
            : email
        ),
        loading: false,
      }));
    } catch (error) {
      console.error('Error cancelling scheduled email:', error);
      set({ error: 'Failed to cancel scheduled email', loading: false });
      throw error;
    }
  },

  updateScheduledEmail: async (id, updates) => {
    set({ loading: true, error: null });

    try {
      const docRef = doc(db, 'scheduledEmails', id);

      const updatedData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await setDoc(docRef, updatedData, { merge: true });

      set((state) => ({
        scheduledEmails: state.scheduledEmails.map((email) =>
          email.id === id ? { ...email, ...updatedData } : email
        ),
        loading: false,
      }));
    } catch (error) {
      console.error('Error updating scheduled email:', error);
      set({ error: 'Failed to update scheduled email', loading: false });
      throw error;
    }
  },

  getScheduledEmailById: (id) => {
    const { scheduledEmails } = get();
    return scheduledEmails.find((email) => email.id === id) || null;
  },

  getPendingEmails: async (userId) => {
    try {
      const now = new Date().toISOString();

      const q = query(
        collection(db, 'scheduledEmails'),
        where('userId', '==', userId),
        where('status', '==', 'pending'),
        where('scheduledFor', '<=', now)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ScheduledEmail[];
    } catch (error) {
      console.error('Error getting pending emails:', error);
      throw error;
    }
  },
}));
