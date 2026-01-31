import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ToastAction } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
import {
  useCareTemplateStore,
  CareTemplate,
  DailyRoutineTemplate,
} from '@breeder/firebase';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Plus,
  Trash2,
  GripVertical,
  RotateCcw,
  Save,
  Sun,
  Moon,
  ChevronDown,
  ChevronUp,
  Calendar,
  Clock,
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

// Sortable task item component
function SortableTaskItem({
  task,
  index: _index,
  onUpdate,
  onRemove,
}: {
  task: CareTemplate & { index: number };
  index: number;
  onUpdate: (index: number, updates: Partial<CareTemplate>) => void;
  onRemove: (index: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: task.index.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className='border rounded-lg bg-muted/30'
    >
      <div className='flex items-start gap-3 p-3'>
        <div
          {...attributes}
          {...listeners}
          className='pt-1 cursor-move opacity-50 hover:opacity-100'
        >
          <GripVertical className='h-5 w-5' />
        </div>

        <div className='flex-1 grid grid-cols-[minmax(0,1fr)_auto_auto] gap-3 items-center'>
          <div>
            <Label className='text-[10px] uppercase tracking-wide text-muted-foreground'>
              Task
            </Label>
            <Input
              value={task.name}
              onChange={(e) => onUpdate(task.index, { name: e.target.value })}
              placeholder='e.g., First vaccination'
              className='h-8 text-xs'
            />
          </div>
          <div className='w-24'>
            <Label className='text-[10px] uppercase tracking-wide text-muted-foreground'>
              Week
            </Label>
            <Input
              type='number'
              min='0'
              max='12'
              value={task.weekDue}
              onChange={(e) =>
                onUpdate(task.index, { weekDue: parseInt(e.target.value) || 0 })
              }
              className='h-8 text-xs'
            />
          </div>
          <div className='flex items-center justify-end gap-2'>
            <Button
              type='button'
              variant='ghost'
              size='icon'
              onClick={() => setExpanded((prev) => !prev)}
              className='h-8 w-8'
            >
              {expanded ? (
                <ChevronUp className='h-4 w-4' />
              ) : (
                <ChevronDown className='h-4 w-4' />
              )}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  className='text-destructive hover:text-destructive h-8 w-8'
                >
                  <Trash2 className='h-4 w-4' />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete task?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove this weekly care task from your template.
                    This change isn&apos;t saved to future litters until you
                    click &quot;Save Schedule&quot;.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onRemove(task.index)}>
                    Delete task
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {!expanded && task.description && (
        <div className='px-3 pb-3 pt-0'>
          <button
            type='button'
            className='w-full text-left text-[11px] text-muted-foreground truncate hover:text-foreground'
            onClick={() => setExpanded(true)}
          >
            {task.description}
          </button>
        </div>
      )}

      {expanded && (
        <div className='px-3 pb-3 pt-0'>
          <Label className='text-xs'>Description (optional)</Label>
          <Textarea
            value={task.description || ''}
            onChange={(e) =>
              onUpdate(task.index, { description: e.target.value })
            }
            placeholder='Additional details about this task'
            rows={2}
            className='mt-1 text-xs'
          />
        </div>
      )}
    </div>
  );
}

