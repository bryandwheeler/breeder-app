// iCal export for Google Calendar / Apple Calendar integration
import { Dog, Litter } from '@/types/dog';
import { format, addDays } from 'date-fns';

interface CalendarEvent {
  title: string;
  description: string;
  startDate: Date;
  endDate?: Date;
  allDay?: boolean;
}

function formatICalDate(date: Date, allDay: boolean = false): string {
  if (allDay) {
    return format(date, 'yyyyMMdd');
  }
  return format(date, "yyyyMMdd'T'HHmmss");
}

function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function generateUID(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@breederapp`;
}

function createICalEvent(event: CalendarEvent): string {
  const uid = generateUID();
  const now = formatICalDate(new Date());
  const start = formatICalDate(event.startDate, event.allDay);
  const end = event.endDate
    ? formatICalDate(event.endDate, event.allDay)
    : formatICalDate(addDays(event.startDate, 1), event.allDay);

  let icalEvent = `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${now}
`;

  if (event.allDay) {
    icalEvent += `DTSTART;VALUE=DATE:${start}
DTEND;VALUE=DATE:${end}
`;
  } else {
    icalEvent += `DTSTART:${start}
DTEND:${end}
`;
  }

  icalEvent += `SUMMARY:${escapeICalText(event.title)}
DESCRIPTION:${escapeICalText(event.description)}
END:VEVENT
`;

  return icalEvent;
}

export function generateICalFile(dogs: Dog[], litters: Litter[]): string {
  const events: CalendarEvent[] = [];

  // Heat cycle events
  dogs.filter(d => d.sex === 'female').forEach(dog => {
    const cycles = dog.heatCycles || [];

    // Actual heat cycles
    cycles.forEach(hc => {
      events.push({
        title: `🔴 ${dog.name} - Heat Cycle`,
        description: `Heat cycle started for ${dog.name}${hc.bred ? ' (Bred)' : ''}`,
        startDate: new Date(hc.startDate),
        endDate: hc.endDate ? new Date(hc.endDate) : addDays(new Date(hc.startDate), 21),
        allDay: true,
      });

      // Breeding dates
      hc.breedingDates?.forEach(bd => {
        events.push({
          title: `💕 ${dog.name} - Breeding`,
          description: `Breeding date for ${dog.name}`,
          startDate: new Date(bd),
          allDay: true,
        });
      });
    });

    // Expected next heat
    if (cycles.length > 0) {
      const lastCycle = cycles.sort(
        (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      )[0];
      const expectedNext = addDays(new Date(lastCycle.startDate), 180);

      events.push({
        title: `⏰ ${dog.name} - Expected Heat`,
        description: `Expected heat cycle for ${dog.name} (6 months from last cycle)`,
        startDate: expectedNext,
        allDay: true,
      });
    }
  });

  // Vaccination due dates
  dogs.forEach(dog => {
    dog.shotRecords?.forEach(shot => {
      if (shot.dueDate) {
        events.push({
          title: `💉 ${dog.name} - ${shot.vaccine} Due`,
          description: `Vaccination due: ${shot.vaccine} for ${dog.name}`,
          startDate: new Date(shot.dueDate),
          allDay: true,
        });
      }
    });
  });

  // Deworming due dates
  dogs.forEach(dog => {
    dog.dewormings?.forEach(dw => {
      if (dw.nextDueDate) {
        events.push({
          title: `💊 ${dog.name} - Deworming Due`,
          description: `${dw.product} due for ${dog.name}`,
          startDate: new Date(dw.nextDueDate),
          allDay: true,
        });
      }
    });
  });

  // Vet follow-ups
  dogs.forEach(dog => {
    dog.vetVisits?.forEach(visit => {
      if (visit.followUpDate) {
        events.push({
          title: `🏥 ${dog.name} - Vet Follow-up`,
          description: `Follow-up for: ${visit.reason}`,
          startDate: new Date(visit.followUpDate),
          allDay: true,
        });
      }
    });
  });

  // Litter events
  litters.forEach(litter => {
    const dam = dogs.find(d => d.id === litter.damId);
    const litterName = litter.litterName || `${dam?.name || 'Unknown'}'s litter`;

    // Due date
    if (litter.expectedDateOfBirth && litter.status === 'pregnant') {
      events.push({
        title: `🐕 ${litterName} - Due Date`,
        description: `Expected whelping date for ${litterName}`,
        startDate: new Date(litter.expectedDateOfBirth),
        allDay: true,
      });
    }

    // Birth date
    if (litter.dateOfBirth) {
      events.push({
        title: `🎂 ${litterName} - Born`,
        description: `Litter born: ${litterName}`,
        startDate: new Date(litter.dateOfBirth),
        allDay: true,
      });
    }

    // Pickup ready date
    if (litter.pickupReadyDate) {
      events.push({
        title: `🏠 ${litterName} - Pickup Ready`,
        description: `Puppies ready for pickup: ${litterName}`,
        startDate: new Date(litter.pickupReadyDate),
        allDay: true,
      });
    }
  });

  // Build iCal file
  let ical = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Breeder App//Calendar Export//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Breeder App Calendar
`;

  events.forEach(event => {
    ical += createICalEvent(event);
  });

  ical += 'END:VCALENDAR';

  return ical;
}

export function downloadICalFile(dogs: Dog[], litters: Litter[]): void {
  const icalContent = generateICalFile(dogs, litters);
  const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `breeder-calendar-${format(new Date(), 'yyyy-MM-dd')}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
