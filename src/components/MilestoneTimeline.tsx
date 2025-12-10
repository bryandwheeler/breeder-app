import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Clock, Circle } from 'lucide-react';
import { differenceInWeeks, format } from 'date-fns';
import { Milestone, DEFAULT_PUPPY_MILESTONES } from '@/types/dog';
import { cn } from '@/lib/utils';

interface MilestoneTimelineProps {
  milestones?: Milestone[];
  dateOfBirth: string;
  showAll?: boolean; // Show all milestones or just relevant ones
  compact?: boolean; // Compact view for portal
}

export function MilestoneTimeline({
  milestones = [],
  dateOfBirth,
  showAll = false,
  compact = false
}: MilestoneTimelineProps) {
  const currentWeek = differenceInWeeks(new Date(), new Date(dateOfBirth));

  const timelineData = useMemo(() => {
    // Merge default milestones with any completed ones
    return DEFAULT_PUPPY_MILESTONES.map((defaultMilestone, index) => {
      const completed = milestones.find(m => m.name === defaultMilestone.name);
      return {
        id: completed?.id || `default-${index}`,
        name: defaultMilestone.name,
        description: defaultMilestone.description,
        expectedWeek: defaultMilestone.expectedWeek,
        completedDate: completed?.completedDate,
        notes: completed?.notes,
        status: completed?.completedDate
          ? 'completed'
          : currentWeek >= defaultMilestone.expectedWeek
            ? 'due'
            : 'upcoming'
      };
    });
  }, [milestones, currentWeek]);

  const filteredData = showAll
    ? timelineData
    : timelineData.filter(m => m.status !== 'upcoming' || m.expectedWeek <= currentWeek + 2);

  const completedCount = timelineData.filter(m => m.status === 'completed').length;
  const progress = Math.round((completedCount / timelineData.length) * 100);

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" /> Development Milestones
            </CardTitle>
            <Badge variant="outline">{progress}% Complete</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Progress bar */}
          <div className="w-full bg-muted rounded-full h-2 mb-4">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Current age */}
          <p className="text-sm text-muted-foreground mb-4">
            Current age: <span className="font-semibold">{currentWeek} weeks</span>
          </p>

          {/* Timeline */}
          <div className="space-y-3">
            {filteredData.map((milestone) => (
              <div
                key={milestone.id}
                className={cn(
                  "flex items-start gap-3 p-2 rounded-lg",
                  milestone.status === 'completed' && "bg-green-500/10",
                  milestone.status === 'due' && "bg-yellow-500/10",
                  milestone.status === 'upcoming' && "bg-muted/50"
                )}
              >
                <div className="mt-0.5">
                  {milestone.status === 'completed' ? (
                    <Check className="h-5 w-5 text-green-500" />
                  ) : milestone.status === 'due' ? (
                    <Clock className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn(
                      "font-medium text-sm",
                      milestone.status === 'completed' && "text-green-700 dark:text-green-400"
                    )}>
                      {milestone.name}
                    </p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      Week {milestone.expectedWeek}
                    </span>
                  </div>
                  {milestone.completedDate && (
                    <p className="text-xs text-muted-foreground">
                      Completed {format(new Date(milestone.completedDate), 'MMM d, yyyy')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full view for breeder management
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" /> Puppy Development Milestones
          </CardTitle>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {completedCount} of {timelineData.length} completed
            </span>
            <Badge variant={progress === 100 ? 'default' : 'outline'}>
              {progress}%
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Progress bar */}
        <div className="w-full bg-muted rounded-full h-3 mb-6">
          <div
            className="bg-primary h-3 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Current week indicator */}
        <div className="flex items-center gap-2 mb-6 p-3 bg-muted rounded-lg">
          <Clock className="h-5 w-5 text-primary" />
          <span>Current age: <strong>{currentWeek} weeks old</strong></span>
          <span className="text-muted-foreground">
            (Born {format(new Date(dateOfBirth), 'MMMM d, yyyy')})
          </span>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

          <div className="space-y-4">
            {timelineData.map((milestone) => (
              <div key={milestone.id} className="relative flex items-start gap-4 pl-10">
                {/* Timeline dot */}
                <div className={cn(
                  "absolute left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center",
                  milestone.status === 'completed' && "bg-green-500 border-green-500",
                  milestone.status === 'due' && "bg-yellow-500 border-yellow-500",
                  milestone.status === 'upcoming' && "bg-background border-muted-foreground"
                )}>
                  {milestone.status === 'completed' && (
                    <Check className="h-3 w-3 text-white" />
                  )}
                </div>

                {/* Content */}
                <div className={cn(
                  "flex-1 p-4 rounded-lg border",
                  milestone.status === 'completed' && "bg-green-500/5 border-green-500/30",
                  milestone.status === 'due' && "bg-yellow-500/5 border-yellow-500/30",
                  milestone.status === 'upcoming' && "bg-muted/30"
                )}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className={cn(
                        "font-semibold",
                        milestone.status === 'completed' && "text-green-700 dark:text-green-400",
                        milestone.status === 'due' && "text-yellow-700 dark:text-yellow-400"
                      )}>
                        {milestone.name}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {milestone.description}
                      </p>
                    </div>
                    <Badge variant="outline" className="whitespace-nowrap">
                      Week {milestone.expectedWeek}
                    </Badge>
                  </div>

                  {milestone.completedDate && (
                    <p className="text-sm mt-2 text-green-600 dark:text-green-400">
                      ✓ Completed on {format(new Date(milestone.completedDate), 'MMMM d, yyyy')}
                    </p>
                  )}

                  {milestone.notes && (
                    <p className="text-sm mt-2 text-muted-foreground italic">
                      Note: {milestone.notes}
                    </p>
                  )}

                  {milestone.status === 'due' && !milestone.completedDate && (
                    <p className="text-sm mt-2 text-yellow-600 dark:text-yellow-400">
                      ⏳ Due now (Week {currentWeek})
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
