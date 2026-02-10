import { useDogStore, useHeatCycleStore } from '@breeder/firebase';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, Syringe, Heart, Baby, Calendar, Stethoscope, ScanLine } from 'lucide-react';
import { format, isPast, isToday, isFuture, addDays, differenceInDays } from 'date-fns';
import { Link } from 'react-router-dom';

interface ComputedReminder {
  id: string;
  title: string;
  type: 'vaccination' | 'deworming' | 'vet_visit' | 'heat_expected' | 'due_date' | 'pickup' | 'ultrasound' | 'custom';
  date: Date;
  dogId?: string;
  dogName?: string;
  litterId?: string;
  litterName?: string;
  isOverdue: boolean;
  daysUntil: number;
}

export function Reminders() {
  const { dogs, litters } = useDogStore();
  const { breedingRecords } = useHeatCycleStore();

  // Collect all reminders from various sources
  const reminders: ComputedReminder[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Vaccination reminders (shots with due dates)
  dogs.forEach(dog => {
    dog.shotRecords?.forEach(shot => {
      if (shot.dueDate) {
        const dueDate = new Date(shot.dueDate);
        reminders.push({
          id: `shot-${dog.id}-${shot.id}`,
          title: `${shot.vaccine} due for ${dog.name}`,
          type: 'vaccination',
          date: dueDate,
          dogId: dog.id,
          dogName: dog.name,
          isOverdue: isPast(dueDate) && !isToday(dueDate),
          daysUntil: differenceInDays(dueDate, today),
        });
      }
    });
  });

  // 2. Deworming reminders
  dogs.forEach(dog => {
    dog.dewormings?.forEach(dw => {
      if (dw.nextDueDate) {
        const dueDate = new Date(dw.nextDueDate);
        reminders.push({
          id: `deworming-${dog.id}-${dw.id}`,
          title: `Deworming due for ${dog.name}`,
          type: 'deworming',
          date: dueDate,
          dogId: dog.id,
          dogName: dog.name,
          isOverdue: isPast(dueDate) && !isToday(dueDate),
          daysUntil: differenceInDays(dueDate, today),
        });
      }
    });
  });

  // 3. Vet visit follow-ups
  dogs.forEach(dog => {
    dog.vetVisits?.forEach(visit => {
      if (visit.followUpDate) {
        const followUpDate = new Date(visit.followUpDate);
        reminders.push({
          id: `vet-${dog.id}-${visit.id}`,
          title: `Vet follow-up for ${dog.name}`,
          type: 'vet_visit',
          date: followUpDate,
          dogId: dog.id,
          dogName: dog.name,
          isOverdue: isPast(followUpDate) && !isToday(followUpDate),
          daysUntil: differenceInDays(followUpDate, today),
        });
      }
    });
  });

  // 4. Expected heat cycles (6 months from last)
  dogs.filter(d => d.sex === 'female').forEach(dog => {
    const cycles = dog.heatCycles || [];
    if (cycles.length > 0) {
      const lastHeat = cycles.sort((a, b) =>
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      )[0];
      const expectedNext = addDays(new Date(lastHeat.startDate), 180);
      // Only show if within next 60 days
      if (differenceInDays(expectedNext, today) <= 60) {
        reminders.push({
          id: `heat-${dog.id}`,
          title: `Expected heat cycle for ${dog.name}`,
          type: 'heat_expected',
          date: expectedNext,
          dogId: dog.id,
          dogName: dog.name,
          isOverdue: isPast(expectedNext) && !isToday(expectedNext),
          daysUntil: differenceInDays(expectedNext, today),
        });
      }
    }
  });

  // 5. Litter due dates
  litters.forEach(litter => {
    const dam = dogs.find(d => d.id === litter.damId);
    if (litter.status === 'pregnant' && litter.expectedDateOfBirth) {
      const dueDate = new Date(litter.expectedDateOfBirth);
      reminders.push({
        id: `due-${litter.id}`,
        title: `${dam?.name || 'Litter'} due date`,
        type: 'due_date',
        date: dueDate,
        dogId: dam?.id,
        dogName: dam?.name,
        litterId: litter.id,
        litterName: litter.litterName,
        isOverdue: isPast(dueDate) && !isToday(dueDate),
        daysUntil: differenceInDays(dueDate, today),
      });
    }
  });

  // 6. Pickup ready dates
  litters.forEach(litter => {
    const dam = dogs.find(d => d.id === litter.damId);
    if (litter.pickupReadyDate && litter.status !== 'completed') {
      const pickupDate = new Date(litter.pickupReadyDate);
      reminders.push({
        id: `pickup-${litter.id}`,
        title: `Puppies ready for pickup - ${litter.litterName || dam?.name}`,
        type: 'pickup',
        date: pickupDate,
        dogId: dam?.id,
        dogName: dam?.name,
        litterId: litter.id,
        litterName: litter.litterName,
        isOverdue: isPast(pickupDate) && !isToday(pickupDate),
        daysUntil: differenceInDays(pickupDate, today),
      });
    }
  });

  // 7. Ultrasound reminders for pending breedings (28-30 days after breeding)
  breedingRecords.forEach(record => {
    // Only show for pending breedings
    if (record.status !== 'pending') return;

    const dam = dogs.find(d => d.id === record.dogId);
    const breedingDate = new Date(record.breedingDate);
    const ultrasoundDate = addDays(breedingDate, 28); // Ultrasound recommended at day 28-30

    // Only show within a reasonable window (up to 45 days after breeding)
    const daysSinceBreeding = differenceInDays(today, breedingDate);
    if (daysSinceBreeding > 45) return;

    reminders.push({
      id: `ultrasound-${record.id}`,
      title: `Ultrasound for ${dam?.name || 'breeding'} - confirm pregnancy`,
      type: 'ultrasound',
      date: ultrasoundDate,
      dogId: dam?.id,
      dogName: dam?.name,
      litterId: record.litterId,
      isOverdue: isPast(ultrasoundDate) && !isToday(ultrasoundDate),
      daysUntil: differenceInDays(ultrasoundDate, today),
    });
  });

  // Sort by date (overdue first, then upcoming)
  reminders.sort((a, b) => {
    if (a.isOverdue && !b.isOverdue) return -1;
    if (!a.isOverdue && b.isOverdue) return 1;
    return a.date.getTime() - b.date.getTime();
  });

  // Filter into categories
  const overdueReminders = reminders.filter(r => r.isOverdue);
  const todayReminders = reminders.filter(r => isToday(r.date));
  const upcomingReminders = reminders.filter(r => isFuture(r.date) && r.daysUntil <= 30 && !isToday(r.date));

  const getIcon = (type: ComputedReminder['type']) => {
    switch (type) {
      case 'vaccination': return <Syringe className='h-4 w-4' />;
      case 'deworming': return <Syringe className='h-4 w-4' />;
      case 'vet_visit': return <Stethoscope className='h-4 w-4' />;
      case 'heat_expected': return <Heart className='h-4 w-4' />;
      case 'due_date': return <Baby className='h-4 w-4' />;
      case 'pickup': return <Calendar className='h-4 w-4' />;
      case 'ultrasound': return <ScanLine className='h-4 w-4' />;
      default: return <Bell className='h-4 w-4' />;
    }
  };

  const getTypeColor = (type: ComputedReminder['type']) => {
    switch (type) {
      case 'vaccination': return 'bg-blue-500';
      case 'deworming': return 'bg-green-500';
      case 'vet_visit': return 'bg-purple-500';
      case 'heat_expected': return 'bg-pink-500';
      case 'due_date': return 'bg-rose-500';
      case 'pickup': return 'bg-teal-500';
      case 'ultrasound': return 'bg-cyan-500';
      default: return 'bg-gray-500';
    }
  };

  const ReminderCard = ({ reminder }: { reminder: ComputedReminder }) => (
    <div className={`p-4 border rounded-lg ${reminder.isOverdue ? 'border-destructive bg-destructive/10' : ''}`}>
      <div className='flex items-start justify-between'>
        <div className='flex items-start gap-3'>
          <div className={`p-2 rounded-full text-white ${getTypeColor(reminder.type)}`}>
            {getIcon(reminder.type)}
          </div>
          <div>
            <p className='font-medium'>{reminder.title}</p>
            <p className='text-sm text-muted-foreground'>
              {format(reminder.date, 'PPP')}
              {reminder.isOverdue && (
                <span className='text-destructive ml-2'>
                  ({Math.abs(reminder.daysUntil)} days overdue)
                </span>
              )}
              {isToday(reminder.date) && (
                <span className='text-rose-500 ml-2 font-medium'>Today!</span>
              )}
              {!reminder.isOverdue && !isToday(reminder.date) && (
                <span className='text-muted-foreground ml-2'>
                  (in {reminder.daysUntil} days)
                </span>
              )}
            </p>
          </div>
        </div>
        <div className='flex gap-2'>
          {reminder.dogId && (
            <Link to={`/dogs/${reminder.dogId}`}>
              <Button size='sm' variant='outline'>View Dog</Button>
            </Link>
          )}
          {reminder.litterId && (
            <Link to={`/litters/${reminder.litterId}`}>
              <Button size='sm' variant='outline'>View Litter</Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className='space-y-8'>
      <div className='flex justify-between items-center'>
        <h1 className='text-4xl font-bold flex items-center gap-3'>
          <Bell className='h-10 w-10' /> Reminders
        </h1>
      </div>

      {/* Summary Cards */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <Card className={overdueReminders.length > 0 ? 'border-destructive' : ''}>
          <CardContent className='pt-6'>
            <div className='text-center'>
              <p className='text-4xl font-bold text-destructive'>{overdueReminders.length}</p>
              <p className='text-muted-foreground'>Overdue</p>
            </div>
          </CardContent>
        </Card>
        <Card className={todayReminders.length > 0 ? 'border-rose-500' : ''}>
          <CardContent className='pt-6'>
            <div className='text-center'>
              <p className='text-4xl font-bold text-rose-500'>{todayReminders.length}</p>
              <p className='text-muted-foreground'>Due Today</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='pt-6'>
            <div className='text-center'>
              <p className='text-4xl font-bold'>{upcomingReminders.length}</p>
              <p className='text-muted-foreground'>Next 30 Days</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue */}
      {overdueReminders.length > 0 && (
        <Card className='border-destructive'>
          <CardHeader>
            <CardTitle className='text-destructive flex items-center gap-2'>
              <Bell className='h-5 w-5' /> Overdue ({overdueReminders.length})
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            {overdueReminders.map(r => <ReminderCard key={r.id} reminder={r} />)}
          </CardContent>
        </Card>
      )}

      {/* Today */}
      {todayReminders.length > 0 && (
        <Card className='border-rose-500'>
          <CardHeader>
            <CardTitle className='text-rose-500 flex items-center gap-2'>
              <Calendar className='h-5 w-5' /> Due Today ({todayReminders.length})
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            {todayReminders.map(r => <ReminderCard key={r.id} reminder={r} />)}
          </CardContent>
        </Card>
      )}

      {/* Upcoming */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Calendar className='h-5 w-5' /> Upcoming (Next 30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingReminders.length === 0 ? (
            <p className='text-muted-foreground text-center py-8'>No upcoming reminders</p>
          ) : (
            <div className='space-y-3'>
              {upcomingReminders.map(r => <ReminderCard key={r.id} reminder={r} />)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className='py-4'>
          <div className='flex flex-wrap gap-4'>
            <div className='flex items-center gap-2'>
              <div className='w-4 h-4 rounded bg-blue-500' />
              <span className='text-sm'>Vaccination</span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='w-4 h-4 rounded bg-green-500' />
              <span className='text-sm'>Deworming</span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='w-4 h-4 rounded bg-purple-500' />
              <span className='text-sm'>Vet Visit</span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='w-4 h-4 rounded bg-pink-500' />
              <span className='text-sm'>Expected Heat</span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='w-4 h-4 rounded bg-rose-500' />
              <span className='text-sm'>Due Date</span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='w-4 h-4 rounded bg-teal-500' />
              <span className='text-sm'>Pickup Ready</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
