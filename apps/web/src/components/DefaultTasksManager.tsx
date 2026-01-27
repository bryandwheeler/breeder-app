import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  Pencil,
  Trash2,
  Sunrise,
  Sun,
  Moon,
  Loader2,
  Save,
  RefreshCw,
  GripVertical,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@breeder/firebase';
import {
  DEFAULT_CARE_TEMPLATES,
  DEFAULT_DAILY_ROUTINES,
} from '@breeder/types';

// Types for admin-managed default templates
interface AdminWeeklyTask {
  id: string;
  name: string;
  description: string;
  weekDue: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AdminDailyTask {
  id: string;
  name: string;
  description: string;
  timeOfDay: 'morning' | 'midday' | 'evening' | 'both';
  weekStart: number;
  weekEnd?: number;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Convert hardcoded defaults to admin format for display
const getDefaultWeeklyTasks = (): AdminWeeklyTask[] => {
  return DEFAULT_CARE_TEMPLATES.map((template, index) => ({
    id: `default-weekly-${index}`,
    name: template.name,
    description: template.description || '',
    weekDue: template.weekDue,
    sortOrder: index,
    isActive: true,
    createdAt: '',
    updatedAt: '',
  }));
};

const getDefaultDailyTasks = (): AdminDailyTask[] => {
  return DEFAULT_DAILY_ROUTINES.map((routine, index) => ({
    id: `default-daily-${index}`,
    name: routine.name,
    description: routine.description || '',
    timeOfDay: routine.timeOfDay,
    weekStart: routine.weekStart,
    weekEnd: routine.weekEnd,
    order: routine.order,
    isActive: true,
    createdAt: '',
    updatedAt: '',
  }));
};

// Sortable Weekly Task Item
function SortableWeeklyTaskItem({
  task,
  onEdit,
  onDelete,
}: {
  task: AdminWeeklyTask;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 p-2 rounded border bg-background',
        !task.isActive && 'opacity-50 bg-muted',
        isDragging && 'opacity-50 shadow-lg z-50'
      )}
    >
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing touch-none p-1 hover:bg-muted rounded"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{task.name}</p>
        {task.description && (
          <p className="text-xs text-muted-foreground truncate">
            {task.description}
          </p>
        )}
      </div>
      {!task.isActive && (
        <Badge variant="secondary" className="text-xs">
          Inactive
        </Badge>
      )}
      <Button variant="ghost" size="icon" onClick={onEdit}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onDelete}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}

// Sortable Daily Task Item
function SortableDailyTaskItem({
  task,
  onEdit,
  onDelete,
}: {
  task: AdminDailyTask;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-start gap-2 p-2 rounded border text-sm bg-background',
        !task.isActive && 'opacity-50 bg-muted',
        isDragging && 'opacity-50 shadow-lg z-50'
      )}
    >
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing touch-none p-0.5 hover:bg-muted rounded mt-0.5"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm leading-tight">{task.name}</p>
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          Weeks {task.weekStart}
          {task.weekEnd !== undefined && task.weekEnd !== null
            ? `-${task.weekEnd}`
            : '+'}
        </p>
      </div>
      <div className="flex flex-col gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onEdit}
        >
          <Pencil className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onDelete}
        >
          <Trash2 className="h-3 w-3 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

