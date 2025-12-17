import { Customer } from '@/types/dog';
import { getCustomerJourney, CustomerJourney, JourneyStage } from '@/lib/customerAnalytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MessageSquare, FileText, CheckCircle, DollarSign, FileSignature, Heart, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomerJourneyVisualizationProps {
  customer: Customer;
}

const stageIcons = {
  MessageSquare,
  FileText,
  CheckCircle,
  DollarSign,
  FileSignature,
  Heart,
};

const stageColors = {
  blue: 'bg-blue-500 text-white border-blue-600',
  purple: 'bg-purple-500 text-white border-purple-600',
  green: 'bg-green-500 text-white border-green-600',
  emerald: 'bg-emerald-500 text-white border-emerald-600',
  indigo: 'bg-indigo-500 text-white border-indigo-600',
  pink: 'bg-pink-500 text-white border-pink-600',
};

const stageTextColors = {
  blue: 'text-blue-700 bg-blue-50',
  purple: 'text-purple-700 bg-purple-50',
  green: 'text-green-700 bg-green-50',
  emerald: 'text-emerald-700 bg-emerald-50',
  indigo: 'text-indigo-700 bg-indigo-50',
  pink: 'text-pink-700 bg-pink-50',
};

export function CustomerJourneyVisualization({ customer }: CustomerJourneyVisualizationProps) {
  const journey: CustomerJourney = getCustomerJourney(customer);

  const getStageIcon = (iconName: string) => {
    const Icon = stageIcons[iconName as keyof typeof stageIcons];
    return Icon || MessageSquare;
  };

  const getStageColorClass = (color: string) => {
    return stageColors[color as keyof typeof stageColors] || stageColors.blue;
  };

  const getStageTextColorClass = (color: string) => {
    return stageTextColors[color as keyof typeof stageTextColors] || stageTextColors.blue;
  };

  return (
    <div className="space-y-6">
      {/* Journey Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Customer Journey</CardTitle>
              <CardDescription>{customer.name}</CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{Math.round(journey.completionPercentage)}%</div>
              <div className="text-sm text-muted-foreground">Complete</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Progress Bar */}
            <div>
              <Progress value={journey.completionPercentage} className="h-3" />
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{journey.durationDays} days in journey</span>
              </div>
            </div>

            {/* Journey Stages */}
            <div className="relative">
              {/* Connecting Line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

              {/* Stages */}
              <div className="space-y-4 relative">
                {journey.stages.map((stage: JourneyStage, index: number) => {
                  const Icon = getStageIcon(stage.icon);
                  const isCompleted = stage.status === 'completed';
                  const isCurrent = stage.status === 'current';
                  const isPending = stage.status === 'pending';

                  return (
                    <div key={index} className="flex items-start gap-4 relative">
                      {/* Icon */}
                      <div
                        className={cn(
                          'relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all',
                          isCompleted && getStageColorClass(stage.color),
                          isCurrent && 'bg-white border-primary ring-4 ring-primary/20',
                          isPending && 'bg-muted border-muted-foreground/30'
                        )}
                      >
                        <Icon
                          className={cn(
                            'h-5 w-5',
                            isCompleted && 'text-white',
                            isCurrent && 'text-primary',
                            isPending && 'text-muted-foreground'
                          )}
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{stage.label}</h4>
                          {isCompleted && (
                            <Badge variant="secondary" className={getStageTextColorClass(stage.color)}>
                              Completed
                            </Badge>
                          )}
                          {isCurrent && (
                            <Badge variant="default">Current Stage</Badge>
                          )}
                        </div>
                        {stage.date && (
                          <p className="text-sm text-muted-foreground">
                            {new Date(stage.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Events */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
          <CardDescription>Chronological history of customer interactions</CardDescription>
        </CardHeader>
        <CardContent>
          {journey.timeline.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No timeline events recorded yet
            </p>
          ) : (
            <div className="space-y-4">
              {journey.timeline.map((event, index) => (
                <div key={index} className="flex gap-4 pb-4 border-b last:border-0">
                  <div className="text-sm text-muted-foreground min-w-[100px]">
                    {new Date(event.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">{event.title}</h4>
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {Object.entries(event.metadata).map(([key, value]) => (
                          <span key={key} className="mr-3">
                            {key}: {value}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
