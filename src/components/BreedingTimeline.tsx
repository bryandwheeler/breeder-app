import { useMemo } from 'react';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, differenceInDays, isSameDay } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface TimelineEvent {
  id: string;
  type: 'heat' | 'pregnancy' | 'estimated_heat';
  startDate: Date;
  endDate: Date;
  label?: string;
}

interface DogTimeline {
  dogId: string;
  dogName: string;
  events: TimelineEvent[];
}

interface BreedingTimelineProps {
  dogTimelines: DogTimeline[];
  startDate: Date;
  endDate: Date;
}

export function BreedingTimeline({ dogTimelines, startDate, endDate }: BreedingTimelineProps) {
  // Calculate the total days in the timeline
  const totalDays = differenceInDays(endDate, startDate);
  const months = useMemo(() => {
    const result: { start: Date; end: Date; label: string; days: number }[] = [];
    let currentDate = startOfMonth(startDate);

    while (currentDate <= endDate) {
      const monthEnd = endOfMonth(currentDate);
      const displayEnd = monthEnd > endDate ? endDate : monthEnd;
      const displayStart = currentDate < startDate ? startDate : currentDate;
      const daysInMonth = differenceInDays(displayEnd, displayStart) + 1;

      result.push({
        start: displayStart,
        end: displayEnd,
        label: format(currentDate, 'MMM'),
        days: daysInMonth
      });

      currentDate = addDays(monthEnd, 1);
    }

    return result;
  }, [startDate, endDate]);

  // Function to calculate the position and width of an event on the timeline
  const getEventStyle = (event: TimelineEvent) => {
    const eventStart = event.startDate < startDate ? startDate : event.startDate;
    const eventEnd = event.endDate > endDate ? endDate : event.endDate;

    const startOffset = differenceInDays(eventStart, startDate);
    const duration = differenceInDays(eventEnd, eventStart) + 1;

    const left = (startOffset / totalDays) * 100;
    const width = (duration / totalDays) * 100;

    return {
      left: `${left}%`,
      width: `${width}%`
    };
  };

  // Get color class for event type
  const getEventColor = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'heat':
        return 'bg-green-500';
      case 'estimated_heat':
        return 'bg-green-500/40 border-2 border-green-500 border-dashed';
      case 'pregnancy':
        return 'bg-pink-500';
      default:
        return 'bg-gray-400';
    }
  };

  if (dogTimelines.length === 0) {
    return (
      <Card>
        <CardContent className='py-12 text-center text-muted-foreground'>
          No breeding females to display. Make sure you have females with breedingStatus set to "active_breeder" or "proven_breeder".
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Breeding Timeline</CardTitle>
        <p className='text-sm text-muted-foreground mt-1'>
          Visual timeline showing heat cycles (green), estimated heats (dotted green), and pregnancies (pink) for each breeding female.
        </p>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {/* Legend */}
          <div className='flex gap-4 items-center text-sm pb-2 border-b'>
            <div className='flex items-center gap-2'>
              <div className='w-4 h-4 bg-green-500 rounded'></div>
              <span>Heat Cycle</span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='w-4 h-4 bg-green-500/40 border-2 border-green-500 border-dashed rounded'></div>
              <span>Estimated Heat</span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='w-4 h-4 bg-pink-500 rounded'></div>
              <span>Pregnancy</span>
            </div>
          </div>

          {/* Timeline Header - Month labels */}
          <div className='flex border-b sticky top-0 bg-background z-10'>
            <div className='w-32 flex-shrink-0 p-2'></div>
            <div className='flex-1 flex'>
              {months.map((month, idx) => (
                <div
                  key={idx}
                  style={{ width: `${(month.days / totalDays) * 100}%` }}
                  className='border-l text-center py-2 text-xs font-medium'
                >
                  {month.label}
                  <div className='text-xs text-muted-foreground font-normal'>
                    '{format(month.start, 'yy')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline Rows - One per dog */}
          {dogTimelines.map((dogTimeline) => (
            <div key={dogTimeline.dogId} className='flex items-center'>
              {/* Dog Name */}
              <div className='w-32 flex-shrink-0 pr-4'>
                <Link
                  to={`/dogs/${dogTimeline.dogId}`}
                  className='flex items-center gap-1 text-sm font-medium hover:text-primary hover:underline'
                >
                  {dogTimeline.dogName}
                  <ExternalLink className='h-3 w-3' />
                </Link>
              </div>

              {/* Timeline Track */}
              <div className='flex-1 relative h-12 border rounded-sm bg-muted/20'>
                {/* Grid lines for months */}
                <div className='absolute inset-0 flex'>
                  {months.map((month, idx) => (
                    <div
                      key={idx}
                      style={{ width: `${(month.days / totalDays) * 100}%` }}
                      className='border-l border-border/50'
                    />
                  ))}
                </div>

                {/* Events */}
                {dogTimeline.events.map((event) => {
                  const style = getEventStyle(event);
                  const colorClass = getEventColor(event.type);

                  return (
                    <div
                      key={event.id}
                      className={`absolute top-1/2 -translate-y-1/2 h-8 ${colorClass} rounded-sm flex items-center justify-center text-xs text-white font-medium overflow-hidden px-1`}
                      style={style}
                      title={`${event.type}: ${format(event.startDate, 'MMM d')} - ${format(event.endDate, 'MMM d')}`}
                    >
                      {event.label && (
                        <span className='truncate'>{event.label}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className='mt-6 text-xs text-muted-foreground space-y-1'>
          <p><strong>How to read this timeline:</strong></p>
          <p>• Each row represents a breeding female</p>
          <p>• Green bars show actual or estimated heat cycles</p>
          <p>• Dotted green bars indicate estimated heat cycles (no history)</p>
          <p>• Pink bars show planned pregnancies (based on forecasted matings)</p>
          <p>• Click on a dog's name to view their profile</p>
        </div>
      </CardContent>
    </Card>
  );
}
