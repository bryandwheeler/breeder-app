// Email Integration Store
import { create } from 'zustand';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { EmailIntegration } from '@/types/email';
import { Interaction } from '@/types/dog';

interface EmailStore {
  integration: EmailIntegration | null;
  loading: boolean;
  error: string | null;

  // Actions
  saveIntegration: (integration: Omit<EmailIntegration, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  loadIntegration: (userId: string) => Promise<void>;
  deleteIntegration: () => Promise<void>;
  updateLastSync: (userId: string) => Promise<void>;

  // Email to Interaction conversion
  createInteractionFromEmail: (
    customerId: string,
    emailData: Partial<Interaction>
  ) => Promise<string>;
}

export const useEmailStore = create<EmailStore>((set, get) => ({
  integration: null,
  loading: false,
  error: null,

  saveIntegration: async (integrationData) => {
    set({ loading: true, error: null });

    try {
      const docRef = doc(db, 'emailIntegrations', integrationData.userId);

      const data: EmailIntegration = {
        ...integrationData,
        id: integrationData.userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(docRef, data);

      set({ integration: data, loading: false });
    } catch (error) {
      console.error('Error saving email integration:', error);
      set({ error: 'Failed to save email integration', loading: false });
      throw error;
    }
  },

  loadIntegration: async (userId) => {
    set({ loading: true, error: null });

    try {
      const docRef = doc(db, 'emailIntegrations', userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        set({ integration: docSnap.data() as EmailIntegration, loading: false });
      } else {
        set({ integration: null, loading: false });
      }
    } catch (error) {
      console.error('Error loading email integration:', error);
      set({ error: 'Failed to load email integration', loading: false });
    }
  },

  deleteIntegration: async () => {
    const { integration } = get();
    if (!integration) return;

    set({ loading: true, error: null });

    try {
      await deleteDoc(doc(db, 'emailIntegrations', integration.userId));
      set({ integration: null, loading: false });
    } catch (error) {
      console.error('Error deleting email integration:', error);
      set({ error: 'Failed to delete email integration', loading: false });
      throw error;
    }
  },

  updateLastSync: async (userId) => {
    try {
      const docRef = doc(db, 'emailIntegrations', userId);
      await setDoc(
        docRef,
        {
          lastSyncedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      set((state) => ({
        integration: state.integration
          ? {
              ...state.integration,
              lastSyncedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : null,
      }));
    } catch (error) {
      console.error('Error updating last sync:', error);
    }
  },

  createInteractionFromEmail: async (customerId, emailData) => {
    try {
      // This would typically be done through the CRM store
      // For now, we'll return a mock ID
      // In production, you'd call useCrmStore().addInteraction()
      console.log('Creating interaction from email:', customerId, emailData);
      return crypto.randomUUID();
    } catch (error) {
      console.error('Error creating interaction from email:', error);
      throw error;
    }
  },
}));
