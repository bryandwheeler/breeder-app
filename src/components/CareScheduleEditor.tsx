import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCareTemplateStore, CareTemplate, DailyRoutineTemplate } from '@/store/careTemplateStore';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Trash2, GripVertical, RotateCcw, Save, Sun, Moon } from 'lucide-react';
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
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: task.index.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className='flex gap-3 items-start p-3 border rounded-lg bg-muted/30'>
      <div {...attributes} {...listeners} className='pt-2 cursor-move opacity-50 hover:opacity-100'>
        <GripVertical className='h-5 w-5' />
      </div>
      <div className='flex-1 space-y-2'>
        <div className='grid grid-cols-2 gap-3'>
          <div>
            <Label className='text-xs'>Task Name</Label>
            <Input
              value={task.name}
              onChange={(e) => onUpdate(task.index, { name: e.target.value })}
              placeholder='e.g., First vaccination'
            />
          </div>
          <div>
            <Label className='text-xs'>Week Due</Label>
            <Input
              type='number'
              min='0'
              max='12'
              value={task.weekDue}
              onChange={(e) => onUpdate(task.index, { weekDue: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>
        <div>
          <Label className='text-xs'>Description (optional)</Label>
          <Textarea
            value={task.description || ''}
            onChange={(e) => onUpdate(task.index, { description: e.target.value })}
            placeholder='Additional details about this task'
            rows={2}
          />
        </div>
      </div>
      <Button
        type='button'
        variant='ghost'
        size='icon'
        onClick={() => onRemove(task.index)}
        className='text-destructive hover:text-destructive'
      >
        <Trash2 className='h-4 w-4' />
      </Button>
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
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: routine.index.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className='flex gap-3 items-start p-3 border rounded-lg bg-muted/30'>
      <div {...attributes} {...listeners} className='pt-2 cursor-move opacity-50 hover:opacity-100'>
        <GripVertical className='h-5 w-5' />
      </div>
      <div className='flex-1 space-y-2'>
        <div className='grid grid-cols-3 gap-3'>
          <div>
            <Label className='text-xs'>Routine Name</Label>
            <Input
              value={routine.name}
              onChange={(e) => onUpdate(routine.index, { name: e.target.value })}
              placeholder='e.g., Feed puppies'
            />
          </div>
          <div>
            <Label className='text-xs'>Time of Day</Label>
            <Select
              value={routine.timeOfDay}
              onValueChange={(value: 'morning' | 'evening' | 'both') =>
                onUpdate(routine.index, { timeOfDay: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='morning'>Morning</SelectItem>
                <SelectItem value='evening'>Evening</SelectItem>
                <SelectItem value='both'>Both</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='grid grid-cols-2 gap-2'>
            <div>
              <Label className='text-xs'>Start Week</Label>
              <Input
                type='number'
                min='0'
                max='12'
                value={routine.weekStart}
                onChange={(e) => onUpdate(routine.index, { weekStart: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label className='text-xs'>End Week</Label>
              <Input
                type='number'
                min='0'
                max='12'
                value={routine.weekEnd || ''}
                onChange={(e) => onUpdate(routine.index, { weekEnd: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder='∞'
              />
            </div>
          </div>
        </div>
        <div>
          <Label className='text-xs'>Description (optional)</Label>
          <Textarea
            value={routine.description || ''}
            onChange={(e) => onUpdate(routine.index, { description: e.target.value })}
            placeholder='Additional details about this routine'
            rows={2}
          />
        </div>
      </div>
      <Button
        type='button'
        variant='ghost'
        size='icon'
        onClick={() => onRemove(routine.index)}
        className='text-destructive hover:text-destructive'
      >
        <Trash2 className='h-4 w-4' />
      </Button>
    </div>
  );
}

export function CareScheduleEditor() {
  const { currentUser } = useAuth();
  const { templates, dailyRoutines, loading, loadTemplates, saveTemplates, resetToDefaults } = useCareTemplateStore();
  const [editableTemplates, setEditableTemplates] = useState<CareTemplate[]>([]);
  const [editableDailyRoutines, setEditableDailyRoutines] = useState<DailyRoutineTemplate[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

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
    const newTask: CareTemplate = {
      name: '',
      description: '',
      weekDue: 0,
    };
    setEditableTemplates([...editableTemplates, newTask]);
    setHasChanges(true);
  };

  const handleRemoveTask = (index: number) => {
    setEditableTemplates(editableTemplates.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  const handleUpdateTask = (index: number, updates: Partial<CareTemplate>) => {
    const updated = [...editableTemplates];
    updated[index] = { ...updated[index], ...updates };
    setEditableTemplates(updated);
    setHasChanges(true);
  };

  const handleAddDailyRoutine = () => {
    const newRoutine: DailyRoutineTemplate = {
      name: '',
      description: '',
      timeOfDay: 'morning',
      weekStart: 0,
      order: editableDailyRoutines.length + 1,
    };
    setEditableDailyRoutines([...editableDailyRoutines, newRoutine]);
    setHasChanges(true);
  };

  const handleRemoveDailyRoutine = (index: number) => {
    setEditableDailyRoutines(editableDailyRoutines.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  const handleUpdateDailyRoutine = (index: number, updates: Partial<DailyRoutineTemplate>) => {
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
    const validTemplates = editableTemplates.filter((t) => t.name.trim() !== '');
    const validDailyRoutines = editableDailyRoutines.filter((r) => r.name.trim() !== '');

    // Sort tasks by week
    const sortedTemplates = validTemplates.sort((a, b) => a.weekDue - b.weekDue);

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
    if (confirm('Are you sure you want to reset to the default care schedule? This will discard all your custom changes.')) {
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
            Customize the default care tasks and daily routines for new litters. Drag to reorder tasks.
          </p>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' onClick={handleResetToDefaults} size='sm'>
            <RotateCcw className='h-4 w-4 mr-2' />
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || loading} size='sm'>
            <Save className='h-4 w-4 mr-2' />
            Save Schedule
          </Button>
        </div>
      </div>

      <Tabs defaultValue='weekly' className='space-y-6'>
        <TabsList>
          <TabsTrigger value='weekly'>Weekly Tasks</TabsTrigger>
          <TabsTrigger value='daily'>Daily Routines</TabsTrigger>
        </TabsList>

        {/* Weekly Tasks Tab */}
        <TabsContent value='weekly' className='space-y-6'>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleTaskDragEnd}>
            <div className='space-y-6'>
              {weeks.map((week) => (
                <Card key={week} className='p-4'>
                  <h4 className='font-semibold mb-4 flex items-center gap-2'>
                    <div className='h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold'>
                      {week}
                    </div>
                    Week {week} {week === 0 && '(Birth)'}
                  </h4>
                  <SortableContext items={tasksByWeek[week].map((t) => t.index.toString())} strategy={verticalListSortingStrategy}>
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
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleRoutineDragEnd}>
            {/* Morning Routines */}
            <Card className='p-4'>
              <h4 className='font-semibold mb-4 flex items-center gap-2'>
                <Sun className='h-5 w-5 text-amber-500' />
                Morning Routines
              </h4>
              <SortableContext items={morningRoutines.map((r) => r.index.toString())} strategy={verticalListSortingStrategy}>
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
                </div>
              </SortableContext>
            </Card>

            {/* Evening Routines */}
            <Card className='p-4'>
              <h4 className='font-semibold mb-4 flex items-center gap-2'>
                <Moon className='h-5 w-5 text-blue-500' />
                Evening Routines
              </h4>
              <SortableContext items={eveningRoutines.map((r) => r.index.toString())} strategy={verticalListSortingStrategy}>
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
                </div>
              </SortableContext>
            </Card>
          </DndContext>

          <Button onClick={handleAddDailyRoutine} variant='outline' className='w-full'>
            <Plus className='h-4 w-4 mr-2' />
            Add New Daily Routine
          </Button>
        </TabsContent>
      </Tabs>

      {hasChanges && (
        <div className='p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
          <p className='text-sm text-yellow-800'>
            You have unsaved changes. Click "Save Schedule" to apply your changes to future litters.
          </p>
        </div>
      )}
    </div>
  );
}