// Sortable daily routine item component
function SortableDailyRoutineItem({
  routine,
  index: _index,
  onUpdate,
  onRemove,
}: {
  routine: DailyRoutineTemplate & { index: number };
  index: number;
  onUpdate: (index: number, updates: Partial<DailyRoutineTemplate>) => void;
  onRemove: (index: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: routine.index.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className='border rounded-lg bg-muted/30'
    >
      <div className='flex items-start gap-3 p-3'>
        <div
          {...attributes}
          {...listeners}
          className='pt-1 cursor-move opacity-50 hover:opacity-100'
        >
          <GripVertical className='h-5 w-5' />
        </div>

        <div className='flex-1 grid grid-cols-[minmax(0,1fr)_auto_auto_auto] gap-3 items-center'>
          <div>
            <Label className='text-[10px] uppercase tracking-wide text-muted-foreground'>
              Routine
            </Label>
            <Input
              value={routine.name}
              onChange={(e) =>
                onUpdate(routine.index, { name: e.target.value })
              }
              placeholder='e.g., Feed puppies'
              className='h-8 text-xs'
            />
          </div>
          <div className='w-28'>
            <Label className='text-[10px] uppercase tracking-wide text-muted-foreground'>
              Time
            </Label>
            <Select
              value={routine.timeOfDay}
              onValueChange={(value: 'morning' | 'evening' | 'both') =>
                onUpdate(routine.index, { timeOfDay: value })
              }
            >
              <SelectTrigger className='h-8 text-xs'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='morning'>Morning</SelectItem>
                <SelectItem value='evening'>Evening</SelectItem>
                <SelectItem value='both'>Both</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='w-20'>
            <Label className='text-[10px] uppercase tracking-wide text-muted-foreground'>
              Start wk
            </Label>
            <Input
              type='number'
              min='0'
              max='12'
              value={routine.weekStart}
              onChange={(e) =>
                onUpdate(routine.index, {
                  weekStart: parseInt(e.target.value) || 0,
                })
              }
              className='h-8 text-xs'
            />
          </div>
          <div className='w-20'>
            <Label className='text-[10px] uppercase tracking-wide text-muted-foreground'>
              End wk
            </Label>
            <Input
              type='number'
              min='0'
              max='12'
              value={routine.weekEnd || ''}
              onChange={(e) =>
                onUpdate(routine.index, {
                  weekEnd: e.target.value
                    ? parseInt(e.target.value)
                    : undefined,
                })
              }
              placeholder='∞'
              className='h-8 text-xs'
            />
          </div>
          <div className='flex items-center justify-end gap-2'>
            <Button
              type='button'
              variant='ghost'
              size='icon'
              onClick={() => setExpanded((prev) => !prev)}
              className='h-8 w-8'
            >
              {expanded ? (
                <ChevronUp className='h-4 w-4' />
              ) : (
                <ChevronDown className='h-4 w-4' />
              )}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  className='text-destructive hover:text-destructive h-8 w-8'
                >
                  <Trash2 className='h-4 w-4' />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete routine?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove this daily routine from your template. This
                    change isn&apos;t saved to future litters until you click
                    &quot;Save Schedule&quot;.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onRemove(routine.index)}>
                    Delete routine
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {!expanded && routine.description && (
        <div className='px-3 pb-3 pt-0'>
          <button
            type='button'
            className='w-full text-left text-[11px] text-muted-foreground truncate hover:text-foreground'
            onClick={() => setExpanded(true)}
          >
            {routine.description}
          </button>
        </div>
      )}

      {expanded && (
        <div className='px-3 pb-3 pt-0'>
          <Label className='text-xs'>Description (optional)</Label>
          <Textarea
            value={routine.description || ''}
            onChange={(e) =>
              onUpdate(routine.index, { description: e.target.value })
            }
            placeholder='Additional details about this routine'
            rows={2}
            className='mt-1 text-xs'
          />
        </div>
      )}
    </div>
  );
}

