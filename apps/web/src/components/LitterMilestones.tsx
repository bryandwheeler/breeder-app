import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Circle, CheckCircle2 } from 'lucide-react';
import { differenceInWeeks, format } from 'date-fns';
import { Litter, Milestone, DEFAULT_PUPPY_MILESTONES } from '@breeder/types';
import { cn } from '@/lib/utils';

interface LitterMilestonesProps {
  litter: Litter;
  onUpdate: (litterId: string, updates: Partial<Litter>) => Promise<void>;
}

export function LitterMilestones({ litter, onUpdate }: LitterMilestonesProps) {
  const [saving, setSaving] = useState<string | null>(null);

  const currentWeek = differenceInWeeks(new Date(), new Date(litter.dateOfBirth));
  const milestones = litter.milestones || [];

  const timelineData = DEFAULT_PUPPY_MILESTONES.map((defaultMilestone, index) => {
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

  const completedCount = timelineData.filter(m => m.status === 'completed').length;
  const progress = Math.round((completedCount / timelineData.length) * 100);

  const handleToggleMilestone = async (milestone: typeof timelineData[0]) => {
    setSaving(milestone.name);

    try {
      let updatedMilestones: Milestone[];

      if (milestone.completedDate) {
        // Remove completion
        updatedMilestones = milestones.filter(m => m.name !== milestone.name);
      } else {
        // Mark as completed
        const newMilestone: Milestone = {
          id: crypto.randomUUID(),
          name: milestone.name,
          description: milestone.description,
          expectedWeek: milestone.expectedWeek,
          completedDate: new Date().toISOString(),
        };
        updatedMilestones = [...milestones, newMilestone];
      }

      await onUpdate(litter.id, { milestones: updatedMilestones });
    } finally {
      setSaving(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" /> Litter Development Milestones
          </CardTitle>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              Week {currentWeek}
            </span>
            <Badge variant={progress === 100 ? 'default' : 'outline'}>
              {progress}% Complete
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

        {/* Milestones grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {timelineData.map((milestone) => (
            <button
              key={milestone.name}
              onClick={() => handleToggleMilestone(milestone)}
              disabled={saving === milestone.name}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg border text-left transition-all",
                "hover:border-primary/50 disabled:opacity-50",
                milestone.status === 'completed' && "bg-green-500/10 border-green-500/30",
                milestone.status === 'due' && "bg-yellow-500/10 border-yellow-500/30",
                milestone.status === 'upcoming' && "bg-muted/30"
              )}
            >
              <div className="mt-0.5">
                {milestone.status === 'completed' ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : milestone.status === 'due' ? (
                  <Circle className="h-5 w-5 text-yellow-500" />
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
                  <Badge variant="outline" className="text-xs">
                    Wk {milestone.expectedWeek}
                  </Badge>
                </div>
                {milestone.completedDate && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(milestone.completedDate), 'MMM d')}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>

        <p className="text-xs text-muted-foreground mt-4 text-center">
          Click a milestone to toggle completion
        </p>
      </CardContent>
    </Card>
  );
}
