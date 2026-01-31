import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, Circle, ListTodo, Plus, Sunrise, Sun, Moon, Calendar, Loader2, RefreshCw, AlertCircle, CheckCheck, SkipForward, CalendarPlus, Phone, Clock } from 'lucide-react';
import { format, startOfDay, endOfDay, isBefore, isAfter, addDays } from 'date-fns';
import { Litter, LitterTask } from '@breeder/types';
import { cn } from '@/lib/utils';
import { useTaskStore } from '@breeder/firebase';
import { useAuth } from '@/contexts/AuthContext';
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
import { AppointmentSchedulingDialog } from './AppointmentSchedulingDialog';

interface LitterCareTasksProps {
  litter: Litter;
  onUpdate?: (litterId: string, updates: Partial<Litter>) => Promise<void>;
}

export function LitterCareTasks({ litter }: LitterCareTasksProps) {
  const [saving, setSaving] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [schedulingTask, setSchedulingTask] = useState<LitterTask | null>(null);
  const { currentUser } = useAuth();
  const {
    litterTasks,
    subscribeToLitterTasks,
    generateAllLitterTasks,
    deleteTasksForLitter,
    updateTaskStatus,
    bulkUpdateTaskStatus,
    loading,
  } = useTaskStore();

  // Check if litter has old embedded tasks (stored in litter document, not in litterTasks collection)
  const hasOldEmbeddedTasks = (litter.careTasks && litter.careTasks.length > 0) ||
                              (litter.dailyTasks && litter.dailyTasks.length > 0);

  // Check if centralized litterTasks exist but are old format (no daily tasks)
  const hasDailyTasks = litterTasks.some(t => t.taskType === 'daily');
  const hasCentralizedOldFormatTasks = litterTasks.length > 0 && !hasDailyTasks;

  // Show upgrade banner if EITHER:
  // 1. We have old embedded tasks in the litter document (even if litterTasks collection is empty)
  // 2. We have centralized tasks but they're old format (no daily tasks)
  const needsUpgrade = hasOldEmbeddedTasks || hasCentralizedOldFormatTasks;

  const today = startOfDay(new Date());

  // Subscribe to tasks for this litter
  useEffect(() => {
    if (litter.id) {
      const unsubscribe = subscribeToLitterTasks(litter.id);
      return unsubscribe;
    }
  }, [litter.id, subscribeToLitterTasks]);

  // Filter and organize tasks
  const { weeklyTasks, todaysDailyTasks, overdueDailyTasks, upcomingWeeklyTasks } = useMemo(() => {
    const daily = litterTasks.filter(t => t.taskType === 'daily');
    const weekly = litterTasks.filter(t => t.taskType === 'weekly' || !t.taskType);

    // Today's daily tasks
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    const todaysDaily = daily.filter(t => {
      const dueDate = new Date(t.dueDate);
      return !isBefore(dueDate, todayStart) && !isAfter(dueDate, todayEnd);
    });

    // Overdue daily tasks (before today)
    const overdueDaily = daily.filter(t => {
      const dueDate = new Date(t.dueDate);
      return isBefore(dueDate, todayStart);
    });

    // Weekly tasks sorted by due date
    const sortedWeekly = [...weekly].sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );

    return {
      weeklyTasks: weekly,
      todaysDailyTasks: todaysDaily,
      overdueDailyTasks: overdueDaily,
      upcomingWeeklyTasks: sortedWeekly,
    };
  }, [litterTasks]);

  // Group today's daily tasks by time of day
  const morningTasks = todaysDailyTasks.filter(t => t.timeOfDay === 'morning');
  const middayTasks = todaysDailyTasks.filter(t => t.timeOfDay === 'midday');
  const eveningTasks = todaysDailyTasks.filter(t => t.timeOfDay === 'evening');

  // Count completed
  const morningComplete = morningTasks.filter(t => t.status === 'completed').length;
  const middayComplete = middayTasks.filter(t => t.status === 'completed').length;
  const eveningComplete = eveningTasks.filter(t => t.status === 'completed').length;
  const totalDailyTasks = morningTasks.length + middayTasks.length + eveningTasks.length;
  const totalDailyComplete = morningComplete + middayComplete + eveningComplete;

  // Overdue counts
  const overduePendingCount = overdueDailyTasks.filter(t => t.status === 'pending').length;

  const weeklyCompleted = weeklyTasks.filter(t => t.status === 'completed').length;
  const weeklyProgress = weeklyTasks.length > 0
    ? Math.round((weeklyCompleted / weeklyTasks.length) * 100)
    : 0;

  // Group weekly tasks by week number
  const tasksByWeek = useMemo(() => {
    const grouped: Record<number, LitterTask[]> = {};
    upcomingWeeklyTasks.forEach(task => {
      const week = task.dayOrWeek;
      if (!grouped[week]) grouped[week] = [];
      grouped[week].push(task);
    });
    return grouped;
  }, [upcomingWeeklyTasks]);

  const weeks = Object.keys(tasksByWeek).map(Number).sort((a, b) => a - b);

  // Calculate current week based on litter birth date
  const currentWeek = useMemo(() => {
    if (!litter.dateOfBirth) return 0;
    const birthDate = new Date(litter.dateOfBirth);
    const diffTime = today.getTime() - birthDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.floor(diffDays / 7);
  }, [litter.dateOfBirth, today]);

  // Initialize tasks for this litter
  const handleInitializeTasks = async () => {
    if (!currentUser || !litter.dateOfBirth) return;
    setGenerating(true);
    try {
      await generateAllLitterTasks(
        litter.id,
        currentUser.uid,
        litter.dateOfBirth,
        litter.litterName,
        { dewClawRemoval: litter.dewClawRemoval }
      );
    } catch (error) {
      console.error('Error generating tasks:', error);
    } finally {
      setGenerating(false);
    }
  };

  // Regenerate tasks (delete existing and create new)
  const handleRegenerateTasks = async () => {
    if (!currentUser || !litter.dateOfBirth) return;
    setGenerating(true);
    try {
      // Delete existing tasks first
      await deleteTasksForLitter(litter.id);
      // Then generate new ones
      await generateAllLitterTasks(
        litter.id,
        currentUser.uid,
        litter.dateOfBirth,
        litter.litterName,
        { dewClawRemoval: litter.dewClawRemoval }
      );
    } catch (error) {
      console.error('Error regenerating tasks:', error);
    } finally {
      setGenerating(false);
    }
  };

  // Toggle task completion
  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    setSaving(taskId);
    try {
      await updateTaskStatus(
        taskId,
        currentStatus === 'completed' ? 'pending' : 'completed'
      );
    } finally {
      setSaving(null);
    }
  };

  // Show loading state
  if (loading && litterTasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListTodo className="h-5 w-5" /> Care Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Show empty state if no tasks at all (neither centralized nor embedded)
  if (litterTasks.length === 0 && !hasOldEmbeddedTasks) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListTodo className="h-5 w-5" /> Care Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="space-y-4">
            <p className="text-muted-foreground">
              No care tasks set up for this litter yet.
            </p>
            {!litter.dateOfBirth ? (
              <p className="text-sm text-amber-600">
                Set a birth date for this litter to enable care tasks.
              </p>
            ) : (
              <Button onClick={handleInitializeTasks} disabled={generating}>
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Tasks...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Generate Care Schedule
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show old embedded tasks with upgrade banner when no centralized tasks exist
  if (litterTasks.length === 0 && hasOldEmbeddedTasks) {
    const oldTasks = litter.careTasks || [];
    const sortedOldTasks = [...oldTasks].sort((a, b) => a.weekDue - b.weekDue);
    const completedCount = oldTasks.filter(t => t.completed).length;
    const progress = oldTasks.length > 0 ? Math.round((completedCount / oldTasks.length) * 100) : 0;

    // Group by week
    const tasksByWeek: Record<number, typeof oldTasks> = {};
    sortedOldTasks.forEach(task => {
      if (!tasksByWeek[task.weekDue]) tasksByWeek[task.weekDue] = [];
      tasksByWeek[task.weekDue].push(task);
    });
    const weeks = Object.keys(tasksByWeek).map(Number).sort((a, b) => a - b);

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListTodo className="h-5 w-5" /> Care Schedule
          </CardTitle>
        </CardHeader>

        {/* Upgrade banner */}
        {litter.dateOfBirth && (
          <div className="mx-6 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-amber-800 text-sm">Upgrade Available</p>
                  <p className="text-xs text-amber-700">
                    Add daily routines, due dates, and dashboard integration
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="border-amber-300 text-amber-800 hover:bg-amber-100"
                onClick={handleInitializeTasks}
                disabled={generating}
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Upgrading...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Upgrade Tasks
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        <CardContent>
          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-muted-foreground mb-1">
              <span>Progress</span>
              <span>{completedCount}/{oldTasks.length} tasks</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Old tasks by week */}
          <div className="space-y-4">
            {weeks.map(week => {
              const weekTasks = tasksByWeek[week];
              const weekComplete = weekTasks.every(t => t.completed);
              const isPast = week < currentWeek;
              const isCurrent = week === currentWeek;

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
                    {weekTasks.map(task => {
                      const isCompleted = task.completed;
                      return (
                        <div
                          key={task.id}
                          className={cn(
                            "flex items-start gap-3 p-2 rounded-lg",
                            isCompleted && "bg-green-500/10"
                          )}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                          ) : (
                            <Circle className={cn(
                              "h-5 w-5 mt-0.5 flex-shrink-0",
                              isCurrent || isPast ? "text-amber-500" : "text-muted-foreground"
                            )} />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              "font-medium text-sm",
                              isCompleted && "line-through text-muted-foreground"
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
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <CardTitle className="flex items-center gap-2">
            <ListTodo className="h-5 w-5" /> Care Schedule
          </CardTitle>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              Week {currentWeek}
            </span>
            {litter.dateOfBirth && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" disabled={generating}>
                    {generating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Regenerate Care Tasks?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will delete all existing tasks for this litter and create new ones
                      based on the birth date ({format(new Date(litter.dateOfBirth), 'MMM d, yyyy')}).
                      Any completion status will be reset.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRegenerateTasks}>
                      Regenerate Tasks
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Upgrade banner for old format tasks */}
      {needsUpgrade && litter.dateOfBirth && (
        <div className="mx-6 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-amber-800 text-sm">Upgrade Available</p>
                <p className="text-xs text-amber-700">
                  Add daily routines and dashboard integration
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-amber-300 text-amber-800 hover:bg-amber-100"
              onClick={handleRegenerateTasks}
              disabled={generating}
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Upgrading...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Upgrade Tasks
                </>
              )}
            </Button>
          </div>
        </div>
      )}
      <CardContent>
        <Tabs defaultValue="daily" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="daily" className="flex items-center gap-2">
              <Sun className="h-4 w-4" />
              <span className="hidden sm:inline">Daily Tasks</span>
              <span className="sm:hidden">Daily</span>
              {(totalDailyTasks > 0 || overduePendingCount > 0) && (
                <Badge variant={totalDailyComplete === totalDailyTasks && overduePendingCount === 0 ? 'default' : 'outline'} className="ml-1">
                  {overduePendingCount > 0 ? `${overduePendingCount}+` : ''}{totalDailyComplete}/{totalDailyTasks}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="weekly" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Weekly Schedule</span>
              <span className="sm:hidden">Weekly</span>
              {weeklyTasks.length > 0 && (
                <Badge variant={weeklyProgress === 100 ? 'default' : 'outline'} className="ml-1">
                  {weeklyCompleted}/{weeklyTasks.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Daily Tasks Tab */}
          <TabsContent value="daily" className="space-y-6">
            {totalDailyTasks === 0 && overdueDailyTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No daily tasks for today.</p>
                <p className="text-sm mt-2">Daily routines will appear based on the litter's age.</p>
              </div>
            ) : (
              <>
                {/* Overdue daily tasks */}
                {overdueDailyTasks.length > 0 && (
                  <div className="border border-destructive/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-destructive flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Overdue ({overduePendingCount} pending)
                      </h3>
                      {overduePendingCount > 0 && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={async () => {
                              const pendingIds = overdueDailyTasks
                                .filter((t) => t.status === 'pending')
                                .map((t) => t.id);
                              if (pendingIds.length > 0) {
                                await bulkUpdateTaskStatus(pendingIds, 'completed');
                              }
                            }}
                          >
                            <CheckCheck className="h-3.5 w-3.5 mr-1" />
                            All
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={async () => {
                              const pendingIds = overdueDailyTasks
                                .filter((t) => t.status === 'pending')
                                .map((t) => t.id);
                              if (pendingIds.length > 0) {
                                await bulkUpdateTaskStatus(pendingIds, 'skipped');
                              }
                            }}
                          >
                            <SkipForward className="h-3.5 w-3.5 mr-1" />
                            Skip
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {overdueDailyTasks.map(task => {
                        const isCompleted = task.status === 'completed';
                        const isSkipped = task.status === 'skipped';
                        const isSaving = saving === task.id;
                        const taskDate = new Date(task.dueDate);
                        return (
                          <button
                            key={task.id}
                            onClick={() => handleToggleTask(task.id, task.status)}
                            disabled={isSaving}
                            className={cn(
                              "w-full flex items-start gap-3 p-2 rounded-lg text-left transition-all",
                              "hover:bg-muted/50 disabled:opacity-50",
                              (isCompleted || isSkipped) && "bg-muted/30 opacity-60"
                            )}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                            ) : isSkipped ? (
                              <SkipForward className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                            ) : (
                              <Circle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className={cn(
                                "font-medium text-sm",
                                (isCompleted || isSkipped) && "line-through text-muted-foreground"
                              )}>
                                {task.title}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(taskDate, 'MMM d')} · {task.timeOfDay || 'morning'}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Today's date header */}
                <div className="text-center text-sm text-muted-foreground">
                  {format(new Date(), 'EEEE, MMMM d, yyyy')}
                </div>

                {/* Morning Tasks */}
                {morningTasks.length > 0 && (
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Sunrise className="h-5 w-5 text-amber-500" />
                      <h3 className="font-semibold">Morning</h3>
                      <Badge variant={morningComplete === morningTasks.length ? 'default' : 'outline'} className="ml-auto">
                        {morningComplete}/{morningTasks.length}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {morningTasks.map(task => {
                        const isCompleted = task.status === 'completed';
                        const isSaving = saving === task.id;
                        return (
                          <button
                            key={task.id}
                            onClick={() => handleToggleTask(task.id, task.status)}
                            disabled={isSaving}
                            className={cn(
                              "w-full flex items-start gap-3 p-2 rounded-lg text-left transition-all",
                              "hover:bg-muted/50 disabled:opacity-50",
                              isCompleted && "bg-green-500/10"
                            )}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                            ) : (
                              <Circle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className={cn(
                                "font-medium text-sm",
                                isCompleted && "line-through text-muted-foreground"
                              )}>
                                {task.title}
                              </p>
                              {task.description && (
                                <p className="text-xs text-muted-foreground">
                                  {task.description}
                                </p>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Midday Tasks */}
                {middayTasks.length > 0 && (
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Sun className="h-5 w-5 text-orange-500" />
                      <h3 className="font-semibold">Midday</h3>
                      <Badge variant={middayComplete === middayTasks.length ? 'default' : 'outline'} className="ml-auto">
                        {middayComplete}/{middayTasks.length}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {middayTasks.map(task => {
                        const isCompleted = task.status === 'completed';
                        const isSaving = saving === task.id;
                        return (
                          <button
                            key={task.id}
                            onClick={() => handleToggleTask(task.id, task.status)}
                            disabled={isSaving}
                            className={cn(
                              "w-full flex items-start gap-3 p-2 rounded-lg text-left transition-all",
                              "hover:bg-muted/50 disabled:opacity-50",
                              isCompleted && "bg-green-500/10"
                            )}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                            ) : (
                              <Circle className="h-5 w-5 text-orange-400 mt-0.5 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className={cn(
                                "font-medium text-sm",
                                isCompleted && "line-through text-muted-foreground"
                              )}>
                                {task.title}
                              </p>
                              {task.description && (
                                <p className="text-xs text-muted-foreground">
                                  {task.description}
                                </p>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Evening Tasks */}
                {eveningTasks.length > 0 && (
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Moon className="h-5 w-5 text-indigo-500" />
                      <h3 className="font-semibold">Evening</h3>
                      <Badge variant={eveningComplete === eveningTasks.length ? 'default' : 'outline'} className="ml-auto">
                        {eveningComplete}/{eveningTasks.length}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {eveningTasks.map(task => {
                        const isCompleted = task.status === 'completed';
                        const isSaving = saving === task.id;
                        return (
                          <button
                            key={task.id}
                            onClick={() => handleToggleTask(task.id, task.status)}
                            disabled={isSaving}
                            className={cn(
                              "w-full flex items-start gap-3 p-2 rounded-lg text-left transition-all",
                              "hover:bg-muted/50 disabled:opacity-50",
                              isCompleted && "bg-green-500/10"
                            )}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                            ) : (
                              <Circle className="h-5 w-5 text-indigo-400 mt-0.5 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className={cn(
                                "font-medium text-sm",
                                isCompleted && "line-through text-muted-foreground"
                              )}>
                                {task.title}
                              </p>
                              {task.description && (
                                <p className="text-xs text-muted-foreground">
                                  {task.description}
                                </p>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Weekly Tasks Tab */}
          <TabsContent value="weekly" className="space-y-6">
            {weeklyTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No weekly milestone tasks set up.</p>
              </div>
            ) : (
              <>
                {/* Progress bar */}
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${weeklyProgress}%` }}
                  />
                </div>

                {/* Tasks by week */}
                <div className="space-y-6">
                  {weeks.map(week => {
                    const weekTasks = tasksByWeek[week];
                    const isPast = week < currentWeek;
                    const isCurrent = week === currentWeek;
                    const weekComplete = weekTasks.every(t => t.status === 'completed');

                    // Calculate due date for this week
                    const birthDate = new Date(litter.dateOfBirth);
                    const weekDueDate = addDays(birthDate, week * 7);

                    return (
                      <div key={week} className={cn(
                        "border rounded-lg p-4",
                        isCurrent && "border-primary bg-primary/5",
                        isPast && weekComplete && "opacity-60"
                      )}>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className={cn(
                              "font-semibold",
                              isCurrent && "text-primary"
                            )}>
                              Week {week} {isCurrent && "(Current)"}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              Due: {format(weekDueDate, 'MMM d, yyyy')}
                            </p>
                          </div>
                          {weekComplete && (
                            <Badge variant="default" className="bg-green-500">Complete</Badge>
                          )}
                        </div>

                        <div className="space-y-2">
                          {weekTasks.map(task => {
                            const isCompleted = task.status === 'completed';
                            const isSaving = saving === task.id;
                            const taskDueDate = new Date(task.dueDate);
                            const requiresScheduling = task.requiresScheduling;
                            const hasAppointment = task.appointment?.date;

                            // For scheduling tasks, show special UI
                            if (requiresScheduling) {
                              return (
                                <div
                                  key={task.id}
                                  className={cn(
                                    "w-full p-3 rounded-lg border-2 transition-all",
                                    isCompleted
                                      ? "bg-green-500/10 border-green-300"
                                      : "bg-blue-50 border-blue-200 hover:border-blue-300"
                                  )}
                                >
                                  <div className="flex items-start gap-3">
                                    {isCompleted ? (
                                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                                    ) : (
                                      <CalendarPlus className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between gap-2">
                                        <p className={cn(
                                          "font-medium text-sm",
                                          isCompleted && "text-green-700"
                                        )}>
                                          {task.title}
                                        </p>
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                                          Due: {format(taskDueDate, 'MMM d')}
                                        </span>
                                      </div>

                                      {task.description && !hasAppointment && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                          {task.description}
                                        </p>
                                      )}

                                      {/* Show appointment details if scheduled */}
                                      {hasAppointment && (
                                        <div className="mt-2 p-2 bg-white rounded border text-xs space-y-1">
                                          <div className="flex items-center gap-2">
                                            <Calendar className="h-3.5 w-3.5 text-blue-500" />
                                            <span className="font-medium">
                                              {format(new Date(task.appointment!.date!), 'EEEE, MMMM d, yyyy')}
                                            </span>
                                            {task.appointment?.time && (
                                              <>
                                                <Clock className="h-3.5 w-3.5 text-blue-500 ml-2" />
                                                <span>{task.appointment.time}</span>
                                              </>
                                            )}
                                          </div>
                                          {(task.appointment?.vetName || task.appointment?.vetClinic) && (
                                            <div className="text-muted-foreground">
                                              {task.appointment.vetName}
                                              {task.appointment.vetName && task.appointment.vetClinic && ' at '}
                                              {task.appointment.vetClinic}
                                            </div>
                                          )}
                                          {task.appointment?.vetPhone && (
                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                              <Phone className="h-3 w-3" />
                                              {task.appointment.vetPhone}
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {/* Schedule button */}
                                      <Button
                                        size="sm"
                                        variant={isCompleted ? "outline" : "default"}
                                        className="mt-2"
                                        onClick={() => setSchedulingTask(task)}
                                      >
                                        <CalendarPlus className="h-4 w-4 mr-1" />
                                        {isCompleted ? 'Edit Appointment' : 'Schedule Appointment'}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              );
                            }

                            // Regular task rendering
                            return (
                              <button
                                key={task.id}
                                onClick={() => handleToggleTask(task.id, task.status)}
                                disabled={isSaving}
                                className={cn(
                                  "w-full flex items-start gap-3 p-2 rounded-lg text-left transition-all",
                                  "hover:bg-muted/50 disabled:opacity-50",
                                  isCompleted && "bg-green-500/10"
                                )}
                              >
                                {isCompleted ? (
                                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                                ) : (
                                  <Circle className={cn(
                                    "h-5 w-5 mt-0.5 flex-shrink-0",
                                    isCurrent || isPast ? "text-amber-500" : "text-muted-foreground"
                                  )} />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className={cn(
                                      "font-medium text-sm",
                                      isCompleted && "line-through text-muted-foreground"
                                    )}>
                                      {task.title}
                                    </p>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                      {format(taskDueDate, 'MMM d')}
                                    </span>
                                  </div>
                                  {task.description && (
                                    <p className="text-xs text-muted-foreground">
                                      {task.description}
                                    </p>
                                  )}
                                  {task.completedAt && (
                                    <p className="text-xs text-green-600 mt-1">
                                      Done {format(new Date(task.completedAt), 'MMM d')}
                                    </p>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Appointment Scheduling Dialog */}
      <AppointmentSchedulingDialog
        open={schedulingTask !== null}
        onOpenChange={(open) => !open && setSchedulingTask(null)}
        task={schedulingTask}
      />
    </Card>
  );
}