export function CareScheduleEditor() {
  const { currentUser } = useAuth();
  const {
    templates,
    dailyRoutines,
    loading,
    loadTemplates,
    saveTemplates,
    resetToDefaults,
  } = useCareTemplateStore();
  const [editableTemplates, setEditableTemplates] = useState<CareTemplate[]>(
    []
  );
  const [editableDailyRoutines, setEditableDailyRoutines] = useState<
    DailyRoutineTemplate[]
  >([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [showAddTaskDialog, setShowAddTaskDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'weekly' | 'daily'>('weekly');
  const { toast } = useToast();

  type DeletedItem =
    | { kind: 'weekly'; item: CareTemplate; index: number }
    | { kind: 'daily'; item: DailyRoutineTemplate; index: number };

  const restoreDeleted = (deleted: DeletedItem) => {
    if (deleted.kind === 'weekly') {
      setEditableTemplates((prev) => {
        const insertIndex = Math.min(deleted.index, prev.length);
        const updated = [...prev];
        updated.splice(insertIndex, 0, deleted.item);
        return updated;
      });
    } else {
      setEditableDailyRoutines((prev) => {
        const insertIndex = Math.min(deleted.index, prev.length);
        const updated = [...prev];
        updated.splice(insertIndex, 0, deleted.item);
        // Recompute order after reinserting
        return updated.map((item, idx) => ({ ...item, order: idx + 1 }));
      });
    }
    setHasChanges(true);
  };

  const showUndoToast = (deleted: DeletedItem) => {
    toast({
      title: deleted.kind === 'weekly' ? 'Task deleted' : 'Routine deleted',
      description: 'You can undo this change before saving the schedule.',
      action: (
        <ToastAction
          altText='Undo delete'
          onClick={() => restoreDeleted(deleted)}
        >
          Undo
        </ToastAction>
      ),
    });
  };

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (currentUser) {
      loadTemplates(currentUser.uid);
    }
  }, [currentUser, loadTemplates]);

  useEffect(() => {
    setEditableTemplates([...templates]);
    setEditableDailyRoutines([...dailyRoutines]);
    setHasChanges(false);
  }, [templates, dailyRoutines]);

  const handleAddTask = () => {
    const maxWeek =
      editableTemplates.length > 0
        ? Math.max(...editableTemplates.map((t) => t.weekDue ?? 0))
        : 0;
    const newTask: CareTemplate = {
      name: '',
      description: '',
      weekDue: maxWeek,
    };
    setEditableTemplates([...editableTemplates, newTask]);
    setHasChanges(true);
  };

  const handleRemoveTask = (index: number) => {
    const item = editableTemplates[index];
    if (!item) return;

    const updated = editableTemplates.filter((_, i) => i !== index);
    setEditableTemplates(updated);
    setHasChanges(true);
    showUndoToast({ kind: 'weekly', item, index });
  };

  const handleUpdateTask = (index: number, updates: Partial<CareTemplate>) => {
    const updated = [...editableTemplates];
    updated[index] = { ...updated[index], ...updates };
    setEditableTemplates(updated);
    setHasChanges(true);
  };

  const handleAddDailyRoutine = (timeOfDay: 'morning' | 'evening' | 'both') => {
    const newRoutine: DailyRoutineTemplate = {
      name: '',
      description: '',
      timeOfDay,
      weekStart: 0,
      order: editableDailyRoutines.length + 1,
    };
    setEditableDailyRoutines([...editableDailyRoutines, newRoutine]);
    setHasChanges(true);
  };

  const handleAddTaskTypeSelection = (type: 'weekly' | 'daily') => {
    setShowAddTaskDialog(false);
    if (type === 'weekly') {
      setActiveTab('weekly');
      handleAddTask();
    } else {
      setActiveTab('daily');
      // Default to morning for new daily routines from the dialog
      handleAddDailyRoutine('morning');
    }
  };

  const handleRemoveDailyRoutine = (index: number) => {
    const item = editableDailyRoutines[index];
    if (!item) return;

    const filtered = editableDailyRoutines.filter((_, i) => i !== index);
    const updated = filtered.map((routine, idx) => ({
      ...routine,
      order: idx + 1,
    }));
    setEditableDailyRoutines(updated);
    setHasChanges(true);
    showUndoToast({ kind: 'daily', item, index });
  };

  const handleUpdateDailyRoutine = (
    index: number,
    updates: Partial<DailyRoutineTemplate>
  ) => {
    const updated = [...editableDailyRoutines];
    updated[index] = { ...updated[index], ...updates };
    setEditableDailyRoutines(updated);
    setHasChanges(true);
  };

  const handleTaskDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = parseInt(active.id.toString());
      const newIndex = parseInt(over.id.toString());

      setEditableTemplates((items) => {
        const actualOldIndex = items.findIndex((_, i) => i === oldIndex);
        const actualNewIndex = items.findIndex((_, i) => i === newIndex);
        return arrayMove(items, actualOldIndex, actualNewIndex);
      });
      setHasChanges(true);
    }
  };

  const handleRoutineDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = parseInt(active.id.toString());
      const newIndex = parseInt(over.id.toString());

      setEditableDailyRoutines((items) => {
        const actualOldIndex = items.findIndex((_, i) => i === oldIndex);
        const actualNewIndex = items.findIndex((_, i) => i === newIndex);
        const moved = arrayMove(items, actualOldIndex, actualNewIndex);
        // Update order values
        return moved.map((item, idx) => ({ ...item, order: idx + 1 }));
      });
      setHasChanges(true);
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;

    // Filter out empty tasks
    const validTemplates = editableTemplates.filter(
      (t) => t.name.trim() !== ''
    );
    const validDailyRoutines = editableDailyRoutines.filter(
      (r) => r.name.trim() !== ''
    );

    // Sort tasks by week
    const sortedTemplates = validTemplates.sort(
      (a, b) => a.weekDue - b.weekDue
    );

    // Sort daily routines by order
    const sortedRoutines = validDailyRoutines.sort((a, b) => a.order - b.order);

    try {
      console.log('Saving templates:', sortedTemplates);
      console.log('Saving daily routines:', sortedRoutines);
      await saveTemplates(currentUser.uid, sortedTemplates, sortedRoutines);
      alert('Care schedule saved successfully!');
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving care schedule:', error);
      alert('Failed to save care schedule. Please try again.');
    }
  };

  const handleResetToDefaults = () => {
    if (
      confirm(
        'Are you sure you want to reset to the default care schedule? This will discard all your custom changes.'
      )
    ) {
      resetToDefaults();
      setHasChanges(true);
    }
  };

  // Group tasks by week for better visualization
  const tasksByWeek = editableTemplates.reduce((acc, task, index) => {
    const week = task.weekDue;
    if (!acc[week]) {
      acc[week] = [];
    }
    acc[week].push({ ...task, index });
    return acc;
  }, {} as Record<number, (CareTemplate & { index: number })[]>);

  const weeks = Object.keys(tasksByWeek)
    .map(Number)
    .sort((a, b) => a - b);

  // Group daily routines by time of day
  const morningRoutines = editableDailyRoutines
    .map((routine, index) => ({ ...routine, index }))
    .filter((r) => r.timeOfDay === 'morning' || r.timeOfDay === 'both')
    .sort((a, b) => a.order - b.order);

  const eveningRoutines = editableDailyRoutines
    .map((routine, index) => ({ ...routine, index }))
    .filter((r) => r.timeOfDay === 'evening' || r.timeOfDay === 'both')
    .sort((a, b) => a.order - b.order);

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='text-lg font-semibold'>Litter Care Schedule</h3>
          <p className='text-sm text-muted-foreground'>
            Customize the default care tasks and daily routines for new litters.
            Drag to reorder tasks.
          </p>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' onClick={() => setShowAddTaskDialog(true)} size='sm'>
            <Plus className='h-4 w-4 mr-2' />
            Add Task
          </Button>
          <Button variant='outline' onClick={handleResetToDefaults} size='sm'>
            <RotateCcw className='h-4 w-4 mr-2' />
            Reset to Defaults
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || loading}
            size='sm'
          >
            <Save className='h-4 w-4 mr-2' />
            Save Schedule
          </Button>
        </div>
      </div>

      {/* Add Task Type Selection Dialog */}
      <Dialog open={showAddTaskDialog} onOpenChange={setShowAddTaskDialog}>
        <DialogContent className='max-w-sm'>
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
            <DialogDescription>
              What type of task would you like to add?
            </DialogDescription>
          </DialogHeader>
          <div className='grid grid-cols-2 gap-4 pt-4'>
            <button
              type='button'
              onClick={() => handleAddTaskTypeSelection('weekly')}
              className='flex flex-col items-center gap-3 p-6 border rounded-lg hover:bg-muted transition-colors'
            >
              <Calendar className='h-8 w-8 text-primary' />
              <div className='text-center'>
                <p className='font-medium'>Weekly Task</p>
                <p className='text-xs text-muted-foreground mt-1'>
                  One-time milestone tasks due at specific weeks
                </p>
              </div>
            </button>
            <button
              type='button'
              onClick={() => handleAddTaskTypeSelection('daily')}
              className='flex flex-col items-center gap-3 p-6 border rounded-lg hover:bg-muted transition-colors'
            >
              <Clock className='h-8 w-8 text-primary' />
              <div className='text-center'>
                <p className='font-medium'>Daily Routine</p>
                <p className='text-xs text-muted-foreground mt-1'>
                  Recurring tasks done every day
                </p>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'weekly' | 'daily')} className='space-y-6'>
        <TabsList>
          <TabsTrigger value='weekly'>Weekly Tasks</TabsTrigger>
          <TabsTrigger value='daily'>Daily Routines</TabsTrigger>
        </TabsList>

        {/* Weekly Tasks Tab */}
        <TabsContent value='weekly' className='space-y-6'>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleTaskDragEnd}
          >
            <div className='space-y-6'>
              {weeks.map((week) => (
                <Card key={week} className='p-4'>
                  <h4 className='font-semibold mb-4 flex items-center gap-2'>
                    <div className='h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold'>
                      {week}
                    </div>
                    Week {week} {week === 0 && '(Birth)'}
                  </h4>
                  <SortableContext
                    items={tasksByWeek[week].map((t) => t.index.toString())}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className='space-y-3'>
                      {tasksByWeek[week].map((task) => (
                        <SortableTaskItem
                          key={task.index}
                          task={task}
                          index={task.index}
                          onUpdate={handleUpdateTask}
                          onRemove={handleRemoveTask}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </Card>
              ))}
            </div>
          </DndContext>

          <Button onClick={handleAddTask} variant='outline' className='w-full'>
            <Plus className='h-4 w-4 mr-2' />
            Add New Weekly Task
          </Button>
        </TabsContent>

        {/* Daily Routines Tab */}
        <TabsContent value='daily' className='space-y-6'>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleRoutineDragEnd}
          >
            {/* Morning Routines */}
            <Card className='p-4'>
              <h4 className='font-semibold mb-4 flex items-center gap-2'>
                <Sun className='h-5 w-5 text-amber-500' />
                Morning Routines
              </h4>
              <SortableContext
                items={morningRoutines.map((r) => r.index.toString())}
                strategy={verticalListSortingStrategy}
              >
                <div className='space-y-3'>
                  {morningRoutines.length > 0 ? (
                    morningRoutines.map((routine) => (
                      <SortableDailyRoutineItem
                        key={routine.index}
                        routine={routine}
                        index={routine.index}
                        onUpdate={handleUpdateDailyRoutine}
                        onRemove={handleRemoveDailyRoutine}
                      />
                    ))
                  ) : (
                    <p className='text-sm text-muted-foreground text-center py-4'>
                      No morning routines yet. Add one below.
                    </p>
                  )}
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    className='w-full mt-1'
                    onClick={() => handleAddDailyRoutine('morning')}
                  >
                    <Plus className='h-4 w-4 mr-2' />
                    Add Morning Routine
                  </Button>
                </div>
              </SortableContext>
            </Card>

            {/* Evening Routines */}
            <Card className='p-4'>
              <h4 className='font-semibold mb-4 flex items-center gap-2'>
                <Moon className='h-5 w-5 text-blue-500' />
                Evening Routines
              </h4>
              <SortableContext
                items={eveningRoutines.map((r) => r.index.toString())}
                strategy={verticalListSortingStrategy}
              >
                <div className='space-y-3'>
                  {eveningRoutines.length > 0 ? (
                    eveningRoutines.map((routine) => (
                      <SortableDailyRoutineItem
                        key={routine.index}
                        routine={routine}
                        index={routine.index}
                        onUpdate={handleUpdateDailyRoutine}
                        onRemove={handleRemoveDailyRoutine}
                      />
                    ))
                  ) : (
                    <p className='text-sm text-muted-foreground text-center py-4'>
                      No evening routines yet. Add one below.
                    </p>
                  )}
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    className='w-full mt-1'
                    onClick={() => handleAddDailyRoutine('evening')}
                  >
                    <Plus className='h-4 w-4 mr-2' />
                    Add Evening Routine
                  </Button>
                </div>
              </SortableContext>
            </Card>
          </DndContext>
        </TabsContent>
      </Tabs>

      {hasChanges && (
        <div className='p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
          <p className='text-sm text-yellow-800'>
            You have unsaved changes. Click "Save Schedule" to apply your
            changes to future litters.
          </p>
        </div>
      )}
    </div>
  );
}
