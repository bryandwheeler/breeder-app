// Email Template Store
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
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { EmailTemplate, DEFAULT_TEMPLATES } from '@/types/emailTemplate';

interface EmailTemplateStore {
  templates: EmailTemplate[];
  loading: boolean;
  error: string | null;

  // Actions
  loadTemplates: (userId: string) => Promise<void>;
  subscribeToTemplates: (userId: string) => () => void;
  createTemplate: (template: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateTemplate: (id: string, updates: Partial<EmailTemplate>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  initializeDefaultTemplates: (userId: string) => Promise<void>;
  getTemplateById: (id: string) => EmailTemplate | null;
}

export const useEmailTemplateStore = create<EmailTemplateStore>((set, get) => ({
  templates: [],
  loading: false,
  error: null,

  loadTemplates: async (userId) => {
    set({ loading: true, error: null });

    try {
      const q = query(
        collection(db, 'emailTemplates'),
        where('userId', '==', userId),
        orderBy('category', 'asc'),
        orderBy('name', 'asc')
      );

      const snapshot = await getDocs(q);
      const templates = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as EmailTemplate[];

      set({ templates, loading: false });
    } catch (error) {
      console.error('Error loading email templates:', error);
      set({ error: 'Failed to load email templates', loading: false });
    }
  },

  subscribeToTemplates: (userId) => {
    set({ loading: true, error: null });

    const q = query(
      collection(db, 'emailTemplates'),
      where('userId', '==', userId),
      orderBy('category', 'asc'),
      orderBy('name', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const templates = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as EmailTemplate[];

        set({ templates, loading: false });
      },
      (error) => {
        console.error('Error subscribing to email templates:', error);
        set({ error: 'Failed to load email templates', loading: false });
      }
    );

    return unsubscribe;
  },

  createTemplate: async (templateData) => {
    set({ loading: true, error: null });

    try {
      const docRef = doc(collection(db, 'emailTemplates'));

      const template: EmailTemplate = {
        ...templateData,
        id: docRef.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(docRef, template);

      set((state) => ({
        templates: [...state.templates, template],
        loading: false,
      }));

      return docRef.id;
    } catch (error) {
      console.error('Error creating email template:', error);
      set({ error: 'Failed to create email template', loading: false });
      throw error;
    }
  },

  updateTemplate: async (id, updates) => {
    set({ loading: true, error: null });

    try {
      const docRef = doc(db, 'emailTemplates', id);

      const updatedData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await setDoc(docRef, updatedData, { merge: true });

      set((state) => ({
        templates: state.templates.map((t) =>
          t.id === id ? { ...t, ...updatedData } : t
        ),
        loading: false,
      }));
    } catch (error) {
      console.error('Error updating email template:', error);
      set({ error: 'Failed to update email template', loading: false });
      throw error;
    }
  },

  deleteTemplate: async (id) => {
    set({ loading: true, error: null });

    try {
      await deleteDoc(doc(db, 'emailTemplates', id));

      set((state) => ({
        templates: state.templates.filter((t) => t.id !== id),
        loading: false,
      }));
    } catch (error) {
      console.error('Error deleting email template:', error);
      set({ error: 'Failed to delete email template', loading: false });
      throw error;
    }
  },

  initializeDefaultTemplates: async (userId) => {
    try {
      // Check if user already has templates
      const { templates } = get();
      if (templates.length > 0) {
        return; // User already has templates
      }

      // Create default templates for this user
      const promises = DEFAULT_TEMPLATES.map((template) =>
        get().createTemplate({
          ...template,
          userId,
        })
      );

      await Promise.all(promises);
    } catch (error) {
      console.error('Error initializing default templates:', error);
      throw error;
    }
  },

  getTemplateById: (id) => {
    const { templates } = get();
    return templates.find((t) => t.id === id) || null;
  },
}));