export function DefaultTasksManager() {
  // Weekly milestone templates from Firestore
  const [firestoreWeeklyTasks, setFirestoreWeeklyTasks] = useState<AdminWeeklyTask[]>([]);
  const [loadingWeekly, setLoadingWeekly] = useState(true);
  const [weeklyFromFirestore, setWeeklyFromFirestore] = useState(false);

  // Daily routine templates from Firestore
  const [firestoreDailyTasks, setFirestoreDailyTasks] = useState<AdminDailyTask[]>([]);
  const [loadingDaily, setLoadingDaily] = useState(true);
  const [dailyFromFirestore, setDailyFromFirestore] = useState(false);

  // Effective tasks: use Firestore if available, otherwise hardcoded defaults
  const weeklyTasks = weeklyFromFirestore ? firestoreWeeklyTasks : getDefaultWeeklyTasks();
  const dailyTasks = dailyFromFirestore ? firestoreDailyTasks : getDefaultDailyTasks();

  // Dialog state
  const [weeklyDialogOpen, setWeeklyDialogOpen] = useState(false);
  const [dailyDialogOpen, setDailyDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingWeekly, setEditingWeekly] = useState<AdminWeeklyTask | null>(null);
  const [editingDaily, setEditingDaily] = useState<AdminDailyTask | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'weekly' | 'daily'; id: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState<'weekly' | 'daily' | null>(null);

  // Weekly form state
  const [weeklyForm, setWeeklyForm] = useState({
    name: '',
    description: '',
    weekDue: 0,
    isActive: true,
  });

  // Daily form state
  const [dailyForm, setDailyForm] = useState({
    name: '',
    description: '',
    timeOfDay: 'morning' as 'morning' | 'midday' | 'evening' | 'both',
    weekStart: 0,
    weekEnd: undefined as number | undefined,
    isActive: true,
  });

  // Subscribe to weekly templates from Firestore
  useEffect(() => {
    const collectionRef = collection(db, 'defaultTaskTemplates', 'weekly', 'tasks');

    const unsubscribe = onSnapshot(
      collectionRef,
      (snapshot) => {
        const tasks: AdminWeeklyTask[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as AdminWeeklyTask[];
        // Sort client-side
        tasks.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        setFirestoreWeeklyTasks(tasks);
        // If Firestore has data, use it; otherwise we'll show hardcoded defaults
        setWeeklyFromFirestore(tasks.length > 0);
        setLoadingWeekly(false);
      },
      (error) => {
        console.error('Error subscribing to weekly templates:', error);
        // On error, show hardcoded defaults
        setWeeklyFromFirestore(false);
        setLoadingWeekly(false);
      }
    );

    return unsubscribe;
  }, []);

  // Subscribe to daily templates from Firestore
  useEffect(() => {
    const collectionRef = collection(db, 'defaultTaskTemplates', 'daily', 'tasks');

    const unsubscribe = onSnapshot(
      collectionRef,
      (snapshot) => {
        const tasks: AdminDailyTask[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as AdminDailyTask[];
        // Sort client-side
        tasks.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        setFirestoreDailyTasks(tasks);
        // If Firestore has data, use it; otherwise we'll show hardcoded defaults
        setDailyFromFirestore(tasks.length > 0);
        setLoadingDaily(false);
      },
      (error) => {
        console.error('Error subscribing to daily templates:', error);
        // On error, show hardcoded defaults
        setDailyFromFirestore(false);
        setLoadingDaily(false);
      }
    );

    return unsubscribe;
  }, []);

  // Group weekly tasks by week
  const weeklyTasksByWeek = useMemo(() => {
    const grouped: Record<number, AdminWeeklyTask[]> = {};
    weeklyTasks.forEach((task) => {
      if (!grouped[task.weekDue]) {
        grouped[task.weekDue] = [];
      }
      grouped[task.weekDue].push(task);
    });
    return grouped;
  }, [weeklyTasks]);

  // Group daily tasks by time of day
  const dailyTasksByTime = useMemo(() => {
    const grouped: Record<string, AdminDailyTask[]> = {
      morning: [],
      midday: [],
      evening: [],
      both: [],
    };
    dailyTasks.forEach((task) => {
      grouped[task.timeOfDay].push(task);
    });
    // Sort by order within each group
    Object.keys(grouped).forEach((time) => {
      grouped[time].sort((a, b) => a.order - b.order);
    });
    return grouped;
  }, [dailyTasks]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Persist hardcoded defaults to Firestore (called when first edit is made)
  const persistWeeklyDefaults = async (): Promise<void> => {
    const batch = writeBatch(db);
    DEFAULT_CARE_TEMPLATES.forEach((template, index) => {
      const docRef = doc(collection(db, 'defaultTaskTemplates', 'weekly', 'tasks'));
      batch.set(docRef, {
        id: docRef.id,
        name: template.name,
        description: template.description || '',
        weekDue: template.weekDue,
        sortOrder: index,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });
    await batch.commit();
  };

  const persistDailyDefaults = async (): Promise<void> => {
    const batch = writeBatch(db);
    DEFAULT_DAILY_ROUTINES.forEach((routine) => {
      const docRef = doc(collection(db, 'defaultTaskTemplates', 'daily', 'tasks'));
      batch.set(docRef, {
        id: docRef.id,
        name: routine.name,
        description: routine.description || '',
        timeOfDay: routine.timeOfDay,
        weekStart: routine.weekStart,
        weekEnd: routine.weekEnd,
        order: routine.order,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });
    await batch.commit();
  };

  // Reset to defaults (opens confirmation dialog)
  const resetWeeklyToDefaults = () => {
    setResetConfirmOpen('weekly');
  };

  const resetDailyToDefaults = () => {
    setResetConfirmOpen('daily');
  };

  const executeReset = async () => {
    if (!resetConfirmOpen) return;

    setResetting(true);
    try {
      const collectionPath = resetConfirmOpen === 'weekly'
        ? 'defaultTaskTemplates/weekly/tasks'
        : 'defaultTaskTemplates/daily/tasks';
      const fromFirestore = resetConfirmOpen === 'weekly' ? weeklyFromFirestore : dailyFromFirestore;
      const firestoreTemplates = resetConfirmOpen === 'weekly' ? firestoreWeeklyTasks : firestoreDailyTasks;

      // Only delete Firestore docs if we have any
      if (fromFirestore && firestoreTemplates.length > 0) {
        const deleteBatch = writeBatch(db);
        firestoreTemplates.forEach((task) => {
          deleteBatch.delete(doc(db, collectionPath, task.id));
        });
        await deleteBatch.commit();
      }

      // If we had Firestore data, persist the defaults to reset
      // If we were showing hardcoded defaults, persist them to Firestore for future editing
      const createBatch = writeBatch(db);
      if (resetConfirmOpen === 'weekly') {
        DEFAULT_CARE_TEMPLATES.forEach((template, index) => {
          const docRef = doc(collection(db, 'defaultTaskTemplates', 'weekly', 'tasks'));
          createBatch.set(docRef, {
            id: docRef.id,
            name: template.name,
            description: template.description || '',
            weekDue: template.weekDue,
            sortOrder: index,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        });
      } else {
        DEFAULT_DAILY_ROUTINES.forEach((routine) => {
          const docRef = doc(collection(db, 'defaultTaskTemplates', 'daily', 'tasks'));
          createBatch.set(docRef, {
            id: docRef.id,
            name: routine.name,
            description: routine.description || '',
            timeOfDay: routine.timeOfDay,
            weekStart: routine.weekStart,
            weekEnd: routine.weekEnd,
            order: routine.order,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        });
      }
      await createBatch.commit();

      setResetConfirmOpen(null);
    } catch (error) {
      console.error('Error resetting to defaults:', error);
      alert('Failed to reset to defaults');
    } finally {
      setResetting(false);
    }
  };

  // Weekly CRUD
  const openWeeklyDialog = (task?: AdminWeeklyTask) => {
    if (task) {
      setEditingWeekly(task);
      setWeeklyForm({
        name: task.name,
        description: task.description,
        weekDue: task.weekDue,
        isActive: task.isActive,
      });
    } else {
      setEditingWeekly(null);
      setWeeklyForm({
        name: '',
        description: '',
        weekDue: 0,
        isActive: true,
      });
    }
    setWeeklyDialogOpen(true);
  };

  const saveWeeklyTask = async () => {
    if (!weeklyForm.name.trim()) {
      alert('Task name is required');
      return;
    }

    setSaving(true);
    try {
      const now = new Date().toISOString();

      // If we're not yet using Firestore, persist defaults first
      if (!weeklyFromFirestore) {
        await persistWeeklyDefaults();
        // Wait for snapshot to update - the subscription will set weeklyFromFirestore
      }

      if (editingWeekly && !editingWeekly.id.startsWith('default-')) {
        // Update existing Firestore doc
        const docRef = doc(db, 'defaultTaskTemplates', 'weekly', 'tasks', editingWeekly.id);
        await updateDoc(docRef, {
          name: weeklyForm.name,
          description: weeklyForm.description,
          weekDue: weeklyForm.weekDue,
          isActive: weeklyForm.isActive,
          updatedAt: now,
        });
      } else {
        // Create new - get max sortOrder from effective tasks
        const maxSortOrder = weeklyTasks.reduce((max, t) => Math.max(max, t.sortOrder), -1);
        const docRef = doc(collection(db, 'defaultTaskTemplates', 'weekly', 'tasks'));
        await setDoc(docRef, {
          id: docRef.id,
          name: weeklyForm.name,
          description: weeklyForm.description,
          weekDue: weeklyForm.weekDue,
          sortOrder: maxSortOrder + 1,
          isActive: weeklyForm.isActive,
          createdAt: now,
          updatedAt: now,
        });
      }

      setWeeklyDialogOpen(false);
    } catch (error) {
      console.error('Error saving weekly task:', error);
      alert('Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  // Daily CRUD
  const openDailyDialog = (task?: AdminDailyTask) => {
    if (task) {
      setEditingDaily(task);
      setDailyForm({
        name: task.name,
        description: task.description,
        timeOfDay: task.timeOfDay,
        weekStart: task.weekStart,
        weekEnd: task.weekEnd,
        isActive: task.isActive,
      });
    } else {
      setEditingDaily(null);
      setDailyForm({
        name: '',
        description: '',
        timeOfDay: 'morning',
        weekStart: 0,
        weekEnd: undefined,
        isActive: true,
      });
    }
    setDailyDialogOpen(true);
  };

  const saveDailyTask = async () => {
    if (!dailyForm.name.trim()) {
      alert('Task name is required');
      return;
    }

    setSaving(true);
    try {
      const now = new Date().toISOString();

      // If we're not yet using Firestore, persist defaults first
      if (!dailyFromFirestore) {
        await persistDailyDefaults();
        // Wait for snapshot to update - the subscription will set dailyFromFirestore
      }

      if (editingDaily && !editingDaily.id.startsWith('default-')) {
        // Update existing Firestore doc
        const docRef = doc(db, 'defaultTaskTemplates', 'daily', 'tasks', editingDaily.id);
        await updateDoc(docRef, {
          name: dailyForm.name,
          description: dailyForm.description,
          timeOfDay: dailyForm.timeOfDay,
          weekStart: dailyForm.weekStart,
          weekEnd: dailyForm.weekEnd ?? null,
          isActive: dailyForm.isActive,
          updatedAt: now,
        });
      } else {
        // Create new - get max order for the time of day
        const sameTimeTasks = dailyTasks.filter((t) => t.timeOfDay === dailyForm.timeOfDay);
        const maxOrder = sameTimeTasks.reduce((max, t) => Math.max(max, t.order), 0);
        const docRef = doc(collection(db, 'defaultTaskTemplates', 'daily', 'tasks'));
        await setDoc(docRef, {
          id: docRef.id,
          name: dailyForm.name,
          description: dailyForm.description,
          timeOfDay: dailyForm.timeOfDay,
          weekStart: dailyForm.weekStart,
          weekEnd: dailyForm.weekEnd ?? null,
          order: maxOrder + 1,
          isActive: dailyForm.isActive,
          createdAt: now,
          updatedAt: now,
        });
      }

      setDailyDialogOpen(false);
    } catch (error) {
      console.error('Error saving daily task:', error);
      alert('Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  // Delete task
  const confirmDelete = (type: 'weekly' | 'daily', id: string) => {
    setDeleteTarget({ type, id });
    setDeleteDialogOpen(true);
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;

    setSaving(true);
    try {
      const collectionPath = deleteTarget.type === 'weekly'
        ? 'defaultTaskTemplates/weekly/tasks'
        : 'defaultTaskTemplates/daily/tasks';
      const fromFirestore = deleteTarget.type === 'weekly' ? weeklyFromFirestore : dailyFromFirestore;

      // If showing hardcoded defaults, persist to Firestore first (excluding the one being deleted)
      if (!fromFirestore || deleteTarget.id.startsWith('default-')) {
        if (deleteTarget.type === 'weekly') {
          // Persist all defaults except the one being deleted
          const batch = writeBatch(db);
          DEFAULT_CARE_TEMPLATES.forEach((template, index) => {
            if (`default-weekly-${index}` !== deleteTarget.id) {
              const docRef = doc(collection(db, 'defaultTaskTemplates', 'weekly', 'tasks'));
              batch.set(docRef, {
                id: docRef.id,
                name: template.name,
                description: template.description || '',
                weekDue: template.weekDue,
                sortOrder: index,
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              });
            }
          });
          await batch.commit();
        } else {
          // Daily
          const batch = writeBatch(db);
          DEFAULT_DAILY_ROUTINES.forEach((routine, index) => {
            if (`default-daily-${index}` !== deleteTarget.id) {
              const docRef = doc(collection(db, 'defaultTaskTemplates', 'daily', 'tasks'));
              batch.set(docRef, {
                id: docRef.id,
                name: routine.name,
                description: routine.description || '',
                timeOfDay: routine.timeOfDay,
                weekStart: routine.weekStart,
                weekEnd: routine.weekEnd,
                order: routine.order,
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              });
            }
          });
          await batch.commit();
        }
      } else {
        // Normal Firestore delete
        await deleteDoc(doc(db, collectionPath, deleteTarget.id));
      }
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task');
    } finally {
      setSaving(false);
    }
  };

  // Handle drag end for weekly tasks within a week
  const handleWeeklyDragEnd = async (event: DragEndEvent, week: number) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const tasksInWeek = weeklyTasksByWeek[week].sort((a, b) => a.sortOrder - b.sortOrder);
    const oldIndex = tasksInWeek.findIndex((t) => t.id === active.id);
    const newIndex = tasksInWeek.findIndex((t) => t.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedTasks = arrayMove(tasksInWeek, oldIndex, newIndex);

    try {
      // If showing hardcoded defaults, persist all to Firestore with new order
      if (!weeklyFromFirestore) {
        const batch = writeBatch(db);
        // Build a map of task id to new sort order for this week
        const newOrderMap = new Map<string, number>();
        reorderedTasks.forEach((task, index) => {
          newOrderMap.set(task.id, index);
        });

        DEFAULT_CARE_TEMPLATES.forEach((template, index) => {
          const docRef = doc(collection(db, 'defaultTaskTemplates', 'weekly', 'tasks'));
          const defaultId = `default-weekly-${index}`;
          // Use new order if task is in this week and was reordered, otherwise use original
          const sortOrder = newOrderMap.has(defaultId) ? newOrderMap.get(defaultId)! : index;
          batch.set(docRef, {
            id: docRef.id,
            name: template.name,
            description: template.description || '',
            weekDue: template.weekDue,
            sortOrder,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        });
        await batch.commit();
      } else {
        // Update Firestore with new sort orders
        const batch = writeBatch(db);
        reorderedTasks.forEach((task, index) => {
          batch.update(doc(db, 'defaultTaskTemplates', 'weekly', 'tasks', task.id), {
            sortOrder: index,
          });
        });
        await batch.commit();
      }
    } catch (error) {
      console.error('Error reordering weekly tasks:', error);
    }
  };

  // Handle drag end for daily tasks within a time of day
  const handleDailyDragEnd = async (event: DragEndEvent, timeOfDay: string) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const tasksInTime = dailyTasksByTime[timeOfDay].sort((a, b) => a.order - b.order);
    const oldIndex = tasksInTime.findIndex((t) => t.id === active.id);
    const newIndex = tasksInTime.findIndex((t) => t.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedTasks = arrayMove(tasksInTime, oldIndex, newIndex);

    try {
      // If showing hardcoded defaults, persist all to Firestore with new order
      if (!dailyFromFirestore) {
        const batch = writeBatch(db);
        // Build a map of task id to new order for this time of day
        const newOrderMap = new Map<string, number>();
        reorderedTasks.forEach((task, index) => {
          newOrderMap.set(task.id, index);
        });

        DEFAULT_DAILY_ROUTINES.forEach((routine, index) => {
          const docRef = doc(collection(db, 'defaultTaskTemplates', 'daily', 'tasks'));
          const defaultId = `default-daily-${index}`;
          // Use new order if task is in this time of day and was reordered
          const order = newOrderMap.has(defaultId) ? newOrderMap.get(defaultId)! : routine.order;
          batch.set(docRef, {
            id: docRef.id,
            name: routine.name,
            description: routine.description || '',
            timeOfDay: routine.timeOfDay,
            weekStart: routine.weekStart,
            weekEnd: routine.weekEnd,
            order,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        });
        await batch.commit();
      } else {
        // Update Firestore with new orders
        const batch = writeBatch(db);
        reorderedTasks.forEach((task, index) => {
          batch.update(doc(db, 'defaultTaskTemplates', 'daily', 'tasks', task.id), {
            order: index,
          });
        });
        await batch.commit();
      }
    } catch (error) {
      console.error('Error reordering daily tasks:', error);
    }
  };

  const renderTimeOfDayIcon = (timeOfDay: string) => {
    switch (timeOfDay) {
      case 'morning':
        return <Sunrise className="h-4 w-4 text-amber-500" />;
      case 'midday':
        return <Sun className="h-4 w-4 text-orange-500" />;
      case 'evening':
        return <Moon className="h-4 w-4 text-indigo-500" />;
      case 'both':
        return (
          <div className="flex gap-0.5">
            <Sunrise className="h-3 w-3 text-amber-500" />
            <Moon className="h-3 w-3 text-indigo-500" />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="weekly" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="weekly">Weekly Milestones</TabsTrigger>
          <TabsTrigger value="daily">Daily Routines</TabsTrigger>
        </TabsList>

        {/* Weekly Milestones Tab */}
        <TabsContent value="weekly" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Weekly Milestone Templates</CardTitle>
                  <CardDescription>
                    One-time tasks that occur at specific weeks of the litter's life
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {weeklyFromFirestore && (
                    <Button
                      variant="outline"
                      onClick={resetWeeklyToDefaults}
                      disabled={resetting || loadingWeekly}
                    >
                      {resetting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Reset to Defaults
                    </Button>
                  )}
                  <Button onClick={() => openWeeklyDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Task
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingWeekly ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mb-2" />
                  <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.keys(weeklyTasksByWeek)
                    .map(Number)
                    .sort((a, b) => a - b)
                    .map((week) => {
                      const tasksInWeek = weeklyTasksByWeek[week].sort(
                        (a, b) => a.sortOrder - b.sortOrder
                      );
                      return (
                        <div key={week} className="border rounded-lg p-4">
                          <h4 className="font-medium mb-3 flex items-center gap-2">
                            <Badge variant="outline">Week {week}</Badge>
                            <span className="text-sm text-muted-foreground">
                              ({tasksInWeek.length} tasks)
                            </span>
                          </h4>
                          <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={(event) => handleWeeklyDragEnd(event, week)}
                          >
                            <SortableContext
                              items={tasksInWeek.map((t) => t.id)}
                              strategy={verticalListSortingStrategy}
                            >
                              <div className="space-y-2">
                                {tasksInWeek.map((task) => (
                                  <SortableWeeklyTaskItem
                                    key={task.id}
                                    task={task}
                                    onEdit={() => openWeeklyDialog(task)}
                                    onDelete={() => confirmDelete('weekly', task.id)}
                                  />
                                ))}
                              </div>
                            </SortableContext>
                          </DndContext>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Daily Routines Tab */}
        <TabsContent value="daily" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Daily Routine Templates</CardTitle>
                  <CardDescription>
                    Recurring tasks that happen daily at specific times
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {dailyFromFirestore && (
                    <Button
                      variant="outline"
                      onClick={resetDailyToDefaults}
                      disabled={resetting || loadingDaily}
                    >
                      {resetting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Reset to Defaults
                    </Button>
                  )}
                  <Button onClick={() => openDailyDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Task
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingDaily ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mb-2" />
                  <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {(['morning', 'midday', 'evening', 'both'] as const).map((timeOfDay) => {
                    const tasks = dailyTasksByTime[timeOfDay].sort((a, b) => a.order - b.order);
                    if (tasks.length === 0 && timeOfDay !== 'morning' && timeOfDay !== 'evening') {
                      return null;
                    }
                    return (
                      <div key={timeOfDay} className="border rounded-lg p-4">
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          {renderTimeOfDayIcon(timeOfDay)}
                          <span className="capitalize">{timeOfDay === 'both' ? 'Morning & Evening' : timeOfDay}</span>
                          <Badge variant="outline" className="ml-auto">
                            {tasks.length}
                          </Badge>
                        </h4>
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={(event) => handleDailyDragEnd(event, timeOfDay)}
                        >
                          <SortableContext
                            items={tasks.map((t) => t.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            <div className="space-y-2">
                              {tasks.map((task) => (
                                <SortableDailyTaskItem
                                  key={task.id}
                                  task={task}
                                  onEdit={() => openDailyDialog(task)}
                                  onDelete={() => confirmDelete('daily', task.id)}
                                />
                              ))}
                              {tasks.length === 0 && (
                                <p className="text-xs text-muted-foreground text-center py-2">
                                  No tasks
                                </p>
                              )}
                            </div>
                          </SortableContext>
                        </DndContext>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Weekly Task Dialog */}
      <Dialog open={weeklyDialogOpen} onOpenChange={setWeeklyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingWeekly ? 'Edit Weekly Task' : 'Add Weekly Task'}
            </DialogTitle>
            <DialogDescription>
              Configure a weekly milestone task for litter care
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="weekly-name">Task Name *</Label>
              <Input
                id="weekly-name"
                value={weeklyForm.name}
                onChange={(e) => setWeeklyForm({ ...weeklyForm, name: e.target.value })}
                placeholder="e.g., First vaccination"
              />
            </div>
            <div>
              <Label htmlFor="weekly-description">Description</Label>
              <Textarea
                id="weekly-description"
                value={weeklyForm.description}
                onChange={(e) => setWeeklyForm({ ...weeklyForm, description: e.target.value })}
                placeholder="Additional details about the task"
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="weekly-week">Week Due *</Label>
              <Select
                value={weeklyForm.weekDue.toString()}
                onValueChange={(v) => setWeeklyForm({ ...weeklyForm, weekDue: parseInt(v) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select week" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 13 }, (_, i) => (
                    <SelectItem key={i} value={i.toString()}>
                      Week {i} {i === 0 ? '(Birth)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="weekly-active"
                checked={weeklyForm.isActive}
                onChange={(e) => setWeeklyForm({ ...weeklyForm, isActive: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="weekly-active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWeeklyDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveWeeklyTask} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Daily Task Dialog */}
      <Dialog open={dailyDialogOpen} onOpenChange={setDailyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingDaily ? 'Edit Daily Task' : 'Add Daily Task'}
            </DialogTitle>
            <DialogDescription>
              Configure a daily routine task for litter care
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="daily-name">Task Name *</Label>
              <Input
                id="daily-name"
                value={dailyForm.name}
                onChange={(e) => setDailyForm({ ...dailyForm, name: e.target.value })}
                placeholder="e.g., Feed puppies"
              />
            </div>
            <div>
              <Label htmlFor="daily-description">Description</Label>
              <Textarea
                id="daily-description"
                value={dailyForm.description}
                onChange={(e) => setDailyForm({ ...dailyForm, description: e.target.value })}
                placeholder="Additional details about the task"
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="daily-time">Time of Day *</Label>
              <Select
                value={dailyForm.timeOfDay}
                onValueChange={(v) => setDailyForm({ ...dailyForm, timeOfDay: v as typeof dailyForm.timeOfDay })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">
                    <div className="flex items-center gap-2">
                      <Sunrise className="h-4 w-4 text-amber-500" />
                      Morning
                    </div>
                  </SelectItem>
                  <SelectItem value="midday">
                    <div className="flex items-center gap-2">
                      <Sun className="h-4 w-4 text-orange-500" />
                      Midday
                    </div>
                  </SelectItem>
                  <SelectItem value="evening">
                    <div className="flex items-center gap-2">
                      <Moon className="h-4 w-4 text-indigo-500" />
                      Evening
                    </div>
                  </SelectItem>
                  <SelectItem value="both">
                    <div className="flex items-center gap-2">
                      <Sunrise className="h-4 w-4 text-amber-500" />
                      <Moon className="h-4 w-4 text-indigo-500" />
                      Morning & Evening
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="daily-week-start">Start Week *</Label>
                <Select
                  value={dailyForm.weekStart.toString()}
                  onValueChange={(v) => setDailyForm({ ...dailyForm, weekStart: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Start week" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 13 }, (_, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        Week {i}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="daily-week-end">End Week (optional)</Label>
                <Select
                  value={dailyForm.weekEnd?.toString() ?? 'none'}
                  onValueChange={(v) =>
                    setDailyForm({ ...dailyForm, weekEnd: v === 'none' ? undefined : parseInt(v) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No end" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No end (continues)</SelectItem>
                    {Array.from({ length: 13 }, (_, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        Week {i}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="daily-active"
                checked={dailyForm.isActive}
                onChange={(e) => setDailyForm({ ...dailyForm, isActive: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="daily-active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDailyDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveDailyTask} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task Template?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this task template. New litters will not receive this task.
              Existing litter tasks are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={resetConfirmOpen !== null} onOpenChange={(open) => !open && setResetConfirmOpen(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset to Defaults?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete all {resetConfirmOpen === 'weekly' ? 'weekly milestone' : 'daily routine'} templates
              and replace them with the original defaults. Your customizations will be lost.
              Existing litter tasks are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeReset}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {resetting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Reset to Defaults
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
