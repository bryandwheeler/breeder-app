import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, ListTodo, Plus } from 'lucide-react';
import { differenceInWeeks, format } from 'date-fns';
import { Litter, CareTask } from '@breeder/types';
import { cn } from '@/lib/utils';
import { useCareTemplateStore } from '@breeder/firebase';
import { useAuth } from '@/contexts/AuthContext';

interface LitterCareTasksProps {
  litter: Litter;
  onUpdate: (litterId: string, updates: Partial<Litter>) => Promise<void>;
}

export function LitterCareTasks({ litter, onUpdate }: LitterCareTasksProps) {
  const [saving, setSaving] = useState<string | null>(null);
  const { currentUser } = useAuth();
  const { templates, loadTemplates } = useCareTemplateStore();

  const currentWeek = differenceInWeeks(new Date(), new Date(litter.dateOfBirth));
  const careTasks = litter.careTasks || [];

  // Load custom templates on mount
  useEffect(() => {
    if (currentUser) {
      loadTemplates(currentUser.uid);
    }
  }, [currentUser, loadTemplates]);

  // Initialize tasks from custom templates if empty
  const initializeTasks = async () => {
    const tasks: CareTask[] = templates.map((template) => ({
      id: crypto.randomUUID(),
      name: template.name,
      description: template.description,
      weekDue: template.weekDue,
      completed: false,
    }));
    await onUpdate(litter.id, { careTasks: tasks });
  };

  // Group tasks by week
  const tasksByWeek = careTasks.reduce((acc, task) => {
    const week = task.weekDue;
    if (!acc[week]) acc[week] = [];
    acc[week].push(task);
    return acc;
  }, {} as Record<number, CareTask[]>);

  const weeks = Object.keys(tasksByWeek).map(Number).sort((a, b) => a - b);

  const completedCount = careTasks.filter(t => t.completed).length;
  const progress = careTasks.length > 0 ? Math.round((completedCount / careTasks.length) * 100) : 0;

  const handleToggleTask = async (taskId: string) => {
    setSaving(taskId);
    try {
      const updatedTasks = careTasks.map(t =>
        t.id === taskId
          ? { ...t, completed: !t.completed, completedDate: !t.completed ? new Date().toISOString() : undefined }
          : t
      );
      await onUpdate(litter.id, { careTasks: updatedTasks });
    } finally {
      setSaving(null);
    }
  };

  if (careTasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListTodo className="h-5 w-5" /> Care Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            No care tasks set up for this litter yet.
          </p>
          <Button onClick={initializeTasks}>
            <Plus className="mr-2 h-4 w-4" /> Load Default Care Schedule
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <ListTodo className="h-5 w-5" /> Care Schedule
          </CardTitle>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              Week {currentWeek}
            </span>
            <Badge variant={progress === 100 ? 'default' : 'outline'}>
              {completedCount}/{careTasks.length} tasks
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Progress bar */}
        <div className="w-full bg-muted rounded-full h-2 mb-6">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Tasks by week */}
        <div className="space-y-6">
          {weeks.map(week => {
            const weekTasks = tasksByWeek[week];
            const isPast = week < currentWeek;
            const isCurrent = week === currentWeek;
            const weekComplete = weekTasks.every(t => t.completed);

            return (
              <div key={week} className={cn(
                "border rounded-lg p-4",
                isCurrent && "border-primary bg-primary/5",
                isPast && weekComplete && "opacity-60"
              )}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className={cn(
                    "font-semibold",
                    isCurrent && "text-primary"
                  )}>
                    Week {week} {isCurrent && "(Current)"}
                  </h3>
                  {weekComplete && (
                    <Badge variant="default" className="bg-green-500">Complete</Badge>
                  )}
                </div>

                <div className="space-y-2">
                  {weekTasks.map(task => (
                    <button
                      key={task.id}
                      onClick={() => handleToggleTask(task.id)}
                      disabled={saving === task.id}
                      className={cn(
                        "w-full flex items-start gap-3 p-2 rounded-lg text-left transition-all",
                        "hover:bg-muted/50 disabled:opacity-50",
                        task.completed && "bg-green-500/10"
                      )}
                    >
                      {task.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <Circle className={cn(
                          "h-5 w-5 mt-0.5 flex-shrink-0",
                          isCurrent || isPast ? "text-yellow-500" : "text-muted-foreground"
                        )} />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "font-medium text-sm",
                          task.completed && "line-through text-muted-foreground"
                        )}>
                          {task.name}
                        </p>
                        {task.description && (
                          <p className="text-xs text-muted-foreground">
                            {task.description}
                          </p>
                        )}
                        {task.completedDate && (
                          <p className="text-xs text-green-600 mt-1">
                            Done {format(new Date(task.completedDate), 'MMM d')}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
