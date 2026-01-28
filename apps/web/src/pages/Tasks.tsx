import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import {
  ListTodo,
  Sunrise,
  Sun,
  Moon,
  Calendar,
  CheckCheck,
  SkipForward,
  Loader2,
} from 'lucide-react';
import {
  format,
  startOfDay,
  endOfDay,
  isBefore,
  isAfter,
  addDays,
} from 'date-fns';
import { cn } from '@/lib/utils';
import { useTaskStore } from '@breeder/firebase';
import { useDogStore } from '@breeder/firebase';
import { useAuth } from '@/contexts/AuthContext';

export function Tasks() {
  const { currentUser } = useAuth();
  const { litters } = useDogStore();
  const {
    litterTasks,
    subscribeToBreederTasks,
    updateTaskStatus,
    bulkUpdateTaskStatus,
    loading,
  } = useTaskStore();
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = subscribeToBreederTasks(currentUser.uid);
    return unsubscribe;
  }, [currentUser, subscribeToBreederTasks]);

  const littersById = useMemo(() => {
    const map = new Map<string, (typeof litters)[0]>();
    litters.forEach((litter) => {
      map.set(litter.id, litter);
    });
    return map;
  }, [litters]);

  const {
    overdueDailyTasks,
    todaysDailyTasksByTime,
    upcomingDailyTasksByDate,
    weeklyTasksByDate,
    overdueDailyCount,
    todayDailyCount,
    weeklyCount,
  } = useMemo(() => {
    const today = new Date();
    const startToday = startOfDay(today);
    const endToday = endOfDay(today);
    const weekEnd = endOfDay(addDays(startToday, 6));
    const twoWeeksEnd = endOfDay(addDays(startToday, 13));

    // Separate daily and weekly tasks
    const dailyTasks = litterTasks.filter((t) => t.taskType === 'daily');
    const weeklyTasks = litterTasks.filter((t) => t.taskType === 'weekly' || !t.taskType);

    // Daily tasks: overdue, today, and upcoming
    const overdueDailyList: typeof litterTasks = [];
    const todayDailyList: typeof litterTasks = [];
    const upcomingDailyList: typeof litterTasks = [];

    dailyTasks.forEach((task) => {
      const due = new Date(task.dueDate);
      if (isBefore(due, startToday)) {
        overdueDailyList.push(task);
      } else if (!isAfter(due, endToday)) {
        todayDailyList.push(task);
      } else if (!isAfter(due, twoWeeksEnd)) {
        upcomingDailyList.push(task);
      }
    });

    // Group today's tasks by time of day
    const timeOrder = { morning: 0, midday: 1, evening: 2 };
    const todaysByTime: { timeOfDay: 'morning' | 'midday' | 'evening'; tasks: typeof litterTasks }[] = [
      { timeOfDay: 'morning', tasks: [] },
      { timeOfDay: 'midday', tasks: [] },
      { timeOfDay: 'evening', tasks: [] },
    ];

    todayDailyList.forEach((task) => {
      const time = task.timeOfDay || 'morning';
      const index = timeOrder[time] ?? 0;
      todaysByTime[index].tasks.push(task);
    });

    // Group upcoming daily tasks by date
    const upcomingByDate = new Map<string, { label: string; tasks: typeof litterTasks }>();
    upcomingDailyList.forEach((task) => {
      const due = new Date(task.dueDate);
      const key = format(due, 'yyyy-MM-dd');
      const label = format(due, 'EEE, MMM d');
      if (!upcomingByDate.has(key)) {
        upcomingByDate.set(key, { label, tasks: [] });
      }
      upcomingByDate.get(key)!.tasks.push(task);
    });

    const upcomingDailyTasksByDate = Array.from(upcomingByDate.entries())
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([, value]) => value);

    // Weekly tasks: due this week (including today and upcoming)
    const weeklyThisWeek: typeof litterTasks = [];
    weeklyTasks.forEach((task) => {
      const due = new Date(task.dueDate);
      // Include overdue weekly tasks and tasks due within the week
      if (!isAfter(due, weekEnd)) {
        weeklyThisWeek.push(task);
      }
    });

    // Group weekly tasks by due date
    const groupedByDate = new Map<
      string,
      { label: string; tasks: typeof litterTasks; isOverdue: boolean }
    >();

    weeklyThisWeek.forEach((task) => {
      const due = new Date(task.dueDate);
      const key = format(due, 'yyyy-MM-dd');
      const isOverdue = isBefore(due, startToday);
      const label = isOverdue ? `Overdue - ${format(due, 'MMM d')}` : format(due, 'EEE MMM d');
      if (!groupedByDate.has(key)) {
        groupedByDate.set(key, { label, tasks: [], isOverdue });
      }
      groupedByDate.get(key)!.tasks.push(task);
    });

    const weeklyTasksByDate = Array.from(groupedByDate.entries())
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([, value]) => value);

    const overdueDailyCount = overdueDailyList.filter((t) => t.status === 'pending').length;
    const todayDailyCount = todayDailyList.filter((t) => t.status === 'pending').length;
    const weeklyCount = weeklyThisWeek.filter((t) => t.status === 'pending').length;

    return {
      overdueDailyTasks: overdueDailyList,
      todaysDailyTasksByTime: todaysByTime,
      upcomingDailyTasksByDate,
      weeklyTasksByDate,
      overdueDailyCount,
      todayDailyCount,
      weeklyCount,
    };
  }, [litterTasks]);

  const visibleOverdueDailyTasks = useMemo(
    () =>
      showCompletedTasks
        ? overdueDailyTasks
        : overdueDailyTasks.filter((t) => t.status === 'pending'),
    [showCompletedTasks, overdueDailyTasks]
  );

  const visibleTodaysDailyTasksByTime = useMemo(
    () =>
      todaysDailyTasksByTime
        .map((group) => ({
          ...group,
          tasks: showCompletedTasks
            ? group.tasks
            : group.tasks.filter((t) => t.status === 'pending'),
        }))
        .filter((group) => group.tasks.length > 0),
    [showCompletedTasks, todaysDailyTasksByTime]
  );

  const visibleUpcomingDailyTasksByDate = useMemo(
    () =>
      upcomingDailyTasksByDate
        .map((group) => ({
          ...group,
          tasks: showCompletedTasks
            ? group.tasks
            : group.tasks.filter((t) => t.status === 'pending'),
        }))
        .filter((group) => group.tasks.length > 0),
    [showCompletedTasks, upcomingDailyTasksByDate]
  );

  const visibleWeeklyGroups = useMemo(
    () =>
      weeklyTasksByDate
        .map((group) => {
          const tasks = showCompletedTasks
            ? group.tasks
            : group.tasks.filter((t) => t.status === 'pending');
          return { ...group, tasks };
        })
        .filter((group) => group.tasks.length > 0),
    [showCompletedTasks, weeklyTasksByDate]
  );

  if (loading && litterTasks.length === 0) {
    return (
      <div className='space-y-6'>
        <h1 className='text-2xl sm:text-3xl font-bold'>Tasks</h1>
        <div className='flex items-center justify-center py-12'>
          <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
        </div>
      </div>
    );
  }

  const renderTaskItem = (task: typeof litterTasks[0], showDate = false) => {
    const litter = littersById.get(task.litterId);
    const isCompleted = task.status === 'completed';
    const isSkipped = task.status === 'skipped';
    const taskDate = new Date(task.dueDate);

    return (
      <div
        key={task.id}
        className={cn(
          'flex items-start gap-2 rounded border p-2 text-sm',
          isSkipped && 'opacity-50'
        )}
      >
        <Checkbox
          className='h-5 w-5 flex-shrink-0 mt-0.5'
          checked={isCompleted}
          onCheckedChange={async (checked) => {
            await updateTaskStatus(
              task.id,
              checked === true ? 'completed' : 'pending'
            );
          }}
        />
        <Link
          to={`/litters/${task.litterId}`}
          className='flex-1 min-w-0'
        >
          <span className={cn(
            'block text-sm hover:underline',
            (isCompleted || isSkipped) && 'line-through text-muted-foreground'
          )}>
            {task.title}
          </span>
          <span className='text-xs text-muted-foreground'>
            {litter ? `${litter.litterName || 'Litter'}` : ''}
            {showDate && ` · ${format(taskDate, 'MMM d')}`}
            {task.timeOfDay && (
              <span className='ml-1'>
                {task.timeOfDay === 'morning' && '(AM)'}
                {task.timeOfDay === 'midday' && '(Noon)'}
                {task.timeOfDay === 'evening' && '(PM)'}
              </span>
            )}
          </span>
        </Link>
        {isSkipped && (
          <Badge variant='outline' className='text-xs flex-shrink-0'>
            Skipped
          </Badge>
        )}
      </div>
    );
  };

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <h1 className='text-2xl sm:text-3xl font-bold flex items-center gap-2'>
            <ListTodo className='h-7 w-7' />
            Tasks
          </h1>
          <p className='text-muted-foreground mt-1'>
            Manage all your litter care tasks
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <span className='text-sm text-muted-foreground'>Show completed</span>
          <Switch
            checked={showCompletedTasks}
            onCheckedChange={(value) => setShowCompletedTasks(value === true)}
          />
        </div>
      </div>

      <Tabs defaultValue='daily' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='daily' className='flex items-center gap-2'>
            <Sun className='h-4 w-4' />
            Daily Routines
            {(overdueDailyCount > 0 || todayDailyCount > 0) && (
              <Badge variant='secondary' className='ml-1'>
                {overdueDailyCount > 0 ? `${overdueDailyCount}+` : ''}{todayDailyCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value='weekly' className='flex items-center gap-2'>
            <Calendar className='h-4 w-4' />
            Weekly Milestones
            {weeklyCount > 0 && (
              <Badge variant='secondary' className='ml-1'>
                {weeklyCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Daily Tasks Tab */}
        <TabsContent value='daily' className='space-y-6'>
          {litterTasks.filter(t => t.taskType === 'daily').length === 0 ? (
            <Card>
              <CardContent className='py-12 text-center'>
                <p className='text-muted-foreground'>
                  No daily tasks found. Daily tasks will appear when you have active litters with generated care schedules.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Overdue Section */}
              {visibleOverdueDailyTasks.length > 0 && (
                <Card className='border-destructive/50'>
                  <CardHeader className='py-3'>
                    <CardTitle className='flex items-center justify-between text-base'>
                      <span className='text-destructive flex items-center gap-2'>
                        Overdue Tasks
                      </span>
                      {overdueDailyCount > 0 && (
                        <div className='flex items-center gap-1'>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant='outline'
                                size='sm'
                                className='h-7 px-2 text-xs'
                                onClick={async () => {
                                  const pendingIds = overdueDailyTasks
                                    .filter((t) => t.status === 'pending')
                                    .map((t) => t.id);
                                  if (pendingIds.length > 0) {
                                    await bulkUpdateTaskStatus(pendingIds, 'completed');
                                  }
                                }}
                              >
                                <CheckCheck className='h-3.5 w-3.5 mr-1' />
                                Complete All
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Complete all overdue tasks</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant='outline'
                                size='sm'
                                className='h-7 px-2 text-xs'
                                onClick={async () => {
                                  const pendingIds = overdueDailyTasks
                                    .filter((t) => t.status === 'pending')
                                    .map((t) => t.id);
                                  if (pendingIds.length > 0) {
                                    await bulkUpdateTaskStatus(pendingIds, 'skipped');
                                  }
                                }}
                              >
                                <SkipForward className='h-3.5 w-3.5 mr-1' />
                                Skip All
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Skip all overdue tasks</TooltipContent>
                          </Tooltip>
                        </div>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='pt-0 space-y-1.5'>
                    {visibleOverdueDailyTasks.map((task) => renderTaskItem(task, true))}
                  </CardContent>
                </Card>
              )}

              {/* Today's Tasks */}
              <Card>
                <CardHeader className='py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-t-lg'>
                  <CardTitle className='flex items-center justify-between text-base'>
                    <span className='flex items-center gap-2'>
                      <Sun className='h-4 w-4' />
                      Today - {format(new Date(), 'EEEE, MMMM d')}
                    </span>
                    <Badge variant='secondary' className='bg-white/20 text-white'>
                      {todayDailyCount} pending
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className='pt-4 space-y-4'>
                  {visibleTodaysDailyTasksByTime.length === 0 ? (
                    <p className='text-sm text-muted-foreground text-center py-4'>
                      No tasks due today.
                    </p>
                  ) : (
                    visibleTodaysDailyTasksByTime.map((group) => (
                      <div key={group.timeOfDay} className='space-y-1.5'>
                        <p className='text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5'>
                          {group.timeOfDay === 'morning' && (
                            <Sunrise className='h-3.5 w-3.5 text-amber-500' />
                          )}
                          {group.timeOfDay === 'midday' && (
                            <Sun className='h-3.5 w-3.5 text-orange-500' />
                          )}
                          {group.timeOfDay === 'evening' && (
                            <Moon className='h-3.5 w-3.5 text-indigo-500' />
                          )}
                          {group.timeOfDay === 'morning' && 'Morning'}
                          {group.timeOfDay === 'midday' && 'Midday'}
                          {group.timeOfDay === 'evening' && 'Evening'}
                        </p>
                        {group.tasks.map((task) => renderTaskItem(task))}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Upcoming Daily Tasks */}
              {visibleUpcomingDailyTasksByDate.length > 0 && (
                <Card>
                  <CardHeader className='py-3'>
                    <CardTitle className='text-base'>Upcoming Daily Tasks</CardTitle>
                  </CardHeader>
                  <CardContent className='pt-0 space-y-4'>
                    {visibleUpcomingDailyTasksByDate.map((group) => (
                      <div key={group.label} className='space-y-1.5'>
                        <p className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'>
                          {group.label}
                        </p>
                        {group.tasks.map((task) => renderTaskItem(task))}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Weekly Tasks Tab */}
        <TabsContent value='weekly' className='space-y-6'>
          {litterTasks.filter(t => t.taskType === 'weekly' || !t.taskType).length === 0 ? (
            <Card>
              <CardContent className='py-12 text-center'>
                <p className='text-muted-foreground'>
                  No weekly milestones found. Weekly tasks will appear when you have active litters with generated care schedules.
                </p>
              </CardContent>
            </Card>
          ) : visibleWeeklyGroups.length === 0 ? (
            <Card>
              <CardContent className='py-12 text-center'>
                <p className='text-muted-foreground'>
                  No pending weekly milestones this week.
                </p>
              </CardContent>
            </Card>
          ) : (
            visibleWeeklyGroups.map((group) => (
              <Card key={group.label} className={cn(group.isOverdue && 'border-destructive/50')}>
                <CardHeader className='py-3'>
                  <CardTitle className={cn(
                    'text-base',
                    group.isOverdue && 'text-destructive'
                  )}>
                    {group.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className='pt-0 space-y-1.5'>
                  {group.tasks.map((task) => renderTaskItem(task, true))}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
