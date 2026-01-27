import { create } from 'zustand';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  DefaultTaskTemplate,
  BreederTaskTemplate,
  LitterTask,
  TaskStats,
  TaskStatus,
  DEFAULT_CARE_TEMPLATES,
  DEFAULT_DAILY_ROUTINES,
} from '@breeder/types';

interface TaskState {
  defaultTemplates: DefaultTaskTemplate[];
  breederTemplates: BreederTaskTemplate[];
  litterTasks: LitterTask[];
  loading: boolean;

  // Default template actions (admin only)
  subscribeToDefaultTemplates: () => () => void;
  createDefaultTemplate: (
    template: Omit<DefaultTaskTemplate, 'id' | 'updatedAt'>
  ) => Promise<void>;
  updateDefaultTemplate: (
    id: string,
    updates: Partial<DefaultTaskTemplate>
  ) => Promise<void>;
  deleteDefaultTemplate: (id: string) => Promise<void>;

  // Breeder template actions
  subscribeToBreederTemplates: (breederId: string) => () => void;
  initializeBreederTemplates: (breederId: string) => Promise<void>;
  createBreederTemplate: (
    template: Omit<BreederTaskTemplate, 'id' | 'updatedAt'>
  ) => Promise<void>;
  updateBreederTemplate: (
    id: string,
    updates: Partial<BreederTaskTemplate>
  ) => Promise<void>;
  deleteBreederTemplate: (id: string) => Promise<void>;

  // Litter task actions
  subscribeToBreederTasks: (breederId: string) => () => void;
  subscribeToLitterTasks: (litterId: string) => () => void;
  generateLitterTasks: (
    litterId: string,
    breederId: string,
    birthDate: string
  ) => Promise<void>;
  generateAllLitterTasks: (
    litterId: string,
    breederId: string,
    birthDate: string,
    litterName?: string
  ) => Promise<void>;
  updateTaskStatus: (
    taskId: string,
    status: TaskStatus,
    notes?: string
  ) => Promise<void>;
  deleteTasksForLitter: (litterId: string) => Promise<void>;
  getTaskStats: (litterId: string) => TaskStats;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  defaultTemplates: [],
  breederTemplates: [],
  litterTasks: [],
  loading: false,

  subscribeToDefaultTemplates: () => {
    const q = query(
      collection(db, 'taskTemplates', 'defaults', 'templates'),
      orderBy('sortOrder')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const templates: DefaultTaskTemplate[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as DefaultTaskTemplate[];
        set({ defaultTemplates: templates });
      },
      (error) => {
        console.error('Error subscribing to default templates:', error);
      }
    );

    return unsubscribe;
  },

