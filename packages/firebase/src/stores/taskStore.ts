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
    litterName?: string,
    options?: { dewClawRemoval?: boolean }
  ) => Promise<void>;
  updateTaskStatus: (
    taskId: string,
    status: TaskStatus,
    notes?: string
  ) => Promise<void>;
  bulkUpdateTaskStatus: (
    taskIds: string[],
    status: TaskStatus
  ) => Promise<void>;
  updateTaskAppointment: (
    taskId: string,
    appointment: {
      date?: string;
      time?: string;
      vetContactId?: string;
      vetName?: string;
      vetClinic?: string;
      vetPhone?: string;
      confirmationNumber?: string;
    }
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
    litterName?: string,
    options?: { dewClawRemoval?: boolean }
  ) => {
    try {
      const birthDateObj = new Date(birthDate);

      // Use multiple batches to avoid Firestore's 500 operation limit
      const batches: ReturnType<typeof writeBatch>[] = [writeBatch(db)];
      let currentBatchIndex = 0;
      let operationsInCurrentBatch = 0;
      const MAX_BATCH_SIZE = 450; // Leave some buffer under 500 limit

      const addToBatch = (ref: ReturnType<typeof doc>, data: any) => {
        if (operationsInCurrentBatch >= MAX_BATCH_SIZE) {
          batches.push(writeBatch(db));
          currentBatchIndex++;
          operationsInCurrentBatch = 0;
        }
        batches[currentBatchIndex].set(ref, data);
        operationsInCurrentBatch++;
      };

      // Add dew claw removal task if enabled (typically done days 2-5)
      if (options?.dewClawRemoval) {
        const dewClawDueDate = new Date(birthDateObj);
        dewClawDueDate.setDate(dewClawDueDate.getDate() + 3); // Day 3 is ideal

        const dewClawTaskRef = doc(collection(db, 'litterTasks'));
        addToBatch(dewClawTaskRef, {
          id: dewClawTaskRef.id,
          litterId,
          breederId,
          templateId: 'dew-claw-removal',
          title: 'Dew Claw Removal',
          description: 'Schedule and complete dew claw removal for puppies (best done between days 2-5 while nails are still soft).',
          dueDate: dewClawDueDate.toISOString(),
          dayOrWeek: 0,
          frequency: 'once' as const,
          category: 'health' as const,
          status: 'pending' as const,
          taskType: 'weekly' as const,
          createdAt: new Date().toISOString(),
        });
      }

      // Add week 6 task to schedule week 7 vet visit
      const scheduleVetVisitDate = new Date(birthDateObj);
      scheduleVetVisitDate.setDate(scheduleVetVisitDate.getDate() + 6 * 7); // Week 6

      const scheduleVetTaskRef = doc(collection(db, 'litterTasks'));
      addToBatch(scheduleVetTaskRef, {
        id: scheduleVetTaskRef.id,
        litterId,
        breederId,
        templateId: 'schedule-week7-vet-visit',
        title: 'Schedule Week 7 Vet Visit',
        description: 'Schedule vet appointment for week 7 puppy checkup and first vaccinations. Enter appointment details when confirmed.',
        dueDate: scheduleVetVisitDate.toISOString(),
        dayOrWeek: 6,
        frequency: 'once' as const,
        category: 'vaccination' as const,
        status: 'pending' as const,
        taskType: 'weekly' as const,
        requiresScheduling: true,
        createdAt: new Date().toISOString(),
      });

      // Fetch weekly templates from Firestore, fall back to hardcoded defaults
      // Note: No orderBy to avoid index requirements on new collections
      const weeklyTemplatesRef = collection(db, 'defaultTaskTemplates', 'weekly', 'tasks');
      const weeklySnapshot = await getDocs(weeklyTemplatesRef);

      interface WeeklyTemplate {
        id: string;
        name: string;
        description?: string;
        weekDue: number;
        sortOrder?: number;
        isActive?: boolean;
      }

      let weeklyTemplates: WeeklyTemplate[] = weeklySnapshot.docs
        .map((d) => ({ id: d.id, ...d.data() } as WeeklyTemplate))
        .filter((t) => t.isActive !== false)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

      // Fall back to hardcoded defaults if Firestore is empty
      if (weeklyTemplates.length === 0) {
        weeklyTemplates = DEFAULT_CARE_TEMPLATES.map((t, i) => ({
          id: `hardcoded-${i}`,
          name: t.name,
          description: t.description,
          weekDue: t.weekDue,
        }));
      }

      // Generate weekly milestone tasks
      weeklyTemplates.forEach((template) => {
        const dueDate = new Date(birthDateObj);
        dueDate.setDate(dueDate.getDate() + template.weekDue * 7);

        const taskRef = doc(collection(db, 'litterTasks'));
        addToBatch(taskRef, {
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

      // Fetch daily templates from Firestore, fall back to hardcoded defaults
      // Note: No orderBy to avoid index requirements on new collections
      const dailyTemplatesRef = collection(db, 'defaultTaskTemplates', 'daily', 'tasks');
      const dailySnapshot = await getDocs(dailyTemplatesRef);

      interface DailyTemplate {
        id: string;
        name: string;
        description?: string;
        timeOfDay: 'morning' | 'midday' | 'evening' | 'both';
        weekStart: number;
        weekEnd?: number;
        order?: number;
        isActive?: boolean;
      }

      let dailyTemplates: DailyTemplate[] = dailySnapshot.docs
        .map((d) => ({ id: d.id, ...d.data() } as DailyTemplate))
        .filter((t) => t.isActive !== false)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      // Fall back to hardcoded defaults if Firestore is empty
      if (dailyTemplates.length === 0) {
        dailyTemplates = DEFAULT_DAILY_ROUTINES.map((r, i) => ({
          id: `hardcoded-${i}`,
          name: r.name,
          description: r.description,
          timeOfDay: r.timeOfDay,
          weekStart: r.weekStart,
          weekEnd: r.weekEnd,
        }));
      }

      // Generate daily tasks - create for the next 10 weeks (70 days) from today
      // But respect the litter's actual age for determining which routines apply
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today

      // Calculate how many days old the litter is
      const litterAgeDays = Math.floor((today.getTime() - birthDateObj.getTime()) / (1000 * 60 * 60 * 24));

      // Start from today (or birth date if in the future) and generate 70 days of tasks
      const startDay = Math.max(0, litterAgeDays);
      const endDay = startDay + 70; // 70 days from the starting point

      for (let day = startDay; day < endDay; day++) {
        const taskDate = new Date(birthDateObj);
        taskDate.setDate(taskDate.getDate() + day);
        taskDate.setHours(0, 0, 0, 0); // Normalize to start of day

        const currentWeek = Math.floor(day / 7);

        dailyTemplates.forEach((routine) => {
          // Check if this routine applies to the current week
          // Use ?? to handle undefined/null weekStart (default to 0)
          const weekStart = routine.weekStart ?? 0;
          const isActive = weekStart <= currentWeek;
          const notEnded = routine.weekEnd === undefined || routine.weekEnd === null || routine.weekEnd >= currentWeek;

          if (!isActive || !notEnded) return;

          // Create tasks for morning, midday, and/or evening based on timeOfDay
          const timesOfDay: Array<'morning' | 'midday' | 'evening'> = [];
          const timeOfDayValue = (routine.timeOfDay || '').toLowerCase();

          if (timeOfDayValue === 'morning' || timeOfDayValue === 'both' || timeOfDayValue === 'am') {
            timesOfDay.push('morning');
          }
          if (timeOfDayValue === 'midday' || timeOfDayValue === 'noon') {
            timesOfDay.push('midday');
          }
          if (timeOfDayValue === 'evening' || timeOfDayValue === 'both' || timeOfDayValue === 'pm') {
            timesOfDay.push('evening');
          }

          // If no valid timeOfDay, skip
          if (timesOfDay.length === 0) return;

          timesOfDay.forEach((timeOfDay) => {
            const taskRef = doc(collection(db, 'litterTasks'));
            addToBatch(taskRef, {
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

      // Commit all batches
      await Promise.all(batches.map(batch => batch.commit()));
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

  bulkUpdateTaskStatus: async (taskIds: string[], status: TaskStatus) => {
    try {
      const batch = writeBatch(db);
      const updates: any = {
        status,
      };

      if (status === 'completed') {
        updates.completedAt = new Date().toISOString();
      }

      taskIds.forEach((taskId) => {
        const taskRef = doc(db, 'litterTasks', taskId);
        batch.update(taskRef, updates);
      });

      await batch.commit();
    } catch (error) {
      console.error('Error bulk updating task status:', error);
      throw error;
    }
  },

  updateTaskAppointment: async (taskId, appointment) => {
    try {
      const taskRef = doc(db, 'litterTasks', taskId);
      await updateDoc(taskRef, {
        appointment,
        // Also mark as completed when appointment is scheduled
        status: 'completed',
        completedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating task appointment:', error);
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
