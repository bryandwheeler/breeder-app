import { useDogStore } from '@breeder/firebase';
import { useStudJobStore } from '@/store/studJobStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Heart, Baby, Download, Settings, Briefcase, Grid3x3, CalendarDays, X, ExternalLink, Edit, Dog, Stethoscope } from 'lucide-react';
import { format, addDays, isSameMonth, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameDay, startOfYear, addMonths } from 'date-fns';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { downloadICalFile } from '@/lib/icalExport';
import { ReminderSettingsDialog } from '@/components/ReminderSettingsDialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface CalendarEvent {
  date: Date;
  type: 'heat' | 'expectedHeat' | 'breeding' | 'dueDate' | 'pickup' | 'studJob' | 'studJobBreeding' | 'pregnancyCheck' | 'litterSizeCheck';
  title: string;
  dogId: string;
  dogName: string;
  details?: string;
  studJobId?: string;
  litterId?: string;
  heatCycleId?: string;
  status?: string;
}

// Event Detail Popup Component
function EventDetailPopup({
  event,
  position,
  onClose,
  onNavigate,
}: {
  event: CalendarEvent;
  position: { x: number; y: number };
  onClose: () => void;
  onNavigate: (path: string) => void;
}) {
  const popupRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState({ left: 0, top: 0 });

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Adjust position to keep popup in viewport
  useEffect(() => {
    const popupWidth = 320; // w-80 = 20rem = 320px
    const popupHeight = popupRef.current?.offsetHeight || 400;
    const padding = 16; // Keep some padding from edges

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = position.x;
    let top = position.y;

    // Check if popup would go off the right edge
    if (left + popupWidth + padding > viewportWidth) {
      // Position to the left of the click point
      left = Math.max(padding, position.x - popupWidth - 10);
    }

    // Check if popup would go off the bottom edge
    if (top + popupHeight + padding > viewportHeight) {
      // Position above the click point if there's room, otherwise align to bottom
      if (position.y - popupHeight - 10 > padding) {
        top = position.y - popupHeight - 10;
      } else {
        top = Math.max(padding, viewportHeight - popupHeight - padding);
      }
    }

    // Ensure we don't go off the left edge
    left = Math.max(padding, left);

    // Ensure we don't go off the top edge
    top = Math.max(padding, top);

    setAdjustedPosition({ left, top });
  }, [position]);

  const getEventIcon = () => {
    switch (event.type) {
      case 'heat':
      case 'expectedHeat':
        return <Heart className="h-5 w-5 text-pink-500" />;
      case 'breeding':
      case 'studJob':
      case 'studJobBreeding':
        return <Heart className="h-5 w-5 text-purple-500" />;
      case 'dueDate':
        return <Baby className="h-5 w-5 text-blue-500" />;
      case 'pickup':
        return <Baby className="h-5 w-5 text-green-500" />;
      case 'pregnancyCheck':
      case 'litterSizeCheck':
        return <Stethoscope className="h-5 w-5 text-cyan-500" />;
      default:
        return <CalendarIcon className="h-5 w-5" />;
    }
  };

  const getEventColor = () => {
    switch (event.type) {
      case 'heat': return 'bg-pink-500';
      case 'expectedHeat': return 'bg-pink-300';
      case 'breeding': return 'bg-purple-500';
      case 'dueDate': return 'bg-blue-500';
      case 'pickup': return 'bg-green-500';
      case 'studJob':
      case 'studJobBreeding': return 'bg-amber-500';
      case 'pregnancyCheck': return 'bg-cyan-500';
      case 'litterSizeCheck': return 'bg-teal-500';
      default: return 'bg-gray-500';
    }
  };

  const getActions = () => {
    const actions: { label: string; icon: React.ReactNode; path: string }[] = [];

    // Always add view dog profile
    actions.push({
      label: 'View Dog Profile',
      icon: <Dog className="h-4 w-4" />,
      path: `/dogs/${event.dogId}`,
    });

    // Add specific actions based on event type
    if (event.studJobId) {
      actions.push({
        label: 'View/Edit Stud Job',
        icon: <Edit className="h-4 w-4" />,
        path: `/stud-jobs?edit=${event.studJobId}`,
      });
    }

    if (event.litterId) {
      actions.push({
        label: 'View Litter',
        icon: <Baby className="h-4 w-4" />,
        path: `/litters/${event.litterId}`,
      });
    }

    if (event.type === 'heat' || event.type === 'expectedHeat' || event.type === 'breeding') {
      actions.push({
        label: 'View Heat Cycles',
        icon: <Heart className="h-4 w-4" />,
        path: `/dogs/${event.dogId}?tab=health`,
      });
    }

    return actions;
  };

  return (
    <div
      ref={popupRef}
      className="fixed z-50 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 w-80 overflow-hidden"
      style={{ left: adjustedPosition.left, top: adjustedPosition.top }}
    >
      {/* Header */}
      <div className={`${getEventColor()} px-4 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-2 text-white">
          {getEventIcon()}
          <span className="font-semibold">{event.title}</span>
        </div>
        <button
          onClick={onClose}
          className="text-white/80 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <div className="text-sm text-muted-foreground">Date</div>
          <div className="font-medium">{format(event.date, 'EEEE, MMMM d, yyyy')}</div>
        </div>

        <div>
          <div className="text-sm text-muted-foreground">Dog</div>
          <div className="font-medium">{event.dogName}</div>
        </div>

        {event.details && (
          <div>
            <div className="text-sm text-muted-foreground">Details</div>
            <div className="font-medium">{event.details}</div>
          </div>
        )}

        {event.status && (
          <div>
            <div className="text-sm text-muted-foreground">Status</div>
            <Badge variant="outline" className="capitalize">{event.status.replace(/_/g, ' ')}</Badge>
          </div>
        )}

        {/* Actions */}
        <div className="pt-2 border-t space-y-2">
          {getActions().map((action, i) => (
            <Button
              key={i}
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={() => {
                onNavigate(action.path);
                onClose();
              }}
            >
              {action.icon}
              {action.label}
              <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Calendar() {
  const { dogs, litters } = useDogStore();
  const { getAllStudJobs } = useStudJobStore();
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');
  const [selectedEvent, setSelectedEvent] = useState<{ event: CalendarEvent; position: { x: number; y: number } } | null>(null);

  const studJobs = getAllStudJobs();

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEvent({
      event,
      position: { x: e.clientX, y: e.clientY },
    });
  };

  // Collect all calendar events
  const events: CalendarEvent[] = [];

  // Heat cycles and expected heats
  dogs.filter(d => d.sex === 'female').forEach(dog => {
    const cycles = dog.heatCycles || [];
    cycles.forEach(hc => {
      events.push({
        date: new Date(hc.startDate),
        type: 'heat',
        title: 'Heat Started',
        dogId: dog.id,
        dogName: dog.name,
        details: hc.bred ? 'Bred' : undefined,
      });
      if (hc.breedingDates) {
        hc.breedingDates.forEach(bd => {
          events.push({
            date: new Date(bd),
            type: 'breeding',
            title: 'Breeding',
            dogId: dog.id,
            dogName: dog.name,
          });
        });
      }
    });

    // Expected next heat (6 months from last)
    if (cycles.length > 0) {
      const lastHeat = cycles.sort((a, b) =>
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      )[0];
      const expectedNext = addDays(new Date(lastHeat.startDate), 180);
      events.push({
        date: expectedNext,
        type: 'expectedHeat',
        title: 'Expected Heat',
        dogId: dog.id,
        dogName: dog.name,
      });
    }
  });

  // Litter events
  litters.forEach(litter => {
    const dam = dogs.find(d => d.id === litter.damId);
    if (!dam) return;

    // Due date (63 days from breeding) if pregnant
    if (litter.status === 'pregnant' && litter.expectedDateOfBirth) {
      events.push({
        date: new Date(litter.expectedDateOfBirth),
        type: 'dueDate',
        title: 'Expected Due Date',
        dogId: dam.id,
        dogName: dam.name,
        details: litter.litterName,
        litterId: litter.id,
      });
    }

    // Pickup ready date
    if (litter.pickupReadyDate) {
      events.push({
        date: new Date(litter.pickupReadyDate),
        type: 'pickup',
        title: 'Puppies Ready',
        dogId: dam.id,
        dogName: dam.name,
        details: litter.litterName,
        litterId: litter.id,
      });
    }
  });

  // Stud job events - show each individual breeding
  studJobs.forEach(job => {
    const stud = dogs.find(d => d.id === job.studId);
    if (!stud) return;

    // Add each breeding date as a calendar event
    if (job.breedings && job.breedings.length > 0) {
      job.breedings.forEach((breeding, index) => {
        if (!breeding.date) return;

        const breedingDate = new Date(breeding.date);
        const breedingStatus = breeding.status === 'completed' ? ' (Done)' :
                               breeding.status === 'scheduled' ? ' (Scheduled)' :
                               breeding.status === 'cancelled' ? ' (Cancelled)' : '';

        events.push({
          date: breedingDate,
          type: 'studJobBreeding',
          title: `Stud Breeding #${index + 1}${breedingStatus}`,
          dogId: stud.id,
          dogName: stud.name,
          details: `${job.femaleDogName} - ${breeding.method === 'natural' ? 'Natural' : breeding.method === 'ai' ? 'AI' : 'Surgical AI'}`,
          studJobId: job.id,
          status: breeding.status,
        });

        // Add 30-day pregnancy confirmation follow-up for completed breedings
        if (breeding.status === 'completed') {
          const pregnancyCheckDate = addDays(breedingDate, 30);
          events.push({
            date: pregnancyCheckDate,
            type: 'pregnancyCheck',
            title: 'Pregnancy Confirmation',
            dogId: stud.id,
            dogName: stud.name,
            details: `${job.femaleDogName} - 30 days post-breeding`,
            studJobId: job.id,
          });

          // Add 65-day litter size confirmation follow-up
          const litterCheckDate = addDays(breedingDate, 65);
          events.push({
            date: litterCheckDate,
            type: 'litterSizeCheck',
            title: 'Litter Size Confirmation',
            dogId: stud.id,
            dogName: stud.name,
            details: `${job.femaleDogName} - 65 days post-breeding`,
            studJobId: job.id,
          });
        }
      });
    } else if (job.scheduledDate) {
      // Fallback for jobs without individual breedings
      events.push({
        date: new Date(job.scheduledDate),
        type: 'studJob',
        title: `Stud Service${job.status === 'pending' ? ' (Pending)' : job.status === 'confirmed' ? ' (Confirmed)' : ''}`,
        dogId: stud.id,
        dogName: stud.name,
        details: `${job.femaleDogName}`,
        studJobId: job.id,
        status: job.status,
      });
    }
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getEventsForDay = (day: Date) =>
    events.filter(e => isSameDay(e.date, day));

  const getEventColor = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'heat': return 'bg-pink-500';
      case 'expectedHeat': return 'bg-pink-300';
      case 'breeding': return 'bg-purple-500';
      case 'dueDate': return 'bg-blue-500';
      case 'pickup': return 'bg-green-500';
      case 'studJob': return 'bg-amber-500';
      case 'studJobBreeding': return 'bg-amber-500';
      case 'pregnancyCheck': return 'bg-cyan-500';
      case 'litterSizeCheck': return 'bg-teal-500';
      default: return 'bg-gray-500';
    }
  };

  const prevMonth = () => setCurrentMonth(prev => addDays(startOfMonth(prev), -1));
  const nextMonth = () => setCurrentMonth(prev => addDays(endOfMonth(prev), 1));
  const prevYear = () => setCurrentMonth(prev => addMonths(prev, -12));
  const nextYear = () => setCurrentMonth(prev => addMonths(prev, 12));

  // Events for the currently viewed month
  const monthEvents = events
    .filter(e => e.date >= monthStart && e.date <= monthEnd)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  // Events for the year
  const yearStart = startOfYear(currentMonth);
  const yearEnd = endOfMonth(addMonths(yearStart, 11));
  const yearEvents = events
    .filter(e => e.date >= yearStart && e.date <= yearEnd)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  // Also show upcoming events for next 30 days if viewing current month
  const today = new Date();
  const isCurrentMonth = isSameMonth(currentMonth, today);
  const upcomingEvents = isCurrentMonth
    ? events
        .filter(e => e.date >= today && e.date <= addDays(today, 30))
        .sort((a, b) => a.date.getTime() - b.date.getTime())
    : [];

  return (
    <div className='space-y-8'>
      <div className='flex justify-between items-center flex-wrap gap-4'>
        <h1 className='text-4xl font-bold flex items-center gap-3'>
          <CalendarIcon className='h-10 w-10' /> Breeding Calendar
        </h1>
        <div className='flex gap-2 items-center'>
          <ToggleGroup type='single' value={viewMode} onValueChange={(v) => v && setViewMode(v as 'month' | 'year')}>
            <ToggleGroupItem value='month' aria-label='Month view'>
              <CalendarDays className='h-4 w-4 mr-2' />
              Month
            </ToggleGroupItem>
            <ToggleGroupItem value='year' aria-label='Year view'>
              <Grid3x3 className='h-4 w-4 mr-2' />
              Year
            </ToggleGroupItem>
          </ToggleGroup>
          <Button variant='outline' onClick={() => downloadICalFile(dogs, litters)}>
            <Download className='mr-2 h-4 w-4' /> Export
          </Button>
          <Button variant='outline' size='icon' onClick={() => setSettingsOpen(true)}>
            <Settings className='h-4 w-4' />
          </Button>
        </div>
      </div>

      <ReminderSettingsDialog open={settingsOpen} setOpen={setSettingsOpen} />

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Calendar */}
        <Card className='lg:col-span-2'>
          <CardHeader>
            <div className='flex justify-between items-center'>
              <Button variant='outline' size='sm' onClick={viewMode === 'month' ? prevMonth : prevYear}>
                <ChevronLeft className='h-4 w-4' />
              </Button>
              <CardTitle>
                {viewMode === 'month' ? format(currentMonth, 'MMMM yyyy') : format(currentMonth, 'yyyy')}
              </CardTitle>
              <Button variant='outline' size='sm' onClick={viewMode === 'month' ? nextMonth : nextYear}>
                <ChevronRight className='h-4 w-4' />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {viewMode === 'month' ? (
              /* Month View */
              <div className='grid grid-cols-7 gap-1'>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className='text-center text-sm font-medium text-muted-foreground py-2'>
                    {day}
                  </div>
                ))}
                {/* Empty cells for days before month starts */}
                {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                  <div key={`empty-${i}`} className='h-24 border rounded-md bg-muted/30' />
                ))}
                {days.map(day => {
                  const dayEvents = getEventsForDay(day);
                  return (
                    <div
                      key={day.toISOString()}
                      className={`h-24 border rounded-md p-1 overflow-hidden ${
                        isToday(day) ? 'border-primary border-2' : ''
                      } ${!isSameMonth(day, currentMonth) ? 'bg-muted/50' : ''}`}
                    >
                      <div className={`text-sm ${isToday(day) ? 'font-bold text-primary' : ''}`}>
                        {format(day, 'd')}
                      </div>
                      <div className='space-y-0.5 overflow-y-auto max-h-16'>
                        {dayEvents.slice(0, 3).map((event, i) => (
                          <button
                            key={i}
                            onClick={(e) => handleEventClick(event, e)}
                            className={`text-xs px-1 py-0.5 rounded text-white truncate ${getEventColor(event.type)} w-full text-left hover:opacity-80 cursor-pointer transition-opacity`}
                            title={`${event.dogName}: ${event.title}`}
                          >
                            {event.dogName.split(' ')[0]}
                          </button>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className='text-xs text-muted-foreground'>+{dayEvents.length - 3} more</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Year View - 12 mini calendars */
              <div className='grid grid-cols-3 md:grid-cols-4 gap-4'>
                {Array.from({ length: 12 }).map((_, monthIndex) => {
                  const month = addMonths(yearStart, monthIndex);
                  const monthStartDate = startOfMonth(month);
                  const monthEndDate = endOfMonth(month);
                  const monthDays = eachDayOfInterval({ start: monthStartDate, end: monthEndDate });

                  return (
                    <div key={monthIndex} className='border rounded-lg p-2'>
                      <div className='text-center font-semibold text-sm mb-2'>
                        {format(month, 'MMM')}
                      </div>
                      <div className='grid grid-cols-7 gap-0.5'>
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                          <div key={i} className='text-center text-[10px] text-muted-foreground'>
                            {day}
                          </div>
                        ))}
                        {Array.from({ length: monthStartDate.getDay() }).map((_, i) => (
                          <div key={`empty-${i}`} />
                        ))}
                        {monthDays.map(day => {
                          const dayEvents = getEventsForDay(day);
                          const hasEvents = dayEvents.length > 0;
                          return (
                            <div
                              key={day.toISOString()}
                              className={`text-center text-[10px] py-1 rounded ${
                                isToday(day) ? 'bg-primary text-primary-foreground font-bold' : ''
                              } ${hasEvents && !isToday(day) ? 'bg-accent' : ''}`}
                              title={hasEvents ? dayEvents.map(e => `${e.dogName}: ${e.title}`).join('\n') : ''}
                            >
                              {format(day, 'd')}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Events List */}
        <Card>
          <CardHeader>
            <CardTitle>
              {viewMode === 'year'
                ? `Events in ${format(currentMonth, 'yyyy')}`
                : isCurrentMonth
                ? 'Upcoming (30 days)'
                : `Events in ${format(currentMonth, 'MMMM')}`}
            </CardTitle>
          </CardHeader>
          <CardContent className='max-h-[600px] overflow-y-auto'>
            {/* Show year events if year view, upcoming events if current month, otherwise show month events */}
            {(() => {
              const displayEvents = viewMode === 'year' ? yearEvents : isCurrentMonth ? upcomingEvents : monthEvents;
              const emptyMessage = viewMode === 'year'
                ? 'No events this year'
                : isCurrentMonth
                ? 'No upcoming events'
                : 'No events this month';

              return displayEvents.length === 0 ? (
                <p className='text-muted-foreground text-center py-8'>{emptyMessage}</p>
              ) : (
                <div className='space-y-2'>
                  {displayEvents.map((event, i) => (
                    <button
                      key={i}
                      onClick={(e) => handleEventClick(event, e)}
                      className='block w-full text-left'
                    >
                      <div className='p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer'>
                        <div className='flex items-start justify-between gap-2'>
                          <div className='flex-1'>
                            <div className='flex items-center gap-2 mb-1'>
                              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${getEventColor(event.type)}`} />
                              <span className='font-semibold text-sm'>{event.title}</span>
                            </div>
                            <div className='text-sm text-muted-foreground ml-4'>
                              <div className='font-medium'>{event.dogName}</div>
                              {event.details && (
                                <div className='text-xs mt-0.5'>{event.details}</div>
                              )}
                            </div>
                          </div>
                          <div className='text-xs text-muted-foreground text-right flex-shrink-0'>
                            <div className='font-medium'>{format(event.date, 'MMM d')}</div>
                            <div>{format(event.date, 'yyyy')}</div>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      {/* Legend */}
      <Card>
        <CardContent className='py-4'>
          <div className='flex flex-wrap gap-4'>
            <div className='flex items-center gap-2'>
              <div className='w-4 h-4 rounded bg-pink-500' />
              <span className='text-sm'>Heat Started</span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='w-4 h-4 rounded bg-pink-300' />
              <span className='text-sm'>Expected Heat</span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='w-4 h-4 rounded bg-purple-500' />
              <span className='text-sm'>Breeding</span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='w-4 h-4 rounded bg-blue-500' />
              <span className='text-sm'>Due Date</span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='w-4 h-4 rounded bg-green-500' />
              <span className='text-sm'>Puppies Ready</span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='w-4 h-4 rounded bg-amber-500' />
              <span className='text-sm'>Stud Breeding</span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='w-4 h-4 rounded bg-cyan-500' />
              <span className='text-sm'>Pregnancy Check (30d)</span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='w-4 h-4 rounded bg-teal-500' />
              <span className='text-sm'>Litter Confirm (65d)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Event Detail Popup */}
      {selectedEvent && (
        <EventDetailPopup
          event={selectedEvent.event}
          position={selectedEvent.position}
          onClose={() => setSelectedEvent(null)}
          onNavigate={(path) => navigate(path)}
        />
      )}
    </div>
  );
}