  createDefaultTemplate: async (template) => {
    try {
      const templatesRef = collection(
        db,
        'taskTemplates',
        'defaults',
        'templates'
      );
      const newDocRef = doc(templatesRef);
      await setDoc(newDocRef, {
        ...template,
        id: newDocRef.id,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error creating default template:', error);
      throw error;
    }
  },

  updateDefaultTemplate: async (id, updates) => {
    try {
      const templateRef = doc(db, 'taskTemplates', 'defaults', 'templates', id);
      await updateDoc(templateRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating default template:', error);
      throw error;
    }
  },

  deleteDefaultTemplate: async (id) => {
    try {
      const templateRef = doc(db, 'taskTemplates', 'defaults', 'templates', id);
      await deleteDoc(templateRef);
    } catch (error) {
      console.error('Error deleting default template:', error);
      throw error;
    }
  },

  subscribeToBreederTemplates: (breederId: string) => {
    const q = query(
      collection(db, 'taskTemplates', 'breeders', breederId),
      orderBy('sortOrder')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const templates: BreederTaskTemplate[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as BreederTaskTemplate[];
        set({ breederTemplates: templates });
      },
      (error) => {
        console.error('Error subscribing to breeder templates:', error);
      }
    );

    return unsubscribe;
  },

  initializeBreederTemplates: async (breederId: string) => {
    try {
      // Check if breeder already has templates
      const breederTemplatesRef = collection(
        db,
        'taskTemplates',
        'breeders',
        breederId
      );
      const existingTemplates = await getDocs(breederTemplatesRef);

      if (existingTemplates.empty) {
        // Copy default templates to breeder
        const defaultTemplates = get().defaultTemplates;
        const batch = writeBatch(db);

        defaultTemplates.forEach((template) => {
          const newDocRef = doc(breederTemplatesRef);
          batch.set(newDocRef, {
            id: newDocRef.id,
            title: template.title,
            description: template.description,
            dayOrWeek: template.dayOrWeek,
            frequency: template.frequency,
            category: template.category,
            isActive: template.isActive,
            sortOrder: template.sortOrder,
            breederId,
            basedOnDefaultId: template.id,
            updatedAt: new Date().toISOString(),
          });
        });

        await batch.commit();
      }
    } catch (error) {
      console.error('Error initializing breeder templates:', error);
      throw error;
    }
  },

  createBreederTemplate: async (template) => {
    try {
      const templatesRef = collection(
        db,
        'taskTemplates',
        'breeders',
        template.breederId
      );
      const newDocRef = doc(templatesRef);
      await setDoc(newDocRef, {
        ...template,
        id: newDocRef.id,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error creating breeder template:', error);
      throw error;
    }
  },

  updateBreederTemplate: async (id, updates) => {
    try {
      const breederId =
        updates.breederId ||
        get().breederTemplates.find((t) => t.id === id)?.breederId;
      if (!breederId) throw new Error('Breeder ID not found');

      const templateRef = doc(db, 'taskTemplates', 'breeders', breederId, id);
      await updateDoc(templateRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating breeder template:', error);
      throw error;
    }
  },

  deleteBreederTemplate: async (id) => {
    try {
      const template = get().breederTemplates.find((t) => t.id === id);
      if (!template) throw new Error('Template not found');

      const templateRef = doc(
        db,
        'taskTemplates',
        'breeders',
        template.breederId,
        id
      );
      await deleteDoc(templateRef);
    } catch (error) {
      console.error('Error deleting breeder template:', error);
      throw error;
    }
  },

  subscribeToBreederTasks: (breederId: string) => {
    const q = query(
      collection(db, 'litterTasks'),
      where('breederId', '==', breederId),
      orderBy('dueDate')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const tasks: LitterTask[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as LitterTask[];
        set({ litterTasks: tasks });
      },
      (error) => {
        console.error('Error subscribing to breeder tasks:', error);
      }
    );

    return unsubscribe;
  },

  subscribeToLitterTasks: (litterId: string) => {
    const q = query(
      collection(db, 'litterTasks'),
      where('litterId', '==', litterId),
      orderBy('dueDate')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const tasks: LitterTask[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as LitterTask[];
        set({ litterTasks: tasks });
      },
      (error) => {
        console.error('Error subscribing to litter tasks:', error);
      }
    );

    return unsubscribe;
  },

  generateLitterTasks: async (
    litterId: string,
    breederId: string,
    birthDate: string
  ) => {
    try {
      const birthDateObj = new Date(birthDate);
      const templates = get().breederTemplates.filter((t) => t.isActive);
      const batch = writeBatch(db);

      templates.forEach((template) => {
        let dueDate: Date;

        if (template.dayOrWeek <= 21) {
          // Day-based task (0-21 days)
          dueDate = new Date(birthDateObj);
          dueDate.setDate(dueDate.getDate() + template.dayOrWeek);
        } else {
          // Week-based task (convert week to days)
          const weekNumber = template.dayOrWeek;
          dueDate = new Date(birthDateObj);
          dueDate.setDate(dueDate.getDate() + weekNumber * 7);
        }

        const taskRef = doc(collection(db, 'litterTasks'));
        batch.set(taskRef, {
          id: taskRef.id,
          litterId,
          breederId,
          templateId: template.id,
          title: template.title,
          description: template.description,
          dueDate: dueDate.toISOString(),
          dayOrWeek: template.dayOrWeek,
          frequency: template.frequency,
          category: template.category,
          status: 'pending',
          createdAt: new Date().toISOString(),
        } as Omit<LitterTask, 'id'>);
      });

      await batch.commit();
    } catch (error) {
      console.error('Error generating litter tasks:', error);
      throw error;
    }
  },

  generateAllLitterTasks: async (
    litterId: string,
    breederId: string,
    birthDate: string,
    litterName?: string
  ) => {
    try {
      const birthDateObj = new Date(birthDate);
      const batch = writeBatch(db);

      // Generate weekly milestone tasks from DEFAULT_CARE_TEMPLATES
      DEFAULT_CARE_TEMPLATES.forEach((template) => {
        const dueDate = new Date(birthDateObj);
        dueDate.setDate(dueDate.getDate() + template.weekDue * 7);

        const taskRef = doc(collection(db, 'litterTasks'));
        batch.set(taskRef, {
          id: taskRef.id,
          litterId,
          breederId,
          templateId: `default-weekly-${template.weekDue}-${template.name.replace(/\s+/g, '-').toLowerCase()}`,
          title: template.name,
          description: template.description || '',
          dueDate: dueDate.toISOString(),
          dayOrWeek: template.weekDue,
          frequency: 'once' as const,
          category: 'care' as const,
          status: 'pending' as const,
          taskType: 'weekly' as const,
          createdAt: new Date().toISOString(),
        });
      });

      // Generate daily tasks - create for the next 10 weeks (70 days)
      const totalDays = 70; // ~10 weeks of daily tasks
      for (let day = 0; day < totalDays; day++) {
        const taskDate = new Date(birthDateObj);
        taskDate.setDate(taskDate.getDate() + day);
        const currentWeek = Math.floor(day / 7);
        const dateStr = taskDate.toISOString().split('T')[0];

        DEFAULT_DAILY_ROUTINES.forEach((routine) => {
          // Check if this routine applies to the current week
          const isActive = routine.weekStart <= currentWeek;
          const notEnded = routine.weekEnd === undefined || routine.weekEnd >= currentWeek;

          if (!isActive || !notEnded) return;

          // Create tasks for morning and/or evening based on timeOfDay
          const timesOfDay: Array<'morning' | 'evening'> = [];
          if (routine.timeOfDay === 'morning' || routine.timeOfDay === 'both') {
            timesOfDay.push('morning');
          }
          if (routine.timeOfDay === 'evening' || routine.timeOfDay === 'both') {
            timesOfDay.push('evening');
          }

          timesOfDay.forEach((timeOfDay) => {
            const taskRef = doc(collection(db, 'litterTasks'));
            batch.set(taskRef, {
              id: taskRef.id,
              litterId,
              breederId,
              templateId: `default-daily-${routine.name.replace(/\s+/g, '-').toLowerCase()}-${timeOfDay}`,
              title: routine.name,
              description: routine.description || '',
              dueDate: taskDate.toISOString(),
              dayOrWeek: day,
              frequency: 'daily' as const,
              category: 'care' as const,
              status: 'pending' as const,
              taskType: 'daily' as const,
              timeOfDay,
              createdAt: new Date().toISOString(),
            });
          });
        });
      }

      await batch.commit();
    } catch (error) {
      console.error('Error generating all litter tasks:', error);
      throw error;
    }
  },

  updateTaskStatus: async (
    taskId: string,
    status: TaskStatus,
    notes?: string
  ) => {
    try {
      const taskRef = doc(db, 'litterTasks', taskId);
      const updates: any = {
        status,
      };

      if (status === 'completed') {
        updates.completedAt = new Date().toISOString();
      }

      if (notes !== undefined) {
        updates.notes = notes;
      }

      await updateDoc(taskRef, updates);
    } catch (error) {
      console.error('Error updating task status:', error);
      throw error;
    }
  },

  deleteTasksForLitter: async (litterId: string) => {
    try {
      const q = query(
        collection(db, 'litterTasks'),
        where('litterId', '==', litterId)
      );
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);

      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
    } catch (error) {
      console.error('Error deleting litter tasks:', error);
      throw error;
    }
  },

  getTaskStats: (litterId: string): TaskStats => {
    const tasks = get().litterTasks.filter((t) => t.litterId === litterId);
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const pending = tasks.filter((t) => t.status === 'pending').length;
    const skipped = tasks.filter((t) => t.status === 'skipped').length;

    return {
      total,
      completed,
      pending,
      skipped,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  },
}));
