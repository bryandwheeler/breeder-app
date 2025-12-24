// Store for managing custom care schedule templates
import { create } from 'zustand';
import { collection, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { CareTask, DailyRoutineTask, DEFAULT_CARE_TEMPLATES, DEFAULT_DAILY_ROUTINES } from '@breeder/types';

export type CareTemplate = Omit<CareTask, 'id' | 'completed' | 'completedDate' | 'notes'>;
export type DailyRoutineTemplate = Omit<DailyRoutineTask, 'id'>;

interface CareTemplateState {
  templates: CareTemplate[];
  dailyRoutines: DailyRoutineTemplate[];
  loading: boolean;
  error: string | null;
  loadTemplates: (userId: string) => Promise<void>;
  saveTemplates: (userId: string, templates: CareTemplate[], dailyRoutines: DailyRoutineTemplate[]) => Promise<void>;
  resetToDefaults: () => void;
}

export const useCareTemplateStore = create<CareTemplateState>((set, get) => ({
  templates: [...DEFAULT_CARE_TEMPLATES],
  dailyRoutines: [...DEFAULT_DAILY_ROUTINES],
  loading: false,
  error: null,

  loadTemplates: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const docRef = doc(db, 'careTemplates', userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        set({
          templates: data.templates || [...DEFAULT_CARE_TEMPLATES],
          dailyRoutines: data.dailyRoutines || [...DEFAULT_DAILY_ROUTINES],
          loading: false
        });
      } else {
        // No custom templates, use defaults
        set({
          templates: [...DEFAULT_CARE_TEMPLATES],
          dailyRoutines: [...DEFAULT_DAILY_ROUTINES],
          loading: false
        });
      }
    } catch (error) {
      console.error('Error loading care templates:', error);
      set({ error: 'Failed to load care templates', loading: false });
    }
  },

  saveTemplates: async (userId: string, templates: CareTemplate[], dailyRoutines: DailyRoutineTemplate[]) => {
    set({ loading: true, error: null });
    try {
      const docRef = doc(db, 'careTemplates', userId);
      await setDoc(docRef, {
        templates,
        dailyRoutines,
        updatedAt: new Date().toISOString(),
      });
      set({ templates, dailyRoutines, loading: false });
    } catch (error) {
      console.error('Error saving care templates:', error);
      set({ error: 'Failed to save care templates', loading: false });
      throw error;
    }
  },

  resetToDefaults: () => {
    set({
      templates: [...DEFAULT_CARE_TEMPLATES],
      dailyRoutines: [...DEFAULT_DAILY_ROUTINES]
    });
  },
}));
