import { useDogStore } from '@/store/dogStoreFirebase';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Heart, Baby, Download, Settings } from 'lucide-react';
import { format, addDays, isSameMonth, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameDay } from 'date-fns';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { downloadICalFile } from '@/lib/icalExport';
import { ReminderSettingsDialog } from '@/components/ReminderSettingsDialog';

interface CalendarEvent {
  date: Date;
  type: 'heat' | 'expectedHeat' | 'breeding' | 'dueDate' | 'pickup';
  title: string;
  dogId: string;
  dogName: string;
  details?: string;
}

export function Calendar() {
  const { dogs, litters } = useDogStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [settingsOpen, setSettingsOpen] = useState(false);

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
      default: return 'bg-gray-500';
    }
  };

  const prevMonth = () => setCurrentMonth(prev => addDays(startOfMonth(prev), -1));
  const nextMonth = () => setCurrentMonth(prev => addDays(endOfMonth(prev), 1));

  // Upcoming events (next 30 days)
  const today = new Date();
  const upcomingEvents = events
    .filter(e => e.date >= today && e.date <= addDays(today, 30))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <div className='space-y-8'>
      <div className='flex justify-between items-center'>
        <h1 className='text-4xl font-bold flex items-center gap-3'>
          <CalendarIcon className='h-10 w-10' /> Breeding Calendar
        </h1>
        <div className='flex gap-2'>
          <Button variant='outline' onClick={() => downloadICalFile(dogs, litters)}>
            <Download className='mr-2 h-4 w-4' /> Export to Calendar
          </Button>
          <Button variant='outline' onClick={() => setSettingsOpen(true)}>
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
              <Button variant='outline' size='sm' onClick={prevMonth}>
                <ChevronLeft className='h-4 w-4' />
              </Button>
              <CardTitle>{format(currentMonth, 'MMMM yyyy')}</CardTitle>
              <Button variant='outline' size='sm' onClick={nextMonth}>
                <ChevronRight className='h-4 w-4' />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
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
                        <div
                          key={i}
                          className={`text-xs px-1 py-0.5 rounded text-white truncate ${getEventColor(event.type)}`}
                          title={`${event.dogName}: ${event.title}`}
                        >
                          {event.dogName.split(' ')[0]}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className='text-xs text-muted-foreground'>+{dayEvents.length - 3} more</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <p className='text-muted-foreground'>No upcoming events</p>
            ) : (
              <div className='space-y-3'>
                {upcomingEvents.map((event, i) => (
                  <Link key={i} to={`/dogs/${event.dogId}`} className='block'>
                    <div className='p-3 border rounded-lg hover:bg-muted/50 transition'>
                      <div className='flex items-center gap-2'>
                        <div className={`w-3 h-3 rounded-full ${getEventColor(event.type)}`} />
                        <span className='font-medium'>{event.title}</span>
                      </div>
                      <div className='text-sm text-muted-foreground mt-1'>
                        {event.dogName} - {format(event.date, 'PPP')}
                      </div>
                      {event.details && (
                        <div className='text-xs text-muted-foreground'>{event.details}</div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
